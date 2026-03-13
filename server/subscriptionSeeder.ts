import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";

const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Essential Protection",
    tier: "free",
    price: "0.00",
    billingCycle: "monthly",
    features: {
      description: "Essential legal protection for everyone",
      included: [
        "Complete 50-state legal rights database",
        "Voice-activated commands (basic)",
        "Single device recording (audio/video)",
        "Emergency contact alerts (3 contacts)",
        "GPS location tracking",
        "Incident documentation",
        "Basic legal document templates"
      ],
      limitations: [
        "No external device connections",
        "No attorney communication",
        "7-day cloud storage only",
        "Standard support"
      ],
      targetAudience: "Students, everyday drivers, community members"
    },
    maxIncidents: 15,
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
    isActive: true
  },
  {
    id: "pro",
    name: "Advanced Protection",
    tier: "pro",
    price: "7.99",
    billingCycle: "monthly",
    features: {
      description: "Enhanced protection with external device support",
      included: [
        "Everything in Essential Protection",
        "Advanced voice commands (200+ patterns)",
        "Bluetooth dashcam integration",
        "Multi-device recording coordination",
        "Attorney network access (1 connection)",
        "Real-time legal guidance",
        "30-day cloud storage",
        "Enhanced emergency features",
        "Mobile app (iOS/Android)",
        "PWA offline functionality"
      ],
      limitations: [
        "Single attorney connection",
        "Standard response times",
        "Basic priority support"
      ],
      targetAudience: "Regular drivers, rideshare drivers, frequent travelers"
    },
    maxIncidents: 100,
    maxEmergencyContacts: 10,
    maxAttorneyConnections: 1,
    maxBluetoothDevices: 3,
    maxFamilyMembers: 1,
    cloudStorageDays: 30,
    emergencyLawyerCalls: 0,
    prioritySupport: false,
    attorneyResponseTime: 60,
    hasMobileApp: true,
    hasBluetoothSupport: true,
    hasOfflineMode: true,
    hasAdvancedVoiceCommands: true,
    isActive: true
  },
  {
    id: "legal",
    name: "Legal Shield Pro",
    tier: "legal",
    price: "14.99",
    billingCycle: "monthly",
    features: {
      description: "Professional legal protection with priority attorney access",
      included: [
        "Everything in Advanced Protection",
        "Priority attorney response (10 minutes)",
        "Unlimited external device connections",
        "Professional legal document generation",
        "Anonymous incident analysis by legal team",
        "Monthly legal Q&A sessions",
        "Emergency lawyer calls (3 per month)",
        "90-day cloud storage",
        "Advanced voice command patterns",
        "Multi-angle evidence coordination"
      ],
      limitations: [
        "Individual account only",
        "Standard family features"
      ],
      targetAudience: "Professional drivers, high-risk users, legal professionals"
    },
    maxIncidents: -1,
    maxEmergencyContacts: -1,
    maxAttorneyConnections: 3,
    maxBluetoothDevices: -1,
    maxFamilyMembers: 1,
    cloudStorageDays: 90,
    emergencyLawyerCalls: 3,
    prioritySupport: true,
    attorneyResponseTime: 10,
    hasMobileApp: true,
    hasBluetoothSupport: true,
    hasOfflineMode: true,
    hasAdvancedVoiceCommands: true,
    isActive: true
  },
  {
    id: "family",
    name: "Family Protection",
    tier: "family",
    price: "19.99",
    billingCycle: "monthly",
    features: {
      description: "Complete protection for your entire family",
      included: [
        "Everything in Legal Shield Pro",
        "Up to 6 family member accounts",
        "Shared emergency contacts (unlimited)",
        "Family dashboard and monitoring",
        "Teen driver protection features",
        "Cross-device incident sharing",
        "Family attorney access (5 connections)",
        "Unlimited Bluetooth device connections",
        "Priority family emergency response",
        "Bulk device management",
        "Parental controls and monitoring",
        "Family legal document sharing"
      ],
      familyFeatures: [
        "Individual profiles for each family member",
        "Age-appropriate legal guidance",
        "Parent notification system",
        "Shared incident history",
        "Family emergency coordination"
      ],
      targetAudience: "Families, parents with teen drivers, multi-car households"
    },
    maxIncidents: -1,
    maxEmergencyContacts: -1,
    maxAttorneyConnections: 5,
    maxBluetoothDevices: -1,
    maxFamilyMembers: 6,
    cloudStorageDays: -1,
    emergencyLawyerCalls: 10,
    prioritySupport: true,
    attorneyResponseTime: 30,
    hasMobileApp: true,
    hasBluetoothSupport: true,
    hasOfflineMode: true,
    hasAdvancedVoiceCommands: true,
    isActive: true
  },
  {
    id: "business",
    name: "Enterprise Solution",
    tier: "business",
    price: "custom",
    billingCycle: "monthly",
    features: {
      description: "Enterprise-grade protection for organizations",
      included: [
        "Everything in Family Protection",
        "Unlimited user accounts",
        "Multi-organization management",
        "Fleet-wide deployment tools",
        "Custom integrations (API access)",
        "Dedicated legal team access",
        "Advanced analytics and reporting",
        "White-label branding options",
        "Dedicated account manager",
        "24/7 emergency legal hotline",
        "Custom training programs",
        "Compliance reporting tools"
      ],
      enterpriseFeatures: [
        "SSO integration",
        "Custom deployment",
        "Bulk device provisioning",
        "Advanced reporting",
        "Legal team coordination"
      ],
      targetAudience: "Corporations, fleet operators, legal organizations, government agencies"
    },
    maxIncidents: -1,
    maxEmergencyContacts: -1,
    maxAttorneyConnections: -1,
    maxBluetoothDevices: -1,
    maxFamilyMembers: -1,
    cloudStorageDays: -1,
    emergencyLawyerCalls: -1,
    prioritySupport: true,
    attorneyResponseTime: 15,
    hasMobileApp: true,
    hasBluetoothSupport: true,
    hasOfflineMode: true,
    hasAdvancedVoiceCommands: true,
    isActive: true
  }
];

