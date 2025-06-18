
import { useEffect, useCallback, useRef } from 'react';
import { 
  startBackgroundTask, 
  stopBackgroundTask, 
  scheduleAllSignalNotifications,
  registerRingManagerCallback,
  unregisterRingManagerCallback
} from '@/utils/backgroundTaskManager';
import { useSignalState } from './useSignalState';
import { useRingManager } from './useRingManager';
import { useAntidelayManager } from './useAntidelayManager';
import { useAudioManager } from './useAudioManager';

export const useSignalTracker = () => {
  const registeredRef = useRef(false);
  const backgroundTaskStartedRef = useRef(false);

  const {
    signalsText,
    setSignalsText,
    savedSignals,
    antidelaySeconds,
    setAntidelaySeconds,
    saveButtonPressed,
    customRingtone,
    setCustomRingtone,
    handleSaveSignals,
    updateSignalTriggered
  } = useSignalState();

  const { triggerRingtoneSelection, clearCustomRingtone } = useAudioManager(setCustomRingtone);

  // Stabilize triggerRing function reference with useCallback
  const {
    ringOffButtonPressed,
    handleRingOff,
    triggerRing
  } = useRingManager(customRingtone, updateSignalTriggered);

  // Memoize triggerRing to prevent infinite re-renders
  const stableTriggerRing = useCallback(triggerRing, [triggerRing]);

  const {
    showAntidelayDialog,
    antidelayInput,
    setAntidelayInput,
    setRingButtonPressed,
    handleSetRingMouseDown,
    handleSetRingMouseUp,
    handleSetRingMouseLeave,
    handleAntidelaySubmit,
    handleAntidelayCancel
  } = useAntidelayManager(savedSignals, antidelaySeconds, setAntidelaySeconds, triggerRingtoneSelection, clearCustomRingtone);

  // Register ring manager callback with stable reference (Step 1 fix)
  useEffect(() => {
    if (stableTriggerRing && !registeredRef.current) {
      console.log('🎯 SignalTracker: Registering ring manager callback (stable)');
      registerRingManagerCallback(stableTriggerRing);
      registeredRef.current = true;
      
      return () => {
        console.log('🎯 SignalTracker: Unregistering ring manager callback (cleanup)');
        unregisterRingManagerCallback();
        registeredRef.current = false;
      };
    }
  }, [stableTriggerRing]);

  // Start background task only once with proper cleanup (Step 1 & 4 fix)
  useEffect(() => {
    if (!backgroundTaskStartedRef.current) {
      console.log('🎯 SignalTracker: Starting unified background system (one-time)');
      
      // Start the background task
      startBackgroundTask();
      backgroundTaskStartedRef.current = true;
      
      // Schedule notifications for existing signals
      if (savedSignals.length > 0) {
        scheduleAllSignalNotifications(savedSignals);
      }

      return () => {
        console.log('🎯 SignalTracker: Stopping unified background system (cleanup)');
        stopBackgroundTask();
        backgroundTaskStartedRef.current = false;
      };
    }
  }, []); // Empty dependency array to run only once

  // Schedule notifications when signals change (Step 4 optimization)
  useEffect(() => {
    if (savedSignals.length > 0 && backgroundTaskStartedRef.current) {
      scheduleAllSignalNotifications(savedSignals);
    }
  }, [savedSignals]);

  return {
    signalsText,
    setSignalsText,
    saveButtonPressed,
    ringOffButtonPressed,
    setRingButtonPressed,
    showAntidelayDialog,
    antidelayInput,
    setAntidelayInput,
    antidelaySeconds,
    handleRingOff,
    handleSaveSignals,
    handleSetRingMouseDown,
    handleSetRingMouseUp,
    handleSetRingMouseLeave,
    handleAntidelaySubmit,
    handleAntidelayCancel
  };
};
