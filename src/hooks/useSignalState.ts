
import { useState, useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { parseSignals } from '@/utils/signalUtils';
import { 
  saveSignalsToStorage, 
  loadSignalsFromStorage, 
  saveAntidelayToStorage, 
  loadAntidelayFromStorage 
} from '@/utils/signalStorage';
import { scheduleAllSignalNotifications, refreshSignalCache } from '@/utils/backgroundTaskManager';

export const useSignalState = () => {
  const [signalsText, setSignalsText] = useState('');
  const [savedSignals, setSavedSignals] = useState<Signal[]>([]);
  const [antidelaySeconds, setAntidelaySeconds] = useState(15);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);
  
  // Loading state guards
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const loadingRef = useRef(false);

  // Load saved data ONLY on component mount (one time only)
  useEffect(() => {
    if (isInitialized || loadingRef.current) {
      console.log('🔒 SignalState: Already initialized or loading, skipping...');
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    
    console.log('🚀 SignalState: Initial load from storage (ONE TIME ONLY)');
    
    try {
      const loadedSignals = loadSignalsFromStorage();
      const loadedAntidelay = loadAntidelayFromStorage();
      
      if (loadedSignals.length > 0) {
        setSavedSignals(loadedSignals);
        console.log('✅ SignalState: Loaded signals from storage:', loadedSignals.length);
      }
      
      setAntidelaySeconds(loadedAntidelay);
      console.log('✅ SignalState: Loaded antidelay from storage:', loadedAntidelay);
    } catch (error) {
      console.error('❌ SignalState: Failed to load from storage:', error);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []); // Empty dependency array - run only once on mount

  // Save antidelay changes to storage (but don't trigger signal reload)
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('💾 SignalState: Saving antidelay to storage:', antidelaySeconds);
    saveAntidelayToStorage(antidelaySeconds);
  }, [antidelaySeconds, isInitialized]);

  // Save signals handler - ONLY triggered by save button
  const handleSaveSignals = () => {
    if (isLoading || loadingRef.current) {
      console.log('🔒 SignalState: Save operation already in progress, skipping...');
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setSaveButtonPressed(true);
    
    console.log('💾 SignalState: === SAVE BUTTON CLICKED - PROCESSING SIGNALS ===');
    
    setTimeout(() => setSaveButtonPressed(false), 200);
    
    try {
      const signals = parseSignals(signalsText);
      setSavedSignals(signals);
      saveSignalsToStorage(signals);
      
      console.log('✅ SignalState: Signals parsed and saved:', signals.length);
      
      // Refresh background task cache after saving
      refreshSignalCache();
      
      // Schedule notifications for the new signals
      if (signals.length > 0) {
        scheduleAllSignalNotifications(signals);
        console.log('📅 SignalState: Notifications scheduled for', signals.length, 'signals');
      }
    } catch (error) {
      console.error('❌ SignalState: Failed to save signals:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
      console.log('💾 SignalState: === SAVE OPERATION COMPLETE ===');
    }
  };

  const updateSignalTriggered = (signal: Signal) => {
    if (isLoading || loadingRef.current) {
      console.log('🔒 SignalState: Update operation blocked - save in progress');
      return;
    }

    console.log('🔄 SignalState: Updating signal triggered status:', signal.timestamp);
    const updatedSignals = savedSignals.map(s => 
      s === signal ? { ...s, triggered: true } : s
    );
    setSavedSignals(updatedSignals);
    saveSignalsToStorage(updatedSignals);
    
    // Refresh background task cache after updating signal status
    refreshSignalCache();
  };

  return {
    signalsText,
    setSignalsText,
    savedSignals,
    setSavedSignals,
    antidelaySeconds,
    setAntidelaySeconds,
    saveButtonPressed,
    isLoading,
    handleSaveSignals,
    updateSignalTriggered
  };
};
