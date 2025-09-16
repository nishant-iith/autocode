/**
 * Service Integration Layer
 * Coordinates all core services and provides a unified interface
 * Implements dependency injection and service lifecycle management
 */

import { DIContainer } from '../container/DIContainer';
import { IFileService } from '../interfaces/IFileService';
import { IEditorService } from '../interfaces/IEditorService';
import { IValidationService } from '../interfaces/IValidationService';
import { IEventBus } from '../interfaces/IEventBus';
import { ErrorHandlingService, ILogger, ConsoleLogger } from './ErrorHandlingService';
import { FileService } from './implementations/FileService';
import { EditorService } from './implementations/EditorService';
import { ValidationService } from './implementations/ValidationService';
import { EventBusService, EnhancedEventBusService, LoggingMiddleware, ValidationMiddleware } from './EventBusService';
import { FileOperationOrchestrator, OrchestratorConfig } from '../strategies/FileOperationOrchestrator';

// Service tokens for dependency injection
export const SERVICE_TOKENS = {
  LOGGER: Symbol('ILogger'),
  ERROR_HANDLER: Symbol('ErrorHandlingService'),
  EVENT_BUS: Symbol('IEventBus'),
  VALIDATION_SERVICE: Symbol('IValidationService'),
  FILE_SERVICE: Symbol('IFileService'),
  EDITOR_SERVICE: Symbol('IEditorService'),
  FILE_ORCHESTRATOR: Symbol('FileOperationOrchestrator')
} as const;

export interface ServiceConfiguration {
  fileServiceBaseUrl?: string;
  orchestratorConfig?: OrchestratorConfig;
  enableEventMiddleware?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Central service integration and configuration
 */
export class ServiceIntegration {
  private container: DIContainer;
  private isInitialized = false;

  constructor(private config: ServiceConfiguration = {}) {
    this.container = new DIContainer();
  }

  /**
   * Initialize all services with proper dependencies
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Services already initialized');
    }

    try {
      // Register core services
      this.registerCoreServices();

      // Register business services
      this.registerBusinessServices();

      // Register orchestration services
      this.registerOrchestrationServices();

      // Setup event middleware
      this.setupEventMiddleware();

      // Validate service configuration
      await this.validateServices();

      this.isInitialized = true;

      const logger = this.getLogger();
      logger.info('Service integration initialized successfully', {
        servicesCount: this.getServiceCount(),
        configuration: this.config
      });
    } catch (error) {
      const logger = this.container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
      logger?.error('Failed to initialize services', { error });
      throw error;
    }
  }

  /**
   * Get a service instance by token
   */
  getService<T>(token: symbol): T {
    if (!this.isInitialized) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return this.container.resolve<T>(token);
  }

  /**
   * Get logger instance
   */
  getLogger(): ILogger {
    return this.getService<ILogger>(SERVICE_TOKENS.LOGGER);
  }

  /**
   * Get event bus instance
   */
  getEventBus(): IEventBus {
    return this.getService<IEventBus>(SERVICE_TOKENS.EVENT_BUS);
  }

  /**
   * Get file operation orchestrator
   */
  getFileOrchestrator(): FileOperationOrchestrator {
    return this.getService<FileOperationOrchestrator>(SERVICE_TOKENS.FILE_ORCHESTRATOR);
  }

