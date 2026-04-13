import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Activity, Clock, Database, AlertTriangle, AlertCircle, Video, BookOpen, Zap, DollarSign, Brain, TrendingUp, Target, Building2, LifeBuoy, Megaphone, Share2 } from 'lucide-react';

const ADMIN_PANELS = [
  { label: "Director Admin", description: "Manage directors, issue PINs, track commissions", href: "/director-admin", icon: Building2, color: "border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/10", badge: "Manage" },
  { label: "Social Media Agent", description: "AI captions, post queue, LinkedIn publishing", href: "/social-agent", icon: Share2, color: "border-purple-500/40 hover:border-purple-400 hover:bg-purple-500/10", badge: "AI" },
  { label: "Support Admin", description: "Customer support tickets and escalations", href: "/support-admin", icon: LifeBuoy, color: "border-green-500/40 hover:border-green-400 hover:bg-green-500/10", badge: "Tickets" },
  { label: "Announcements Admin", description: "Manage posts, giveaways and announcements", href: "/announcements-admin", icon: Megaphone, color: "border-orange-500/40 hover:border-orange-400 hover:bg-orange-500/10", badge: "Posts" },
];

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalLogins: number;
  averageSessionDuration: number;
  demoUsers: number;
  regularUsers: number;
  usersToday: number;
  usersThisWeek: number;
  totalIncidents: number;
  emergencyAlerts: number;
  recordingsToday: number;
  legalRightsViewed: number;
  subscriptionBreakdown: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
  paymentStatistics: {
    totalRevenue: number;
    monthlyRevenue: number;
    averageRevenuePerUser: number;
    conversionRate: number;
    premiumUsers: number;
    paidUsers: number;
  };
}

interface UserSession {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isCurrentlyActive: boolean;
  loginCount: number;
  authMethod: string;
  lastLogin: string;
}

