import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Video, Settings, TestTube, Monitor, Mic, Volume2, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: string;
}

interface VideoSettings {
  resolution: string;
  frameRate: number;
  quality: string;
  audioEnabled: boolean;
  microphoneDevice: string;
  recordingMode: string;
  autoStart: boolean;
}

export default function CameraSetup() {
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [microphones, setMicrophones] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: '1280x720',
    frameRate: 30,
    quality: 'high',
    audioEnabled: true,
    microphoneDevice: '',
    recordingMode: 'standard',
    autoStart: false
  });
  const [testRecording, setTestRecording] = useState<Blob | null>(null);
  const [devicePermissions, setDevicePermissions] = useState({
    camera: false,
    microphone: false
  });

  useEffect(() => {
    loadDevices();
    checkPermissions();
  }, []);

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setCameras(videoDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
        kind: device.kind
      })));
      
      setMicrophones(audioDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
        kind: device.kind
      })));

      // Set default devices if none selected
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0 && !videoSettings.microphoneDevice) {
        setVideoSettings(prev => ({ 
          ...prev, 
          microphoneDevice: audioDevices[0].deviceId 
        }));
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Device Error",
        description: "Unable to load camera and microphone devices",
        variant: "destructive"
      });
    }
  };

  const checkPermissions = async () => {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      setDevicePermissions({
        camera: cameraPermission.state === 'granted',
        microphone: microphonePermission.state === 'granted'
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const constraints = {
        video: selectedCamera ? { deviceId: selectedCamera } : true,
        audio: videoSettings.audioEnabled ? 
          (videoSettings.microphoneDevice ? { deviceId: videoSettings.microphoneDevice } : true) : false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      setStream(newStream);
      setDevicePermissions({
        camera: true,
        microphone: videoSettings.audioEnabled
      });

      toast({
        title: "Permissions Granted",
        description: "Camera and microphone access enabled successfully"
      });
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast({
        title: "Permission Error",
        description: "Unable to access camera or microphone. Please check browser permissions.",
        variant: "destructive"
      });
    }
  };

  const startPreview = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const [width, height] = videoSettings.resolution.split('x').map(Number);
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: videoSettings.frameRate }
        },
        audio: videoSettings.audioEnabled ? {
          deviceId: videoSettings.microphoneDevice ? { exact: videoSettings.microphoneDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true
        } : false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      setStream(newStream);
      
      toast({
        title: "Preview Started",
        description: "Camera preview is now active with your selected settings"
      });
    } catch (error) {
      console.error('Error starting preview:', error);
      toast({
        title: "Preview Error",
        description: "Unable to start camera preview with current settings",
        variant: "destructive"
      });
    }
  };

  const stopPreview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startTestRecording = async () => {
    if (!stream) {
      toast({
        title: "No Stream",
        description: "Please start camera preview first",
        variant: "destructive"
      });
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setTestRecording(blob);
        setIsRecording(false);
        toast({
          title: "Test Recording Complete",
          description: "5-second test recording finished successfully"
        });
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Stop recording after 5 seconds
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);
      
      toast({
        title: "Test Recording Started",
        description: "Recording 5-second test video..."
      });
    } catch (error) {
      console.error('Error starting test recording:', error);
      toast({
        title: "Recording Error",
        description: "Unable to start test recording",
        variant: "destructive"
      });
    }
  };

  const playTestRecording = () => {
    if (testRecording) {
      const url = URL.createObjectURL(testRecording);
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.style.maxWidth = '100%';
      video.style.maxHeight = '300px';
      
      // Create a modal-like display
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '9999';
      
      const container = document.createElement('div');
      container.style.backgroundColor = 'white';
      container.style.padding = '20px';
      container.style.borderRadius = '8px';
      container.style.maxWidth = '80%';
      container.style.maxHeight = '80%';
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.marginTop = '10px';
      closeBtn.style.padding = '8px 16px';
      closeBtn.style.backgroundColor = '#3b82f6';
      closeBtn.style.color = 'white';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '4px';
      closeBtn.style.cursor = 'pointer';
      
      closeBtn.onclick = () => {
        document.body.removeChild(modal);
        URL.revokeObjectURL(url);
      };
      
      container.appendChild(video);
      container.appendChild(closeBtn);
      modal.appendChild(container);
      document.body.appendChild(modal);
      
      video.play();
    }
  };

  const saveSettings = () => {
    localStorage.setItem('cameraSettings', JSON.stringify({
      selectedCamera,
      videoSettings
    }));
    
    toast({
      title: "Settings Saved",
      description: "Camera setup preferences have been saved successfully"
    });
  };

  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('cameraSettings');
      if (saved) {
        const { selectedCamera: savedCamera, videoSettings: savedSettings } = JSON.parse(saved);
        setSelectedCamera(savedCamera);
        setVideoSettings(savedSettings);
        
        toast({
          title: "Settings Loaded",
          description: "Previously saved camera settings have been restored"
        });
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Camera Setup</h1>
              <p className="text-gray-600">Configure your video recording preferences</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={loadSavedSettings} variant="outline">
              Load Saved
            </Button>
            <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700">
              Save Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="devices" className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Devices</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span>Test</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-5 w-5" />
                    <span>Camera Devices</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Camera</label>
                    <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose camera device" />
                      </SelectTrigger>
                      <SelectContent>
                        {cameras.map((camera) => (
                          <SelectItem key={camera.deviceId} value={camera.deviceId}>
                            {camera.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Camera Permission</span>
                    <Badge variant={devicePermissions.camera ? "default" : "destructive"}>
                      {devicePermissions.camera ? "Granted" : "Not Granted"}
                    </Badge>
                  </div>
                  
                  {!devicePermissions.camera && (
                    <Button onClick={requestPermissions} className="w-full">
                      Request Camera Permission
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="h-5 w-5" />
                    <span>Audio Devices</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enable Audio Recording</span>
                    <Switch
                      checked={videoSettings.audioEnabled}
                      onCheckedChange={(checked) => 
                        setVideoSettings(prev => ({ ...prev, audioEnabled: checked }))
                      }
                    />
                  </div>
                  
                  {videoSettings.audioEnabled && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Microphone</label>
                      <Select 
                        value={videoSettings.microphoneDevice} 
                        onValueChange={(value) => 
                          setVideoSettings(prev => ({ ...prev, microphoneDevice: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose microphone device" />
                        </SelectTrigger>
                        <SelectContent>
                          {microphones.map((mic) => (
                            <SelectItem key={mic.deviceId} value={mic.deviceId}>
                              {mic.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Microphone Permission</span>
                    <Badge variant={devicePermissions.microphone ? "default" : "destructive"}>
                      {devicePermissions.microphone ? "Granted" : "Not Granted"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Video Quality</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Resolution</label>
                    <Select 
                      value={videoSettings.resolution} 
                      onValueChange={(value) => 
                        setVideoSettings(prev => ({ ...prev, resolution: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="640x480">640x480 (SD)</SelectItem>
                        <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                        <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                        <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Frame Rate: {videoSettings.frameRate} FPS
                    </label>
                    <Slider
                      value={[videoSettings.frameRate]}
                      onValueChange={(value) => 
                        setVideoSettings(prev => ({ ...prev, frameRate: value[0] }))
                      }
                      min={15}
                      max={60}
                      step={15}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recording Quality</label>
                    <Select 
                      value={videoSettings.quality} 
                      onValueChange={(value) => 
                        setVideoSettings(prev => ({ ...prev, quality: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Faster processing)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (Best quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recording Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recording Mode</label>
                    <Select 
                      value={videoSettings.recordingMode} 
                      onValueChange={(value) => 
                        setVideoSettings(prev => ({ ...prev, recordingMode: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Recording</SelectItem>
                        <SelectItem value="emergency">Emergency Mode</SelectItem>
                        <SelectItem value="evidence">Evidence Collection</SelectItem>
                        <SelectItem value="streaming">Live Streaming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Auto-start Recording</span>
                      <p className="text-xs text-gray-500">Start recording when camera activates</p>
                    </div>
                    <Switch
                      checked={videoSettings.autoStart}
                      onCheckedChange={(checked) => 
                        setVideoSettings(prev => ({ ...prev, autoStart: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Camera Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                    style={{ minHeight: '300px' }}
                  />
                </div>
                
                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={startPreview} 
                    disabled={!selectedCamera}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start Preview
                  </Button>
                  <Button 
                    onClick={stopPreview} 
                    variant="outline"
                    disabled={!stream}
                  >
                    Stop Preview
                  </Button>
                </div>
                
                {stream && (
                  <div className="text-center text-sm text-green-600">
                    ✓ Camera preview active with current settings
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Test Recording</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  {!stream && (
                    <p className="text-gray-600">Start camera preview first to enable test recording</p>
                  )}
                  
                  <Button 
                    onClick={startTestRecording} 
                    disabled={!stream || isRecording}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isRecording ? (
                      <>
                        <div className="h-4 w-4 mr-2 bg-red-500 rounded-full animate-pulse" />
                        Recording... ({Math.ceil((5000 - Date.now() % 5000) / 1000)}s)
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Start 5-Second Test
                      </>
                    )}
                  </Button>
                  
                  {testRecording && (
                    <div className="space-y-2">
                      <p className="text-green-600">✓ Test recording completed successfully</p>
                      <Button onClick={playTestRecording} variant="outline">
                        <Volume2 className="h-4 w-4 mr-2" />
                        Play Test Recording
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}