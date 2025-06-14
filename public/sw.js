
// Main service worker - orchestrates all functionality
import { setupServiceWorker, handleVisibilityMessages } from './sw-core.js';
import { setupSyncHandler } from './sw-signals.js';
import { setupNotificationHandlers, setupMessageHandlers } from './sw-notifications.js';

// Initialize all service worker functionality
setupServiceWorker();
setupSyncHandler();
setupNotificationHandlers();
setupMessageHandlers();
handleVisibilityMessages();
