
import { Signal } from '@/types/signal';

export const parseSignals = (text: string): Signal[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const signals: Signal[] = [];
  
  lines.forEach(line => {
    const parts = line.split(';');
    if (parts.length >= 3) { // At least need timestamp
      const [timeframe, asset, timestamp, direction] = parts;
      if (timestamp && timestamp.trim().match(/^\d{2}:\d{2}$/)) {
        signals.push({
          timeframe: (timeframe || '').trim(),
          asset: (asset || '').trim(),
          timestamp: timestamp.trim(),
          direction: (direction || '').trim(),
          triggered: false
        });
        console.log('📝 Parsed signal:', {
          timeframe: (timeframe || '').trim(),
          asset: (asset || '').trim(),
          timestamp: timestamp.trim(),
          direction: (direction || '').trim()
        });
      } else {
        console.log('❌ Invalid timestamp format:', timestamp);
      }
    } else {
      console.log('❌ Invalid signal format (need at least 3 parts):', line);
    }
  });
  
  return signals;
};

export const checkSignalTime = (signal: Signal, antidelaySeconds: number = 0): boolean => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  
  // Parse signal timestamp
  const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
  
  // Calculate target time with antidelay
  const signalDate = new Date();
  signalDate.setHours(signalHours, signalMinutes, 0, 0);
  
  // Subtract antidelay seconds
  const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
  const targetHours = targetTime.getHours();
  const targetMinutes = targetTime.getMinutes();
  const targetSeconds = targetTime.getSeconds();
  
  // Check if current time exactly matches target time (precise to the second)
  const timeMatches = currentHours === targetHours && 
                     currentMinutes === targetMinutes && 
                     currentSeconds === targetSeconds;
  
  const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')}`;
  const targetTimeStr = `${targetHours.toString().padStart(2, '0')}:${targetMinutes.toString().padStart(2, '0')}:${targetSeconds.toString().padStart(2, '0')}`;
  
  if (timeMatches) {
    console.log(`⏰ TIME MATCH! Signal ${signal.asset || 'NO_ASSET'} at ${signal.timestamp} should trigger now`);
    console.log(`📅 Current: ${currentTimeStr}, Target: ${targetTimeStr}, Triggered: ${signal.triggered}`);
    console.log(`🔍 Signal details:`, {
      timeframe: signal.timeframe || 'EMPTY',
      asset: signal.asset || 'EMPTY', 
      timestamp: signal.timestamp,
      direction: signal.direction || 'EMPTY',
      triggered: signal.triggered
    });
  }
  
  return timeMatches && !signal.triggered;
};
