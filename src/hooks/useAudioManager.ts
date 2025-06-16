
import { useState, useEffect, useRef, useCallback } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone_data';
const RINGTONE_NAME_KEY = 'selected_custom_ringtone_name';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadingRef = useRef(false);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Cleanup function to revoke blob URLs
  const cleanupBlobUrl = useCallback(() => {
    if (currentBlobUrlRef.current) {
      console.log('🧹 AudioManager: Revoking blob URL:', currentBlobUrlRef.current.substring(0, 50) + '...');
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
      console.log('✅ AudioManager: Previous blob URL revoked');
    }
  }, []);

  // Handle ringtone selection - MOVED BEFORE useEffect
  const handleRingtoneSelect = useCallback(async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        console.log('🎵 AudioManager: Processing new ringtone file:', file.name);
        console.log('🔄 AudioManager: Starting file selection process...');
        
        // Clean up previous blob URL before creating new one
        cleanupBlobUrl();
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(',')[1];
          
          console.log('💾 AudioManager: Saving new ringtone to localStorage...');
          // Save to storage
          localStorage.setItem(RINGTONE_STORAGE_KEY, base64Data);
          localStorage.setItem(RINGTONE_NAME_KEY, file.name);
          
          // Create new blob URL and update state immediately
          const url = URL.createObjectURL(file);
          currentBlobUrlRef.current = url;
          
          console.log('🔄 AudioManager: Setting new audio state...');
          console.log('🆕 AudioManager: New blob URL created:', url.substring(0, 50) + '...');
          
          // Force immediate state update
          setCustomRingtone(url);
          setIsRingtoneLoaded(true);
          
          console.log('✅ AudioManager: MP3 ringtone loaded and stored:', file.name);
          console.log('✅ AudioManager: Audio state updated - customRingtone and isRingtoneLoaded set');
          console.log('🎯 AudioManager: State propagation complete, new URL:', url.substring(0, 50) + '...');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ AudioManager: Failed to process ringtone file:', error);
        setIsRingtoneLoaded(false);
        setCustomRingtone(null);
      }
    }
  }, [cleanupBlobUrl]);

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
  }, [cleanupBlobUrl]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      cleanupBlobUrl();
    };
  }, [cleanupBlobUrl]);

  // Initialize hidden file input once - NOW AFTER handleRingtoneSelect is defined
  useEffect(() => {
    if (fileInputRef.current) {
      return;
    }

    console.log('🎛️ AudioManager: Creating file input element...');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3,audio/mpeg';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleRingtoneSelect);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;
    console.log('✅ AudioManager: File input created and event listener attached');

    return () => {
      if (fileInputRef.current && document.body.contains(fileInputRef.current)) {
        console.log('🧹 AudioManager: Cleaning up file input element');
        fileInputRef.current.removeEventListener('change', handleRingtoneSelect);
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, [handleRingtoneSelect]);

  const triggerRingtoneSelection = useCallback(() => {
    console.log('🎯 AudioManager: Triggering ringtone selection...');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
      console.log('🔄 AudioManager: File input clicked');
    } else {
      console.error('❌ AudioManager: File input not available');
    }
  }, []);

  const changeRingtone = useCallback(() => {
    triggerRingtoneSelection();
  }, [triggerRingtoneSelection]);

  return {
    customRingtone,
    isRingtoneLoaded,
    triggerRingtoneSelection,
    changeRingtone,
    setCustomRingtone
  };
};
