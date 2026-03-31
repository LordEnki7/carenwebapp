import { db } from './db';
import { incidents, officerComplaints, legalRights } from '@shared/schema';
import { eq, and, like, desc } from 'drizzle-orm';

export interface ComplaintSuggestion {
  id: string;
  type: 'constitutional_violation' | 'misconduct' | 'excessive_force' | 'discrimination' | 'procedural_violation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  legalBasis: string[];
  suggestedActions: string[];
  evidence: string[];
  timelineUrgency: 'immediate' | 'within_24h' | 'within_week' | 'within_month';
  jurisdiction: string;
  applicableLaws: string[];
  precedentCases?: string[];
}

export interface IncidentAnalysis {
  keywords: string[];
  violationTypes: string[];
  severity: string;
  jurisdiction: string;
  timeOfIncident: Date;
  evidenceTypes: string[];
  officerActions: string[];
  constitutionalRights: string[];
}

export class ComplaintSuggestionEngine {
  
  // Analyze incident and generate complaint suggestions
  static async generateComplaintSuggestions(
    incidentId: number,
    userId: string,
    additionalContext?: string
  ): Promise<ComplaintSuggestion[]> {
    try {
      // Get incident details
      const [incident] = await db
        .select()
        .from(incidents)
        .where(and(eq(incidents.id, incidentId), eq(incidents.userId, userId)));

      if (!incident) {
        throw new Error('Incident not found');
      }

      // Analyze incident content
      const analysis = await this.analyzeIncidentContent(incident);
      
      // Generate suggestions based on analysis
      const suggestions = await this.generateSuggestionsFromAnalysis(analysis, incident, additionalContext);
      
      // Sort suggestions by severity and confidence
      return suggestions.sort((a, b) => {
        const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityWeight[b.severity] - severityWeight[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      });

    } catch (error) {
      console.error('Error generating complaint suggestions:', error);
      throw error;
    }
  }

  // Analyze incident content for violation patterns
  private static async analyzeIncidentContent(incident: any): Promise<IncidentAnalysis> {
    const description = (incident.description || '').toLowerCase();
    const notes = (incident.notes || '').toLowerCase();
    const combinedText = `${description} ${notes}`;

    // Extract keywords and patterns
    const keywords = this.extractKeywords(combinedText);
    const violationTypes = this.identifyViolationTypes(combinedText, keywords);
    const severity = this.assessSeverity(combinedText, violationTypes);
    const officerActions = this.extractOfficerActions(combinedText);
    const constitutionalRights = this.identifyConstitutionalViolations(combinedText);
    const evidenceTypes = this.identifyEvidenceTypes(incident);

    return {
      keywords,
      violationTypes,
      severity,
      jurisdiction: incident.location?.state || 'unknown',
      timeOfIncident: incident.createdAt || new Date(),
      evidenceTypes,
      officerActions,
      constitutionalRights
    };
  }

  // Extract relevant keywords from incident text
  private static extractKeywords(text: string): string[] {
    const patterns = {
      force: ['excessive force', 'brutality', 'assault', 'violence', 'hit', 'struck', 'taser', 'pepper spray'],
      search: ['searched', 'search', 'seizure', 'confiscated', 'took', 'grabbed'],
      arrest: ['arrested', 'handcuffed', 'detained', 'custody', 'booking'],
      rights: ['miranda', 'rights', 'lawyer', 'attorney', 'silent', 'refuse'],
      discrimination: ['racial', 'profiling', 'discrimination', 'bias', 'harassment'],
      misconduct: ['lied', 'false', 'planted', 'corruption', 'abuse', 'intimidation']
    };

    const keywords: string[] = [];
    Object.entries(patterns).forEach(([category, terms]) => {
      terms.forEach(term => {
        if (text.includes(term)) {
          keywords.push(`${category}:${term}`);
        }
      });
    });

    return keywords;
  }

  // Identify types of violations based on content
  private static identifyViolationTypes(text: string, keywords: string[]): string[] {
    const violations: string[] = [];

    // Fourth Amendment violations
    if (keywords.some(k => k.includes('search') || k.includes('seizure'))) {
      violations.push('fourth_amendment');
    }

    // Fifth Amendment violations  
    if (keywords.some(k => k.includes('rights') || k.includes('miranda'))) {
      violations.push('fifth_amendment');
    }

    // Excessive force
    if (keywords.some(k => k.includes('force'))) {
      violations.push('excessive_force');
    }

    // Discrimination
    if (keywords.some(k => k.includes('discrimination'))) {
      violations.push('discrimination');
    }

    // General misconduct
    if (keywords.some(k => k.includes('misconduct'))) {
      violations.push('misconduct');
    }

    return violations;
  }

  // Assess severity of incident
  private static assessSeverity(text: string, violations: string[]): string {
    const criticalKeywords = ['death', 'hospital', 'injury', 'weapon', 'taser', 'gun'];
    const highKeywords = ['arrest', 'handcuff', 'force', 'violence', 'assault'];
    
    if (criticalKeywords.some(keyword => text.includes(keyword))) {
      return 'critical';
    }
    
    if (highKeywords.some(keyword => text.includes(keyword)) || violations.length > 2) {
      return 'high';
    }
    
    if (violations.length > 0) {
      return 'medium';
    }
    
    return 'low';
  }

  // Extract officer actions from text
  private static extractOfficerActions(text: string): string[] {
    const actionPatterns = [
      'pulled over', 'stopped', 'approached', 'questioned', 'searched', 'arrested',
      'handcuffed', 'detained', 'used force', 'drew weapon', 'threatened', 'intimidated'
    ];

    return actionPatterns.filter(action => text.includes(action));
  }

  // Identify constitutional violations
  private static identifyConstitutionalViolations(text: string): string[] {
    const violations: string[] = [];

    if (text.includes('search') && text.includes('warrant')) {
      violations.push('Fourth Amendment - Unreasonable Search');
    }

    if (text.includes('miranda') || text.includes('right to remain silent')) {
      violations.push('Fifth Amendment - Self-Incrimination');
    }

    if (text.includes('excessive force') || text.includes('brutality')) {
      violations.push('Fourteenth Amendment - Due Process');
    }

    return violations;
  }

  // Identify evidence types available
  private static identifyEvidenceTypes(incident: any): string[] {
    const evidence: string[] = [];

    if (incident.mediaUrls && incident.mediaUrls.length > 0) {
      evidence.push('video_recording', 'audio_recording');
    }

    if (incident.location) {
      evidence.push('gps_location');
    }

    if (incident.description && incident.description.length > 100) {
      evidence.push('detailed_testimony');
    }

    evidence.push('incident_report', 'timestamp_data');

    return evidence;
  }

  // Generate specific complaint suggestions based on analysis
  private static async generateSuggestionsFromAnalysis(
    analysis: IncidentAnalysis,
    incident: any,
    additionalContext?: string
  ): Promise<ComplaintSuggestion[]> {
    const suggestions: ComplaintSuggestion[] = [];

    // Fourth Amendment violations
    if (analysis.violationTypes.includes('fourth_amendment')) {
      suggestions.push({
        id: `fourth_${Date.now()}`,
        type: 'constitutional_violation',
        title: 'Unlawful Search and Seizure',
        description: 'Officer conducted search without warrant or probable cause, violating Fourth Amendment protections.',
        severity: 'high',
        confidence: 0.85,
        legalBasis: ['Fourth Amendment', 'Terry v. Ohio', 'Mapp v. Ohio'],
        suggestedActions: [
          'File complaint with police department',
          'Request body camera footage',
          'Document all evidence immediately',
          'Contact civil rights attorney'
        ],
        evidence: analysis.evidenceTypes,
        timelineUrgency: 'within_24h',
        jurisdiction: analysis.jurisdiction,
        applicableLaws: ['42 USC 1983', 'State Constitutional Protections']
      });
    }

    // Fifth Amendment violations
    if (analysis.violationTypes.includes('fifth_amendment')) {
      suggestions.push({
        id: `fifth_${Date.now()}`,
        type: 'constitutional_violation',
        title: 'Miranda Rights Violation',
        description: 'Officer failed to properly inform of constitutional rights during custodial interrogation.',
        severity: 'medium',
        confidence: 0.75,
        legalBasis: ['Fifth Amendment', 'Miranda v. Arizona'],
        suggestedActions: [
          'Document exact statements made',
          'File complaint for procedural violation',
          'Request recording of interrogation',
          'Consult with criminal defense attorney'
        ],
        evidence: analysis.evidenceTypes,
        timelineUrgency: 'within_week',
        jurisdiction: analysis.jurisdiction,
        applicableLaws: ['Miranda doctrine', 'State procedural rules']
      });
    }

    // Excessive force
    if (analysis.violationTypes.includes('excessive_force')) {
      suggestions.push({
        id: `force_${Date.now()}`,
        type: 'excessive_force',
        title: 'Excessive Use of Force',
        description: 'Officer used unreasonable force beyond what was necessary for the situation.',
        severity: analysis.severity === 'critical' ? 'critical' : 'high',
        confidence: 0.90,
        legalBasis: ['Fourteenth Amendment', 'Graham v. Connor', 'Tennessee v. Garner'],
        suggestedActions: [
          'Seek immediate medical attention if injured',
          'File criminal complaint',
          'File civil rights lawsuit',
          'Request internal affairs investigation',
          'Document all injuries with photographs'
        ],
        evidence: [...analysis.evidenceTypes, 'medical_records'],
        timelineUrgency: 'immediate',
        jurisdiction: analysis.jurisdiction,
        applicableLaws: ['42 USC 1983', 'State assault statutes', 'Police use of force policies'],
        precedentCases: ['Graham v. Connor (1989)', 'Tennessee v. Garner (1985)']
      });
    }

    // Discrimination
    if (analysis.violationTypes.includes('discrimination')) {
      suggestions.push({
        id: `discrimination_${Date.now()}`,
        type: 'discrimination',
        title: 'Discriminatory Policing',
        description: 'Officer engaged in biased enforcement or discriminatory treatment based on protected characteristics.',
        severity: 'high',
        confidence: 0.70,
        legalBasis: ['Fourteenth Amendment Equal Protection', 'Title VI', 'State civil rights laws'],
        suggestedActions: [
          'File complaint with police department',
          'Report to FBI Civil Rights Division',
          'Document pattern of discriminatory stops',
          'Contact ACLU or civil rights organization'
        ],
        evidence: analysis.evidenceTypes,
        timelineUrgency: 'within_week',
        jurisdiction: analysis.jurisdiction,
        applicableLaws: ['42 USC 1983', '42 USC 14141', 'State civil rights statutes']
      });
    }

    // General misconduct
    if (analysis.violationTypes.includes('misconduct') || analysis.keywords.length > 3) {
      suggestions.push({
        id: `misconduct_${Date.now()}`,
        type: 'misconduct',
        title: 'Police Misconduct',
        description: 'Officer engaged in unprofessional conduct or violation of department policies.',
        severity: 'medium',
        confidence: 0.65,
        legalBasis: ['Department policies', 'Professional standards', 'State law enforcement regulations'],
        suggestedActions: [
          'File formal complaint with police department',
          'Request supervisor review',
          'Document witness statements',
          'Keep detailed records'
        ],
        evidence: analysis.evidenceTypes,
        timelineUrgency: 'within_month',
        jurisdiction: analysis.jurisdiction,
        applicableLaws: ['Police department regulations', 'State peace officer standards']
      });
    }

    return suggestions;
  }

  // Get similar cases for pattern analysis
  static async getSimilarCases(userId: string, keywords: string[]): Promise<any[]> {
    try {
      const similarIncidents = await db
        .select()
        .from(incidents)
        .where(eq(incidents.userId, userId))
        .orderBy(desc(incidents.createdAt))
        .limit(10);

      return similarIncidents.filter(incident => {
        const text = `${incident.description || ''} ${incident.notes || ''}`.toLowerCase();
        return keywords.some(keyword => text.includes(keyword.split(':')[1]));
      });
    } catch (error) {
      console.error('Error getting similar cases:', error);
      return [];
    }
  }

  // Validate complaint suggestion before filing
  static async validateComplaintSuggestion(
    suggestionId: string,
    userInput: any
  ): Promise<{ isValid: boolean; warnings: string[]; recommendations: string[] }> {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check if user has sufficient evidence
    if (!userInput.evidence || userInput.evidence.length === 0) {
      warnings.push('Limited evidence available - consider gathering additional documentation');
      recommendations.push('Record detailed statement of events while memory is fresh');
    }

    // Check timing
    const timeSinceIncident = new Date().getTime() - new Date(userInput.incidentDate).getTime();
    const daysSince = Math.floor(timeSinceIncident / (1000 * 60 * 60 * 24));

    if (daysSince > 30) {
      warnings.push('Incident occurred more than 30 days ago - some jurisdictions have filing deadlines');
      recommendations.push('Check local complaint filing deadlines immediately');
    }

    // Check jurisdiction
    if (!userInput.jurisdiction || userInput.jurisdiction === 'unknown') {
      warnings.push('Jurisdiction not specified - complaint may be filed with wrong agency');
      recommendations.push('Verify correct police department or agency for complaint filing');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }

  // Generate legal research suggestions
  static async generateLegalResearch(suggestion: ComplaintSuggestion): Promise<{
    statutes: string[];
    caselaw: string[];
    resources: string[];
  }> {
    const research = {
      statutes: [] as string[],
      caselaw: [] as string[],
      resources: [] as string[]
    };

    // Add relevant statutes based on violation type
    switch (suggestion.type) {
      case 'constitutional_violation':
        research.statutes.push('42 U.S.C. § 1983', 'State Civil Rights Act');
        research.caselaw.push('Monroe v. Pape (1961)', 'Bivens v. Six Unknown Named Agents (1971)');
        break;
      
      case 'excessive_force':
        research.statutes.push('18 U.S.C. § 242', 'State assault statutes');
        research.caselaw.push('Graham v. Connor (1989)', 'Tennessee v. Garner (1985)');
        break;
        
      case 'discrimination':
        research.statutes.push('42 U.S.C. § 14141', 'Title VI of Civil Rights Act');
        research.caselaw.push('Whren v. United States (1996)', 'Terry v. Ohio (1968)');
        break;
    }

    // Add general resources
    research.resources.push(
      'ACLU Know Your Rights',
      'FBI Civil Rights Division',
      'State Attorney General Civil Rights Office',
      'Police accountability organizations'
    );

    return research;
  }
}