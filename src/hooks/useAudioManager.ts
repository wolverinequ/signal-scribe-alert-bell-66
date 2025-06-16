
import { useState, useEffect, useRef } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone_data';
const RINGTONE_NAME_KEY = 'selected_custom_ringtone_name';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadingRef = useRef(false);

  // Load from storage when starting
  useEffect(() => {
    if (loadingRef.current) {
      console.log('🎵 AudioManager: Loading already in progress, skipping...');
      return;
    }

    loadingRef.current = true;
    console.log('🎵 AudioManager: ===== STARTING INITIAL LOAD FROM STORAGE =====');
    
    const storedData = localStorage.getItem(RINGTONE_STORAGE_KEY);
    const storedName = localStorage.getItem(RINGTONE_NAME_KEY);
    
    console.log('🎵 AudioManager: Storage check - hasData:', !!storedData, 'hasName:', !!storedName);
    
    if (storedData && storedName) {
      try {
        console.log('🎵 AudioManager: Converting stored data to blob URL...');
        console.log('🎵 AudioManager: Stored name:', storedName);
        console.log('🎵 AudioManager: Stored data length:', storedData.length);
        
        const byteCharacters = atob(storedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        console.log('🎵 AudioManager: Generated blob URL:', url);
        setCustomRingtone(url);
        setIsRingtoneLoaded(true);
        console.log('✅ AudioManager: Initial ringtone loaded successfully from storage');
        console.log('🎵 AudioManager: Current state - customRingtone:', url, 'isRingtoneLoaded:', true);
      } catch (error) {
        console.error('❌ AudioManager: Failed to load stored ringtone:', error);
        setIsRingtoneLoaded(false);
        setCustomRingtone(null);
      }
    } else {
      console.log('🔍 AudioManager: No stored ringtone found in localStorage');
      setIsRingtoneLoaded(false);
      setCustomRingtone(null);
    }

    loadingRef.current = false;
    console.log('🎵 AudioManager: ===== INITIAL LOAD COMPLETE =====');
  }, []);

  // Initialize hidden file input once
  useEffect(() => {
    if (fileInputRef.current) {
      console.log('🎵 AudioManager: File input already exists, skipping creation');
      return;
    }

    console.log('🎵 AudioManager: Creating hidden file input element');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3,audio/mpeg';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleRingtoneSelect);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;
    console.log('✅ AudioManager: File input element created and attached');

    return () => {
      console.log('🧹 AudioManager: Cleaning up file input element');
      if (fileInputRef.current && document.body.contains(fileInputRef.current)) {
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, []);

  const handleRingtoneSelect = async (event: Event) => {
    console.log('🎵 AudioManager: ===== NEW FILE SELECTION STARTED =====');
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        console.log('🎵 AudioManager: Processing new ringtone file');
        console.log('🎵 AudioManager: File name:', file.name);
        console.log('🎵 AudioManager: File size:', file.size, 'bytes');
        console.log('🎵 AudioManager: File type:', file.type);
        
        // Clean up previous blob URL if it exists
        if (customRingtone) {
          console.log('🧹 AudioManager: Revoking previous blob URL:', customRingtone);
          URL.revokeObjectURL(customRingtone);
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('🎵 AudioManager: FileReader onload triggered');
          const result = e.target?.result as string;
          const base64Data = result.split(',')[1];
          
          console.log('🎵 AudioManager: Base64 data length:', base64Data.length);
          console.log('🎵 AudioManager: Saving to localStorage...');
          
          // Save to storage
          localStorage.setItem(RINGTONE_STORAGE_KEY, base64Data);
          localStorage.setItem(RINGTONE_NAME_KEY, file.name);
          
          console.log('✅ AudioManager: Data saved to localStorage');
          
          // Create new blob URL and update state immediately
          const url = URL.createObjectURL(file);
          console.log('🎵 AudioManager: New blob URL created:', url);
          console.log('🎵 AudioManager: About to update state...');
          console.log('🎵 AudioManager: Previous customRingtone:', customRingtone);
          console.log('🎵 AudioManager: New customRingtone will be:', url);
          
          setCustomRingtone(url);
          setIsRingtoneLoaded(true);
          
          console.log('✅ AudioManager: State updated - new MP3 ringtone loaded and stored');
          console.log('🎵 AudioManager: Final state - customRingtone:', url, 'isRingtoneLoaded:', true);
          console.log('🎵 AudioManager: ===== NEW FILE SELECTION COMPLETE =====');
        };
        
        console.log('🎵 AudioManager: Starting FileReader.readAsDataURL...');
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ AudioManager: Failed to process ringtone file:', error);
        setIsRingtoneLoaded(false);
        setCustomRingtone(null);
      }
    } else {
      console.log('⚠️ AudioManager: No file selected');
    }
  };

  const triggerRingtoneSelection = () => {
    console.log('🎵 AudioManager: ===== TRIGGER RINGTONE SELECTION =====');
    console.log('🎵 AudioManager: Current customRingtone before selection:', customRingtone);
    console.log('🎵 AudioManager: Current isRingtoneLoaded before selection:', isRingtoneLoaded);
    
    if (fileInputRef.current) {
      console.log('🎵 AudioManager: Clearing file input value and triggering click');
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    } else {
      console.error('❌ AudioManager: File input ref is null!');
    }
  };

  const changeRingtone = () => {
    console.log('🎵 AudioManager: changeRingtone called - delegating to triggerRingtoneSelection');
    triggerRingtoneSelection();
  };

  // Log state changes
  useEffect(() => {
    console.log('🔄 AudioManager: customRingtone state changed to:', customRingtone);
  }, [customRingtone]);

  useEffect(() => {
    console.log('🔄 AudioManager: isRingtoneLoaded state changed to:', isRingtoneLoaded);
  }, [isRingtoneLoaded]);

  return {
    customRingtone,
    isRingtoneLoaded,
    triggerRingtoneSelection,
    changeRingtone,
    setCustomRingtone
  };
};
