/**
 * File Operation Strategy Pattern Implementation
 * Provides extensible file operation handling using strategy pattern
 */

import { AIAction } from '../../services/aiActionParser';
import { IFileService, FileOperationResult } from '../interfaces/IFileService';
import { IEditorService } from '../interfaces/IEditorService';
import { IValidationService } from '../interfaces/IValidationService';
import { IEventBus } from '../interfaces/IEventBus';
import { ErrorHandlingService } from '../services/ErrorHandlingService';
import { EventFactory } from '../services/EventBusService';

export interface OperationContext {
  workspaceId: string;
  userId?: string;
  fileService: IFileService;
  editorService: IEditorService;
  validationService: IValidationService;
  eventBus: IEventBus;
  errorHandler: ErrorHandlingService;
}

export interface OperationProgress {
  action: string;
  filePath?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  progress?: number; // 0-100
}

export interface OperationResult extends FileOperationResult {
  progress?: OperationProgress[];
  metadata?: Record<string, any>;
}

/**
 * Abstract base class for file operation strategies
 */
export abstract class FileOperationStrategy {
  abstract readonly actionType: string;
  abstract readonly priority: number; // Lower number = higher priority

  /**
   * Validates if this strategy can handle the given action
   */
  abstract canHandle(action: AIAction): boolean;

  /**
   * Validates the action before execution
   */
  abstract validate(action: AIAction, context: OperationContext): Promise<void>;

