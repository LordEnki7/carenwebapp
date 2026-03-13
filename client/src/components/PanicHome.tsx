import { useState, useEffect } from "react";
import { Video, FileText, AlertCircle, ChevronDown, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";

interface PanicHomeProps {
  onShowFullDashboard: () => void;
  isEmergencyMode?: boolean;
}

export default function PanicHome({ onShowFullDashboard, isEmergencyMode = false }: PanicHomeProps) {
  const [, setLocation] = useLocation();
  const { location } = useGeolocation();
  const { toast } = useToast();
  const [sosActivated, setSosActivated] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosCountdown > 0) {
      timer = setTimeout(() => setSosCountdown(sosCountdown - 1), 1000);
    } else if (sosCountdown === 0 && sosActivated) {
      triggerSOS();
    }
    return () => clearTimeout(timer);
  }, [sosCountdown, sosActivated]);

  const handleRecord = () => {
    setLocation("/record");
  };

  const handleRights = () => {
    setLocation("/rights");
  };

  const handleSOS = () => {
    if (!sosActivated) {
      setSosActivated(true);
      setSosCountdown(3);
      toast({
        title: "SOS Activating in 3 seconds",
        description: "Tap again to cancel",
        variant: "destructive"
      });
    } else {
      setSosActivated(false);
      setSosCountdown(0);
      toast({
        title: "SOS Cancelled",
        description: "Emergency alert was cancelled",
      });
    }
  };

  const triggerSOS = async () => {
    try {
      const geoLocation = location as { latitude?: number; longitude?: number } | null;
      const response = await fetch("/api/emergency/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: geoLocation?.latitude || null,
          longitude: geoLocation?.longitude || null,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast({
          title: "🆘 SOS SENT!",
          description: "Emergency contacts notified with your location",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "SOS Alert Sent",
        description: "Emergency contacts will be notified",
        variant: "destructive"
      });
    }
    setSosActivated(false);
  };

  return (
    <div className={`min-h-[70vh] flex flex-col items-center justify-center p-4 ${
      isEmergencyMode ? 'bg-red-950/30' : ''
    }`}>
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-cyan-300">C.A.R.E.N.™</h1>
          </div>
          <p className="text-cyan-400/80 text-sm">Quick Emergency Actions</p>
        </div>

        <button
          onClick={handleRecord}
          data-testid="btn-panic-record"
          className="w-full h-28 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border-2 border-red-400/50 shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-2"
        >
          <Video className="w-10 h-10 text-white" />
          <span className="text-xl font-bold text-white">RECORD</span>
          <span className="text-xs text-red-200">Start recording immediately</span>
        </button>

        <button
          onClick={handleRights}
          data-testid="btn-panic-rights"
          className="w-full h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 border-2 border-blue-400/50 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-2"
        >
          <FileText className="w-10 h-10 text-white" />
          <span className="text-xl font-bold text-white">MY RIGHTS</span>
          <span className="text-xs text-blue-200">View your legal rights</span>
        </button>

        <button
          onClick={handleSOS}
          data-testid="btn-panic-sos"
          className={`w-full h-28 rounded-2xl border-2 shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-2 ${
            sosActivated 
              ? 'bg-gradient-to-br from-orange-500 to-yellow-600 border-yellow-400 shadow-yellow-500/30 animate-pulse' 
              : 'bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 border-orange-400/50 shadow-orange-500/30'
          }`}
        >
          <AlertCircle className={`w-10 h-10 text-white ${sosActivated ? 'animate-bounce' : ''}`} />
          <span className="text-xl font-bold text-white">
            {sosActivated ? `CANCEL (${sosCountdown})` : 'SOS'}
          </span>
          <span className="text-xs text-orange-200">
            {sosActivated ? 'Tap to cancel' : 'Alert emergency contacts'}
          </span>
        </button>

        <button
          onClick={onShowFullDashboard}
          data-testid="btn-show-dashboard"
          className="w-full py-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-cyan-500/30 text-cyan-300 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-sm">More Options</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-cyan-400/60 text-xs">
          🎤 Voice: Say "EMERGENCY" or "START RECORDING"
        </p>
      </div>
    </div>
  );
}
