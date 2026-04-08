import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import {
  Megaphone, Gift, Plus, Trash2, Pin, PinOff, Eye, EyeOff,
  Clock, Users, ArrowLeft, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";

const ADMIN_KEY = "CAREN_ADMIN_2025_PRODUCTION";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  imageUrl: string | null;
  isActive: boolean;
  isPinned: boolean;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "announcement" as "announcement" | "giveaway",
    imageUrl: "",
    isPinned: false,
    expiresAt: "",
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/announcements", {
      title: form.title,
      content: form.content,
      type: form.type,
      imageUrl: form.imageUrl || null,
      isPinned: form.isPinned,
      expiresAt: form.expiresAt || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: "Posted!", description: `${form.type === "giveaway" ? "Giveaway" : "Announcement"} is now live.` });
      setForm({ title: "", content: "", type: "announcement", imageUrl: "", isPinned: false, expiresAt: "" });
      setOpen(false);
      onCreated();
    },
    onError: () => toast({ title: "Error", description: "Failed to post. Please try again.", variant: "destructive" }),
  });

  if (!open) return (
    <Button onClick={() => setOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
      <Plus className="w-4 h-4" /> New Post
    </Button>
  );

  return (
    <Card className="bg-gray-800 border-cyan-500/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Create New Post</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">✕</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, type: "announcement" }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all ${form.type === "announcement" ? "bg-cyan-700 border-cyan-500 text-white" : "bg-gray-700 border-gray-600 text-gray-300 hover:text-white"}`}
          >
            <Megaphone className="w-4 h-4" /> Announcement
          </button>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, type: "giveaway" }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all ${form.type === "giveaway" ? "bg-purple-700 border-purple-500 text-white" : "bg-gray-700 border-gray-600 text-gray-300 hover:text-white"}`}
          >
            <Gift className="w-4 h-4" /> Giveaway
          </button>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Title *</Label>
          <Input
            placeholder={form.type === "giveaway" ? "Win a free year of C.A.R.E.N.!" : "Important update for all members"}
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Content *</Label>
          <Textarea
            placeholder={form.type === "giveaway"
              ? "Describe the giveaway, what members can win, and any rules..."
              : "Share your announcement with the community..."}
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={4}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Image URL <span className="text-gray-500 text-xs">(optional)</span></Label>
          <Input
            placeholder="https://..."
            value={form.imageUrl}
            onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Expires At <span className="text-gray-500 text-xs">(optional — leave blank to stay up indefinitely)</span></Label>
          <Input
            type="datetime-local"
            value={form.expiresAt}
            onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div className="flex items-center gap-3 py-2">
          <Switch
            id="pinned"
            checked={form.isPinned}
            onCheckedChange={v => setForm(f => ({ ...f, isPinned: v }))}
          />
          <Label htmlFor="pinned" className="text-gray-300 cursor-pointer">
            📌 Pin to top <span className="text-gray-500 text-xs ml-1">— pinned posts appear first</span>
          </Label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!form.title.trim() || !form.content.trim() || createMutation.isPending}
            className={`flex-1 text-white ${form.type === "giveaway" ? "bg-purple-600 hover:bg-purple-700" : "bg-cyan-600 hover:bg-cyan-700"}`}
          >
            {createMutation.isPending ? "Posting..." : `Post ${form.type === "giveaway" ? "Giveaway" : "Announcement"}`}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementRow({ item, adminKey }: { item: Announcement; adminKey: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/announcements/${item.id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/announcements/${item.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: "Removed", description: "Post has been deactivated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove.", variant: "destructive" }),
  });

  const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
  const isGiveaway = item.type === "giveaway";

  return (
    <Card className={`border transition-all ${item.isActive && !isExpired ? "bg-gray-800/70 border-gray-700" : "bg-gray-900/50 border-gray-800 opacity-60"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Type icon */}
          <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${isGiveaway ? "bg-purple-700" : "bg-cyan-700"}`}>
            {isGiveaway ? <Gift className="w-4 h-4 text-white" /> : <Megaphone className="w-4 h-4 text-white" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                {item.isPinned && <span className="text-yellow-400 text-xs">📌 Pinned</span>}
                <Badge className={`text-xs ${isGiveaway ? "bg-purple-800 text-purple-200" : "bg-cyan-800 text-cyan-200"}`}>
                  {isGiveaway ? "Giveaway" : "Announcement"}
                </Badge>
                {item.isActive && !isExpired
                  ? <Badge className="bg-green-800 text-green-200 text-xs">Live</Badge>
                  : <Badge className="bg-gray-700 text-gray-400 text-xs">{isExpired ? "Expired" : "Hidden"}</Badge>
                }
              </div>
            </div>
            <h3 className="text-white font-semibold text-sm leading-tight mb-1">{item.title}</h3>
            <p className="text-gray-400 text-xs line-clamp-2 mb-2">{item.content}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
              {item.expiresAt && (
                <span className={`flex items-center gap-1 ${isExpired ? "text-red-400" : "text-orange-400"}`}>
                  · {isExpired ? "Expired" : "Expires"} {format(new Date(item.expiresAt), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              title={item.isActive ? "Hide post" : "Show post"}
              className={`h-8 w-8 p-0 ${item.isActive ? "text-green-400 hover:text-red-400 hover:bg-red-400/10" : "text-gray-500 hover:text-green-400 hover:bg-green-400/10"}`}
            >
              {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(`Remove "${item.title}"?`)) deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              title="Delete post"
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnnouncementsAdmin() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "giveaway">("all");

  const { data: allItems = [], isLoading, refetch } = useQuery<Announcement[]>({
    queryKey: ['/api/admin/announcements'],
    queryFn: async () => {
      const r = await fetch("/api/announcements/all", {
        headers: { "x-admin-key": adminKey },
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
    enabled: authenticated,
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <Card className="bg-gray-800 border-gray-700 w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && adminKey === ADMIN_KEY) setAuthenticated(true);
              }}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <Button
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => {
                if (adminKey === ADMIN_KEY) setAuthenticated(true);
                else toast({ title: "Wrong key", variant: "destructive" });
              }}
            >
              Unlock
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
              onClick={() => setLocation("/community")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Community
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = allItems as Announcement[];
  const filtered = items.filter(i => {
    if (filter === "active") return i.isActive;
    if (filter === "giveaway") return i.type === "giveaway";
    return true;
  });

  const stats = {
    total: items.length,
    live: items.filter(i => i.isActive && (!i.expiresAt || new Date(i.expiresAt) > new Date())).length,
    giveaways: items.filter(i => i.type === "giveaway").length,
    pinned: items.filter(i => i.isPinned && i.isActive).length,
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/community")}
                className="text-gray-400 hover:text-white -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Community
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-white">Announcements Admin</h1>
            <p className="text-gray-400 text-sm">Manage community posts, news, and giveaways</p>
          </div>
          <CreateForm onCreated={() => refetch()} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Posts", value: stats.total, color: "text-white" },
            { label: "Currently Live", value: stats.live, color: "text-green-400" },
            { label: "Giveaways", value: stats.giveaways, color: "text-purple-400" },
            { label: "Pinned", value: stats.pinned, color: "text-yellow-400" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="bg-gray-800/60 border-gray-700">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-gray-400 text-xs mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "active", "giveaway"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? "bg-cyan-700 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            >
              {f === "all" ? "All" : f === "active" ? "Live Only" : "Giveaways"}
            </button>
          ))}
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                <CardContent className="p-4 h-20" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-10 text-center">
              <Megaphone className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No posts yet. Create your first announcement above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <AnnouncementRow key={item.id} item={item} adminKey={adminKey} />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-600">
          Eye icon = show/hide · Trash icon = permanently remove
        </p>
      </div>
    </div>
  );
}
