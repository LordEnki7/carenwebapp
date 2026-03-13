import { useState, useEffect, useCallback, useRef } from 'react';

export interface BluetoothDevice {
  id: string;
  name: string;
  type: 'earpiece' | 'headphones' | 'speaker' | 'car_audio' | 'unknown';
  connected: boolean;
  batteryLevel?: number;
  signalStrength: number;
  capabilities: {
    audio: boolean;
    microphone: boolean;
    voiceCommands: boolean;
    emergencyButton: boolean;
  };
  lastConnected?: string;
  trustLevel: 'trusted' | 'new' | 'suspicious';
  deviceAddress: string;
}

export interface BluetoothHandsFreeSettings {
  enabled: boolean;
  autoConnect: boolean;
  emergencyOverride: boolean;
  audioQuality: 'high' | 'standard' | 'battery_saver';
  microphoneSensitivity: number;
  voiceActivationThreshold: number;
  emergencyActivationPhrase: string;
}

export interface HandsFreeStatus {
  isConnected: boolean;
  deviceName?: string;
  audioActive: boolean;
  microphoneActive: boolean;
  voiceCommandsEnabled: boolean;
  emergencyModeActive: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export function useBluetoothHandsFree() {
  // DISABLED: Bluetooth hands-free completely disabled for rebuild
  const hasLoggedDisabled = useRef(false);
  
  // Log only once per session instead of every render
  useEffect(() => {
    if (!hasLoggedDisabled.current) {
      console.log('🎤 BLUETOOTH HANDS-FREE COMPLETELY DISABLED');
      hasLoggedDisabled.current = true;
    }
  }, []);
  
  return {
    connectedDevice: null,
    handsFreeStatus: {
      isConnected: false,
      audioActive: false,
      microphoneActive: false,
      voiceCommandsEnabled: false,
      emergencyModeActive: false,
      connectionQuality: 'poor' as const
    },
    settings: {
      enabled: false,
      autoConnect: false,
      emergencyOverride: false,
      audioQuality: 'standard' as const,
      microphoneSensitivity: 0,
      voiceActivationThreshold: 0,
      emergencyActivationPhrase: ''
    },
    connectDevice: () => Promise.resolve(false),
    disconnectDevice: () => {},
    activateEmergencyMode: () => {},
    deactivateEmergencyMode: () => {},
    adjustMicrophoneSensitivity: () => {},
    testVoiceActivation: () => Promise.resolve(false),
    updateSettings: () => {}
  };

  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [handsFreeStatus, setHandsFreeStatus] = useState<HandsFreeStatus>({
    isConnected: false,
    audioActive: false,
    microphoneActive: false,
    voiceCommandsEnabled: false,
    emergencyModeActive: false,
    connectionQuality: 'poor'
  });
  const [settings, setSettings] = useState<BluetoothHandsFreeSettings>({
    enabled: true,
    autoConnect: true,
    emergencyOverride: true,
    audioQuality: 'high',
    microphoneSensitivity: 75,
    voiceActivationThreshold: 80,
    emergencyActivationPhrase: "Emergency CAREN activate"
  });
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);

  // Check Bluetooth availability on mount
  useEffect(() => {
    checkBluetoothAvailability();
    loadSettings();
  }, []);

  const checkBluetoothAvailability = useCallback(async () => {
    try {
      if ('bluetooth' in navigator) {
        setIsBluetoothAvailable(true);
        console.log('Bluetooth available - hands-free mode ready');
      } else {
        setIsBluetoothAvailable(false);
        console.warn('Bluetooth not available - hands-free mode disabled');
      }
    } catch (error) {
      console.error('Bluetooth availability check failed:', error);
      setIsBluetoothAvailable(false);
    }
  }, []);

