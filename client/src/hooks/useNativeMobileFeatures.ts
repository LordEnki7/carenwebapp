import { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Device, DeviceInfo } from '@capacitor/device';
import { Network, NetworkStatus } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface NativeMobileState {
  // Device information
  deviceInfo: DeviceInfo | null;
  networkStatus: NetworkStatus | null;
  isNativeApp: boolean;
  
  // Permissions
  cameraPermission: string | null;
  locationPermission: string | null;
  notificationPermission: string | null;
  
  // Location data
  currentLocation: Position | null;
  locationError: string | null;
  
  // Device capabilities
  hasCameraAccess: boolean;
  hasLocationAccess: boolean;
  hasHapticsAccess: boolean;
}

export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
  direction?: CameraDirection;
  saveToGallery?: boolean;
}

export function useNativeMobileFeatures() {
  const [state, setState] = useState<NativeMobileState>({
    deviceInfo: null,
    networkStatus: null,
    isNativeApp: false,
    cameraPermission: null,
    locationPermission: null,
    notificationPermission: null,
    currentLocation: null,
    locationError: null,
    hasCameraAccess: false,
    hasLocationAccess: false,
    hasHapticsAccess: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Initialize native features
  useEffect(() => {
    initializeNativeFeatures();
  }, []);

  const initializeNativeFeatures = async () => {
    try {
      setIsLoading(true);
      
      // Check if running in native app
      const deviceInfo = await Device.getInfo();
      const isNative = deviceInfo.platform !== 'web';
      
      // Get network status
      const networkStatus = await Network.getStatus();
      
      setState(prev => ({
        ...prev,
        deviceInfo,
        networkStatus,
        isNativeApp: isNative,
      }));

      // Request permissions if native
      if (isNative) {
        await requestAllPermissions();
      }
      
    } catch (error) {
      console.error('Failed to initialize native features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAllPermissions = async () => {
    // Request camera permissions
    try {
      const cameraPermissions = await Camera.requestPermissions();
      setState(prev => ({
        ...prev,
        cameraPermission: String(cameraPermissions.camera),
        hasCameraAccess: cameraPermissions.camera === 'granted',
      }));
    } catch (error) {
      console.error('Camera permission error:', error);
    }

    // Request location permissions
    try {
      const locationPermissions = await Geolocation.requestPermissions();
      setState(prev => ({
        ...prev,
        locationPermission: String(locationPermissions.location),
        hasLocationAccess: locationPermissions.location === 'granted',
      }));
    } catch (error) {
      console.error('Location permission error:', error);
    }

    // Request notification permissions
    try {
      const notificationPermissions = await LocalNotifications.requestPermissions();
      setState(prev => ({
        ...prev,
        notificationPermission: String(notificationPermissions.display),
      }));
    } catch (error) {
      console.error('Notification permission error:', error);
    }

    // Check haptics capability
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      setState(prev => ({ ...prev, hasHapticsAccess: true }));
    } catch (error) {
      console.error('Haptics not available:', error);
    }
  };

  // Camera functions
  const takePicture = async (options: CameraOptions = {}) => {
    try {
      if (!state.hasCameraAccess) {
        throw new Error('Camera access not granted');
      }

      const image = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: options.allowEditing || false,
        resultType: options.resultType || CameraResultType.Uri,
        source: options.source || CameraSource.Camera,
        direction: options.direction || CameraDirection.Rear,
        saveToGallery: options.saveToGallery || true,
      });

      return image;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  };

  const takeVideo = async () => {
    try {
      if (!state.hasCameraAccess) {
        throw new Error('Camera access not granted');
      }

      // For video recording, we'll use the device's native camera app
      const image = await Camera.getPhoto({
        quality: 90,
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        saveToGallery: true,
      });

      return image;
    } catch (error) {
      console.error('Video recording error:', error);
      throw error;
    }
  };

  // Location functions
  const getCurrentLocation = async (options?: { enableHighAccuracy?: boolean; timeout?: number }) => {
    try {
      if (!state.hasLocationAccess) {
        throw new Error('Location access not granted');
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy || true,
        timeout: options?.timeout || 10000,
      });

      setState(prev => ({
        ...prev,
        currentLocation: position,
        locationError: null,
      }));

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Location error';
      setState(prev => ({
        ...prev,
        locationError: errorMessage,
      }));
      throw error;
    }
  };

  const watchLocation = (callback: (position: Position | null) => void) => {
    if (!state.hasLocationAccess) {
      throw new Error('Location access not granted');
    }

    return Geolocation.watchPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    }, callback);
  };

  // Haptic feedback
  const triggerHapticFeedback = async (style: ImpactStyle = ImpactStyle.Medium) => {
    try {
      if (state.hasHapticsAccess) {
        await Haptics.impact({ style });
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  // Emergency haptic pattern
  const triggerEmergencyHaptic = async () => {
    try {
      if (state.hasHapticsAccess) {
        // Emergency pattern: Strong - pause - Strong - pause - Strong
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await new Promise(resolve => setTimeout(resolve, 200));
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await new Promise(resolve => setTimeout(resolve, 200));
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
    } catch (error) {
      console.error('Emergency haptic error:', error);
    }
  };

  // Local notifications
  const scheduleEmergencyNotification = async (title: string, body: string, delay: number = 0) => {
    try {
      if (state.notificationPermission === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now(),
              schedule: delay > 0 ? { at: new Date(Date.now() + delay) } : undefined,
              extra: {
                type: 'emergency',
                timestamp: new Date().toISOString(),
              },
            },
          ],
        });
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  // Network monitoring
  const monitorNetworkStatus = (callback: (status: NetworkStatus) => void) => {
    return Network.addListener('networkStatusChange', callback);
  };

  // Emergency recording with native features
  const startEmergencyRecording = async () => {
    try {
      // Trigger emergency haptic
      await triggerEmergencyHaptic();
      
      // Get current location
      const location = await getCurrentLocation({ enableHighAccuracy: true });
      
      // Schedule emergency notification
      await scheduleEmergencyNotification(
        'Emergency Recording Active',
        'CAREN is recording evidence and tracking your location',
        5000
      );

      return {
        location,
        timestamp: new Date().toISOString(),
        emergency: true,
      };
    } catch (error) {
      console.error('Emergency recording error:', error);
      throw error;
    }
  };

  return {
    // State
    ...state,
    isLoading,
    
    // Camera functions
    takePicture,
    takeVideo,
    
    // Location functions
    getCurrentLocation,
    watchLocation,
    
    // Haptic functions
    triggerHapticFeedback,
    triggerEmergencyHaptic,
    
    // Notification functions
    scheduleEmergencyNotification,
    
    // Network functions
    monitorNetworkStatus,
    
    // Emergency functions
    startEmergencyRecording,
    
    // Utility functions
    requestAllPermissions,
    initializeNativeFeatures,
  };
}