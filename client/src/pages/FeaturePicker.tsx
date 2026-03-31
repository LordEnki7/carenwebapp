import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  MapPin, AlertTriangle, Mic, Mic2, Users, Bot, Languages, Video,
  FileText, Zap, Headphones, Scale, Search, Stamp, MessageSquare,
  Cloud, Truck, Star, Palette, BarChart3, Lock, Save, ArrowLeft,
  Crown, Shield, ChevronRight,
} from "lucide-react";

const iconMap: Record<string, any> = {
  MapPin, AlertTriangle, Mic, Mic2, Users, Bot, Languages, Video,
  FileText, Zap, Headphones, Scale, Search, Stamp, MessageSquare,
  Cloud, Truck, Star, Palette, BarChart3,
};

const TIER_ORDER = ["basic_guard", "safety_pro", "constitutional_pro", "family_protection", "enterprise_fleet"];

const TIER_LABELS: Record<string, string> = {
  basic_guard: "Basic Guard",
  safety_pro: "Safety Pro",
  constitutional_pro: "Constitutional Pro",
  family_protection: "Family Protection",
  enterprise_fleet: "Enterprise Fleet",
};

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  basic_guard: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30", glow: "shadow-cyan-500/20" },
  safety_pro: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", glow: "shadow-green-500/20" },
  constitutional_pro: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", glow: "shadow-purple-500/20" },
  family_protection: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-amber-500/20" },
  enterprise_fleet: { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30", glow: "shadow-rose-500/20" },
};

function getTierIndex(tier: string): number {
  return TIER_ORDER.indexOf(tier);
}

function isFeatureAccessible(userTier: string, featureTier: string): boolean {
  return getTierIndex(userTier) >= getTierIndex(featureTier);
}

