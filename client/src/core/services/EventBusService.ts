/**
 * Event Bus Service Implementation
 * Provides event-driven communication between components
 */

import {
  IEventBus,
  EventHandler,
  EventSubscription,
  DomainEvent,
  AIEvent
} from '../interfaces/IEventBus';

interface Subscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  once: boolean;
}

export class EventBusService implements IEventBus {
  private subscriptions = new Map<string, Subscription[]>();
  private subscriptionCounter = 0;
  private eventHistory: DomainEvent[] = [];
  private maxHistorySize = 1000;

  emit<T extends DomainEvent>(event: T): void {
    // Validate event structure
    this.validateEvent(event);

    // Add to history
    this.addToHistory(event);

    // Get subscribers for this event type
    const subscribers = this.subscriptions.get(event.type) || [];

    // Process subscribers
    const toRemove: string[] = [];

    for (const subscription of subscribers) {
      try {
        // Execute handler
        const result = subscription.handler(event.data);

        // Handle async results
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Error in event handler for ${event.type}:`, error);
          });
        }

        // Remove once subscriptions
        if (subscription.once) {
          toRemove.push(subscription.id);
        }
      } catch (error) {
        console.error(`Synchronous error in event handler for ${event.type}:`, error);
      }
    }

    // Remove once subscriptions
    if (toRemove.length > 0) {
      this.removeSubscriptions(event.type, toRemove);
    }
  }

  on<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T['data']>
  ): EventSubscription {
    return this.subscribe(eventType, handler, false);
  }

  once<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T['data']>
  ): EventSubscription {
    return this.subscribe(eventType, handler, true);
  }

  off(eventType: string): void {
    this.subscriptions.delete(eventType);
  }

  clear(): void {
    this.subscriptions.clear();
    this.eventHistory = [];
  }

  getSubscriptionCount(eventType?: string): number {
    if (eventType) {
      return this.subscriptions.get(eventType)?.length || 0;
    }

    let total = 0;
    for (const subscribers of this.subscriptions.values()) {
      total += subscribers.length;
    }
    return total;
  }

  /**
   * Gets event history for debugging
   */
  getEventHistory(): readonly DomainEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Gets event statistics
   */
  getEventStatistics(): Record<string, any> {
    const totalEvents = this.eventHistory.length;
    const eventsByType = this.eventHistory.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySource = this.eventHistory.reduce((acc, event) => {
      acc[event.source] = (acc[event.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentEvents = this.eventHistory
      .filter(event => Date.now() - event.timestamp.getTime() < 60000) // Last minute
      .length;

    return {
      totalEvents,
      eventsByType,
      eventsBySource,
      recentEvents,
      activeSubscriptions: this.getSubscriptionCount()
    };
  }

  /**
   * Clears old events from history
   */
  clearOldEvents(olderThanMs = 3600000): void { // Default 1 hour
    const cutoffTime = Date.now() - olderThanMs;
    this.eventHistory = this.eventHistory.filter(
      event => event.timestamp.getTime() > cutoffTime
    );
  }

  private subscribe(
    eventType: string,
    handler: EventHandler,
    once: boolean
  ): EventSubscription {
    const subscriptionId = `sub_${++this.subscriptionCounter}`;

    const subscription: Subscription = {
      id: subscriptionId,
      eventType,
      handler,
      once
    };

    // Add to subscriptions map
    const existing = this.subscriptions.get(eventType) || [];
    existing.push(subscription);
    this.subscriptions.set(eventType, existing);

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        this.removeSubscriptions(eventType, [subscriptionId]);
      }
    };
  }

  private removeSubscriptions(eventType: string, subscriptionIds: string[]): void {
    const existing = this.subscriptions.get(eventType);
    if (!existing) return;

    const filtered = existing.filter(sub => !subscriptionIds.includes(sub.id));

    if (filtered.length === 0) {
      this.subscriptions.delete(eventType);
    } else {
      this.subscriptions.set(eventType, filtered);
    }
  }

  private validateEvent(event: DomainEvent): void {
    if (!event.type) {
      throw new Error('Event must have a type');
    }

    if (!event.timestamp) {
      throw new Error('Event must have a timestamp');
    }

    if (!event.source) {
      throw new Error('Event must have a source');
    }
  }

  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event);

    // Maintain max history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

/**
 * Event Factory for creating standardized events
 */
export class EventFactory {
  static createFileCreatedEvent(
    filePath: string,
    content: string,
    workspaceId: string,
    source: 'ai' | 'user' = 'user'
  ): AIEvent {
    return {
      type: 'file.created',
      timestamp: new Date(),
      source,
      data: {
        filePath,
        content,
        workspaceId,
        source
      }
    };
  }

  static createFileUpdatedEvent(
    filePath: string,
    content: string,
    workspaceId: string,
    source: 'ai' | 'user' = 'user',
    previousContent?: string
  ): AIEvent {
    return {
      type: 'file.updated',
      timestamp: new Date(),
      source,
      data: {
        filePath,
        content,
        workspaceId,
        source,
        previousContent
      }
    };
  }

  static createFileDeletedEvent(
    filePath: string,
    workspaceId: string,
    source: 'ai' | 'user' = 'user'
  ): AIEvent {
    return {
      type: 'file.deleted',
      timestamp: new Date(),
      source,
      data: {
        filePath,
        workspaceId,
        source
      }
    };
  }

  static createAIActionProcessedEvent(
    actionType: string,
    success: boolean,
    filePath?: string,
    error?: string
  ): AIEvent {
    return {
      type: 'ai.action.processed',
      timestamp: new Date(),
      source: 'ai',
      data: {
        actionType,
        filePath,
        success,
        error
      }
    };
  }
}

/**
 * Event middleware for processing events before emission
 */
export interface EventMiddleware {
  process<T extends DomainEvent>(event: T): T | null; // Return null to prevent emission
}

export class LoggingMiddleware implements EventMiddleware {
  constructor(private logger?: { info: (msg: string, data?: any) => void }) {}

  process<T extends DomainEvent>(event: T): T {
    if (this.logger) {
      this.logger.info(`Event emitted: ${event.type}`, {
        source: event.source,
        timestamp: event.timestamp,
        data: event.data
      });
    } else {
      console.log(`Event emitted: ${event.type}`, event);
    }
    return event;
  }
}

export class ValidationMiddleware implements EventMiddleware {
  process<T extends DomainEvent>(event: T): T | null {
    // Basic validation
    if (!event.type || !event.timestamp || !event.source) {
      console.error('Invalid event structure:', event);
      return null;
    }

    // Event-specific validation
    if (event.type.startsWith('file.') && !event.data?.filePath) {
      console.error('File events must have filePath in data');
      return null;
    }

    return event;
  }
}

/**
 * Enhanced Event Bus with middleware support
 */
export class EnhancedEventBusService extends EventBusService {
  private middleware: EventMiddleware[] = [];

  addMiddleware(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middleware.indexOf(middleware);
    if (index > -1) {
      this.middleware.splice(index, 1);
    }
  }

  emit<T extends DomainEvent>(event: T): void {
    let processedEvent: T | null = event;

    // Process through middleware chain
    for (const middleware of this.middleware) {
      if (processedEvent === null) break;
      processedEvent = middleware.process(processedEvent) as T;
    }

    // Emit if not filtered out
    if (processedEvent !== null) {
      super.emit(processedEvent);
    }
  }
}