import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Target, Users, TrendingUp, Plus, CheckCircle, Clock, Star,
  DollarSign, Trophy, BarChart3, ChevronRight as ChevronRightIcon, AlertCircle,
  Briefcase, Copy, Check, ChevronDown, ChevronUp, Link2, Banknote, Send
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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

type Tab = "dashboard" | "commissions" | "leaderboard" | "toolkit";

const TOOLKIT_SECTIONS = [
  {
    id: "attorney",
    label: "⚖️ Attorney Outreach",
    color: "blue",
    scripts: [
      {
        title: "Cold Call Opening — Attorney",
        content: `"Hi, my name is [Your Name] and I'm a Regional Director with C.A.R.E.N. — Citizen Assistance for Roadside Emergencies and Navigation. We're building a network of attorneys across [City] who want to be connected directly with people who've had a roadside encounter and need legal help. It's free to join the network and you only get contacted when someone in your area needs assistance. Would you be open to a 5-minute conversation about how it works?"`,
      },
      {
        title: "Attorney Email Outreach",
        content: `Subject: Join the C.A.R.E.N. Legal Network in [City]

Hello [Attorney Name],

My name is [Your Name] and I'm a Regional Director for C.A.R.E.N. (Citizen Assistance for Roadside Emergencies and Navigation) — a platform that gives drivers real-time legal support during roadside encounters.

We're building a verified attorney network in [City/State] and I'd love to connect you with people in your area who need exactly the type of help you provide.

There's no cost to join. You receive referrals when a C.A.R.E.N. member in your area needs legal assistance.

Would you be open to a 10-minute call this week?

Respectfully,
[Your Name]
C.A.R.E.N. Regional Director — [City], [State]`,
      },
      {
        title: "In-Person Law Firm Pitch",
        content: `"Good [morning/afternoon]. I'm [Your Name], a Regional Director with C.A.R.E.N. — a platform that helps drivers document roadside encounters and connect with attorneys instantly. We're building a verified attorney referral network right here in [City] and we want [Firm Name] to be part of it. There's no fee to join — you simply get matched with clients in your area who are already looking for legal help. Do you have a card I can leave some information with? I'd love to have someone from the firm connect with us."`,
      },
    ],
  },
  {
    id: "business",
    label: "🤝 Business & Partnership",
    color: "purple",
    scripts: [
      {
        title: "Business Partnership Pitch",
        content: `"Hi, I'm [Your Name], a Regional Director with C.A.R.E.N. — an app that protects drivers during roadside emergencies and legal encounters. We're partnering with local businesses in [City] to offer C.A.R.E.N. subscriptions to their employees or customers as a value-add. It's a low-cost way to show your community you care about their safety. Would you be open to hearing more about our business partnership program?"`,
      },
      {
        title: "Auto Shop / Dealership Outreach",
        content: `Subject: Protect Your Customers on the Road — C.A.R.E.N. Partnership

Hi [Owner/Manager Name],

I'm reaching out because I think your customers would love what we've built. C.A.R.E.N. is a roadside protection app that records encounters, provides real-time legal guidance, and connects drivers to attorneys when needed.

As an auto-related business, you already serve drivers. Offering C.A.R.E.N. as a recommended tool — or bundling it with your services — gives your customers one more reason to trust and choose you.

I'd love to explore a simple referral partnership. Can we connect this week?

[Your Name]
C.A.R.E.N. Regional Director — [City], [State]`,
      },
      {
        title: "Community Organization Outreach",
        content: `"Hello, I'm [Your Name] with C.A.R.E.N. We're a citizen safety platform focused on giving everyday drivers the tools and legal knowledge they need during roadside situations. We're working with community organizations in [City] to spread awareness and potentially offer group pricing to your members. A lot of the people your organization serves could benefit from this type of protection. Would you be open to hosting a 15-minute info session or letting us share a flyer with your network?"`,
      },
    ],
  },
  {
    id: "user",
    label: "👥 User & Community",
    color: "cyan",
    scripts: [
      {
        title: "Direct Message / Text Script",
        content: `"Hey [Name]! I wanted to share something I think you'd find valuable. It's called C.A.R.E.N. — an app that protects you during traffic stops and roadside situations. It records the encounter, tells you your legal rights in real time, and connects you to an attorney if needed. Plans start at under $5/month. I'm actually a Regional Director for them now. Check it out: carenalert.com — let me know if you have questions!"`,
      },
      {
        title: "Social Media Caption",
        content: `Do you know your rights when you're pulled over? 🚗

Most people don't — and that's exactly why I joined C.A.R.E.N.

C.A.R.E.N. is a real-time protection app for drivers that:
✅ Records your encounter automatically
✅ Tells you your legal rights state-by-state
✅ Connects you to a local attorney instantly
✅ Notifies your family in an emergency

Plans start at $0.99/month. This is the protection everyone needs but nobody talks about.

👉 carenalert.com

#CAREN #KnowYourRights #RoadsideSafety #DriverProtection #LegalRights`,
      },
      {
        title: "Community Event / Tabling Script",
        content: `"Hi there! Have you heard of C.A.R.E.N.? It's a citizen safety app I'm here to tell you about today. It stands for Citizen Assistance for Roadside Emergencies and Navigation. Basically, it protects drivers during traffic stops — it records the encounter, gives you your legal rights on screen in real time, and can alert your family and connect you to an attorney. It works across all 50 states. Plans start at under $5 a month. Here's a card — and I'd love to answer any questions you have about how it works."`,
      },
    ],
  },
];

