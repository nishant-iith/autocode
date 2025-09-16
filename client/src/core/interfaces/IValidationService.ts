/**
 * Validation Service Interface
 * Defines contract for validation operations
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface SecurityValidationResult extends ValidationResult {
  securityLevel: 'safe' | 'warning' | 'danger';
  threats: string[];
}

export interface FilePathValidationOptions {
  allowAbsolutePaths?: boolean;
  maxLength?: number;
  allowedExtensions?: string[];
  blockedPatterns?: RegExp[];
}

export interface ContentValidationOptions {
  fileType?: string;
  maxSize?: number;
  allowExecutableContent?: boolean;
  sanitizeContent?: boolean;
}

export interface IValidationService {
  /**
   * Validates file path for security and format
   */
  validateFilePath(
    filePath: string,
    options?: FilePathValidationOptions
  ): SecurityValidationResult;

  /**
   * Validates file content for security and format
   */
  validateFileContent(
    content: string,
    options?: ContentValidationOptions
  ): SecurityValidationResult;

  /**
   * Sanitizes file content
   */
  sanitizeContent(content: string, fileType: string): string;

  /**
   * Validates workspace access
   */
  validateWorkspaceAccess(workspaceId: string, userId?: string): Promise<ValidationResult>;

  /**
   * Validates AI action
   */
  validateAIAction(action: any): ValidationResult;
}