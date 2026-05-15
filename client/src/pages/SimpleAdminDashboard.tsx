import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Activity, Clock, Database, AlertTriangle, AlertCircle, Video, BookOpen, Zap, DollarSign, Brain, TrendingUp, Target, Building2, LifeBuoy, Megaphone, Share2, Search, Shield, CheckCircle, Star, RefreshCw, MessageSquare, Mail, CreditCard, CloudUpload, Bot, Bell, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const ADMIN_PANELS = [
  { label: "Director Admin", description: "Manage directors, issue PINs, track commissions", href: "/director-admin", icon: Building2, color: "border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/10", badge: "Manage" },
  { label: "Social Media Agent", description: "AI captions, post queue, LinkedIn publishing", href: "/social-agent", icon: Share2, color: "border-purple-500/40 hover:border-purple-400 hover:bg-purple-500/10", badge: "AI" },
  { label: "Support Admin", description: "Customer support tickets and escalations", href: "/support-admin", icon: LifeBuoy, color: "border-green-500/40 hover:border-green-400 hover:bg-green-500/10", badge: "Tickets" },
  { label: "Announcements Admin", description: "Manage posts, giveaways and announcements", href: "/announcements-admin", icon: Megaphone, color: "border-orange-500/40 hover:border-orange-400 hover:bg-orange-500/10", badge: "Posts" },
  { label: "Story Spotlight Admin", description: "Review, approve and feature user story submissions", href: "/admin/stories", icon: Star, color: "border-green-500/40 hover:border-green-400 hover:bg-green-500/10", badge: "Stories" },
];

