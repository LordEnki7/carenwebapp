import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEmergencyAlerts } from "@/hooks/useEmergencyAlerts";
import { Car, MessageSquare, Video, Satellite, Signal, Mic, Users, MapPin, Wrench, Bluetooth, BluetoothConnected, VolumeX, Shield, Play, Copy, Gift, Bell, BellOff, AlertTriangle, X, CreditCard, ChevronRight, Zap } from "lucide-react";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import SmartContextualUI from "@/components/SmartContextualUI";
import { useBluetoothHandsFree } from "@/hooks/useBluetoothHandsFree";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getTimeContext, trackFeatureUsage } from "@/utils/contextualIntelligence";
import { DemoStatusBanner } from "@/components/DemoStatusBanner";
import { TrialBanner } from "@/components/TrialBanner";
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
  // Start on PanicHome — user can swipe into full dashboard
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  
  const { data: referralData, refetch: refetchReferral } = useQuery<{
    referralCode: string | null;
    total: number;
    converted: number;
    rewardEarned: boolean;
    rewardTier: number;
    referralCount: number;
    isSafetyAmbassador: boolean;
    nextTierAt: number | null;
    nextTierReward: string;
    premiumExpiresAt: string | null;
  }>({
    queryKey: ["/api/referrals/my"],
    enabled: isAuthenticated,
  });

  const { data: founderStatus } = useQuery<{ isFoundingMember: boolean; claimed: boolean; expiresAt?: string }>({
    queryKey: ["/api/founders/my-status"],
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

  // Paywall gate — free-tier users must choose a plan; trial users pass through
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const tier = (user as any).subscriptionTier;
      const trialEndsAt = (user as any).trialEndsAt;
      const trialActive = tier === 'trial' && trialEndsAt && new Date(trialEndsAt) > new Date();
      if (!tier || (tier === 'free' && !trialActive)) {
        window.location.href = '/plans?new=true';
      }
    }
  }, [authLoading, isAuthenticated, user]);

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
        
        {/* Trial Status Banner */}
        <TrialBanner />

        {/* Demo Status Banner */}
        <DemoStatusBanner />

        {/* Plans & Pricing — always visible */}
        <button
          onClick={() => setLocation('/plans')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 hover:from-cyan-900/50 hover:to-purple-900/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Plans &amp; Pricing</p>
              <p className="text-xs text-slate-400">View or upgrade your subscription</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        </button>

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
            <div className={`cyber-card p-3 sm:p-6 border-4 animate-fade-in-up ${
              systemStatus.emergency ? 
              'border-red-500 bg-red-900/50 shadow-red-500/30 shadow-lg' : 
              'border-red-400 bg-red-900/20'
            }`}>

              {/* BIG HERO BUTTON — PRIMARY CTA */}
              <button
                onClick={() => window.location.href = '/emergency-pullover'}
                className="w-full mb-4 py-7 px-2 rounded-2xl font-black text-xl sm:text-3xl tracking-widest uppercase text-white bg-red-600 hover:bg-red-500 active:bg-red-700 border-4 border-white shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:shadow-[0_0_50px_rgba(239,68,68,0.9)] transition-all duration-200 animate-emergency-pulse text-center leading-tight"
              >
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <span className="text-2xl sm:text-3xl">🚔</span>
                  <span>I'M BEING<br className="sm:hidden" /> PULLED OVER</span>
                  <span className="text-2xl sm:text-3xl">🚔</span>
                </div>
              </button>

              {/* Emergency Quick Actions — 2 columns on mobile, 4 on desktop */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-3">
                <button 
                  onClick={() => window.location.href = '/record'}
                  className="p-3 sm:p-4 rounded-xl font-bold text-sm sm:text-base bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-all duration-200 flex flex-col items-center gap-1"
                >
                  <span className="text-xl">📹</span>
                  <span>START RECORDING</span>
                </button>
                <button 
                  onClick={() => window.location.href = '/attorneys'}
                  className="p-3 sm:p-4 rounded-xl font-bold text-sm sm:text-base bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-all duration-200 flex flex-col items-center gap-1"
                >
                  <span className="text-xl">👨‍💼</span>
                  <span>ATTORNEY</span>
                </button>
                <button 
                  onClick={() => window.location.href = '/legal-rights'}
                  className="p-3 sm:p-4 rounded-xl font-bold text-sm sm:text-base bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-all duration-200 flex flex-col items-center gap-1"
                >
                  <span className="text-xl">⚖️</span>
                  <span>MY RIGHTS</span>
                </button>
                <button
                  onClick={handleTestEmergencyMode}
                  className={`p-3 sm:p-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 flex flex-col items-center gap-1 ${
                    systemStatus.emergency ?
                    'bg-blue-600 text-white hover:bg-blue-700' :
                    'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  <span className="text-xl">{systemStatus.emergency ? '✓' : '🚨'}</span>
                  <span>{systemStatus.emergency ? 'EXIT MODE' : 'EMERGENCY'}</span>
                </button>
              </div>

              {/* Emergency Contact Info */}
              {systemStatus.emergency && (
                <div className="bg-red-800 p-3 rounded-lg border border-red-500">
                  <p className="text-white text-center text-xs font-bold">
                    📞 Contacts notified • 📍 GPS shared • 🎥 Recording enabled
                  </p>
                </div>
              )}

              {/* Push Alerts Toggle + Voice hint row */}
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => enablePushNotifications()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isPushEnabled
                      ? 'bg-green-900/40 border-green-600/40 text-green-300'
                      : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'
                  }`}
                >
                  {isPushEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  {isPushEnabled ? 'Alerts On' : 'Enable Alerts'}
                </button>
                <p className="text-red-300/70 text-xs text-right">
                  🎤 Say "EMERGENCY ACTIVATION"
                </p>
              </div>
            </div>

            {/* Dashboard Header */}
            <div className="cyber-card p-4 sm:p-6 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className={`cyber-title text-2xl sm:text-4xl ${
                    systemStatus.emergency ? 'text-red-400' : ''
                  }`}>
                    {systemStatus.emergency ? 'EMERGENCY PROTECTION' : 'WELCOME TO C.A.R.E.N.™'}
                  </h1>
                  <p className="text-cyan-300 text-sm sm:text-lg font-medium mt-1">
                    {systemStatus.emergency ? 'Emergency mode active — All systems ready' : 'Citizen Assistance for Roadside Emergencies'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <LanguageSelector 
                    currentLanguage={user?.preferredLanguage || 'en'} 
                    compact={true}
                    showLabel={false}
                  />
                </div>
              </div>
            </div>

            {/* Smart Contextual Intelligence */}
            <SmartContextualUI className="animate-fade-in-up" />

            {/* Smart Visual Feedback Status Bar — wraps on mobile */}
            <div className="cyber-card p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* GPS */}
                <div className="flex items-center gap-1.5">
                  <Satellite className={`w-4 h-4 ${systemStatus.gps === 'connected' ? 'text-cyan-400' : systemStatus.gps === 'searching' ? 'text-yellow-400' : 'text-red-400'}`} />
                  <span className="text-xs text-cyan-300">
                    GPS {systemStatus.gps === 'connected' ? 'On' : systemStatus.gps === 'searching' ? 'Searching' : 'Off'}
                  </span>
                </div>

                {/* Bluetooth */}
                <div className="flex items-center gap-1.5">
                  {handsFreeStatus.isConnected
                    ? <BluetoothConnected className="w-4 h-4 text-cyan-400" />
                    : <Bluetooth className="w-4 h-4 text-cyan-400" />}
                  <span className="text-xs text-cyan-300">
                    {handsFreeStatus.isConnected ? 'BT Connected' : 'Bluetooth'}
                  </span>
                </div>

                {/* Attorneys */}
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-cyan-300">{systemStatus.attorneys} Attorneys</span>
                </div>

                {/* Voice */}
                <div className="flex items-center gap-1.5">
                  <Mic className={`w-4 h-4 ${systemStatus.voiceActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <span className="text-xs text-cyan-300">Voice {systemStatus.voiceActive ? 'Active' : 'Ready'}</span>
                </div>

                {/* Recording live indicator */}
                {systemStatus.recording && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-bold">RECORDING</span>
                  </div>
                )}

                {/* Legal protection badge */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-green-300">Protection Active</span>
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

              {/* EV Connect */}
              <div
                onClick={() => window.location.href = '/ev-connect'}
                className="group cursor-pointer animate-scale-in"
                style={{ animationDelay: '0.15s' }}
              >
                <div className="bg-gradient-to-br from-cyan-50 to-teal-100 border border-cyan-200 rounded-xl p-6 card-depth-2 hover-lift hover-glow">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-cyan-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all status-indicator">
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-cyan-900 truncate">EV Connect</h3>
                      <p className="text-sm text-cyan-700 truncate">Link your electric vehicle</p>
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

            {/* Founding Member Badge */}
            {founderStatus?.isFoundingMember && (
              <div className="cyber-card rounded-xl card-depth-1 p-5 animate-fade-in-up border border-yellow-500/40 bg-yellow-500/5" style={{ animationDelay: '0.72s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🏆</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-yellow-300 font-bold text-sm">Founding Member</span>
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-bold">EXCLUSIVE</span>
                    </div>
                    <p className="text-yellow-200/60 text-xs mt-0.5">
                      Premium access {founderStatus.expiresAt ? `until ${new Date(founderStatus.expiresAt).toLocaleDateString()}` : "active"}
                    </p>
                  </div>
                  <button
                    onClick={() => setLocation("/founders")}
                    className="text-yellow-400/60 hover:text-yellow-300 text-xs shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Cloud Incidents — R2 secure recording storage */}
            <div className="cyber-card rounded-xl card-depth-1 p-5 animate-fade-in-up border border-cyan-500/20 bg-cyan-500/5" style={{ animationDelay: '0.71s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0 text-xl">☁️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-cyan-300 font-semibold text-sm">Cloud Incidents</p>
                  <p className="text-cyan-200/60 text-xs mt-0.5">Record &amp; store footage securely in the cloud</p>
                </div>
                <button
                  onClick={() => setLocation('/incidents')}
                  className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs font-semibold transition-colors flex-shrink-0"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* Always-On Dashcam */}
            <div className="cyber-card rounded-xl card-depth-1 p-5 animate-fade-in-up border border-purple-500/20 bg-purple-500/5" style={{ animationDelay: '0.715s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-xl">📷</div>
                <div className="flex-1 min-w-0">
                  <p className="text-purple-300 font-semibold text-sm">Always-On Dashcam</p>
                  <p className="text-purple-200/60 text-xs mt-0.5">Buffers 10 min of footage — tap to lock &amp; upload</p>
                </div>
                <button
                  onClick={() => setLocation('/dashcam')}
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-xs font-semibold transition-colors flex-shrink-0"
                >
                  Open →
                </button>
              </div>
            </div>

            {/* Story Spotlight — Phase 3 */}
            <div className="cyber-card rounded-xl card-depth-1 p-5 animate-fade-in-up border border-green-500/20 bg-green-500/5" style={{ animationDelay: '0.72s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 text-xl">🎥</div>
                <div className="flex-1 min-w-0">
                  <p className="text-green-300 font-semibold text-sm">Story Spotlight</p>
                  <p className="text-green-200/60 text-xs mt-0.5">Share your story — win 1 month premium</p>
                </div>
                <button
                  onClick={() => setLocation('/share-story')}
                  className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 text-xs font-semibold transition-colors flex-shrink-0"
                >
                  Submit →
                </button>
              </div>
            </div>

            {/* Safety Ambassador Badge */}
            {referralData?.isSafetyAmbassador && (
              <div className="cyber-card rounded-xl card-depth-1 p-5 animate-fade-in-up border border-purple-500/40 bg-purple-500/5" style={{ animationDelay: '0.73s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-purple-300 font-bold text-sm">Safety Ambassador</span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">EARNED</span>
                    </div>
                    <p className="text-purple-200/60 text-xs mt-0.5">
                      {referralData.referralCount} referrals — thank you for growing the C.A.R.E.N. community
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Refer a Friend */}
            {referralData?.referralCode && (
              <div className="cyber-card rounded-xl card-depth-1 p-6 animate-fade-in-up border border-purple-500/30" style={{ animationDelay: '0.75s' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-purple-300">Refer & Earn</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {referralData.isSafetyAmbassador && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">🛡️ Ambassador</span>
                    )}
                    {referralData.referralCount >= 1 && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-bold">
                        🎉 {referralData.referralCount} Referral{referralData.referralCount !== 1 ? 's' : ''}!
                      </span>
                    )}
                  </div>
                </div>

                {/* Tier progress */}
                {referralData.nextTierAt !== null ? (
                  <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-300 text-xs font-semibold">Next reward: {referralData.nextTierReward}</span>
                      <span className="text-purple-400 text-xs font-bold">
                        {referralData.referralCount}/{referralData.nextTierAt}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (referralData.referralCount / referralData.nextTierAt) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-purple-300 text-xs font-semibold">🛡️ Maximum tier reached — you're a Safety Ambassador!</p>
                    {referralData.premiumExpiresAt && (
                      <p className="text-purple-200/60 text-xs mt-1">Premium active until {new Date(referralData.premiumExpiresAt).toLocaleDateString()}</p>
                    )}
                  </div>
                )}

                {/* Tier ladder */}
                <div className="flex items-center gap-1 mb-4">
                  {[
                    { at: 1,  label: "1 ref",  reward: "1 wk",  tier: 1  },
                    { at: 3,  label: "3 refs", reward: "1 mo",  tier: 3  },
                    { at: 10, label: "10 refs", reward: "3 mo + 🛡️", tier: 10 },
                  ].map((step, i) => {
                    const done = referralData.referralCount >= step.at;
                    return (
                      <div key={step.at} className="flex items-center flex-1">
                        <div className={`flex-1 text-center px-1 py-1.5 rounded-lg border text-xs ${done ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-white/5 border-white/10 text-gray-500"}`}>
                          <div className="font-bold">{done ? "✓" : step.label}</div>
                          <div className="text-xs opacity-80">{step.reward}</div>
                        </div>
                        {i < 2 && <div className={`w-3 h-px mx-0.5 ${done ? "bg-green-500/40" : "bg-white/10"}`} />}
                      </div>
                    );
                  })}
                </div>

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
                  <span>Referred: <strong className="text-white">{referralData.referralCount ?? referralData.total}</strong></span>
                  <span>Converted: <strong className="text-green-300">{referralData.converted}</strong></span>
                  {referralData.rewardTier > 0 && (
                    <span className="text-yellow-300 font-bold">✓ Rewards active</span>
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
                <span
                  className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 rounded-full text-sm font-bold hover-lift cursor-pointer hover:bg-cyan-500/30"
                  onClick={() => setLocation('/plans')}
                >
                  💳 Plans &amp; Pricing
                </span>
              </div>
            </div>

            {/* Onboarding Video - removed automatic display for authenticated users */}
          </div>
          <ChatAgent />
    </MobileResponsiveLayout>
  );
}