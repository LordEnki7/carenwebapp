import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Building, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  price: string;
  billingCycle: string;
  description: string;
  features: string[];
  targetAudience: string;
  isPopular?: boolean;
  icon: any;
  badgeColor: string;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: "community_guardian",
    name: "Community Guardian",
    tier: "community_guardian",
    price: "1.00",
    billingCycle: "one-time",
    description: "Basic download, limited features",
    features: [
      "Basic download",
      "Limited features",
      "Offline safety kit",
      "No legal services"
    ],
    targetAudience: "Budget-conscious users, one-time protection",
    icon: Check,
    badgeColor: "bg-gray-500"
  },
  {
    id: "standard_plan",
    name: "Standard Plan",
    tier: "standard_plan",
    price: "4.99",
    billingCycle: "monthly",
    description: "Full app features without attorney access",
    features: [
      "Full app features",
      "GPS integration",
      "Audio/video recording",
      "Emergency alerts",
      "No attorney access"
    ],
    targetAudience: "Regular users, basic protection needs",
    icon: Zap,
    badgeColor: "bg-blue-500"
  },
  {
    id: "legal_shield",
    name: "Legal Shield Plan",
    tier: "legal_shield", 
    price: "9.99",
    billingCycle: "monthly",
    description: "All features plus legal directory access",
    features: [
      "All features from Standard Plan",
      "In-app access to legal directory",
      "Attorney call routing",
      "Legal consultation support"
    ],
    targetAudience: "Users needing legal support access",
    isPopular: true,
    icon: Crown,
    badgeColor: "bg-purple-500"
  },
  {
    id: "family_plan",
    name: "Family Plan",
    tier: "family_plan",
    price: "29.99",
    billingCycle: "monthly",
    description: "Multi-user family protection",
    features: [
      "Up to 5 users",
      "Shared login or linked accounts",
      "All features from Legal Shield",
      "Family emergency coordination",
      "Legal access for all users"
    ],
    targetAudience: "Families, multiple drivers",
    icon: Star,
    badgeColor: "bg-green-500"
  },
  {
    id: "fleet_enterprise",
    name: "Fleet/Enterprise",
    tier: "fleet_enterprise",
    price: "49.99",
    billingCycle: "monthly",
    description: "Professional fleet management solution",
    features: [
      "Includes 10 drivers",
      "Admin dashboard",
      "Legal access for all users",
      "Data reports and analytics",
      "Fleet management tools"
    ],
    targetAudience: "Businesses, fleet operators, enterprise clients",
    icon: Building,
    badgeColor: "bg-orange-500"
  },
  {
    id: "add_drivers",
    name: "+ Add 5 Drivers",
    tier: "add_drivers",
    price: "24.99",
    billingCycle: "monthly add-on",
    description: "Additional driver accounts for Fleet plan",
    features: [
      "Adds 5 more driver accounts",
      "Extends Fleet plan capacity",
      "Same features as Fleet plan",
      "Suggested add-on"
    ],
    targetAudience: "Large fleets, expanding businesses",
    icon: Building,
    badgeColor: "bg-yellow-500"
  }
];

interface SubscriptionPlansProps {
  currentTier?: string;
  onUpgrade?: (planId: string) => void;
}

