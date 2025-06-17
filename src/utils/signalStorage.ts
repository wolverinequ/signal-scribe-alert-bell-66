
import { Signal } from '@/types/signal';
import { SessionManager } from './sessionManager';

const SIGNALS_STORAGE_KEY = 'binary_signals';
const ANTIDELAY_STORAGE_KEY = 'antidelay_seconds';

// Cache for signals to avoid repeated localStorage reads
let signalsCache: Signal[] | null = null;
let antidelayCache: number | null = null;

export const saveSignalsToStorage = (signals: Signal[]) => {
  try {
    localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(signals));
    
    // Mark signals as belonging to current session
    SessionManager.markSignalsForCurrentSession();
    
    // Update cache when saving
    signalsCache = signals;
    console.log('📦 SignalStorage: Signals saved to localStorage:', signals);
    console.log('📦 SignalStorage: Signals marked for current session');
  } catch (error) {
    console.error('📦 SignalStorage: Failed to save signals to localStorage:', error);
  }
};

export const loadSignalsFromStorage = (): Signal[] => {
  // Check if this is a fresh launch
  const isFreshLaunch = SessionManager.isFreshLaunch();
  
  if (isFreshLaunch) {
    console.log('📦 SignalStorage: Fresh launch detected - clearing old signals');
    
    // Clear old signals on fresh launch
    try {
      localStorage.removeItem(SIGNALS_STORAGE_KEY);
      SessionManager.clearSessionSignals();
    } catch (error) {
      console.error('📦 SignalStorage: Error clearing old signals:', error);
    }
    
    // Mark session as active for future background/foreground detection
    SessionManager.markSessionActive();
    
    // Cache empty array and return
    signalsCache = [];
    return [];
  }

  // Check if we have cached data for returning from background
  if (signalsCache !== null) {
    console.log('📦 SignalStorage: Returning cached signals (background return)');
    return signalsCache;
  }

  try {
    const stored = localStorage.getItem(SIGNALS_STORAGE_KEY);
    if (stored) {
      const signals = JSON.parse(stored);
      
      // Check if signals belong to current session
      const areCurrentSessionSignals = SessionManager.areSignalsFromCurrentSession();
      
      if (areCurrentSessionSignals) {
        // Cache the loaded data
        signalsCache = signals;
        console.log('📦 SignalStorage: Signals loaded from current session:', signals);
        return signals;
      } else {
        console.log('📦 SignalStorage: Signals from different session - clearing');
        // Clear signals from different session
        localStorage.removeItem(SIGNALS_STORAGE_KEY);
        SessionManager.clearSessionSignals();
        signalsCache = [];
        return [];
      }
    }
  } catch (error) {
    console.error('📦 SignalStorage: Failed to load signals from localStorage:', error);
  }
  
  // Cache empty array
  signalsCache = [];
  return [];
};

export const saveAntidelayToStorage = (seconds: number) => {
  try {
    localStorage.setItem(ANTIDELAY_STORAGE_KEY, seconds.toString());
    // Update cache when saving
    antidelayCache = seconds;
    console.log('📦 SignalStorage: Antidelay saved (preserved across sessions):', seconds);
  } catch (error) {
    console.error('📦 SignalStorage: Failed to save antidelay to localStorage:', error);
  }
};

export const loadAntidelayFromStorage = (): number => {
  // Return cached data if available
  if (antidelayCache !== null) {
    return antidelayCache;
  }

  try {
    const stored = localStorage.getItem(ANTIDELAY_STORAGE_KEY);
    if (stored) {
      const antidelay = parseInt(stored, 10) || 15;
      // Cache the loaded data
      antidelayCache = antidelay;
      console.log('📦 SignalStorage: Antidelay loaded (preserved across sessions):', antidelay);
      return antidelay;
    }
  } catch (error) {
    console.error('📦 SignalStorage: Failed to load antidelay from localStorage:', error);
  }
  
  // Cache default value
  antidelayCache = 15;
  return 15;
};

export const clearSignalsFromStorage = () => {
  try {
    localStorage.removeItem(SIGNALS_STORAGE_KEY);
    SessionManager.clearSessionSignals();
    // Clear cache when removing
    signalsCache = null;
    console.log('📦 SignalStorage: Signals cleared from localStorage and session');
  } catch (error) {
    console.error('📦 SignalStorage: Failed to clear signals from localStorage:', error);
  }
};

// Function to invalidate cache (useful for debugging or manual refresh)
export const invalidateSignalsCache = () => {
  signalsCache = null;
  antidelayCache = null;
  console.log('📦 SignalStorage: Cache invalidated');
};
