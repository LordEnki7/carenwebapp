// Production-specific media playback fixes and diagnostics
export class ProductionMediaFixer {
  
  static async diagnoseProductionIssues(): Promise<{
    environment: any;
    mediaSupport: any;
    blobSupport: any;
    recommendations: string[];
  }> {
    console.log('[MEDIA_FIXER] Starting production media diagnostics...');
    
    const environment = {
      isProduction: !window.location.host.includes('localhost'),
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      host: window.location.host,
      userAgent: navigator.userAgent,
      isReplit: window.location.host.includes('replit.app') || window.location.host.includes('replit.dev')
    };
    
    const mediaSupport = {
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
      mediaRecorder: !!window.MediaRecorder,
      webRTC: !!window.RTCPeerConnection,
      audioContext: !!window.AudioContext || !!window.webkitAudioContext
    };
    
    const blobSupport = await this.testBlobSupport();
    
    const recommendations: string[] = [];
    
    if (!environment.isSecureContext) {
      recommendations.push('Application must be served over HTTPS for media recording');
    }
    
    if (!mediaSupport.mediaDevices) {
      recommendations.push('MediaDevices API not supported - update browser');
    }
    
    if (!blobSupport.canCreateBlobs) {
      recommendations.push('Blob creation failed - browser security restrictions');
    }
    
    if (!blobSupport.canPlayBlobs) {
      recommendations.push('Blob playback blocked - check Content Security Policy');
    }
    
    if (environment.isReplit && !environment.isSecureContext) {
      recommendations.push('Replit environment requires HTTPS for media features');
    }
    
    console.log('[MEDIA_FIXER] Diagnostics complete:', {
      environment,
      mediaSupport,
      blobSupport,
      recommendations
    });
    
    return {
      environment,
      mediaSupport,
      blobSupport,
      recommendations
    };
  }
  
  static async testBlobSupport(): Promise<{
    canCreateBlobs: boolean;
    canPlayBlobs: boolean;
    blobUrlSupport: boolean;
    details: any;
  }> {
    const details: any = {};
    
    try {
      // Test blob creation
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const canCreateBlobs = testBlob instanceof Blob;
      details.blobCreation = canCreateBlobs;
      
      // Test blob URL creation
      let blobUrlSupport = false;
      let blobUrl = '';
      try {
        blobUrl = URL.createObjectURL(testBlob);
        blobUrlSupport = blobUrl.startsWith('blob:');
        details.blobUrl = blobUrl;
      } catch (error) {
        details.blobUrlError = error.message;
      }
      
      // Test blob URL access
      let canPlayBlobs = false;
      if (blobUrlSupport) {
        try {
          const response = await fetch(blobUrl);
          canPlayBlobs = response.ok;
          details.blobFetchSuccess = canPlayBlobs;
        } catch (error) {
          details.blobFetchError = error.message;
        }
        
        // Clean up
        URL.revokeObjectURL(blobUrl);
      }
      
      return {
        canCreateBlobs,
        canPlayBlobs,
        blobUrlSupport,
        details
      };
      
    } catch (error) {
      return {
        canCreateBlobs: false,
        canPlayBlobs: false,
        blobUrlSupport: false,
        details: { error: error.message }
      };
    }
  }
  
  static async fixMediaPlayback(recording: {
    blob: Blob;
    url: string;
    type: 'audio' | 'video';
  }): Promise<{
    success: boolean;
    fixedUrl?: string;
    method: string;
    error?: string;
  }> {
    console.log('[MEDIA_FIXER] Attempting to fix media playback for:', recording.type);
    
    try {
      // Method 1: Refresh blob URL
      if (recording.url && recording.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(recording.url);
        } catch (e) {
          console.log('[MEDIA_FIXER] Could not revoke old URL:', e);
        }
      }
      
      // Method 2: Create new blob URL
      const newUrl = URL.createObjectURL(recording.blob);
      console.log('[MEDIA_FIXER] Created new blob URL:', newUrl);
      
      // Method 3: Test the new URL
      const testResponse = await fetch(newUrl);
      if (!testResponse.ok) {
        throw new Error(`Blob URL test failed: ${testResponse.status}`);
      }
      
      console.log('[MEDIA_FIXER] Blob URL test successful');
      
      return {
        success: true,
        fixedUrl: newUrl,
        method: 'blob_url_refresh'
      };
      
    } catch (error) {
      console.error('[MEDIA_FIXER] All methods failed:', error);
      
      // Last resort: Try data URL for small files
      if (recording.blob.size < 50 * 1024 * 1024) { // Less than 50MB
        try {
          const dataUrl = await this.blobToDataUrl(recording.blob);
          return {
            success: true,
            fixedUrl: dataUrl,
            method: 'data_url_fallback'
          };
        } catch (dataUrlError) {
          console.error('[MEDIA_FIXER] Data URL fallback failed:', dataUrlError);
        }
      }
      
      return {
        success: false,
        method: 'all_methods_failed',
        error: error.message
      };
    }
  }
  
  static async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  static async enhanceMediaElement(
    element: HTMLAudioElement | HTMLVideoElement,
    recording: { blob: Blob; url: string; type: 'audio' | 'video' }
  ): Promise<boolean> {
    console.log('[MEDIA_FIXER] Enhancing media element for production playback');
    
    try {
      // Production-specific media element configuration
      element.preload = 'auto';
      element.controls = true;
      
      if (element instanceof HTMLVideoElement) {
        element.playsInline = true;
        element.muted = false; // Ensure not muted for production
      }
      
      if (element instanceof HTMLAudioElement) {
        element.volume = 1.0;
      }
      
      // Set crossOrigin for blob URLs in production
      if (recording.url.startsWith('blob:')) {
        element.crossOrigin = 'anonymous';
      }
      
      // Force reload and wait for ready state
      element.load();
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('[MEDIA_FIXER] Media enhancement timeout');
          resolve(false);
        }, 5000);
        
        element.addEventListener('loadeddata', () => {
          clearTimeout(timeout);
          console.log('[MEDIA_FIXER] Media element enhanced successfully');
          resolve(true);
        }, { once: true });
        
        element.addEventListener('error', (error) => {
          clearTimeout(timeout);
          console.error('[MEDIA_FIXER] Media element enhancement failed:', error);
          resolve(false);
        }, { once: true });
      });
      
    } catch (error) {
      console.error('[MEDIA_FIXER] Media element enhancement error:', error);
      return false;
    }
  }
}