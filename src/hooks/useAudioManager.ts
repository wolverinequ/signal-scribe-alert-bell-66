import { useState, useEffect, useRef } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone_data';
const RINGTONE_NAME_KEY = 'selected_custom_ringtone_name';
const SOUND_TYPE_KEY = 'selected_sound_type'; // 'custom' or 'default'

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [soundType, setSoundType] = useState<'custom' | 'default' | null>(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const [showRingtoneDialog, setShowRingtoneDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initializedRef = useRef(false);

  // Create default beep sound URL
  const createDefaultBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
    
    return Promise.resolve('default-beep');
  };

  // Load from storage when starting - ONLY ONCE
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    console.log('🎵 AudioManager: Loading sound configuration from storage...');
    
    const storedSoundType = localStorage.getItem(SOUND_TYPE_KEY) as 'custom' | 'default' | null;
    const storedData = localStorage.getItem(RINGTONE_STORAGE_KEY);
    const storedName = localStorage.getItem(RINGTONE_NAME_KEY);
    
    if (storedSoundType === 'default') {
      console.log('✅ AudioManager: Using stored default sound preference');
      setSoundType('default');
      setIsRingtoneLoaded(true);
    } else if (storedSoundType === 'custom' && storedData && storedName) {
      try {
        console.log('🎵 AudioManager: Found stored custom ringtone, converting to blob URL...');
        const byteCharacters = atob(storedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        setCustomRingtone(url);
        setSoundType('custom');
        setIsRingtoneLoaded(true);
        console.log('✅ AudioManager: Custom ringtone loaded successfully:', storedName);
      } catch (error) {
        console.error('❌ AudioManager: Failed to load stored custom ringtone:', error);
        // Fall back to default
        setSoundType('default');
        setIsRingtoneLoaded(true);
      }
    } else {
      console.log('🔍 AudioManager: No sound preference found, using default beep');
      setSoundType('default');
      setIsRingtoneLoaded(true);
    }
  }, []);

  // Initialize hidden file input once
  useEffect(() => {
    if (fileInputRef.current) return;

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
        console.log('🎵 AudioManager: Processing new custom ringtone file:', file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(',')[1];
          
          localStorage.setItem(RINGTONE_STORAGE_KEY, base64Data);
          localStorage.setItem(RINGTONE_NAME_KEY, file.name);
          localStorage.setItem(SOUND_TYPE_KEY, 'custom');
          
          const url = URL.createObjectURL(file);
          setCustomRingtone(url);
          setSoundType('custom');
          setIsRingtoneLoaded(true);
          
          console.log('✅ AudioManager: Custom MP3 ringtone loaded and stored:', file.name);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ AudioManager: Failed to process custom ringtone file:', error);
      }
    }
  };

  const triggerRingtoneSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const selectDefaultSound = () => {
    console.log('🎵 AudioManager: Selecting default sound');
    localStorage.setItem(SOUND_TYPE_KEY, 'default');
    localStorage.removeItem(RINGTONE_STORAGE_KEY);
    localStorage.removeItem(RINGTONE_NAME_KEY);
    
    setSoundType('default');
    setCustomRingtone(null);
    setIsRingtoneLoaded(true);
  };

  const openRingtoneDialog = () => {
    console.log('🔔 Opening ringtone selection dialog...');
    setShowRingtoneDialog(true);
  };

  const closeRingtoneDialog = () => {
    setShowRingtoneDialog(false);
  };

  return {
    customRingtone,
    soundType,
    isRingtoneLoaded,
    showRingtoneDialog,
    triggerRingtoneSelection,
    selectDefaultSound,
    openRingtoneDialog,
    closeRingtoneDialog,
    createDefaultBeep
  };
};
