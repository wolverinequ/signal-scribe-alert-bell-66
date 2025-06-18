
// Background task state management
let backgroundCheckInterval: NodeJS.Timeout | undefined;
let ringManagerCallback: ((signal: any) => void) | null = null;
let backgroundTaskRunning = false;
let lastSignalCheckTime = 0;
let intervalCounter = 0;

export const getBackgroundTaskState = () => ({
  backgroundCheckInterval,
  ringManagerCallback,
  backgroundTaskRunning,
  lastSignalCheckTime,
  intervalCounter
});

export const setBackgroundCheckInterval = (interval: NodeJS.Timeout | undefined) => {
  backgroundCheckInterval = interval;
};

export const setRingManagerCallback = (callback: ((signal: any) => void) | null) => {
  ringManagerCallback = callback;
};

export const setBackgroundTaskRunning = (running: boolean) => {
  backgroundTaskRunning = running;
};

export const setLastSignalCheckTime = (time: number) => {
  lastSignalCheckTime = time;
};

export const setIntervalCounter = (counter: number) => {
  intervalCounter = counter;
};

export const incrementIntervalCounter = () => {
  intervalCounter++;
};
