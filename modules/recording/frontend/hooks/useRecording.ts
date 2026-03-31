import { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus } from '../../../../src/core/EventBus';

interface RecordingHook {
  isRecording: boolean;
  recordingMode: RecordingMode;
  recordingStartTime: number | null;
  activeRecordingId: string | null;
  recordingDuration: number;
  startRecording: (mode: RecordingMode) => string;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  error: string | null;
  isSupported: boolean;
}

type RecordingMode = 'video' | 'audio' | 'both';

interface RecordingSession {
  id: string;
  mode: RecordingMode;
  startTime: number;
  duration: number;
  status: 'recording' | 'paused' | 'stopped';
  mediaRecorder?: MediaRecorder;
  stream?: MediaStream;
  chunks: Blob[];
}

export function useRecording(): RecordingHook {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('both');
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      const supported = hasMediaRecorder && hasGetUserMedia;
      setIsSupported(supported);
      
      if (!supported) {
        setError('Recording not supported in this browser');
        console.log('[RECORDING_MODULE] Recording not supported');
      } else {
        console.log('[RECORDING_MODULE] Recording supported');
      }
    };

    checkSupport();
  }, []);

  // Generate unique recording ID
  const generateRecordingId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `recording_${timestamp}_${random}`;
  };

  // Get media constraints based on recording mode
  const getMediaConstraints = (mode: RecordingMode): MediaStreamConstraints => {
    switch (mode) {
      case 'video':
        return {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: false
        };
      case 'audio':
        return {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          },
          video: false
        };
      case 'both':
        return {
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
        };
      default:
        return { audio: true, video: false };
    }
  };

  // Start recording
  const startRecording = useCallback(async (mode: RecordingMode): Promise<string> => {
    if (!isSupported) {
      setError('Recording not supported');
      return '';
    }

    if (isRecording) {
      console.log('[RECORDING_MODULE] Already recording, stopping current session');
      stopRecording();
      return activeRecordingId || '';
    }

    try {
      console.log(`[RECORDING_MODULE] Starting recording in ${mode} mode`);
      
      const recordingId = generateRecordingId();
      const constraints = getMediaConstraints(mode);
      
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
      });

      const session: RecordingSession = {
        id: recordingId,
        mode,
        startTime: Date.now(),
        duration: 0,
        status: 'recording',
        mediaRecorder,
        stream,
        chunks: []
      };

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          session.chunks.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('[RECORDING_MODULE] Recording stopped');
        
        const blob = new Blob(session.chunks, { 
          type: mediaRecorder.mimeType 
        });

        // Save recording
        saveRecording(recordingId, blob, mode);

        // Clean up stream
        stream.getTracks().forEach(track => track.stop());

        // Emit recording completed event
        eventBus.emit({
          type: 'recording.completed',
          module: '@caren/recording',
          payload: {
            recordingId,
            mode,
            duration: session.duration,
            size: blob.size,
            timestamp: Date.now()
          }
        });
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('[RECORDING_MODULE] Recording error:', event);
        setError(`Recording error: ${event.error?.message || 'Unknown error'}`);
        
        eventBus.emit({
          type: 'recording.error',
          module: '@caren/recording',
          payload: {
            recordingId,
            error: event.error?.message || 'Unknown error',
            timestamp: Date.now()
          }
        });
      };

      // Start recording
      mediaRecorder.start(1000); // Capture in 1-second chunks

      // Update state
      setCurrentSession(session);
      setIsRecording(true);
      setRecordingMode(mode);
      setActiveRecordingId(recordingId);
      setRecordingStartTime(Date.now());
      setRecordingDuration(0);
      setError(null);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const duration = Math.floor((now - session.startTime) / 1000);
        setRecordingDuration(duration);
        session.duration = duration;
      }, 1000);

      // Emit recording started event
      eventBus.emit({
        type: 'recording.started',
        module: '@caren/recording',
        payload: {
          recordingId,
          mode,
          timestamp: Date.now()
        }
      });

      console.log(`[RECORDING_MODULE] Recording started: ${recordingId}`);
      return recordingId;

    } catch (error: any) {
      console.error('[RECORDING_MODULE] Failed to start recording:', error);
      setError(`Failed to start recording: ${error.message}`);
      
      eventBus.emit({
        type: 'recording.start.failed',
        module: '@caren/recording',
        payload: {
          error: error.message,
          mode,
          timestamp: Date.now()
        }
      });

      return '';
    }
  }, [isSupported, isRecording, activeRecordingId]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording || !currentSession) {
      console.log('[RECORDING_MODULE] No active recording to stop');
      return;
    }

    console.log('[RECORDING_MODULE] Stopping recording');

    try {
      // Stop media recorder
      if (currentSession.mediaRecorder && currentSession.mediaRecorder.state !== 'inactive') {
        currentSession.mediaRecorder.stop();
      }

      // Stop stream tracks
      if (currentSession.stream) {
        currentSession.stream.getTracks().forEach(track => track.stop());
      }

      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Update state
      setIsRecording(false);
      setRecordingStartTime(null);
      setCurrentSession(null);

      // Emit recording stopped event
      eventBus.emit({
        type: 'recording.stopped',
        module: '@caren/recording',
        payload: {
          recordingId: activeRecordingId,
          duration: recordingDuration,
          timestamp: Date.now()
        }
      });

    } catch (error: any) {
      console.error('[RECORDING_MODULE] Error stopping recording:', error);
      setError(`Error stopping recording: ${error.message}`);
    }
  }, [isRecording, currentSession, activeRecordingId, recordingDuration]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!isRecording || !currentSession || !currentSession.mediaRecorder) {
      return;
    }

    if (currentSession.mediaRecorder.state === 'recording') {
      currentSession.mediaRecorder.pause();
      currentSession.status = 'paused';
      
      // Pause duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      eventBus.emit({
        type: 'recording.paused',
        module: '@caren/recording',
        payload: {
          recordingId: activeRecordingId,
          duration: recordingDuration,
          timestamp: Date.now()
        }
      });

      console.log('[RECORDING_MODULE] Recording paused');
    }
  }, [isRecording, currentSession, activeRecordingId, recordingDuration]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!isRecording || !currentSession || !currentSession.mediaRecorder) {
      return;
    }

    if (currentSession.mediaRecorder.state === 'paused') {
      currentSession.mediaRecorder.resume();
      currentSession.status = 'recording';
      
      // Resume duration timer
      durationIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const duration = Math.floor((now - currentSession.startTime) / 1000);
        setRecordingDuration(duration);
        currentSession.duration = duration;
      }, 1000);

      eventBus.emit({
        type: 'recording.resumed',
        module: '@caren/recording',
        payload: {
          recordingId: activeRecordingId,
          duration: recordingDuration,
          timestamp: Date.now()
        }
      });

      console.log('[RECORDING_MODULE] Recording resumed');
    }
  }, [isRecording, currentSession, activeRecordingId, recordingDuration]);

  // Save recording to local storage or IndexedDB
  const saveRecording = (recordingId: string, blob: Blob, mode: RecordingMode) => {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recording_${recordingId}.${mode === 'audio' ? 'wav' : 'webm'}`;
      
      // Auto-download for now (could be configurable)
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      URL.revokeObjectURL(url);

      console.log(`[RECORDING_MODULE] Recording saved: ${recordingId}`);
    } catch (error) {
      console.error('[RECORDING_MODULE] Failed to save recording:', error);
      setError('Failed to save recording');
    }
  };

  // Listen for external recording events
  useEffect(() => {
    const handleRecordingEvent = (event: any) => {
      console.log(`[RECORDING_MODULE] Received event: ${event.type}`, event.payload);

      switch (event.type) {
        case 'recording.start':
        case 'recording.start.emergency':
          const mode = event.payload.mode || 'both';
          startRecording(mode);
          break;

        case 'recording.stop':
          stopRecording();
          break;

        case 'recording.pause':
          pauseRecording();
          break;

        case 'recording.resume':
          resumeRecording();
          break;

        default:
          break;
      }
    };

    const eventTypes = [
      'recording.start',
      'recording.start.emergency',
      'recording.stop',
      'recording.pause',
      'recording.resume'
    ];

    eventTypes.forEach(eventType => {
      eventBus.subscribe(eventType, handleRecordingEvent);
    });

    return () => {
      eventTypes.forEach(eventType => {
        eventBus.unsubscribe(eventType, handleRecordingEvent);
      });
    };
  }, [startRecording, stopRecording, pauseRecording, resumeRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording, stopRecording]);

  return {
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
  };
}