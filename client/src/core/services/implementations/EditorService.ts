/**
 * Editor Service Implementation
 * Manages editor state through store integration with proper abstraction
 */

import {
  IEditorService,
  FileTab,
  OpenFileRequest,
  UpdateFileRequest
} from '../../interfaces/IEditorService';
import { useEditorStore } from '../../../store/editorStore';
import { ILogger } from '../ErrorHandlingService';

export class EditorService implements IEditorService {
  constructor(private logger: ILogger) {}

  openFile(request: OpenFileRequest): void {
    try {
      this.logger.info(`Opening file: ${request.path}`, {
        name: request.name,
        language: request.language,
        contentLength: request.content.length
      });

      const store = useEditorStore.getState();
      store.openFile({
        path: request.path,
        name: request.name,
        content: request.content,
        language: request.language
      });

      this.logger.info(`File opened successfully: ${request.path}`);
    } catch (error) {
      this.logger.error(`Failed to open file: ${request.path}`, { error });
      throw error;
    }
  }

  openFileFromAI(request: OpenFileRequest): void {
    try {
      this.logger.info(`Opening AI-created file: ${request.path}`, {
        name: request.name,
        language: request.language,
        contentLength: request.content.length
      });

      const store = useEditorStore.getState();
      store.openFileFromAI({
        path: request.path,
        name: request.name,
        content: request.content,
        language: request.language
      });

      this.logger.info(`AI file opened successfully: ${request.path}`);
    } catch (error) {
      this.logger.error(`Failed to open AI file: ${request.path}`, { error });
      throw error;
    }
  }

  updateFileContent(request: UpdateFileRequest): void {
    try {
      this.logger.info(`Updating file content: ${request.path}`, {
        contentLength: request.content.length,
        isAIModified: request.isAIModified
      });

      const store = useEditorStore.getState();
      store.updateFileContent(request.path, request.content, request.isAIModified);

      this.logger.info(`File content updated successfully: ${request.path}`);
    } catch (error) {
      this.logger.error(`Failed to update file content: ${request.path}`, { error });
      throw error;
    }
  }

  updateFileFromAI(path: string, content: string): void {
    try {
      this.logger.info(`Updating file from AI: ${path}`, {
        contentLength: content.length
      });

      const store = useEditorStore.getState();
      store.updateFileFromAI(path, content);

      this.logger.info(`AI file update successful: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to update file from AI: ${path}`, { error });
      throw error;
    }
  }

  closeFile(path: string): void {
    try {
      this.logger.info(`Closing file: ${path}`);

      const store = useEditorStore.getState();
      store.closeFile(path);

      this.logger.info(`File closed successfully: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to close file: ${path}`, { error });
      throw error;
    }
  }

  setActiveFile(path: string): void {
    try {
      this.logger.debug(`Setting active file: ${path}`);

      const store = useEditorStore.getState();
      store.setActiveFile(path);

      this.logger.debug(`Active file set successfully: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to set active file: ${path}`, { error });
      throw error;
    }
  }

  getFileByPath(path: string): FileTab | undefined {
    try {
      const store = useEditorStore.getState();
      const file = store.getFileByPath(path);

      this.logger.debug(`Retrieved file by path: ${path}`, {
        found: !!file,
        isAIModified: file?.isAIModified
      });

      return file;
    } catch (error) {
      this.logger.error(`Failed to get file by path: ${path}`, { error });
      throw error;
    }
  }

  getOpenFiles(): readonly FileTab[] {
    try {
      const store = useEditorStore.getState();
      const files = store.openTabs;

      this.logger.debug(`Retrieved open files`, {
        count: files.length,
        aiModifiedCount: files.filter(f => f.isAIModified).length
      });

      return files;
    } catch (error) {
      this.logger.error('Failed to get open files', { error });
      throw error;
    }
  }

  getActiveFile(): FileTab | null {
    try {
      const store = useEditorStore.getState();
      const activeFile = store.activeFile;

      this.logger.debug('Retrieved active file', {
        path: activeFile?.path,
        isAIModified: activeFile?.isAIModified
      });

      return activeFile;
    } catch (error) {
      this.logger.error('Failed to get active file', { error });
      throw error;
    }
  }

