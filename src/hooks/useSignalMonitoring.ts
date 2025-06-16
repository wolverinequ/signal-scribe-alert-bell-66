
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
  const lastCustomRingtoneRef = useRef<string | null>(null);
  const monitoringKeyRef = useRef<string>(''); // Force restart key

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

  // Reset triggered signals when customRingtone changes (new MP3 selected)
  useEffect(() => {
    if (customRingtone && customRingtone !== lastCustomRingtoneRef.current) {
      console.log('🔄 SignalMonitoring: New MP3 detected, clearing triggered signals');
      console.log('🆚 SignalMonitoring: Old URL:', lastCustomRingtoneRef.current?.substring(0, 50) + '...');
      console.log('🆚 SignalMonitoring: New URL:', customRingtone.substring(0, 50) + '...');
      
      // Force complete restart by changing the monitoring key
      monitoringKeyRef.current = `${Date.now()}-${Math.random()}`;
      setAlreadyRangIds(new Set());
      lastCustomRingtoneRef.current = customRingtone;
      console.log('✅ SignalMonitoring: Triggered signals reset for new MP3');
      console.log('🔄 SignalMonitoring: Monitoring key updated to force restart:', monitoringKeyRef.current);
    }
  }, [customRingtone]);

  // Stabilize the callback to prevent infinite re-renders
  const stableOnSignalShouldTrigger = useCallback((signal: Signal) => {
    console.log('🎯 SignalMonitoring: Triggering signal:', signal);
    console.log('🎵 SignalMonitoring: Current ringtone URL:', customRingtone?.substring(0, 50) + '...');
    onSignalShouldTrigger(signal);
    markSignalAsTriggered(signal);
  }, [onSignalShouldTrigger, markSignalAsTriggered, customRingtone]); // Include customRingtone to ensure fresh closure

  // Signal monitoring effect - restart completely when customRingtone changes
  useEffect(() => {
    const hasSignals = savedSignals.length > 0;
    const canMonitor = isRingtoneLoaded && customRingtone;
    
    console.log('🔍 SignalMonitoring: Monitoring setup check:');
    console.log('  - Has signals:', hasSignals);
    console.log('  - Can monitor:', canMonitor);
    console.log('  - Current audio URL:', customRingtone?.substring(0, 50) + '...');
    console.log('  - Monitoring key:', monitoringKeyRef.current);
    
    // Stop existing monitoring first - CRUCIAL for restart
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ SignalMonitoring: Stopped previous monitoring');
    }

    if (!hasSignals || !canMonitor) {
      console.log('❌ SignalMonitoring: Cannot start monitoring - conditions not met');
      return;
    }

    console.log('🚀 SignalMonitoring: Starting fresh signal monitoring with', savedSignals.length, 'signals');
    console.log('🎵 SignalMonitoring: Using audio URL:', customRingtone.substring(0, 50) + '...');
    
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
            console.log(`🎵 SignalMonitoring: Will use audio URL:`, customRingtone?.substring(0, 50) + '...');
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
  }, [savedSignals, antidelaySeconds, isRingtoneLoaded, customRingtone, stableOnSignalShouldTrigger, getSignalId, monitoringKeyRef.current]); // Include monitoring key to force restart

  return {
    markSignalAsTriggered
  };
};
