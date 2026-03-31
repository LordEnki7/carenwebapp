// Fallback recording system with multiple capture methods
export class FallbackRecorder {
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingType: 'audio' | 'video';
  private isRecording: boolean = false;
  private activeRecorder: MediaRecorder | null = null;
  private recordingTimer: number | null = null;

  constructor(type: 'audio' | 'video') {
    this.recordingType = type;
    this.chunks = [];
  }

  async start(mediaStream: MediaStream): Promise<void> {
    this.stream = mediaStream;
    this.chunks = [];
    
    console.log(`Fallback ${this.recordingType} recorder: Starting with tracks:`, 
      mediaStream.getTracks().map(t => `${t.kind}: ${t.readyState} (${t.enabled ? 'enabled' : 'disabled'})`));
    
    // Ensure all tracks are enabled and active
    mediaStream.getTracks().forEach(track => {
      track.enabled = true;
      console.log(`${this.recordingType} track ${track.kind}: ${track.label}, ready: ${track.readyState}, enabled: ${track.enabled}`);
    });

    // Wait for tracks to be fully ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try multiple MediaRecorder configurations
    const configs = [
      // Configuration 1: Basic with no options
      {},
      // Configuration 2: Simple codec
      { mimeType: this.recordingType === 'video' ? 'video/webm' : 'audio/webm' },
      // Configuration 3: Specific codec
      { 
        mimeType: this.recordingType === 'video' ? 'video/webm;codecs=vp8' : 'audio/webm;codecs=opus'
      }
    ];

    let recorderCreated = false;
    
    for (let i = 0; i < configs.length; i++) {
      try {
        const config = configs[i];
        console.log(`Fallback ${this.recordingType} recorder: Trying config ${i + 1}:`, config);
        
        // Test if configuration is supported
        if (config.mimeType && !MediaRecorder.isTypeSupported(config.mimeType)) {
          console.log(`Fallback ${this.recordingType} recorder: MIME type not supported:`, config.mimeType);
          continue;
        }
        
        this.activeRecorder = new MediaRecorder(mediaStream, config);
        console.log(`Fallback ${this.recordingType} recorder: Created with config ${i + 1}`);
        recorderCreated = true;
        break;
      } catch (error) {
        console.warn(`Fallback ${this.recordingType} recorder: Config ${i + 1} failed:`, error);
      }
    }

    if (!recorderCreated || !this.activeRecorder) {
      throw new Error(`Failed to create MediaRecorder for ${this.recordingType}`);
    }

    // Set up event handlers
    this.activeRecorder.ondataavailable = (event) => {
      const size = event.data?.size || 0;
      console.log(`Fallback ${this.recordingType} recorder: Data received:`, size, 'bytes at', new Date().toISOString());
      if (event.data && size > 0) {
        this.chunks.push(event.data);
        console.log(`Fallback ${this.recordingType} recorder: Total chunks:`, this.chunks.length);
      } else {
        console.warn(`Fallback ${this.recordingType} recorder: Empty data chunk received`);
      }
    };

    this.activeRecorder.onstart = () => {
      console.log(`Fallback ${this.recordingType} recorder: Started successfully`);
      this.isRecording = true;
    };

    this.activeRecorder.onstop = () => {
      console.log(`Fallback ${this.recordingType} recorder: Stopped with`, this.chunks.length, 'chunks');
      this.isRecording = false;
    };

    this.activeRecorder.onerror = (event) => {
      console.error(`Fallback ${this.recordingType} recorder: Error:`, event);
      this.isRecording = false;
    };

    // Start recording
    this.activeRecorder.start();
    console.log(`Fallback ${this.recordingType} recorder: Started, state:`, this.activeRecorder.state);
    
    // Set up periodic data requests to force chunk collection
    this.recordingTimer = window.setInterval(() => {
      if (this.activeRecorder && this.activeRecorder.state === 'recording') {
        try {
          this.activeRecorder.requestData();
          console.log(`Fallback ${this.recordingType} recorder: Periodic data request sent`);
        } catch (error) {
          console.warn(`Fallback ${this.recordingType} recorder: Could not request data:`, error);
        }
      }
    }, 2000); // Request data every 2 seconds
    
    // Also force immediate data collection
    setTimeout(() => {
      if (this.activeRecorder && this.activeRecorder.state === 'recording') {
        try {
          this.activeRecorder.requestData();
          console.log(`Fallback ${this.recordingType} recorder: Initial data request sent`);
        } catch (error) {
          console.warn(`Fallback ${this.recordingType} recorder: Initial data request failed:`, error);
        }
      }
    }, 1000);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this.isRecording = false;
      
      // Clear periodic timer
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
      
      if (this.activeRecorder && this.activeRecorder.state === 'recording') {
        this.activeRecorder.onstop = () => {
          const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
          console.log(`Fallback ${this.recordingType} recorder: Creating final blob from`, totalSize, 'bytes');
          
          if (totalSize > 0) {
            const mimeType = this.activeRecorder?.mimeType || (this.recordingType === 'video' ? 'video/webm' : 'audio/webm');
            const blob = new Blob(this.chunks, { type: mimeType });
            console.log(`Fallback ${this.recordingType} recorder: Final blob:`, blob.size, 'bytes, type:', blob.type);
            resolve(blob);
          } else {
            console.error(`Fallback ${this.recordingType} recorder: No data captured despite recording`);
            const emptyType = this.recordingType === 'video' ? 'video/webm' : 'audio/webm';
            resolve(new Blob([''], { type: emptyType }));
          }
        };
        
        // Request final data before stopping
        try {
          this.activeRecorder.requestData();
          console.log(`Fallback ${this.recordingType} recorder: Final data request sent`);
        } catch (error) {
          console.warn(`Fallback ${this.recordingType} recorder: Final data request failed:`, error);
        }
        
        // Wait a moment then stop
        setTimeout(() => {
          if (this.activeRecorder && this.activeRecorder.state === 'recording') {
            this.activeRecorder.stop();
          }
        }, 500);
      } else {
        console.warn(`Fallback ${this.recordingType} recorder: Not in recording state:`, this.activeRecorder?.state);
        const emptyType = this.recordingType === 'video' ? 'video/webm' : 'audio/webm';
        resolve(new Blob([''], { type: emptyType }));
      }
      
      // Clean up stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Fallback ${this.recordingType} recorder: Stopped ${track.kind} track`);
        });
      }
    });
  }

  getState(): string {
    return this.activeRecorder?.state || 'inactive';
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording && this.activeRecorder?.state === 'recording';
  }
}