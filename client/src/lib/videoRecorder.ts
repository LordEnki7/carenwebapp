// Robust video recording with proper stream handling
export class CanvasVideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private isRecording: boolean = false;
  private stream: MediaStream | null = null;
  private recordingTimer: number | null = null;

  constructor() {
    this.chunks = [];
  }

  async start(mediaStream: MediaStream): Promise<void> {
    this.stream = mediaStream;
    this.chunks = [];
    
    console.log('Video recorder: Starting with stream tracks:', 
      mediaStream.getTracks().map(t => `${t.kind}: ${t.readyState} (${t.enabled ? 'enabled' : 'disabled'})`));
    
    // Ensure all tracks are active and enabled
    const videoTracks = mediaStream.getVideoTracks();
    const audioTracks = mediaStream.getAudioTracks();
    
    if (videoTracks.length === 0) {
      throw new Error('No video track available for recording');
    }
    
    videoTracks.forEach(track => {
      track.enabled = true;
      console.log(`Video track: ${track.label}, enabled: ${track.enabled}, ready state: ${track.readyState}`);
    });
    
    audioTracks.forEach(track => {
      track.enabled = true;
      console.log(`Audio track: ${track.label}, enabled: ${track.enabled}, ready state: ${track.readyState}`);
    });

    // Wait a moment for tracks to be ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try different MIME types in order of preference
    const mimeTypes = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4'
    ];
    
    let selectedMimeType = '';
    let recordingOptions: MediaRecorderOptions = {};
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        recordingOptions = {
          mimeType: mimeType,
          videoBitsPerSecond: 1000000, // 1 Mbps
          audioBitsPerSecond: 128000   // 128 kbps
        };
        console.log('Video recorder: Selected MIME type:', mimeType);
        break;
      }
    }

    if (!selectedMimeType) {
      console.warn('Video recorder: No specific MIME type supported, using default');
      recordingOptions = {};
    }

    try {
      this.mediaRecorder = new MediaRecorder(mediaStream, recordingOptions);
    } catch (error) {
      console.warn('Video recorder: Failed with options, trying basic MediaRecorder:', error);
      this.mediaRecorder = new MediaRecorder(mediaStream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      console.log('Video recorder: Data chunk received:', event.data.size, 'bytes at', new Date().toISOString());
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onstart = () => {
      console.log('Video recorder: Recording started successfully at', new Date().toISOString());
      this.isRecording = true;
    };

    this.mediaRecorder.onstop = () => {
      console.log('Video recorder: Recording stopped with', this.chunks.length, 'chunks');
      this.isRecording = false;
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('Video recorder: MediaRecorder error:', event);
      this.isRecording = false;
    };

    // Start recording with smaller intervals for more frequent data capture
    this.mediaRecorder.start(250); // 250ms intervals
    console.log('Video recorder: Started, state:', this.mediaRecorder.state);
    
    // Set up a timer to force data collection every second
    this.recordingTimer = window.setInterval(() => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        try {
          this.mediaRecorder.requestData();
          console.log('Video recorder: Requested data at', new Date().toISOString());
        } catch (error) {
          console.warn('Video recorder: Could not request data:', error);
        }
      }
    }, 1000);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this.isRecording = false;
      
      // Clear the recording timer
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }
      
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.onstop = () => {
          const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
          console.log('Video recorder: Creating final blob from', totalSize, 'bytes');
          
          if (totalSize > 0) {
            const blob = new Blob(this.chunks, { 
              type: this.mediaRecorder?.mimeType || 'video/webm' 
            });
            console.log('Video recorder: Final video blob:', blob.size, 'bytes, type:', blob.type);
            resolve(blob);
          } else {
            console.error('Video recorder: No data captured despite recording');
            resolve(new Blob([''], { type: 'video/webm' }));
          }
        };
        
        // Request final data before stopping
        try {
          this.mediaRecorder.requestData();
        } catch (error) {
          console.warn('Video recorder: Could not request final data:', error);
        }
        
        this.mediaRecorder.stop();
      } else {
        console.warn('Video recorder: MediaRecorder not in recording state:', this.mediaRecorder?.state);
        resolve(new Blob([''], { type: 'video/webm' }));
      }
      
      // Clean up stream tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Video recorder: Stopped ${track.kind} track`);
        });
      }
    });
  }
}