
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onSelectCustom: () => void;
  onSelectDefault: () => void;
  onClose: () => void;
}

const RingtoneSelectDialog: React.FC<Props> = ({
  open,
  onSelectCustom,
  onSelectDefault,
  onClose
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-xs p-4">
      <DialogHeader>
        <DialogTitle>Select Ring Sound</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3 mt-2 mb-1">
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
