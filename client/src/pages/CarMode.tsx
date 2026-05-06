import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  Shield, Mic, MicOff, Phone, MapPin, Battery, Gauge,
  ChevronLeft, Zap, Video, Navigation, AlertTriangle
} from "lucide-react";

interface ConnectedVehicle {
  id: number;
  manufacturer: string;
  displayName: string;
  model: string;
  year: string;
  vehicleData: string | null;
}

interface VehicleData {
  batteryLevel?: number;
  range?: number;
  speed?: number;
  isCharging?: boolean;
}

export default function CarMode() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { location } = useGeolocation();
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: vehicles = [] } = useQuery<ConnectedVehicle[]>({
    queryKey: ["/api/ev/vehicles"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const activeVehicle = vehicles[0] ?? null;
  const vehicleData: VehicleData = (() => {
    try { return activeVehicle?.vehicleData ? JSON.parse(activeVehicle.vehicleData) : {}; }
    catch { return {}; }
  })();

  const speed = vehicleData.speed ?? (location as any)?.speed ?? null;
  const battery = vehicleData.batteryLevel ?? null;
  const range = vehicleData.range ?? null;

  const handleActivate = () => {
    setIsActivated(true);
    window.location.href = "/record?auto=true&source=car-mode";
  };

  const getBatteryColor = (pct: number | null) => {
    if (pct === null) return "#64748b";
    if (pct > 60) return "#22c55e";
    if (pct > 25) return "#eab308";
    return "#ef4444";
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col select-none" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <button
          onClick={() => setLocation("/ev-connect")}
          className="flex items-center gap-1 text-slate-400 active:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">EV Connect</span>
        </button>
        <div className="text-right">
          <p className="text-2xl font-bold text-white tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-slate-500">
            {currentTime.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* EV status bar */}
      {activeVehicle && (
        <div className="mx-4 mt-2 bg-slate-900 rounded-2xl px-5 py-3 flex items-center justify-between border border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-300 font-medium">
              {activeVehicle.displayName || `${activeVehicle.year} ${activeVehicle.model}`}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {battery !== null && (
              <div className="flex items-center gap-1.5">
                <Battery className="w-4 h-4" style={{ color: getBatteryColor(battery) }} />
                <span className="text-sm font-bold tabular-nums" style={{ color: getBatteryColor(battery) }}>
                  {battery}%
                </span>
              </div>
            )}
            {range !== null && (
              <div className="flex items-center gap-1">
                <Navigation className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">{range} mi</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Speed display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {speed !== null ? (
          <div className="text-center">
            <p className="text-8xl font-black tabular-nums text-white leading-none">
              {Math.round(typeof speed === "number" ? speed * 2.237 : speed)}
            </p>
            <p className="text-lg text-slate-500 mt-1">mph</p>
          </div>
        ) : (
          <div className="text-center">
            <Gauge className="w-16 h-16 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">Speed available when EV is connected</p>
          </div>
        )}

        {/* GPS */}
        {location && (
          <div className="flex items-center gap-2 bg-slate-900/60 rounded-full px-4 py-2 border border-slate-800">
            <MapPin className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-300">GPS active</span>
            <span className="text-xs text-slate-500">
              ±{Math.round((location as any).accuracy ?? 10)}m
            </span>
          </div>
        )}

        {/* MAIN ACTIVATE BUTTON */}
        <button
          onTouchStart={handleActivate}
          onClick={handleActivate}
          className="w-64 h-64 rounded-full flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform shadow-2xl border-4"
          style={{
            background: isActivated
              ? "radial-gradient(circle at 40% 40%, #dc2626, #991b1b)"
              : "radial-gradient(circle at 40% 40%, #0e7490, #164e63)",
            borderColor: isActivated ? "#ef4444" : "#22d3ee",
            boxShadow: isActivated
              ? "0 0 60px 10px rgba(239,68,68,0.4)"
              : "0 0 60px 10px rgba(6,182,212,0.3)",
          }}
        >
          <Shield className="w-20 h-20 text-white" />
          <span className="text-xl font-black text-white tracking-wide">
            {isActivated ? "ACTIVE" : "ACTIVATE"}
          </span>
          <span className="text-sm text-white/70">C.A.R.E.N.</span>
        </button>

        {/* Quick action row */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
          <button
            onClick={() => setIsListening(l => !l)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${
              isListening
                ? "bg-red-900/40 border-red-500/50"
                : "bg-slate-900 border-slate-700"
            }`}
          >
            {isListening ? (
              <Mic className="w-8 h-8 text-red-400" />
            ) : (
              <MicOff className="w-8 h-8 text-slate-400" />
            )}
            <span className="text-xs text-slate-400">{isListening ? "Listening" : "Voice"}</span>
          </button>

          <button
            onClick={() => window.location.href = "/record"}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-slate-900 border-slate-700 active:scale-95 transition-all"
          >
            <Video className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-slate-400">Record</span>
          </button>

          <button
            onClick={() => window.location.href = "tel:911"}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-red-950/40 border-red-700/50 active:scale-95 transition-all"
          >
            <Phone className="w-8 h-8 text-red-400" />
            <span className="text-xs text-red-400">Call 911</span>
          </button>
        </div>

        {/* Voice hint */}
        {isListening && (
          <div className="flex items-center gap-2 bg-red-950/30 border border-red-700/30 rounded-full px-5 py-3 animate-pulse">
            <Mic className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300">Say "Activate CAREN" or "Call 911"</span>
          </div>
        )}

        {!activeVehicle && (
          <button
            onClick={() => setLocation("/ev-connect")}
            className="flex items-center gap-2 text-cyan-400 text-sm border border-cyan-700/30 rounded-full px-4 py-2 bg-cyan-950/20 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4" />
            Connect your EV for speed & battery data
          </button>
        )}

        {/* Safety notice */}
        <div className="flex items-start gap-2 bg-yellow-950/20 border border-yellow-700/20 rounded-xl px-4 py-3 max-w-xs">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-700/80">Keep eyes on the road. Use voice commands or ask a passenger to operate.</p>
        </div>
      </div>
    </div>
  );
}
