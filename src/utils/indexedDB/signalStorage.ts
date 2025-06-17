
import { Signal } from '@/types/signal';
import { SignalData } from './types';
import { DatabaseManager } from './database';

export class SignalStorage {
  constructor(private dbManager: DatabaseManager) {}

  async saveSignals(signals: Signal[]): Promise<void> {
    console.log('🗄️ IndexedDB: Saving signals', signals);
    
    await this.dbManager.init();
    const db = this.dbManager.getDatabase();
    
    if (!db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.dbManager.getStoreName()], 'readwrite');
      const store = transaction.objectStore(this.dbManager.getStoreName());
      
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
    
    await this.dbManager.init();
    const db = this.dbManager.getDatabase();
    
    if (!db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.dbManager.getStoreName()], 'readonly');
      const store = transaction.objectStore(this.dbManager.getStoreName());
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
}