  const loadSettings = useCallback(() => {
    const stored = localStorage.getItem('caren-bluetooth-handsfree-settings');
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to load Bluetooth settings:', error);
      }
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<BluetoothHandsFreeSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('caren-bluetooth-handsfree-settings', JSON.stringify(updatedSettings));
  }, [settings]);

  const connectDevice = useCallback(async (device: BluetoothDevice): Promise<boolean> => {
    if (!isBluetoothAvailable || !settings.enabled) {
      console.warn('Bluetooth not available or disabled');
      return false;
    }

    try {
      console.log(`Connecting to ${device.name} for hands-free operation...`);
      
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setConnectedDevice(device);
      setHandsFreeStatus({
        isConnected: true,
        deviceName: device.name,
        audioActive: device.capabilities.audio,
        microphoneActive: device.capabilities.microphone,
        voiceCommandsEnabled: device.capabilities.voiceCommands && settings.enabled,
        emergencyModeActive: false,
        connectionQuality: device.signalStrength > 80 ? 'excellent' : 
                          device.signalStrength > 60 ? 'good' : 
                          device.signalStrength > 40 ? 'fair' : 'poor'
      });

      // Test audio connection
      if (device.capabilities.audio) {
        await testAudioConnection();
      }

      console.log(`${device.name} connected successfully for hands-free operation`);
      return true;
    } catch (error) {
      console.error('Failed to connect Bluetooth device:', error);
      return false;
    }
  }, [isBluetoothAvailable, settings.enabled]);

  const disconnectDevice = useCallback(() => {
    if (connectedDevice) {
      console.log(`Disconnecting ${connectedDevice.name}...`);
      setConnectedDevice(null);
      setHandsFreeStatus({
        isConnected: false,
        audioActive: false,
        microphoneActive: false,
        voiceCommandsEnabled: false,
        emergencyModeActive: false,
        connectionQuality: 'poor'
      });
    }
  }, [connectedDevice]);

  const testAudioConnection = useCallback(async (): Promise<boolean> => {
    if (!handsFreeStatus.isConnected || !handsFreeStatus.audioActive) {
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(
        `Audio test successful. ${connectedDevice?.name || 'Device'} is ready for hands-free legal protection.`
      );
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = settings.microphoneSensitivity / 100;
      
      speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      console.error('Audio test failed:', error);
      return false;
    }
  }, [handsFreeStatus, connectedDevice, settings.microphoneSensitivity]);

  const startVoiceRecording = useCallback(async (): Promise<MediaStream | null> => {
    if (!handsFreeStatus.microphoneActive) {
      console.warn('Microphone not available for voice recording');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: settings.audioQuality === 'high' ? 48000 : 
                     settings.audioQuality === 'standard' ? 44100 : 22050
        }
      });

      console.log('Voice recording started via Bluetooth device');
      return stream;
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      return null;
    }
  }, [handsFreeStatus.microphoneActive, settings.audioQuality]);

  const activateEmergencyMode = useCallback(async (): Promise<boolean> => {
    if (!handsFreeStatus.isConnected) {
      console.warn('No Bluetooth device connected for emergency mode');
      return false;
    }

    try {
      setHandsFreeStatus(prev => ({ ...prev, emergencyModeActive: true }));
      
      // Emergency audio feedback
      const utterance = new SpeechSynthesisUtterance(
        "Emergency mode activated. Recording started. Stay calm and follow legal protocols."
      );
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      speechSynthesis.speak(utterance);
      
      // Auto-start recording if microphone available
      if (handsFreeStatus.microphoneActive) {
        await startVoiceRecording();
      }

      console.log('Emergency mode activated via Bluetooth device');
      return true;
    } catch (error) {
      console.error('Failed to activate emergency mode:', error);
      return false;
    }
  }, [handsFreeStatus, startVoiceRecording]);

  const deactivateEmergencyMode = useCallback(() => {
    setHandsFreeStatus(prev => ({ ...prev, emergencyModeActive: false }));
    
    const utterance = new SpeechSynthesisUtterance("Emergency mode deactivated.");
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
    
    console.log('Emergency mode deactivated');
  }, []);

  const speakMessage = useCallback((message: string, priority: 'low' | 'normal' | 'high' | 'emergency' = 'normal') => {
    if (!handsFreeStatus.audioActive) {
      console.warn('Audio not available for speech synthesis');
      return;
    }

    try {
      // Cancel any ongoing speech for high priority messages
      if (priority === 'high' || priority === 'emergency') {
        speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = priority === 'emergency' ? 1.0 : 0.9;
      utterance.pitch = priority === 'emergency' ? 1.2 : 1.0;
      utterance.volume = priority === 'emergency' ? 1.0 : settings.microphoneSensitivity / 100;
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    }
  }, [handsFreeStatus.audioActive, settings.microphoneSensitivity]);

  const listenForVoiceCommands = useCallback(async (callback: (command: string) => void) => {
    if (!handsFreeStatus.voiceCommandsEnabled) {
      console.warn('Voice commands not available');
      return null;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported');
        return null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log('Voice command received:', command);
        
        // Check for emergency activation phrase
        if (command.includes(settings.emergencyActivationPhrase.toLowerCase())) {
          activateEmergencyMode();
          return;
        }
        
        callback(command);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.start();
      console.log('Voice command listening started');
      
      return recognition;
    } catch (error) {
      console.error('Failed to start voice command listening:', error);
      return null;
    }
  }, [handsFreeStatus.voiceCommandsEnabled, settings.emergencyActivationPhrase, activateEmergencyMode]);

  const getConnectionQuality = useCallback((): number => {
    if (!connectedDevice) return 0;
    
    const signalStrength = connectedDevice.signalStrength;
    const batteryLevel = connectedDevice.batteryLevel || 100;
    
    // Calculate overall quality based on signal and battery
    return Math.min(signalStrength, batteryLevel);
  }, [connectedDevice]);

  return {
    // State
    connectedDevice,
    handsFreeStatus,
    settings,
    isBluetoothAvailable,
    
    // Device Management
    connectDevice,
    disconnectDevice,
    testAudioConnection,
    getConnectionQuality,
    
    // Settings
    updateSettings,
    
    // Audio/Voice
    startVoiceRecording,
    speakMessage,
    listenForVoiceCommands,
    
    // Emergency
    activateEmergencyMode,
    deactivateEmergencyMode
  };
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}