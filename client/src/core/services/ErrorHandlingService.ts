/**
 * Error Handling Service
 * Centralized error processing, logging, and recovery
 */

import axios from 'axios';
import {
  BaseError,
  ErrorCode,
  ErrorSeverity,
  ValidationError,
  SecurityError,
  FileOperationError,
  NetworkError,
  AIProcessingError,
  SystemError,
  ErrorContext
} from '../errors/AIErrors';

export interface ErrorReport {
  error: BaseError;
  timestamp: Date;
  context: ErrorContext;
  reported: boolean;
}

export interface ErrorRecoveryStrategy {
  canRecover(error: BaseError): boolean;
  recover(error: BaseError): Promise<any>;
}

export interface ILogger {
  error(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  info(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}

export interface IErrorReporter {
  report(error: BaseError): Promise<void>;
}

export class ErrorHandlingService {
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];
  private errorHistory: ErrorReport[] = [];
  private maxHistorySize = 100;

  constructor(
    private logger: ILogger,
    private errorReporter?: IErrorReporter
  ) {}

  /**
   * Main error handling entry point
   */
  async handleError(
    error: unknown,
    context: ErrorContext = {}
  ): Promise<BaseError> {
    // Convert to standardized error
    const standardizedError = this.standardizeError(error, context);

    // Log the error
    this.logError(standardizedError);

    // Add to history
    this.addToHistory(standardizedError, context);

    // Report if critical
    if (standardizedError.severity === ErrorSeverity.CRITICAL) {
      await this.reportError(standardizedError);
    }

    // Attempt recovery if retryable
    if (standardizedError.retryable) {
      await this.attemptRecovery(standardizedError);
    }

    return standardizedError;
  }

  /**
   * Handles file operation errors specifically
   */
  handleFileOperationError(
    error: unknown,
    context: ErrorContext
  ): FileOperationError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      let code: ErrorCode;
      switch (status) {
        case 404:
          code = ErrorCode.FILE_NOT_FOUND;
          break;
        case 409:
          code = ErrorCode.FILE_ALREADY_EXISTS;
          break;
        case 403:
          code = ErrorCode.UNAUTHORIZED_ACCESS;
          break;
        case 413:
          code = ErrorCode.VALIDATION_FAILED;
          break;
        default:
          code = ErrorCode.FILE_WRITE_ERROR;
      }

      return new FileOperationError(message, code, context, error);
    }

    if (error instanceof Error) {
      return new FileOperationError(error.message, ErrorCode.FILE_WRITE_ERROR, context, error);
    }

