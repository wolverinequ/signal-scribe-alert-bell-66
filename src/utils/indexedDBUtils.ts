
import { Signal } from '@/types/signal';

interface SignalData {
  signals: Signal[];
  timestamp: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'signalDB';
  private readonly storeName = 'signalsStore';
  private readonly version = 2;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBRequest).result as IDBDatabase;
        if (event.oldVersion < 1) {
          db.createObjectStore(this.storeName);
        }
        if (event.oldVersion < 2) {
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        }
      };

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBRequest).result as IDBDatabase;
        console.log('🗄️ IndexedDB: Database initialized');
        resolve();
      };

      request.onerror = (event: Event) => {
        console.error('🗄️ IndexedDB: Error opening database:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async saveSignals(signals: Signal[]): Promise<void> {
    console.log('🗄️ IndexedDB: Saving signals', signals);
    
    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const data: SignalData = {
        signals: signals,
        timestamp: Date.now()
      };
      
      const request = store.put(data, 'signals');

      request.onsuccess = () => {
        console.log('🗄️ IndexedDB: Signals saved successfully');
        resolve();
      };

      request.onerror = (event: Event) => {
        console.error('🗄️ IndexedDB: Error saving signals:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async loadSignals(): Promise<Signal[]> {
    console.log('🗄️ IndexedDB: Loading signals');
    
    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get('signals');

      request.onsuccess = (event: Event) => {
        const result = (event.target as IDBRequest).result as SignalData;
        if (result) {
          console.log('🗄️ IndexedDB: Signals loaded successfully');
          resolve(result.signals);
        } else {
          console.log('🗄️ IndexedDB: No signals found');
          resolve([]);
        }
      };

      request.onerror = (event: Event) => {
        console.error('🗄️ IndexedDB: Error loading signals:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  async saveRingtone(file: File): Promise<void> {
    console.log('🗄️ IndexedDB: Saving ringtone', file.name, file.size, file.type);
    
    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
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
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.put(fileData, 'custom_ringtone');
        
        request.onsuccess = () => {
          console.log('🗄️ IndexedDB: Ringtone saved successfully');
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
    
    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get('custom_ringtone');
      
      request.onsuccess = (event: Event) => {
        const fileData = (event.target as IDBRequest).result as ArrayBuffer;
        
        if (fileData) {
          // Convert ArrayBuffer to Blob
          const blob = new Blob([fileData]);
          
          // Check if the blob is an audio file
          if (blob.type.startsWith('audio/')) {
            // Create a blob URL
            const url = URL.createObjectURL(blob);
            
            console.log('🗄️ IndexedDB: Ringtone loaded successfully', {
              blobType: blob.type,
              blobSize: blob.size,
              blobUrl: url.substring(0, 50) + '...'
            });
            
            resolve(url);
          } else {
            console.error('🗄️ IndexedDB: Unsupported audio format');
            reject(new Error('Unsupported audio format'));
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

  async clearRingtone(): Promise<void> {
    console.log('🗄️ IndexedDB: Clearing ringtone');
    
    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
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

export const indexedDBManager = new IndexedDBManager();
