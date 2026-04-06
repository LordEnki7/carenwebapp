import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caren.safetyapp',
  appName: 'CAREN Alert',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: 'android/caren-release.jks',
      keystorePassword: 'carenstore123',
      keystoreAlias: 'caren-key',
      keystoreAliasPassword: 'carenstore123',
      releaseType: "AAB",
      signingType: "apksigner"
    }
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    },
    Camera: {
      permissions: ["camera", "photos"]
    },
    Geolocation: {
      permissions: ["location"]
    },
    Microphone: {
      permissions: ["microphone"]
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a0a0f',
    allowsLinkPreview: false,
    preferredContentMode: 'recommended',
    scheme: 'carenalert',
    limitsNavigationsToAppBoundDomains: false,
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'CAREN Alert uses your photo library to attach evidence photos to incident reports.',
      NSPhotoLibraryAddUsageDescription: 'CAREN Alert saves incident photos and evidence to your photo library.',
      NSCameraUsageDescription: 'CAREN Alert uses your camera to record video evidence during roadside incidents and police encounters.',
      NSMicrophoneUsageDescription: 'CAREN Alert uses your microphone to record audio evidence during roadside incidents and police encounters.',
      NSLocationWhenInUseUsageDescription: 'CAREN Alert uses your location to identify your state and display the correct legal rights for your area.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'CAREN Alert uses your location to provide real-time legal rights information and share your location with emergency contacts during an incident.',
      NSLocationAlwaysUsageDescription: 'CAREN Alert uses your location in the background to monitor for emergencies and notify your safety contacts.',
      NSFaceIDUsageDescription: 'CAREN Alert uses Face ID to securely authenticate you and protect your incident records.',
      NSBluetoothAlwaysUsageDescription: 'CAREN Alert uses Bluetooth to connect to vehicle devices and detect roadside emergencies.',
      NSBluetoothPeripheralUsageDescription: 'CAREN Alert uses Bluetooth to connect to vehicle devices and detect roadside emergencies.',
      NSContactsUsageDescription: 'CAREN Alert accesses your contacts to let you quickly add emergency contacts to your safety network.',
      NSMotionUsageDescription: 'CAREN Alert uses motion sensors to automatically detect vehicle accidents and trigger emergency alerts.',
      NSUserNotificationsUsageDescription: 'CAREN Alert sends notifications for emergency alerts, SOS signals, and updates from your safety contacts.'
    }
  }
};

export default config;
