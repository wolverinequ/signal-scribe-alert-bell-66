
import { setupEventCommunication } from './eventHandler';
import { checkSignalsInBackground } from './signalChecker';
import { 
  getBackgroundTaskState, 
  setBackgroundCheckInterval, 
  setBackgroundTaskRunning, 
  setLastSignalCheckTime, 
  setIntervalCounter, 
  incrementIntervalCounter 
} from './taskState';

export const startBackgroundTask = async () => {
  const { backgroundTaskRunning } = getBackgroundTaskState();
  
  // Prevent multiple instances
  if (backgroundTaskRunning) {
    console.log('🎯 BackgroundTask: Already running, skipping start');
    return;
  }

  try {
    // Setup event communication first
    setupEventCommunication();

    console.log('🎯 BackgroundTask: Starting unified background monitoring (audio only)');
    
    // Stop any existing interval first (cleanup)
    const { backgroundCheckInterval } = getBackgroundTaskState();
    if (backgroundCheckInterval) {
      clearInterval(backgroundCheckInterval);
    }
    
    setBackgroundTaskRunning(true);
    setIntervalCounter(0);
    
    // Start checking signals every 1000ms (1 second)
    const newInterval = setInterval(async () => {
      const currentTime = Date.now();
      setLastSignalCheckTime(currentTime);
      incrementIntervalCounter();
      
      const { intervalCounter } = getBackgroundTaskState();
      // Heartbeat logging every 30 seconds to reduce console spam
      if (intervalCounter % 30 === 0) {
        console.log(`🎯 BackgroundTask: Active - checking signals at ${new Date().toLocaleTimeString()} (heartbeat #${intervalCounter})`);
      }
      
      await checkSignalsInBackground();
    }, 1000);

    setBackgroundCheckInterval(newInterval);

    // Failsafe mechanism - check if interval is still running every 30 seconds
    setInterval(() => {
      const { lastSignalCheckTime, backgroundCheckInterval } = getBackgroundTaskState();
      const timeSinceLastCheck = Date.now() - lastSignalCheckTime;
      if (timeSinceLastCheck > 3000) { // If no check in 3 seconds, restart
        console.warn('🎯 BackgroundTask: Failsafe triggered - restarting signal checking');
        if (backgroundCheckInterval) {
          clearInterval(backgroundCheckInterval);
        }
        // Restart the interval
        setIntervalCounter(0);
        const restartInterval = setInterval(async () => {
          setLastSignalCheckTime(Date.now());
          incrementIntervalCounter();
          await checkSignalsInBackground();
        }, 1000);
        setBackgroundCheckInterval(restartInterval);
      }
    }, 30000);

    console.log('🎯 BackgroundTask: Unified background monitoring started (audio only)');

  } catch (error) {
    console.error('🎯 BackgroundTask: Failed to start:', error);
    setBackgroundTaskRunning(false);
  }
};

export const stopBackgroundTask = () => {
  const { backgroundCheckInterval } = getBackgroundTaskState();
  if (backgroundCheckInterval) {
    clearInterval(backgroundCheckInterval);
    setBackgroundCheckInterval(undefined);
  }
  setBackgroundTaskRunning(false);
  console.log('🎯 BackgroundTask: Unified background task stopped');
};
