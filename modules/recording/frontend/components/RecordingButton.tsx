import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Square,
  Circle,
  Play,
  Pause,
  Clock,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { useRecording } from '../hooks/useRecording';
import { eventBus } from '../../../../src/core/EventBus';

interface RecordingButtonProps {
  mode?: 'video' | 'audio' | 'both';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'card';
  onRecordingStarted?: (recordingId: string, mode: string) => void;
  onRecordingStopped?: (recordingId: string, duration: number) => void;
  className?: string;
}

export default function RecordingButton({
  mode = 'both',
  size = 'lg',
  variant = 'button',
  onRecordingStarted,
  onRecordingStopped,
  className = ''
}: RecordingButtonProps) {
  const {
    isRecording,
    recordingMode,
    recordingStartTime,
    activeRecordingId,
    recordingDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error,
    isSupported
  } = useRecording();

  const [isPaused, setIsPaused] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Handle recording start
  const handleStartRecording = () => {
    if (!isRecording) {
      const recordingId = startRecording(mode);
      if (recordingId && onRecordingStarted) {
        onRecordingStarted(recordingId, mode);
      }
    } else {
      const duration = recordingDuration;
      stopRecording();
      if (activeRecordingId && onRecordingStopped) {
        onRecordingStopped(activeRecordingId, duration);
      }
    }
  };

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
      setIsPaused(false);
    } else {
      pauseRecording();
      setIsPaused(true);
    }
  };

  // Format duration display
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get recording status color
  const getStatusColor = () => {
    if (!isRecording) return 'bg-gray-500 hover:bg-gray-600';
    if (isPaused) return 'bg-yellow-600 hover:bg-yellow-700';
    return 'bg-red-600 hover:bg-red-700';
  };

  // Get recording status text
  const getStatusText = () => {
    if (!isRecording) return `Start ${mode === 'both' ? 'Recording' : mode === 'video' ? 'Video' : 'Audio'}`;
    if (isPaused) return 'Paused';
    return 'Recording...';
  };

  // Get mode icon
  const getModeIcon = () => {
    if (mode === 'video' || mode === 'both') {
      return isRecording ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />;
    }
    return isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />;
  };

  // Listen for emergency recording events
  useEffect(() => {
    const handleRecordingEvent = (event: any) => {
      console.log(`[RECORDING_BUTTON] Received event: ${event.type}`, event.payload);

      switch (event.type) {
        case 'recording.start':
        case 'recording.start.emergency':
          if (!isRecording) {
            handleStartRecording();
          }
          break;

        case 'recording.stop':
          if (isRecording) {
            handleStartRecording(); // This will stop if already recording
          }
          break;

        case 'recording.pause':
          if (isRecording && !isPaused) {
            handlePauseResume();
          }
          break;

        case 'recording.resume':
          if (isRecording && isPaused) {
            handlePauseResume();
          }
          break;

        default:
          break;
      }
    };

    eventBus.subscribe('recording.*', handleRecordingEvent);
    
    return () => {
      eventBus.unsubscribe('recording.*', handleRecordingEvent);
    };
  }, [isRecording, isPaused]);

  // Show error if not supported
  if (!isSupported) {
    return (
      <Card className={`${className} border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20`}>
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Recording not supported in this browser
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`${className} ${isRecording ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {getModeIcon()}
            Recording Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Status */}
          {isRecording && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <Badge className={`${getStatusColor().replace('hover:', '').replace('bg-', 'bg-')} text-white ${
                  isRecording && !isPaused ? 'animate-pulse' : ''
                }`}>
                  {isPaused ? 'Paused' : 'Recording'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mode:</span>
                <Badge variant="outline" className="capitalize">
                  {recordingMode}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(recordingDuration)}
                </Badge>
              </div>

              {/* Recording Progress (visual indicator) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{recordingDuration}s</span>
                </div>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isPaused ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((recordingDuration / 300) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recording Controls */}
          <div className="space-y-2">
            <Button
              onClick={handleStartRecording}
              size="lg"
              className={`w-full ${getStatusColor()} text-white font-semibold ${
                isRecording && !isPaused ? 'animate-pulse' : ''
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Circle className="w-5 h-5 mr-2" />
                  {getStatusText()}
                </>
              )}
            </Button>

            {/* Pause/Resume Button (only when recording) */}
            {isRecording && (
              <Button
                onClick={handlePauseResume}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Recording Info */}
          {isRecording && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3 h-3" />
                  <span>Saving to local storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Started: {recordingStartTime ? new Date(recordingStartTime).toLocaleTimeString() : '--'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-2 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Button variant
  return (
    <Button
      onClick={handleStartRecording}
      size={size}
      className={`${getStatusColor()} text-white font-semibold ${
        isRecording && !isPaused ? 'animate-pulse' : ''
      } ${className}`}
    >
      {isRecording ? (
        <>
          <Square className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
          Stop
        </>
      ) : (
        <>
          {getModeIcon()}
          <span className="ml-2">{getStatusText()}</span>
        </>
      )}
    </Button>
  );
}