
import { useEffect, useRef, useState } from 'react';
import { indexedDBManager } from '@/utils/indexedDBUtils';

export const useAudioManager = (setCustomRingtone: (url: string | null) => void) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if custom ringtone exists
  const checkCustomRingtoneExists = async (): Promise<boolean> => {
    try {
      await indexedDBManager.init();
      const existingRingtone = await indexedDBManager.getRingtone();
      return !!existingRingtone;
    } catch (error) {
      console.error('🎵 AudioManager: Error checking for existing ringtone:', error);
      return false;
    }
  };

  useEffect(() => {
    // Only initialize once when component mounts
    if (isInitialized) return;
    
    console.log('🎵 AudioManager: Initializing file input and IndexedDB with audio buffer caching');
    
    // Initialize IndexedDB and load existing ringtone
    const initializeAudio = async () => {
      if (isLoading) return; // Prevent multiple simultaneous operations
      
      setIsLoading(true);
      try {
        await indexedDBManager.init();
        
        // Only load if we don't already have a ringtone
        if (!currentBlobUrlRef.current) {
          const existingRingtone = await indexedDBManager.getRingtone();
          if (existingRingtone) {
            setCustomRingtone(existingRingtone);
            currentBlobUrlRef.current = existingRingtone;
            console.log('🎵 AudioManager: Existing ringtone loaded from IndexedDB');
            
            // Pre-cache the existing ringtone's audio buffer
            try {
              const { audioBufferCache } = await import('@/utils/audioBufferCache');
              const arrayBuffer = await indexedDBManager.getRingtoneAsArrayBuffer();
              
              if (arrayBuffer) {
                const ringtoneHash = audioBufferCache.generateRingtoneHash(arrayBuffer);
                
                // Check if already cached
                if (!audioBufferCache.isCacheValidForRingtone(ringtoneHash)) {
                  console.log('🎵 AudioManager: Pre-caching existing ringtone audio buffer...');
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
                  
                  audioBufferCache.setCachedAudioBuffer(audioBuffer, ringtoneHash);
                  await audioContext.close();
                  
                  console.log('🎵 AudioManager: Existing ringtone audio buffer pre-cached for instant playback');
                } else {
                  console.log('🎵 AudioManager: Existing ringtone already cached');
                }
              }
            } catch (error) {
              console.warn('🎵 AudioManager: Failed to pre-cache existing ringtone, will cache on first use:', error);
            }
          }
        }
      } catch (error) {
        console.error('🎵 AudioManager: Failed to initialize IndexedDB:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    
    initializeAudio();
    
    // Create hidden file input for ringtone selection - only once
    if (!fileInputRef.current) {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/*';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', handleRingtoneSelect);
      document.body.appendChild(fileInput);
      fileInputRef.current = fileInput;
    }

    return () => {
      // Clean up blob URL and file input only on unmount
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      if (fileInputRef.current && document.body.contains(fileInputRef.current)) {
        document.body.removeChild(fileInputRef.current);
        console.log('🎵 AudioManager: File input cleaned up');
      }
    };
  }, []); // Remove setCustomRingtone from dependencies to break the loop

  const handleRingtoneSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      console.log('🎵 AudioManager: File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      if (isLoading) {
        console.log('🎵 AudioManager: Another operation in progress, skipping');
        return;
      }

      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('🎵 AudioManager: No file selected');
    }
    
    // Reset the file input to allow selecting the same file again
    if (target) {
      target.value = '';
    }
  };

  const triggerRingtoneSelection = async () => {
    console.log('🎵 AudioManager: Triggering ringtone selection dialog');
    
    // Check if a custom ringtone already exists
    const hasExistingRingtone = await checkCustomRingtoneExists();
    
    if (!hasExistingRingtone) {
      console.log('🎵 AudioManager: No custom ringtone found, prompting user to select one');
      alert('Please select a custom ringtone to use for signal alerts.');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('🎵 AudioManager: File input ref is null');
    }
  };

  const clearCustomRingtone = async () => {
    console.log('🎵 AudioManager: Clearing custom ringtone');
    
    if (isLoading) {
      console.log('🎵 AudioManager: Another operation in progress, skipping clear');
      return;
    }

    setIsLoading(true);
    try {
      // Revoke current blob URL if it exists
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }

      // Clear from IndexedDB (this will also clear the audio buffer cache)
      await indexedDBManager.init();
      await indexedDBManager.clearRingtone();
      
      // Set ringtone to null
      setCustomRingtone(null);
      
      console.log('🎵 AudioManager: Custom ringtone and audio buffer cache cleared successfully');
    } catch (error) {
      console.error('🎵 AudioManager: Error clearing ringtone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    triggerRingtoneSelection,
    clearCustomRingtone,
    isLoading,
    checkCustomRingtoneExists
  };
};
