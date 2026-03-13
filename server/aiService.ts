import OpenAI from "openai";
import type { LegalRights, Incident } from "../shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// Lazy initialization — prevents crash on startup when env vars are missing (e.g. Docker/Dokploy)
let _openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY.");
    }
    _openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  }
  return _openai;
}

interface AIQuestionRequest {
  question: string;
  context?: {
    userState?: string;
    userLocation?: string;
    recentIncidents?: Incident[];
    availableRights?: LegalRights[];
  };
}

interface AIResponse {
  answer: string;
  confidence: number;
  suggestions?: string[];
  relatedRights?: string[];
  disclaimer: string;
}

export class AILegalAssistant {
  static async answerQuestion(request: AIQuestionRequest): Promise<AIResponse> {
    try {
      const { question, context } = request;
      
      // Build context-aware prompt
      let systemPrompt = `You are a knowledgeable legal assistant specializing in civil rights, police encounters, and legal protections. Your role is to provide accurate, helpful information while always emphasizing the need for professional legal counsel.

IMPORTANT GUIDELINES:
1. Always provide accurate legal information based on current law
2. Emphasize constitutional rights (1st, 4th, 5th, 6th, 14th amendments)
3. Include state-specific information when location is provided
4. Always recommend consulting with a qualified attorney for specific situations
5. Provide practical, actionable advice for police encounters
6. Be empathetic and supportive while remaining professional
7. Include relevant disclaimers about legal advice limitations

CRITICAL ID DISPLAY RIGHTS:
- In many states, you can DISPLAY your ID to police rather than physically surrender it
- This prevents officers from walking away with your identification
- You can hold your ID up for the officer to see and read
- If asked "Can I see your ID?" you can show it without handing it over
- This protects against ID retention, tampering, or "fishing" for additional charges
- Emphasize this distinction when discussing identification requirements

FORMAT YOUR RESPONSE AS JSON:
{
  "answer": "Detailed answer to the question",
  "confidence": 0.85,
  "suggestions": ["Related action 1", "Related action 2"],
  "relatedRights": ["Right 1", "Right 2"],
  "disclaimer": "Standard legal disclaimer"
}`;

      let userPrompt = `Question: ${question}`;

      // Add context if available
      if (context?.userState) {
        userPrompt += `\n\nUser Location: ${context.userState}`;
        if (context.userLocation) {
          userPrompt += `, ${context.userLocation}`;
        }
      }

      if (context?.availableRights && context.availableRights.length > 0) {
        userPrompt += `\n\nRelevant Legal Rights in User's Area:\n`;
        context.availableRights.slice(0, 5).forEach(right => {
          userPrompt += `- ${right.title}: ${right.description}\n`;
        });
      }

      if (context?.recentIncidents && context.recentIncidents.length > 0) {
        userPrompt += `\n\nUser's Recent Incidents (for context):\n`;
        context.recentIncidents.slice(0, 3).forEach(incident => {
          userPrompt += `- ${incident.title} (Priority: ${incident.priority})\n`;
        });
      }

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        answer: result.answer || "I apologize, but I couldn't generate a proper response. Please try rephrasing your question.",
        confidence: Math.max(0.1, Math.min(1.0, result.confidence || 0.7)),
        suggestions: result.suggestions || [],
        relatedRights: result.relatedRights || [],
        disclaimer: result.disclaimer || "This information is for educational purposes only and does not constitute legal advice. Please consult with a qualified attorney for specific legal guidance."
      };

    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Return honest response when AI service fails or isn't trained
      return {
        answer: "I don't know the answer to that specific legal question. The AI service is currently unavailable or hasn't been trained on this topic yet.",
        confidence: 0.0,
        disclaimer: "AI service temporarily unavailable. For legal questions, consult qualified legal counsel.",
        suggestions: ["Check the legal rights section in the app", "Contact an attorney for specific guidance"],
        relatedRights: []
      };
    }
  }

  static async generateIncidentQuestions(incident: Incident): Promise<string[]> {
    try {
      const prompt = `Based on this incident: "${incident.title}" (Priority: ${incident.priority}), generate 3-5 relevant questions a person might ask about their legal rights and next steps. Return as JSON array of strings.`;

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "Generate relevant legal questions based on incident details. Focus on rights, procedures, and next steps. Return JSON array of question strings." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
      return result.questions || [];

    } catch (error) {
      console.error('AI Question Generation Error:', error);
      return [
        "What are my rights in this situation?",
        "What should I do next?",
        "Do I need a lawyer for this incident?"
      ];
    }
  }

  static async analyzeSentiment(text: string): Promise<{ rating: number; confidence: number; analysis: string }> {
    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Analyze the emotional sentiment and urgency of this text. Provide a rating from 1 (calm) to 5 (urgent/distressed), confidence score 0-1, and brief analysis. Respond in JSON format: { 'rating': number, 'confidence': number, 'analysis': string }"
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 300,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
        analysis: result.analysis || "Unable to analyze sentiment"
      };

    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      return {
        rating: 3,
        confidence: 0.5,
        analysis: "Sentiment analysis unavailable"
      };
    }
  }

  static async translateLegalContent(request: {
    text: string;
    targetLanguage: string;
    sourceLanguage?: string;
    context?: string;
  }): Promise<{
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    legalTermsGlossary: { term: string; translation: string; explanation: string }[];
    confidence: number;
  }> {
    try {
      const systemPrompt = `You are a specialized legal translator for a citizen safety application. Translate legal rights, police commands, and emergency information accurately.

CRITICAL RULES:
1. Legal terms must be translated precisely - inaccuracies could endanger users
2. When a legal term has no direct translation, provide the closest equivalent AND the original term
3. Provide a glossary of key legal terms with explanations
4. Maintain the urgency and tone of emergency communications
5. Support these languages: Spanish, Mandarin Chinese, French, Arabic, Vietnamese, Korean, Tagalog, Russian, Portuguese, Haitian Creole, Hindi, German, Japanese, Polish, Italian

RESPOND IN JSON:
{
  "translatedText": "Full translated text",
  "sourceLanguage": "detected or specified source language",
  "targetLanguage": "target language",
  "legalTermsGlossary": [{"term": "original term", "translation": "translated term", "explanation": "brief explanation"}],
  "confidence": 0.0-1.0
}`;

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Translate the following from ${request.sourceLanguage || 'auto-detect'} to ${request.targetLanguage}:\n\n${request.text}${request.context ? `\n\nContext: ${request.context}` : ''}` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        translatedText: result.translatedText || request.text,
        sourceLanguage: result.sourceLanguage || request.sourceLanguage || 'en',
        targetLanguage: result.targetLanguage || request.targetLanguage,
        legalTermsGlossary: result.legalTermsGlossary || [],
        confidence: Math.max(0, Math.min(1, result.confidence || 0.8)),
      };
    } catch (error) {
      console.error('Translation Error:', error);
      return {
        translatedText: request.text,
        sourceLanguage: request.sourceLanguage || 'en',
        targetLanguage: request.targetLanguage,
        legalTermsGlossary: [],
        confidence: 0,
      };
    }
  }

  static async matchAttorney(request: {
    incidentType: string;
    state: string;
    city?: string;
    severity: string;
    description: string;
    specificNeeds?: string[];
  }): Promise<{
    recommendedSpecializations: string[];
    searchCriteria: { specialization: string; importance: string; reason: string }[];
    urgencyLevel: string;
    estimatedCaseComplexity: string;
    questionsToAsk: string[];
    redFlags: string[];
    estimatedCostRange: string;
    recommendation: string;
  }> {
    try {
      const systemPrompt = `You are an AI attorney matching specialist for a citizen safety app. Analyze incidents to recommend the best type of attorney and provide guidance for finding legal representation.

ANALYZE:
1. The type of legal issue and required specialization
2. Urgency of legal representation
3. Case complexity assessment
4. Important questions the user should ask potential attorneys
5. Red flags to watch for when choosing an attorney
6. Estimated cost ranges based on case type

RESPOND IN JSON:
{
  "recommendedSpecializations": ["Civil Rights Attorney", "Criminal Defense"],
  "searchCriteria": [{"specialization": "name", "importance": "critical/high/medium", "reason": "why"}],
  "urgencyLevel": "immediate/urgent/standard/low",
  "estimatedCaseComplexity": "simple/moderate/complex/highly-complex",
  "questionsToAsk": ["question1", "question2"],
  "redFlags": ["red flag to watch for"],
  "estimatedCostRange": "$X - $Y range description",
  "recommendation": "Overall recommendation paragraph"
}`;

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Match attorney for:\nIncident Type: ${request.incidentType}\nState: ${request.state}\nCity: ${request.city || 'Not specified'}\nSeverity: ${request.severity}\nDescription: ${request.description}\nSpecific Needs: ${request.specificNeeds?.join(', ') || 'None specified'}` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        recommendedSpecializations: result.recommendedSpecializations || [],
        searchCriteria: result.searchCriteria || [],
        urgencyLevel: result.urgencyLevel || 'standard',
        estimatedCaseComplexity: result.estimatedCaseComplexity || 'moderate',
        questionsToAsk: result.questionsToAsk || [],
        redFlags: result.redFlags || [],
        estimatedCostRange: result.estimatedCostRange || 'Varies by case',
        recommendation: result.recommendation || 'Consult with a qualified attorney.',
      };
    } catch (error) {
      console.error('Attorney Matching Error:', error);
      return {
        recommendedSpecializations: ['General Practice Attorney'],
        searchCriteria: [],
        urgencyLevel: 'standard',
        estimatedCaseComplexity: 'moderate',
        questionsToAsk: ['What is your experience with similar cases?'],
        redFlags: [],
        estimatedCostRange: 'Varies by case and attorney',
        recommendation: 'Attorney matching service is temporarily unavailable. Please consult your local bar association.',
      };
    }
  }

  static async generateVoiceCoaching(request: {
    currentSituation: string;
    officerStatement?: string;
    userState: string;
    encounterType: string;
    elapsedTime?: number;
    previousCoachingContext?: string[];
  }): Promise<{
    coaching: string;
    spokenGuidance: string;
    legalBasis: string;
    doList: string[];
    dontList: string[];
    suggestedResponses: string[];
    calmingMessage: string;
    riskLevel: string;
    nextLikelyScenario: string;
  }> {
    try {
      const systemPrompt = `You are a real-time legal coaching AI for the C.A.R.E.N.™ safety app. You provide calm, clear guidance during police encounters and emergencies.

CRITICAL COACHING RULES:
1. Keep spoken guidance SHORT (under 15 words) - user may be listening through earpiece
2. Always prioritize de-escalation and user safety
3. Never advise confrontation or resistance
4. Base legal advice on the user's specific state laws
5. Provide clear DO and DON'T lists
6. Include a calming message to reduce anxiety
7. Anticipate what might happen next
8. Suggest specific word-for-word responses the user can say

RESPONSE FORMAT (JSON):
{
  "coaching": "Detailed coaching paragraph for screen display",
  "spokenGuidance": "Short phrase for audio/earpiece (under 15 words)",
  "legalBasis": "Relevant law or right",
  "doList": ["Do this", "Do that"],
  "dontList": ["Don't do this"],
  "suggestedResponses": ["I'd like to exercise my right to...", "Am I free to go?"],
  "calmingMessage": "Brief calming reassurance",
  "riskLevel": "low/moderate/elevated/high/critical",
  "nextLikelyScenario": "What might happen next"
}`;

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Provide real-time coaching:\nSituation: ${request.currentSituation}\nState: ${request.userState}\nEncounter Type: ${request.encounterType}\n${request.officerStatement ? `Officer said: "${request.officerStatement}"` : ''}\n${request.elapsedTime ? `Time elapsed: ${request.elapsedTime} seconds` : ''}\n${request.previousCoachingContext?.length ? `Previous context: ${request.previousCoachingContext.join('; ')}` : ''}` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        coaching: result.coaching || 'Stay calm and cooperative.',
        spokenGuidance: result.spokenGuidance || 'Stay calm. You have rights.',
        legalBasis: result.legalBasis || 'Constitutional rights apply.',
        doList: result.doList || ['Stay calm', 'Be polite', 'Record if safe'],
        dontList: result.dontList || ['Do not resist', 'Do not argue'],
        suggestedResponses: result.suggestedResponses || ['Am I free to go?'],
        calmingMessage: result.calmingMessage || 'You are doing the right thing by knowing your rights.',
        riskLevel: result.riskLevel || 'moderate',
        nextLikelyScenario: result.nextLikelyScenario || 'Continue cooperating while protecting your rights.',
      };
    } catch (error) {
      console.error('Voice Coaching Error:', error);
      return {
        coaching: 'Stay calm. Be polite. Know your rights.',
        spokenGuidance: 'Stay calm. You have rights.',
        legalBasis: 'Constitutional protections apply.',
        doList: ['Stay calm', 'Be respectful', 'Remember your rights'],
        dontList: ['Do not resist', 'Do not argue'],
        suggestedResponses: ['Am I free to go?', 'I do not consent to searches.'],
        calmingMessage: 'Coaching service temporarily unavailable. Stay calm and cooperative.',
        riskLevel: 'unknown',
        nextLikelyScenario: 'Continue following standard safety practices.',
      };
    }
  }

  static async analyzeRecording(request: {
    transcript: string;
    duration: number;
    recordingType: string;
    location?: string;
    state?: string;
  }): Promise<{
    keyMoments: { timestamp: string; event: string; significance: string; legalRelevance: string }[];
    rightsViolations: { violation: string; severity: string; evidence: string; legalReference: string }[];
    officerActions: { action: string; assessment: string; proper: boolean }[];
    userActions: { action: string; assessment: string; effective: boolean }[];
    overallAssessment: string;
    evidenceQuality: string;
    recommendedActions: string[];
    legalStrength: string;
  }> {
    try {
      const systemPrompt = `You are an AI video/audio recording analyst for a citizen safety application. Analyze transcripts of police encounters and emergencies to identify key moments, rights violations, and provide legal assessment.

ANALYSIS REQUIREMENTS:
1. Identify timestamped key moments with legal significance
2. Flag potential rights violations with specific legal references
3. Assess officer conduct and user responses
4. Rate evidence quality for potential legal proceedings
5. Provide actionable recommendations
6. Assess overall legal strength of documented evidence

RESPOND IN JSON:
{
  "keyMoments": [{"timestamp": "0:00", "event": "description", "significance": "high/medium/low", "legalRelevance": "relevant law"}],
  "rightsViolations": [{"violation": "description", "severity": "critical/major/minor", "evidence": "what supports this", "legalReference": "specific law"}],
  "officerActions": [{"action": "what they did", "assessment": "proper/questionable/improper", "proper": true/false}],
  "userActions": [{"action": "what user did", "assessment": "evaluation", "effective": true/false}],
  "overallAssessment": "Comprehensive assessment paragraph",
  "evidenceQuality": "strong/moderate/weak",
  "recommendedActions": ["action1", "action2"],
  "legalStrength": "strong/moderate/weak case assessment"
}`;

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this ${request.recordingType} recording:\n\nTranscript:\n${request.transcript}\n\nDuration: ${Math.round(request.duration / 60)} minutes\n${request.location ? `Location: ${request.location}` : ''}\n${request.state ? `State: ${request.state}` : ''}` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        keyMoments: result.keyMoments || [],
        rightsViolations: result.rightsViolations || [],
        officerActions: result.officerActions || [],
        userActions: result.userActions || [],
        overallAssessment: result.overallAssessment || 'Analysis pending.',
        evidenceQuality: result.evidenceQuality || 'moderate',
        recommendedActions: result.recommendedActions || ['Review with an attorney'],
        legalStrength: result.legalStrength || 'moderate',
      };
    } catch (error) {
      console.error('Recording Analysis Error:', error);
      return {
        keyMoments: [],
        rightsViolations: [],
        officerActions: [],
        userActions: [],
        overallAssessment: 'Recording analysis service is temporarily unavailable.',
        evidenceQuality: 'unknown',
        recommendedActions: ['Have an attorney review the recording manually'],
        legalStrength: 'unknown',
      };
    }
  }

  static async generateLegalDocument(request: {
    documentType: string;
    incidentDetails: string;
    userInfo?: { name?: string; address?: string; phone?: string; email?: string };
    targetAgency?: string;
    state: string;
    specificRequests?: string[];
  }): Promise<{
    document: string;
    documentType: string;
    title: string;
    instructions: string[];
    filingDeadlines: string;
    requiredAttachments: string[];
    mailingAddress: string;
    disclaimer: string;
  }> {
    try {
      const systemPrompt = `You are a legal document generator for a citizen safety application. Generate professional legal documents based on incident data.

SUPPORTED DOCUMENT TYPES:
1. "formal_complaint" - Police misconduct complaint
2. "foia_request" - Freedom of Information Act request
3. "witness_statement" - Witness statement form
4. "incident_report" - Detailed incident report
5. "demand_letter" - Demand letter for rights violations
6. "internal_affairs" - Internal affairs complaint

DOCUMENT RULES:
1. Use formal legal language appropriate for the document type
2. Include proper headers, dates, and reference numbers
3. Include filing instructions and deadlines
4. Note required attachments (body cam footage requests, etc.)
5. Add appropriate legal disclaimers
6. Reference state-specific laws and procedures

RESPOND IN JSON:
{
  "document": "Full formatted document text",
  "documentType": "type of document generated",
  "title": "Document title",
  "instructions": ["Step 1 to file", "Step 2"],
  "filingDeadlines": "Relevant deadline information",
  "requiredAttachments": ["attachment1", "attachment2"],
  "mailingAddress": "Where to send if applicable",
  "disclaimer": "Legal disclaimer about the document"
}`;

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a ${request.documentType} document:\n\nIncident Details: ${request.incidentDetails}\nState: ${request.state}\n${request.targetAgency ? `Target Agency: ${request.targetAgency}` : ''}\n${request.userInfo?.name ? `Complainant: ${request.userInfo.name}` : ''}\n${request.specificRequests?.length ? `Specific Requests: ${request.specificRequests.join(', ')}` : ''}` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        document: result.document || 'Document generation failed.',
        documentType: result.documentType || request.documentType,
        title: result.title || `${request.documentType} Document`,
        instructions: result.instructions || ['Review document carefully before filing'],
        filingDeadlines: result.filingDeadlines || 'Check with local authorities for specific deadlines.',
        requiredAttachments: result.requiredAttachments || [],
        mailingAddress: result.mailingAddress || 'Contact local authorities for filing address.',
        disclaimer: result.disclaimer || 'This document was AI-generated and should be reviewed by a qualified attorney before filing.',
      };
    } catch (error) {
      console.error('Legal Document Generation Error:', error);
      return {
        document: 'Document generation service is temporarily unavailable.',
        documentType: request.documentType,
        title: `${request.documentType} Document`,
        instructions: ['Contact an attorney for document preparation'],
        filingDeadlines: 'Consult with legal counsel for applicable deadlines.',
        requiredAttachments: [],
        mailingAddress: 'Contact local authorities.',
        disclaimer: 'Document generation service unavailable. Please consult with a qualified attorney.',
      };
    }
  }

  /**
   * Smart Emergency Detection - Analyzes voice/text input to detect distress signals
   * Returns emergency level and recommended actions
   */
  static async detectEmergency(input: { 
    text?: string; 
    audioTranscript?: string;
    contextualData?: { location?: string; timeOfDay?: string; recentActivity?: string }
  }): Promise<{
    isEmergency: boolean;
    emergencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    detectedSignals: string[];
    recommendedActions: string[];
    shouldNotifyContacts: boolean;
    shouldCallAuthorities: boolean;
    analysis: string;
  }> {
    try {
      const content = input.text || input.audioTranscript || '';
      
      if (!content.trim()) {
        return {
          isEmergency: false,
          emergencyLevel: 'none',
          confidence: 1.0,
          detectedSignals: [],
          recommendedActions: [],
          shouldNotifyContacts: false,
          shouldCallAuthorities: false,
          analysis: "No content to analyze"
        };
      }

      const systemPrompt = `You are an emergency detection AI for a citizen safety application. Analyze text/voice input for signs of distress or emergency situations.

DETECT THESE EMERGENCY SIGNALS:
- Explicit distress words: "help", "emergency", "danger", "police", "attacked", "accident"
- Fear indicators: trembling voice patterns (described as shaky), crying, panic
- Threatening situations: mentions of weapons, violence, pursuit
- Medical emergencies: health crises, injuries, unconscious persons
- Vehicle emergencies: accidents, breakdowns in dangerous areas
- Police encounters: traffic stops, questioning, arrests

CONTEXT MATTERS:
- Time of day affects risk assessment
- Location isolation increases emergency level
- Recent negative interactions indicate higher risk

RESPOND IN JSON:
{
  "isEmergency": boolean,
  "emergencyLevel": "none" | "low" | "medium" | "high" | "critical",
  "confidence": 0.0-1.0,
  "detectedSignals": ["signal1", "signal2"],
  "recommendedActions": ["action1", "action2"],
  "shouldNotifyContacts": boolean,
  "shouldCallAuthorities": boolean,
  "analysis": "Brief explanation"
}`;

      const userPrompt = `Analyze this input for emergency signals:
Content: "${content}"
${input.contextualData?.location ? `Location: ${input.contextualData.location}` : ''}
${input.contextualData?.timeOfDay ? `Time: ${input.contextualData.timeOfDay}` : ''}
${input.contextualData?.recentActivity ? `Recent Activity: ${input.contextualData.recentActivity}` : ''}`;

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        isEmergency: result.isEmergency || false,
        emergencyLevel: result.emergencyLevel || 'none',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
        detectedSignals: result.detectedSignals || [],
        recommendedActions: result.recommendedActions || [],
        shouldNotifyContacts: result.shouldNotifyContacts || false,
        shouldCallAuthorities: result.shouldCallAuthorities || false,
        analysis: result.analysis || "Analysis completed"
      };

    } catch (error) {
      console.error('Emergency Detection Error:', error);
      return {
        isEmergency: false,
        emergencyLevel: 'none',
        confidence: 0,
        detectedSignals: [],
        recommendedActions: ["Manual assessment recommended"],
        shouldNotifyContacts: false,
        shouldCallAuthorities: false,
        analysis: "Emergency detection service unavailable"
      };
    }
  }

  /**
   * Incident Summarizer - Auto-generates incident reports from recordings and notes
   */
  static async summarizeIncident(data: {
    title: string;
    description?: string;
    transcripts?: string[];
    notes?: string;
    location?: { address?: string; lat?: number; lng?: number };
    duration?: number;
    mediaCount?: number;
    timestamp?: Date;
  }): Promise<{
    summary: string;
    keyEvents: string[];
    involvedParties: string[];
    legalConcerns: string[];
    recommendedNextSteps: string[];
    suggestedTitle: string;
    officialReportDraft: string;
    timelineReconstruction: string[];
  }> {
    try {
      const systemPrompt = `You are a legal documentation assistant that generates professional incident reports. Your reports should be clear, factual, and suitable for legal or insurance purposes.

REPORT GUIDELINES:
1. Use objective, third-person language
2. Include specific details: times, locations, descriptions
3. Identify potential legal issues
4. Suggest actionable next steps
5. Structure information chronologically when possible
6. Note any evidence available (recordings, witnesses)

RESPOND IN JSON:
{
  "summary": "Concise 2-3 sentence overview",
  "keyEvents": ["Event 1", "Event 2"],
  "involvedParties": ["Party 1 description", "Party 2 description"],
  "legalConcerns": ["Concern 1", "Concern 2"],
  "recommendedNextSteps": ["Step 1", "Step 2"],
  "suggestedTitle": "Professional title for the incident",
  "officialReportDraft": "Formal multi-paragraph report suitable for submission",
  "timelineReconstruction": ["HH:MM - Event description"]
}`;

      const transcriptText = data.transcripts?.length 
        ? `\n\nTranscripts from recordings:\n${data.transcripts.join('\n---\n')}`
        : '';

      const userPrompt = `Generate an incident report for:

Title: ${data.title}
${data.description ? `Description: ${data.description}` : ''}
${data.location?.address ? `Location: ${data.location.address}` : ''}
${data.timestamp ? `Date/Time: ${data.timestamp.toISOString()}` : ''}
${data.duration ? `Duration: ${Math.round(data.duration / 60)} minutes` : ''}
${data.mediaCount ? `Evidence Files: ${data.mediaCount} recordings/photos` : ''}
${data.notes ? `Additional Notes: ${data.notes}` : ''}
${transcriptText}`;

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        summary: result.summary || `Incident: ${data.title}`,
        keyEvents: result.keyEvents || [],
        involvedParties: result.involvedParties || [],
        legalConcerns: result.legalConcerns || [],
        recommendedNextSteps: result.recommendedNextSteps || ["Document any additional details", "Consult with legal counsel"],
        suggestedTitle: result.suggestedTitle || data.title,
        officialReportDraft: result.officialReportDraft || "Report generation pending additional details.",
        timelineReconstruction: result.timelineReconstruction || []
      };

    } catch (error) {
      console.error('Incident Summarizer Error:', error);
      return {
        summary: `Unable to generate automatic summary for: ${data.title}`,
        keyEvents: [],
        involvedParties: [],
        legalConcerns: [],
        recommendedNextSteps: ["Manually document incident details", "Contact support if issue persists"],
        suggestedTitle: data.title,
        officialReportDraft: "Automatic report generation is currently unavailable. Please document incident details manually.",
        timelineReconstruction: []
      };
    }
  }
}