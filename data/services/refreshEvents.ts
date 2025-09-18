/**
 * Simple event emitter for triggering UI refreshes
 * This helps coordinate refreshes across different components
 */

type RefreshEventType = 'purchase-updated' | 'payment-added' | 'payment-deleted' | 'supplier-updated' | 'store-updated';

type RefreshEventListener = () => void;

class RefreshEventEmitter {
  private listeners: Map<RefreshEventType, RefreshEventListener[]> = new Map();

  on(event: RefreshEventType, listener: RefreshEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    console.log(`RefreshEventEmitter: Added listener for '${event}', total listeners: ${this.listeners.get(event)!.length}`);
  }

  off(event: RefreshEventType, listener: RefreshEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: RefreshEventType): void {
    console.log(`RefreshEventEmitter: Emitting event '${event}' to ${this.listeners.get(event)?.length || 0} listeners`);
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener());
    }
  }
}

// Global event emitter instance
export const refreshEvents = new RefreshEventEmitter();

// Convenience functions
export const emitPurchaseUpdated = () => refreshEvents.emit('purchase-updated');
export const emitPaymentAdded = () => refreshEvents.emit('payment-added');
export const emitPaymentDeleted = () => refreshEvents.emit('payment-deleted');
export const emitSupplierUpdated = () => refreshEvents.emit('supplier-updated');
export const emitStoreUpdated = () => refreshEvents.emit('store-updated');
