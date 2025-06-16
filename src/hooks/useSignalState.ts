
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

const CUSTOM_RINGTONE_KEY = 'custom_ringtone_url';

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
    const savedRingtone = localStorage.getItem(CUSTOM_RINGTONE_KEY);
    
    if (loadedSignals.length > 0) {
      setSavedSignals(loadedSignals);
      console.log('📊 Loaded signals from storage:', loadedSignals);
    }
    
    setAntidelaySeconds(loadedAntidelay);
    console.log('📊 Loaded antidelay from storage:', loadedAntidelay);

    if (savedRingtone) {
      setCustomRingtone(savedRingtone);
      console.log('📊 Loaded custom ringtone from storage:', savedRingtone);
    } else {
      console.log('📊 No custom ringtone found in storage');
    }
  }, []);

  // Save antidelay changes to storage
  useEffect(() => {
    saveAntidelayToStorage(antidelaySeconds);
  }, [antidelaySeconds]);

  // Save custom ringtone changes to storage
  useEffect(() => {
    if (customRingtone) {
      localStorage.setItem(CUSTOM_RINGTONE_KEY, customRingtone);
      console.log('📊 Custom ringtone saved to storage:', customRingtone);
    }
  }, [customRingtone]);

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
