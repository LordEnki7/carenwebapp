import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import { offlineStorage } from '@/services/OfflineStorageService';
import { 
  Shield, 
  Battery, 
  Wifi, 
  WifiOff, 
  Mic, 
  MicOff, 
  Phone, 
  AlertTriangle,
  Zap,
  HardDrive,
  Activity
} from 'lucide-react';

interface EmergencyRecording {
  id: string;
  startTime: number;
  duration: number;
  status: 'recording' | 'paused' | 'stopped';
  quality: 'low' | 'medium' | 'high';
  size: number;
}

export function FastEmergencyMode() {
  const { toast } = useToast();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [recording, setRecording] = useState<EmergencyRecording | null>(null);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [backgroundRecording, setBackgroundRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  const {
    isOnline,
    isLowPowerMode,
    batteryLevel,
    backgroundRecordingActive,
    emergencyModeActive,
    offlineCapabilities,
    enableEmergencyMode,
    disableEmergencyMode,
    enableBackgroundRecording,
    optimizeForBattery,
    preloadEmergencyAssets
  } = useMobilePerformance();

  // Initialize emergency mode on mount
  useEffect(() => {
    initializeEmergencyMode();
    return () => {
      cleanup();
    };
  }, []);

  // Monitor battery level for emergency optimizations
  useEffect(() => {
    if (batteryLevel < 20 && isEmergencyActive) {
      optimizeForBattery();
      toast({
        title: "Battery Optimization",
        description: "Low battery detected. Enabling power saving mode.",
        variant: "destructive"
      });
    }
  }, [batteryLevel, isEmergencyActive, optimizeForBattery]);

  const initializeEmergencyMode = async () => {
    try {
      // Initialize offline storage
      await offlineStorage.init();
      
      // Preload emergency assets with progress tracking
      const steps = [
        'Initializing storage...',
        'Loading legal rights...',
        'Caching emergency contacts...',
        'Preparing voice commands...',
        'Optimizing for mobile...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setPreloadProgress((i / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate loading
      }

      await preloadEmergencyAssets();
      await offlineStorage.preloadEmergencyData();
      
      setPreloadProgress(100);
      
      toast({
        title: "Emergency Mode Ready",
        description: "All emergency features preloaded and optimized",
      });
    } catch (error) {
      console.error('Failed to initialize emergency mode:', error);
      toast({
        title: "Initialization Warning",
        description: "Some features may be limited offline",
        variant: "destructive"
      });
    }
  };

  const startEmergencyMode = useCallback(async () => {
    try {
      setIsEmergencyActive(true);
      enableEmergencyMode();
      
      // Start background recording if not already active
      if (!backgroundRecordingActive) {
        await enableBackgroundRecording();
        setBackgroundRecording(true);
      }

      // Start immediate recording
      await startRecording();

      toast({
        title: "Emergency Mode Activated",
        description: "Recording started, emergency contacts notified",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Failed to start emergency mode:', error);
      toast({
        title: "Emergency Mode Error",
        description: "Failed to start recording. Check microphone permissions.",
        variant: "destructive"
      });
    }
  }, [enableEmergencyMode, backgroundRecordingActive, enableBackgroundRecording]);

  const stopEmergencyMode = useCallback(() => {
    try {
      setIsEmergencyActive(false);
      disableEmergencyMode();
      setBackgroundRecording(false);
      
      stopRecording();

      toast({
        title: "Emergency Mode Deactivated",
        description: "Recording saved securely. Stay safe.",
      });
    } catch (error) {
      console.error('Failed to stop emergency mode:', error);
    }
  }, [disableEmergencyMode]);

  const startRecording = async () => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Optimize for battery life in low power mode
          sampleRate: isLowPowerMode ? 22050 : 44100,
          channelCount: isLowPowerMode ? 1 : 2
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: isLowPowerMode ? 64000 : 128000
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      const recordingId = `emergency-${Date.now()}`;
      const startTime = Date.now();

      setRecording({
        id: recordingId,
        startTime,
        duration: 0,
        status: 'recording',
        quality: isLowPowerMode ? 'low' : 'high',
        size: 0
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Update recording info
          setRecording(prev => prev ? {
            ...prev,
            duration: Date.now() - startTime,
            size: audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0)
          } : null);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Store recording offline
        await offlineStorage.storeRecording({
          id: recordingId,
          blob: audioBlob,
          metadata: {
            timestamp: startTime,
            duration: Date.now() - startTime,
            emergency: true,
            batteryLevel,
            networkType: isOnline ? 'online' : 'offline'
          },
          emergency: true
        });

        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with periodic data collection for reliability
      mediaRecorderRef.current.start(1000); // Collect data every second

      // Update duration every second
      recordingIntervalRef.current = setInterval(() => {
        if (recording?.status === 'recording') {
          setRecording(prev => prev ? {
            ...prev,
            duration: Date.now() - startTime
          } : null);
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    setRecording(prev => prev ? { ...prev, status: 'stopped' } : null);
  };

  const cleanup = () => {
    stopRecording();
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Emergency Mode Header */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <Shield className="w-5 h-5" />
            Fast Emergency Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preload Progress */}
          {preloadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Loading emergency features...</span>
                <span>{Math.round(preloadProgress)}%</span>
              </div>
              <Progress value={preloadProgress} className="h-2" />
            </div>
          )}

          {/* System Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
              <Battery className="w-4 h-4" />
              <span className="text-sm">{batteryLevel}%</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm">
                {Object.values(offlineCapabilities).filter(Boolean).length}/4 Ready
              </span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
              <Activity className="w-4 h-4" />
              <span className="text-sm">
                {isLowPowerMode ? 'Power Save' : 'Full Power'}
              </span>
            </div>
          </div>

          {/* Emergency Controls */}
          <div className="flex gap-3">
            {!isEmergencyActive ? (
              <Button
                onClick={startEmergencyMode}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Start Emergency Mode
              </Button>
            ) : (
              <Button
                onClick={stopEmergencyMode}
                variant="outline"
                className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                size="lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Stop Emergency Mode
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              className="px-4"
            >
              <Phone className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recording Status */}
      {recording && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              {recording.status === 'recording' ? (
                <Mic className="w-5 h-5 animate-pulse" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
              Emergency Recording
              <Badge variant={recording.status === 'recording' ? 'destructive' : 'secondary'}>
                {recording.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Duration</div>
                <div className="font-mono">{formatDuration(recording.duration)}</div>
              </div>
              <div>
                <div className="text-gray-500">Quality</div>
                <div className="capitalize">{recording.quality}</div>
              </div>
              <div>
                <div className="text-gray-500">Size</div>
                <div>{formatSize(recording.size)}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="flex items-center gap-1">
                  {backgroundRecording && <Zap className="w-3 h-3 text-blue-500" />}
                  {isOnline ? 'Syncing' : 'Offline'}
                </div>
              </div>
            </div>

            {recording.status === 'recording' && (
              <div className="text-xs text-gray-500 italic">
                Recording continuously in background. Audio is being saved securely for your protection.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Offline Capabilities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Offline Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(offlineCapabilities).map(([key, available]) => (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  available 
                    ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <Badge variant={available ? 'default' : 'secondary'}>
                  {available ? 'Ready' : 'Limited'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Warnings */}
      {(batteryLevel < 20 || !isOnline) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800 dark:text-yellow-200">
                  Performance Notice
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {batteryLevel < 20 && "Low battery detected. Recording quality reduced to conserve power. "}
                  {!isOnline && "Offline mode active. Some features may be limited until connection is restored."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}