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
  Flag, Activity, Target,
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

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function SupportAdmin() {
  const [activeTab, setActiveTab] = useState<"tickets" | "refunds" | "intelligence">("tickets");

  const TABS = [
    { id: "tickets", label: "Support Tickets", icon: MessageCircleHeart, color: "text-violet-400" },
    { id: "refunds", label: "Refund Requests", icon: DollarSign, color: "text-green-400" },
    { id: "intelligence", label: "Payment Intelligence", icon: Brain, color: "text-cyan-400" },
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

          </div>
        </main>
      </div>
    </MobileResponsiveLayout>
  );
}
