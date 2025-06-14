
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

  // Load from storage when starting
  useEffect(() => {
    if (loadingRef.current || initializedRef.current) {
      console.log('🎵 [AudioManager] Skipping initialization - already initialized or loading');
      return;
    }

    loadingRef.current = true;
    initializedRef.current = true;
    console.log('🎵 [AudioManager] Starting initialization - loading ringtone settings from storage...');
    
    const storedType = localStorage.getItem(RINGTONE_TYPE_KEY) as 'custom' | 'default' | null;
    const storedData = localStorage.getItem(RINGTONE_STORAGE_KEY);
    const storedName = localStorage.getItem(RINGTONE_NAME_KEY);
    
    console.log('🎵 [AudioManager] Storage check results:', {
      storedType,
      hasStoredData: !!storedData,
      storedName,
      storedDataLength: storedData?.length || 0
    });
    
    if (storedType === 'default') {
      console.log('🎵 [AudioManager] Using default beep sound (from storage)');
      setRingtoneType('default');
      setCustomRingtone(null);
      setIsRingtoneLoaded(true);
      setShowStartupDialog(false);
    } else if (storedType === 'custom' && storedData && storedName) {
      try {
        console.log('🎵 [AudioManager] Found stored custom ringtone, converting to blob URL...');
        console.log('🎵 [AudioManager] Stored ringtone details:', {
          name: storedName,
          dataLength: storedData.length,
          dataPreview: storedData.substring(0, 50) + '...'
        });
        
        const byteCharacters = atob(storedData);
        console.log('🎵 [AudioManager] Base64 decoded, byte length:', byteCharacters.length);
        
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        console.log('🎵 [AudioManager] Byte array created, length:', byteArray.length);
        
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        console.log('🎵 [AudioManager] Blob URL created:', url.substring(0, 50) + '...');
        
        setCustomRingtone(url);
        setRingtoneType('custom');
        setIsRingtoneLoaded(true);
        setShowStartupDialog(false);
        console.log('✅ [AudioManager] Custom ringtone loaded from storage successfully:', storedName);
      } catch (error) {
        console.error('❌ [AudioManager] Failed to load stored custom ringtone:', error);
        console.error('❌ [AudioManager] Error details:', {
          storedName,
          dataLength: storedData?.length,
          errorMessage: (error as Error).message
        });
        // Fall back to default
        console.log('🎵 [AudioManager] Falling back to default beep sound');
        setRingtoneType('default');
        setCustomRingtone(null);
        setIsRingtoneLoaded(true);
        setShowStartupDialog(false);
      }
    } else {
      console.log('🔍 [AudioManager] No ringtone preference found, using default beep');
      setRingtoneType('default');
      setCustomRingtone(null);
      setIsRingtoneLoaded(true);
      setShowStartupDialog(false);
    }

    loadingRef.current = false;
    console.log('🎵 [AudioManager] Initialization completed');
  }, []);

  // Initialize hidden file input once
  useEffect(() => {
    if (fileInputRef.current) {
      console.log('🎵 [AudioManager] File input already exists, skipping creation');
      return;
    }

    console.log('🎵 [AudioManager] Creating hidden file input element...');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3,audio/mpeg,audio/wav,audio/ogg';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleRingtoneSelect);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;
    console.log('✅ [AudioManager] File input element created and added to DOM');

    return () => {
      console.log('🎵 [AudioManager] Cleaning up file input element...');
      if (fileInputRef.current && document.body.contains(fileInputRef.current)) {
        document.body.removeChild(fileInputRef.current);
        console.log('✅ [AudioManager] File input element removed from DOM');
      }
    };
  }, []);

  const handleRingtoneSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        console.log('🎵 [AudioManager] Processing new custom ringtone file...');
        console.log('🎵 [AudioManager] File details:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        });
        
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('🎵 [AudioManager] FileReader onload triggered');
          const result = e.target?.result as string;
          console.log('🎵 [AudioManager] FileReader result length:', result?.length || 0);
          
          const base64Data = result.split(',')[1];
          console.log('🎵 [AudioManager] Base64 data extracted, length:', base64Data?.length || 0);
          
          // Store custom ringtone settings
          console.log('🎵 [AudioManager] Storing custom ringtone data to localStorage...');
          localStorage.setItem(RINGTONE_STORAGE_KEY, base64Data);
          localStorage.setItem(RINGTONE_NAME_KEY, file.name);
          localStorage.setItem(RINGTONE_TYPE_KEY, 'custom');
          
          const url = URL.createObjectURL(file);
          console.log('🎵 [AudioManager] Blob URL created for immediate use:', url.substring(0, 50) + '...');
          
          setCustomRingtone(url);
          setRingtoneType('custom');
          setIsRingtoneLoaded(true);
          setShowStartupDialog(false);
          
          console.log('✅ [AudioManager] Custom ringtone loaded and stored successfully:', file.name);
        };
        
        reader.onerror = (e) => {
          console.error('❌ [AudioManager] FileReader error:', e);
        };
        
        console.log('🎵 [AudioManager] Starting FileReader.readAsDataURL...');
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ [AudioManager] Failed to process custom ringtone file:', error);
        console.error('❌ [AudioManager] Error details:', {
          fileName: file.name,
          fileSize: file.size,
          errorMessage: (error as Error).message
        });
        // Fall back to default
        console.log('🎵 [AudioManager] Falling back to default beep sound');
        setRingtoneType('default');
        setCustomRingtone(null);
        setIsRingtoneLoaded(true);
      }
    } else {
      console.log('⚠️ [AudioManager] No file selected in handleRingtoneSelect');
    }
  };

  const selectCustomSound = () => {
    console.log('🎵 [AudioManager] User requested custom sound selection');
    if (fileInputRef.current) {
      console.log('🎵 [AudioManager] Triggering file input click...');
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    } else {
      console.error('❌ [AudioManager] File input ref is null, cannot open file selector');
    }
  };

  const selectDefaultSound = () => {
    console.log('🎵 [AudioManager] User selected default sound');
    console.log('🎵 [AudioManager] Clearing custom ringtone data and setting to default...');
    
    // Clear custom ringtone data and set to default
    localStorage.setItem(RINGTONE_TYPE_KEY, 'default');
    localStorage.removeItem(RINGTONE_STORAGE_KEY);
    localStorage.removeItem(RINGTONE_NAME_KEY);
    
    setRingtoneType('default');
    setCustomRingtone(null);
    setIsRingtoneLoaded(true);
    setShowStartupDialog(false);
    
    console.log('✅ [AudioManager] Default sound selected and configured');
  };

  // Get the current ringtone for playback
  const getCurrentRingtone = (): string | null => {
    console.log('🎵 [AudioManager] getCurrentRingtone called');
    console.log('🎵 [AudioManager] Current state:', {
      ringtoneType,
      hasCustomRingtone: !!customRingtone,
      isRingtoneLoaded
    });
    
    if (ringtoneType === 'custom' && customRingtone) {
      console.log('🎵 [AudioManager] Returning custom ringtone:', customRingtone.substring(0, 50) + '...');
      return customRingtone;
    }
    // For default, we'll return null and handle it in audioUtils
    console.log('🎵 [AudioManager] Returning null (will use default beep)');
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
