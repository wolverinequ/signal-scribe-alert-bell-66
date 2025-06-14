
import React from 'react';
import { useSignalTracker } from '@/hooks/useSignalTracker';
import SignalInput from '@/components/SignalInput';
import ControlPanel from '@/components/ControlPanel';
import AntidelayDialog from '@/components/AntidelayDialog';
import WakeUpSetupDialog from '@/components/WakeUpSetupDialog';

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
    showWakeUpSetup,
    handleRingOff,
    handleSaveSignals,
    handleSetRingMouseDown,
    handleSetRingMouseUp,
    handleSetRingMouseLeave,
    handleAntidelaySubmit,
    handleAntidelayCancel,
    handleWakeUpSetupComplete
  } = useSignalTracker();

  return (
    <div className="min-h-screen bg-background flex flex-col select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Show wake-up setup dialog if needed */}
      <WakeUpSetupDialog
        open={showWakeUpSetup}
        onComplete={handleWakeUpSetupComplete}
      />

      {/* Main app content - only show when wake-up setup is complete */}
      {!showWakeUpSetup && (
        <>
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
        </>
      )}
    </div>
  );
};

export default Index;
