import { useState, useEffect, useRef } from "react";
import { Video, FileText, Shield, Car, Phone, MapPin, Wifi, ChevronRight, AlertTriangle, Radio } from "lucide-react";
import { useLocation } from "wouter";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";

interface PanicHomeProps {
  onShowFullDashboard: () => void;
  isEmergencyMode?: boolean;
}

const COUNTDOWN_SECONDS = 3;

export default function PanicHome({ onShowFullDashboard }: PanicHomeProps) {
  const [, setLocation] = useLocation();
  const { location } = useGeolocation();
  const { toast } = useToast();

  const [activating, setActivating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pulse, setPulse] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearActivation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActivating(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Subtle pulse animation toggle
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  const triggerSOS = async () => {
    const geoLocation = location as { latitude?: number; longitude?: number } | null;
    try {
      await fetch("/api/emergency/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: geoLocation?.latitude ?? null,
          longitude: geoLocation?.longitude ?? null,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Silent — navigate regardless
    }
    toast({
      title: "🆘 Alert sent — contacts notified",
      description: "Camera is starting now",
      variant: "destructive",
    });
    setLocation("/record?autostart=video&emergency=true");
  };

  const handlePulledOver = () => {
    if (activating) {
      clearActivation();
      return;
    }
    setActivating(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const pct = Math.min((elapsed / COUNTDOWN_SECONDS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current!);
        setActivating(false);
        setProgress(0);
        triggerSOS();
      }
    }, 50);
  };

  const secondsLeft = activating
    ? Math.max(0, Math.ceil(COUNTDOWN_SECONDS - (progress / 100) * COUNTDOWN_SECONDS))
    : COUNTDOWN_SECONDS;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#070b14] overflow-hidden relative">

      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className={`absolute bottom-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-3xl transition-opacity duration-1000 ${activating ? 'bg-red-600/20 opacity-100' : 'bg-red-500/8 opacity-60'}`} />
      </div>

      {/* Top status bar */}
      <div className="relative z-10 px-5 pt-safe pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-cyan-300 font-bold text-xs tracking-widest uppercase">C.A.R.E.N.™</p>
            <p className="text-cyan-500/60 text-[10px] tracking-wide">Protection Active</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-[11px] font-medium">GPS</span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400 text-[11px] font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-4 gap-6">

        {/* Hero button */}
        <div className="w-full flex flex-col items-center gap-3">

          {/* Label above */}
          <p className="text-white/40 text-xs tracking-[0.25em] uppercase font-medium">
            {activating ? 'Release to cancel' : 'Hold to activate'}
          </p>

          {/* The main button */}
          <button
            onClick={handlePulledOver}
            data-testid="btn-panic-pulled-over"
            className="relative w-full rounded-[28px] overflow-hidden select-none touch-none"
            style={{ minHeight: '200px' }}
          >
            {/* Outer glow ring */}
            <div className={`absolute inset-0 rounded-[28px] transition-all duration-300 ${
              activating
                ? 'shadow-[0_0_0_3px_rgba(239,68,68,0.8),0_0_60px_rgba(239,68,68,0.5)]'
                : `shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_0_30px_rgba(239,68,68,0.15)] ${pulse ? 'shadow-[0_0_0_2px_rgba(239,68,68,0.4),0_0_40px_rgba(239,68,68,0.25)]' : ''}`
            }`} />

            {/* Background */}
            <div className={`absolute inset-0 rounded-[28px] transition-all duration-300 ${
              activating
                ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-800'
                : 'bg-gradient-to-br from-red-700/90 via-red-800 to-red-950'
            }`} />

            {/* Scan line overlay */}
            <div className="absolute inset-0 rounded-[28px] overflow-hidden opacity-20">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border-b border-white/5" style={{ height: '12.5%' }} />
              ))}
            </div>

            {/* Content */}
            <div className="relative flex flex-col items-center justify-center gap-4 px-8 py-10">

              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                activating ? 'bg-white/20 scale-110' : 'bg-white/10'
              }`}>
                {activating
                  ? <Radio className="w-9 h-9 text-white animate-pulse" />
                  : <Car className="w-9 h-9 text-white" />
                }
              </div>

              {/* Text */}
              {activating ? (
                <div className="text-center">
                  <p className="text-white text-3xl font-black tracking-tight">ALERTING</p>
                  <p className="text-white text-5xl font-black tabular-nums mt-1">{secondsLeft}</p>
                  <p className="text-red-200/80 text-sm mt-2">Tap anywhere to cancel</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-white/70 text-sm font-semibold tracking-[0.15em] uppercase mb-1">I'm Being</p>
                  <p className="text-white text-[2.2rem] font-black tracking-tight leading-none">PULLED OVER</p>
                  <p className="text-red-200/60 text-xs mt-3 leading-relaxed">
                    Notifies contacts · Starts recording · Logs location
                  </p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {activating && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-950/80">
                <div
                  className="h-full bg-white/90 transition-none rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </button>
        </div>

        {/* Quick action row */}
        <div className="w-full grid grid-cols-3 gap-3">
          <button
            onClick={() => setLocation("/record")}
            data-testid="btn-panic-record"
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-cyan-500/30 active:scale-95 transition-all duration-150"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
              <Video className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-white/80 text-xs font-semibold">Record</span>
          </button>

          <button
            onClick={() => setLocation("/rights")}
            data-testid="btn-panic-rights"
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-blue-500/30 active:scale-95 transition-all duration-150"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/80 text-xs font-semibold">My Rights</span>
          </button>

          <button
            onClick={() => setLocation("/attorney")}
            data-testid="btn-panic-attorney"
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-purple-500/30 active:scale-95 transition-all duration-150"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/80 text-xs font-semibold">Attorney</span>
          </button>
        </div>

        {/* Safety tip */}
        <div className="w-full flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-200/70 text-xs leading-relaxed">
            <span className="text-amber-300 font-semibold">Stay calm.</span>{" "}
            Hands on the wheel. Inform the officer before reaching for anything.
          </p>
        </div>
      </div>

      {/* Bottom nav strip */}
      <div className="relative z-10 pb-safe pb-4 px-5">
        <button
          onClick={onShowFullDashboard}
          data-testid="btn-show-dashboard"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 transition-all duration-150"
        >
          <span className="text-white/40 text-xs font-medium tracking-wide">Full Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
        </button>
      </div>
    </div>
  );
}
