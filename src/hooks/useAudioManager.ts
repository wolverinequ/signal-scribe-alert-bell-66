
import { useState, useEffect, useRef } from 'react';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const [ringtoneFileName, setRingtoneFileName] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

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
      // Clean up blob URL on unmount
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  const cleanupPreviousBlobUrl = () => {
    if (currentBlobUrlRef.current) {
      console.log('🧹 AudioManager: Revoking previous blob URL:', currentBlobUrlRef.current);
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  };

  const handleRingtoneSelect = async (event: Event) => {
    console.log('🎵 AudioManager: ===== NEW FILE SELECTION STARTED =====');
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    // Clear any previous errors
    setLoadingError(null);

    if (file) {
      try {
        console.log('🎵 AudioManager: Processing new ringtone file');
        console.log('🎵 AudioManager: File name:', file.name);
        console.log('🎵 AudioManager: File size:', file.size, 'bytes');
        console.log('🎵 AudioManager: File type:', file.type);
        
        // Clean up previous blob URL
        cleanupPreviousBlobUrl();
        
        // Create new blob URL directly from file
        const blobUrl = URL.createObjectURL(file);
        console.log('🎵 AudioManager: New blob URL created:', blobUrl);
        
        // Store the blob URL reference for cleanup
        currentBlobUrlRef.current = blobUrl;
        
        // Update state immediately
        setCustomRingtone(blobUrl);
        setIsRingtoneLoaded(true);
        setRingtoneFileName(file.name);
        
        console.log('✅ AudioManager: MP3 ringtone loaded successfully');
        console.log('🎵 AudioManager: Final state - customRingtone:', blobUrl, 'isRingtoneLoaded:', true);
        console.log('🎵 AudioManager: ===== NEW FILE SELECTION COMPLETE =====');
      } catch (error) {
        console.error('❌ AudioManager: Failed to process ringtone file:', error);
        setLoadingError('Failed to load MP3 file. Please try again.');
        setIsRingtoneLoaded(false);
        setCustomRingtone(null);
        setRingtoneFileName(null);
      }
    } else {
      console.log('⚠️ AudioManager: No file selected');
    }
  };

  const triggerRingtoneSelection = () => {
    console.log('🎵 AudioManager: ===== TRIGGER RINGTONE SELECTION =====');
    console.log('🎵 AudioManager: Current customRingtone before selection:', customRingtone);
    console.log('🎵 AudioManager: Current isRingtoneLoaded before selection:', isRingtoneLoaded);
    
    // Clear any previous errors
    setLoadingError(null);
    
    if (fileInputRef.current) {
      console.log('🎵 AudioManager: Clearing file input value and triggering click');
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    } else {
      console.error('❌ AudioManager: File input ref is null!');
      setLoadingError('File selection is not available. Please refresh the page.');
    }
  };

  const changeRingtone = () => {
    console.log('🎵 AudioManager: changeRingtone called - delegating to triggerRingtoneSelection');
    triggerRingtoneSelection();
  };

  const clearRingtone = () => {
    console.log('🎵 AudioManager: Clearing current ringtone');
    cleanupPreviousBlobUrl();
    setCustomRingtone(null);
    setIsRingtoneLoaded(false);
    setRingtoneFileName(null);
    setLoadingError(null);
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
    ringtoneFileName,
    loadingError,
    triggerRingtoneSelection,
    changeRingtone,
    clearRingtone,
    setCustomRingtone
  };
};
