
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onSelectCustom: () => void;
  onSelectDefault: () => void;
  onClose: () => void;
  currentFileName?: string | null;
  loadingError?: string | null;
}

const RingtoneSelectDialog: React.FC<Props> = ({
  open,
  onSelectCustom,
  onSelectDefault,
  onClose,
  currentFileName,
  loadingError
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-xs p-4">
      <DialogHeader>
        <DialogTitle>Select Ring Sound</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3 mt-2 mb-1">
        {currentFileName && (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
            Current: {currentFileName}
          </div>
        )}
        {loadingError && (
          <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
            {loadingError}
          </div>
        )}
        <Button variant="outline" onClick={() => { onSelectCustom(); onClose(); }}>
          Select custom sound
        </Button>
        <Button variant="outline" onClick={() => { onSelectDefault(); onClose(); }}>
          Use default sound
        </Button>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default RingtoneSelectDialog;
