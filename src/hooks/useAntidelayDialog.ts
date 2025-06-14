
import { useState, useRef } from 'react';
import { scheduleAllSignalNotifications } from '@/utils/backgroundTaskManager';
import { Signal } from '@/types/signal';

export const useAntidelayDialog = (
  antidelaySeconds: number,
  setAntidelaySeconds: (seconds: number) => void,
  savedSignals: Signal[]
) => {
  const [showAntidelayDialog, setShowAntidelayDialog] = useState(false);
  const [antidelayInput, setAntidelayInput] = useState('');
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const handleLongPressStart = () => {
    isLongPressRef.current = false;
    
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // Long press detected - show antidelay dialog
      setShowAntidelayDialog(true);
      setAntidelayInput(antidelaySeconds.toString());
    }, 3000);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    return !isLongPressRef.current && !showAntidelayDialog;
  };

  const handleLongPressCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

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
    handleLongPressStart,
    handleLongPressEnd,
    handleLongPressCancel,
    handleAntidelaySubmit,
    handleAntidelayCancel
  };
};
