
import { useState, useEffect, useRef } from 'react';

const CUSTOM_RINGTONE_KEY = 'custom_ringtone_url';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Load saved custom ringtone from localStorage
    const savedRingtone = localStorage.getItem(CUSTOM_RINGTONE_KEY);
    if (savedRingtone) {
      setCustomRingtone(savedRingtone);
      console.log('🎵 Loaded custom ringtone from storage:', savedRingtone);
    } else {
      console.log('🎵 No custom ringtone found in storage');
    }

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
      console.log('🎵 File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const url = URL.createObjectURL(file);
      setCustomRingtone(url);
      
      // Save to localStorage
      localStorage.setItem(CUSTOM_RINGTONE_KEY, url);
      
      console.log('🎵 Custom ringtone set and saved:', {
        fileName: file.name,
        url: url,
        savedToStorage: true
      });
    } else {
      console.log('🎵 No file selected');
    }
  };

  const triggerRingtoneSelection = () => {
    console.log('🎵 Triggering ringtone selection dialog');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('🎵 File input ref is null');
    }
  };

  return {
    customRingtone,
    triggerRingtoneSelection
  };
};
