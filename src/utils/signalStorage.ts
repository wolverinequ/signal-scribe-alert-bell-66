
import { Signal } from '@/types/signal';

const SIGNALS_STORAGE_KEY = 'binary_signals';
const ANTIDELAY_STORAGE_KEY = 'antidelay_seconds';

// Add loading guard to prevent multiple simultaneous storage operations
let isStorageOperationInProgress = false;

export const saveSignalsToStorage = (signals: Signal[]) => {
  if (isStorageOperationInProgress) {
    console.log('🔒 Storage: Save operation already in progress, skipping...');
    return;
  }

  isStorageOperationInProgress = true;
  
  try {
    localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(signals));
    console.log('💾 Storage: Signals saved to localStorage - count:', signals.length);
  } catch (error) {
    console.error('❌ Storage: Failed to save signals to localStorage:', error);
  } finally {
    isStorageOperationInProgress = false;
  }
};

export const loadSignalsFromStorage = (): Signal[] => {
  if (isStorageOperationInProgress) {
    console.log('🔒 Storage: Load operation blocked - save in progress');
    return [];
  }

  try {
    const stored = localStorage.getItem(SIGNALS_STORAGE_KEY);
    if (stored) {
      const signals = JSON.parse(stored);
      console.log('📥 Storage: Signals loaded from localStorage - count:', signals.length);
      return signals;
    }
  } catch (error) {
    console.error('❌ Storage: Failed to load signals from localStorage:', error);
  }
  return [];
};

export const saveAntidelayToStorage = (seconds: number) => {
  try {
    localStorage.setItem(ANTIDELAY_STORAGE_KEY, seconds.toString());
    console.log('💾 Storage: Antidelay saved:', seconds);
  } catch (error) {
    console.error('❌ Storage: Failed to save antidelay to localStorage:', error);
  }
};

export const loadAntidelayFromStorage = (): number => {
  try {
    const stored = localStorage.getItem(ANTIDELAY_STORAGE_KEY);
    if (stored) {
      const value = parseInt(stored, 10) || 15;
      console.log('📥 Storage: Antidelay loaded:', value);
      return value;
    }
  } catch (error) {
    console.error('❌ Storage: Failed to load antidelay from localStorage:', error);
  }
  return 15;
};

export const clearSignalsFromStorage = () => {
  if (isStorageOperationInProgress) {
    console.log('🔒 Storage: Clear operation blocked - save in progress');
    return;
  }

  try {
    localStorage.removeItem(SIGNALS_STORAGE_KEY);
    console.log('🗑️ Storage: Signals cleared from localStorage');
  } catch (error) {
    console.error('❌ Storage: Failed to clear signals from localStorage:', error);
  }
};
