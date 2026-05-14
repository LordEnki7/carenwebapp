import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Clock, Zap, X } from "lucide-react";
import { useState } from "react";

export function TrialBanner() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const { data: trial } = useQuery<{
    onTrial: boolean;
    daysLeft: number;
    trialEndsAt: string | null;
    expired: boolean;
  }>({
    queryKey: ["/api/subscription/trial-status"],
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  if (!isAuthenticated || dismissed) return null;

  if (trial?.expired) {
    return (
      <div className="bg-gradient-to-r from-red-900/90 to-rose-900/90 border-b border-red-700/50 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Clock className="w-4 h-4 text-red-300 shrink-0" />
          <p className="text-sm text-red-100 font-medium truncate">
            Your free trial has ended.{" "}
            <span className="text-white font-semibold">Subscribe now to keep full access.</span>
          </p>
        </div>
        <button
          onClick={() => setLocation("/plans")}
          className="shrink-0 bg-white text-red-900 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
        >
          Choose a Plan
        </button>
      </div>
    );
  }

  if (!trial?.onTrial) return null;

  const isLastDay = trial.daysLeft <= 1;
  const isAlmostOver = trial.daysLeft <= 3;

  const bannerClass = isLastDay
    ? "from-amber-900/90 to-orange-900/90 border-amber-700/50"
    : isAlmostOver
    ? "from-orange-900/80 to-amber-900/80 border-orange-700/50"
    : "from-indigo-900/80 to-violet-900/80 border-indigo-700/50";

  const dayText = trial.daysLeft === 1 ? "last day" : `${trial.daysLeft} days`;

  return (
    <div className={`bg-gradient-to-r ${bannerClass} border-b px-4 py-2.5 flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Zap className={`w-4 h-4 shrink-0 ${isAlmostOver ? "text-amber-300" : "text-indigo-300"}`} />
        <p className="text-sm text-white truncate">
          <span className="font-semibold">{isLastDay ? "🚨 Last day of your free trial!" : `✨ ${dayText} left in your free trial`}</span>
          {!isLastDay && <span className="text-white/70 ml-1 hidden sm:inline">— full access to everything</span>}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setLocation("/plans")}
          className="bg-white/90 hover:bg-white text-indigo-900 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
        >
          Subscribe
        </button>
        {!isAlmostOver && (
          <button
            onClick={() => setDismissed(true)}
            className="text-white/50 hover:text-white/80 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
