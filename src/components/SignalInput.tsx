
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface SignalInputProps {
  signalsText: string;
  onSignalsTextChange: (text: string) => void;
}

const SignalInput = ({ signalsText, onSignalsTextChange }: SignalInputProps) => {
  return (
    <div className="flex-1 flex flex-col p-4 pb-2 min-h-0">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold mb-2 text-center">Binary Options Signal Tracker</h1>
      </div>

      <Textarea
        value={signalsText}
        onChange={(e) => onSignalsTextChange(e.target.value)}
        placeholder="Enter signals here, one per line,&#10;Format: TIMEFRAME;ASSET;HH:MM;DIRECTION&#10;Example:&#10;1H;EURUSD;14:30;CALL&#10;5M;GBPUSD;15:45;PUT&#10;15M;USDJPY;16:00;CALL"
        className="flex-1 min-h-0 text-base font-mono resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
      />
    </div>
  );
};

export default SignalInput;