  /**
   * Dispose all services and clean up resources
   */
  async dispose(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const logger = this.getLogger();
      logger.info('Disposing services...');

      // Clean up event bus
      const eventBus = this.getEventBus();
      eventBus.clear();

      // Clear container
      this.container.clear();

      this.isInitialized = false;

      // Use console log since logger is disposed
      console.log('Service integration disposed successfully');
    } catch (error) {
      console.error('Error disposing services:', error);
      throw error;
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(): Record<string, any> {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }

    try {
      const logger = this.getLogger();
      const eventBus = this.getEventBus();
      const fileOrchestrator = this.getFileOrchestrator();

      return {
        status: 'healthy',
        initialized: this.isInitialized,
        services: {
          logger: !!logger,
          eventBus: !!eventBus,
          fileOrchestrator: !!fileOrchestrator
        },
        eventStatistics: eventBus.getEventStatistics(),
        orchestratorStatistics: fileOrchestrator.getOperationStatistics(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private registerCoreServices(): void {
    // Logger (singleton)
    this.container.registerSingleton(SERVICE_TOKENS.LOGGER, ConsoleLogger);

    // Event Bus (singleton)
    this.container.registerFactory(SERVICE_TOKENS.EVENT_BUS, (container) => {
      const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
      if (this.config.enableEventMiddleware) {
        const eventBus = new EnhancedEventBusService();
        eventBus.addMiddleware(new LoggingMiddleware(logger));
        eventBus.addMiddleware(new ValidationMiddleware());
        return eventBus;
      }
      return new EventBusService();
    });

    // Error Handler (singleton)
    this.container.registerFactory(SERVICE_TOKENS.ERROR_HANDLER, (container) => {
      const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
      return new ErrorHandlingService(logger);
    });
  }

  private registerBusinessServices(): void {
    // Validation Service (singleton)
    this.container.registerFactory(SERVICE_TOKENS.VALIDATION_SERVICE, (container) => {
      const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
      return new ValidationService(logger);
    });

    // File Service (singleton)
    this.container.registerFactory(SERVICE_TOKENS.FILE_SERVICE, (container) => {
      const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
      const errorHandler = container.resolve<ErrorHandlingService>(SERVICE_TOKENS.ERROR_HANDLER);
      return new FileService(
        this.config.fileServiceBaseUrl || 'http://localhost:5000/api',
        errorHandler,
        logger
      );
    });

    // Editor Service (singleton)
    this.container.registerFactory(SERVICE_TOKENS.EDITOR_SERVICE, (container) => {
      const logger = container.resolve<ILogger>(SERVICE_TOKENS.LOGGER);
      return new EditorService(logger);
    });
  }

  private registerOrchestrationServices(): void {
    // File Operation Orchestrator (singleton)
    this.container.registerFactory(SERVICE_TOKENS.FILE_ORCHESTRATOR, (container) => {
      return new FileOperationOrchestrator(this.config.orchestratorConfig);
    });
  }

  private setupEventMiddleware(): void {
    if (!this.config.enableEventMiddleware) return;

    const eventBus = this.getService<EnhancedEventBusService>(SERVICE_TOKENS.EVENT_BUS);
    const logger = this.getLogger();

    // Add custom middleware if needed
    eventBus.addMiddleware(new LoggingMiddleware(logger));
    eventBus.addMiddleware(new ValidationMiddleware());

    logger.debug('Event middleware configured', {
      middlewareCount: 2
    });
  }

  private async validateServices(): Promise<void> {
    const logger = this.getLogger();
    const validationService = this.getService<IValidationService>(SERVICE_TOKENS.VALIDATION_SERVICE);

    // Test validation service
    const testValidation = validationService.validateUserInput('test', 'message');
    if (!testValidation.isValid) {
      throw new Error('Validation service is not working correctly');
    }

    logger.debug('Service validation completed successfully');
  }

  private getServiceCount(): number {
    return Object.keys(SERVICE_TOKENS).length;
  }
}

/**
 * Global service instance (singleton pattern)
 */
let globalServiceIntegration: ServiceIntegration | null = null;

/**
 * Get or create global service integration instance
 */
export function getServiceIntegration(config?: ServiceConfiguration): ServiceIntegration {
  if (!globalServiceIntegration) {
    globalServiceIntegration = new ServiceIntegration(config);
  }
  return globalServiceIntegration;
}

/**
 * Initialize global services
 */
export async function initializeServices(config?: ServiceConfiguration): Promise<ServiceIntegration> {
  const services = getServiceIntegration(config);
  if (!services['isInitialized']) {
    await services.initialize();
  }
  return services;
}

/**
 * Dispose global services
 */
export async function disposeServices(): Promise<void> {
  if (globalServiceIntegration) {
    await globalServiceIntegration.dispose();
    globalServiceIntegration = null;
  }
}

/**
 * Create operation context for file operations
 */
export function createOperationContext(workspaceId: string, userId?: string) {
  const services = getServiceIntegration();

  return {
    workspaceId,
    userId,
    fileService: services.getService<IFileService>(SERVICE_TOKENS.FILE_SERVICE),
    editorService: services.getService<IEditorService>(SERVICE_TOKENS.EDITOR_SERVICE),
    validationService: services.getService<IValidationService>(SERVICE_TOKENS.VALIDATION_SERVICE),
    eventBus: services.getService<IEventBus>(SERVICE_TOKENS.EVENT_BUS),
    errorHandler: services.getService<ErrorHandlingService>(SERVICE_TOKENS.ERROR_HANDLER)
  };
}