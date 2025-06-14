
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

  // Must be declared before useEffect above (hoisting in file scope not guaranteed).
  function handleRingtoneSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCustomRingtone(dataUrl);
        localStorage.setItem(RINGTONE_STORAGE_KEY, dataUrl);
        console.log('Custom ringtone set:', file.name);
      };
      reader.onerror = () => {
        console.error('Failed to read ringtone file');
      };
      reader.readAsDataURL(file);
    }
  }

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
