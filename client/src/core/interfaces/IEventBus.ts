/**
 * Event Bus Interface
 * Defines contract for event-driven communication
 */

export interface EventHandler<T = any> {
  (data: T): void | Promise<void>;
}

export interface EventSubscription {
  unsubscribe(): void;
}

export interface DomainEvent {
  type: string;
  timestamp: Date;
  source: string;
  data: any;
}

// AI File Operation Events
export interface FileCreatedEvent extends DomainEvent {
  type: 'file.created';
  data: {
    filePath: string;
    content: string;
    workspaceId: string;
    source: 'ai' | 'user';
  };
}

export interface FileUpdatedEvent extends DomainEvent {
  type: 'file.updated';
  data: {
    filePath: string;
    content: string;
    workspaceId: string;
    source: 'ai' | 'user';
    previousContent?: string;
  };
}

export interface FileDeletedEvent extends DomainEvent {
  type: 'file.deleted';
  data: {
    filePath: string;
    workspaceId: string;
    source: 'ai' | 'user';
  };
}

export interface AIActionProcessedEvent extends DomainEvent {
  type: 'ai.action.processed';
  data: {
    actionType: string;
    filePath?: string;
    success: boolean;
    error?: string;
  };
}

export type AIEvent =
  | FileCreatedEvent
  | FileUpdatedEvent
  | FileDeletedEvent
  | AIActionProcessedEvent;

export interface IEventBus {
  /**
   * Emits an event to all subscribers
   */
  emit<T extends DomainEvent>(event: T): void;

  /**
   * Subscribes to events of a specific type
   */
  on<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T['data']>
  ): EventSubscription;

  /**
   * Subscribes to an event once (auto-unsubscribes after first call)
   */
  once<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T['data']>
  ): EventSubscription;

  /**
   * Removes all subscribers for an event type
   */
  off(eventType: string): void;

  /**
   * Clears all event subscriptions
   */
  clear(): void;

  /**
   * Gets current subscription count for debugging
   */
  getSubscriptionCount(eventType?: string): number;
}