
import { Signal } from '@/types/signal';
import { DatabaseManager } from './database';
import { SignalStorage } from './signalStorage';
import { RingtoneStorage } from './ringtoneStorage';
import { DatabaseConfig } from './types';

class IndexedDBManager {
  private dbManager: DatabaseManager;
  private signalStorage: SignalStorage;
  private ringtoneStorage: RingtoneStorage;

  constructor() {
    const config: DatabaseConfig = {
      dbName: 'signalDB',
      storeName: 'signalsStore',
      version: 2
    };

    this.dbManager = new DatabaseManager(config);
    this.signalStorage = new SignalStorage(this.dbManager);
    this.ringtoneStorage = new RingtoneStorage(this.dbManager);
  }

  async init(): Promise<void> {
    return this.dbManager.init();
  }

  // Signal methods
  async saveSignals(signals: Signal[]): Promise<void> {
    return this.signalStorage.saveSignals(signals);
  }

  async loadSignals(): Promise<Signal[]> {
    return this.signalStorage.loadSignals();
  }

  // Ringtone methods
  async saveRingtone(file: File): Promise<void> {
    return this.ringtoneStorage.saveRingtone(file);
  }

  async getRingtone(): Promise<string | null> {
    return this.ringtoneStorage.getRingtone();
  }

  async getRingtoneAsArrayBuffer(): Promise<ArrayBuffer | null> {
    return this.ringtoneStorage.getRingtoneAsArrayBuffer();
  }

  async getRingtoneMetadata(): Promise<{ mimeType: string; fileName: string } | null> {
    return this.ringtoneStorage.getRingtoneMetadata();
  }

  async clearRingtone(): Promise<void> {
    return this.ringtoneStorage.clearRingtone();
  }
}

export const indexedDBManager = new IndexedDBManager();
