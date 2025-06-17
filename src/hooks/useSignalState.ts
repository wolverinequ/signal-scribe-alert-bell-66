
import { useState, useEffect } from 'react';
import { Signal } from '@/types/signal';
import { parseSignals } from '@/utils/signalUtils';
import { 
  saveSignalsToStorage, 
  loadSignalsFromStorage, 
  saveAntidelayToStorage, 
  loadAntidelayFromStorage 
} from '@/utils/signalStorage';
import { scheduleAllSignalNotifications } from '@/utils/backgroundTaskManager';

export const useSignalState = () => {
  const [signalsText, setSignalsText] = useState('');
  const [savedSignals, setSavedSignals] = useState<Signal[]>([]);
  const [antidelaySeconds, setAntidelaySeconds] = useState(15);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);

  // Load saved data on component mount
  useEffect(() => {
    const loadedSignals = loadSignalsFromStorage();
    const loadedAntidelay = loadAntidelayFromStorage();
    
    if (loadedSignals.length > 0) {
      setSavedSignals(loadedSignals);
      console.log('📊 Loaded signals from storage:', loadedSignals);
    }
    
    setAntidelaySeconds(loadedAntidelay);
    console.log('📊 Loaded antidelay from storage:', loadedAntidelay);
    
    // Note: Custom ringtone is now loaded in useAudioManager via IndexedDB
    console.log('📊 Custom ringtone will be loaded from IndexedDB via useAudioManager');
  }, []);

  // Save antidelay changes to storage
  useEffect(() => {
    saveAntidelayToStorage(antidelaySeconds);
  }, [antidelaySeconds]);

  // Save signals handler - with state isolation
  const handleSaveSignals = () => {
    setSaveButtonPressed(true);
    setTimeout(() => setSaveButtonPressed(false), 200);
    
    const signals = parseSignals(signalsText);
    
    // Clear all triggered states for new signals to ensure fresh state
    const freshSignals = signals.map(signal => ({
      ...signal,
      triggered: false
    }));
    
    console.log('📊 Saving new signals with fresh state:', {
      newSignalsCount: freshSignals.length,
      previousSignalsCount: savedSignals.length,
      freshSignals: freshSignals.map(s => ({ timestamp: s.timestamp, triggered: s.triggered }))
    });
    
    setSavedSignals(freshSignals);
    saveSignalsToStorage(freshSignals);
    
    // Schedule notifications for the new signals
    if (freshSignals.length > 0) {
      scheduleAllSignalNotifications(freshSignals);
    }
  };

  // Fixed updateSignalTriggered using timestamp-based comparison
  const updateSignalTriggered = (targetSignal: Signal) => {
    console.log('📊 Updating signal triggered state:', {
      targetTimestamp: targetSignal.timestamp,
      targetAsset: targetSignal.asset,
      targetDirection: targetSignal.direction,
      currentSignalsCount: savedSignals.length
    });
    
    const updatedSignals = savedSignals.map(s => {
      // Use timestamp comparison instead of object reference
      if (s.timestamp === targetSignal.timestamp) {
        console.log('📊 Found matching signal by timestamp:', {
          timestamp: s.timestamp,
          wasTriggered: s.triggered,
          nowTriggered: true
        });
        return { ...s, triggered: true };
      }
      return s;
    });
    
    // Verify the update was successful
    const updatedSignal = updatedSignals.find(s => s.timestamp === targetSignal.timestamp);
    if (updatedSignal && updatedSignal.triggered) {
      console.log('📊 Signal successfully marked as triggered:', {
        timestamp: updatedSignal.timestamp,
        triggered: updatedSignal.triggered
      });
    } else {
      console.warn('📊 Warning: Signal update may have failed:', {
        targetTimestamp: targetSignal.timestamp,
        foundSignal: !!updatedSignal,
        isTriggered: updatedSignal?.triggered
      });
    }
    
    setSavedSignals(updatedSignals);
    saveSignalsToStorage(updatedSignals);
    console.log('📊 Signal marked as triggered and saved to storage');
  };

  // Custom handler for updating ringtone that preserves signal states
  const handleCustomRingtoneChange = (newRingtone: string | null) => {
    console.log('📊 Custom ringtone changing from', customRingtone, 'to', newRingtone);
    setCustomRingtone(newRingtone);
    // Note: We don't reset or resave signals here to preserve their triggered states
  };

  return {
    signalsText,
    setSignalsText,
    savedSignals,
    setSavedSignals,
    antidelaySeconds,
    setAntidelaySeconds,
    saveButtonPressed,
    customRingtone,
    setCustomRingtone: handleCustomRingtoneChange,
    handleSaveSignals,
    updateSignalTriggered
  };
};
