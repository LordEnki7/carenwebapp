import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Bluetooth, 
  BluetoothConnected, 
  Headphones, 
  Mic, 
  Volume2, 
  Battery, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  Search,
  Settings,
  Car,
  Speaker
} from "lucide-react";

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
  deviceAddress: string;
}

interface BluetoothSettings {
  autoConnect: boolean;
  emergencyOverride: boolean;
  audioQuality: 'high' | 'standard' | 'battery_saver';
  microphoneSensitivity: number;
  handsFreeEnabled: boolean;
  emergencyActivationPhrase: string;
}

const DEFAULT_SETTINGS: BluetoothSettings = {
  autoConnect: true,
  emergencyOverride: true,
  audioQuality: 'high',
  microphoneSensitivity: 75,
  handsFreeEnabled: true,
  emergencyActivationPhrase: "Emergency activation CAREN"
};

export default function BluetoothDevices() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [settings, setSettings] = useState<BluetoothSettings>(DEFAULT_SETTINGS);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBluetoothAvailability();
    loadStoredDevices();
    loadSettings();
  }, []);

  const checkBluetoothAvailability = async () => {
    try {
      if ('bluetooth' in navigator) {
        setIsBluetoothEnabled(true);
        console.log('Bluetooth available - ready for connection');
      } else {
        setIsBluetoothEnabled(false);
        toast({
          title: "Bluetooth Not Available",
          description: "Your browser or device doesn't support Bluetooth Web API",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Bluetooth check failed:', error);
    }
  };

  const loadStoredDevices = () => {
    // Simulate loading previously paired devices
    const mockDevices: BluetoothDevice[] = [
      {
        id: "airpods-pro-001",
        name: "AirPods Pro",
        type: "earpiece",
        connected: false,
        batteryLevel: 85,
        signalStrength: 95,
        capabilities: {
          audio: true,
          microphone: true,
          voiceCommands: true,
          emergencyButton: false
        },
        lastConnected: "2 hours ago",
        trustLevel: "trusted",
        deviceAddress: "AA:BB:CC:DD:EE:FF"
      },
      {
        id: "car-audio-honda",
        name: "Honda Civic Audio",
        type: "car_audio",
        connected: false,
        signalStrength: 78,
        capabilities: {
          audio: true,
          microphone: true,
          voiceCommands: true,
          emergencyButton: true
        },
        lastConnected: "1 day ago",
        trustLevel: "trusted",
        deviceAddress: "11:22:33:44:55:66"
      },
      {
        id: "bose-headphones",
        name: "Bose QuietComfort",
        type: "headphones",
        connected: false,
        batteryLevel: 60,
        signalStrength: 88,
        capabilities: {
          audio: true,
          microphone: true,
          voiceCommands: false,
          emergencyButton: false
        },
        lastConnected: "3 days ago",
        trustLevel: "trusted",
        deviceAddress: "77:88:99:AA:BB:CC"
      }
    ];
    setDevices(mockDevices);
  };

  const loadSettings = () => {
    const stored = localStorage.getItem('caren-bluetooth-settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  };

  const saveSettings = (newSettings: BluetoothSettings) => {
    setSettings(newSettings);
    localStorage.setItem('caren-bluetooth-settings', JSON.stringify(newSettings));
  };

  const scanForDevices = async () => {
    if (!isBluetoothEnabled) {
      toast({
        title: "Bluetooth Unavailable",
        description: "Please enable Bluetooth on your device",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    
    try {
      // Using Web Bluetooth API for real device scanning
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      const newDevice: BluetoothDevice = {
        id: device.id || `device-${Date.now()}`,
        name: device.name || 'Unknown Device',
        type: determineDeviceType(device.name || ''),
        connected: false,
        signalStrength: Math.floor(Math.random() * 40) + 60,
        capabilities: {
          audio: true,
          microphone: true,
          voiceCommands: true,
          emergencyButton: false
        },
        trustLevel: 'new',
        deviceAddress: 'XX:XX:XX:XX:XX:XX'
      };

      setDevices(prev => [...prev, newDevice]);
      
      toast({
        title: "Device Found",
        description: `${newDevice.name} is ready to connect`,
      });
    } catch (error) {
      console.error('Bluetooth scan failed:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to scan for devices. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const determineDeviceType = (deviceName: string): BluetoothDevice['type'] => {
    const name = deviceName.toLowerCase();
    if (name.includes('airpods') || name.includes('earbuds')) return 'earpiece';
    if (name.includes('car') || name.includes('honda') || name.includes('toyota')) return 'car_audio';
    if (name.includes('headphones') || name.includes('bose') || name.includes('sony')) return 'headphones';
    if (name.includes('speaker')) return 'speaker';
    return 'unknown';
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      // Simulate connection process
      toast({
        title: "Connecting...",
        description: `Establishing connection to ${device.name}`,
      });

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update device connection status
      setDevices(prev => prev.map(d => 
        d.id === device.id 
          ? { ...d, connected: true, lastConnected: 'Now' }
          : { ...d, connected: false }
      ));

      setConnectedDevice({ ...device, connected: true });

      toast({
        title: "Connected Successfully",
        description: `${device.name} is now connected for hands-free operation`,
      });

      // Test audio connection
      if (settings.handsFreeEnabled) {
        testAudioConnection(device);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: `Unable to connect to ${device.name}`,
        variant: "destructive"
      });
    }
  };

  const disconnectDevice = (device: BluetoothDevice) => {
    setDevices(prev => prev.map(d => 
      d.id === device.id 
        ? { ...d, connected: false }
        : d
    ));
    
    if (connectedDevice?.id === device.id) {
      setConnectedDevice(null);
    }

    toast({
      title: "Disconnected",
      description: `${device.name} has been disconnected`,
    });
  };

  const testAudioConnection = async (device: BluetoothDevice) => {
    try {
      // Test audio feedback
      const utterance = new SpeechSynthesisUtterance(
        `Audio test successful. ${device.name} is ready for hands-free operation.`
      );
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Audio test failed:', error);
    }
  };

  const getDeviceIcon = (type: BluetoothDevice['type']) => {
    switch (type) {
      case 'earpiece': return Headphones;
      case 'car_audio': return Car;
      case 'headphones': return Headphones;
      case 'speaker': return Speaker;
      default: return Bluetooth;
    }
  };

  const getTrustLevelColor = (level: BluetoothDevice['trustLevel']) => {
    switch (level) {
      case 'trusted': return 'bg-green-500';
      case 'new': return 'bg-blue-500';
      case 'suspicious': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Cyber Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,212,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(138,43,226,0.1),transparent_50%)]"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                <BluetoothConnected className="h-8 w-8 text-cyan-400" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Bluetooth Devices
              </h1>
            </div>
            <p className="text-gray-300 text-lg">
              Connect wireless devices for hands-free legal protection
            </p>
          </div>

          <Tabs defaultValue="devices" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-cyan-500/20">
              <TabsTrigger value="devices" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Available Devices
              </TabsTrigger>
              <TabsTrigger value="connection" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Connection Status
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Bluetooth Settings
              </TabsTrigger>
            </TabsList>

            {/* Available Devices Tab */}
            <TabsContent value="devices" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-white">Available Devices</h2>
                <Button 
                  onClick={scanForDevices}
                  disabled={isScanning || !isBluetoothEnabled}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400"
                >
                  {isScanning ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Scan for Devices
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4">
                {devices.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.type);
                  return (
                    <Card key={device.id} className="bg-gray-800/50 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${device.connected ? 'bg-green-500/20 border-green-500/30' : 'bg-gray-500/20 border-gray-500/30'} border`}>
                              <DeviceIcon className={`h-6 w-6 ${device.connected ? 'text-green-400' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-white">{device.name}</h3>
                                <Badge 
                                  variant="outline" 
                                  className={`${getTrustLevelColor(device.trustLevel)} text-white border-0`}
                                >
                                  {device.trustLevel}
                                </Badge>
                                {device.connected && (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    Connected
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-400 capitalize">{device.type.replace('_', ' ')}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Wifi className="h-3 w-3" />
                                  {device.signalStrength}%
                                </div>
                                {device.batteryLevel && (
                                  <div className="flex items-center gap-1">
                                    <Battery className="h-3 w-3" />
                                    {device.batteryLevel}%
                                  </div>
                                )}
                                {device.lastConnected && (
                                  <span>Last: {device.lastConnected}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {device.connected ? (
                              <Button
                                onClick={() => disconnectDevice(device)}
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                onClick={() => connectToDevice(device)}
                                className={`${
                                  device.type === 'car_audio' 
                                    ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400'
                                    : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400'
                                }`}
                              >
                                {device.type === 'car_audio' ? 'Connect Car Audio' : 'Connect'}
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Device Capabilities */}
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <p className="text-sm text-gray-400 mb-2">Capabilities:</p>
                          <div className="flex gap-2 flex-wrap">
                            {device.capabilities.audio && (
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                                <Volume2 className="h-3 w-3 mr-1" />
                                Audio
                              </Badge>
                            )}
                            {device.capabilities.microphone && (
                              <Badge variant="outline" className="border-green-500/30 text-green-400">
                                <Mic className="h-3 w-3 mr-1" />
                                Microphone
                              </Badge>
                            )}
                            {device.capabilities.voiceCommands && (
                              <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                                Voice Commands
                              </Badge>
                            )}
                            {device.capabilities.emergencyButton && (
                              <Badge variant="outline" className="border-red-500/30 text-red-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Emergency
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

            {/* Connection Status Tab */}
            <TabsContent value="connection" className="space-y-6">
              <Card className="bg-gray-800/50 border border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BluetoothConnected className="h-5 w-5 text-cyan-400" />
                    Connection Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {connectedDevice ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                        <div>
                          <p className="text-white font-medium">{connectedDevice.name}</p>
                          <p className="text-gray-400">Connected and ready for hands-free operation</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                          <Label className="text-gray-300">Signal Strength</Label>
                          <Progress value={connectedDevice.signalStrength} className="mt-2" />
                          <span className="text-sm text-gray-400">{connectedDevice.signalStrength}%</span>
                        </div>
                        {connectedDevice.batteryLevel && (
                          <div>
                            <Label className="text-gray-300">Battery Level</Label>
                            <Progress value={connectedDevice.batteryLevel} className="mt-2" />
                            <span className="text-sm text-gray-400">{connectedDevice.batteryLevel}%</span>
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={() => testAudioConnection(connectedDevice)}
                        className="w-full mt-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400"
                      >
                        Test Audio Connection
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bluetooth className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No devices connected</p>
                      <p className="text-sm text-gray-500 mt-2">Connect a Bluetooth device to enable hands-free operation</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-gray-800/50 border border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5 text-cyan-400" />
                    Bluetooth Settings
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure Bluetooth behavior and hands-free features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-connect" className="text-white">Auto-Connect</Label>
                        <p className="text-sm text-gray-400">Automatically connect to trusted devices</p>
                      </div>
                      <Switch
                        id="auto-connect"
                        checked={settings.autoConnect}
                        onCheckedChange={(checked) => 
                          saveSettings({ ...settings, autoConnect: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emergency-override" className="text-white">Emergency Override</Label>
                        <p className="text-sm text-gray-400">Always connect during emergency situations</p>
                      </div>
                      <Switch
                        id="emergency-override"
                        checked={settings.emergencyOverride}
                        onCheckedChange={(checked) => 
                          saveSettings({ ...settings, emergencyOverride: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="hands-free" className="text-white">Hands-Free Mode</Label>
                        <p className="text-sm text-gray-400">Enable voice commands through Bluetooth devices</p>
                      </div>
                      <Switch
                        id="hands-free"
                        checked={settings.handsFreeEnabled}
                        onCheckedChange={(checked) => 
                          saveSettings({ ...settings, handsFreeEnabled: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Audio Quality</Label>
                      <select 
                        className="w-full mt-2 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        value={settings.audioQuality}
                        onChange={(e) => saveSettings({ 
                          ...settings, 
                          audioQuality: e.target.value as BluetoothSettings['audioQuality']
                        })}
                      >
                        <option value="high">High Quality</option>
                        <option value="standard">Standard</option>
                        <option value="battery_saver">Battery Saver</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-white">Microphone Sensitivity</Label>
                      <div className="mt-2">
                        <Slider
                          value={[settings.microphoneSensitivity]}
                          onValueChange={([value]) => 
                            saveSettings({ ...settings, microphoneSensitivity: value })
                          }
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-400">{settings.microphoneSensitivity}%</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => saveSettings(DEFAULT_SETTINGS)}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Reset to Defaults
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}