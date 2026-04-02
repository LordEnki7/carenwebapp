import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Check, ArrowRight, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { type PLAN_INFO } from "@/lib/featureAccess";
import { Capacitor } from "@capacitor/core";

interface UpgradeSheetProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  requiredPlan: (typeof PLAN_INFO)[number] | null;
}

export default function UpgradeSheet({ open, onClose, featureName, requiredPlan }: UpgradeSheetProps) {
  const [, setLocation] = useLocation();
  const isIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  if (!requiredPlan) return null;

  const handleSeePlans = () => {
    onClose();
    if (isIOS) {
      window.open("https://carenalert.com/payment", "_blank");
    } else {
      setLocation("/pricing");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-gray-900 border border-cyan-500/30 p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-purple-900/60 to-slate-900 p-6 text-center border-b border-purple-500/20">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
            <Lock className="w-6 h-6 text-purple-300" />
          </div>
          <h2 className="text-white font-bold text-lg mb-1">{featureName}</h2>
          <p className="text-gray-400 text-sm">
            This feature is included in the{" "}
            <span className="text-purple-300 font-semibold">{requiredPlan.name}</span>
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm font-medium">{requiredPlan.name}</span>
            <span className="text-cyan-300 font-bold">{requiredPlan.price}</span>
          </div>

          <ul className="space-y-2">
            {requiredPlan.perks.map((perk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={handleSeePlans}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-2"
            >
              {isIOS ? "Subscribe at carenalert.com" : "See All Plans"}
              {isIOS ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-400 hover:text-gray-200 hover:bg-white/5 text-sm"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
