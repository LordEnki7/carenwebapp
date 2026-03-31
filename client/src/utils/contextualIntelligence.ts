import { useAuth } from "@/hooks/useAuth";

// Time-based contextual theming
export interface TimeContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  isDarkHours: boolean;
  trafficStopRisk: 'low' | 'medium' | 'high';
  theme: 'day' | 'night' | 'emergency-night';
}

// Situation detection types
export interface SituationContext {
  type: 'traffic_stop' | 'police_encounter' | 'emergency' | 'routine' | 'legal_research';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions: QuickAction[];
  contextualHelp: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  priority: number;
  condition: string;
  emergencyLevel?: 'low' | 'medium' | 'high' | 'critical';
}

// Usage pattern tracking
export interface UsagePattern {
  featureId: string;
  frequency: number;
  lastUsed: Date;
  timeOfDayUsage: Record<string, number>;
  contextUsage: Record<string, number>;
}

export interface PredictiveFeature {
  featureId: string;
  name: string;
  relevanceScore: number;
  reason: string;
  href: string;
  icon: string;
}

// Context-sensitive help
export interface ContextualHelp {
  pageId: string;
  tips: HelpTip[];
  quickActions: QuickAction[];
  relatedFeatures: string[];
}

export interface HelpTip {
  id: string;
  title: string;
  description: string;
  priority: number;
  conditions: string[];
}

/**
 * Get current time context for UI theming
 */
export function getTimeContext(): TimeContext {
  const now = new Date();
  const hour = now.getHours();
  
  let timeOfDay: TimeContext['timeOfDay'];
  let isDarkHours: boolean;
  let trafficStopRisk: TimeContext['trafficStopRisk'];
  
  if (hour >= 6 && hour < 12) {
    timeOfDay = 'morning';
    isDarkHours = false;
    trafficStopRisk = 'low';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
    isDarkHours = false;
    trafficStopRisk = 'low';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
    isDarkHours = hour >= 19; // After 7 PM
    trafficStopRisk = 'medium';
  } else {
    timeOfDay = 'night';
    isDarkHours = true;
    trafficStopRisk = 'high';
  }
  
  const theme: TimeContext['theme'] = isDarkHours ? 'night' : 'day';
  
  return {
    timeOfDay,
    isDarkHours,
    trafficStopRisk,
    theme
  };
}

/**
 * Detect current situation based on context clues
 */
export function detectSituation(
  currentPath: string,
  recentActions: string[] = [],
  userState?: string
): SituationContext {
  const emergencyPaths = ['/record', '/emergency-pullover', '/emergency-sharing'];
  const legalPaths = ['/legal-rights', '/attorney-messages', '/legal-rights-map'];
  const urgentKeywords = ['emergency', 'police', 'stop', 'help', 'urgent'];
  
  let type: SituationContext['type'] = 'routine';
  let urgency: SituationContext['urgency'] = 'low';
  
  // Analyze current path
  if (emergencyPaths.some(path => currentPath.includes(path))) {
    type = 'emergency';
    urgency = 'high';
  } else if (currentPath.includes('record')) {
    type = 'police_encounter';
    urgency = 'medium';
  } else if (legalPaths.some(path => currentPath.includes(path))) {
    type = 'legal_research';
    urgency = 'low';
  }
  
  // Analyze recent actions for urgency escalation
  const hasUrgentActions = recentActions.some(action =>
    urgentKeywords.some(keyword => action.toLowerCase().includes(keyword))
  );
  
  if (hasUrgentActions) {
    urgency = urgency === 'low' ? 'medium' : 'high';
  }
  
  const suggestedActions = getSituationActions(type, urgency);
  const contextualHelp = getSituationHelp(type, urgency);
  
  return {
    type,
    urgency,
    suggestedActions,
    contextualHelp
  };
}

/**
 * Get situation-specific quick actions
 */
