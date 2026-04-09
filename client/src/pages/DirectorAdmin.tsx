import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, MapPin, TrendingUp, CheckCircle, XCircle, PauseCircle, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const ADMIN_KEY = "CAREN_ADMIN_2025_PRODUCTION";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: null },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: null },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: null },
  paused: { label: "Paused", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: null },
};

const LEVEL_LABELS: Record<string, string> = {
  regional_director: "Regional Director",
  senior_director: "Senior Director",
  state_director: "State Director",
  national_director: "National Director",
};

function scoreColor(score: number) {
  if (score >= 91) return "text-orange-400";
  if (score >= 71) return "text-green-400";
  if (score >= 41) return "text-yellow-400";
  return "text-red-400";
}

function scoreLabel(score: number) {
  if (score >= 91) return "🔥 Elite";
  if (score >= 71) return "🟢 Strong";
  if (score >= 41) return "🟡 Active";
  return "🔴 Beginner";
}

export default function DirectorAdmin() {
  const [key, setKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [territoryInput, setTerritoryInput] = useState<Record<number, string>>({});
  const [notesInput, setNotesInput] = useState<Record<number, string>>({});
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

  const filtered = (directors || []).filter(d => {
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

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

        {/* Filters */}
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
          <div className="flex gap-2">
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

        {/* Director List */}
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
                  {/* Summary Row */}
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

                      {/* Mini stats */}
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

                      {/* Quick actions */}
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

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Background */}
                        <div>
                          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Application Background</p>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">{d.background || "—"}</p>
                          {d.socialLinks && (
                            <div className="mt-3">
                              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Social Links</p>
                              <p className="text-cyan-400 text-sm whitespace-pre-wrap">{d.socialLinks}</p>
                            </div>
                          )}
                          {d.phone && (
                            <p className="text-gray-400 text-sm mt-3">📞 {d.phone}</p>
                          )}
                          <p className="text-gray-500 text-xs mt-2">Applied: {new Date(d.createdAt).toLocaleDateString()}</p>
                        </div>

                        {/* Admin Controls */}
                        <div className="space-y-4">

                          {/* Level */}
                          <div>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Director Level</p>
                            <select
                              defaultValue={d.level}
                              onChange={e => updateLevel.mutate({ id: d.id, level: e.target.value })}
                              className="w-full bg-slate-800 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                            >
                              <option value="regional_director">Regional Director</option>
                              <option value="senior_director">Senior Director</option>
                              <option value="state_director">State Director</option>
                              <option value="national_director">National Director</option>
                            </select>
                          </div>

                          {/* Territory */}
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

                          {/* Admin Notes */}
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
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
