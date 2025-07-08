
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface SignalInputProps {
  signalsText: string;
  onSignalsTextChange: (text: string) => void;
}

const SignalInput = ({ signalsText, onSignalsTextChange }: SignalInputProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex-1 p-4 pb-2">
      <div className="mb-4">
        <div className="text-left">
          <span className="text-2xl font-bold font-mono">{formatTime(currentTime)}</span>
        </div>
      </div>

      <Textarea
        value={signalsText}
        onChange={(e) => onSignalsTextChange(e.target.value)}
        placeholder="Enter signals here, one per line,&#10;Format: TIMEFRAME;ASSET;HH:MM;DIRECTION&#10;Example:&#10;1H;EURUSD;14:30;CALL&#10;5M;GBPUSD;15:45;PUT&#10;15M;USDJPY;16:00;CALL"
        className="h-[calc(100vh-180px)] text-base font-mono resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
      />
    </div>
  );
};

export default SignalInput;
