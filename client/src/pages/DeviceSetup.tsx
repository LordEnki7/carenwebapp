import { useState } from "react";
import { Camera, Bluetooth, TestTube, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Import existing device components
import CameraSetup from "./CameraSetup";
import MediaTest from "./MediaTest";
import BluetoothEarpiece from "./BluetoothEarpiece";

export default function DeviceSetup() {
  const [activeSetup, setActiveSetup] = useState<'camera' | 'media-test' | 'bluetooth' | 'overview'>('overview');
  const [deviceStatus, setDeviceStatus] = useState({
    camera: { status: 'connected', quality: 'HD 1080p' },
    microphone: { status: 'connected', quality: 'High Quality' },
    bluetooth: { status: 'ready', devices: 2 }
  });
  const { toast } = useToast();

  const deviceFeatures = [
    {
      id: 'camera',
      name: 'Camera Setup',
      description: 'Configure video recording quality, angles, and multi-camera support',
      icon: Camera,
      status: deviceStatus.camera.status,
      details: deviceStatus.camera.quality
    },
    {
      id: 'media-test',
      name: 'Media Testing',
      description: 'Test audio/video recording and playback functionality',
      icon: TestTube,
      status: 'ready',
      details: 'Audio & Video Ready'
    },
    {
      id: 'bluetooth',
      name: 'Bluetooth Devices',
      description: 'Connect earpieces, car audio, and external microphones',
      icon: Bluetooth,
      status: deviceStatus.bluetooth.status,
      details: `${deviceStatus.bluetooth.devices} devices paired`
    }
  ];

  const handleQuickSetup = () => {
    toast({
      title: "Quick Setup Complete",
      description: "All devices configured with optimal settings for emergency recording.",
    });
  };

  if (activeSetup === 'camera') {
    return <CameraSetup />;
  }

  if (activeSetup === 'media-test') {
    return <MediaTest />;
  }

  if (activeSetup === 'bluetooth') {
    return <BluetoothEarpiece />;
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Setup Center</h1>
          <p className="text-muted-foreground mt-2">
            Configure cameras, microphones, and Bluetooth devices for optimal recording
          </p>
        </div>
        <Button onClick={handleQuickSetup} className="bg-blue-600 hover:bg-blue-700">
          <Settings className="w-4 h-4 mr-2" />
          Quick Setup All
        </Button>
      </div>

      {/* Device Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {deviceFeatures.map((feature) => {
          const Icon = feature.icon;
          const isConnected = feature.status === 'connected';
          const StatusIcon = isConnected ? CheckCircle : AlertCircle;
          
          return (
            <Card key={feature.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveSetup(feature.id as any)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">{feature.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <StatusIcon className={`h-4 w-4 ${isConnected ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{feature.description}</CardDescription>
                
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {feature.status === 'connected' ? 'Connected' : 'Ready'}
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    {feature.details}
                  </span>
                </div>
                
                <Button className="w-full" variant="outline">
                  {isConnected ? 'Configure' : 'Setup'} Device
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Device Configuration Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Device Configuration</CardTitle>
          <CardDescription>
            Advanced settings and troubleshooting for all connected devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recording">Recording</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
              <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Camera className="w-4 h-4 mr-2" />
                    Camera Status
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Resolution:</span>
                      <span className="text-green-600">{deviceStatus.camera.quality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="default" className="text-xs">Connected</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Bluetooth className="w-4 h-4 mr-2" />
                    Bluetooth Devices
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Paired Devices:</span>
                      <span className="text-blue-600">{deviceStatus.bluetooth.devices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="secondary" className="text-xs">Ready</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="recording" className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Recording Presets</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm">Emergency Quality</Button>
                  <Button variant="outline" size="sm">High Quality</Button>
                  <Button variant="outline" size="sm">Low Bandwidth</Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="quality" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Video Quality Settings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Resolution:</span>
                      <select className="border rounded px-2 py-1 text-sm">
                        <option>1080p HD</option>
                        <option>720p</option>
                        <option>480p</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Frame Rate:</span>
                      <select className="border rounded px-2 py-1 text-sm">
                        <option>30 FPS</option>
                        <option>60 FPS</option>
                        <option>24 FPS</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="troubleshoot" className="space-y-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <TestTube className="w-4 h-4 mr-2" />
                  Run Hardware Diagnostics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="w-4 h-4 mr-2" />
                  Reset Camera Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bluetooth className="w-4 h-4 mr-2" />
                  Clear Bluetooth Cache
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}