import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '../../../../src/core/EventBus';

interface ConnectedDevice {
  id: string;
  name: string;
  type: 'dashcam' | 'bodycam' | 'smartphone' | 'unknown';
  status: 'connected' | 'connecting' | 'disconnected';
  capabilities: string[];
  lastSeen: Date;
  device?: BluetoothDevice;
}

interface BluetoothHook {
  devices: ConnectedDevice[];
  isScanning: boolean;
  isSupported: boolean;
  scanForDevices: () => Promise<void>;
  connectToDevice: (deviceId: string) => Promise<boolean>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  requestVideoStream: (deviceId: string) => Promise<string | null>;
  getDeviceCapabilities: (deviceId: string) => Promise<string[]>;
  error: string | null;
}

// Common service UUIDs for video devices
const VIDEO_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
const DASHCAM_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const STREAM_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';

// Web Bluetooth API availability check
const isWebBluetoothSupported = (): boolean => {
  return 'bluetooth' in navigator && 'requestDevice' in (navigator as any).bluetooth;
};

export function useBluetoothDevices(): BluetoothHook {
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Bluetooth
  useEffect(() => {
    const checkBluetoothSupport = () => {
      if (isWebBluetoothSupported()) {
        setIsSupported(true);
        console.log('[BLUETOOTH_MODULE] Web Bluetooth API supported');
      } else {
        setIsSupported(false);
        setError('Web Bluetooth not supported on this browser');
        console.log('[BLUETOOTH_MODULE] Web Bluetooth API not supported');
      }
    };

    checkBluetoothSupport();
  }, []);

  // Determine device type based on name and services
  const determineDeviceType = (device: BluetoothDevice): ConnectedDevice['type'] => {
    const name = device.name?.toLowerCase() || '';
    
    if (name.includes('dash') || name.includes('cam') || name.includes('recorder')) {
      return 'dashcam';
    }
    if (name.includes('body') || name.includes('wearable')) {
      return 'bodycam';
    }
    if (name.includes('phone') || name.includes('mobile')) {
      return 'smartphone';
    }
    
    return 'unknown';
  };

  // Determine device capabilities
  const determineCapabilities = (device: BluetoothDevice): string[] => {
    const capabilities: string[] = [];
    const name = device.name?.toLowerCase() || '';
    
    // Basic capabilities based on device type
    if (name.includes('cam') || name.includes('video')) {
      capabilities.push('video');
    }
    if (name.includes('mic') || name.includes('audio')) {
      capabilities.push('audio');
    }
    if (name.includes('gps') || name.includes('location')) {
      capabilities.push('location');
    }
    
    // Default capabilities
    if (capabilities.length === 0) {
      capabilities.push('basic');
    }
    
    return capabilities;
  };

  // Scan for nearby Bluetooth devices
  const scanForDevices = useCallback(async () => {
    if (!isSupported) {
      setError('Bluetooth not supported');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      console.log('[BLUETOOTH_MODULE] Starting device scan...');
      
      // Request device with various service filters
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: [VIDEO_SERVICE_UUID] },
          { services: [DASHCAM_SERVICE_UUID] },
          { namePrefix: 'Camera' },
          { namePrefix: 'Dash' },
          { namePrefix: 'Body' },
          { namePrefix: 'Recorder' }
        ],
        optionalServices: ['battery_service', 'device_information'],
        acceptAllDevices: false
      });

      if (device) {
        const deviceType = determineDeviceType(device);
        const capabilities = determineCapabilities(device);
        
        const newDevice: ConnectedDevice = {
          id: device.id,
          name: device.name || `Unknown ${deviceType}`,
          type: deviceType,
          status: 'disconnected',
          capabilities,
          lastSeen: new Date(),
          device
        };

        setDevices(prev => {
          // Remove existing device with same ID
          const filtered = prev.filter(d => d.id !== device.id);
          return [...filtered, newDevice];
        });

        console.log('[BLUETOOTH_MODULE] Found device:', newDevice);

        eventBus.emit({
          type: 'bluetooth.device.found',
          module: '@caren/bluetooth',
          payload: {
            deviceId: newDevice.id,
            deviceName: newDevice.name,
            deviceType: newDevice.type,
            capabilities: newDevice.capabilities,
            timestamp: Date.now()
          }
        });
      }
    } catch (error: any) {
      console.error('[BLUETOOTH_MODULE] Scan error:', error);
      
      if (error.name === 'NotFoundError') {
        setError('No compatible devices found. Make sure your device is discoverable.');
      } else if (error.name === 'SecurityError') {
        setError('Bluetooth access denied. Please allow Bluetooth permissions.');
      } else {
        setError(`Scan failed: ${error.message}`);
      }

      eventBus.emit({
        type: 'bluetooth.scan.error',
        module: '@caren/bluetooth',
        payload: {
          error: error.message,
          timestamp: Date.now()
        }
      });
    } finally {
      setIsScanning(false);
    }
  }, [isSupported]);

  // Connect to a specific device
  const connectToDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || !device.device) {
      setError('Device not found');
      return false;
    }

    try {
      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, status: 'connecting' } : d
      ));

      console.log('[BLUETOOTH_MODULE] Connecting to device:', device.name);
      
      const gatt = await device.device.gatt?.connect();
      if (gatt) {
        setDevices(prev => prev.map(d => 
          d.id === deviceId ? { ...d, status: 'connected' } : d
        ));
        
        console.log('[BLUETOOTH_MODULE] Successfully connected to:', device.name);
        return true;
      }
      
      throw new Error('Failed to establish GATT connection');
    } catch (error: any) {
      console.error('[BLUETOOTH_MODULE] Connection error:', error);
      setError(`Connection failed: ${error.message}`);
      
      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, status: 'disconnected' } : d
      ));
      
      return false;
    }
  }, [devices]);

  // Disconnect from a device
  const disconnectDevice = useCallback(async (deviceId: string): Promise<void> => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || !device.device) return;

    try {
      if (device.device.gatt?.connected) {
        device.device.gatt.disconnect();
      }

      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, status: 'disconnected' } : d
      ));

      console.log('[BLUETOOTH_MODULE] Disconnected from:', device.name);
    } catch (error: any) {
      console.error('[BLUETOOTH_MODULE] Disconnect error:', error);
      setError(`Disconnect failed: ${error.message}`);
    }
  }, [devices]);

  // Request video stream from device
  const requestVideoStream = useCallback(async (deviceId: string): Promise<string | null> => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || !device.device || device.status !== 'connected') {
      setError('Device not connected');
      return null;
    }

    if (!device.capabilities.includes('video')) {
      setError('Device does not support video streaming');
      return null;
    }

    try {
      console.log('[BLUETOOTH_MODULE] Requesting video stream from:', device.name);
      
      // This is a simplified implementation
      // Real implementation would depend on the specific device protocol
      const gatt = device.device.gatt;
      if (!gatt) throw new Error('No GATT connection');

      // For demonstration purposes, return a mock stream URL
      // In reality, this would involve negotiating with the device's streaming service
      const streamUrl = `bluetooth-stream://${deviceId}/video`;
      
      console.log('[BLUETOOTH_MODULE] Video stream requested:', streamUrl);
      return streamUrl;
    } catch (error: any) {
      console.error('[BLUETOOTH_MODULE] Video stream error:', error);
      setError(`Video stream failed: ${error.message}`);
      return null;
    }
  }, [devices]);

  // Get device capabilities
  const getDeviceCapabilities = useCallback(async (deviceId: string): Promise<string[]> => {
    const device = devices.find(d => d.id === deviceId);
    return device?.capabilities || [];
  }, [devices]);

  // Subscribe to external bluetooth events
  useEffect(() => {
    const handleBluetoothEvent = (event: any) => {
      console.log(`[BLUETOOTH_MODULE] Received event: ${event.type}`, event.payload);
      
      // Handle external device connection requests
      if (event.type === 'bluetooth.connect.request') {
        const { deviceId } = event.payload;
        connectToDevice(deviceId);
      }
      
      // Handle external disconnect requests
      if (event.type === 'bluetooth.disconnect.request') {
        const { deviceId } = event.payload;
        disconnectDevice(deviceId);
      }
    };

    eventBus.subscribe('bluetooth.connect.request', handleBluetoothEvent);
    eventBus.subscribe('bluetooth.disconnect.request', handleBluetoothEvent);
    
    return () => {
      eventBus.unsubscribe('bluetooth.connect.request', handleBluetoothEvent);
      eventBus.unsubscribe('bluetooth.disconnect.request', handleBluetoothEvent);
    };
  }, [connectToDevice, disconnectDevice]);

  return {
    devices,
    isScanning,
    isSupported,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    requestVideoStream,
    getDeviceCapabilities,
    error
  };
}