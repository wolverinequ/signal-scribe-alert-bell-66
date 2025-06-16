
import React, { useState } from 'react';
import { useSignalTracker } from '@/hooks/useSignalTracker';
import { useLogCapture } from '@/hooks/useLogCapture';
import SignalInput from '@/components/SignalInput';
import ControlPanel from '@/components/ControlPanel';
import AntidelayDialog from '@/components/AntidelayDialog';
import RingtoneSelectDialog from "@/components/RingtoneSelectDialog";
import LogViewer from '@/components/LogViewer';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

const Index = () => {
  const [showLogViewer, setShowLogViewer] = useState(false);
  const { logs, clearLogs } = useLogCapture();

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

  return (
    <div className="min-h-screen bg-background flex flex-col select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Log Button - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setShowLogViewer(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-white shadow-lg"
        >
          <FileText className="h-4 w-4" />
          Logs ({logs.length})
        </Button>
      </div>

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
      <LogViewer
        open={showLogViewer}
        onClose={() => setShowLogViewer(false)}
        logs={logs}
        onClearLogs={clearLogs}
      />
    </div>
  );
};

export default Index;
