// Direct stream recording without MediaRecorder
export class DirectStreamRecorder {
  private stream: MediaStream | null = null;
  private recordingType: 'audio' | 'video';
  private isRecording: boolean = false;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private recordedBuffers: Float32Array[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private video: HTMLVideoElement | null = null;
  private frames: ImageData[] = [];
  private animationId: number | null = null;
  private sampleRate: number = 44100;

  constructor(type: 'audio' | 'video') {
    this.recordingType = type;
  }

  async start(mediaStream: MediaStream): Promise<void> {
    this.stream = mediaStream;
    this.isRecording = true;
    this.recordedBuffers = [];
    this.frames = [];

    console.log(`Direct ${this.recordingType} recorder: Starting with tracks:`, 
      mediaStream.getTracks().map(t => `${t.kind}: ${t.readyState}`));

    if (this.recordingType === 'audio') {
      await this.startAudioRecording(mediaStream);
    } else {
      await this.startVideoRecording(mediaStream);
    }
  }

  private async startAudioRecording(stream: MediaStream): Promise<void> {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No audio track found');
    }

    console.log('Direct audio: Setting up Web Audio API...');
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.sampleRate = this.audioContext.sampleRate;
      
      console.log('Direct audio: AudioContext created, sample rate:', this.sampleRate);
      
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      
      // Use createScriptProcessor (deprecated but more reliable than AudioWorklet)
      const bufferSize = 4096;
      this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      console.log('Direct audio: ScriptProcessor created with buffer size:', bufferSize);
      
      this.processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;
        
        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0);
        
        // Check if we're actually getting audio data
        let hasNonZeroSamples = false;
        for (let i = 0; i < channelData.length; i++) {
          if (Math.abs(channelData[i]) > 0.001) { // Check for meaningful audio
            hasNonZeroSamples = true;
            break;
          }
        }
        
        // Clone the data (important!)
        const buffer = new Float32Array(channelData.length);
        buffer.set(channelData);
        this.recordedBuffers.push(buffer);
        
