import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, Send, CheckCircle2, XCircle, Clock, Trophy,
  RefreshCw, Zap, Instagram, Facebook, BarChart2,
  ThumbsUp, MessageCircle, Share2, AlertCircle, ChevronDown, ChevronUp, Trash2, Linkedin
} from "lucide-react";

const ADMIN_KEY = "CAREN_ADMIN_2025_PRODUCTION";

const VIDEOS = [
  { file: "caren-short.mp4",    label: "One Tap Could Save a Life (22 sec) ← Best for Reels" },
  { file: "caren-hero.mp4",     label: "Meet C.A.R.E.N.™ Alert — Full Commercial (1:02)" },
  { file: "caren-attorney.mp4", label: "Be the First Call — Attorney Outreach" },
];

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  facebook: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  linkedin: "text-sky-400 bg-sky-500/10 border-sky-500/30",
};

const LANE_COLORS: Record<string, string> = {
  primary: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  broad: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
};

const LANE_LABELS: Record<string, string> = {
  primary: "Black Drivers",
  broad: "All Drivers",
};

function adminFetch(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: { "x-admin-key": ADMIN_KEY, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Draft Card ─────────────────────────────────────────────────────────────────
function DraftCard({ post, onApprove, onSkip, onDelete }: {
  post: any;
  onApprove: (id: number, edits?: { hook?: string; caption?: string; hashtags?: string }) => void;
  onSkip: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hook, setHook] = useState(post.hook);
  const [caption, setCaption] = useState(post.caption);
  const [hashtags, setHashtags] = useState(post.hashtags);
  const PlatformIcon = PLATFORM_ICONS[post.platform] || Zap;

  return (
    <Card className="bg-gray-800/60 border-gray-700 hover:border-gray-600 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${PLATFORM_COLORS[post.platform] || ""}`}>
            <PlatformIcon className="w-3 h-3" />
            {post.platform}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full border ${LANE_COLORS[post.audienceLane] || ""}`}>
            {LANE_LABELS[post.audienceLane] || post.audienceLane}
          </span>
          <span className="text-xs text-gray-500 ml-auto">{timeAgo(post.createdAt)}</span>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Hook</label>
              <Textarea value={hook} onChange={e => setHook(e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm min-h-16" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Caption</label>
              <Textarea value={caption} onChange={e => setCaption(e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm min-h-32" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Hashtags</label>
              <Input value={hashtags} onChange={e => setHashtags(e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { onApprove(post.id, { hook, caption, hashtags }); setEditing(false); }} className="bg-green-600 hover:bg-green-700 flex-1">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Save & Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="border-gray-600 text-gray-300">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-white font-semibold text-sm mb-2 leading-snug">{hook}</p>
            <div className={`text-gray-400 text-xs leading-relaxed overflow-hidden transition-all ${expanded ? "" : "line-clamp-3"}`}>
              {caption}
            </div>
            {caption.length > 180 && (
              <button onClick={() => setExpanded(!expanded)} className="text-cyan-400 text-xs mt-1 flex items-center gap-1">
                {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
              </button>
            )}
            <p className="text-gray-600 text-xs mt-2 line-clamp-1">{hashtags}</p>
            <p className="text-gray-600 text-xs mt-1">📹 {post.videoFile}</p>

            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => onApprove(post.id)} className="bg-green-600 hover:bg-green-700 flex-1">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSkip(post.id)} className="border-gray-600 text-gray-400 hover:bg-gray-700">
                Skip
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDelete(post.id)} className="border-red-800/50 text-red-400 hover:bg-red-900/20">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Approved Card ──────────────────────────────────────────────────────────────
const PLATFORM_GRADIENTS: Record<string, string> = {
  instagram: "from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700",
  facebook:  "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
  linkedin:  "from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800",
};

function ApprovedCard({ post, onPublish, publishing, metaReady, linkedinReady }: {
  post: any;
  onPublish: (id: number) => void;
  publishing: boolean;
  metaReady: boolean;
  linkedinReady: boolean;
}) {
  const PlatformIcon = PLATFORM_ICONS[post.platform] || Zap;
  const isLinkedIn = post.platform === "linkedin";
  const canPost = isLinkedIn ? linkedinReady : metaReady;
  const blockerMsg = isLinkedIn
    ? "Add LINKEDIN_ACCESS_TOKEN to Secrets to enable posting"
    : "Add META_PAGE_ACCESS_TOKEN to Secrets to enable posting";
  const gradient = PLATFORM_GRADIENTS[post.platform] || PLATFORM_GRADIENTS.instagram;

  return (
    <Card className="bg-gray-800/60 border-green-700/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${PLATFORM_COLORS[post.platform] || ""}`}>
            <PlatformIcon className="w-3 h-3" />
            {post.platform}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full border ${LANE_COLORS[post.audienceLane] || ""}`}>
            {LANE_LABELS[post.audienceLane] || post.audienceLane}
          </span>
          <Badge className="ml-auto bg-green-700/30 text-green-300 border-green-700/50 text-xs">Approved</Badge>
        </div>
        <p className="text-white font-semibold text-sm mb-1">{post.hook}</p>
        <p className="text-gray-400 text-xs line-clamp-2 mb-3">{post.caption}</p>

        {canPost ? (
          <Button size="sm" onClick={() => onPublish(post.id)} disabled={publishing} className={`w-full bg-gradient-to-r ${gradient}`}>
            {publishing ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Posting…</> : <><Send className="w-3 h-3 mr-1" /> Post to {post.platform}</>}
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 rounded px-3 py-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {blockerMsg}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PromoEngine() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("generate");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "facebook"]);
  const [lanes, setLanes] = useState<string[]>(["primary", "broad"]);
  const [videoFile, setVideoFile] = useState("caren-short.mp4");
  const [generating, setGenerating] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const { data: metaStatus } = useQuery<any>({
    queryKey: ["/api/promo/meta-status"],
    queryFn: () => adminFetch("/api/promo/meta-status").then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/promo/stats"],
    queryFn: () => adminFetch("/api/promo/stats").then(r => r.json()),
    refetchInterval: 15000,
  });

  const { data: drafts = [], isLoading: draftsLoading } = useQuery<any[]>({
    queryKey: ["/api/promo/drafts"],
    queryFn: () => adminFetch("/api/promo/drafts").then(r => r.json()),
  });

  const { data: approved = [] } = useQuery<any[]>({
    queryKey: ["/api/promo/approved"],
    queryFn: () => adminFetch("/api/promo/approved").then(r => r.json()),
  });

  const { data: posted = [] } = useQuery<any[]>({
    queryKey: ["/api/promo/posted"],
    queryFn: () => adminFetch("/api/promo/posted").then(r => r.json()),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, edits }: { id: number; edits?: any }) =>
      adminFetch(`/api/promo/${id}/approve`, { method: "PATCH", body: JSON.stringify(edits || {}) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promo/approved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promo/stats"] });
      toast({ title: "Approved!", description: "Post moved to your publishing queue." });
    },
  });

  const skipMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/promo/${id}/skip`, { method: "PATCH" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promo/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/promo/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promo/stats"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/promo/${id}/sync-metrics`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo/posted"] });
      toast({ title: "Metrics synced!" });
    },
  });

  const handleGenerate = async () => {
    if (platforms.length === 0) { toast({ title: "Select at least one platform", variant: "destructive" }); return; }
    if (lanes.length === 0) { toast({ title: "Select at least one audience", variant: "destructive" }); return; }
    setGenerating(true);
    try {
      const res = await adminFetch("/api/promo/generate", {
        method: "POST",
        body: JSON.stringify({ platforms, lanes, videoFile, count: 8 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["/api/promo/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promo/stats"] });
      toast({ title: `${data.count} posts generated!`, description: "Review them in the queue below." });
      setActiveTab("queue");
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (id: number) => {
    setPublishingId(id);
    try {
      const res = await adminFetch(`/api/promo/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["/api/promo/approved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promo/posted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promo/stats"] });
      toast({ title: "Posted!", description: `Live on ${data.platform}` });
    } catch (e: any) {
      toast({ title: "Post failed", description: e.message, variant: "destructive" });
    } finally {
      setPublishingId(null);
    }
  };

  const togglePlatform = (p: string) => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleLane = (l: string) => setLanes(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const metaReady = !!(metaStatus?.connected && metaStatus?.hasPageId);
  const linkedinReady = !!(metaStatus?.linkedinConnected);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">C.A.R.E.N. Promo Engine</h1>
              <p className="text-gray-400 text-sm">AI-powered content → you approve → Meta auto-posts</p>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
              {metaReady ? (
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/30 px-3 py-1.5 rounded-full border border-green-700/40">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Meta Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-700/40">
                  <AlertCircle className="w-3 h-3" />
                  Meta Pending
                </span>
              )}
              {metaStatus?.linkedinConnected ? (
                <span className="flex items-center gap-1.5 text-xs text-sky-400 bg-sky-900/30 px-3 py-1.5 rounded-full border border-sky-700/40">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  LinkedIn Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/40">
                  <Linkedin className="w-3 h-3" />
                  LinkedIn Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "In Queue", value: stats?.drafts || 0, color: "text-yellow-400" },
            { label: "Approved", value: stats?.approved || 0, color: "text-green-400" },
            { label: "Posted", value: stats?.posted || 0, color: "text-blue-400" },
            { label: "Winners", value: stats?.winners || 0, color: "text-amber-300" },
            { label: "Total Likes", value: stats?.totalLikes || 0, color: "text-pink-400" },
          ].map(s => (
            <Card key={s.label} className="bg-gray-800 border-gray-700">
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 border border-gray-700 mb-6">
            <TabsTrigger value="generate" className="data-[state=active]:bg-purple-600 text-white">
              <Sparkles className="w-4 h-4 mr-2" /> Generate
            </TabsTrigger>
            <TabsTrigger value="queue" className="data-[state=active]:bg-yellow-700 text-white">
              <Clock className="w-4 h-4 mr-2" /> Review Queue
              {drafts.length > 0 && <span className="ml-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">{drafts.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-green-700 text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Approved
              {approved.length > 0 && <span className="ml-2 bg-green-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">{approved.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-blue-700 text-white">
              <BarChart2 className="w-4 h-4 mr-2" /> Live & Performance
            </TabsTrigger>
          </TabsList>

          {/* ── Generate Tab ── */}
          <TabsContent value="generate">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Generate New Content Batch
                </CardTitle>
                <p className="text-gray-400 text-sm">AI writes 8 posts based on your selections — you review before anything goes live.</p>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Platform */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-3 block">Platforms</label>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { id: "instagram", label: "Instagram", Icon: Instagram, color: "border-pink-500/50 text-pink-400 bg-pink-500/10" },
                      { id: "facebook",  label: "Facebook",  Icon: Facebook,  color: "border-blue-500/50 text-blue-400 bg-blue-500/10" },
                      { id: "linkedin",  label: "LinkedIn",  Icon: Linkedin,  color: "border-sky-500/50 text-sky-400 bg-sky-500/10" },
                    ].map(({ id, label, Icon, color }) => (
                      <button
                        key={id}
                        onClick={() => togglePlatform(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                          platforms.includes(id) ? color : "border-gray-700 text-gray-500 bg-gray-800"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                        {platforms.includes(id) && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audience Lane */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-3 block">Audience</label>
                  <div className="flex gap-3">
                    {[
                      { id: "primary", label: "Black Drivers & Families", desc: "Speaks directly to lived experience", color: "border-amber-500/50 text-amber-300 bg-amber-500/10" },
                      { id: "broad",   label: "All Drivers",              desc: "Safety, rights, family protection", color: "border-cyan-500/50 text-cyan-300 bg-cyan-500/10" },
                    ].map(({ id, label, desc, color }) => (
                      <button
                        key={id}
                        onClick={() => toggleLane(id)}
                        className={`flex-1 text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          lanes.includes(id) ? color : "border-gray-700 text-gray-500 bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold">{label}</span>
                          {lanes.includes(id) && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <p className="text-xs opacity-70">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-3 block">Video Clip</label>
                  <div className="space-y-2">
                    {VIDEOS.map(v => (
                      <button
                        key={v.file}
                        onClick={() => setVideoFile(v.file)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all text-sm ${
                          videoFile === v.file
                            ? "border-purple-500/60 bg-purple-500/10 text-purple-300"
                            : "border-gray-700 text-gray-400 bg-gray-800 hover:border-gray-600"
                        }`}
                      >
                        📹 {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 text-base"
                >
                  {generating ? (
                    <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Generating 8 posts with AI…</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" /> Generate Batch</>
                  )}
                </Button>

                {generating && (
                  <p className="text-center text-gray-500 text-sm">This takes about 15–20 seconds. AI is writing platform-specific hooks and captions…</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Review Queue Tab ── */}
          <TabsContent value="queue">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Review Queue</h3>
              <span className="text-sm text-gray-500">{drafts.length} drafts waiting</span>
            </div>

            {draftsLoading ? (
              <div className="text-center py-12 text-gray-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading…</div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Queue is empty</p>
                <p className="text-sm mt-1">Go to Generate to create a new batch</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drafts.map(post => (
                  <DraftCard
                    key={post.id}
                    post={post}
                    onApprove={(id, edits) => approveMutation.mutate({ id, edits })}
                    onSkip={id => skipMutation.mutate(id)}
                    onDelete={id => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Approved Tab ── */}
          <TabsContent value="approved">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Ready to Post</h3>
              {!metaReady && (
                <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-900/20 rounded-lg px-3 py-2 border border-amber-700/30">
                  <AlertCircle className="w-4 h-4" />
                  Add META_PAGE_ACCESS_TOKEN + META_PAGE_ID to Secrets to enable posting
                </div>
              )}
            </div>

            {approved.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nothing approved yet</p>
                <p className="text-sm mt-1">Approve posts from the Review Queue to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approved.map(post => (
                  <ApprovedCard
                    key={post.id}
                    post={post}
                    onPublish={handlePublish}
                    publishing={publishingId === post.id}
                    metaReady={metaReady}
                    linkedinReady={linkedinReady}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Live & Performance Tab ── */}
          <TabsContent value="live">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Live Posts & Performance</h3>
            </div>

            {posted.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No posts live yet</p>
                <p className="text-sm mt-1">Performance data appears here once posts go live</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posted.map(post => {
                  const PlatformIcon = PLATFORM_ICONS[post.platform] || Zap;
                  const total = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
                  return (
                    <Card key={post.id} className={`border ${post.isWinner ? "bg-amber-900/10 border-amber-700/40" : "bg-gray-800 border-gray-700"}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${PLATFORM_COLORS[post.platform] || ""}`}>
                                <PlatformIcon className="w-3 h-3" />
                                {post.platform}
                              </span>
                              {post.isWinner && (
                                <span className="flex items-center gap-1 text-xs text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-1 rounded-full">
                                  <Trophy className="w-3 h-3" /> Winner
                                </span>
                              )}
                              {post.status === "failed" && (
                                <span className="flex items-center gap-1 text-xs text-red-400 bg-red-900/20 border border-red-700/30 px-2 py-1 rounded-full">
                                  <XCircle className="w-3 h-3" /> Failed
                                </span>
                              )}
                              <span className="text-xs text-gray-500 ml-auto">
                                {post.postedAt ? timeAgo(post.postedAt) : "—"}
                              </span>
                            </div>
                            <p className="text-white text-sm font-medium mb-1">{post.hook}</p>
                            {post.postUrl && (
                              <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 underline">
                                View live post →
                              </a>
                            )}
                            {post.errorMessage && (
                              <p className="text-xs text-red-400 mt-1">{post.errorMessage}</p>
                            )}
                          </div>

                          {/* Metrics */}
                          <div className="flex items-center gap-4 text-sm flex-shrink-0">
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-pink-400"><ThumbsUp className="w-3 h-3" /><span className="font-bold">{post.likes ?? "—"}</span></div>
                              <div className="text-xs text-gray-600">Likes</div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-blue-400"><MessageCircle className="w-3 h-3" /><span className="font-bold">{post.comments ?? "—"}</span></div>
                              <div className="text-xs text-gray-600">Comments</div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center gap-1 text-green-400"><Share2 className="w-3 h-3" /><span className="font-bold">{post.shares ?? "—"}</span></div>
                              <div className="text-xs text-gray-600">Shares</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncMutation.mutate(post.id)}
                              disabled={syncMutation.isPending || !metaReady}
                              className="border-gray-600 text-gray-400 hover:bg-gray-700"
                              title="Sync latest metrics from Meta"
                            >
                              <RefreshCw className={`w-3 h-3 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
