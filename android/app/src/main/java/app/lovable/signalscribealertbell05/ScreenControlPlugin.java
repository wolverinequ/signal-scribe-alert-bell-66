
package app.lovable.signalscribealertbell05;

import android.app.KeyguardManager;
import android.content.Context;
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
            PowerManager powerManager = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            
            if (powerManager != null) {
                // Turn off screen using goToSleep method
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN_MR1) {
                    powerManager.goToSleep(android.os.SystemClock.uptimeMillis());
                    call.resolve();
                    return;
                }
                
                // Alternative approach for older versions
                KeyguardManager keyguardManager = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
                if (keyguardManager != null) {
                    // This will lock the screen
                    getActivity().runOnUiThread(() -> {
                        getActivity().moveTaskToBack(true);
                        // Force the screen to turn off
                        WindowManager.LayoutParams params = getActivity().getWindow().getAttributes();
                        params.flags |= WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON;
                        params.screenBrightness = 0.0f;
                        getActivity().getWindow().setAttributes(params);
                        
                        // Simulate screen lock by finishing activity
                        getActivity().finish();
                    });
                }
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
