import { useState, useEffect, useRef } from "react";
import { Video, FileText, ChevronDown, Shield, Car } from "lucide-react";
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
      // Silent — we still navigate to record even if network fails
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
    <div className="min-h-[85vh] flex flex-col items-center justify-between py-8 px-4 max-w-sm mx-auto">

      {/* Minimal header */}
      <div className="flex items-center gap-2 self-center">
        <Shield className="w-5 h-5 text-cyan-400" />
        <span className="text-cyan-300 font-semibold tracking-wide text-sm">C.A.R.E.N.™</span>
      </div>

      {/* Hero button */}
      <div className="w-full flex-1 flex items-center justify-center py-6">
        <button
          onClick={handlePulledOver}
          data-testid="btn-panic-pulled-over"
          className={`
            relative w-full rounded-3xl overflow-hidden
            transition-all duration-200
            ${activating
              ? 'bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-300 shadow-[0_0_40px_rgba(239,68,68,0.6)]'
              : 'bg-gradient-to-b from-red-600 to-red-900 border-2 border-red-500/50 shadow-[0_0_24px_rgba(239,68,68,0.3)] hover:shadow-[0_0_36px_rgba(239,68,68,0.5)] active:scale-[0.98]'
            }
          `}
          style={{ minHeight: '220px' }}
        >
          {/* Content */}
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10">
            <Car className={`w-14 h-14 text-white ${activating ? 'animate-bounce' : ''}`} />
            <div className="text-center">
              {activating ? (
                <>
                  <p className="text-white text-2xl font-black tracking-tight leading-tight">
                    ALERTING… {secondsLeft}
                  </p>
                  <p className="text-red-200 text-sm mt-1">Tap to cancel</p>
                </>
              ) : (
                <>
                  <p className="text-white text-2xl font-black tracking-tight leading-tight">
                    I'M BEING
                  </p>
                  <p className="text-white text-2xl font-black tracking-tight leading-tight">
                    PULLED OVER
                  </p>
                  <p className="text-red-200 text-xs mt-2">
                    Alerts contacts · Starts recording
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Progress bar — fills from left when counting down */}
          {activating && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-red-900/60">
              <div
                className="h-full bg-white/90 transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </button>
      </div>

      {/* Secondary actions */}
      <div className="w-full grid grid-cols-2 gap-3">
        <button
          onClick={() => setLocation("/record")}
          data-testid="btn-panic-record"
          className="h-20 rounded-2xl bg-gray-800/80 border border-cyan-500/30 hover:border-cyan-400/60 hover:bg-gray-700/80 transition-all duration-200 active:scale-[0.97] flex flex-col items-center justify-center gap-1.5"
        >
          <Video className="w-6 h-6 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Record Only</span>
        </button>

        <button
          onClick={() => setLocation("/rights")}
          data-testid="btn-panic-rights"
          className="h-20 rounded-2xl bg-gray-800/80 border border-blue-500/30 hover:border-blue-400/60 hover:bg-gray-700/80 transition-all duration-200 active:scale-[0.97] flex flex-col items-center justify-center gap-1.5"
        >
          <FileText className="w-6 h-6 text-blue-400" />
          <span className="text-sm font-semibold text-white">My Rights</span>
        </button>
      </div>

      {/* Footer */}
      <button
        onClick={onShowFullDashboard}
        data-testid="btn-show-dashboard"
        className="mt-4 flex items-center gap-1.5 text-cyan-400/60 hover:text-cyan-300 transition-colors text-xs py-2"
      >
        <ChevronDown className="w-3.5 h-3.5" />
        <span>Full Dashboard</span>
      </button>
    </div>
  );
}
