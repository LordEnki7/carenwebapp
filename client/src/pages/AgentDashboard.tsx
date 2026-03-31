import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users, FileText, Zap, CheckCircle2, Copy, Trash2, RefreshCw,
  TrendingUp, Instagram, Twitter, Facebook, Video, Mail, Loader2,
  BarChart3, ArrowUpRight, Clock, Lock, Brain, Briefcase,
  LineChart, DollarSign, ChevronDown, ChevronUp, Building2, Target, Megaphone,
  GripVertical, Send, Terminal, X, AlertTriangle, Play, Database, Sparkles,
  CheckCheck, XCircle, History, BookOpen, Telescope, Cpu, BarChart2,
  Settings2, ShieldCheck, AlertCircle, ArrowRight, Star, Globe
} from "lucide-react";

interface Lead {
  id: number;
  email: string;
  firstName?: string;
  phone?: string;
  source?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
}

interface AgentContent {
  id: number;
  platform: string;
  contentType: string;
  content: string;
  hashtags?: string;
  status?: string;
  generatedAt?: string;
  postedAt?: string;
}

interface AgentStats {
  leads: { total: number; new: number };
  content: { total: number; ready: number; posted: number };
}

interface AgentDraft {
  platform?: string;
  content: string;
  hashtags?: string;
  title?: string;
}

interface AgentRecommendation {
  id: string;
  priority: number;
  action: string;
  rationale: string;
  assetType: "social_post" | "ops_checklist" | "strategy_doc" | "financial_memo";
  draft: AgentDraft;
  status: "pending" | "approved" | "skipped";
}

interface ExecutiveBriefing {
  role: string;
  title: string;
  situation: string;
  watchOut: string;
  recommendations: AgentRecommendation[];
  generatedAt: string;
  dataSnapshot: { users: number; leads: number; content: number };
}