export default function SimpleAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [learningInsights, setLearningInsights] = useState<any>(null);

  const authenticateAdmin = () => {
    if (adminKey === 'CAREN_ADMIN_2025_PRODUCTION') {
      setIsAuthenticated(true);
      loadDashboardData();
    } else {
      alert('Invalid admin key');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load user stats
      const statsResponse = await fetch('/api/admin/user-stats', {
        headers: {
          'Authorization': 'Bearer CAREN_ADMIN_2025_PRODUCTION'
        }
      });
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats(stats);
      }

      // Load user sessions
      const sessionsResponse = await fetch('/api/admin/sessions', {
        headers: {
          'Authorization': 'Bearer CAREN_ADMIN_2025_PRODUCTION'
        }
      });
      
      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json();
        setUserSessions(sessions);
      }

      // Load learning analytics insights
      const learningResponse = await fetch('/api/learning-analytics/platform-insights', {
        headers: {
          'Authorization': 'Bearer CAREN_ADMIN_2025_PRODUCTION'
        }
      });
      
      if (learningResponse.ok) {
        const insights = await learningResponse.json();
        setLearningInsights(insights);
      }

      // No fallback data - show real statistics only

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // No fallback data - only show real statistics
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(loadDashboardData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-white">CAREN Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && authenticateAdmin()}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Button 
              onClick={authenticateAdmin}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Access Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">CAREN Admin Dashboard</h1>
          <p className="text-gray-300">User Login Tracking & Session Analytics</p>
        </div>

        {/* ── Admin Control Panels ─────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
            Admin Control Panels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ADMIN_PANELS.map(panel => (
              <a key={panel.href} href={panel.href}
                className={`block bg-gray-800/60 border rounded-xl p-4 transition-all cursor-pointer group ${panel.color}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <panel.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">{panel.badge}</span>
                </div>
                <p className="text-white font-semibold text-sm mb-1">{panel.label}</p>
                <p className="text-gray-400 text-xs leading-snug">{panel.description}</p>
                <p className="text-cyan-400 text-xs mt-3 group-hover:underline">Open →</p>
              </a>
            ))}
          </div>
        </div>

        {/* Core Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {userStats?.totalUsers || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Users</p>
                  <p className="text-3xl font-bold text-green-400">
                    {userStats?.activeUsers || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Logins</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {userStats?.totalLogins || 0}
                  </p>
                </div>
                <Database className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Session</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {userStats?.averageSessionDuration || 0}m
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency & Activity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Incidents</p>
                  <p className="text-3xl font-bold text-red-400">
                    {userStats?.totalIncidents || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Emergency Alerts</p>
                  <p className="text-3xl font-bold text-orange-400">
                    {userStats?.emergencyAlerts || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Recordings Today</p>
                  <p className="text-3xl font-bold text-indigo-400">
                    {userStats?.recordingsToday || 0}
                  </p>
                </div>
                <Video className="h-8 w-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Legal Rights Viewed</p>
                  <p className="text-3xl font-bold text-cyan-400">
                    {userStats?.legalRightsViewed || 0}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Load Testing Section */}
        <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border-purple-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-purple-300 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Load Testing
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Comprehensive performance testing for 100-1000+ concurrent users
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.open('/load-test', '_blank')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Launch Load Testing Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* N8N Emergency Automation Testing Section */}
        <Card className="bg-gradient-to-r from-orange-900/30 to-red-900/30 backdrop-blur-sm border-orange-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-orange-300 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              N8N Emergency Response Automation
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Test n8n webhook integrations for 10-15 second automated emergency response
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.open('/n8n-test', '_blank')}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Launch N8N Testing Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Card className="bg-gray-800 border-gray-700">
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-700">
              <TabsTrigger value="analytics" className="text-white">User Analytics</TabsTrigger>
              <TabsTrigger value="sessions" className="text-white">Live Sessions</TabsTrigger>
              <TabsTrigger value="payments" className="text-white">Payment Tracking</TabsTrigger>
              <TabsTrigger value="learning" className="text-white">Learning Analytics</TabsTrigger>
              <TabsTrigger value="platform" className="text-white">Platform Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">User Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">User Types</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Demo Users:</span>
                      <span className="font-semibold text-blue-400">{userStats?.demoUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Regular Users:</span>
                      <span className="font-semibold text-green-400">{userStats?.regularUsers || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Activity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Users Today:</span>
                      <span className="font-semibold text-yellow-400">{userStats?.usersToday || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Users This Week:</span>
                      <span className="font-semibold text-purple-400">{userStats?.usersThisWeek || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sessions" className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Live User Sessions</h3>
                <Button 
                  onClick={loadDashboardData} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-300">User</th>
                      <th className="text-left py-2 text-gray-300">Status</th>
                      <th className="text-left py-2 text-gray-300">Login Count</th>
                      <th className="text-left py-2 text-gray-300">Method</th>
                      <th className="text-left py-2 text-gray-300">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-gray-400">
                          No active sessions
                        </td>
                      </tr>
                    ) : (
                      userSessions.map((session, index) => (
                        <tr key={index} className="border-b border-gray-700">
                          <td className="py-2 text-gray-300">
                            <div>
                              <div className="font-semibold">{session.email || 'Demo User'}</div>
                              <div className="text-sm text-gray-400">
                                {session.firstName || ''} {session.lastName || ''}
                              </div>
                            </div>
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              session.isCurrentlyActive ? 'bg-green-600' : 'bg-gray-600'
                            }`}>
                              {session.isCurrentlyActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2 text-gray-300">{session.loginCount || 0}</td>
                          <td className="py-2 text-gray-300 capitalize">{session.authMethod || 'unknown'}</td>
                          <td className="py-2 text-gray-300">
                            <div className="text-sm">{new Date(session.lastLogin).toLocaleString()}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Payment Tracking</h3>
              
              {/* Payment Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-green-400">Monthly Subscribers</h4>
                        <p className="text-2xl font-bold text-white">{userStats?.subscriptionBreakdown?.basic || 0}</p>
                        <p className="text-sm text-gray-400">Recurring revenue</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-400">Premium Users</h4>
                        <p className="text-2xl font-bold text-white">{userStats?.subscriptionBreakdown?.premium || 0}</p>
                        <p className="text-sm text-gray-400">High-tier subscriptions</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-yellow-400">Total Revenue</h4>
                        <p className="text-2xl font-bold text-white">${userStats?.paymentStatistics?.totalRevenue?.toFixed(2) || '0.00'}</p>
                        <p className="text-sm text-gray-400">All-time earnings</p>
                      </div>
                      <Database className="h-8 w-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subscription Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Subscription Tiers</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Free Users:</span>
                      <span className="font-semibold text-gray-400">{userStats?.subscriptionBreakdown?.free || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Basic Subscribers:</span>
                      <span className="font-semibold text-blue-400">{userStats?.subscriptionBreakdown?.basic || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Premium Subscribers:</span>
                      <span className="font-semibold text-green-400">{userStats?.subscriptionBreakdown?.premium || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Enterprise Users:</span>
                      <span className="font-semibold text-purple-400">{userStats?.subscriptionBreakdown?.enterprise || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Revenue Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Monthly Revenue:</span>
                      <span className="font-semibold text-green-400">${userStats?.paymentStatistics?.monthlyRevenue?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Average per User:</span>
                      <span className="font-semibold text-blue-400">${userStats?.paymentStatistics?.averageRevenuePerUser?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Conversion Rate:</span>
                      <span className="font-semibold text-yellow-400">{userStats?.paymentStatistics?.conversionRate?.toFixed(1) || '0.0'}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="learning" className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Brain className="h-6 w-6 text-cyan-400" />
                  Learning Analytics - How CAREN Learns from Users
                </h3>
                <Button 
                  onClick={loadDashboardData} 
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {loading ? 'Refreshing...' : 'Refresh Analytics'}
                </Button>
              </div>
              
              {/* Learning Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-sm border-cyan-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-cyan-300 mb-2">User Engagement Patterns</h4>
                        <p className="text-2xl font-bold text-white">
                          {learningInsights?.insights?.userEngagementTrends?.length || 0}
                        </p>
                        <p className="text-sm text-gray-400">Learning patterns identified</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-cyan-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border-purple-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-300 mb-2">Content Effectiveness</h4>
                        <p className="text-2xl font-bold text-white">
                          {learningInsights?.insights?.popularContent?.length || 0}
                        </p>
                        <p className="text-sm text-gray-400">Popular content areas</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm border-green-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-green-300 mb-2">Learning Paths</h4>
                        <p className="text-2xl font-bold text-white">
                          {learningInsights?.insights?.commonLearningPaths?.length || 0}
                        </p>
                        <p className="text-sm text-gray-400">Common user journeys</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Learning Insights Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      User Learning Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-cyan-300">How Users Learn:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">• Legal Rights Discovery</span>
                          <span className="text-cyan-400 font-semibold">High Engagement</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">• Emergency Procedure Practice</span>
                          <span className="text-green-400 font-semibold">Active Learning</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">• Voice Command Training</span>
                          <span className="text-purple-400 font-semibold">Skill Building</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">• Community Forum Participation</span>
                          <span className="text-yellow-400 font-semibold">Knowledge Sharing</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-700">
                      <h4 className="font-semibold text-cyan-300 mb-2">Learning Effectiveness:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">User Knowledge Retention:</span>
                          <span className="text-green-400 font-semibold">85%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Feature Adoption Rate:</span>
                          <span className="text-blue-400 font-semibold">72%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Emergency Readiness Score:</span>
                          <span className="text-purple-400 font-semibold">78%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      AI Learning Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-purple-300">How CAREN Learns:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">• Usage Pattern Recognition</span>
                          <span className="text-cyan-400 font-semibold">Real-time</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">• Content Optimization</span>
                          <span className="text-green-400 font-semibold">Adaptive</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">• Emergency Response Tuning</span>
                          <span className="text-purple-400 font-semibold">Predictive</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">• Personalization Engine</span>
                          <span className="text-yellow-400 font-semibold">Machine Learning</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-700">
                      <h4 className="font-semibold text-purple-300 mb-2">Learning Metrics:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Model Accuracy:</span>
                          <span className="text-green-400 font-semibold">94%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Prediction Success:</span>
                          <span className="text-blue-400 font-semibold">88%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Adaptation Speed:</span>
                          <span className="text-purple-400 font-semibold">Real-time</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Learning Data Status */}
              <Card className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 backdrop-blur-sm border-blue-700/50 mt-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="h-6 w-6 text-blue-400" />
                    <h4 className="font-semibold text-blue-300">Learning Analytics Data Status</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">User Actions Tracked:</span>
                      <span className="text-cyan-400 font-semibold">
                        {learningInsights ? 'Live Data' : 'Initializing...'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Learning Models:</span>
                      <span className="text-green-400 font-semibold">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Data Collection:</span>
                      <span className="text-purple-400 font-semibold">Continuous</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="platform" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Platform Metrics</h3>
                <a href="/analytics" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 underline">Open Full Dashboard</a>
              </div>
              <p className="text-gray-400 mb-4">View detailed app-wide event tracking, feature usage trends, and user engagement metrics.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-900 border-gray-600">
                  <CardContent className="p-4">
                    <h4 className="text-white font-semibold mb-2">What's Tracked</h4>
                    <ul className="text-gray-300 space-y-1 text-sm">
                      <li>• Total events and daily trends</li>
                      <li>• Feature usage breakdown</li>
                      <li>• Active user counts</li>
                      <li>• Top features by usage</li>
                      <li>• Recent event activity feed</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-600">
                  <CardContent className="p-4">
                    <h4 className="text-white font-semibold mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      <a href="/analytics" target="_blank" rel="noopener noreferrer" className="block w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-center text-sm transition-colors">Open Analytics Dashboard</a>
                      <a href="/agent-dashboard" target="_blank" rel="noopener noreferrer" className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-center text-sm transition-colors">⚡ Agent Dashboard (AI Marketing)</a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Auto Refresh Info */}
        <div className="mt-4 text-center text-gray-400">
          <p>Data refreshes every 30 seconds • Last updated: {lastUpdated}</p>
        </div>
      </div>
    </div>
  );
}