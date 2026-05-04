import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Check, Shield, Zap, Star, Users, Building2, AlertTriangle } from "lucide-react";

const EMERGENCY_FEATURES = new Set([
  "Incident video & audio recording — saved to cloud",
  "Emergency SOS alerts to your contacts instantly",
  "Always-on dashcam mode (10-min rolling buffer)",
  "AI legal assistant — ask anything mid-stop",
  "Attorney matching & direct connect",
  "Real-time voice coaching during a traffic stop",
  "Family emergency notification network",
]);

const COMING_SOON_FEATURES = new Set([
  "Attorney matching & direct connect",
]);

const PLANS = [
  {
    id: "community_guardian",
    name: "Community Guardian",
    price: "$0.99",
    period: "one-time",
    billing: "Pay once — yours forever",
    badge: "EARLY ACCESS",
    badgeColor: "bg-emerald-500 text-black",
    borderColor: "border-emerald-500/40",
    glowColor: "shadow-emerald-900/40",
    headerBg: "from-emerald-950/80 to-black/60",
    icon: Shield,
    iconColor: "text-emerald-400",
    ctaLabel: "Get Early Access",
    ctaClass: "bg-emerald-500 hover:bg-emerald-400 text-black",
    bestFor: "First-timers who want to know their rights today",
    amount: 99,
    highlight: false,
    features: [
      "State-specific legal rights database (all 50 states + DC)",
      "Know your rights during traffic stops",
      "Searchable constitutional protections",
      "467+ legal protections in one place",
    ],
    notIncluded: ["Recording", "Emergency SOS", "Attorney connect", "AI features"],
  },
  {
    id: "standard",
    name: "Standard Plan",
    price: "$4.99",
    period: "/month",
    billing: "Cancel anytime",
    badge: null,
    badgeColor: "",
    borderColor: "border-cyan-500/40",
    glowColor: "shadow-cyan-900/30",
    headerBg: "from-cyan-950/80 to-black/60",
    icon: Zap,
    iconColor: "text-cyan-400",
    ctaLabel: "Start Standard",
    ctaClass: "bg-cyan-500 hover:bg-cyan-400 text-black",
    bestFor: "Solo drivers who want full protection on every drive",
    amount: 499,
    highlight: false,
    features: [
      "State-specific legal rights database (all 50 states + DC)",
      "Know your rights during traffic stops",
      "Searchable constitutional protections",
      "GPS-aware rights that update as you move state to state",
      "Voice-activated rights — completely hands-free",
      "Incident video & audio recording — saved to cloud",
      "Emergency SOS alerts to your contacts instantly",
      "Court-ready evidence packages (print to PDF)",
      "Always-on dashcam mode (10-min rolling buffer)",
    ],
    notIncluded: ["AI legal assistant", "Attorney connect", "Voice coaching"],
  },
  {
    id: "legal_shield",
    name: "Legal Shield",
    price: "$9.99",
    period: "/month",
    billing: "Cancel anytime",
    badge: "MOST POPULAR",
    badgeColor: "bg-violet-500 text-white",
    borderColor: "border-violet-500/60",
    glowColor: "shadow-violet-900/50",
    headerBg: "from-violet-950/80 to-black/60",
    icon: Star,
    iconColor: "text-violet-400",
    ctaLabel: "Get Legal Shield",
    ctaClass: "bg-violet-500 hover:bg-violet-400 text-white",
    bestFor: "Anyone who wants an AI lawyer on call 24/7",
    amount: 999,
    highlight: true,
    features: [
      "State-specific legal rights database (all 50 states + DC)",
      "Know your rights during traffic stops",
      "Searchable constitutional protections",
      "GPS-aware rights that update as you move state to state",
      "Voice-activated rights — completely hands-free",
      "Incident video & audio recording — saved to cloud",
      "Emergency SOS alerts to your contacts instantly",
      "Court-ready evidence packages (print to PDF)",
      "Always-on dashcam mode (10-min rolling buffer)",
      "AI legal assistant — ask anything mid-stop",
      "Attorney matching & direct connect",
      "Real-time voice coaching during a traffic stop",
      "AI incident summarizer & detailed reports",
      "Multi-language legal translation (English/Spanish)",
      "Social media incident sharing with AI captions",
    ],
    notIncluded: [],
  },
  {
    id: "family",
    name: "Family Plan",
    price: "$29.99",
    period: "/month",
    billing: "Up to 6 people — one bill",
    badge: "FAMILY",
    badgeColor: "bg-orange-500 text-black",
    borderColor: "border-orange-500/40",
    glowColor: "shadow-orange-900/30",
    headerBg: "from-orange-950/80 to-black/60",
    icon: Users,
    iconColor: "text-orange-400",
    ctaLabel: "Protect My Family",
    ctaClass: "bg-orange-500 hover:bg-orange-400 text-black",
    bestFor: "Families with multiple drivers or young adults",
    amount: 2999,
    highlight: false,
    features: [
      "Everything in Legal Shield — for up to 6 people",
      "Each family member gets their own account & recordings",
      "Family emergency notification network",
      "Shared incident history & recordings",
      "Centralized family dashboard",
      "Priority customer support",
    ],
    notIncluded: [],
  },
  {
    id: "enterprise",
    name: "Fleet & Enterprise",
    price: "$49.99",
    period: "/month",
    billing: "Unlimited accounts",
    badge: "ENTERPRISE",
    badgeColor: "bg-blue-500 text-white",
    borderColor: "border-blue-500/40",
    glowColor: "shadow-blue-900/30",
    headerBg: "from-blue-950/80 to-black/60",
    icon: Building2,
    iconColor: "text-blue-400",
    ctaLabel: "Get Enterprise",
    ctaClass: "bg-blue-500 hover:bg-blue-400 text-white",
    bestFor: "Businesses with drivers or delivery fleets",
    amount: 4999,
    highlight: false,
    features: [
      "Everything in Family Plan — unlimited accounts",
      "Fleet-wide incident monitoring",
      "Admin dashboard & analytics",
      "Compliance & audit reports",
      "Dedicated account manager",
      "Custom API integration",
    ],
    notIncluded: [],
  },
];

