
import { useState, useEffect, useRef } from 'react';

const CUSTOM_RINGTONE_KEY = 'custom_ringtone_url';
const RINGTONE_PREFERENCE_KEY = 'ringtone_preference'; // 'custom' or 'default'

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [ringtonePreference, setRingtonePreference] = useState<'custom' | 'default'>('default');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved ringtone and preference on mount
  useEffect(() => {
    const savedRingtone = localStorage.getItem(CUSTOM_RINGTONE_KEY);
    const savedPreference = localStorage.getItem(RINGTONE_PREFERENCE_KEY) as 'custom' | 'default' || 'default';
    
    if (savedRingtone) {
      setCustomRingtone(savedRingtone);
    }
    setRingtonePreference(savedPreference);
  }, []);

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
      setRingtonePreference('custom');
      
      // Save to localStorage
      localStorage.setItem(CUSTOM_RINGTONE_KEY, url);
      localStorage.setItem(RINGTONE_PREFERENCE_KEY, 'custom');
      
      console.log('Custom ringtone set and saved:', file.name);
    }
  };

  const showRingtoneSelectionDialog = () => {
    return new Promise<'custom' | 'default' | null>((resolve) => {
      const choice = confirm('Choose ringtone option:\nOK = Select custom sound from phone\nCancel = Use default beep sound');
      
      if (choice) {
        // User wants custom sound
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        resolve('custom');
      } else {
        // User wants default beep
        setRingtonePreference('default');
        localStorage.setItem(RINGTONE_PREFERENCE_KEY, 'default');
        resolve('default');
      }
    });
  };

  const getCurrentRingtone = () => {
    if (ringtonePreference === 'custom' && customRingtone) {
      return customRingtone;
    }
    return null; // Will use default beep
  };

  return {
    customRingtone,
    ringtonePreference,
    getCurrentRingtone,
    showRingtoneSelectionDialog
  };
};
