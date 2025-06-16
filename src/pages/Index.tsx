
import React from 'react';
import { useSignalTracker } from '@/hooks/useSignalTracker';
import { useVisualDebugger } from '@/hooks/useVisualDebugger';
import SignalInput from '@/components/SignalInput';
import ControlPanel from '@/components/ControlPanel';
import AntidelayDialog from '@/components/AntidelayDialog';
import RingtoneSelectDialog from "@/components/RingtoneSelectDialog";
import DebugOverlay from '@/components/DebugOverlay';

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
    ringtoneDialogOpen,
    setRingtoneDialogOpen,
    handleSelectCustomSound,
    handleSelectDefaultSound,
  } = useSignalTracker();

  const { logs, clearLogs } = useVisualDebugger();

  return (
    <div className="min-h-screen bg-background flex flex-col select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <DebugOverlay logs={logs} onClear={clearLogs} />
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
      <RingtoneSelectDialog
        open={ringtoneDialogOpen}
        onSelectCustom={handleSelectCustomSound}
        onSelectDefault={handleSelectDefaultSound}
        onClose={() => setRingtoneDialogOpen(false)}
      />
    </div>
  );
};

export default Index;
