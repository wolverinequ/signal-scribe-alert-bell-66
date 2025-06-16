
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
  const lastCustomRingtoneRef = useRef<string | null>(null);

  // Helper: construct unique signal ID
  const getSignalId = useCallback((signal: Signal): string => {
    return `${signal.asset || 'NO_ASSET'}-${signal.direction || 'NO_DIRECTION'}-${signal.timestamp}`;
  }, []);

  // Ring notification - only if MP3 is loaded
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('🔔 Attempting to trigger ring for signal:', signal);
    console.log('🎵 Current audio state - isRingtoneLoaded:', isRingtoneLoaded, 'customRingtone available:', !!customRingtone);

    if (!isRingtoneLoaded || !customRingtone) {
      console.log('❌ Cannot ring - no MP3 file loaded');
      return;
    }

    console.log('✅ Starting ring sequence...');
    setIsRinging(true);
    setCurrentRingingSignal(signal);

    const lock = await requestWakeLock();
    setWakeLock(lock);

    if (document.hidden) {
      try {
        window.focus();
      } catch (e) {
        console.log('⚠️ Could not focus window:', e);
      }
    }

    try {
      console.log('🎵 Playing custom ringtone with URL:', customRingtone.substring(0, 50) + '...');
      const audio = await playCustomRingtone(customRingtone);
      if (audio instanceof HTMLAudioElement) {
        audioInstancesRef.current.push(audio);
        console.log('🔊 Audio instance added to tracking, total instances:', audioInstancesRef.current.length);
      }

      onSignalTriggered(signal);
      const signalId = getSignalId(signal);
      setAlreadyRangIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(signalId);
        return newSet;
      });
      
      console.log('✅ Signal marked as triggered:', signalId);
    } catch (error) {
      console.error('❌ Failed to play ringtone:', error);
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
    const audioChanged = customRingtone !== lastCustomRingtoneRef.current;
    const hasRequiredConditions = savedSignals.length > 0 && isRingtoneLoaded && customRingtone;
    
    if (audioChanged) {
      console.log('🔄 Audio changed detected - old:', lastCustomRingtoneRef.current?.substring(0, 50), 'new:', customRingtone?.substring(0, 50));
    }
    
    return (signalsChanged || antidelayChanged || audioChanged) && hasRequiredConditions;
  }, [savedSignals, antidelaySeconds, isRingtoneLoaded, customRingtone]);

  // Stable monitoring effect - only restart when actually needed
  useEffect(() => {
    const hasSignals = savedSignals.length > 0;
    const canMonitor = isRingtoneLoaded && customRingtone;
    
    console.log('🔍 Monitoring conditions check - hasSignals:', hasSignals, 'canMonitor:', canMonitor, 'isRingtoneLoaded:', isRingtoneLoaded, 'customRingtone available:', !!customRingtone);
    
    if (!hasSignals || !canMonitor) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        monitoringActiveRef.current = false;
        console.log('⏹️ Signal monitoring stopped - conditions not met');
      }
      return;
    }

    if (monitoringActiveRef.current && !shouldRestartMonitoring()) {
      return; // Don't restart if already running and nothing important changed
    }

    // Stop existing monitoring
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Update refs to track current state
    lastSignalsRef.current = [...savedSignals];
    lastAntidelayRef.current = antidelaySeconds;
    lastCustomRingtoneRef.current = customRingtone;
    monitoringActiveRef.current = true;
    
    console.log('🚀 Starting signal monitoring with', savedSignals.length, 'signals and updated audio');
    
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      savedSignals.forEach(signal => {
        const signalId = getSignalId(signal);
        const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
        const notAlreadyRang = !alreadyRangIds.has(signalId);
        
        if (shouldTrigger && notAlreadyRang) {
          console.log(`🎯 Signal should trigger at ${currentTime}:`, signal);
          triggerRing(signal);
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        monitoringActiveRef.current = false;
      }
    };
  }, [savedSignals.length, isRingtoneLoaded, !!customRingtone, shouldRestartMonitoring, triggerRing, getSignalId, alreadyRangIds, antidelaySeconds]);

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = useCallback(() => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    console.log('🔇 Ring off pressed - stopping', audioInstancesRef.current.length, 'audio instances');

    audioInstancesRef.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    audioInstancesRef.current = [];

    if (isRinging) {
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [isRinging, wakeLock]);

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff
  };
};
