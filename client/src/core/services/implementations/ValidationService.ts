/**
 * Validation Service Implementation
 * Provides comprehensive validation for all user inputs and system operations
 */

import {
  IValidationService,
  ValidationResult,
  SecurityValidationResult,
  FilePathValidationOptions,
  ContentValidationOptions,
  AIActionValidationResult,
  WorkspaceValidationResult
} from '../../interfaces/IValidationService';
import { AIAction } from '../../../services/aiActionParser';
import { ILogger } from '../ErrorHandlingService';

export class ValidationService implements IValidationService {
  private readonly maliciousPatterns = [
    // Command injection patterns
    /[;&|`$()]/g,
    // Path traversal patterns
    /\.\.[/\\]/g,
    // Script injection patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    // SQL injection patterns
    /('|(\\')|(;)|(\\;)|(\\x27)|(\\x2D\\x2D)|(union)|(select)|(insert)|(delete)|(update)|(create)|(drop)|(exec)|(execute)|(sp_)|(xp_))/gi,
    // XSS patterns
    /(javascript:|vbscript:|onload|onerror|onclick)/gi,
    // File system patterns
    /(\\\\|\/\/|file:\/\/)/gi
  ];

  private readonly dangerousFunctions = [
    'eval', 'Function', 'setTimeout', 'setInterval',
    'require', 'import', 'fetch', 'XMLHttpRequest',
    'WebSocket', 'Worker', 'SharedWorker', 'ServiceWorker'
  ];

  private readonly allowedFileExtensions = new Set([
    'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'sass',
    'md', 'txt', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs',
    'sh', 'yml', 'yaml', 'xml', 'sql', 'vue', 'svelte'
  ]);

  constructor(private logger: ILogger) {}

  validateFilePath(filePath: string, options: FilePathValidationOptions = {}): SecurityValidationResult {
    const errors: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    try {
      // Basic null/empty check
      if (!filePath || filePath.trim().length === 0) {
        errors.push('File path cannot be empty');
        severity = 'high';
        return { isValid: false, errors, severity };
      }

      // Normalize path for consistent validation
      const normalizedPath = filePath.replace(/\\/g, '/').trim();

      // Check for path traversal attacks
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        errors.push('Path traversal patterns are not allowed');
        severity = 'high';
      }

      // Check for absolute paths (security concern)
      if (normalizedPath.startsWith('/') || /^[a-zA-Z]:/.test(normalizedPath)) {
        if (!options.allowAbsolutePaths) {
          errors.push('Absolute paths are not allowed');
          severity = 'high';
        }
      }

      // Check for dangerous characters
      const dangerousChars = /[<>:"|?*\x00-\x1f]/;
      if (dangerousChars.test(normalizedPath)) {
        errors.push('File path contains invalid characters');
        severity = 'medium';
      }

      // Check path length
      if (normalizedPath.length > (options.maxPathLength || 260)) {
        errors.push(`File path exceeds maximum length of ${options.maxPathLength || 260} characters`);
        severity = 'medium';
      }

      // Validate file extension
      const extension = normalizedPath.split('.').pop()?.toLowerCase();
      if (extension && !this.allowedFileExtensions.has(extension)) {
        errors.push(`File extension '${extension}' is not allowed`);
        severity = 'medium';
      }

      // Check for reserved names (Windows)
      const fileName = normalizedPath.split('/').pop() || '';
      const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
      if (reservedNames.includes(fileName.toUpperCase().split('.')[0])) {
        errors.push('File name uses reserved system name');
        severity = 'high';
      }

      // Check for hidden files (optional)
      if (!options.allowHiddenFiles && fileName.startsWith('.')) {
        errors.push('Hidden files are not allowed');
        severity = 'low';
      }

      this.logger.debug('File path validation completed', {
        filePath: normalizedPath,
        isValid: errors.length === 0,
        errorCount: errors.length
      });

      return {
        isValid: errors.length === 0,
        errors,
        severity
      };
    } catch (error) {
      this.logger.error('File path validation failed', { error, filePath });
      return {
        isValid: false,
        errors: ['Internal validation error'],
        severity: 'high'
      };
    }
  }

  validateFileContent(content: string, options: ContentValidationOptions = {}): SecurityValidationResult {
    const errors: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    try {
      // Basic null check
      if (content === null || content === undefined) {
        errors.push('Content cannot be null or undefined');
        severity = 'high';
        return { isValid: false, errors, severity };
      }

      // Check content length
      const maxLength = options.maxContentLength || 1000000; // 1MB default
      if (content.length > maxLength) {
        errors.push(`Content exceeds maximum length of ${maxLength} characters`);
        severity = 'medium';
      }

      // Check for malicious patterns
      for (const pattern of this.maliciousPatterns) {
        if (pattern.test(content)) {
          errors.push(`Content contains potentially malicious pattern: ${pattern.source}`);
          severity = 'high';
        }
      }

      // Check for dangerous functions in JavaScript/TypeScript content
      if (options.fileType && ['javascript', 'typescript'].includes(options.fileType)) {
        for (const func of this.dangerousFunctions) {
          const regex = new RegExp(`\\b${func}\\s*\\(`, 'gi');
          if (regex.test(content)) {
            errors.push(`Content contains potentially dangerous function: ${func}`);
            severity = 'medium';
          }
        }
      }

      // Check for suspicious URLs
      const urlPattern = /(https?:\/\/[^\s]+)/gi;
      const urls = content.match(urlPattern);
      if (urls) {
        for (const url of urls) {
          if (this.isSuspiciousUrl(url)) {
            errors.push(`Content contains suspicious URL: ${url}`);
            severity = 'medium';
          }
        }
      }

      // File type specific validation
      if (options.fileType) {
        const typeValidation = this.validateContentByType(content, options.fileType);
        errors.push(...typeValidation.errors);
        if (typeValidation.severity === 'high') severity = 'high';
        else if (typeValidation.severity === 'medium' && severity === 'low') severity = 'medium';
      }

      this.logger.debug('Content validation completed', {
        contentLength: content.length,
        fileType: options.fileType,
        isValid: errors.length === 0,
        errorCount: errors.length
      });

      return {
        isValid: errors.length === 0,
        errors,
        severity
      };
    } catch (error) {
      this.logger.error('Content validation failed', { error });
      return {
        isValid: false,
        errors: ['Internal validation error'],
        severity: 'high'
      };
    }
  }

  sanitizeContent(content: string, fileType: string): string {
    try {
      let sanitized = content;

      // Remove null bytes
      sanitized = sanitized.replace(/\x00/g, '');

      // Normalize line endings
      sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // File type specific sanitization
      switch (fileType.toLowerCase()) {
        case 'html':
          sanitized = this.sanitizeHtmlContent(sanitized);
          break;
        case 'javascript':
        case 'typescript':
          sanitized = this.sanitizeJavaScriptContent(sanitized);
          break;
        case 'css':
        case 'scss':
        case 'sass':
          sanitized = this.sanitizeCssContent(sanitized);
          break;
      }

      this.logger.debug('Content sanitized', {
        fileType,
        originalLength: content.length,
        sanitizedLength: sanitized.length
      });

      return sanitized;
    } catch (error) {
      this.logger.error('Content sanitization failed', { error, fileType });
      return content; // Return original content if sanitization fails
    }
  }

  validateAIAction(action: AIAction): AIActionValidationResult {
    const errors: string[] = [];

    try {
      // Validate action structure
      if (!action.type) {
        errors.push('Action type is required');
      }

      if (!action.filePath && action.type !== 'message') {
        errors.push('File path is required for file operations');
      }

      if (action.content === undefined && ['create', 'edit'].includes(action.type)) {
        errors.push('Content is required for create and edit operations');
      }

      // Validate action type
      const allowedTypes = ['create', 'edit', 'delete', 'file', 'message'];
      if (!allowedTypes.includes(action.type)) {
        errors.push(`Invalid action type: ${action.type}`);
      }

      // Validate file path if present
      if (action.filePath) {
        const pathValidation = this.validateFilePath(action.filePath);
        if (!pathValidation.isValid) {
          errors.push(...pathValidation.errors.map(err => `File path: ${err}`));
        }
      }

      // Validate content if present
      if (action.content !== undefined) {
        const contentValidation = this.validateFileContent(action.content, {
          fileType: this.detectFileType(action.filePath || '')
        });
        if (!contentValidation.isValid) {
          errors.push(...contentValidation.errors.map(err => `Content: ${err}`));
        }
      }

      this.logger.debug('AI action validation completed', {
        actionType: action.type,
        filePath: action.filePath,
        isValid: errors.length === 0,
        errorCount: errors.length
      });

      return {
        isValid: errors.length === 0,
        errors,
        actionType: action.type,
        severity: errors.length > 0 ? 'high' : 'low'
      };
    } catch (error) {
      this.logger.error('AI action validation failed', { error, action });
      return {
        isValid: false,
        errors: ['Internal validation error'],
        actionType: action.type,
        severity: 'high'
      };
    }
  }

  async validateWorkspaceAccess(workspaceId: string, userId?: string): Promise<WorkspaceValidationResult> {
    const errors: string[] = [];

    try {
      // Validate workspace ID format
      if (!workspaceId || workspaceId.trim().length === 0) {
        errors.push('Workspace ID is required');
      } else if (!/^[a-zA-Z0-9-_]+$/.test(workspaceId)) {
        errors.push('Workspace ID contains invalid characters');
      }

      // Validate user ID if provided
      if (userId && !/^[a-zA-Z0-9-_]+$/.test(userId)) {
        errors.push('User ID contains invalid characters');
      }

      // In a real implementation, this would check against a database
      // For now, we'll simulate basic validation
      const isAccessible = workspaceId.length > 0 && !workspaceId.includes('..');

      this.logger.debug('Workspace access validation completed', {
        workspaceId,
        userId,
        isValid: errors.length === 0 && isAccessible,
        errorCount: errors.length
      });

      return {
        isValid: errors.length === 0 && isAccessible,
        errors,
        workspaceId,
        hasAccess: isAccessible
      };
    } catch (error) {
      this.logger.error('Workspace validation failed', { error, workspaceId, userId });
      return {
        isValid: false,
        errors: ['Internal validation error'],
        workspaceId,
        hasAccess: false
      };
    }
  }

  validateUserInput(input: string, inputType: 'message' | 'filename' | 'content'): ValidationResult {
    const errors: string[] = [];

    try {
      // Basic validation
      if (input === null || input === undefined) {
        errors.push('Input cannot be null or undefined');
        return { isValid: false, errors };
      }

      // Trim whitespace for validation
      const trimmedInput = input.trim();

      // Check for empty input
      if (trimmedInput.length === 0) {
        errors.push('Input cannot be empty');
        return { isValid: false, errors };
      }

      // Input type specific validation
      switch (inputType) {
        case 'message':
          if (trimmedInput.length > 10000) {
            errors.push('Message is too long (max 10,000 characters)');
          }
          break;
        case 'filename':
          const filenameValidation = this.validateFilePath(trimmedInput);
          if (!filenameValidation.isValid) {
            errors.push(...filenameValidation.errors);
          }
          break;
        case 'content':
          const contentValidation = this.validateFileContent(trimmedInput);
          if (!contentValidation.isValid) {
            errors.push(...contentValidation.errors);
          }
          break;
      }

      this.logger.debug('User input validation completed', {
        inputType,
        inputLength: input.length,
        isValid: errors.length === 0,
        errorCount: errors.length
      });

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      this.logger.error('User input validation failed', { error, inputType });
      return {
        isValid: false,
        errors: ['Internal validation error']
      };
    }
  }

  private validateContentByType(content: string, fileType: string): SecurityValidationResult {
    const errors: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    switch (fileType.toLowerCase()) {
      case 'html':
        // Check for script tags
        if (/<script/i.test(content)) {
          errors.push('HTML content contains script tags');
          severity = 'high';
        }
        // Check for event handlers
        if (/on\w+\s*=/i.test(content)) {
          errors.push('HTML content contains event handlers');
          severity = 'medium';
        }
        break;

      case 'javascript':
      case 'typescript':
        // Check for eval usage
        if (/eval\s*\(/i.test(content)) {
          errors.push('JavaScript content contains eval() function');
          severity = 'high';
        }
        break;

      case 'css':
      case 'scss':
      case 'sass':
        // Check for expression() usage
        if (/expression\s*\(/i.test(content)) {
          errors.push('CSS content contains expression() function');
          severity = 'high';
        }
        break;
    }

    return { isValid: errors.length === 0, errors, severity };
  }

  private sanitizeHtmlContent(content: string): string {
    // Remove script tags
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove event handlers
    content = content.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    return content;
  }

  private sanitizeJavaScriptContent(content: string): string {
    // Comment out eval statements
    content = content.replace(/eval\s*\(/gi, '// eval(');
    return content;
  }

  private sanitizeCssContent(content: string): string {
    // Remove expression() functions
    content = content.replace(/expression\s*\([^)]*\)/gi, '/* expression removed */');
    return content;
  }

  private isSuspiciousUrl(url: string): boolean {
    const suspicious = [
      'data:', 'javascript:', 'vbscript:', 'file:',
      'ftp:', 'ldap:', 'gopher:'
    ];
    return suspicious.some(scheme => url.toLowerCase().startsWith(scheme));
  }

  private detectFileType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass'
    };
    return typeMap[extension || ''] || 'plaintext';
  }
}