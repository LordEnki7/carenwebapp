import { useState, useEffect, useCallback } from 'react';

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
        console.log('Web Bluetooth API supported');
      } else {
        setIsSupported(false);
        setError('Web Bluetooth not supported on this browser');
        console.log('Web Bluetooth API not supported');
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

  // Scan for nearby Bluetooth devices
  const scanForDevices = useCallback(async () => {
    if (!isSupported) {
      setError('Bluetooth not supported');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Request device using Web Bluetooth API
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [VIDEO_SERVICE_UUID, DASHCAM_SERVICE_UUID, 'battery_service']
      });

      const deviceType = determineDeviceType(device);
      
      const newDevice: ConnectedDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        type: deviceType,
        status: 'disconnected',
        capabilities: [],
        lastSeen: new Date(),
        device: device
      };

      setDevices(prev => {
        const existing = prev.find(d => d.id === newDevice.id);
        if (existing) {
          return prev.map(d => 
            d.id === newDevice.id 
              ? { ...d, lastSeen: new Date() }
              : d
          );
        }
        return [...prev, newDevice];
      });

      setIsScanning(false);

    } catch (error: any) {
      console.error('Bluetooth scan failed:', error);
      if (error.name === 'NotFoundError') {
        setError('No devices found. Make sure your device is in pairing mode.');
      } else if (error.name === 'NotAllowedError') {
        setError('Bluetooth access denied. Please allow Bluetooth permissions.');
      } else {
        setError('Failed to scan for devices. Please try again.');
      }
      setIsScanning(false);
    }
  }, [isSupported]);

  // Connect to a specific device
  const connectToDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      const deviceData = devices.find(d => d.id === deviceId);
      if (!deviceData?.device) {
        throw new Error('Device not found');
      }

      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, status: 'connecting' } : d
      ));

      // Connect to GATT server
      const server = await deviceData.device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }
      
      // Get device capabilities
      const capabilities = await getDeviceCapabilities(deviceId);
      
      setDevices(prev => prev.map(d => 
        d.id === deviceId 
          ? { ...d, status: 'connected', capabilities }
          : d
      ));

      console.log(`Connected to device: ${deviceId}`);
      return true;

    } catch (error) {
      console.error('Connection failed:', error);
      setError(`Failed to connect to device`);
      
      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, status: 'disconnected' } : d
      ));
      
      return false;
    }
  }, [devices]);

  // Disconnect from device
  const disconnectDevice = useCallback(async (deviceId: string) => {
    try {
      const deviceData = devices.find(d => d.id === deviceId);
      if (deviceData?.device?.gatt?.connected) {
        await deviceData.device.gatt.disconnect();
      }
      
      setDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, status: 'disconnected' } : d
      ));

      console.log(`Disconnected from device: ${deviceId}`);
    } catch (error) {
      console.error('Disconnection failed:', error);
      setError('Failed to disconnect device');
    }
  }, [devices]);

  // Get device capabilities
  const getDeviceCapabilities = useCallback(async (deviceId: string): Promise<string[]> => {
    try {
      const deviceData = devices.find(d => d.id === deviceId);
      if (!deviceData?.device?.gatt?.connected) {
        return ['basic_connection'];
      }

      const server = deviceData.device.gatt;
      const services = await server.getPrimaryServices();
      const capabilities: string[] = [];

      for (const service of services) {
        const uuid = service.uuid.toLowerCase();
        
        // Check for video streaming capability
        if (uuid.includes('180f') || uuid.includes('video') || uuid.includes(DASHCAM_SERVICE_UUID.toLowerCase())) {
          capabilities.push('video_stream');
        }
        
        // Check for audio capability
        if (uuid.includes('audio') || uuid.includes('mic')) {
          capabilities.push('audio_stream');
        }
        
        // Check for file transfer capability
        if (uuid.includes('file') || uuid.includes('storage')) {
          capabilities.push('file_transfer');
        }
        
        // Check for remote control capability
        if (uuid.includes('control') || uuid.includes('command')) {
          capabilities.push('remote_control');
        }
      }

      // For demo purposes, add video streaming capability to recognized devices
      if (deviceData.type === 'dashcam' || deviceData.type === 'bodycam') {
        capabilities.push('video_stream');
      }

      if (capabilities.length === 0) {
        capabilities.push('basic_connection');
      }

      return capabilities;
    } catch (error) {
      console.error('Failed to get device capabilities:', error);
      return ['basic_connection'];
    }
  }, [devices]);

  // Request video stream from device
  const requestVideoStream = useCallback(async (deviceId: string): Promise<string | null> => {
    try {
      const device = devices.find(d => d.id === deviceId);
      if (!device || device.status !== 'connected') {
        throw new Error('Device not connected');
      }

      if (!device.capabilities.includes('video_stream')) {
        throw new Error('Device does not support video streaming');
      }

      // For demonstration, create a mock stream URL
      // In real implementation, this would communicate with the actual device
      const streamUrl = `bluetooth-stream://${deviceId}`;
      
      console.log(`Video stream requested from device: ${device.name}`);
      
      // Create a mock video stream URL for demo purposes
      // In production, this would involve:
      // 1. Sending commands to the device via Bluetooth
      // 2. Establishing a local network connection for video streaming
      // 3. Receiving the actual stream URL or establishing direct connection
      
      return streamUrl;

    } catch (error) {
      console.error('Failed to request video stream:', error);
      setError('Failed to start video stream from device');
      return null;
    }
  }, [devices]);

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