interface SubscriptionPlansProps {
  currentTier?: string;
  onUpgrade?: (planId: string) => void;
}

export default function SubscriptionPlans({ currentTier, onUpgrade }: SubscriptionPlansProps) {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelect = async (plan: typeof PLANS[0]) => {
    if (onUpgrade) {
      onUpgrade(plan.id);
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const res = await fetch("/api/subscription/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.amount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create session");
      }

      const { sessionUrl } = await res.json();
      window.location.href = sessionUrl;
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Know exactly what you're getting</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Every feature listed — nothing hidden, nothing buried. Pick the plan that fits your life.
        </p>

        {/* Emergency feature key */}
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 text-xs text-red-300">
          <Shield className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span><strong>Red shield</strong> = critical during a traffic stop or emergency</span>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentTier === plan.id;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 ${
                plan.highlight
                  ? `${plan.borderColor} shadow-2xl ${plan.glowColor} scale-[1.02]`
                  : `${plan.borderColor} shadow-lg ${plan.glowColor}`
              } bg-gray-950`}
            >
              {/* Top badge */}
              {plan.badge && (
                <div className={`absolute top-0 right-0 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-bl-xl z-10 ${plan.badgeColor}`}>
                  {plan.badge}
                </div>
              )}

              {/* Current plan indicator */}
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-br-xl z-10 bg-cyan-400 text-black">
                  ✓ YOUR PLAN
                </div>
              )}

              {/* Header */}
              <div className={`bg-gradient-to-b ${plan.headerBg} px-5 pt-8 pb-5`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{plan.billing}</p>
                    <h3 className="text-white font-bold text-base leading-tight">{plan.name}</h3>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>

                {/* Best for */}
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-300">
                    <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Best for: </span>
                    {plan.bestFor}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 px-5 py-4 space-y-2.5">
                {plan.features.map((feature) => {
                  const isEmergency = EMERGENCY_FEATURES.has(feature);
                  return (
                    <div key={feature} className="flex items-start gap-2.5">
                      <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                        isEmergency
                          ? "bg-red-500/20 border border-red-500/40"
                          : "bg-green-500/20 border border-green-500/30"
                      }`}>
                        {isEmergency
                          ? <Shield className="w-2.5 h-2.5 text-red-400" />
                          : <Check className="w-2.5 h-2.5 text-green-400" />
                        }
                      </div>
                      <span className={`text-sm leading-snug flex items-center gap-1.5 flex-wrap ${isEmergency ? "text-white font-medium" : "text-gray-300"}`}>
                        {feature}
                        {COMING_SOON_FEATURES.has(feature) && (
                          <span className="inline-block text-[9px] font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5 leading-none">
                            COMING SOON
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}

                {/* Not included */}
                {plan.notIncluded.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-white/5 space-y-1.5">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Not included</p>
                    {plan.notIncluded.map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <div className="w-3 h-[1.5px] bg-gray-700 rounded" />
                        </div>
                        <span className="text-xs text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="px-5 pb-5 pt-2">
                <button
                  onClick={() => handleSelect(plan)}
                  disabled={loadingPlan === plan.id || isCurrentPlan}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    isCurrentPlan
                      ? "bg-white/5 text-gray-400 border border-white/10 cursor-default"
                      : plan.ctaClass
                  } disabled:opacity-60`}
                >
                  {loadingPlan === plan.id
                    ? "Redirecting to checkout…"
                    : isCurrentPlan
                    ? "✓ Your Current Plan"
                    : plan.ctaLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust bar */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-green-500" /> Secure Stripe checkout
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-green-500" /> Cancel anytime from your account
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-green-500" /> Protection starts immediately
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-green-500" /> No hidden fees
        </span>
      </div>

      {/* Upgrade callout */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl px-5 py-4 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/80 leading-relaxed">
          <strong className="text-amber-300">Planning ahead matters.</strong> Emergency SOS, incident recording, and attorney connect are not available on the Community Guardian plan. If you're pulled over tonight, you want at minimum the Standard Plan active before it happens — not after.
        </div>
      </div>
    </div>
  );
}
