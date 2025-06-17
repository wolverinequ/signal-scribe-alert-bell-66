
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
import { SessionManager } from '@/utils/sessionManager';

export const useSignalState = () => {
  const [signalsText, setSignalsText] = useState('');
  const [savedSignals, setSavedSignals] = useState<Signal[]>([]);
  const [antidelaySeconds, setAntidelaySeconds] = useState(15);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);

  // Load saved data on component mount
  useEffect(() => {
    console.log('📊 SignalState: Initializing signal state');
    
    // Check if this is a fresh launch
    const isFreshLaunch = SessionManager.isFreshLaunch();
    console.log('📊 SignalState: Fresh launch status:', isFreshLaunch);
    
    // Load signals (will be empty array if fresh launch)
    const loadedSignals = loadSignalsFromStorage();
    console.log('📊 SignalState: Loaded signals:', loadedSignals);
    
    if (loadedSignals.length > 0) {
      setSavedSignals(loadedSignals);
      console.log('📊 SignalState: Signals set from storage:', loadedSignals);
    } else {
      console.log('📊 SignalState: Starting with empty signals (fresh launch or no saved signals)');
    }
    
    // Load antidelay (always preserved as user preference)
    const loadedAntidelay = loadAntidelayFromStorage();
    setAntidelaySeconds(loadedAntidelay);
    console.log('📊 SignalState: Antidelay loaded and preserved:', loadedAntidelay);
    
    // Note: Custom ringtone is loaded in useAudioManager via IndexedDB (preserved as user preference)
    console.log('📊 SignalState: Custom ringtone will be loaded from IndexedDB via useAudioManager');
  }, []);

  // Save antidelay changes to storage (preserve across sessions)
  useEffect(() => {
    saveAntidelayToStorage(antidelaySeconds);
  }, [antidelaySeconds]);

  // Save signals handler
  const handleSaveSignals = () => {
    console.log('📊 SignalState: Saving signals to current session');
    
    setSaveButtonPressed(true);
    setTimeout(() => setSaveButtonPressed(false), 200);
    
    const signals = parseSignals(signalsText);
    setSavedSignals(signals);
    
    // Save to storage with session tracking
    saveSignalsToStorage(signals);
    
    console.log('📊 SignalState: Signals saved and marked for current session:', signals);
    
    // Schedule notifications for the new signals
    if (signals.length > 0) {
      scheduleAllSignalNotifications(signals);
    }
  };

  const updateSignalTriggered = (signal: Signal) => {
    console.log('📊 SignalState: Updating signal as triggered:', signal);
    
    const updatedSignals = savedSignals.map(s => 
      s === signal ? { ...s, triggered: true } : s
    );
    setSavedSignals(updatedSignals);
    saveSignalsToStorage(updatedSignals);
    
    console.log('📊 SignalState: Signal marked as triggered and saved');
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
