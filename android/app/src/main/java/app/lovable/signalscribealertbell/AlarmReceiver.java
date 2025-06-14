
package app.lovable.signalscribealertbell;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.view.WindowManager;
import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {
    
    private static final String CHANNEL_ID = "SIGNAL_ALARM_CHANNEL";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        int id = intent.getIntExtra("id", 1);
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        boolean wakeUp = intent.getBooleanExtra("wakeUp", true);
        
        if (wakeUp) {
            wakeUpDevice(context);
        }
        
        showNotification(context, id, title, body);
    }
    
    private void wakeUpDevice(Context context) {
        try {
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | 
                    PowerManager.ACQUIRE_CAUSES_WAKEUP, 
                    "SignalApp:AlarmWakeTag"
                );
                wakeLock.acquire(10000); // 10 seconds
                
                // Release after delay
                new Thread(() -> {
                    try {
                        Thread.sleep(5000);
                        if (wakeLock.isHeld()) {
                            wakeLock.release();
                        }
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }).start();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private void showNotification(Context context, int id, String title, String body) {
        try {
            Intent appIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (appIntent != null) {
                appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            }
            
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                id, 
                appIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setFullScreenIntent(pendingIntent, true)
                .setAutoCancel(false)
                .setOngoing(true)
                .setVibrate(new long[]{1000, 500, 1000, 500, 1000})
                .setLights(android.graphics.Color.RED, 1000, 500)
                .setContentIntent(pendingIntent);
            
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.notify(id, builder.build());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
