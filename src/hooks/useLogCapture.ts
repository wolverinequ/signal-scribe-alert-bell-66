
import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  args: any[];
}

export const useLogCapture = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);

  useEffect(() => {
    // Store original console methods
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    const isRelevantLog = (message: string): boolean => {
      const keywords = [
        '🎵', '🔔', '🔊', '🎯', '🔇', '❌', '✅', '⚠️',
        'AudioManager', 'RingManager', 'AudioUtils',
        'ringtone', 'audio', 'blob', 'MP3', 'customRingtone',
        'isRingtoneLoaded', 'triggerRing', 'monitoring',
        'error', 'failed', 'Error', 'undefined', 'null'
      ];
      
      return keywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
    };

    const captureLog = (level: LogEntry['level'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      // Only capture relevant logs
      if (!isRelevantLog(message)) {
        return;
      }
      
      const timestamp = new Date().toLocaleTimeString();
      
      const logEntry: LogEntry = {
        id: `log-${logIdRef.current++}`,
        timestamp,
        level,
        message,
        args
      };

      setLogs(prevLogs => [...prevLogs.slice(-49), logEntry]); // Keep last 50 relevant logs
    };

    // Override console methods
    console.log = (...args) => {
      originalLog(...args);
      captureLog('log', args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      captureLog('info', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      captureLog('warn', args);
    };

    console.error = (...args) => {
      originalError(...args);
      captureLog('error', args);
    };

    // Cleanup on unmount
    return () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  return { logs, clearLogs };
};