function getSituationActions(type: SituationContext['type'], urgency: SituationContext['urgency']): QuickAction[] {
  const actions: QuickAction[] = [];
  
  switch (type) {
    case 'emergency':
      actions.push(
        {
          id: 'start-recording',
          label: 'Start Recording',
          icon: 'Video',
          href: '/record',
          priority: 1,
          condition: 'emergency',
          emergencyLevel: 'critical'
        },
        {
          id: 'emergency-contacts',
          label: 'Alert Contacts',
          icon: 'Phone',
          href: '/emergency-sharing',
          priority: 2,
          condition: 'emergency',
          emergencyLevel: 'high'
        },
        {
          id: 'know-rights',
          label: 'Know Your Rights',
          icon: 'Shield',
          href: '/legal-rights',
          priority: 3,
          condition: 'emergency',
          emergencyLevel: 'medium'
        }
      );
      break;
      
    case 'police_encounter':
      actions.push(
        {
          id: 'pullover-guide',
          label: 'Pullover Guide',
          icon: 'Car',
          href: '/emergency-pullover',
          priority: 1,
          condition: 'traffic_stop',
          emergencyLevel: 'medium'
        },
        {
          id: 'constitutional-rights',
          label: 'Constitutional Rights',
          icon: 'Scale',
          href: '/legal-rights',
          priority: 2,
          condition: 'police_encounter',
          emergencyLevel: 'medium'
        }
      );
      break;
      
    case 'legal_research':
      actions.push(
        {
          id: 'legal-map',
          label: 'Legal Rights Map',
          icon: 'Map',
          href: '/legal-rights-map',
          priority: 1,
          condition: 'research',
          emergencyLevel: 'low'
        },
        {
          id: 'attorney-contact',
          label: 'Contact Attorney',
          icon: 'MessageSquare',
          href: '/attorney-messages',
          priority: 2,
          condition: 'legal_help',
          emergencyLevel: 'low'
        }
      );
      break;
      
    default:
      actions.push(
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'Home',
          href: '/dashboard',
          priority: 1,
          condition: 'general',
          emergencyLevel: 'low'
        }
      );
  }
  
  return actions.sort((a, b) => a.priority - b.priority);
}

/**
 * Get situation-specific help tips
 */
function getSituationHelp(type: SituationContext['type'], urgency: SituationContext['urgency']): string[] {
  const help: string[] = [];
  
  switch (type) {
    case 'emergency':
      help.push(
        "Stay calm and use voice commands for hands-free operation",
        "Your location is automatically shared with emergency contacts",
        "Recording starts immediately when you activate emergency mode"
      );
      break;
      
    case 'police_encounter':
      help.push(
        "Keep your hands visible at all times",
        "You have the right to remain silent",
        "You can record police interactions in public spaces"
      );
      break;
      
    case 'legal_research':
      help.push(
        "Legal rights vary by state - check your local protections",
        "Save important rights to your favorites for quick access",
        "Contact an attorney for specific legal advice"
      );
      break;
      
    default:
      help.push(
        "Explore features based on your subscription tier",
        "Voice commands work throughout the application",
        "Your data is encrypted and synchronized across devices"
      );
  }
  
  return help;
}

/**
 * Track feature usage for predictive recommendations
 */
export function trackFeatureUsage(featureId: string, context: string = 'general'): void {
  const storageKey = 'caren_usage_patterns';
  const patterns = getUsagePatterns();
  
  const existing = patterns.find(p => p.featureId === featureId);
  const hour = new Date().getHours();
  const timeKey = getTimeSlot(hour);
  
  if (existing) {
    existing.frequency += 1;
    existing.lastUsed = new Date();
    existing.timeOfDayUsage[timeKey] = (existing.timeOfDayUsage[timeKey] || 0) + 1;
    existing.contextUsage[context] = (existing.contextUsage[context] || 0) + 1;
  } else {
    patterns.push({
      featureId,
      frequency: 1,
      lastUsed: new Date(),
      timeOfDayUsage: { [timeKey]: 1 },
      contextUsage: { [context]: 1 }
    });
  }
  
  localStorage.setItem(storageKey, JSON.stringify(patterns));
}

/**
 * Get stored usage patterns
 */
function getUsagePatterns(): UsagePattern[] {
  const storageKey = 'caren_usage_patterns';
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) return [];
  
  try {
    const patterns = JSON.parse(stored);
    return patterns.map((p: any) => ({
      ...p,
      lastUsed: new Date(p.lastUsed)
    }));
  } catch {
    return [];
  }
}

/**
 * Get time slot for usage tracking
 */
