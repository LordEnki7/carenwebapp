// Tier-based Feature Access Control System
// Controls which features are available based on subscription tier

export interface FeatureLimits {
  maxIncidents: number;
  maxEmergencyContacts: number;
  maxAttorneyConnections: number;
  maxBluetoothDevices: number;
  maxFamilyMembers: number;
  cloudStorageDays: number;
  emergencyLawyerCalls: number;
  prioritySupport: boolean;
  attorneyResponseTime: number;
  hasMobileApp: boolean;
  hasBluetoothSupport: boolean;
  hasOfflineMode: boolean;
  hasAdvancedVoiceCommands: boolean;
  hasAILegalAssistant: boolean;
  hasLiveStreamAttorneys: boolean;
  hasMultiDeviceRecording: boolean;
  hasComplaintFiling: boolean;
  hasAccessibilityFeatures: boolean;
  hasCloudSync: boolean;
  hasFamilyCoordination: boolean;
  hasEnterpriseFeatures: boolean;
}

export const TIER_FEATURES: Record<string, FeatureLimits> = {
  // Basic Guard ($1.00)
  basic_guard: {
    maxIncidents: 5,
    maxEmergencyContacts: 3,
    maxAttorneyConnections: 0,
    maxBluetoothDevices: 0,
    maxFamilyMembers: 1,
    cloudStorageDays: 7,
    emergencyLawyerCalls: 0,
    prioritySupport: false,
    attorneyResponseTime: -1,
    hasMobileApp: false,
    hasBluetoothSupport: false,
    hasOfflineMode: true,
    hasAdvancedVoiceCommands: false,
    hasAILegalAssistant: false,
    hasLiveStreamAttorneys: false,
    hasMultiDeviceRecording: false,
    hasComplaintFiling: false,
    hasAccessibilityFeatures: true,
    hasCloudSync: false,
    hasFamilyCoordination: false,
    hasEnterpriseFeatures: false,
  },

  // Safety Pro ($9.99)
  safety_pro: {
    maxIncidents: 25,
    maxEmergencyContacts: 5,
    maxAttorneyConnections: 3,
    maxBluetoothDevices: 3,
    maxFamilyMembers: 1,
    cloudStorageDays: 30,
    emergencyLawyerCalls: 2,
    prioritySupport: false,
    attorneyResponseTime: 24,
    hasMobileApp: true,
    hasBluetoothSupport: true,
    hasOfflineMode: true,
    hasAdvancedVoiceCommands: true,
    hasAILegalAssistant: true,
    hasLiveStreamAttorneys: false,
    hasMultiDeviceRecording: false,
    hasComplaintFiling: true,
    hasAccessibilityFeatures: true,
    hasCloudSync: true,
    hasFamilyCoordination: false,
    hasEnterpriseFeatures: false,
  },

  // Constitutional Pro ($19.99)
  constitutional_pro: {
    maxIncidents: 50,
    maxEmergencyContacts: 10,
    maxAttorneyConnections: 5,
    maxBluetoothDevices: 5,
    maxFamilyMembers: 2,
    cloudStorageDays: 90,
    emergencyLawyerCalls: 5,
    prioritySupport: true,
    attorneyResponseTime: 12,
    hasMobileApp: true,
    hasBluetoothSupport: true,
    hasOfflineMode: true,
    hasAdvancedVoiceCommands: true,
    hasAILegalAssistant: true,
    hasLiveStreamAttorneys: true,
    hasMultiDeviceRecording: true,
    hasComplaintFiling: true,
    hasAccessibilityFeatures: true,
    hasCloudSync: true,
    hasFamilyCoordination: false,
    hasEnterpriseFeatures: false,
  },

  // Family Protection ($29.99)
  family_protection: {
    maxIncidents: 100,
    maxEmergencyContacts: 15,
    maxAttorneyConnections: 10,
    maxBluetoothDevices: 10,
    maxFamilyMembers: 6,
    cloudStorageDays: 180,
    emergencyLawyerCalls: 10,
    prioritySupport: true,
    attorneyResponseTime: 6,
    hasMobileApp: true,
    hasBluetoothSupport: true,
    hasOfflineMode: true,
    hasAdvancedVoiceCommands: true,
    hasAILegalAssistant: true,
    hasLiveStreamAttorneys: true,
    hasMultiDeviceRecording: true,
    hasComplaintFiling: true,
    hasAccessibilityFeatures: true,
    hasCloudSync: true,
    hasFamilyCoordination: true,
    hasEnterpriseFeatures: false,
  },

  // Enterprise Fleet ($49.99/5 users)
  enterprise_fleet: {
    maxIncidents: -1, // Unlimited
    maxEmergencyContacts: -1, // Unlimited
    maxAttorneyConnections: -1, // Unlimited
    maxBluetoothDevices: -1, // Unlimited
    maxFamilyMembers: -1, // Unlimited
    cloudStorageDays: 365,
    emergencyLawyerCalls: -1, // Unlimited
    prioritySupport: true,
    attorneyResponseTime: 2,
    hasMobileApp: true,
    hasBluetoothSupport: true,
    hasOfflineMode: true,
    hasAdvancedVoiceCommands: true,
    hasAILegalAssistant: true,
    hasLiveStreamAttorneys: true,
    hasMultiDeviceRecording: true,
    hasComplaintFiling: true,
    hasAccessibilityFeatures: true,
    hasCloudSync: true,
    hasFamilyCoordination: true,
    hasEnterpriseFeatures: true,
  }
};

// Feature access validation functions
export function checkFeatureAccess(tier: string, feature: keyof FeatureLimits): boolean {
  const tierFeatures = TIER_FEATURES[tier] || TIER_FEATURES.free;
  return tierFeatures[feature] === true || (typeof tierFeatures[feature] === 'number' && tierFeatures[feature] > 0);
}

export function getFeatureLimits(tier: string): FeatureLimits {
  return TIER_FEATURES[tier] || TIER_FEATURES.basic_guard;
}

export function getTierDisplayName(tier: string): string {
  const tierNames: Record<string, string> = {
    basic_guard: "Basic Guard",
    safety_pro: "Safety Pro",
    constitutional_pro: "Constitutional Pro", 
    family_protection: "Family Protection",
    enterprise_fleet: "Enterprise Fleet"
  };
  return tierNames[tier] || "Basic Guard";
}

export function getTierColor(tier: string): string {
  const tierColors: Record<string, string> = {
    basic_guard: "text-gray-400",
    safety_pro: "text-blue-400", 
    constitutional_pro: "text-purple-400",
    family_protection: "text-green-400",
    enterprise_fleet: "text-yellow-400"
  };
  return tierColors[tier] || "text-gray-400";
}

export function shouldShowUpgradePrompt(currentTier: string, requiredFeature: keyof FeatureLimits): boolean {
  return !checkFeatureAccess(currentTier, requiredFeature);
}

export function getNextTierForFeature(currentTier: string, requiredFeature: keyof FeatureLimits): string | null {
  const tiers = ['basic_guard', 'safety_pro', 'constitutional_pro', 'family_protection', 'enterprise_fleet'];
  const currentIndex = tiers.indexOf(currentTier);
  
  for (let i = currentIndex + 1; i < tiers.length; i++) {
    if (checkFeatureAccess(tiers[i], requiredFeature)) {
      return tiers[i];
    }
  }
  
  return null;
}