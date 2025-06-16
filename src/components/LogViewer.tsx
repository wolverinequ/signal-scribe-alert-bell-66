
import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Trash2 } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  args: any[];
}

interface LogViewerProps {
  open: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onClearLogs: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ open, onClose, logs, onClearLogs }) => {
  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500 bg-red-50';
      case 'warn':
        return 'text-yellow-500 bg-yellow-50';
      case 'info':
        return 'text-blue-500 bg-blue-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const getPriorityIcon = (message: string) => {
    if (message.includes('❌') || message.includes('error') || message.includes('Error')) return '🚨';
    if (message.includes('⚠️') || message.includes('warn')) return '⚠️';
    if (message.includes('✅') || message.includes('🎵') || message.includes('🔔')) return '✅';
    return '📝';
  };

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>Debug Logs ({logs.length})</DrawerTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearLogs}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-1">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No relevant logs captured yet.<br/>
                Logs are filtered to show only audio/ring related messages.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`border rounded p-2 text-xs font-mono ${getLogColor(log.level)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold flex items-center gap-1">
                      <span>{getPriorityIcon(log.message)}</span>
                      <span>[{log.level.toUpperCase()}]</span>
                    </span>
                    <span className="text-xs opacity-70">
                      {log.timestamp}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap break-words text-xs leading-tight">
                    {log.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

export default LogViewer;
