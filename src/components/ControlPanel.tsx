
import React from 'react';
import { Button } from '@/components/ui/button';
import { BellOff, Save, PowerOff } from 'lucide-react';

interface ControlPanelProps {
  signalsText: string;
  saveButtonPressed: boolean;
  ringOffButtonPressed: boolean;
  onRingOff: () => void;
  onSaveSignals: () => void;
  onScreenOff: () => void;
}

const ControlPanel = ({
  signalsText,
  saveButtonPressed,
  ringOffButtonPressed,
  onRingOff,
  onSaveSignals,
  onScreenOff
}: ControlPanelProps) => {
  return (
    <div className="bg-card p-4">
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <Button
          onClick={onRingOff}
          variant="outline"
          className={`h-16 flex flex-col gap-1 transition-all duration-200 ${
            ringOffButtonPressed ? 'scale-95 bg-muted' : 'hover:bg-accent'
          }`}
        >
          <BellOff className="h-6 w-6" />
          <span className="text-xs">Ring Off</span>
        </Button>

        <Button
          onClick={onSaveSignals}
          variant="default"
          className={`h-16 flex flex-col gap-1 transition-all duration-200 ${
            saveButtonPressed ? 'scale-95 opacity-80' : 'hover:bg-primary/90'
          }`}
          disabled={!signalsText.trim()}
        >
          <Save className="h-6 w-6" />
          <span className="text-xs">Save</span>
        </Button>

        <Button
          onClick={onScreenOff}
          variant="secondary"
          className="h-16 flex flex-col gap-1 transition-all duration-200 hover:bg-secondary/80"
        >
          <PowerOff className="h-6 w-6" />
          <span className="text-xs">Screen Off</span>
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;
