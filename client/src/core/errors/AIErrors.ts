/**
 * Standardized Error Types for AI Operations
 * Provides consistent error handling across the application
 */

export enum ErrorCode {
  // Validation Errors
  INVALID_FILE_PATH = 'INVALID_FILE_PATH',
  INVALID_CONTENT = 'INVALID_CONTENT',
  INVALID_ACTION = 'INVALID_ACTION',
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // Security Errors
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DANGEROUS_CONTENT = 'DANGEROUS_CONTENT',

  // File Operation Errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ALREADY_EXISTS = 'FILE_ALREADY_EXISTS',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  FILE_DELETE_ERROR = 'FILE_DELETE_ERROR',

  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',

  // AI Processing Errors
  AI_PARSING_ERROR = 'AI_PARSING_ERROR',
  AI_ACTION_FAILED = 'AI_ACTION_FAILED',
  AI_CONTEXT_ERROR = 'AI_CONTEXT_ERROR',
  AI_RESPONSE_ERROR = 'AI_RESPONSE_ERROR',

  // System Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  operation?: string;
  filePath?: string;
  workspaceId?: string;
  userId?: string;
  timestamp?: Date;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorMetadata {
  code: ErrorCode;
  severity: ErrorSeverity;
  retryable: boolean;
  userFriendly: boolean;
  category: string;
}

export abstract class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly userFriendly: boolean;
  public readonly category: string;
  public readonly context: ErrorContext;
  public readonly cause?: Error;

  constructor(
    message: string,
    metadata: ErrorMetadata,
    context: ErrorContext = {},
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = metadata.code;
    this.severity = metadata.severity;
    this.retryable = metadata.retryable;
    this.userFriendly = metadata.userFriendly;
    this.category = metadata.category;
    this.context = {
      ...context,
      timestamp: context.timestamp || new Date()
    };
    this.cause = cause;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Store original stack trace in context
    this.context.stackTrace = this.stack;
  }

  /**
   * Gets user-friendly error message
   */
  getUserMessage(): string {
    if (this.userFriendly) {
      return this.message;
    }

    // Provide generic user-friendly messages based on category
    switch (this.category) {
      case 'validation':
        return 'The provided input is invalid. Please check your data and try again.';
      case 'security':
        return 'Security validation failed. This operation is not allowed.';
      case 'file':
        return 'File operation failed. Please check the file path and permissions.';
      case 'network':
        return 'Network error occurred. Please check your connection and try again.';
      case 'ai':
        return 'AI processing failed. Please try again or contact support.';
      default:
        return 'An unexpected error occurred. Please try again or contact support.';
    }
  }

  /**
   * Gets error details for logging
   */
  getLogDetails(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      retryable: this.retryable,
      context: this.context,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }

  /**
   * Converts error to JSON for serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      retryable: this.retryable,
      userFriendly: this.userFriendly,
      userMessage: this.getUserMessage(),
      context: this.context
    };
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, context: ErrorContext = {}, cause?: Error) {
    super(message, {
      code: ErrorCode.VALIDATION_FAILED,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      userFriendly: true,
      category: 'validation'
    }, context, cause);
  }
}

export class SecurityError extends BaseError {
  constructor(message: string, context: ErrorContext = {}, cause?: Error) {
    super(message, {
      code: ErrorCode.SECURITY_VIOLATION,
      severity: ErrorSeverity.HIGH,
      retryable: false,
      userFriendly: false,
      category: 'security'
    }, context, cause);
  }
}

export class FileOperationError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.FILE_WRITE_ERROR,
    context: ErrorContext = {},
    cause?: Error
  ) {
    super(message, {
      code,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userFriendly: true,
      category: 'file'
    }, context, cause);
  }
}

export class NetworkError extends BaseError {
  constructor(message: string, context: ErrorContext = {}, cause?: Error) {
    super(message, {
      code: ErrorCode.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userFriendly: true,
      category: 'network'
    }, context, cause);
  }
}

export class AIProcessingError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.AI_ACTION_FAILED,
    context: ErrorContext = {},
    cause?: Error
  ) {
    super(message, {
      code,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      userFriendly: true,
      category: 'ai'
    }, context, cause);
  }
}

export class SystemError extends BaseError {
  constructor(message: string, context: ErrorContext = {}, cause?: Error) {
    super(message, {
      code: ErrorCode.SYSTEM_ERROR,
      severity: ErrorSeverity.CRITICAL,
      retryable: false,
      userFriendly: false,
      category: 'system'
    }, context, cause);
  }
}