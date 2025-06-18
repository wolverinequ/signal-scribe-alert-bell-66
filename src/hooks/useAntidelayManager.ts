
import { useState, useRef } from 'react';
import { Signal } from '@/types/signal';

export const useAntidelayManager = (
  savedSignals: Signal[],
  antidelaySeconds: number,
  setAntidelaySeconds: (seconds: number) => void,
  triggerRingtoneSelection: () => void,
  clearCustomRingtone: () => Promise<void>
) => {
  const [showAntidelayDialog, setShowAntidelayDialog] = useState(false);
  const [antidelayInput, setAntidelayInput] = useState('');
  const [setRingButtonPressed, setSetRingButtonPressed] = useState(false);
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Set Ring button handlers
  const handleSetRingMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('🎛️ AntidelayManager: Set Ring button mouse down');
    e.preventDefault();
    e.stopPropagation();
    setSetRingButtonPressed(true);
    isLongPressRef.current = false;
    
    longPressTimerRef.current = setTimeout(() => {
      console.log('🎛️ AntidelayManager: Long press detected - showing antidelay dialog');
      isLongPressRef.current = true;
      // Long press detected - show antidelay dialog
      setShowAntidelayDialog(true);
      setAntidelayInput(antidelaySeconds.toString());
    }, 3000);
  };

  const handleSetRingMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('🎛️ AntidelayManager: Set Ring button mouse up', {
      isLongPress: isLongPressRef.current
    });
    
    e.preventDefault();
    e.stopPropagation();
    setSetRingButtonPressed(false);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // If it wasn't a long press, directly trigger ringtone selection
    if (!isLongPressRef.current) {
      console.log('🎛️ AntidelayManager: Short press detected - directly opening file picker');
      triggerRingtoneSelection();
    }
  };

  const handleSetRingMouseLeave = () => {
    console.log('🎛️ AntidelayManager: Set Ring button mouse leave');
    setSetRingButtonPressed(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Antidelay dialog handlers (no notification rescheduling in audio-only mode)
  const handleAntidelaySubmit = () => {
    console.log('🎛️ AntidelayManager: Antidelay dialog submit with value:', antidelayInput);
    const seconds = parseInt(antidelayInput);
    if (!isNaN(seconds) && seconds >= 0 && seconds <= 99) {
      setAntidelaySeconds(seconds);
      setShowAntidelayDialog(false);
      setAntidelayInput('');
      
      // No notification rescheduling in audio-only mode
      console.log('🎛️ AntidelayManager: Antidelay updated (audio-only mode, no notification rescheduling)');
    } else {
      console.log('🎛️ AntidelayManager: Invalid antidelay value:', antidelayInput);
    }
  };

  const handleAntidelayCancel = () => {
    console.log('🎛️ AntidelayManager: Antidelay dialog cancelled');
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
    handleAntidelayCancel
  };
};

