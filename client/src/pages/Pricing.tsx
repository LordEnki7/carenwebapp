import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import TopBar from "@/components/TopBar";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";

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

      <div className="px-6">
        <SubscriptionPlans currentTier={user?.subscriptionTier || "free"} />
      </div>
    </div>
  );
}
