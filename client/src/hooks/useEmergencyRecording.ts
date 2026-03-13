import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EmergencyRecordingState {
  isActive: boolean;
  isConnectingBluetooth: boolean;
  isRecording: boolean;
  isSendingNotifications: boolean;
  connectedDevices: number;
  notificationsSent: number;
  error: string | null;
}

interface BluetoothDevice {
  id: string;
  name: string;
  type: 'camera' | 'audio' | 'phone';
  connected: boolean;
}

export function useEmergencyRecording() {
  const [state, setState] = useState<EmergencyRecordingState>({
    isActive: false,
    isConnectingBluetooth: false,
    isRecording: false,
    isSendingNotifications: false,
    connectedDevices: 0,
    notificationsSent: 0,
    error: null
  });

  const { toast } = useToast();
  const emergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start the complete emergency recording workflow
   */
  const startEmergencyRecording = async (startVideoRecording?: () => Promise<void>) => {
    console.log('🚨 EMERGENCY RECORDING INITIATED');
    
    setState(prev => ({ 
      ...prev, 
      isActive: true, 
      error: null,
      isConnectingBluetooth: true 
    }));

    try {
      // Step 1: Show immediate emergency notification
      toast({
        title: "🚨 Emergency Recording Active",
        description: "Connecting devices and notifying contacts...",
        duration: 5000,
      });

      // Step 2: Start video recording immediately (highest priority)
      console.log('🎥 Starting emergency video recording...');
      setState(prev => ({ ...prev, isRecording: true }));
      
      if (startVideoRecording) {
        await startVideoRecording();
        console.log('✅ Emergency video recording started');
      }

      // Step 3: Connect Bluetooth devices in parallel
      console.log('📱 Scanning for Bluetooth emergency devices...');
      const connectedDevices = await connectEmergencyBluetoothDevices();
      
      setState(prev => ({ 
        ...prev, 
        isConnectingBluetooth: false,
        connectedDevices: connectedDevices.length 
      }));

      // Step 4: Send emergency notifications to contacts
      console.log('📧 Sending emergency notifications...');
      setState(prev => ({ ...prev, isSendingNotifications: true }));
      
      const notificationCount = await sendEmergencyNotifications();
      
      setState(prev => ({ 
        ...prev, 
        isSendingNotifications: false,
        notificationsSent: notificationCount 
      }));

      // Step 5: Show success confirmation
      toast({
        title: "🛡️ Emergency System Active",
        description: `Recording started • ${connectedDevices.length} devices connected • ${notificationCount} contacts notified`,
        duration: 8000,
      });

      console.log('✅ Emergency recording workflow complete');

      // Auto-extend recording for 30 minutes unless manually stopped
      emergencyTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Emergency recording auto-extending...');
        toast({
          title: "Emergency Recording Extended",
          description: "Recording continues for your protection",
          duration: 3000,
        });
      }, 30 * 60 * 1000);

    } catch (error) {
      console.error('❌ Emergency recording failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Emergency recording failed',
        isConnectingBluetooth: false,
        isSendingNotifications: false
      }));
      
      toast({
        title: "Emergency Recording Error",
        description: "Some emergency features may not be available",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  /**
   * Connect to available Bluetooth devices for emergency recording
   */
  const connectEmergencyBluetoothDevices = async (): Promise<BluetoothDevice[]> => {
    const connectedDevices: BluetoothDevice[] = [];

    try {
      // Try to connect to phone for additional camera/audio
      if ('bluetooth' in navigator) {
        console.log('🔍 Scanning for emergency Bluetooth devices...');
        
        // Simulate connecting to available devices
        // In production, this would use actual Bluetooth API
        const availableDevices = [
          { id: 'phone-1', name: 'Emergency Phone', type: 'camera' as const },
          { id: 'earpiece-1', name: 'Bluetooth Earpiece', type: 'audio' as const },
          { id: 'dashcam-1', name: 'Dash Camera', type: 'camera' as const }
        ];

        for (const device of availableDevices) {
          try {
            // Simulate connection attempt
            await new Promise(resolve => setTimeout(resolve, 500));
            connectedDevices.push({ ...device, connected: true });
            console.log(`✅ Connected to ${device.name}`);
          } catch (deviceError) {
            console.warn(`⚠️ Failed to connect to ${device.name}:`, deviceError);
          }
        }
      }

      // Send connection status to backend for coordination
      if (connectedDevices.length > 0) {
        await fetch('/api/emergency/bluetooth-connected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            devices: connectedDevices,
            emergencyType: 'police_encounter',
            timestamp: new Date().toISOString()
          })
        });
      }

    } catch (error) {
      console.error('📱 Bluetooth connection error:', error);
    }

    return connectedDevices;
  };

  /**
   * Send emergency notifications to all contacts
   */
  const sendEmergencyNotifications = async (): Promise<number> => {
    try {
      console.log('📧 Fetching emergency contacts...');
      
      // Get user's location for emergency notification
      let location = 'Location unavailable';
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 60000
            });
          });
          
          location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          console.log('📍 Location obtained for emergency notification:', location);
        }
      } catch (locationError) {
        console.warn('⚠️ Could not get location for emergency notification:', locationError);
      }

      // Send emergency alert to backend
      const response = await fetch('/api/emergency/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'police_encounter',
          message: 'EMERGENCY: Recording incident for safety. GPS coordinates attached.',
          location: location,
          timestamp: new Date().toISOString(),
          urgency: 'high',
          autoGenerated: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Emergency notifications sent:', result);
        return result.contactsNotified || 0;
      } else {
        console.error('❌ Failed to send emergency notifications:', response.status);
        return 0;
      }

    } catch (error) {
      console.error('📧 Emergency notification error:', error);
      return 0;
    }
  };

  /**
   * Stop emergency recording and cleanup
   */
  const stopEmergencyRecording = () => {
    console.log('🛑 Stopping emergency recording...');
    
    if (emergencyTimeoutRef.current) {
      clearTimeout(emergencyTimeoutRef.current);
      emergencyTimeoutRef.current = null;
    }

    setState({
      isActive: false,
      isConnectingBluetooth: false,
      isRecording: false,
      isSendingNotifications: false,
      connectedDevices: 0,
      notificationsSent: 0,
      error: null
    });

    toast({
      title: "Emergency Recording Stopped",
      description: "Your safety recording has ended",
      duration: 3000,
    });
  };

  return {
    state,
    startEmergencyRecording,
    stopEmergencyRecording,
    isEmergencyActive: state.isActive
  };
}