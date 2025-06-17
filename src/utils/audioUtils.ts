
// Re-export audio utilities to maintain existing API
export { createBeepAudio } from './audio/audioContext';
export { playCustomRingtone } from './audio/audioPlayer';
export { playCustomRingtoneWithWebAudio } from './audio/webAudioPlayer';
export { isValidAudioSource, isAppInBackground } from './audio/audioValidation';
