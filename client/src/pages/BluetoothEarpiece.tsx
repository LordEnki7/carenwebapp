import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  BluetoothSearching,
  Headphones,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Battery,
  Zap,
  Radio,
  Car
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BluetoothDevice {
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
  deviceAddress?: string;
}

interface BluetoothSettings {
  autoConnect: boolean;
  voiceCommandsEnabled: boolean;
  emergencyModeEnabled: boolean;
  audioQuality: 'high' | 'medium' | 'low';
  microphoneSensitivity: number;
  volumeLevel: number;
  emergencyActivationPhrase: string;
  trustedDevicesOnly: boolean;
  batteryAlerts: boolean;
  connectionTimeout: number;
}

interface AudioStream {
  inputStream?: MediaStream;
  outputStream?: MediaStream;
  isActive: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
}

export default function BluetoothEarpiece() {
  const [activeTab, setActiveTab] = useState('devices');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [audioStream, setAudioStream] = useState<AudioStream>({ isActive: false, quality: 'good', latency: 50 });
  const [connectionTest, setConnectionTest] = useState(false);
  const queryClient = useQueryClient();

  // Mock devices for demonstration
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([
    {
      id: 'bt-001',
      name: 'AirPods Pro',
      type: 'earpiece',
      connected: true,
      batteryLevel: 85,
      signalStrength: 92,
      capabilities: {
        audio: true,
        microphone: true,
        voiceCommands: true,
        emergencyButton: false
      },
      lastConnected: new Date().toISOString(),
      trustLevel: 'trusted'
    },
    {
      id: 'bt-002',
      name: 'Bose QuietComfort',
      type: 'headphones',
      connected: false,
      batteryLevel: 67,
      signalStrength: 78,
      capabilities: {
        audio: true,
        microphone: true,
        voiceCommands: true,
        emergencyButton: true
      },
      lastConnected: new Date(Date.now() - 3600000).toISOString(),
      trustLevel: 'trusted'
    },
    {
      id: 'bt-003',
      name: 'Plantronics Voyager',
      type: 'earpiece',
      connected: false,
      signalStrength: 45,
      capabilities: {
        audio: true,
        microphone: true,
        voiceCommands: true,
        emergencyButton: true
      },
      trustLevel: 'new'
    },
    {
      id: 'bt-004',
      name: 'Car Audio System',
      type: 'car_audio',
      connected: false,
      signalStrength: 85,
      capabilities: {
        audio: true,
        microphone: true,
        voiceCommands: true,
        emergencyButton: false
      },
      trustLevel: 'trusted',
      deviceAddress: 'AA:BB:CC:DD:EE:FF'
    }
  ]);

  const [settings, setSettings] = useState<BluetoothSettings>({
    autoConnect: true,
    voiceCommandsEnabled: true,
    emergencyModeEnabled: true,
    audioQuality: 'high',
    microphoneSensitivity: 75,
    volumeLevel: 65,
    emergencyActivationPhrase: 'CAREN emergency protocol',
    trustedDevicesOnly: false,
    batteryAlerts: true,
    connectionTimeout: 30
  });

  // Get Bluetooth status
  const { data: bluetoothStatus } = useQuery({
    queryKey: ['/api/bluetooth/status'],
    queryFn: () => apiRequest('/api/bluetooth/status'),
    refetchInterval: 5000
  });

  // Connect to device mutation
  const connectDevice = useMutation({
    mutationFn: (deviceId: string) => 
      apiRequest('/api/bluetooth/connect', {
        method: 'POST',
        body: JSON.stringify({ deviceId })
      }),
    onSuccess: (data) => {
      toast({
        title: "Device Connected",
        description: `Successfully connected to ${data.deviceName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bluetooth/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to device",
        variant: "destructive",
      });
    }
  });

  // Disconnect device mutation
  const disconnectDevice = useMutation({
    mutationFn: (deviceId: string) => 
      apiRequest('/api/bluetooth/disconnect', {
        method: 'POST',
        body: JSON.stringify({ deviceId })
      }),
    onSuccess: () => {
      toast({
        title: "Device Disconnected",
        description: "Bluetooth device disconnected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bluetooth/status'] });
    }
  });

  // Enhanced car audio connection with retry logic
  const connectCarAudio = async (deviceId: string) => {
    toast({
      title: "Connecting to Car Audio",
      description: "Attempting to connect with enhanced retry logic...",
    });
    
    let attempt = 1;
    const maxAttempts = 3;
    
    while (attempt <= maxAttempts) {
      try {
        setConnectionTest(true);
        
        toast({
          title: `Connection Attempt ${attempt}/${maxAttempts}`,
          description: "Establishing Bluetooth car audio connection...",
        });
        
        // Enhanced connection attempt with longer timeout for car audio
        await new Promise(resolve => setTimeout(resolve, 2000 + (attempt * 1000)));
        
        // Car audio has specific connection requirements
        const success = Math.random() > 0.02; // 98% success rate with retry logic
        
        if (success) {
          setDevices(prev => prev.map(d => 
            d.id === deviceId 
              ? { ...d, connected: true, signalStrength: Math.floor(Math.random() * 20) + 80 }
              : { ...d, connected: false }
          ));
          
          setAudioStream({
            isActive: true,
            quality: 'excellent',
            latency: 25
          });
          
          toast({
            title: "Car Audio Connected Successfully",
            description: `Connected on attempt ${attempt}. Audio quality: Excellent`,
          });
          
          setConnectionTest(false);
          return true;
        }
        
        if (attempt < maxAttempts) {
          toast({
            title: `Attempt ${attempt} Failed`,
            description: `Retrying connection in 2 seconds... (${maxAttempts - attempt} attempts remaining)`,
            variant: "destructive",
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`Car audio connection attempt ${attempt} failed:`, error);
      }
      
      attempt++;
    }
    
    // All attempts failed
    toast({
      title: "Car Audio Connection Failed",
      description: "Unable to connect after 3 attempts. Please check your car's Bluetooth settings and try again.",
      variant: "destructive",
    });
    
    setConnectionTest(false);
    return false;
  };

  // Test audio connection
  const testAudioConnection = async () => {
    setConnectionTest(true);
    try {
      // Simulate audio test
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setAudioStream({
        isActive: true,
        quality: 'excellent',
        latency: 25
      });
      
      toast({
        title: "Audio Test Complete",
        description: "Bluetooth audio connection is working perfectly",
      });
    } catch (error) {
      toast({
        title: "Audio Test Failed",
        description: "There was an issue with the audio connection",
        variant: "destructive",
      });
    } finally {
      setConnectionTest(false);
    }
  };

  // Scan for devices
  const scanForDevices = async () => {
    setIsScanning(true);
    try {
      // Simulate scanning
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add a new device to demonstrate scanning
      const newDevice: BluetoothDevice = {
        id: `bt-${Date.now()}`,
        name: 'Unknown Device',
        type: 'unknown',
        connected: false,
        signalStrength: Math.floor(Math.random() * 100),
        capabilities: {
          audio: true,
          microphone: false,
          voiceCommands: false,
          emergencyButton: false
        },
        trustLevel: 'new'
      };
      
      setAvailableDevices(prev => [...prev, newDevice]);
      
      toast({
        title: "Scan Complete",
        description: "Found new Bluetooth devices nearby",
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Unable to scan for Bluetooth devices",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getDeviceIcon = (device: BluetoothDevice) => {
    switch (device.type) {
      case 'earpiece':
        return Headphones;
      case 'headphones':
        return Headphones;
      case 'speaker':
        return Volume2;
      case 'car_audio':
        return Car;
      default:
        return Bluetooth;
    }
  };

  const getSignalColor = (strength: number) => {
    if (strength >= 80) return 'text-green-400';
    if (strength >= 60) return 'text-yellow-400';
    if (strength >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level >= 60) return 'text-green-400';
    if (level >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <BluetoothConnected className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Bluetooth Earpiece</h1>
            <p className="text-blue-200">Hands-free legal protection communication</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Bluetooth Status</p>
                <p className="text-cyan-400 font-semibold">Connected</p>
              </div>
              <BluetoothConnected className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Audio Quality</p>
                <p className="text-green-400 font-semibold">{audioStream.quality}</p>
              </div>
              <Volume2 className="w-6 h-6 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Voice Commands</p>
                <p className="text-purple-400 font-semibold">Active</p>
              </div>
              <Mic className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Emergency Mode</p>
                <p className="text-orange-400 font-semibold">Ready</p>
              </div>
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-cyan-500/30">
          <TabsTrigger value="devices" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Devices
          </TabsTrigger>
          <TabsTrigger value="audio" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Audio Test
          </TabsTrigger>
          <TabsTrigger value="emergency" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Emergency
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          {/* Demo Information Banner */}
          <Card className="bg-blue-500/10 border-blue-400/30">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-blue-400 font-semibold mb-2">Demo Mode Information</h3>
                  <p className="text-blue-200 text-sm mb-3">
                    This is a demonstration of C.A.R.E.N.™'s Bluetooth connectivity features. 
                    In production, this would connect to real Bluetooth earpieces and car audio systems.
                  </p>
                  <div className="text-blue-200 text-sm space-y-1">
                    <p>• <strong>For testing:</strong> Use the simulated devices below</p>
                    <p>• <strong>Car audio:</strong> Enhanced retry logic with 98% success rate</p>
                    <p>• <strong>Real deployment:</strong> Connects to actual Bluetooth devices</p>
                    <p>• <strong>Connection issues?</strong> Try the "Toyota Camry Audio" or "Ford F-150 SYNC" devices for car audio testing</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Available Devices</h2>
            <Button
              onClick={scanForDevices}
              disabled={isScanning}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isScanning ? (
                <>
                  <BluetoothSearching className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan for Devices
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4">
            {availableDevices.map((device) => {
              const DeviceIcon = getDeviceIcon(device);
              return (
                <Card key={device.id} className="bg-gray-800/50 border-cyan-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg border ${
                          device.connected 
                            ? 'bg-green-500/20 border-green-400/30' 
                            : 'bg-gray-500/20 border-gray-400/30'
                        }`}>
                          <DeviceIcon className={`w-6 h-6 ${
                            device.connected ? 'text-green-400' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        <div>
                          <h3 className="text-white font-semibold">{device.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-300">
                            <span className="capitalize">{device.type}</span>
                            <Badge variant={device.trustLevel === 'trusted' ? 'default' : 'secondary'}>
                              {device.trustLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        {/* Signal Strength */}
                        <div className="text-center">
                          <Radio className={`w-5 h-5 mx-auto ${getSignalColor(device.signalStrength)}`} />
                          <p className="text-xs text-gray-400 mt-1">{device.signalStrength}%</p>
                        </div>

                        {/* Battery */}
                        {device.batteryLevel && (
                          <div className="text-center">
                            <Battery className={`w-5 h-5 mx-auto ${getBatteryColor(device.batteryLevel)}`} />
                            <p className="text-xs text-gray-400 mt-1">{device.batteryLevel}%</p>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          onClick={() => {
                            if (device.connected) {
                              disconnectDevice.mutate(device.id);
                            } else if (device.type === 'car_audio') {
                              connectCarAudio(device.id);
                            } else {
                              connectDevice.mutate(device.id);
                            }
                          }}
                          disabled={connectDevice.isPending || disconnectDevice.isPending || connectionTest}
                          variant={device.connected ? "destructive" : "default"}
                          className={device.connected 
                            ? "bg-red-500 hover:bg-red-600" 
                            : device.type === 'car_audio' 
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-green-500 hover:bg-green-600"
                          }
                        >
                          {connectionTest && !device.connected ? 'Connecting...' : 
                           device.connected ? 'Disconnect' : 
                           device.type === 'car_audio' ? 'Connect Car Audio' : 'Connect'}
                        </Button>
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <p className="text-sm text-gray-300 mb-2">Capabilities:</p>
                      <div className="flex flex-wrap gap-2">
                        {device.capabilities.audio && (
                          <Badge variant="outline" className="border-green-500/50 text-green-400">
                            <Volume2 className="w-3 h-3 mr-1" />
                            Audio
                          </Badge>
                        )}
                        {device.capabilities.microphone && (
                          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                            <Mic className="w-3 h-3 mr-1" />
                            Microphone
                          </Badge>
                        )}
                        {device.capabilities.voiceCommands && (
                          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                            <Radio className="w-3 h-3 mr-1" />
                            Voice Commands
                          </Badge>
                        )}
                        {device.capabilities.emergencyButton && (
                          <Badge variant="outline" className="border-red-500/50 text-red-400">
                            <Zap className="w-3 h-3 mr-1" />
                            Emergency Button
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Audio Test Tab */}
        <TabsContent value="audio" className="space-y-6">
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Audio Connection Test</CardTitle>
              <CardDescription>
                Test your Bluetooth audio connection quality and latency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Audio Test Controls */}
              <div className="text-center space-y-4">
                <Button
                  size="lg"
                  onClick={testAudioConnection}
                  disabled={connectionTest}
                  className="w-48 h-16 bg-green-500 hover:bg-green-600"
                >
                  {connectionTest ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Testing Audio...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-6 h-6 mr-3" />
                      Test Audio Connection
                    </>
                  )}
                </Button>

                {audioStream.isActive && (
                  <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Audio Connection Active</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <Volume2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Audio Quality</p>
                  <p className="text-blue-400 font-semibold capitalize">{audioStream.quality}</p>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Latency</p>
                  <p className="text-yellow-400 font-semibold">{audioStream.latency}ms</p>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <Radio className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Connection</p>
                  <p className="text-green-400 font-semibold">
                    {audioStream.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              {/* Volume Controls */}
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Volume Level: {settings.volumeLevel}%</Label>
                  <Slider
                    value={[settings.volumeLevel]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, volumeLevel: value[0] }))}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Microphone Sensitivity: {settings.microphoneSensitivity}%</Label>
                  <Slider
                    value={[settings.microphoneSensitivity]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, microphoneSensitivity: value[0] }))}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency" className="space-y-6">
          <Card className="bg-gray-800/50 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Emergency Mode Configuration</CardTitle>
              <CardDescription>
                Configure emergency voice activation and protocols
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle className="text-red-400">Emergency Mode Active</AlertTitle>
                <AlertDescription className="text-red-200">
                  Your Bluetooth earpiece is configured for emergency legal protection. 
                  Voice commands will activate recording and contact emergency services.
                </AlertDescription>
              </Alert>

              {/* Emergency Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Emergency Mode Enabled</Label>
                    <p className="text-sm text-gray-400">Allow voice activation of emergency protocols</p>
                  </div>
                  <Switch
                    checked={settings.emergencyModeEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, emergencyModeEnabled: checked }))
                    }
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Emergency Activation Phrase</Label>
                  <Input
                    value={settings.emergencyActivationPhrase}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      emergencyActivationPhrase: e.target.value 
                    }))}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter emergency phrase"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Say this phrase to activate emergency mode
                  </p>
                </div>

                <div>
                  <Label className="text-gray-300">Connection Timeout: {settings.connectionTimeout}s</Label>
                  <Slider
                    value={[settings.connectionTimeout]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, connectionTimeout: value[0] }))}
                    min={10}
                    max={120}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Emergency Commands */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Emergency Voice Commands</h3>
                <div className="grid gap-3">
                  {[
                    { command: '"CAREN emergency protocol"', action: 'Activate full emergency mode' },
                    { command: '"Start recording now"', action: 'Begin incident recording' },
                    { command: '"Contact my attorney"', action: 'Send alert to legal counsel' },
                    { command: '"I invoke my rights"', action: 'Announce constitutional protections' },
                    { command: '"Send location to family"', action: 'Share GPS with emergency contacts' }
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-cyan-400 font-mono text-sm">{item.command}</p>
                          <p className="text-gray-300 text-xs">{item.action}</p>
                        </div>
                        <Mic className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Bluetooth Settings</CardTitle>
              <CardDescription>
                Configure your Bluetooth earpiece preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Connection</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Auto-Connect</Label>
                    <p className="text-sm text-gray-400">Automatically connect to trusted devices</p>
                  </div>
                  <Switch
                    checked={settings.autoConnect}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, autoConnect: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Trusted Devices Only</Label>
                    <p className="text-sm text-gray-400">Only connect to verified devices</p>
                  </div>
                  <Switch
                    checked={settings.trustedDevicesOnly}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, trustedDevicesOnly: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Battery Alerts</Label>
                    <p className="text-sm text-gray-400">Notify when device battery is low</p>
                  </div>
                  <Switch
                    checked={settings.batteryAlerts}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, batteryAlerts: checked }))
                    }
                  />
                </div>
              </div>

              {/* Audio Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Audio</h3>
                
                <div>
                  <Label className="text-gray-300">Audio Quality</Label>
                  <select
                    value={settings.audioQuality}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      audioQuality: e.target.value as 'high' | 'medium' | 'low' 
                    }))}
                    className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="high">High Quality</option>
                    <option value="medium">Medium Quality</option>
                    <option value="low">Low Quality (Power Saving)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Voice Commands</Label>
                    <p className="text-sm text-gray-400">Enable voice command recognition</p>
                  </div>
                  <Switch
                    checked={settings.voiceCommandsEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, voiceCommandsEnabled: checked }))
                    }
                  />
                </div>
              </div>

              {/* Save Settings */}
              <div className="pt-4 border-t border-gray-600">
                <Button className="w-full bg-green-500 hover:bg-green-600">
                  <Settings className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}