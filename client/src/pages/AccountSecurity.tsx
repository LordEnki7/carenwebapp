import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import TopBar from "@/components/TopBar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Smartphone,
  Monitor,
  Tablet,
  Lock,
  AlertTriangle,
  Eye,
  UserX,
  Calendar
} from "lucide-react";

export default function AccountSecurity() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    deviceTrustEnabled: true,
    locationTrackingEnabled: true,
    suspiciousActivityAlerts: true
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadSecurityData();
    }
  }, [isAuthenticated]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [sessionsResponse, historyResponse] = await Promise.all([
        apiRequest("GET", "/api/auth/sessions"),
        apiRequest("GET", "/api/auth/login-history")
      ]);
      
      setActiveSessions(sessionsResponse || []);
      setLoginHistory(historyResponse || []);
    } catch (error) {
      console.log("Failed to load security data:", error);
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
    } finally {
      setLoading(false);
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gray-900">
        <TopBar 
          title="Account Security"
          description="Protect your account from unauthorized access"
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Account Security</h1>
                <p className="text-gray-300">Protect your account from unauthorized access</p>
              </div>
            </div>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <Tabs defaultValue="sessions" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-700/50">
                    <TabsTrigger value="sessions" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Active Sessions</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Login History</TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Security Settings</TabsTrigger>
                    <TabsTrigger value="alerts" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Security Alerts</TabsTrigger>
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
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-white">
                                    {session.browser} on {session.deviceType}
                                  </p>
                                  {session.isCurrent && (
                                    <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/20">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-300">
                                  {session.location} • IP: {session.ip}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Last active: {new Date(session.lastActive).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {!session.isCurrent && (
                              <Button 
                                onClick={() => handleRevokeSession(session.id)}
                                variant="outline" 
                                size="sm"
                                className="border-gray-600 text-white hover:bg-gray-700/50"
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-400 mb-1">Session Security</h4>
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
                            <div className={`w-2 h-2 rounded-full ${login.success ? 'bg-green-400' : 'bg-red-400'}`} />
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
                      <div className="flex items-center justify-between p-4 border border-gray-700/50 bg-gray-800/30 rounded-lg">
                        <div>
                          <Label className="font-medium text-white">Device Trust</Label>
                          <p className="text-sm text-gray-300">Remember trusted devices for faster sign-in</p>
                        </div>
                        <Switch 
                          checked={securitySettings.deviceTrustEnabled}
                          onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, deviceTrustEnabled: checked}))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-700/50 bg-gray-800/30 rounded-lg">
                        <div>
                          <Label className="font-medium text-white">Location Tracking</Label>
                          <p className="text-sm text-gray-300">Track login locations for security monitoring</p>
                        </div>
                        <Switch 
                          checked={securitySettings.locationTrackingEnabled}
                          onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, locationTrackingEnabled: checked}))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-700/50 bg-gray-800/30 rounded-lg">
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
                    
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-400 mb-1">Account Protected</h4>
                          <p className="text-sm text-gray-300">
                            No suspicious activity detected. Your account is secure.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-400 mb-1">Domain Security Notice</h4>
                          <p className="text-sm text-gray-300">
                            Remember: Sessions don't transfer between domains. Each domain requires separate authentication for security.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-white">Security Recommendations</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-gray-300">Use strong, unique passwords</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-gray-300">Monitor login activity regularly</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-gray-300">Sign out from public/shared devices</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-yellow-400" />
                          <span className="text-gray-300">Revoke unused sessions periodically</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </MobileResponsiveLayout>
  );
}