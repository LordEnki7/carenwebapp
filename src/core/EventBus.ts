/**
 * C.A.R.E.N. Event Bus
 * Handles inter-module communication
 */

export interface ModuleEvent {
  type: string;
  payload: any;
  module: string;
  timestamp: number;
}

export type EventHandler = (event: ModuleEvent) => void;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  
  emit(event: Omit<ModuleEvent, 'timestamp'>): void {
    const fullEvent: ModuleEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    const eventHandlers = this.handlers.get(event.type);
    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(fullEvent);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }
  }
  
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }
  
  unsubscribe(eventType: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      eventHandlers.delete(handler);
      if (eventHandlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }
  
  clear(): void {
    this.handlers.clear();
  }
  
  getSubscriberCount(eventType: string): number {
    return this.handlers.get(eventType)?.size || 0;
  }
}

export const eventBus = new EventBus();
