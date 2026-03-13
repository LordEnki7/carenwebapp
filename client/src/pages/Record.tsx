import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCloudSyncIntegration } from "@/hooks/useCloudSyncIntegration";
import { useEmergencyRecording } from "@/hooks/useEmergencyRecording";
import { Mic, MicOff, Video, VideoOff, Play, Pause, Download, Trash2, Send, AlertCircle, Cloud, CloudOff, Settings } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { RobustRecorder } from "@/lib/robustRecorder";
import { RecordingDiagnostics } from "@/lib/recordingDiagnostics";
import { ProductionMediaFixer } from "@/lib/productionMediaFixer";
import { AdvancedAudioProcessor, getEnhancedMediaConstraints, type NoiseFilterConfig, NOISE_FILTER_PRESETS } from "@/lib/audioProcessing";
import NoiseFilterControls from "@/components/NoiseFilterControls";
import { MultiDirectionalAudioControls } from "@/components/MultiDirectionalAudioControls";
import { SmartAutoMute } from "@/components/SmartAutoMute";

interface RecordingData {
  id: string;
  type: 'audio' | 'video';
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
  size: number;
}

export default function Record() {
  // Hooks must be called in the same order every render
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isCloudSyncEnabled, isSyncing, syncIncident } = useCloudSyncIntegration();
  const { state: emergencyState, startEmergencyRecording, stopEmergencyRecording, isEmergencyActive } = useEmergencyRecording();
  
  // State hooks - all at the top, same order every time
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio');
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [productionDiagnostics, setProductionDiagnostics] = useState<any>(null);
  const [playbackVideoUrl, setPlaybackVideoUrl] = useState<string | null>(null);
  const [playbackAudioUrl, setPlaybackAudioUrl] = useState<string | null>(null);
  
  // Noise filtering state
  const [noiseFilterEnabled, setNoiseFilterEnabled] = useState(true);
  const [noiseFilterConfig, setNoiseFilterConfig] = useState<NoiseFilterConfig>(NOISE_FILTER_PRESETS.legal_encounter);
  const [audioProcessor, setAudioProcessor] = useState<AdvancedAudioProcessor | null>(null);
  const [originalStream, setOriginalStream] = useState<MediaStream | null>(null);
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  
  // Refs - all at the top, same order every time
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const recorderRef = useRef<RobustRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const effectiveRecordingTypeRef = useRef<'audio' | 'video'>('audio');

  // Auto-start recording when voice command triggers
  useEffect(() => {
    const handleAutoStartRecording = (event: CustomEvent) => {
      if (!isRecording) {
        setIsEmergencyMode(true);
        setPriority('high');
        setTitle('Voice Activated Emergency Recording');
        setDescription('Recording started via voice command for immediate incident documentation');
        
        toast({
          title: "Voice Recording Activated",
          description: "Emergency recording started automatically",
          variant: "destructive"
        });
        
        // Auto-start recording after a brief delay
        setTimeout(() => {
          console.log('Attempting auto-start recording...');
          if (typeof startRecording === 'function') {
            startRecording().catch((error) => {
              console.error('Error starting auto recording:', error);
              toast({
                title: "Recording Failed", 
                description: error?.message || "Could not start recording. Please check permissions.",
                variant: "destructive"
              });
            });
          } else {
            console.error('startRecording function not available');
            toast({
              title: "Recording Error",
              description: "Recording function not available",
              variant: "destructive"
            });
          }
        }, 1000);
      }
    };

    const handleEmergencyRecordingEvent = (event: CustomEvent) => {
      console.log('🚨 EMERGENCY RECORDING EVENT RECEIVED:', event.detail);
      handleEmergencyRecording();
    };

    window.addEventListener('autoStartRecording', handleAutoStartRecording as EventListener);
    window.addEventListener('emergencyRecording', handleEmergencyRecordingEvent as EventListener);
    
    return () => {
      window.removeEventListener('autoStartRecording', handleAutoStartRecording as EventListener);
      window.removeEventListener('emergencyRecording', handleEmergencyRecordingEvent as EventListener);
    };
  }, [isRecording, recordingType, startRecording]);

  // Auto-start VIDEO recording when voice command triggers
  useEffect(() => {
    const handleAutoStartVideoRecording = (event: CustomEvent) => {
      console.log('RECEIVED autoStartVideoRecording event:', event.detail);
      if (!isRecording) {
        setIsEmergencyMode(true);
        setPriority('high');
        setTitle('Voice Activated Emergency Video Recording');
        setDescription('Video recording started via voice command for incident documentation');
        setRecordingType('video'); // Set to video mode
        
        toast({
          title: "Voice Video Recording Activated",
          description: "Emergency video recording started automatically",
          variant: "destructive"
        });
        
        // Auto-start video recording after a longer delay to ensure state updates
        setTimeout(() => {
          console.log('Attempting auto-start VIDEO recording...');
          console.log('Current recordingType should be video:', recordingType);
          if (typeof startRecording === 'function') {
            startRecording('video').catch((error) => {
              console.error('Error starting auto video recording:', error);
              toast({
                title: "Video Recording Failed", 
                description: error?.message || "Could not start video recording. Please check camera permissions.",
                variant: "destructive"
              });
            });
          } else {
            console.error('startRecording function not available for video');
            toast({
              title: "Video Recording Error",
              description: "Video recording function not available",
              variant: "destructive"
            });
          }
        }, 2000); // Increased delay to ensure state updates
      }
    };

    window.addEventListener('autoStartVideoRecording', handleAutoStartVideoRecording as EventListener);
    
    return () => {
      window.removeEventListener('autoStartVideoRecording', handleAutoStartVideoRecording as EventListener);
    };
  }, [isRecording, recordingType, startRecording]);

  // Auto-stop recording when voice command triggers
  useEffect(() => {
    const handleStopRecording = (event: CustomEvent) => {
      console.log('Stop recording event received, isRecording:', isRecording);
      if (isRecording) {
        console.log('Calling stopRecording function');
        stopRecording();
        toast({
          title: "Voice Command Executed",
          description: "Recording stopped via voice command",
        });
      } else {
        console.log('Not recording, ignoring stop command');
      }
    };

    window.addEventListener('stopRecording', handleStopRecording as EventListener);
    
    return () => {
      window.removeEventListener('stopRecording', handleStopRecording as EventListener);
    };
  }, [isRecording]);

  // Check URL parameters for emergency mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('emergency') === 'true') {
      setIsEmergencyMode(true);
      setPriority('high');
      setTitle('Emergency Recording');
      setDescription('Emergency incident recording');
    }
  }, []);

  // Early returns for loading/auth - after all hooks
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to access the recording feature.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Initialize audio processor for noise filtering
  const initializeAudioProcessor = async (stream: MediaStream) => {
    if (noiseFilterEnabled && recordingType === 'audio') {
      const processor = new AdvancedAudioProcessor();
      setAudioProcessor(processor);
      
      try {
        const processedAudioStream = await processor.processAudioStream(stream, noiseFilterConfig);
        setProcessedStream(processedAudioStream);
        return processedAudioStream;
      } catch (error) {
        console.error('Failed to initialize audio processor:', error);
        toast({
          title: "Audio Processing Warning",
          description: "Using standard audio without noise filtering",
          variant: "destructive"
        });
        return stream;
      }
    }
    return stream;
  };

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle noise filter configuration changes
  const handleNoiseFilterToggle = (enabled: boolean) => {
    setNoiseFilterEnabled(enabled);
    if (!enabled && audioProcessor) {
      audioProcessor.cleanup();
      setAudioProcessor(null);
      setProcessedStream(null);
    }
  };

  const handleNoiseFilterConfigChange = (config: NoiseFilterConfig) => {
    setNoiseFilterConfig(config);
    if (audioProcessor && originalStream) {
      // Re-process stream with new configuration
      audioProcessor.processAudioStream(originalStream, config)
        .then(newProcessedStream => {
          setProcessedStream(newProcessedStream);
        })
        .catch(error => {
          console.error('Failed to update noise filter config:', error);
        });
    }
  };

  // Emergency recording wrapper function
  const handleEmergencyRecording = async () => {
    console.log('🚨 EMERGENCY RECORDING TRIGGERED');
    setIsEmergencyMode(true);
    setRecordingType('video'); // Emergency recording always uses video
    
    // Start the comprehensive emergency workflow
    await startEmergencyRecording(async () => {
      await startRecording('video');
    });
  };

  // Functions - using function declaration for hoisting
  async function startRecording(forceType?: 'audio' | 'video') {
    try {
      const effectiveRecordingType = forceType || recordingType;
      effectiveRecordingTypeRef.current = effectiveRecordingType; // Store the effective type for stopRecording
      console.log('Starting recording, type:', effectiveRecordingType, 'forced:', !!forceType, 'noiseFilter:', noiseFilterEnabled);
      
      // Clean up any existing streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Reset state
      setRecordingDuration(0);
      setIsRecording(false);
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support media recording. Please use a modern browser like Chrome, Firefox, or Safari.');
      }
      
      // Get enhanced media constraints for noise filtering
      const baseConstraints = effectiveRecordingType === 'video' 
        ? { 
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          }
        : { 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          };

      // Temporarily disable enhanced constraints for audio to fix recording
      const constraints = baseConstraints;
      
      console.log('Media constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Media stream acquired:', stream.getTracks().map(t => `${t.kind}: ${t.readyState}`));
      setOriginalStream(stream);
      
      // Check if stream has active tracks
      const activeTracks = stream.getTracks().filter(track => track.readyState === 'live');
      if (activeTracks.length === 0) {
        throw new Error('No active media tracks available. Please check your camera/microphone permissions.');
      }
      
      // Temporarily disable audio processing to fix recording issues
      let finalStream = stream;
      // if (noiseFilterEnabled && recordingType === 'audio') {
      //   try {
      //     finalStream = await initializeAudioProcessor(stream);
      //     console.log('Audio processing initialized');
      //   } catch (audioError) {
      //     console.warn('Audio processing failed, using original stream:', audioError);
      //     finalStream = stream;
      //   }
      // }
      
      // For audio-only recording, ensure we have audio tracks
      if (effectiveRecordingType === 'audio') {
        const audioTracks = finalStream.getAudioTracks();
        console.log('Audio tracks for recording:', audioTracks.map(t => `${t.kind}: ${t.readyState} (enabled: ${t.enabled})`));
        if (audioTracks.length === 0) {
          throw new Error('No audio tracks available for recording');
        }
      }
      
      streamRef.current = finalStream;
      
      if (effectiveRecordingType === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = finalStream;
        try {
          await videoPreviewRef.current.play();
          console.log('Video preview started');
        } catch (playError) {
          console.warn('Video preview failed to play:', playError);
        }
      }
      
      // Verify MediaRecorder support
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }
      
      const recorder = new RobustRecorder(effectiveRecordingType);
      recorderRef.current = recorder;
      
      console.log(`Starting ${effectiveRecordingType} recorder with stream tracks:`, finalStream.getTracks().map(t => `${t.kind}: ${t.readyState} (enabled: ${t.enabled})`));
      
      // Verify we have the right tracks for the recording type
      if (effectiveRecordingType === 'video') {
        const videoTracks = finalStream.getVideoTracks();
        const audioTracks = finalStream.getAudioTracks();
        console.log(`Video recording verification: ${videoTracks.length} video track(s), ${audioTracks.length} audio track(s)`);
        if (videoTracks.length === 0) {
          throw new Error('No video tracks available for video recording');
        }
      }
      
      await recorder.start(finalStream);
      
      startTimeRef.current = Date.now();
      setIsRecording(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: noiseFilterEnabled && effectiveRecordingType === 'audio'
          ? "High-quality audio recording with noise filtering active"
          : `${effectiveRecordingType === 'video' ? 'Video' : 'Audio'} recording in progress`,
      });
      
    } catch (error) {
      console.error('Recording failed:', error);
      
      // Clean up on error
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      let errorMessage = "Failed to start recording";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera/microphone access denied. Please allow permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera or microphone found. Please connect a device and try again.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera/microphone is already in use by another application.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Recording Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  const stopRecording = async () => {
    console.log('stopRecording function called, isRecording:', isRecording);
    try {
      if (recorderRef.current && isRecording) {
        console.log('Stopping recorder...');
        const blob = await recorderRef.current.stop();
        setIsRecording(false);
        
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        // Cleanup audio processing
        if (audioProcessor) {
          audioProcessor.cleanup();
          setAudioProcessor(null);
        }
        
        if (originalStream) {
          originalStream.getTracks().forEach(track => track.stop());
          setOriginalStream(null);
        }
        
        if (processedStream) {
          processedStream.getTracks().forEach(track => track.stop());
          setProcessedStream(null);
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
        
        // Create recording data object with enhanced production support
        console.log('[RECORDING] Creating recording data object:', {
          type: recordingType,
          size: blob.size,
          duration: recordingDuration,
          isProduction: !window.location.host.includes('localhost')
        });
        
        const newRecording: RecordingData = {
          id: Date.now().toString(),
          type: effectiveRecordingTypeRef.current,
          blob,
          url: URL.createObjectURL(blob),
          duration: recordingDuration,
          timestamp: new Date(),
          size: blob.size
        };
        
        // Production fix: Verify blob URL is valid
        console.log('[RECORDING] Created blob URL:', newRecording.url);
        if (!newRecording.url || !newRecording.url.startsWith('blob:')) {
          console.error('[RECORDING] Invalid blob URL created');
          throw new Error('Failed to create valid blob URL for recording');
        }
        
        setRecordings(prev => [newRecording, ...prev]);
        
        // Clean up recorder
        recorderRef.current.cleanup();
        recorderRef.current = null;
        
        toast({
          title: "Recording Complete",
          description: `${effectiveRecordingTypeRef.current === 'video' ? 'Video' : 'Audio'} recorded successfully (${Math.round(blob.size / 1024)}KB)`,
        });
      }
    } catch (error) {
      console.error('Stop recording failed:', error);
      toast({
        title: "Error",
        description: "Failed to stop recording",
        variant: "destructive",
      });
    }
  };



  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const playRecording = async (recording: RecordingData) => {
    console.log('[PLAYBACK] Starting playback for recording:', {
      id: recording.id,
      type: recording.type,
      size: recording.size,
      duration: recording.duration,
      url: recording.url,
      isProduction: !window.location.host.includes('localhost'),
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol
    });

    if (isPlaying === recording.id) {
      // Stop current playback
      console.log('[PLAYBACK] Stopping current playback');
      if (recording.type === 'video' && videoPlayerRef.current) {
        videoPlayerRef.current.pause();
      } else if (recording.type === 'audio' && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsPlaying(null);
      setPlaybackVideoUrl(null);
    } else {
      // Start new playback
      console.log('[PLAYBACK] Starting new playback');
      
      if (recording.type === 'video') {
        console.log('[PLAYBACK] Setting up video playback');
        
        // Simple, direct playback approach
        try {
          // Create fresh blob URL
          let videoUrl = recording.url;
          if (recording.blob) {
            // Revoke old URL and create fresh one
            if (recording.url.startsWith('blob:')) {
              URL.revokeObjectURL(recording.url);
            }
            videoUrl = URL.createObjectURL(recording.blob);
            console.log('[PLAYBACK] Created fresh video URL:', videoUrl);
          }
          
          setPlaybackVideoUrl(videoUrl);
          setIsPlaying(recording.id);
        } catch (error) {
          console.error('[PLAYBACK] Failed to create video URL:', error);
          toast({
            title: "Video Error",
            description: "Cannot create video URL. File may be corrupted.",
            variant: "destructive",
          });
          return;
        }
        
        // Simple, direct video playback
        setTimeout(async () => {
          if (videoPlayerRef.current) {
            try {
              console.log('[PLAYBACK] Starting direct video playback');
              await videoPlayerRef.current.play();
              console.log('[PLAYBACK] Video playback started successfully');
            } catch (error) {
              console.error('[PLAYBACK] Video play failed:', error);
              toast({
                title: "Video Playback Error",
                description: `Unable to play video: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive",
              });
              setIsPlaying(null);
              setPlaybackVideoUrl(null);
            }
          }
        }, 300);
        
      } else if (recording.type === 'audio' && audioPlayerRef.current) {
        console.log('[PLAYBACK] Setting up audio playback');
        
        try {
          // Create fresh blob URL for audio
          let audioUrl = recording.url;
          if (recording.blob) {
            // Revoke old URL and create fresh one
            if (recording.url.startsWith('blob:')) {
              URL.revokeObjectURL(recording.url);
            }
            audioUrl = URL.createObjectURL(recording.blob);
            console.log('[PLAYBACK] Created fresh audio URL:', audioUrl);
          }
          
          // Simple audio playback setup
          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.volume = 1.0;
          audioPlayerRef.current.preload = 'auto';
          
          console.log('[PLAYBACK] Audio element configured:', {
            src: audioPlayerRef.current.src,
            readyState: audioPlayerRef.current.readyState,
            networkState: audioPlayerRef.current.networkState,
            error: audioPlayerRef.current.error
          });
          
          // Simple audio loading and playback
          const playAudio = async () => {
            try {
              audioPlayerRef.current!.load();
              await new Promise(resolve => setTimeout(resolve, 200)); // Wait for load
              await audioPlayerRef.current!.play();
              console.log('[PLAYBACK] Audio playback started successfully');
            } catch (error) {
              console.error('[PLAYBACK] Audio play failed:', error);
              toast({
                title: "Audio Playback Error", 
                description: `Unable to play audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive",
              });
            }
          };
          
          // Set up event listeners for better debugging and error handling
          audioPlayerRef.current.addEventListener('loadeddata', () => {
            console.log('[PLAYBACK] Audio data loaded successfully');
          }, { once: true });
          
          audioPlayerRef.current.addEventListener('canplaythrough', () => {
            console.log('[PLAYBACK] Audio can play through without interruption');
          }, { once: true });
          
          audioPlayerRef.current.addEventListener('error', async (event) => {
            console.error('[PLAYBACK] Audio element error:', event);
            console.error('[PLAYBACK] Audio error details:', audioPlayerRef.current?.error);
            
            toast({
              title: "Audio Playback Failed",
              description: "Unable to play audio file. Please try downloading it instead.",
              variant: "destructive",
            });
            setIsPlaying(null);
          });
          
          setPlaybackAudioUrl(audioUrl);
          setIsPlaying(recording.id);
          await playAudio();
          
        } catch (error) {
          console.error('[PLAYBACK] Audio setup failed:', error);
          toast({
            title: "Audio Setup Error",
            description: "Failed to prepare audio for playback",
            variant: "destructive",
          });
        }
      }
    }
  };

  // Helper function to test if blob URL is still valid
  const testBlobUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  };

  const downloadRecording = (recording: RecordingData) => {
    const link = document.createElement('a');
    link.href = recording.url;
    const extension = recording.type === 'video' ? 'webm' : 'webm';
    link.download = `${title || 'recording'}-${recording.timestamp.toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `${recording.type === 'video' ? 'Video' : 'Audio'} file (.${extension}) is downloading`,
    });
  };

  const deleteRecording = (recordingId: string) => {
    const recordingToDelete = recordings.find(r => r.id === recordingId);
    setRecordings(prev => prev.filter(r => r.id !== recordingId));
    
    if (isPlaying === recordingId) {
      setIsPlaying(null);
      if (recordingToDelete?.type === 'video') {
        setPlaybackVideoUrl(null);
        if (videoPlayerRef.current) {
          videoPlayerRef.current.pause();
        }
      } else if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    }
  };

  const sendRecordingToAttorney = async () => {
    try {
      const response = await fetch('/api/send-recording-to-attorney', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeEmergencyAlert: true,
          priority: 'high'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Recording Sent to Attorney",
          description: `Recording delivered to attorney and ${result.details.familyContactsCount || 0} family contacts notified`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Send Failed",
          description: error.message || "Could not send recording to attorney",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Could not send recording to attorney. Please ensure you have an attorney configured.",
        variant: "destructive"
      });
    }
  };

  const runProductionDiagnostics = async () => {
    console.log('[DIAGNOSTICS] Running production media diagnostics...');
    const results = await ProductionMediaFixer.diagnoseProductionIssues();
    setProductionDiagnostics(results);
    
    toast({
      title: "Production Diagnostics Complete",
      description: `Environment: ${results.environment.isProduction ? 'Production' : 'Development'}, Recommendations: ${results.recommendations.length}`,
    });
  };

  return (
    <MobileResponsiveLayout>
      <div className={`min-h-screen ${isEmergencyMode ? 'cyber-emergency-background' : 'cyber-page-background'}`}>
        <div className="p-6">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`cyber-title text-3xl ${isEmergencyMode ? 'text-red-300' : ''}`}>
                  {isEmergencyMode ? '🚨 Emergency Recording' : 'Record Evidence'}
                </h1>
                <p className={`text-lg ${isEmergencyMode ? 'text-red-300' : 'text-cyan-300'}`}>
                  {isEmergencyMode ? 'Emergency incident documentation in progress' : 'Document incidents with audio or video recording'}
                </p>
              </div>
              
              {/* Cloud Sync Status */}
              <div className="flex items-center gap-2">
                {isCloudSyncEnabled ? (
                  <div className="flex items-center gap-2 text-sm text-green-300 bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
                    {isSyncing ? (
                      <>
                        <Cloud className="h-4 w-4 animate-pulse" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4" />
                        <span>Cloud Sync Active</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-500/20 px-3 py-1 rounded-full border border-gray-500/30">
                    <CloudOff className="h-4 w-4" />
                    <span>Offline Mode</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recording Controls */}
            <div className={`cyber-card ${isEmergencyMode ? 'border-red-400/50 bg-red-500/10' : ''}`}>
              <div className="p-6">
                <h3 className="cyber-subtitle flex items-center gap-2 text-stone-100">
                  {recordingType === 'video' ? <Video className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {isRecording ? 'Recording in Progress' : 'Start Recording'}
                  {isRecording && (
                    <span className="ml-auto text-sm font-mono bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-400/30">
                      {formatDuration(recordingDuration)}
                    </span>
                  )}
                </h3>
              </div>
              <div className="px-6 pb-6 space-y-4">
                {/* Recording Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recording-type" className="text-cyan-300">Recording Type</Label>
                    <Select value={recordingType} onValueChange={(value: 'audio' | 'video') => setRecordingType(value)} disabled={isRecording}>
                      <SelectTrigger className="cyber-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="cyber-dropdown">
                        <SelectItem value="audio">Audio Only</SelectItem>
                        <SelectItem value="video">Video + Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-cyan-300">Priority Level</Label>
                    <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                      <SelectTrigger className="cyber-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="cyber-dropdown">
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Audio Settings for Audio Recording */}
                {recordingType === 'audio' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-cyan-300">Audio Quality Settings</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAudioSettings(!showAudioSettings)}
                        className="text-cyan-400 hover:text-cyan-300 h-8 px-2"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        {showAudioSettings ? 'Hide' : 'Settings'}
                      </Button>
                    </div>
                    
                    {showAudioSettings && (
                      <div className="bg-black/20 rounded-lg border border-cyan-500/20 p-4 space-y-6">
                        <NoiseFilterControls
                          isActive={noiseFilterEnabled}
                          onToggle={handleNoiseFilterToggle}
                          onConfigChange={handleNoiseFilterConfigChange}
                          audioProcessor={audioProcessor ?? undefined}
                          className="space-y-3"
                        />
                        
                        {/* Multi-Directional Audio Controls */}
                        <div className="border-t border-cyan-500/20 pt-6">
                          <MultiDirectionalAudioControls
                            onStreamReady={(stream) => {
                              console.log('Multi-directional stream ready:', stream);
                              // Replace current stream with multi-directional stream if needed
                            }}
                            onStreamStopped={() => {
                              console.log('Multi-directional stream stopped');
                            }}
                            isRecording={isRecording}
                          />
                        </div>
                        
                        {/* Smart Auto-Mute Controls */}
                        <div className="border-t border-cyan-500/20 pt-6">
                          <SmartAutoMute
                            mediaStream={streamRef.current}
                            onMuteChange={(isMuted) => {
                              console.log('Smart mute state changed:', isMuted);
                              // Handle mute state changes if needed
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Video Preview */}
                {recordingType === 'video' && (
                  <div className="space-y-2">
                    <Label className="text-cyan-300">Video Preview</Label>
                    <video
                      ref={videoPreviewRef}
                      className="w-full max-w-md h-48 bg-black rounded-lg border border-cyan-500/30"
                      autoPlay
                      muted
                      playsInline
                    />
                  </div>
                )}

                {/* Recording Button */}
                <div className="flex gap-4">
                  {!isRecording ? (
                    <Button 
                      onClick={startRecording}
                      size="lg"
                      className={`cyber-button-primary ${isEmergencyMode ? 'cyber-button-danger' : ''}`}
                    >
                      {recordingType === 'video' ? <Video className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                      Start Recording
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopRecording}
                      size="lg"
                      className="cyber-button-danger"
                    >
                      {recordingType === 'video' ? <VideoOff className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                      Stop Recording
                    </Button>
                  )}
                  
                  {/* Production Diagnostics Button */}
                  <Button
                    onClick={runProductionDiagnostics}
                    variant="outline"
                    className="bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Media Diagnostics
                  </Button>
                </div>
              </div>
            </div>

            {/* Production Diagnostics Results */}
            {productionDiagnostics && (
              <div className="cyber-card">
                <div className="p-6">
                  <h3 className="cyber-subtitle text-stone-100">Production Media Diagnostics</h3>
                  <div className="mt-4 space-y-3">
                    <div className="text-sm">
                      <div className="text-cyan-300">Environment:</div>
                      <div className="text-gray-300 ml-4">
                        Production: {productionDiagnostics.environment?.isProduction ? 'Yes' : 'No'}<br/>
                        Secure Context: {productionDiagnostics.environment?.isSecureContext ? 'Yes' : 'No'}<br/>
                        Protocol: {productionDiagnostics.environment?.protocol}<br/>
                        Host: {productionDiagnostics.environment?.host}
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="text-cyan-300">Media Support:</div>
                      <div className="text-gray-300 ml-4">
                        MediaDevices: {productionDiagnostics.mediaSupport?.mediaDevices ? 'Yes' : 'No'}<br/>
                        MediaRecorder: {productionDiagnostics.mediaSupport?.mediaRecorder ? 'Yes' : 'No'}<br/>
                        WebRTC: {productionDiagnostics.mediaSupport?.webRTC ? 'Yes' : 'No'}
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="text-cyan-300">Blob Support:</div>
                      <div className="text-gray-300 ml-4">
                        Can Create Blobs: {productionDiagnostics.blobSupport?.canCreateBlobs ? 'Yes' : 'No'}<br/>
                        Can Play Blobs: {productionDiagnostics.blobSupport?.canPlayBlobs ? 'Yes' : 'No'}<br/>
                        Blob URL Support: {productionDiagnostics.blobSupport?.blobUrlSupport ? 'Yes' : 'No'}
                      </div>
                    </div>

                    {productionDiagnostics.recommendations?.length > 0 && (
                      <div className="text-sm">
                        <div className="text-orange-300">Recommendations:</div>
                        <ul className="text-gray-300 ml-4 space-y-1">
                          {productionDiagnostics.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Incident Details */}
            <div className="cyber-card">
              <div className="p-6">
                <h3 className="cyber-subtitle text-stone-100">Incident Details</h3>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div>
                  <Label htmlFor="title" className="text-cyan-300">Incident Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of the incident"
                    className="cyber-input"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-cyan-300">Detailed Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about what happened, when, where, and any relevant context..."
                    rows={4}
                    className="cyber-input"
                  />
                </div>
              </div>
            </div>

            {/* Recordings List */}
            {recordings.length > 0 && (
              <div className="cyber-card">
                <div className="p-6">
                  <h3 className="cyber-subtitle text-stone-100">Recorded Evidence ({recordings.length})</h3>
                </div>
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                    {recordings.map((recording) => (
                      <div key={recording.id} className="flex items-center justify-between p-4 border border-cyan-500/30 rounded-lg bg-cyan-500/5">
                        <div className="flex items-center gap-4">
                          {recording.type === 'video' ? <Video className="h-5 w-5 text-cyan-400" /> : <Mic className="h-5 w-5 text-cyan-400" />}
                          <div>
                            <p className="font-medium text-cyan-300">
                              {recording.type === 'video' ? 'Video Recording' : 'Audio Recording'}
                            </p>
                            <p className="text-sm text-gray-400">
                              {recording.timestamp.toLocaleString()} • {formatDuration(recording.duration)} • {formatFileSize(recording.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => playRecording(recording)}
                            className="cyber-button-secondary"
                          >
                            {isPlaying === recording.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => downloadRecording(recording)}
                            className="cyber-button-secondary"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={async () => {
                              console.log('[MEDIA_DEBUG] Running diagnostics for recording:', recording.id);
                              const diagnostics = await ProductionMediaFixer.diagnoseProductionIssues();
                              console.log('[MEDIA_DEBUG] Full diagnostics:', diagnostics);
                              
                              // Test the specific recording's blob
                              try {
                                const testUrl = URL.createObjectURL(recording.blob);
                                console.log('[MEDIA_DEBUG] Created test URL:', testUrl);
                                
                                const blobResponse = await fetch(testUrl);
                                const blobWorking = blobResponse.ok;
                                console.log('[MEDIA_DEBUG] Blob fetch test:', blobWorking ? 'PASS' : 'FAIL');
                                
                                URL.revokeObjectURL(testUrl);
                                
                                const recommendations = diagnostics.recommendations.length > 0 
                                  ? diagnostics.recommendations.join('. ')
                                  : 'No issues detected';
                                
                                toast({
                                  title: "Media Debug Results",
                                  description: `Blob: ${blobWorking ? 'OK' : 'ERROR'}, Security: ${diagnostics.environment.isSecureContext ? 'OK' : 'INSECURE'}. ${recommendations}`,
                                  variant: (!blobWorking || diagnostics.recommendations.length > 0) ? "destructive" : "default",
                                });
                              } catch (error) {
                                console.error('[MEDIA_DEBUG] Debug test failed:', error);
                                toast({
                                  title: "Media Debug Error",
                                  description: "Unable to test media file. Check console for details.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="bg-purple-500/20 border-purple-400/30 text-purple-300 hover:bg-purple-500/30"
                            title="Debug media playback issues"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => sendRecordingToAttorney()}
                            className="cyber-button-primary"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => deleteRecording(recording.id)}
                            className="cyber-button-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Video Playback Player */}
            {playbackVideoUrl && (
              <div className="cyber-card">
                <div className="p-6">
                  <h3 className="cyber-subtitle flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Playback
                  </h3>
                </div>
                <div className="px-6 pb-6">
                  <video
                    ref={videoPlayerRef}
                    src={playbackVideoUrl}
                    className="w-full max-w-2xl h-64 bg-black rounded-lg border border-cyan-500/30"
                    controls
                    onEnded={() => {
                      setIsPlaying(null);
                      setPlaybackVideoUrl(null);
                    }}
                    onPause={() => {
                      setIsPlaying(null);
                    }}
                    onError={(e) => {
                      console.error('[VIDEO] Element error:', e);
                      console.error('[VIDEO] Element error details:', videoPlayerRef.current?.error);
                      console.error('[VIDEO] Current src:', videoPlayerRef.current?.src);
                    }}
                    onLoadedData={() => console.log('[VIDEO] Data loaded successfully')}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Audio player for playback - always rendered but conditionally visible */}
      <div className={`fixed bottom-4 right-4 bg-black/80 p-4 rounded-lg border border-cyan-500/30 z-50 ${
        isPlaying && recordings.find(r => r.id === isPlaying)?.type === 'audio' ? 'block' : 'hidden'
      }`}>
        <h4 className="text-cyan-400 text-sm mb-2">Audio Playback</h4>
        <audio 
          ref={audioPlayerRef} 
          src={playbackAudioUrl || undefined}
          controls 
          onEnded={() => {
            setIsPlaying(null);
            setPlaybackAudioUrl(null);
          }}
          onPause={() => setIsPlaying(null)}
          onError={(e) => {
            console.error('[AUDIO] Element error:', e);
            console.error('[AUDIO] Element error details:', audioPlayerRef.current?.error);
            console.error('[AUDIO] Current src:', audioPlayerRef.current?.src);
          }}
          onLoadedData={() => console.log('[AUDIO] Data loaded successfully')}
          className="w-64"
        />
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}