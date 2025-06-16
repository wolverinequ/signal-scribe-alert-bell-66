
import { useEffect, useRef } from 'react';

export const useAudioManager = (setCustomRingtone: (url: string | null) => void) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    console.log('🎵 AudioManager: Initializing file input');
    
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
        console.log('🎵 AudioManager: File input cleaned up');
      }
    };
  }, []);

  const handleRingtoneSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      console.log('🎵 AudioManager: File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      const url = URL.createObjectURL(file);
      setCustomRingtone(url);
      
      console.log('🎵 AudioManager: Custom ringtone set via centralized state:', {
        fileName: file.name,
        url: url
      });
    } else {
      console.log('🎵 AudioManager: No file selected');
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

  return {
    triggerRingtoneSelection
  };
};