export async function seedSubscriptionPlans() {
  try {
    console.log("Seeding subscription plans...");
    
    for (const plan of SUBSCRIPTION_PLANS) {
      await db
        .insert(subscriptionPlans)
        .values(plan)
        .onConflictDoUpdate({
          target: subscriptionPlans.id,
          set: {
            name: plan.name,
            tier: plan.tier,
            price: plan.price,
            billingCycle: plan.billingCycle,
            features: plan.features,
            maxIncidents: plan.maxIncidents,
            maxEmergencyContacts: plan.maxEmergencyContacts,
            maxAttorneyConnections: plan.maxAttorneyConnections,
            maxBluetoothDevices: plan.maxBluetoothDevices,
            maxFamilyMembers: plan.maxFamilyMembers,
            cloudStorageDays: plan.cloudStorageDays,
            emergencyLawyerCalls: plan.emergencyLawyerCalls,
            prioritySupport: plan.prioritySupport,
            attorneyResponseTime: plan.attorneyResponseTime,
            isActive: plan.isActive,
            updatedAt: new Date(),
          },
        });
    }
    
    console.log("✅ Subscription plans seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    throw error;
  }
}

export function getFeatureLimits(tier: string) {
  const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier);
  if (!plan) return SUBSCRIPTION_PLANS[0]; // Default to free plan
  
  return {
    maxIncidents: plan.maxIncidents,
    maxEmergencyContacts: plan.maxEmergencyContacts,
    maxAttorneyConnections: plan.maxAttorneyConnections,
    cloudStorageDays: plan.cloudStorageDays,
    emergencyLawyerCalls: plan.emergencyLawyerCalls,
    prioritySupport: plan.prioritySupport,
    attorneyResponseTime: plan.attorneyResponseTime,
  };
}

export function checkFeatureAccess(tier: string, feature: string): boolean {
  const features = {
    basic_guard: [
      "legal_rights_library",
      "traffic_stop_script",
      "audio_video_recording",
      "emergency_contact_alert",
      "app_log"
    ],
    pro: [
      "legal_rights_library",
      "traffic_stop_script", 
      "audio_video_recording",
      "emergency_contact_alert",
      "app_log",
      "gps_legal_prompts",
      "attorney_matching",
      "cloud_storage",
      "voice_chat_assistant",
      "voice_recording_triggers"
    ],
    safety_pro: [
      "legal_rights_library",
      "traffic_stop_script",
      "audio_video_recording", 
      "emergency_contact_alert",
      "app_log",
      "gps_legal_prompts",
      "attorney_matching",
      "cloud_storage",
      "voice_chat_assistant",
      "voice_recording_triggers",
      "priority_attorney_response",
      "incident_analysis",
      "legal_qa_sessions",
      "emergency_lawyer_calls",
      "data_export"
    ],
    business: [
      "legal_rights_library",
      "traffic_stop_script",
      "audio_video_recording",
      "emergency_contact_alert", 
      "app_log",
      "gps_legal_prompts",
      "attorney_matching",
      "cloud_storage",
      "voice_chat_assistant",
      "voice_recording_triggers",
      "priority_attorney_response",
      "incident_analysis",
      "legal_qa_sessions",
      "emergency_lawyer_calls",
      "data_export",
      "driver_dashboards",
      "custom_policy_alerts",
      "enterprise_support",
      "bulk_user_management",
      "advanced_analytics",
      "custom_integrations"
    ]
  };
  
  const tierFeatures = features[tier as keyof typeof features] || features.free;
  return tierFeatures.includes(feature);
}