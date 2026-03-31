import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bluetooth, 
  BluetoothConnected, 
  Video, 
  Mic, 
  FileVideo, 
  Smartphone, 
  Car, 
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Play,
  Stop
} from 'lucide-react';
import { useBluetoothDevices } from '../hooks/useBluetoothDevices';
import { eventBus } from '../../../../src/core/EventBus';

interface BluetoothDeviceManagerProps {
  onVideoStreamStarted?: (streamUrl: string, deviceId: string) => void;
  onDeviceConnected?: (deviceId: string, deviceName: string) => void;
}

export default function BluetoothDeviceManager({ 
  onVideoStreamStarted, 
  onDeviceConnected 
}: BluetoothDeviceManagerProps) {
  const {
    devices,
    isScanning,
    isSupported,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    requestVideoStream,
    error
  } = useBluetoothDevices();

  const [activeStreams, setActiveStreams] = useState<Set<string>>(new Set());
  const [connectionProgress, setConnectionProgress] = useState<Record<string, number>>({});

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'dashcam':
        return <Car className="w-5 h-5" />;
      case 'bodycam':
        return <Video className="w-5 h-5" />;
      case 'smartphone':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Bluetooth className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleConnect = async (deviceId: string) => {
    setConnectionProgress(prev => ({ ...prev, [deviceId]: 0 }));
    
    // Simulate connection progress
    const progressInterval = setInterval(() => {
      setConnectionProgress(prev => ({
        ...prev,
        [deviceId]: Math.min((prev[deviceId] || 0) + 10, 90)
      }));
    }, 200);

    try {
      const success = await connectToDevice(deviceId);
      clearInterval(progressInterval);
      
      if (success) {
        setConnectionProgress(prev => ({ ...prev, [deviceId]: 100 }));
        
        // Find device info
        const device = devices.find(d => d.id === deviceId);
        if (device && onDeviceConnected) {
          onDeviceConnected(deviceId, device.name);
        }

        // Emit bluetooth connection event
        eventBus.emit({
          type: 'bluetooth.device.connected',
          module: '@caren/bluetooth',
          payload: {
            deviceId,
            deviceName: device?.name || 'Unknown Device',
            deviceType: device?.type || 'unknown',
            timestamp: Date.now()
          }
        });

        // Clear progress after a moment
        setTimeout(() => {
          setConnectionProgress(prev => {
            const updated = { ...prev };
            delete updated[deviceId];
            return updated;
          });
        }, 2000);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setConnectionProgress(prev => {
        const updated = { ...prev };
        delete updated[deviceId];
        return updated;
      });

      eventBus.emit({
        type: 'bluetooth.connection.error',
        module: '@caren/bluetooth',
        payload: {
          deviceId,
          error: error.message,
          timestamp: Date.now()
        }
      });
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    await disconnectDevice(deviceId);
    
    // Remove from active streams if streaming
    setActiveStreams(prev => {
      const updated = new Set(prev);
      updated.delete(deviceId);
      return updated;
    });

    // Emit disconnect event
    eventBus.emit({
      type: 'bluetooth.device.disconnected',
      module: '@caren/bluetooth',
      payload: {
        deviceId,
        timestamp: Date.now()
      }
    });
  };

  const handleVideoStream = async (deviceId: string) => {
    try {
      const streamUrl = await requestVideoStream(deviceId);
      if (streamUrl) {
        setActiveStreams(prev => new Set(prev).add(deviceId));
        if (onVideoStreamStarted) {
          onVideoStreamStarted(streamUrl, deviceId);
        }

        eventBus.emit({
          type: 'bluetooth.video.stream.started',
          module: '@caren/bluetooth',
          payload: {
            deviceId,
            streamUrl,
            timestamp: Date.now()
          }
        });
      }
    } catch (error) {
      eventBus.emit({
        type: 'bluetooth.video.stream.error',
        module: '@caren/bluetooth',
        payload: {
          deviceId,
          error: error.message,
          timestamp: Date.now()
        }
      });
    }
  };

  const handleStopStream = (deviceId: string) => {
    setActiveStreams(prev => {
      const updated = new Set(prev);
      updated.delete(deviceId);
      return updated;
    });

    eventBus.emit({
      type: 'bluetooth.video.stream.stopped',
      module: '@caren/bluetooth',
      payload: {
        deviceId,
        timestamp: Date.now()
      }
    });
  };

  if (!isSupported) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Bluetooth Not Supported
          </h3>
          <p className="text-gray-400">
            Your browser doesn't support Web Bluetooth API. 
            Try using Chrome, Edge, or another supported browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BluetoothConnected className="w-5 h-5 text-blue-400" />
              Bluetooth Devices
            </CardTitle>
            <Button
              onClick={scanForDevices}
              disabled={isScanning}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scan Devices
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Bluetooth className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No devices found</p>
              <p className="text-gray-500 text-sm mt-2">
                Click "Scan Devices" to search for nearby Bluetooth devices
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <Card key={device.id} className="bg-gray-800/50 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(device.type)}
                        <div>
                          <h4 className="text-white font-medium">{device.name}</h4>
                          <p className="text-gray-400 text-sm capitalize">{device.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(device.status)}>
                          {device.status}
                        </Badge>
                        
                        {connectionProgress[device.id] !== undefined && (
                          <div className="w-20">
                            <Progress value={connectionProgress[device.id]} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      {device.status === 'disconnected' ? (
                        <Button
                          onClick={() => handleConnect(device.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={connectionProgress[device.id] !== undefined}
                        >
                          <BluetoothConnected className="w-4 h-4 mr-1" />
                          Connect
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleDisconnect(device.id)}
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Disconnect
                        </Button>
                      )}
                      
                      {device.status === 'connected' && device.capabilities.includes('video') && (
                        <>
                          {activeStreams.has(device.id) ? (
                            <Button
                              onClick={() => handleStopStream(device.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <Stop className="w-4 h-4 mr-1" />
                              Stop Stream
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleVideoStream(device.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start Stream
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    
                    {device.capabilities.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {device.capabilities.map((capability) => (
                          <Badge key={capability} variant="secondary" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}