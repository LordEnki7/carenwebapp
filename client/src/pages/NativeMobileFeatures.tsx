import React, { useState } from 'react';
import { Smartphone, Camera, MapPin, Zap, Shield, Wifi, Battery, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NativeCameraAccess from '@/components/NativeCameraAccess';
import { useNativeMobileFeatures } from '@/hooks/useNativeMobileFeatures';
import { useToast } from '@/hooks/use-toast';

export default function NativeMobileFeatures() {
  const [activeDemo, setActiveDemo] = useState<string>('');
  const { toast } = useToast();
  
  const {
    isNativeApp,
    deviceInfo,
    networkStatus,
    hasCameraAccess,
    hasLocationAccess,
    hasHapticsAccess,
    cameraPermission,
    locationPermission,
    notificationPermission,
    currentLocation,
    triggerHapticFeedback,
    triggerEmergencyHaptic,
    getCurrentLocation,
    scheduleEmergencyNotification,
    monitorNetworkStatus,
    isLoading,
  } = useNativeMobileFeatures();

  const handleTestHaptics = async () => {
    try {
      setActiveDemo('haptics');
      await triggerHapticFeedback();
      
      toast({
        title: "Haptic Test",
        description: "Standard haptic feedback triggered",
      });
      
      setTimeout(() => setActiveDemo(''), 2000);
    } catch (error) {
      toast({
        title: "Haptic Error",
        description: "Haptic feedback not available on this device",
        variant: "destructive",
      });
    }
  };

  const handleTestEmergencyHaptic = async () => {
    try {
      setActiveDemo('emergency-haptics');
      await triggerEmergencyHaptic();
      
      toast({
        title: "Emergency Haptic Pattern",
        description: "Emergency alert haptic pattern activated",
      });
      
      setTimeout(() => setActiveDemo(''), 3000);
    } catch (error) {
      toast({
        title: "Haptic Error",
        description: "Emergency haptic pattern not available",
        variant: "destructive",
      });
    }
  };

  const handleTestNotification = async () => {
    try {
      setActiveDemo('notification');
      await scheduleEmergencyNotification(
        'CAREN Emergency Test',
        'This is a test of the emergency notification system',
        2000
      );
      
      toast({
        title: "Notification Scheduled",
        description: "Test notification will appear in 2 seconds",
      });
      
      setTimeout(() => setActiveDemo(''), 3000);
    } catch (error) {
      toast({
        title: "Notification Error",
        description: "Unable to schedule notification",
        variant: "destructive",
      });
    }
  };

  const handleTestLocation = async () => {
    try {
      setActiveDemo('location');
      await getCurrentLocation({ enableHighAccuracy: true });
      
      toast({
        title: "Location Updated",
        description: "High-accuracy GPS location captured",
      });
      
      setTimeout(() => setActiveDemo(''), 2000);
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Unable to get location. Check GPS permissions.",
        variant: "destructive",
      });
    }
  };

  const getPermissionStatusColor = (permission: string | null) => {
    switch (permission) {
      case 'granted': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'denied': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'prompt': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="cyber-card p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-cyan-300 mb-2">Initializing Native Features</h2>
            <p className="text-gray-300">Detecting device capabilities and requesting permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="cyber-card p-6 mb-6 animate-fade-in-up">
          <div className="flex items-center space-x-3 mb-4">
            <Smartphone className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-cyan-300">Native Mobile Features</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Advanced mobile capabilities for enhanced emergency legal protection
          </p>
        </div>

        {/* Device Status Overview */}
        <div className="cyber-card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-semibold text-cyan-300 mb-4">Device Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-cyan-500/30 bg-gray-800/50">
              <Smartphone className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="text-sm">
                <div className="font-medium text-white">Platform</div>
                <div className="text-cyan-400">
                  {isNativeApp ? deviceInfo?.platform || 'Native App' : 'Web Browser'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-cyan-500/30 bg-gray-800/50">
              <Wifi className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="text-sm">
                <div className="font-medium text-white">Network</div>
                <div className="text-cyan-400">
                  {networkStatus?.connected ? networkStatus.connectionType : 'Offline'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-cyan-500/30 bg-gray-800/50">
              <Battery className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="text-sm">
                <div className="font-medium text-white">Model</div>
                <div className="text-cyan-400">
                  {deviceInfo?.model || 'Unknown'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-cyan-500/30 bg-gray-800/50">
              <Shield className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="text-sm">
                <div className="font-medium text-white">OS Version</div>
                <div className="text-cyan-400">
                  {deviceInfo?.osVersion || 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Status */}
        <div className="cyber-card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-semibold text-cyan-300 mb-4">Permission Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${getPermissionStatusColor(cameraPermission)}`}>
              <Camera className="w-6 h-6 mb-2" />
              <div className="text-sm">
                <div className="font-medium text-white">Camera Access</div>
                <div className="capitalize">{cameraPermission || 'Unknown'}</div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${getPermissionStatusColor(locationPermission)}`}>
              <MapPin className="w-6 h-6 mb-2" />
              <div className="text-sm">
                <div className="font-medium text-white">Location Access</div>
                <div className="capitalize">{locationPermission || 'Unknown'}</div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${getPermissionStatusColor(notificationPermission)}`}>
              <Bell className="w-6 h-6 mb-2" />
              <div className="text-sm">
                <div className="font-medium text-white">Notifications</div>
                <div className="capitalize">{notificationPermission || 'Unknown'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Tabs */}
        <div className="cyber-card p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="camera" className="cyber-tab">Camera & Video</TabsTrigger>
              <TabsTrigger value="location" className="cyber-tab">GPS & Location</TabsTrigger>
              <TabsTrigger value="haptics" className="cyber-tab">Haptic Feedback</TabsTrigger>
              <TabsTrigger value="notifications" className="cyber-tab">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-6">
              <NativeCameraAccess 
                onPhotoTaken={(url) => {
                  toast({
                    title: "Photo Captured",
                    description: "Evidence photo saved with GPS metadata",
                  });
                }}
                onVideoRecorded={(url) => {
                  toast({
                    title: "Video Recorded",
                    description: "Evidence video saved with location data",
                  });
                }}
                isEmergencyMode={true}
              />
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">GPS Location Services</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleTestLocation}
                    className={`cyber-button-primary mobile-touch-target ${
                      activeDemo === 'location' ? 'animate-pulse' : ''
                    }`}
                    disabled={!hasLocationAccess}
                  >
                    <MapPin className="w-5 h-5 mb-2 mx-auto" />
                    <div className="text-sm font-medium">Get High-Accuracy Location</div>
                  </button>

                  <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-500/30">
                    <h4 className="font-medium text-cyan-300 mb-2">Location Features</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• High-accuracy GPS positioning</li>
                      <li>• Continuous location tracking</li>
                      <li>• GPS metadata in evidence</li>
                      <li>• Emergency location sharing</li>
                    </ul>
                  </div>
                </div>

                {currentLocation && (
                  <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                    <h4 className="font-medium text-blue-300 mb-2">Current Location</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-200">
                      <div>
                        <div>Latitude: {currentLocation.coords.latitude.toFixed(6)}</div>
                        <div>Longitude: {currentLocation.coords.longitude.toFixed(6)}</div>
                      </div>
                      <div>
                        <div>Accuracy: ±{currentLocation.coords.accuracy?.toFixed(0)}m</div>
                        <div>Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="haptics" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">Haptic Feedback System</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleTestHaptics}
                    className={`cyber-button-primary mobile-touch-target ${
                      activeDemo === 'haptics' ? 'animate-pulse' : ''
                    }`}
                    disabled={!hasHapticsAccess}
                  >
                    <Zap className="w-5 h-5 mb-2 mx-auto" />
                    <div className="text-sm font-medium">Test Standard Haptic</div>
                  </button>

                  <button
                    onClick={handleTestEmergencyHaptic}
                    className={`cyber-button-secondary mobile-emergency-button ${
                      activeDemo === 'emergency-haptics' ? 'animate-pulse' : ''
                    }`}
                    disabled={!hasHapticsAccess}
                  >
                    <Zap className="w-5 h-5 mb-2 mx-auto" />
                    <div className="text-sm font-medium">Test Emergency Pattern</div>
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-500/30">
                  <h4 className="font-medium text-cyan-300 mb-2">Haptic Features</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Emergency alert patterns</li>
                    <li>• Silent status notifications</li>
                    <li>• Touch feedback confirmation</li>
                    <li>• Recording status indicators</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">Emergency Notifications</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleTestNotification}
                    className={`cyber-button-primary mobile-touch-target ${
                      activeDemo === 'notification' ? 'animate-pulse' : ''
                    }`}
                    disabled={notificationPermission !== 'granted'}
                  >
                    <Bell className="w-5 h-5 mb-2 mx-auto" />
                    <div className="text-sm font-medium">Test Emergency Notification</div>
                  </button>

                  <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-500/30">
                    <h4 className="font-medium text-cyan-300 mb-2">Notification Features</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Emergency alert notifications</li>
                      <li>• Recording status updates</li>
                      <li>• Attorney communication alerts</li>
                      <li>• Background monitoring notifications</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Installation Guide */}
        {!isNativeApp && (
          <div className="cyber-card p-6 border-yellow-500/30 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-semibold text-yellow-300 mb-4">Install Native App</h2>
            <p className="text-gray-300 mb-4">
              To access full native mobile features, install CAREN as a native app on your device:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                <h3 className="font-medium text-yellow-300 mb-2">iOS Installation</h3>
                <ol className="text-sm text-yellow-200 space-y-1">
                  <li>1. Open Safari browser</li>
                  <li>2. Tap Share button</li>
                  <li>3. Select "Add to Home Screen"</li>
                  <li>4. Tap "Add" to install</li>
                </ol>
              </div>
              <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                <h3 className="font-medium text-yellow-300 mb-2">Android Installation</h3>
                <ol className="text-sm text-yellow-200 space-y-1">
                  <li>1. Open Chrome browser</li>
                  <li>2. Tap menu (three dots)</li>
                  <li>3. Select "Add to Home screen"</li>
                  <li>4. Tap "Add" to install</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}