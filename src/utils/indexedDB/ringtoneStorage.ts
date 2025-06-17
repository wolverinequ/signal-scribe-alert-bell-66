
import { DatabaseManager } from './database';
import { RingtoneOperationsManager } from './ringtone/ringtoneOperations';
import { RingtoneMetadataManager } from './ringtone/ringtoneMetadata';

export class RingtoneStorage {
  private operationsManager: RingtoneOperationsManager;
  private metadataManager: RingtoneMetadataManager;

  constructor(private dbManager: DatabaseManager) {
    this.operationsManager = new RingtoneOperationsManager(dbManager);
    this.metadataManager = new RingtoneMetadataManager(dbManager);
  }

  async saveRingtone(file: File): Promise<void> {
    return this.operationsManager.saveRingtone(file);
  }

  async getRingtone(): Promise<string | null> {
    return this.operationsManager.getRingtone();
  }

  async getRingtoneAsArrayBuffer(): Promise<ArrayBuffer | null> {
    return this.operationsManager.getRingtoneAsArrayBuffer();
  }

  async getRingtoneMetadata(): Promise<{ mimeType: string; fileName: string } | null> {
    return this.metadataManager.getRingtoneMetadata();
  }

  async clearRingtone(): Promise<void> {
    return this.operationsManager.clearRingtone();
  }
}
