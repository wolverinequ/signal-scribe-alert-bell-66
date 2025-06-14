
import { useState, useEffect, useRef } from 'react';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone_data';
const RINGTONE_NAME_KEY = 'selected_custom_ringtone_name';
const RINGTONE_TYPE_KEY = 'selected_ringtone_type'; // 'custom' or 'default'

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [ringtoneType, setRingtoneType] = useState<'custom' | 'default' | null>(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const [showStartupDialog, setShowStartupDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);

  // Create default beep sound
  const createDefaultBeepSound = (): string => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Create a blob URL for the default sound (this is a simplified approach)
    // In practice, you might want to use a pre-recorded beep sound
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBC2E1O/LfC0HL';
  };

  // Load from storage when starting
  useEffect(() => {
    if (loadingRef.current || initializedRef.current) {
      return;
    }

    loadingRef.current = true;
    initializedRef.current = true;
    console.log('🎵 AudioManager: Loading ringtone settings from storage...');
    
    const storedType = localStorage.getItem(RINGTONE_TYPE_KEY) as 'custom' | 'default' | null;
    const storedData = localStorage.getItem(RINGTONE_STORAGE_KEY);
    const storedName = localStorage.getItem(RINGTONE_NAME_KEY);
    
    if (storedType === 'default') {
      console.log('🎵 AudioManager: Using default beep sound');
      setRingtoneType('default');
      setCustomRingtone(null);
      setIsRingtoneLoaded(true);
      setShowStartupDialog(false);
    } else if (storedType === 'custom' && storedData && storedName) {
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
        setRingtoneType('custom');
        setIsRingtoneLoaded(true);
        setShowStartupDialog(false);
        console.log('✅ AudioManager: Custom ringtone loaded from storage successfully:', storedName);
      } catch (error) {
        console.error('❌ AudioManager: Failed to load stored custom ringtone:', error);
        // Fall back to default
        setRingtoneType('default');
        setCustomRingtone(null);
        setIsRingtoneLoaded(true);
        setShowStartupDialog(false);
      }
    } else {
      console.log('🔍 AudioManager: No ringtone preference found, using default beep');
      setRingtoneType('default');
      setCustomRingtone(null);
      setIsRingtoneLoaded(true);
      setShowStartupDialog(false);
    }

    loadingRef.current = false;
  }, []);

  // Initialize hidden file input once
  useEffect(() => {
    if (fileInputRef.current) {
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3,audio/mpeg,audio/wav,audio/ogg';
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
          
          // Store custom ringtone settings
          localStorage.setItem(RINGTONE_STORAGE_KEY, base64Data);
          localStorage.setItem(RINGTONE_NAME_KEY, file.name);
          localStorage.setItem(RINGTONE_TYPE_KEY, 'custom');
          
          const url = URL.createObjectURL(file);
          setCustomRingtone(url);
          setRingtoneType('custom');
          setIsRingtoneLoaded(true);
          setShowStartupDialog(false);
          
          console.log('✅ AudioManager: Custom ringtone loaded and stored:', file.name);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ AudioManager: Failed to process custom ringtone file:', error);
        // Fall back to default
        setRingtoneType('default');
        setCustomRingtone(null);
        setIsRingtoneLoaded(true);
      }
    }
  };

  const selectCustomSound = () => {
    console.log('🎵 AudioManager: User requested custom sound selection');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const selectDefaultSound = () => {
    console.log('🎵 AudioManager: User selected default sound');
    // Clear custom ringtone data and set to default
    localStorage.setItem(RINGTONE_TYPE_KEY, 'default');
    localStorage.removeItem(RINGTONE_STORAGE_KEY);
    localStorage.removeItem(RINGTONE_NAME_KEY);
    
    setRingtoneType('default');
    setCustomRingtone(null);
    setIsRingtoneLoaded(true);
    setShowStartupDialog(false);
  };

  // Get the current ringtone for playback
  const getCurrentRingtone = (): string | null => {
    if (ringtoneType === 'custom' && customRingtone) {
      return customRingtone;
    }
    // For default, we'll return null and handle it in audioUtils
    return null;
  };

  return {
    customRingtone: getCurrentRingtone(),
    ringtoneType,
    isRingtoneLoaded,
    showStartupDialog,
    selectCustomSound,
    selectDefaultSound,
    setCustomRingtone
  };
};
