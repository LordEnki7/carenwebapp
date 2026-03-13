// Simple, reliable MediaRecorder implementation
export class SimpleRecorder {
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
    
    console.log(`Simple ${this.recordingType} recorder: Starting with tracks:`, 
      mediaStream.getTracks().map(t => `${t.kind}: ${t.readyState} (${t.enabled ? 'enabled' : 'disabled'})`));
    
    // Ensure all tracks are enabled
    mediaStream.getTracks().forEach(track => {
      track.enabled = true;
      console.log(`${this.recordingType} track ${track.kind}: ready: ${track.readyState}, enabled: ${track.enabled}`);
    });

    // Wait for tracks to stabilize
    await new Promise(resolve => setTimeout(resolve, 300));

    // Create MediaRecorder with basic settings
    try {
      // For audio, try different formats
      if (this.recordingType === 'audio') {
        const audioFormats = [
          'audio/webm',
          'audio/mp4',
          'audio/ogg',
          ''  // No format specified - let browser choose
        ];
        
        let created = false;
        for (const format of audioFormats) {
          try {
            const options = format ? { mimeType: format } : {};
            this.mediaRecorder = new MediaRecorder(mediaStream, options);
            console.log(`Simple audio: Created with format: ${format || 'default'}`);
            created = true;
            break;
          } catch (error) {
            console.warn(`Simple audio: Format ${format} failed:`, error);
          }
        }
        
        if (!created) {
          throw new Error('Could not create audio MediaRecorder');
        }
      } else {
        // For video, try basic formats
        const videoFormats = [
          'video/webm',
          'video/mp4',
          ''  // No format specified
        ];
        
        let created = false;
        for (const format of videoFormats) {
          try {
            const options = format ? { mimeType: format } : {};
            this.mediaRecorder = new MediaRecorder(mediaStream, options);
            console.log(`Simple video: Created with format: ${format || 'default'}`);
            created = true;
            break;
          } catch (error) {
            console.warn(`Simple video: Format ${format} failed:`, error);
          }
        }
        
        if (!created) {
          throw new Error('Could not create video MediaRecorder');
        }
      }
    } catch (error) {
      console.error(`Simple ${this.recordingType}: MediaRecorder creation failed:`, error);
      throw error;
    }

    // Set up event handlers
    this.mediaRecorder.ondataavailable = (event) => {
      const size = event.data?.size || 0;
      console.log(`Simple ${this.recordingType}: Data chunk:`, size, 'bytes');
      if (event.data && size > 0) {
        this.chunks.push(event.data);
        console.log(`Simple ${this.recordingType}: Total chunks:`, this.chunks.length);
      }
    };

    this.mediaRecorder.onstart = () => {
      console.log(`Simple ${this.recordingType}: Recording started`);
      this.isRecording = true;
    };

    this.mediaRecorder.onstop = () => {
      console.log(`Simple ${this.recordingType}: Recording stopped`);
      this.isRecording = false;
    };

    this.mediaRecorder.onerror = (event) => {
      console.error(`Simple ${this.recordingType}: Recording error:`, event);
      this.isRecording = false;
    };

    // Start recording with frequent data requests
    this.mediaRecorder.start(500); // Request data every 500ms
    console.log(`Simple ${this.recordingType}: Started, state:`, this.mediaRecorder.state);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this.isRecording = false;
      console.log(`Simple ${this.recordingType}: Stopping...`);
      
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.onstop = () => {
          const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
          console.log(`Simple ${this.recordingType}: Processing`, this.chunks.length, 'chunks, total:', totalSize, 'bytes');
          
          if (totalSize > 0) {
            const mimeType = this.mediaRecorder?.mimeType || (this.recordingType === 'video' ? 'video/webm' : 'audio/webm');
            const blob = new Blob(this.chunks, { type: mimeType });
            console.log(`Simple ${this.recordingType}: Created blob:`, blob.size, 'bytes, type:', blob.type);
            resolve(blob);
          } else {
            console.warn(`Simple ${this.recordingType}: No data captured`);
            const emptyType = this.recordingType === 'video' ? 'video/webm' : 'audio/webm';
            resolve(new Blob([''], { type: emptyType }));
          }
        };
        
        // Request any remaining data
        try {
          this.mediaRecorder.requestData();
          console.log(`Simple ${this.recordingType}: Final data requested`);
        } catch (error) {
          console.warn(`Simple ${this.recordingType}: Could not request final data:`, error);
        }
        
        // Stop after brief delay
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, 200);
      } else {
        console.warn(`Simple ${this.recordingType}: Not recording, state:`, this.mediaRecorder?.state);
        const emptyType = this.recordingType === 'video' ? 'video/webm' : 'audio/webm';
        resolve(new Blob([''], { type: emptyType }));
      }
      
      // Clean up stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Simple ${this.recordingType}: Stopped ${track.kind} track`);
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