function ScriptCard({ script }: { script: { title: string; content: string } }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-medium text-sm">{script.title}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed font-sans bg-black/30 rounded p-3 border border-white/10">
            {script.content}
          </pre>
          <Button
            size="sm"
            onClick={handleCopy}
            className={`w-full h-8 text-xs font-semibold transition-all ${copied ? "bg-green-500 text-white" : "bg-cyan-500 hover:bg-cyan-600 text-black"}`}
          >
            {copied ? <><Check className="w-3 h-3 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy Script</>}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function DirectorPortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Standalone PIN auth — completely separate from C.A.R.E.N. app login ──
  const [portalSession, setPortalSession] = useState<{ email: string; pin: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem("directorPortalSession") || "null"); } catch { return null; }
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Dashboard state (always declared — hooks must be unconditional) ────────
  const [logType, setLogType] = useState("attorney_contacted");
  const [logCount, setLogCount] = useState("1");
  const [logNotes, setLogNotes] = useState("");
  const [showLogForm, setShowLogForm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutHandle, setPayoutHandle] = useState("");
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const email = portalSession?.email || "";
  const pin = portalSession?.pin || "";

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["/api/director/portal-profile", email, pin],
    queryFn: async () => {
      const res = await fetch(`/api/director/portal-profile?email=${encodeURIComponent(email)}&pin=${encodeURIComponent(pin)}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Session invalid"); }
      return res.json();
    },
    enabled: !!email && !!pin,
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

  const { data: payoutRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/director/payout-requests", profile?.id],
    queryFn: async () => {
      const res = await fetch(`/api/director/${profile.id}/payout-requests`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load payout requests");
      return res.json();
    },
    enabled: !!profile?.id && activeTab === "commissions",
  });

  const requestPayout = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile");
      const res = await fetch("/api/director/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          directorId: profile.id,
          amountRequested: payoutAmount,
          paymentMethod: payoutMethod,
          paymentHandle: payoutHandle,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payout requested!", description: "We'll process it within 3–5 business days." });
      setPayoutAmount(""); setPayoutMethod(""); setPayoutHandle(""); setShowPayoutForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/director/payout-requests", profile?.id] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
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
      queryClient.invalidateQueries({ queryKey: ["/api/director/portal-profile", email, pin] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPin.trim()) { setLoginError("Please enter your email and PIN."); return; }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/director/portal-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), pin: loginPin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error || "Login failed."); setLoginLoading(false); return; }
      const session = { email: loginEmail.trim().toLowerCase(), pin: loginPin.trim() };
      localStorage.setItem("directorPortalSession", JSON.stringify(session));
      setPortalSession(session);
    } catch { setLoginError("Connection error. Please try again."); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("directorPortalSession");
    setPortalSession(null);
    setLoginEmail("");
    setLoginPin("");
    queryClient.removeQueries({ queryKey: ["/api/director/portal-profile"] });
  };

  if (!portalSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Director Portal</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in with your director credentials</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1.5">Email Address</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-1.5">Director PIN</label>
              <Input
                type="password"
                placeholder="Enter your 6-digit PIN"
                value={loginPin}
                onChange={e => setLoginPin(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 font-mono tracking-widest"
              />
            </div>
            {loginError && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                {loginError}
              </div>
            )}
            <Button onClick={handleLogin} disabled={loginLoading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
              {loginLoading ? "Signing in…" : "Access Portal"}
            </Button>
          </div>
          <p className="text-center text-gray-500 text-xs">
            Don't have a PIN? Contact C.A.R.E.N. administration after your application is approved.
          </p>
          <div className="text-center">
            <Link href="/become-director">
              <span className="text-cyan-400 text-sm hover:underline cursor-pointer">Apply to become a Director →</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-400">Profile not found or your session has expired. Please sign in again.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleLogout} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">Sign In Again</Button>
            <Link href="/become-director">
              <Button variant="outline" className="border-white/20 text-white">Apply Now</Button>
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
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 text-xs underline transition-colors mt-1"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {([
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "commissions", label: "Commissions", icon: DollarSign },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
            { id: "toolkit", label: "Toolkit", icon: Briefcase },
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

            {/* Referral Link */}
            {(() => {
              const dirCode = profile.directorCode;
              const refLink = dirCode ? `https://carenalert.com/?dref=${dirCode}` : null;
              const copyLink = () => {
                if (refLink) { navigator.clipboard.writeText(refLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }
              };
              return (
                <Card className="bg-gradient-to-r from-blue-900/40 to-cyan-900/30 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-semibold">Your Personal Referral Link</span>
                    </div>
                    {refLink ? (
                      <>
                        <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between gap-2 mb-2">
                          <span className="text-cyan-300 text-xs font-mono truncate">{refLink}</span>
                          <button onClick={copyLink} className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg transition-all ${linkCopied ? "bg-green-500 text-white" : "bg-cyan-500 text-black hover:bg-cyan-400"}`}>
                            {linkCopied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                          </button>
                        </div>
                        <p className="text-gray-400 text-xs">Share this link when recruiting users. Commissions are tracked automatically when someone signs up through it.</p>
                        <p className="text-blue-300 text-xs mt-1 font-mono">Your code: <strong>{dirCode}</strong></p>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">Your referral link will appear here shortly. Refresh the page if it's not showing.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

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

            {/* Payout Request */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center justify-between text-base">
                  <span className="flex items-center gap-2"><Banknote className="w-5 h-5 text-green-400" /> Request Payout</span>
                  <Button size="sm" onClick={() => setShowPayoutForm(!showPayoutForm)} className="bg-green-500 hover:bg-green-600 text-black font-bold h-8">
                    {showPayoutForm ? "Cancel" : "+ New Request"}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showPayoutForm && (
                <CardContent className="space-y-3 pt-0">
                  <p className="text-gray-400 text-xs">Minimum payout is $25. We process within 3–5 business days.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 text-xs font-medium mb-1 block">Amount ($)</label>
                      <Input type="number" min="25" step="0.01" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="25.00" className="bg-white/5 border-white/20 text-white" />
                    </div>
                    <div>
                      <label className="text-gray-300 text-xs font-medium mb-1 block">Payment Method</label>
                      <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Venmo">Venmo</SelectItem>
                          <SelectItem value="Zelle">Zelle</SelectItem>
                          <SelectItem value="CashApp">CashApp</SelectItem>
                          <SelectItem value="PayPal">PayPal</SelectItem>
                          <SelectItem value="Check">Check (mailed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs font-medium mb-1 block">Your handle / email for {payoutMethod || "payment"}</label>
                    <Input value={payoutHandle} onChange={e => setPayoutHandle(e.target.value)} placeholder={payoutMethod === "Check" ? "Mailing address" : "@username or email"} className="bg-white/5 border-white/20 text-white placeholder:text-gray-600" />
                  </div>
                  <Button onClick={() => requestPayout.mutate()} disabled={requestPayout.isPending || !payoutAmount || !payoutMethod} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold gap-2">
                    <Send className="w-4 h-4" /> {requestPayout.isPending ? "Submitting…" : "Submit Payout Request"}
                  </Button>
                </CardContent>
              )}
              {payoutRequests.length > 0 && (
                <CardContent className="pt-0 space-y-2">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Your Requests</p>
                  {payoutRequests.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                      <div>
                        <p className="text-white text-sm font-bold">${parseFloat(r.amountRequested).toFixed(2)}</p>
                        <p className="text-gray-400 text-xs">{r.paymentMethod} · {r.paymentHandle}</p>
                        <p className="text-gray-500 text-xs">{new Date(r.requestedAt).toLocaleDateString()}</p>
                      </div>
                      <Badge className={`border text-xs ${r.status === "paid" ? "bg-green-500/20 text-green-400 border-green-500/30" : r.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}>
                        {r.status === "paid" ? "✓ Paid" : r.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              )}
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

        {/* ── TOOLKIT TAB ───────────────────────────────────────────── */}
        {activeTab === "toolkit" && (
          <div className="space-y-5">
            <div className="p-4 bg-gradient-to-r from-cyan-900/40 to-blue-900/30 border border-cyan-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-white font-bold text-base">Director Toolkit</h2>
                </div>
                <Link href="/director-playbook">
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-8 text-xs gap-1.5">
                    📄 Full Playbook PDF
                  </Button>
                </Link>
              </div>
              <p className="text-gray-400 text-sm">Copy-ready scripts for recruiting attorneys, partnering with businesses, and growing your user base. Tap any script to expand it, then copy with one click.</p>
            </div>

            {TOOLKIT_SECTIONS.map(section => (
              <Card key={section.id} className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base font-bold ${
                    section.color === "blue" ? "text-blue-300" :
                    section.color === "purple" ? "text-purple-300" : "text-cyan-300"
                  }`}>
                    {section.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {section.scripts.map((script, i) => (
                    <ScriptCard key={i} script={script} />
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* QR Code Card */}
            <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/20 border-cyan-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-300 text-base">Your C.A.R.E.N. QR Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center gap-5">
                <img
                  src="/caren-qr-code.png"
                  alt="C.A.R.E.N. QR Code — Scan to Download"
                  className="w-36 h-36 rounded-xl border-2 border-cyan-500/40 object-contain bg-white p-1 flex-shrink-0"
                />
                <div>
                  <p className="text-white font-semibold mb-1">Scan to Download C.A.R.E.N.</p>
                  <p className="text-gray-400 text-sm mb-3">Show this code on your phone to any prospect — they scan it and land directly on the app download. Display it on a printed card, flyer, or share it in a text.</p>
                  <p className="text-cyan-400 text-xs font-medium uppercase tracking-wide">carenalert.com · iOS &amp; Android</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-cyan-900/20 border-cyan-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-300 text-base">Quick Links to Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Attorney Application Form", href: "/attorney-application", desc: "Direct link — send to any attorney you recruit" },
                  { label: "C.A.R.E.N. Homepage", href: "/", desc: "Share this with users and businesses" },
                  { label: "Legal Rights Database", href: "/rights", desc: "Show prospects what the platform covers" },
                  { label: "Record an Encounter", href: "/record", desc: "Demo the core product feature" },
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
          </div>
        )}

        {/* Resources — shown on all non-toolkit tabs */}
        {activeTab !== "toolkit" && (
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
        )}

        <Link href="/">
          <Button variant="ghost" className="text-gray-400 hover:text-white w-full">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