interface AgentJob {
  id: number;
  businessUnit: string;
  jobType: string;
  status: string;
  triggeredBy?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface AgentProposal {
  id: number;
  jobId?: number;
  title: string;
  summary: string;
  reason?: string;
  priorityScore?: number;
  status: string;
  expectedImpact?: string;
  agentsRequired?: string[];
  assetsNeeded?: string[];
  executionPlan?: { executionType: string; platform?: string; count?: number; [key: string]: any };
  proposalType?: "action" | "opportunity";
  opportunityDetails?: {
    difficulty: "Low" | "Medium" | "High";
    whyItMatters: string;
    estimatedTimeDays: number;
    platformsAffected: string[];
    potentialRevenue: string;
  };
  createdAt: string;
}

interface AgentRun {
  id: number;
  proposalId: number;
  status: string;
  resultSummary?: string;
  outputData?: any;
  actionLog?: string[];
  qualityScore?: number;
  qualityReview?: { strengths: string; weaknesses: string; risks: string };
  resultsReview?: { expectedOutcome: string; actualOutcome: string; businessImpact: string; lessonsLearned: string };
  recommendedNextSteps?: string[];
  durationMs?: number;
  startedAt: string;
  completedAt?: string;
}

interface AgentMemoryEntry {
  id: number;
  businessUnit: string;
  memoryType: string;
  title: string;
  content: string;
  outcome?: string;
  tags?: string[];
  createdAt: string;
}

const PLATFORM_ICONS: Record<string, JSX.Element> = {
  tiktok: <Video className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  instagram: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  twitter: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  facebook: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const AGENT_CONFIGS = [
  {
    id: "daily_scan",
    label: "Daily Scan",
    description: "Full strategic analysis across all business areas",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-cyan-400",
    activeClass: "bg-cyan-500/20 border-cyan-500/50 text-cyan-300",
    inactiveClass: "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600",
  },
  {
    id: "growth_engine",
    label: "Growth Engine",
    description: "User growth, lead conversion, viral content opportunities",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "text-green-400",
    activeClass: "bg-green-500/20 border-green-500/50 text-green-300",
    inactiveClass: "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600",
  },
  {
    id: "revenue_generator",
    label: "Revenue Generator",
    description: "Monetization, pricing, premium features, partnership revenue",
    icon: <DollarSign className="w-4 h-4" />,
    color: "text-yellow-400",
    activeClass: "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
    inactiveClass: "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600",
  },
  {
    id: "system_optimizer",
    label: "System Optimizer",
    description: "Workflow efficiency, automation, friction reduction",
    icon: <Settings2 className="w-4 h-4" />,
    color: "text-blue-400",
    activeClass: "bg-blue-500/20 border-blue-500/50 text-blue-300",
    inactiveClass: "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600",
  },
  {
    id: "opportunity_hunt",
    label: "Opportunity Hunt",
    description: "Investors, partners, distributors, market opportunities",
    icon: <Telescope className="w-4 h-4" />,
    color: "text-violet-400",
    activeClass: "bg-violet-500/20 border-violet-500/50 text-violet-300",
    inactiveClass: "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600",
  },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-cyan-500/20 text-cyan-300",
  contacted: "bg-yellow-500/20 text-yellow-300",
  converted: "bg-green-500/20 text-green-300",
  unsubscribed: "bg-red-500/20 text-red-300",
  ready: "bg-cyan-500/20 text-cyan-300",
  posted: "bg-green-500/20 text-green-300",
  archived: "bg-slate-500/20 text-slate-300",
};

export default function AgentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [generateCount, setGenerateCount] = useState("5");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [executiveBriefings, setExecutiveBriefings] = useState<Record<string, ExecutiveBriefing>>({});
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [recDecisions, setRecDecisions] = useState<Record<string, "approved" | "skipped">>({});
  const [expandedDrafts, setExpandedDrafts] = useState<Record<string, boolean>>({});
  const [approvingRec, setApprovingRec] = useState<string | null>(null);

  // Command Center state
  const [showJobHistory, setShowJobHistory] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [approvingProposalId, setApprovingProposalId] = useState<number | null>(null);
  const [rejectingProposalId, setRejectingProposalId] = useState<number | null>(null);
  const [selectedJobType, setSelectedJobType] = useState("daily_scan");
  const [lastRunResult, setLastRunResult] = useState<AgentRun | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<AgentStats>({
    queryKey: ["/api/agent/stats"],
    enabled: !!user,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: !!user,
  });

  const { data: content = [], isLoading: contentLoading } = useQuery<AgentContent[]>({
    queryKey: ["/api/agent/content", filterPlatform],
    enabled: !!user,
    queryFn: async () => {
      const params = filterPlatform !== "all" ? `?platform=${filterPlatform}` : "";
      const res = await fetch(`/api/agent/content${params}`, { credentials: "include" });
      return res.json();
    },
  });

  // Command Center queries
  const { data: proposals = [], isLoading: proposalsLoading, refetch: refetchProposals } = useQuery<AgentProposal[]>({
    queryKey: ["/api/agents/proposals"],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch("/api/agents/proposals", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<AgentJob[]>({
    queryKey: ["/api/agents/jobs"],
    enabled: !!user && showJobHistory,
    queryFn: async () => {
      const res = await fetch("/api/agents/jobs", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: memoryEntries = [], isLoading: memoryLoading } = useQuery<AgentMemoryEntry[]>({
    queryKey: ["/api/agents/memory"],
    enabled: !!user && showMemory,
    queryFn: async () => {
      const res = await fetch("/api/agents/memory", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const runScanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/jobs", { jobType: selectedJobType });
      if (!res.ok) throw new Error("Scan failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/jobs"] });
      const agentLabel = AGENT_CONFIGS.find(a => a.id === selectedJobType)?.label || "Agent";
      toast({ title: `${agentLabel} scan complete — ${data.proposals?.length || 0} proposals ready for review` });
    },
    onError: (err: any) => {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (proposalId: number) => {
      setApprovingProposalId(proposalId);
      const res = await apiRequest("POST", `/api/agents/proposals/${proposalId}/approve`, {});
      if (!res.ok) throw new Error("Approval failed");
      return res.json();
    },
    onSuccess: (data, proposalId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/memory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/content"] });
      if (data.run) setLastRunResult(data.run as AgentRun);
      setApprovingProposalId(null);
      toast({ title: "Approved & Executed", description: data.run?.resultSummary });
    },
    onError: (err: any) => {
      setApprovingProposalId(null);
      toast({ title: "Approval failed", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (proposalId: number) => {
      setRejectingProposalId(proposalId);
      const res = await apiRequest("POST", `/api/agents/proposals/${proposalId}/reject`, {});
      if (!res.ok) throw new Error("Reject failed");
      return res.json();
    },
    onSuccess: (_, proposalId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/proposals"] });
      setRejectingProposalId(null);
      toast({ title: "Proposal skipped" });
    },
    onError: () => {
      setRejectingProposalId(null);
      toast({ title: "Failed to skip", variant: "destructive" });
    },
  });

  const pendingProposals = proposals.filter(p => p.status === "pending");
  const approvedProposals = proposals.filter(p => p.status === "approved");

  const priorityColor = (score?: number) => {
    if (!score) return "bg-slate-500/20 text-slate-300";
    if (score >= 85) return "bg-red-500/20 text-red-300 border-red-500/40";
    if (score >= 70) return "bg-orange-500/20 text-orange-300 border-orange-500/40";
    if (score >= 50) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
    return "bg-slate-500/20 text-slate-300";
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agent/generate-content", {
        platform: selectedPlatform,
        count: parseInt(generateCount),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/stats"] });
      toast({ title: `Generated ${data.count} posts!`, description: `Ready to post on ${selectedPlatform}` });
    },
    onError: () => {
      toast({ title: "Generation failed", variant: "destructive" });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/agent/content/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/stats"] });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/agent/content/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/stats"] });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/leads/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/stats"] });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/leads/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
  });

  const sendDripMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/agent/drip/lead/${id}`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: data.success ? "Drip sent!" : "All drips sent", description: data.message });
    },
    onError: () => toast({ title: "Send failed", variant: "destructive" }),
  });

  const processDripsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/agent/drip/process`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: `Drips processed`, description: `${data.sent} sent, ${data.skipped} skipped` });
    },
  });

  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Sign In Required</h1>
        <a href="/" className="mt-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-lg transition-colors">
          Sign In
        </a>
      </div>
    );
  }

  const copyToClipboard = (text: string, hashtags?: string) => {
    const full = hashtags ? `${text}\n\n${hashtags}` : text;
    navigator.clipboard.writeText(full);
    toast({ title: "Copied to clipboard!", description: "Ready to paste." });
  };

  const fetchExecutiveBriefing = async (role: string) => {
    setLoadingRole(role);
    setExpandedRole(role);
    try {
      const res = await apiRequest("POST", "/api/agent/executive-briefing", { role });
      const data = await res.json();
      if (data.success) {
        setExecutiveBriefings(prev => ({ ...prev, [role]: data }));
        // Clear any previous decisions for this role's recs
        const clearedDecisions = { ...recDecisions };
        (data.recommendations || []).forEach((r: AgentRecommendation) => {
          delete clearedDecisions[r.id];
        });
        setRecDecisions(clearedDecisions);
      } else {
        toast({ title: "Briefing failed", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Briefing failed", description: "Could not connect to AI", variant: "destructive" });
    } finally {
      setLoadingRole(null);
    }
  };

  const approveRecommendation = async (rec: AgentRecommendation) => {
    setApprovingRec(rec.id);
    try {
      const res = await apiRequest("POST", "/api/agent/approve-recommendation", {
        assetType: rec.assetType,
        draft: rec.draft,
        action: rec.action,
      });
      const data = await res.json();
      setRecDecisions(prev => ({ ...prev, [rec.id]: "approved" }));
      if (data.saved) {
        queryClient.invalidateQueries({ queryKey: ["/api/agent/content"] });
        queryClient.invalidateQueries({ queryKey: ["/api/agent/stats"] });
        toast({ title: "Approved & saved to Content queue!", description: "Find it in the Content Generator tab." });
      } else {
        navigator.clipboard.writeText(rec.draft.content).catch(() => {});
        toast({ title: "Approved!", description: "Content copied to clipboard." });
      }
    } catch {
      toast({ title: "Approval failed", variant: "destructive" });
    } finally {
      setApprovingRec(null);
    }
  };

  const skipRecommendation = (recId: string) => {
    setRecDecisions(prev => ({ ...prev, [recId]: "skipped" }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Agent Dashboard</h1>
              <p className="text-slate-400 text-sm">AI-powered marketing & growth for C.A.R.E.N.™</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-5 h-5 text-cyan-400" />
                <Badge className="bg-cyan-500/20 text-cyan-300 text-xs">
                  {statsLoading ? "..." : `${stats?.leads?.new ?? 0} new`}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-white">
                {statsLoading ? "—" : stats?.leads?.total ?? 0}
              </div>
              <div className="text-slate-400 text-sm mt-1">Total Leads</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <FileText className="w-5 h-5 text-purple-400" />
                <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                  {statsLoading ? "..." : `${stats?.content?.ready ?? 0} ready`}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-white">
                {statsLoading ? "—" : stats?.content?.total ?? 0}
              </div>
              <div className="text-slate-400 text-sm mt-1">Posts Generated</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {statsLoading ? "—" : stats?.content?.posted ?? 0}
              </div>
              <div className="text-slate-400 text-sm mt-1">Posts Published</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {statsLoading ? "—" : (stats?.content?.total ?? 0) > 0
                  ? `${Math.round(((stats?.content?.posted ?? 0) / (stats?.content?.total ?? 1)) * 100)}%`
                  : "0%"}
              </div>
              <div className="text-slate-400 text-sm mt-1">Post Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="command">
          <TabsList className="bg-slate-900 border border-slate-800 mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="command" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <Terminal className="w-4 h-4 mr-2" /> Command Center
              {pendingProposals.length > 0 && (
                <span className="ml-2 bg-cyan-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingProposals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <FileText className="w-4 h-4 mr-2" /> Content Generator
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <Users className="w-4 h-4 mr-2" /> Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <Mail className="w-4 h-4 mr-2" /> Email Campaigns
            </TabsTrigger>
            <TabsTrigger value="executives" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Brain className="w-4 h-4 mr-2" /> Executive Team
            </TabsTrigger>
          </TabsList>

          {/* ===== COMMAND CENTER TAB ===== */}
          <TabsContent value="command">
            {/* Trigger Panel */}
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                    <Terminal className="w-6 h-6 text-cyan-400" />
                    Agent Command Center
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Select an agent, trigger a scan, then review and approve AI proposals — nothing executes until you say so.
                  </p>
                </div>

                {/* Agent Selector */}
                <div className="mb-5">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-3">Select Agent</p>
                  <div className="flex flex-wrap gap-2">
                    {AGENT_CONFIGS.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedJobType(agent.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedJobType === agent.id ? agent.activeClass : agent.inactiveClass
                        }`}
                      >
                        {agent.icon}
                        {agent.label}
                      </button>
                    ))}
                  </div>
                  {/* Selected agent description */}
                  {(() => {
                    const cfg = AGENT_CONFIGS.find(a => a.id === selectedJobType);
                    return cfg ? (
                      <p className={`mt-2 text-xs ${cfg.color}`}>
                        {cfg.icon && <span className="inline-block mr-1">{""}</span>}
                        {cfg.description}
                      </p>
                    ) : null;
                  })()}
                </div>

                <Button
                  onClick={() => runScanMutation.mutate()}
                  disabled={runScanMutation.isPending}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 text-base"
                >
                  {runScanMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      AI is analyzing…
                    </>
                  ) : (
                    <>
                      {AGENT_CONFIGS.find(a => a.id === selectedJobType)?.icon}
                      <span className="ml-2">Run {AGENT_CONFIGS.find(a => a.id === selectedJobType)?.label || "Scan"}</span>
                    </>
                  )}
                </Button>

                {runScanMutation.isPending && (
                  <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-cyan-300 text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {AGENT_CONFIGS.find(a => a.id === selectedJobType)?.label} is analyzing your live business data and generating proposals… This takes about 15–20 seconds.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proposals Queue */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-cyan-400" />
                  Pending Proposals
                  {pendingProposals.length > 0 && (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 ml-1">
                      {pendingProposals.length} awaiting review
                    </Badge>
                  )}
                </h3>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/agents/proposals"] })}
                  className="text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {proposalsLoading ? (
                <div className="text-center py-12 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                  Loading proposals…
                </div>
              ) : pendingProposals.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800 border-dashed">
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 text-base mb-1">No pending proposals</p>
                    <p className="text-slate-500 text-sm">Select an agent above and run a scan to generate proposals for your review.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingProposals.map(proposal => {
                    const isOpportunity = proposal.proposalType === "opportunity";
                    const od = proposal.opportunityDetails;

                    if (isOpportunity) {
                      const difficultyColor = od?.difficulty === "Low"
                        ? "bg-green-500/20 text-green-300 border-green-500/40"
                        : od?.difficulty === "Medium"
                        ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                        : "bg-red-500/20 text-red-300 border-red-500/40";

                      return (
                        <Card key={proposal.id} className="bg-slate-900 border-violet-700/50 hover:border-violet-600/70 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/40 text-xs font-bold uppercase tracking-wide">
                                    <Telescope className="w-3 h-3 mr-1" /> Opportunity Brief
                                  </Badge>
                                  {od?.difficulty && (
                                    <Badge className={`text-xs border ${difficultyColor}`}>
                                      {od.difficulty} Difficulty
                                    </Badge>
                                  )}
                                  <Badge className={`text-xs border ${priorityColor(proposal.priorityScore ?? undefined)}`}>
                                    Priority {proposal.priorityScore ?? 50}
                                  </Badge>
                                </div>
                                <h4 className="text-white font-semibold text-base">{proposal.title}</h4>
                              </div>
                            </div>

                            <p className="text-slate-300 text-sm mb-3">{proposal.summary}</p>

                            {od?.whyItMatters && (
                              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 mb-3">
                                <p className="text-xs text-violet-400 font-medium mb-1 uppercase tracking-wide">Why It Matters</p>
                                <p className="text-slate-300 text-sm">{od.whyItMatters}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 mb-4">
                              {od?.potentialRevenue && (
                                <div className="bg-slate-800/60 rounded-lg p-3">
                                  <p className="text-xs text-slate-400 mb-1">Potential Revenue</p>
                                  <p className="text-green-300 text-sm font-medium">{od.potentialRevenue}</p>
                                </div>
                              )}
                              {od?.estimatedTimeDays && (
                                <div className="bg-slate-800/60 rounded-lg p-3">
                                  <p className="text-xs text-slate-400 mb-1">Est. Time</p>
                                  <p className="text-slate-200 text-sm font-medium">{od.estimatedTimeDays} days</p>
                                </div>
                              )}
                            </div>

                            {od?.platformsAffected && od.platformsAffected.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {od.platformsAffected.map(p => (
                                  <span key={p} className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">{p}</span>
                                ))}
                              </div>
                            )}

                            {lastRunResult?.proposalId === proposal.id ? null : (
                              <div className="flex items-center gap-3">
                                <Button
                                  size="sm"
                                  onClick={() => approveMutation.mutate(proposal.id)}
                                  disabled={approvingProposalId === proposal.id || rejectingProposalId === proposal.id}
                                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                                >
                                  {approvingProposalId === proposal.id ? (
                                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Recording…</>
                                  ) : (
                                    <><Database className="w-4 h-4 mr-1" /> Record & Track</>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectMutation.mutate(proposal.id)}
                                  disabled={approvingProposalId === proposal.id || rejectingProposalId === proposal.id}
                                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                                >
                                  {rejectingProposalId === proposal.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <><XCircle className="w-4 h-4 mr-1" /> Dismiss</>
                                  )}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    }

                    return (
                      <Card key={proposal.id} className="bg-slate-900 border-slate-700 hover:border-slate-600 transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <Badge className={`text-xs border ${priorityColor(proposal.priorityScore ?? undefined)}`}>
                                  Priority {proposal.priorityScore ?? 50}
                                </Badge>
                                {proposal.executionPlan?.executionType && (
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs">
                                    {proposal.executionPlan.executionType.replace(/_/g, " ")}
                                  </Badge>
                                )}
                                {(proposal.agentsRequired || []).map(agent => (
                                  <Badge key={agent} className="bg-slate-700 text-slate-300 text-xs">{agent}</Badge>
                                ))}
                              </div>
                              <h4 className="text-white font-semibold text-base">{proposal.title}</h4>
                            </div>
                          </div>

                          <p className="text-slate-300 text-sm mb-2">{proposal.summary}</p>

                          {proposal.reason && (
                            <div className="bg-slate-800/60 rounded-lg p-3 mb-3">
                              <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wide">Why now</p>
                              <p className="text-slate-300 text-sm">{proposal.reason}</p>
                            </div>
                          )}

                          {proposal.expectedImpact && (
                            <div className="flex items-start gap-2 mb-4">
                              <TrendingUp className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                              <p className="text-green-300 text-sm">{proposal.expectedImpact}</p>
                            </div>
                          )}

                          {lastRunResult?.proposalId === proposal.id ? null : (
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate(proposal.id)}
                                disabled={approvingProposalId === proposal.id || rejectingProposalId === proposal.id}
                                className="bg-green-600 hover:bg-green-500 text-white font-semibold"
                              >
                                {approvingProposalId === proposal.id ? (
                                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Executing…</>
                                ) : (
                                  <><CheckCheck className="w-4 h-4 mr-1" /> Approve & Execute</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectMutation.mutate(proposal.id)}
                                disabled={approvingProposalId === proposal.id || rejectingProposalId === proposal.id}
                                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                              >
                                {rejectingProposalId === proposal.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <><XCircle className="w-4 h-4 mr-1" /> Skip</>
                                )}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Execution Audit Report */}
              {lastRunResult && (
                <div className="mt-4 border border-green-500/30 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-green-500/10 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <p className="text-green-300 font-semibold text-sm">Execution Complete — Audit Report</p>
                      {lastRunResult.durationMs && (
                        <span className="text-green-500/70 text-xs">{(lastRunResult.durationMs / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                    <button onClick={() => setLastRunResult(null)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-900/80 p-5 space-y-5">
                    {/* Summary */}
                    <p className="text-slate-300 text-sm">{lastRunResult.resultSummary}</p>

                    {/* Quality Score */}
                    {lastRunResult.qualityScore !== undefined && (
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 ${
                          lastRunResult.qualityScore >= 8
                            ? "bg-green-500/20 border-green-500/50 text-green-300"
                            : lastRunResult.qualityScore >= 5
                            ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                            : "bg-red-500/20 border-red-500/50 text-red-300"
                        }`}>
                          {lastRunResult.qualityScore}
                        </div>
                        <div>
                          <p className="text-white font-semibold">Quality Score</p>
                          <p className="text-slate-400 text-sm">
                            {lastRunResult.qualityScore >= 8 ? "Excellent execution" : lastRunResult.qualityScore >= 5 ? "Good execution" : "Needs improvement"} — out of 10
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Log */}
                    {lastRunResult.actionLog && lastRunResult.actionLog.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Action Log</p>
                        <div className="space-y-1.5">
                          {lastRunResult.actionLog.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-cyan-400 font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                              <p className="text-slate-300 text-sm">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quality Review */}
                    {lastRunResult.qualityReview && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Quality Review</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {lastRunResult.qualityReview.strengths && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                                <p className="text-green-400 text-xs font-medium uppercase">Strengths</p>
                              </div>
                              <p className="text-slate-300 text-xs leading-relaxed">{lastRunResult.qualityReview.strengths}</p>
                            </div>
                          )}
                          {lastRunResult.qualityReview.weaknesses && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                                <p className="text-yellow-400 text-xs font-medium uppercase">Weaknesses</p>
                              </div>
                              <p className="text-slate-300 text-xs leading-relaxed">{lastRunResult.qualityReview.weaknesses}</p>
                            </div>
                          )}
                          {lastRunResult.qualityReview.risks && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                <p className="text-red-400 text-xs font-medium uppercase">Risks</p>
                              </div>
                              <p className="text-slate-300 text-xs leading-relaxed">{lastRunResult.qualityReview.risks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Results Review */}
                    {lastRunResult.resultsReview && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Results Review</p>
                        <div className="bg-slate-800/60 rounded-lg p-4 space-y-3">
                          {lastRunResult.resultsReview.expectedOutcome && (
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Expected</p>
                              <p className="text-slate-300 text-sm">{lastRunResult.resultsReview.expectedOutcome}</p>
                            </div>
                          )}
                          {lastRunResult.resultsReview.actualOutcome && (
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Actual</p>
                              <p className="text-slate-200 text-sm font-medium">{lastRunResult.resultsReview.actualOutcome}</p>
                            </div>
                          )}
                          {lastRunResult.resultsReview.businessImpact && (
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Business Impact</p>
                              <p className="text-green-300 text-sm">{lastRunResult.resultsReview.businessImpact}</p>
                            </div>
                          )}
                          {lastRunResult.resultsReview.lessonsLearned && (
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Lessons Learned</p>
                              <p className="text-slate-400 text-sm italic">{lastRunResult.resultsReview.lessonsLearned}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recommended Next Steps */}
                    {lastRunResult.recommendedNextSteps && lastRunResult.recommendedNextSteps.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Recommended Next Steps</p>
                        <div className="space-y-1.5">
                          {lastRunResult.recommendedNextSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                              <p className="text-slate-300 text-sm">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Job History (collapsible) */}
            <Card className="bg-slate-900 border-slate-800 mb-4">
              <button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => setShowJobHistory(v => !v)}
              >
                <span className="text-white font-medium flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-400" />
                  Scan History
                </span>
                {showJobHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showJobHistory && (
                <CardContent className="pt-0 pb-4">
                  {jobsLoading ? (
                    <div className="text-center py-6 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                  ) : jobs.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No scans run yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {jobs.map(job => (
                        <div key={job.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                          <div>
                            <span className="text-slate-300 text-sm capitalize">{job.jobType.replace(/_/g, " ")}</span>
                            <span className="text-slate-500 text-xs ml-3">{new Date(job.createdAt).toLocaleString()}</span>
                          </div>
                          <Badge className={`text-xs ${
                            job.status === "awaiting_approval" ? "bg-yellow-500/20 text-yellow-300" :
                            job.status === "completed" ? "bg-green-500/20 text-green-300" :
                            job.status === "running" ? "bg-cyan-500/20 text-cyan-300" :
                            "bg-slate-500/20 text-slate-300"
                          }`}>
                            {job.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Agent Memory (collapsible) */}
            <Card className="bg-slate-900 border-slate-800">
              <button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => setShowMemory(v => !v)}
              >
                <span className="text-white font-medium flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  Agent Memory
                  {memoryEntries.length > 0 && (
                    <Badge className="bg-purple-500/20 text-purple-300 text-xs">{memoryEntries.length} entries</Badge>
                  )}
                </span>
                {showMemory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showMemory && (
                <CardContent className="pt-0 pb-4">
                  {memoryLoading ? (
                    <div className="text-center py-6 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                  ) : memoryEntries.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">Memory builds up as agents complete approved proposals.</p>
                  ) : (
                    <div className="space-y-3">
                      {memoryEntries.map(entry => (
                        <div key={entry.id} className="bg-slate-800/60 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-slate-200 text-sm font-medium">{entry.title}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              {entry.outcome && (
                                <Badge className={`text-xs ${entry.outcome === "success" ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-300"}`}>
                                  {entry.outcome}
                                </Badge>
                              )}
                              <span className="text-slate-500 text-xs">{new Date(entry.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <p className="text-slate-400 text-sm leading-relaxed">{entry.content}</p>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {entry.tags.map(tag => (
                                <span key={tag} className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* ===== CONTENT TAB ===== */}
          <TabsContent value="content">
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Generate Social Media Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Platform</label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">X / Twitter</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">How many</label>
                    <Select value={generateCount} onValueChange={setGenerateCount}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="3">3 posts</SelectItem>
                        <SelectItem value="5">5 posts</SelectItem>
                        <SelectItem value="10">10 posts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" /> Generate</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filter + Content List */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-slate-400 text-sm">Filter:</span>
              {["all", "tiktok", "instagram", "twitter", "facebook"].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPlatform(p)}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition-all ${
                    filterPlatform === p
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {p === "twitter" ? "X/Twitter" : p}
                </button>
              ))}
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/agent/content"] })}
                className="ml-auto text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {contentLoading ? (
              <div className="text-center py-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                Loading content...
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No content yet</p>
                <p className="text-sm">Use the generator above to create your first batch of posts.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {content.map(item => (
                  <Card key={item.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={`text-xs border ${PLATFORM_COLORS[item.platform] ?? "bg-slate-700 text-slate-300"}`}>
                              <span className="mr-1">{PLATFORM_ICONS[item.platform]}</span>
                              {item.platform === "twitter" ? "X/Twitter" : item.platform}
                            </Badge>
                            <Badge className={`text-xs ${STATUS_COLORS[item.status ?? "ready"] ?? ""}`}>
                              {item.status}
                            </Badge>
                            {item.generatedAt && (
                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(item.generatedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                            {item.content}
                          </p>
                          {item.hashtags && (
                            <p className="text-cyan-400 text-xs opacity-70">{item.hashtags}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(item.content, item.hashtags)}
                            className="border-slate-700 text-slate-300 hover:text-white text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                          {item.status !== "posted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateContentMutation.mutate({ id: item.id, status: "posted" })}
                              className="border-green-700 text-green-400 hover:text-green-300 text-xs"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Posted
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteContentMutation.mutate(item.id)}
                            className="border-red-900 text-red-400 hover:text-red-300 text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== LEADS TAB (KANBAN) ===== */}
          <TabsContent value="leads">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Lead Pipeline</h2>
                <p className="text-slate-400 text-sm">Drag leads between columns to update their status.</p>
              </div>
              <Button
                size="sm"
                onClick={() => processDripsMutation.mutate()}
                disabled={processDripsMutation.isPending}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
              >
                {processDripsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Mail className="w-3 h-3 mr-1.5" />}
                Process Due Drips
              </Button>
            </div>
            {leadsLoading ? (
              <div className="text-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No leads yet. Add the lead capture form to your landing page.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { status: "new", label: "New", color: "border-t-cyan-500", headerColor: "text-cyan-400", badgeColor: "bg-cyan-500/20 text-cyan-300" },
                  { status: "contacted", label: "Contacted", color: "border-t-yellow-500", headerColor: "text-yellow-400", badgeColor: "bg-yellow-500/20 text-yellow-300" },
                  { status: "converted", label: "Converted", color: "border-t-green-500", headerColor: "text-green-400", badgeColor: "bg-green-500/20 text-green-300" },
                ].map((col) => {
                  const colLeads = leads.filter(l => (l.status ?? "new") === col.status);
                  return (
                    <div
                      key={col.status}
                      className={`bg-slate-900/60 border border-slate-800 rounded-xl border-t-2 ${col.color} min-h-[300px] p-3 transition-colors ${dragOverColumn === col.status ? "bg-slate-800/60 border-slate-700" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.status); }}
                      onDragLeave={() => setDragOverColumn(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverColumn(null);
                        if (draggedLeadId !== null) {
                          const lead = leads.find(l => l.id === draggedLeadId);
                          if (lead && lead.status !== col.status) {
                            updateLeadMutation.mutate({ id: draggedLeadId, status: col.status });
                          }
                          setDraggedLeadId(null);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-semibold text-sm ${col.headerColor}`}>{col.label}</span>
                        <Badge className={`text-xs ${col.badgeColor}`}>{colLeads.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {colLeads.map(lead => (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={() => setDraggedLeadId(lead.id)}
                            onDragEnd={() => setDraggedLeadId(null)}
                            className={`bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-opacity ${draggedLeadId === lead.id ? "opacity-40" : "opacity-100"}`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <GripVertical className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-white text-xs font-medium truncate">{lead.email}</p>
                                {lead.firstName && <p className="text-slate-400 text-xs">{lead.firstName}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                              <span className="text-slate-500 text-xs">{lead.source?.replace("_", " ") || "landing"}</span>
                              {lead.createdAt && (
                                <span className="text-slate-600 text-xs">· {new Date(lead.createdAt).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => sendDripMutation.mutate(lead.id)}
                                disabled={sendDripMutation.isPending}
                                className="h-6 px-1.5 text-xs text-cyan-400 hover:text-cyan-300"
                                title="Send next drip email"
                              >
                                {sendDripMutation.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteLeadMutation.mutate(lead.id)}
                                className="h-6 px-1.5 text-xs text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {colLeads.length === 0 && (
                          <div className="text-center py-8 text-slate-600 text-xs border-2 border-dashed border-slate-800 rounded-lg">
                            Drop leads here
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== CAMPAIGNS TAB ===== */}
          <TabsContent value="campaigns">
            <div className="grid gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Email Drip Campaigns</h3>
                      <p className="text-slate-400 text-sm">5-step onboarding sequence sent to all new users</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Welcome & Getting Started", day: "Day 0" },
                      { label: "GPS Legal Protection", day: "Day 2" },
                      { label: "Emergency Features", day: "Day 5" },
                      { label: "AI-Powered Protection", day: "Day 8" },
                      { label: "What's Next?", day: "Day 13" },
                    ].map((step, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-slate-200 text-sm">{step.label}</div>
                          <div className="text-slate-500 text-xs">{step.day}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <a
                    href="/email-campaigns"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View full campaign details →
                  </a>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Lead Welcome Email</h3>
                      <p className="text-slate-400 text-sm">Auto-sent when someone submits the landing page form</p>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-300 text-sm mb-2 font-medium">Subject: Welcome to C.A.R.E.N.™ ALERT — You're Protected</p>
                    <p className="text-slate-400 text-sm">Includes: feature overview, app link, all subscription benefits. Sent automatically via SendGrid within seconds of form submission.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== EXECUTIVE TEAM TAB ===== */}
          <TabsContent value="executives">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">AI Executive Team</h2>
              <p className="text-slate-400 text-sm">Each agent analyzes your live data, creates 3 draft assets, and waits for your approval before anything is saved or used.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[
                { role: "cmo", title: "Chief Marketing Officer", abbr: "CMO", description: "Creates draft social posts tailored to your real lead and content metrics", icon: <Megaphone className="w-6 h-6" />, gradient: "from-pink-500 to-rose-600", accent: "border-pink-500/30", badgeColor: "bg-pink-500/20 text-pink-300", assetLabel: "Draft social post" },
                { role: "coo", title: "Chief Operating Officer", abbr: "COO", description: "Creates operational checklists and process docs based on your platform activity", icon: <Building2 className="w-6 h-6" />, gradient: "from-cyan-500 to-blue-600", accent: "border-cyan-500/30", badgeColor: "bg-cyan-500/20 text-cyan-300", assetLabel: "Ops checklist" },
                { role: "cso", title: "Chief Strategy Officer", abbr: "CSO", description: "Creates strategy memos and partnership outreach templates", icon: <Target className="w-6 h-6" />, gradient: "from-purple-500 to-violet-600", accent: "border-purple-500/30", badgeColor: "bg-purple-500/20 text-purple-300", assetLabel: "Strategy doc" },
                { role: "cfo", title: "Chief Financial Officer", abbr: "CFO", description: "Creates financial analysis memos and revenue optimization recommendations", icon: <DollarSign className="w-6 h-6" />, gradient: "from-green-500 to-emerald-600", accent: "border-green-500/30", badgeColor: "bg-green-500/20 text-green-300", assetLabel: "Financial memo" },
              ].map((agent) => {
                const briefing = executiveBriefings[agent.role];
                const isLoading = loadingRole === agent.role;
                const pendingCount = briefing ? briefing.recommendations.filter(r => !recDecisions[r.id]).length : 0;
                const approvedCount = briefing ? briefing.recommendations.filter(r => recDecisions[r.id] === "approved").length : 0;

                return (
                  <Card key={agent.role} className={`bg-slate-900 border ${agent.accent} transition-all duration-200`}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-white shrink-0`}>
                          {agent.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge className={`${agent.badgeColor} text-xs`}>{agent.abbr}</Badge>
                            {briefing && pendingCount > 0 && <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">{pendingCount} pending</Badge>}
                            {briefing && approvedCount > 0 && <Badge className="bg-green-500/20 text-green-300 text-xs">{approvedCount} approved</Badge>}
                          </div>
                          <h3 className="text-white font-semibold text-sm">{agent.title}</h3>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs mb-3 leading-relaxed">{agent.description}</p>
                      {briefing && (
                        <div className="text-slate-500 text-xs flex items-center gap-1 mb-3">
                          <Clock className="w-3 h-3" /> {new Date(briefing.generatedAt).toLocaleTimeString()}
                        </div>
                      )}
                      <Button onClick={() => fetchExecutiveBriefing(agent.role)} disabled={isLoading} size="sm"
                        className={`w-full bg-gradient-to-r ${agent.gradient} hover:opacity-90 text-white border-0 text-sm`}>
                        {isLoading ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Analyzing...</> :
                          briefing ? <><RefreshCw className="w-3 h-3 mr-2" />New Briefing</> :
                          <><Brain className="w-3 h-3 mr-2" />Get Recommendations</>}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Situation summaries */}
            {Object.values(executiveBriefings).some(b => b.situation) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {Object.values(executiveBriefings).filter(b => b.situation).map(b => (
                  <Card key={b.role} className="bg-slate-900/60 border border-slate-800">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">{b.title} — Situation</div>
                      <p className="text-slate-300 text-sm leading-relaxed">{b.situation}</p>
                      {b.watchOut && (
                        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-300 text-xs">
                          ⚠️ {b.watchOut}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Approval Queue */}
            {Object.values(executiveBriefings).some(b => b.recommendations?.length > 0) && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  Approval Queue
                  <Badge className="bg-yellow-500/20 text-yellow-300 ml-2">
                    {Object.values(executiveBriefings).flatMap(b => b.recommendations).filter(r => !recDecisions[r.id]).length} pending
                  </Badge>
                </h3>
                <div className="space-y-4">
                  {Object.values(executiveBriefings).flatMap(b =>
                    b.recommendations.map(r => ({ ...r, agentTitle: b.title, agentRole: b.role }))
                  ).map((rec: AgentRecommendation & { agentTitle: string; agentRole: string }) => {
                    const decision = recDecisions[rec.id];
                    const isDraftOpen = expandedDrafts[rec.id];
                    const isApproving = approvingRec === rec.id;
                    const agentColors: Record<string, string> = { cmo: "border-pink-500/40", coo: "border-cyan-500/40", cso: "border-purple-500/40", cfo: "border-green-500/40" };
                    const agentBadges: Record<string, string> = { cmo: "bg-pink-500/20 text-pink-300", coo: "bg-cyan-500/20 text-cyan-300", cso: "bg-purple-500/20 text-purple-300", cfo: "bg-green-500/20 text-green-300" };

                    return (
                      <Card key={rec.id} className={`border ${agentColors[rec.agentRole] || "border-slate-700"} transition-all duration-200 ${decision === "skipped" ? "opacity-40" : ""} ${decision === "approved" ? "border-green-500/40 bg-green-900/10" : "bg-slate-900"}`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <Badge className={`text-xs ${agentBadges[rec.agentRole]}`}>{rec.agentRole.toUpperCase()}</Badge>
                                <Badge className="bg-slate-700/50 text-slate-400 text-xs">Priority {rec.priority}</Badge>
                                <Badge className={`text-xs ${rec.assetType === "social_post" ? "bg-pink-500/20 text-pink-300" : rec.assetType === "ops_checklist" ? "bg-cyan-500/20 text-cyan-300" : rec.assetType === "strategy_doc" ? "bg-purple-500/20 text-purple-300" : "bg-green-500/20 text-green-300"}`}>
                                  {rec.assetType === "social_post" ? "Social Post" : rec.assetType === "ops_checklist" ? "Ops Checklist" : rec.assetType === "strategy_doc" ? "Strategy Doc" : "Financial Memo"}
                                </Badge>
                                {decision === "approved" && <Badge className="bg-green-500/20 text-green-300 text-xs">✓ Approved</Badge>}
                                {decision === "skipped" && <Badge className="bg-slate-600/30 text-slate-400 text-xs">Skipped</Badge>}
                              </div>
                              <h4 className="text-white font-semibold text-sm mb-1">{rec.action}</h4>
                              <p className="text-slate-400 text-xs leading-relaxed">{rec.rationale}</p>
                            </div>
                          </div>

                          {/* Draft asset preview */}
                          <div className="mb-4">
                            <button
                              onClick={() => setExpandedDrafts(prev => ({ ...prev, [rec.id]: !prev[rec.id] }))}
                              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-2"
                            >
                              {isDraftOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isDraftOpen ? "Hide draft" : "View draft asset"}
                              {rec.draft?.platform && <span className="text-slate-500">({rec.draft.platform})</span>}
                              {rec.draft?.title && <span className="text-slate-500 truncate max-w-[200px]">— {rec.draft.title}</span>}
                            </button>
                            {isDraftOpen && (
                              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                                {rec.draft?.title && <div className="text-slate-300 text-xs font-semibold mb-2">{rec.draft.title}</div>}
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{rec.draft?.content}</p>
                                {rec.draft?.hashtags && (
                                  <p className="text-slate-500 text-xs mt-2">{rec.draft.hashtags}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {!decision && (
                            <div className="flex gap-2">
                              <Button onClick={() => approveRecommendation(rec)} disabled={isApproving} size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white border-0">
                                {isApproving ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Approving...</> :
                                  <><CheckCircle2 className="w-3 h-3 mr-1.5" />Approve{rec.assetType === "social_post" ? " & Save" : " & Copy"}</>}
                              </Button>
                              <Button onClick={() => skipRecommendation(rec.id)} size="sm" variant="outline"
                                className="border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 bg-transparent">
                                Skip
                              </Button>
                            </div>
                          )}
                          {decision === "approved" && (
                            <div className="flex items-center gap-2 text-green-400 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {rec.assetType === "social_post" ? "Saved to Content Generator queue" : "Content copied to clipboard"}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {Object.keys(executiveBriefings).length === 0 && (
              <div className="text-center py-16">
                <Brain className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-slate-400 font-medium mb-2">No briefings yet</h3>
                <p className="text-slate-500 text-sm">Click "Get Recommendations" on any agent above to begin.</p>
              </div>
            )}

            <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-lg flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-300 text-sm font-medium mb-1">How approvals work</p>
                <p className="text-slate-400 text-sm">Each agent creates 3 recommendations with ready-made draft assets. <strong className="text-slate-300">CMO social posts</strong> get saved directly to your Content queue when approved. <strong className="text-slate-300">COO/CSO/CFO docs</strong> are copied to your clipboard. Nothing happens until you approve it.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
