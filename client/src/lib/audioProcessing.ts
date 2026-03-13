/**
 * ADVANCED AUDIO PROCESSING AND NOISE FILTERING SYSTEM
 * Real-time background noise suppression for legal encounters
 */

export interface AudioProcessingOptions {
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  noiseSuppression: boolean;
  sampleRate: number;
  channelCount: number;
  filterFrequency?: number;
  filterQ?: number;
}

export interface NoiseFilterConfig {
  enabled: boolean;
  aggressiveness: 'low' | 'medium' | 'high' | 'maximum';
  spectralSubtraction: boolean;
  adaptiveFiltering: boolean;
  frequencyGating: boolean;
  voiceActivityDetection: boolean;
}

export class AdvancedAudioProcessor {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private noiseGate: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private outputStream: MediaStream | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  async processAudioStream(
    inputStream: MediaStream, 
    config: NoiseFilterConfig
  ): Promise<MediaStream> {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }

    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    // Create audio processing chain
    this.sourceNode = this.audioContext.createMediaStreamSource(inputStream);
    this.gainNode = this.audioContext.createGain();
    this.highPassFilter = this.audioContext.createBiquadFilter();
    this.lowPassFilter = this.audioContext.createBiquadFilter();
    this.noiseGate = this.audioContext.createDynamicsCompressor();
    this.analyser = this.audioContext.createAnalyser();
    this.destination = this.audioContext.createMediaStreamDestination();

    // Configure high-pass filter (removes low-frequency noise)
    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.value = config.aggressiveness === 'maximum' ? 300 : 
                                         config.aggressiveness === 'high' ? 200 : 
                                         config.aggressiveness === 'medium' ? 150 : 100;
    this.highPassFilter.Q.value = 0.7;

    // Configure low-pass filter (removes high-frequency noise)
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.value = config.aggressiveness === 'maximum' ? 3500 : 
                                        config.aggressiveness === 'high' ? 4000 : 
                                        config.aggressiveness === 'medium' ? 4500 : 5000;
    this.lowPassFilter.Q.value = 0.7;

    // Configure noise gate/compressor (much gentler settings)
    this.noiseGate.threshold.value = config.aggressiveness === 'maximum' ? -45 : 
                                    config.aggressiveness === 'high' ? -50 : 
                                    config.aggressiveness === 'medium' ? -55 : -60;
    this.noiseGate.knee.value = 20; // Softer knee for gentler compression
    this.noiseGate.ratio.value = 4; // Much lower ratio (was 12)
    this.noiseGate.attack.value = 0.01; // Slower attack to preserve transients
    this.noiseGate.release.value = 0.5; // Slower release

    // Configure gain
    this.gainNode.gain.value = 1.2;

    // Configure analyser for voice activity detection
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Connect audio processing chain
    this.sourceNode
      .connect(this.highPassFilter)
      .connect(this.lowPassFilter)
      .connect(this.noiseGate)
      .connect(this.gainNode)
      .connect(this.analyser)
      .connect(this.destination);

    // Apply spectral subtraction if enabled
    if (config.spectralSubtraction) {
      this.applySpectralSubtraction();
    }

    // Apply voice activity detection if enabled
    if (config.voiceActivityDetection) {
      this.startVoiceActivityDetection();
    }

