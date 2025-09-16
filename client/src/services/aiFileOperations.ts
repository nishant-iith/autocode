/**
 * AI File Operations Service
 * Handles file operations requested by AI through structured commands
 * Integrates with existing file API and editor state management
 */

import axios from 'axios';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { AIAction, AIArtifact } from './aiActionParser';

export interface FileOperationResult {
  success: boolean;
  error?: string;
  filePath?: string;
  action?: string;
}

export interface OperationProgress {
  action: string;
  filePath?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

/**
 * Service class for executing AI-driven file operations
 */
export class AIFileOperations {
  private static baseURL = 'http://localhost:5000/api';

  /**
   * Executes a single AI action
   * @param action - The AI action to execute
   * @param workspaceId - Current workspace ID
   * @param onProgress - Progress callback function
   * @returns Operation result
   */
  static async executeAction(
    action: AIAction,
    workspaceId: string,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<FileOperationResult> {
    const progress: OperationProgress = {
      action: action.type,
      filePath: action.filePath,
      status: 'running'
    };

    onProgress?.(progress);

    try {
      switch (action.type) {
        case 'file':
        case 'create':
          return await this.createFile(action, workspaceId);

        case 'edit':
          return await this.editFile(action, workspaceId);

        case 'delete':
          return await this.deleteFile(action, workspaceId);

        case 'shell':
        case 'start':
          return await this.executeCommand(action, workspaceId);

        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      onProgress?.({
        ...progress,
        status: 'failed',
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        filePath: action.filePath,
        action: action.type
      };
    }
  }

  /**
   * Executes multiple actions sequentially from an artifact
   * @param artifact - AI artifact containing actions
   * @param workspaceId - Current workspace ID
   * @param onProgress - Progress callback function
   * @returns Array of operation results
   */
  static async executeArtifact(
    artifact: AIArtifact,
    workspaceId: string,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<FileOperationResult[]> {
    const results: FileOperationResult[] = [];

    for (const action of artifact.actions) {
      const result = await this.executeAction(action, workspaceId, onProgress);
      results.push(result);

      // Stop execution if an action fails
      if (!result.success) {
        break;
      }

      // Small delay between actions to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Creates a new file with AI-generated content
   * @param action - File creation action
   * @param workspaceId - Current workspace ID
   * @returns Operation result
   */
  private static async createFile(action: AIAction, workspaceId: string): Promise<FileOperationResult> {
    if (!action.filePath || !action.content) {
      throw new Error('File path and content are required for file creation');
    }

    try {
      // First create the file structure
      const pathParts = action.filePath.split('/');
      const fileName = pathParts.pop() || action.filePath;
      const dirPath = pathParts.join('/') || '';

      const response = await axios.post(`${this.baseURL}/files/create/${workspaceId}`, {
        path: dirPath,
        name: fileName,
        type: 'file'
      });

      // Then add content to the file if it exists
      if (action.content) {
        await axios.put(`${this.baseURL}/files/content/${workspaceId}/${action.filePath}`, {
          content: action.content
        });
      }

      // Update editor store with new file
      const editorStore = useEditorStore.getState();

      // Add file to store and open it using AI-specific method
      editorStore.openFileFromAI({
        path: action.filePath,
        name: action.filePath.split('/').pop() || action.filePath,
        content: action.content,
        language: this.detectLanguage(action.filePath)
      });

      return {
        success: true,
        filePath: action.filePath,
        action: 'create'
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to create file';

      throw new Error(errorMessage);
    }
  }

  /**
   * Edits an existing file with AI-generated content
   * First checks if file exists, if not creates it
   * @param action - File edit action
   * @param workspaceId - Current workspace ID
   * @returns Operation result
   */
  private static async editFile(action: AIAction, workspaceId: string): Promise<FileOperationResult> {
    if (!action.filePath || !action.content) {
      throw new Error('File path and content are required for file editing');
    }

    try {
      // First check if the file exists
      const fileExists = await this.checkFileExists(action.filePath, workspaceId);

      if (!fileExists) {
        // File doesn't exist, create it instead
        console.log(`File ${action.filePath} doesn't exist, creating it instead of editing`);
        return await this.createFile(action, workspaceId);
      }

      // File exists, update its content
      const response = await axios.put(`${this.baseURL}/files/content/${workspaceId}/${action.filePath}`, {
        content: action.content
      });

      // Update editor store with modified content
      const editorStore = useEditorStore.getState();

      // Update file content in store using AI-specific method
      editorStore.updateFileFromAI(action.filePath, action.content);

      return {
        success: true,
        filePath: action.filePath,
        action: 'edit'
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to edit file';

      throw new Error(errorMessage);
    }
  }

  /**
   * Deletes a file
   * @param action - File deletion action
   * @param workspaceId - Current workspace ID
   * @returns Operation result
   */
  private static async deleteFile(action: AIAction, workspaceId: string): Promise<FileOperationResult> {
    if (!action.filePath) {
      throw new Error('File path is required for file deletion');
    }

    try {
      const response = await axios.delete(`${this.baseURL}/files/${workspaceId}/${action.filePath}`);

      // Update editor store by removing file
      const editorStore = useEditorStore.getState();
      editorStore.closeFile(action.filePath);

      return {
        success: true,
        filePath: action.filePath,
        action: 'delete'
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to delete file';

      throw new Error(errorMessage);
    }
  }

  /**
   * Executes a shell command (placeholder for future implementation)
   * @param action - Shell command action
   * @param workspaceId - Current workspace ID
   * @returns Operation result
   */
  private static async executeCommand(action: AIAction, workspaceId: string): Promise<FileOperationResult> {
    if (!action.command) {
      throw new Error('Command is required for shell execution');
    }

    // For now, we'll return success but not actually execute
    // This would require a secure command execution system
    console.log(`Would execute command: ${action.command} in workspace ${workspaceId}`);

    return {
      success: true,
      action: 'shell'
    };
  }

  /**
   * Detects programming language from file extension
   * @param filePath - File path to analyze
   * @returns Language identifier for Monaco Editor
   */
  private static detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sh': 'shell',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql'
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  /**
   * Validates if an action can be safely executed
   * @param action - Action to validate
   * @returns Validation result with error message if invalid
   */
  static validateAction(action: AIAction): { valid: boolean; error?: string } {
    // Validate file path for file operations
    if (['file', 'create', 'edit', 'delete'].includes(action.type)) {
      if (!action.filePath) {
        return { valid: false, error: 'File path is required' };
      }

      // Check for path traversal
      if (action.filePath.includes('..') || action.filePath.includes('~')) {
        return { valid: false, error: 'Invalid file path: path traversal detected' };
      }

      // Check for absolute paths
      if (action.filePath.startsWith('/')) {
        return { valid: false, error: 'Absolute paths are not allowed' };
      }
    }

    // Validate content for file creation/editing
    if (['file', 'create', 'edit'].includes(action.type)) {
      if (!action.content && action.content !== '') {
        return { valid: false, error: 'File content is required' };
      }
    }

    // Validate command for shell operations
    if (['shell', 'start'].includes(action.type)) {
      if (!action.command) {
        return { valid: false, error: 'Command is required for shell operations' };
      }

      // Basic command validation (could be expanded)
      const dangerousCommands = ['rm -rf', 'del', 'format', 'shutdown'];
      const isDangerous = dangerousCommands.some(cmd =>
        action.command!.toLowerCase().includes(cmd)
      );

      if (isDangerous) {
        return { valid: false, error: 'Dangerous command detected and blocked' };
      }
    }

    return { valid: true };
  }

  /**
   * Gets current workspace files for context
   * @param workspaceId - Current workspace ID
   * @returns Array of file information
   */
  static async getWorkspaceFiles(workspaceId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/files/list`, {
        params: { workspaceId }
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Failed to get workspace files:', error);
      return [];
    }
  }

  /**
   * Checks if a file exists in the workspace
   * @param filePath - File path to check
   * @param workspaceId - Current workspace ID
   * @returns Whether the file exists
   */
  private static async checkFileExists(filePath: string, workspaceId: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/files/content/${workspaceId}/${filePath}`);
      return response.status === 200;
    } catch (error) {
      // If we get a 404, the file doesn't exist
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      // For other errors, assume file doesn't exist
      console.warn(`Error checking file existence for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Gets the current content of a file for edit operations
   * @param filePath - File path to read
   * @param workspaceId - Current workspace ID
   * @returns File content or null if file doesn't exist
   */
  static async getFileContent(filePath: string, workspaceId: string): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseURL}/files/content/${workspaceId}/${filePath}`);
      return response.data.content || '';
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // File doesn't exist
      }
      console.error(`Failed to get file content for ${filePath}:`, error);
      return null;
    }
  }
}