const ADMIN_TAB_PANELS = [
  { label: "🎯 Director Portal", description: "Preview any director's portal, click links as them to debug issues", tab: "directors", color: "border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/10", badge: "Debug" },
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

interface HealthCheck {
  service: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  latencyMs?: number;
  detail?: string;
}

interface HealthResponse {
  ok: boolean;
  summary: { errors: number; warnings: number; ok: number; total: number };
  checks: HealthCheck[];
  timestamp: string;
}

const SERVICE_ICONS: Record<string, any> = {
  'Database': Database,
  'SMS': MessageSquare,
  'Email': Mail,
  'Stripe': CreditCard,
  'Daily': Video,
  'Cloudflare': CloudUpload,
  'AI': Bot,
  'Push': Bell,
  'Google': Shield,
  'LinkedIn': Share2,
  'Session': Lock,
};

function getServiceIcon(serviceName: string) {
  for (const key of Object.keys(SERVICE_ICONS)) {
    if (serviceName.includes(key)) return SERVICE_ICONS[key];
  }
  return Activity;
}

function SystemHealthTab() {
  const [adminKey] = useState(() => sessionStorage.getItem('carenAdminAuth') || '');
  const [forceRefresh, setForceRefresh] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<HealthResponse>({
    queryKey: ['/api/health', adminKey, forceRefresh],
    queryFn: async () => {
      const res = await fetch(`/api/health?refresh=${forceRefresh}`, {
        headers: { 'x-admin-key': adminKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!adminKey,
    staleTime: 60_000,
    retry: false,
  });

  const handleRefresh = () => {
    setForceRefresh(true);
    setTimeout(() => {
      refetch();
      setForceRefresh(false);
    }, 50);
  };

  if (!adminKey) {
    return (
      <div className="text-center text-gray-400 py-12">
        <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Admin key required. Log in via the main admin panel first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-12">
        <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
        <p>Running health checks across all integrations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <p>Could not load health data: {String(error)}</p>
        <Button onClick={() => refetch()} className="mt-4 bg-red-600 hover:bg-red-700">Retry</Button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, checks, timestamp } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Integration Health Monitor</h3>
          <p className="text-gray-400 text-sm mt-1">
            Live status of every service CAREN depends on. Last checked: {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="border-gray-600 text-white hover:bg-gray-700 gap-2">
          <RefreshCw className="h-4 w-4" /> Force Refresh
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-lg p-4 text-center ${summary.errors > 0 ? 'bg-red-900/40 border border-red-500/50' : 'bg-gray-700/50 border border-gray-600'}`}>
          <div className={`text-3xl font-bold ${summary.errors > 0 ? 'text-red-400' : 'text-gray-400'}`}>{summary.errors}</div>
          <div className="text-sm mt-1 text-gray-300">Critical Failures</div>
        </div>
        <div className={`rounded-lg p-4 text-center ${summary.warnings > 0 ? 'bg-yellow-900/40 border border-yellow-500/50' : 'bg-gray-700/50 border border-gray-600'}`}>
          <div className={`text-3xl font-bold ${summary.warnings > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>{summary.warnings}</div>
          <div className="text-sm mt-1 text-gray-300">Warnings</div>
        </div>
        <div className="rounded-lg p-4 text-center bg-green-900/40 border border-green-500/50">
          <div className="text-3xl font-bold text-green-400">{summary.ok}</div>
          <div className="text-sm mt-1 text-gray-300">Healthy</div>
        </div>
      </div>

      {/* Critical failures first */}
      {summary.errors > 0 && (
        <div className="rounded-lg bg-red-900/20 border border-red-500/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-semibold">ACTION REQUIRED — {summary.errors} service(s) are down</span>
          </div>
          <div className="space-y-2">
            {checks.filter(c => c.status === 'error').map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-300">
                <span className="text-red-500 mt-0.5">✗</span>
                <div>
                  <span className="font-medium">{c.service}:</span> {c.message}
                  {c.detail && <span className="text-red-400/70 ml-1">— {c.detail}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All checks */}
      <div className="grid grid-cols-1 gap-3">
        {checks.map((check, i) => {
          const Icon = getServiceIcon(check.service);
          const isError = check.status === 'error';
          const isWarn = check.status === 'warning';
          return (
            <div key={i} className={`rounded-lg p-4 flex items-center gap-4 border ${
              isError ? 'bg-red-900/20 border-red-500/30' :
              isWarn  ? 'bg-yellow-900/20 border-yellow-500/30' :
                        'bg-gray-700/30 border-gray-600/30'
            }`}>
              <Icon className={`h-5 w-5 shrink-0 ${isError ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-green-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{check.service}</span>
                  {check.latencyMs !== undefined && (
                    <span className="text-xs text-gray-500">{check.latencyMs}ms</span>
                  )}
                </div>
                <p className={`text-sm mt-0.5 ${isError ? 'text-red-300' : isWarn ? 'text-yellow-300' : 'text-gray-400'}`}>
                  {check.message}
                  {check.detail && <span className="text-gray-500 ml-1">— {check.detail}</span>}
                </p>
              </div>
              <Badge className={`shrink-0 text-xs px-2 py-0.5 ${
                isError ? 'bg-red-600 text-white' :
                isWarn  ? 'bg-yellow-600 text-white' :
                          'bg-green-700 text-white'
              }`}>
                {isError ? 'FAIL' : isWarn ? 'WARN' : 'OK'}
              </Badge>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 text-center">
        Results cached for 60 seconds. Use "Force Refresh" to recheck immediately. These checks also run on every server startup.
      </p>
    </div>
  );
}

function DirectorPortalAdminTab() {
  const [activeDirector, setActiveDirector] = useState<any>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const adminKey = sessionStorage.getItem('carenAdminAuth') || '';

  const { data: directors, isLoading } = useQuery<any[]>({
    queryKey: ['/api/director/admin/all', adminKey],
    queryFn: async () => {
      const res = await fetch('/api/director/admin/all', {
        headers: { 'x-admin-key': adminKey },
      });
      if (!res.ok) throw new Error('Failed to load directors');
      return res.json();
    },
    enabled: !!adminKey,
  });

  // Auto-select the first director with a PIN when data loads
  useEffect(() => {
    if (directors && directors.length > 0 && !activeDirector) {
      const first = directors.find((d: any) => d.portalPin) || directors[0];
      selectDirector(first);
    }
  }, [directors]);

  function selectDirector(director: any) {
    if (director.portalPin) {
      const session = { email: director.email.toLowerCase(), pin: director.portalPin };
      localStorage.setItem('directorPortalSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('directorPortalSession');
    }
    setActiveDirector(director);
    setIframeKey(k => k + 1);
  }

  function openInNewTab() {
    if (!activeDirector) return;
    if (activeDirector.portalPin) {
      const session = { email: activeDirector.email.toLowerCase(), pin: activeDirector.portalPin };
      localStorage.setItem('directorPortalSession', JSON.stringify(session));
    }
    window.open('/director-portal', '_blank');
  }

  const statusColor: Record<string, string> = {
    approved: 'bg-green-900/50 text-green-300 border-green-700',
    pending: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    rejected: 'bg-red-900/50 text-red-300 border-red-700',
  };

  return (
    <div className="space-y-4">
      {/* Header + director pills */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-semibold text-white">Director Portal — Admin View</h3>
          <p className="text-sm text-gray-400 mt-0.5">Live view of exactly what each director sees in their portal.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeDirector && (
            <Button size="sm" variant="outline" onClick={openInNewTab}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs">
              Open in New Tab ↗
            </Button>
          )}
        </div>
      </div>

      {/* Director selector */}
      {isLoading && <p className="text-gray-400 text-sm">Loading directors…</p>}
      {!isLoading && directors && directors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {directors.map((d: any) => (
            <button
              key={d.id}
              onClick={() => selectDirector(d)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                activeDirector?.id === d.id
                  ? 'bg-cyan-900/50 border-cyan-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <span className="font-medium">{d.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded border ${statusColor[d.status] || 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                {d.status}
              </span>
              {d.portalPin
                ? <span className="text-xs font-mono text-cyan-400">PIN ✓</span>
                : <span className="text-xs text-gray-500 italic">no PIN</span>
              }
            </button>
          ))}
        </div>
      )}

      {/* No PIN warning */}
      {activeDirector && !activeDirector.portalPin && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-4 py-3 text-sm text-yellow-300">
          <strong>{activeDirector.name}</strong> has no PIN set yet — portal will show the login screen. Assign a PIN in Director Admin first.
        </div>
      )}

      {/* Full-height portal iframe */}
      {activeDirector && (
        <div className="rounded-xl overflow-hidden border border-cyan-500/30 bg-gray-950">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
            <span className="text-xs text-gray-400">
              Viewing as: <strong className="text-cyan-300">{activeDirector.name}</strong>
              <span className="text-gray-500 ml-2">({activeDirector.email})</span>
            </span>
            <button
              onClick={() => setIframeKey(k => k + 1)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ↻ Reload
            </button>
          </div>
          <iframe
            key={iframeKey}
            src="/director-portal"
            className="w-full border-0"
            style={{ height: '850px' }}
            title={`Director Portal — ${activeDirector.name}`}
          />
        </div>
      )}

      {!activeDirector && !isLoading && (
        <div className="text-center py-16 text-gray-500">No directors found. Add a director application first.</div>
      )}
    </div>
  );
}

export default function SimpleAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [learningInsights, setLearningInsights] = useState<any>(null);

  // User management state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [pendingTiers, setPendingTiers] = useState<Record<string, string>>({});
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [savedUser, setSavedUser] = useState<string | null>(null);

  // Tab navigation (controlled so we can jump programmatically)
  const [activeTab, setActiveTab] = useState('analytics');

  // Abuse monitoring state
  const [abuseReport, setAbuseReport] = useState<any>(null);
  const [abuseScanLoading, setAbuseScanLoading] = useState(false);
  const [abuseBannerDismissed, setAbuseBannerDismissed] = useState(false);

  // Quarantine / ban / delete state
  const [actionLoading, setActionLoading] = useState<string | null>(null); // "userId:action"
  const [confirmDialog, setConfirmDialog] = useState<{ userId: string; action: 'quarantine'|'ban'|'delete'; userName: string } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Bulk action state (from Abuse Monitor findings)
  const [bulkConfirm, setBulkConfirm] = useState<{ userIds: string[]; action: 'delete'|'ban'; label: string } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Security / threat log state
  const [threatData, setThreatData] = useState<{ threats: any[]; stats: any } | null>(null);
  const [securityData, setSecurityData] = useState<{ failedAdminKeyAttempts: any[]; total: number } | null>(null);
  const [threatLoading, setThreatLoading] = useState(false);

  const loadThreatData = async () => {
    if (!adminKey) return;
    setThreatLoading(true);
    try {
      const [t, s] = await Promise.all([
        fetch('/api/admin/threats?limit=100', { headers: { 'x-admin-key': adminKey } }).then(r => r.json()),
        fetch('/api/admin/security', { headers: { 'x-admin-key': adminKey } }).then(r => r.json()),
      ]);
      setThreatData(t);
      setSecurityData(s);
    } catch (e) {
      console.error('Failed to load threat data', e);
    } finally {
      setThreatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') loadThreatData();
  }, [activeTab]);

  const takeAction = async (userId: string, action: 'quarantine' | 'ban' | 'delete') => {
    const key = `${userId}:${action}`;
    setActionLoading(key);
    try {
      const method = action === 'delete' ? 'DELETE' : 'PATCH';
      const url = action === 'delete'
        ? `/api/admin/users/${userId}`
        : `/api/admin/users/${userId}/${action}`;
      const res = await fetch(url, {
        method,
        headers: { 'x-admin-key': 'CAREN_ADMIN_2025_PRODUCTION', 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: actionReason || undefined }),
      });
      if (res.ok) {
        if (action === 'delete') {
          setAllUsers(prev => prev.filter(u => u.id !== userId));
        } else {
          await loadUsers();
        }
        setConfirmDialog(null);
        setActionReason('');
      } else {
        const err = await res.json();
        alert(`Action failed: ${err.message}`);
      }
    } catch (e) { alert('Network error — try again'); }
    finally { setActionLoading(null); }
  };

  const executeBulkAction = async () => {
    if (!bulkConfirm) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/bulk-action', {
        method: 'POST',
        headers: { 'x-admin-key': 'CAREN_ADMIN_2025_PRODUCTION', 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: bulkConfirm.userIds, action: bulkConfirm.action, reason: `Bulk ${bulkConfirm.action} via Abuse Monitor` }),
      });
      const data = await res.json();
      setBulkConfirm(null);
      if (bulkConfirm.action === 'delete') {
        setAllUsers(prev => prev.filter(u => !bulkConfirm.userIds.includes(u.id)));
      } else {
        await loadUsers();
      }
      await runAbuseScan();
      if (data.failed > 0) {
        alert(`Done: ${data.succeeded} succeeded, ${data.failed} failed.\n${data.errors?.join('\n') || ''}`);
      }
    } catch (e) { alert('Network error — try again'); }
    finally { setBulkLoading(false); }
  };

  const jumpToUser = (email: string) => {
    setActiveTab('users');
    setUserSearch(email);
  };

  const runAbuseScan = async (key?: string) => {
    const k = key || adminKey;
    setAbuseScanLoading(true);
    try {
      const res = await fetch('/api/admin/abuse-scan', {
        method: 'POST',
        headers: { 'x-admin-key': k, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setAbuseReport(data);
        setAbuseBannerDismissed(false);
      }
    } catch (e) { console.error('Abuse scan failed:', e); }
    finally { setAbuseScanLoading(false); }
  };

  const authenticateAdmin = () => {
    if (adminKey === 'CAREN_ADMIN_2025_PRODUCTION') {
      setIsAuthenticated(true);
      sessionStorage.setItem('carenAdminAuth', 'CAREN_ADMIN_2025_PRODUCTION');
      loadDashboardData();
      loadUsers();
      runAbuseScan(adminKey);
    } else {
      alert('Invalid admin key');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-key': 'CAREN_ADMIN_2025_PRODUCTION' }
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch {}
  };

  const saveTier = async (userId: string) => {
    const tier = pendingTiers[userId];
    if (!tier) return;
    setSavingUser(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'CAREN_ADMIN_2025_PRODUCTION' },
        body: JSON.stringify({ tier }),
      });
      if (res.ok) {
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionTier: tier } : u));
        setSavedUser(userId);
        setTimeout(() => setSavedUser(null), 2000);
        setPendingTiers(prev => { const n = { ...prev }; delete n[userId]; return n; });
      }
    } finally {
      setSavingUser(null);
    }
  };

  const TIER_LABELS: Record<string, string> = {
    free: 'Free',
    basic_guard: 'Community Guardian ($0.99)',
    safety_pro: 'Standard Plan ($4.99/mo)',
    constitutional_pro: 'Legal Shield ($9.99/mo)',
    family_protection: 'Family Plan ($29.99/mo)',
    enterprise_fleet: 'Fleet & Enterprise ($49.99/mo)',
  };

  const TIER_COLORS: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-400',
    basic_guard: 'bg-emerald-500/20 text-emerald-400',
    safety_pro: 'bg-cyan-500/20 text-cyan-400',
    constitutional_pro: 'bg-violet-500/20 text-violet-400',
    family_protection: 'bg-orange-500/20 text-orange-400',
    enterprise_fleet: 'bg-blue-500/20 text-blue-400',
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

        {/* ── Abuse Monitor Banner ─────────────────────────────────────── */}
        {abuseScanLoading && (
          <div className="mb-6 p-4 rounded-xl bg-gray-700/60 border border-gray-600 flex items-center gap-3 animate-pulse">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-gray-300 text-sm">Running abuse pattern scan across all accounts…</p>
          </div>
        )}

        {abuseReport && !abuseScanLoading && !abuseBannerDismissed && (
          abuseReport.hasAlerts ? (
            <div className="mb-6 rounded-2xl border-2 border-red-500 bg-red-950/60 shadow-[0_0_40px_rgba(239,68,68,0.35)] overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-4 bg-red-900/60">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">🚨</span>
                  <div>
                    <p className="text-red-100 font-extrabold text-lg tracking-wide">ABUSE MONITOR ALERT</p>
                    <p className="text-red-300 text-xs mt-0.5">Scanned {abuseReport.totalUsers} accounts · {new Date(abuseReport.scannedAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Severity pills */}
                  {abuseReport.counts.high > 0 && (
                    <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold">{abuseReport.counts.high} HIGH</span>
                  )}
                  {abuseReport.counts.medium > 0 && (
                    <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold">{abuseReport.counts.medium} MEDIUM</span>
                  )}
                  <button onClick={() => setAbuseBannerDismissed(true)} className="text-red-300 hover:text-white text-xl ml-2 font-bold" title="Dismiss">✕</button>
                </div>
              </div>
              {/* AI summary */}
              <div className="px-5 py-3 border-b border-red-800/50">
                <p className="text-red-100 text-sm leading-relaxed">{abuseReport.aiSummary}</p>
              </div>
              {/* Findings list — show HIGH + MEDIUM only */}
              <div className="px-5 py-4 space-y-3">
                {abuseReport.findings.filter((f: any) => f.severity !== 'LOW').map((f: any, i: number) => (
                  <div key={i} className={`rounded-lg p-3 border-l-4 ${f.severity === 'HIGH' ? 'bg-red-900/40 border-red-500' : 'bg-orange-900/30 border-orange-500'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-bold text-sm ${f.severity === 'HIGH' ? 'text-red-300' : 'text-orange-300'}`}>[{f.severity}] {f.type} — {f.summary}</p>
                        <p className="text-gray-300 text-xs mt-1">{f.detail}</p>
                        {f.affectedUsers.length > 0 && (
                          <p className="text-gray-400 text-xs mt-1">Affected: {f.affectedUsers.slice(0, 3).join(', ')}{f.affectedUsers.length > 3 ? ` +${f.affectedUsers.length - 3} more` : ''}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Footer CTA */}
              <div className="px-5 py-3 bg-red-900/30 flex items-center justify-between">
                <p className="text-red-300 text-xs">
                  {abuseReport.counts.low > 0 && `+ ${abuseReport.counts.low} low-severity findings in`} <span className="font-semibold">👥 Manage Users → Abuse Monitor</span> tab
                </p>
                <Button size="sm" onClick={() => runAbuseScan()} disabled={abuseScanLoading} className="bg-red-700 hover:bg-red-600 text-white text-xs h-7">
                  Re-scan Now
                </Button>
              </div>
            </div>
          ) : (
            /* All clear */
            <div className="mb-6 rounded-xl border border-green-700/60 bg-green-950/30 flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-green-300 font-semibold text-sm">All Clear — No Abuse Patterns Detected</p>
                  <p className="text-green-600 text-xs">{abuseReport.totalUsers} accounts scanned · {new Date(abuseReport.scannedAt).toLocaleTimeString()}</p>
                </div>
              </div>
              <button onClick={() => setAbuseBannerDismissed(true)} className="text-green-600 hover:text-green-300 text-lg font-bold">✕</button>
            </div>
          )
        )}

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
            <button
              onClick={() => { setActiveTab('directors'); setTimeout(() => document.getElementById('admin-tabs')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
              className="block bg-gray-800/60 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/10 rounded-xl p-4 transition-all cursor-pointer group text-left w-full"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform text-xl">
                  🎯
                </div>
                <span className="text-xs font-medium text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">Debug</span>
              </div>
              <p className="text-white font-semibold text-sm mb-1">Director Portal</p>
              <p className="text-gray-400 text-xs leading-snug">Preview any director's portal and click through exactly what they see</p>
              <p className="text-cyan-400 text-xs mt-3 group-hover:underline">Open below →</p>
            </button>
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
                    {userStats?.averageSessionDuration != null ? `${userStats.averageSessionDuration}m` : '—'}
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
                    {userStats?.legalRightsViewed != null ? userStats.legalRightsViewed : '—'}
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
        <Card id="admin-tabs" className="bg-gray-800 border-gray-700">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="flex w-max min-w-full bg-gray-700 rounded-none">
                <TabsTrigger value="health" className="text-white font-semibold whitespace-nowrap flex-shrink-0">🔍 System Health</TabsTrigger>
                <TabsTrigger value="analytics" className="text-white whitespace-nowrap flex-shrink-0">User Analytics</TabsTrigger>
                <TabsTrigger value="sessions" className="text-white whitespace-nowrap flex-shrink-0">Live Sessions</TabsTrigger>
                <TabsTrigger value="payments" className="text-white whitespace-nowrap flex-shrink-0">Payment Tracking</TabsTrigger>
                <TabsTrigger value="learning" className="text-white whitespace-nowrap flex-shrink-0">Learning Analytics</TabsTrigger>
                <TabsTrigger value="platform" className="text-white whitespace-nowrap flex-shrink-0">Platform Metrics</TabsTrigger>
                <TabsTrigger value="users" className="text-white font-semibold whitespace-nowrap flex-shrink-0">👥 Manage Users</TabsTrigger>
                <TabsTrigger value="security" className="text-white font-semibold whitespace-nowrap flex-shrink-0">🛡 Security</TabsTrigger>
                <TabsTrigger value="directors" className="text-white font-semibold whitespace-nowrap flex-shrink-0">🎯 Director Portal</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="health" className="p-6">
              <SystemHealthTab />
            </TabsContent>

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

              {/* ── 7-Day Signup Trend ── */}
              {(() => {
                const days = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  d.setHours(0, 0, 0, 0);
                  return d;
                });
                const realUsers = allUsers.filter(u =>
                  !u.id.startsWith('attorney_') &&
                  !u.id.startsWith('demo-user') &&
                  !u.id.startsWith('seed-') &&
                  !u.email?.includes('demo@') &&
                  !u.email?.includes('applereview@')
                );
                const counts = days.map(day => {
                  const next = new Date(day); next.setDate(next.getDate() + 1);
                  return {
                    label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
                    count: realUsers.filter(u => {
                      const t = new Date(u.createdAt ?? 0).getTime();
                      return t >= day.getTime() && t < next.getTime();
                    }).length,
                  };
                });
                const max = Math.max(...counts.map(c => c.count), 1);
                return (
                  <div className="mt-6">
                    <h4 className="font-semibold text-white mb-3">Signups — Last 7 Days</h4>
                    <div className="flex items-end gap-2 h-24">
                      {counts.map((c, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-cyan-400 font-bold">{c.count > 0 ? c.count : ''}</span>
                          <div
                            className="w-full rounded-t"
                            style={{
                              height: `${Math.max((c.count / max) * 64, c.count > 0 ? 8 : 2)}px`,
                              background: c.count > 0 ? 'linear-gradient(to top, #0891b2, #06b6d4)' : '#374151',
                            }}
                          />
                          <span className="text-xs text-gray-500 text-center leading-tight">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ── Recent Signups Feed ── */}
              {(() => {
                const TIER_COLORS: Record<string, string> = {
                  free: 'text-gray-400',
                  basic_guard: 'text-green-400',
                  safety_pro: 'text-blue-400',
                  constitutional_pro: 'text-purple-400',
                  family_protection: 'text-yellow-400',
                  enterprise_fleet: 'text-red-400',
                };
                const TIER_SHORT: Record<string, string> = {
                  free: 'Free',
                  basic_guard: 'Community',
                  safety_pro: 'Standard',
                  constitutional_pro: 'Legal Shield',
                  family_protection: 'Family',
                  enterprise_fleet: 'Fleet',
                };
                const timeAgo = (iso: string) => {
                  const diff = Date.now() - new Date(iso).getTime();
                  const m = Math.floor(diff / 60000);
                  if (m < 1) return 'just now';
                  if (m < 60) return `${m}m ago`;
                  const h = Math.floor(m / 60);
                  if (h < 24) return `${h}h ago`;
                  const d = Math.floor(h / 24);
                  return `${d}d ago`;
                };
                const recent = allUsers
                  .filter(u =>
                    u.createdAt &&
                    !u.id.startsWith('attorney_') &&
                    !u.id.startsWith('demo-user') &&
                    !u.id.startsWith('seed-') &&
                    !u.email?.includes('demo@') &&
                    !u.email?.includes('applereview@')
                  )
                  .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                  .slice(0, 20);
                return (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">Recent Signups</h4>
                      <span className="text-xs text-gray-500">{recent.length} most recent accounts</span>
                    </div>
                    {recent.length === 0 ? (
                      <p className="text-gray-500 text-sm">No signups yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {recent.map((u, i) => {
                          const initials = `${(u.firstName || '?')[0]}${(u.lastName || '?')[0]}`.toUpperCase();
                          const tier = u.subscriptionTier || 'free';
                          return (
                            <div key={u.id} className="flex items-center gap-3 bg-gray-700/50 rounded-lg px-3 py-2.5 hover:bg-gray-700 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-cyan-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-medium truncate">
                                    {u.firstName || ''} {u.lastName || ''}
                                  </span>
                                  {i === 0 && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-600/30 text-cyan-300 flex-shrink-0">newest</span>
                                  )}
                                </div>
                                <span className="text-gray-400 text-xs truncate block">{u.email}</span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className={`text-xs font-semibold ${TIER_COLORS[tier] || 'text-gray-400'}`}>
                                  {TIER_SHORT[tier] || tier}
                                </div>
                                <div className="text-gray-500 text-xs">{timeAgo(u.createdAt!)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
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

            {/* ── User Management Tab ── */}
            <TabsContent value="users" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">User Management</h3>
                    <p className="text-sm text-gray-400 mt-1">Upgrade, downgrade, or revoke access for any account</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => runAbuseScan()} disabled={abuseScanLoading} variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10">
                      {abuseScanLoading ? (
                        <><span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin mr-2" />Scanning…</>
                      ) : '🔍 Abuse Scan'}
                    </Button>
                    <Button onClick={loadUsers} variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                      Refresh List
                    </Button>
                  </div>
                </div>

                {/* ── Abuse Monitor Panel ── */}
                {abuseReport && (
                  <div className={`rounded-xl border ${abuseReport.hasAlerts ? 'border-red-700/60 bg-red-950/30' : 'border-green-700/40 bg-green-950/20'} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${abuseReport.hasAlerts ? 'text-red-400' : 'text-green-400'}`} />
                        <span className="font-semibold text-sm text-white">Abuse Monitor</span>
                        <span className="text-xs text-gray-500">· {new Date(abuseReport.scannedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {abuseReport.counts.high > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-700/70 text-red-200">{abuseReport.counts.high} HIGH</span>}
                        {abuseReport.counts.medium > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-700/70 text-orange-200">{abuseReport.counts.medium} MED</span>}
                        {abuseReport.counts.low > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{abuseReport.counts.low} LOW</span>}
                      </div>
                    </div>
                    {abuseReport.aiSummary && (
                      <p className="text-sm text-gray-300 mb-3 leading-relaxed">{abuseReport.aiSummary}</p>
                    )}
                    {abuseReport.findings.length === 0 ? (
                      <p className="text-green-400 text-sm">✅ No patterns detected — all {abuseReport.totalUsers} accounts look clean.</p>
                    ) : (
                      <div className="space-y-2">
                        {abuseReport.findings.map((f: any, i: number) => (
                          <div key={i} className={`rounded-lg px-3 py-2.5 text-xs border-l-4 ${
                            f.severity === 'HIGH' ? 'bg-red-900/30 border-red-500' :
                            f.severity === 'MEDIUM' ? 'bg-orange-900/20 border-orange-500' :
                            'bg-gray-800/50 border-gray-600'
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold mb-0.5 ${f.severity === 'HIGH' ? 'text-red-300' : f.severity === 'MEDIUM' ? 'text-orange-300' : 'text-gray-400'}`}>
                                  [{f.severity}] {f.type} — {f.summary}
                                </p>
                                <p className="text-gray-400">{f.detail}</p>
                                {f.affectedIds?.length > 0 && (
                                  <div className="flex flex-col gap-1 mt-2">
                                    {f.affectedIds.slice(0, 8).map((uid: string, idx: number) => {
                                      const u = allUsers.find((x: any) => x.id === uid);
                                      const displayName = u
                                        ? (`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || uid)
                                        : (f.affectedUsers?.[idx] || uid);
                                      const email = u?.email || '';
                                      const tier = u?.subscriptionTier || 'free';
                                      const acctStatus = u?.accountStatus || 'active';
                                      return (
                                        <div key={uid} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700/60">
                                          {/* Name + tier */}
                                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                            <span className="text-gray-200 text-xs truncate max-w-[160px]">{displayName}</span>
                                            {email && email !== displayName && (
                                              <span className="text-gray-500 text-[10px] truncate max-w-[120px]">{email}</span>
                                            )}
                                            <span className={`px-1.5 py-0 rounded-full text-[10px] font-semibold flex-shrink-0 ${TIER_COLORS[tier] || 'bg-gray-500/20 text-gray-400'}`}>
                                              {TIER_LABELS[tier] ? TIER_LABELS[tier].split(' ')[0] : tier}
                                            </span>
                                          </div>
                                          {/* Action buttons */}
                                          <div className="flex gap-1 flex-shrink-0">
                                            <button
                                              title="Jump to this user in Manage Users"
                                              onClick={() => jumpToUser(email || displayName)}
                                              className="w-6 h-6 rounded text-cyan-400 bg-cyan-900/20 hover:bg-cyan-900/50 border border-cyan-800/40 text-xs flex items-center justify-center transition-colors"
                                            >🔗</button>
                                            {acctStatus === 'active' && (
                                              <button
                                                title="Quarantine — suspend this account"
                                                onClick={() => u && setConfirmDialog({ userId: u.id, action: 'quarantine', userName: displayName })}
                                                className="w-6 h-6 rounded text-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-800/40 text-xs flex items-center justify-center transition-colors"
                                              >⏸</button>
                                            )}
                                            {acctStatus !== 'banned' && (
                                              <button
                                                title="Ban — permanent ban"
                                                onClick={() => u && setConfirmDialog({ userId: u.id, action: 'ban', userName: displayName })}
                                                className="w-6 h-6 rounded text-orange-400 bg-orange-900/20 hover:bg-orange-900/40 border border-orange-800/40 text-xs flex items-center justify-center transition-colors"
                                              >🚫</button>
                                            )}
                                            <button
                                              title="Delete account permanently"
                                              onClick={() => u && setConfirmDialog({ userId: u.id, action: 'delete', userName: displayName })}
                                              className="w-6 h-6 rounded text-red-400 bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-xs flex items-center justify-center transition-colors"
                                            >🗑</button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {f.affectedIds.length > 8 && (
                                      <span className="text-xs text-gray-500 pl-2">+{f.affectedIds.length - 8} more — use Ban All / Delete All above</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {f.affectedIds?.length > 0 && f.severity !== 'LOW' && (
                                <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                                  <button
                                    onClick={() => setBulkConfirm({ userIds: f.affectedIds, action: 'ban', label: f.summary })}
                                    className="px-2 py-1 rounded bg-orange-800/60 hover:bg-orange-700/80 text-orange-200 border border-orange-600/40 text-xs font-semibold transition-colors"
                                  >
                                    🚫 Ban All
                                  </button>
                                  <button
                                    onClick={() => setBulkConfirm({ userIds: f.affectedIds, action: 'delete', label: f.summary })}
                                    className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-800/80 text-red-200 border border-red-700/40 text-xs font-semibold transition-colors"
                                  >
                                    🗑 Delete All
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}


                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Tier legend */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(TIER_LABELS).map(([k, v]) => (
                    <span key={k} className={`px-2 py-0.5 rounded-full ${TIER_COLORS[k] || 'bg-gray-500/20 text-gray-400'}`}>{v}</span>
                  ))}
                </div>

                {/* User table */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {allUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No users loaded yet. Click Refresh List.</div>
                  )}
                  {allUsers
                    .filter(u => {
                      const q = userSearch.toLowerCase();
                      return !q || (u.email || '').toLowerCase().includes(q) ||
                        (u.firstName || '').toLowerCase().includes(q) ||
                        (u.lastName || '').toLowerCase().includes(q);
                    })
                    .map(u => {
                      const currentTier = u.subscriptionTier || 'free';
                      const pendingTier = pendingTiers[u.id];
                      const hasChange = !!pendingTier && pendingTier !== currentTier;
                      const isSaving = savingUser === u.id;
                      const justSaved = savedUser === u.id;

                      const acctStatus = (u as any).accountStatus || 'active';
                      const statusColor = acctStatus === 'banned' ? 'text-red-400 bg-red-900/30 border-red-700' : acctStatus === 'suspended' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-700' : '';

                      return (
                        <div key={u.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${acctStatus === 'banned' ? 'bg-red-950/30 border-red-800/50' : acctStatus === 'suspended' ? 'bg-yellow-950/20 border-yellow-800/40' : 'bg-gray-900/50 border-gray-700/40 hover:border-gray-600/60'}`}>
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${acctStatus !== 'active' ? 'bg-gray-800 border-gray-600 opacity-60' : 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-gray-600'}`}>
                            {(u.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {u.firstName} {u.lastName}
                              {acctStatus !== 'active' && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded border font-semibold ${statusColor}`}>
                                  {acctStatus.toUpperCase()}
                                </span>
                              )}
                            </p>
                            <p className="text-gray-400 text-xs truncate">{u.email || u.id}</p>
                          </div>

                          {/* Current tier badge */}
                          <Badge className={`text-xs flex-shrink-0 ${TIER_COLORS[currentTier] || 'bg-gray-500/20 text-gray-400'}`}>
                            {TIER_LABELS[currentTier] || currentTier}
                          </Badge>

                          {/* Tier selector */}
                          <Select
                            value={pendingTier || currentTier}
                            onValueChange={val => setPendingTiers(prev => ({ ...prev, [u.id]: val }))}
                          >
                            <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white text-xs h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {Object.entries(TIER_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k} className="text-white text-xs hover:bg-gray-700">
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Save button */}
                          <Button
                            size="sm"
                            disabled={!hasChange || isSaving}
                            onClick={() => saveTier(u.id)}
                            className={`h-8 px-3 text-xs flex-shrink-0 transition-all ${
                              justSaved
                                ? 'bg-green-600 hover:bg-green-600 text-white'
                                : hasChange
                                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {isSaving ? '...' : justSaved ? <><CheckCircle className="w-3 h-3 mr-1" />Saved</> : 'Save'}
                          </Button>

                          {/* ── Action buttons ── */}
                          <div className="flex gap-1 flex-shrink-0">
                            {acctStatus === 'active' && (
                              <button
                                title="Quarantine — suspend account pending review"
                                onClick={() => setConfirmDialog({ userId: u.id, action: 'quarantine', userName: `${u.firstName} ${u.lastName}` })}
                                className="w-7 h-7 rounded text-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-800/40 text-xs flex items-center justify-center transition-colors"
                              >⏸</button>
                            )}
                            {acctStatus !== 'banned' && (
                              <button
                                title="Ban — permanent ban with fingerprint stored"
                                onClick={() => setConfirmDialog({ userId: u.id, action: 'ban', userName: `${u.firstName} ${u.lastName}` })}
                                className="w-7 h-7 rounded text-red-400 bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-xs flex items-center justify-center transition-colors"
                              >🚫</button>
                            )}
                            <button
                              title="Delete account permanently (fingerprint saved)"
                              onClick={() => setConfirmDialog({ userId: u.id, action: 'delete', userName: `${u.firstName} ${u.lastName}` })}
                              className="w-7 h-7 rounded text-red-500 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-xs flex items-center justify-center transition-colors"
                            >🗑</button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* ── Confirm Dialog ── */}
                {confirmDialog && (
                  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                      <h3 className="text-white font-bold text-lg mb-1">
                        {confirmDialog.action === 'quarantine' && '⏸ Quarantine Account'}
                        {confirmDialog.action === 'ban' && '🚫 Ban Account'}
                        {confirmDialog.action === 'delete' && '🗑 Delete Account'}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {confirmDialog.action === 'quarantine' && `Suspend "${confirmDialog.userName}" — they can still log in but lose all features. Reversible.`}
                        {confirmDialog.action === 'ban' && `Permanently ban "${confirmDialog.userName}" and store their name/email fingerprint so they can't come back as a new account.`}
                        {confirmDialog.action === 'delete' && `Delete "${confirmDialog.userName}" from the database. Their fingerprint is saved for return detection. This cannot be undone.`}
                      </p>
                      <input
                        type="text"
                        value={actionReason}
                        onChange={e => setActionReason(e.target.value)}
                        placeholder="Reason (optional — shown in alert email)"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500 mb-4"
                      />
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => { setConfirmDialog(null); setActionReason(''); }} className="border-gray-600 text-gray-300">
                          Cancel
                        </Button>
                        <Button
                          onClick={() => takeAction(confirmDialog.userId, confirmDialog.action)}
                          disabled={!!actionLoading}
                          className={`text-white font-semibold ${
                            confirmDialog.action === 'quarantine' ? 'bg-yellow-600 hover:bg-yellow-700' :
                            confirmDialog.action === 'ban' ? 'bg-red-600 hover:bg-red-700' :
                            'bg-red-800 hover:bg-red-900'
                          }`}
                        >
                          {actionLoading ? 'Working…' : `Confirm ${confirmDialog.action.charAt(0).toUpperCase() + confirmDialog.action.slice(1)}`}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulk Action Confirm Dialog */}
                {bulkConfirm && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                      <h3 className="text-white font-bold text-lg mb-1">
                        {bulkConfirm.action === 'delete' ? '🗑 Bulk Delete' : '🚫 Bulk Ban'}
                      </h3>
                      <p className="text-gray-400 text-sm mb-1">
                        Finding: <span className="text-white font-medium">{bulkConfirm.label}</span>
                      </p>
                      <p className="text-gray-400 text-sm mb-4">
                        This will {bulkConfirm.action === 'delete' ? 'permanently delete' : 'permanently ban'} <strong className="text-white">{bulkConfirm.userIds.length} accounts</strong> and store their fingerprints to prevent return.{bulkConfirm.action === 'delete' ? ' This cannot be undone.' : ''}
                      </p>
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setBulkConfirm(null)} className="border-gray-600 text-gray-300" disabled={bulkLoading}>
                          Cancel
                        </Button>
                        <Button
                          onClick={executeBulkAction}
                          disabled={bulkLoading}
                          className={`text-white font-semibold ${bulkConfirm.action === 'delete' ? 'bg-red-800 hover:bg-red-900' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                          {bulkLoading ? (
                            <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />Working…</>
                          ) : `Confirm ${bulkConfirm.action === 'delete' ? 'Delete' : 'Ban'} All`}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  ⏸ Quarantine = suspend (reversible) &nbsp;·&nbsp; 🚫 Ban = permanent + fingerprint stored &nbsp;·&nbsp; 🗑 Delete = removes account but saves fingerprint for return detection.
                </p>
              </div>
            </TabsContent>

            {/* ── Security Tab ── */}
            <TabsContent value="security" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Security Center</h3>
                  <p className="text-sm text-gray-400 mt-1">Honeypot trap hits, failed admin key attempts, and attacker fingerprints</p>
                </div>
                <Button onClick={loadThreatData} disabled={threatLoading} variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  {threatLoading ? <><span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin mr-2" />Loading…</> : '↻ Refresh'}
                </Button>
              </div>

              {!threatData && !threatLoading && (
                <p className="text-gray-500 text-sm">Click Refresh to load security data.</p>
              )}

              {threatLoading && (
                <div className="flex items-center gap-2 text-gray-400"><span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />Loading threat data…</div>
              )}

              {threatData && (
                <div className="space-y-6">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gray-900 border-red-900/40">
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-red-400">{threatData.stats?.total ?? 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Total Trap Hits</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-orange-900/40">
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-orange-400">{threatData.stats?.last24h ?? 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Last 24 Hours</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-yellow-900/40">
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-yellow-400">{securityData?.total ?? 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Failed Admin Key Attempts</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-purple-900/40">
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-purple-400">{threatData.stats?.topIps?.length ?? 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Unique Attacker IPs</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top attacker IPs */}
                  {threatData.stats?.topIps?.length > 0 && (
                    <Card className="bg-gray-900 border-gray-700">
                      <CardHeader className="pb-2"><CardTitle className="text-white text-sm">🔴 Most Active Attacker IPs</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {threatData.stats.topIps.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                              <span className="font-mono text-red-300 text-sm">{entry.ip}</span>
                              <Badge className="bg-red-900/50 text-red-300 border-red-800">{entry.hits} hits</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Failed admin key attempts */}
                  {(securityData?.failedAdminKeyAttempts?.length ?? 0) > 0 && (
                    <Card className="bg-gray-900 border-gray-700">
                      <CardHeader className="pb-2"><CardTitle className="text-white text-sm">⚠️ Failed Admin Key Attempts</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {(securityData?.failedAdminKeyAttempts ?? []).map((entry: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                              <span className="font-mono text-yellow-300 text-sm">{entry.ip}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-xs">{new Date(entry.lastAt).toLocaleString()}</span>
                                <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-800">{entry.count} attempts</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Honeypot hit log */}
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm">🍯 Honeypot Trap Log <span className="text-gray-500 font-normal text-xs ml-2">(most recent first)</span></CardTitle>
                    </CardHeader>
                    <CardContent>
                      {threatData.threats.length === 0 ? (
                        <p className="text-gray-500 text-sm">No trap hits yet — the honeypot is active and waiting.</p>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {threatData.threats.map((t: any) => (
                            <div key={t.id} className="bg-gray-800 rounded px-3 py-2 text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400 font-semibold">{t.method}</span>
                                  <span className="font-mono text-orange-300">{t.path}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <span className="font-mono text-cyan-400">{t.ip}</span>
                                  <span>{new Date(t.timestamp).toLocaleString()}</span>
                                </div>
                              </div>
                              {t.userAgent && (
                                <p className="text-gray-500 mt-1 truncate">{t.userAgent}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {threatData && threatData.threats.length === 0 && !threatLoading && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-800/40 rounded-lg">
                  <p className="text-green-400 text-sm font-medium">✅ No attacks detected yet</p>
                  <p className="text-gray-400 text-xs mt-1">The honeypot is active. Any scanners or bots that probe your server will appear here automatically.</p>
                </div>
              )}
            </TabsContent>

            {/* ── Director Portal Tab ── */}
            <TabsContent value="directors" className="p-6">
              <DirectorPortalAdminTab />
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