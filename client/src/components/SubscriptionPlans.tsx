import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import communityImg from "@assets/plan_community_guardian_(1)_1775619240686.png";
import standardImg from "@assets/plan_standard_(1)_1775619240685.png";
import legalShieldImg from "@assets/plan_legal_shield_(1)_1775619240684.png";
import familyImg from "@assets/plan_family_(1)_1775619240675.png";
import enterpriseImg from "@assets/plan_enterprise_(1)_1775619240683.png";

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
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-black/30 shadow-lg"
        >
          <img
            src={plan.image}
            alt={plan.name}
            className="w-full object-cover"
          />
          <div className="p-4">
            <button
              onClick={() => handleSelect(plan)}
              disabled={loadingPlan === plan.id}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${plan.color} disabled:opacity-60`}
            >
              {loadingPlan === plan.id ? "Redirecting…" : plan.label}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
