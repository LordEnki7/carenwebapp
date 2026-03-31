// Tier rank hierarchy — rank 0 is Community Guardian ($0.99 one-time, the entry paid plan).
// "basic_guard" is the schema default assigned to testers during Early Access (no free tier in production).
export const TIER_RANK: Record<string, number> = {
  basic_guard: 0,        // Early Access testers (maps to Community Guardian level)
  community_guardian: 0, // $0.99 one-time — entry-level paid plan
  safety_pro: 1,
  standard_plan: 1,      // $4.99/mo
  constitutional_pro: 2,
  legal_shield: 2,       // $9.99/mo
  family_protection: 3,
  family_plan: 3,        // $29.99/mo
  enterprise_fleet: 4,
  fleet_enterprise: 4,   // $49.99/mo
  add_drivers: 4,
};

export const PLAN_INFO: Record<number, { name: string; price: string; tier: string; perks: string[] }> = {
  1: {
    name: "Standard Plan",
    price: "$4.99/mo",
    tier: "standard_plan",
    perks: [
      "Full GPS integration & emergency alerts",
      "Audio/video incident recording",
      "Police monitor & smart auto-mute",
      "Complaint filing & message center",
    ],
  },
  2: {
    name: "Legal Shield Plan",
    price: "$9.99/mo",
    tier: "legal_shield",
    perks: [
      "Everything in Standard Plan",
      "In-app access to legal directory",
      "Attorney call routing & consultation",
      "Advanced security features",
    ],
  },
  3: {
    name: "Family Plan",
    price: "$29.99/mo",
    tier: "family_plan",
    perks: [
      "Up to 5 linked accounts",
      "Shared emergency coordination",
      "All Legal Shield features for everyone",
    ],
  },
  4: {
    name: "Fleet / Enterprise",
    price: "$49.99/mo",
    tier: "fleet_enterprise",
    perks: [
      "10 driver accounts included",
      "Admin dashboard & analytics",
      "Fleet management tools",
    ],
  },
};

export const FEATURE_REQUIRED_RANK: Record<string, number> = {
  // Rank 0 — Community Guardian ($0.99) and above
  "/": 0,
  "/emergency-pullover": 0,
  "/de-escalation-guide": 0,
  "/record": 0,
  "/legal-rights-map": 0,
  "/rights": 0,
  "/settings": 0,
  "/help": 0,
  "/waitlist": 0,

  // Rank 1 — Standard Plan ($4.99/mo) and above
  "/police-monitor": 1,
  "/smart-auto-mute": 1,
  "/emergency-sharing": 1,
  "/file-complaint": 1,
  "/messages": 1,
  "/roadside-assistance": 1,
  "/feedback": 1,
  "/feature-picker": 1,
  "/account-security": 1,

  // Rank 2 — Legal Shield ($9.99/mo) and above
  "/attorneys": 2,
  "/voice-auth": 2,
  "/cloud-sync": 2,
  "/vehicle-readability": 2,
};

export function getUserRank(subscriptionTier?: string): number {
  // Defaults to basic_guard (Community Guardian level) for Early Access testers
  return TIER_RANK[subscriptionTier || "basic_guard"] ?? 0;
}

export function isFeatureLocked(subscriptionTier: string | undefined, href: string): boolean {
  const userRank = getUserRank(subscriptionTier);
  const required = FEATURE_REQUIRED_RANK[href] ?? 0;
  return userRank < required;
}

export function getRequiredPlan(href: string) {
  const rank = FEATURE_REQUIRED_RANK[href] ?? 0;
  return PLAN_INFO[rank] ?? null;
}
