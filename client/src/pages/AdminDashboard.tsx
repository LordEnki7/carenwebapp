import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Clock, Activity, UserCheck, Calendar, Key, Mail, CheckCircle2, Send } from "lucide-react";
import { MobileResponsiveLayout } from "@/components/MobileResponsiveLayout";
import { TopBar } from "@/components/TopBar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface UserSession {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  lastLogin: string;
  isCurrentlyActive: boolean;
  sessionDuration?: number;
  loginCount: number;
  authMethod: 'password' | 'demo' | 'oauth';
  deviceInfo?: string;
  ipAddress?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  demoUsers: number;
  regularUsers: number;
  averageSessionDuration: number;
  totalLogins: number;
  usersToday: number;
  usersThisWeek: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Admin authentication
  const authenticateAdmin = () => {
    if (adminKey === "CAREN_ADMIN_2025_PRODUCTION") {
      setIsAuthenticated(true);
      toast({
        title: "✅ Admin Access Granted", 
        description: "Welcome to C.A.R.E.N.™ Production Admin Dashboard",
      });
    } else {
      toast({
        title: "❌ Access Denied",
        description: "Invalid admin key. Please contact system administrator.",
        variant: "destructive",
      });
    }
  };

  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 10000,
  });

  const { data: userSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/admin/sessions"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: emailCampaigns, isLoading: campaignsLoading } = useQuery<any[]>({
    queryKey: ["/api/email-campaigns/admin"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getAuthMethodBadge = (method: string) => {
    switch (method) {
      case 'demo':
        return <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">Demo</Badge>;
      case 'password':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-300">Password</Badge>;
      case 'oauth':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">OAuth</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <MobileResponsiveLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Admin Access</CardTitle>
              <CardDescription className="text-gray-400">
                Enter admin key to access C.A.R.E.N.™ production dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminKey" className="text-gray-300">Admin Key</Label>
                <Input
                  id="adminKey"
                  type="password"
                  placeholder="Enter admin key..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && authenticateAdmin()}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button 
                onClick={authenticateAdmin} 
                className="w-full"
                disabled={!adminKey}
              >
                <Key className="w-4 h-4 mr-2" />
                Access Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileResponsiveLayout>
    );
  }

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gray-900 p-4 md:p-6">
        <TopBar 
          title="Admin Dashboard" 
          description="User sessions and platform statistics"
        />

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Admin Access Notice */}
          <Alert className="border-red-500/50 bg-red-500/10">
            <Shield className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-300">
              <strong>Admin Access:</strong> You are viewing sensitive user data. Handle with care and follow privacy guidelines.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600">
                User Analytics
              </TabsTrigger>
              <TabsTrigger value="sessions" className="text-white data-[state=active]:bg-blue-600">
                Live Sessions
              </TabsTrigger>
              <TabsTrigger value="email-series" className="text-white data-[state=active]:bg-blue-600">
                <Mail className="w-4 h-4 mr-1.5" />
                Email Series
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {statsLoading ? "..." : adminStats?.totalUsers || 0}
                </div>
                <p className="text-xs text-gray-400">
                  {statsLoading ? "Loading..." : `${adminStats?.usersToday || 0} today`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Active Now</CardTitle>
                <Activity className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {statsLoading ? "..." : adminStats?.activeUsers || 0}
                </div>
                <p className="text-xs text-gray-400">
                  {statsLoading ? "Loading..." : `${adminStats?.demoUsers || 0} demo users`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Avg Session</CardTitle>
                <Clock className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {statsLoading ? "..." : formatDuration(adminStats?.averageSessionDuration || 0)}
                </div>
                <p className="text-xs text-gray-400">
                  Average duration
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Logins</CardTitle>
                <UserCheck className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {statsLoading ? "..." : adminStats?.totalLogins || 0}
                </div>
                <p className="text-xs text-gray-400">
                  {statsLoading ? "Loading..." : `${adminStats?.usersThisWeek || 0} this week`}
                </p>
              </CardContent>
            </Card>
          </div>

            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              {/* User Sessions Table */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Live User Sessions
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Real-time user activity and session information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading user sessions...</div>
                  ) : userSessions && userSessions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700">
                            <TableHead className="text-gray-300">User</TableHead>
                            <TableHead className="text-gray-300">Status</TableHead>
                            <TableHead className="text-gray-300">Auth Method</TableHead>
                            <TableHead className="text-gray-300">Last Login</TableHead>
                            <TableHead className="text-gray-300">Session Duration</TableHead>
                            <TableHead className="text-gray-300">Login Count</TableHead>
                            <TableHead className="text-gray-300">Device/IP</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userSessions.map((session: UserSession) => (
                            <TableRow key={session.id} className="border-gray-700">
                              <TableCell className="text-white">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {session.firstName && session.lastName 
                                      ? `${session.firstName} ${session.lastName}`
                                      : session.email
                                    }
                                  </span>
                                  {session.firstName && session.lastName && (
                                    <span className="text-sm text-gray-400">{session.email}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {session.isCurrentlyActive ? (
                                  <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-400">
                                    Offline
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {getAuthMethodBadge(session.authMethod)}
                              </TableCell>
                              <TableCell className="text-gray-300">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(session.lastLogin), { addSuffix: true })}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-300">
                                {session.sessionDuration ? formatDuration(session.sessionDuration) : 'N/A'}
                              </TableCell>
                              <TableCell className="text-gray-300">
                                {session.loginCount}
                              </TableCell>
                              <TableCell className="text-gray-400 text-sm">
                                <div className="max-w-32 truncate">
                                  {session.deviceInfo || session.ipAddress || 'Unknown'}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No active user sessions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email-series" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Total Enrolled</CardTitle>
                    <Mail className="h-4 w-4 text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {campaignsLoading ? "..." : emailCampaigns?.length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Active Series</CardTitle>
                    <Send className="h-4 w-4 text-cyan-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {campaignsLoading ? "..." : emailCampaigns?.filter((c: any) => c.status === "active").length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Completed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {campaignsLoading ? "..." : emailCampaigns?.filter((c: any) => c.status === "completed").length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Avg Progress</CardTitle>
                    <Activity className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {campaignsLoading ? "..." : emailCampaigns && emailCampaigns.length > 0
                        ? `${Math.round(emailCampaigns.reduce((sum: number, c: any) => sum + ((c.currentStep || 0) / (c.totalSteps || 5)) * 100, 0) / emailCampaigns.length)}%`
                        : "0%"
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-purple-400" />
                    Email Education Series - All Users
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Track each user's progress through the 5-part email education series
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {campaignsLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading email campaigns...</div>
                  ) : emailCampaigns && emailCampaigns.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700">
                            <TableHead className="text-gray-300">User Email</TableHead>
                            <TableHead className="text-gray-300">Status</TableHead>
                            <TableHead className="text-gray-300">Progress</TableHead>
                            <TableHead className="text-gray-300">Current Step</TableHead>
                            <TableHead className="text-gray-300">Enrolled</TableHead>
                            <TableHead className="text-gray-300">Last Sent</TableHead>
                            <TableHead className="text-gray-300">Next Send</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emailCampaigns.map((campaign: any) => {
                            const progress = Math.round(((campaign.currentStep || 0) / (campaign.totalSteps || 5)) * 100);
                            const stepNames = [
                              "Not started",
                              "Welcome & Getting Started",
                              "Know Your Rights",
                              "Stay Safe - Emergency",
                              "AI-Powered Protection",
                              "You're Protected - What's Next?"
                            ];
                            return (
                              <TableRow key={campaign.id} className="border-gray-700">
                                <TableCell className="text-white font-medium">
                                  {campaign.email}
                                </TableCell>
                                <TableCell>
                                  {campaign.status === "active" ? (
                                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">Active</Badge>
                                  ) : campaign.status === "completed" ? (
                                    <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Completed</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-400">{campaign.status}</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          progress >= 100 ? "bg-green-500" : progress >= 60 ? "bg-cyan-500" : "bg-purple-500"
                                        }`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-gray-300">{progress}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-300">
                                  <span className="text-white font-medium">{campaign.currentStep || 0}</span>
                                  <span className="text-gray-500">/{campaign.totalSteps || 5}</span>
                                  <span className="block text-xs text-gray-500 mt-0.5">
                                    {stepNames[campaign.currentStep] || stepNames[0]}
                                  </span>
                                </TableCell>
                                <TableCell className="text-gray-300">
                                  {campaign.createdAt ? (
                                    <div>
                                      <div className="text-sm">{new Date(campaign.createdAt).toLocaleDateString()}</div>
                                      <div className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                                      </div>
                                    </div>
                                  ) : "N/A"}
                                </TableCell>
                                <TableCell className="text-gray-300 text-sm">
                                  {campaign.lastSentAt
                                    ? formatDistanceToNow(new Date(campaign.lastSentAt), { addSuffix: true })
                                    : "Not yet"
                                  }
                                </TableCell>
                                <TableCell className="text-gray-300 text-sm">
                                  {campaign.status === "completed" ? (
                                    <Badge variant="outline" className="text-green-400 border-green-500/30">Done</Badge>
                                  ) : campaign.nextSendAt ? (
                                    <div>
                                      <div className="text-sm">{new Date(campaign.nextSendAt).toLocaleDateString()}</div>
                                      <div className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(campaign.nextSendAt), { addSuffix: true })}
                                      </div>
                                    </div>
                                  ) : "Pending"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No users enrolled in the email series yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}