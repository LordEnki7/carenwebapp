import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Compass, 
  Radar,
  Settings,
  Play,
  Square,
  Target
} from 'lucide-react';
import { 
  MultiDirectionalAudioCapture, 
  DirectionalMicrophone, 
  SpatialAudioConfig 
} from '@/lib/multiDirectionalAudio';

interface MultiDirectionalAudioControlsProps {
  onStreamReady?: (stream: MediaStream) => void;
  onStreamStopped?: () => void;
  isRecording?: boolean;
}

export function MultiDirectionalAudioControls({ 
  onStreamReady, 
  onStreamStopped,
  isRecording = false 
}: MultiDirectionalAudioControlsProps) {
  const [isActive, setIsActive] = useState(false);
  const [microphones, setMicrophones] = useState<DirectionalMicrophone[]>([]);
  const [audioLevels, setAudioLevels] = useState<Map<string, number>>(new Map());
  const [config, setConfig] = useState<SpatialAudioConfig>({
    enableBeamforming: true,
    primaryDirection: 'front',
    adaptiveGain: true,
    noiseReduction: false, // Disabled for spatial accuracy
    spatialSeparation: true,
    recordingMode: 'surround'
  });
  
  const captureRef = useRef<MultiDirectionalAudioCapture | null>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize multi-directional capture system
    initializeCapture();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeCapture = async () => {
    try {
      console.log('Initializing multi-directional audio capture');
      captureRef.current = new MultiDirectionalAudioCapture(config);
      
      // Discover available microphones
      const discoveredMics = await captureRef.current.discoverAudioDevices();
      setMicrophones(discoveredMics);
      
      console.log('Multi-directional audio initialized with', discoveredMics.length, 'microphones');
    } catch (error) {
      console.error('Failed to initialize multi-directional audio:', error);
    }
  };

  const startCapture = async () => {
    if (!captureRef.current) return;
    
    try {
      console.log('Starting multi-directional capture');
      const stream = await captureRef.current.startMultiDirectionalCapture(microphones);
      setIsActive(true);
      
      // Start analytics monitoring
      startAnalytics();
      
      // Notify parent component
      if (onStreamReady) {
        onStreamReady(stream);
      }
      
      console.log('Multi-directional capture started');
    } catch (error) {
      console.error('Failed to start multi-directional capture:', error);
    }
  };

  const stopCapture = () => {
    if (!captureRef.current) return;
    
    console.log('Stopping multi-directional capture');
    captureRef.current.stopMultiDirectionalCapture();
    setIsActive(false);
    
    // Stop analytics
    if (analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current);
      analyticsIntervalRef.current = null;
    }
    
    // Clear audio levels
    setAudioLevels(new Map());
    
    // Notify parent component
    if (onStreamStopped) {
      onStreamStopped();
    }
    
    console.log('Multi-directional capture stopped');
  };

  const startAnalytics = () => {
    if (analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current);
    }
    
    analyticsIntervalRef.current = setInterval(() => {
      if (captureRef.current) {
        const analytics = captureRef.current.getDirectionalAnalytics();
        const levels = new Map<string, number>();
        
        analytics.forEach((data, id) => {
          // Convert dB to percentage for display
          const percentage = Math.max(0, Math.min(100, (data.level + 100) * 2));
          levels.set(id, percentage);
        });
        
        setAudioLevels(levels);
      }
    }, 100); // Update 10 times per second
  };

  const updateMicrophoneGain = (micId: string, gain: number) => {
    if (!captureRef.current) return;
    
    captureRef.current.updateDirectionalGain(micId, gain / 100);
    
    // Update local state
    setMicrophones(prev => prev.map(mic => 
      mic.id === micId ? { ...mic, gain: gain / 100 } : mic
    ));
  };

  const toggleMicrophone = (micId: string) => {
    setMicrophones(prev => prev.map(mic => 
      mic.id === micId ? { ...mic, enabled: !mic.enabled } : mic
    ));
  };

  const updateConfig = (newConfig: Partial<SpatialAudioConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    if (captureRef.current) {
      captureRef.current.updateConfig(updatedConfig);
    }
  };

  const cleanup = () => {
    if (analyticsIntervalRef.current) {
      clearInterval(analyticsIntervalRef.current);
    }
    
    if (captureRef.current) {
      captureRef.current.cleanup();
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'front': return '↑';
      case 'back': return '↓';
      case 'left': return '←';
      case 'right': return '→';
      default: return '●';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'front': return 'bg-blue-500';
      case 'back': return 'bg-red-500';
      case 'left': return 'bg-green-500';
      case 'right': return 'bg-yellow-500';
      default: return 'bg-purple-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card className="bg-black/40 border-cyan-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Radar className="w-5 h-5" />
            Multi-Directional Audio Capture
            <Badge variant="outline" className="text-cyan-400 border-cyan-500/50">
              {microphones.length} Mics
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={isActive ? stopCapture : startCapture}
              disabled={microphones.length === 0}
              className={`${
                isActive 
                  ? 'bg-red-600 hover:bg-red-700 border-red-500' 
                  : 'bg-green-600 hover:bg-green-700 border-green-500'
              } border`}
            >
              {isActive ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Capture
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Capture
                </>
              )}
            </Button>
            
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-green-600 text-white" : ""}
            >
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
            
            {isRecording && (
              <Badge className="bg-red-600 text-white animate-pulse">
                RECORDING
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Directional Microphones Control */}
      <Tabs defaultValue="microphones" className="space-y-4">
        <TabsList className="bg-black/40 border-cyan-500/30">
          <TabsTrigger value="microphones" className="text-cyan-400">
            <Mic className="w-4 h-4 mr-2" />
            Microphones
          </TabsTrigger>
          <TabsTrigger value="spatial" className="text-cyan-400">
            <Compass className="w-4 h-4 mr-2" />
            Spatial Audio
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-cyan-400">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="microphones">
          <div className="grid gap-4">
            {microphones.map((mic) => (
              <Card key={mic.id} className="bg-black/40 border-cyan-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getDirectionColor(mic.direction)}`} />
                      <span className="text-cyan-400 font-medium">{mic.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {getDirectionIcon(mic.direction)} {mic.direction}
                      </Badge>
                    </div>
                    
                    <Switch
                      checked={mic.enabled}
                      onCheckedChange={() => toggleMicrophone(mic.id)}
                      disabled={!isActive}
                    />
                  </div>
                  
                  {mic.enabled && (
                    <>
                      {/* Audio Level */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Volume2 className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-cyan-400">Audio Level</span>
                        </div>
                        <Progress 
                          value={audioLevels.get(mic.id) || 0} 
                          className="h-2"
                        />
                      </div>
                      
                      {/* Gain Control */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-cyan-400">Gain</span>
                          <span className="text-xs text-cyan-300">
                            {Math.round(mic.gain * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[mic.gain * 100]}
                          onValueChange={([value]) => updateMicrophoneGain(mic.id, value)}
                          max={200}
                          step={5}
                          disabled={!isActive}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="spatial">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Spatial Audio Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Beamforming */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-medium">Beamforming</span>
                  <p className="text-sm text-cyan-300">Focus on primary direction</p>
                </div>
                <Switch
                  checked={config.enableBeamforming}
                  onCheckedChange={(checked) => updateConfig({ enableBeamforming: checked })}
                />
              </div>

              {/* Primary Direction */}
              <div>
                <span className="text-cyan-400 font-medium mb-2 block">Primary Direction</span>
                <div className="grid grid-cols-2 gap-2">
                  {['front', 'back', 'left', 'right', 'auto'].map((direction) => (
                    <Button
                      key={direction}
                      variant={config.primaryDirection === direction ? "default" : "outline"}
                      onClick={() => updateConfig({ primaryDirection: direction as any })}
                      className={`text-xs ${
                        config.primaryDirection === direction 
                          ? 'bg-cyan-600 border-cyan-500' 
                          : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                      }`}
                    >
                      <Target className="w-3 h-3 mr-1" />
                      {direction.charAt(0).toUpperCase() + direction.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recording Mode */}
              <div>
                <span className="text-cyan-400 font-medium mb-2 block">Recording Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { mode: 'surround', label: 'Surround (5.1)', channels: 6 },
                    { mode: 'focused', label: 'Focused Stereo', channels: 2 },
                    { mode: 'stereo', label: 'Standard Stereo', channels: 2 },
                    { mode: 'mono', label: 'Mono', channels: 1 }
                  ].map(({ mode, label, channels }) => (
                    <Button
                      key={mode}
                      variant={config.recordingMode === mode ? "default" : "outline"}
                      onClick={() => updateConfig({ recordingMode: mode as any })}
                      className={`text-xs ${
                        config.recordingMode === mode 
                          ? 'bg-cyan-600 border-cyan-500' 
                          : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                      }`}
                    >
                      {label}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {channels}ch
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Spatial Separation */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-medium">Spatial Separation</span>
                  <p className="text-sm text-cyan-300">3D audio positioning</p>
                </div>
                <Switch
                  checked={config.spatialSeparation}
                  onCheckedChange={(checked) => updateConfig({ spatialSeparation: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-black/40 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Audio Processing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-medium">Adaptive Gain Control</span>
                  <p className="text-sm text-cyan-300">Automatic level adjustment</p>
                </div>
                <Switch
                  checked={config.adaptiveGain}
                  onCheckedChange={(checked) => updateConfig({ adaptiveGain: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-medium">Noise Reduction</span>
                  <p className="text-sm text-cyan-300">Background noise filtering</p>
                </div>
                <Switch
                  checked={config.noiseReduction}
                  onCheckedChange={(checked) => updateConfig({ noiseReduction: checked })}
                />
              </div>

              {/* Channel Count Display */}
              <div className="pt-4 border-t border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-medium">Output Channels</span>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-500/50">
                    {captureRef.current?.getOutputChannelCount() || 2} channels
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}