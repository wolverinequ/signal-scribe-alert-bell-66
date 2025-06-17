
import { Signal } from '@/types/signal';

export interface SignalData {
  signals: Signal[];
  timestamp: number;
}

export interface RingtoneData {
  data: ArrayBuffer;
  mimeType: string;
  fileName: string;
}

export interface DatabaseConfig {
  dbName: string;
  storeName: string;
  version: number;
}
