import { StateData, LegalRight } from "@shared/schema";

// Fast response legal knowledge base for instant AI responses
export class FastLegalDatabase {
  private static quickResponses: Record<string, string> = {
    // Traffic Stop Scenarios
    'traffic_stop': 'Keep hands visible. Provide ID when asked. You have the right to remain silent beyond basic identification. Ask "Am I free to leave?"',
    'pulled_over': 'Stay calm. Turn off engine. Hands on steering wheel. Provide license/registration when requested. Limit conversation.',
    'speeding_ticket': 'Accept the ticket without argument. Note conditions (weather, traffic). Take photos if safe. Consult attorney for fighting ticket.',
    
    // Recording Rights
    'record_police': 'Generally legal to record police in public from reasonable distance (15+ feet). Do not interfere with their work. Check state laws.',
    'filming_arrest': 'Legal in most states from public space. Maintain distance. Do not interfere. Some states require one-party consent for audio.',
    'livestream_police': 'Usually legal same as recording. May provide extra protection. Ensure stable internet. Follow same distance rules.',
    
    // Search Rights
    'vehicle_search': 'Say clearly: "I do not consent to any searches." Police need warrant, consent, or probable cause for most searches.',
    'warrant_required': 'Police need warrant for most searches. Exceptions: hot pursuit, plain view, consent, safety searches, or probable cause.',
    'refuse_search': 'You can refuse consent to search. Say "I do not consent." Cannot refuse lawful searches with warrant or probable cause.',
    
    // Constitutional Rights
    'remain_silent': 'Fifth Amendment right. Say "I invoke my right to remain silent." Must clearly invoke - just staying quiet is not enough.',
    'need_lawyer': 'Sixth Amendment right. Say "I want a lawyer." All questioning should stop until attorney present.',
    'fourth_amendment': 'Protects against unreasonable searches/seizures. Police need warrant, consent, or specific legal exceptions.',
    
    // Emergency Situations
    'arrest_rights': 'You have the right to remain silent, an attorney, and a phone call. Do not resist even if arrest is unlawful.',
    'dui_checkpoint': 'Brief stops legal. Must answer basic questions. Field sobriety tests often optional. Breathalyzer refusal has consequences.',
    'consent_searches': 'Never required to consent. Clearly say "I do not consent." Police may search anyway if they have legal grounds.',
    
    // State Specific Quick Facts
    'california_recording': 'California Penal Code 148(g) protects recording police. Interference is misdemeanor. Stay 15+ feet away.',
    'texas_recording': 'Texas allows recording police in public. Must not interfere with duties. Audio recording laws apply.',
    'florida_recording': 'Florida permits recording police in public spaces. Two-party consent for private conversations.',
    'new_york_recording': 'New York protects recording police in public. Civil Rights Law 79-n prohibits interference with recording.',
    
    // De-escalation
    'stay_calm': 'Keep hands visible. Speak respectfully. Do not argue. Save disputes for court. Comply with lawful orders.',
    'officer_aggressive': 'Remain calm and respectful. Do not escalate. Say "I do not want trouble." Record if safe. Get badge numbers.',
    'witness_needed': 'Ask bystanders to record. Get contact information. Note badge numbers, car numbers, time, location.',
  };

  private static scenarioKeywords: Record<string, string[]> = {
    'traffic_stop': ['traffic stop', 'pulled over', 'traffic', 'stop', 'pullover'],
    'record_police': ['record', 'recording', 'film', 'filming', 'video', 'camera'],
    'vehicle_search': ['search car', 'search vehicle', 'search my car', 'vehicle search'],
    'remain_silent': ['remain silent', 'right to silence', 'fifth amendment', 'stay quiet'],
    'need_lawyer': ['lawyer', 'attorney', 'legal counsel', 'sixth amendment'],
    'arrest_rights': ['arrested', 'arrest', 'handcuffs', 'custody', 'detention'],
    'consent_searches': ['consent', 'permission', 'allow search', 'let them search'],
    'stay_calm': ['aggressive officer', 'escalating', 'angry officer', 'hostile'],
  };

  private static criticalQuickFacts: Record<string, string> = {
    'recording_distance': '15+ feet minimum distance when recording police interactions',
    'magic_words': 'Key phrases: "Am I free to leave?", "I do not consent", "I invoke my right to remain silent"',
    'never_resist': 'Never physically resist - fight wrongful arrest in court, not on the street',
    'document_everything': 'Get badge numbers, patrol car numbers, time, location, witness contact info',
  };

  static getQuickResponse(question: string, stateContext?: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // Check for exact scenario matches
    for (const [scenario, keywords] of Object.entries(this.scenarioKeywords)) {
      if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
        let response = this.quickResponses[scenario];
        
        // Add state-specific info if available
        if (stateContext && scenario === 'record_police') {
          const stateKey = `${stateContext.toLowerCase()}_recording`;
          if (this.quickResponses[stateKey]) {
            response += ` ${this.quickResponses[stateKey]}`;
          }
        }
        
        return response;
      }
    }

    // General rights fallback
    if (lowerQuestion.includes('rights') || lowerQuestion.includes('constitutional')) {
      return 'Key rights: Remain silent (5th Amendment), Refuse searches (4th Amendment), Request attorney (6th Amendment). Say: "I invoke my rights and want a lawyer."';
    }

    // Emergency fallback
    return 'Stay calm, keep hands visible, comply with lawful orders. You have the right to remain silent and an attorney. Record if safe and legal.';
  }

  static getEmergencyCommands(): string[] {
    return [
      "What are my rights?",
      "Can I record this?", 
      "Do I have to consent to search?",
      "Am I being arrested?",
      "Can I remain silent?",
      "Do I need a lawyer?",
      "What should I do right now?"
    ];
  }

  static getCriticalReminders(): string[] {
    return Object.values(this.criticalQuickFacts);
  }

  // Enhanced state-aware responses
  static getStateSpecificQuickFacts(stateName: string): string[] {
    const state = stateName.toLowerCase();
    const facts: string[] = [];

    switch (state) {
      case 'california':
        facts.push('CA Penal Code 148(g) protects recording police');
        facts.push('Strong constitutional protections (92% protection score)');
        facts.push('Enhanced Miranda protections for minors');
        break;
      case 'texas':
        facts.push('Recording police legal in public spaces');
        facts.push('Open carry state - inform officer of weapon immediately');
        facts.push('Strong property rights protections');
        break;
      case 'florida':
        facts.push('Two-party consent for private conversation recording');
        facts.push('Stand Your Ground law in effect');
        facts.push('Recording police permitted in public');
        break;
      case 'new_york':
        facts.push('Civil Rights Law 79-n protects recording');
        facts.push('Stop and frisk requires reasonable suspicion');
        facts.push('Strong recording protections in public spaces');
        break;
      default:
        facts.push('Check your state\'s specific recording laws');
        facts.push('Constitutional rights apply nationwide');
        facts.push('When in doubt, remain silent and request attorney');
    }

    return facts;
  }
}