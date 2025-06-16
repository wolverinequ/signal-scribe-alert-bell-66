
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Volume2, Upload } from 'lucide-react';

interface RingSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onUseDefault: () => void;
  onSetCustom: () => void;
}

const RingSelectionDialog = ({ 
  open, 
  onClose, 
  onUseDefault, 
  onSetCustom 
}: RingSelectionDialogProps) => {
  const handleUseDefault = () => {
    onUseDefault();
    onClose();
  };

  const handleSetCustom = () => {
    onSetCustom();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Ring Sound</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3">
            <Button
              onClick={handleUseDefault}
              variant="outline"
              className="h-16 flex items-center gap-3 text-left"
            >
              <Volume2 className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="font-medium">Use default sound</span>
                <span className="text-sm text-muted-foreground">Standard beep tone</span>
              </div>
            </Button>
            
            <Button
              onClick={handleSetCustom}
              variant="outline"
              className="h-16 flex items-center gap-3 text-left"
            >
              <Upload className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="font-medium">Set custom sound</span>
                <span className="text-sm text-muted-foreground">Choose audio file</span>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RingSelectionDialog;
