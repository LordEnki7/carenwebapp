import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, CreditCard, ArrowLeft, Shield, Zap, Users, Building, Home } from "lucide-react";
import { Link } from "wouter";
import { Capacitor } from "@capacitor/core";

// Use proper Capacitor import — reliable even during early React render
const isNativeiOS = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: any;
  color: string;
}

const plans: Record<string, Plan> = {
  legal_shield: {
    id: "legal_shield",
    name: "Legal Shield",
    price: 9.99,
    description: "Essential constitutional protection for individual drivers",
    features: [
      "GPS-aware legal rights database",
      "Voice-activated constitutional rights",
      "Basic incident recording",
      "Emergency contact notifications",
      "Standard legal consultation",
      "50-state legal coverage"
    ],
    icon: Shield,
    color: "from-blue-500 to-cyan-500"
  },
  constitutional_pro: {
    id: "constitutional_pro", 
    name: "Constitutional Pro",
    price: 19.99,
    description: "Advanced legal protection with AI-powered assistance",
    features: [
      "Everything in Legal Shield",
      "AI legal assistant & analysis",
      "Live attorney communication",
      "Advanced voice commands",
      "Multi-device sync",
      "Evidence catalog",
      "Priority support",
      "Complaint filing system"
    ],
    icon: Zap,
    color: "from-purple-500 to-pink-500"
  },
  family_protection: {
    id: "family_protection",
    name: "Family Protection", 
    price: 29.99,
    description: "Comprehensive protection for up to 6 family members",
    features: [
      "Everything in Constitutional Pro",
      "Up to 6 family accounts",
      "Family emergency coordination",
      "Teen driver protection",
      "Cross-device recording sync",
      "Family location sharing",
      "Bulk evidence management",
      "Family-wide notifications"
    ],
    icon: Users,
    color: "from-green-500 to-emerald-500"
  },
  enterprise_fleet: {
    id: "enterprise_fleet",
    name: "Enterprise Fleet",
    price: 49.99,
    description: "Professional fleet management for up to 5 business users",
    features: [
      "Everything in Family Protection",
      "Business fleet management",
      "Employee protection tracking",
      "Corporate legal compliance",
      "Fleet-wide incident reporting",
      "Administrative dashboard",
      "API access",
      "Dedicated support"
    ],
    icon: Building,
    color: "from-orange-500 to-red-500"
  },
  // Legacy support for old plan IDs
  basic: {
    id: "basic",
    name: "Legal Shield",
    price: 9.99,
    description: "Essential constitutional protection for individual drivers",
    features: [
      "GPS-aware legal rights database",
      "Voice-activated constitutional rights",
      "Basic incident recording",
      "Emergency contact notifications",
      "Standard legal consultation",
      "50-state legal coverage"
    ],
    icon: Shield,
    color: "from-blue-500 to-cyan-500"
  }
};

const IAP_PLAN_MAP: Record<string, string> = {
  legal_shield: 'safety_pro',
  constitutional_pro: 'constitutional_pro',
  family_protection: 'family_protection',
  enterprise_fleet: 'enterprise_fleet',
  basic: 'safety_pro',
};

export default function Payment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  // Synchronous — computed before first render so no content ever flashes on iOS
  const oniOS = isNativeiOS();
  const planId = new URLSearchParams(window.location.search).get('plan') || 'basic';

  // Navigate away as a side effect; return null immediately so nothing renders
  useEffect(() => {
    if (oniOS) setLocation('/dashboard');
  }, []);

  if (oniOS) return null;

  const selectedPlan = plans[planId];

  const STRIPE_PAYMENT_LINKS: Record<string, string> = {
    legal_shield: "https://buy.stripe.com/8x200i2Lj2XSaHq39o2VG01",
    basic: "https://buy.stripe.com/8x200i2Lj2XSaHq39o2VG01",
    constitutional_pro: "https://buy.stripe.com/00w00ieu1cysg1K6lA2VG02",
    family_protection: "https://buy.stripe.com/cNibJ0clTbuo9DmeS62VG03",
    enterprise_fleet: "https://buy.stripe.com/7sYeVc5Xv1TO5n6eS62VG04",
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    const link = STRIPE_PAYMENT_LINKS[selectedPlan.id];
    if (!link) {
      toast({ title: "Coming Soon", description: "Payment for this plan will be available shortly. Please check back or contact support.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    toast({ title: "Redirecting to Secure Checkout", description: "Opening Stripe payment page..." });
    setTimeout(() => {
      window.location.href = link;
    }, 800);
  };



  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Plan not found</h1>
            <Link href="/pricing">
              <Button>Back to Pricing</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = selectedPlan.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Complete Your Subscription
            </h1>
            <p className="text-gray-300 text-lg">
              Secure your legal protection with {selectedPlan.name}
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/pricing">
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plans
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
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
                <div className="text-gray-400">per month</div>
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

          {/* Payment Form */}
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

                {/* Payment Methods */}
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
                      { label: "Crypto", icon: "₿" },
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
                    ✓ Cancel anytime
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
                    "Processing..."
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {`Pay $${selectedPlan.price}/month`}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to our{' '}
                  <a href="/terms-of-service" className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                  . Your subscription will automatically renew monthly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Information */}
        <Card className="mt-8 bg-gray-800/30 border-gray-600/30">
          <CardContent className="p-6">
            <div className="text-center text-gray-400">
              <p className="text-sm">
                Need help? Contact our support team at{" "}
                <a href="https://carenalert.com/help" className="text-cyan-400 hover:text-cyan-300">
                  carenalert.com/help
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}