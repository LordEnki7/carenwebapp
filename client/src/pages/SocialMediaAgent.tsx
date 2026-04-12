import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Video, Calendar, CheckCircle2, Clock, XCircle,
  Copy, Trash2, ExternalLink, RefreshCw, Send, AlertCircle
} from "lucide-react";
import { SiYoutube, SiLinkedin, SiInstagram, SiTiktok, SiX, SiFacebook } from "react-icons/si";

const VIDEOS = [
  { file: "caren-hero.mp4", label: "Meet C.A.R.E.N. — 1:02 Commercial" },
  { file: "caren-short.mp4", label: "One Tap Could Save a Life — 22 sec" },
];

const PLATFORMS = [
  { id: "youtube",   label: "YouTube",   Icon: SiYoutube,   color: "text-red-500",    bg: "bg-red-500/10 border-red-500/30",   connected: false, note: "Needs YouTube Data API key" },
  { id: "linkedin",  label: "LinkedIn",  Icon: SiLinkedin,  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30", connected: false, note: "Needs LinkedIn App credentials" },
  { id: "instagram", label: "Instagram", Icon: SiInstagram, color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/30", connected: false, note: "Needs Meta App review" },
  { id: "tiktok",    label: "TikTok",    Icon: SiTiktok,    color: "text-white",      bg: "bg-white/5 border-white/20",        connected: false, note: "Needs TikTok API whitelist" },
  { id: "twitter",   label: "Twitter/X", Icon: SiX,         color: "text-white",      bg: "bg-white/5 border-white/20",        connected: false, note: "Needs paid API access ($100/mo)" },
  { id: "facebook",  label: "Facebook",  Icon: SiFacebook,  color: "text-blue-500",   bg: "bg-blue-600/10 border-blue-600/30", connected: false, note: "Needs Meta App review" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: "Draft",     color: "bg-gray-500/20 text-gray-300",   icon: Clock },
  scheduled: { label: "Scheduled", color: "bg-yellow-500/20 text-yellow-300", icon: Calendar },
  posted:    { label: "Posted",    color: "bg-green-500/20 text-green-300",  icon: CheckCircle2 },
  failed:    { label: "Failed",    color: "bg-red-500/20 text-red-400",      icon: XCircle },
};

export default function SocialMediaAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedVideo, setSelectedVideo] = useState(VIDEOS[0].file);
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [generatedCaption, setGeneratedCaption] = useState({ title: "", caption: "", hashtags: "" });
  const [scheduledAt, setScheduledAt] = useState("");
  const [markPostedUrl, setMarkPostedUrl] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<"create" | "queue">("create");

  const { data: posts = [], isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/social/posts"],
    queryFn: async () => {
      const res = await fetch("/api/social/posts");
      if (!res.ok) throw new Error("Failed to load posts");
      return res.json();
    },
  });

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
      toast({ title: "Marked as posted!", description: "Great work — keep the momentum going." });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  const platformInfo = PLATFORMS.find(p => p.id === selectedPlatform)!;
  const videoLabel = VIDEOS.find(v => v.file === selectedVideo)?.label;

  const drafted = posts.filter(p => p.status === "draft");
  const scheduled = posts.filter(p => p.status === "scheduled");
  const posted = posts.filter(p => p.status === "posted");

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              Social Media Agent
            </h1>
            <p className="text-gray-400 text-sm mt-1">AI-powered captions · Multi-platform · Daily campaign manager</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeTab === "create" ? "default" : "ghost"}
              onClick={() => setActiveTab("create")}
              className={activeTab === "create" ? "bg-cyan-500 text-black font-bold" : "text-gray-400"}
            >
              Create
            </Button>
            <Button
              size="sm"
              variant={activeTab === "queue" ? "default" : "ghost"}
              onClick={() => setActiveTab("queue")}
              className={activeTab === "queue" ? "bg-cyan-500 text-black font-bold" : "text-gray-400"}
            >
              Queue {posts.length > 0 && <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs">{posts.length}</span>}
            </Button>
          </div>
        </div>

        {/* API Status Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-semibold text-sm">API Keys Needed for Auto-Posting</p>
            <p className="text-yellow-200/70 text-xs mt-1">The agent can generate captions and manage your queue right now. To enable auto-posting, connect each platform's API key in Settings. Until then, use the "Copy & Post" workflow below.</p>
          </div>
        </div>

        {/* ── CREATE TAB ── */}
        {activeTab === "create" && (
          <div className="space-y-5">

            {/* Step 1: Pick Video */}
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

            {/* Step 2: Pick Platform */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-300 text-sm font-bold uppercase tracking-wide">
                  Step 2 — Choose Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        selectedPlatform === p.id
                          ? `${p.bg} border-opacity-100`
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <p.Icon className={`w-4 h-4 ${selectedPlatform === p.id ? p.color : "text-gray-500"}`} />
                      <span className={selectedPlatform === p.id ? "text-white" : ""}>{p.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-yellow-400/70 text-xs mt-3 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {platformInfo.note}
                </p>
              </CardContent>
            </Card>

            {/* Step 3: Generate */}
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
                  {generateMutation.isPending ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate for {platformInfo.label}</>
                  )}
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
                        <button
                          onClick={() => copyToClipboard(generatedCaption.caption, "Caption")}
                          className="absolute top-2 right-2 text-gray-500 hover:text-white"
                        >
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

                    {/* Schedule or save */}
                    <div className="border-t border-white/10 pt-4 space-y-3">
                      <div>
                        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1 block">
                          Schedule Date & Time (optional)
                        </label>
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
                      <p className="text-gray-500 text-xs text-center">
                        After saving, go to your platform, paste the caption, and mark it posted here once done.
                      </p>
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

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Drafts", count: drafted.length, color: "text-gray-300" },
                { label: "Scheduled", count: scheduled.length, color: "text-yellow-300" },
                { label: "Posted", count: posted.length, color: "text-green-300" },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
                  <p className="text-gray-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {postsLoading && (
              <div className="text-center py-10 text-gray-500">Loading queue...</div>
            )}

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
              const platform = PLATFORMS.find(p => p.id === post.platform);

              return (
                <Card key={post.id} className="bg-white/5 border-white/10">
                  <CardContent className="pt-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {platform && <platform.Icon className={`w-4 h-4 ${platform.color}`} />}
                        <span className="text-white font-semibold text-sm capitalize">{post.platform}</span>
                        <span className="text-gray-500 text-xs">· {post.videoFile === "caren-hero.mp4" ? "1:02 Commercial" : "22-sec Clip"}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </div>
                    </div>

                    {/* Title */}
                    {post.title && <p className="text-white font-bold text-sm">{post.title}</p>}

                    {/* Caption preview */}
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{post.caption}</p>

                    {/* Hashtags */}
                    {post.hashtags && (
                      <p className="text-cyan-400/70 text-xs line-clamp-1">{post.hashtags}</p>
                    )}

                    {/* Scheduled time */}
                    {post.scheduledAt && (
                      <p className="text-yellow-400/70 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                      </p>
                    )}

                    {/* Posted URL */}
                    {post.postUrl && (
                      <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> View Post
                      </a>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t border-white/10 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(`${post.title ? post.title + "\n\n" : ""}${post.caption}\n\n${post.hashtags}`, "Full post")}
                        className="text-gray-400 hover:text-white text-xs gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy All
                      </Button>

                      {post.status !== "posted" && (
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
                        className="text-red-400/60 hover:text-red-400 text-xs gap-1"
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

        {/* Platform connection guide */}
        <Card className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-cyan-300 text-sm font-bold">Connect Platforms for Auto-Posting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PLATFORMS.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <p.Icon className={`w-4 h-4 ${p.color}`} />
                  <span className="text-white text-sm font-medium">{p.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">{p.note}</span>
                  <Badge className="bg-gray-700 text-gray-300 text-xs">Setup needed</Badge>
                </div>
              </div>
            ))}
            <p className="text-gray-500 text-xs pt-2">Tell me which platform you want to connect first and I'll walk you through getting the API credentials in 5 minutes.</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
