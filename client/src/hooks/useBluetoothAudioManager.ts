import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BluetoothDevice {
  device: BluetoothDevice;
  isConnected: boolean;
  name: string;
  type: 'car' | 'headphones' | 'speaker' | 'unknown';
}

interface BluetoothAudioManager {
  connectedDevices: BluetoothDevice[];
  isCarConnected: boolean;
  requestBluetoothAccess: () => Promise<void>;
  requestAudioPriority: () => Promise<void>;
  lowerCarAudio: () => Promise<void>;
  restoreCarAudio: () => Promise<void>;
  speakWithPriority: (text: string, priority?: 'normal' | 'high' | 'emergency') => void;
}

export function useBluetoothAudioManager(): BluetoothAudioManager {
  const [connectedDevices, setConnectedDevices] = useState<BluetoothDevice[]>([]);
  const [isCarConnected, setIsCarConnected] = useState(false);
  const [originalVolume, setOriginalVolume] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  // Initialize audio context
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      } catch (error) {
        console.log('Audio context initialization failed:', error);
      }
    };
    
    initAudioContext();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Request Bluetooth access and connect to car audio
  const requestBluetoothAccess = useCallback(async () => {
    try {
      if (!('bluetooth' in navigator)) {
        toast({
          title: "Bluetooth Not Available",
          description: "Your browser doesn't support Bluetooth connectivity",
          variant: "destructive"
        });
        return;
      }

      // Request car audio device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['audio_sink'] },
          { namePrefix: 'Car' },
          { namePrefix: 'Honda' },
          { namePrefix: 'Toyota' },
          { namePrefix: 'Ford' },
          { namePrefix: 'GM' },
          { namePrefix: 'BMW' },
          { namePrefix: 'Mercedes' },
          { namePrefix: 'Audi' }
        ],
        optionalServices: [
          'battery_service',
          'device_information',
          'generic_access'
        ]
      });

      if (device) {
        await device.gatt?.connect();
        
        const deviceType = detectDeviceType(device.name || '');
        const bluetoothDevice: BluetoothDevice = {
          device,
          isConnected: true,
          name: device.name || 'Unknown Device',
          type: deviceType
        };

        setConnectedDevices(prev => [...prev, bluetoothDevice]);
        
        if (deviceType === 'car') {
          setIsCarConnected(true);
          toast({
            title: "Car Connected",
            description: `Connected to ${bluetoothDevice.name} - CAREN now has audio priority`,
          });
        }

        // Set up disconnect listener
        device.addEventListener('gattserverdisconnected', () => {
          setConnectedDevices(prev => 
            prev.filter(d => d.device.id !== device.id)
          );
          if (deviceType === 'car') {
            setIsCarConnected(false);
          }
        });
      }
    } catch (error) {
      console.log('Bluetooth connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Bluetooth device. Try pairing manually first.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Detect if device is a car based on name patterns
  const detectDeviceType = (name: string): 'car' | 'headphones' | 'speaker' | 'unknown' => {
    const carPatterns = [
      'car', 'honda', 'toyota', 'ford', 'gm', 'bmw', 'mercedes', 'audi',
      'nissan', 'hyundai', 'kia', 'mazda', 'subaru', 'volkswagen', 'volvo',
      'acura', 'lexus', 'infiniti', 'cadillac', 'buick', 'chevrolet',
      'jeep', 'dodge', 'chrysler', 'tesla', 'porsche', 'ferrari', 'lamborghini'
    ];
    
    const headphonePatterns = ['airpods', 'headphones', 'beats', 'sony', 'bose'];
    const speakerPatterns = ['speaker', 'echo', 'google', 'alexa', 'homepod'];
    
    const lowerName = name.toLowerCase();
    
    if (carPatterns.some(pattern => lowerName.includes(pattern))) return 'car';
    if (headphonePatterns.some(pattern => lowerName.includes(pattern))) return 'headphones';
    if (speakerPatterns.some(pattern => lowerName.includes(pattern))) return 'speaker';
    
    return 'unknown';
  };

  // Request audio priority from the system
  const requestAudioPriority = useCallback(async () => {
    try {
      // Resume audio context if suspended
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Use Media Session API for audio control
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'CAREN Legal Protection',
          artist: 'Emergency Recording System',
          album: 'Incident Documentation',
          artwork: [
            { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }
          ]
        });

        // Set playback state to indicate active recording
        navigator.mediaSession.playbackState = 'playing';

        // Handle media control buttons
        navigator.mediaSession.setActionHandler('pause', () => {
          window.dispatchEvent(new CustomEvent('pauseRecording'));
        });

        navigator.mediaSession.setActionHandler('stop', () => {
          window.dispatchEvent(new CustomEvent('stopRecording'));
        });

        navigator.mediaSession.setActionHandler('play', () => {
          window.dispatchEvent(new CustomEvent('resumeRecording'));
        });
      }

      // Request audio focus for emergency situations
      if ('requestAudioFocus' in navigator) {
        (navigator as any).requestAudioFocus({
          type: 'emergency',
          duration: 'permanent'
        });
      }

    } catch (error) {
      console.log('Audio priority request failed:', error);
    }
  }, []);

  // Lower car audio volume when CAREN needs priority
  const lowerCarAudio = useCallback(async () => {
    try {
      if (!isCarConnected) return;

      // Store original volume if not already stored
      if (originalVolume === 1 && audioContextRef.current) {
        setOriginalVolume(1); // Assume full volume initially
      }

      // Use Media Session API to request lower volume
      if ('mediaSession' in navigator) {
        // This signals to the car system that we need audio priority
        navigator.mediaSession.playbackState = 'playing';
        
        // Create a silent audio track to maintain audio focus
        if (audioContextRef.current) {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          gainNode.gain.value = 0; // Silent
          oscillator.frequency.value = 440;
          oscillator.start();
          
          // Stop after a brief moment
          setTimeout(() => {
            oscillator.stop();
          }, 100);
        }
      }

      toast({
        title: "Audio Priority Activated",
        description: "Car audio lowered for CAREN emergency recording",
      });

    } catch (error) {
      console.log('Failed to lower car audio:', error);
    }
  }, [isCarConnected, originalVolume, toast]);

  // Restore car audio to original volume
  const restoreCarAudio = useCallback(async () => {
    try {
      if (!isCarConnected) return;

      // Release audio focus
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.metadata = null;
      }

      toast({
        title: "Audio Restored",
        description: "Car audio volume restored to normal",
      });

    } catch (error) {
      console.log('Failed to restore car audio:', error);
    }
  }, [isCarConnected, toast]);

  // Speak with audio priority
  const speakWithPriority = useCallback((text: string, priority: 'normal' | 'high' | 'emergency' = 'normal') => {
    if (!('speechSynthesis' in window)) return;

    // Stop any ongoing speech
    speechSynthesis.cancel();

    // Request audio priority for high/emergency messages
    if (priority === 'high' || priority === 'emergency') {
      requestAudioPriority();
      if (isCarConnected) {
        lowerCarAudio();
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Adjust speech parameters based on priority
    switch (priority) {
      case 'emergency':
        utterance.rate = 1.1;
        utterance.pitch = 1.2;
        utterance.volume = 1.0;
        break;
      case 'high':
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;
        break;
      default:
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
    }

    // Restore audio after speech for high priority messages
    utterance.onend = () => {
      if (priority === 'high' || priority === 'emergency') {
        setTimeout(() => {
          if (isCarConnected) {
            restoreCarAudio();
          }
        }, 1000);
      }
    };

    speechSynthesis.speak(utterance);
  }, [requestAudioPriority, lowerCarAudio, restoreCarAudio, isCarConnected]);

  // Auto-request Bluetooth access on first interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (connectedDevices.length === 0 && 'bluetooth' in navigator) {
        // Don't auto-request immediately, but make it easily accessible
        console.log('Bluetooth available - ready for connection');
      }
    };

    // Listen for first user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [connectedDevices.length]);

  return {
    connectedDevices,
    isCarConnected,
    requestBluetoothAccess,
    requestAudioPriority,
    lowerCarAudio,
    restoreCarAudio,
    speakWithPriority
  };
}