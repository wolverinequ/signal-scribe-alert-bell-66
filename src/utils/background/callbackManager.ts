
import { Signal } from '@/types/signal';
import { setRingManagerCallback } from './taskState';

// Register ring manager callback for direct communication
export const registerRingManagerCallback = (callback: (signal: Signal) => void) => {
  setRingManagerCallback(callback);
  console.log('🎯 BackgroundTask: Ring manager callback registered');
};

// Unregister callback
export const unregisterRingManagerCallback = () => {
  setRingManagerCallback(null);
  console.log('🎯 BackgroundTask: Ring manager callback unregistered');
};
