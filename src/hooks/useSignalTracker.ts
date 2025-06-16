
import { useEffect } from 'react';
import { 
  startBackgroundTask, 
  stopBackgroundTask, 
  scheduleAllSignalNotifications 
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

  console.log('🎯 SignalTracker: Current custom ringtone state:', customRingtone);

  const { triggerRingtoneSelection, useDefaultSound } = useAudioManager(setCustomRingtone);

  const {
    ringOffButtonPressed,
    handleRingOff
  } = useRingManager(savedSignals, antidelaySeconds, customRingtone, updateSignalTriggered);

  const {
    showAntidelayDialog,
    showRingSelectionDialog,
    antidelayInput,
    setAntidelayInput,
    setRingButtonPressed,
    handleSetRingMouseDown,
    handleSetRingMouseUp,
    handleSetRingMouseLeave,
    handleRingSelectionClose,
    handleUseDefaultSound,
    handleSetCustomSound,
    handleAntidelaySubmit,
    handleAntidelayCancel
  } = useAntidelayManager(savedSignals, antidelaySeconds, setAntidelaySeconds, triggerRingtoneSelection, useDefaultSound);

  // Start background task when app loads and signals exist
  useEffect(() => {
    if (savedSignals.length > 0) {
      console.log('🎯 SignalTracker: Starting background task for', savedSignals.length, 'signals');
      startBackgroundTask();
      scheduleAllSignalNotifications(savedSignals);
      
      // Register service worker for background sync
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'REGISTER_BACKGROUND_SYNC'
        });
      }
    }

    return () => {
      console.log('🎯 SignalTracker: Stopping background task');
      stopBackgroundTask();
    };
  }, [savedSignals]);

  // Log custom ringtone changes for debugging
  useEffect(() => {
    console.log('🎯 SignalTracker: Custom ringtone changed to:', customRingtone);
  }, [customRingtone]);

  return {
    signalsText,
    setSignalsText,
    saveButtonPressed,
    ringOffButtonPressed,
    setRingButtonPressed,
    showAntidelayDialog,
    showRingSelectionDialog,
    antidelayInput,
    setAntidelayInput,
    antidelaySeconds,
    handleRingOff,
    handleSaveSignals,
    handleSetRingMouseDown,
    handleSetRingMouseUp,
    handleSetRingMouseLeave,
    handleRingSelectionClose,
    handleUseDefaultSound,
    handleSetCustomSound,
    handleAntidelaySubmit,
    handleAntidelayCancel
  };
};
