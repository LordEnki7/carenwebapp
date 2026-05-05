import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Zap, Users, Building, Star, Check, ArrowLeft, ExternalLink, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/hooks/use-toast";
import iapService, { type PlanId } from "@/lib/iapService";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import promoImage1 from "@assets/promo-woman-kitchen.jpg";
import promoImage2 from "@assets/promo-woman-white.jpg";

const PLANS = [
  {
    id: "community_guardian" as PlanId,
    productId: "com.caren.safetyapp.community_guardian_v2",
    name: "Community Guardian",
    price: "$0.99",
    period: "one-time",
    type: "Non-Consumable",
    badge: "EARLY ACCESS",
    badgeColor: "bg-emerald-500",
    icon: Shield,
    iconColor: "text-emerald-400",
    ringColor: "ring-emerald-500/40",
    glowColor: "from-emerald-900/30",
    description: "One-time Early Access pass — essential legal rights lookup for your state.",
    features: [
      "State-specific legal rights database",
      "Know your rights during traffic stops",
      "Searchable constitutional protections",
      "Lifetime access — pay once",
    ],
    cta: "Get Early Access",
    ctaClass: "bg-emerald-500 hover:bg-emerald-400 text-black",
  },
  {
    id: "standard_plan" as PlanId,
    productId: "com.caren.safetyapp.standard_plan_monthly_v3",
    name: "Standard Plan",
    price: "$4.99",
    period: "/month",
    type: "Auto-Renewable",
    badge: null,
    badgeColor: "",
    icon: Zap,
    iconColor: "text-cyan-400",
    ringColor: "ring-cyan-500/40",
    glowColor: "from-cyan-900/20",
    description: "GPS-enabled legal rights, voice commands, and incident recording.",
    features: [
      "Everything in Community Guardian",
      "GPS-aware legal rights by location",
      "Voice-activated constitutional rights",
      "Incident recording & evidence storage",
      "Emergency SOS alerts",
    ],
    cta: "Start Standard",
    ctaClass: "bg-cyan-500 hover:bg-cyan-400 text-black",
  },
  {
    id: "legal_shield" as PlanId,
    productId: "com.caren.safetyapp.legal_shield_monthly_v3",
    name: "Legal Shield",
    price: "$9.99",
    period: "/month",
    type: "Auto-Renewable",
    badge: "MOST POPULAR",
    badgeColor: "bg-violet-500",
    icon: Star,
    iconColor: "text-violet-400",
    ringColor: "ring-violet-500/40",
    glowColor: "from-violet-900/30",
    description: "Full AI-powered protection suite with attorney connect.",
    features: [
      "Everything in Standard Plan",
      "AI legal assistant (real-time Q&A)",
      "Attorney matching & direct connect",
      "Real-time voice coaching during stops",
      "AI incident summarizer & reports",
      "Multi-language legal translation",
    ],
    cta: "Get Legal Shield",
    ctaClass: "bg-violet-500 hover:bg-violet-400 text-white",
  },
  {
    id: "family_plan" as PlanId,
    productId: "com.caren.safetyapp.family_plan_monthly_v3",
    name: "Family Plan",
    price: "$29.99",
    period: "/month",
    type: "Auto-Renewable",
    badge: null,
    badgeColor: "",
    icon: Users,
    iconColor: "text-orange-400",
    ringColor: "ring-orange-500/40",
    glowColor: "from-orange-900/20",
    description: "Protect your entire family with up to 6 linked accounts.",
    features: [
      "Everything in Legal Shield",
      "Up to 6 family member accounts",
      "Family emergency notification network",
      "Shared incident history & recordings",
      "Centralized family dashboard",
      "Priority support",
    ],
    cta: "Protect My Family",
    ctaClass: "bg-orange-500 hover:bg-orange-400 text-black",
  },
  {
    id: "fleet_enterprise" as PlanId,
    productId: "com.caren.safetyapp.fleet_enterprise_monthly_v3",
    name: "Fleet & Enterprise",
    price: "$49.99",
    period: "/month",
    type: "Auto-Renewable",
    badge: "ENTERPRISE",
    badgeColor: "bg-blue-500",
    icon: Building,
    iconColor: "text-blue-400",
    ringColor: "ring-blue-500/40",
    glowColor: "from-blue-900/20",
    description: "Fleet-wide legal protection for businesses.",
    features: [
      "Everything in Family Plan",
      "Unlimited fleet accounts",
      "Fleet-wide incident monitoring",
      "Admin dashboard & analytics",
      "Compliance & audit reports",
      "Dedicated account manager",
      "Custom API integration",
    ],
    cta: "Get Enterprise",
    ctaClass: "bg-blue-500 hover:bg-blue-400 text-white",
  },
];

