
import { useState, useCallback } from 'react';

interface DebugLog {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

export const useVisualDebugger = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);

  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: DebugLog = { timestamp, message, type };
    
    console.log(`🔍 Visual Debug [${type.toUpperCase()}]: ${message}`);
    
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
};
