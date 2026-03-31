import { useState, useEffect, useCallback } from 'react';

export interface VehicleReadabilitySettings {
  mode: 'auto' | 'high-contrast' | 'night' | 'normal';
  brightness: number;
  contrast: number;
  textSize: number;
  nightModeIntensity: number;
  autoDetection: boolean;
  emergencyOverride: boolean;
}

export interface AmbientLightData {
  lightLevel: number;
  isOutdoor: boolean;
  timeOfDay: 'morning' | 'midday' | 'evening' | 'night';
  sunlightIntensity: number;
}

const DEFAULT_SETTINGS: VehicleReadabilitySettings = {
  mode: 'auto',
  brightness: 100,
  contrast: 100,
  textSize: 100,
  nightModeIntensity: 80,
  autoDetection: true,
  emergencyOverride: false
};

export function useVehicleReadability() {
  const [settings, setSettings] = useState<VehicleReadabilitySettings>(() => {
    const saved = localStorage.getItem('vehicle-readability-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [ambientLight, setAmbientLight] = useState<AmbientLightData>({
    lightLevel: 50,
    isOutdoor: false,
    timeOfDay: 'midday',
    sunlightIntensity: 0
  });

  const [isActive, setIsActive] = useState(false);
  const [sensorSupported, setSensorSupported] = useState(false);

  // Initialize ambient light sensor
  useEffect(() => {
    const initializeSensor = async () => {
      try {
        // Check for ambient light sensor support
        if ('AmbientLightSensor' in window) {
          setSensorSupported(true);
          const sensor = new (window as any).AmbientLightSensor();
          
          sensor.addEventListener('reading', () => {
            const lightLevel = sensor.illuminance || 50;
            updateAmbientLight(lightLevel);
          });

          sensor.start();
          setIsActive(true);
        } else {
          // Fallback to time-based detection
          setSensorSupported(false);
          startTimeBasedDetection();
        }
      } catch (error) {
        console.log('Sensor initialization failed, using fallback detection');
        setSensorSupported(false);
        startTimeBasedDetection();
      }
    };

    if (settings.autoDetection) {
      initializeSensor();
    }

    return () => {
      setIsActive(false);
    };
  }, [settings.autoDetection]);

  const updateAmbientLight = useCallback((lightLevel: number) => {
    const hour = new Date().getHours();
    
    const timeOfDay: AmbientLightData['timeOfDay'] = 
      hour < 6 || hour > 22 ? 'night' :
      hour < 10 ? 'morning' :
      hour < 18 ? 'midday' : 'evening';

    const isOutdoor = lightLevel > 1000; // Typical outdoor threshold
    const sunlightIntensity = Math.min(100, Math.max(0, (lightLevel - 500) / 50));

    setAmbientLight({
      lightLevel,
      isOutdoor,
      timeOfDay,
      sunlightIntensity
    });

    // Auto-adjust mode based on conditions
    if (settings.mode === 'auto') {
      applyAutoMode(lightLevel, timeOfDay, isOutdoor);
    }
  }, [settings.mode]);

  const startTimeBasedDetection = useCallback(() => {
    const updateByTime = () => {
      const hour = new Date().getHours();
      const lightLevel = 
        hour < 6 || hour > 22 ? 10 :  // Night
        hour < 8 || hour > 20 ? 200 : // Dawn/Dusk
        hour < 10 || hour > 18 ? 800 : // Morning/Evening
        2000; // Midday

      updateAmbientLight(lightLevel);
    };

    updateByTime();
    const interval = setInterval(updateByTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [updateAmbientLight]);

  const applyAutoMode = useCallback((lightLevel: number, timeOfDay: string, isOutdoor: boolean) => {
    let newMode: VehicleReadabilitySettings['mode'] = 'normal';

    if (timeOfDay === 'night' || lightLevel < 50) {
      newMode = 'night';
    } else if (isOutdoor && lightLevel > 10000) {
      newMode = 'high-contrast';
    } else {
      newMode = 'normal';
    }

    if (newMode !== settings.mode) {
      updateSettings({ mode: newMode });
    }
  }, [settings.mode]);

  const updateSettings = useCallback((updates: Partial<VehicleReadabilitySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('vehicle-readability-settings', JSON.stringify(newSettings));
    applyReadabilityMode(newSettings);
  }, [settings]);

  const applyReadabilityMode = useCallback((currentSettings: VehicleReadabilitySettings) => {
    const root = document.documentElement;
    
    // Reset previous classes
    root.classList.remove('vehicle-high-contrast', 'vehicle-night-mode', 'vehicle-emergency');

    switch (currentSettings.mode) {
      case 'high-contrast':
        root.classList.add('vehicle-high-contrast');
        root.style.setProperty('--vehicle-brightness', `${currentSettings.brightness}%`);
        root.style.setProperty('--vehicle-contrast', `${currentSettings.contrast}%`);
        root.style.setProperty('--vehicle-text-size', `${currentSettings.textSize}%`);
        break;

      case 'night':
        root.classList.add('vehicle-night-mode');
        root.style.setProperty('--vehicle-night-intensity', `${currentSettings.nightModeIntensity}%`);
        root.style.setProperty('--vehicle-text-size', `${currentSettings.textSize}%`);
        break;

      case 'normal':
        // Use default styling
        root.style.removeProperty('--vehicle-brightness');
        root.style.removeProperty('--vehicle-contrast');
        root.style.removeProperty('--vehicle-night-intensity');
        root.style.setProperty('--vehicle-text-size', `${currentSettings.textSize}%`);
        break;
    }

    if (currentSettings.emergencyOverride) {
      root.classList.add('vehicle-emergency');
    }
  }, []);

  const activateEmergencyMode = useCallback(() => {
    updateSettings({
      emergencyOverride: true,
      mode: 'high-contrast',
      brightness: 150,
      contrast: 200,
      textSize: 120
    });
  }, [updateSettings]);

  const deactivateEmergencyMode = useCallback(() => {
    updateSettings({
      emergencyOverride: false,
      brightness: 100,
      contrast: 100,
      textSize: 100
    });
  }, [updateSettings]);

  const getReadabilityScore = useCallback(() => {
    let score = 0;
    
    // Base score from current mode
    switch (settings.mode) {
      case 'high-contrast': score += 30; break;
      case 'night': score += 25; break;
      case 'normal': score += 20; break;
      case 'auto': score += 35; break;
    }

    // Bonus for optimal settings
    if (settings.textSize >= 110) score += 15;
    if (settings.brightness >= 120 && ambientLight.isOutdoor) score += 10;
    if (settings.nightModeIntensity >= 70 && ambientLight.timeOfDay === 'night') score += 10;
    if (settings.autoDetection) score += 10;

    return Math.min(100, score);
  }, [settings, ambientLight]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('vehicle-readability-settings');
    applyReadabilityMode(DEFAULT_SETTINGS);
  }, [applyReadabilityMode]);

  return {
    settings,
    ambientLight,
    isActive,
    sensorSupported,
    updateSettings,
    activateEmergencyMode,
    deactivateEmergencyMode,
    getReadabilityScore,
    resetToDefaults
  };
}