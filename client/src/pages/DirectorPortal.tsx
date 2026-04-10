import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Target, Users, TrendingUp, Plus, CheckCircle, Clock, Star,
  DollarSign, Trophy, BarChart3, ChevronRight as ChevronRightIcon, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

const ACTIVITY_TYPES = [
  { value: "attorney_contacted", label: "Attorney Contacted", icon: "📞", color: "text-blue-400" },
  { value: "attorney_onboarded", label: "Attorney Onboarded", icon: "⚖️", color: "text-green-400" },
  { value: "user_added", label: "Users Added", icon: "👤", color: "text-cyan-400" },
  { value: "partnership_created", label: "Partnership Created", icon: "🤝", color: "text-purple-400" },
  { value: "content_posted", label: "Content Posted", icon: "📣", color: "text-orange-400" },
];

const LEVEL_LABELS: Record<string, string> = {
  regional_director: "Regional Director",
  senior_director: "Senior Director",
  state_director: "State Director",
  national_director: "National Director",
};

const LEVEL_RATES: Record<string, number> = {
  regional_director: 0.20,
  senior_director: 0.25,
  state_director: 0.30,
  national_director: 0.35,
};

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  paused: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const PLAN_AMOUNTS: Record<string, number> = {
  "Standard": 4.99,
  "Legal Shield": 9.99,
  "Family": 29.99,
  "Enterprise": 49.99,
  "Community Guardian": 0.99,
};

function getScoreColor(score: number) {
  if (score >= 91) return "text-orange-400";
  if (score >= 71) return "text-green-400";
  if (score >= 41) return "text-yellow-400";
  return "text-red-400";
}

function getScoreLabel(score: number) {
  if (score >= 91) return "🔥 Elite";
  if (score >= 71) return "🟢 Strong";
  if (score >= 41) return "🟡 Active";
  return "🔴 Beginner";
}

type Tab = "dashboard" | "commissions" | "leaderboard";

