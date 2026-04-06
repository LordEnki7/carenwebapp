import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircleHeart, AlertTriangle, CheckCircle2, Clock, Search,
  Users, TrendingUp, ShieldAlert, RefreshCw, DollarSign, BarChart3,
  ChevronDown, ChevronUp, Brain, CreditCard, Zap, ArrowUpRight,
  Flag, Activity, Target, Scale, Plus, ExternalLink, Star, MapPin,
  Phone, Mail, Globe, Edit3, Trash2, Check, X,
} from "lucide-react";
import type { SupportTicket, RefundRequest, PaymentIntelligenceReport } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  escalated: "bg-red-500/20 text-red-400 border-red-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  reviewed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  processed: "bg-green-500/20 text-green-400 border-green-500/30",
  active: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  actioned: "bg-green-500/20 text-green-400 border-green-500/30",
  dismissed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const DECISION_COLORS: Record<string, string> = {
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  denied: "bg-red-500/20 text-red-400 border-red-500/30",
  partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  escalated: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  pending: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const RISK_COLORS: Record<string, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const SEVERITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "L1 Minor", color: "text-gray-400" },
  2: { label: "L2 Repeated", color: "text-yellow-400" },
  3: { label: "L3 Serious", color: "text-orange-400" },
  4: { label: "L4 Urgent", color: "text-red-400" },
};

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Support Tickets Tab ───────────────────────────────────────────────────────
function SupportTicketsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEscalated, setFilterEscalated] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: tickets = [], isLoading, refetch } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
  });

  const updateStatus = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      apiRequest("PATCH", `/api/support/tickets/${ticketId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      toast({ title: "Status updated" });
    },
  });

  const filtered = tickets.filter((t) => {
    const matchSearch =
      !search ||
      t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      (t.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.issueCategory || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.conversationSummary || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchEscalated =
      filterEscalated === "all" ||
      (filterEscalated === "escalated" && t.escalated) ||
      (filterEscalated === "not_escalated" && !t.escalated);
    return matchSearch && matchStatus && matchEscalated;
  });

  const escalatedCount = tickets.filter((t) => t.escalated).length;
  const openCount = tickets.filter((t) => t.status === "open" || t.status === "escalated").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircleHeart className="w-5 h-5 text-violet-400" />
            Support Tickets
          </h2>
          <p className="text-gray-400 text-sm mt-1">Customer support interactions and escalations</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-600 text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", value: tickets.length, icon: Users, color: "text-blue-400" },
          { label: "Open / Escalated", value: openCount, icon: Clock, color: "text-yellow-400" },
          { label: "Escalations", value: escalatedCount, icon: AlertTriangle, color: "text-red-400" },
          { label: "Resolved", value: resolvedCount, icon: CheckCircle2, color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by ticket ID, email, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-600 text-white"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEscalated} onValueChange={setFilterEscalated}>
          <SelectTrigger className="w-44 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="escalated">Escalated Only</SelectItem>
            <SelectItem value="not_escalated">Not Escalated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center text-gray-400">
            <MessageCircleHeart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No tickets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const sev = SEVERITY_LABELS[ticket.severityLevel || 1];
            const isOpen = expanded === ticket.ticketId;
            return (
              <Card
                key={ticket.ticketId}
                className={`bg-gray-900 border-gray-700 transition-all ${ticket.escalated ? "border-l-2 border-l-red-500" : ""}`}
              >
                <CardContent className="p-4">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : ticket.ticketId)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {ticket.escalated && <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      <span className="font-mono text-xs text-gray-400 flex-shrink-0">{ticket.ticketId}</span>
                      <span className="text-sm text-white truncate">{ticket.issueCategory?.replace(/_/g, " ") || "General"}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs border ${STATUS_COLORS[ticket.status || "open"]}`}>
                        {ticket.status?.replace(/_/g, " ") || "open"}
                      </Badge>
                      <span className={`text-xs font-medium ${sev.color}`}>{sev.label}</span>
                      <span className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-3 border-t border-gray-700 pt-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">User Email</span>
                          <p className="text-white mt-0.5">{ticket.userEmail || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">User Name</span>
                          <p className="text-white mt-0.5">{ticket.userName || "Unknown"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Email Sent</span>
                          <p className={`mt-0.5 font-medium ${ticket.emailSent ? "text-green-400" : "text-gray-400"}`}>
                            {ticket.emailSent ? "Yes" : "No"}
                          </p>
                        </div>
                        {ticket.qualityScore && (
                          <div>
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Quality Score</span>
                            <p className="text-white mt-0.5">{ticket.qualityScore}/10</p>
                          </div>
                        )}
                      </div>
                      {ticket.escalationReason && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Escalation Reason</span>
                          <p className="text-orange-300 text-sm mt-0.5">{ticket.escalationReason}</p>
                        </div>
                      )}
                      {ticket.conversationSummary && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Conversation</span>
                          <pre className="mt-1 text-xs text-gray-300 whitespace-pre-wrap bg-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto font-sans">
                            {ticket.conversationSummary}
                          </pre>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">Update status:</span>
                        <Select
                          value={ticket.status || "open"}
                          onValueChange={(val) => updateStatus.mutate({ ticketId: ticket.ticketId, status: val })}
                        >
                          <SelectTrigger className="h-7 w-36 text-xs bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Refund Requests Tab ───────────────────────────────────────────────────────
function RefundRequestsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterDecision, setFilterDecision] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: refunds = [], isLoading, refetch } = useQuery<RefundRequest[]>({
    queryKey: ["/api/refunds"],
  });

  const updateRefund = useMutation({
    mutationFn: ({ refundId, ...data }: { refundId: string; status?: string; decision?: string; adminNotes?: string }) =>
      apiRequest("PATCH", `/api/refunds/${refundId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/refunds"] });
      toast({ title: "Refund updated" });
    },
  });

  const filtered = refunds.filter((r) => {
    const matchSearch =
      !search ||
      r.refundId.toLowerCase().includes(search.toLowerCase()) ||
      (r.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.refundReason || "").toLowerCase().includes(search.toLowerCase());
    const matchDecision = filterDecision === "all" || r.decision === filterDecision;
    return matchSearch && matchDecision;
  });

  const approvedCount = refunds.filter((r) => r.decision === "approved").length;
  const deniedCount = refunds.filter((r) => r.decision === "denied").length;
  const escalatedCount = refunds.filter((r) => r.escalationRequired).length;
  const totalAmount = refunds.reduce((sum, r) => sum + parseFloat(r.amountPaid?.toString() || "0"), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Refund Requests
          </h2>
          <p className="text-gray-400 text-sm mt-1">AI Policy Engine decisions and refund management</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-600 text-gray-300 hover:text-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: refunds.length, icon: CreditCard, color: "text-blue-400" },
          { label: "Approved", value: approvedCount, icon: CheckCircle2, color: "text-green-400" },
          { label: "Denied", value: deniedCount, icon: AlertTriangle, color: "text-red-400" },
          { label: "Escalated", value: escalatedCount, icon: ShieldAlert, color: "text-orange-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by refund ID, email, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-600 text-white"
          />
        </div>
        <Select value={filterDecision} onValueChange={setFilterDecision}>
          <SelectTrigger className="w-44 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all">All Decisions</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-green-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center text-gray-400">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No refund requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((refund) => {
            const isOpen = expanded === refund.refundId;
            return (
              <Card
                key={refund.refundId}
                className={`bg-gray-900 border-gray-700 transition-all ${
                  refund.escalationRequired ? "border-l-2 border-l-orange-500" : 
                  refund.decision === "approved" ? "border-l-2 border-l-green-500" :
                  refund.decision === "denied" ? "border-l-2 border-l-red-500" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : refund.refundId)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {refund.escalationRequired && <Flag className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                      <span className="font-mono text-xs text-gray-400 flex-shrink-0">{refund.refundId}</span>
                      <span className="text-sm text-white truncate">{refund.refundReason?.replace(/_/g, " ") || "Unknown reason"}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-green-400 font-bold text-sm">${parseFloat(refund.amountPaid?.toString() || "0").toFixed(2)}</span>
                      <Badge className={`text-xs border ${DECISION_COLORS[refund.decision || "pending"]}`}>
                        {refund.decision || "pending"}
                      </Badge>
                      <Badge className={`text-xs border ${STATUS_COLORS[refund.status || "pending"]}`}>
                        {refund.status || "pending"}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(refund.createdAt)}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-4 border-t border-gray-700 pt-3">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">User Email</span>
                          <p className="text-white mt-0.5">{refund.userEmail || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Product</span>
                          <p className="text-white mt-0.5">{refund.productPurchased || "Unknown"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Usage Status</span>
                          <p className="text-white mt-0.5">{refund.usageStatus || "Unknown"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Confidence</span>
                          <p className={`mt-0.5 font-medium ${refund.confidenceLevel === "high" ? "text-green-400" : refund.confidenceLevel === "medium" ? "text-yellow-400" : "text-red-400"}`}>
                            {refund.confidenceLevel || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Refund Amount</span>
                          <p className="text-green-400 font-bold mt-0.5">${parseFloat(refund.refundAmount?.toString() || "0").toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Prev. Refunds</span>
                          <p className={`mt-0.5 ${(refund.previousRefundsCount || 0) > 2 ? "text-red-400" : "text-white"}`}>
                            {refund.previousRefundsCount || 0}
                          </p>
                        </div>
                      </div>

                      {refund.decisionReason && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Policy Engine Decision</span>
                          <p className="text-gray-200 text-sm mt-1 bg-gray-800 rounded p-3">{refund.decisionReason}</p>
                        </div>
                      )}

                      {refund.policyRulesApplied && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Rules Applied</span>
                          <p className="text-cyan-400 text-xs mt-0.5">{refund.policyRulesApplied}</p>
                        </div>
                      )}

                      {refund.actionLog && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Action Log</span>
                          <pre className="mt-1 text-xs text-gray-300 whitespace-pre-wrap bg-gray-800 rounded p-3 font-sans">
                            {refund.actionLog}
                          </pre>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Admin Notes</span>
                        <Textarea
                          placeholder="Add internal notes..."
                          value={adminNotes[refund.refundId] ?? (refund.adminNotes || "")}
                          onChange={(e) => setAdminNotes((prev) => ({ ...prev, [refund.refundId]: e.target.value }))}
                          className="mt-1 text-sm bg-gray-800 border-gray-600 text-white min-h-[60px]"
                        />
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <Select
                          value={refund.decision || "pending"}
                          onValueChange={(val) => updateRefund.mutate({ refundId: refund.refundId, decision: val })}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Decision" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approve</SelectItem>
                            <SelectItem value="denied">Deny</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="escalated">Escalate</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={refund.status || "pending"}
                          onValueChange={(val) => updateRefund.mutate({ refundId: refund.refundId, status: val })}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="processed">Processed</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          className="h-8 text-xs bg-violet-600 hover:bg-violet-700"
                          onClick={() =>
                            updateRefund.mutate({
                              refundId: refund.refundId,
                              adminNotes: adminNotes[refund.refundId] ?? refund.adminNotes ?? "",
                            })
                          }
                        >
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Payment Intelligence Tab ──────────────────────────────────────────────────
function PaymentIntelligenceTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAnalyzeForm, setShowAnalyzeForm] = useState(false);
  const [analyzeForm, setAnalyzeForm] = useState({ targetUserEmail: "", targetUserName: "", planType: "", context: "" });

  const { data: reports = [], isLoading, refetch } = useQuery<PaymentIntelligenceReport[]>({
    queryKey: ["/api/payment-intelligence/reports"],
  });

  const analyze = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payment-intelligence/analyze", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-intelligence/reports"] });
      toast({ title: "Analysis complete", description: "New intelligence report generated" });
      setShowAnalyzeForm(false);
      setAnalyzeForm({ targetUserEmail: "", targetUserName: "", planType: "", context: "" });
    },
    onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
  });

  const updateReport = useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: string }) =>
      apiRequest("PATCH", `/api/payment-intelligence/reports/${reportId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-intelligence/reports"] });
      toast({ title: "Report updated" });
    },
  });

  const highRiskCount = reports.filter((r) => r.riskLevel === "high" || r.riskLevel === "critical").length;
  const churnCount = reports.filter((r) => r.churnProbability === "high" || r.churnProbability === "critical").length;
  const fraudCount = reports.filter((r) => r.fraudFlag).length;
  const upsellCount = reports.filter((r) => (r.upsellSignals as any[])?.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            Payment Intelligence
          </h2>
          <p className="text-gray-400 text-sm mt-1">Churn detection, fraud flags, retention, and upsell signals</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setShowAnalyzeForm(!showAnalyzeForm)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            Analyze User
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-600 text-gray-300 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {showAnalyzeForm && (
        <Card className="bg-gray-900 border-cyan-500/30 border">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Run Payment Intelligence Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wide">User Email</label>
                <Input
                  placeholder="user@example.com"
                  value={analyzeForm.targetUserEmail}
                  onChange={(e) => setAnalyzeForm((p) => ({ ...p, targetUserEmail: e.target.value }))}
                  className="mt-1 bg-gray-800 border-gray-600 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wide">User Name</label>
                <Input
                  placeholder="Full name"
                  value={analyzeForm.targetUserName}
                  onChange={(e) => setAnalyzeForm((p) => ({ ...p, targetUserName: e.target.value }))}
                  className="mt-1 bg-gray-800 border-gray-600 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wide">Plan Type</label>
                <Select value={analyzeForm.planType} onValueChange={(v) => setAnalyzeForm((p) => ({ ...p, planType: v }))}>
                  <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white text-sm">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="legal_shield">Legal Shield ($9.99)</SelectItem>
                    <SelectItem value="constitutional_pro">Constitutional Pro ($19.99)</SelectItem>
                    <SelectItem value="family_protection">Family Protection ($29.99)</SelectItem>
                    <SelectItem value="enterprise_fleet">Enterprise Fleet ($49.99)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide">Context / Observations</label>
              <Textarea
                placeholder="e.g., User has submitted 2 support tickets this week, low login frequency, mentioned confusion about features..."
                value={analyzeForm.context}
                onChange={(e) => setAnalyzeForm((p) => ({ ...p, context: e.target.value }))}
                className="mt-1 bg-gray-800 border-gray-600 text-white text-sm min-h-[80px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-cyan-600 hover:bg-cyan-700"
                disabled={analyze.isPending}
                onClick={() => analyze.mutate(analyzeForm)}
              >
                {analyze.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                {analyze.isPending ? "Analyzing..." : "Run Analysis"}
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setShowAnalyzeForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "High Risk Users", value: highRiskCount, icon: AlertTriangle, color: "text-orange-400" },
          { label: "Churn Risk", value: churnCount, icon: Activity, color: "text-red-400" },
          { label: "Fraud Flags", value: fraudCount, icon: Flag, color: "text-red-500" },
          { label: "Upsell Signals", value: upsellCount, icon: ArrowUpRight, color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center text-gray-400">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="mb-3">No intelligence reports yet</p>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => setShowAnalyzeForm(true)}>
              <Zap className="w-4 h-4 mr-2" />
              Run Your First Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isOpen = expanded === report.reportId;
            return (
              <Card
                key={report.reportId}
                className={`bg-gray-900 border-gray-700 transition-all ${
                  report.fraudFlag ? "border-l-2 border-l-red-500" :
                  report.riskLevel === "high" || report.riskLevel === "critical" ? "border-l-2 border-l-orange-500" :
                  (report.upsellSignals as any[])?.length > 0 ? "border-l-2 border-l-green-500" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : report.reportId)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {report.fraudFlag && <Flag className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      <span className="font-mono text-xs text-gray-400 flex-shrink-0">{report.reportId}</span>
                      <span className="text-sm text-white truncate">{report.userEmail || "Unknown user"}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold uppercase ${RISK_COLORS[report.riskLevel || "low"]}`}>
                        {report.riskLevel} risk
                      </span>
                      <span className={`text-xs ${RISK_COLORS[report.churnProbability || "low"]}`}>
                        Churn: {report.churnProbability}
                      </span>
                      <Badge className={`text-xs border ${STATUS_COLORS[report.status || "active"]}`}>
                        {report.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-4 border-t border-gray-700 pt-3">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Plan</span>
                          <p className="text-white mt-0.5">{report.planType?.replace(/_/g, " ") || "Unknown"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Urgency</span>
                          <p className={`mt-0.5 font-medium ${RISK_COLORS[report.urgencyLevel || "low"]}`}>
                            {report.urgencyLevel}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Quality Score</span>
                          <p className="text-white mt-0.5">{report.qualityScore || "—"}/10</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Refund Risk</span>
                          <p className={`mt-0.5 font-medium ${report.refundRiskFlag ? "text-red-400" : "text-green-400"}`}>
                            {report.refundRiskFlag ? "Flagged" : "Clean"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Fraud Flag</span>
                          <p className={`mt-0.5 font-medium ${report.fraudFlag ? "text-red-400" : "text-green-400"}`}>
                            {report.fraudFlag ? "FLAGGED" : "Clean"}
                          </p>
                        </div>
                      </div>

                      {report.keyIssueDetected && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Key Issue Detected</span>
                          <p className="text-orange-300 text-sm mt-1">{report.keyIssueDetected}</p>
                        </div>
                      )}

                      {report.recommendedAction && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Recommended Action</span>
                          <p className="text-cyan-300 text-sm mt-1">{report.recommendedAction}</p>
                        </div>
                      )}

                      {report.expectedImpact && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Expected Impact</span>
                          <p className="text-green-300 text-sm mt-1">{report.expectedImpact}</p>
                        </div>
                      )}

                      {(report.churnSignals as any[])?.length > 0 && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Churn Signals</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(report.churnSignals as string[]).map((s, i) => (
                              <Badge key={i} className="text-xs bg-red-500/10 text-red-400 border-red-500/20">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(report.upsellSignals as any[])?.length > 0 && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Upsell Signals</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(report.upsellSignals as string[]).map((s, i) => (
                              <Badge key={i} className="text-xs bg-green-500/10 text-green-400 border-green-500/20">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(report.retentionActions as any[])?.length > 0 && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Retention Actions</span>
                          <ul className="mt-1 space-y-1">
                            {(report.retentionActions as string[]).map((a, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-cyan-400 mt-0.5">→</span>
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.paymentHealthSummary && (
                        <div>
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Payment Health Summary</span>
                          <p className="text-gray-200 text-sm mt-1 bg-gray-800 rounded p-3">{report.paymentHealthSummary}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">Mark as:</span>
                        <Select
                          value={report.status || "active"}
                          onValueChange={(val) => updateReport.mutate({ reportId: report.reportId, status: val })}
                        >
                          <SelectTrigger className="h-7 w-36 text-xs bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="actioned">Actioned</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Attorney Network Admin Tab ────────────────────────────────────────────────
const APP_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  hold: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};
const OUTREACH_STATUS_COLORS: Record<string, string> = {
  not_contacted: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  responded: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  interested: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  onboarded: "bg-green-500/20 text-green-400 border-green-500/30",
  passed: "bg-gray-600/20 text-gray-500 border-gray-600/30",
};

function AttorneyNetworkTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"applications" | "outreach" | "stats">("applications");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<Record<number, number>>({});
  const [showAddOutreach, setShowAddOutreach] = useState(false);
  const [newOutreach, setNewOutreach] = useState({ firmName: "", state: "", city: "", email: "", phone: "", contactName: "", practiceAreas: [] as string[], source: "manual" });

  const adminHeaders = { "x-admin-key": "CAREN_ADMIN_2025_PRODUCTION" };

  const { data: applications = [], isLoading: appsLoading, refetch: refetchApps } = useQuery<any[]>({
    queryKey: ["/api/attorney-network/applications", filterStatus],
    queryFn: async () => {
      const url = filterStatus === "all" ? "/api/attorney-network/applications" : `/api/attorney-network/applications?status=${filterStatus}`;
      const res = await fetch(url, { headers: adminHeaders });
      return res.json();
    },
  });

  const { data: outreach = [], isLoading: outreachLoading, refetch: refetchOutreach } = useQuery<any[]>({
    queryKey: ["/api/attorney-network/outreach"],
    queryFn: async () => {
      const res = await fetch("/api/attorney-network/outreach", { headers: adminHeaders });
      return res.json();
    },
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/attorney-network/stats"],
    queryFn: async () => {
      const res = await fetch("/api/attorney-network/stats", { headers: adminHeaders });
      return res.json();
    },
  });

  const decideApp = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: string }) =>
      fetch(`/api/attorney-network/applications/${id}/decision`, {
        method: "PATCH",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ decision, adminNotes: notes[id], score: scores[id] }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attorney-network/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attorney-network/stats"] });
      toast({ title: "Decision saved" });
    },
  });

  const rescoreApp = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/attorney-network/applications/${id}/rescore`, {
        method: "POST",
        headers: adminHeaders,
      }).then((r) => r.json()),
    onSuccess: (data) => {
      toast({ title: `Rescored: ${data.score}/100`, description: data.notes });
      refetchApps();
    },
  });

  const updateOutreach = useMutation({
    mutationFn: ({ id, status, notes: n }: { id: number; status: string; notes?: string }) =>
      fetch(`/api/attorney-network/outreach/${id}`, {
        method: "PATCH",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: n, lastContactDate: new Date().toISOString() }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attorney-network/outreach"] });
      toast({ title: "Outreach updated" });
    },
  });

  const addOutreach = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/attorney-network/outreach", {
        method: "POST",
        headers: { ...adminHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attorney-network/outreach"] });
      setShowAddOutreach(false);
      setNewOutreach({ firmName: "", state: "", city: "", email: "", phone: "", contactName: "", practiceAreas: [], source: "manual" });
      toast({ title: "Lead added" });
    },
  });

  const deleteOutreach = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/attorney-network/outreach/${id}`, { method: "DELETE", headers: adminHeaders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attorney-network/outreach"] });
      toast({ title: "Lead removed" });
    },
  });

  const filteredApps = applications.filter((a) => filterStatus === "all" || a.verification_status === filterStatus);

  const scoreColor = (s: number) => s >= 85 ? "text-green-400" : s >= 70 ? "text-yellow-400" : s >= 50 ? "text-orange-400" : "text-red-400";
  const scoreLabel = (s: number) => s >= 85 ? "🔥 Founding Target" : s >= 70 ? "Strong Candidate" : s >= 50 ? "Hold for Later" : "Pass";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" /> Attorney Network Admin
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage applications, approvals, and outreach CRM</p>
        </div>
        <a href="/attorney-apply" target="_blank">
          <Button variant="outline" size="sm" className="border-cyan-500 text-cyan-400 gap-1">
            <ExternalLink className="w-3 h-3" /> Application Form
          </Button>
        </a>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pending Review", value: stats.applications?.pending || 0, color: "text-yellow-400" },
            { label: "Approved", value: stats.applications?.approved || 0, color: "text-green-400" },
            { label: "Network Size", value: stats.network?.total || 0, color: "text-cyan-400" },
            { label: "Outreach Leads", value: stats.outreach?.total || 0, color: "text-purple-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-700">
        {[{ id: "applications", label: "Applications" }, { id: "outreach", label: "Outreach CRM" }, { id: "stats", label: "Network" }].map((t) => (
          <button key={t.id} onClick={() => setSubTab(t.id as any)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${subTab === t.id ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* APPLICATIONS */}
      {subTab === "applications" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected", "hold"].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all capitalize ${filterStatus === s ? "bg-cyan-600 border-cyan-600 text-white" : "border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                {s}
              </button>
            ))}
          </div>

          {appsLoading ? (
            <p className="text-gray-400 text-sm">Loading applications...</p>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No applications yet.</p>
              <p className="text-xs mt-1">Share the application link with attorneys to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app: any) => (
                <div key={app.id} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {(app.first_name?.[0] || "A")}{(app.last_name?.[0] || "")}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{app.first_name} {app.last_name}</p>
                        <p className="text-gray-400 text-xs">{app.firm_name} • {(app.states_licensed || []).join(", ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.score > 0 && (
                        <span className={`text-sm font-bold ${scoreColor(app.score)}`}>{app.score}</span>
                      )}
                      <Badge className={`text-xs ${APP_STATUS_COLORS[app.verification_status] || ""}`}>
                        {app.verification_status}
                      </Badge>
                      {expanded === app.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {expanded === app.id && (
                    <div className="border-t border-gray-700 p-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div><p className="text-gray-500 text-xs">Email</p><p className="text-white">{app.email}</p></div>
                        <div><p className="text-gray-500 text-xs">Phone</p><p className="text-white">{app.phone || "—"}</p></div>
                        <div><p className="text-gray-500 text-xs">Bar Number</p><p className="text-white">{app.bar_number}</p></div>
                        <div><p className="text-gray-500 text-xs">Experience</p><p className="text-white">{app.years_experience ? `${app.years_experience} years` : "—"}</p></div>
                        <div><p className="text-gray-500 text-xs">Consultation</p><p className="text-white capitalize">{app.consultation_type}</p></div>
                        <div><p className="text-gray-500 text-xs">Emergency</p><p className={app.emergency_available ? "text-green-400" : "text-gray-400"}>{app.emergency_available ? "Yes" : "No"}</p></div>
                        <div className="col-span-2 md:col-span-3"><p className="text-gray-500 text-xs">Practice Areas</p><p className="text-white">{(app.practice_areas || []).join(", ")}</p></div>
                        {app.bio && <div className="col-span-2 md:col-span-3"><p className="text-gray-500 text-xs">Bio</p><p className="text-gray-300 text-xs">{app.bio}</p></div>}
                      </div>

                      {app.score > 0 && (
                        <div className="bg-gray-700/40 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-400">AI Score: <span className={`font-bold ${scoreColor(app.score)}`}>{app.score}/100</span></p>
                            <span className="text-xs text-gray-400">{scoreLabel(app.score)}</span>
                          </div>
                          {app.admin_notes && <p className="text-xs text-gray-400">{app.admin_notes}</p>}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-gray-300 text-xs">Admin Notes</Label>
                        <Textarea
                          value={notes[app.id] ?? (app.admin_notes || "")}
                          onChange={(e) => setNotes((n) => ({ ...n, [app.id]: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white text-sm"
                          rows={2}
                          placeholder="Add notes..."
                        />
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => decideApp.mutate({ id: app.id, decision: "approved" })} disabled={decideApp.isPending}>
                          <Check className="w-3 h-3" /> Approve
                        </Button>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 gap-1" onClick={() => decideApp.mutate({ id: app.id, decision: "hold" })} disabled={decideApp.isPending}>
                          Hold
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={() => decideApp.mutate({ id: app.id, decision: "rejected" })} disabled={decideApp.isPending}>
                          <X className="w-3 h-3" /> Reject
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 gap-1" onClick={() => rescoreApp.mutate(app.id)} disabled={rescoreApp.isPending}>
                          <Star className="w-3 h-3" /> {rescoreApp.isPending ? "Scoring..." : "Re-score"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OUTREACH CRM */}
      {subTab === "outreach" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">{outreach.length} leads in CRM</p>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 gap-1" onClick={() => setShowAddOutreach(!showAddOutreach)}>
              <Plus className="w-3 h-3" /> Add Lead
            </Button>
          </div>

          {showAddOutreach && (
            <div className="bg-gray-800/60 border border-cyan-700 rounded-xl p-4 space-y-3">
              <h3 className="text-white text-sm font-semibold">Add Outreach Lead</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-gray-300 text-xs">Firm Name *</Label><Input value={newOutreach.firmName} onChange={(e) => setNewOutreach((p) => ({ ...p, firmName: e.target.value }))} className="bg-gray-700 border-gray-600 text-white mt-1 text-sm" /></div>
                <div><Label className="text-gray-300 text-xs">State *</Label><Input value={newOutreach.state} onChange={(e) => setNewOutreach((p) => ({ ...p, state: e.target.value }))} className="bg-gray-700 border-gray-600 text-white mt-1 text-sm" placeholder="Ohio" /></div>
                <div><Label className="text-gray-300 text-xs">City</Label><Input value={newOutreach.city} onChange={(e) => setNewOutreach((p) => ({ ...p, city: e.target.value }))} className="bg-gray-700 border-gray-600 text-white mt-1 text-sm" /></div>
                <div><Label className="text-gray-300 text-xs">Contact Name</Label><Input value={newOutreach.contactName} onChange={(e) => setNewOutreach((p) => ({ ...p, contactName: e.target.value }))} className="bg-gray-700 border-gray-600 text-white mt-1 text-sm" /></div>
                <div><Label className="text-gray-300 text-xs">Email</Label><Input value={newOutreach.email} onChange={(e) => setNewOutreach((p) => ({ ...p, email: e.target.value }))} className="bg-gray-700 border-gray-600 text-white mt-1 text-sm" /></div>
                <div><Label className="text-gray-300 text-xs">Phone</Label><Input value={newOutreach.phone} onChange={(e) => setNewOutreach((p) => ({ ...p, phone: e.target.value }))} className="bg-gray-700 border-gray-600 text-white mt-1 text-sm" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" disabled={addOutreach.isPending} onClick={() => addOutreach.mutate(newOutreach)}>
                  {addOutreach.isPending ? "Adding..." : "Add Lead"}
                </Button>
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300" onClick={() => setShowAddOutreach(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {outreachLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : outreach.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No outreach leads yet.</p>
              <p className="text-xs mt-1">Add attorney firms you want to recruit.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {outreach.map((lead: any) => (
                <div key={lead.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-white font-semibold text-sm">{lead.firm_name}</p>
                        <Badge className={`text-xs ${OUTREACH_STATUS_COLORS[lead.status] || ""}`}>{lead.status?.replace(/_/g, " ")}</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                        {lead.contact_name && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{lead.contact_name}</span>}
                        {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city ? `${lead.city}, ` : ""}{lead.state}</span>
                      </div>
                      {lead.notes && <p className="text-gray-500 text-xs mt-2">{lead.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Select value={lead.status} onValueChange={(v) => updateOutreach.mutate({ id: lead.id, status: v })}>
                        <SelectTrigger className="w-36 h-7 text-xs bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {["not_contacted", "contacted", "responded", "interested", "onboarded", "passed"].map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-7 w-7 p-0" onClick={() => deleteOutreach.mutate(lead.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NETWORK */}
      {subTab === "stats" && (
        <div className="space-y-4">
          {stats ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Total Attorneys", value: stats.network?.total || 0, color: "text-cyan-400" },
                { label: "Available Now", value: stats.network?.available || 0, color: "text-green-400" },
                { label: "Emergency Ready", value: stats.network?.emergency_ready || 0, color: "text-orange-400" },
                { label: "Verified", value: stats.network?.verified || 0, color: "text-purple-400" },
                { label: "Apps Pending", value: stats.applications?.pending || 0, color: "text-yellow-400" },
                { label: "Apps Approved", value: stats.applications?.approved || 0, color: "text-emerald-400" },
                { label: "Leads Interested", value: stats.outreach?.interested || 0, color: "text-cyan-400" },
                { label: "Leads Onboarded", value: stats.outreach?.onboarded || 0, color: "text-green-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-center">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-gray-400 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Loading network stats...</p>
          )}
          <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-4">
            <p className="text-white text-sm font-semibold mb-3">Attorney Application Link</p>
            <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
              <code className="text-cyan-400 text-xs">https://carenalert.com/attorney-apply</code>
              <a href="/attorney-apply" target="_blank">
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 gap-1 h-7">
                  <ExternalLink className="w-3 h-3" /> Open
                </Button>
              </a>
            </div>
            <p className="text-gray-500 text-xs mt-2">Share this link in outreach emails, LinkedIn, and bar association communications.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function SupportAdmin() {
  const [activeTab, setActiveTab] = useState<"tickets" | "refunds" | "intelligence" | "attorney">("tickets");

  const TABS = [
    { id: "tickets", label: "Support Tickets", icon: MessageCircleHeart, color: "text-violet-400" },
    { id: "refunds", label: "Refund Requests", icon: DollarSign, color: "text-green-400" },
    { id: "intelligence", label: "Payment Intelligence", icon: Brain, color: "text-cyan-400" },
    { id: "attorney", label: "Attorney Network", icon: Scale, color: "text-orange-400" },
  ] as const;

  return (
    <MobileResponsiveLayout>
      <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <TopBar title="Support & Payments Admin" />
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">

            <div>
              <h1 className="text-2xl font-bold text-white">Support & Payments Admin</h1>
              <p className="text-gray-400 text-sm mt-1">Manage support tickets, refund requests, and payment intelligence</p>
            </div>

            <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-700">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-gray-800 text-white shadow"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab === "tickets" && <SupportTicketsTab />}
            {activeTab === "refunds" && <RefundRequestsTab />}
            {activeTab === "intelligence" && <PaymentIntelligenceTab />}
            {activeTab === "attorney" && <AttorneyNetworkTab />}

          </div>
        </main>
      </div>
    </MobileResponsiveLayout>
  );
}
