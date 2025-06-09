
import React from 'react';
import { useSignalTracker } from '@/hooks/useSignalTracker';
import SignalInput from '@/components/SignalInput';
import ControlPanel from '@/components/ControlPanel';

const Index = () => {
  const {
    signalsText,
    setSignalsText,
    saveButtonPressed,
    ringOffButtonPressed,
    handleRingOff,
    handleSaveSignals,
    handleScreenOff
  } = useSignalTracker();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SignalInput
        signalsText={signalsText}
        onSignalsTextChange={setSignalsText}
      />
      
      <ControlPanel
        signalsText={signalsText}
        saveButtonPressed={saveButtonPressed}
        ringOffButtonPressed={ringOffButtonPressed}
        onRingOff={handleRingOff}
        onSaveSignals={handleSaveSignals}
        onScreenOff={handleScreenOff}
      />
    </div>
  );
};

export default Index;