export default function SubscriptionPlans({ currentTier = "free", onUpgrade }: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentTier) return;
    
    setIsLoading(true);
    setSelectedPlan(planId);
    
    try {
      if (planId === "community_guardian") {
        toast({
          title: "Already Free",
          description: "You're already on the free community plan!",
        });
        return;
      }

      // Navigate to payment page with the selected plan
      console.log(`Navigating to payment page with plan: ${planId}`);
      setLocation(`/payment?plan=${planId}`);
      
      // Show feedback to user
      toast({
        title: "Redirecting to Payment",
        description: `Taking you to checkout for ${PLANS.find(p => p.id === planId)?.name}`,
      });

      // Also call onUpgrade if provided (for parent component handling)
      if (onUpgrade) {
        await onUpgrade(planId);
      }
      
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast({
        title: "Error",
        description: "Failed to navigate to payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="cyber-card glass-morphism animate-fade-in-up hover:cyber-glow transition-all duration-300 p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold cyber-text-primary mb-4">
          Choose Your Protection Level
        </h2>
        <p className="text-lg cyber-text-secondary max-w-2xl mx-auto">
          From basic community support to comprehensive legal protection, 
          select the plan that fits your driving needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = plan.tier === currentTier;
          const isUpgrade = !isCurrentPlan && plan.tier !== "free";
          
          return (
            <div 
              key={plan.id} 
              className={`cyber-card glass-morphism relative overflow-hidden transition-all duration-300 hover:cyber-glow ${
                plan.isPopular ? 'ring-2 ring-cyan-500 neon-glow' : ''
              } ${isCurrentPlan ? 'ring-2 ring-green-500 bg-green-500/10' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-0 right-0">
                  <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 right-0">
                  <div className="bg-green-500 text-white text-center py-1 text-sm font-medium">
                    Current Plan
                  </div>
                </div>
              )}

              <div className={`text-center p-6 ${plan.isPopular || isCurrentPlan ? 'pt-12' : ''}`}>
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${plan.badgeColor} text-white hologram-border`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold cyber-text-primary">{plan.name}</h3>
                
                <div className="flex items-baseline justify-center">
                  {plan.price === "Custom" ? (
                    <span className="text-2xl font-bold cyber-text-primary">Custom</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold cyber-text-primary">${plan.price}</span>
                      <span className="cyber-text-secondary ml-1">
                        {plan.billingCycle === "one-time" ? " (one-time)" : 
                         plan.billingCycle === "monthly add-on" ? " / mo (add-on)" :
                         " / month"}
                      </span>
                    </>
                  )}
                </div>
                
                <p className="text-sm cyber-text-secondary mt-2">
                  {plan.description}
                </p>
                
                <div className="mt-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs cyber-text-secondary inline-block">
                  {plan.targetAudience}
                </div>
              </div>

              <div className="space-y-4 p-6 pt-0">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="cyber-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan || (isLoading && selectedPlan === plan.id)}
                  className={`w-full mt-6 cyber-button ${
                    isCurrentPlan 
                      ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                      : plan.isPopular 
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30' 
                        : 'bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30'
                  }`}
                  variant="outline"
                >
                  {isLoading && selectedPlan === plan.id
                    ? "Processing..."
                    : isCurrentPlan
                      ? "Current Plan"
                      : plan.price === "Custom"
                        ? "Contact Sales"
                        : isUpgrade
                          ? "Upgrade Now"
                          : "Select Plan"
                  }
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-center mb-8 cyber-text-primary">Feature Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-gray-800/50 rounded-lg border border-cyan-500/30">
            <thead>
              <tr className="bg-cyan-500/10 border-b border-cyan-500/30">
                <th className="text-left p-4 font-semibold cyber-text-primary">Features</th>
                <th className="text-center p-4 font-semibold cyber-text-primary">Community</th>
                <th className="text-center p-4 font-semibold cyber-text-primary">Standard</th>
                <th className="text-center p-4 font-semibold cyber-text-primary">Legal Shield</th>
                <th className="text-center p-4 font-semibold cyber-text-primary">Family</th>
                <th className="text-center p-4 font-semibold cyber-text-primary">Fleet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/20">
              <tr>
                <td className="p-4 font-medium cyber-text-secondary">Basic Features</td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
              </tr>
              <tr>
                <td className="p-4 font-medium cyber-text-secondary">Full App Features</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium cyber-text-secondary">GPS & Recording</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium cyber-text-secondary">Legal Directory Access</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium cyber-text-secondary">Multiple Users</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">Up to 5</td>
                <td className="text-center p-4 cyber-text-secondary">Up to 10</td>
              </tr>
              <tr>
                <td className="p-4 font-medium cyber-text-secondary">Admin Dashboard</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium cyber-text-secondary">Data Reports</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4 cyber-text-secondary">-</td>
                <td className="text-center p-4"><Check className="w-5 h-5 text-cyan-400 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monetization Options */}
      <div className="mt-12 bg-purple-500/10 border border-purple-500/30 rounded-lg p-8">
        <h3 className="text-2xl font-bold text-center mb-6 cyber-text-primary">Additional Support Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cyber-card glass-morphism p-6">
            <div className="text-center">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h4 className="cyber-text-primary font-semibold">Tip Jar</h4>
              <p className="cyber-text-secondary text-sm">Support our mission</p>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm cyber-text-secondary mb-4">
                Help us keep the community plan free for everyone
              </p>
              <Button variant="outline" className="w-full cyber-button">
                Support C.A.R.E.N.™
              </Button>
            </div>
          </div>

          <div className="cyber-card glass-morphism p-6">
            <div className="text-center">
              <Building className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h4 className="cyber-text-primary font-semibold">Attorney Referrals</h4>
              <p className="cyber-text-secondary text-sm">Professional legal help</p>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm cyber-text-secondary mb-4">
                Get connected with qualified attorneys in your area
              </p>
              <Button variant="outline" className="w-full cyber-button">
                Find Attorney
              </Button>
            </div>
          </div>

          <div className="cyber-card glass-morphism p-6">
            <div className="text-center">
              <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h4 className="cyber-text-primary font-semibold">Sponsored Access</h4>
              <p className="cyber-text-secondary text-sm">Grant-funded plans</p>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm cyber-text-secondary mb-4">
                Check if you qualify for sponsored premium access
              </p>
              <Button variant="outline" className="w-full cyber-button">
                Check Eligibility
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}