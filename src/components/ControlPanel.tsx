
import React from 'react';
import { Button } from '@/components/ui/button';
import { BellOff, Save, Bell } from 'lucide-react';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';

interface ControlPanelProps {
  signalsText: string;
  saveButtonPressed: boolean;
  setRingButtonPressed: boolean;
  onRingOff: () => void;
  onSaveSignals: () => void;
  onSetRing: () => void;
}

const ControlPanel = ({
  signalsText,
  saveButtonPressed,
  setRingButtonPressed,
  onRingOff,
  onSaveSignals,
  onSetRing
}: ControlPanelProps) => {
  const isKeyboardVisible = useKeyboardDetection();

  const handleSaveClick = () => {
    // Hide keyboard by blurring any active input/textarea
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      activeElement.blur();
    }
    onSaveSignals();
  };

  return (
    <div className={`bg-card p-4 transition-all duration-300 ${
      isKeyboardVisible 
        ? 'fixed bottom-0 left-0 right-0 z-50 border-t' // Fixed position above keyboard
        : 'relative' // Normal position
    }`}>
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <Button
          onClick={onRingOff}
          variant="outline"
          className="h-16 flex flex-col gap-1 transition-all duration-200 hover:bg-accent"
        >
          <BellOff className="h-6 w-6" />
          <span className="text-xs">Ring Off</span>
        </Button>

        <Button
          onClick={handleSaveClick}
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
          onClick={onSetRing}
          variant="secondary"
          className={`h-16 flex flex-col gap-1 transition-all duration-200 ${
            setRingButtonPressed ? 'scale-95 bg-muted' : 'hover:bg-secondary/80'
          }`}
        >
          <Bell className="h-6 w-6" />
          <span className="text-xs">Set Ring</span>
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;
