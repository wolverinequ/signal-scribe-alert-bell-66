
import { useEffect } from 'react';
import { 
  startBackgroundTask, 
  stopBackgroundTask, 
  scheduleAllSignalNotifications 
} from '@/utils/backgroundTaskManager';
import { useSignalState } from './useSignalState';
import { useRingManager } from './useRingManager';
import { useAntidelayManager } from './useAntidelayManager';

export const useSignalTracker = () => {
  const {
    signalsText,
    setSignalsText,
    savedSignals,
    antidelaySeconds,
    setAntidelaySeconds,
    saveButtonPressed,
    handleSaveSignals,
    updateSignalTriggered
  } = useSignalState();

  const {
    ringOffButtonPressed,
    handleRingOff
  } = useRingManager(savedSignals, antidelaySeconds, updateSignalTriggered);

  const {
    showAntidelayDialog,
    antidelayInput,
    setAntidelayInput,
    setRingButtonPressed,
    handleSetRingMouseDown,
    handleSetRingMouseUp,
    handleSetRingMouseLeave,
    handleAntidelaySubmit,
    handleAntidelayCancel,
    // Expose these values for ringtone selection dialog
    ringtoneDialogOpen,
    setRingtoneDialogOpen,
    handleSelectCustomSound,
    handleSelectDefaultSound,
  } = useAntidelayManager(savedSignals, antidelaySeconds, setAntidelaySeconds);

  // Start background task when app loads and signals exist
  useEffect(() => {
    if (savedSignals.length > 0) {
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
    handleAntidelayCancel,
    // Ringtone dialog props needed in Index.tsx:
    ringtoneDialogOpen,
    setRingtoneDialogOpen,
    handleSelectCustomSound,
    handleSelectDefaultSound,
  };
};