export default function DirectorPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logType, setLogType] = useState("attorney_contacted");
  const [logCount, setLogCount] = useState("1");
  const [logNotes, setLogNotes] = useState("");
  const [showLogForm, setShowLogForm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const email = user?.email || "";

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/director/me", email],
    queryFn: async () => {
      const res = await fetch(`/api/director/me?email=${encodeURIComponent(email)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Director profile not found");
      return res.json();
    },
    enabled: !!email,
    retry: false,
  });

  const { data: commissions = [] } = useQuery<any[]>({
    queryKey: ["/api/director/commissions", profile?.id],
    queryFn: async () => {
      const res = await fetch(`/api/director/${profile.id}/commissions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load commissions");
      return res.json();
    },
    enabled: !!profile?.id && profile?.status === "approved",
  });

  const { data: leaderboard = [] } = useQuery<any[]>({
    queryKey: ["/api/director/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/director/leaderboard");
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return res.json();
    },
    enabled: activeTab === "leaderboard",
  });

  const logActivity = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile");
      const res = await fetch("/api/director/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          directorId: profile.id,
          type: logType,
          count: parseInt(logCount) || 1,
          notes: logNotes,
        }),
      });
      if (!res.ok) throw new Error("Failed to log activity");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Activity logged!", description: "Keep pushing. Every action builds the city." });
      setLogNotes("");
      setLogCount("1");
      setShowLogForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/director/me", email] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-lg animate-pulse">Loading your director portal…</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <Shield className="w-16 h-16 text-gray-600 mx-auto" />
          <h2 className="text-2xl font-bold text-white">No Director Profile Found</h2>
          <p className="text-gray-400">Your account isn't linked to an approved director profile yet. If you applied, check back after your application is reviewed.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/become-director">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">Apply Now</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-white/20 text-white">Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lt = profile.lifetime || {};
  const weekActivities: any[] = profile.weekActivities || [];
  const score = profile.score || 0;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const level = profile.level || "regional_director";
  const commissionRate = LEVEL_RATES[level] || 0.20;

  // Commission summaries
  const pendingCommissions = commissions.filter((c: any) => c.status === "pending");
  const paidCommissions = commissions.filter((c: any) => c.status === "paid");
  const totalPending = pendingCommissions.reduce((s: number, c: any) => s + parseFloat(c.commissionAmount || "0"), 0);
  const totalPaid = paidCommissions.reduce((s: number, c: any) => s + parseFloat(c.commissionAmount || "0"), 0);
  const totalEarned = commissions
    .filter((c: any) => c.status !== "cancelled")
    .reduce((s: number, c: any) => s + parseFloat(c.commissionAmount || "0"), 0);

  const todayGoals = [
    { label: "Contact 5 attorneys", done: (lt.attorney_contacted || 0) > 0, icon: "📞" },
    { label: "Post 1 piece of content", done: (lt.content_posted || 0) > 0, icon: "📣" },
    { label: "Reach out to 3 partners", done: (lt.partnership_created || 0) > 0, icon: "🤝" },
  ];

  const myRank = leaderboard.find((d: any) => d.id === profile.id)?.rank;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 p-4 md:p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wide">
                {LEVEL_LABELS[level] || "Regional Director"}
              </span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-400 text-xs">{Math.round(commissionRate * 100)}% commission rate</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back, {profile.name.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1">{profile.city}, {profile.state} {profile.territory ? `· ${profile.territory}` : ""}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`border ${STATUS_COLORS[profile.status] || ""}`}>
              {profile.status?.charAt(0).toUpperCase() + profile.status?.slice(1)}
            </Badge>
            {myRank && activeTab !== "leaderboard" && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
                🏆 Rank #{myRank}
              </Badge>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {([
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "commissions", label: "Commissions", icon: DollarSign },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
          ] as { id: Tab; label: string; icon: any }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-cyan-500 text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Pending notice */}
        {profile.status === "pending" && (
          <Card className="bg-yellow-900/30 border-yellow-500/40">
            <CardContent className="p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-semibold">Application Under Review</p>
                <p className="text-yellow-400/70 text-sm">You'll receive a personal message from Shawn within 48–72 hours. Your portal will activate once approved.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── DASHBOARD TAB ─────────────────────────────────────────── */}
        {activeTab === "dashboard" && profile.status === "approved" && (
          <>
            {/* Score + Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className={`text-3xl font-bold ${scoreColor}`}>{score}</p>
                  <p className="text-gray-400 text-xs mt-1">Score</p>
                  <p className={`text-xs font-semibold mt-1 ${scoreColor}`}>{scoreLabel}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{lt.attorney_onboarded || 0}</p>
                  <p className="text-gray-400 text-xs mt-1">Attorneys Onboarded</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-cyan-400">{lt.user_added || 0}</p>
                  <p className="text-gray-400 text-xs mt-1">Users Added</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">{lt.partnership_created || 0}</p>
                  <p className="text-gray-400 text-xs mt-1">Partnerships</p>
                </CardContent>
              </Card>
            </div>

            {/* Commission Quick View */}
            <Card className="bg-gradient-to-r from-green-900/30 to-cyan-900/20 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-white font-semibold">Your Earnings</span>
                  </div>
                  <button onClick={() => setActiveTab("commissions")} className="text-cyan-400 text-xs hover:underline flex items-center gap-1">
                    View all <ChevronRightIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Paid Out</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">${totalPending.toFixed(2)}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">${totalEarned.toFixed(2)}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Total Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Goals */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-cyan-400" /> Today's Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayGoals.map((g, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${g.done ? "border-green-500/30 bg-green-900/20" : "border-white/10 bg-white/5"}`}>
                    <span className="text-xl">{g.icon}</span>
                    <span className={`flex-1 font-medium ${g.done ? "text-green-400 line-through opacity-60" : "text-white"}`}>{g.label}</span>
                    {g.done && <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Log Activity */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" /> Log Activity
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setShowLogForm(!showLogForm)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-8"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </CardTitle>
              </CardHeader>
              {showLogForm && (
                <CardContent className="space-y-4 pt-0">
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-2 block">Activity Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ACTIVITY_TYPES.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setLogType(t.value)}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                            logType === t.value
                              ? "border-cyan-400 bg-cyan-500/20 text-white"
                              : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30"
                          }`}
                        >
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-1 block">Count</label>
                      <Input
                        type="number"
                        min="1"
                        value={logCount}
                        onChange={e => setLogCount(e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-1 block">Notes (optional)</label>
                      <Input
                        value={logNotes}
                        onChange={e => setLogNotes(e.target.value)}
                        placeholder="e.g. Firm name, city…"
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => logActivity.mutate()}
                    disabled={logActivity.isPending}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                  >
                    {logActivity.isPending ? "Saving…" : "Log Activity"}
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* This Week's Activity */}
            {weekActivities.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" /> This Week's Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {weekActivities.map((a: any) => {
                      const t = ACTIVITY_TYPES.find(x => x.value === a.type);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span>{t?.icon || "📋"}</span>
                            <span className="text-gray-300 text-sm">{t?.label || a.type}</span>
                            {a.notes && <span className="text-gray-500 text-xs">· {a.notes}</span>}
                          </div>
                          <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">×{a.count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ── COMMISSIONS TAB ───────────────────────────────────────── */}
        {activeTab === "commissions" && profile.status === "approved" && (
          <div className="space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-green-900/30 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
                  <p className="text-green-400/70 text-xs mt-0.5">Total Paid</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-900/20 border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-yellow-400">${totalPending.toFixed(2)}</p>
                  <p className="text-yellow-400/70 text-xs mt-0.5">Pending Payout</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-white">${totalEarned.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs mt-0.5">All-Time Earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Commission Rate Info */}
            <Card className="bg-cyan-900/20 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-sm">{Math.round(commissionRate * 100)}%</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Your Commission Rate — {LEVEL_LABELS[level]}</p>
                    <p className="text-cyan-400/70 text-sm">Earn more by leveling up. Senior Directors earn 25%, State Directors 30%, National Directors 35%.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {Object.entries(PLAN_AMOUNTS).map(([plan, price]) => {
                    const earned = (price * commissionRate).toFixed(2);
                    return (
                      <div key={plan} className="bg-white/5 rounded-lg p-3 text-center">
                        <p className="text-white text-xs font-medium">{plan}</p>
                        <p className="text-cyan-400 font-bold">${earned}/mo</p>
                        <p className="text-gray-500 text-xs">(${price}/mo plan)</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Commission History */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">Commission History</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <AlertCircle className="w-10 h-10 text-gray-600 mx-auto" />
                    <p className="text-gray-400 text-sm">No commissions recorded yet.</p>
                    <p className="text-gray-500 text-xs">Commissions are added by the admin team when a referred user subscribes. Keep recruiting!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {commissions.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-medium">{c.planName} Plan</span>
                            <Badge className={`text-xs border ${
                              c.status === "paid" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                              c.status === "cancelled" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                              "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            }`}>
                              {c.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                            {c.referredEmail && <span>Referred: {c.referredEmail}</span>}
                            {c.periodStart && <><span>·</span><span>{c.periodStart}</span></>}
                            {c.notes && <><span>·</span><span className="italic">{c.notes}</span></>}
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-green-400 font-bold">${parseFloat(c.commissionAmount || "0").toFixed(2)}</p>
                          <p className="text-gray-500 text-xs">{Math.round(parseFloat(c.commissionRate || "0.2") * 100)}% of ${parseFloat(c.planAmount || "0").toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── LEADERBOARD TAB ───────────────────────────────────────── */}
        {activeTab === "leaderboard" && (
          <div className="space-y-5">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Trophy className="w-5 h-5 text-yellow-400" /> Director Leaderboard
                </CardTitle>
                <p className="text-gray-400 text-sm">Approved directors ranked by performance score</p>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Trophy className="w-12 h-12 text-gray-600 mx-auto" />
                    <p className="text-gray-400">No approved directors yet. Be the first on the board!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((d: any) => {
                      const isMe = d.id === profile.id;
                      const medalEmoji = d.rank === 1 ? "🥇" : d.rank === 2 ? "🥈" : d.rank === 3 ? "🥉" : `#${d.rank}`;
                      const rankColor = d.rank === 1 ? "text-yellow-400" : d.rank === 2 ? "text-gray-300" : d.rank === 3 ? "text-orange-400" : "text-gray-500";
                      const scoreClr = getScoreColor(d.score);
                      return (
                        <div key={d.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                          isMe
                            ? "bg-cyan-500/10 border-cyan-400/40"
                            : "bg-white/5 border-white/10"
                        }`}>
                          <div className={`text-xl font-bold w-10 text-center flex-shrink-0 ${rankColor}`}>{medalEmoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-semibold text-sm ${isMe ? "text-cyan-300" : "text-white"}`}>
                                {d.name} {isMe && <span className="text-cyan-400 text-xs">(you)</span>}
                              </p>
                              <span className="text-gray-600 text-xs">{LEVEL_LABELS[d.level] || d.level}</span>
                            </div>
                            <p className="text-gray-400 text-xs">{d.city}, {d.state} {d.territory ? `· ${d.territory}` : ""}</p>
                          </div>
                          <div className="flex items-center gap-4 text-center flex-shrink-0">
                            <div>
                              <p className={`font-bold ${scoreClr}`}>{d.score}</p>
                              <p className="text-gray-500 text-xs">Score</p>
                            </div>
                            <div className="hidden sm:block">
                              <p className="font-bold text-blue-400">{d.lifetime?.attorney_onboarded || 0}</p>
                              <p className="text-gray-500 text-xs">Attys</p>
                            </div>
                            <div className="hidden sm:block">
                              <p className="font-bold text-cyan-400">{d.lifetime?.user_added || 0}</p>
                              <p className="text-gray-500 text-xs">Users</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-white/10">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm font-medium mb-2">How scores are calculated:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    { label: "Attorney Onboarded", pts: "×10 pts", icon: "⚖️" },
                    { label: "User Added", pts: "×2 pts", icon: "👤" },
                    { label: "Partnership", pts: "×5 pts", icon: "🤝" },
                    { label: "Activity Streak", pts: "×2 pts", icon: "🔥" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-2">
                      <p className="text-xl">{item.icon}</p>
                      <p className="text-white text-xs font-semibold mt-1">{item.label}</p>
                      <p className="text-cyan-400 text-xs">{item.pts}</p>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-3 text-center">Max score: 100. Level up to increase your commission rate.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resources */}
        <Card className="bg-cyan-900/20 border-cyan-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-300 text-base">Your Director Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Attorney Application Form", href: "/attorney-application", desc: "Send this link to attorneys you recruit" },
              { label: "Record an Encounter", href: "/record", desc: "Know the product you're promoting" },
              { label: "Legal Rights Database", href: "/rights", desc: "Review state-specific protections" },
            ].map((r, i) => (
              <Link key={i} href={r.href}>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <div>
                    <p className="text-white font-medium text-sm">{r.label}</p>
                    <p className="text-gray-400 text-xs">{r.desc}</p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Link href="/">
          <Button variant="ghost" className="text-gray-400 hover:text-white w-full">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
