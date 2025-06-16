
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

  // Save signals handler
  const handleSaveSignals = () => {
    setSaveButtonPressed(true);
    setTimeout(() => setSaveButtonPressed(false), 200);
    
    const signals = parseSignals(signalsText);
    setSavedSignals(signals);
    saveSignalsToStorage(signals);
    
    // Schedule notifications for the new signals
    if (signals.length > 0) {
      scheduleAllSignalNotifications(signals);
    }
  };

  const updateSignalTriggered = (signal: Signal) => {
    const updatedSignals = savedSignals.map(s => 
      s === signal ? { ...s, triggered: true } : s
    );
    setSavedSignals(updatedSignals);
    saveSignalsToStorage(updatedSignals);
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
    setCustomRingtone,
    handleSaveSignals,
    updateSignalTriggered
  };
};
