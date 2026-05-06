import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car, Zap, Wifi, WifiOff, Battery, MapPin, Gauge, RefreshCw,
  ChevronLeft, CheckCircle, AlertCircle, Clock, Unlink, Navigation
} from "lucide-react";

const MANUFACTURERS = [
  {
    id: "tesla",
    name: "Tesla",
    logo: "⚡",
    color: "from-red-600 to-red-800",
    border: "border-red-500/40",
    bg: "bg-red-950/30",
    supported: true,
    models: "Model S, 3, X, Y, Cybertruck",
  },
  {
    id: "ford",
    name: "Ford",
    logo: "🔵",
    color: "from-blue-600 to-blue-800",
    border: "border-blue-500/40",
    bg: "bg-blue-950/30",
    supported: false,
    models: "Mustang Mach-E, F-150 Lightning",
  },
  {
    id: "gm",
    name: "GM / Chevy",
    logo: "🟡",
    color: "from-yellow-600 to-yellow-800",
    border: "border-yellow-500/40",
    bg: "bg-yellow-950/30",
    supported: false,
    models: "Bolt, Equinox EV, Blazer EV",
  },
  {
    id: "rivian",
    name: "Rivian",
    logo: "🟢",
    color: "from-green-600 to-green-800",
    border: "border-green-500/40",
    bg: "bg-green-950/30",
    supported: false,
    models: "R1T, R1S",
  },
  {
    id: "hyundai",
    name: "Hyundai / Kia",
    logo: "🔷",
    color: "from-cyan-600 to-cyan-800",
    border: "border-cyan-500/40",
    bg: "bg-cyan-950/30",
    supported: false,
    models: "IONIQ 5/6, EV6, EV9",
  },
  {
    id: "bmw",
    name: "BMW",
    logo: "⬜",
    color: "from-slate-500 to-slate-700",
    border: "border-slate-500/40",
    bg: "bg-slate-950/30",
    supported: false,
    models: "i3, i4, iX, i7",
  },
];

interface VehicleData {
  batteryLevel?: number;
  range?: number;
  speed?: number;
  latitude?: number;
  longitude?: number;
  isLocked?: boolean;
  isCharging?: boolean;
  odometer?: number;
  temperature?: number;
}

interface ConnectedVehicle {
  id: number;
  manufacturer: string;
  displayName: string;
  model: string;
  year: string;
  color: string;
  isActive: boolean;
  lastSynced: string;
  vehicleData: string | null;
}

