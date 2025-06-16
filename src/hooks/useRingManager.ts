
import { useState, useCallback, useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { playCustomRingtone } from '@/utils/audioUtils';
import { useAudioManager } from './useAudioManager';
import { useRingingState } from './useRingingState';
import { useAudioInstances } from './useAudioInstances';
import { useSignalMonitoring } from './useSignalMonitoring';

export const useRingManager = (
  savedSignals: Signal[],
  antidelaySeconds: number,
  onSignalTriggered: (signal: Signal) => void
) => {
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  
  const { customRingtone, isRingtoneLoaded } = useAudioManager();
  const { isRinging, currentRingingSignal, startRinging, stopRinging } = useRingingState();
  const { addAudioInstance, clearAllAudioInstances } = useAudioInstances(customRingtone);
  
  // Track the current ringtone to detect changes
  const currentRingtoneRef = useRef<string | null>(null);

  // FORCE clear all audio instances when customRingtone changes
  useEffect(() => {
    console.log('🔄 RingManager: Checking for ringtone change...');
    console.log('🎵 RingManager: Current ringtone:', customRingtone?.substring(0, 50) + '...');
    console.log('🎵 RingManager: Previous ringtone:', currentRingtoneRef.current?.substring(0, 50) + '...');
    
    if (customRingtone !== currentRingtoneRef.current) {
      console.log('🚨 RingManager: NEW MP3 DETECTED - FORCE STOPPING ALL AUDIO');
      
      // IMMEDIATELY stop all audio
      clearAllAudioInstances();
      
      // Update the reference
      currentRingtoneRef.current = customRingtone;
      
      console.log('✅ RingManager: Audio cleared for new MP3:', customRingtone?.substring(0, 50) + '...');
    }
  }, [customRingtone, clearAllAudioInstances]);

  // Create fresh triggerRing function that ALWAYS uses current customRingtone
  const triggerRing = useCallback(async (signal: Signal) => {
    // Get the CURRENT customRingtone value directly from the hook
    const currentAudioUrl = customRingtone;
    
    console.log('🔔 RingManager: TRIGGERING RING for signal:', signal);
    console.log('🎵 RingManager: Using CURRENT audio URL:', currentAudioUrl?.substring(0, 50) + '...');
    console.log('🎵 RingManager: Audio loaded status:', isRingtoneLoaded);

    if (!isRingtoneLoaded || !currentAudioUrl) {
      console.log('❌ RingManager: Cannot ring - no MP3 file loaded');
      return;
    }

    console.log('✅ RingManager: Starting ring with FRESH audio URL:', currentAudioUrl.substring(0, 50) + '...');
    await startRinging(signal);

    try {
      console.log('🎵 RingManager: Playing ringtone with URL:', currentAudioUrl.substring(0, 50) + '...');
      const audio = await playCustomRingtone(currentAudioUrl);
      if (audio instanceof HTMLAudioElement) {
        addAudioInstance(audio);
        console.log('🔊 RingManager: NEW audio instance added successfully');
      }

      onSignalTriggered(signal);
      console.log('✅ RingManager: Signal triggered successfully with current MP3');
    } catch (error) {
      console.error('❌ RingManager: Failed to play ringtone:', error);
      stopRinging();
    }
  }, [customRingtone, isRingtoneLoaded, startRinging, addAudioInstance, onSignalTriggered, stopRinging]);

  // Use signal monitoring hook
  const { markSignalAsTriggered } = useSignalMonitoring(
    savedSignals,
    antidelaySeconds,
    isRingtoneLoaded,
    customRingtone,
    triggerRing
  );

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = useCallback(() => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    console.log('🔇 RingManager: Ring off pressed - FORCE STOPPING ALL AUDIO');
    clearAllAudioInstances();
    stopRinging();

    console.log('✅ RingManager: All audio FORCE STOPPED');
  }, [clearAllAudioInstances, stopRinging]);

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff
  };
};
