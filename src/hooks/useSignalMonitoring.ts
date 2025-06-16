
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
  const forceRestartRef = useRef<number>(0);

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

  // FORCE restart monitoring when customRingtone changes
  useEffect(() => {
    console.log('🔄 SignalMonitoring: Checking ringtone change...');
    console.log('🆚 SignalMonitoring: Current URL:', customRingtone?.substring(0, 50) + '...');
    console.log('🆚 SignalMonitoring: Last URL:', lastCustomRingtoneRef.current?.substring(0, 50) + '...');
    
    if (customRingtone !== lastCustomRingtoneRef.current) {
      console.log('🚨 SignalMonitoring: NEW MP3 DETECTED - FORCE RESTARTING MONITORING');
      
      // FORCE complete restart
      forceRestartRef.current = Date.now();
      setAlreadyRangIds(new Set());
      lastCustomRingtoneRef.current = customRingtone;
      
      console.log('✅ SignalMonitoring: Monitoring will restart with new MP3');
      console.log('🔄 SignalMonitoring: Force restart key:', forceRestartRef.current);
    }
  }, [customRingtone]);

  // Create stable callback that ALWAYS uses current customRingtone
  const stableOnSignalShouldTrigger = useCallback((signal: Signal) => {
    console.log('🎯 SignalMonitoring: TRIGGERING signal:', signal);
    console.log('🎵 SignalMonitoring: Using CURRENT ringtone URL:', customRingtone?.substring(0, 50) + '...');
    onSignalShouldTrigger(signal);
    markSignalAsTriggered(signal);
  }, [onSignalShouldTrigger, markSignalAsTriggered, customRingtone]);

  // Main monitoring effect - FORCE restart when ringtone changes
  useEffect(() => {
    const hasSignals = savedSignals.length > 0;
    const canMonitor = isRingtoneLoaded && customRingtone;
    
    console.log('🔍 SignalMonitoring: FORCE RESTART CHECK:');
    console.log('  - Has signals:', hasSignals);
    console.log('  - Can monitor:', canMonitor);
    console.log('  - Force restart key:', forceRestartRef.current);
    console.log('  - Current audio URL:', customRingtone?.substring(0, 50) + '...');
    
    // ALWAYS stop existing monitoring first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ SignalMonitoring: FORCE STOPPED previous monitoring');
    }

    if (!hasSignals || !canMonitor) {
      console.log('❌ SignalMonitoring: Cannot start monitoring - conditions not met');
      return;
    }

    console.log('🚀 SignalMonitoring: FORCE STARTING fresh monitoring');
    console.log('🎵 SignalMonitoring: Will use audio URL:', customRingtone.substring(0, 50) + '...');
    
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      savedSignals.forEach(signal => {
        const signalId = getSignalId(signal);
        const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
        
        setAlreadyRangIds(current => {
          const notAlreadyRang = !current.has(signalId);
          
          if (shouldTrigger && notAlreadyRang) {
            console.log(`🎯 SignalMonitoring: Signal SHOULD TRIGGER at ${currentTime}:`, signal);
            console.log(`🎵 SignalMonitoring: Will use CURRENT audio URL:`, customRingtone?.substring(0, 50) + '...');
            stableOnSignalShouldTrigger(signal);
          }
          
          return current;
        });
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🧹 SignalMonitoring: Cleanup complete');
      }
    };
  }, [savedSignals, antidelaySeconds, isRingtoneLoaded, customRingtone, stableOnSignalShouldTrigger, getSignalId, forceRestartRef.current]);

  return {
    markSignalAsTriggered
  };
};
