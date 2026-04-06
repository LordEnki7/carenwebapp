import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircleHeart, AlertTriangle, CheckCircle2, Clock, Search,
  Users, TrendingUp, ShieldAlert, RefreshCw,
} from "lucide-react";
import type { SupportTicket } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  escalated: "bg-red-500/20 text-red-400 border-red-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
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

export default function SupportAdmin() {
  const { user } = useAuth();
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

  // Stats
  const total = tickets.length;
  const escalatedCount = tickets.filter((t) => t.escalated).length;
  const openCount = tickets.filter((t) => t.status === "open" || t.status === "escalated").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  return (
    <MobileResponsiveLayout>
      <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <TopBar title="Support Admin" />
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MessageCircleHeart className="w-6 h-6 text-violet-400" />
                  Support Tickets
                </h1>
                <p className="text-gray-400 text-sm mt-1">Customer support interactions and escalations</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-600 text-gray-300 hover:text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Tickets", value: total, icon: Users, color: "text-blue-400" },
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

            {/* Filters */}
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

            {/* Ticket list */}
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
        </main>
      </div>
    </MobileResponsiveLayout>
  );
}
