/**
 * File Operation Orchestrator
 * Manages and coordinates file operation strategies
 */

import {
  FileOperationStrategy,
  OperationContext,
  OperationResult,
  OperationProgress,
  CreateFileStrategy,
  EditFileStrategy,
  DeleteFileStrategy,
  UnsupportedOperationStrategy
} from './FileOperationStrategy';
import { AIAction, AIArtifact } from '../../services/aiActionParser';
import { EventFactory } from '../services/EventBusService';

export interface OrchestratorConfig {
  maxConcurrentOperations?: number;
  operationTimeout?: number; // in milliseconds
  retryAttempts?: number;
  retryDelay?: number;
}

export interface BatchOperationResult {
  success: boolean;
  results: OperationResult[];
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  errors: string[];
}

/**
 * Orchestrates file operations using strategy pattern
 */
export class FileOperationOrchestrator {
  private strategies: FileOperationStrategy[] = [];
  private config: Required<OrchestratorConfig>;

  constructor(config: OrchestratorConfig = {}) {
    this.config = {
      maxConcurrentOperations: config.maxConcurrentOperations || 5,
      operationTimeout: config.operationTimeout || 30000, // 30 seconds
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000
    };

    // Register default strategies
    this.registerDefaultStrategies();
  }

  /**
   * Registers a new operation strategy
   */
  registerStrategy(strategy: FileOperationStrategy): void {
    this.strategies.push(strategy);
    this.sortStrategiesByPriority();
  }

  /**
   * Removes a strategy
   */
  unregisterStrategy(strategyType: string): void {
    this.strategies = this.strategies.filter(s => s.actionType !== strategyType);
  }

  /**
   * Gets all registered strategies
   */
  getStrategies(): readonly FileOperationStrategy[] {
    return [...this.strategies];
  }

