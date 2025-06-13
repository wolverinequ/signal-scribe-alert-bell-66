// Communication utilities for inter-app messaging
export class SignalCommunicator {
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    // Initialize BroadcastChannel for same-origin communication
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('signal-tracker');
    }
  }

  // Send notification that signal is about to ring (5 seconds before)
  notifyAboutToRing(signal: any, secondsUntilRing: number) {
    const message = {
      type: 'ABOUT_TO_RING',
      signal,
      secondsUntilRing,
      timestamp: Date.now()
    };

    this.sendBroadcast(message);
    this.sendToLocalStorage(message);
    this.sendSystemNotification('Signal about to ring', `${signal.asset} in ${secondsUntilRing} seconds`);
  }

  // Send notification that signal is currently ringing
  notifyRinging(signal: any) {
    const message = {
      type: 'RINGING',
      signal,
      timestamp: Date.now()
    };

    this.sendBroadcast(message);
    this.sendToLocalStorage(message);
    this.sendSystemNotification('Signal Ringing', `${signal.asset} - ${signal.direction}`);
    this.dispatchCustomEvent(message);
  }

  // Send notification that ringing has stopped
  notifyRingStopped() {
    const message = {
      type: 'RING_STOPPED',
      timestamp: Date.now()
    };

    this.sendBroadcast(message);
    this.sendToLocalStorage(message);
    this.dispatchCustomEvent(message);
  }

  private sendBroadcast(message: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
        console.log('Broadcast sent:', message);
      } catch (error) {
        console.log('Broadcast error:', error);
      }
    }
  }

  private sendToLocalStorage(message: any) {
    try {
      const key = `signal-tracker-event-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(message));
      
      // Clean up old events (keep only last 10)
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith('signal-tracker-event-'));
      if (allKeys.length > 10) {
        allKeys.sort().slice(0, -10).forEach(key => localStorage.removeItem(key));
      }
      
      console.log('LocalStorage event stored:', message);
    } catch (error) {
      console.log('LocalStorage error:', error);
    }
  }

  private sendSystemNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/placeholder.svg',
          tag: 'signal-tracker-ring',
          requireInteraction: true
        });
        
        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
        console.log('System notification sent:', title);
      } catch (error) {
        console.log('Notification error:', error);
      }
    }
  }

  private dispatchCustomEvent(message: any) {
    try {
      const event = new CustomEvent('signal-tracker-event', {
        detail: message,
        bubbles: true
      });
      window.dispatchEvent(event);
      console.log('Custom event dispatched:', message);
    } catch (error) {
      console.log('Custom event error:', error);
    }
  }

  cleanup() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }
}

export const signalCommunicator = new SignalCommunicator();
