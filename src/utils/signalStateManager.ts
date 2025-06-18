
import { Signal } from '@/types/signal';
import { saveSignalsToStorage, loadSignalsFromStorage } from './signalStorage';

type SignalUpdateListener = (signals: Signal[]) => void;
type SignalTriggeredListener = (signal: Signal) => void;

class SignalStateManager {
  private signals: Signal[] = [];
  private updateListeners: Set<SignalUpdateListener> = new Set();
  private triggeredListeners: Set<SignalTriggeredListener> = new Set();
  
  constructor() {
    this.loadInitialSignals();
    this.setupStorageSync();
  }

  private loadInitialSignals() {
    this.signals = loadSignalsFromStorage();
    console.log('🔄 SignalStateManager: Loaded initial signals:', this.signals.length);
  }

  private setupStorageSync() {
    // Listen for storage changes from other tabs/instances
    window.addEventListener('storage', (event) => {
      if (event.key === 'binary_signals' && event.newValue) {
        try {
          const newSignals = JSON.parse(event.newValue);
          this.signals = newSignals;
          this.notifyUpdateListeners();
          console.log('🔄 SignalStateManager: Synced signals from storage event');
        } catch (error) {
          console.error('🔄 SignalStateManager: Error parsing storage event:', error);
        }
      }
    });

    // Listen for custom events from background task
    window.addEventListener('signal-triggered', (event: CustomEvent) => {
      const triggeredSignal = event.detail;
      this.markSignalTriggered(triggeredSignal);
      console.log('🔄 SignalStateManager: Received signal-triggered event:', triggeredSignal.timestamp);
    });

    // Listen for signal updates from background
    window.addEventListener('signals-updated', (event: CustomEvent) => {
      const updatedSignals = event.detail;
      this.updateSignals(updatedSignals, false); // false = don't save to storage (already saved by background)
      console.log('🔄 SignalStateManager: Received signals-updated event');
    });
  }

  // Get current signals
  getSignals(): Signal[] {
    return [...this.signals];
  }

  // Update all signals and notify listeners
  updateSignals(newSignals: Signal[], saveToStorage: boolean = true): void {
    this.signals = [...newSignals];
    
    if (saveToStorage) {
      saveSignalsToStorage(this.signals);
      // Dispatch event for background task
      window.dispatchEvent(new CustomEvent('ui-signals-updated', { 
        detail: this.signals 
      }));
    }
    
    this.notifyUpdateListeners();
    console.log('🔄 SignalStateManager: Updated signals:', {
      count: this.signals.length,
      savedToStorage: saveToStorage
    });
  }

  // Mark a specific signal as triggered
  markSignalTriggered(targetSignal: Signal): void {
    const updatedSignals = this.signals.map(signal => {
      if (signal.timestamp === targetSignal.timestamp) {
        console.log('🔄 SignalStateManager: Marking signal as triggered:', {
          timestamp: signal.timestamp,
          wasTriggered: signal.triggered,
          nowTriggered: true
        });
        return { ...signal, triggered: true };
      }
      return signal;
    });

    // Update internal state and save immediately
    this.signals = updatedSignals;
    saveSignalsToStorage(this.signals);
    
    // Notify all listeners
    this.notifyUpdateListeners();
    this.notifyTriggeredListeners(targetSignal);
    
    // Dispatch event for background task synchronization
    window.dispatchEvent(new CustomEvent('ui-signal-triggered', { 
      detail: targetSignal 
    }));

    console.log('🔄 SignalStateManager: Signal marked as triggered and saved');
  }

  // Subscribe to signal updates
  onSignalsUpdate(listener: SignalUpdateListener): () => void {
    this.updateListeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.updateListeners.delete(listener);
    };
  }

  // Subscribe to signal triggered events
  onSignalTriggered(listener: SignalTriggeredListener): () => void {
    this.triggeredListeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.triggeredListeners.delete(listener);
    };
  }

  private notifyUpdateListeners(): void {
    this.updateListeners.forEach(listener => {
      try {
        listener(this.signals);
      } catch (error) {
        console.error('🔄 SignalStateManager: Error in update listener:', error);
      }
    });
  }

  private notifyTriggeredListeners(signal: Signal): void {
    this.triggeredListeners.forEach(listener => {
      try {
        listener(signal);
      } catch (error) {
        console.error('🔄 SignalStateManager: Error in triggered listener:', error);
      }
    });
  }

  // Force reload from storage (useful for debugging)
  reloadFromStorage(): void {
    this.loadInitialSignals();
    this.notifyUpdateListeners();
    console.log('🔄 SignalStateManager: Reloaded signals from storage');
  }
}

// Create singleton instance
export const signalStateManager = new SignalStateManager();
