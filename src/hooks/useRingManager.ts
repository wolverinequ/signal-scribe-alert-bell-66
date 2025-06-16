
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

  // Log audio state changes
  useEffect(() => {
    console.log('🔔 RingManager: customRingtone changed to:', customRingtone);
  }, [customRingtone]);

  useEffect(() => {
    console.log('🔔 RingManager: isRingtoneLoaded changed to:', isRingtoneLoaded);
  }, [isRingtoneLoaded]);

  // Helper: construct unique signal ID
  const getSignalId = useCallback((signal: Signal): string => {
    const id = `${signal.asset || 'NO_ASSET'}-${signal.direction || 'NO_DIRECTION'}-${signal.timestamp}`;
    console.log('🔔 RingManager: Generated signal ID:', id, 'for signal:', signal);
    return id;
  }, []);

  // Ring notification - only if MP3 is loaded
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('🔔 RingManager: ===== TRIGGER RING CALLED =====');
    console.log('🔔 RingManager: Signal to ring:', signal);
    console.log('🔔 RingManager: Current audio state:');
    console.log('  - isRingtoneLoaded:', isRingtoneLoaded);
    console.log('  - customRingtone:', customRingtone);
    console.log('  - customRingtone available:', !!customRingtone);

    if (!isRingtoneLoaded || !customRingtone) {
      console.log('❌ RingManager: Cannot ring - no MP3 file loaded');
      console.log('  - isRingtoneLoaded:', isRingtoneLoaded);
      console.log('  - customRingtone:', customRingtone);
      return;
    }

    console.log('✅ RingManager: Starting ring sequence...');
    console.log('🔔 RingManager: Setting ring state...');
    setIsRinging(true);
    setCurrentRingingSignal(signal);

    console.log('🔒 RingManager: Requesting wake lock...');
    const lock = await requestWakeLock();
    setWakeLock(lock);

    if (document.hidden) {
      try {
        console.log('🔔 RingManager: Document is hidden, attempting to focus window...');
        window.focus();
      } catch (e) {
        console.log('⚠️ RingManager: Could not focus window:', e);
      }
    }

    try {
      console.log('🎵 RingManager: About to play custom ringtone...');
      console.log('🎵 RingManager: Using ringtone URL:', customRingtone);
      const audio = await playCustomRingtone(customRingtone);
      
      if (audio instanceof HTMLAudioElement) {
        console.log('🔊 RingManager: Audio instance received, adding to tracking...');
        console.log('🔊 RingManager: Audio src:', audio.src);
        audioInstancesRef.current.push(audio);
        console.log('🔊 RingManager: Total audio instances now:', audioInstancesRef.current.length);
      }

      console.log('🔔 RingManager: Calling onSignalTriggered...');
      onSignalTriggered(signal);
      
      const signalId = getSignalId(signal);
      setAlreadyRangIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(signalId);
        console.log('🔔 RingManager: Added signal ID to already rang:', signalId);
        return newSet;
      });
      
      console.log('✅ RingManager: Ring sequence completed successfully');
    } catch (error) {
      console.error('❌ RingManager: Failed to play ringtone:', error);
      console.log('🔔 RingManager: Cleaning up after ring failure...');
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
    console.log('🔔 RingManager: ===== TRIGGER RING COMPLETE =====');
  }, [customRingtone, isRingtoneLoaded, onSignalTriggered, getSignalId, wakeLock]);

  // Check if monitoring conditions have actually changed
  const shouldRestartMonitoring = useCallback(() => {
    const signalsChanged = JSON.stringify(savedSignals) !== JSON.stringify(lastSignalsRef.current);
    const antidelayChanged = antidelaySeconds !== lastAntidelayRef.current;
    const audioChanged = customRingtone !== lastCustomRingtoneRef.current;
    const hasRequiredConditions = savedSignals.length > 0 && isRingtoneLoaded && customRingtone;
    
    console.log('🔍 RingManager: Monitoring restart check:');
    console.log('  - signalsChanged:', signalsChanged);
    console.log('  - antidelayChanged:', antidelayChanged);
    console.log('  - audioChanged:', audioChanged);
    console.log('  - hasRequiredConditions:', hasRequiredConditions);
    
    if (audioChanged) {
      console.log('🔄 RingManager: Audio changed detected:');
      console.log('  - old:', lastCustomRingtoneRef.current?.substring(0, 50) + '...');
      console.log('  - new:', customRingtone?.substring(0, 50) + '...');
    }
    
    const shouldRestart = (signalsChanged || antidelayChanged || audioChanged) && hasRequiredConditions;
    console.log('🔍 RingManager: Should restart monitoring:', shouldRestart);
    return shouldRestart;
  }, [savedSignals, antidelaySeconds, isRingtoneLoaded, customRingtone]);

  // Stable monitoring effect - only restart when actually needed
  useEffect(() => {
    const hasSignals = savedSignals.length > 0;
    const canMonitor = isRingtoneLoaded && customRingtone;
    
    console.log('🔍 RingManager: ===== MONITORING EFFECT TRIGGERED =====');
    console.log('🔍 RingManager: Monitoring conditions:');
    console.log('  - hasSignals:', hasSignals, '(count:', savedSignals.length, ')');
    console.log('  - canMonitor:', canMonitor);
    console.log('  - isRingtoneLoaded:', isRingtoneLoaded);
    console.log('  - customRingtone available:', !!customRingtone);
    console.log('  - customRingtone URL:', customRingtone?.substring(0, 50) + '...');
    
    if (!hasSignals || !canMonitor) {
      if (intervalRef.current) {
        console.log('⏹️ RingManager: Stopping monitoring - conditions not met');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        monitoringActiveRef.current = false;
      }
      console.log('🔍 RingManager: ===== MONITORING EFFECT COMPLETE (STOPPED) =====');
      return;
    }

    if (monitoringActiveRef.current && !shouldRestartMonitoring()) {
      console.log('🔍 RingManager: Monitoring already active and no restart needed');
      console.log('🔍 RingManager: ===== MONITORING EFFECT COMPLETE (NO CHANGE) =====');
      return; // Don't restart if already running and nothing important changed
    }

    // Stop existing monitoring
    if (intervalRef.current) {
      console.log('⏹️ RingManager: Stopping existing monitoring interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Update refs to track current state
    lastSignalsRef.current = [...savedSignals];
    lastAntidelayRef.current = antidelaySeconds;
    lastCustomRingtoneRef.current = customRingtone;
    monitoringActiveRef.current = true;
    
    console.log('🚀 RingManager: Starting fresh signal monitoring');
    console.log('🚀 RingManager: Monitoring details:');
    console.log('  - signals count:', savedSignals.length);
    console.log('  - antidelay seconds:', antidelaySeconds);
    console.log('  - audio URL:', customRingtone?.substring(0, 50) + '...');
    
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      console.log('⏰ RingManager: Monitoring tick at', currentTime);
      console.log('⏰ RingManager: Checking', savedSignals.length, 'signals');
      
      savedSignals.forEach(signal => {
        const signalId = getSignalId(signal);
        const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
        const notAlreadyRang = !alreadyRangIds.has(signalId);
        
        console.log(`⏰ RingManager: Signal check - ID: ${signalId}`);
        console.log(`  - shouldTrigger: ${shouldTrigger}`);
        console.log(`  - notAlreadyRang: ${notAlreadyRang}`);
        
        if (shouldTrigger && notAlreadyRang) {
          console.log(`🎯 RingManager: Signal should trigger at ${currentTime}:`, signal);
          triggerRing(signal);
        }
      });
    }, 1000);

    console.log('🔍 RingManager: ===== MONITORING EFFECT COMPLETE (STARTED) =====');

    return () => {
      console.log('🧹 RingManager: Cleaning up monitoring effect');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        monitoringActiveRef.current = false;
      }
    };
  }, [savedSignals.length, isRingtoneLoaded, !!customRingtone, shouldRestartMonitoring, triggerRing, getSignalId, alreadyRangIds, antidelaySeconds]);

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = useCallback(() => {
    console.log('🔇 RingManager: ===== RING OFF PRESSED =====');
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    console.log('🔇 RingManager: Stopping', audioInstancesRef.current.length, 'audio instances');

    audioInstancesRef.current.forEach((audio, index) => {
      if (audio) {
        console.log(`🔇 RingManager: Stopping audio instance ${index}:`, audio.src);
        audio.pause();
        audio.currentTime = 0;
      }
    });
    audioInstancesRef.current = [];

    if (isRinging) {
      console.log('🔇 RingManager: Clearing ring state...');
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
    console.log('🔇 RingManager: ===== RING OFF COMPLETE =====');
  }, [isRinging, wakeLock]);

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff
  };
};
