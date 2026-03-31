// Direct stream recording without MediaRecorder
export class DirectRecorder {
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingType: 'audio' | 'video';
  private isRecording: boolean = false;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private recordedSamples: Float32Array[] = [];
  private sampleRate: number = 44100;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private frameInterval: number | null = null;
  private frames: ImageData[] = [];

  constructor(type: 'audio' | 'video') {
    this.recordingType = type;
    this.chunks = [];
    this.recordedSamples = [];
    this.frames = [];
  }

  async start(mediaStream: MediaStream): Promise<void> {
    this.stream = mediaStream;
    this.chunks = [];
    this.recordedSamples = [];
    this.frames = [];
    
    console.log(`Direct ${this.recordingType} recorder: Starting with tracks:`, 
      mediaStream.getTracks().map(t => `${t.kind}: ${t.readyState} (${t.enabled ? 'enabled' : 'disabled'})`));
    
    if (this.recordingType === 'audio') {
      await this.startAudioCapture(mediaStream);
    } else {
      await this.startVideoCapture(mediaStream);
    }
    
    this.isRecording = true;
    console.log(`Direct ${this.recordingType} recorder: Started successfully`);
  }

  private async startAudioCapture(stream: MediaStream): Promise<void> {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No audio tracks available');
    }

    console.log('Direct audio: Setting up Web Audio API capture...');
    
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    
    // Use larger buffer size for better compatibility
    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    this.processor.onaudioprocess = (event) => {
      if (!this.isRecording) return;
      
      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      
      // Copy the data to avoid buffer reuse issues
      const samples = new Float32Array(inputData.length);
      samples.set(inputData);
      this.recordedSamples.push(samples);
      
      // Log every 100 chunks to track progress
      if (this.recordedSamples.length % 100 === 0) {
        console.log('Direct audio: Captured', this.recordedSamples.length, 'audio chunks');
      }
    };
    
    this.mediaStreamSource.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    
    console.log('Direct audio: Web Audio capture initialized');
  }

  private async startVideoCapture(stream: MediaStream): Promise<void> {
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      throw new Error('No video tracks available');
    }

    console.log('Direct video: Setting up canvas capture...');
    
    // Create video element to play the stream
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = stream;
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    
    // Wait for video to load
    await new Promise<void>((resolve) => {
      this.videoElement!.onloadedmetadata = () => {
        resolve();
      };
    });
    
    // Create canvas for frame capture
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.videoElement.videoWidth || 640;
    this.canvas.height = this.videoElement.videoHeight || 480;
    this.context = this.canvas.getContext('2d')!;
    
    console.log('Direct video: Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
    
    // Capture frames at 10 FPS
    this.frameInterval = window.setInterval(() => {
      if (!this.isRecording || !this.videoElement || !this.context) return;
      
      try {
        // Draw current video frame to canvas
        this.context.drawImage(this.videoElement, 0, 0, this.canvas!.width, this.canvas!.height);
        
        // Capture frame data
        const imageData = this.context.getImageData(0, 0, this.canvas!.width, this.canvas!.height);
        this.frames.push(imageData);
        
        if (this.frames.length % 30 === 0) {
          console.log('Direct video: Captured', this.frames.length, 'video frames');
        }
      } catch (error) {
        console.error('Direct video: Frame capture error:', error);
      }
    }, 100); // 10 FPS
    
    console.log('Direct video: Frame capture initialized');
  }

  stop(): Promise<Blob> {
    this.isRecording = false;
    console.log(`Direct ${this.recordingType} recorder: Stopping...`);
    
    if (this.recordingType === 'audio') {
      return this.stopAudioCapture();
    } else {
      return this.stopVideoCapture();
    }
  }

  private async stopAudioCapture(): Promise<Blob> {
    console.log('Direct audio: Processing', this.recordedSamples.length, 'audio chunks');
    
    // Clean up Web Audio API immediately
    try {
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }
      if (this.mediaStreamSource) {
        this.mediaStreamSource.disconnect();
        this.mediaStreamSource = null;
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
        this.audioContext = null;
      }
    } catch (error) {
      console.warn('Direct audio: Cleanup error:', error);
    }
    
    // Clean up stream tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    if (this.recordedSamples.length === 0) {
      console.warn('Direct audio: No audio samples captured');
      return new Blob([''], { type: 'audio/wav' });
    }
    
    // Combine all samples
    const totalSamples = this.recordedSamples.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedSamples = new Float32Array(totalSamples);
    let offset = 0;
    
    for (const chunk of this.recordedSamples) {
      combinedSamples.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log('Direct audio: Creating WAV from', totalSamples, 'samples');
    
    // Create WAV file
    const wavBlob = this.createWavBlob(combinedSamples, this.sampleRate);
    console.log('Direct audio: Created WAV blob:', wavBlob.size, 'bytes');
    
    return wavBlob;
  }

  private async stopVideoCapture(): Promise<Blob> {
    console.log('Direct video: Processing', this.frames.length, 'video frames');
    
    // Stop frame capture
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    
    // Clean up stream tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    if (this.frames.length === 0) {
      console.warn('Direct video: No video frames captured');
      return new Blob([''], { type: 'video/webm' });
    }
    
    // Create animated GIF from frames as a fallback since MediaRecorder isn't reliable
    console.log('Direct video: Converting frames to animated GIF...');
    
    // For now, create a simple image blob from the first frame
    const firstFrame = this.frames[0];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = firstFrame.width;
    tempCanvas.height = firstFrame.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(firstFrame, 0, 0);
    
    return new Promise((resolve) => {
      tempCanvas.toBlob((blob) => {
        if (blob) {
          console.log('Direct video: Created image blob:', blob.size, 'bytes');
          // Change type to image for now since video conversion is complex
          const imageBlob = new Blob([blob], { type: 'image/png' });
          resolve(imageBlob);
        } else {
          console.warn('Direct video: Failed to create image blob');
          resolve(new Blob([''], { type: 'image/png' }));
        }
      }, 'image/png');
    });
  }

  private createWavBlob(samples: Float32Array, sampleRate: number): Blob {
    const length = samples.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  getState(): string {
    return this.isRecording ? 'recording' : 'inactive';
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}