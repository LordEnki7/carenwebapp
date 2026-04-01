import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEmergencyAlerts } from "@/hooks/useEmergencyAlerts";
import { Car, MessageSquare, Video, ScanFace, Satellite, Signal, Mic, Users, MapPin, Wrench, Bluetooth, BluetoothConnected, VolumeX, Shield, Play, Copy, Gift, Bell, BellOff, AlertTriangle, X } from "lucide-react";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import SmartContextualUI from "@/components/SmartContextualUI";
import { useBluetoothHandsFree } from "@/hooks/useBluetoothHandsFree";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FacialRecognition } from "@/components/FacialRecognition";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getTimeContext, trackFeatureUsage } from "@/utils/contextualIntelligence";
import { DemoStatusBanner } from "@/components/DemoStatusBanner";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { QuickLegalChat } from "@/components/QuickLegalChat";
import { useLocation } from "wouter";
import { JourneyActions, initializeJourneyTracking } from "@/utils/journeyTracking";
import PanicHome from "@/components/PanicHome";
import ChatAgent from "@/components/ChatAgent";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { handsFreeStatus, connectedDevice, isBluetoothAvailable } = useBluetoothHandsFree();
  const { enablePushNotifications, isPushEnabled } = useEmergencyAlerts();
  const [, setLocation] = useLocation();
  const [showFacialRecognition, setShowFacialRecognition] = useState(false);
  // Always start on PanicHome — never persist "More Options" across sessions
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  
  const { data: referralData, refetch: refetchReferral } = useQuery<{ referralCode: string | null; total: number; converted: number; rewardEarned: boolean }>({
    queryKey: ["/api/referrals/my"],
    enabled: isAuthenticated,
  });

  const generateReferralCode = async () => {
    try {
      await apiRequest("POST", "/api/referrals/generate", {});
      refetchReferral();
    } catch {}
  };

  // Auto-generate referral code on dashboard load if none exists
  useEffect(() => {
    if (isAuthenticated && referralData !== undefined && referralData.referralCode === null) {
      generateReferralCode();
    }
  }, [isAuthenticated, referralData]);

  // Screenshot mode support
  const urlParams = new URLSearchParams(window.location.search);
  const isScreenshotMode = urlParams.get('screenshot') === '1';
  const emergencyMode = urlParams.get('emergency') === '1';
  const recordingMode = urlParams.get('recording') === '1';
  const voiceMode = urlParams.get('voiceActive') === '1';

  // Removed onboarding hooks - no longer needed for automatic display
  const [systemStatus, setSystemStatus] = useState({
    gps: isScreenshotMode ? 'connected' : 'connected', // connected, searching, disconnected
    recording: isScreenshotMode ? recordingMode : false,
    voiceActive: isScreenshotMode ? voiceMode : false,
    attorneys: isScreenshotMode ? 4 : 3, // number of available attorneys
    emergency: isScreenshotMode ? emergencyMode : false
  });
  const [timeTheme, setTimeTheme] = useState('afternoon');
  const { toast } = useToast();
  const { location, isLoading: gpsLoading, calibrateGPS, getCurrentLocation } = useGeolocation();
  const { data: emergencyContacts } = useEmergencyContacts();
  const [contactBannerDismissed, setContactBannerDismissed] = useState(() =>
    localStorage.getItem('caren_contact_banner_dismissed') === 'true'
  );
  const hasNoContacts = Array.isArray(emergencyContacts) && emergencyContacts.length === 0 && !contactBannerDismissed;

  // Dynamic time-of-day theming
  useEffect(() => {
    const updateTimeTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setTimeTheme('morning');
      else if (hour >= 11 && hour < 17) setTimeTheme('afternoon');
      else if (hour >= 17 && hour < 21) setTimeTheme('evening');
      else setTimeTheme('night');
    };
    
    updateTimeTheme();
    const interval = setInterval(updateTimeTheme, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Initialize journey tracking and track dashboard access
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeJourneyTracking('dashboard', { 
        timeTheme,
        userAgent: navigator.userAgent,
        sessionStart: new Date().toISOString()
      });
      
      // Track dashboard access milestone
      JourneyActions.dashboardAccessed('authenticated');
    }
  }, [isAuthenticated, user, timeTheme]);

  // Simulate real-time system status updates
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        attorneys: Math.floor(Math.random() * 5) + 2, // 2-6 available attorneys
        gps: Math.random() > 0.1 ? 'connected' : 'searching' // 90% connected
      }));
    }, 5000);
    
    return () => clearInterval(statusInterval);
  }, []);

  const handleTestRecording = () => {
    setSystemStatus(prev => ({ ...prev, recording: !prev.recording }));
    toast({
      title: systemStatus.recording ? "Recording Stopped" : "Recording Started",
      description: systemStatus.recording ? "Evidence collection paused" : "Evidence collection active with waveform feedback",
    });
  };

  const handleTestVoiceCommand = () => {
    setSystemStatus(prev => ({ ...prev, voiceActive: !prev.voiceActive }));
    toast({
      title: systemStatus.voiceActive ? "Voice Commands Disabled" : "Voice Commands Activated",
      description: systemStatus.voiceActive ? "Manual control mode" : "Ready for hands-free operation",
    });
  };

  const handleTestEmergencyMode = () => {
    setSystemStatus(prev => ({ ...prev, emergency: !prev.emergency }));
    if (!systemStatus.emergency) {
      document.body.className = 'theme-emergency';
      toast({
        title: "EMERGENCY MODE ACTIVATED",
        description: "All systems prioritized for critical situation",
        variant: "destructive"
      });
    } else {
      document.body.className = '';
      toast({
        title: "Emergency Mode Deactivated",
        description: "Returning to normal operation mode",
      });
    }
  };

  const handleFacialRecognitionSuccess = (userId: string) => {
    toast({
      title: "Facial Recognition Setup Complete",
      description: "You can now sign in using facial recognition!",
    });
    setShowFacialRecognition(false);
  };

  const handleFacialRecognitionFailure = () => {
    setShowFacialRecognition(false);
    toast({
      title: "Setup Failed",
      description: "Please try again or contact support if the issue persists.",
      variant: "destructive",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  const handleShowFullDashboard = () => {
    setShowFullDashboard(true);
    localStorage.setItem('caren_show_full_dashboard', 'true');
  };

  if (!showFullDashboard && !isScreenshotMode) {
    return (
      <MobileResponsiveLayout>
        <PanicHome 
          onShowFullDashboard={handleShowFullDashboard}
          isEmergencyMode={systemStatus.emergency}
        />
      </MobileResponsiveLayout>
    );
  }

  return (
    <MobileResponsiveLayout>
      <div className="space-y-6">
        {/* Quick Toggle back to Panic Home */}
        <button
          onClick={() => {
            setShowFullDashboard(false);
            localStorage.setItem('caren_show_full_dashboard', 'false');
          }}
          data-testid="btn-panic-mode"
          className="w-full py-2 text-center text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
        >
          ← Back to Quick Actions
        </button>
        
        {/* Demo Status Banner */}
        <DemoStatusBanner />

        {/* No Emergency Contacts Banner */}
        {hasNoContacts && (
          <div className="relative flex items-start gap-3 rounded-xl border border-orange-500/40 bg-orange-500/10 p-4">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-300">No emergency contacts added</p>
              <p className="text-xs text-orange-200/70 mt-0.5 leading-relaxed">
                Without a contact, nobody is notified if you trigger an SOS alert.{" "}
                <button
                  onClick={() => setLocation('/settings')}
                  className="underline underline-offset-2 text-orange-300 hover:text-orange-200 font-medium"
                >
                  Add one now →
                </button>
              </p>
            </div>
            <button
              onClick={() => {
                setContactBannerDismissed(true);
                localStorage.setItem('caren_contact_banner_dismissed', 'true');
              }}
              className="flex-shrink-0 text-orange-400/60 hover:text-orange-300 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}


        {/* EMERGENCY PRIORITY SECTION - Always at Top */}
            <div className={`cyber-card p-6 border-4 animate-fade-in-up ${
              systemStatus.emergency ? 
              'border-red-500 bg-red-900/50 shadow-red-500/30 shadow-lg' : 
              'border-red-400 bg-red-900/20'
            }`}>
              <div className="text-center mb-4">
                <h2 className={`text-2xl font-bold ${
                  systemStatus.emergency ? 'text-red-300 animate-pulse' : 'text-red-400'
                }`}>
                  🚨 EMERGENCY PROTECTION READY 🚨
                </h2>
                <p className="text-red-300 text-sm mt-1">
                  {systemStatus.emergency ? 'EMERGENCY MODE ACTIVE - All systems prioritized' : 'Tap emergency mode for immediate protection'}
                </p>
              </div>
              
              {/* Emergency Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <button 
                  onClick={() => window.location.href = '/record'}
                  className={`p-4 rounded-lg font-bold transition-all duration-200 ${
                    systemStatus.emergency ?
                    'bg-red-600 text-white border-2 border-white hover:bg-red-500 text-lg shadow-lg' :
                    'bg-red-600 text-white hover:bg-red-700'
                  } hover:scale-105`}
                >
                  📹 START RECORDING
                </button>
                <button 
                  onClick={() => window.location.href = '/emergency-pullover'}
                  className={`p-4 rounded-lg font-bold transition-all duration-200 ${
                    systemStatus.emergency ?
                    'bg-red-600 text-white border-2 border-white hover:bg-red-500 text-lg shadow-lg' :
                    'bg-red-600 text-white hover:bg-red-700'
                  } hover:scale-105`}
                >
                  🚔 EMERGENCY PULLOVER
                </button>
                <button 
                  onClick={() => window.location.href = '/attorneys'}
                  className={`p-4 rounded-lg font-bold transition-all duration-200 ${
                    systemStatus.emergency ?
                    'bg-red-600 text-white border-2 border-white hover:bg-red-500 text-lg shadow-lg' :
                    'bg-red-600 text-white hover:bg-red-700'
                  } hover:scale-105`}
                >
                  👨‍💼 CONTACT ATTORNEY
                </button>
                <button
                  onClick={handleTestEmergencyMode}
                  className={`p-4 rounded-lg font-bold transition-all duration-200 ${
                    systemStatus.emergency ?
                    'bg-blue-600 text-white hover:bg-blue-700 border-2 border-white' :
                    'bg-orange-600 text-white hover:bg-orange-700 animate-pulse'
                  }`}
                >
                  {systemStatus.emergency ? '✓ EXIT EMERGENCY' : '🚨 EMERGENCY MODE'}
                </button>
              </div>

              {/* Emergency Contact Info */}
              {systemStatus.emergency && (
                <div className="bg-red-800 p-3 rounded-lg border border-red-500">
                  <p className="text-white text-center text-sm font-bold">
                    📞 Emergency contacts notified • 📍 GPS location shared • 🎥 Auto-recording enabled
                  </p>
                </div>
              )}

              {/* Push Alerts Toggle */}
              <div className="mt-2 flex items-center justify-center">
                <button
                  onClick={() => enablePushNotifications()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                    isPushEnabled
                      ? 'bg-green-900/40 border-green-600/40 text-green-300'
                      : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'
                  }`}
                >
                  {isPushEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                  {isPushEnabled ? 'Push Alerts Active' : 'Enable Push Alerts'}
                </button>
              </div>

              {/* Voice Activation Instructions */}
              <div className="mt-3 p-3 rounded-lg bg-red-950/50 border border-red-600/30">
                <p className="text-red-300 text-center text-xs">
                  🎤 <strong>VOICE COMMANDS:</strong> Say "EMERGENCY ACTIVATION" or "START RECORDING" for hands-free protection
                </p>
              </div>
            </div>

            {/* Dashboard Header */}
            <div className="cyber-card p-6 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div className="space-y-4">
                  <h1 className={`cyber-title text-4xl ${
                    systemStatus.emergency ? 'text-red-400' : ''
                  }`}>
                    {systemStatus.emergency ? 'EMERGENCY PROTECTION' : 'WELCOME TO C.A.R.E.N.™'}
                  </h1>
                  <p className="text-cyan-300 text-lg font-medium">
                    {systemStatus.emergency ? 'Emergency mode active - All systems ready' : 'Citizen Assistance for Roadside Emergencies and Navigation'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Language Selector */}
                  <div className="min-w-[200px]">
                    <LanguageSelector 
                      currentLanguage={user?.preferredLanguage || 'en'} 
                      compact={false}
                      showLabel={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Contextual Intelligence */}
            <SmartContextualUI className="animate-fade-in-up" />

            {/* Smart Visual Feedback Status Bar */}
            <div className="cyber-card p-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* GPS Status with Visual Feedback */}
                  <div className="flex items-center space-x-2">
                    <div className={`gps-indicator ${systemStatus.gps}`}>
                      <Satellite className={`w-4 h-4 gps-icon ${systemStatus.gps === 'searching' ? 'text-yellow-400' : systemStatus.gps === 'connected' ? 'text-cyan-400' : 'text-red-400'}`} />
                    </div>
                    <span className="text-sm text-cyan-300">
                      GPS {systemStatus.gps === 'connected' ? 'Connected' : systemStatus.gps === 'searching' ? 'Searching...' : 'Disconnected'}
                    </span>
                  </div>

                  {/* Bluetooth Hands-Free Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${handsFreeStatus.isConnected ? 'bg-cyan-400 animate-pulse-custom' : 'bg-gray-400'}`}></div>
                    {handsFreeStatus.isConnected ? (
                      <BluetoothConnected className={`w-4 h-4 text-cyan-400`} />
                    ) : (
                      <Bluetooth className={`w-4 h-4 text-cyan-400`} />
                    )}
                    <span className="text-sm text-cyan-300 font-medium">
                      {isBluetoothAvailable ? (
                        handsFreeStatus.isConnected 
                          ? `${connectedDevice?.name?.substring(0, 10) || 'Connected'}` 
                          : 'Bluetooth Ready'
                      ) : 'Bluetooth Off'}
                    </span>
                  </div>

                  {/* Connection Strength Indicator */}
                  <div className="flex items-center space-x-2">
                    <div className="connection-strength">
                      <div className={`connection-bar ${systemStatus.gps === 'connected' ? 'active' : ''}`}></div>
                      <div className={`connection-bar ${systemStatus.gps === 'connected' ? 'active' : ''}`}></div>
                      <div className={`connection-bar ${systemStatus.gps === 'connected' ? 'active' : ''}`}></div>
                      <div className={`connection-bar ${systemStatus.gps === 'connected' ? 'active' : ''}`}></div>
                    </div>
                    <span className="text-sm text-cyan-300">Signal Strong</span>
                  </div>

                  {/* Attorney Availability */}
                  <div className="flex items-center space-x-2">
                    <div className="attorney-status available">
                      <Users className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-sm text-cyan-300">{systemStatus.attorneys} Attorneys Online</span>
                  </div>

                  {/* Voice Command Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${systemStatus.voiceActive ? 'bg-cyan-400 animate-pulse-custom' : 'bg-gray-500'}`}></div>
                    <Mic className={`w-4 h-4 ${systemStatus.voiceActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                    <span className="text-sm text-cyan-300">Voice {systemStatus.voiceActive ? 'Active' : 'Ready'}</span>
                  </div>
                </div>
                
                {/* Recording Indicator */}
                <div className="flex items-center space-x-3">
                  {systemStatus.recording && (
                    <div className="recording-indicator text-sm text-red-400 font-medium">
                      <span>RECORDING</span>
                      <div className="waveform-bars ml-2">
                        <div className="waveform-bar"></div>
                        <div className="waveform-bar"></div>
                        <div className="waveform-bar"></div>
                        <div className="waveform-bar"></div>
                        <div className="waveform-bar"></div>
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-cyan-300">
                    Legal Protection Active
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Visual Feedback Demo Panel */}
            <div className="cyber-card p-6 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              <h3 className="text-lg font-semibold text-cyan-300 mb-4">Smart Visual Feedback & GPS Calibration</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mobile-grid">
                <button
                  onClick={handleTestRecording}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 hover-lift cyber-button-primary mobile-touch-target touch-friendly ${
                    systemStatus.recording 
                      ? 'border-red-400 bg-red-500/20 text-red-300' 
                      : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400'
                  }`}
                >
                  <Video className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">
                    {systemStatus.recording ? 'Stop Recording' : 'Test Recording'}
                  </div>
                  {systemStatus.recording && (
                    <div className="mt-2 flex justify-center">
                      <div className="waveform-bars">
                        <div className="waveform-bar"></div>
                        <div className="waveform-bar"></div>
                        <div className="waveform-bar"></div>
                        <div className="waveform-bar"></div>
                        <div className="waveform-bar"></div>
                      </div>
                    </div>
                  )}
                </button>

                <button
                  onClick={handleTestVoiceCommand}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 hover-lift cyber-button-primary mobile-touch-target touch-friendly ${
                    systemStatus.voiceActive 
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 voice-listening' 
                      : 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:border-purple-400'
                  }`}
                >
                  <Mic className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">
                    {systemStatus.voiceActive ? 'Voice Active' : 'Test Voice Commands'}
                  </div>
                </button>

                <button
                  onClick={handleTestEmergencyMode}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 hover-lift cyber-button-secondary mobile-emergency-button touch-friendly ${
                    systemStatus.emergency 
                      ? 'border-red-400 bg-red-500/20 text-red-300 animate-emergency-pulse' 
                      : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400'
                  }`}
                >
                  <div className="w-6 h-6 mx-auto mb-2 text-center font-bold text-lg">!</div>
                  <div className="text-sm font-medium">
                    {systemStatus.emergency ? 'Exit Emergency' : 'Test Emergency Mode'}
                  </div>
                </button>

                <button
                  onClick={calibrateGPS}
                  disabled={gpsLoading}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 hover-lift ${
                    gpsLoading 
                      ? 'border-blue-400 bg-blue-600/20 text-blue-300 opacity-75' 
                      : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400'
                  }`}
                >
                  <MapPin className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">
                    {gpsLoading ? 'Calibrating...' : 'Calibrate GPS'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    System Accuracy Test
                  </div>
                </button>
              </div>
              
              {location && (
                <div className="mt-4 p-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg">
                  <div className="text-sm text-cyan-300">
                    <strong>Current Location:</strong> {location.address || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Accuracy: {location.accuracy?.toFixed(0)}m | GPS: {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Emergency Pullover - Priority #1 */}
              <div
                onClick={() => window.location.href = '/emergency-pullover'}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 card-depth-2 hover-emergency hover-lift animate-emergency-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-red-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all status-indicator status-danger">
                      <Car className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-red-900 truncate">EMERGENCY</h3>
                      <h4 className="font-semibold text-red-800 truncate">Being Pulled Over</h4>
                      <p className="text-sm text-red-700 truncate">Immediate traffic stop protection</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Auto Mute - Mobile Priority */}
              <div
                onClick={() => window.location.href = '/smart-auto-mute'}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.15s' }}
              >
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 card-depth-2 hover-lift hover-glow">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-purple-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all status-indicator">
                      <VolumeX className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-purple-900 truncate">Smart Auto Mute</h3>
                      <p className="text-sm text-purple-700 truncate">Hands-free call protection</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* De-Escalation Guide - Mobile Priority */}
              <div
                onClick={() => window.location.href = '/de-escalation'}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 card-depth-2 hover-lift hover-glow">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-green-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all status-indicator">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-green-900 truncate">De-Escalation Guide</h3>
                      <p className="text-sm text-green-700 truncate">Stay safe during encounters</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Record Incidents */}
              <div
                onClick={() => window.location.href = '/record'}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 card-depth-2 hover-lift hover-glow">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-blue-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all status-indicator status-warning">
                      <Video className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-blue-900 truncate">Record Incidents</h3>
                      <p className="text-sm text-blue-700 truncate">Document interactions & evidence</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watch Tutorial Video */}
              <div
                onClick={() => window.location.href = '/onboarding'}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.25s' }}
              >
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-6 card-depth-2 hover-lift hover-glow">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-cyan-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all status-indicator">
                      <Play className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-cyan-900 truncate">Watch Tutorial</h3>
                      <p className="text-sm text-cyan-700 truncate">60-second platform overview</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Forum */}
              <div
                onClick={() => window.location.href = '/community'}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.3s' }}
              >
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6 card-depth-2 hover-lift hover-glow">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-indigo-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all status-indicator">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-indigo-900 truncate">Community Forum</h3>
                      <p className="text-sm text-indigo-700 truncate">Connect with fellow CAREN users</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attorney Messages */}
              <div
                onClick={() => window.location.href = '/messages'}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.35s' }}
              >
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 card-depth-2 hover-lift hover-glow">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-cyan-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all status-indicator status-safe">
                      <MessageSquare className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-blue-900 truncate">Attorney Messages</h3>
                      <p className="text-sm text-blue-700 truncate">Secure legal communications</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facial Recognition Setup */}
              <div
                onClick={() => setShowFacialRecognition(true)}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.4s' }}
              >
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 card-depth-2 hover-lift hover-glow">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-purple-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all">
                      <ScanFace className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-purple-900 truncate">Setup Face Login</h3>
                      <p className="text-sm text-purple-700 truncate">Enable facial recognition authentication</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roadside Assistance */}
              <div
                onClick={() => window.location.href = '/roadside-assistance'}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.5s' }}
              >
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 card-depth-2 hover-lift hover-glow">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-orange-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all">
                      <Wrench className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-orange-900 truncate">Roadside Assistance</h3>
                      <p className="text-sm text-orange-700 truncate">AAA & other provider services</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Emergency Action Button */}
            <div 
              className="fixed bottom-24 right-8 z-50 animate-scale-in"
              style={{ animationDelay: '0.6s' }}
            >
              <button
                onClick={() => window.location.href = '/emergency-pullover'}
                className="group bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg hover-emergency card-depth-4 animate-emergency-pulse"
                title="Emergency - I'm Being Pulled Over"
              >
                <Car className="w-8 h-8" />
                <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Emergency Button
                </span>
              </button>
            </div>

            {/* Quick Legal Chat - Integrated AI Assistant */}
            <div className="cyber-card rounded-xl card-depth-1 p-6 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              <h3 className="text-lg font-semibold text-cyan-300 mb-4">Quick Legal Assistant</h3>
              <QuickLegalChat 
                userLocation={location?.address}
                scenario="general"
                compact={true}
              />
            </div>

            {/* Refer a Friend */}
            {referralData?.referralCode && (
              <div className="cyber-card rounded-xl card-depth-1 p-6 animate-fade-in-up border border-purple-500/30" style={{ animationDelay: '0.75s' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-purple-300">Refer a Friend</h3>
                  </div>
                  {referralData.total >= 1 && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-bold">
                      🎉 {referralData.total} Referral{referralData.total !== 1 ? 's' : ''}!
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-4">Share your unique link — you get a free month when your friend subscribes.</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 text-sm font-mono truncate">
                    {`${window.location.origin}/?ref=${referralData.referralCode}`}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/?ref=${referralData.referralCode}`);
                    }}
                    className="p-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 rounded-lg text-purple-300 transition-colors"
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Referred: <strong className="text-white">{referralData.total}</strong></span>
                  <span>Converted: <strong className="text-green-300">{referralData.converted}</strong></span>
                  {referralData.rewardEarned && (
                    <span className="text-yellow-300 font-bold">✓ Free Month Earned!</span>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions Summary */}
            <div className="cyber-card rounded-xl card-depth-1 p-6 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <h3 className="text-lg font-semibold text-cyan-300 mb-4">Quick Access</h3>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-red-600/20 text-red-300 border border-red-500/30 rounded-full text-sm font-medium hover-lift cursor-pointer hover:bg-red-600/30" onClick={() => window.location.href = '/emergency-pullover'}>
                  Emergency Pullover
                </span>
                <span className="px-3 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-full text-sm font-medium hover-lift cursor-pointer hover:bg-blue-600/30" onClick={() => setLocation('/record')}>
                  Record Evidence
                </span>
                <span className="px-3 py-1 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-full text-sm font-medium hover-lift cursor-pointer hover:bg-cyan-600/30" onClick={() => setLocation('/attorneys')}>
                  Find Attorney
                </span>
                <span 
                  className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium hover-lift cursor-pointer hover:bg-purple-600/30" 
                  onClick={() => setLocation('/rights')}
                >
                  Know Your Rights
                </span>
              </div>
            </div>

            {/* Facial Recognition Setup Dialog */}
            <Dialog open={showFacialRecognition} onOpenChange={setShowFacialRecognition}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Setup Facial Recognition</DialogTitle>
                  <DialogDescription>
                    Register your face for secure, quick login to your account.
                  </DialogDescription>
                </DialogHeader>
                <FacialRecognition
                  mode="register"
                  onSuccess={handleFacialRecognitionSuccess}
                  onFailure={handleFacialRecognitionFailure}
                />
              </DialogContent>
            </Dialog>

            {/* Onboarding Video - removed automatic display for authenticated users */}
          </div>
          <ChatAgent />
    </MobileResponsiveLayout>
  );
}