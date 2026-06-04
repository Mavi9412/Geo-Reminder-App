import 'dotenv/config';

export default {
  expo: {
    name: 'Geo Reminder',
    slug: 'GeoReminderApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#1a1a2e',
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Geo Reminder needs your location to trigger reminders when you arrive or leave a place.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Geo Reminder needs background location access to trigger reminders even when the app is minimized.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#1a1a2e',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'RECEIVE_BOOT_COMPLETED',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_LOCATION',
        'android.permission.RECORD_AUDIO',
      ],
      package: 'com.ameermuavia2.GeoReminderApp',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Geo Reminder needs location access to trigger reminders when you arrive or leave a place.',
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#4c6ef5',
        },
      ],
    ],
    extra: {
      groqApiKey: process.env.GROQ_API_KEY,
      eas: {
        projectId: '46a13171-aea7-4924-b189-5dd2512ff823',
      },
    },
  },
};
