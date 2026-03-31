// Unified MediaRecorder for both audio and video recording
export class UnifiedMediaRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingType: 'audio' | 'video';
  private isRecording: boolean = false;

  constructor(type: 'audio' | 'video') {
    this.recordingType = type;
    this.chunks = [];
  }

  async start(mediaStream: MediaStream): Promise<void> {
    this.stream = mediaStream;
    this.chunks = [];
    
    console.log(`Unified ${this.recordingType} recorder: Starting with tracks:`, 
      mediaStream.getTracks().map(t => `${t.kind}: ${t.readyState} (${t.enabled ? 'enabled' : 'disabled'})`));
    
    // Ensure all tracks are enabled
    mediaStream.getTracks().forEach(track => {
      track.enabled = true;
      console.log(`${this.recordingType} track ${track.kind}: ${track.label}, enabled: ${track.enabled}`);
    });

    // Wait for tracks to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Select appropriate MIME types based on recording type
    const mimeTypes = this.recordingType === 'video' 
      ? [
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp8', 
          'video/webm',
          'video/mp4'
        ]
      : [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus',
          'audio/wav'
        ];
    
    let selectedMimeType = '';
    let recordingOptions: MediaRecorderOptions = {};
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        recordingOptions = {
          mimeType: mimeType,
          audioBitsPerSecond: 128000
        };
        
        if (this.recordingType === 'video') {
          recordingOptions.videoBitsPerSecond = 2500000;
        }
        
        console.log(`Unified ${this.recordingType} recorder: Selected MIME type:`, mimeType);
        break;
      }
    }

    if (!selectedMimeType) {
      console.warn(`Unified ${this.recordingType} recorder: No specific MIME type supported, using default`);
      recordingOptions = {};
    }

    try {
      this.mediaRecorder = new MediaRecorder(mediaStream, recordingOptions);
    } catch (error) {
      console.warn(`Unified ${this.recordingType} recorder: Failed with options, trying basic:`, error);
      this.mediaRecorder = new MediaRecorder(mediaStream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      const size = event.data?.size || 0;
      console.log(`Unified ${this.recordingType} recorder: Data chunk received:`, size, 'bytes');
      if (event.data && size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onstart = () => {
      console.log(`Unified ${this.recordingType} recorder: Started successfully`);
      this.isRecording = true;
    };

    this.mediaRecorder.onstop = () => {
      console.log(`Unified ${this.recordingType} recorder: Stopped with`, this.chunks.length, 'chunks');
      this.isRecording = false;
    };

    this.mediaRecorder.onerror = (event) => {
      console.error(`Unified ${this.recordingType} recorder: Error:`, event);
      this.isRecording = false;
    };

    // Start recording and force data capture
    this.mediaRecorder.start();
    console.log(`Unified ${this.recordingType} recorder: MediaRecorder state:`, this.mediaRecorder.state);
    
    // Force immediate data collection
    setTimeout(() => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        try {
          this.mediaRecorder.requestData();
          console.log(`Unified ${this.recordingType} recorder: Requested initial data`);
        } catch (error) {
          console.warn(`Unified ${this.recordingType} recorder: Could not request data:`, error);
        }
      }
    }, 1000);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this.isRecording = false;
      
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.onstop = () => {
          const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
          console.log(`Unified ${this.recordingType} recorder: Creating final blob from`, totalSize, 'bytes');
          
          if (totalSize > 0) {
            const blob = new Blob(this.chunks, { 
              type: this.mediaRecorder?.mimeType || (this.recordingType === 'video' ? 'video/webm' : 'audio/webm')
            });
            console.log(`Unified ${this.recordingType} recorder: Final blob:`, blob.size, 'bytes, type:', blob.type);
            resolve(blob);
          } else {
            console.error(`Unified ${this.recordingType} recorder: No data captured`);
            const emptyType = this.recordingType === 'video' ? 'video/webm' : 'audio/webm';
            resolve(new Blob([''], { type: emptyType }));
          }
        };
        
        // Request any remaining data
        try {
          this.mediaRecorder.requestData();
        } catch (error) {
          console.warn(`Unified ${this.recordingType} recorder: Could not request final data:`, error);
        }
        
        this.mediaRecorder.stop();
      } else {
        const emptyType = this.recordingType === 'video' ? 'video/webm' : 'audio/webm';
        resolve(new Blob([''], { type: emptyType }));
      }
      
      // Clean up stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Unified ${this.recordingType} recorder: Stopped ${track.kind} track`);
        });
      }
    });
  }

  getState(): string {
    return this.mediaRecorder?.state || 'inactive';
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording && this.mediaRecorder?.state === 'recording';
  }
}