// Recording system diagnostics and troubleshooting
export class RecordingDiagnostics {
  static async checkBrowserSupport(): Promise<{ 
    supported: boolean; 
    issues: string[]; 
    capabilities: any;
  }> {
    const issues: string[] = [];
    const capabilities: any = {};

    // Check basic API support
    if (!navigator.mediaDevices) {
      issues.push('MediaDevices API not supported');
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      issues.push('getUserMedia not supported');
    }
    
    if (!window.MediaRecorder) {
      issues.push('MediaRecorder API not supported');
    }

    // Check MIME type support
    const videoTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    
    const audioTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];

    capabilities.supportedVideoTypes = videoTypes.filter(type => 
      MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)
    );
    
    capabilities.supportedAudioTypes = audioTypes.filter(type => 
      MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)
    );

    if (capabilities.supportedVideoTypes.length === 0) {
      issues.push('No supported video MIME types found');
    }
    
    if (capabilities.supportedAudioTypes.length === 0) {
      issues.push('No supported audio MIME types found');
    }

    // Check for secure context (required for getUserMedia)
    if (!window.isSecureContext) {
      issues.push('Insecure context - HTTPS required for media access');
    }

    return {
      supported: issues.length === 0,
      issues,
      capabilities
    };
  }

  static async testMediaAccess(): Promise<{
    audio: boolean;
    video: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let audioAccess = false;
    let videoAccess = false;

    // Test audio access
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioAccess = true;
      audioStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      errors.push(`Audio access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test video access
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoAccess = true;
      videoStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      errors.push(`Video access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { audio: audioAccess, video: videoAccess, errors };
  }

  static async getDeviceInfo(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices;
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }

  static async runFullDiagnostics(): Promise<{
    browserSupport: any;
    mediaAccess: any;
    devices: MediaDeviceInfo[];
    recommendations: string[];
  }> {
    const browserSupport = await this.checkBrowserSupport();
    const mediaAccess = await this.testMediaAccess();
    const devices = await this.getDeviceInfo();
    
    const recommendations: string[] = [];
    
    if (!browserSupport.supported) {
      recommendations.push('Update your browser to the latest version');
    }
    
    if (!mediaAccess.audio && !mediaAccess.video) {
      recommendations.push('Check browser permissions for camera and microphone access');
    }
    
    if (devices.filter(d => d.kind === 'audioinput').length === 0) {
      recommendations.push('No microphone detected - check hardware connections');
    }
    
    if (devices.filter(d => d.kind === 'videoinput').length === 0) {
      recommendations.push('No camera detected - check hardware connections');
    }
    
    if (!window.isSecureContext) {
      recommendations.push('Use HTTPS to enable media recording features');
    }

    return {
      browserSupport,
      mediaAccess,
      devices,
      recommendations
    };
  }
}