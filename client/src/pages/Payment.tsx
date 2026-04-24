import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, CreditCard, ArrowLeft, Shield, Zap, Users, Building, Star, Home } from "lucide-react";
import { Link } from "wouter";
import { Capacitor } from "@capacitor/core";

const isNativeiOS = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  isOneTime: boolean;
  description: string;
  features: string[];
  icon: any;
  color: string;
}

const plans: Record<string, Plan> = {
  community_guardian: {
    id: "community_guardian",
    name: "Community Guardian",
    price: 0.99,
    period: "one-time",
    isOneTime: true,
    description: "One-time Early Access pass — essential legal rights lookup for your state.",
    features: [
      "State-specific legal rights database",
      "Know your rights during traffic stops",
      "Searchable constitutional protections",
      "Lifetime access — pay once",
    ],
    icon: Shield,
    color: "from-emerald-500 to-teal-500"
  },
  standard_plan: {
    id: "standard_plan",
    name: "Standard Plan",
    price: 4.99,
    period: "/month",
    isOneTime: false,
    description: "GPS-enabled legal rights, voice commands, and incident recording.",
    features: [
      "Everything in Community Guardian",
      "GPS-aware legal rights by location",
      "Voice-activated constitutional rights",
      "Incident recording & evidence storage",
      "Emergency SOS alerts",
    ],
    icon: Zap,
    color: "from-cyan-500 to-blue-500"
  },
  legal_shield: {
    id: "legal_shield",
    name: "Legal Shield",
    price: 9.99,
    period: "/month",
    isOneTime: false,
    description: "Full AI-powered protection suite with attorney connect.",
    features: [
      "Everything in Standard Plan",
      "AI legal assistant (real-time Q&A)",
      "Attorney matching & direct connect",
      "Real-time voice coaching during stops",
      "AI incident summarizer & reports",
      "Multi-language legal translation",
    ],
    icon: Star,
    color: "from-violet-500 to-purple-500"
  },
  family_plan: {
    id: "family_plan",
    name: "Family Plan",
    price: 29.99,
    period: "/month",
    isOneTime: false,
    description: "Protect your entire family with up to 6 linked accounts.",
    features: [
      "Everything in Legal Shield",
      "Up to 6 family member accounts",
      "Family emergency notification network",
      "Shared incident history & recordings",
      "Centralized family dashboard",
      "Priority support",
    ],
    icon: Users,
    color: "from-orange-500 to-amber-500"
  },
  fleet_enterprise: {
    id: "fleet_enterprise",
    name: "Fleet & Enterprise",
    price: 49.99,
    period: "/month",
    isOneTime: false,
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
    icon: Building,
    color: "from-blue-500 to-indigo-500"
  },
};

export default function Payment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const oniOS = isNativeiOS();
  const planId = new URLSearchParams(window.location.search).get('plan') || 'legal_shield';

  useEffect(() => {
    if (oniOS) setLocation('/dashboard');
  }, []);

  if (oniOS) return null;

  const selectedPlan = plans[planId];

  const handlePayment = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    toast({ title: "Redirecting to Secure Checkout", description: "Opening Stripe payment page..." });

    try {
      const response = await apiRequest("POST", "/api/subscription/create-checkout-session", {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: Math.round(selectedPlan.price * 100),
      });

      const data = await response.json();

      const checkoutUrl = data.sessionUrl || data.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error(data.message || "No checkout URL returned");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Could not start checkout. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <h1 className="text-4xl font-bold mb-4">Plan not found</h1>
          <p className="text-gray-400 mb-6">The plan you selected doesn't exist.</p>
          <Link href="/plans">
            <Button>Back to Plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = selectedPlan.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Complete Your {selectedPlan.isOneTime ? "Purchase" : "Subscription"}
            </h1>
            <p className="text-gray-300 text-lg">
              Secure your legal protection with {selectedPlan.name}
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/plans">
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plans
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-gradient-to-r ${selectedPlan.color}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">{selectedPlan.name}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {selectedPlan.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-cyan-400">
                  ${selectedPlan.price}
                </div>
                <div className="text-gray-400">{selectedPlan.isOneTime ? "one-time payment" : "per month"}</div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-white">What's included:</h4>
                {selectedPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Method
              </CardTitle>
              <CardDescription>
                Secure payment processing powered by Stripe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-blue-400">Secure Payment</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Your payment information is encrypted and processed securely through Stripe.
                    We never store your credit card details.
                  </p>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-600/30">
                  <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Accepted Payment Methods</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Card", icon: "💳" },
                      { label: "Apple Pay", icon: "🍎" },
                      { label: "Klarna", icon: "🛍️" },
                      { label: "Link", icon: "🔗" },
                      { label: "Cash App", icon: "💸" },
                      { label: "Amazon Pay", icon: "📦" },
                    ].map((method) => (
                      <span
                        key={method.label}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-800 border border-gray-600/40 rounded text-xs text-gray-300"
                      >
                        <span>{method.icon}</span>
                        <span>{method.label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    ✓ 30-day money-back guarantee
                  </Badge>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    ✓ {selectedPlan.isOneTime ? "Lifetime access" : "Cancel anytime"}
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    ✓ Instant activation
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handlePayment}
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    "Redirecting to Stripe..."
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {selectedPlan.isOneTime
                        ? `Pay $${selectedPlan.price} — Lifetime Access`
                        : `Pay $${selectedPlan.price}/month`}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to our{' '}
                  <a href="/eula" className="text-cyan-400 hover:text-cyan-300 underline">
                    EULA
                  </a>{' '}
                  and{' '}
                  <a href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline">
                    Privacy Policy
                  </a>.{' '}
                  {!selectedPlan.isOneTime && "Your subscription will automatically renew monthly."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-gray-800/30 border-gray-600/30">
          <CardContent className="p-6 text-center text-gray-400">
            <p className="text-sm">
              Need help? Contact our support team at{" "}
              <a href="https://carenalert.com/help" className="text-cyan-400 hover:text-cyan-300">
                carenalert.com/help
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