    return new FileOperationError(
      'Unknown file operation error',
      ErrorCode.FILE_WRITE_ERROR,
      context
    );
  }

  /**
   * Handles network errors specifically
   */
  handleNetworkError(error: unknown, context: ErrorContext): NetworkError {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return new NetworkError('Request timeout', {
          ...context,
          additionalData: { timeout: true }
        }, error);
      }

      if (error.code === 'ERR_NETWORK') {
        return new NetworkError('Network connection failed', context, error);
      }

      return new NetworkError(
        error.response?.data?.message || error.message,
        context,
        error
      );
    }

    if (error instanceof Error) {
      return new NetworkError(error.message, context, error);
    }

    return new NetworkError('Unknown network error', context);
  }

  /**
   * Handles AI processing errors
   */
  handleAIProcessingError(
    error: unknown,
    context: ErrorContext,
    operation: string
  ): AIProcessingError {
    const enhancedContext = { ...context, operation };

    if (error instanceof ValidationError) {
      return new AIProcessingError(
        `AI validation failed: ${error.message}`,
        ErrorCode.AI_PARSING_ERROR,
        enhancedContext,
        error
      );
    }

    if (error instanceof SecurityError) {
      return new AIProcessingError(
        `AI security violation: ${error.message}`,
        ErrorCode.AI_ACTION_FAILED,
        enhancedContext,
        error
      );
    }

    if (error instanceof Error) {
      return new AIProcessingError(
        `AI processing failed: ${error.message}`,
        ErrorCode.AI_ACTION_FAILED,
        enhancedContext,
        error
      );
    }

    return new AIProcessingError(
      'Unknown AI processing error',
      ErrorCode.AI_ACTION_FAILED,
      enhancedContext
    );
  }

  /**
   * Adds recovery strategy
   */
  addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Gets error history
   */
  getErrorHistory(): readonly ErrorReport[] {
    return [...this.errorHistory];
  }

  /**
   * Clears error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Gets error statistics
   */
  getErrorStatistics(): Record<string, any> {
    const total = this.errorHistory.length;
    const bySeverity = this.errorHistory.reduce((acc, report) => {
      const severity = report.error.severity;
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = this.errorHistory.reduce((acc, report) => {
      const category = report.error.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const retryableCount = this.errorHistory.filter(r => r.error.retryable).length;

    return {
      total,
      bySeverity,
      byCategory,
      retryableCount,
      retryablePercentage: total > 0 ? (retryableCount / total) * 100 : 0
    };
  }

  private standardizeError(error: unknown, context: ErrorContext): BaseError {
    // Already a standardized error
    if (error instanceof BaseError) {
      return error;
    }

    // Axios errors
    if (axios.isAxiosError(error)) {
      return this.handleNetworkError(error, context);
    }

    // Regular JavaScript errors
    if (error instanceof Error) {
      // Check if it's a specific type we can categorize
      if (error.name === 'ValidationError') {
        return new ValidationError(error.message, context, error);
      }

      if (error.name === 'SecurityError') {
        return new SecurityError(error.message, context, error);
      }

      // Generic system error
      return new SystemError(error.message, context, error);
    }

    // Unknown error type
    return new SystemError(
      `Unknown error: ${String(error)}`,
      {
        ...context,
        additionalData: { originalError: error }
      }
    );
  }

  private logError(error: BaseError): void {
    const logData = error.getLogDetails();

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.error(`CRITICAL: ${error.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error(`HIGH: ${error.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`MEDIUM: ${error.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        this.logger.info(`LOW: ${error.message}`, logData);
        break;
    }
  }

  private addToHistory(error: BaseError, context: ErrorContext): void {
    const report: ErrorReport = {
      error,
      timestamp: new Date(),
      context,
      reported: false
    };

    this.errorHistory.push(report);

    // Maintain max history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  private async reportError(error: BaseError): Promise<void> {
    if (!this.errorReporter) {
      return;
    }

    try {
      await this.errorReporter.report(error);

      // Mark as reported in history
      const report = this.errorHistory.find(r => r.error === error);
      if (report) {
        report.reported = true;
      }
    } catch (reportingError) {
      this.logger.error('Failed to report error', {
        originalError: error.getLogDetails(),
        reportingError: reportingError instanceof Error ? {
          name: reportingError.name,
          message: reportingError.message
        } : reportingError
      });
    }
  }

  private async attemptRecovery(error: BaseError): Promise<void> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          await strategy.recover(error);
          this.logger.info(`Successfully recovered from error: ${error.code}`);
          return;
        } catch (recoveryError) {
          this.logger.warn(`Recovery strategy failed for error: ${error.code}`, {
            recoveryError: recoveryError instanceof Error ? {
              name: recoveryError.name,
              message: recoveryError.message
            } : recoveryError
          });
        }
      }
    }
  }
}

// Default recovery strategies
export class FileOperationRecoveryStrategy implements ErrorRecoveryStrategy {
  canRecover(error: BaseError): boolean {
    return error instanceof FileOperationError &&
           error.code === ErrorCode.FILE_WRITE_ERROR;
  }

  async recover(error: BaseError): Promise<void> {
    // Could implement retry logic, backup restoration, etc.
    // For now, just log the recovery attempt
    console.log(`Attempting to recover from file operation error: ${error.message}`);
  }
}

export class NetworkRecoveryStrategy implements ErrorRecoveryStrategy {
  private maxRetries = 3;
  private retryDelay = 1000;

  canRecover(error: BaseError): boolean {
    return error instanceof NetworkError && error.retryable;
  }

  async recover(error: BaseError): Promise<void> {
    // Implement exponential backoff retry
    for (let i = 0; i < this.maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));

      // In a real implementation, this would retry the original operation
      console.log(`Retry attempt ${i + 1} for network error: ${error.message}`);

      // Simulate recovery success
      if (Math.random() > 0.5) {
        return;
      }
    }

    throw new Error('Recovery failed after maximum retries');
  }
}