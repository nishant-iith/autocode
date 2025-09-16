/**
 * Enhanced Security Validation Service
 * Comprehensive validation for file operations with security focus
 */

import path from 'path';
import {
  IValidationService,
  ValidationResult,
  SecurityValidationResult,
  FilePathValidationOptions,
  ContentValidationOptions
} from '../interfaces/IValidationService';

export class ValidationService implements IValidationService {
  private static readonly DEFAULT_MAX_PATH_LENGTH = 260;
  private static readonly DEFAULT_MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB

  private static readonly ALLOWED_EXTENSIONS = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.sass',
    '.html', '.htm', '.md', '.txt', '.yml', '.yaml', '.xml',
    '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico'
  ]);

  private static readonly RESERVED_NAMES = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ]);

  private static readonly PATH_TRAVERSAL_PATTERNS = [
    /\.\./,                    // Basic traversal
    /%2e%2e/i,                // URL encoded
    /%252e%252e/i,            // Double URL encoded
    /\.\%2e/i,                // Mixed encoding
    /%2e\./i,                 // Mixed encoding
    /0x2e0x2e/i,             // Hex encoded
    /\.\\/,                   // Windows path
    /\.%5c/i,                 // URL encoded backslash
    /\.%255c/i               // Double encoded backslash
  ];

  private static readonly DANGEROUS_CONTENT_PATTERNS = {
    javascript: [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /setTimeout\s*\(\s*["'`][^"'`]*["'`]/gi,
      /setInterval\s*\(\s*["'`][^"'`]*["'`]/gi,
      /document\.write/gi,
      /innerHTML\s*=/gi,
      /outerHTML\s*=/gi,
      /document\.cookie/gi,
      /window\.location/gi,
      /location\.href/gi,
      /location\.replace/gi,
      /location\.assign/gi,
      /XMLHttpRequest/gi,
      /fetch\s*\(/gi,
      /import\s*\(/gi,
      /require\s*\(/gi
    ],
    html: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /<form\b[^>]*>/gi,
      /on\w+\s*=/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi
    ],
    css: [
      /expression\s*\(/gi,
      /javascript:/gi,
      /@import\s+url\s*\(/gi,
      /behavior\s*:/gi,
      /-moz-binding/gi
    ]
  };

  validateFilePath(
    filePath: string,
    options: FilePathValidationOptions = {}
  ): SecurityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const threats: string[] = [];
    let securityLevel: 'safe' | 'warning' | 'danger' = 'safe';

    // Basic validation
    if (!filePath?.trim()) {
      errors.push('File path cannot be empty');
      return {
        isValid: false,
        errors,
        warnings,
        securityLevel: 'danger',
        threats: ['Empty path']
      };
    }

    const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
    const maxLength = options.maxLength || ValidationService.DEFAULT_MAX_PATH_LENGTH;

    // Length validation
    if (normalizedPath.length > maxLength) {
      errors.push(`File path too long (max ${maxLength} characters)`);
      securityLevel = 'warning';
    }

    // Path traversal detection
    for (const pattern of ValidationService.PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(filePath) || pattern.test(normalizedPath)) {
        errors.push('Path traversal attack detected');
        threats.push('Directory traversal');
        securityLevel = 'danger';
        break;
      }
    }

    // Absolute path validation
    if (!options.allowAbsolutePaths && path.isAbsolute(normalizedPath)) {
      errors.push('Absolute paths are not allowed');
      threats.push('Absolute path access');
      securityLevel = 'danger';
    }

    // Invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(filePath)) {
      errors.push('File path contains invalid characters');
      securityLevel = 'warning';
    }

    // Extension validation
    const extension = path.extname(normalizedPath).toLowerCase();
    const allowedExtensions = options.allowedExtensions || ValidationService.ALLOWED_EXTENSIONS;

    if (extension && !allowedExtensions.has(extension)) {
      errors.push(`File extension '${extension}' is not allowed`);
      threats.push('Unauthorized file type');
      securityLevel = 'danger';
    }

    // Reserved names validation
    const basename = path.basename(normalizedPath, extension);
    if (ValidationService.RESERVED_NAMES.has(basename.toUpperCase())) {
      errors.push(`File name '${basename}' is reserved`);
      securityLevel = 'warning';
    }

    // Blocked patterns
    if (options.blockedPatterns) {
      for (const pattern of options.blockedPatterns) {
        if (pattern.test(normalizedPath)) {
          errors.push('File path matches blocked pattern');
          threats.push('Blocked pattern match');
          securityLevel = 'danger';
          break;
        }
      }
    }

    // Hidden files warning
    if (basename.startsWith('.') && basename !== '.gitignore' && basename !== '.env.example') {
      warnings.push('Hidden file detected');
      if (securityLevel === 'safe') securityLevel = 'warning';
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityLevel,
      threats
    };
  }

  validateFileContent(
    content: string,
    options: ContentValidationOptions = {}
  ): SecurityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const threats: string[] = [];
    let securityLevel: 'safe' | 'warning' | 'danger' = 'safe';

    // Size validation
    const maxSize = options.maxSize || ValidationService.DEFAULT_MAX_CONTENT_SIZE;
    if (content.length > maxSize) {
      errors.push(`Content too large (max ${Math.floor(maxSize / 1024 / 1024)}MB)`);
      securityLevel = 'warning';
    }

    // Binary content detection
    if (this.containsBinaryContent(content)) {
      if (!options.allowExecutableContent) {
        errors.push('Binary or executable content detected');
        threats.push('Potential malware');
        securityLevel = 'danger';
      } else {
        warnings.push('Binary content detected');
        if (securityLevel === 'safe') securityLevel = 'warning';
      }
    }

    // Content-specific security validation
    if (options.fileType) {
      const contentThreats = this.validateContentSecurity(content, options.fileType);
      threats.push(...contentThreats);

      if (contentThreats.length > 0) {
        errors.push(`Potentially dangerous ${options.fileType} content detected`);
        securityLevel = 'danger';
      }
    }

    // Encoding validation
    if (!this.isValidEncoding(content)) {
      warnings.push('Invalid character encoding detected');
      if (securityLevel === 'safe') securityLevel = 'warning';
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityLevel,
      threats
    };
  }

  sanitizeContent(content: string, fileType: string): string {
    switch (fileType.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return this.sanitizeJavaScriptContent(content);
      case 'html':
        return this.sanitizeHTMLContent(content);
      case 'css':
        return this.sanitizeCSSContent(content);
      case 'json':
        return this.sanitizeJSONContent(content);
      default:
        return this.sanitizeGenericContent(content);
    }
  }

  async validateWorkspaceAccess(workspaceId: string, userId?: string): Promise<ValidationResult> {
    const errors: string[] = [];

    // Basic format validation
    if (!workspaceId?.trim()) {
      errors.push('Workspace ID cannot be empty');
    }

    // UUID format validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (workspaceId && !uuidPattern.test(workspaceId)) {
      errors.push('Invalid workspace ID format');
    }

    // Additional user-specific validation could be added here
    // For example, checking user permissions, workspace ownership, etc.

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateAIAction(action: any): ValidationResult {
    const errors: string[] = [];

    if (!action) {
      errors.push('Action cannot be null or undefined');
      return { isValid: false, errors };
    }

    // Required fields
    if (!action.type) {
      errors.push('Action type is required');
    }

    // Valid action types
    const validTypes = ['file', 'create', 'edit', 'delete', 'shell', 'start'];
    if (action.type && !validTypes.includes(action.type)) {
      errors.push(`Invalid action type: ${action.type}`);
    }

    // File path validation for file operations
    if (['file', 'create', 'edit', 'delete'].includes(action.type)) {
      if (!action.filePath) {
        errors.push('File path is required for file operations');
      } else {
        const pathValidation = this.validateFilePath(action.filePath);
        if (!pathValidation.isValid) {
          errors.push(...pathValidation.errors);
        }
      }
    }

    // Content validation for file creation/editing
    if (['file', 'create', 'edit'].includes(action.type)) {
      if (action.content === undefined || action.content === null) {
        errors.push('Content is required for file creation/editing');
      } else if (typeof action.content !== 'string') {
        errors.push('Content must be a string');
      } else {
        const fileType = action.filePath ?
          path.extname(action.filePath).slice(1) : 'text';

        const contentValidation = this.validateFileContent(action.content, { fileType });
        if (!contentValidation.isValid) {
          errors.push(...contentValidation.errors);
        }
      }
    }

    // Command validation for shell operations
    if (['shell', 'start'].includes(action.type)) {
      if (!action.command) {
        errors.push('Command is required for shell operations');
      } else {
        const commandValidation = this.validateShellCommand(action.command);
        if (!commandValidation.isValid) {
          errors.push(...commandValidation.errors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateContentSecurity(content: string, fileType: string): string[] {
    const threats: string[] = [];
    const patterns = ValidationService.DANGEROUS_CONTENT_PATTERNS[fileType as keyof typeof ValidationService.DANGEROUS_CONTENT_PATTERNS];

    if (patterns) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          threats.push(`Dangerous ${fileType} pattern detected`);
        }
      }
    }

    return threats;
  }

  private containsBinaryContent(content: string): boolean {
    // Check for null bytes and other binary indicators
    return /[\x00-\x08\x0E-\x1F\x7F]/.test(content);
  }

  private isValidEncoding(content: string): boolean {
    try {
      // Check if content can be properly encoded/decoded
      const encoded = encodeURIComponent(content);
      const decoded = decodeURIComponent(encoded);
      return decoded === content;
    } catch {
      return false;
    }
  }

  private sanitizeJavaScriptContent(content: string): string {
    const patterns = ValidationService.DANGEROUS_CONTENT_PATTERNS.javascript;
    let sanitized = content;

    for (const pattern of patterns) {
      sanitized = sanitized.replace(pattern, '/* REMOVED: Potentially dangerous code */');
    }

    return sanitized;
  }

  private sanitizeHTMLContent(content: string): string {
    const patterns = ValidationService.DANGEROUS_CONTENT_PATTERNS.html;
    let sanitized = content;

    for (const pattern of patterns) {
      sanitized = sanitized.replace(pattern, '<!-- REMOVED: Potentially dangerous HTML -->');
    }

    return sanitized;
  }

  private sanitizeCSSContent(content: string): string {
    const patterns = ValidationService.DANGEROUS_CONTENT_PATTERNS.css;
    let sanitized = content;

    for (const pattern of patterns) {
      sanitized = sanitized.replace(pattern, '/* REMOVED: Potentially dangerous CSS */');
    }

    return sanitized;
  }

  private sanitizeJSONContent(content: string): string {
    try {
      // Validate JSON and re-stringify to ensure no code injection
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not valid JSON, treat as text
      return this.sanitizeGenericContent(content);
    }
  }

  private sanitizeGenericContent(content: string): string {
    // Basic sanitization for generic text content
    return content
      .replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/javascript:/gi, 'javascript_REMOVED:')
      .replace(/vbscript:/gi, 'vbscript_REMOVED:')
      .replace(/data:text\/html/gi, 'data:text_html_REMOVED');
  }

  private validateShellCommand(command: string): ValidationResult {
    const errors: string[] = [];

    // Dangerous commands
    const dangerousCommands = [
      'rm ', 'del ', 'format ', 'shutdown ', 'reboot ', 'halt ',
      'sudo ', 'su ', 'chmod ', 'chown ', 'passwd ', 'useradd ',
      'userdel ', 'killall ', 'kill ', 'pkill ', 'dd ', 'fdisk ',
      'mkfs', 'mount ', 'umount ', 'crontab ', 'at ', 'batch '
    ];

    const lowercaseCommand = command.toLowerCase();
    for (const dangerous of dangerousCommands) {
      if (lowercaseCommand.includes(dangerous)) {
        errors.push(`Dangerous command detected: ${dangerous.trim()}`);
      }
    }

    // Command injection patterns
    const injectionPatterns = [
      /[;&|`$()]/,  // Command separators and substitution
      />\s*\/dev\/null/,  // Output redirection
      /\|\s*sh/,  // Pipe to shell
      /\|\s*bash/,  // Pipe to bash
      /wget\s+/,  // Network downloads
      /curl\s+.*\|/,  // Curl with pipe
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(command)) {
        errors.push('Command injection pattern detected');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}