import { useState, useEffect, useRef } from "react";
import { Car, ChevronDown, Shield, Video, Scale, MapPin, FileText, Wrench } from "lucide-react";
import { useLocation } from "wouter";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";

interface PanicHomeProps {
  onShowFullDashboard: () => void;
  isEmergencyMode?: boolean;
}

const COUNTDOWN_SECONDS = 3;

const shortcuts = [
  { label: "De-Escalation", icon: Shield, href: "/de-escalation-guide", color: "#f59e0b" },
  { label: "Record", icon: Video, href: "/record", color: "#3b82f6" },
  { label: "Know Rights", icon: Scale, href: "/rights", color: "#8b5cf6" },
  { label: "Attorneys", icon: Scale, href: "/attorneys", color: "#06b6d4" },
  { label: "Legal Map", icon: MapPin, href: "/legal-rights-map", color: "#10b981" },
  { label: "Complaint", icon: FileText, href: "/file-complaint", color: "#f97316" },
  { label: "Roadside", icon: Wrench, href: "/roadside-assistance", color: "#6366f1" },
];

export default function PanicHome({ onShowFullDashboard }: PanicHomeProps) {
  const [, setLocation] = useLocation();
  const { location } = useGeolocation();
  const { toast } = useToast();

  const [activating, setActivating] = useState(false);
  const [progress, setProgress] = useState(0);
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
      // silent
    }
    toast({
      title: "🆘 Alert sent — contacts notified",
      description: "Camera is starting now",
      variant: "destructive",
    });
    setLocation("/record?autostart=video&emergency=true");
  };

  const handlePulledOver = () => {
    if (activating) { clearActivation(); return; }
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
    <div className="fixed inset-0 flex flex-col bg-[#070b14]">

      {/* THE ONE BUTTON — fills most of the screen */}
      <button
        onClick={handlePulledOver}
        data-testid="btn-panic-pulled-over"
        className="flex-1 w-full relative overflow-hidden select-none touch-none"
        style={{
          background: activating
            ? 'linear-gradient(160deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)'
            : 'linear-gradient(160deg, #b91c1c 0%, #7f1d1d 50%, #450a0a 100%)',
          transition: 'background 0.3s ease',
        }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.06) 40px, rgba(255,255,255,0.06) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.06) 40px, rgba(255,255,255,0.06) 41px)',
        }} />
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(239,68,68,0.5) 0%, transparent 70%)',
        }} />

        <div className="relative h-full flex flex-col items-center justify-center gap-6 px-8">
          {activating ? (
            <>
              <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center animate-pulse">
                <Car className="w-12 h-12 text-white" />
              </div>
              <div className="text-center">
                <p className="text-white/70 text-lg font-bold tracking-widest uppercase">Alerting in</p>
                <p className="text-white font-black tabular-nums" style={{ fontSize: '96px', lineHeight: 1 }}>
                  {secondsLeft}
                </p>
                <p className="text-red-200/70 text-base mt-2">Tap to cancel</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                <Car className="w-12 h-12 text-white" />
              </div>
              <div className="text-center">
                <p className="text-white/60 text-base font-semibold tracking-[0.2em] uppercase mb-2">
                  I'm Being
                </p>
                <p className="text-white font-black leading-none tracking-tight"
                  style={{ fontSize: 'clamp(2.8rem, 12vw, 5rem)' }}>
                  PULLED OVER
                </p>
                <p className="text-red-200/50 text-sm mt-4 leading-relaxed">
                  Tap to alert contacts &amp; start recording
                </p>
              </div>
            </>
          )}
        </div>

        {activating && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/40">
            <div className="h-full bg-white/80 transition-none" style={{ width: `${progress}%` }} />
          </div>
        )}
        {!activating && (
          <div className="absolute inset-4 rounded-lg border border-white/10 pointer-events-none animate-pulse" />
        )}
      </button>

      {/* Quick-access shortcuts */}
      <div className="bg-[#0a0f1e] border-t border-white/10 px-3 py-3">
        <p className="text-white/30 text-[10px] font-semibold tracking-widest uppercase text-center mb-2">
          Quick Access
        </p>
        <div className="grid grid-cols-4 gap-2">
          {shortcuts.slice(0, 4).map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.href}
                onClick={() => setLocation(s.href)}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl active:scale-95 transition-transform"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}33` }}
              >
                <Icon size={18} style={{ color: s.color }} />
                <span className="text-[10px] font-semibold text-white/70 text-center leading-tight">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {shortcuts.slice(4).map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.href}
                onClick={() => setLocation(s.href)}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl active:scale-95 transition-transform"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}33` }}
              >
                <Icon size={18} style={{ color: s.color }} />
                <span className="text-[10px] font-semibold text-white/70 text-center leading-tight">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full dashboard access */}
      <button
        onClick={onShowFullDashboard}
        data-testid="btn-show-dashboard"
        className="w-full py-4 flex items-center justify-center gap-2 bg-[#0d1420] border-t border-white/10 hover:bg-[#111a2c] active:bg-[#1a2540] transition-colors"
      >
        <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">Full Dashboard</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/40" />
      </button>
    </div>
  );
}
