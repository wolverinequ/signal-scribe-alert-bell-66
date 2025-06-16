
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

export class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
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

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const audioData = reader.result as ArrayBuffer;
        const ringtoneData: RingtoneData = {
          id: 'current_ringtone',
          fileName: file.name,
          fileType: file.type,
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
            type: file.type
          });
          resolve(ringtoneData.id);
        };

        request.onerror = () => {
          console.error('🗄️ IndexedDB: Failed to save ringtone:', request.error);
          reject(request.error);
        };
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

      request.onsuccess = () => {
        if (request.result) {
          const ringtoneData: RingtoneData = request.result;
          const blob = new Blob([ringtoneData.audioData], { type: ringtoneData.fileType });
          const url = URL.createObjectURL(blob);
          
          console.log('🗄️ IndexedDB: Ringtone retrieved successfully:', {
            fileName: ringtoneData.fileName,
            size: ringtoneData.audioData.byteLength,
            type: ringtoneData.fileType
          });
          
          resolve(url);
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
