
import { RingtoneData } from './types';
import { DatabaseManager } from './database';

export class RingtoneStorage {
  constructor(private dbManager: DatabaseManager) {}

  async saveRingtone(file: File): Promise<void> {
    console.log('🗄️ IndexedDB: Saving ringtone', file.name, file.size, file.type);
    
    // Clear audio buffer cache when new ringtone is saved
    const { audioBufferCache } = await import('../audioBufferCache');
    audioBufferCache.clearCache();
    console.log('🗄️ IndexedDB: Audio buffer cache cleared for new ringtone');
    
    await this.dbManager.init();
    const db = this.dbManager.getDatabase();
    
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const fileData = event.target?.result as ArrayBuffer;
        
        if (!fileData) {
          console.error('🗄️ IndexedDB: Failed to read file data');
          reject(new Error('Failed to read file data'));
          return;
        }
        
        const transaction = db.transaction([this.dbManager.getStoreName()], 'readwrite');
        const store = transaction.objectStore(this.dbManager.getStoreName());
        
        const ringtoneData: RingtoneData = {
          data: fileData,
          mimeType: file.type,
          fileName: file.name
        };
        
        const request = store.put(ringtoneData, 'custom_ringtone');
        
        request.onsuccess = async () => {
          console.log('🗄️ IndexedDB: Ringtone saved successfully with MIME type:', file.type);
          
          // Pre-decode and cache the audio buffer for instant future playback
          try {
            const { audioBufferCache } = await import('../audioBufferCache');
            const ringtoneHash = audioBufferCache.generateRingtoneHash(fileData);
            
            console.log('🗄️ IndexedDB: Pre-decoding audio buffer for cache...');
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(fileData.slice(0));
            
            audioBufferCache.setCachedAudioBuffer(audioBuffer, ringtoneHash);
            await audioContext.close();
            
            console.log('🗄️ IndexedDB: Audio buffer pre-decoded and cached for instant playback');
          } catch (error) {
            console.warn('🗄️ IndexedDB: Failed to pre-decode audio, will decode on first use:', error);
          }
          
          resolve();
        };
        
        request.onerror = (event: Event) => {
          console.error('🗄️ IndexedDB: Error saving ringtone:', (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      };
      
      reader.onerror = () => {
        console.error('🗄️ IndexedDB: Error reading file');
        reject(new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  async getRingtone(): Promise<string | null> {
    console.log('🗄️ IndexedDB: Getting ringtone');
    
    await this.dbManager.init();
    const db = this.dbManager.getDatabase();
    
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.dbManager.getStoreName()], 'readonly');
      const store = transaction.objectStore(this.dbManager.getStoreName());
      const request = store.get('custom_ringtone');
      
      request.onsuccess = (event: Event) => {
        const result = (event.target as IDBRequest).result;
        
        if (result) {
          if (result.data && result.mimeType) {
            const ringtoneData = result as RingtoneData;
            const blob = new Blob([ringtoneData.data], { type: ringtoneData.mimeType });
            const url = URL.createObjectURL(blob);
            
            console.log('🗄️ IndexedDB: Ringtone loaded successfully', {
              fileName: ringtoneData.fileName,
              mimeType: ringtoneData.mimeType,
              blobSize: blob.size,
              blobUrl: url.substring(0, 50) + '...'
            });
            
            resolve(url);
          } else {
            const fileData = result as ArrayBuffer;
            console.log('🗄️ IndexedDB: Legacy ringtone format detected, converting...');
            
            const blob = new Blob([fileData]);
            const url = URL.createObjectURL(blob);
            
            console.log('🗄️ IndexedDB: Legacy ringtone loaded', {
              blobSize: blob.size,
              blobUrl: url.substring(0, 50) + '...'
            });
            
            resolve(url);
          }
        } else {
          console.log('🗄️ IndexedDB: No ringtone found');
          resolve(null);
        }
      };
      
      request.onerror = (event: Event) => {
        console.error('🗄️ IndexedDB: Error getting ringtone:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async getRingtoneAsArrayBuffer(): Promise<ArrayBuffer | null> {
    console.log('🗄️ IndexedDB: Getting ringtone as ArrayBuffer for Web Audio API');
    
    await this.dbManager.init();
    const db = this.dbManager.getDatabase();
    
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.dbManager.getStoreName()], 'readonly');
      const store = transaction.objectStore(this.dbManager.getStoreName());
      const request = store.get('custom_ringtone');
      
      request.onsuccess = (event: Event) => {
        const result = (event.target as IDBRequest).result;
        
        if (result) {
          if (result.data && result.mimeType) {
            const ringtoneData = result as RingtoneData;
            
            console.log('🗄️ IndexedDB: Ringtone ArrayBuffer loaded successfully', {
              fileName: ringtoneData.fileName,
              mimeType: ringtoneData.mimeType,
              arrayBufferSize: ringtoneData.data.byteLength
            });
            
            resolve(ringtoneData.data);
          } else {
            const fileData = result as ArrayBuffer;
            console.log('🗄️ IndexedDB: Legacy ringtone ArrayBuffer format detected:', {
              arrayBufferSize: fileData.byteLength
            });
            
            resolve(fileData);
          }
        } else {
          console.log('🗄️ IndexedDB: No ringtone found for ArrayBuffer retrieval');
          resolve(null);
        }
      };
      
      request.onerror = (event: Event) => {
        console.error('🗄️ IndexedDB: Error getting ringtone as ArrayBuffer:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async getRingtoneMetadata(): Promise<{ mimeType: string; fileName: string } | null> {
    console.log('🗄️ IndexedDB: Getting ringtone metadata');
    
    await this.dbManager.init();
    const db = this.dbManager.getDatabase();
    
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.dbManager.getStoreName()], 'readonly');
      const store = transaction.objectStore(this.dbManager.getStoreName());
      const request = store.get('custom_ringtone');
      
      request.onsuccess = (event: Event) => {
        const result = (event.target as IDBRequest).result;
        
        if (result && result.mimeType && result.fileName) {
          const ringtoneData = result as RingtoneData;
          
          console.log('🗄️ IndexedDB: Ringtone metadata loaded:', {
            fileName: ringtoneData.fileName,
            mimeType: ringtoneData.mimeType
          });
          
          resolve({
            mimeType: ringtoneData.mimeType,
            fileName: ringtoneData.fileName
          });
        } else {
          console.log('🗄️ IndexedDB: No ringtone metadata found');
          resolve(null);
        }
      };
      
      request.onerror = (event: Event) => {
        console.error('🗄️ IndexedDB: Error getting ringtone metadata:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async clearRingtone(): Promise<void> {
    console.log('🗄️ IndexedDB: Clearing ringtone');
    
    // Clear audio buffer cache when ringtone is deleted
    const { audioBufferCache } = await import('../audioBufferCache');
    audioBufferCache.clearCache();
    console.log('🗄️ IndexedDB: Audio buffer cache cleared for ringtone deletion');
    
    await this.dbManager.init();
    const db = this.dbManager.getDatabase();
    
    if (!db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.dbManager.getStoreName()], 'readwrite');
      const store = transaction.objectStore(this.dbManager.getStoreName());
      const request = store.delete('custom_ringtone');
      
      request.onsuccess = () => {
        console.log('🗄️ IndexedDB: Ringtone cleared successfully');
        resolve();
      };
      
      request.onerror = (event: Event) => {
        console.error('🗄️ IndexedDB: Error clearing ringtone:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }
}
