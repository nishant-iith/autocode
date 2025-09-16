/**
 * Performance-Optimized Service Implementations
 * Enhanced versions of core services with caching and performance monitoring
 */

import {
  IFileService,
  FileOperationResult,
  FileCreateRequest,
  FileUpdateRequest,
  FileDeleteRequest
} from '../interfaces/IFileService';
import { IValidationService, ValidationResult, SecurityValidationResult } from '../interfaces/IValidationService';
import { AIAction } from '../../services/aiActionParser';
import { ErrorHandlingService, ILogger } from '../services/ErrorHandlingService';
import { CacheService, fileContentCache, validationCache } from './CacheService';
import { performanceMonitor, measureAsyncPerformance, measurePerformance } from './PerformanceMonitor';

/**
 * Performance-optimized File Service with caching and monitoring
 */
export class OptimizedFileService implements IFileService {
  private cache: CacheService<string>;
  private operationQueue = new Map<string, Promise<any>>();

  constructor(
    private baseService: IFileService,
    private logger: ILogger,
    cacheOptions = { maxSize: 500, defaultTtl: 600000 }
  ) {
    this.cache = new CacheService<string>(cacheOptions);
  }

  @measureAsyncPerformance('fileService.createFile')
  async createFile(request: FileCreateRequest): Promise<FileOperationResult> {
    const startTime = Date.now();

    try {
      // Check for duplicate operations
      const operationKey = `create:${request.workspaceId}:${request.filePath}`;
      if (this.operationQueue.has(operationKey)) {
        this.logger.debug('Duplicate create operation detected, waiting for existing operation');
        return await this.operationQueue.get(operationKey)!;
      }

      // Create operation promise
      const operation = this.executeCreateFile(request);
      this.operationQueue.set(operationKey, operation);

      try {
        const result = await operation;

        // Cache the content on successful creation
        if (result.success) {
          const cacheKey = `${request.workspaceId}:${request.filePath}`;
          this.cache.set(cacheKey, request.content);

          performanceMonitor.recordFileOperation('create', request.content.length, true);
        } else {
          performanceMonitor.recordFileOperation('create', request.content.length, false);
        }

        return result;
      } finally {
        this.operationQueue.delete(operationKey);
      }
    } catch (error) {
      performanceMonitor.recordFileOperation('create', request.content.length, false);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.logger.debug('File create operation completed', {
        filePath: request.filePath,
        duration,
        contentLength: request.content.length
      });
    }
  }

  @measureAsyncPerformance('fileService.updateFile')
  async updateFile(request: FileUpdateRequest): Promise<FileOperationResult> {
    const startTime = Date.now();

    try {
      const operationKey = `update:${request.workspaceId}:${request.filePath}`;
      if (this.operationQueue.has(operationKey)) {
        return await this.operationQueue.get(operationKey)!;
      }

      const operation = this.executeUpdateFile(request);
      this.operationQueue.set(operationKey, operation);

      try {
        const result = await operation;

        if (result.success) {
          // Update cache
          const cacheKey = `${request.workspaceId}:${request.filePath}`;
          this.cache.set(cacheKey, request.content);

          performanceMonitor.recordFileOperation('update', request.content.length, true);
        } else {
          performanceMonitor.recordFileOperation('update', request.content.length, false);
        }

        return result;
      } finally {
        this.operationQueue.delete(operationKey);
      }
    } catch (error) {
      performanceMonitor.recordFileOperation('update', request.content.length, false);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.logger.debug('File update operation completed', {
        filePath: request.filePath,
        duration,
        contentLength: request.content.length
      });
    }
  }

  @measureAsyncPerformance('fileService.deleteFile')
  async deleteFile(request: FileDeleteRequest): Promise<FileOperationResult> {
    try {
      const result = await this.baseService.deleteFile(request);

      if (result.success) {
        // Remove from cache
        const cacheKey = `${request.workspaceId}:${request.filePath}`;
        this.cache.delete(cacheKey);

        performanceMonitor.recordFileOperation('delete', undefined, true);
      } else {
        performanceMonitor.recordFileOperation('delete', undefined, false);
      }

      return result;
    } catch (error) {
      performanceMonitor.recordFileOperation('delete', undefined, false);
      throw error;
    }
  }

  @measureAsyncPerformance('fileService.fileExists')
  async fileExists(workspaceId: string, filePath: string): Promise<boolean> {
    // Check cache first
    const cacheKey = `${workspaceId}:${filePath}`;
    if (this.cache.has(cacheKey)) {
      performanceMonitor.incrementCounter('fileService.fileExists.cacheHit');
      return true;
    }

    performanceMonitor.incrementCounter('fileService.fileExists.cacheMiss');
    return this.baseService.fileExists(workspaceId, filePath);
  }

