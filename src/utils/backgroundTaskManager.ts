
import { Signal } from '@/types/signal';

// Main export file for background task management
export { startBackgroundTask, stopBackgroundTask } from './background/taskManager';
export { registerRingManagerCallback, unregisterRingManagerCallback } from './background/callbackManager';

// Remove all notification-related functions - keeping only the stub for compatibility
export const scheduleAllSignalNotifications = async (signals: Signal[]) => {
  // Notification scheduling disabled - audio-only mode
  console.log('🎯 BackgroundTask: Notification scheduling disabled (audio-only mode)');
};