function getTimeSlot(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Generate predictive feature recommendations
 */
export function getPredictiveFeatures(
  currentContext: SituationContext,
  userTier: string = 'free'
): PredictiveFeature[] {
  const patterns = getUsagePatterns();
  const timeContext = getTimeContext();
  const currentTimeSlot = getTimeSlot(new Date().getHours());
  
  const features: PredictiveFeature[] = [
    {
      featureId: 'record',
      name: 'Record Evidence',
      relevanceScore: 0,
      reason: '',
      href: '/record',
      icon: 'Video'
    },
    {
      featureId: 'legal-rights',
      name: 'Know Your Rights',
      relevanceScore: 0,
      reason: '',
      href: '/legal-rights',
      icon: 'Shield'
    },
    {
      featureId: 'attorney-messages',
      name: 'Attorney Messages',
      relevanceScore: 0,
      reason: '',
      href: '/attorney-messages',
      icon: 'MessageSquare'
    },
    {
      featureId: 'emergency-sharing',
      name: 'Emergency Contacts',
      relevanceScore: 0,
      reason: '',
      href: '/emergency-sharing',
      icon: 'Phone'
    }
  ];
  
  // Calculate relevance scores
  features.forEach(feature => {
    const pattern = patterns.find(p => p.featureId === feature.featureId);
    let score = 0;
    
    // Base frequency score
    if (pattern) {
      score += Math.min(pattern.frequency * 10, 50);
      
      // Time-based relevance
      const timeUsage = pattern.timeOfDayUsage[currentTimeSlot] || 0;
      score += timeUsage * 5;
      
      // Context relevance
      const contextUsage = pattern.contextUsage[currentContext.type] || 0;
      score += contextUsage * 15;
      
      // Recency bonus
      const daysSinceUse = (Date.now() - pattern.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUse < 1) score += 20;
      else if (daysSinceUse < 7) score += 10;
    }
    
    // Situational relevance
    if (currentContext.urgency === 'high' || currentContext.urgency === 'critical') {
      if (feature.featureId === 'record') score += 30;
      if (feature.featureId === 'emergency-sharing') score += 25;
    }
    
    if (timeContext.isDarkHours && timeContext.trafficStopRisk === 'high') {
      if (feature.featureId === 'record') score += 20;
      if (feature.featureId === 'legal-rights') score += 15;
    }
    
    feature.relevanceScore = Math.min(score, 100);
    
    // Generate reason
    if (score > 50) {
      feature.reason = 'Frequently used in similar situations';
    } else if (score > 30) {
      feature.reason = 'Relevant to current context';
    } else if (score > 10) {
      feature.reason = 'Based on usage patterns';
    } else {
      feature.reason = 'Available feature';
    }
  });
  
  return features
    .filter(f => f.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 4);
}

/**
 * Get context-sensitive help for current page
 */
export function getContextualHelp(
  currentPath: string,
  situation: SituationContext,
  userTier: string = 'free'
): ContextualHelp {
  const pageId = currentPath.split('/').pop() || 'dashboard';
  
  const helpConfig: Record<string, ContextualHelp> = {
    dashboard: {
      pageId: 'dashboard',
      tips: [
        {
          id: 'quick-access',
          title: 'Quick Emergency Access',
          description: 'Emergency features are prioritized at the top for fast access during crisis situations.',
          priority: 1,
          conditions: ['general']
        },
        {
          id: 'voice-commands',
          title: 'Voice Commands Available',
          description: 'Say "Start recording" or "Emergency alert" for hands-free operation.',
          priority: 2,
          conditions: ['general']
        }
      ],
      quickActions: [],
      relatedFeatures: ['record', 'legal-rights', 'emergency-sharing']
    },
    record: {
      pageId: 'record',
      tips: [
        {
          id: 'recording-rights',
          title: 'Recording Rights',
          description: 'You have the right to record police in public spaces in most states.',
          priority: 1,
          conditions: ['police_encounter']
        },
        {
          id: 'hands-free',
          title: 'Hands-Free Recording',
          description: 'Use voice commands to control recording while keeping hands visible.',
          priority: 2,
          conditions: ['emergency']
        }
      ],
      quickActions: [],
      relatedFeatures: ['legal-rights', 'emergency-sharing']
    },
    'legal-rights': {
      pageId: 'legal-rights',
      tips: [
        {
          id: 'state-specific',
          title: 'State-Specific Rights',
          description: 'Legal protections vary by state. Your rights are automatically filtered by location.',
          priority: 1,
          conditions: ['legal_research']
        },
        {
          id: 'constitutional',
          title: 'Constitutional Protections',
          description: 'Focus on 4th and 5th Amendment rights during police encounters.',
          priority: 2,
          conditions: ['police_encounter']
        }
      ],
      quickActions: [],
      relatedFeatures: ['legal-rights-map', 'attorney-messages']
    }
  };
  
  const defaultHelp: ContextualHelp = {
    pageId,
    tips: [
      {
        id: 'general',
        title: 'Context-Aware Features',
        description: 'C.A.R.E.N.™ adapts to your situation and provides relevant tools automatically.',
        priority: 1,
        conditions: ['general']
      }
    ],
    quickActions: situation.suggestedActions,
    relatedFeatures: []
  };
  
  return helpConfig[pageId] || defaultHelp;
}