import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Target, Users, Briefcase, FileText, TrendingUp, Plus, CheckCircle, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

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

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  paused: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function DirectorPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logType, setLogType] = useState("attorney_contacted");
  const [logCount, setLogCount] = useState("1");
  const [logNotes, setLogNotes] = useState("");
  const [showLogForm, setShowLogForm] = useState(false);

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

  const todayGoals = [
    { label: "Contact 5 attorneys", done: (lt.attorney_contacted || 0) > 0, icon: "📞" },
    { label: "Post 1 piece of content", done: (lt.content_posted || 0) > 0, icon: "📣" },
    { label: "Reach out to 3 partners", done: (lt.partnership_created || 0) > 0, icon: "🤝" },
  ];

  const score = profile.score || 0;
  const scoreColor = score >= 91 ? "text-orange-400" : score >= 71 ? "text-green-400" : score >= 41 ? "text-yellow-400" : "text-red-400";
  const scoreLabel = score >= 91 ? "🔥 Elite" : score >= 71 ? "🟢 Strong" : score >= 41 ? "🟡 Active" : "🔴 Beginner";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 p-4 md:p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wide">
                {LEVEL_LABELS[profile.level] || "Regional Director"}
              </span>
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
          </div>
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

        {profile.status === "approved" && (
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
                  <ChevronRight className="w-4 h-4 text-gray-500" />
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

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
