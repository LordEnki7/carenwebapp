import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Zap, Users, Building, Star, Check, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Capacitor } from "@capacitor/core";
import iapService from "@/lib/iapService";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    id: "community_guardian",
    productId: "com.caren.safetyapp.community_guardian",
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
    id: "standard_plan",
    productId: "com.caren.safetyapp.standard_plan_monthly",
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
    id: "legal_shield",
    productId: "com.caren.safetyapp.legal_shield_monthly",
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
    id: "family_plan",
    productId: "com.caren.safetyapp.family_plan_monthly",
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
    id: "fleet_enterprise",
    productId: "com.caren.safetyapp.fleet_enterprise_monthly",
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
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  const handleSelect = async (planId: string) => {
    if (isNative) {
      setPurchasing(planId);
      try {
        const planKey = planId as any;
        const transaction = await iapService.purchase(planKey);
        if (transaction) {
          toast({ title: "Purchase Complete!", description: "Your plan is now active." });
          setLocation("/dashboard");
        }
      } catch (err: any) {
        const msg: string = err?.message || "";
        if (msg === "USER_CANCELLED" || msg.includes("cancel") || msg.includes("dismiss")) {
          // user closed the sheet — no error shown
        } else {
          toast({ title: "Purchase Failed", description: msg || "Please try again.", variant: "destructive" });
        }
      } finally {
        setPurchasing(null);
      }
    } else {
      setLocation(`/payment?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/dashboard")}
          className="text-gray-400 hover:text-white p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-bold text-white text-base">Choose Your Plan</h1>
          <p className="text-xs text-gray-400">C.A.R.E.N.™ Legal Protection</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Hero */}
        <div className="text-center space-y-2 pb-2">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1 text-cyan-400 text-xs font-medium">
            <Shield className="w-3 h-3" />
            GPS-Enabled Legal Protection
          </div>
          <h2 className="text-2xl font-bold text-white">Know Your Rights.<br />Every Stop. Every State.</h2>
          <p className="text-gray-400 text-sm">Cancel auto-renewable plans anytime from your Apple ID settings.</p>
        </div>

        {/* Plan Cards */}
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isLoading = purchasing === plan.id;

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
                {/* Plan header */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0`}>
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

                {/* Features */}
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Product ID (for App Store reference) */}
                <div className="flex items-center gap-1.5 bg-black/30 rounded-lg px-3 py-1.5">
                  <span className="text-gray-500 text-xs font-mono">{plan.productId}</span>
                </div>

                {/* CTA */}
                <Button
                  className={`w-full font-bold py-3 rounded-xl ${plan.ctaClass}`}
                  onClick={() => handleSelect(plan.id)}
                  disabled={!!purchasing}
                >
                  {isLoading ? "Processing…" : plan.cta}
                </Button>
              </div>
            </div>
          );
        })}

        {/* Footer legal text */}
        <div className="text-center text-xs text-gray-500 space-y-2 pt-2 pb-8">
          <p>
            By subscribing you agree to our{" "}
            <a href="/terms-of-service" className="text-cyan-400 underline">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy-policy" className="text-cyan-400 underline">Privacy Policy</a>.
          </p>
          <p>Auto-renewable subscriptions are charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage and cancel your subscription in your Apple ID Account Settings.</p>
          <a
            href="https://carenalert.com/terms-of-service"
            className="inline-flex items-center gap-1 text-cyan-400 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full Terms of Service <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