  /**
   * Executes a single AI action
   */
  async executeAction(
    action: AIAction,
    context: OperationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<OperationResult> {
    const strategy = this.findStrategy(action);

    try {
      // Validate action
      await strategy.validate(action, context);

      // Execute with timeout and retry logic
      return await this.executeWithRetry(action, strategy, context, onProgress);
    } catch (error) {
      // Emit failure event
      const event = EventFactory.createAIActionProcessedEvent(
        action.type,
        false,
        action.filePath,
        error instanceof Error ? error.message : 'Unknown error'
      );
      context.eventBus.emit(event);

      throw error;
    }
  }

  /**
   * Executes multiple actions from an artifact
   */
  async executeArtifact(
    artifact: AIArtifact,
    context: OperationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<BatchOperationResult> {
    const results: OperationResult[] = [];
    const errors: string[] = [];
    let successfulOperations = 0;

    // Calculate total complexity for progress tracking
    const totalComplexity = artifact.actions.reduce((sum, action) => {
      const strategy = this.findStrategy(action);
      return sum + strategy.estimateComplexity(action);
    }, 0);

    let completedComplexity = 0;

    for (let i = 0; i < artifact.actions.length; i++) {
      const action = artifact.actions[i];

      try {
        // Create progress callback for this action
        const actionProgressCallback = (actionProgress: OperationProgress) => {
          const strategy = this.findStrategy(action);
          const actionComplexity = strategy.estimateComplexity(action);
          const actionProgressPercent = (actionProgress.progress || 0) / 100;
          const overallProgress = Math.round(
            ((completedComplexity + actionComplexity * actionProgressPercent) / totalComplexity) * 100
          );

          onProgress?.({
            ...actionProgress,
            progress: overallProgress
          });
        };

        // Execute action
        const result = await this.executeAction(action, context, actionProgressCallback);
        results.push(result);
        successfulOperations++;

        // Update completed complexity
        const strategy = this.findStrategy(action);
        completedComplexity += strategy.estimateComplexity(action);

        // Emit success event
        const event = EventFactory.createAIActionProcessedEvent(
          action.type,
          true,
          action.filePath
        );
        context.eventBus.emit(event);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Action ${i + 1} (${action.type}): ${errorMessage}`);

        // Create failed result
        results.push({
          success: false,
          error: errorMessage,
          filePath: action.filePath,
          action: action.type
        });

        // Emit failure event
        const event = EventFactory.createAIActionProcessedEvent(
          action.type,
          false,
          action.filePath,
          errorMessage
        );
        context.eventBus.emit(event);

        // Stop on first error for now (could be configurable)
        break;
      }
    }

    return {
      success: errors.length === 0,
      results,
      totalOperations: artifact.actions.length,
      successfulOperations,
      failedOperations: artifact.actions.length - successfulOperations,
      errors
    };
  }

  /**
   * Executes multiple actions concurrently (with limits)
   */
  async executeConcurrent(
    actions: AIAction[],
    context: OperationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<BatchOperationResult> {
    const results: OperationResult[] = [];
    const errors: string[] = [];
    let successfulOperations = 0;

    // Group actions by dependency (files that depend on each other should run sequentially)
    const actionGroups = this.groupActionsByDependency(actions);

    for (const group of actionGroups) {
      // Execute each group with concurrency limit
      const chunks = this.chunkArray(group, this.config.maxConcurrentOperations);

      for (const chunk of chunks) {
        const promises = chunk.map(async (action, index) => {
          try {
            const result = await this.executeAction(action, context, onProgress);
            return { success: true, result, index, action };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
              success: false,
              error: errorMessage,
              index,
              action,
              result: {
                success: false,
                error: errorMessage,
                filePath: action.filePath,
                action: action.type
              } as OperationResult
            };
          }
        });

        const chunkResults = await Promise.all(promises);

        for (const chunkResult of chunkResults) {
          results.push(chunkResult.result);

          if (chunkResult.success) {
            successfulOperations++;
          } else {
            errors.push(
              `Action ${chunkResult.action.type}: ${chunkResult.error}`
            );
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      results,
      totalOperations: actions.length,
      successfulOperations,
      failedOperations: actions.length - successfulOperations,
      errors
    };
  }

  /**
   * Estimates total execution time for actions
   */
  estimateExecutionTime(actions: AIAction[]): number {
    return actions.reduce((total, action) => {
      const strategy = this.findStrategy(action);
      const complexity = strategy.estimateComplexity(action);
      // Rough estimate: 1 complexity unit = 2 seconds
      return total + (complexity * 2000);
    }, 0);
  }

  /**
   * Gets operation statistics
   */
  getOperationStatistics(): Record<string, any> {
    return {
      registeredStrategies: this.strategies.length,
      strategyTypes: this.strategies.map(s => s.actionType),
      config: this.config
    };
  }

  private registerDefaultStrategies(): void {
    this.registerStrategy(new CreateFileStrategy());
    this.registerStrategy(new EditFileStrategy());
    this.registerStrategy(new DeleteFileStrategy());
    this.registerStrategy(new UnsupportedOperationStrategy());
  }

  private sortStrategiesByPriority(): void {
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  private findStrategy(action: AIAction): FileOperationStrategy {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(action)) {
        return strategy;
      }
    }

    // Should never happen if UnsupportedOperationStrategy is registered
    throw new Error(`No strategy found for action type: ${action.type}`);
  }

  private async executeWithRetry(
    action: AIAction,
    strategy: FileOperationStrategy,
    context: OperationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<OperationResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Execute with timeout
        return await this.executeWithTimeout(action, strategy, context, onProgress);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry validation errors or non-retryable errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  private async executeWithTimeout(
    action: AIAction,
    strategy: FileOperationStrategy,
    context: OperationContext,
    onProgress?: (progress: OperationProgress) => void
  ): Promise<OperationResult> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.config.operationTimeout}ms`));
      }, this.config.operationTimeout);

      strategy.execute(action, context, onProgress)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private isNonRetryableError(error: Error): boolean {
    // Don't retry validation errors, security errors, etc.
    const nonRetryablePatterns = [
      /validation/i,
      /security/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /already exists/i
    ];

    return nonRetryablePatterns.some(pattern => pattern.test(error.message));
  }

  private groupActionsByDependency(actions: AIAction[]): AIAction[][] {
    // Simple grouping by file path to avoid conflicts
    // In a more sophisticated implementation, this could analyze actual dependencies
    const groups = new Map<string, AIAction[]>();

    for (const action of actions) {
      const key = action.filePath || 'no-file';
      const existing = groups.get(key) || [];
      existing.push(action);
      groups.set(key, existing);
    }

    return Array.from(groups.values());
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}