
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
    handleAntidelayCancel,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo
  } = useSignalTracker();

  return (
    <div className="min-h-screen bg-background flex flex-col select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <SignalInput
        signalsText={signalsText}
        onSignalsTextChange={setSignalsText}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
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