  @measureAsyncPerformance('fileService.getFileContent')
  async getFileContent(workspaceId: string, filePath: string): Promise<string> {
    const cacheKey = `${workspaceId}:${filePath}`;

    return this.cache.getOrSet(cacheKey, async () => {
      performanceMonitor.incrementCounter('fileService.getFileContent.cacheMiss');
      const content = await this.baseService.getFileContent(workspaceId, filePath);
      performanceMonitor.recordMetric({
        name: 'fileService.getFileContent.size',
        value: content.length,
        timestamp: Date.now(),
        category: 'size'
      });
      return content;
    });
  }

  @measureAsyncPerformance('fileService.listFiles')
  async listFiles(workspaceId: string): Promise<string[]> {
    // Cache file lists for a shorter time
    const cacheKey = `filelist:${workspaceId}`;
    return fileContentCache.getOrSet(cacheKey, async () => {
      const files = await this.baseService.listFiles(workspaceId);
      performanceMonitor.recordMetric({
        name: 'fileService.listFiles.count',
        value: files.length,
        timestamp: Date.now(),
        category: 'count'
      });
      return files;
    }, 60000); // 1 minute cache
  }

  /**
   * Batch operations for better performance
   */
  @measureAsyncPerformance('fileService.batchGetContent')
  async batchGetContent(workspaceId: string, filePaths: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const uncachedPaths: string[] = [];

    // Check cache first
    for (const filePath of filePaths) {
      const cacheKey = `${workspaceId}:${filePath}`;
      const cached = this.cache.get(cacheKey);
      if (cached !== undefined) {
        result.set(filePath, cached);
        performanceMonitor.incrementCounter('fileService.batchGetContent.cacheHit');
      } else {
        uncachedPaths.push(filePath);
      }
    }

    // Fetch uncached files concurrently
    if (uncachedPaths.length > 0) {
      const promises = uncachedPaths.map(async (filePath) => {
        try {
          const content = await this.baseService.getFileContent(workspaceId, filePath);
          const cacheKey = `${workspaceId}:${filePath}`;
          this.cache.set(cacheKey, content);
          result.set(filePath, content);
          performanceMonitor.incrementCounter('fileService.batchGetContent.cacheMiss');
        } catch (error) {
          this.logger.warn(`Failed to fetch file content: ${filePath}`, { error });
        }
      });

      await Promise.all(promises);
    }

    return result;
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics() {
    return this.cache.getStatistics();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  private async executeCreateFile(request: FileCreateRequest): Promise<FileOperationResult> {
    return this.baseService.createFile(request);
  }

  private async executeUpdateFile(request: FileUpdateRequest): Promise<FileOperationResult> {
    return this.baseService.updateFile(request);
  }
}

/**
 * Performance-optimized Validation Service with caching
 */
export class OptimizedValidationService implements IValidationService {
  private pathValidationCache = new CacheService<SecurityValidationResult>({
    maxSize: 1000,
    defaultTtl: 300000 // 5 minutes
  });

  private contentValidationCache = new CacheService<SecurityValidationResult>({
    maxSize: 500,
    defaultTtl: 180000 // 3 minutes
  });

  constructor(
    private baseService: IValidationService,
    private logger: ILogger
  ) {}

  @measurePerformance('validationService.validateFilePath')
  validateFilePath(filePath: string, options: any = {}): SecurityValidationResult {
    const cacheKey = `${filePath}:${JSON.stringify(options)}`;

    return this.pathValidationCache.getOrSet(cacheKey, () => {
      performanceMonitor.incrementCounter('validationService.validateFilePath.cacheMiss');
      return this.baseService.validateFilePath(filePath, options);
    });
  }

  @measurePerformance('validationService.validateFileContent')
  validateFileContent(content: string, options: any = {}): SecurityValidationResult {
    const contentHash = this.hashString(content);
    const cacheKey = `${contentHash}:${JSON.stringify(options)}`;

    return this.contentValidationCache.getOrSet(cacheKey, () => {
      performanceMonitor.incrementCounter('validationService.validateFileContent.cacheMiss');
      const result = this.baseService.validateFileContent(content, options);

      performanceMonitor.recordMetric({
        name: 'validationService.validateFileContent.contentLength',
        value: content.length,
        timestamp: Date.now(),
        category: 'size'
      });

      return result;
    });
  }

  @measurePerformance('validationService.sanitizeContent')
  sanitizeContent(content: string, fileType: string): string {
    const startTime = performance.now();
    const result = this.baseService.sanitizeContent(content, fileType);
    const duration = performance.now() - startTime;

    performanceMonitor.recordMetric({
      name: 'validationService.sanitizeContent.duration',
      value: duration,
      timestamp: Date.now(),
      category: 'timing'
    });

    if (result !== content) {
      performanceMonitor.incrementCounter('validationService.sanitizeContent.modified');
    }

    return result;
  }

  @measurePerformance('validationService.validateAIAction')
  validateAIAction(action: AIAction): any {
    const actionHash = this.hashString(JSON.stringify(action));

    return validationCache.getOrSet(actionHash, () => {
      performanceMonitor.incrementCounter('validationService.validateAIAction.cacheMiss');
      return this.baseService.validateAIAction(action);
    });
  }

  @measureAsyncPerformance('validationService.validateWorkspaceAccess')
  async validateWorkspaceAccess(workspaceId: string, userId?: string): Promise<any> {
    const cacheKey = `workspace:${workspaceId}:${userId || 'anonymous'}`;

    return validationCache.getOrSet(cacheKey, () => {
      performanceMonitor.incrementCounter('validationService.validateWorkspaceAccess.cacheMiss');
      return this.baseService.validateWorkspaceAccess(workspaceId, userId);
    }, 60000); // 1 minute cache for workspace access
  }

  @measurePerformance('validationService.validateUserInput')
  validateUserInput(input: string, inputType: 'message' | 'filename' | 'content'): ValidationResult {
    if (inputType === 'message' && input.length < 1000) {
      // Cache small message validations
      const cacheKey = `${inputType}:${this.hashString(input)}`;
      return validationCache.getOrSet(cacheKey, () => {
        return this.baseService.validateUserInput(input, inputType);
      });
    }

    return this.baseService.validateUserInput(input, inputType);
  }

  /**
   * Batch validation for better performance
   */
  @measurePerformance('validationService.batchValidateFilePaths')
  batchValidateFilePaths(filePaths: string[], options: any = {}): Map<string, SecurityValidationResult> {
    const results = new Map<string, SecurityValidationResult>();

    for (const filePath of filePaths) {
      results.set(filePath, this.validateFilePath(filePath, options));
    }

    performanceMonitor.recordMetric({
      name: 'validationService.batchValidateFilePaths.count',
      value: filePaths.length,
      timestamp: Date.now(),
      category: 'count'
    });

    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics() {
    return {
      pathValidation: this.pathValidationCache.getStatistics(),
      contentValidation: this.contentValidationCache.getStatistics()
    };
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.pathValidationCache.clear();
    this.contentValidationCache.clear();
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

/**
 * Performance optimization utilities
 */
export class PerformanceOptimizer {
  private static memoryCleanupInterval?: NodeJS.Timeout;

  /**
   * Initialize performance optimizations
   */
  static initialize() {
    // Start memory monitoring
    this.startMemoryMonitoring();

    // Setup cleanup intervals
    this.setupCleanupIntervals();

    // Optimize garbage collection hints
    this.optimizeGarbageCollection();
  }

  /**
   * Start monitoring memory usage
   */
  private static startMemoryMonitoring() {
    setInterval(() => {
      performanceMonitor.recordMemoryUsage();
    }, 30000); // Every 30 seconds
  }

  /**
   * Setup cleanup intervals for caches
   */
  private static setupCleanupIntervals() {
    // Clean up performance metrics every 10 minutes
    setInterval(() => {
      performanceMonitor.clearOldMetrics(600000); // 10 minutes
    }, 600000);

    // Clean up cache services every 5 minutes
    setInterval(() => {
      fileContentCache.cleanup();
      validationCache.cleanup();
    }, 300000);
  }

  /**
   * Provide GC hints for better memory management
   */
  private static optimizeGarbageCollection() {
    // Hint for GC on low memory
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (usageRatio > 0.8) {
          // Clear some caches when memory usage is high
          fileContentCache.cleanup();
          validationCache.cleanup();

          performanceMonitor.incrementCounter('performance.memoryCleanup.triggered');
        }
      }, 60000); // Check every minute
    }
  }

  /**
   * Get optimization recommendations
   */
  static getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const summary = performanceMonitor.getSummary();

    // Check for slow operations
    Object.entries(summary.averageResponseTimes).forEach(([operation, avgTime]) => {
      if (avgTime > 1000) {
        recommendations.push(`Consider optimizing ${operation} - average response time: ${avgTime}ms`);
      }
    });

    // Check memory usage
    if (summary.memoryUsage.usedJSHeapSize && summary.memoryUsage.jsHeapSizeLimit) {
      const usageRatio = summary.memoryUsage.usedJSHeapSize / summary.memoryUsage.jsHeapSizeLimit;
      if (usageRatio > 0.7) {
        recommendations.push('Memory usage is high - consider clearing caches or reducing memory footprint');
      }
    }

    // Check error rates
    const totalOps = Object.values(summary.operationCounts).reduce((sum, count) => sum + count, 0);
    const totalErrors = Object.values(summary.errorCounts).reduce((sum, count) => sum + count, 0);
    const errorRate = totalErrors / totalOps;

    if (errorRate > 0.05) {
      recommendations.push('Error rate is high - investigate and fix failing operations');
    }

    return recommendations;
  }

  /**
   * Dispose optimization resources
   */
  static dispose() {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
    }
  }
}