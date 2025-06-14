
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onSelectFile: () => void;
}

const StartupDialog: React.FC<Props> = ({
  open,
  onSelectFile
}) => (
  <Dialog open={open} onOpenChange={() => {}}>
    <DialogContent className="max-w-sm p-6" onInteractOutside={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>Load Alert Sound</DialogTitle>
      </DialogHeader>
      <div className="text-sm text-muted-foreground mb-4">
        Please select an MP3 file from your device to use as the alert sound for signal notifications.
      </div>
      <Button onClick={onSelectFile} className="w-full">
        Select MP3 File
      </Button>
    </DialogContent>
  </Dialog>
);

export default StartupDialog;
