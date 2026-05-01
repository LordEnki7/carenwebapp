import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useCloudRecorder } from "@/hooks/useCloudRecorder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CloudUpload, Video, Shield, MapPin, Clock, Trash2, Share2,
  Play, Mic, MicOff, VideoOff, AlertTriangle, CheckCircle2,
  ChevronLeft, Lock, Wifi, WifiOff, Upload, Camera,
  FileText, Scale, AlertOctagon, ExternalLink, ChevronDown
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Incident {
  id: string;
  status: "recording" | "complete" | "failed";
  trigger_type: string;
  latitude: number | null;
  longitude: number | null;
  state: string | null;
  address: string | null;
  chunk_count: number;
  duration_seconds: number | null;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  is_legal_hold: boolean;
  legal_hold_reason: string | null;
  share_expires_at: string | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function Incidents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLabel, setShareLabel] = useState<string>("");
  const [shareIncident, setShareIncident] = useState<Incident | null>(null);
  const [shareDurationDays, setShareDurationDays] = useState<number>(1);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showPlayback, setShowPlayback] = useState(false);
  const [playbackUrls, setPlaybackUrls] = useState<string[]>([]);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; state?: string; address?: string } | null>(null);
  const [holdReason, setHoldReason] = useState("");

  const { isRecording, incidentId, chunkCount, elapsedSeconds, error, start, stop } = useCloudRecorder({
    onChunkUploaded: (i) => {
      console.log(`Chunk ${i} saved to cloud`);
    },
    onError: (msg) => {
      toast({ title: "Upload warning", description: msg, variant: "destructive" });
    },
    chunkIntervalMs: 15000,
  });

  // Fetch user's incidents
  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ["/api/incidents/my"],
    refetchInterval: isRecording ? 5000 : false,
  });

  // Get current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });

        // Reverse geocode
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await r.json();
          const state = data.address?.state || null;
          const address = data.display_name?.split(",").slice(0, 3).join(",") || null;
          setLocation({ lat, lng, state, address });
        } catch {}
      }, undefined, { timeout: 8000 });
    }
  }, []);

  // Attach camera stream to preview video element when recording
  useEffect(() => {
    if (isRecording && videoPreviewRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        }).catch(() => {});
    } else if (!isRecording && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, [isRecording]);

  const handleStart = async () => {
    await start({
      latitude: location?.lat,
      longitude: location?.lng,
      state: location?.state,
      address: location?.address,
      triggerType: "manual",
    });
    toast({ title: "Cloud Recording Started", description: "Video is being uploaded to secure cloud storage in real-time." });
  };

  const handleStop = async () => {
    const id = await stop();
    queryClient.invalidateQueries({ queryKey: ["/api/incidents/my"] });
    toast({ title: "Recording Saved", description: `Incident ${id?.slice(0, 8)}… secured in cloud storage.` });
  };

  // Delete incident (blocked by backend if legal hold active)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/incidents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents/my"] });
      toast({ title: "Incident deleted" });
    },
    onError: async (err: any) => {
      // 423 = legal hold active
      const body = err?.response ? await err.response.json().catch(() => ({})) : {};
      if (body?.code === "LEGAL_HOLD_ACTIVE") {
        toast({
          title: "Cannot delete — Legal Hold active",
          description: "Remove the legal hold on this incident before deleting.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Delete failed", description: "Please try again.", variant: "destructive" });
      }
    },
  });

  // Share incident with configurable duration
  const shareMutation = useMutation({
    mutationFn: ({ id, durationDays }: { id: string; durationDays: number }) =>
      apiRequest("POST", `/api/incidents/${id}/share`, { durationDays }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      setShareUrl(data.shareUrl);
      setShareLabel(data.label ?? "");
    },
  });

  // Legal hold toggle
  const legalHoldMutation = useMutation({
    mutationFn: ({ id, hold, reason }: { id: string; hold: boolean; reason?: string }) =>
      apiRequest("PATCH", `/api/incidents/${id}/legal-hold`, { hold, reason }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents/my"] });
      toast({
        title: vars.hold ? "Legal Hold Activated" : "Legal Hold Removed",
        description: vars.hold
          ? "This incident is now protected. It cannot be deleted while the hold is active."
          : "Legal hold removed. The incident can now be deleted.",
      });
    },
    onError: () => toast({ title: "Failed to update legal hold", variant: "destructive" }),
  });

  const openEvidencePackage = (incident: Incident) => {
    window.open(`/api/incidents/${incident.id}/evidence-package`, "_blank");
  };

  const handlePlayback = async (incident: Incident) => {
    setSelectedIncident(incident);
    setShowPlayback(true);
    setPlaybackLoading(true);
    setPlaybackUrls([]);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/playback`, { credentials: "include" });
      const data = await res.json();
      setPlaybackUrls(data.chunkUrls || []);
    } catch {
      toast({ title: "Playback error", description: "Could not load footage", variant: "destructive" });
    } finally {
      setPlaybackLoading(false);
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Share this with your attorney or trusted contact." });
    }
  };

  const FREE_LIMIT = 3;
  const isPremium = false; // TODO: wire to user subscription
  const canRecord = isPremium || incidents.filter(i => i.status === "complete").length < FREE_LIMIT;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-black/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <CloudUpload className="w-6 h-6 text-cyan-400" />
          <div>
            <h1 className="text-lg font-bold text-white">Cloud Incidents</h1>
            <p className="text-xs text-gray-400">Secure R2 Cloud Storage</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isRecording ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                LIVE
              </Badge>
            ) : (
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 gap-1">
                <Wifi className="w-3 h-3" />
                Ready
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Recording Card */}
        <Card className="bg-gray-900/60 border border-cyan-500/20 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Live preview */}
            <div className="relative aspect-video bg-black">
              {isRecording ? (
                <>
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay HUD */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-400 text-sm font-mono font-bold">{formatElapsed(elapsedSeconds)}</span>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <Badge className="bg-black/60 text-cyan-400 border-cyan-500/30 text-xs gap-1">
                        <Upload className="w-3 h-3" />
                        {chunkCount} chunks saved
                      </Badge>
                    </div>
                    {location?.state && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-white/70">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {location.state}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-600">
                  <Camera className="w-12 h-12" />
                  <p className="text-sm">Camera preview will appear here</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {!canRecord && !isRecording && (
                <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  Free plan: 3 incident limit reached. Upgrade for unlimited cloud storage.
                </div>
              )}

              <div className="flex gap-3">
                {!isRecording ? (
                  <Button
                    onClick={handleStart}
                    disabled={!canRecord}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold h-12 rounded-xl gap-2 disabled:opacity-40"
                  >
                    <Video className="w-5 h-5" />
                    Start Cloud Recording
                  </Button>
                ) : (
                  <Button
                    onClick={handleStop}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 border border-red-500/40 text-red-400 font-semibold h-12 rounded-xl gap-2"
                  >
                    <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                    Stop & Save to Cloud
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Every 15s auto-saved</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Survives device loss</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Share with attorney</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incidents List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-cyan-400" />
              Saved Incidents
            </h2>
            {!isPremium && (
              <span className="text-xs text-gray-500">
                {incidents.filter(i => i.status === "complete").length} / {FREE_LIMIT} free
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-xl bg-gray-900/40 animate-pulse" />
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CloudUpload className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No incidents recorded yet</p>
              <p className="text-xs mt-1">Start a recording above to preserve footage in the cloud</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <Card key={incident.id} className="bg-gray-900/50 border border-white/5 hover:border-cyan-500/20 transition-colors rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        incident.status === "complete"
                          ? "bg-cyan-500/10 text-cyan-400"
                          : incident.status === "recording"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-gray-700 text-gray-400"
                      }`}>
                        {incident.status === "complete" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : incident.status === "recording" ? (
                          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-white">
                            {incident.trigger_type === "emergency" ? "🚨 Emergency" :
                             incident.trigger_type === "traffic_stop" ? "🚔 Traffic Stop" :
                             "📹 Manual Recording"}
                          </span>
                          <Badge className={`text-xs px-1.5 ${
                            incident.status === "complete"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : incident.status === "recording"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-gray-700 text-gray-400 border-gray-600"
                          }`}>
                            {incident.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(incident.started_at)}
                          </span>
                          {incident.duration_seconds && (
                            <span className="flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              {formatDuration(incident.duration_seconds)}
                            </span>
                          )}
                          {incident.state && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              {incident.state}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            {incident.chunk_count} chunks
                          </span>
                        </div>
                      </div>

                      {/* Legal hold badge */}
                      {incident.is_legal_hold && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 w-fit">
                          <Scale className="w-3 h-3 shrink-0" />
                          Legal Hold Active
                          {incident.legal_hold_reason && <span className="text-amber-300/70"> — {incident.legal_hold_reason}</span>}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 mt-1 flex-wrap">
                        {incident.status === "complete" && incident.chunk_count > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-cyan-400"
                            onClick={() => handlePlayback(incident)}
                            title="Play footage"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Evidence Package */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-green-400"
                          onClick={() => openEvidencePackage(incident)}
                          title="Generate evidence package (print to PDF)"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>

                        {/* Share with attorney */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-cyan-400"
                          onClick={() => {
                            setShareIncident(incident);
                            setShareDurationDays(1);
                            setShareUrl(null);
                          }}
                          title="Share with attorney"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>

                        {/* Legal Hold toggle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${incident.is_legal_hold ? "text-amber-400 hover:text-amber-300" : "text-gray-400 hover:text-amber-400"}`}
                          onClick={() => {
                            if (incident.is_legal_hold) {
                              if (confirm("Remove the legal hold on this incident?")) {
                                legalHoldMutation.mutate({ id: incident.id, hold: false });
                              }
                            } else {
                              const reason = prompt("Optional: enter a brief reason for this legal hold (e.g. 'Traffic stop 05/01/2026')");
                              legalHoldMutation.mutate({ id: incident.id, hold: true, reason: reason ?? undefined });
                            }
                          }}
                          title={incident.is_legal_hold ? "Remove legal hold" : "Mark as legal evidence (legal hold)"}
                        >
                          <Scale className="w-4 h-4" />
                        </Button>

                        {/* Delete (disabled when hold active) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-400 disabled:opacity-30"
                          disabled={incident.is_legal_hold}
                          onClick={() => {
                            if (confirm("Delete this incident from cloud storage? This cannot be undone.")) {
                              deleteMutation.mutate(incident.id);
                            }
                          }}
                          title={incident.is_legal_hold ? "Cannot delete — legal hold active" : "Delete incident"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Premium upsell */}
        {!isPremium && (
          <Card className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/20 rounded-2xl">
            <CardContent className="p-5 flex items-center gap-4">
              <Lock className="w-8 h-8 text-purple-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Upgrade for Unlimited Storage</p>
                <p className="text-xs text-gray-400 mt-0.5">Free: 3 incidents · Premium: Unlimited + trusted contact auto-notifications</p>
              </div>
              <Link href="/pricing">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg shrink-0">
                  Upgrade
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Share Setup Dialog — choose duration then generate */}
      <Dialog open={!!shareIncident && !shareUrl} onOpenChange={() => setShareIncident(null)}>
        <DialogContent className="bg-gray-900 border-cyan-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              Share with Attorney
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Generate a secure link to this incident. Choose how long the link stays active.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Link duration</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "24 hours", value: 1 },
                  { label: "7 days", value: 7 },
                  { label: "30 days", value: 30 },
                  { label: "90 days", value: 90 },
                  { label: "Permanent", value: 0 },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setShareDurationDays(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                      shareDurationDays === opt.value
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 font-semibold"
                        : "border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {shareDurationDays === 0 && (
                <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
                  Permanent links give ongoing access. Share only with your own attorney.
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                if (shareIncident) shareMutation.mutate({ id: shareIncident.id, durationDays: shareDurationDays });
              }}
              disabled={shareMutation.isPending}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {shareMutation.isPending ? "Generating…" : "Generate Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Link Generated Dialog */}
      <Dialog open={!!shareUrl} onOpenChange={() => { setShareUrl(null); setShareIncident(null); }}>
        <DialogContent className="bg-gray-900 border-cyan-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              Attorney Link Ready
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Access expires: <strong>{shareLabel}</strong>
            </div>
            <div className="bg-black/50 rounded-lg p-3 border border-white/10 text-xs text-cyan-300 break-all font-mono">
              {shareUrl}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={copyShareUrl}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Copy Link
              </Button>
              <Button
                variant="outline"
                className="border-gray-600 text-gray-400 hover:text-white"
                onClick={() => window.open(shareUrl!, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              This link gives read-only access to footage and metadata. Share it only with your attorney or a trusted contact.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Playback Dialog */}
      <Dialog open={showPlayback} onOpenChange={v => { setShowPlayback(v); setPlaybackUrls([]); }}>
        <DialogContent className="bg-gray-900 border-cyan-500/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-cyan-400" />
              Incident Footage
              {selectedIncident?.state && (
                <span className="text-xs text-gray-400 font-normal ml-1">— {selectedIncident.state}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {playbackLoading ? (
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-gray-500 text-sm">Loading footage…</div>
              </div>
            ) : playbackUrls.length === 0 ? (
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-gray-500 text-sm">No footage available yet</div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">{playbackUrls.length} chunk(s) — play in sequence</p>
                {playbackUrls.map((url, i) => (
                  <div key={i} className="rounded-lg overflow-hidden bg-black">
                    <video
                      src={url}
                      controls
                      className="w-full"
                      playsInline
                    />
                    <div className="text-xs text-gray-500 px-3 py-1">Chunk {i + 1} of {playbackUrls.length}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
