
import { DatabaseConfig } from './types';

export class DatabaseManager {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBRequest).result as IDBDatabase;
        if (event.oldVersion < 1) {
          db.createObjectStore(this.config.storeName);
        }
        if (event.oldVersion < 2) {
          if (!db.objectStoreNames.contains(this.config.storeName)) {
            db.createObjectStore(this.config.storeName);
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

  getDatabase(): IDBDatabase | null {
    return this.db;
  }

  getStoreName(): string {
    return this.config.storeName;
  }
}
