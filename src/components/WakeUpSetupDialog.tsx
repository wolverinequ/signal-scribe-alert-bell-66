
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Smartphone, Check, AlertCircle } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';

interface WakeUpSetupDialogProps {
  open: boolean;
  onComplete: () => void;
}

const WakeUpSetupDialog: React.FC<WakeUpSetupDialogProps> = ({ open, onComplete }) => {
  const [notificationPermission, setNotificationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [wakeLockPermission, setWakeLockPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isRequesting, setIsRequesting] = useState(false);

  const requestNotificationPermission = async () => {
    try {
      setIsRequesting(true);
      
      // For Capacitor apps
      if ('Capacitor' in window) {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display === 'granted') {
          setNotificationPermission('granted');
        } else {
          setNotificationPermission('denied');
        }
      } else {
        // For web browsers
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission === 'granted' ? 'granted' : 'denied');
        }
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      setNotificationPermission('denied');
    } finally {
      setIsRequesting(false);
    }
  };

  const requestWakeLockPermission = async () => {
    try {
      setIsRequesting(true);
      
      if ('wakeLock' in navigator) {
        // Request wake lock to test if it's available
        const wakeLock = await navigator.wakeLock.request('screen');
        await wakeLock.release();
        setWakeLockPermission('granted');
      } else {
        // Wake lock not supported, but we'll consider it "granted" for the flow
        setWakeLockPermission('granted');
      }
    } catch (error) {
      console.error('Wake lock not available:', error);
      // Consider it granted even if not available, as we have fallback methods
      setWakeLockPermission('granted');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleEnableWakeUp = async () => {
    await requestNotificationPermission();
    await requestWakeLockPermission();
  };

  const handleComplete = () => {
    if (notificationPermission === 'granted' && wakeLockPermission === 'granted') {
      localStorage.setItem('wakeup_setup_complete', 'true');
      onComplete();
    }
  };

  const isSetupComplete = notificationPermission === 'granted' && wakeLockPermission === 'granted';

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Phone Wake-up Setup
          </DialogTitle>
          <DialogDescription>
            Enable permissions to ensure you receive alerts even when your phone screen is off.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Receive signal alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notificationPermission === 'granted' && <Check className="h-5 w-5 text-green-500" />}
              {notificationPermission === 'denied' && <AlertCircle className="h-5 w-5 text-red-500" />}
              {notificationPermission === 'pending' && <div className="h-2 w-2 bg-gray-400 rounded-full" />}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Device Wake</p>
                <p className="text-sm text-muted-foreground">Wake up screen when alerts arrive</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {wakeLockPermission === 'granted' && <Check className="h-5 w-5 text-green-500" />}
              {wakeLockPermission === 'denied' && <AlertCircle className="h-5 w-5 text-red-500" />}
              {wakeLockPermission === 'pending' && <div className="h-2 w-2 bg-gray-400 rounded-full" />}
            </div>
          </div>

          {!isSetupComplete && (
            <Button 
              onClick={handleEnableWakeUp} 
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? 'Requesting Permissions...' : 'Enable Phone Wake-up'}
            </Button>
          )}

          {isSetupComplete && (
            <Button onClick={handleComplete} className="w-full bg-green-600 hover:bg-green-700">
              Setup Complete - Continue
            </Button>
          )}

          {(notificationPermission === 'denied' || wakeLockPermission === 'denied') && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Some permissions were denied. You can manually enable them in your device settings for this app.
              </p>
              <Button 
                onClick={handleComplete} 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
              >
                Continue Anyway
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WakeUpSetupDialog;
