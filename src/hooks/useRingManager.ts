
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

  // Force clear all audio instances when ringtone changes
  useEffect(() => {
    console.log('🔄 RingManager: Audio state changed - customRingtone:', customRingtone?.substring(0, 50) + '...', 'isLoaded:', isRingtoneLoaded);
    
    // Clear all existing audio instances immediately
    if (audioInstancesRef.current.length > 0) {
      console.log('🧹 RingManager: Clearing', audioInstancesRef.current.length, 'cached audio instances');
      audioInstancesRef.current.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          audio.src = '';
        }
      });
      audioInstancesRef.current = [];
      console.log('✅ RingManager: All audio instances cleared');
    }
    
    // Stop any current ringing when audio changes
    if (isRinging) {
      console.log('🔇 RingManager: Stopping current ringing due to audio change');
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [customRingtone, isRinging, wakeLock]);

  // Helper: construct unique signal ID
  const getSignalId = useCallback((signal: Signal): string => {
    return `${signal.asset || 'NO_ASSET'}-${signal.direction || 'NO_DIRECTION'}-${signal.timestamp}`;
  }, []);

  // Ring notification - only if MP3 is loaded
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('🔔 RingManager: Attempting to trigger ring for signal:', signal);
    console.log('🎵 RingManager: Current audio state - isRingtoneLoaded:', isRingtoneLoaded, 'customRingtone available:', !!customRingtone);

    if (!isRingtoneLoaded || !customRingtone) {
      console.log('❌ RingManager: Cannot ring - no MP3 file loaded');
      return;
    }

    console.log('✅ RingManager: Starting ring sequence with URL:', customRingtone.substring(0, 50) + '...');
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
      console.log('🎵 RingManager: Playing custom ringtone with URL:', customRingtone.substring(0, 50) + '...');
      const audio = await playCustomRingtone(customRingtone);
      if (audio instanceof HTMLAudioElement) {
        audioInstancesRef.current.push(audio);
        console.log('🔊 RingManager: Audio instance added to tracking, total instances:', audioInstancesRef.current.length);
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
      console.error('❌ RingManager: Failed to play ringtone:', error);
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [customRingtone, isRingtoneLoaded, onSignalTriggered, getSignalId, wakeLock]);

  // Simplified monitoring effect - restart immediately on any change
  useEffect(() => {
    const hasSignals = savedSignals.length > 0;
    const canMonitor = isRingtoneLoaded && customRingtone;
    
    console.log('🔍 RingManager: Monitoring check - signals:', hasSignals, 'canMonitor:', canMonitor, 'ringtone:', customRingtone?.substring(0, 50) + '...');
    
    // Stop existing monitoring first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ RingManager: Stopped previous monitoring');
    }

    if (!hasSignals || !canMonitor) {
      console.log('❌ RingManager: Cannot start monitoring - conditions not met');
      return;
    }

    console.log('🚀 RingManager: Starting signal monitoring with', savedSignals.length, 'signals');
    console.log('🎵 RingManager: Using ringtone URL:', customRingtone?.substring(0, 50) + '...');
    
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      savedSignals.forEach(signal => {
        const signalId = getSignalId(signal);
        const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
        const notAlreadyRang = !alreadyRangIds.has(signalId);
        
        if (shouldTrigger && notAlreadyRang) {
          console.log(`🎯 RingManager: Signal should trigger at ${currentTime}:`, signal);
          triggerRing(signal);
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🧹 RingManager: Monitoring cleanup complete');
      }
    };
  }, [savedSignals, antidelaySeconds, isRingtoneLoaded, customRingtone, triggerRing, getSignalId, alreadyRangIds]);

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = useCallback(() => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    console.log('🔇 RingManager: Ring off pressed - stopping', audioInstancesRef.current.length, 'audio instances');

    audioInstancesRef.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
      }
    });
    audioInstancesRef.current = [];

    if (isRinging) {
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }

    console.log('✅ RingManager: All audio stopped and cleaned up');
  }, [isRinging, wakeLock]);

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff
  };
};
