
import { useEffect, useRef, useCallback, useState } from 'react';
import { Signal } from '@/types/signal';
import { checkSignalTime } from '@/utils/signalUtils';

export const useSignalMonitoring = (
  savedSignals: Signal[],
  antidelaySeconds: number,
  isRingtoneLoaded: boolean,
  customRingtone: string | null,
  onSignalShouldTrigger: (signal: Signal) => void
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [alreadyRangIds, setAlreadyRangIds] = useState<Set<string>>(new Set());

  // Helper: construct unique signal ID
  const getSignalId = useCallback((signal: Signal): string => {
    return `${signal.asset || 'NO_ASSET'}-${signal.direction || 'NO_DIRECTION'}-${signal.timestamp}`;
  }, []);

  const markSignalAsTriggered = useCallback((signal: Signal) => {
    const signalId = getSignalId(signal);
    setAlreadyRangIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(signalId);
      return newSet;
    });
    console.log('✅ SignalMonitoring: Signal marked as triggered:', signalId);
  }, [getSignalId]);

  // Stabilize the callback to prevent infinite re-renders
  const stableOnSignalShouldTrigger = useCallback((signal: Signal) => {
    console.log('🎯 SignalMonitoring: Triggering signal:', signal);
    onSignalShouldTrigger(signal);
    markSignalAsTriggered(signal);
  }, [onSignalShouldTrigger, markSignalAsTriggered]);

  // Signal monitoring effect - removed alreadyRangIds from dependencies
  useEffect(() => {
    const hasSignals = savedSignals.length > 0;
    const canMonitor = isRingtoneLoaded && customRingtone;
    
    console.log('🔍 SignalMonitoring: Monitoring check - signals:', hasSignals, 'canMonitor:', canMonitor);
    
    // Stop existing monitoring first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ SignalMonitoring: Stopped previous monitoring');
    }

    if (!hasSignals || !canMonitor) {
      console.log('❌ SignalMonitoring: Cannot start monitoring - conditions not met');
      return;
    }

    console.log('🚀 SignalMonitoring: Starting signal monitoring with', savedSignals.length, 'signals');
    
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      savedSignals.forEach(signal => {
        const signalId = getSignalId(signal);
        const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
        
        // Check against current alreadyRangIds state
        setAlreadyRangIds(current => {
          const notAlreadyRang = !current.has(signalId);
          
          if (shouldTrigger && notAlreadyRang) {
            console.log(`🎯 SignalMonitoring: Signal should trigger at ${currentTime}:`, signal);
            stableOnSignalShouldTrigger(signal);
          }
          
          return current; // Don't modify state here
        });
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🧹 SignalMonitoring: Monitoring cleanup complete');
      }
    };
  }, [savedSignals, antidelaySeconds, isRingtoneLoaded, customRingtone, stableOnSignalShouldTrigger, getSignalId]);

  return {
    markSignalAsTriggered
  };
};
