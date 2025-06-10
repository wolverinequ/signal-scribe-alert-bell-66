
import { Signal } from '@/types/signal';

export const parseSignals = (text: string): Signal[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const signals: Signal[] = [];
  
  lines.forEach(line => {
    const parts = line.split(';');
    if (parts.length === 4) {
      const [timeframe, asset, timestamp, direction] = parts;
      if (timestamp.match(/^\d{2}:\d{2}$/)) {
        signals.push({
          timeframe: timeframe.trim(),
          asset: asset.trim(),
          timestamp: timestamp.trim(),
          direction: direction.trim(),
          triggered: false
        });
      }
    }
  });
  
  return signals;
};

export const checkSignalTime = (signal: Signal): boolean => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return signal.timestamp === currentTime && !signal.triggered;
};
