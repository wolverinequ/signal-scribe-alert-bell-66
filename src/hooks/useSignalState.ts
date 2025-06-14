
import { useState, useEffect } from 'react';
import { Signal } from '@/types/signal';
import { parseSignals } from '@/utils/signalUtils';
import { 
  saveSignalsToStorage, 
  loadSignalsFromStorage, 
  saveAntidelayToStorage, 
  loadAntidelayFromStorage 
} from '@/utils/signalStorage';
import { 
  startBackgroundTask, 
  stopBackgroundTask, 
  scheduleAllSignalNotifications 
} from '@/utils/backgroundTaskManager';

export const useSignalState = () => {
  const [signalsText, setSignalsText] = useState('');
  const [savedSignals, setSavedSignals] = useState<Signal[]>([]);
  const [antidelaySeconds, setAntidelaySeconds] = useState(15);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    const loadedSignals = loadSignalsFromStorage();
    const loadedAntidelay = loadAntidelayFromStorage();
    
    if (loadedSignals.length > 0) {
      setSavedSignals(loadedSignals);
      console.log('Loaded signals from storage:', loadedSignals);
    }
    
    setAntidelaySeconds(loadedAntidelay);
    console.log('Loaded antidelay from storage:', loadedAntidelay);
  }, []);

  // Save antidelay changes to storage
  useEffect(() => {
    saveAntidelayToStorage(antidelaySeconds);
  }, [antidelaySeconds]);

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

  const updateSignals = (updatedSignals: Signal[]) => {
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
    handleSaveSignals,
    updateSignals
  };
};
