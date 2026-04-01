import { useState, useEffect, useRef } from "react";
import { Car, ChevronDown } from "lucide-react";
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
    <div className="fixed inset-0 flex flex-col bg-[#070b14]">

      {/* THE ONE BUTTON — fills almost the entire screen */}
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
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.06) 40px, rgba(255,255,255,0.06) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.06) 40px, rgba(255,255,255,0.06) 41px)',
          }}
        />

        {/* Radial glow behind content */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(239,68,68,0.5) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
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
                <p
                  className="text-white font-black leading-none tracking-tight"
                  style={{ fontSize: 'clamp(2.8rem, 12vw, 5rem)' }}
                >
                  PULLED OVER
                </p>
                <p className="text-red-200/50 text-sm mt-4 leading-relaxed">
                  Tap to alert contacts &amp; start recording
                </p>
              </div>
            </>
          )}
        </div>

        {/* Progress bar at bottom */}
        {activating && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/40">
            <div
              className="h-full bg-white/80 transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Outer pulsing ring when idle */}
        {!activating && (
          <div className="absolute inset-4 rounded-lg border border-white/10 pointer-events-none animate-pulse" />
        )}
      </button>

      {/* Slim bottom strip — just enough to access the full dashboard */}
      <button
        onClick={onShowFullDashboard}
        data-testid="btn-show-dashboard"
        className="w-full py-4 flex items-center justify-center gap-2 bg-[#0d1420] border-t border-white/5 hover:bg-[#111a2c] transition-colors"
      >
        <span className="text-white/30 text-xs font-medium tracking-widest uppercase">More Options</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/20" />
      </button>
    </div>
  );
}
