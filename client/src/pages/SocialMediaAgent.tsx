import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Video, Calendar, CheckCircle2, Clock, XCircle,
  Copy, Trash2, ExternalLink, RefreshCw, Send, AlertCircle, Zap, Link2
} from "lucide-react";
import { SiYoutube, SiLinkedin, SiInstagram, SiTiktok, SiX, SiFacebook } from "react-icons/si";

const VIDEOS = [
  { file: "caren-hero.mp4", label: "Meet C.A.R.E.N.™ Alert — 1:02 Commercial" },
  { file: "caren-short.mp4", label: "One Tap Could Save a Life — 22 sec" },
  { file: "caren-attorney.mp4", label: "Be the First Call — Attorney Network Outreach" },
];

const PLATFORM_META = [
  { id: "youtube",   label: "YouTube",   Icon: SiYoutube,   color: "text-red-500",  bg: "bg-red-500/10 border-red-500/30",    note: "Needs YouTube Data API key" },
  { id: "linkedin",  label: "LinkedIn",  Icon: SiLinkedin,  color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30",  note: "Add LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN to Secrets" },
  { id: "instagram", label: "Instagram", Icon: SiInstagram, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30",  note: "Needs Meta App review" },
  { id: "tiktok",    label: "TikTok",    Icon: SiTiktok,    color: "text-white",    bg: "bg-white/5 border-white/20",         note: "Needs TikTok API whitelist" },
  { id: "twitter",   label: "Twitter/X", Icon: SiX,         color: "text-white",    bg: "bg-white/5 border-white/20",         note: "Add TWITTER_API_KEY + 3 other secrets" },
  { id: "facebook",  label: "Facebook",  Icon: SiFacebook,  color: "text-blue-500", bg: "bg-blue-600/10 border-blue-600/30", note: "Needs Meta App review" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: "Draft",     color: "bg-gray-500/20 text-gray-300",    icon: Clock },
  scheduled: { label: "Scheduled", color: "bg-yellow-500/20 text-yellow-300", icon: Calendar },
  posted:    { label: "Posted",    color: "bg-green-500/20 text-green-300",   icon: CheckCircle2 },
  failed:    { label: "Failed",    color: "bg-red-500/20 text-red-400",       icon: XCircle },
};

const LINKEDIN_SETUP_STEPS = [
  { step: "1", text: 'Go to linkedin.com/developers → "Create App" → fill in app name & LinkedIn page' },
  { step: "2", text: 'Under "Auth" tab, add OAuth 2.0 scopes: w_member_social (personal) or w_organization_social (company page)' },
  { step: "3", text: 'Use the Token Generator tool in your app to generate a 60-day access token' },
  { step: "4", text: 'Get your Author URN: for personal use urn:li:person:{yourId} — find your ID at linkedin.com/in/me' },
  { step: "5", text: 'Add both values to Replit Secrets: LINKEDIN_ACCESS_TOKEN and LINKEDIN_AUTHOR_URN — then restart the app' },
];

export default function SocialMediaAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedVideo, setSelectedVideo] = useState(VIDEOS[0].file);
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
  const [generatedCaption, setGeneratedCaption] = useState({ title: "", caption: "", hashtags: "" });
  const [scheduledAt, setScheduledAt] = useState("");
  const [markPostedUrl, setMarkPostedUrl] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<"create" | "queue" | "connect">("create");

  const { data: linkedInStatus } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/social/linkedin/status"],
    queryFn: async () => { const res = await fetch("/api/social/linkedin/status"); return res.json(); },
    refetchInterval: 30000,
  });
  const { data: twitterStatus } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/social/twitter/status"],
    queryFn: async () => { const res = await fetch("/api/social/twitter/status"); return res.json(); },
    refetchInterval: 30000,
  });
  const { data: facebookStatus } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/social/facebook/status"],
    queryFn: async () => { const res = await fetch("/api/social/facebook/status"); return res.json(); },
    refetchInterval: 30000,
  });
  const { data: instagramStatus } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/social/instagram/status"],
    queryFn: async () => { const res = await fetch("/api/social/instagram/status"); return res.json(); },
    refetchInterval: 30000,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/social/posts"],
    queryFn: async () => {
      const res = await fetch("/api/social/posts");
      if (!res.ok) throw new Error("Failed to load posts");
      return res.json();
    },
  });

  const platformConnected: Record<string, boolean> = {
    linkedin:  linkedInStatus?.connected  ?? false,
    twitter:   twitterStatus?.connected   ?? false,
    facebook:  facebookStatus?.connected  ?? false,
    instagram: instagramStatus?.connected ?? false,
    youtube:   false,
    tiktok:    false,
  };

  const linkedInConnected = platformConnected.linkedin;

  const platforms = PLATFORM_META.map(p => ({ ...p, connected: platformConnected[p.id] ?? false }));

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: selectedPlatform, videoFile: selectedVideo }),
      });
      if (!res.ok) throw new Error("Generation failed");
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedCaption({ title: data.title || "", caption: data.caption || "", hashtags: data.hashtags || "" });
      toast({ title: "Caption generated!", description: "Review and edit before saving." });
    },
    onError: () => toast({ title: "Generation failed", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "scheduled") => {
      const res = await fetch("/api/social/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatform,
          videoFile: selectedVideo,
          title: generatedCaption.title,
          caption: generatedCaption.caption,
          hashtags: generatedCaption.hashtags,
          scheduledAt: status === "scheduled" && scheduledAt ? scheduledAt : null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({ title: status === "scheduled" ? "Post scheduled!" : "Saved to drafts" });
      setGeneratedCaption({ title: "", caption: "", hashtags: "" });
      setScheduledAt("");
      setActiveTab("queue");
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/social/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({ title: "Post removed" });
    },
  });

  const markPostedMutation = useMutation({
    mutationFn: async ({ id, postUrl }: { id: number; postUrl: string }) => {
      const res = await fetch(`/api/social/posts/${id}/mark-posted`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({ title: "Marked as posted!" });
    },
  });

  const makePostMutation = (platform: string) => ({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/social/${platform}/post/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${platform} post failed`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({ title: `Posted to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`, description: "Your post is now live." });
    },
    onError: (err: any) => {
      toast({ title: `${platform} post failed`, description: err.message, variant: "destructive" });
    },
  });

  const linkedInPostMutation  = useMutation(makePostMutation("linkedin"));
  const twitterPostMutation   = useMutation(makePostMutation("twitter"));
  const facebookPostMutation  = useMutation(makePostMutation("facebook"));
  const instagramPostMutation = useMutation(makePostMutation("instagram"));

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  const getVideoLabel = (file: string) => VIDEOS.find(v => v.file === file)?.label || file;

  const platformInfo = platforms.find(p => p.id === selectedPlatform)!;
  const drafted   = posts.filter(p => p.status === "draft");
  const scheduled = posts.filter(p => p.status === "scheduled");
  const posted    = posts.filter(p => p.status === "posted");

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              Social Media Agent
            </h1>
            <p className="text-gray-400 text-sm mt-1">AI-powered captions · Multi-platform · Daily campaign manager</p>
          </div>
          <div className="flex gap-2">
            {(["create", "queue", "connect"] as const).map(tab => (
              <Button
                key={tab}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? "bg-cyan-500 text-black font-bold" : "bg-white/5 text-gray-400 hover:text-white"}
              >
                {tab === "queue"
                  ? <>Queue {posts.length > 0 && <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs">{posts.length}</span>}</>
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* LinkedIn connection status banner */}
        {linkedInConnected ? (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3">
            <SiLinkedin className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-300 font-semibold text-sm">LinkedIn Connected</p>
              <p className="text-blue-200/70 text-xs mt-0.5">Auto-posting is live. Select a LinkedIn post in the queue and hit "Post Now".</p>
            </div>
            <Badge className="bg-green-500/20 text-green-300 text-xs">Live</Badge>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-300 font-semibold text-sm">LinkedIn Not Connected</p>
              <p className="text-yellow-200/70 text-xs mt-1">Captions generate and queue works now. To enable one-click LinkedIn posting, go to the Connect tab for setup steps.</p>
            </div>
            <Button size="sm" onClick={() => setActiveTab("connect")} className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs flex-shrink-0">
              Connect
            </Button>
          </div>
        )}

        {/* ── CREATE TAB ── */}
        {activeTab === "create" && (
          <div className="space-y-5">

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-300 text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                  <Video className="w-4 h-4" /> Step 1 — Choose Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {VIDEOS.map(v => (
                  <button
                    key={v.file}
                    onClick={() => setSelectedVideo(v.file)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      selectedVideo === v.file
                        ? "bg-cyan-500/20 border-cyan-500 text-white"
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="font-medium text-sm">{v.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-300 text-sm font-bold uppercase tracking-wide">
                  Step 2 — Choose Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {platforms.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id)}
                      className={`relative flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        selectedPlatform === p.id ? `${p.bg}` : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <p.Icon className={`w-4 h-4 ${selectedPlatform === p.id ? p.color : "text-gray-500"}`} />
                      <span className={selectedPlatform === p.id ? "text-white" : ""}>{p.label}</span>
                      {p.connected && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400" />
                      )}
                    </button>
                  ))}
                </div>
                <p className={`text-xs mt-3 flex items-center gap-1 ${platformInfo.connected ? "text-green-400/80" : "text-yellow-400/70"}`}>
                  {platformInfo.connected
                    ? <><CheckCircle2 className="w-3 h-3" /> Connected — auto-posting enabled</>
                    : <><AlertCircle className="w-3 h-3" /> {platformInfo.note}</>
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-300 text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Step 3 — Generate Caption with AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold"
                >
                  {generateMutation.isPending
                    ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    : <><Sparkles className="w-4 h-4 mr-2" /> Generate for {platformInfo.label}</>
                  }
                </Button>

                {generatedCaption.caption && (
                  <div className="space-y-3">
                    {generatedCaption.title && (
                      <div>
                        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1 block">Title</label>
                        <div className="flex gap-2">
                          <Input
                            value={generatedCaption.title}
                            onChange={e => setGeneratedCaption(prev => ({ ...prev, title: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white text-sm"
                          />
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generatedCaption.title, "Title")} className="text-gray-400 hover:text-white flex-shrink-0">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1 block">Caption</label>
                      <div className="relative">
                        <Textarea
                          value={generatedCaption.caption}
                          onChange={e => setGeneratedCaption(prev => ({ ...prev, caption: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white text-sm min-h-[140px] pr-10"
                        />
                        <button onClick={() => copyToClipboard(generatedCaption.caption, "Caption")} className="absolute top-2 right-2 text-gray-500 hover:text-white">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1 block">Hashtags</label>
                      <div className="flex gap-2">
                        <Textarea
                          value={generatedCaption.hashtags}
                          onChange={e => setGeneratedCaption(prev => ({ ...prev, hashtags: e.target.value }))}
                          className="bg-white/5 border-white/10 text-cyan-300 text-sm min-h-[60px]"
                        />
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generatedCaption.hashtags, "Hashtags")} className="text-gray-400 hover:text-white flex-shrink-0">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-3">
                      <div>
                        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1 block">Schedule (optional)</label>
                        <Input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={e => setScheduledAt(e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveMutation.mutate("draft")}
                          disabled={saveMutation.isPending}
                          variant="outline"
                          className="flex-1 border-white/20 text-gray-300 hover:text-white"
                        >
                          Save Draft
                        </Button>
                        <Button
                          onClick={() => saveMutation.mutate("scheduled")}
                          disabled={saveMutation.isPending || !scheduledAt}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                        >
                          <Calendar className="w-4 h-4 mr-1" /> Schedule
                        </Button>
                      </div>
                      {selectedPlatform === "linkedin" && linkedInConnected && (
                        <p className="text-green-400/70 text-xs text-center flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3" /> LinkedIn is connected — save to queue then hit "Post Now" in one tap
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── QUEUE TAB ── */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Drafts",    count: drafted.length,   color: "text-gray-300" },
                { label: "Scheduled", count: scheduled.length, color: "text-yellow-300" },
                { label: "Posted",    count: posted.length,    color: "text-green-300" },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
                  <p className="text-gray-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {postsLoading && <div className="text-center py-10 text-gray-500">Loading queue...</div>}

            {!postsLoading && posts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                <p className="font-medium">No posts yet</p>
                <p className="text-sm">Generate your first caption to get started</p>
                <Button onClick={() => setActiveTab("create")} className="mt-4 bg-cyan-500 text-black font-bold">
                  Create First Post
                </Button>
              </div>
            )}

            {posts.map((post: any) => {
              const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
              const StatusIcon = statusCfg.icon;
              const pMeta = platforms.find(p => p.id === post.platform);
              const notYetPosted = post.status !== "posted";
              const canAutoPost = notYetPosted && !!platformConnected[post.platform];
              const postMutationMap: Record<string, any> = {
                linkedin:  linkedInPostMutation,
                twitter:   twitterPostMutation,
                facebook:  facebookPostMutation,
                instagram: instagramPostMutation,
              };
              const activeMutation = postMutationMap[post.platform];

              return (
                <Card key={post.id} className="bg-white/5 border-white/10">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {pMeta && <pMeta.Icon className={`w-4 h-4 ${pMeta.color}`} />}
                        <span className="text-white font-semibold text-sm capitalize">{post.platform}</span>
                        <span className="text-gray-500 text-xs">· {getVideoLabel(post.videoFile)}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </div>
                    </div>

                    {post.title && <p className="text-white font-bold text-sm">{post.title}</p>}
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{post.caption}</p>
                    {post.hashtags && <p className="text-cyan-400/70 text-xs line-clamp-1">{post.hashtags}</p>}

                    {post.scheduledAt && (
                      <p className="text-yellow-400/70 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                      </p>
                    )}

                    {post.postUrl && (
                      <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> View Post
                      </a>
                    )}

                    <div className="flex gap-2 pt-1 border-t border-white/10 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(
                          `${post.title ? post.title + "\n\n" : ""}${post.caption}\n\n${post.hashtags}`,
                          "Full post"
                        )}
                        className="text-gray-400 hover:text-white text-xs gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </Button>

                      {/* One-click post button — shown when platform is connected */}
                      {canAutoPost && activeMutation && (
                        <Button
                          size="sm"
                          onClick={() => activeMutation.mutate(post.id)}
                          disabled={activeMutation.isPending}
                          className={`text-xs h-7 gap-1 border ${pMeta?.bg || "bg-white/5 border-white/10"}`}
                        >
                          {activeMutation.isPending
                            ? <RefreshCw className="w-3 h-3 animate-spin" />
                            : pMeta ? <pMeta.Icon className={`w-3 h-3 ${pMeta.color}`} /> : <Send className="w-3 h-3" />
                          }
                          Post to {pMeta?.label || post.platform} Now
                        </Button>
                      )}

                      {/* Manual mark-posted for unconnected platforms */}
                      {notYetPosted && !canAutoPost && (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            placeholder="Paste post URL after posting..."
                            value={markPostedUrl[post.id] || ""}
                            onChange={e => setMarkPostedUrl(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white text-xs h-7 flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => markPostedMutation.mutate({ id: post.id, postUrl: markPostedUrl[post.id] || "" })}
                            disabled={markPostedMutation.isPending}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs h-7 gap-1 flex-shrink-0"
                          >
                            <Send className="w-3 h-3" /> Mark Posted
                          </Button>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(post.id)}
                        className="text-red-400/60 hover:text-red-400 text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── CONNECT TAB ── */}
        {activeTab === "connect" && (
          <div className="space-y-4">

            {/* LinkedIn card */}
            <Card className={`border ${linkedInConnected ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/10"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-white text-sm font-bold">
                    <SiLinkedin className="w-5 h-5 text-blue-400" /> LinkedIn
                  </span>
                  {linkedInConnected
                    ? <Badge className="bg-green-500/20 text-green-300">Connected</Badge>
                    : <Badge className="bg-gray-700 text-gray-400">Not Connected</Badge>
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {linkedInConnected ? (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-green-300 font-semibold text-sm">LinkedIn Connected</p>
                      <p className="text-green-200/60 text-xs mt-0.5">Go to the Queue tab and hit "Post to LinkedIn Now" on any LinkedIn post.</p>
                    </div>
                    <a href="/api/social/linkedin/auth" className="text-xs text-gray-400 hover:text-white underline">Re-authorize</a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-sm">Click the button below to authorize LinkedIn. You'll be redirected to LinkedIn to approve access, then brought right back.</p>
                    <a href="/api/social/linkedin/auth" className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
                      <SiLinkedin className="w-5 h-5" />
                      Connect LinkedIn Account
                    </a>
                    <p className="text-gray-500 text-xs text-center">You'll need to be logged into LinkedIn in this browser. Access lasts 60 days.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* X / Twitter */}
            <Card className={`border ${platformConnected.twitter ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-white text-sm font-bold"><SiX className="w-4 h-4" /> X / Twitter</span>
                  {platformConnected.twitter ? <Badge className="bg-green-500/20 text-green-300">Connected</Badge> : <Badge className="bg-gray-700 text-gray-400">Not Connected</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {platformConnected.twitter ? (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-300 text-sm">Auto-posting enabled. Go to Queue and hit "Post to X Now".</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm">Add these 4 secrets from your X Developer Portal (developer.twitter.com).</p>
                    {[
                      { key: "TWITTER_API_KEY",             desc: "API Key (Consumer Key)" },
                      { key: "TWITTER_API_SECRET",          desc: "API Key Secret (Consumer Secret)" },
                      { key: "TWITTER_ACCESS_TOKEN",        desc: "Access Token (with write permission)" },
                      { key: "TWITTER_ACCESS_TOKEN_SECRET", desc: "Access Token Secret" },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/10">
                        <div>
                          <p className="text-cyan-300 text-xs font-mono">{s.key}</p>
                          <p className="text-gray-500 text-xs">{s.desc}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(s.key, "Secret name")} className="text-gray-500 hover:text-white text-xs"><Copy className="w-3 h-3" /></Button>
                      </div>
                    ))}
                    <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 text-sm hover:underline">
                      <Link2 className="w-4 h-4" /> Open X Developer Portal
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facebook */}
            <Card className={`border ${platformConnected.facebook ? "bg-blue-600/10 border-blue-600/30" : "bg-white/5 border-white/10"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-white text-sm font-bold"><SiFacebook className="w-5 h-5 text-blue-500" /> Facebook</span>
                  {platformConnected.facebook ? <Badge className="bg-green-500/20 text-green-300">Connected</Badge> : <Badge className="bg-gray-700 text-gray-400">Not Connected</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {platformConnected.facebook ? (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-300 text-sm">Auto-posting enabled. Go to Queue and hit "Post to Facebook Now".</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm">You need a Facebook Page and a Meta App. Get a Page Access Token from Meta Business Suite.</p>
                    {[
                      { key: "FACEBOOK_PAGE_ACCESS_TOKEN", desc: "Long-lived Page Access Token" },
                      { key: "FACEBOOK_PAGE_ID",           desc: "Your CAREN Facebook Page ID" },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/10">
                        <div>
                          <p className="text-cyan-300 text-xs font-mono">{s.key}</p>
                          <p className="text-gray-500 text-xs">{s.desc}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(s.key, "Secret name")} className="text-gray-500 hover:text-white text-xs"><Copy className="w-3 h-3" /></Button>
                      </div>
                    ))}
                    <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 text-sm hover:underline">
                      <Link2 className="w-4 h-4" /> Open Meta Graph API Explorer
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instagram */}
            <Card className={`border ${platformConnected.instagram ? "bg-pink-500/10 border-pink-500/30" : "bg-white/5 border-white/10"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-white text-sm font-bold"><SiInstagram className="w-5 h-5 text-pink-400" /> Instagram</span>
                  {platformConnected.instagram ? <Badge className="bg-green-500/20 text-green-300">Connected</Badge> : <Badge className="bg-gray-700 text-gray-400">Not Connected</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {platformConnected.instagram ? (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-300 text-sm">Auto-posting enabled. Posts your videos as Instagram Reels.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm">Instagram uses the same Page Access Token as Facebook, plus your Instagram Business Account ID.</p>
                    {[
                      { key: "FACEBOOK_PAGE_ACCESS_TOKEN", desc: "Same token as Facebook (shared)" },
                      { key: "INSTAGRAM_ACCOUNT_ID",       desc: "Your Instagram Business Account ID" },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/10">
                        <div>
                          <p className="text-cyan-300 text-xs font-mono">{s.key}</p>
                          <p className="text-gray-500 text-xs">{s.desc}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(s.key, "Secret name")} className="text-gray-500 hover:text-white text-xs"><Copy className="w-3 h-3" /></Button>
                      </div>
                    ))}
                    <p className="text-gray-500 text-xs">Find your Instagram Account ID by calling the Facebook Graph API: GET /me/accounts — look for the Instagram linked to your page.</p>
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
