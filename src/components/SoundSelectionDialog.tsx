
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Volume2, Upload } from 'lucide-react';

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
        
        <div className="flex flex-col gap-4 py-4">
          <Button
            onClick={onUseDefault}
            variant="outline"
            className="h-12 flex items-center gap-3"
          >
            <Volume2 className="h-5 w-5" />
            Use default sound
          </Button>
          
          <Button
            onClick={onSetCustom}
            variant="default"
            className="h-12 flex items-center gap-3"
          >
            <Upload className="h-5 w-5" />
            Set custom sound
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SoundSelectionDialog;
