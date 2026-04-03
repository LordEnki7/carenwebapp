import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import TopBar from "@/components/TopBar";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

export default function Pricing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // iOS App Store policy: no web subscription UI — IAP must be used instead.
  // Since IAP products are not yet configured in App Store Connect, hide entirely.
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    setLocation("/dashboard");
    return null;
  }

  const handleUpgrade = (planId: string) => {
    if (planId === "business") {
      toast({
        title: "Contact Sales",
        description: "Please contact our sales team for custom enterprise pricing at carenalert.com/help",
      });
      return;
    }

    if (planId === "free") {
      toast({
        title: "Already Free",
        description: "You're already on the free community plan!",
      });
      return;
    }

    // Redirect to payment demo page with selected plan
    setLocation(`/payment?plan=${planId}`);
  };

  return (
    <div className="space-y-6">
      <TopBar
        title="Subscription Plans"
        description="Choose the legal protection level that fits your driving needs"
      />
      
      {/* Back to Dashboard Button */}
      <div className="px-6">
        <Link href="/">
          <Button size="sm" className="cyber-button-secondary flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="px-6">
        <SubscriptionPlans 
          currentTier={user?.subscriptionTier || "free"}
          onUpgrade={handleUpgrade}
        />
      </div>
    </div>
  );
}