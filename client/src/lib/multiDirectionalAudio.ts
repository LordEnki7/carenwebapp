/**
 * MULTI-DIRECTIONAL AUDIO CAPTURING SYSTEM
 * Advanced spatial audio recording with directional microphone arrays
 */

export interface DirectionalMicrophone {
  id: string;
  label: string;
  direction: 'front' | 'back' | 'left' | 'right' | 'omnidirectional';
  enabled: boolean;
  gain: number;
  deviceId?: string;
  constraints: MediaTrackConstraints;
}

export interface SpatialAudioConfig {
  enableBeamforming: boolean;
  primaryDirection: 'front' | 'back' | 'left' | 'right' | 'auto';
  adaptiveGain: boolean;
  noiseReduction: boolean;
  spatialSeparation: boolean;
  recordingMode: 'surround' | 'focused' | 'stereo' | 'mono';
}

export interface AudioSource {
  stream: MediaStream;
  direction: string;
  context: AudioContext;
  analyser: AnalyserNode;
  gainNode: GainNode;
  pannerNode?: PannerNode;
  sourceNode: MediaStreamAudioSourceNode;
}

export class MultiDirectionalAudioCapture {
  private audioContext: AudioContext | null = null;
  private sources: Map<string, AudioSource> = new Map();
  private destination: MediaStreamAudioDestinationNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private masterGain: GainNode | null = null;
  private config: SpatialAudioConfig;
  private availableDevices: MediaDeviceInfo[] = [];
  
