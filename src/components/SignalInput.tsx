
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface SignalInputProps {
  signalsText: string;
  onSignalsTextChange: (text: string) => void;
}

const SignalInput = ({ signalsText, onSignalsTextChange }: SignalInputProps) => {
  return (
    <div className="flex-1 p-4 pb-2">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Binary Options Signal Tracker</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Enter signals in format: TIMEFRAME;ASSET;HH:MM;DIRECTION
        </p>
      </div>

      <Textarea
        value={signalsText}
        onChange={(e) => onSignalsTextChange(e.target.value)}
        placeholder="Example:&#10;1H;EURUSD;14:30;CALL&#10;5M;GBPUSD;15:45;PUT&#10;15M;USDJPY;16:00;CALL"
        className="h-[calc(100vh-200px)] text-base font-mono resize-none"
      />
    </div>
  );
};

export default SignalInput;
