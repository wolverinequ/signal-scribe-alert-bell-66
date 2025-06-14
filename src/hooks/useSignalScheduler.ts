
import { useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { checkSignalTime } from '@/utils/signalUtils';

export const useSignalScheduler = (
  savedSignals: Signal[],
  updateSignals: (signals: Signal[]) => void,
  antidelaySeconds: number,
  triggerRing: (signal: Signal) => void,
  customRingtone: string | null
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check signals every second for precise timing
  useEffect(() => {
    if (savedSignals.length > 0) {
      intervalRef.current = setInterval(() => {
        savedSignals.forEach(signal => {
          if (checkSignalTime(signal, antidelaySeconds)) {
            triggerRing(signal);
            
            // Mark signal as triggered and save to storage
            const updatedSignals = savedSignals.map(s => 
              s === signal ? { ...s, triggered: true } : s
            );
            updateSignals(updatedSignals);
          }
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [savedSignals, customRingtone, antidelaySeconds, triggerRing, updateSignals]);

  return {
    // This hook manages the interval internally, no need to expose anything
  };
};
