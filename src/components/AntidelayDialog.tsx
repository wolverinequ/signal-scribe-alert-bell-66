
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AntidelayDialogProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const AntidelayDialog = ({ open, value, onChange, onSubmit, onCancel }: AntidelayDialogProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow numbers and limit to 2 digits
    if (/^\d{0,2}$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Antidelay Seconds</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              type="text"
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Enter seconds (0-99)"
              className="text-center text-lg"
              maxLength={2}
              autoFocus
            />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Enter number of seconds to ring before the signal time
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AntidelayDialog;
