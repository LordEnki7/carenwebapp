import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ChevronUp,
  MessageSquarePlus,
  BarChart3,
  ThumbsUp,
  CircleDot,
  Bug,
  Lightbulb,
  HelpCircle,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

function getVisitorId(): string {
  let id = localStorage.getItem("feedback_visitor_id");
  if (!id) {
    id = crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("feedback_visitor_id", id);
  }
  return id;
}

function getVotedPosts(): Set<number> {
  try {
    const raw = localStorage.getItem("feedback_voted_posts");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function setVotedPosts(posts: Set<number>) {
  localStorage.setItem("feedback_voted_posts", JSON.stringify(Array.from(posts)));
}

interface FeedbackPost {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  authorName: string | null;
  votes: number;
  createdAt: string;
}

interface FeedbackStats {
  totalRequests: number;
  totalVotes: number;
  openRequests: number;
}

const CATEGORIES = [
  { value: "all", label: "All", icon: Layers },
  { value: "feature_request", label: "Feature Request", icon: Lightbulb },
  { value: "bug_report", label: "Bug Report", icon: Bug },
  { value: "improvement", label: "Improvement", icon: CircleDot },
  { value: "question", label: "Question", icon: HelpCircle },
];

const categoryColors: Record<string, string> = {
  feature_request: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  bug_report: "bg-red-500/20 text-red-300 border-red-500/40",
  improvement: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  question: "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

const categoryLabels: Record<string, string> = {
  feature_request: "Feature Request",
  bug_report: "Bug Report",
  improvement: "Improvement",
  question: "Question",
};

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  open: { label: "Open", className: "bg-green-500/20 text-green-300 border-green-500/40", icon: CircleDot },
  in_progress: { label: "In Progress", className: "bg-blue-500/20 text-blue-300 border-blue-500/40", icon: Clock },
  completed: { label: "Completed", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", icon: CheckCircle2 },
  declined: { label: "Declined", className: "bg-gray-500/20 text-gray-400 border-gray-500/40", icon: XCircle },
};

export default function FeedbackBoard() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [votedPosts, setVotedPostsState] = useState<Set<number>>(getVotedPosts);
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("feature_request");

  const visitorId = getVisitorId();

  const { data: posts = [], isLoading: loadingPosts } = useQuery<FeedbackPost[]>({
    queryKey: ["/api/feedback", activeCategory === "all" ? "" : activeCategory],
    queryFn: async () => {
      const url = activeCategory === "all" ? "/api/feedback" : `/api/feedback?category=${activeCategory}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feedback");
      return res.json();
    },
  });

  const { data: stats } = useQuery<FeedbackStats>({
    queryKey: ["/api/feedback/stats"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; category: string; authorName?: string }) => {
      const res = await apiRequest("POST", "/api/feedback", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/stats"] });
      setDialogOpen(false);
      setFormName("");
      setFormTitle("");
      setFormDescription("");
      setFormCategory("feature_request");
      toast({ title: "Submitted!", description: "Your feedback has been submitted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit feedback. Please try again.", variant: "destructive" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ postId, unvote }: { postId: number; unvote: boolean }) => {
      if (unvote) {
        await apiRequest("DELETE", `/api/feedback/${postId}/vote`, { visitorId });
      } else {
        await apiRequest("POST", `/api/feedback/${postId}/vote`, { visitorId });
      }
    },
    onSuccess: (_, { postId, unvote }) => {
      const newVoted = new Set(votedPosts);
      if (unvote) {
        newVoted.delete(postId);
      } else {
        newVoted.add(postId);
      }
      setVotedPostsState(newVoted);
      setVotedPosts(newVoted);
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update vote.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formTitle.trim() || !formDescription.trim()) {
      toast({ title: "Missing fields", description: "Title and description are required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      authorName: formName.trim() || undefined,
    });
  };

  const handleVote = (postId: number) => {
    const hasVoted = votedPosts.has(postId);
    voteMutation.mutate({ postId, unvote: hasVoted });
  };

  const sortedPosts = [...posts].sort((a, b) => b.votes - a.votes);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <MessageSquarePlus className="h-7 w-7 text-cyan-400" />
              Feature Requests & Feedback
            </h1>
            <p className="text-gray-400 text-sm mt-1">Submit ideas and vote on features you want to see</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl text-white flex items-center gap-2">
                  <MessageSquarePlus className="h-5 w-5 text-cyan-400" />
                  Submit Feedback
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Your Name (optional)</label>
                  <Input
                    placeholder="Anonymous"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Title *</label>
                  <Input
                    placeholder="Brief summary of your idea..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Description *</label>
                  <Textarea
                    placeholder="Describe your idea or feedback in detail..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 min-h-[120px]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Category</label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="bug_report">Bug Report</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white py-3"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.value;
            return (
              <Button
                key={cat.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.value)}
                className={
                  isActive
                    ? "bg-cyan-600/80 text-white border-cyan-500 hover:bg-cyan-500"
                    : "bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700/50 hover:text-white"
                }
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gray-800/40 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-600/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Requests</p>
                <p className="text-xl font-bold text-white">{stats?.totalRequests ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/40 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-cyan-600/30 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Votes</p>
                <p className="text-xl font-bold text-white">{stats?.totalVotes ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/40 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-600/30 rounded-lg">
                <CircleDot className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Open Requests</p>
                <p className="text-xl font-bold text-white">{stats?.openRequests ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-gray-800/40 border-gray-700/50 animate-pulse">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <div className="w-14 h-16 bg-gray-700 rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <div className="w-3/4 h-4 bg-gray-700 rounded" />
                        <div className="w-full h-3 bg-gray-700 rounded" />
                        <div className="w-1/2 h-3 bg-gray-700 rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedPosts.length === 0 ? (
            <Card className="bg-gray-800/40 border-gray-700/50">
              <CardContent className="p-10 text-center">
                <MessageSquarePlus className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">No feedback yet</h3>
                <p className="text-gray-400 text-sm">Be the first to submit a feature request or idea!</p>
              </CardContent>
            </Card>
          ) : (
            sortedPosts.map((post) => {
              const hasVoted = votedPosts.has(post.id);
              const status = statusConfig[post.status] || statusConfig.open;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={post.id}
                  className="bg-gray-800/40 border-gray-700/50 backdrop-blur-sm hover:border-gray-600/60 transition-all"
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex gap-3 md:gap-4">
                      <button
                        onClick={() => handleVote(post.id)}
                        disabled={voteMutation.isPending}
                        className={`flex flex-col items-center justify-center w-14 min-h-[60px] rounded-lg border transition-all shrink-0 ${
                          hasVoted
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/10"
                            : "bg-gray-800/60 border-gray-600 text-gray-400 hover:border-cyan-500/40 hover:text-cyan-400"
                        }`}
                      >
                        <ChevronUp className={`w-5 h-5 ${hasVoted ? "text-cyan-300" : ""}`} />
                        <span className="text-sm font-bold">{post.votes}</span>
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold text-base truncate">{post.title}</h3>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{post.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant="outline" className={categoryColors[post.category] || "text-gray-400"}>
                            {categoryLabels[post.category] || post.category}
                          </Badge>
                          <Badge variant="outline" className={status.className}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          <span className="text-gray-500">
                            {post.authorName || "Anonymous"} · {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}