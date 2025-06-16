
import { useEffect, useRef } from 'react';
import { indexedDBManager } from '@/utils/indexedDBUtils';

export const useAudioManager = (setCustomRingtone: (url: string | null) => void) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    console.log('🎵 AudioManager: Initializing file input and IndexedDB');
    
    // Initialize IndexedDB and load existing ringtone
    const initializeAudio = async () => {
      try {
        await indexedDBManager.init();
        const existingRingtone = await indexedDBManager.getRingtone();
        if (existingRingtone) {
          setCustomRingtone(existingRingtone);
          currentBlobUrlRef.current = existingRingtone;
          console.log('🎵 AudioManager: Existing ringtone loaded from IndexedDB');
        }
      } catch (error) {
        console.error('🎵 AudioManager: Failed to initialize IndexedDB:', error);
      }
    };
    
    initializeAudio();
    
    // Create hidden file input for ringtone selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleRingtoneSelect);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;

    return () => {
      // Clean up blob URL and file input
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      if (fileInputRef.current && document.body.contains(fileInputRef.current)) {
        document.body.removeChild(fileInputRef.current);
        console.log('🎵 AudioManager: File input cleaned up');
      }
    };
  }, [setCustomRingtone]);

  const handleRingtoneSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      console.log('🎵 AudioManager: File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      try {
        // Revoke previous blob URL if it exists
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
          currentBlobUrlRef.current = null;
        }

        // Save file to IndexedDB and get blob URL
        await indexedDBManager.saveRingtone(file);
        const blobUrl = await indexedDBManager.getRingtone();
        
        if (blobUrl) {
          setCustomRingtone(blobUrl);
          currentBlobUrlRef.current = blobUrl;
          
          console.log('🎵 AudioManager: Custom ringtone saved to IndexedDB and validated:', {
            fileName: file.name,
            fileSize: file.size,
            blobUrl: blobUrl.substring(0, 50) + '...'
          });
        } else {
          throw new Error('Failed to create or validate blob URL from saved data');
        }
      } catch (error) {
        console.error('🎵 AudioManager: Error with ringtone:', error);
        
        // Show user-friendly error message
        if (error instanceof Error && error.message.includes('Unsupported audio format')) {
          alert(`Error: ${error.message}`);
        } else {
          alert('Error: Failed to save ringtone. Please try a different audio file (MP3, WAV, OGG, MP4, M4A, AAC, or WebM).');
        }
        
        setCustomRingtone(null);
      }
    } else {
      console.log('🎵 AudioManager: No file selected');
    }
    
    // Reset the file input to allow selecting the same file again
    if (target) {
      target.value = '';
    }
  };

  const triggerRingtoneSelection = () => {
    console.log('🎵 AudioManager: Triggering ringtone selection dialog');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('🎵 AudioManager: File input ref is null');
    }
  };

  const useDefaultSound = async () => {
    console.log('🎵 AudioManager: Setting to use default sound');
    try {
      // Clear custom ringtone from IndexedDB
      await indexedDBManager.clearRingtone();
      
      // Revoke current blob URL if it exists
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
      
      // Set custom ringtone to null to use default beep
      setCustomRingtone(null);
      
      console.log('🎵 AudioManager: Default sound selected, custom ringtone cleared');
    } catch (error) {
      console.error('🎵 AudioManager: Error clearing custom ringtone:', error);
    }
  };

  return {
    triggerRingtoneSelection,
    useDefaultSound
  };
};
