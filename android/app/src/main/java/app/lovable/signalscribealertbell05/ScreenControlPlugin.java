
package app.lovable.signalscribealertbell05;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenControl")
public class ScreenControlPlugin extends Plugin {

    private PowerManager.WakeLock wakeLock;

    @PluginMethod
    public void turnOffScreen(PluginCall call) {
        try {
            // Method 1: Try device admin approach
            DevicePolicyManager devicePolicyManager = (DevicePolicyManager) getContext().getSystemService(Context.DEVICE_POLICY_SERVICE);
            if (devicePolicyManager != null) {
                devicePolicyManager.lockNow();
                call.resolve();
                return;
            }

            // Method 2: Turn off screen using system service
            PowerManager powerManager = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            if (powerManager != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                // This requires DEVICE_ADMIN permission
                Intent intent = new Intent(Intent.ACTION_SCREEN_OFF);
                getContext().sendBroadcast(intent);
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to turn off screen: " + e.getMessage());
        }
    }

    @PluginMethod
    public void acquireWakeLock(PluginCall call) {
        try {
            PowerManager powerManager = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "SignalTracker:WakeLock");
                wakeLock.acquire(10*60*1000L /*10 minutes*/);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to acquire wake lock: " + e.getMessage());
        }
    }

    @PluginMethod
    public void releaseWakeLock(PluginCall call) {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to release wake lock: " + e.getMessage());
        }
    }

    @PluginMethod
    public void keepScreenOn(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        
        getActivity().runOnUiThread(() -> {
            if (enabled) {
                getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
        
        call.resolve();
    }
}
