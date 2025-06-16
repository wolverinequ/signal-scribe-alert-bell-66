
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
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>App Logs ({logs.length})</DrawerTitle>
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
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No logs captured yet
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded p-3 text-sm font-mono"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold ${getLogColor(log.level)}`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-xs text-gray-500">
                      {log.timestamp}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap break-words">
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
