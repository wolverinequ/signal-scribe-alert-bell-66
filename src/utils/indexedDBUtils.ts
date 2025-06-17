
const DB_NAME = 'SignalTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'ringtones';

interface RingtoneData {
  id: string;
  fileName: string;
  fileType: string;
  audioData: ArrayBuffer;
  createdAt: number;
}

// Supported audio formats
const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/webm'
];

// Cache for blob URLs to prevent recreating them
let cachedBlobUrl: string | null = null;
let cachedDataHash: string | null = null;

const validateAudioFormat = (file: File): boolean => {
  console.log('🗄️ IndexedDB: Validating audio format:', file.type);
  
  // Check MIME type
  if (SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
    return true;
  }
  
  // Fallback: check file extension
  const extension = file.name.toLowerCase().split('.').pop();
  const extensionToMime: { [key: string]: string } = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'audio/mp4',
    'm4a': 'audio/x-m4a',
    'aac': 'audio/aac',
    'webm': 'audio/webm'
  };
  
  if (extension && extensionToMime[extension]) {
    console.log('🗄️ IndexedDB: Audio format validated by extension:', extension);
    return true;
  }
  
  console.warn('🗄️ IndexedDB: Unsupported audio format:', file.type, 'Extension:', extension);
  return false;
};

const createDataHash = (data: ArrayBuffer): string => {
  // Simple hash based on size and first few bytes
  const view = new Uint8Array(data);
  let hash = data.byteLength.toString();
  if (view.length > 0) hash += view[0].toString();
  if (view.length > 1) hash += view[1].toString();
  if (view.length > 2) hash += view[2].toString();
  return hash;
};

const testAudioPlayback = async (blobUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    let resolved = false;
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      }
    };
    
    const onCanPlay = () => {
      console.log('🗄️ IndexedDB: Audio test passed - can play');
      cleanup();
      resolve(true);
    };
    
    const onLoadedMetadata = () => {
      console.log('🗄️ IndexedDB: Audio metadata loaded successfully');
      cleanup();
      resolve(true);
    };
    
    const onError = (e: Event) => {
      console.error('🗄️ IndexedDB: Audio test failed:', e);
      cleanup();
      resolve(false);
    };
    
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);
    
    // Set a timeout to avoid hanging
    setTimeout(() => {
      if (!resolved) {
        console.warn('🗄️ IndexedDB: Audio test timeout');
        cleanup();
        resolve(false);
      }
    }, 5000);
    
    audio.src = blobUrl;
    audio.load();
  });
};

