import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import TopBar from "@/components/TopBar";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";
import promoImage1 from "@assets/promo-woman-kitchen.jpg";
import promoImage2 from "@assets/promo-woman-white.jpg";

export default function Pricing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="space-y-6 pb-10">
      <TopBar
        title="Subscription Plans"
        description="Choose the legal protection level that fits your needs"
      />

      <div className="px-6">
        <Link href="/">
          <Button size="sm" className="cyber-button-secondary flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Promo photo banner */}
      <div className="px-6">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 to-blue-950 border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center z-10">
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">Trusted by families everywhere</span>
              <h3 className="text-white text-xl sm:text-2xl font-black leading-tight mb-3">
                Real People.<br />Real Protection.
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                C.A.R.E.N.™ Alert puts 50-state legal rights, AI assistance, and attorney access right in your pocket — ready the moment you need it.
              </p>
              <div className="flex gap-1 mb-1">
                {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-base">★</span>)}
              </div>
              <p className="text-gray-500 text-xs">"Finally, protection I can carry anywhere." — C.A.R.E.N. user</p>
            </div>
            <div className="sm:w-64 flex gap-2 p-3 shrink-0">
              <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg">
                <img src={promoImage1} alt="C.A.R.E.N. user" className="w-full h-full object-cover object-top" style={{ maxHeight: "220px" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg">
                <img src={promoImage2} alt="C.A.R.E.N. user" className="w-full h-full object-cover object-top" style={{ maxHeight: "220px" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6">
        <SubscriptionPlans currentTier={user?.subscriptionTier || "free"} />
      </div>
    </div>
  );
}
