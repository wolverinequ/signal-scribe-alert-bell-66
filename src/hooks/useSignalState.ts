
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

const CUSTOM_RINGTONE_KEY = 'custom_ringtone_data';

const isValidDataURL = (dataURL: string): boolean => {
  try {
    // Check if it's a valid data URL format
    const isDataURL = dataURL.startsWith('data:audio/') && dataURL.includes('base64,');
    if (!isDataURL) return false;
    
    // Try to decode the base64 part to ensure it's valid
    const base64Part = dataURL.split(',')[1];
    if (!base64Part) return false;
    
    // Basic base64 validation
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(base64Part);
  } catch {
    return false;
  }
};

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
      // Validate stored ringtone data
      if (isValidDataURL(savedRingtone)) {
        setCustomRingtone(savedRingtone);
        console.log('📊 Loaded valid custom ringtone from storage');
      } else {
        console.warn('📊 Invalid ringtone data found, clearing storage');
        localStorage.removeItem(CUSTOM_RINGTONE_KEY);
        setCustomRingtone(null);
      }
    } else {
      console.log('📊 No custom ringtone found in storage');
    }
  }, []);

  // Save antidelay changes to storage
  useEffect(() => {
    saveAntidelayToStorage(antidelaySeconds);
  }, [antidelaySeconds]);

  // Save custom ringtone changes to storage with validation
  useEffect(() => {
    if (customRingtone) {
      if (isValidDataURL(customRingtone)) {
        try {
          localStorage.setItem(CUSTOM_RINGTONE_KEY, customRingtone);
          console.log('📊 Custom ringtone saved to storage successfully');
        } catch (error) {
          console.error('📊 Failed to save ringtone to storage:', error);
          // If storage fails (e.g., quota exceeded), clear the ringtone
          setCustomRingtone(null);
        }
      } else {
        console.warn('📊 Invalid ringtone data, not saving to storage');
        setCustomRingtone(null);
      }
    } else {
      // Clear from storage when set to null
      localStorage.removeItem(CUSTOM_RINGTONE_KEY);
      console.log('📊 Custom ringtone cleared from storage');
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
