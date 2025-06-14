
import { useState, useEffect, useRef } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load from storage when starting
  useEffect(() => {
    const stored = localStorage.getItem(RINGTONE_STORAGE_KEY);
    if (stored) {
      console.log('Loading custom ringtone from storage:', stored.substring(0, 50) + '...');
      setCustomRingtone(stored);
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

  const handleRingtoneSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      console.log('Selected audio file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Use FileReader to convert file to base64 data URL
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64DataUrl = e.target?.result as string;
        if (base64DataUrl) {
          console.log('Audio file converted to base64 data URL:', base64DataUrl.substring(0, 50) + '...');
          setCustomRingtone(base64DataUrl);
          localStorage.setItem(RINGTONE_STORAGE_KEY, base64DataUrl);
          console.log('Custom ringtone saved to localStorage');
          
          // Test the custom ringtone immediately after selection
          testCustomRingtone(base64DataUrl);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading audio file:', error);
      };
      
      // Read the file as data URL (base64)
      reader.readAsDataURL(file);
    }
  };

  const testCustomRingtone = (ringtoneData: string) => {
    console.log('Testing custom ringtone playback...');
    const testAudio = new Audio(ringtoneData);
    
    testAudio.addEventListener('error', (e) => {
      console.error('Test audio error:', e);
    });
    
    testAudio.addEventListener('loadeddata', () => {
      console.log('Test audio data loaded successfully');
    });
    
    const playPromise = testAudio.play();
    
    playPromise.then(() => {
      console.log('✅ Test playback successful - custom ringtone should work');
      // Stop test audio after 2 seconds
      setTimeout(() => {
        testAudio.pause();
        testAudio.currentTime = 0;
      }, 2000);
    }).catch(err => {
      console.error('❌ Test playback failed:', err);
      console.log('Custom ringtone may not work when signal triggers');
    });
  };

  const triggerRingtoneSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset to allow same file reselect
      fileInputRef.current.click();
    }
  };

  const useDefaultRingtone = () => {
    console.log('Switching to default ringtone');
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
