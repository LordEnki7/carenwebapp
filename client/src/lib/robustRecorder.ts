// Robust recording system with fallback mechanisms
export class RobustRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingType: 'audio' | 'video';
  private isRecording: boolean = false;
  private forceDataInterval: NodeJS.Timeout | null = null;

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
    });

    // Wait for tracks to stabilize
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get the best supported MIME type
    const mimeType = this.getBestMimeType();
    console.log(`Robust ${this.recordingType} recorder: Using MIME type:`, mimeType);

    // Create MediaRecorder with optimal settings
    const options: MediaRecorderOptions = {
      mimeType: mimeType,
    };

    // Add bitrate settings for better quality
    if (this.recordingType === 'video') {
      options.videoBitsPerSecond = 2000000; // 2 Mbps
      options.audioBitsPerSecond = 128000;  // 128 kbps
    } else {
      options.audioBitsPerSecond = 192000;  // 192 kbps for audio-only
    }

    try {
      this.mediaRecorder = new MediaRecorder(mediaStream, options);
    } catch (error) {
      console.warn(`Robust ${this.recordingType} recorder: Options failed, using basic:`, error);
      try {
        this.mediaRecorder = new MediaRecorder(mediaStream, { mimeType: mimeType });
      } catch (fallbackError) {
        console.warn(`Robust ${this.recordingType} recorder: Basic MIME type failed, using minimal:`, fallbackError);
        this.mediaRecorder = new MediaRecorder(mediaStream);
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
            console.log(`Robust ${this.recordingType} recorder: Forced data request`);
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

    this.mediaRecorder.onerror = (event) => {
      console.error(`Robust ${this.recordingType} recorder: Error:`, event);
      this.isRecording = false;
      
      if (this.forceDataInterval) {
        clearInterval(this.forceDataInterval);
        this.forceDataInterval = null;
      }
    };

    // Start recording with immediate data collection
    try {
      this.mediaRecorder.start(1000); // Collect data every 1 second
      console.log(`Robust ${this.recordingType} recorder: MediaRecorder state:`, this.mediaRecorder.state);
    } catch (startError) {
      console.error(`Robust ${this.recordingType} recorder: Failed to start recording:`, startError);
      // Try to start without interval parameter
      try {
        this.mediaRecorder.start();
        console.log(`Robust ${this.recordingType} recorder: Started without interval, state:`, this.mediaRecorder.state);
      } catch (fallbackStartError) {
        console.error(`Robust ${this.recordingType} recorder: Complete start failure:`, fallbackStartError);
        throw new Error(`Failed to start ${this.recordingType} recording: ${fallbackStartError.message || 'Unknown error'}`);
      }
    }
  }

  private getBestMimeType(): string {
    if (this.recordingType === 'video') {
      const videoTypes = [
        'video/mp4;codecs=h264,aac',  // Prioritize MP4 for better compatibility
        'video/mp4',
        'video/webm;codecs=h264,opus', // H.264 in WebM is closer to MP4
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
      return 'video/webm'; // Fallback
    } else {
      const audioTypes = [
        'audio/mp4',                   // MP4 container for better compression
        'audio/webm;codecs=opus',      // Good compression and quality
        'audio/webm',
        'audio/mp4;codecs=aac',
        'audio/ogg;codecs=opus',
        'audio/wav'                    // Fallback to uncompressed
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
      console.log('No supported audio MIME types found, using fallback: audio/webm');
      return 'audio/webm'; // Fallback
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recorder'));
        return;
      }

      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.error(`Robust ${this.recordingType} recorder: Stop timeout, creating emergency blob`);
        const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
        if (totalSize > 0) {
          const blob = new Blob(this.chunks, { 
            type: this.getBestMimeType()
          });
          resolve(blob);
        } else {
          reject(new Error('Recording timeout with no data'));
        }
      }, 10000); // 10 second timeout

      this.mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        
        const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log(`Robust ${this.recordingType} recorder: Final data:`, totalSize, 'bytes from', this.chunks.length, 'chunks');
        
        if (totalSize > 0) {
          const blob = new Blob(this.chunks, { 
            type: this.mediaRecorder?.mimeType || this.getBestMimeType()
          });
          console.log(`Robust ${this.recordingType} recorder: Created blob:`, blob.size, 'bytes, type:', blob.type);
          resolve(blob);
        } else {
          reject(new Error('No recording data captured'));
        }
      };

      // Final data request before stopping
      if (this.mediaRecorder.state === 'recording') {
        try {
          this.mediaRecorder.requestData();
          console.log(`Robust ${this.recordingType} recorder: Final data request sent`);
        } catch (error) {
          console.warn(`Robust ${this.recordingType} recorder: Final data request failed:`, error);
        }
        
        // Stop after a small delay to ensure data is collected
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, 500);
      } else {
        console.warn(`Robust ${this.recordingType} recorder: Cannot stop, state:`, this.mediaRecorder.state);
        clearTimeout(timeout);
        reject(new Error(`Cannot stop recorder in state: ${this.mediaRecorder.state}`));
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
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Robust ${this.recordingType} recorder: Stopped track:`, track.kind);
      });
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.chunks = [];
  }
}