  constructor(config: SpatialAudioConfig) {
    this.config = config;
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Create audio processing nodes
      this.destination = this.audioContext.createMediaStreamDestination();
      this.masterGain = this.audioContext.createGain();
      
      // Configure for multi-channel output
      const channelCount = this.getChannelCountForMode(this.config.recordingMode);
      this.merger = this.audioContext.createChannelMerger(channelCount);
      
      // Connect processing chain
      this.masterGain.connect(this.merger);
      this.merger.connect(this.destination);
      
      console.log('Multi-directional audio context initialized');
    } catch (error) {
      console.error('Failed to initialize multi-directional audio context:', error);
    }
  }

  private getChannelCountForMode(mode: string): number {
    switch (mode) {
      case 'surround': return 6; // 5.1 surround
      case 'focused': return 2; // Stereo focused
      case 'stereo': return 2; // Standard stereo
      case 'mono': return 1; // Single channel
      default: return 2;
    }
  }

  async discoverAudioDevices(): Promise<DirectionalMicrophone[]> {
    try {
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get available audio input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices.filter(device => device.kind === 'audioinput');
      
      console.log('Discovered audio devices:', this.availableDevices.length);
      
      // Create directional microphone configurations
      const directionalMics: DirectionalMicrophone[] = [];
      
      // If multiple devices available, assign directions
      if (this.availableDevices.length >= 4) {
        // Full 4-direction setup
        directionalMics.push(
          this.createDirectionalMic('front', 'Front Microphone', this.availableDevices[0]),
          this.createDirectionalMic('back', 'Back Microphone', this.availableDevices[1]),
          this.createDirectionalMic('left', 'Left Microphone', this.availableDevices[2]),
          this.createDirectionalMic('right', 'Right Microphone', this.availableDevices[3])
        );
      } else if (this.availableDevices.length >= 2) {
        // Front/back stereo setup
        directionalMics.push(
          this.createDirectionalMic('front', 'Front Microphone', this.availableDevices[0]),
          this.createDirectionalMic('back', 'Back Microphone', this.availableDevices[1])
        );
      } else {
        // Single omnidirectional microphone
        directionalMics.push(
          this.createDirectionalMic('omnidirectional', 'Primary Microphone', this.availableDevices[0])
        );
      }
      
      return directionalMics;
    } catch (error) {
      console.error('Failed to discover audio devices:', error);
      // Fallback to default device
      return [this.createDirectionalMic('omnidirectional', 'Default Microphone')];
    }
  }

  private createDirectionalMic(
    direction: DirectionalMicrophone['direction'], 
    label: string, 
    device?: MediaDeviceInfo
  ): DirectionalMicrophone {
    return {
      id: `mic-${direction}-${Date.now()}`,
      label,
      direction,
      enabled: true,
      gain: 1.0,
      deviceId: device?.deviceId,
      constraints: this.getConstraintsForDirection(direction, device?.deviceId)
    };
  }

  private getConstraintsForDirection(direction: string, deviceId?: string): MediaTrackConstraints {
    const baseConstraints: MediaTrackConstraints = {
      echoCancellation: false, // Disable for spatial accuracy
      noiseSuppression: this.config.noiseReduction,
      autoGainControl: this.config.adaptiveGain,
      sampleRate: 48000, // High quality for spatial processing
      channelCount: 1 // Mono per direction
    };

    if (deviceId) {
      baseConstraints.deviceId = { exact: deviceId };
    }

    // Direction-specific optimizations
    switch (direction) {
      case 'front':
        return {
          ...baseConstraints,
          // Optimize for voice pickup
          echoCancellation: false,
          noiseSuppression: false
        };
      case 'back':
        return {
          ...baseConstraints,
          // Optimize for ambient sound
          autoGainControl: true
        };
      case 'left':
      case 'right':
        return {
          ...baseConstraints,
          // Optimize for side pickup
          sampleRate: 48000
        };
      default:
        return baseConstraints;
    }
  }

  async startMultiDirectionalCapture(microphones: DirectionalMicrophone[]): Promise<MediaStream> {
    if (!this.audioContext || !this.destination || !this.merger) {
      throw new Error('Audio context not initialized');
    }

    console.log('Starting multi-directional capture with', microphones.length, 'microphones');
    
    // Clear existing sources
    this.sources.clear();
    
    let channelIndex = 0;
    
    for (const mic of microphones.filter(m => m.enabled)) {
      try {
        console.log(`Initializing ${mic.direction} microphone:`, mic.label);
        
        // Get media stream for this microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: mic.constraints
        });
        
        // Create audio processing chain for this direction
        const sourceNode = this.audioContext.createMediaStreamSource(stream);
        const gainNode = this.audioContext.createGain();
        const analyser = this.audioContext.createAnalyser();
        
        // Configure gain
        gainNode.gain.value = mic.gain;
        
        // Configure analyser
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        
        // Create spatial panner for 3D positioning
        let pannerNode: PannerNode | undefined;
        if (this.config.spatialSeparation && mic.direction !== 'omnidirectional') {
          pannerNode = this.audioContext.createPanner();
          this.configureSpatialPosition(pannerNode, mic.direction);
        }
        
        // Connect audio processing chain
        sourceNode.connect(gainNode);
        gainNode.connect(analyser);
        
        if (pannerNode) {
          analyser.connect(pannerNode);
          pannerNode.connect(this.merger, 0, channelIndex);
        } else {
          analyser.connect(this.merger, 0, channelIndex);
        }
        
        // Store source for management
        const audioSource: AudioSource = {
          stream,
          direction: mic.direction,
          context: this.audioContext,
          analyser,
          gainNode,
          pannerNode,
          sourceNode
        };
        
        this.sources.set(mic.id, audioSource);
        
        console.log(`${mic.direction} microphone initialized on channel ${channelIndex}`);
        channelIndex++;
        
      } catch (error) {
        console.error(`Failed to initialize ${mic.direction} microphone:`, error);
      }
    }
    
    if (this.sources.size === 0) {
      throw new Error('No microphones could be initialized');
    }
    
    // Apply beamforming if enabled
    if (this.config.enableBeamforming) {
      this.applyBeamforming();
    }
    
    console.log(`Multi-directional capture started with ${this.sources.size} sources`);
    return this.destination.stream;
  }

  private configureSpatialPosition(panner: PannerNode, direction: string): void {
    // Configure 3D audio positioning
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'linear';
    panner.maxDistance = 10;
    panner.rolloffFactor = 1;
    
    // Set position based on direction
    switch (direction) {
      case 'front':
        panner.setPosition(0, 0, -1);
        break;
      case 'back':
        panner.setPosition(0, 0, 1);
        break;
      case 'left':
        panner.setPosition(-1, 0, 0);
        break;
      case 'right':
        panner.setPosition(1, 0, 0);
        break;
      default:
        panner.setPosition(0, 0, 0);
    }
    
    // Set listener orientation (user facing forward)
    const listener = panner.context.listener;
    if (listener.setOrientation) {
      listener.setOrientation(0, 0, -1, 0, 1, 0);
    }
  }

  private applyBeamforming(): void {
    console.log('Applying beamforming for direction:', this.config.primaryDirection);
    
    // Adjust gains based on primary direction
    this.sources.forEach((source, id) => {
      const isPrimaryDirection = source.direction === this.config.primaryDirection || 
                                this.config.primaryDirection === 'auto';
      
      if (isPrimaryDirection) {
        source.gainNode.gain.value = 1.2; // Boost primary direction
      } else {
        source.gainNode.gain.value = 0.6; // Reduce other directions
      }
    });
  }

  updateDirectionalGain(microphoneId: string, gain: number): void {
    const source = this.sources.get(microphoneId);
    if (source) {
      source.gainNode.gain.value = Math.max(0, Math.min(2, gain));
      console.log(`Updated gain for ${source.direction}: ${gain}`);
    }
  }

  getDirectionalAnalytics(): Map<string, { direction: string; level: number; frequency: Float32Array }> {
    const analytics = new Map<string, { direction: string; level: number; frequency: Float32Array }>();
    
    this.sources.forEach((source, id) => {
      const bufferLength = source.analyser.frequencyBinCount;
      const frequencyData = new Float32Array(bufferLength);
      source.analyser.getFloatFrequencyData(frequencyData);
      
      // Calculate average level
      const level = frequencyData.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      analytics.set(id, {
        direction: source.direction,
        level: Math.max(-100, level), // Clamp to reasonable dB range
        frequency: frequencyData
      });
    });
    
    return analytics;
  }

  stopMultiDirectionalCapture(): void {
    console.log('Stopping multi-directional capture');
    
    // Stop all audio streams
    this.sources.forEach((source, id) => {
      source.stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${source.direction} audio track`);
      });
    });
    
    this.sources.clear();
    console.log('Multi-directional capture stopped');
  }

  getOutputChannelCount(): number {
    return this.merger?.numberOfInputs || 2;
  }

  updateConfig(newConfig: Partial<SpatialAudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Updated multi-directional audio config:', this.config);
    
    // Reapply beamforming if needed
    if (this.sources.size > 0 && this.config.enableBeamforming) {
      this.applyBeamforming();
    }
  }

  cleanup(): void {
    this.stopMultiDirectionalCapture();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      console.log('Multi-directional audio context closed');
    }
  }
}