export class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) {
      console.log('🗄️ IndexedDB: Database already initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('🗄️ IndexedDB: Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('🗄️ IndexedDB: Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('fileName', 'fileName', { unique: false });
          console.log('🗄️ IndexedDB: Object store created');
        }
      };
    });
  }

  async saveRingtone(file: File): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    // Validate audio format first
    if (!validateAudioFormat(file)) {
      throw new Error(`Unsupported audio format: ${file.type}. Please use MP3, WAV, OGG, MP4, M4A, AAC, or WebM files.`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const audioData = reader.result as ArrayBuffer;
          
          // Clear cached blob URL since we're saving new data
          if (cachedBlobUrl) {
            URL.revokeObjectURL(cachedBlobUrl);
            cachedBlobUrl = null;
            cachedDataHash = null;
          }
          
          // Ensure we have a valid MIME type
          let fileType = file.type;
          if (!fileType || fileType === '') {
            // Try to infer from extension
            const extension = file.name.toLowerCase().split('.').pop();
            const extensionToMime: { [key: string]: string } = {
              'mp3': 'audio/mpeg',
              'wav': 'audio/wav',
              'ogg': 'audio/ogg',
              'mp4': 'audio/mp4',
              'm4a': 'audio/x-m4a',
              'aac': 'audio/aac',
              'webm': 'audio/webm'
            };
            fileType = extension ? (extensionToMime[extension] || 'audio/mpeg') : 'audio/mpeg';
            console.log('🗄️ IndexedDB: Inferred MIME type:', fileType, 'from extension:', extension);
          }
          
          const ringtoneData: RingtoneData = {
            id: 'current_ringtone',
            fileName: file.name,
            fileType,
            audioData,
            createdAt: Date.now()
          };

          const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put(ringtoneData);

          request.onsuccess = () => {
            console.log('🗄️ IndexedDB: Ringtone saved successfully:', {
              fileName: file.name,
              size: audioData.byteLength,
              type: fileType
            });
            resolve(ringtoneData.id);
          };

          request.onerror = () => {
            console.error('🗄️ IndexedDB: Failed to save ringtone:', request.error);
            reject(request.error);
          };
        } catch (error) {
          console.error('🗄️ IndexedDB: Error processing file:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        console.error('🗄️ IndexedDB: Failed to read file');
        reject(reader.error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  async getRingtone(): Promise<string | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('current_ringtone');

      request.onsuccess = async () => {
        if (request.result) {
          try {
            const ringtoneData: RingtoneData = request.result;
            const dataHash = createDataHash(ringtoneData.audioData);
            
            // Return cached blob URL if data hasn't changed
            if (cachedBlobUrl && cachedDataHash === dataHash) {
              console.log('🗄️ IndexedDB: Returning cached blob URL');
              resolve(cachedBlobUrl);
              return;
            }
            
            console.log('🗄️ IndexedDB: Creating blob with type:', ringtoneData.fileType);
            const blob = new Blob([ringtoneData.audioData], { type: ringtoneData.fileType });
            const url = URL.createObjectURL(blob);
            
            console.log('🗄️ IndexedDB: Blob created:', {
              fileName: ringtoneData.fileName,
              size: ringtoneData.audioData.byteLength,
              type: ringtoneData.fileType,
              blobSize: blob.size,
              blobType: blob.type,
              url: url.substring(0, 50) + '...'
            });
            
            // Test if the audio can be played
            const canPlay = await testAudioPlayback(url);
            if (!canPlay) {
              console.warn('🗄️ IndexedDB: Audio playback test failed, cleaning up URL');
              URL.revokeObjectURL(url);
              resolve(null);
              return;
            }
            
            // Cache the blob URL and data hash
            if (cachedBlobUrl && cachedBlobUrl !== url) {
              URL.revokeObjectURL(cachedBlobUrl);
            }
            cachedBlobUrl = url;
            cachedDataHash = dataHash;
            
            console.log('🗄️ IndexedDB: Ringtone retrieved and validated successfully');
            resolve(url);
          } catch (error) {
            console.error('🗄️ IndexedDB: Error creating blob URL:', error);
            resolve(null);
          }
        } else {
          console.log('🗄️ IndexedDB: No ringtone found');
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('🗄️ IndexedDB: Failed to retrieve ringtone:', request.error);
        reject(request.error);
      };
    });
  }

  async clearRingtone(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    // Clear cached blob URL
    if (cachedBlobUrl) {
      URL.revokeObjectURL(cachedBlobUrl);
      cachedBlobUrl = null;
      cachedDataHash = null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete('current_ringtone');

      request.onsuccess = () => {
        console.log('🗄️ IndexedDB: Ringtone cleared successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('🗄️ IndexedDB: Failed to clear ringtone:', request.error);
        reject(request.error);
      };
    });
  }

  async getRingtoneInfo(): Promise<{ fileName: string; size: number; type: string } | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('current_ringtone');

      request.onsuccess = () => {
        if (request.result) {
          const ringtoneData: RingtoneData = request.result;
          resolve({
            fileName: ringtoneData.fileName,
            size: ringtoneData.audioData.byteLength,
            type: ringtoneData.fileType
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('🗄️ IndexedDB: Failed to get ringtone info:', request.error);
        reject(request.error);
      };
    });
  }
}

export const indexedDBManager = new IndexedDBManager();