        // Log periodically to show progress and audio detection
        if (this.recordedBuffers.length % 50 === 0) {
          console.log('Direct audio: Captured', this.recordedBuffers.length, 'buffers', 
            hasNonZeroSamples ? '(audio detected)' : '(silent)');
        }
      };
      
      // Connect the audio graph
      this.mediaStreamSource.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      console.log('Direct audio: Recording started successfully');
    } catch (error) {
      console.error('Direct audio: Setup failed:', error);
      throw error;
    }
  }

  private async startVideoRecording(stream: MediaStream): Promise<void> {
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      throw new Error('No video track found');
    }

    console.log('Direct video: Setting up canvas capture...');
    
    try {
      // Create video element
      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.muted = true;
      this.video.autoplay = true;
      
      // Create canvas for frame capture
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      
      // Wait for video to load
      await new Promise((resolve, reject) => {
        this.video!.onloadedmetadata = () => {
          this.canvas!.width = this.video!.videoWidth || 640;
          this.canvas!.height = this.video!.videoHeight || 480;
          console.log('Direct video: Video loaded, size:', this.canvas!.width, 'x', this.canvas!.height);
          resolve(void 0);
        };
        this.video!.onerror = reject;
      });
      
      // Start frame capture
      this.captureFrame();
      
      console.log('Direct video: Recording started successfully');
    } catch (error) {
      console.error('Direct video: Setup failed:', error);
      throw error;
    }
  }

  private captureFrame = () => {
    if (!this.isRecording || !this.video || !this.canvas || !this.context) {
      return;
    }

    try {
      // Check if video is actually playing
      if (this.video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        // Draw current video frame to canvas
        this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Get image data and check if it contains actual video content
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Simple check for non-black frame (basic content detection)
        const data = imageData.data;
        let hasContent = false;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 10 || data[i + 1] > 10 || data[i + 2] > 10) { // R, G, or B > 10
            hasContent = true;
            break;
          }
        }
        
        this.frames.push(imageData);
        
        // Log progress with content detection
        if (this.frames.length % 30 === 0) { // Every ~1 second at 30fps
          console.log('Direct video: Captured', this.frames.length, 'frames', 
            hasContent ? '(content detected)' : '(black/empty)');
        }
      } else {
        console.warn('Direct video: Video not ready, state:', this.video.readyState);
      }
      
      // Schedule next frame (targeting ~30fps)
      this.animationId = requestAnimationFrame(this.captureFrame);
    } catch (error) {
      console.error('Direct video: Frame capture error:', error);
    }
  };

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this.isRecording = false;
      console.log(`Direct ${this.recordingType}: Stopping...`);

      if (this.recordingType === 'audio') {
        this.stopAudioRecording().then(resolve);
      } else {
        this.stopVideoRecording().then(resolve);
      }
    });
  }

  private async stopAudioRecording(): Promise<Blob> {
    console.log('Direct audio: Processing', this.recordedBuffers.length, 'buffers...');

    // Clean up Web Audio API
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    if (this.recordedBuffers.length === 0) {
      console.warn('Direct audio: No buffers recorded');
      return new Blob([''], { type: 'audio/wav' });
    }

    // Calculate total length
    const totalLength = this.recordedBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
    console.log('Direct audio: Total samples:', totalLength);

    // Combine all buffers
    const combinedBuffer = new Float32Array(totalLength);
    let offset = 0;
    for (const buffer of this.recordedBuffers) {
      combinedBuffer.set(buffer, offset);
      offset += buffer.length;
    }

    // Convert to WAV
    const wavBlob = this.encodeWAV(combinedBuffer, this.sampleRate);
    console.log('Direct audio: Created WAV blob:', wavBlob.size, 'bytes');
    return wavBlob;
  }

  private async stopVideoRecording(): Promise<Blob> {
    console.log('Direct video: Processing', this.frames.length, 'frames...');

    // Stop frame capture
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Clean up video element
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    if (this.frames.length === 0) {
      console.warn('Direct video: No frames captured');
      return new Blob([''], { type: 'video/webm' });
    }

    // For now, create a simple video file by encoding frames
    // This is a basic implementation - in production you'd want a proper video encoder
    const videoBlob = await this.encodeVideo(this.frames);
    console.log('Direct video: Created video blob:', videoBlob.size, 'bytes');
    return videoBlob;
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const length = samples.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    console.log('Direct audio: Encoding WAV with', length, 'samples at', sampleRate, 'Hz');
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true); // File size - 8 bytes
    writeString(8, 'WAVE');
    
    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * 2, true); // byte rate (sample rate * channels * bytes per sample)
    view.setUint16(32, 2, true); // block align (channels * bytes per sample)
    view.setUint16(34, 16, true); // bits per sample
    
    // data chunk
    writeString(36, 'data');
    view.setUint32(40, length * 2, true); // data size
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    let maxSample = 0;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      maxSample = Math.max(maxSample, Math.abs(sample));
      const intSample = Math.round(sample * 0x7FFF);
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
    
    console.log('Direct audio: WAV encoded, max sample amplitude:', maxSample);
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  private async encodeVideo(frames: ImageData[]): Promise<Blob> {
    if (frames.length === 0) {
      return new Blob([''], { type: 'video/webm' });
    }

    console.log('Direct video: Creating video from', frames.length, 'frames');

    // Create a canvas for encoding
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = frames[0].width;
    canvas.height = frames[0].height;

    // Try to create a proper video using MediaRecorder with canvas stream
    try {
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm;codecs=vp8' 
      });

      const chunks: Blob[] = [];
      
      return new Promise((resolve) => {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: 'video/webm' });
          console.log('Direct video: MediaRecorder produced blob:', videoBlob.size, 'bytes');
          resolve(videoBlob);
        };

        mediaRecorder.onerror = (error) => {
          console.warn('Direct video: MediaRecorder failed, using fallback:', error);
          // Fallback to animated GIF-like approach
          this.createAnimatedWebM(frames).then(resolve);
        };

        // Start recording
        mediaRecorder.start();

        // Play back frames to the canvas
        let frameIndex = 0;
        const playFrame = () => {
          if (frameIndex < frames.length) {
            ctx.putImageData(frames[frameIndex], 0, 0);
            frameIndex++;
            setTimeout(playFrame, 33); // ~30 FPS
          } else {
            // Stop recording after all frames are played
            setTimeout(() => mediaRecorder.stop(), 100);
          }
        };

        playFrame();
      });
    } catch (error) {
      console.warn('Direct video: Canvas stream not supported, using fallback:', error);
      return this.createAnimatedWebM(frames);
    }
  }

  private async createAnimatedWebM(frames: ImageData[]): Promise<Blob> {
    // Fallback: Create a simple video container with frame data
    // This is a basic implementation - browsers may not play it directly
    console.log('Direct video: Creating fallback video format');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = frames[0].width;
    canvas.height = frames[0].height;
    
    // Convert all frames to base64 images
    const frameBlobs: Blob[] = [];
    
    for (let i = 0; i < Math.min(frames.length, 100); i++) { // Limit to 100 frames
      ctx.putImageData(frames[i], 0, 0);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob());
        }, 'image/jpeg', 0.7);
      });
      frameBlobs.push(blob);
    }
    
    // Combine all frame blobs into a single container
    // Note: This won't be a proper video format but will contain the frame data
    const totalSize = frameBlobs.reduce((sum, blob) => sum + blob.size, 0);
    console.log('Direct video: Created', frameBlobs.length, 'frame blobs, total size:', totalSize);
    
    // For now, return the first frame as a playable image
    return frameBlobs[0] || new Blob([''], { type: 'image/jpeg' });
  }

  getState(): string {
    return this.isRecording ? 'recording' : 'inactive';
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}