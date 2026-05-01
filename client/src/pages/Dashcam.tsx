import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  Camera, CameraOff, Shield, AlertTriangle, Clock, CheckCircle2,
  CloudUpload, ChevronLeft, Wifi, WifiOff, Bluetooth, BluetoothOff,
  BluetoothSearching, Keyboard, RefreshCw, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDashcam, DashcamStatus } from "@/hooks/useDashcam";
import { useBluetooth, listVideoDevices } from "@/hooks/useBluetooth";
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

function BleBadge({ status }: { status: string }) {
  if (status === "unsupported") return (
    <span className="text-xs text-gray-600">BLE not available in this browser</span>
  );
  if (status === "scanning") return (
    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 animate-pulse">
      <BluetoothSearching className="w-3 h-3" /> Scanning…
    </Badge>
  );
  if (status === "connected") return (
    <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
      <Bluetooth className="w-3 h-3" /> Connected
    </Badge>
  );
  if (status === "disconnected") return (
    <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
      <BluetoothOff className="w-3 h-3" /> Disconnected
    </Badge>
  );
  return (
    <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 flex items-center gap-1">
      <BluetoothOff className="w-3 h-3" /> Not paired
    </Badge>
  );
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

  const {
    bleStatus,
    bleDeviceName,
    keyboardTriggerEnabled,
    lastKeyTrigger,
    pairBleDevice,
    disconnectBle,
    toggleKeyboardTrigger,
    isBleSupported,
  } = useBluetooth();

  const [elapsedBuffer, setElapsedBuffer] = useState(0);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");
  const [showCameraSelect, setShowCameraSelect] = useState(false);
  const [showBtPanel, setShowBtPanel] = useState(false);

  // Stable save callback for bluetooth triggers
  const handleBtTrigger = useCallback(() => {
    if (status === "standby" && !isSaving && bufferChunks > 0) {
      saveIncident();
    }
  }, [status, isSaving, bufferChunks, saveIncident]);

  // Live buffer counter
  useEffect(() => {
    if (status === "off") { setElapsedBuffer(0); return; }
    const interval = setInterval(() => setElapsedBuffer(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Enumerate cameras on mount and when user grants permission
  const refreshCameras = useCallback(async () => {
    const devices = await listVideoDevices();
    setVideoDevices(devices);
    if (devices.length > 1) setShowCameraSelect(true);
  }, []);

  useEffect(() => { refreshCameras(); }, [refreshCameras]);

  // Keep keyboard trigger callback fresh
  useEffect(() => {
    if (keyboardTriggerEnabled) {
      toggleKeyboardTrigger(true, handleBtTrigger);
    }
  }, [handleBtTrigger, keyboardTriggerEnabled, toggleKeyboardTrigger]);

  const bufferPercent = Math.min((bufferChunks / 40) * 100, 100);
  const isOn = status !== "off";

  const handleStart = () => {
    startDashcam(selectedDeviceId === "default" ? undefined : selectedDeviceId);
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

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
              Buffers the last 10 minutes. Tap "Save Incident" — or use a Bluetooth remote — to lock footage to cloud.
            </p>
          </div>

          {/* ── Main control card ── */}
          <div className={`rounded-xl border p-6 space-y-5 transition-all duration-500 ${
            isOn ? "bg-cyan-950/30 border-cyan-500/30" : "bg-gray-900/60 border-gray-700/40"
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <StatusBadge status={status} isSaving={isSaving} />
              {isOn && (
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatSeconds(elapsedBuffer)} running
                </span>
              )}
            </div>

            {/* Camera selector (only when multiple cameras found) */}
            {showCameraSelect && !isOn && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Camera className="w-3 h-3" /> Camera source
                  <button onClick={refreshCameras} className="ml-auto text-gray-600 hover:text-cyan-400">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </Label>
                <div className="relative">
                  <select
                    value={selectedDeviceId}
                    onChange={e => setSelectedDeviceId(e.target.value)}
                    className="w-full appearance-none bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="default">Default camera</option>
                    {videoDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-2.5 pointer-events-none" />
                </div>
                {videoDevices.some(d => d.label.toLowerCase().includes("bluetooth") || d.label.toLowerCase().includes("bt")) && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <Bluetooth className="w-3 h-3" /> Bluetooth camera detected above
                  </p>
                )}
              </div>
            )}

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
                  onClick={handleStart}
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

            {/* Keyboard trigger feedback */}
            {keyboardTriggerEnabled && lastKeyTrigger && isOn && (
              <div className="flex items-center gap-2 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                <Keyboard className="w-3 h-3 shrink-0" />
                Trigger fired via key: <code className="font-mono">{lastKeyTrigger}</code>
              </div>
            )}
          </div>

          {/* ── Bluetooth panel ── */}
          <div className="rounded-xl border border-gray-700/40 bg-gray-900/40 overflow-hidden">
            <button
              onClick={() => setShowBtPanel(p => !p)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/40 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Bluetooth className="w-4 h-4 text-blue-400" />
                Bluetooth Controls
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showBtPanel ? "rotate-180" : ""}`} />
            </button>

            {showBtPanel && (
              <div className="px-5 pb-5 space-y-5 border-t border-gray-700/40 pt-4">

                {/* Section 1 — BT camera note */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">External Bluetooth Camera</p>
                  <p className="text-sm text-gray-400">
                    Pair your Bluetooth camera in your device's system settings first. It will then appear in the <strong className="text-stone-200">Camera source</strong> selector above.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshCameras}
                    className="border-gray-600 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/40 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1.5" /> Refresh camera list
                  </Button>
                  {videoDevices.length > 0 && (
                    <p className="text-xs text-gray-500">{videoDevices.length} camera{videoDevices.length !== 1 ? "s" : ""} found</p>
                  )}
                </div>

                {/* Section 2 — BLE remote */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bluetooth Remote / Shutter Button</p>
                  <div className="flex items-center gap-3">
                    <BleBadge status={bleStatus} />
                    {bleDeviceName && <span className="text-xs text-gray-400 truncate max-w-[180px]">{bleDeviceName}</span>}
                  </div>
                  {bleStatus === "connected" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectBle}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                    >
                      <BluetoothOff className="w-3 h-3 mr-1.5" /> Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pairBleDevice(handleBtTrigger)}
                      disabled={!isBleSupported || bleStatus === "scanning"}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-40 text-xs"
                    >
                      <BluetoothSearching className="w-3 h-3 mr-1.5" />
                      {bleStatus === "scanning" ? "Scanning…" : "Pair BLE Remote"}
                    </Button>
                  )}
                  {!isBleSupported && (
                    <p className="text-xs text-gray-600">
                      Web Bluetooth is only available in Chrome and Edge. Use the keyboard trigger below as an alternative.
                    </p>
                  )}
                  {bleStatus === "connected" && (
                    <p className="text-xs text-green-400/70">
                      Remote connected — press its button to trigger "Save Incident" hands-free.
                    </p>
                  )}
                </div>

                {/* Section 3 — Keyboard trigger */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Keyboard / Hardware Key Trigger</p>
                  <p className="text-xs text-gray-500">
                    Works with most BT remotes that fire keyboard events (Volume Up, Space, Enter, or Media Play).
                  </p>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="keyboard-trigger"
                      checked={keyboardTriggerEnabled}
                      onCheckedChange={(checked) => toggleKeyboardTrigger(checked, handleBtTrigger)}
                    />
                    <Label htmlFor="keyboard-trigger" className="text-sm text-gray-300 cursor-pointer">
                      Enable keyboard trigger
                    </Label>
                  </div>
                  {keyboardTriggerEnabled && (
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/40 px-4 py-3 space-y-1">
                      <p className="text-xs text-gray-400">Listening for:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Volume Up", "Space", "Enter", "Media Play/Pause"].map(k => (
                          <code key={k} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{k}</code>
                        ))}
                      </div>
                      {lastKeyTrigger && (
                        <p className="text-xs text-yellow-300 mt-1">Last: <code className="font-mono">{lastKeyTrigger}</code></p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* ── How it works (shown when off) ── */}
          {!isOn && (
            <div className="rounded-xl border border-gray-700/40 bg-gray-900/40 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">How it works</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2"><span className="text-cyan-400 shrink-0">1.</span> Tap <strong className="text-stone-200">Start Dashcam</strong> to begin continuous recording.</li>
                <li className="flex gap-2"><span className="text-cyan-400 shrink-0">2.</span> The last <strong className="text-stone-200">10 minutes</strong> are always buffered — nothing uploads until you say so.</li>
                <li className="flex gap-2"><span className="text-cyan-400 shrink-0">3.</span> Tap <strong className="text-stone-200">Save Incident</strong>, press your BT remote, or hit a trigger key to upload everything to your secure cloud library.</li>
                <li className="flex gap-2"><span className="text-cyan-400 shrink-0">4.</span> Recording continues — buffer resets and dashcam stays on.</li>
              </ul>
            </div>
          )}

          {/* ── Recent saves ── */}
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
                      <p className="text-xs text-gray-500">
                        {inc.savedAt.toLocaleTimeString()} · {inc.chunks} chunk{inc.chunks !== 1 ? "s" : ""} · {formatSeconds(inc.durationSeconds)}
                      </p>
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
