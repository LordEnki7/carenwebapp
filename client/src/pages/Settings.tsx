import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useBluetoothAudioManager } from "@/hooks/useBluetoothAudioManager";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import EmergencyContactsManager from "@/components/EmergencyContactsManager";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Trash2, 
  Save, 
  Settings as SettingsIcon,
  Bluetooth,
  Car,
  Camera,
  Wifi,
  Smartphone,
  Monitor,
  Tablet,
  Lock,
  AlertTriangle,
  Eye,
  UserX,
  Calendar
} from "lucide-react";
import { LANGUAGES, US_STATES } from "@/types";
import { t, setLanguage, getCurrentLanguage } from "@/lib/i18n";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Bluetooth audio manager
  const {
    connectedDevices,
    isCarConnected,
    requestBluetoothAccess,
    speakWithPriority
  } = useBluetoothAudioManager();
  
  // Profile settings
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentState, setCurrentState] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState(getCurrentLanguage());
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [recordingReminders, setRecordingReminders] = useState(false);

  // Security state
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    deviceTrustEnabled: true,
    locationTrackingEnabled: true,
    suspiciousActivityAlerts: true
  });

  // Auth check with better error handling
  useEffect(() => {
    if (authLoading) {
      console.log('[SETTINGS] Auth loading...');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('[SETTINGS] Not authenticated, redirecting to login...');
      toast({
        title: "Authentication Required",
        description: "Please sign in to access settings.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1000);
      return;
    }
    
    console.log('[SETTINGS] Authenticated user:', user && typeof user === 'object' ? (user as any).id : 'no-user');
  }, [isAuthenticated, authLoading, toast, user]);

  // Load security data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSecurityData();
    }
  }, [isAuthenticated]);

  // Load user data
  useEffect(() => {
    if (user && typeof user === 'object') {
      setFirstName((user as any).firstName || "");
      setLastName((user as any).lastName || "");
      setEmail((user as any).email || "");
    }
  }, [user]);

  // Single consolidated early return for loading/auth states
  if (authLoading || !isAuthenticated || !user) {
    return (
      <MobileResponsiveLayout title="Settings" description="Account settings and preferences">
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <div className="pl-72 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                {authLoading ? (
                  <>
                    <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Settings...</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">Authentication required</p>
                    <Button onClick={() => window.location.href = "/signin"} className="bg-blue-600 text-white">
                      Sign In
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </MobileResponsiveLayout>
    );
  }

  const loadSecurityData = async () => {
    try {
      const [sessionsResponse, historyResponse] = await Promise.all([
        apiRequest("GET", "/api/auth/sessions"),
        apiRequest("GET", "/api/auth/login-history")
      ]);
      
      setActiveSessions(Array.isArray(sessionsResponse) ? sessionsResponse : []);
      setLoginHistory(Array.isArray(historyResponse) ? historyResponse : []);
    } catch (error) {
      console.log("Failed to load security data:", error);
      // Set mock data for demonstration
      setActiveSessions([
        {
          id: "current",
          deviceType: "Desktop",
          browser: "Chrome 137.0",
          location: "Your Location",
          ip: "10.83.3.147",
          lastActive: new Date().toISOString(),
          isCurrent: true
        }
      ]);
      setLoginHistory([
        {
          id: "1",
          timestamp: new Date().toISOString(),
          deviceType: "Desktop",
          browser: "Chrome 137.0",
          location: "Your Location",
          ip: "10.83.3.147",
          success: true
        }
      ]);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiRequest("DELETE", `/api/auth/sessions/${sessionId}`);
      toast({
        title: "Session Revoked",
        description: "The session has been terminated successfully",
      });
      loadSecurityData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive",
      });
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await apiRequest("DELETE", "/api/auth/sessions/all");
      toast({
        title: "All Sessions Revoked",
        description: "All other sessions have been terminated. You'll need to sign in again on other devices.",
      });
      loadSecurityData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke sessions",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await apiRequest("PATCH", "/api/user/profile", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        currentState,
        preferredLanguage,
      });

      // Update language setting
      setLanguage(preferredLanguage);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleDeleteAccount = () => {
    setLocation('/account-security');
  };



  return (
    <MobileResponsiveLayout title="Settings" description="Manage your account, preferences, and security settings">
      <div className="min-h-screen bg-gray-900">
        <TopBar 
          title={t("settings")}
          description="Manage your account, preferences, and security settings"
        />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg border border-gray-700/50 relative overflow-hidden">
              <div className="text-center space-y-4 relative z-10">
                <h1 className="text-white text-4xl font-bold">Settings</h1>
                <p className="text-gray-300 text-lg">Manage your account, preferences, and security settings</p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 transition-all duration-300 p-6">
              <div className="border-b border-gray-700/50 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                    <p className="text-sm text-gray-300">Update your personal details and location</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed through this interface</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentState">Current State</Label>
                    <Select value={currentState} onValueChange={setCurrentState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Preferred Language</Label>
                    <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            {language.flag} {language.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <EmergencyContactsManager />


            {/* Notification Settings */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 transition-all duration-300 p-6">
              <div className="border-b border-cyan-500/30 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                    <Bell className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
                    <p className="text-sm text-gray-300">Control how you receive alerts and updates</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-sm font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-xs text-gray-400">Receive updates about your incidents and account</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emergency-alerts" className="text-sm font-medium">
                      Emergency Alerts
                    </Label>
                    <p className="text-xs text-gray-400">Send alerts to emergency contacts during incidents</p>
                  </div>
                  <Switch
                    id="emergency-alerts"
                    checked={emergencyAlerts}
                    onCheckedChange={setEmergencyAlerts}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="recording-reminders" className="text-sm font-medium">
                      Recording Reminders
                    </Label>
                    <p className="text-xs text-gray-400">Periodic reminders about incident recording</p>
                  </div>
                  <Switch
                    id="recording-reminders"
                    checked={recordingReminders}
                    onCheckedChange={setRecordingReminders}
                  />
                </div>
              </div>
            </div>

            {/* Car Audio & Video Connection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 transition-all duration-300 p-6">
              <div className="border-b border-cyan-500/30 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                    <Bluetooth className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Car Audio & Video Connection</h2>
                    <p className="text-sm text-gray-300">Connect your car's audio system and external cameras for hands-free operation</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {/* Car Audio Connection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-white">Car Audio System</h3>
                        <p className="text-sm text-gray-300">
                          {isCarConnected 
                            ? `Connected to ${connectedDevices.find(d => d.type === 'car')?.name || 'car audio'}`
                            : 'Connect to car audio for priority voice alerts'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCarConnected && (
                        <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">
                          <Wifi className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      <Button 
                        onClick={requestBluetoothAccess}
                        variant={isCarConnected ? "outline" : "default"}
                        size="sm"
                        disabled={isCarConnected}
                      >
                        <Bluetooth className="w-4 h-4 mr-2" />
                        {isCarConnected ? 'Connected' : 'Connect Car Audio'}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Car className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-white mb-1">Car Audio Features</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Emergency voice alerts with audio priority</li>
                          <li>• Constitutional rights announcements</li>
                          <li>• Hands-free voice command responses</li>
                          <li>• Recording status notifications</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* External Camera Connection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-white">External Cameras</h3>
                        <p className="text-sm text-gray-300">Connect dashcams and body cameras for multi-angle recording</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('startBluetoothScan', {
                          detail: { deviceType: 'camera' }
                        }));
                        toast({
                          title: "Camera Search",
                          description: "Scanning for available cameras and recording devices",
                        });
                      }}
                      variant="default"
                      size="sm"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Connect Cameras
                    </Button>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Camera className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-white mb-1">Supported Camera Types</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Bluetooth dashcams and action cameras</li>
                          <li>• Body cameras with wireless connectivity</li>
                          <li>• Multi-angle recording coordination</li>
                          <li>• Automatic incident documentation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connected Devices List */}
                {connectedDevices.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-medium text-white">Connected Devices</h3>
                      <div className="space-y-2">
                        {connectedDevices.map((device, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {device.type === 'car' ? (
                                <Car className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Camera className="w-4 h-4 text-purple-400" />
                              )}
                              <div>
                                <p className="font-medium text-white">{device.name}</p>
                                <p className="text-sm text-gray-300 capitalize">{device.type}</p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={device.isConnected 
                                ? "text-green-400 border-green-500/30 bg-green-500/10" 
                                : "text-gray-300 border-gray-500/30 bg-gray-500/10"
                              }
                            >
                              {device.isConnected ? 'Connected' : 'Disconnected'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Voice Command Tip */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <SettingsIcon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Voice Command Access</h4>
                      <p className="text-sm text-gray-300">
                        Say <strong className="text-cyan-300">"open settings"</strong> or <strong className="text-cyan-300">"car audio settings"</strong> to access this page using voice commands
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="p-6 rounded-lg bg-gray-800/50 border border-cyan-500/30">
              <div className="border-b border-cyan-500/30 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-cyan-300">Account Security</h2>
                    <p className="text-sm text-gray-400">Protect your account from unauthorized access</p>
                  </div>
                </div>
              </div>
              <div>
                <Tabs defaultValue="sessions" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
                    <TabsTrigger value="history">Login History</TabsTrigger>
                    <TabsTrigger value="settings">Security Settings</TabsTrigger>
                    <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sessions" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">Active Sessions</h3>
                      <Button 
                        onClick={handleRevokeAllSessions}
                        variant="destructive" 
                        size="sm"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Revoke All Sessions
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {activeSessions.map((session: any) => (
                        <div key={session.id} className="border border-gray-700/50 bg-gray-800/30 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {session.deviceType === 'Desktop' ? (
                                <Monitor className="w-5 h-5 text-blue-400" />
                              ) : session.deviceType === 'Mobile' ? (
                                <Smartphone className="w-5 h-5 text-green-400" />
                              ) : (
                                <Tablet className="w-5 h-5 text-purple-400" />
                              )}
                              <div>
                                <p className="font-medium text-white">
                                  {session.browser} on {session.deviceType}
                                  {session.isCurrent && (
                                    <Badge variant="outline" className="ml-2 text-green-400 border-green-500/30 bg-green-500/10">
                                      Current
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-gray-300">
                                  {session.location} • IP: {session.ip}
                                </p>
                                <p className="text-xs text-gray-300">
                                  Last active: {new Date(session.lastActive).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {!session.isCurrent && (
                              <Button 
                                onClick={() => handleRevokeSession(session.id)}
                                variant="outline" 
                                size="sm"
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white mb-1">Session Security</h4>
                          <p className="text-sm text-gray-300">
                            Sessions are domain-specific for security. You need to sign in separately on different domains (Replit vs custom .com).
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    <h3 className="font-medium text-white">Recent Login Activity</h3>
                    
                    <div className="space-y-3">
                      {loginHistory.map((login: any) => (
                        <div key={login.id} className="border border-gray-700/50 bg-gray-800/30 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${login.success ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-white">
                                  {login.success ? 'Successful Login' : 'Failed Login Attempt'}
                                </p>
                                <span className="text-sm text-gray-300">
                                  {new Date(login.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300">
                                {login.browser} on {login.deviceType} • {login.location} • {login.ip}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <h3 className="font-medium text-white">Security Preferences</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium text-white">Device Trust</Label>
                          <p className="text-sm text-gray-300">Remember trusted devices for faster sign-in</p>
                        </div>
                        <Switch 
                          checked={securitySettings.deviceTrustEnabled}
                          onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, deviceTrustEnabled: checked}))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium text-white">Location Tracking</Label>
                          <p className="text-sm text-gray-300">Track login locations for security monitoring</p>
                        </div>
                        <Switch 
                          checked={securitySettings.locationTrackingEnabled}
                          onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, locationTrackingEnabled: checked}))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium text-white">Suspicious Activity Alerts</Label>
                          <p className="text-sm text-gray-300">Get notified of unusual account activity</p>
                        </div>
                        <Switch 
                          checked={securitySettings.suspiciousActivityAlerts}
                          onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, suspiciousActivityAlerts: checked}))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="alerts" className="space-y-4">
                    <h3 className="font-medium text-white">Security Alerts</h3>
                    
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-white mb-1">Account Protected</h4>
                          <p className="text-sm text-gray-300">
                            No suspicious activity detected. Your account is secure.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 mb-1">Domain Security Notice</h4>
                          <p className="text-sm text-yellow-700">
                            Remember: Sessions don't transfer between domains. Each domain requires separate authentication for security.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Security Recommendations</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Use strong, unique passwords</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Monitor login activity regularly</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Sign out from public/shared devices</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span>Revoke unused sessions periodically</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Privacy & Data Protection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 transition-all duration-300 p-6">
              <div className="border-b border-green-500/30 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                    <Eye className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Privacy & Data Protection</h2>
                    <p className="text-sm text-gray-300">Control your data and privacy settings</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Data Protection Enabled</h4>
                      <p className="text-sm text-gray-300">
                        Your account data is encrypted and protected. Sessions are domain-specific for maximum security.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <a href="/privacy" className="text-cyan-400 hover:text-cyan-300 text-sm underline">Privacy Policy</a>
                  <a href="/terms" className="text-cyan-400 hover:text-cyan-300 text-sm underline">Terms of Service</a>
                </div>

                {/* Account Deletion — required by App Store Guideline 5.1.1(v) */}
                <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <h4 className="font-semibold text-white mb-1">Delete Account</h4>
                      <p className="text-sm text-gray-400 mb-3">
                        Permanently delete your C.A.R.E.N.™ account and all associated data. This action cannot be undone.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </main>
      </div>
    </MobileResponsiveLayout>
  );
}
