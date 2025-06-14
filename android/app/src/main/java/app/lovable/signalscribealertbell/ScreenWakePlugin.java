
package app.lovable.signalscribealertbell;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.WindowManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenWake")
public class ScreenWakePlugin extends Plugin {

    private static final String CHANNEL_ID = "SIGNAL_ALARM_CHANNEL";
    private static final int NOTIFICATION_ID = 12345;
    
    @PluginMethod
    public void wakeUpScreen(PluginCall call) {
        try {
            Activity activity = getActivity();
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    // Turn screen on and unlock
                    activity.getWindow().addFlags(
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    );
                    
                    // Wake up using PowerManager
                    PowerManager powerManager = (PowerManager) activity.getSystemService(Context.POWER_SERVICE);
                    if (powerManager != null) {
                        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                            PowerManager.SCREEN_BRIGHT_WAKE_LOCK | 
                            PowerManager.ACQUIRE_CAUSES_WAKEUP, 
                            "SignalApp:WakeUpTag"
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
                    
                    // Bring app to foreground
                    Intent intent = new Intent(activity, activity.getClass());
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    activity.startActivity(intent);
                });
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }
    
    @PluginMethod
    public void requestBatteryOptimizationExemption(PluginCall call) {
        try {
            Context context = getContext();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                String packageName = context.getPackageName();
                
                if (powerManager != null && !powerManager.isIgnoringBatteryOptimizations(packageName)) {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    startActivityForResult(call, intent, "batteryOptimizationResult");
                    return;
                }
            }
            
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }
    
    @PluginMethod
    public void checkBatteryOptimization(PluginCall call) {
        try {
            Context context = getContext();
            boolean optimized = true;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                String packageName = context.getPackageName();
                
                if (powerManager != null) {
                    optimized = !powerManager.isIgnoringBatteryOptimizations(packageName);
                }
            }
            
            JSObject ret = new JSObject();
            ret.put("optimized", optimized);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("optimized", true);
            call.resolve(ret);
        }
    }
    
    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(getContext())) {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                    intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                    startActivityForResult(call, intent, "overlayPermissionResult");
                    return;
                }
            }
            
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }
    
    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        boolean granted = true;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            granted = Settings.canDrawOverlays(getContext());
        }
        
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void createNotificationChannel(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Signal Alarms",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Binary Options Signal Alerts");
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{1000, 500, 1000, 500, 1000});
                channel.enableLights(true);
                channel.setLightColor(android.graphics.Color.RED);
                channel.setBypassDnd(true);
                channel.setShowBadge(true);
                
                NotificationManager notificationManager = getContext().getSystemService(NotificationManager.class);
                if (notificationManager != null) {
                    notificationManager.createNotificationChannel(channel);
                }
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }
    
    @PluginMethod
    public void scheduleAlarmNotification(PluginCall call) {
        try {
            int id = call.getInt("id", 1);
            String title = call.getString("title", "Signal Alert");
            String body = call.getString("body", "Binary Options Signal");
            long timestamp = call.getLong("timestamp", System.currentTimeMillis());
            boolean wakeUp = call.getBoolean("wakeUp", true);
            
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("id", id);
            intent.putExtra("title", title);
            intent.putExtra("body", body);
            intent.putExtra("wakeUp", wakeUp);
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 
                id, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            if (alarmManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timestamp, pendingIntent);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, timestamp, pendingIntent);
                }
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            call.resolve(ret);
        }
    }
}
