import React, { useState } from 'react';
import { Camera, Video, Smartphone, Shield, MapPin, Zap } from 'lucide-react';
import { useNativeMobileFeatures } from '@/hooks/useNativeMobileFeatures';
import { useToast } from '@/hooks/use-toast';

interface NativeCameraAccessProps {
  onPhotoTaken?: (imageUrl: string) => void;
  onVideoRecorded?: (videoUrl: string) => void;
  isEmergencyMode?: boolean;
}

export default function NativeCameraAccess({ 
  onPhotoTaken, 
  onVideoRecorded, 
  isEmergencyMode = false 
}: NativeCameraAccessProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<{ type: 'photo' | 'video'; url: string }[]>([]);
  const { toast } = useToast();
  
  const {
    isNativeApp,
    hasCameraAccess,
    hasLocationAccess,
    currentLocation,
    cameraPermission,
    takePicture,
    takeVideo,
    getCurrentLocation,
    triggerHapticFeedback,
    triggerEmergencyHaptic,
    startEmergencyRecording,
    isLoading,
  } = useNativeMobileFeatures();

  const handleTakePhoto = async () => {
    try {
      await triggerHapticFeedback();
      
      const image = await takePicture({
        quality: 90,
        allowEditing: false,
        saveToGallery: true,
      });

      if (image.webPath) {
        setCapturedMedia(prev => [...prev, { type: 'photo', url: image.webPath! }]);
        onPhotoTaken?.(image.webPath);
        
        toast({
          title: "Photo Captured",
          description: "Evidence photo saved to device and ready for legal use",
        });
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to capture photo. Check camera permissions.",
        variant: "destructive",
      });
    }
  };

  const handleTakeVideo = async () => {
    try {
      setIsRecording(true);
      await triggerHapticFeedback();
      
      const video = await takeVideo();
      
      if (video.webPath) {
        setCapturedMedia(prev => [...prev, { type: 'video', url: video.webPath! }]);
        onVideoRecorded?.(video.webPath);
        
        toast({
          title: "Video Recorded",
          description: "Evidence video saved to device and ready for legal use",
        });
      }
    } catch (error) {
      console.error('Video recording error:', error);
      toast({
        title: "Recording Error",
        description: "Unable to record video. Check camera permissions.",
        variant: "destructive",
      });
    } finally {
      setIsRecording(false);
    }
  };

  const handleEmergencyRecording = async () => {
    try {
      await triggerEmergencyHaptic();
      
      const emergencyData = await startEmergencyRecording();
      
      // Start video recording immediately
      await handleTakeVideo();
      
      toast({
        title: "Emergency Recording Active",
        description: `Location: ${emergencyData.location.coords.latitude.toFixed(4)}, ${emergencyData.location.coords.longitude.toFixed(4)}`,
      });
    } catch (error) {
      console.error('Emergency recording error:', error);
      toast({
        title: "Emergency Error",
        description: "Unable to start emergency recording",
        variant: "destructive",
      });
    }
  };

  const handleGetLocation = async () => {
    try {
      await triggerHapticFeedback();
      const location = await getCurrentLocation({ enableHighAccuracy: true });
      
      toast({
        title: "Location Updated",
        description: `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`,
      });
    } catch (error) {
      console.error('Location error:', error);
      toast({
        title: "Location Error",
        description: "Unable to get current location. Check GPS permissions.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="cyber-card p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
          <span className="text-cyan-300">Initializing native features...</span>
        </div>
      </div>
    );
  }

  if (!isNativeApp) {
    return (
      <div className="cyber-card p-6 border-yellow-500/30">
        <div className="flex items-center space-x-3 mb-4">
          <Smartphone className="w-6 h-6 text-yellow-400" />
          <h3 className="text-lg font-semibold text-yellow-300">Web Browser Mode</h3>
        </div>
        <p className="text-gray-300 mb-4">
          Install CAREN as a mobile app for native camera, GPS, and emergency features.
        </p>
        <button className="cyber-button-primary w-full">
          Install Native App
        </button>
      </div>
    );
  }

  return (
    <div className="cyber-card p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-cyan-400" />
        <h3 className="text-lg font-semibold text-cyan-300">Native Mobile Evidence Capture</h3>
      </div>

      {/* Permission Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-3 rounded-lg border ${
          hasCameraAccess 
            ? 'border-green-500/30 bg-green-500/10' 
            : 'border-red-500/30 bg-red-500/10'
        }`}>
          <Camera className="w-5 h-5 mb-2 text-cyan-400" />
          <div className="text-sm">
            <div className="font-medium text-white">Camera</div>
            <div className={hasCameraAccess ? 'text-green-400' : 'text-red-400'}>
              {cameraPermission || 'Unknown'}
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-lg border ${
          hasLocationAccess 
            ? 'border-green-500/30 bg-green-500/10' 
            : 'border-red-500/30 bg-red-500/10'
        }`}>
          <MapPin className="w-5 h-5 mb-2 text-cyan-400" />
          <div className="text-sm">
            <div className="font-medium text-white">GPS</div>
            <div className={hasLocationAccess ? 'text-green-400' : 'text-red-400'}>
              {hasLocationAccess ? 'Ready' : 'Denied'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10">
          <Zap className="w-5 h-5 mb-2 text-cyan-400" />
          <div className="text-sm">
            <div className="font-medium text-white">Haptics</div>
            <div className="text-cyan-400">Available</div>
          </div>
        </div>
      </div>

      {/* Emergency Recording Button */}
      {isEmergencyMode && (
        <button
          onClick={handleEmergencyRecording}
          className={`w-full p-4 mb-4 rounded-lg border-2 transition-all duration-300 hover-lift mobile-emergency-button touch-friendly ${
            isRecording
              ? 'border-red-400 bg-red-500/20 text-red-300 animate-emergency-pulse'
              : 'border-red-500 bg-red-500/10 text-red-300 hover:bg-red-500/20'
          }`}
          disabled={!hasCameraAccess || !hasLocationAccess}
        >
          <div className="flex items-center justify-center space-x-2">
            <Video className="w-6 h-6" />
            <span className="font-bold">
              {isRecording ? 'EMERGENCY RECORDING ACTIVE' : 'START EMERGENCY RECORDING'}
            </span>
          </div>
          {isRecording && (
            <div className="mt-2 text-sm">Recording evidence with GPS location...</div>
          )}
        </button>
      )}

      {/* Camera Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleTakePhoto}
          className="cyber-button-primary mobile-touch-target touch-friendly"
          disabled={!hasCameraAccess}
        >
          <Camera className="w-5 h-5 mb-2 mx-auto" />
          <div className="text-sm font-medium">Capture Photo</div>
        </button>

        <button
          onClick={handleTakeVideo}
          className={`p-4 rounded-lg border-2 transition-all duration-300 hover-lift mobile-touch-target touch-friendly ${
            isRecording
              ? 'border-red-400 bg-red-500/20 text-red-300'
              : 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400'
          }`}
          disabled={!hasCameraAccess}
        >
          <Video className="w-5 h-5 mb-2 mx-auto" />
          <div className="text-sm font-medium">
            {isRecording ? 'Recording...' : 'Record Video'}
          </div>
        </button>

        <button
          onClick={handleGetLocation}
          className="cyber-button-secondary mobile-touch-target touch-friendly"
          disabled={!hasLocationAccess}
        >
          <MapPin className="w-5 h-5 mb-2 mx-auto" />
          <div className="text-sm font-medium">Get GPS Location</div>
        </button>
      </div>

      {/* Current Location Display */}
      {currentLocation && (
        <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-500/30 mb-4">
          <h4 className="font-medium text-cyan-300 mb-2">Current Location</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <div>Latitude: {currentLocation.coords.latitude.toFixed(6)}</div>
            <div>Longitude: {currentLocation.coords.longitude.toFixed(6)}</div>
            <div>Accuracy: ±{currentLocation.coords.accuracy?.toFixed(0)}m</div>
            <div className="text-xs text-gray-400">
              Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Captured Media Gallery */}
      {capturedMedia.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-cyan-300 mb-4">Evidence Captured ({capturedMedia.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {capturedMedia.map((media, index) => (
              <div key={index} className="relative">
                <div className="aspect-square rounded-lg overflow-hidden border border-cyan-500/30">
                  {media.type === 'photo' ? (
                    <img 
                      src={media.url} 
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                      src={media.url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                  {media.type === 'photo' ? 'Photo' : 'Video'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
        <h4 className="font-medium text-blue-300 mb-2">Native Features Active</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Photos and videos saved to device gallery</li>
          <li>• GPS coordinates embedded in evidence</li>
          <li>• Haptic feedback for emergency alerts</li>
          <li>• Background notifications for emergency mode</li>
        </ul>
      </div>
    </div>
  );
}