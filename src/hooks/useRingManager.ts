
import { useState, useEffect, useRef, useCallback } from 'react';
import { Signal } from '@/types/signal';
import { checkSignalTime } from '@/utils/signalUtils';
import { playCustomRingtone } from '@/utils/audioUtils';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';
import { useAudioManager } from './useAudioManager';

export const useRingManager = (
  savedSignals: Signal[],
  antidelaySeconds: number,
  onSignalTriggered: (signal: Signal) => void
) => {
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  const [alreadyRangIds, setAlreadyRangIds] = useState<Set<string>>(new Set());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const { customRingtone, isRingtoneLoaded } = useAudioManager();
  const monitoringActiveRef = useRef(false);
  const lastSignalsRef = useRef<Signal[]>([]);
  const lastAntidelayRef = useRef<number>(0);

  // Helper: construct unique signal ID
  const getSignalId = useCallback((signal: Signal): string => {
    const id = `${signal.asset || 'NO_ASSET'}-${signal.direction || 'NO_DIRECTION'}-${signal.timestamp}`;
    console.log('🔍 [useRingManager] Generated signal ID:', id, 'for signal:', signal);
    return id;
  }, []);

  // Ring notification - only if ringtone is loaded
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('🔔 [useRingManager] Attempting to trigger ring for signal:', signal);
    console.log('🔔 [useRingManager] Ring conditions check:', {
      isRingtoneLoaded,
      hasCustomRingtone: !!customRingtone,
      customRingtonePreview: customRingtone ? customRingtone.substring(0, 50) + '...' : 'null'
    });

    if (!isRingtoneLoaded) {
      console.log('❌ [useRingManager] Cannot ring - ringtone not loaded yet');
      return;
    }

    console.log('✅ [useRingManager] Starting ring sequence...');
    setIsRinging(true);
    setCurrentRingingSignal(signal);

    console.log('🔒 [useRingManager] Requesting wake lock...');
    const lock = await requestWakeLock();
    setWakeLock(lock);
    console.log('🔒 [useRingManager] Wake lock status:', !!lock);

    if (document.hidden) {
      try {
        console.log('👁️ [useRingManager] Document is hidden, attempting to focus window...');
        window.focus();
        console.log('✅ [useRingManager] Window focus attempted');
      } catch (e) {
        console.log('⚠️ [useRingManager] Could not focus window:', e);
      }
    }

    try {
      console.log('🎵 [useRingManager] Playing ringtone with current settings...');
      console.log('🎵 [useRingManager] Ringtone to play:', customRingtone ? 'custom' : 'default');
      
      const audio = await playCustomRingtone(customRingtone);
      if (audio instanceof HTMLAudioElement) {
        audioInstancesRef.current.push(audio);
        console.log('🎵 [useRingManager] Audio instance added to tracking array. Total instances:', audioInstancesRef.current.length);
      }

      onSignalTriggered(signal);
      const signalId = getSignalId(signal);
      setAlreadyRangIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(signalId);
        console.log('✅ [useRingManager] Signal marked as triggered and added to already rang IDs:', signalId);
        console.log('🔍 [useRingManager] Total already rang IDs:', newSet.size);
        return newSet;
      });
      
    } catch (error) {
      console.error('❌ [useRingManager] Failed to play ringtone:', error);
      console.error('❌ [useRingManager] Ring failure details:', {
        signalAsset: signal.asset,
        signalTimestamp: signal.timestamp,
        customRingtone: customRingtone ? 'present' : 'null',
        errorMessage: (error as Error).message
      });
      
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [customRingtone, isRingtoneLoaded, onSignalTriggered, getSignalId, wakeLock]);

  // Check if monitoring conditions have actually changed
  const shouldRestartMonitoring = useCallback(() => {
    const signalsChanged = JSON.stringify(savedSignals) !== JSON.stringify(lastSignalsRef.current);
    const antidelayChanged = antidelaySeconds !== lastAntidelayRef.current;
    const hasRequiredConditions = savedSignals.length > 0 && isRingtoneLoaded;
    
    console.log('🔍 [useRingManager] Monitoring restart check:', {
      signalsChanged,
      antidelayChanged,
      hasRequiredConditions,
      signalsCount: savedSignals.length,
      isRingtoneLoaded,
      currentAntidelay: antidelaySeconds,
      lastAntidelay: lastAntidelayRef.current
    });
    
    return (signalsChanged || antidelayChanged) && hasRequiredConditions;
  }, [savedSignals, antidelaySeconds, isRingtoneLoaded]);

  // Stable monitoring effect - only restart when actually needed
  useEffect(() => {
    const hasSignals = savedSignals.length > 0;
    const canMonitor = isRingtoneLoaded;
    
    console.log('🚀 [useRingManager] Monitoring effect triggered:', {
      hasSignals,
      canMonitor,
      signalsCount: savedSignals.length,
      isRingtoneLoaded,
      monitoringActive: monitoringActiveRef.current
    });
    
    if (!hasSignals || !canMonitor) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        monitoringActiveRef.current = false;
        console.log('⏹️ [useRingManager] Signal monitoring stopped - conditions not met');
      }
      return;
    }

    if (monitoringActiveRef.current && !shouldRestartMonitoring()) {
      console.log('⏭️ [useRingManager] Skipping monitoring restart - already running and no important changes');
      return; // Don't restart if already running and nothing important changed
    }

    // Stop existing monitoring
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('🛑 [useRingManager] Stopped existing monitoring interval');
    }

    // Update refs to track current state
    lastSignalsRef.current = [...savedSignals];
    lastAntidelayRef.current = antidelaySeconds;
    monitoringActiveRef.current = true;
    
    console.log('🚀 [useRingManager] Starting signal monitoring with', savedSignals.length, 'signals');
    console.log('🚀 [useRingManager] Monitoring configuration:', {
      antidelaySeconds,
      alreadyRangCount: alreadyRangIds.size,
      signalDetails: savedSignals.map(s => ({ asset: s.asset, timestamp: s.timestamp, triggered: s.triggered }))
    });
    
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      // Only log every 30 seconds to avoid spam
      if (now.getSeconds() % 30 === 0) {
        console.log('⏰ [useRingManager] Monitoring tick at', currentTime);
      }
      
      savedSignals.forEach(signal => {
        const signalId = getSignalId(signal);
        const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
        const notAlreadyRang = !alreadyRangIds.has(signalId);
        
        if (shouldTrigger && notAlreadyRang) {
          console.log(`🎯 [useRingManager] Signal should trigger at ${currentTime}:`, signal);
          console.log(`🎯 [useRingManager] Trigger details:`, {
            signalId,
            shouldTrigger,
            notAlreadyRang,
            antidelaySeconds,
            alreadyRangIds: Array.from(alreadyRangIds)
          });
          triggerRing(signal);
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        monitoringActiveRef.current = false;
        console.log('🧹 [useRingManager] Cleanup: monitoring interval cleared');
      }
    };
  }, [savedSignals.length, isRingtoneLoaded, shouldRestartMonitoring, triggerRing, getSignalId, alreadyRangIds, antidelaySeconds]);

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = useCallback(() => {
    console.log('🔇 [useRingManager] Ring off button pressed');
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    console.log('🔇 [useRingManager] Stopping', audioInstancesRef.current.length, 'audio instances');

    audioInstancesRef.current.forEach((audio, index) => {
      if (audio) {
        console.log(`🔇 [useRingManager] Stopping audio instance ${index + 1}/${audioInstancesRef.current.length}`);
        audio.pause();
        audio.currentTime = 0;
      }
    });
    audioInstancesRef.current = [];

    if (isRinging) {
      console.log('🔇 [useRingManager] Clearing ring state and releasing wake lock');
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
    
    console.log('✅ [useRingManager] Ring off completed');
  }, [isRinging, wakeLock]);

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff
  };
};
