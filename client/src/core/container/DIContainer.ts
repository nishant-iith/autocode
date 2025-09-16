/**
 * Dependency Injection Container
 * Simple IoC container for managing dependencies
 */

export type Constructor<T = {}> = new (...args: any[]) => T;
export type Factory<T> = (...args: any[]) => T;

export interface ServiceDescriptor<T> {
  token: string | symbol;
  implementation?: Constructor<T>;
  factory?: Factory<T>;
  instance?: T;
  lifecycle: 'singleton' | 'transient';
  dependencies?: (string | symbol)[];
}

export interface IDIContainer {
  register<T>(descriptor: ServiceDescriptor<T>): void;
  registerSingleton<T>(token: string | symbol, implementation: Constructor<T>, dependencies?: (string | symbol)[]): void;
  registerTransient<T>(token: string | symbol, implementation: Constructor<T>, dependencies?: (string | symbol)[]): void;
  registerInstance<T>(token: string | symbol, instance: T): void;
  registerFactory<T>(token: string | symbol, factory: Factory<T>, dependencies?: (string | symbol)[]): void;
  resolve<T>(token: string | symbol): T;
  has(token: string | symbol): boolean;
  clear(): void;
}

export class DIContainer implements IDIContainer {
  private services = new Map<string | symbol, ServiceDescriptor<any>>();
  private instances = new Map<string | symbol, any>();

  register<T>(descriptor: ServiceDescriptor<T>): void {
    this.services.set(descriptor.token, descriptor);
  }

  registerSingleton<T>(
    token: string | symbol,
    implementation: Constructor<T>,
    dependencies: (string | symbol)[] = []
  ): void {
    this.register({
      token,
      implementation,
      lifecycle: 'singleton',
      dependencies
    });
  }

  registerTransient<T>(
    token: string | symbol,
    implementation: Constructor<T>,
    dependencies: (string | symbol)[] = []
  ): void {
    this.register({
      token,
      implementation,
      lifecycle: 'transient',
      dependencies
    });
  }

  registerInstance<T>(token: string | symbol, instance: T): void {
    this.register({
      token,
      instance,
      lifecycle: 'singleton'
    });
  }

  registerFactory<T>(
    token: string | symbol,
    factory: Factory<T>,
    dependencies: (string | symbol)[] = []
  ): void {
    this.register({
      token,
      factory,
      lifecycle: 'singleton',
      dependencies
    });
  }

  resolve<T>(token: string | symbol): T {
    const descriptor = this.services.get(token);
    if (!descriptor) {
      throw new Error(`Service ${String(token)} not registered`);
    }

    // Return existing instance for singletons
    if (descriptor.lifecycle === 'singleton') {
      const existingInstance = this.instances.get(token);
      if (existingInstance) {
        return existingInstance;
      }
    }

    // Create new instance
    const instance = this.createInstance(descriptor);

    // Cache singleton instances
    if (descriptor.lifecycle === 'singleton') {
      this.instances.set(token, instance);
    }

    return instance;
  }

  has(token: string | symbol): boolean {
    return this.services.has(token);
  }

  clear(): void {
    this.services.clear();
    this.instances.clear();
  }

  private createInstance<T>(descriptor: ServiceDescriptor<T>): T {
    // Use existing instance if provided
    if (descriptor.instance) {
      return descriptor.instance;
    }

    // Use factory if provided
    if (descriptor.factory) {
      const dependencies = this.resolveDependencies(descriptor.dependencies || []);
      return descriptor.factory(...dependencies);
    }

    // Use constructor
    if (descriptor.implementation) {
      const dependencies = this.resolveDependencies(descriptor.dependencies || []);
      return new descriptor.implementation(...dependencies);
    }

    throw new Error(`Cannot create instance for ${String(descriptor.token)}: no implementation, factory, or instance provided`);
  }

  private resolveDependencies(dependencies: (string | symbol)[]): any[] {
    return dependencies.map(dep => this.resolve(dep));
  }
}

// Service tokens as symbols for type safety
export const SERVICE_TOKENS = {
  FileService: Symbol('FileService'),
  EditorService: Symbol('EditorService'),
  ValidationService: Symbol('ValidationService'),
  EventBus: Symbol('EventBus'),
  AIActionParser: Symbol('AIActionParser'),
  AIFileOperations: Symbol('AIFileOperations'),
  AIContextManager: Symbol('AIContextManager'),
  Logger: Symbol('Logger'),
  ErrorHandler: Symbol('ErrorHandler')
} as const;

// Global container instance
export const container = new DIContainer();