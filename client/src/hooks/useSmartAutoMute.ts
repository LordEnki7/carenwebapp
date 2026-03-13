import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioAnalysis {
  volume: number;
  frequency: number;
  backgroundNoise: number;
  voiceDetected: boolean;
  isPoliceVoice: boolean;
  isSuspiciousSound: boolean;
}

interface SmartMuteSettings {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  autoMuteThreshold: number;
  backgroundNoiseThreshold: number;
  voiceDetectionEnabled: boolean;
  policeVoiceDetection: boolean;
  suspiciousAudioDetection: boolean;
  muteTriggerPhrases: string[];
  emergencyOverride: boolean;
}

interface SmartMuteState {
  isMuted: boolean;
  isAnalyzing: boolean;
  currentAnalysis: AudioAnalysis | null;
  muteReason: string | null;
  confidenceLevel: number;
  audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
  lastMuteTime: number | null;
  totalMuteTime: number;
}

export function useSmartAutoMute() {
  const [settings, setSettings] = useState<SmartMuteSettings>({
    enabled: true,
    sensitivity: 'medium',
    autoMuteThreshold: 0.7,
    backgroundNoiseThreshold: 0.3,
    voiceDetectionEnabled: true,
    policeVoiceDetection: true,
    suspiciousAudioDetection: true,
    muteTriggerPhrases: [
      'turn off that device',
      'stop recording',
      'put that away',
      'give me your phone',
      'hand over the device',
      'shut it off',
      'turn it off'
    ],
    emergencyOverride: true
  });

  const [muteState, setMuteState] = useState<SmartMuteState>({
    isMuted: false,
    isAnalyzing: false,
    currentAnalysis: null,
    muteReason: null,
    confidenceLevel: 0,
    audioQuality: 'good',
    lastMuteTime: null,
    totalMuteTime: 0
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioBufferRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number>();
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const muteStartTimeRef = useRef<number | null>(null);

  // Initialize audio analysis
  const initializeAudioAnalysis = useCallback(async (stream: MediaStream) => {
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const audioContext = audioContextRef.current;

      // Create analyser
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Connect microphone
      microphoneRef.current = audioContext.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      // Create buffer for analysis
      const bufferLength = analyserRef.current.frequencyBinCount;
      audioBufferRef.current = new Float32Array(bufferLength);

      // Initialize speech recognition for trigger phrases
      if (settings.voiceDetectionEnabled && 'webkitSpeechRecognition' in window) {
        speechRecognitionRef.current = new webkitSpeechRecognition();
        speechRecognitionRef.current.continuous = true;
        speechRecognitionRef.current.interimResults = true;
        speechRecognitionRef.current.lang = 'en-US';

        speechRecognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('')
            .toLowerCase();

          checkForTriggerPhrases(transcript);
        };

        speechRecognitionRef.current.start();
      }

      // Start analysis loop
      startAnalysis();
      
      setMuteState(prev => ({ ...prev, isAnalyzing: true }));
      console.log('Smart auto-mute analysis initialized');
    } catch (error) {
      console.error('Failed to initialize audio analysis:', error);
    }
  }, [settings.voiceDetectionEnabled]);

  // Audio analysis loop
  const startAnalysis = useCallback(() => {
    const analyze = () => {
      if (!analyserRef.current || !audioBufferRef.current) return;

      // Get frequency data
      analyserRef.current.getFloatFrequencyData(audioBufferRef.current);
      
      // Calculate audio metrics
      const analysis = analyzeAudio(audioBufferRef.current);
      
      // Update state
      setMuteState(prev => ({
        ...prev,
        currentAnalysis: analysis,
        audioQuality: determineAudioQuality(analysis)
      }));

      // Check if muting is needed
      checkAutoMute(analysis);

      // Continue analysis
      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, []);

  // Analyze audio characteristics
  const analyzeAudio = (frequencyData: Float32Array): AudioAnalysis => {
    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const value = Math.pow(10, frequencyData[i] / 20); // Convert dB to linear
      sum += value * value;
    }
    const volume = Math.sqrt(sum / frequencyData.length);

    // Analyze frequency distribution
    const lowFreq = frequencyData.slice(0, 85).reduce((a, b) => a + b, 0) / 85; // 0-1kHz
    const midFreq = frequencyData.slice(85, 256).reduce((a, b) => a + b, 0) / 171; // 1-3kHz  
    const highFreq = frequencyData.slice(256, 512).reduce((a, b) => a + b, 0) / 256; // 3-8kHz

    // Detect voice characteristics (human voice typically 85Hz-255Hz fundamental)
    const voiceFreqRange = frequencyData.slice(10, 30); // Approximate voice range
    const voiceEnergy = voiceFreqRange.reduce((a, b) => a + b, 0) / voiceFreqRange.length;
    const voiceDetected = voiceEnergy > -40 && midFreq > -50; // Voice detection threshold

    // Background noise detection (consistent low-level noise)
    const backgroundNoise = lowFreq > -60 ? (lowFreq + 60) / 20 : 0; // Normalize to 0-1

    // Police voice detection (typically deeper, more authoritative)
    const isPoliceVoice = voiceDetected && lowFreq > midFreq && volume > 0.3;

    // Suspicious sound detection (sudden loud noises, sirens, etc.)
    const isSuspiciousSound = volume > 0.8 || (highFreq > -30 && volume > 0.5);

    return {
      volume: Math.min(volume, 1),
      frequency: midFreq,
      backgroundNoise: Math.min(backgroundNoise, 1),
      voiceDetected,
      isPoliceVoice,
      isSuspiciousSound
    };
  };

  // Check if auto-mute should be triggered
  const checkAutoMute = useCallback((analysis: AudioAnalysis) => {
    if (!settings.enabled || muteState.isMuted) return;

    let shouldMute = false;
    let reason = '';
    let confidence = 0;

    // Check background noise threshold
    if (analysis.backgroundNoise > settings.backgroundNoiseThreshold) {
      shouldMute = true;
      reason = 'High background noise detected';
      confidence = analysis.backgroundNoise;
    }

    // Check for police voice (if enabled)
    if (settings.policeVoiceDetection && analysis.isPoliceVoice) {
      shouldMute = true;
      reason = 'Police voice detected - protecting audio privacy';
      confidence = 0.8;
    }

    // Check for suspicious audio
    if (settings.suspiciousAudioDetection && analysis.isSuspiciousSound) {
      shouldMute = true;
      reason = 'Suspicious audio activity detected';
      confidence = 0.7;
    }

    // Apply sensitivity multiplier
    const sensitivityMultiplier = {
      low: 0.5,
      medium: 1.0,
      high: 1.5
    }[settings.sensitivity];

    if (shouldMute && confidence * sensitivityMultiplier >= settings.autoMuteThreshold) {
      triggerAutoMute(reason, confidence);
    }
  }, [settings, muteState.isMuted]);

  // Check for trigger phrases in speech
  const checkForTriggerPhrases = useCallback((transcript: string) => {
    if (!settings.voiceDetectionEnabled || muteState.isMuted) return;

    for (const phrase of settings.muteTriggerPhrases) {
      if (transcript.includes(phrase.toLowerCase())) {
        triggerAutoMute(`Trigger phrase detected: "${phrase}"`, 0.9);
        break;
      }
    }
  }, [settings.voiceDetectionEnabled, settings.muteTriggerPhrases, muteState.isMuted]);

  // Trigger auto-mute
  const triggerAutoMute = useCallback((reason: string, confidence: number) => {
    muteStartTimeRef.current = Date.now();
    
    setMuteState(prev => ({
      ...prev,
      isMuted: true,
      muteReason: reason,
      confidenceLevel: confidence,
      lastMuteTime: Date.now()
    }));

    console.log(`Auto-mute triggered: ${reason} (confidence: ${Math.round(confidence * 100)}%)`);

    // Auto-unmute after a delay (if not emergency override)
    if (!settings.emergencyOverride) {
      setTimeout(() => {
        autoUnmute();
      }, 5000); // 5 second auto-unmute
    }
  }, [settings.emergencyOverride]);

  // Auto-unmute
  const autoUnmute = useCallback(() => {
    if (muteStartTimeRef.current) {
      const muteTime = Date.now() - muteStartTimeRef.current;
      setMuteState(prev => ({
        ...prev,
        isMuted: false,
        muteReason: null,
        totalMuteTime: prev.totalMuteTime + muteTime
      }));
      muteStartTimeRef.current = null;
      console.log('Auto-unmute activated');
    }
  }, []);

  // Manual mute/unmute
  const toggleMute = useCallback(() => {
    if (muteState.isMuted) {
      autoUnmute();
    } else {
      triggerAutoMute('Manual mute activated', 1.0);
    }
  }, [muteState.isMuted, autoUnmute, triggerAutoMute]);

  // Emergency override unmute
  const emergencyUnmute = useCallback(() => {
    if (muteStartTimeRef.current) {
      const muteTime = Date.now() - muteStartTimeRef.current;
      setMuteState(prev => ({
        ...prev,
        isMuted: false,
        muteReason: null,
        totalMuteTime: prev.totalMuteTime + muteTime
      }));
      muteStartTimeRef.current = null;
      console.log('Emergency override: unmute activated');
    }
  }, []);

  // Determine audio quality
  const determineAudioQuality = (analysis: AudioAnalysis): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (analysis.backgroundNoise < 0.1 && analysis.volume > 0.3) return 'excellent';
    if (analysis.backgroundNoise < 0.2 && analysis.volume > 0.2) return 'good';
    if (analysis.backgroundNoise < 0.4 && analysis.volume > 0.1) return 'fair';
    return 'poor';
  };

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<SmartMuteSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    // State
    settings,
    muteState,
    
    // Actions
    initializeAudioAnalysis,
    toggleMute,
    emergencyUnmute,
    updateSettings,
    
    // Utilities
    isInitialized: muteState.isAnalyzing,
    audioQuality: muteState.audioQuality,
    currentAnalysis: muteState.currentAnalysis
  };
}