
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2d7d3733b2784c8c90fb4c2f861b9411',
  appName: 'signal-scribe-alert-bell-05',
  webDir: 'dist',
  server: {
    url: 'https://2d7d3733-b278-4c8c-90fb-4c2f861b9411.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
      wakeup: true,
      priority: "max",
      category: "alarm",
      importance: "max",
      ongoing: true,
      fullScreenIntent: true,
      showWhen: true,
      autoCancel: false,
      largeBody: "Binary Options Signal Alert - Wake Up!",
      summaryText: "Tap to view signal details"
    }
  },
  android: {
    permissions: [
      "android.permission.WAKE_LOCK",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.USE_FULL_SCREEN_INTENT",
      "android.permission.VIBRATE",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.FOREGROUND_SERVICE"
    ]
  }
};

export default config;
