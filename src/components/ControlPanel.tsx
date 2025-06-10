
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BellOff, Save, MonitorOff } from 'lucide-react';

interface ControlPanelProps {
  signalsText: string;
  saveButtonPressed: boolean;
  ringOffButtonPressed: boolean;
  setRingButtonPressed: boolean;
  onRingOff: () => void;
  onSaveSignals: () => void;
  onSetRing: () => void;
  onScreenOff: () => void;
}

const ControlPanel = ({
  signalsText,
  saveButtonPressed,
  ringOffButtonPressed,
  setRingButtonPressed,
  onRingOff,
  onSaveSignals,
  onSetRing,
  onScreenOff
}: ControlPanelProps) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleRingOffStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onSetRing(); // Trigger ringtone selection after 3 seconds
    }, 3000);
  };

  const handleRingOffEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Only trigger ring off if it wasn't a long press
    if (!isLongPress.current) {
      onRingOff();
    }
  };

  const handleRingOffCancel = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    isLongPress.current = false;
  };

  return (
    <div className="bg-card p-4">
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <Button
          onMouseDown={handleRingOffStart}
          onMouseUp={handleRingOffEnd}
          onMouseLeave={handleRingOffCancel}
          onTouchStart={handleRingOffStart}
          onTouchEnd={handleRingOffEnd}
          onTouchCancel={handleRingOffCancel}
          variant="outline"
          className={`h-16 flex flex-col gap-1 transition-all duration-200 select-none ${
            ringOffButtonPressed ? 'scale-95 bg-muted' : 'hover:bg-accent'
          }`}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <BellOff className="h-6 w-6" />
          <span className="text-xs">Ring Off</span>
        </Button>

        <Button
          onClick={onSaveSignals}
          variant="default"
          className={`h-16 flex flex-col gap-1 transition-all duration-200 select-none ${
            saveButtonPressed ? 'scale-95 opacity-80' : 'hover:bg-primary/90'
          }`}
          disabled={!signalsText.trim()}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <Save className="h-6 w-6" />
          <span className="text-xs">Save</span>
        </Button>

        <Button
          onClick={onScreenOff}
          variant="secondary"
          className={`h-16 flex flex-col gap-1 transition-all duration-200 select-none ${
            setRingButtonPressed ? 'scale-95 bg-muted' : 'hover:bg-secondary/80'
          }`}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <MonitorOff className="h-6 w-6" />
          <span className="text-xs">Screen Off</span>
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;
