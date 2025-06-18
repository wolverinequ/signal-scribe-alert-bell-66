
import { useEffect } from 'react';
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

  const {
    ringOffButtonPressed,
    handleRingOff,
    triggerRing
  } = useRingManager(customRingtone, updateSignalTriggered);

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

  // Register ring manager callback with background task for unified communication
  useEffect(() => {
    if (triggerRing) {
      console.log('🎯 SignalTracker: Registering ring manager callback with background task');
      registerRingManagerCallback(triggerRing);
      
      return () => {
        console.log('🎯 SignalTracker: Unregistering ring manager callback');
        unregisterRingManagerCallback();
      };
    }
  }, [triggerRing]);

  // Start unified background task when app loads and signals exist
  useEffect(() => {
    console.log('🎯 SignalTracker: Starting unified background system for', savedSignals.length, 'signals');
    
    // Always start the background task - it will handle both foreground and background scenarios
    startBackgroundTask();
    
    if (savedSignals.length > 0) {
      scheduleAllSignalNotifications(savedSignals);
    }

    return () => {
      console.log('🎯 SignalTracker: Stopping unified background system');
      stopBackgroundTask();
    };
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
