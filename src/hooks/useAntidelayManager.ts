
import { useState, useRef } from 'react';
import { scheduleAllSignalNotifications } from '@/utils/backgroundTaskManager';
import { Signal } from '@/types/signal';

export const useAntidelayManager = (
  savedSignals: Signal[],
  antidelaySeconds: number,
  setAntidelaySeconds: (seconds: number) => void
) => {
  const [showAntidelayDialog, setShowAntidelayDialog] = useState(false);
  const [antidelayInput, setAntidelayInput] = useState('');
  const [setRingButtonPressed, setSetRingButtonPressed] = useState(false);
  const [ringtoneDialogOpen, setRingtoneDialogOpen] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

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

    // If it wasn't a long press and antidelay dialog isn't showing, show ringtone dialog
    if (!isLongPressRef.current && !showAntidelayDialog) {
      console.log('🔔 Single click detected - opening ringtone selection dialog');
      setRingtoneDialogOpen(true);
    }
  };

  const handleSetRingMouseLeave = () => {
    setSetRingButtonPressed(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
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
    ringtoneDialogOpen,
    setRingtoneDialogOpen,
  };
};
