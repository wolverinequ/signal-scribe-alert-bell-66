
export const isValidAudioSource = (source: string): boolean => {
  // Check for data URL format
  if (source.startsWith('data:audio/')) {
    return source.includes('base64,') && source.split(',')[1]?.length > 0;
  }
  // Check for blob URL format
  if (source.startsWith('blob:')) {
    return true;
  }
  return false;
};

export const isAppInBackground = (): boolean => {
  // Check if app is hidden or in background
  return document.hidden || document.visibilityState === 'hidden';
};
