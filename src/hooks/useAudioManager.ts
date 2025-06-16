
import { useState, useEffect, useRef } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone_data';
const RINGTONE_NAME_KEY = 'selected_custom_ringtone_name';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadingRef = useRef(false);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Cleanup function to revoke blob URLs
  const cleanupBlobUrl = () => {
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
      console.log('🧹 AudioManager: Previous blob URL revoked');
    }
  };

  // Load from storage when starting
  useEffect(() => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    console.log('🎵 AudioManager: Loading ringtone from storage...');
    
    const storedData = localStorage.getItem(RINGTONE_STORAGE_KEY);
    const storedName = localStorage.getItem(RINGTONE_NAME_KEY);
    
    if (storedData && storedName) {
      try {
        console.log('🎵 AudioManager: Found stored ringtone data, converting to blob URL...');
        
        // Clean up any existing blob URL first
        cleanupBlobUrl();
        
        const byteCharacters = atob(storedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        // Track the new blob URL
        currentBlobUrlRef.current = url;
        setCustomRingtone(url);
        setIsRingtoneLoaded(true);
        console.log('✅ AudioManager: Ringtone loaded from storage successfully:', storedName);
      } catch (error) {
        console.error('❌ AudioManager: Failed to load stored ringtone:', error);
        setIsRingtoneLoaded(false);
        setCustomRingtone(null);
      }
    } else {
      console.log('🔍 AudioManager: No stored ringtone found');
      setIsRingtoneLoaded(false);
      setCustomRingtone(null);
    }

    loadingRef.current = false;
  }, []);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      cleanupBlobUrl();
    };
  }, []);

  // Initialize hidden file input once
  useEffect(() => {
    if (fileInputRef.current) {
      return;
    }

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
  }, []);

  const handleRingtoneSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        console.log('🎵 AudioManager: Processing new ringtone file:', file.name);
        
        // Clean up previous blob URL before creating new one
        cleanupBlobUrl();
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(',')[1];
          
          // Save to storage
          localStorage.setItem(RINGTONE_STORAGE_KEY, base64Data);
          localStorage.setItem(RINGTONE_NAME_KEY, file.name);
          
          // Create new blob URL and update state immediately
          const url = URL.createObjectURL(file);
          currentBlobUrlRef.current = url;
          setCustomRingtone(url);
          setIsRingtoneLoaded(true);
          
          console.log('✅ AudioManager: MP3 ringtone loaded and stored:', file.name);
          console.log('🔄 AudioManager: Audio state updated - customRingtone and isRingtoneLoaded set');
          console.log('🆕 AudioManager: New blob URL created:', url.substring(0, 50) + '...');
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

  return {
    customRingtone,
    isRingtoneLoaded,
    triggerRingtoneSelection,
    changeRingtone,
    setCustomRingtone
  };
};