export default function FeaturePicker() {
  const { toast } = useToast();
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const userTier = user?.subscriptionTier || "basic_guard";

  const { data: tierConfig, isLoading: tiersLoading } = useQuery<any>({
    queryKey: ["/api/feature-tiers"],
  });

  const { data: preferences, isLoading: prefsLoading } = useQuery<any>({
    queryKey: ["/api/feature-preferences"],
  });

  useEffect(() => {
    if (preferences?.enabledFeatures) {
      setEnabledFeatures(preferences.enabledFeatures);
    } else if (tierConfig?.tiers) {
      const defaultFeatures = tierConfig.tiers[userTier]?.features || [];
      setEnabledFeatures(defaultFeatures);
    }
  }, [preferences, tierConfig, userTier]);

  const saveMutation = useMutation({
    mutationFn: async (features: string[]) => {
      const res = await apiRequest("POST", "/api/feature-preferences", {
        enabledFeatures: features,
        dashboardLayout: null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feature-preferences"] });
      setHasChanges(false);
      toast({ title: "Preferences Saved", description: "Your feature preferences have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save preferences. Please try again.", variant: "destructive" });
    },
  });

  const toggleFeature = (featureId: string) => {
    setEnabledFeatures((prev) => {
      const next = prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId];
      setHasChanges(true);
      return next;
    });
  };

  const allFeatures = tierConfig?.allFeatures || [];
  const isLoading = tiersLoading || prefsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400">Loading features...</p>
        </div>
      </div>
    );
  }

  const featuresByTier = TIER_ORDER.reduce<Record<string, any[]>>((acc, tier) => {
    acc[tier] = allFeatures.filter((f: any) => f.tier === tier);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              Customize Your C.A.R.E.N.™
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Choose which features appear on your dashboard</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Crown className={`w-5 h-5 ${TIER_COLORS[userTier]?.text || "text-cyan-400"}`} />
            <Badge className={`${TIER_COLORS[userTier]?.bg} ${TIER_COLORS[userTier]?.text} ${TIER_COLORS[userTier]?.border} border text-sm px-3 py-1`}>
              {TIER_LABELS[userTier] || "Basic Guard"}
            </Badge>
          </div>
        </div>

        <div className="relative">
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between overflow-x-auto gap-0">
              {TIER_ORDER.map((tier, idx) => {
                const isCurrent = tier === userTier;
                const isUnlocked = getTierIndex(userTier) >= idx;
                const colors = TIER_COLORS[tier];
                return (
                  <div key={tier} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent
                            ? `${colors.bg} ${colors.border} ${colors.text} ring-2 ring-offset-2 ring-offset-gray-900 ring-${tier === "basic_guard" ? "cyan" : tier === "safety_pro" ? "green" : tier === "constitutional_pro" ? "purple" : tier === "family_protection" ? "amber" : "rose"}-500/50`
                            : isUnlocked
                            ? `${colors.bg} ${colors.border} ${colors.text}`
                            : "bg-gray-800 border-gray-600 text-gray-500"
                        }`}
                      >
                        {isUnlocked ? (
                          <Shield className="w-5 h-5" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 text-center font-medium whitespace-nowrap ${
                          isCurrent ? colors.text : isUnlocked ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {TIER_LABELS[tier]}
                      </span>
                      {isCurrent && (
                        <span className={`text-[10px] mt-1 ${colors.text} font-semibold uppercase tracking-wider`}>Current</span>
                      )}
                    </div>
                    {idx < TIER_ORDER.length - 1 && (
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 mx-1 ${
                          getTierIndex(userTier) > idx ? "text-gray-500" : "text-gray-700"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {TIER_ORDER.map((tier) => {
            const features = featuresByTier[tier] || [];
            if (features.length === 0) return null;
            const colors = TIER_COLORS[tier];
            const accessible = isFeatureAccessible(userTier, tier);

            return (
              <div key={tier} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                    {accessible ? <Shield className={`w-4 h-4 ${colors.text}`} /> : <Lock className={`w-4 h-4 ${colors.text}`} />}
                  </div>
                  <h2 className={`text-xl font-semibold ${colors.text}`}>{TIER_LABELS[tier]}</h2>
                  {!accessible && (
                    <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
                      <Lock className="w-3 h-3 mr-1" /> Locked
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((feature: any) => {
                    const IconComp = iconMap[feature.icon] || Shield;
                    const isAccessible = isFeatureAccessible(userTier, feature.tier);
                    const isEnabled = enabledFeatures.includes(feature.id);

                    return (
                      <Card
                        key={feature.id}
                        className={`bg-gray-900/60 backdrop-blur-md border transition-all duration-300 ${
                          isAccessible
                            ? `${colors.border} hover:shadow-lg hover:${colors.glow}`
                            : "border-gray-700/30 opacity-60"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                                <IconComp className={`w-5 h-5 ${colors.text}`} />
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-white leading-tight">{feature.name}</h3>
                                <Badge className={`${colors.bg} ${colors.text} ${colors.border} border text-[10px] px-1.5 py-0`}>
                                  {TIER_LABELS[feature.tier]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-gray-400 mb-4">{feature.description}</p>
                          {isAccessible ? (
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${isEnabled ? "text-green-400" : "text-gray-500"}`}>
                                {isEnabled ? "Enabled" : "Disabled"}
                              </span>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => toggleFeature(feature.id)}
                              />
                            </div>
                          ) : (
                            <Link href="/pricing">
                              <Button
                                variant="outline"
                                size="sm"
                                className={`w-full ${colors.border} ${colors.text} hover:${colors.bg} border text-xs`}
                              >
                                <Lock className="w-3 h-3 mr-2" />
                                Upgrade to {TIER_LABELS[feature.tier]}
                              </Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-6 flex justify-center">
          <Button
            onClick={() => saveMutation.mutate(enabledFeatures)}
            disabled={!hasChanges || saveMutation.isPending}
            size="lg"
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
              hasChanges
                ? "bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-cyan-500/25"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Save className="w-5 h-5 mr-2" />
            {saveMutation.isPending ? "Saving..." : hasChanges ? "Save Preferences" : "No Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
