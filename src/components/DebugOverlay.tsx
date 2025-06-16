
import React from 'react';

interface DebugLog {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface Props {
  logs: DebugLog[];
  onClear: () => void;
}

const DebugOverlay: React.FC<Props> = ({ logs, onClear }) => {
  if (logs.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 bg-black/90 text-white p-3 rounded-lg z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Debug Logs</h3>
        <button 
          onClick={onClear}
          className="text-xs bg-red-600 px-2 py-1 rounded"
        >
          Clear
        </button>
      </div>
      <div className="space-y-1">
        {logs.slice(-20).map((log, index) => (
          <div key={index} className="text-xs">
            <span className="text-gray-400">{log.timestamp}</span>{' '}
            <span className={
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-green-400' : 
              'text-blue-400'
            }>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugOverlay;
