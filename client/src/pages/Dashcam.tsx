import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Camera, CameraOff, Shield, AlertTriangle, Clock, CheckCircle2, CloudUpload, ChevronLeft, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashcam, DashcamStatus } from "@/hooks/useDashcam";
import Sidebar from "@/components/Sidebar";

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (m === 0) return `${sec}s`;
  return `${m}m ${sec}s`;
}

function StatusBadge({ status, isSaving }: { status: DashcamStatus; isSaving: boolean }) {
  if (status === "off") return (
    <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 flex items-center gap-1">
      <WifiOff className="w-3 h-3" /> Offline
    </Badge>
  );
  if (isSaving) return (
    <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1 animate-pulse">
      <CloudUpload className="w-3 h-3" /> Uploading to cloud…
    </Badge>
  );
  if (status === "standby") return (
    <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
      <Wifi className="w-3 h-3 animate-pulse" /> Standby — buffering
    </Badge>
  );
  return null;
}

export default function Dashcam() {
  const {
    status,
    bufferChunks,
    bufferSeconds,
    savedIncidents,
    error,
    isSaving,
    startDashcam,
    stopDashcam,
    saveIncident,
  } = useDashcam();

  const [elapsedBuffer, setElapsedBuffer] = useState(0);

  // Live "buffer growing" counter
  useEffect(() => {
    if (status === "off") { setElapsedBuffer(0); return; }
    const interval = setInterval(() => setElapsedBuffer(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const bufferPercent = Math.min((bufferChunks / 40) * 100, 100);
  const isOn = status !== "off";

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-cyan-300 -ml-2">
                <ChevronLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
              <Camera className="w-6 h-6 text-cyan-400" />
              Always-On Dashcam
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Continuously buffers the last 10 minutes. Tap "Save Incident" to lock footage to cloud storage.
            </p>
          </div>

          {/* Main control card */}
          <div className={`rounded-xl border p-6 space-y-5 transition-all duration-500 ${
            isOn
              ? "bg-cyan-950/30 border-cyan-500/30"
              : "bg-gray-900/60 border-gray-700/40"
          }`}>
            <div className="flex items-center justify-between">
              <StatusBadge status={status} isSaving={isSaving} />
              {isOn && (
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatSeconds(elapsedBuffer)} running
                </span>
              )}
            </div>

            {/* Buffer meter */}
            {isOn && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Rolling buffer</span>
                  <span className="font-mono">{bufferChunks} chunk{bufferChunks !== 1 ? "s" : ""} · {formatSeconds(bufferSeconds)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${bufferPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">Max window: 10 min — oldest footage auto-drops</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary actions */}
            <div className="flex gap-3">
              {!isOn ? (
                <Button
                  onClick={startDashcam}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-12 text-base"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Dashcam
                </Button>
              ) : (
                <>
                  <Button
                    onClick={saveIncident}
                    disabled={isSaving || bufferChunks === 0}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold h-12 text-base shadow-lg shadow-red-900/40"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    {isSaving ? "Uploading…" : "Save Incident"}
                  </Button>
                  <Button
                    onClick={stopDashcam}
                    disabled={isSaving}
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 h-12"
                  >
                    <CameraOff className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            {isOn && bufferChunks === 0 && !error && (
              <p className="text-xs text-center text-gray-500">
                Buffering first chunk — Save will unlock in ~15 seconds…
              </p>
            )}
          </div>

          {/* How it works */}
          {!isOn && (
            <div className="rounded-xl border border-gray-700/40 bg-gray-900/40 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">How dashcam mode works</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2"><span className="text-cyan-400 shrink-0">1.</span> Tap <strong className="text-stone-200">Start Dashcam</strong> to begin continuous background recording.</li>
                <li className="flex gap-2"><span className="text-cyan-400 shrink-0">2.</span> The last <strong className="text-stone-200">10 minutes</strong> of footage are always buffered in memory — nothing is uploaded yet.</li>
                <li className="flex gap-2"><span className="text-cyan-400 shrink-0">3.</span> If something happens, tap <strong className="text-stone-200">Save Incident</strong> to upload everything to your secure cloud library instantly.</li>
                <li className="flex gap-2"><span className="text-cyan-400 shrink-0">4.</span> Recording continues after saving — the buffer resets and dashcam stays on.</li>
              </ul>
            </div>
          )}

          {/* Recent saves */}
          {savedIncidents.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Saved this session
              </h3>
              <div className="space-y-2">
                {savedIncidents.map((inc) => (
                  <div
                    key={inc.incidentId}
                    className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-green-300 font-mono">{inc.incidentId.slice(0, 8)}…</p>
                      <p className="text-xs text-gray-500">{inc.savedAt.toLocaleTimeString()} · {inc.chunks} chunks · {formatSeconds(inc.durationSeconds)}</p>
                    </div>
                    <Link href="/incidents">
                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 text-xs">
                        View →
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link to full library */}
          <div className="text-center pt-2">
            <Link href="/incidents">
              <Button variant="ghost" className="text-gray-500 hover:text-cyan-300 text-sm">
                Open Cloud Incident Library →
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
