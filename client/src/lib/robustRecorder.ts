// Robust recording system with fallback mechanisms
// iOS WKWebView (Capacitor) notes:
//  - MediaRecorder is supported from iOS 14.3+ but has strict limitations
//  - Only audio/mp4 and video/mp4 tend to work reliably
//  - sampleRate and advanced bitrate options are ignored / throw errors
//  - Tracks can die silently after a few seconds if permissions aren't granted correctly

export class RobustRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingType: 'audio' | 'video';
  private isRecording: boolean = false;
  private forceDataInterval: NodeJS.Timeout | null = null;
  public onError: ((error: Error) => void) | null = null;

  constructor(type: 'audio' | 'video') {
    this.recordingType = type;
    this.chunks = [];
  }

  async start(mediaStream: MediaStream): Promise<void> {
    this.stream = mediaStream;
    this.chunks = [];
    this.isRecording = false;
    
    console.log(`Robust ${this.recordingType} recorder: Starting with tracks:`, 
      mediaStream.getTracks().map(t => `${t.kind}: ${t.readyState} (enabled: ${t.enabled})`));
    
    // Ensure all tracks are enabled and active
    mediaStream.getTracks().forEach(track => {
      track.enabled = true;
      if (track.readyState !== 'live') {
        throw new Error(`Track ${track.kind} is not live: ${track.readyState}`);
      }

      // Monitor track for unexpected endings (common on iOS when permission revoked)
      track.addEventListener('ended', () => {
        console.warn(`Robust ${this.recordingType} recorder: Track ended unexpectedly:`, track.kind);
        if (this.isRecording && this.onError) {
          this.onError(new Error(
            `${track.kind} track ended unexpectedly. On iPhone, make sure microphone${this.recordingType === 'video' ? ' and camera' : ''} permission is allowed in Settings > CAREN Alert.`
          ));
        }
        this.isRecording = false;
        if (this.forceDataInterval) {
          clearInterval(this.forceDataInterval);
          this.forceDataInterval = null;
        }
      });
    });

    // Wait for tracks to stabilize
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get the best supported MIME type
    const mimeType = this.getBestMimeType();
    console.log(`Robust ${this.recordingType} recorder: Using MIME type:`, mimeType);

    // Create MediaRecorder — use minimal options for iOS compatibility
    try {
      if (mimeType) {
        this.mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      } else {
        this.mediaRecorder = new MediaRecorder(mediaStream);
      }
    } catch (error) {
      console.warn(`Robust ${this.recordingType} recorder: MIME type failed, using default:`, error);
      try {
        this.mediaRecorder = new MediaRecorder(mediaStream);
      } catch (fallbackError) {
        throw new Error(`MediaRecorder could not start: ${(fallbackError as Error).message}`);
      }
    }

    // Set up event handlers
    this.mediaRecorder.ondataavailable = (event) => {
      const size = event.data?.size || 0;
      console.log(`Robust ${this.recordingType} recorder: Data chunk:`, size, 'bytes');
      if (event.data && size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onstart = () => {
      console.log(`Robust ${this.recordingType} recorder: Recording started`);
      this.isRecording = true;

      // Force periodic data collection every 2 seconds
      this.forceDataInterval = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          try {
            this.mediaRecorder.requestData();
          } catch (error) {
            console.warn(`Robust ${this.recordingType} recorder: Data request failed:`, error);
          }
        }
      }, 2000);
    };

    this.mediaRecorder.onstop = () => {
      console.log(`Robust ${this.recordingType} recorder: Recording stopped, chunks:`, this.chunks.length);
      this.isRecording = false;
      if (this.forceDataInterval) {
        clearInterval(this.forceDataInterval);
        this.forceDataInterval = null;
      }
    };

    this.mediaRecorder.onerror = (event: Event) => {
      const msg = (event as any)?.error?.message || 'Unknown MediaRecorder error';
      console.error(`Robust ${this.recordingType} recorder: Error:`, msg);
      this.isRecording = false;
      if (this.forceDataInterval) {
        clearInterval(this.forceDataInterval);
        this.forceDataInterval = null;
      }
      if (this.onError) {
        this.onError(new Error(`Recording error: ${msg}`));
      }
    };

    // Start recording — iOS sometimes fails with timeslice, try without first
    try {
      this.mediaRecorder.start(1000); // 1-second chunks
      console.log(`Robust ${this.recordingType} recorder: MediaRecorder state:`, this.mediaRecorder.state);
    } catch (startError) {
      console.warn(`Robust ${this.recordingType} recorder: Timeslice start failed, trying without:`, startError);
      try {
        this.mediaRecorder.start();
        console.log(`Robust ${this.recordingType} recorder: Started without timeslice, state:`, this.mediaRecorder.state);
      } catch (fallbackStartError) {
        throw new Error(`Failed to start ${this.recordingType} recording: ${(fallbackStartError as Error).message}`);
      }
    }
  }

  private getBestMimeType(): string {
    if (this.recordingType === 'video') {
      const videoTypes = [
        'video/mp4',                       // iOS-compatible first
        'video/mp4;codecs=h264,aac',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      for (const type of videoTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log(`Selected video MIME type: ${type}`);
          return type;
        }
      }
      return ''; // Let browser decide
    } else {
      const audioTypes = [
        'audio/mp4',                       // iOS-compatible first
        'audio/mp4;codecs=aac',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      console.log('Checking audio MIME type support:');
      for (const type of audioTypes) {
        const isSupported = MediaRecorder.isTypeSupported(type);
        console.log(`  ${type}: ${isSupported ? 'SUPPORTED' : 'not supported'}`);
        if (isSupported) {
          console.log(`Selected audio MIME type: ${type}`);
          return type;
        }
      }
      return ''; // Let browser decide
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recorder'));
        return;
      }

      const timeout = setTimeout(() => {
        console.error(`Robust ${this.recordingType} recorder: Stop timeout, creating emergency blob`);
        const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
        if (totalSize > 0) {
          resolve(new Blob(this.chunks, { type: this.getBestMimeType() || 'audio/mp4' }));
        } else {
          reject(new Error('Recording timeout with no data'));
        }
      }, 10000);

      this.mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log(`Robust ${this.recordingType} recorder: Final data:`, totalSize, 'bytes from', this.chunks.length, 'chunks');
        if (totalSize > 0) {
          const blob = new Blob(this.chunks, {
            type: this.mediaRecorder?.mimeType || this.getBestMimeType() || 'audio/mp4'
          });
          console.log(`Robust ${this.recordingType} recorder: Created blob:`, blob.size, 'bytes, type:', blob.type);
          resolve(blob);
        } else {
          reject(new Error('No recording data captured. The recording may have been too short, or the device does not support in-app recording.'));
        }
      };

      if (this.mediaRecorder.state === 'recording') {
        try {
          this.mediaRecorder.requestData();
        } catch (e) {
          console.warn('Final requestData failed:', e);
        }
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, 300);
      } else if (this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.stop();
      } else {
        clearTimeout(timeout);
        const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
        if (totalSize > 0) {
          resolve(new Blob(this.chunks, { type: this.getBestMimeType() || 'audio/mp4' }));
        } else {
          reject(new Error(`Cannot stop recorder in state: ${this.mediaRecorder.state}`));
        }
      }
    });
  }

  getState(): string {
    return this.mediaRecorder?.state || 'inactive';
  }

  cleanup(): void {
    this.isRecording = false;
    if (this.forceDataInterval) {
      clearInterval(this.forceDataInterval);
      this.forceDataInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.onError = null;
  }
}
