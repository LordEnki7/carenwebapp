import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import communityImg from "@assets/caren-logo.png";
import standardImg from "@assets/caren_webapp_logo_1750345968202.png";
import legalShieldImg from "@assets/Gemini_Generated_Image_ghbsjghbsjghbsjg_1751079553418.png";
import familyImg from "@assets/Caren_backsplash_1750345968199.png";
import enterpriseImg from "@assets/Gemini_Generated_Image_daljtddaljtddalj_1751075708889.png";

const plans = [
  {
    id: "community_guardian",
    name: "Community Guardian",
    amount: 99,
    label: "Get Early Access",
    color: "bg-emerald-500 hover:bg-emerald-600",
    image: communityImg,
  },
  {
    id: "standard",
    name: "Standard Plan",
    amount: 499,
    label: "Start Standard",
    color: "bg-white hover:bg-gray-100 text-gray-900",
    image: standardImg,
  },
  {
    id: "legal_shield",
    name: "Legal Shield",
    amount: 999,
    label: "Get Legal Shield",
    color: "bg-purple-600 hover:bg-purple-700",
    image: legalShieldImg,
  },
  {
    id: "family",
    name: "Family Plan",
    amount: 2999,
    label: "Protect My Family",
    color: "bg-orange-500 hover:bg-orange-600",
    image: familyImg,
  },
  {
    id: "enterprise",
    name: "Fleet & Enterprise",
    amount: 4999,
    label: "Get Enterprise",
    color: "bg-blue-600 hover:bg-blue-700",
    image: enterpriseImg,
  },
];

interface SubscriptionPlansProps {
  currentTier?: string;
  onUpgrade?: (planId: string) => void;
}

export default function SubscriptionPlans({ currentTier, onUpgrade }: SubscriptionPlansProps) {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelect = async (plan: typeof plans[0]) => {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = currentTier === plan.id;
        return (
          <div
            key={plan.id}
            className={`flex flex-col rounded-2xl overflow-hidden shadow-lg transition-all ${
              isCurrentPlan
                ? "border-2 border-cyan-400 ring-2 ring-cyan-400/30"
                : "border border-white/10"
            } bg-black/30`}
          >
            <div className="relative">
              <img
                src={plan.image}
                alt={plan.name}
                className="w-full object-cover"
              />
              {isCurrentPlan && (
                <div className="absolute top-3 left-3 bg-cyan-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  ✓ Your Plan
                </div>
              )}
            </div>
            <div className="p-4">
              <button
                onClick={() => handleSelect(plan)}
                disabled={loadingPlan === plan.id || isCurrentPlan}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
                  isCurrentPlan
                    ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 cursor-default"
                    : plan.color
                } disabled:opacity-60`}
              >
                {loadingPlan === plan.id
                  ? "Redirecting…"
                  : isCurrentPlan
                  ? "Active Plan"
                  : plan.label}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