  /**
   * Executes the file operation
   */
  abstract execute(
    action: AIAction,
    context: OperationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<OperationResult>;

  /**
   * Estimates operation complexity for progress tracking
   */
  estimateComplexity(action: AIAction): number {
    // Default implementation - can be overridden
    return 1;
  }

  /**
   * Gets human-readable description of the operation
   */
  getDescription(action: AIAction): string {
    return `${this.actionType} operation on ${action.filePath || 'unknown file'}`;
  }

  /**
   * Common validation logic shared by all strategies
   */
  protected async validateCommon(action: AIAction, context: OperationContext): Promise<void> {
    // Validate action structure
    const actionValidation = context.validationService.validateAIAction(action);
    if (!actionValidation.isValid) {
      throw new Error(`Action validation failed: ${actionValidation.errors.join(', ')}`);
    }

    // Validate workspace access
    const workspaceValidation = await context.validationService.validateWorkspaceAccess(
      context.workspaceId,
      context.userId
    );
    if (!workspaceValidation.isValid) {
      throw new Error(`Workspace access denied: ${workspaceValidation.errors.join(', ')}`);
    }
  }

  /**
   * Emits progress update
   */
  protected emitProgress(
    action: AIAction,
    status: OperationProgress['status'],
    progress?: number,
    error?: string,
    onProgress?: (progress: OperationProgress) => void
  ): void {
    if (onProgress) {
      onProgress({
        action: this.actionType,
        filePath: action.filePath,
        status,
        progress,
        error
      });
    }
  }

  /**
   * Detects programming language from file path
   */
  protected detectLanguage(filePath: string): string {
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
}

/**
 * Create File Operation Strategy
 */
export class CreateFileStrategy extends FileOperationStrategy {
  readonly actionType = 'create';
  readonly priority = 1;

  canHandle(action: AIAction): boolean {
    return action.type === 'file' || action.type === 'create';
  }

  async validate(action: AIAction, context: OperationContext): Promise<void> {
    await this.validateCommon(action, context);

    if (!action.filePath) {
      throw new Error('File path is required for file creation');
    }

    if (action.content === undefined || action.content === null) {
      throw new Error('Content is required for file creation');
    }

    // Validate file path security
    const pathValidation = context.validationService.validateFilePath(action.filePath);
    if (!pathValidation.isValid) {
      throw new Error(`Invalid file path: ${pathValidation.errors.join(', ')}`);
    }

    // Validate content security
    const fileType = this.detectLanguage(action.filePath);
    const contentValidation = context.validationService.validateFileContent(action.content, {
      fileType
    });
    if (!contentValidation.isValid) {
      throw new Error(`Invalid content: ${contentValidation.errors.join(', ')}`);
    }

    // Check if file already exists
    const exists = await context.fileService.fileExists(context.workspaceId, action.filePath);
    if (exists) {
      throw new Error(`File already exists: ${action.filePath}`);
    }
  }

  async execute(
    action: AIAction,
    context: OperationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<OperationResult> {
    this.emitProgress(action, 'running', 0, undefined, onProgress);

    try {
      // Sanitize content
      const fileType = this.detectLanguage(action.filePath!);
      const sanitizedContent = context.validationService.sanitizeContent(action.content!, fileType);

      this.emitProgress(action, 'running', 25, undefined, onProgress);

      // Create file via API
      const result = await context.fileService.createFile({
        workspaceId: context.workspaceId,
        filePath: action.filePath!,
        content: sanitizedContent
      });

      this.emitProgress(action, 'running', 50, undefined, onProgress);

      if (!result.success) {
        throw new Error(result.error || 'File creation failed');
      }

      // Update editor state
      context.editorService.openFileFromAI({
        path: action.filePath!,
        name: action.filePath!.split('/').pop() || action.filePath!,
        content: sanitizedContent,
        language: fileType
      });

      this.emitProgress(action, 'running', 75, undefined, onProgress);

      // Emit event
      const event = EventFactory.createFileCreatedEvent(
        action.filePath!,
        sanitizedContent,
        context.workspaceId,
        'ai'
      );
      context.eventBus.emit(event);

      this.emitProgress(action, 'completed', 100, undefined, onProgress);

      return {
        ...result,
        metadata: {
          fileType,
          sanitized: sanitizedContent !== action.content
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitProgress(action, 'failed', undefined, errorMessage, onProgress);

      const handledError = context.errorHandler.handleFileOperationError(error, {
        operation: 'create',
        filePath: action.filePath,
        workspaceId: context.workspaceId
      });

      throw handledError;
    }
  }

  estimateComplexity(action: AIAction): number {
    // Base complexity + content size factor
    const baseComplexity = 1;
    const contentSize = action.content?.length || 0;
    const sizeComplexity = Math.min(contentSize / 10000, 3); // Max 3 additional units
    return baseComplexity + sizeComplexity;
  }
}

/**
 * Edit File Operation Strategy
 */
export class EditFileStrategy extends FileOperationStrategy {
  readonly actionType = 'edit';
  readonly priority = 2;

  canHandle(action: AIAction): boolean {
    return action.type === 'edit';
  }

  async validate(action: AIAction, context: OperationContext): Promise<void> {
    await this.validateCommon(action, context);

    if (!action.filePath) {
      throw new Error('File path is required for file editing');
    }

    if (action.content === undefined || action.content === null) {
      throw new Error('Content is required for file editing');
    }

    // Validate file path security
    const pathValidation = context.validationService.validateFilePath(action.filePath);
    if (!pathValidation.isValid) {
      throw new Error(`Invalid file path: ${pathValidation.errors.join(', ')}`);
    }

    // Validate content security
    const fileType = this.detectLanguage(action.filePath);
    const contentValidation = context.validationService.validateFileContent(action.content, {
      fileType
    });
    if (!contentValidation.isValid) {
      throw new Error(`Invalid content: ${contentValidation.errors.join(', ')}`);
    }

    // Check if file exists
    const exists = await context.fileService.fileExists(context.workspaceId, action.filePath);
    if (!exists) {
      throw new Error(`File does not exist: ${action.filePath}`);
    }
  }

  async execute(
    action: AIAction,
    context: OperationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<OperationResult> {
    this.emitProgress(action, 'running', 0, undefined, onProgress);

    try {
      // Get current content for backup
      const currentContent = await context.fileService.getFileContent(
        context.workspaceId,
        action.filePath!
      );

      this.emitProgress(action, 'running', 20, undefined, onProgress);

      // Sanitize new content
      const fileType = this.detectLanguage(action.filePath!);
      const sanitizedContent = context.validationService.sanitizeContent(action.content!, fileType);

      this.emitProgress(action, 'running', 40, undefined, onProgress);

      // Update file via API
      const result = await context.fileService.updateFile({
        workspaceId: context.workspaceId,
        filePath: action.filePath!,
        content: sanitizedContent
      });

      this.emitProgress(action, 'running', 60, undefined, onProgress);

      if (!result.success) {
        throw new Error(result.error || 'File update failed');
      }

      // Update editor state
      context.editorService.updateFileFromAI(action.filePath!, sanitizedContent);

      this.emitProgress(action, 'running', 80, undefined, onProgress);

      // Emit event
      const event = EventFactory.createFileUpdatedEvent(
        action.filePath!,
        sanitizedContent,
        context.workspaceId,
        'ai',
        currentContent
      );
      context.eventBus.emit(event);

      this.emitProgress(action, 'completed', 100, undefined, onProgress);

      return {
        ...result,
        metadata: {
          fileType,
          sanitized: sanitizedContent !== action.content,
          previousContent: currentContent
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitProgress(action, 'failed', undefined, errorMessage, onProgress);

      const handledError = context.errorHandler.handleFileOperationError(error, {
        operation: 'edit',
        filePath: action.filePath,
        workspaceId: context.workspaceId
      });

      throw handledError;
    }
  }

  estimateComplexity(action: AIAction): number {
    // Edit operations are slightly more complex due to backup needs
    const baseComplexity = 1.5;
    const contentSize = action.content?.length || 0;
    const sizeComplexity = Math.min(contentSize / 8000, 4);
    return baseComplexity + sizeComplexity;
  }
}

/**
 * Delete File Operation Strategy
 */
export class DeleteFileStrategy extends FileOperationStrategy {
  readonly actionType = 'delete';
  readonly priority = 3;

  canHandle(action: AIAction): boolean {
    return action.type === 'delete';
  }

  async validate(action: AIAction, context: OperationContext): Promise<void> {
    await this.validateCommon(action, context);

    if (!action.filePath) {
      throw new Error('File path is required for file deletion');
    }

    // Validate file path security
    const pathValidation = context.validationService.validateFilePath(action.filePath);
    if (!pathValidation.isValid) {
      throw new Error(`Invalid file path: ${pathValidation.errors.join(', ')}`);
    }

    // Check if file exists
    const exists = await context.fileService.fileExists(context.workspaceId, action.filePath);
    if (!exists) {
      throw new Error(`File does not exist: ${action.filePath}`);
    }
  }

  async execute(
    action: AIAction,
    context: OperationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<OperationResult> {
    this.emitProgress(action, 'running', 0, undefined, onProgress);

    try {
      // Delete file via API
      const result = await context.fileService.deleteFile({
        workspaceId: context.workspaceId,
        filePath: action.filePath!
      });

      this.emitProgress(action, 'running', 50, undefined, onProgress);

      if (!result.success) {
        throw new Error(result.error || 'File deletion failed');
      }

      // Update editor state
      context.editorService.closeFile(action.filePath!);

      this.emitProgress(action, 'running', 75, undefined, onProgress);

      // Emit event
      const event = EventFactory.createFileDeletedEvent(
        action.filePath!,
        context.workspaceId,
        'ai'
      );
      context.eventBus.emit(event);

      this.emitProgress(action, 'completed', 100, undefined, onProgress);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitProgress(action, 'failed', undefined, errorMessage, onProgress);

      const handledError = context.errorHandler.handleFileOperationError(error, {
        operation: 'delete',
        filePath: action.filePath,
        workspaceId: context.workspaceId
      });

      throw handledError;
    }
  }

  estimateComplexity(): number {
    // Delete operations are simpler
    return 0.5;
  }
}

/**
 * No-op Strategy for unsupported operations
 */
export class UnsupportedOperationStrategy extends FileOperationStrategy {
  readonly actionType = 'unsupported';
  readonly priority = 1000; // Lowest priority

  canHandle(): boolean {
    return true; // Catches all unsupported operations
  }

  async validate(action: AIAction): Promise<void> {
    throw new Error(`Unsupported operation type: ${action.type}`);
  }

  async execute(): Promise<OperationResult> {
    throw new Error('Operation not supported');
  }
}