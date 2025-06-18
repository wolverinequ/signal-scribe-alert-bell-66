
// Event-driven communication with UI
export const setupEventCommunication = () => {
  // Listen for UI signal updates
  window.addEventListener('ui-signals-updated', (event: CustomEvent) => {
    const updatedSignals = event.detail;
    console.log('🎯 BackgroundTask: UI signals update received:', updatedSignals.length);
  });

  // Listen for UI signal triggered events
  window.addEventListener('ui-signal-triggered', (event: CustomEvent) => {
    const triggeredSignal = event.detail;
    console.log('🎯 BackgroundTask: UI signal triggered event received');
  });
};

export const dispatchSignalTriggered = (signal: any) => {
  window.dispatchEvent(new CustomEvent('signal-triggered', { 
    detail: signal 
  }));
};

export const dispatchSignalsUpdated = (signals: any[]) => {
  window.dispatchEvent(new CustomEvent('signals-updated', { 
    detail: signals 
  }));
};
