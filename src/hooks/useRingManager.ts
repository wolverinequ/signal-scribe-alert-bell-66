
import { useState, useEffect, useRef, useCallback } from 'react';
import { Signal } from '@/types/signal';
import { checkSignalTime } from '@/utils/signalUtils';
import { playCustomRingtone, playDefaultBeep } from '@/utils/audioUtils';
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
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null);
  const { customRingtone, soundType, isRingtoneLoaded } = useAudioManager();
  const lastCheckRef = useRef<{ signals: Signal[]; antidelay: number; soundType: string | null }>({
    signals: [],
    antidelay: 0,
    soundType: null
  });

  // Add detailed logging when audio state changes
  useEffect(() => {
    console.log('🔊 RingManager: Audio state changed:', {
      customRingtone: customRingtone ? 'loaded' : 'none',
      soundType,
      isRingtoneLoaded
    });
  }, [customRingtone, soundType, isRingtoneLoaded]);

  // Helper: construct unique signal ID
  const getSignalId = useCallback((signal: Signal): string => {
    return `${signal.asset || 'NO_ASSET'}-${signal.direction || 'NO_DIRECTION'}-${signal.timestamp}`;
  }, []);

  // Ring notification - play once based on sound type
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('🔔 RingManager: Attempting to trigger ring for signal:', signal);
    console.log('🔔 RingManager: Current audio configuration:', {
      customRingtone: customRingtone ? 'available' : 'none',
      customRingtoneUrl: customRingtone,
      soundType,
      isRingtoneLoaded
    });

    if (!isRingtoneLoaded || !soundType) {
      console.log('❌ RingManager: Cannot ring - no sound configured:', {
        isRingtoneLoaded,
        soundType
      });
      return;
    }

    console.log('✅ RingManager: Starting ring sequence with sound type:', soundType);
    setIsRinging(true);
    setCurrentRingingSignal(signal);

    const lock = await requestWakeLock();
    setWakeLock(lock);

    if (document.hidden) {
      try {
        window.focus();
      } catch (e) {
        console.log('⚠️ RingManager: Could not focus window:', e);
      }
    }

    try {
      let audio: HTMLAudioElement | null = null;

      if (soundType === 'custom' && customRingtone) {
        console.log('🎵 RingManager: Playing custom ringtone:', customRingtone.substring(0, 50) + '...');
        audio = await playCustomRingtone(customRingtone, false); // false = play once
        console.log('✅ RingManager: Custom ringtone playback initiated');
      } else if (soundType === 'default') {
        console.log('🔊 RingManager: Playing default beep');
        audio = await playDefaultBeep();
        console.log('✅ RingManager: Default beep playback initiated');
      } else {
        console.error('❌ RingManager: Unknown sound configuration:', { soundType, customRingtone });
        // Fallback to default beep
        console.log('🔄 RingManager: Falling back to default beep');
        audio = await playDefaultBeep();
      }

      if (audio) {
        audioInstanceRef.current = audio;
        audio.addEventListener('ended', () => {
          console.log('🎵 RingManager: Audio playback completed');
          setIsRinging(false);
          setCurrentRingingSignal(null);
          releaseWakeLock(wakeLock);
          setWakeLock(null);
          audioInstanceRef.current = null;
        });
      }

      onSignalTriggered(signal);
      const signalId = getSignalId(signal);
      setAlreadyRangIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(signalId);
        return newSet;
      });
      
      console.log('✅ RingManager: Signal marked as triggered:', signalId);
    } catch (error) {
      console.error('❌ RingManager: Failed to play sound:', error);
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [customRingtone, soundType, isRingtoneLoaded, onSignalTriggered, getSignalId, wakeLock]);

  // Stable monitoring effect
  useEffect(() => {
    const hasSignals = savedSignals.length > 0;
    const canMonitor = isRingtoneLoaded && soundType;
    
    console.log('🔍 RingManager: Monitoring check:', {
      hasSignals,
      canMonitor,
      signalCount: savedSignals.length,
      isRingtoneLoaded,
      soundType
    });
    
    if (!hasSignals || !canMonitor) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏹️ RingManager: Signal monitoring stopped - conditions not met');
      }
      return;
    }

    // Check if we need to restart monitoring
    const currentCheck = {
      signals: savedSignals,
      antidelay: antidelaySeconds,
      soundType: soundType
    };

    const needsRestart = 
      JSON.stringify(currentCheck.signals) !== JSON.stringify(lastCheckRef.current.signals) ||
      currentCheck.antidelay !== lastCheckRef.current.antidelay ||
      currentCheck.soundType !== lastCheckRef.current.soundType;

    if (!needsRestart && intervalRef.current) {
      console.log('🔄 RingManager: Monitoring already active with same parameters');
      return; // Already monitoring with same parameters
    }

    // Stop existing monitoring
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      console.log('🔄 RingManager: Restarting monitoring with new parameters');
    }

    // Update last check reference
    lastCheckRef.current = currentCheck;
    
    console.log('🚀 RingManager: Starting signal monitoring with', savedSignals.length, 'signals');
    console.log('🚀 RingManager: Monitoring configuration:', {
      antidelaySeconds,
      soundType,
      customRingtoneAvailable: !!customRingtone
    });
    
    intervalRef.current = setInterval(() => {
      savedSignals.forEach(signal => {
        const signalId = getSignalId(signal);
        const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
        const notAlreadyRang = !alreadyRangIds.has(signalId);
        
        if (shouldTrigger && notAlreadyRang) {
          console.log(`🎯 RingManager: Signal should trigger:`, signal);
          triggerRing(signal);
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🧹 RingManager: Cleanup - monitoring stopped');
      }
    };
  }, [savedSignals.length, isRingtoneLoaded, soundType, antidelaySeconds, triggerRing, getSignalId, alreadyRangIds, customRingtone]);

  // Ring off button handler - stops audio immediately
  const handleRingOff = useCallback(() => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    console.log('🔇 RingManager: Ring off pressed - stopping audio');

    if (audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      audioInstanceRef.current.currentTime = 0;
      audioInstanceRef.current = null;
      console.log('🔇 RingManager: Audio stopped and cleared');
    }

    if (isRinging) {
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
      console.log('🔇 RingManager: Ring state cleared');
    }
  }, [isRinging, wakeLock]);

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff
  };
};
