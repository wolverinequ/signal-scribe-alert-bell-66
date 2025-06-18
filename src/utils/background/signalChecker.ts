
import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage, saveSignalsToStorage } from '@/utils/signalStorage';
import { checkSignalTime, hasSignalTimePassed } from '@/utils/signalUtils';
import { playBackgroundAudio } from './audioHandler';
import { dispatchSignalTriggered, dispatchSignalsUpdated } from './eventHandler';
import { getBackgroundTaskState, incrementIntervalCounter } from './taskState';

export const checkSignalsInBackground = async () => {
  try {
    const { intervalCounter } = getBackgroundTaskState();
    
    // Load current signals and settings
    const signals = loadSignalsFromStorage();
    const antidelaySeconds = loadAntidelayFromStorage();
    
    // Only check future signals that haven't been triggered
    const futureSignals = signals.filter(signal => {
      const isPast = hasSignalTimePassed(signal, antidelaySeconds);
      const isTriggered = signal.triggered;
      return !isPast && !isTriggered;
    });
    
    // Enhanced debug logging every 30 seconds to reduce spam
    if (intervalCounter % 30 === 0 && futureSignals.length > 0) {
      console.log(`🎯 BackgroundTask: Checking ${futureSignals.length} future signals at ${new Date().toLocaleTimeString()}`);
    }
    
    for (const signal of futureSignals) {
      // Check signal time but suppress the verbose logging
      const now = new Date();
      const currentTime = now.getTime();
      
      // Parse signal timestamp
      const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
      
      // Calculate target time with antidelay
      const signalDate = new Date();
      signalDate.setHours(signalHours, signalMinutes, 0, 0);
      
      // Subtract antidelay seconds
      const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
      const targetTimeMs = targetTime.getTime();
      
      // Use a tolerance window of ±2 seconds (2000ms)
      const toleranceMs = 2000;
      const timeDifference = Math.abs(currentTime - targetTimeMs);
      const withinTolerance = timeDifference <= toleranceMs;
      
      // Only log when signal is actually triggered (not every check)
      if (withinTolerance && !signal.triggered) {
        console.log('🔔 BackgroundTask: Signal time matched! Triggering audio:', signal.timestamp);
        
        // Play audio only (no notifications)
        await playBackgroundAudio(signal);
        
        // Mark signal as triggered and save back to storage immediately
        signal.triggered = true;
        const updatedSignals = signals.map(s => 
          s.timestamp === signal.timestamp ? { ...s, triggered: true } : s
        );
        saveSignalsToStorage(updatedSignals);
        
        // Dispatch events to notify UI about triggered signal
        dispatchSignalTriggered(signal);
        dispatchSignalsUpdated(updatedSignals);
        
        console.log('🔔 BackgroundTask: Signal processed and UI notified (audio only)');
      }
    }
  } catch (error) {
    console.error('🎯 BackgroundTask: Error checking signals:', error);
  }
};
