
import React from 'react';
import { Button } from '@/components/ui/button';
import { BellOff, Save, Bell } from 'lucide-react';

interface ControlPanelProps {
  signalsText: string;
  saveButtonPressed: boolean;
  ringOffButtonPressed: boolean;
  setRingButtonPressed: boolean;
  onRingOff: () => void;
  onSaveSignals: () => void;
  onSetRingMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onSetRingMouseUp: (e: React.MouseEvent | React.TouchEvent) => void;
  onSetRingMouseLeave: () => void;
}

const ControlPanel = ({
  signalsText,
  saveButtonPressed,
  ringOffButtonPressed,
  setRingButtonPressed,
  onRingOff,
  onSaveSignals,
  onSetRingMouseDown,
  onSetRingMouseUp,
  onSetRingMouseLeave
}: ControlPanelProps) => {
  const handleRingOffClick = () => {
    onRingOff();
    // Remove focus after click to return to original color
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 200);
  };

  const handleSaveClick = () => {
    onSaveSignals();
    // Remove focus after click to return to original color
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 200);
  };

  return (
    <div className="bg-card p-4 flex-shrink-0">
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <Button
          onClick={handleRingOffClick}
          variant="outline"
          className={`h-16 flex flex-col gap-1 transition-transform duration-200 select-none hover:bg-background focus:bg-background active:bg-background ${
            ringOffButtonPressed ? 'scale-95' : ''
          }`}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <BellOff className="h-6 w-6" />
          <span className="text-xs">Ring Off</span>
        </Button>

        <Button
          onClick={handleSaveClick}
          variant="default"
          className={`h-16 flex flex-col gap-1 transition-transform duration-200 select-none bg-primary text-primary-foreground hover:bg-primary focus:bg-primary active:bg-primary ${
            saveButtonPressed ? 'scale-95' : ''
          } ${!signalsText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!signalsText.trim()}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <Save className="h-6 w-6" />
          <span className="text-xs">Save</span>
        </Button>

        <Button
          onMouseDown={onSetRingMouseDown}
          onMouseUp={onSetRingMouseUp}
          onMouseLeave={onSetRingMouseLeave}
          onTouchStart={onSetRingMouseDown}
          onTouchEnd={onSetRingMouseUp}
          variant="outline"
          className={`h-16 flex flex-col gap-1 transition-transform duration-200 select-none hover:bg-background focus:bg-background active:bg-background ${
            setRingButtonPressed ? 'scale-95' : ''
          }`}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <Bell className="h-6 w-6" />
          <span className="text-xs">Set Ring</span>
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;
