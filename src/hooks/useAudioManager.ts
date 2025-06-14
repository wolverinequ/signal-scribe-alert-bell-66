
import { useState, useEffect, useRef } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load from storage when starting
  useEffect(() => {
    const stored = localStorage.getItem(RINGTONE_STORAGE_KEY);
    // Only set if it's a data URL, not a blob: URL or empty string
    if (stored && stored.startsWith('data:audio')) {
      setCustomRingtone(stored);
    } else {
      setCustomRingtone(null); // fallback if not a usable data url
    }
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

  // Helper to convert a File object to base64 data URL
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (e.target && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = function (err) {
        reject(err);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRingtoneSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        const dataUrl = await fileToDataURL(file);
        setCustomRingtone(dataUrl);
        localStorage.setItem(RINGTONE_STORAGE_KEY, dataUrl);
        console.log('Custom ringtone set (base64):', file.name);
      } catch (err) {
        console.error('Failed to read custom ringtone:', err);
      }
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

