import { useState, useEffect, useCallback } from 'react';

interface MobilePerformanceState {
  isOnline: boolean;
  isLowPowerMode: boolean;
  batteryLevel: number;
  networkType: string;
  memoryUsage: number;
  cpuUsage: number;
  backgroundRecordingActive: boolean;
  emergencyModeActive: boolean;
  offlineCapabilities: {
    voiceCommands: boolean;
    emergencyRecording: boolean;
    legalDatabase: boolean;
    emergencyContacts: boolean;
  };
}

interface PerformanceOptimizations {
  enableLowPowerMode: () => void;
  disableLowPowerMode: () => void;
  optimizeForBattery: () => void;
  enableBackgroundRecording: () => Promise<boolean>;
  disableBackgroundRecording: () => void;
  preloadEmergencyAssets: () => Promise<void>;
  clearCache: () => void;
  getOfflineStatus: () => boolean;
  enableEmergencyMode: () => void;
  disableEmergencyMode: () => void;
}

export function useMobilePerformance(): MobilePerformanceState & PerformanceOptimizations {
  const [performanceState, setPerformanceState] = useState<MobilePerformanceState>({
    isOnline: navigator.onLine,
    isLowPowerMode: false,
    batteryLevel: 100,
    networkType: 'unknown',
    memoryUsage: 0,
    cpuUsage: 0,
    backgroundRecordingActive: false,
    emergencyModeActive: false,
    offlineCapabilities: {
      voiceCommands: true,
      emergencyRecording: true,
      legalDatabase: false,
      emergencyContacts: true,
    }
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setPerformanceState(prev => ({ ...prev, isOnline: true }));
      // Sync offline data when coming back online
      syncOfflineData();
    };

    const handleOffline = () => {
      setPerformanceState(prev => ({ ...prev, isOnline: false }));
      // Enable offline mode optimizations
      enableOfflineOptimizations();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor battery status
  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        // @ts-ignore - Battery API is experimental
        const battery = await navigator.getBattery?.();
        if (battery) {
          const updateBatteryInfo = () => {
            setPerformanceState(prev => ({
              ...prev,
              batteryLevel: Math.round(battery.level * 100),
              isLowPowerMode: battery.level < 0.2 // Auto low power mode at 20%
            }));
          };

          updateBatteryInfo();
          battery.addEventListener('levelchange', updateBatteryInfo);
          battery.addEventListener('chargingchange', updateBatteryInfo);
        }
      } catch (error) {
        console.log('Battery API not available');
      }
    };

    getBatteryInfo();
  }, []);

  // Monitor network type
  useEffect(() => {
    const updateNetworkInfo = () => {
      // @ts-ignore - Connection API is experimental
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setPerformanceState(prev => ({
          ...prev,
          networkType: connection.effectiveType || 'unknown'
        }));
      }
    };

    updateNetworkInfo();
    // @ts-ignore
    navigator.connection?.addEventListener('change', updateNetworkInfo);

    return () => {
      // @ts-ignore
      navigator.connection?.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  // Monitor memory usage
  useEffect(() => {
    const monitorMemory = () => {
      // @ts-ignore - Memory API is experimental
      if (performance.memory) {
        const memoryUsage = Math.round(
          // @ts-ignore
          (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100
        );
        setPerformanceState(prev => ({ ...prev, memoryUsage }));
      }
    };

    const interval = setInterval(monitorMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  const enableLowPowerMode = useCallback(() => {
    setPerformanceState(prev => ({ ...prev, isLowPowerMode: true }));
    
    // Reduce animation frequency
    document.documentElement.style.setProperty('--animation-duration', '2s');
    
    // Disable non-essential background tasks
    localStorage.setItem('caren-low-power-mode', 'true');
    
    console.log('Low power mode enabled');
  }, []);

  const disableLowPowerMode = useCallback(() => {
    setPerformanceState(prev => ({ ...prev, isLowPowerMode: false }));
    
    // Restore normal animations
    document.documentElement.style.setProperty('--animation-duration', '1s');
    
    localStorage.removeItem('caren-low-power-mode');
    
    console.log('Low power mode disabled');
  }, []);

  const optimizeForBattery = useCallback(() => {
    // Reduce screen brightness request
    try {
      // @ts-ignore - Screen brightness API is experimental
      if (screen.brightness) {
        screen.brightness = 0.7;
      }
    } catch (error) {
      console.log('Screen brightness control not available');
    }

    // Reduce CPU intensive operations
    enableLowPowerMode();
    
    // Optimize recording quality for battery
    localStorage.setItem('caren-battery-optimized', 'true');
  }, [enableLowPowerMode]);

  const enableBackgroundRecording = useCallback(async (): Promise<boolean> => {
    try {
      // Request background sync permission
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        // Register background sync for recording
        await registration.sync.register('background-recording');
        
        setPerformanceState(prev => ({ ...prev, backgroundRecordingActive: true }));
        localStorage.setItem('caren-background-recording', 'true');
        
        console.log('Background recording enabled');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable background recording:', error);
      return false;
    }
  }, []);

  const disableBackgroundRecording = useCallback(() => {
    setPerformanceState(prev => ({ ...prev, backgroundRecordingActive: false }));
    localStorage.removeItem('caren-background-recording');
    console.log('Background recording disabled');
  }, []);

  const preloadEmergencyAssets = useCallback(async () => {
    try {
      // Preload critical emergency resources
      const emergencyAssets = [
        '/api/legal-rights/emergency',
        '/api/emergency-contacts',
        '/sounds/emergency-alert.mp3'
      ];

      // Cache emergency legal database
      const legalRightsCache = await caches.open('caren-legal-rights-v1');
      const emergencyContactsCache = await caches.open('caren-emergency-contacts-v1');

      // Preload and cache emergency data
      for (const asset of emergencyAssets) {
        try {
          const response = await fetch(asset);
          if (response.ok) {
            if (asset.includes('legal-rights')) {
              await legalRightsCache.put(asset, response.clone());
            } else if (asset.includes('emergency-contacts')) {
              await emergencyContactsCache.put(asset, response.clone());
            }
          }
        } catch (error) {
          console.log(`Failed to preload ${asset}:`, error);
        }
      }

      // Update offline capabilities
      setPerformanceState(prev => ({
        ...prev,
        offlineCapabilities: {
          ...prev.offlineCapabilities,
          legalDatabase: true
        }
      }));

      console.log('Emergency assets preloaded');
    } catch (error) {
      console.error('Failed to preload emergency assets:', error);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      // Clear localStorage except essential settings
      const essentialKeys = ['caren-user-settings', 'caren-emergency-contacts'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!essentialKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  const getOfflineStatus = useCallback(() => {
    return !performanceState.isOnline;
  }, [performanceState.isOnline]);

  const enableEmergencyMode = useCallback(() => {
    setPerformanceState(prev => ({ ...prev, emergencyModeActive: true }));
    
    // Maximize performance for emergency
    disableLowPowerMode();
    
    // Preload emergency assets
    preloadEmergencyAssets();
    
    // Enable background recording if not already active
    if (!performanceState.backgroundRecordingActive) {
      enableBackgroundRecording();
    }

    localStorage.setItem('caren-emergency-mode', 'true');
    console.log('Emergency mode activated');
  }, [disableLowPowerMode, preloadEmergencyAssets, performanceState.backgroundRecordingActive, enableBackgroundRecording]);

  const disableEmergencyMode = useCallback(() => {
    setPerformanceState(prev => ({ ...prev, emergencyModeActive: false }));
    localStorage.removeItem('caren-emergency-mode');
    console.log('Emergency mode deactivated');
  }, []);

  // Helper functions
  const syncOfflineData = async () => {
    try {
      // Sync any offline recordings or incidents
      const offlineData = localStorage.getItem('caren-offline-data');
      if (offlineData) {
        const data = JSON.parse(offlineData);
        // Send to server
        await fetch('/api/sync-offline-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        localStorage.removeItem('caren-offline-data');
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  };

  const enableOfflineOptimizations = () => {
    // Enable aggressive caching
    localStorage.setItem('caren-offline-mode', 'true');
    
    // Reduce quality for battery saving
    localStorage.setItem('caren-offline-quality', 'medium');
  };

  return {
    ...performanceState,
    enableLowPowerMode,
    disableLowPowerMode,
    optimizeForBattery,
    enableBackgroundRecording,
    disableBackgroundRecording,
    preloadEmergencyAssets,
    clearCache,
    getOfflineStatus,
    enableEmergencyMode,
    disableEmergencyMode
  };
}