
import { useState, useEffect } from 'react';
import { Signal } from '@/types/signal';
import { parseSignals, hasSignalTimePassed } from '@/utils/signalUtils';
import { 
  saveAntidelayToStorage, 
  loadAntidelayFromStorage 
} from '@/utils/signalStorage';
import { signalStateManager } from '@/utils/signalStateManager';

export const useSignalState = () => {
  const [signalsText, setSignalsText] = useState('');
  const [savedSignals, setSavedSignals] = useState<Signal[]>([]);
  const [antidelaySeconds, setAntidelaySeconds] = useState(15);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);

  // Load saved data on component mount
  useEffect(() => {
    const loadedSignals = signalStateManager.getSignals();
    const loadedAntidelay = loadAntidelayFromStorage();
    
    if (loadedSignals.length > 0) {
      setSavedSignals(loadedSignals);
      console.log('📊 Loaded signals from state manager:', loadedSignals);
    }
    
    setAntidelaySeconds(loadedAntidelay);
    console.log('📊 Loaded antidelay from storage:', loadedAntidelay);
    
    // Note: Custom ringtone is now loaded in useAudioManager via IndexedDB
    console.log('📊 Custom ringtone will be loaded from IndexedDB via useAudioManager');
  }, []);

  // Subscribe to signal state updates
  useEffect(() => {
    const unsubscribe = signalStateManager.onSignalsUpdate((updatedSignals) => {
      setSavedSignals(updatedSignals);
      console.log('📊 Signals updated from state manager:', updatedSignals.length);
    });

    return unsubscribe;
  }, []);

  // Save antidelay changes to storage
  useEffect(() => {
    saveAntidelayToStorage(antidelaySeconds);
  }, [antidelaySeconds]);

  // Save signals handler - with intelligent past/future signal handling (audio-only mode)
  const handleSaveSignals = () => {
    setSaveButtonPressed(true);
    setTimeout(() => setSaveButtonPressed(false), 200);
    
    const signals = parseSignals(signalsText);
    
    // Process signals based on whether their time has passed
    const processedSignals = signals.map(signal => {
      const timePassed = hasSignalTimePassed(signal, antidelaySeconds);
      return {
        ...signal,
        triggered: timePassed // Mark past signals as triggered, future ones as untriggered
      };
    });
    
    // Separate for logging
    const pastSignals = processedSignals.filter(s => s.triggered);
    const futureSignals = processedSignals.filter(s => !s.triggered);
    
    console.log('📊 Saving new signals with intelligent state handling (audio-only):', {
      totalSignalsCount: processedSignals.length,
      pastSignalsCount: pastSignals.length,
      futureSignalsCount: futureSignals.length,
      antidelaySeconds,
      pastSignals: pastSignals.map(s => ({ timestamp: s.timestamp, triggered: s.triggered })),
      futureSignals: futureSignals.map(s => ({ timestamp: s.timestamp, triggered: s.triggered }))
    });
    
    // Update through unified state manager
    signalStateManager.updateSignals(processedSignals);
    
    // No notification scheduling in audio-only mode
    console.log('📊 Audio-only mode: No notifications scheduled, using audio alerts only');
  };

  // Signal triggered handler using unified state manager
  const updateSignalTriggered = (targetSignal: Signal) => {
    console.log('📊 Marking signal as triggered via state manager:', {
      targetTimestamp: targetSignal.timestamp,
      targetAsset: targetSignal.asset,
      targetDirection: targetSignal.direction
    });
    
    signalStateManager.markSignalTriggered(targetSignal);
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

