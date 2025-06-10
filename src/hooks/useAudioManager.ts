
import { useState, useEffect, useRef } from 'react';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Create hidden file input for ringtone selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleRingtoneSelect);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;

    return () => {
      if (fileInputRef.current && document.body.contains(fileInputRef.current)) {
        fileInputRef.current.removeEventListener('change', handleRingtoneSelect);
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, []);

  const handleRingtoneSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomRingtone(url);
      console.log('Custom ringtone set:', file.name);
    }
  };

  const triggerRingtoneSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return {
    customRingtone,
    triggerRingtoneSelection
  };
};
