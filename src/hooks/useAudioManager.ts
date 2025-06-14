
import { useState, useEffect, useRef } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load from storage when starting
  useEffect(() => {
    const stored = localStorage.getItem(RINGTONE_STORAGE_KEY);
    if (stored) setCustomRingtone(stored);
  }, []);

  // Initialize hidden file input once
  useEffect(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleRingtoneSelect);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;

    return () => {
      if (fileInputRef.current && document.body.contains(fileInputRef.current)) {
        document.body.removeChild(fileInputRef.current);
      }
    };
    // eslint-disable-next-line
  }, []);

  const handleRingtoneSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      const url = URL.createObjectURL(file);
      setCustomRingtone(url);
      localStorage.setItem(RINGTONE_STORAGE_KEY, url);
      console.log('Custom ringtone set:', file.name);
    }
  };

  const triggerRingtoneSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset to allow same file reselect
      fileInputRef.current.click();
    }
  };

  const useDefaultRingtone = () => {
    setCustomRingtone(null);
    localStorage.removeItem(RINGTONE_STORAGE_KEY);
  };

  return {
    customRingtone,
    triggerRingtoneSelection,
    useDefaultRingtone,
    setCustomRingtone // expose in case needed elsewhere
  };
};
