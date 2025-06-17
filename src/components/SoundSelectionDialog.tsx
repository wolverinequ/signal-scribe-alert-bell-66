
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VolumeX, FileAudio } from 'lucide-react';

interface SoundSelectionDialogProps {
  open: boolean;
  onUseDefault: () => void;
  onSetCustom: () => void;
  onCancel: () => void;
}

const SoundSelectionDialog = ({
  open,
  onUseDefault,
  onSetCustom,
  onCancel
}: SoundSelectionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Ringtone</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={onUseDefault}
            variant="outline"
            className="h-16 flex flex-col gap-2"
          >
            <VolumeX className="h-6 w-6" />
            <span>Use Default Sound</span>
          </Button>
          
          <Button
            onClick={onSetCustom}
            variant="outline"
            className="h-16 flex flex-col gap-2"
          >
            <FileAudio className="h-6 w-6" />
            <span>Set Custom Sound</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SoundSelectionDialog;
