
import { useState } from 'react';
import { useAudioManager } from './useAudioManager';
import { useSignalState } from './useSignalState';
import { useAntidelayDialog } from './useAntidelayDialog';
import { useRingManager } from './useRingManager';
import { useSignalScheduler } from './useSignalScheduler';

export const useSignalTracker = () => {
  const [setRingButtonPressed, setSetRingButtonPressed] = useState(false);
  const { customRingtone, triggerRingtoneSelection } = useAudioManager();
  
  const {
    signalsText,
    setSignalsText,
    savedSignals,
    antidelaySeconds,
    setAntidelaySeconds,
    saveButtonPressed,
    handleSaveSignals,
    updateSignals
  } = useSignalState();

  const {
    triggerRing,
    handleRingOff,
    ringOffButtonPressed
  } = useRingManager(customRingtone);

  const {
    showAntidelayDialog,
    antidelayInput,
    setAntidelayInput,
    handleLongPressStart,
    handleLongPressEnd,
    handleLongPressCancel,
    handleAntidelaySubmit,
    handleAntidelayCancel
  } = useAntidelayDialog(antidelaySeconds, setAntidelaySeconds, savedSignals);

  // Set up signal scheduling
  useSignalScheduler(savedSignals, updateSignals, antidelaySeconds, triggerRing, customRingtone);

  // Set Ring button handlers
  const handleSetRingMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSetRingButtonPressed(true);
    handleLongPressStart();
  };

  const handleSetRingMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSetRingButtonPressed(false);
    
    const shouldTriggerRingtone = handleLongPressEnd();
    
    // If it wasn't a long press and dialog is not showing, trigger ringtone selection
    if (shouldTriggerRingtone) {
      triggerRingtoneSelection();
    }
  };

  const handleSetRingMouseLeave = () => {
    setSetRingButtonPressed(false);
    handleLongPressCancel();
  };

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
