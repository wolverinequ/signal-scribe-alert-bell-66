
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

  // Helper: construct unique signal ID
  const getSignalId = useCallback((signal: Signal): string => {
    return `${signal.asset || 'NO_ASSET'}-${signal.direction || 'NO_DIRECTION'}-${signal.timestamp}`;
  }, []);

  // Ring notification - play once based on sound type
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('🔔 Attempting to trigger ring for signal:', signal);

    if (!isRingtoneLoaded || !soundType) {
      console.log('❌ Cannot ring - no sound configured');
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
      let audio: HTMLAudioElement | null = null;

      if (soundType === 'custom' && customRingtone) {
        console.log('🎵 Playing custom ringtone once...');
        audio = await playCustomRingtone(customRingtone, false); // false = play once
      } else {
        console.log('🔊 Playing default beep once...');
        audio = await playDefaultBeep();
      }

      if (audio) {
        audioInstanceRef.current = audio;
        audio.addEventListener('ended', () => {
          console.log('🎵 Audio playback completed');
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
      
      console.log('✅ Signal marked as triggered:', signalId);
    } catch (error) {
      console.error('❌ Failed to play sound:', error);
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
    
    if (!hasSignals || !canMonitor) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏹️ Signal monitoring stopped - conditions not met');
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
      return; // Already monitoring with same parameters
    }

    // Stop existing monitoring
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update last check reference
    lastCheckRef.current = currentCheck;
    
    console.log('🚀 Starting signal monitoring with', savedSignals.length, 'signals');
    
    intervalRef.current = setInterval(() => {
      savedSignals.forEach(signal => {
        const signalId = getSignalId(signal);
        const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
        const notAlreadyRang = !alreadyRangIds.has(signalId);
        
        if (shouldTrigger && notAlreadyRang) {
          console.log(`🎯 Signal should trigger:`, signal);
          triggerRing(signal);
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [savedSignals.length, isRingtoneLoaded, soundType, antidelaySeconds, triggerRing, getSignalId, alreadyRangIds]);

  // Ring off button handler - stops audio immediately
  const handleRingOff = useCallback(() => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    console.log('🔇 Ring off pressed - stopping audio');

    if (audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      audioInstanceRef.current.currentTime = 0;
      audioInstanceRef.current = null;
    }

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