export default function EVConnect() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistManufacturer, setWaitlistManufacturer] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);

  const { data: vehicles = [], isLoading, refetch } = useQuery<ConnectedVehicle[]>({
    queryKey: ["/api/ev/vehicles"],
    enabled: isAuthenticated,
  });

  const disconnectMutation = useMutation({
    mutationFn: (vehicleId: number) => apiRequest("DELETE", `/api/ev/vehicles/${vehicleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ev/vehicles"] });
      toast({ title: "Vehicle disconnected", description: "Your EV has been unlinked from C.A.R.E.N." });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (vehicleId: number) => apiRequest("POST", `/api/ev/vehicles/${vehicleId}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ev/vehicles"] });
      toast({ title: "Synced", description: "Vehicle data updated." });
    },
  });

  const waitlistMutation = useMutation({
    mutationFn: (data: { manufacturer: string; email: string }) =>
      apiRequest("POST", "/api/ev/waitlist", data),
    onSuccess: () => {
      setShowWaitlist(false);
      toast({ title: "You're on the list!", description: "We'll notify you when your EV brand is supported." });
    },
  });

  const handleConnect = (manufacturer: string) => {
    if (manufacturer === "tesla") {
      window.location.href = "/api/ev/tesla/auth";
    } else {
      setWaitlistManufacturer(manufacturer);
      setShowWaitlist(true);
    }
  };

  const parseVehicleData = (raw: string | null): VehicleData => {
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  };

  const getBatteryColor = (pct?: number) => {
    if (!pct) return "text-slate-400";
    if (pct > 60) return "text-green-400";
    if (pct > 25) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setLocation("/dashboard")} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">EV Connect</h1>
          <p className="text-xs text-slate-400">Link your electric vehicle to C.A.R.E.N.</p>
        </div>
        <Zap className="w-6 h-6 text-cyan-400" />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Why connect banner */}
        <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-700/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg mt-0.5">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-semibold text-cyan-200 mb-1">Why connect your EV?</h2>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>📍 Precise vehicle GPS locked to every incident report</li>
                <li>⚡ Speed & battery auto-logged as evidence</li>
                <li>🚨 Honk horn & flash lights as emergency signals</li>
                <li>🎙️ Activate C.A.R.E.N. by voice through your car</li>
                <li>💥 Auto-record on collision detection</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Connected vehicles */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : vehicles.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Connected Vehicles</h2>
            {vehicles.map((v) => {
              const data = parseVehicleData(v.vehicleData);
              const mfr = MANUFACTURERS.find(m => m.id === v.manufacturer);
              return (
                <div key={v.id} className={`border ${mfr?.border ?? "border-slate-700"} ${mfr?.bg ?? "bg-slate-900/50"} rounded-2xl p-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{mfr?.logo}</span>
                        <span className="font-bold text-white">{v.displayName || `${v.year} ${v.model}`}</span>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" /> Connected
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {v.color && `${v.color} · `}{v.model} {v.year}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => syncMutation.mutate(v.id)}
                        disabled={syncMutation.isPending}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        title="Sync now"
                      >
                        <RefreshCw className={`w-4 h-4 text-slate-300 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        onClick={() => disconnectMutation.mutate(v.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-900/50 transition-colors"
                        title="Disconnect"
                      >
                        <Unlink className="w-4 h-4 text-slate-300" />
                      </button>
                    </div>
                  </div>

                  {/* Live data */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                      <Battery className={`w-5 h-5 mx-auto mb-1 ${getBatteryColor(data.batteryLevel)}`} />
                      <p className={`text-sm font-bold ${getBatteryColor(data.batteryLevel)}`}>
                        {data.batteryLevel != null ? `${data.batteryLevel}%` : "—"}
                      </p>
                      <p className="text-xs text-slate-500">Battery</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                      <Navigation className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                      <p className="text-sm font-bold text-cyan-300">
                        {data.range != null ? `${data.range} mi` : "—"}
                      </p>
                      <p className="text-xs text-slate-500">Range</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                      <Gauge className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                      <p className="text-sm font-bold text-purple-300">
                        {data.speed != null ? `${data.speed} mph` : "—"}
                      </p>
                      <p className="text-xs text-slate-500">Speed</p>
                    </div>
                  </div>

                  {v.lastSynced && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last synced {new Date(v.lastSynced).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Connect new vehicle */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {vehicles.length > 0 ? "Add Another Vehicle" : "Connect Your EV"}
          </h2>
          <div className="space-y-3">
            {MANUFACTURERS.map((mfr) => (
              <div
                key={mfr.id}
                className={`border ${mfr.border} ${mfr.bg} rounded-2xl p-4 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mfr.logo}</span>
                  <div>
                    <p className="font-semibold text-white">{mfr.name}</p>
                    <p className="text-xs text-slate-400">{mfr.models}</p>
                  </div>
                </div>
                {mfr.supported ? (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(mfr.id)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white border-0"
                  >
                    <Wifi className="w-4 h-4 mr-1.5" />
                    Connect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConnect(mfr.id)}
                    className="border-slate-600 text-slate-400 hover:bg-slate-800"
                  >
                    <Clock className="w-4 h-4 mr-1.5" />
                    Coming Soon
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Car Mode CTA */}
        <div
          onClick={() => setLocation("/car-mode")}
          className="cursor-pointer bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-5 flex items-center gap-4 hover:border-cyan-600/50 transition-all"
        >
          <div className="p-3 bg-cyan-500/20 rounded-xl">
            <Car className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Enter Car Mode</p>
            <p className="text-sm text-slate-400">Large-button UI for safe in-car use</p>
          </div>
          <ChevronLeft className="w-5 h-5 text-slate-500 rotate-180" />
        </div>

        {/* How Tesla connect works */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            How Tesla connection works
          </h3>
          <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
            <li>Tap "Connect" above</li>
            <li>You'll be taken to Tesla's sign-in page</li>
            <li>Approve C.A.R.E.N. to read your vehicle data</li>
            <li>Your car appears here with live stats</li>
            <li>Incident reports will automatically include vehicle data</li>
          </ol>
          <p className="text-xs text-slate-500 mt-2">C.A.R.E.N. only reads data and sends emergency signals — it cannot drive your car.</p>
        </div>
      </div>

      {/* Waitlist modal */}
      {showWaitlist && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-1">
              {MANUFACTURERS.find(m => m.id === waitlistManufacturer)?.name} — Coming Soon
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Enter your email and we'll notify you the moment your vehicle brand is supported.
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              value={waitlistEmail}
              onChange={e => setWaitlistEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 mb-3 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300"
                onClick={() => setShowWaitlist(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white border-0"
                onClick={() => waitlistMutation.mutate({ manufacturer: waitlistManufacturer, email: waitlistEmail })}
                disabled={!waitlistEmail || waitlistMutation.isPending}
              >
                Notify Me
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
