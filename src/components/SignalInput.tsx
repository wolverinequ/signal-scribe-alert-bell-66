
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';

interface SignalInputProps {
  signalsText: string;
  onSignalsTextChange: (text: string) => void;
  isKeyboardVisible?: boolean;
}

const SignalInput = ({ signalsText, onSignalsTextChange }: SignalInputProps) => {
  const isKeyboardVisible = useKeyboardDetection();

  return (
    <div className="flex-1 p-4 pb-2">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Binary Options Signal Tracker</h1>
      </div>

      <Textarea
        value={signalsText}
        onChange={(e) => onSignalsTextChange(e.target.value)}
        placeholder="Enter signals here, one per line,&#10;Format: TIMEFRAME;ASSET;HH:MM;DIRECTION&#10;Example:&#10;1H;EURUSD;14:30;CALL&#10;5M;GBPUSD;15:45;PUT&#10;15M;USDJPY;16:00;CALL"
        className={`text-base font-mono resize-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 ${
          isKeyboardVisible 
            ? 'h-[30vh]' // Reduced height when keyboard is visible
            : 'h-[calc(100vh-200px)]' // Full height when keyboard is hidden
        }`}
      />
    </div>
  );
};

export default SignalInput;
