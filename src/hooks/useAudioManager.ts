
import { useState, useEffect, useRef } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone_data';
const RINGTONE_NAME_KEY = 'selected_custom_ringtone_name';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const [showStartupDialog, setShowStartupDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load from storage when starting
  useEffect(() => {
    console.log('🎵 AudioManager: Loading ringtone from storage...');
    const storedData = localStorage.getItem(RINGTONE_STORAGE_KEY);
    const storedName = localStorage.getItem(RINGTONE_NAME_KEY);
    
    if (storedData && storedName) {
      try {
        console.log('🎵 AudioManager: Found stored ringtone data, converting to blob URL...');
        // Convert base64 back to blob URL
        const byteCharacters = atob(storedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        setCustomRingtone(url);
        setIsRingtoneLoaded(true); // This was missing - crucial fix!
        setShowStartupDialog(false);
        console.log('✅ AudioManager: Ringtone loaded from storage successfully:', storedName);
        console.log('✅ AudioManager: isRingtoneLoaded set to true, customRingtone URL created');
      } catch (error) {
        console.error('❌ AudioManager: Failed to load stored ringtone:', error);
        setIsRingtoneLoaded(false);
        setCustomRingtone(null);
        setShowStartupDialog(true);
      }
    } else {
      console.log('🔍 AudioManager: No stored ringtone found, showing startup dialog');
      setIsRingtoneLoaded(false);
      setCustomRingtone(null);
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

  const handleRingtoneSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        console.log('🎵 AudioManager: Processing new ringtone file:', file.name);
        // Convert file to base64 for persistent storage
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(',')[1]; // Remove data:audio/mpeg;base64, prefix
          
          // Store the base64 data and filename
          localStorage.setItem(RINGTONE_STORAGE_KEY, base64Data);
          localStorage.setItem(RINGTONE_NAME_KEY, file.name);
          
          // Create blob URL for immediate use
          const url = URL.createObjectURL(file);
          setCustomRingtone(url);
          setIsRingtoneLoaded(true); // Ensure this is set to true
          setShowStartupDialog(false);
          
          console.log('✅ AudioManager: MP3 ringtone loaded and stored:', file.name);
          console.log('✅ AudioManager: isRingtoneLoaded set to true, ready for signal monitoring');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ AudioManager: Failed to process ringtone file:', error);
        setIsRingtoneLoaded(false);
        setCustomRingtone(null);
      }
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

  // Debug logging for state changes
  useEffect(() => {
    console.log('🎵 AudioManager State Update:', {
      customRingtone: customRingtone ? 'Available' : 'Not available',
      isRingtoneLoaded,
      showStartupDialog
    });
  }, [customRingtone, isRingtoneLoaded, showStartupDialog]);

  return {
    customRingtone,
    isRingtoneLoaded,
    showStartupDialog,
    triggerRingtoneSelection,
    changeRingtone,
    setCustomRingtone
  };
};
