
import { RingtoneData } from '../types';
import { DatabaseManager } from '../database';

export class RingtoneMetadataManager {
  constructor(private dbManager: DatabaseManager) {}

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
}
