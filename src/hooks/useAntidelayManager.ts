
import { useState, useRef } from 'react';
import { scheduleAllSignalNotifications } from '@/utils/backgroundTaskManager';
import { Signal } from '@/types/signal';
import { useAudioManager } from './useAudioManager';

export const useAntidelayManager = (
  savedSignals: Signal[],
  antidelaySeconds: number,
  setAntidelaySeconds: (seconds: number) => void
) => {
  const [showAntidelayDialog, setShowAntidelayDialog] = useState(false);
  const [antidelayInput, setAntidelayInput] = useState('');
  const [setRingButtonPressed, setSetRingButtonPressed] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const { 
    showRingtoneDialog, 
    openRingtoneDialog, 
    closeRingtoneDialog,
    triggerRingtoneSelection,
    selectDefaultSound
  } = useAudioManager();

  // Set Ring button handlers
  const handleSetRingMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSetRingButtonPressed(true);
    isLongPressRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // Long press detected - show antidelay dialog
      setShowAntidelayDialog(true);
      setAntidelayInput(antidelaySeconds.toString());
    }, 3000);
  };

  const handleSetRingMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSetRingButtonPressed(false);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If it wasn't a long press and dialog isn't showing, open ringtone selection dialog
    if (!isLongPressRef.current && !showAntidelayDialog) {
      console.log('🔔 Opening ringtone selection dialog...');
      openRingtoneDialog();
    }
  };

  const handleSetRingMouseLeave = () => {
    setSetRingButtonPressed(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Ringtone select dialog handlers
  const handleSelectCustomSound = () => {
    console.log('🎵 User selected custom sound');
    triggerRingtoneSelection();
    closeRingtoneDialog();
  };

  const handleSelectDefaultSound = () => {
    console.log('🔊 User selected default sound');
    selectDefaultSound();
    closeRingtoneDialog();
  };

  // Antidelay dialog handlers
  const handleAntidelaySubmit = () => {
    const seconds = parseInt(antidelayInput);
    if (!isNaN(seconds) && seconds >= 0 && seconds <= 99) {
      setAntidelaySeconds(seconds);
      setShowAntidelayDialog(false);
      setAntidelayInput('');

      // Reschedule notifications with new antidelay
      if (savedSignals.length > 0) {
        scheduleAllSignalNotifications(savedSignals);
      }
    }
  };

  const handleAntidelayCancel = () => {
    setShowAntidelayDialog(false);
    setAntidelayInput('');
  };

  return {
    showAntidelayDialog,
    antidelayInput,
    setAntidelayInput,
    setRingButtonPressed,
    handleSetRingMouseDown,
    handleSetRingMouseUp,
    handleSetRingMouseLeave,
    handleAntidelaySubmit,
    handleAntidelayCancel,
    ringtoneDialogOpen: showRingtoneDialog,
    setRingtoneDialogOpen: closeRingtoneDialog,
    handleSelectCustomSound,
    handleSelectDefaultSound,
  };
};
