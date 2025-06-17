
import React from 'react';
import { useSignalTracker } from '@/hooks/useSignalTracker';
import SignalInput from '@/components/SignalInput';
import ControlPanel from '@/components/ControlPanel';
import AntidelayDialog from '@/components/AntidelayDialog';

const Index = () => {
  const {
    signalsText,
    setSignalsText,
    saveButtonPressed,
    ringOffButtonPressed,
    setRingButtonPressed,
    showAntidelayDialog,
    antidelayInput,
    setAntidelayInput,
    antidelaySeconds,
    handleRingOff,
    handleSaveSignals,
    handleSetRingMouseDown,
    handleSetRingMouseUp,
    handleSetRingMouseLeave,
    handleAntidelaySubmit,
    handleAntidelayCancel
  } = useSignalTracker();

  return (
    <div className="flex flex-col bg-background select-none h-full overflow-hidden" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <SignalInput
        signalsText={signalsText}
        onSignalsTextChange={setSignalsText}
      />
      
      <ControlPanel
        signalsText={signalsText}
        saveButtonPressed={saveButtonPressed}
        ringOffButtonPressed={ringOffButtonPressed}
        setRingButtonPressed={setRingButtonPressed}
        onRingOff={handleRingOff}
        onSaveSignals={handleSaveSignals}
        onSetRingMouseDown={handleSetRingMouseDown}
        onSetRingMouseUp={handleSetRingMouseUp}
        onSetRingMouseLeave={handleSetRingMouseLeave}
      />

      <AntidelayDialog
        open={showAntidelayDialog}
        value={antidelayInput}
        onChange={setAntidelayInput}
        onSubmit={handleAntidelaySubmit}
        onCancel={handleAntidelayCancel}
      />
    </div>
  );
};

export default Index;
