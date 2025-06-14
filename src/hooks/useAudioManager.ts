
import { useState, useEffect, useRef } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const [showStartupDialog, setShowStartupDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load from storage when starting
  useEffect(() => {
    const stored = localStorage.getItem(RINGTONE_STORAGE_KEY);
    if (stored) {
      setCustomRingtone(stored);
      setIsRingtoneLoaded(true);
    } else {
      setShowStartupDialog(true);
    }
  }, []);

  // Initialize hidden file input once
  useEffect(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3,audio/mpeg';
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
      setIsRingtoneLoaded(true);
      setShowStartupDialog(false);
      localStorage.setItem(RINGTONE_STORAGE_KEY, url);
      console.log('MP3 ringtone loaded:', file.name);
    }
  };

  const triggerRingtoneSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const changeRingtone = () => {
    triggerRingtoneSelection();
  };

  return {
    customRingtone,
    isRingtoneLoaded,
    showStartupDialog,
    triggerRingtoneSelection,
    changeRingtone,
    setCustomRingtone
  };
};
