
// Session manager to track app launches vs background returns
const SESSION_KEY = 'app_session_id';
const SESSION_SIGNALS_KEY = 'session_signals';

export class SessionManager {
  private static currentSessionId: string | null = null;

  // Generate a new session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current session ID
  static getCurrentSessionId(): string {
    if (!this.currentSessionId) {
      this.currentSessionId = this.generateSessionId();
    }
    return this.currentSessionId;
  }

  // Check if this is a fresh app launch (new session)
  static isFreshLaunch(): boolean {
    try {
      const storedSessionId = sessionStorage.getItem(SESSION_KEY);
      const currentId = this.getCurrentSessionId();
      
      console.log('🔄 SessionManager: Checking session status:', {
        storedSessionId,
        currentId,
        isFresh: !storedSessionId || storedSessionId !== currentId
      });
      
      if (!storedSessionId) {
        // No session stored = fresh launch
        console.log('🔄 SessionManager: Fresh launch detected - no previous session');
        return true;
      }
      
      if (storedSessionId !== currentId) {
        // Different session = fresh launch
        console.log('🔄 SessionManager: Fresh launch detected - different session ID');
        return true;
      }
      
      // Same session = returning from background
      console.log('🔄 SessionManager: Returning from background - same session');
      return false;
    } catch (error) {
      console.error('🔄 SessionManager: Error checking session:', error);
      // If we can't determine, assume fresh launch for safety
      return true;
    }
  }

  // Mark current session as active
  static markSessionActive(): void {
    try {
      const sessionId = this.getCurrentSessionId();
      sessionStorage.setItem(SESSION_KEY, sessionId);
      console.log('🔄 SessionManager: Session marked as active:', sessionId);
    } catch (error) {
      console.error('🔄 SessionManager: Error marking session active:', error);
    }
  }

  // Check if signals belong to current session
  static areSignalsFromCurrentSession(): boolean {
    try {
      const storedSessionSignals = localStorage.getItem(SESSION_SIGNALS_KEY);
      const currentSessionId = this.getCurrentSessionId();
      
      if (!storedSessionSignals) {
        console.log('🔄 SessionManager: No session signals found');
        return false;
      }
      
      const sessionData = JSON.parse(storedSessionSignals);
      const isCurrentSession = sessionData.sessionId === currentSessionId;
      
      console.log('🔄 SessionManager: Checking signals session:', {
        storedSessionId: sessionData.sessionId,
        currentSessionId,
        isCurrentSession
      });
      
      return isCurrentSession;
    } catch (error) {
      console.error('🔄 SessionManager: Error checking signals session:', error);
      return false;
    }
  }

  // Mark signals as belonging to current session
  static markSignalsForCurrentSession(): void {
    try {
      const currentSessionId = this.getCurrentSessionId();
      const sessionData = {
        sessionId: currentSessionId,
        timestamp: Date.now()
      };
      
      localStorage.setItem(SESSION_SIGNALS_KEY, JSON.stringify(sessionData));
      console.log('🔄 SessionManager: Signals marked for current session:', currentSessionId);
    } catch (error) {
      console.error('🔄 SessionManager: Error marking signals for session:', error);
    }
  }

  // Clear session signals marker
  static clearSessionSignals(): void {
    try {
      localStorage.removeItem(SESSION_SIGNALS_KEY);
      console.log('🔄 SessionManager: Session signals marker cleared');
    } catch (error) {
      console.error('🔄 SessionManager: Error clearing session signals:', error);
    }
  }
}
