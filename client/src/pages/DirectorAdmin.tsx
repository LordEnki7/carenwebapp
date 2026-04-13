import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, MapPin, TrendingUp, CheckCircle, XCircle, PauseCircle,
  ChevronDown, ChevronUp, Search, Loader2, DollarSign, Plus, Trophy, Users,
  Mail, Send, Clock, MessageSquare, Banknote
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const ADMIN_KEY = "CAREN_ADMIN_2025_PRODUCTION";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  paused: { label: "Paused", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

const LEVEL_LABELS: Record<string, string> = {
  regional_director: "Regional Director",
  senior_director: "Senior Director",
  state_director: "State Director",
  national_director: "National Director",
};

const PLAN_OPTIONS = ["Community Guardian", "Standard", "Legal Shield", "Family", "Enterprise"];
const PLAN_AMOUNTS: Record<string, number> = {
  "Community Guardian": 0.99,
  "Standard": 4.99,
  "Legal Shield": 9.99,
  "Family": 29.99,
  "Enterprise": 49.99,
};
const LEVEL_RATES: Record<string, number> = {
  regional_director: 0.20,
  senior_director: 0.25,
  state_director: 0.30,
  national_director: 0.35,
};

function scoreColor(score: number) {
  if (score >= 91) return "text-orange-400";
  if (score >= 71) return "text-green-400";
  if (score >= 41) return "text-yellow-400";
  return "text-red-400";
}

type AdminTab = "directors" | "commissions" | "leaderboard" | "outreach" | "payouts";

const TEMPLATE_OPTIONS = [
  { key: "initial_outreach", label: "Appointment Letter — Welcome + Agreement (First Contact)" },
  { key: "follow_up", label: "Follow-Up — Second Touch" },
  { key: "final_invite", label: "Final Message — Last Chance" },
];

const OUTREACH_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  sent: { label: "Sent", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  replied: { label: "Replied", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  not_interested: { label: "Not Interested", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

export default function DirectorAdmin() {
  const [key, setKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("directors");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [territoryInput, setTerritoryInput] = useState<Record<number, string>>({});
  const [notesInput, setNotesInput] = useState<Record<number, string>>({});
  const [pinInputs, setPinInputs] = useState<Record<number, string>>({});
  const [revealedPins, setRevealedPins] = useState<Record<number, string>>({});
  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", phone: "", territory: "", level: "regional_director", adminNotes: "" });
  // Commission form state
  const [commForm, setCommForm] = useState({ directorId: "", referredEmail: "", planName: "Standard", notes: "", periodStart: "" });
  // Outreach form state
  const [outreachForm, setOutreachForm] = useState({ prospectName: "", prospectEmail: "", prospectCity: "", prospectState: "", templateKey: "initial_outreach", notes: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const headers = { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY };

  const { data: stats } = useQuery({
    queryKey: ["/api/director/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/director/admin/stats", { headers: { "x-admin-key": ADMIN_KEY } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: authenticated,
  });

  const { data: directors, isLoading } = useQuery<any[]>({
    queryKey: ["/api/director/admin/all"],
    queryFn: async () => {
      const res = await fetch("/api/director/admin/all", { headers: { "x-admin-key": ADMIN_KEY } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: authenticated,
  });

  const { data: allCommissions = [] } = useQuery<any[]>({
    queryKey: ["/api/director/admin/commissions"],
    queryFn: async () => {
      const res = await fetch("/api/director/admin/commissions", { headers: { "x-admin-key": ADMIN_KEY } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: authenticated && activeTab === "commissions",
  });

  const { data: leaderboard = [] } = useQuery<any[]>({
    queryKey: ["/api/director/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/director/leaderboard");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: authenticated && activeTab === "leaderboard",
  });

  const { data: outreachLog = [], isLoading: outreachLoading, refetch: refetchOutreach } = useQuery<any[]>({
    queryKey: ["/api/director/admin/outreach"],
    queryFn: async () => {
      const res = await fetch("/api/director/admin/outreach", { headers: { "x-admin-key": ADMIN_KEY } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: authenticated && activeTab === "outreach",
  });

  const { data: payoutRequests = [], refetch: refetchPayouts } = useQuery<any[]>({
    queryKey: ["/api/director/admin/payout-requests"],
    queryFn: async () => {
      const res = await fetch("/api/director/admin/payout-requests", { headers: { "x-admin-key": ADMIN_KEY } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: authenticated && activeTab === "payouts",
  });

  const updatePayoutStatus = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      const res = await fetch(`/api/director/admin/payout-request/${id}/status`, {
        method: "PUT", headers,
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payout request updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/payout-requests"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendOutreach = useMutation({
    mutationFn: async (data: typeof outreachForm) => {
      const res = await fetch("/api/director/admin/outreach/send", {
        method: "POST", headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: "Email Sent!", description: `Outreach sent to ${outreachForm.prospectEmail}` });
      } else {
        toast({ title: "Email Failed", description: "Check your SMTP settings.", variant: "destructive" });
      }
      setOutreachForm({ prospectName: "", prospectEmail: "", prospectCity: "", prospectState: "", templateKey: "initial_outreach", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/outreach"] });
    },
    onError: () => toast({ title: "Error sending email", variant: "destructive" }),
  });

  const updateOutreachStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/director/admin/outreach/${id}/status`, {
        method: "PUT", headers,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/outreach"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      const res = await fetch(`/api/director/admin/${id}/status`, {
        method: "PUT", headers,
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({ title: `Director ${vars.status}`, description: "Status updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/stats"] });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateLevel = useMutation({
    mutationFn: async ({ id, level }: { id: number; level: string }) => {
      const res = await fetch(`/api/director/admin/${id}/level`, {
        method: "PUT", headers,
        body: JSON.stringify({ level }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Level updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/all"] });
    },
  });

  const updateTerritory = useMutation({
    mutationFn: async ({ id, territory }: { id: number; territory: string }) => {
      const res = await fetch(`/api/director/admin/${id}/territory`, {
        method: "PUT", headers,
        body: JSON.stringify({ territory }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Territory assigned" });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/all"] });
    },
  });

  const saveNotes = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: number; adminNotes: string }) => {
      const res = await fetch(`/api/director/admin/${id}/notes`, {
        method: "PUT", headers,
        body: JSON.stringify({ adminNotes }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Notes saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/all"] });
    },
  });

  const setPin = useMutation({
    mutationFn: async ({ id, pin }: { id: number; pin?: string }) => {
      const res = await fetch(`/api/director/admin/${id}/pin`, {
        method: "PUT", headers,
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) throw new Error("Failed to set PIN");
      return res.json();
    },
    onSuccess: (data, { id }) => {
      setRevealedPins(prev => ({ ...prev, [id]: data.pin }));
      setPinInputs(prev => ({ ...prev, [id]: "" }));
      toast({ title: `PIN Set: ${data.pin}`, description: `Share this PIN with ${data.director.name} so they can log into the Director Portal.` });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/all"] });
    },
    onError: () => toast({ title: "Failed to set PIN", variant: "destructive" }),
  });

  const addCommission = useMutation({
    mutationFn: async () => {
      if (!commForm.directorId || !commForm.planName) throw new Error("Director and plan required");
      const planAmount = PLAN_AMOUNTS[commForm.planName] || 4.99;
      const director = (directors || []).find((d: any) => d.id === parseInt(commForm.directorId));
      const rate = LEVEL_RATES[director?.level || "regional_director"] || 0.20;
      const res = await fetch("/api/director/admin/commission", {
        method: "POST", headers,
        body: JSON.stringify({
          directorId: parseInt(commForm.directorId),
          referredEmail: commForm.referredEmail || undefined,
          planName: commForm.planName,
          planAmount,
          commissionRate: rate,
          notes: commForm.notes || undefined,
          periodStart: commForm.periodStart || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add commission");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Commission added!", description: "The director's earnings have been recorded." });
      setCommForm({ directorId: "", referredEmail: "", planName: "Standard", notes: "", periodStart: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/commissions"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!inviteForm.name.trim() || !inviteForm.email.trim()) throw new Error("Name and email are required");
      const res = await fetch("/api/director/admin/invite", {
        method: "POST", headers,
        body: JSON.stringify(inviteForm),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to send invite"); }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Invite sent!", description: `${inviteForm.email} will receive an email with their setup link. Code: ${data.directorCode}` });
      setInviteForm({ name: "", email: "", phone: "", territory: "", level: "regional_director", adminNotes: "" });
      setShowInviteForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/all"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const resendInvite = async (id: number, email: string) => {
    const res = await fetch(`/api/director/admin/${id}/resend-invite`, { method: "POST", headers });
    if (res.ok) toast({ title: "Invite resent", description: `A fresh invite link was emailed to ${email}` });
    else toast({ title: "Error resending invite", variant: "destructive" });
  };

  const updateCommissionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/director/admin/commission/${id}/status`, {
        method: "PUT", headers,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({ title: `Commission marked ${vars.status}` });
      queryClient.invalidateQueries({ queryKey: ["/api/director/admin/commissions"] });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Director Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Admin key…"
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && key === ADMIN_KEY) setAuthenticated(true); }}
              className="bg-white/5 border-white/20 text-white"
            />
            <Button
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
              onClick={() => {
                if (key === ADMIN_KEY) setAuthenticated(true);
                else toast({ title: "Wrong key", variant: "destructive" });
              }}
            >
              Access Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filtered = (directors || []).filter((d: any) => {
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPendingComm = allCommissions
    .filter((c: any) => c.commission?.status === "pending")
    .reduce((s: number, c: any) => s + parseFloat(c.commission?.commissionAmount || "0"), 0);

  const totalPaidComm = allCommissions
    .filter((c: any) => c.commission?.status === "paid")
    .reduce((s: number, c: any) => s + parseFloat(c.commission?.commissionAmount || "0"), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Regional Director Admin</h1>
            <p className="text-gray-400 text-sm">C.A.R.E.N. Command Center — Director Management</p>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Total Directors", value: stats.total, color: "text-white" },
              { label: "Approved", value: stats.approved, color: "text-green-400" },
              { label: "Pending", value: stats.pending, color: "text-yellow-400" },
              { label: "Cities", value: stats.cities, color: "text-cyan-400" },
              { label: "Attorneys", value: stats.totalAttorneys, color: "text-blue-400" },
              { label: "Users", value: stats.totalUsers, color: "text-purple-400" },
              { label: "Partnerships", value: stats.totalPartnerships, color: "text-orange-400" },
            ].map((s, i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {([
            { id: "directors", label: "Directors", icon: Users },
            { id: "commissions", label: "Commissions", icon: DollarSign },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
            { id: "outreach", label: "Outreach", icon: Mail },
            { id: "payouts", label: "Payouts", icon: Banknote },
          ] as { id: AdminTab; label: string; icon: any }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-cyan-500 text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── DIRECTORS TAB ─────────────────────────────── */}
        {activeTab === "directors" && (
          <>
            {/* Invite New Director */}
            <div>
              <Button onClick={() => setShowInviteForm(v => !v)}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold gap-2">
                <Plus className="w-4 h-4" />
                {showInviteForm ? "Cancel Invite" : "Invite New Director"}
              </Button>
            </div>

            {showInviteForm && (
              <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/10 border-cyan-500/30">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" /> Invite a Director by Email
                  </h3>
                  <p className="text-gray-400 text-xs">Fill in their info and click Send Invite. They'll receive an email with a personal link to complete their profile, sign the contract, and set their PIN.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-gray-400 text-xs">Full Name *</label>
                      <Input value={inviteForm.name} onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Jane Smith" className="bg-white/5 border-white/20 text-white placeholder:text-gray-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-xs">Email Address *</label>
                      <Input type="email" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="jane@example.com" className="bg-white/5 border-white/20 text-white placeholder:text-gray-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-xs">Phone (optional)</label>
                      <Input value={inviteForm.phone} onChange={e => setInviteForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="(555) 000-0000" className="bg-white/5 border-white/20 text-white placeholder:text-gray-600" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-xs">Territory (optional)</label>
                      <Input value={inviteForm.territory} onChange={e => setInviteForm(p => ({ ...p, territory: e.target.value }))}
                        placeholder="Los Angeles, CA" className="bg-white/5 border-white/20 text-white placeholder:text-gray-600" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-gray-400 text-xs">Director Level</label>
                      <select value={inviteForm.level} onChange={e => setInviteForm(p => ({ ...p, level: e.target.value }))}
                        className="w-full bg-white/5 border border-white/20 text-white rounded-md px-3 py-2 text-sm">
                        <option value="regional_director">Regional Director (20%)</option>
                        <option value="senior_director">Senior Director (25%)</option>
                        <option value="state_director">State Director (30%)</option>
                        <option value="national_director">National Director (35%)</option>
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-gray-400 text-xs">Admin Notes (optional — not shown to director)</label>
                      <Input value={inviteForm.adminNotes} onChange={e => setInviteForm(p => ({ ...p, adminNotes: e.target.value }))}
                        placeholder="How you know them, context, etc." className="bg-white/5 border-white/20 text-white placeholder:text-gray-600" />
                    </div>
                  </div>
                  <Button onClick={() => sendInvite.mutate()} disabled={sendInvite.isPending}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold gap-2 w-full sm:w-auto">
                    {sendInvite.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Invite Email</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search by name, city, email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "pending", "approved", "rejected", "paused"].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      statusFilter === s
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-400"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No directors found.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((d: any) => {
                  const isExpanded = expandedId === d.id;
                  const lt = d.lifetime || {};
                  const sc = d.score || 0;

                  return (
                    <Card key={d.id} className={`bg-white/5 border-white/10 transition-all ${isExpanded ? "border-cyan-500/40" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white font-semibold">{d.name}</p>
                              <Badge className={`border text-xs ${STATUS_CONFIG[d.status]?.color || ""}`}>
                                {STATUS_CONFIG[d.status]?.label || d.status}
                              </Badge>
                              <span className="text-gray-500 text-xs">{LEVEL_LABELS[d.level] || d.level}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-400 flex-wrap">
                              <MapPin className="w-3 h-3" />
                              <span>{d.city}, {d.state}</span>
                              {d.territory && <><span className="text-gray-600">·</span><span className="text-cyan-400">{d.territory}</span></>}
                              <span className="text-gray-600">·</span>
                              <span>{d.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className={`font-bold ${scoreColor(sc)}`}>{sc}</p>
                              <p className="text-gray-500 text-xs">Score</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-blue-400">{lt.attorney_onboarded || 0}</p>
                              <p className="text-gray-500 text-xs">Attorneys</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-cyan-400">{lt.user_added || 0}</p>
                              <p className="text-gray-500 text-xs">Users</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-purple-400">{lt.partnership_created || 0}</p>
                              <p className="text-gray-500 text-xs">Partners</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {d.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => updateStatus.mutate({ id: d.id, status: "approved" })}
                                  className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                </Button>
                                <Button size="sm" onClick={() => updateStatus.mutate({ id: d.id, status: "rejected" })}
                                  className="bg-red-600 hover:bg-red-700 text-white h-7 px-2 text-xs">
                                  <XCircle className="w-3 h-3 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {d.status === "approved" && (
                              <Button size="sm" onClick={() => updateStatus.mutate({ id: d.id, status: "paused" })}
                                variant="outline" className="border-yellow-500/40 text-yellow-400 h-7 px-2 text-xs hover:bg-yellow-500/10">
                                <PauseCircle className="w-3 h-3 mr-1" /> Pause
                              </Button>
                            )}
                            {(d.status === "paused" || d.status === "rejected") && (
                              <Button size="sm" onClick={() => updateStatus.mutate({ id: d.id, status: "approved" })}
                                className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs">
                                Reactivate
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : d.id)}
                              className="text-gray-400 h-7 px-2">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>

                      {isExpanded && (
                        <div className="border-t border-white/10 p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Application Background</p>
                              <p className="text-gray-300 text-sm whitespace-pre-wrap">{d.background || "—"}</p>
                              {d.socialLinks && (
                                <div className="mt-3">
                                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Social Links</p>
                                  <p className="text-cyan-400 text-sm whitespace-pre-wrap">{d.socialLinks}</p>
                                </div>
                              )}
                              {d.phone && <p className="text-gray-400 text-sm mt-3">📞 {d.phone}</p>}
                              <p className="text-gray-500 text-xs mt-2">Applied: {new Date(d.createdAt).toLocaleDateString()}</p>

                              {/* Invite Status */}
                              {d.inviteSentAt && (
                                <div className={`mt-3 rounded-lg p-3 border flex items-center justify-between gap-3 flex-wrap ${d.portalPin ? "border-green-500/20 bg-green-900/10" : "border-yellow-500/20 bg-yellow-900/10"}`}>
                                  <div>
                                    <p className="text-xs font-semibold mb-0.5">
                                      {d.portalPin ? <span className="text-green-400">✅ Invite Completed</span> : <span className="text-yellow-400">📧 Invite Sent — Awaiting Setup</span>}
                                    </p>
                                    <p className="text-gray-500 text-xs">Sent: {new Date(d.inviteSentAt).toLocaleString()}</p>
                                  </div>
                                  {!d.portalPin && (
                                    <Button size="sm" variant="outline"
                                      onClick={() => resendInvite(d.id, d.email)}
                                      className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/20 text-xs h-8 gap-1.5">
                                      <Send className="w-3 h-3" /> Resend Invite
                                    </Button>
                                  )}
                                </div>
                              )}

                              {/* Contract Record */}
                              <div className={`mt-4 rounded-lg p-3 border ${d.contractSignature ? "border-green-500/30 bg-green-900/10" : "border-red-500/20 bg-red-900/10"}`}>
                                <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
                                  {d.contractSignature ? (
                                    <span className="text-green-400">✅ Contract Signed</span>
                                  ) : (
                                    <span className="text-red-400">⚠️ No Contract On File</span>
                                  )}
                                </p>
                                {d.contractSignature ? (
                                  <div className="space-y-1">
                                    <p className="text-gray-300 text-sm">
                                      <span className="text-gray-500">Signed as: </span>
                                      <span className="font-serif italic text-white">{d.contractSignature}</span>
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                      Date: {d.contractSignedAt ? new Date(d.contractSignedAt).toLocaleString() : "—"} · Version: {d.contractVersion || "v1.0-2025"}
                                    </p>
                                    {d.contractIp && <p className="text-gray-600 text-xs">IP: {d.contractIp}</p>}
                                    {d.contractMethod && <p className="text-gray-500 text-xs">Method: {d.contractMethod}</p>}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-xs">No electronic signature on file. Director may have signed outside the app — use the field below to log their document.</p>
                                )}
                                {/* Contract document link */}
                                {d.contractDocumentUrl ? (
                                  <a href={d.contractDocumentUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-cyan-400 text-xs underline block mt-2">📎 View Contract Document →</a>
                                ) : (
                                  <p className="text-gray-600 text-xs mt-1 italic">No document link on file.</p>
                                )}
                                {/* Admin: manually log contract doc */}
                                <div className="mt-2 pt-2 border-t border-white/10">
                                  <p className="text-gray-500 text-xs mb-1.5">Manually log contract (paste Google Drive / DocuSign / Dropbox link):</p>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="https://drive.google.com/..."
                                      value={pinInputs[`contract_${d.id}`] ?? ""}
                                      onChange={e => setPinInputs(prev => ({ ...prev, [`contract_${d.id}`]: e.target.value }))}
                                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-600 text-xs"
                                    />
                                    <Button size="sm"
                                      onClick={async () => {
                                        const url = pinInputs[`contract_${d.id}`];
                                        if (!url) return;
                                        const res = await fetch(`/api/director/admin/${d.id}/contract-doc`, {
                                          method: "PUT", headers,
                                          body: JSON.stringify({ contractDocumentUrl: url, contractMethod: "paper" }),
                                        });
                                        if (res.ok) {
                                          toast({ title: "Contract document logged" });
                                          setPinInputs(prev => ({ ...prev, [`contract_${d.id}`]: "" }));
                                          queryClient.invalidateQueries({ queryKey: ["/api/director/admin/all"] });
                                        }
                                      }}
                                      className="bg-slate-600 hover:bg-slate-500 text-white text-xs shrink-0">
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Director Level</p>
                                <select
                                  defaultValue={d.level}
                                  onChange={e => updateLevel.mutate({ id: d.id, level: e.target.value })}
                                  className="w-full bg-slate-800 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                                >
                                  <option value="regional_director">Regional Director (20%)</option>
                                  <option value="senior_director">Senior Director (25%)</option>
                                  <option value="state_director">State Director (30%)</option>
                                  <option value="national_director">National Director (35%)</option>
                                </select>
                              </div>

                              <div>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Assigned Territory</p>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="e.g. Atlanta Metro, South LA…"
                                    value={territoryInput[d.id] ?? d.territory ?? ""}
                                    onChange={e => setTerritoryInput(prev => ({ ...prev, [d.id]: e.target.value }))}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-600 text-sm"
                                  />
                                  <Button size="sm" onClick={() => updateTerritory.mutate({ id: d.id, territory: territoryInput[d.id] ?? d.territory ?? "" })}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold shrink-0">
                                    Save
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Admin Notes</p>
                                <Textarea
                                  rows={3}
                                  placeholder="Internal notes about this director…"
                                  value={notesInput[d.id] ?? d.adminNotes ?? ""}
                                  onChange={e => setNotesInput(prev => ({ ...prev, [d.id]: e.target.value }))}
                                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-600 text-sm resize-none"
                                />
                                <Button size="sm" onClick={() => saveNotes.mutate({ id: d.id, adminNotes: notesInput[d.id] ?? d.adminNotes ?? "" })}
                                  className="mt-2 bg-slate-600 hover:bg-slate-500 text-white text-xs">
                                  Save Notes
                                </Button>
                              </div>

                              <div className="border border-cyan-500/20 rounded-lg p-3 bg-cyan-900/10">
                                <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
                                  🔐 Director Portal PIN
                                </p>
                                {revealedPins[d.id] ? (
                                  <div className="mb-2 p-2 bg-green-900/30 border border-green-500/30 rounded-lg text-center">
                                    <p className="text-gray-400 text-xs mb-1">PIN generated — share with director:</p>
                                    <p className="text-green-400 font-mono text-2xl font-bold tracking-widest">{revealedPins[d.id]}</p>
                                    <p className="text-gray-500 text-xs mt-1">Director logs in at /director-portal with their email + this PIN</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-xs mb-2">
                                    {d.portalPin ? "PIN is set. Generate a new one to replace it." : "No PIN set yet. Generate one for this director."}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Custom PIN (optional)"
                                    value={pinInputs[d.id] ?? ""}
                                    onChange={e => setPinInputs(prev => ({ ...prev, [d.id]: e.target.value }))}
                                    maxLength={10}
                                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-600 text-sm font-mono"
                                  />
                                  <Button size="sm"
                                    onClick={() => setPin.mutate({ id: d.id, pin: pinInputs[d.id] || undefined })}
                                    disabled={setPin.isPending}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs shrink-0">
                                    {pinInputs[d.id] ? "Set PIN" : "Generate PIN"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── COMMISSIONS TAB ───────────────────────────── */}
        {activeTab === "commissions" && (
          <div className="space-y-5">
            {/* Commission Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-yellow-900/20 border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">${totalPendingComm.toFixed(2)}</p>
                  <p className="text-yellow-400/70 text-xs mt-0.5">Pending Payouts</p>
                </CardContent>
              </Card>
              <Card className="bg-green-900/20 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">${totalPaidComm.toFixed(2)}</p>
                  <p className="text-green-400/70 text-xs mt-0.5">Total Paid Out</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{allCommissions.length}</p>
                  <p className="text-gray-400 text-xs mt-0.5">Total Commission Records</p>
                </CardContent>
              </Card>
            </div>

            {/* Add Commission Form */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" /> Record New Commission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1 block">Director</label>
                    <select
                      value={commForm.directorId}
                      onChange={e => setCommForm(f => ({ ...f, directorId: e.target.value }))}
                      className="w-full bg-slate-800 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select director…</option>
                      {(directors || []).filter((d: any) => d.status === "approved").map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name} — {d.city}, {d.state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1 block">Plan</label>
                    <select
                      value={commForm.planName}
                      onChange={e => setCommForm(f => ({ ...f, planName: e.target.value }))}
                      className="w-full bg-slate-800 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                    >
                      {PLAN_OPTIONS.map(p => (
                        <option key={p} value={p}>{p} (${PLAN_AMOUNTS[p]}/mo)</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1 block">Referred User Email (optional)</label>
                    <Input
                      placeholder="user@example.com"
                      value={commForm.referredEmail}
                      onChange={e => setCommForm(f => ({ ...f, referredEmail: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1 block">Period (YYYY-MM, optional)</label>
                    <Input
                      placeholder="2026-04"
                      value={commForm.periodStart}
                      onChange={e => setCommForm(f => ({ ...f, periodStart: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-600"
                    />
                  </div>
                </div>
                {commForm.directorId && commForm.planName && (
                  <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 text-sm">
                    {(() => {
                      const d = (directors || []).find((x: any) => x.id === parseInt(commForm.directorId));
                      const rate = LEVEL_RATES[d?.level || "regional_director"] || 0.20;
                      const planAmt = PLAN_AMOUNTS[commForm.planName] || 4.99;
                      const commission = (planAmt * rate).toFixed(2);
                      return (
                        <span className="text-cyan-300">
                          Commission preview: <strong>${commission}</strong> ({Math.round(rate * 100)}% of ${planAmt})
                          {d && <> — {LEVEL_LABELS[d.level] || d.level} rate</>}
                        </span>
                      );
                    })()}
                  </div>
                )}
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1 block">Notes (optional)</label>
                  <Input
                    placeholder="e.g. Monthly subscription referral…"
                    value={commForm.notes}
                    onChange={e => setCommForm(f => ({ ...f, notes: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-600"
                  />
                </div>
                <Button
                  onClick={() => addCommission.mutate()}
                  disabled={addCommission.isPending || !commForm.directorId}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                >
                  {addCommission.isPending ? "Adding…" : "Record Commission"}
                </Button>
              </CardContent>
            </Card>

            {/* Commission List */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">All Commission Records</CardTitle>
              </CardHeader>
              <CardContent>
                {allCommissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No commissions recorded yet.</div>
                ) : (
                  <div className="space-y-2">
                    {allCommissions.map((item: any) => {
                      const c = item.commission;
                      return (
                        <div key={c?.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white text-sm font-medium">{item.directorName}</span>
                              <span className="text-gray-500 text-xs">— {item.directorCity}, {item.directorState}</span>
                              <Badge className={`text-xs border ${
                                c?.status === "paid" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                                c?.status === "cancelled" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              }`}>{c?.status}</Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                              <span>{c?.planName} Plan</span>
                              {c?.referredEmail && <><span>·</span><span>{c?.referredEmail}</span></>}
                              {c?.periodStart && <><span>·</span><span>{c?.periodStart}</span></>}
                              {c?.notes && <><span>·</span><span className="italic">{c?.notes}</span></>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-green-400 font-bold">${parseFloat(c?.commissionAmount || "0").toFixed(2)}</p>
                              <p className="text-gray-600 text-xs">{Math.round(parseFloat(c?.commissionRate || "0.2") * 100)}%</p>
                            </div>
                            <div className="flex gap-1">
                              {c?.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => updateCommissionStatus.mutate({ id: c.id, status: "paid" })}
                                    className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs">
                                    Mark Paid
                                  </Button>
                                  <Button size="sm" onClick={() => updateCommissionStatus.mutate({ id: c.id, status: "cancelled" })}
                                    variant="outline" className="border-red-500/40 text-red-400 h-7 px-2 text-xs hover:bg-red-500/10">
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {c?.status === "paid" && (
                                <span className="text-green-400 text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Paid
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── LEADERBOARD TAB ───────────────────────────── */}
        {activeTab === "leaderboard" && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Trophy className="w-5 h-5 text-yellow-400" /> Live Leaderboard
              </CardTitle>
              <p className="text-gray-400 text-sm">Approved directors ranked by performance score</p>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No approved directors yet.</div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((d: any) => {
                    const medal = d.rank === 1 ? "🥇" : d.rank === 2 ? "🥈" : d.rank === 3 ? "🥉" : `#${d.rank}`;
                    return (
                      <div key={d.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="text-xl font-bold w-10 text-center flex-shrink-0">{medal}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-semibold text-sm">{d.name}</p>
                            <span className="text-gray-500 text-xs">{LEVEL_LABELS[d.level] || d.level}</span>
                          </div>
                          <p className="text-gray-400 text-xs">{d.city}, {d.state} {d.territory ? `· ${d.territory}` : ""}</p>
                        </div>
                        <div className="flex gap-4 text-center flex-shrink-0">
                          <div>
                            <p className={`font-bold ${scoreColor(d.score)}`}>{d.score}</p>
                            <p className="text-gray-500 text-xs">Score</p>
                          </div>
                          <div>
                            <p className="font-bold text-blue-400">{d.lifetime?.attorney_onboarded || 0}</p>
                            <p className="text-gray-500 text-xs">Attys</p>
                          </div>
                          <div>
                            <p className="font-bold text-cyan-400">{d.lifetime?.user_added || 0}</p>
                            <p className="text-gray-500 text-xs">Users</p>
                          </div>
                          <div>
                            <p className="font-bold text-green-400">${d.totalEarned?.toFixed(2) || "0.00"}</p>
                            <p className="text-gray-500 text-xs">Earned</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── OUTREACH TAB ───────────────────────────── */}
        {activeTab === "outreach" && (
          <div className="space-y-6">
            {/* Send Email Form */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Send className="w-5 h-5 text-cyan-400" /> Send Director Prospect Email
                </CardTitle>
                <p className="text-gray-400 text-sm">Send a recruitment email to a prospective Regional Director</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Prospect Name *</label>
                    <Input
                      placeholder="Full name"
                      value={outreachForm.prospectName}
                      onChange={e => setOutreachForm(f => ({ ...f, prospectName: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Email Address *</label>
                    <Input
                      placeholder="email@example.com"
                      type="email"
                      value={outreachForm.prospectEmail}
                      onChange={e => setOutreachForm(f => ({ ...f, prospectEmail: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">City</label>
                    <Input
                      placeholder="Los Angeles"
                      value={outreachForm.prospectCity}
                      onChange={e => setOutreachForm(f => ({ ...f, prospectCity: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">State</label>
                    <Input
                      placeholder="CA"
                      value={outreachForm.prospectState}
                      onChange={e => setOutreachForm(f => ({ ...f, prospectState: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Email Template *</label>
                  <select
                    value={outreachForm.templateKey}
                    onChange={e => setOutreachForm(f => ({ ...f, templateKey: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                  >
                    {TEMPLATE_OPTIONS.map(t => (
                      <option key={t.key} value={t.key} className="bg-gray-900">{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Internal Notes (optional)</label>
                  <Textarea
                    placeholder="How did you find this prospect? Any context..."
                    value={outreachForm.notes}
                    onChange={e => setOutreachForm(f => ({ ...f, notes: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white text-sm resize-none"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={() => sendOutreach.mutate(outreachForm)}
                  disabled={!outreachForm.prospectName || !outreachForm.prospectEmail || sendOutreach.isPending}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold w-full sm:w-auto"
                >
                  {sendOutreach.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send Email</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Outreach Log */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Clock className="w-5 h-5 text-purple-400" /> Outreach History
                  </CardTitle>
                  <span className="text-gray-500 text-xs">{outreachLog.length} total</span>
                </div>
              </CardHeader>
              <CardContent>
                {outreachLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                ) : outreachLog.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No outreach emails sent yet.</p>
                    <p className="text-xs mt-1">Use the form above to contact your first prospect.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {outreachLog.map((r: any) => {
                      const sc = OUTREACH_STATUS_CONFIG[r.status] || OUTREACH_STATUS_CONFIG.sent;
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                          <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white text-sm font-medium">{r.prospectName}</p>
                              <p className="text-gray-400 text-xs">{r.prospectEmail}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {r.prospectCity && <span className="text-gray-500 text-xs">{r.prospectCity}{r.prospectState ? `, ${r.prospectState}` : ""}</span>}
                              <span className="text-gray-600 text-xs">·</span>
                              <span className="text-gray-500 text-xs capitalize">{(r.templateUsed || "").replace(/_/g, " ")}</span>
                              <span className="text-gray-600 text-xs">·</span>
                              <span className="text-gray-500 text-xs">{new Date(r.sentAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={`text-xs border ${sc.color}`}>{sc.label}</Badge>
                            <select
                              value={r.status}
                              onChange={e => updateOutreachStatus.mutate({ id: r.id, status: e.target.value })}
                              className="bg-white/5 border border-white/10 text-gray-400 rounded text-xs px-1.5 py-1"
                            >
                              <option value="sent" className="bg-gray-900">Sent</option>
                              <option value="replied" className="bg-gray-900">Replied</option>
                              <option value="not_interested" className="bg-gray-900">Not Interested</option>
                              <option value="failed" className="bg-gray-900">Failed</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── PAYOUTS TAB ───────────────────────────────────────────── */}
        {activeTab === "payouts" && (
          <div className="space-y-5">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center justify-between text-base">
                  <span className="flex items-center gap-2"><Banknote className="w-5 h-5 text-green-400" /> Payout Requests</span>
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span className="text-yellow-400 font-bold">{payoutRequests.filter((r:any) => r.status === "pending").length} pending</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payoutRequests.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Banknote className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No payout requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payoutRequests.map((r: any) => (
                      <div key={r.id} className={`border rounded-xl p-4 space-y-2 ${r.status === "pending" ? "border-yellow-500/30 bg-yellow-900/10" : r.status === "paid" ? "border-green-500/20 bg-green-900/10" : "border-red-500/20 bg-red-900/10"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white font-bold text-base">${parseFloat(r.amountRequested).toFixed(2)}</p>
                            <p className="text-cyan-400 text-sm font-medium">{r.directorName}</p>
                            <p className="text-gray-400 text-xs">{r.directorEmail} · {r.directorCity}, {r.directorState}</p>
                            <p className="text-gray-400 text-xs mt-1">
                              <span className="text-white font-semibold">{r.paymentMethod}</span>
                              {r.paymentHandle && <span> → <span className="text-cyan-300 font-mono">{r.paymentHandle}</span></span>}
                            </p>
                            <p className="text-gray-500 text-xs">{new Date(r.requestedAt).toLocaleString()}</p>
                          </div>
                          <Badge className={`border text-xs flex-shrink-0 ${r.status === "paid" ? "bg-green-500/20 text-green-400 border-green-500/30" : r.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}>
                            {r.status === "paid" ? "✓ Paid" : r.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                          </Badge>
                        </div>
                        {r.status === "pending" && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              onClick={() => updatePayoutStatus.mutate({ id: r.id, status: "paid" })}
                              disabled={updatePayoutStatus.isPending}
                              className="bg-green-500 hover:bg-green-600 text-black font-bold h-8 text-xs flex-1"
                            >
                              ✓ Mark as Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePayoutStatus.mutate({ id: r.id, status: "rejected" })}
                              disabled={updatePayoutStatus.isPending}
                              className="border-red-500/40 text-red-400 hover:bg-red-900/20 h-8 text-xs flex-1"
                            >
                              ✗ Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
