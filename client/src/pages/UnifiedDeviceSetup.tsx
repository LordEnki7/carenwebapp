import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Mic, Smartphone, Monitor, Settings, CheckCircle, AlertCircle } from "lucide-react";

export default function UnifiedDeviceSetup() {
  const [devices, setDevices] = useState({
    camera: null as MediaDeviceInfo | null,
    microphone: null as MediaDeviceInfo | null,
    speaker: null as MediaDeviceInfo | null
  });
  
  const [settings, setSettings] = useState({
    videoQuality: "1080p",
    audioQuality: "high",
    autoRecord: false,
    emergencyMode: true,
    multiDevice: false
  });

  const [availableDevices, setAvailableDevices] = useState({
    cameras: [] as MediaDeviceInfo[],
    microphones: [] as MediaDeviceInfo[],
    speakers: [] as MediaDeviceInfo[]
  });

  const [deviceStatus, setDeviceStatus] = useState({
    camera: "checking",
    microphone: "checking",
    permissions: "checking"
  });

  useEffect(() => {
    checkDevicePermissions();
    loadAvailableDevices();
  }, []);

  const checkDevicePermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setDeviceStatus(prev => ({
        ...prev,
        camera: "available",
        microphone: "available",
        permissions: "granted"
      }));
      
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setDeviceStatus(prev => ({
        ...prev,
        camera: "unavailable",
        microphone: "unavailable",
        permissions: "denied"
      }));
    }
  };

  const loadAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      setAvailableDevices({
        cameras: devices.filter(device => device.kind === 'videoinput'),
        microphones: devices.filter(device => device.kind === 'audioinput'),
        speakers: devices.filter(device => device.kind === 'audiooutput')
      });
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const testDevice = async (deviceType: 'camera' | 'microphone') => {
    try {
      const constraints = deviceType === 'camera' 
        ? { video: { deviceId: devices.camera?.deviceId } }
        : { audio: { deviceId: devices.microphone?.deviceId } };
        
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Brief test
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
      }, 2000);
      
      setDeviceStatus(prev => ({
        ...prev,
        [deviceType]: "tested"
      }));
    } catch (error) {
      setDeviceStatus(prev => ({
        ...prev,
        [deviceType]: "error"
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
      case "tested":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "checking":
        return <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Ready";
      case "tested": return "Tested";
      case "checking": return "Checking";
      default: return "Error";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Device Setup Hub
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Configure cameras, microphones, and recording settings for optimal emergency documentation
          </p>
        </div>

        {/* Quick Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800/50 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-cyan-400" />
                  <span className="font-medium">Camera</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(deviceStatus.camera)}
                  <span className="text-sm">{getStatusText(deviceStatus.camera)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-cyan-400" />
                  <span className="font-medium">Microphone</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(deviceStatus.microphone)}
                  <span className="text-sm">{getStatusText(deviceStatus.microphone)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  <span className="font-medium">Permissions</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(deviceStatus.permissions)}
                  <span className="text-sm">{getStatusText(deviceStatus.permissions)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
            <TabsTrigger value="devices" className="data-[state=active]:bg-cyan-600">Devices</TabsTrigger>
            <TabsTrigger value="camera" className="data-[state=active]:bg-cyan-600">Camera Setup</TabsTrigger>
            <TabsTrigger value="recording" className="data-[state=active]:bg-cyan-600">Recording Settings</TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-cyan-600">Advanced</TabsTrigger>
          </TabsList>

          {/* Device Selection Tab */}
          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Camera className="h-5 w-5" />
                    Camera Selection
                  </CardTitle>
                  <CardDescription>Choose your primary recording camera</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select onValueChange={(value) => {
                    const camera = availableDevices.cameras.find(d => d.deviceId === value);
                    setDevices(prev => ({ ...prev, camera }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select camera device" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDevices.cameras.map((camera) => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {devices.camera && (
                    <Button 
                      onClick={() => testDevice('camera')}
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                    >
                      Test Camera
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Mic className="h-5 w-5" />
                    Microphone Selection
                  </CardTitle>
                  <CardDescription>Choose your audio recording device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select onValueChange={(value) => {
                    const microphone = availableDevices.microphones.find(d => d.deviceId === value);
                    setDevices(prev => ({ ...prev, microphone }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select microphone device" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDevices.microphones.map((mic) => (
                        <SelectItem key={mic.deviceId} value={mic.deviceId}>
                          {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {devices.microphone && (
                    <Button 
                      onClick={() => testDevice('microphone')}
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                    >
                      Test Microphone
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Camera Setup Tab */}
          <TabsContent value="camera" className="space-y-6">
            <Card className="bg-gray-800/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-400">Camera Configuration</CardTitle>
                <CardDescription>Optimize camera settings for emergency recording</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Video Quality</label>
                      <Select value={settings.videoQuality} onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, videoQuality: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p (Faster processing)</SelectItem>
                          <SelectItem value="1080p">1080p (Recommended)</SelectItem>
                          <SelectItem value="4k">4K (High detail)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Audio Quality</label>
                      <Select value={settings.audioQuality} onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, audioQuality: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="high">High (Recommended)</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Auto-Record on Emergency</label>
                        <p className="text-xs text-gray-500">Start recording automatically during emergency activation</p>
                      </div>
                      <Switch
                        checked={settings.autoRecord}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoRecord: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Emergency Mode Priority</label>
                        <p className="text-xs text-gray-500">Optimize settings for emergency situations</p>
                      </div>
                      <Switch
                        checked={settings.emergencyMode}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emergencyMode: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Multi-Device Recording</label>
                        <p className="text-xs text-gray-500">Coordinate with family devices</p>
                      </div>
                      <Switch
                        checked={settings.multiDevice}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, multiDevice: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recording Settings Tab */}
          <TabsContent value="recording" className="space-y-6">
            <Card className="bg-gray-800/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-400">Recording Preferences</CardTitle>
                <CardDescription>Configure how incidents are recorded and stored</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-white">Storage Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Local Storage</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Cloud Backup</span>
                        <Switch checked={settings.multiDevice} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Auto-Delete Old Files</span>
                        <Switch checked={false} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-white">Emergency Features</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">GPS Coordinates</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Timestamp Overlay</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Live Transcription</span>
                        <Switch checked={settings.emergencyMode} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h4 className="font-medium text-white mb-3">Quick Test Recording</h4>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    Start 10-Second Test Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Smartphone className="h-5 w-5" />
                    Mobile Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Battery Optimization</span>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Background Recording</span>
                      <Switch checked={settings.autoRecord} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Screen Lock Recording</span>
                      <Switch checked={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Monitor className="h-5 w-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available Cameras:</span>
                      <span className="text-white">{availableDevices.cameras.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available Microphones:</span>
                      <span className="text-white">{availableDevices.microphones.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Browser Support:</span>
                      <span className="text-green-400">Full</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">WebRTC Support:</span>
                      <span className="text-green-400">Available</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Settings */}
        <Card className="bg-gray-800/50 border-cyan-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">Device Configuration</h3>
                <p className="text-gray-400">All device settings are saved automatically</p>
              </div>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                Test Complete Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}