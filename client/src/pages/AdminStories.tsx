import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Trophy, CheckCircle, Clock, XCircle, Gift, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

const ADMIN_KEY = "CAREN_ADMIN_2025_PRODUCTION";

interface StorySubmission {
  id: number;
  user_id: string;
  name: string;
  email?: string;
  user_email?: string;
  first_name?: string;
  last_name?: string;
  title: string;
  story: string;
  video_url?: string;
  status: "pending" | "approved" | "featured" | "rejected";
  admin_notes?: string;
  featured_month?: string;
  reward_granted: boolean;
  created_at: string;
}

interface Stats {
  pending: string;
  approved: string;
  featured: string;
  rejected: string;
  total: string;
}

const STATUS_META: Record<string, { icon: any; label: string; color: string }> = {
  pending:  { icon: Clock,       label: "Pending",        color: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10" },
  approved: { icon: CheckCircle, label: "Approved",       color: "text-green-300 border-green-500/30 bg-green-500/10"   },
  featured: { icon: Trophy,      label: "Featured",       color: "text-purple-300 border-purple-500/30 bg-purple-500/10" },
  rejected: { icon: XCircle,     label: "Rejected",       color: "text-slate-400 border-slate-500/30 bg-slate-500/10"   },
};

export default function AdminStories() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editState, setEditState] = useState<Record<number, { status: string; notes: string; month: string }>>({});

  const { data: stats, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ["/api/stories/admin/stats", ADMIN_KEY],
    queryFn: () =>
      fetch(`/api/stories/admin/stats?adminKey=${ADMIN_KEY}`).then(r => r.json()),
  });

  const { data: submissions = [], isLoading, refetch } = useQuery<StorySubmission[]>({
    queryKey: ["/api/stories/admin/list", filter, ADMIN_KEY],
    queryFn: () =>
      fetch(`/api/stories/admin/list?adminKey=${ADMIN_KEY}&status=${filter}`).then(r => r.json()),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNotes, featuredMonth }: any) =>
      fetch(`/api/stories/admin/${id}/status?adminKey=${ADMIN_KEY}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify({ status, adminNotes, featuredMonth }),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Story updated" });
      refetch(); refetchStats();
      setExpanded(null);
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const rewardMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/stories/admin/${id}/grant-reward?adminKey=${ADMIN_KEY}`, {
        method: "POST",
        headers: { "x-admin-key": ADMIN_KEY },
      }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.message && !data.success) {
        toast({ title: data.message, variant: "destructive" });
      } else {
        toast({ title: "1 month premium granted!", description: "User's account has been upgraded." });
        refetch(); refetchStats();
      }
    },
    onError: () => toast({ title: "Reward grant failed", variant: "destructive" }),
  });

  const getEdit = (id: number, sub: StorySubmission) =>
    editState[id] || { status: sub.status, notes: sub.admin_notes || "", month: sub.featured_month || "" };

  const setEdit = (id: number, updates: Partial<{ status: string; notes: string; month: string }>) =>
    setEditState(s => ({ ...s, [id]: { ...getEdit(id, submissions.find(x => x.id === id)!), ...updates } }));

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => setLocation("/admin")} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2"><Star className="w-5 h-5 text-purple-400" /> Story Spotlight Admin</h1>
            <p className="text-slate-400 text-sm mt-1">Review, approve, and feature user-submitted stories</p>
          </div>
          <button onClick={() => { refetch(); refetchStats(); }} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              { key: "total",    label: "Total",    color: "text-white"          },
              { key: "pending",  label: "Pending",  color: "text-yellow-300"     },
              { key: "approved", label: "Approved", color: "text-green-300"      },
              { key: "featured", label: "Featured", color: "text-purple-300"     },
              { key: "rejected", label: "Rejected", color: "text-slate-400"      },
            ].map(s => (
              <div key={s.key} className="cyber-card rounded-xl p-4 text-center border border-white/10">
                <div className={`text-2xl font-bold ${s.color}`}>{(stats as any)[s.key] || 0}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {["all", "pending", "approved", "featured", "rejected"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Submissions list */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading…</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 border border-white/10 rounded-xl text-slate-400">No submissions found</div>
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => {
              const meta = STATUS_META[sub.status] || STATUS_META.pending;
              const Icon = meta.icon;
              const open = expanded === sub.id;
              const edit = getEdit(sub.id, sub);

              return (
                <div key={sub.id} className="cyber-card rounded-xl border border-white/10 overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors flex items-start gap-3"
                    onClick={() => setExpanded(open ? null : sub.id)}
                  >
                    <div className={`p-1.5 rounded-lg border ${meta.color} flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white">{sub.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${meta.color}`}>{meta.label}</span>
                        {sub.reward_granted && (
                          <span className="text-xs px-2 py-0.5 rounded-full border text-yellow-300 bg-yellow-500/10 border-yellow-500/30 font-bold">🎁 Rewarded</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>By {sub.name}</span>
                        {(sub.user_email || sub.email) && <span>{sub.user_email || sub.email}</span>}
                        <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="text-slate-500 text-xs">{open ? "▲" : "▼"}</span>
                  </div>

                  {open && (
                    <div className="border-t border-white/10 p-5 space-y-5">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Story</h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{sub.story}</p>
                      </div>

                      {sub.video_url && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Video</h4>
                          <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-sm hover:underline">{sub.video_url}</a>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                          <select
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                            value={edit.status}
                            onChange={e => setEdit(sub.id, { status: e.target.value })}
                          >
                            {["pending", "approved", "featured", "rejected"].map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1.5">Featured Month (if featured)</label>
                          <input
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                            placeholder="e.g. May 2026"
                            value={edit.month}
                            onChange={e => setEdit(sub.id, { month: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1.5">Admin Notes (visible if rejected)</label>
                          <input
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                            placeholder="Optional feedback"
                            value={edit.notes}
                            onChange={e => setEdit(sub.id, { notes: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => updateMutation.mutate({ id: sub.id, status: edit.status, adminNotes: edit.notes, featuredMonth: edit.month })}
                          disabled={updateMutation.isPending}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
                        >
                          {updateMutation.isPending ? "Saving…" : "Save Status"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Grant 1 month premium to ${sub.name}?`)) {
                              rewardMutation.mutate(sub.id);
                            }
                          }}
                          disabled={sub.reward_granted || rewardMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-yellow-300 text-sm font-semibold transition-colors"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          {sub.reward_granted ? "Already Rewarded" : "Grant 1 Month Premium"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