  markFileAsAIModified(path: string): void {
    try {
      this.logger.info(`Marking file as AI modified: ${path}`);

      const store = useEditorStore.getState();
      store.markFileAsAIModified(path);

      this.logger.info(`File marked as AI modified: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to mark file as AI modified: ${path}`, { error });
      throw error;
    }
  }

  clearAIModificationFlags(): void {
    try {
      this.logger.info('Clearing all AI modification flags');

      const store = useEditorStore.getState();
      store.clearAIModificationFlags();

      this.logger.info('AI modification flags cleared');
    } catch (error) {
      this.logger.error('Failed to clear AI modification flags', { error });
      throw error;
    }
  }

  /**
   * Gets editor statistics for monitoring
   */
  getEditorStatistics(): Record<string, any> {
    try {
      const store = useEditorStore.getState();
      const openFiles = store.openTabs;

      const stats = {
        totalOpenFiles: openFiles.length,
        aiModifiedFiles: openFiles.filter(f => f.isAIModified).length,
        dirtyFiles: openFiles.filter(f => f.isDirty).length,
        activeFile: store.activeFile?.path || null,
        filesByLanguage: this.groupFilesByLanguage(openFiles),
        averageFileSize: this.calculateAverageFileSize(openFiles)
      };

      this.logger.debug('Generated editor statistics', stats);

      return stats;
    } catch (error) {
      this.logger.error('Failed to generate editor statistics', { error });
      return {};
    }
  }

  /**
   * Saves all dirty files
   */
  async saveAllFiles(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      this.logger.info('Saving all dirty files');

      const store = useEditorStore.getState();
      const dirtyFiles = store.openTabs.filter(f => f.isDirty);

      for (const file of dirtyFiles) {
        try {
          store.saveFile(file.path);
          this.logger.debug(`Saved file: ${file.path}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${file.path}: ${errorMessage}`);
          this.logger.error(`Failed to save file: ${file.path}`, { error });
        }
      }

      const success = errors.length === 0;
      this.logger.info(`Save all files completed`, {
        success,
        savedFiles: dirtyFiles.length - errors.length,
        errors: errors.length
      });

      return { success, errors };
    } catch (error) {
      this.logger.error('Failed to save all files', { error });
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validates editor state consistency
   */
  validateEditorState(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    try {
      const store = useEditorStore.getState();
      const { openTabs, activeFile } = store;

      // Check if active file is in open tabs
      if (activeFile && !openTabs.find(tab => tab.path === activeFile.path)) {
        issues.push('Active file is not in open tabs');
      }

      // Check for duplicate tabs
      const paths = openTabs.map(tab => tab.path);
      const uniquePaths = new Set(paths);
      if (paths.length !== uniquePaths.size) {
        issues.push('Duplicate file tabs detected');
      }

      // Check for invalid file states
      for (const tab of openTabs) {
        if (!tab.path) {
          issues.push(`Tab without path: ${tab.id}`);
        }
        if (!tab.name) {
          issues.push(`Tab without name: ${tab.path}`);
        }
        if (tab.content === null || tab.content === undefined) {
          issues.push(`Tab with null/undefined content: ${tab.path}`);
        }
      }

      const valid = issues.length === 0;
      this.logger.debug('Editor state validation completed', { valid, issues });

      return { valid, issues };
    } catch (error) {
      this.logger.error('Editor state validation failed', { error });
      return {
        valid: false,
        issues: ['Validation process failed']
      };
    }
  }

  private groupFilesByLanguage(files: FileTab[]): Record<string, number> {
    return files.reduce((acc, file) => {
      const language = file.language || 'unknown';
      acc[language] = (acc[language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverageFileSize(files: FileTab[]): number {
    if (files.length === 0) return 0;

    const totalSize = files.reduce((sum, file) => sum + (file.content?.length || 0), 0);
    return Math.round(totalSize / files.length);
  }
}