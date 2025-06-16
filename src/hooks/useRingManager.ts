
import { useState, useCallback } from 'react';
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

  // Ring notification - only if MP3 is loaded
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('🔔 RingManager: Attempting to trigger ring for signal:', signal);
    console.log('🎵 RingManager: Current audio state - isRingtoneLoaded:', isRingtoneLoaded, 'customRingtone available:', !!customRingtone);

    if (!isRingtoneLoaded || !customRingtone) {
      console.log('❌ RingManager: Cannot ring - no MP3 file loaded');
      return;
    }

    console.log('✅ RingManager: Starting ring sequence with URL:', customRingtone.substring(0, 50) + '...');
    await startRinging(signal);

    try {
      console.log('🎵 RingManager: Playing custom ringtone with URL:', customRingtone.substring(0, 50) + '...');
      const audio = await playCustomRingtone(customRingtone);
      if (audio instanceof HTMLAudioElement) {
        addAudioInstance(audio);
        console.log('🔊 RingManager: Audio instance added successfully');
      }

      onSignalTriggered(signal);
      console.log('✅ RingManager: Signal triggered successfully:', signal);
    } catch (error) {
      console.error('❌ RingManager: Failed to play ringtone:', error);
      stopRinging();
    }
  }, [customRingtone, isRingtoneLoaded, startRinging, addAudioInstance, onSignalTriggered, stopRinging]);

  // Use signal monitoring hook - remove the redundant markSignalAsTriggered call
  const { markSignalAsTriggered } = useSignalMonitoring(
    savedSignals,
    antidelaySeconds,
    isRingtoneLoaded,
    customRingtone,
    triggerRing // This will handle both triggering and marking as triggered
  );

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = useCallback(() => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    console.log('🔇 RingManager: Ring off pressed');
    clearAllAudioInstances();
    stopRinging();

    console.log('✅ RingManager: All audio stopped and cleaned up');
  }, [clearAllAudioInstances, stopRinging]);

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff
  };
};
