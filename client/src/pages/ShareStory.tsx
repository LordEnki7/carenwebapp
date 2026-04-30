import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Send, CheckCircle, Clock, XCircle, Trophy } from "lucide-react";

interface MySubmission {
  id: number;
  title: string;
  status: "pending" | "approved" | "featured" | "rejected";
  admin_notes?: string;
  featured_month?: string;
  reward_granted: boolean;
  created_at: string;
}

const STATUS_META: Record<string, { icon: any; label: string; color: string }> = {
  pending:  { icon: Clock,       label: "Under Review",  color: "text-yellow-300 bg-yellow-500/10 border-yellow-500/30" },
  approved: { icon: CheckCircle, label: "Approved",      color: "text-green-300 bg-green-500/10 border-green-500/30"   },
  featured: { icon: Trophy,      label: "Featured!",     color: "text-purple-300 bg-purple-500/10 border-purple-500/30" },
  rejected: { icon: XCircle,     label: "Not Selected",  color: "text-slate-400 bg-slate-500/10 border-slate-500/30"   },
};

export default function ShareStory() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: (user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ""}`.trim() : "",
    email: (user as any)?.email || "",
    title: "",
    story: "",
    videoUrl: "",
    consentGiven: false,
  });

  const { data: mySubmissions = [], refetch } = useQuery<MySubmission[]>({
    queryKey: ["/api/stories/my"],
    enabled: isAuthenticated,
  });

  const submitMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/stories/submit", form),
    onSuccess: () => {
      toast({ title: "Story submitted!", description: "We'll review it within a few days. Thank you!" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Submission failed", description: err?.message || "Please try again", variant: "destructive" });
    },
  });

  const hasPending = mySubmissions.some(s => s.status !== "rejected");

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Story Spotlight
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
            Share how C.A.R.E.N. helped you in a real situation. Every month, one story is
            featured and the author receives <strong className="text-white">1 month of free premium</strong>.
          </p>
        </div>

        {/* Existing submissions */}
        {mySubmissions.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Your Submissions</h2>
            {mySubmissions.map(sub => {
              const meta = STATUS_META[sub.status] || STATUS_META.pending;
              const Icon = meta.icon;
              return (
                <div key={sub.id} className={`p-4 rounded-xl border ${meta.color} flex items-start gap-3`}>
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{sub.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.color} font-bold`}>{meta.label}</span>
                      {sub.reward_granted && (
                        <span className="text-xs px-2 py-0.5 rounded-full border text-yellow-300 bg-yellow-500/10 border-yellow-500/30 font-bold">🎁 Reward Granted</span>
                      )}
                    </div>
                    {sub.featured_month && (
                      <p className="text-xs mt-1 opacity-80">Featured: {sub.featured_month}</p>
                    )}
                    {sub.admin_notes && sub.status === "rejected" && (
                      <p className="text-xs mt-1 opacity-70">{sub.admin_notes}</p>
                    )}
                    <p className="text-xs opacity-50 mt-1">Submitted {new Date(sub.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Form */}
        {!isAuthenticated ? (
          <div className="text-center py-10 border border-white/10 rounded-xl">
            <p className="text-slate-400 mb-4">Sign in to submit your story</p>
            <button onClick={() => setLocation("/login")} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-semibold transition-colors">
              Sign In
            </button>
          </div>
        ) : hasPending ? (
          <div className="text-center py-10 border border-green-500/20 rounded-xl bg-green-500/5">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-green-300 font-semibold">Your story has been submitted</p>
            <p className="text-slate-400 text-sm mt-1">We'll notify you when it's reviewed. Thank you!</p>
          </div>
        ) : (
          <form
            onSubmit={e => { e.preventDefault(); submitMutation.mutate(); }}
            className="space-y-5 cyber-card rounded-xl p-6 border border-purple-500/20"
          >
            <h2 className="text-base font-semibold text-purple-300 mb-1">Submit Your Story</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Your Name *</label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="First Last"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email (optional)</label>
                <input
                  type="email"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="for prize notification"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Story Title *</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. How C.A.R.E.N. kept me calm during a traffic stop"
                required
                maxLength={120}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Your Story * <span className="text-slate-500">({form.story.length}/2000)</span></label>
              <textarea
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none resize-none"
                rows={7}
                value={form.story}
                onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
                placeholder="Tell us what happened and how C.A.R.E.N. helped you..."
                required
                minLength={50}
                maxLength={2000}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Video Link (optional)</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                value={form.videoUrl}
                onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                placeholder="YouTube or other video URL"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 accent-purple-500"
                checked={form.consentGiven}
                onChange={e => setForm(f => ({ ...f, consentGiven: e.target.checked }))}
                required
              />
              <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                I consent to C.A.R.E.N. sharing my story (name + text) publicly on the website, social media, and marketing materials. I understand I can request removal at any time.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitMutation.isPending || !form.consentGiven}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? "Submitting…" : "Submit My Story"}
            </button>
          </form>
        )}

        {/* How it works */}
        <div className="mt-8 p-5 rounded-xl border border-white/10 bg-white/5">
          <h3 className="text-sm font-semibold text-white mb-3">How Story Spotlight Works</h3>
          <ol className="space-y-2 text-xs text-slate-400">
            <li className="flex gap-2"><span className="text-purple-400 font-bold">1.</span> Submit your real-life C.A.R.E.N. story using the form above.</li>
            <li className="flex gap-2"><span className="text-purple-400 font-bold">2.</span> Our team reviews all submissions for authenticity and community guidelines.</li>
            <li className="flex gap-2"><span className="text-purple-400 font-bold">3.</span> Each month, one story is selected and featured on the C.A.R.E.N. website.</li>
            <li className="flex gap-2"><span className="text-purple-400 font-bold">4.</span> The featured author receives <strong className="text-white">1 free month of premium</strong> — automatically applied to their account.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