export default function Plans() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const iapAvailable = iapService.isAvailable();
  const isNewSignup = new URLSearchParams(window.location.search).get('new') === 'true';

  const [purchasing, setPurchasing] = useState<PlanId | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isIOS && iapAvailable) {
      iapService.initialize().catch(console.error);
    }
  }, [isIOS, iapAvailable]);

  const handleSelect = async (planId: PlanId) => {
    if (!isIOS) {
      // Web — use Stripe checkout
      setLocation(`/payment?plan=${planId}`);
      return;
    }

    if (!iapAvailable) {
      // iOS but RevenueCat key not bundled into this build.
      // Be honest about the cause — do NOT pretend it's "coming in a future update".
      toast({
        title: "In-App Subscriptions Not Available",
        description: "This build does not have the in-app purchase key configured. Please subscribe at carenalert.com or update the app to the latest version.",
        variant: "destructive",
      });
      return;
    }

    setPurchasing(planId);
    try {
      const result = await iapService.purchase(planId);
      if (result.success) {
        toast({
          title: "Welcome to C.A.R.E.N.™ Alert!",
          description: "Your subscription is now active.",
        });
        setLocation("/dashboard");
      } else if (result.error !== "cancelled") {
        toast({
          title: "Purchase Failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    if (!isIOS || !iapAvailable) return;
    setRestoring(true);
    try {
      const restored = await iapService.restorePurchases();
      toast({
        title: restored ? "Purchases Restored" : "Nothing to Restore",
        description: restored
          ? "Your subscription has been restored."
          : "No previous purchases found for your Apple ID.",
      });
      if (restored) setLocation("/dashboard");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      {/* Header */}
      {isNewSignup && (
        <div className="bg-emerald-600 text-white text-center py-3 px-4">
          <p className="text-sm font-bold">One last step — activate your account</p>
          <p className="text-xs text-emerald-100 mt-0.5">Your account is ready. Choose a plan below to get started. Early Access is just $0.99 one-time.</p>
        </div>
      )}
      <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        {!isNewSignup && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="text-gray-400 hover:text-white p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="font-bold text-white text-base">{isNewSignup ? "Activate Your Account" : "Choose Your Plan"}</h1>
          <p className="text-xs text-gray-400">{isNewSignup ? "Select a plan to complete signup" : "C.A.R.E.N.™ Alert Legal Protection"}</p>
        </div>
        {isIOS && iapAvailable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestore}
            disabled={restoring}
            className="text-cyan-400 hover:text-cyan-300 text-xs gap-1.5"
          >
            {restoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            Restore
          </Button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        {/* Hero */}
        <div className="text-center space-y-2 pb-2">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1 text-cyan-400 text-xs font-medium">
            <Shield className="w-3 h-3" />
            GPS-Enabled Legal Protection
          </div>
          <h2 className="text-2xl font-bold text-white">Know Your Rights.<br />Every Stop. Every State.</h2>
          <p className="text-gray-400 text-sm">
            {isIOS
              ? "Subscriptions managed through your Apple ID. Cancel anytime."
              : "Cancel auto-renewable plans anytime from your account settings."}
          </p>
        </div>

        {/* Promo photo strip */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            <div className="relative rounded-xl overflow-hidden shadow-xl group">
              <img
                src={promoImage1}
                alt="C.A.R.E.N. Alert user"
                className="w-full object-cover object-top aspect-[3/4] group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-bold text-sm leading-snug">"Finally, protection I can count on."</p>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-xs">★</span>)}
                </div>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-xl group">
              <img
                src={promoImage2}
                alt="C.A.R.E.N. Alert user"
                className="w-full object-cover object-top aspect-[3/4] group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-bold text-sm leading-snug">"My rights in my pocket, always."</p>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-xs">★</span>)}
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-xs text-center mt-3">Join thousands protecting themselves with C.A.R.E.N.™ Alert</p>
        </div>

        {/* Plan Cards — Web uses new design, iOS keeps IAP flow */}
        {!isIOS ? (
          <SubscriptionPlans />
        ) : (
          PLANS.map((plan) => {
            const Icon = plan.icon;
            const isPurchasing = purchasing === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl bg-gradient-to-b ${plan.glowColor} to-gray-900/80 border border-white/10 ring-1 ${plan.ringColor} overflow-hidden`}
              >
                {plan.badge && (
                  <div className={`absolute top-0 right-0 ${plan.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-bl-xl`}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{plan.price}</span>
                        <span className="text-gray-400 text-sm">{plan.period}</span>
                      </div>
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{plan.description}</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="flex items-center gap-1.5 flex-wrap">
                          {f}
                          {f === "Attorney matching & direct connect" && (
                            <span className="inline-block text-[9px] font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5 leading-none">
                              COMING SOON
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full font-bold py-3 rounded-xl ${plan.ctaClass}`}
                    onClick={() => handleSelect(plan.id)}
                    disabled={isPurchasing || !!purchasing}
                  >
                    {isPurchasing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing…
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {/* Footer legal text — required by App Store Guideline 3.1.2(c) */}
        <div className="text-center text-xs text-gray-500 space-y-2 pt-2 pb-8">
          {isIOS && (
            <p>Auto-renewable subscriptions are charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage and cancel your subscription in your Apple ID Account Settings.</p>
          )}
          <p>
            By subscribing you agree to our{" "}
            <a href="/terms" className="text-cyan-400 underline">Terms of Service (EULA)</a>
            {" "}and{" "}
            <a href="/privacy" className="text-cyan-400 underline">Privacy Policy</a>.
          </p>
          <div className="flex justify-center gap-4 pt-1">
            <a
              href="https://carenalert.com/terms"
              className="inline-flex items-center gap-1 text-cyan-400 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service (EULA) <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://carenalert.com/privacy"
              className="inline-flex items-center gap-1 text-cyan-400 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
