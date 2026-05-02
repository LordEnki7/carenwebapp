import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Scale, LayoutDashboard, User, Clock, Map, MessageCircle,
  TrendingUp, Settings, Bell, CheckCircle, AlertCircle,
  Phone, Mail, Eye, Star, Zap, Shield, Video, PhoneIncoming,
  PhoneOff, PhoneMissed, History, X
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available Now", color: "bg-green-500", desc: "Accepting new matters" },
  { value: "busy", label: "Busy", color: "bg-yellow-500", desc: "Limited availability" },
  { value: "emergency_only", label: "Emergency Only", color: "bg-orange-500", desc: "Urgent matters only" },
  { value: "offline", label: "Offline", color: "bg-gray-500", desc: "Not accepting requests" },
];

export default function AttorneyPortal() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [callElapsed, setCallElapsed] = useState(0);

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/attorney-network/my-profile"],
    enabled: isAuthenticated,
  });

  const { data: incomingCalls = [] } = useQuery<any[]>({
    queryKey: ["/api/video-calls/attorney-incoming"],
    refetchInterval: profile?.availabilityStatus !== "offline" ? 5000 : false,
    enabled: isAuthenticated && !!profile,
  });

  const { data: callHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/video-calls/history"],
    enabled: isAuthenticated && activeTab === "calls",
  });

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (activeCallRoom) {
      timer = setInterval(() => setCallElapsed(s => s + 1), 1000);
    } else {
      setCallElapsed(0);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [activeCallRoom]);

  const updateAvailability = useMutation({
    mutationFn: (availabilityStatus: string) =>
      apiRequest("PATCH", "/api/attorney-network/my-availability", { availabilityStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/attorney-network/my-profile"] });
      toast({ title: "Availability updated" });
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) =>
      apiRequest("PATCH", "/api/attorney-network/my-profile", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/attorney-network/my-profile"] });
      toast({ title: "Profile updated successfully" });
    },
  });

  const acceptCall = useMutation({
    mutationFn: (callId: number) => apiRequest("PATCH", `/api/video-calls/${callId}/accept`, {}),
    onSuccess: (data: any) => {
      setActiveCallId(data.id);
      setActiveCallRoom(data.roomUrl);
      qc.invalidateQueries({ queryKey: ["/api/video-calls/attorney-incoming"] });
    },
    onError: () => toast({ title: "Failed to accept call", variant: "destructive" }),
  });

  const declineCall = useMutation({
    mutationFn: (callId: number) => apiRequest("PATCH", `/api/video-calls/${callId}/decline`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/video-calls/attorney-incoming"] });
      toast({ title: "Call declined" });
    },
  });

  const endCall = useMutation({
    mutationFn: (callId: number) => apiRequest("PATCH", `/api/video-calls/${callId}/end`, {}),
    onSuccess: () => {
      setActiveCallRoom(null);
      setActiveCallId(null);
      qc.invalidateQueries({ queryKey: ["/api/video-calls/history"] });
      qc.invalidateQueries({ queryKey: ["/api/video-calls/attorney-incoming"] });
      toast({ title: "Call ended" });
    },
  });

  const currentStatus = AVAILABILITY_OPTIONS.find((o) => o.value === (profile?.availabilityStatus || "offline")) || AVAILABILITY_OPTIONS[3];

  const profileCompletion = (() => {
    if (!profile) return 0;
    const fields = [profile.bio, profile.phone, profile.firmWebsite, profile.profileImage,
      (profile.languages?.length > 0), (profile.countiesServed?.length > 0),
      profile.emergencyAvailable !== undefined, profile.verified];
    const done = fields.filter(Boolean).length;
    return Math.round((done / fields.length) * 100);
  })();

  const summaryCards = [
    { label: "Profile Views", value: "—", icon: Eye, color: "text-cyan-400" },
    { label: "Availability", value: currentStatus.label, icon: Clock, color: "text-green-400" },
    { label: "Profile Score", value: profile?.profileScore || 0, icon: Star, color: "text-yellow-400" },
    { label: "Avg Response", value: profile?.avgResponseMinutes ? `${profile.avgResponseMinutes}m` : "—", icon: Zap, color: "text-purple-400" },
    { label: "Profile Complete", value: `${profileCompletion}%`, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Verified", value: profile?.verified ? "Yes" : "Pending", icon: Shield, color: profile?.verified ? "text-green-400" : "text-gray-400" },
  ];

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)}m ${s % 60}s` : "—";
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center p-6">
        <div>
          <Scale className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-white text-xl font-bold mb-2">Attorney Portal</h1>
          <p className="text-gray-400 mb-6">Please sign in to access your attorney portal.</p>
          <a href="/login"><Button className="bg-cyan-600 hover:bg-cyan-700">Sign In</Button></a>
        </div>
      </div>
    );
  }

  const content = (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-6 space-y-6">

        {/* ── Active Call Banner ────────────────────────────── */}
        {activeCallRoom && (
          <div className="bg-green-500/10 border border-green-500/40 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-green-500/10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 font-semibold text-sm">Live Call in Progress</span>
                <span className="text-green-400 font-mono text-sm">{formatTime(callElapsed)}</span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-3 text-xs gap-1"
                onClick={() => activeCallId && endCall.mutate(activeCallId)}
                disabled={endCall.isPending}
              >
                <PhoneOff className="w-3 h-3" /> End Call
              </Button>
            </div>
            <iframe
              src={activeCallRoom}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full"
              style={{ height: "420px", border: "none" }}
              title="Active Call"
            />
          </div>
        )}

        {/* ── Incoming Call Alerts ─────────────────────────── */}
        {incomingCalls.length > 0 && !activeCallRoom && (
          <div className="space-y-3">
            {incomingCalls.map((call: any) => (
              <div
                key={call.id}
                className="bg-red-500/10 border border-red-500/60 rounded-xl p-4 animate-pulse-slow"
                style={{ animation: "pulse 2s ease-in-out infinite" }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                      <PhoneIncoming className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm flex items-center gap-2">
                        Incoming Emergency Call
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-xs animate-pulse">LIVE</Badge>
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {call.incidentType ? call.incidentType.replace(/_/g, " ") : "Legal assistance"}
                        {call.incidentState ? ` · ${call.incidentState}` : ""}
                      </p>
                      {call.userNote && (
                        <p className="text-gray-300 text-xs mt-1 italic">"{call.userNote}"</p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">
                        Requested {new Date(call.requestedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8 px-3 text-xs"
                      onClick={() => declineCall.mutate(call.id)}
                      disabled={declineCall.isPending || acceptCall.isPending}
                    >
                      <X className="w-3 h-3 mr-1" /> Decline
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs gap-1"
                      onClick={() => acceptCall.mutate(call.id)}
                      disabled={acceptCall.isPending || declineCall.isPending}
                    >
                      <Video className="w-3 h-3" /> Accept
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Scale className="w-6 h-6 text-cyan-400" />
              Attorney Portal
            </h1>
            {profile && (
              <p className="text-gray-400 text-sm mt-1">
                {profile.firstName} {profile.lastName} — {profile.firmName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${currentStatus.color}`} />
            <Select
              value={profile?.availabilityStatus || "offline"}
              onValueChange={(v) => updateAvailability.mutate(v)}
              disabled={updateAvailability.isPending || isLoading}
            >
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {AVAILABILITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${o.color}`} />
                      {o.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Profile completion bar */}
        {profileCompletion < 100 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-300 text-sm font-semibold">Profile {profileCompletion}% complete</p>
              <div className="h-1.5 bg-gray-700 rounded-full mt-2">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-400 shrink-0" onClick={() => setActiveTab("profile")}>
              Complete →
            </Button>
          </div>
        )}

        {!profile && !isLoading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-300 font-semibold">No attorney profile linked to your account.</p>
            <p className="text-gray-400 text-sm mt-1">Your application may still be under review, or you need to apply to join the network.</p>
            <a href="/attorney-apply">
              <Button className="mt-4 bg-cyan-600 hover:bg-cyan-700">Apply to Join Network</Button>
            </a>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800/60 border border-gray-700 w-full grid grid-cols-5">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600 text-xs">Overview</TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-cyan-600 text-xs">My Profile</TabsTrigger>
            <TabsTrigger value="availability" className="data-[state=active]:bg-cyan-600 text-xs">Availability</TabsTrigger>
            <TabsTrigger value="calls" className="data-[state=active]:bg-cyan-600 text-xs flex items-center gap-1">
              Calls
              {incomingCalls.length > 0 && (
                <span className="ml-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold">
                  {incomingCalls.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-cyan-600 text-xs">Performance</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-5 mt-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {summaryCards.map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="bg-gray-800/60 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-xs">{label}</p>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <p className="text-white text-xl font-bold">{String(value)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gray-800/60 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href="/attorneys" className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-cyan-700 text-gray-300 hover:text-white transition-all text-sm">
                  <Eye className="w-4 h-4 text-cyan-400" /> View Your Public Listing
                </a>
                <a href="/messages" className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-purple-700 text-gray-300 hover:text-white transition-all text-sm">
                  <MessageCircle className="w-4 h-4 text-purple-400" /> Open Messages
                </a>
                <button
                  onClick={() => setActiveTab("calls")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-green-700 text-gray-300 hover:text-white transition-all text-sm text-left"
                >
                  <Video className="w-4 h-4 text-green-400" />
                  Video Calls
                  {incomingCalls.length > 0 && (
                    <Badge className="ml-auto bg-red-500/20 text-red-400 border-red-500/30 border animate-pulse">
                      {incomingCalls.length} incoming
                    </Badge>
                  )}
                </button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/60 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-yellow-400" /> Compliance Reminder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-400">
                <p>• Contacting a user does not itself create an attorney-client relationship</p>
                <p>• You remain responsible for all ethics compliance in your licensed jurisdictions</p>
                <p>• C.A.R.E.N.™ Alert is a directory platform — not a law firm</p>
                <p>• You retain 100% of legal fees — no fee sharing with this platform</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROFILE EDITOR */}
          <TabsContent value="profile" className="space-y-5 mt-5">
            {profile && <ProfileEditor profile={profile} onSave={(data) => updateProfile.mutate(data)} isSaving={updateProfile.isPending} />}
          </TabsContent>

          {/* AVAILABILITY */}
          <TabsContent value="availability" className="space-y-5 mt-5">
            <Card className="bg-gray-800/60 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Availability Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {AVAILABILITY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${(profile?.availabilityStatus || "offline") === o.value ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700 hover:border-gray-600"}`}
                    onClick={() => updateAvailability.mutate(o.value)}
                    disabled={updateAvailability.isPending}
                  >
                    <div className={`w-4 h-4 rounded-full ${o.color} shrink-0`} />
                    <div>
                      <p className="text-white text-sm font-semibold">{o.label}</p>
                      <p className="text-gray-400 text-xs">{o.desc}</p>
                    </div>
                    {(profile?.availabilityStatus || "offline") === o.value && (
                      <CheckCircle className="w-4 h-4 text-cyan-400 ml-auto" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CALLS TAB */}
          <TabsContent value="calls" className="space-y-5 mt-5">
            {/* Active incoming */}
            {incomingCalls.length > 0 && !activeCallRoom && (
              <Card className="bg-red-500/10 border-red-500/40">
                <CardHeader>
                  <CardTitle className="text-red-300 text-sm flex items-center gap-2">
                    <PhoneIncoming className="w-4 h-4 animate-pulse" />
                    Incoming Calls ({incomingCalls.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {incomingCalls.map((call: any) => (
                    <div key={call.id} className="flex items-center justify-between gap-3 p-3 bg-gray-800/60 rounded-xl border border-gray-700">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold">
                          {call.incidentType?.replace(/_/g, " ") || "Legal assistance request"}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {call.incidentState && <span>{call.incidentState} · </span>}
                          {new Date(call.requestedAt).toLocaleTimeString()}
                        </p>
                        {call.userNote && <p className="text-gray-300 text-xs italic mt-1">"{call.userNote}"</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8 px-2 text-xs"
                          onClick={() => declineCall.mutate(call.id)} disabled={declineCall.isPending || acceptCall.isPending}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs gap-1"
                          onClick={() => acceptCall.mutate(call.id)} disabled={acceptCall.isPending || declineCall.isPending}>
                          <Video className="w-3 h-3" /> Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {incomingCalls.length === 0 && !activeCallRoom && (
              <Card className="bg-gray-800/60 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Phone className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No incoming calls right now</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Set your status to <span className="text-green-400">Available</span> or <span className="text-orange-400">Emergency Only</span> to receive calls
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Call history */}
            <Card className="bg-gray-800/60 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" /> Call History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {callHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No call history yet</p>
                ) : (
                  <div className="space-y-2">
                    {callHistory.map((call: any) => (
                      <div key={call.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-700 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {call.status === "ended" && <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />}
                          {call.status === "declined" && <X className="w-4 h-4 text-red-400 shrink-0" />}
                          {call.status === "missed" && <PhoneMissed className="w-4 h-4 text-yellow-400 shrink-0" />}
                          {(call.status === "waiting" || call.status === "active") && <Clock className="w-4 h-4 text-cyan-400 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {call.incidentType?.replace(/_/g, " ") || "Legal call"}
                              {call.incidentState && <span className="text-gray-500"> · {call.incidentState}</span>}
                            </p>
                            <p className="text-gray-500 text-xs">{formatDate(call.requestedAt)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge className={`text-xs border ${
                            call.status === "ended" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                            call.status === "declined" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                            "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }`}>
                            {call.status}
                          </Badge>
                          {call.durationSeconds && (
                            <p className="text-gray-500 text-xs mt-1">{formatDuration(call.durationSeconds)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PERFORMANCE */}
          <TabsContent value="performance" className="space-y-5 mt-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Profile Score", value: profile?.profileScore || 0, max: 100, color: "bg-yellow-500" },
                { label: "Avg Response", value: profile?.avgResponseMinutes || 60, suffix: "min", color: "bg-cyan-500" },
              ].map(({ label, value, max, suffix, color }) => (
                <Card key={label} className="bg-gray-800/60 border-gray-700">
                  <CardContent className="p-4">
                    <p className="text-gray-400 text-xs mb-2">{label}</p>
                    <p className="text-white text-2xl font-bold">{value}{suffix}</p>
                    {max && (
                      <div className="h-1.5 bg-gray-700 rounded-full mt-3">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min((Number(value) / max) * 100, 100)}%` }} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="bg-gray-800/60 border-gray-700">
              <CardContent className="p-5 text-center text-gray-400 text-sm">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p>Performance metrics will populate once you start receiving and responding to user requests.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  return (
    <MobileResponsiveLayout>
      <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <TopBar title="Attorney Portal" description="Manage your profile, availability, and incoming calls" />
          {content}
        </main>
      </div>
    </MobileResponsiveLayout>
  );
}

function ProfileEditor({ profile, onSave, isSaving }: { profile: any; onSave: (data: any) => void; isSaving: boolean }) {
  const [bio, setBio] = useState(profile.bio || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [website, setWebsite] = useState(profile.firmWebsite || "");
  const [emergencyAvailable, setEmergencyAvailable] = useState(profile.emergencyAvailable || false);

  return (
    <Card className="bg-gray-800/60 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" /> Edit Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-700/30 rounded-lg">
          <div>
            <p className="text-gray-500 text-xs">Name</p>
            <p className="text-white text-sm font-semibold">{profile.firstName} {profile.lastName}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Firm</p>
            <p className="text-white text-sm font-semibold">{profile.firmName}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Bar State</p>
            <p className="text-white text-sm">{profile.barState}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Bar Number</p>
            <p className="text-white text-sm">{profile.barNumber}</p>
          </div>
        </div>

        <div>
          <Label className="text-gray-300">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-gray-700 border-gray-600 text-white mt-1" />
        </div>
        <div>
          <Label className="text-gray-300">Firm Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-gray-700 border-gray-600 text-white mt-1" />
        </div>
        <div>
          <Label className="text-gray-300">Bio <span className="text-gray-500 text-xs">(shown on your public listing)</span></Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-gray-700 border-gray-600 text-white mt-1" rows={4} />
        </div>
        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 cursor-pointer">
          <Checkbox checked={emergencyAvailable} onCheckedChange={(v) => setEmergencyAvailable(!!v)} className="border-gray-500" />
          <div>
            <p className="text-white text-sm font-semibold">Available for Emergency Situations</p>
            <p className="text-gray-400 text-xs">Show as priority contact for urgent incidents</p>
          </div>
        </label>
        <Button
          className="w-full bg-cyan-600 hover:bg-cyan-700"
          disabled={isSaving}
          onClick={() => onSave({ bio, phone, firmWebsite: website, emergencyAvailable })}
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
