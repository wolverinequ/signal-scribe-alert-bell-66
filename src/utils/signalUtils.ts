
import { Signal } from '@/types/signal';

export const parseSignals = (text: string): Signal[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const signals: Signal[] = [];
  
  lines.forEach((line, lineIndex) => {
    console.log(`📝 SignalUtils: Parsing line ${lineIndex}:`, line);
    
    const parts = line.split(';');
    console.log(`📝 SignalUtils: Split into ${parts.length} parts:`, parts);
    
    // Find the timestamp part (HH:MM format)
    let timeframe = '';
    let asset = '';
    let timestamp = '';
    let direction = '';
    
    // Look for timestamp in any position
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part.match(/^\d{1,2}:\d{2}$/)) {
        timestamp = part;
        console.log(`📝 SignalUtils: Found timestamp "${timestamp}" at position ${i}`);
        
        // Try to extract other fields if available
        if (i > 0 && parts[i-1].trim()) timeframe = parts[i-1].trim();
        if (i > 1 && parts[i-2].trim()) asset = parts[i-2].trim();
        if (i < parts.length - 1 && parts[i+1].trim()) direction = parts[i+1].trim();
        
        break;
      }
    }
    
    // If we have 4 parts and found a timestamp, use traditional parsing
    if (parts.length === 4 && timestamp) {
      const [tf, a, ts, d] = parts;
      if (ts.trim().match(/^\d{1,2}:\d{2}$/)) {
        timeframe = tf.trim();
        asset = a.trim();
        timestamp = ts.trim();
        direction = d.trim();
      }
    }
    
    if (timestamp) {
      // Ensure timestamp is in HH:MM format (pad single digit hours)
      const [hours, minutes] = timestamp.split(':');
      const formattedTimestamp = `${hours.padStart(2, '0')}:${minutes}`;
      
      const signal: Signal = {
        timeframe: timeframe || 'Unknown',
        asset: asset || 'Unknown',
        timestamp: formattedTimestamp,
        direction: direction || 'Unknown',
        triggered: false // Always start as not triggered
      };
      
      console.log(`📝 SignalUtils: Created signal:`, signal);
      signals.push(signal);
    } else {
      console.warn(`📝 SignalUtils: No valid timestamp found in line: "${line}"`);
    }
  });
  
  console.log(`📝 SignalUtils: Parsed ${signals.length} signals total:`, signals);
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
  
  // Current time in total seconds since midnight
  const currentTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;
  // Target time in total seconds since midnight
  const targetTotalSeconds = targetHours * 3600 + targetMinutes * 60 + targetSeconds;
  
  // Check if current time is within 2 seconds of target time (tolerance window)
  const timeDifference = Math.abs(currentTotalSeconds - targetTotalSeconds);
  const timeMatches = timeDifference <= 2; // 2-second tolerance
  
  // Log detailed comparison
  console.log(`⏰ SignalUtils: Time check for signal ${signal.timestamp}:`, {
    currentTime: `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')}`,
    targetTime: `${targetHours.toString().padStart(2, '0')}:${targetMinutes.toString().padStart(2, '0')}:${targetSeconds.toString().padStart(2, '0')}`,
    antidelaySeconds,
    timeDifference,
    timeMatches,
    alreadyTriggered: signal.triggered,
    shouldTrigger: timeMatches && !signal.triggered
  });
  
  return timeMatches && !signal.triggered;
};