    this.outputStream = this.destination.stream;
    return this.outputStream;
  }

  private applySpectralSubtraction() {
    if (!this.audioContext || !this.analyser) return;

    // Create script processor for spectral subtraction
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    const noiseProfile = new Float32Array(bufferLength);
    let noiseProfileCaptured = false;
    let silenceCounter = 0;

    this.scriptProcessor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const outputBuffer = event.outputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      const outputData = outputBuffer.getChannelData(0);

      this.analyser!.getFloatFrequencyData(dataArray);

      // Capture noise profile during initial silence
      if (!noiseProfileCaptured && this.isLikelySilence(dataArray)) {
        silenceCounter++;
        if (silenceCounter > 50) { // ~1 second of silence
          noiseProfile.set(dataArray);
          noiseProfileCaptured = true;
          console.log('Noise profile captured');
        }
      }

      // Apply gentle spectral subtraction (much less aggressive)
      if (noiseProfileCaptured) {
        for (let i = 0; i < inputData.length; i++) {
          // Much gentler spectral subtraction to preserve voice quality
          const alpha = 0.5; // Reduced over-subtraction factor (was 2.0)
          const beta = 0.8; // Higher spectral floor to preserve more audio (was 0.01)
          
          // This is a simplified version - real spectral subtraction requires FFT
          outputData[i] = Math.max(
            inputData[i] - alpha * (noiseProfile[i % noiseProfile.length] || 0),
            beta * inputData[i]
          );
        }
      } else {
        // Pass through until noise profile is captured
        outputData.set(inputData);
      }
    };

    // Insert script processor into the chain
    if (this.gainNode && this.destination) {
      this.gainNode.disconnect(this.destination);
      this.gainNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.destination);
    }
  }

  private isLikelySilence(frequencyData: Float32Array): boolean {
    const averagePower = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
    return averagePower < -40; // Less aggressive silence threshold (was -60)
  }

  private startVoiceActivityDetection() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkVoiceActivity = () => {
      this.analyser!.getByteFrequencyData(dataArray);
      
      // Calculate energy in voice frequency range (300-3400 Hz)
      const voiceStart = Math.floor(300 * bufferLength / (this.audioContext!.sampleRate / 2));
      const voiceEnd = Math.floor(3400 * bufferLength / (this.audioContext!.sampleRate / 2));
      
      let voiceEnergy = 0;
      for (let i = voiceStart; i < voiceEnd; i++) {
        voiceEnergy += dataArray[i];
      }
      
      const averageVoiceEnergy = voiceEnergy / (voiceEnd - voiceStart);
      const isVoiceActive = averageVoiceEnergy > 30; // Threshold for voice activity
      
      // Adjust gain based on voice activity
      if (this.gainNode) {
        this.gainNode.gain.value = isVoiceActive ? 1.5 : 0.8;
      }
      
      requestAnimationFrame(checkVoiceActivity);
    };
    
    checkVoiceActivity();
  }

  adjustNoiseReduction(level: number) {
    if (this.highPassFilter && this.lowPassFilter && this.noiseGate) {
      // Adjust filter parameters based on level (0-100)
      const intensity = level / 100;
      
      this.highPassFilter.frequency.value = 100 + (intensity * 200);
      this.lowPassFilter.frequency.value = 5000 - (intensity * 1000);
      this.noiseGate.threshold.value = -50 + (intensity * 15);
    }
  }

  getAudioLevels(): { volume: number; quality: number } {
    if (!this.analyser) return { volume: 0, quality: 0 };

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const volume = Math.sqrt(sum / bufferLength) / 255;

    // Calculate quality (signal-to-noise ratio estimate)
    const signalBand = dataArray.slice(20, 100); // Voice frequencies
    const noiseBand = dataArray.slice(0, 10).concat(dataArray.slice(200, 220)); // Noise frequencies
    
    const signalLevel = signalBand.reduce((a, b) => a + b, 0) / signalBand.length;
    const noiseLevel = noiseBand.reduce((a, b) => a + b, 0) / noiseBand.length;
    
    const quality = Math.min(signalLevel / (noiseLevel + 1), 1);

    return { volume, quality };
  }

  cleanup() {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.destination) {
      this.destination.disconnect();
      this.destination = null;
    }
    
    this.outputStream = null;
  }
}

// Enhanced media constraints for noise filtering
export function getEnhancedMediaConstraints(config: NoiseFilterConfig): MediaStreamConstraints {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: config.enabled,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 1,
      // Advanced constraints for supported browsers
      ...(navigator.mediaDevices?.getSupportedConstraints?.() || {}),
      advanced: [
        {
          echoCancellation: true,
          noiseSuppression: config.enabled,
          autoGainControl: true
        }
      ]
    },
    video: false
  };
}

// Preset configurations for different scenarios
export const NOISE_FILTER_PRESETS: Record<string, NoiseFilterConfig> = {
  traffic: {
    enabled: true,
    aggressiveness: 'high',
    spectralSubtraction: true,
    adaptiveFiltering: true,
    frequencyGating: true,
    voiceActivityDetection: true
  },
  indoor: {
    enabled: true,
    aggressiveness: 'medium',
    spectralSubtraction: true,
    adaptiveFiltering: true,
    frequencyGating: false,
    voiceActivityDetection: true
  },
  quiet: {
    enabled: true,
    aggressiveness: 'low',
    spectralSubtraction: false,
    adaptiveFiltering: true,
    frequencyGating: false,
    voiceActivityDetection: false
  },
  maximum: {
    enabled: true,
    aggressiveness: 'maximum',
    spectralSubtraction: true,
    adaptiveFiltering: true,
    frequencyGating: true,
    voiceActivityDetection: true
  }
};