
import React from 'react';
import { useSignalTracker } from '@/hooks/useSignalTracker';
import SignalInput from '@/components/SignalInput';
import ControlPanel from '@/components/ControlPanel';

const Index = () => {
  const {
    signalsText,
    setSignalsText,
    saveButtonPressed,
    setRingButtonPressed,
    handleRingOff,
    handleSaveSignals,
    handleSetRing
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
        setRingButtonPressed={setRingButtonPressed}
        onRingOff={handleRingOff}
        onSaveSignals={handleSaveSignals}
        onSetRing={handleSetRing}
      />
    </div>
  );
};

export default Index;
