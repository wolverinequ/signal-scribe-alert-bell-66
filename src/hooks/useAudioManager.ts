
import { useState, useEffect, useRef } from 'react';
import { useVisualDebugger } from './useVisualDebugger';

const RINGTONE_STORAGE_KEY = 'selected_custom_ringtone_data';
const RINGTONE_NAME_KEY = 'selected_custom_ringtone_name';

export const useAudioManager = () => {
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  const [isRingtoneLoaded, setIsRingtoneLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadingRef = useRef(false);
  const { addLog } = useVisualDebugger();

  // Load from storage when starting
  useEffect(() => {
    if (loadingRef.current) {
      console.log('🎵 AudioManager: Loading already in progress, skipping...');
      addLog('Loading already in progress, skipping...');
      return;
    }

    loadingRef.current = true;
    console.log('🎵 AudioManager: ===== STARTING INITIAL LOAD FROM STORAGE =====');
    addLog('Starting initial load from storage', 'info');
    
    const storedData = localStorage.getItem(RINGTONE_STORAGE_KEY);
    const storedName = localStorage.getItem(RINGTONE_NAME_KEY);
    
    console.log('🎵 AudioManager: Storage check - hasData:', !!storedData, 'hasName:', !!storedName);
    addLog(`Storage check - hasData: ${!!storedData}, hasName: ${!!storedName}`);
    
    if (storedData && storedName) {
      try {
        console.log('🎵 AudioManager: Converting stored data to blob URL...');
        console.log('🎵 AudioManager: Stored name:', storedName);
        console.log('🎵 AudioManager: Stored data length:', storedData.length);
        addLog(`Converting stored data to blob URL for: ${storedName}`);
        
        const byteCharacters = atob(storedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        console.log('🎵 AudioManager: Generated blob URL:', url);
        addLog(`Generated blob URL: ${url.substring(0, 50)}...`, 'success');
        setCustomRingtone(url);
        setIsRingtoneLoaded(true);
        console.log('✅ AudioManager: Initial ringtone loaded successfully from storage');
        console.log('🎵 AudioManager: Current state - customRingtone:', url, 'isRingtoneLoaded:', true);
        addLog('Initial ringtone loaded successfully from storage', 'success');
      } catch (error) {
        console.error('❌ AudioManager: Failed to load stored ringtone:', error);
        addLog('Failed to load stored ringtone: ' + error, 'error');
        setIsRingtoneLoaded(false);
        setCustomRingtone(null);
      }
    } else {
      console.log('🔍 AudioManager: No stored ringtone found in localStorage');
      addLog('No stored ringtone found in localStorage');
      setIsRingtoneLoaded(false);
      setCustomRingtone(null);
    }

    loadingRef.current = false;
    console.log('🎵 AudioManager: ===== INITIAL LOAD COMPLETE =====');
    addLog('Initial load complete');
  }, [addLog]);

  // Initialize hidden file input once
  useEffect(() => {
    if (fileInputRef.current) {
      console.log('🎵 AudioManager: File input already exists, skipping creation');
      addLog('File input already exists, skipping creation');
      return;
    }

    console.log('🎵 AudioManager: Creating hidden file input element');
    addLog('Creating hidden file input element');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3,audio/mpeg';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleRingtoneSelect);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;
    console.log('✅ AudioManager: File input element created and attached');
    addLog('File input element created and attached', 'success');

    return () => {
      console.log('🧹 AudioManager: Cleaning up file input element');
      addLog('Cleaning up file input element');
      if (fileInputRef.current && document.body.contains(fileInputRef.current)) {
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, [addLog]);

  const handleRingtoneSelect = async (event: Event) => {
    console.log('🎵 AudioManager: ===== NEW FILE SELECTION STARTED =====');
    addLog('NEW FILE SELECTION STARTED', 'info');
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        console.log('🎵 AudioManager: Processing new ringtone file');
        console.log('🎵 AudioManager: File name:', file.name);
        console.log('🎵 AudioManager: File size:', file.size, 'bytes');
        console.log('🎵 AudioManager: File type:', file.type);
        addLog(`Processing new file: ${file.name} (${file.size} bytes)`);
        
        // Clean up previous blob URL if it exists
        if (customRingtone) {
          console.log('🧹 AudioManager: Revoking previous blob URL:', customRingtone);
          addLog(`Revoking previous blob URL: ${customRingtone.substring(0, 50)}...`);
          URL.revokeObjectURL(customRingtone);
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('🎵 AudioManager: FileReader onload triggered');
          addLog('FileReader onload triggered');
          const result = e.target?.result as string;
          const base64Data = result.split(',')[1];
          
          console.log('🎵 AudioManager: Base64 data length:', base64Data.length);
          console.log('🎵 AudioManager: Saving to localStorage...');
          addLog(`Base64 data length: ${base64Data.length}, saving to localStorage...`);
          
          // Save to storage
          localStorage.setItem(RINGTONE_STORAGE_KEY, base64Data);
          localStorage.setItem(RINGTONE_NAME_KEY, file.name);
          
          console.log('✅ AudioManager: Data saved to localStorage');
          addLog('Data saved to localStorage', 'success');
          
          // Create new blob URL and update state immediately
          const url = URL.createObjectURL(file);
          console.log('🎵 AudioManager: New blob URL created:', url);
          console.log('🎵 AudioManager: About to update state...');
          console.log('🎵 AudioManager: Previous customRingtone:', customRingtone);
          console.log('🎵 AudioManager: New customRingtone will be:', url);
          addLog(`New blob URL created: ${url.substring(0, 50)}...`);
          addLog(`About to update state - Previous: ${customRingtone?.substring(0, 20) || 'null'}`);
          addLog(`New customRingtone will be: ${url.substring(0, 20)}...`);
          
          setCustomRingtone(url);
          setIsRingtoneLoaded(true);
          
          console.log('✅ AudioManager: State updated - new MP3 ringtone loaded and stored');
          console.log('🎵 AudioManager: Final state - customRingtone:', url, 'isRingtoneLoaded:', true);
          console.log('🎵 AudioManager: ===== NEW FILE SELECTION COMPLETE =====');
          addLog('State updated - new MP3 ringtone loaded and stored', 'success');
          addLog('NEW FILE SELECTION COMPLETE', 'success');
        };
        
        console.log('🎵 AudioManager: Starting FileReader.readAsDataURL...');
        addLog('Starting FileReader.readAsDataURL...');
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ AudioManager: Failed to process ringtone file:', error);
        addLog('Failed to process ringtone file: ' + error, 'error');
        setIsRingtoneLoaded(false);
        setCustomRingtone(null);
      }
    } else {
      console.log('⚠️ AudioManager: No file selected');
      addLog('No file selected', 'error');
    }
  };

  const triggerRingtoneSelection = () => {
    console.log('🎵 AudioManager: ===== TRIGGER RINGTONE SELECTION =====');
    console.log('🎵 AudioManager: Current customRingtone before selection:', customRingtone);
    console.log('🎵 AudioManager: Current isRingtoneLoaded before selection:', isRingtoneLoaded);
    addLog('TRIGGER RINGTONE SELECTION', 'info');
    addLog(`Current state before selection - customRingtone: ${customRingtone?.substring(0, 20) || 'null'}`);
    addLog(`isRingtoneLoaded: ${isRingtoneLoaded}`);
    
    if (fileInputRef.current) {
      console.log('🎵 AudioManager: Clearing file input value and triggering click');
      addLog('Clearing file input value and triggering click');
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    } else {
      console.error('❌ AudioManager: File input ref is null!');
      addLog('File input ref is null!', 'error');
    }
  };

  const changeRingtone = () => {
    console.log('🎵 AudioManager: changeRingtone called - delegating to triggerRingtoneSelection');
    addLog('changeRingtone called - delegating to triggerRingtoneSelection');
    triggerRingtoneSelection();
  };

  // Log state changes
  useEffect(() => {
    console.log('🔄 AudioManager: customRingtone state changed to:', customRingtone);
    addLog(`customRingtone state changed to: ${customRingtone?.substring(0, 30) || 'null'}`, 'info');
  }, [customRingtone, addLog]);

  useEffect(() => {
    console.log('🔄 AudioManager: isRingtoneLoaded state changed to:', isRingtoneLoaded);
    addLog(`isRingtoneLoaded state changed to: ${isRingtoneLoaded}`, 'info');
  }, [isRingtoneLoaded, addLog]);

  return {
    customRingtone,
    isRingtoneLoaded,
    triggerRingtoneSelection,
    changeRingtone,
    setCustomRingtone
  };
};
