import { db } from "./db";
import { 
  evidenceCatalog, 
  evidenceAnalysisJobs, 
  evidenceRelationships, 
  evidenceQuality, 
  evidenceCategorizationRules, 
  evidenceAccessLogs,
  type InsertEvidenceCatalog,
  type EvidenceCatalog,
  type InsertEvidenceAnalysisJob,
  type EvidenceAnalysisJob,
  type InsertEvidenceRelationship,
  type EvidenceRelationship,
  type InsertEvidenceQuality,
  type EvidenceQuality,
  type InsertEvidenceCategorizationRule,
  type EvidenceCategorizationRule,
  type InsertEvidenceAccessLog,
  type EvidenceAccessLog
} from "@shared/schema";
import { eq, and, desc, asc, sql, like, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

/**
 * AUTOMATED EVIDENCE CATALOGING SERVICE
 * Comprehensive evidence management, analysis, and organization system
 */

export class EvidenceCatalogService {
  
  // ========================================
  // EVIDENCE CATALOG MANAGEMENT
  // ========================================

  /**
   * Add new evidence to the catalog with automatic analysis
   */
  async addEvidence(evidenceData: {
    userId: string;
    incidentId?: number;
    complaintId?: string;
    fileName: string;
    originalFileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    fileBuffer?: Buffer; // For hash calculation
    evidenceType: string;
    category?: string;
    capturedAt: Date;
    location?: any;
    deviceInfo?: any;
    cameraSettings?: any;
  }): Promise<EvidenceCatalog> {
    
    // Generate file hash for integrity
    const fileHash = evidenceData.fileBuffer 
      ? crypto.createHash('sha256').update(evidenceData.fileBuffer).digest('hex')
      : crypto.createHash('sha256').update(evidenceData.fileName + Date.now()).digest('hex');

    // Auto-detect category if not provided
    const category = evidenceData.category || this.autoDetectCategory(evidenceData.mimeType, evidenceData.fileName);

    const evidenceRecord: InsertEvidenceCatalog = {
      id: uuidv4(),
      userId: evidenceData.userId,
      incidentId: evidenceData.incidentId,
      complaintId: evidenceData.complaintId,
      fileName: evidenceData.fileName,
      originalFileName: evidenceData.originalFileName,
      filePath: evidenceData.filePath,
      fileSize: evidenceData.fileSize,
      mimeType: evidenceData.mimeType,
      fileHash,
      evidenceType: evidenceData.evidenceType,
      category,
      subCategory: this.autoDetectSubCategory(evidenceData.evidenceType, evidenceData.mimeType),
      capturedAt: evidenceData.capturedAt,
      location: evidenceData.location,
      deviceInfo: evidenceData.deviceInfo,
      cameraSettings: evidenceData.cameraSettings,
      chainOfCustody: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        userId: evidenceData.userId,
        device: evidenceData.deviceInfo?.device || 'unknown'
      }],
      processingStatus: 'pending',
      processingProgress: 0
    };

    const [evidence] = await db.insert(evidenceCatalog).values(evidenceRecord).returning();

    // Queue analysis job
    await this.queueAnalysisJob(evidence.id, evidenceData.userId, evidenceData.evidenceType);

    // Apply categorization rules
    await this.applyCategorization(evidence.id);

    // Log access
    await this.logAccess(evidence.id, evidenceData.userId, 'upload', 'web');

    return evidence;
  }

  /**
   * Get evidence by ID with access logging
   */
  async getEvidence(evidenceId: string, userId: string, purpose?: string): Promise<EvidenceCatalog | null> {
    const [evidence] = await db
      .select()
      .from(evidenceCatalog)
      .where(and(
        eq(evidenceCatalog.id, evidenceId),
        eq(evidenceCatalog.userId, userId)
      ));

    if (evidence) {
      // Log access
      await this.logAccess(evidenceId, userId, 'view', 'web', purpose);
      
      // Update view count
      await db
        .update(evidenceCatalog)
        .set({ 
          viewCount: sql`${evidenceCatalog.viewCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(evidenceCatalog.id, evidenceId));
    }

    return evidence || null;
  }

  /**
   * Get all evidence for a user with filters and pagination
   */
  async getUserEvidence(userId: string, filters: {
    evidenceType?: string;
    category?: string;
    isStarred?: boolean;
    isFlagged?: boolean;
    processingStatus?: string;
    incidentId?: number;
    complaintId?: string;
    searchQuery?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'capturedAt' | 'fileName' | 'fileSize';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    evidence: EvidenceCatalog[];
    total: number;
    summary: {
      totalSize: number;
      typeBreakdown: Record<string, number>;
      categoryBreakdown: Record<string, number>;
      qualityDistribution: Record<string, number>;
    };
  }> {
    
    let query = db.select().from(evidenceCatalog).where(eq(evidenceCatalog.userId, userId));
    
    // Apply filters
    const conditions = [eq(evidenceCatalog.userId, userId)];
    
    if (filters.evidenceType) {
      conditions.push(eq(evidenceCatalog.evidenceType, filters.evidenceType));
    }
    
    if (filters.category) {
      conditions.push(eq(evidenceCatalog.category, filters.category));
    }
    
    if (filters.isStarred !== undefined) {
      conditions.push(eq(evidenceCatalog.isStarred, filters.isStarred));
    }
    
    if (filters.isFlagged !== undefined) {
      conditions.push(eq(evidenceCatalog.isFlagged, filters.isFlagged));
    }
    
    if (filters.processingStatus) {
      conditions.push(eq(evidenceCatalog.processingStatus, filters.processingStatus));
    }
    
    if (filters.incidentId) {
      conditions.push(eq(evidenceCatalog.incidentId, filters.incidentId));
    }
    
    if (filters.complaintId) {
      conditions.push(eq(evidenceCatalog.complaintId, filters.complaintId));
    }
    
    if (filters.searchQuery) {
      conditions.push(
        sql`(${evidenceCatalog.fileName} ILIKE ${`%${filters.searchQuery}%`} OR 
            ${evidenceCatalog.detectedText} ILIKE ${`%${filters.searchQuery}%`} OR 
            ${evidenceCatalog.detectedSpeech} ILIKE ${`%${filters.searchQuery}%`})`
      );
    }

    const whereClause = and(...conditions);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(evidenceCatalog)
      .where(whereClause);

    // Build main query
    query = db.select().from(evidenceCatalog).where(whereClause);

    // Apply sorting
    const sortColumn = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortOrder === 'asc' ? asc : desc;
    query = query.orderBy(sortDirection(evidenceCatalog[sortColumn]));

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const evidence = await query;

    // Generate summary statistics
    const allUserEvidence = await db
      .select({
        evidenceType: evidenceCatalog.evidenceType,
        category: evidenceCatalog.category,
        fileSize: evidenceCatalog.fileSize,
        legalRelevance: evidenceCatalog.legalRelevance
      })
      .from(evidenceCatalog)
      .where(eq(evidenceCatalog.userId, userId));

    const summary = {
      totalSize: allUserEvidence.reduce((sum, e) => sum + (e.fileSize || 0), 0),
      typeBreakdown: allUserEvidence.reduce((acc, e) => {
        acc[e.evidenceType] = (acc[e.evidenceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      categoryBreakdown: allUserEvidence.reduce((acc, e) => {
        acc[e.category || 'unknown'] = (acc[e.category || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      qualityDistribution: allUserEvidence.reduce((acc, e) => {
        acc[e.legalRelevance || 'unknown'] = (acc[e.legalRelevance || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return {
      evidence,
      total: parseInt(count as string),
      summary
    };
  }

  // ========================================
  // EVIDENCE ANALYSIS SYSTEM
  // ========================================

  /**
   * Queue analysis job for evidence
   */
  async queueAnalysisJob(evidenceId: string, userId: string, evidenceType: string): Promise<EvidenceAnalysisJob> {
    const jobTypes = this.getAnalysisJobTypes(evidenceType);
    
    // Create analysis job for each type
    const jobs: EvidenceAnalysisJob[] = [];
    
    for (const jobType of jobTypes) {
      const job: InsertEvidenceAnalysisJob = {
        id: uuidv4(),
        evidenceId,
        userId,
        jobType,
        status: 'queued',
        priority: this.getJobPriority(jobType),
        analysisParameters: this.getAnalysisParameters(jobType, evidenceType),
        expectedDuration: this.getExpectedDuration(jobType),
        maxRetries: 3
      };

      const [createdJob] = await db.insert(evidenceAnalysisJobs).values(job).returning();
      jobs.push(createdJob);
    }

    // Return the primary job (usually the first one)
    return jobs[0];
  }

  /**
   * Process analysis job (would be called by background worker)
   */
  async processAnalysisJob(jobId: string): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    const [job] = await db
      .select()
      .from(evidenceAnalysisJobs)
      .where(eq(evidenceAnalysisJobs.id, jobId));

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    // Update job status to running
    await db
      .update(evidenceAnalysisJobs)
      .set({ 
        status: 'running',
        progressStage: 'extracting',
        progressDetails: 'Starting analysis...'
      })
      .where(eq(evidenceAnalysisJobs.id, jobId));

    try {
      const results = await this.performAnalysis(job);
      
      // Update evidence with analysis results
      await this.updateEvidenceWithAnalysis(job.evidenceId, job.jobType, results);

      // Mark job as completed
      await db
        .update(evidenceAnalysisJobs)
        .set({
          status: 'completed',
          results,
          completedAt: new Date(),
          actualDuration: Math.floor((Date.now() - new Date(job.createdAt!).getTime()) / 1000)
        })
        .where(eq(evidenceAnalysisJobs.id, jobId));

      return { success: true, results };

    } catch (error) {
      // Mark job as failed
      await db
        .update(evidenceAnalysisJobs)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: job.retryCount + 1
        })
        .where(eq(evidenceAnalysisJobs.id, jobId));

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ========================================
  // EVIDENCE RELATIONSHIPS
  // ========================================

  /**
   * Find related evidence automatically
   */
  async findRelatedEvidence(evidenceId: string): Promise<EvidenceRelationship[]> {
    const [evidence] = await db
      .select()
      .from(evidenceCatalog)
      .where(eq(evidenceCatalog.id, evidenceId));

    if (!evidence) return [];

    // Find potential relationships based on various criteria
    const potentialMatches = await db
      .select()
      .from(evidenceCatalog)
      .where(and(
        eq(evidenceCatalog.userId, evidence.userId),
        sql`${evidenceCatalog.id} != ${evidenceId}`
      ));

    const relationships: InsertEvidenceRelationship[] = [];

    for (const match of potentialMatches) {
      const relationship = await this.analyzeRelationship(evidence, match);
      if (relationship.confidence >= 0.5) {
        relationships.push({
          id: uuidv4(),
          primaryEvidenceId: evidenceId,
          relatedEvidenceId: match.id,
          relationshipType: relationship.type,
          confidence: relationship.confidence,
          automatedDetection: true,
          similarities: relationship.similarities,
          differences: relationship.differences,
          timeDifference: relationship.timeDifference,
          locationDistance: relationship.locationDistance
        });
      }
    }

    // Save relationships
    if (relationships.length > 0) {
      await db.insert(evidenceRelationships).values(relationships);
    }

    return db
      .select()
      .from(evidenceRelationships)
      .where(eq(evidenceRelationships.primaryEvidenceId, evidenceId))
      .orderBy(desc(evidenceRelationships.confidence));
  }

  // ========================================
  // EVIDENCE QUALITY ASSESSMENT
  // ========================================

  /**
   * Assess evidence quality
   */
  async assessEvidenceQuality(evidenceId: string): Promise<EvidenceQuality> {
    const [evidence] = await db
      .select()
      .from(evidenceCatalog)
      .where(eq(evidenceCatalog.id, evidenceId));

    if (!evidence) {
      throw new Error('Evidence not found');
    }

    const qualityAssessment = await this.performQualityAssessment(evidence);

    const qualityRecord: InsertEvidenceQuality = {
      id: uuidv4(),
      evidenceId,
      overallQuality: qualityAssessment.overallQuality,
      qualityScore: qualityAssessment.qualityScore,
      visualClarity: qualityAssessment.visualClarity,
      audioClarity: qualityAssessment.audioClarity,
      textReadability: qualityAssessment.textReadability,
      completeness: qualityAssessment.completeness,
      relevance: qualityAssessment.relevance,
      qualityIssues: qualityAssessment.qualityIssues,
      suggestions: qualityAssessment.suggestions,
      metadataCompleteness: qualityAssessment.metadataCompleteness,
      timestampAccuracy: qualityAssessment.timestampAccuracy,
      locationAccuracy: qualityAssessment.locationAccuracy,
      assessmentMethod: 'automated',
      assessedBy: 'system',
      assessmentNotes: qualityAssessment.notes
    };

    const [quality] = await db.insert(evidenceQuality).values(qualityRecord).returning();
    return quality;
  }

  // ========================================
  // CATEGORIZATION RULES
  // ========================================

  /**
   * Apply categorization rules to evidence
   */
  async applyCategorization(evidenceId: string): Promise<void> {
    const rules = await db
      .select()
      .from(evidenceCategorizationRules)
      .where(eq(evidenceCategorizationRules.isActive, true))
      .orderBy(desc(evidenceCategorizationRules.priority));

    const [evidence] = await db
      .select()
      .from(evidenceCatalog)
      .where(eq(evidenceCatalog.id, evidenceId));

    if (!evidence) return;

    for (const rule of rules) {
      const shouldApply = await this.evaluateRule(rule, evidence);
      
      if (shouldApply) {
        await this.applyRuleActions(rule, evidenceId);
        
        // Update rule statistics
        await db
          .update(evidenceCategorizationRules)
          .set({
            timesApplied: rule.timesApplied + 1,
            lastApplied: new Date()
          })
          .where(eq(evidenceCategorizationRules.id, rule.id));
      }
    }
  }

  // ========================================
  // ACCESS LOGGING
  // ========================================

  /**
   * Log evidence access for security and compliance
   */
  async logAccess(
    evidenceId: string, 
    userId: string, 
    accessType: string, 
    accessMethod: string,
    purpose?: string,
    additionalData?: {
      ipAddress?: string;
      userAgent?: string;
      deviceInfo?: any;
      sharedWith?: string;
      downloadFormat?: string;
    }
  ): Promise<void> {
    const accessLog: InsertEvidenceAccessLog = {
      id: uuidv4(),
      evidenceId,
      userId,
      accessType,
      accessMethod,
      purpose,
      ipAddress: additionalData?.ipAddress,
      userAgent: additionalData?.userAgent,
      deviceInfo: additionalData?.deviceInfo,
      sharedWith: additionalData?.sharedWith,
      downloadFormat: additionalData?.downloadFormat,
      authorized: true,
      authorizationLevel: 'owner'
    };

    await db.insert(evidenceAccessLogs).values(accessLog);
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private autoDetectCategory(mimeType: string, fileName: string): string {
    if (mimeType.startsWith('video/')) {
      if (fileName.toLowerCase().includes('traffic') || fileName.toLowerCase().includes('stop')) {
        return 'traffic_stop';
      }
      return 'police_encounter';
    }
    
    if (mimeType.startsWith('image/')) {
      return 'police_encounter';
    }
    
    if (mimeType.startsWith('audio/')) {
      return 'police_encounter';
    }
    
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return 'administrative';
    }
    
    return 'general';
  }

  private autoDetectSubCategory(evidenceType: string, mimeType: string): string {
    if (evidenceType === 'video') {
      return 'user_recording';
    }
    
    if (evidenceType === 'photo') {
      return 'evidence_photo';
    }
    
    if (evidenceType === 'audio') {
      return 'conversation_recording';
    }
    
    if (evidenceType === 'document') {
      return 'legal_document';
    }
    
    return 'general';
  }

  private getAnalysisJobTypes(evidenceType: string): string[] {
    const jobTypes = [];
    
    switch (evidenceType) {
      case 'video':
        jobTypes.push('video_analysis', 'audio_transcription', 'image_analysis');
        break;
      case 'audio':
        jobTypes.push('audio_transcription', 'legal_analysis');
        break;
      case 'photo':
        jobTypes.push('image_analysis', 'text_extraction');
        break;
      case 'document':
        jobTypes.push('text_extraction', 'legal_analysis');
        break;
      default:
        jobTypes.push('legal_analysis');
    }
    
    return jobTypes;
  }

  private getJobPriority(jobType: string): string {
    switch (jobType) {
      case 'legal_analysis':
        return 'high';
      case 'audio_transcription':
        return 'normal';
      case 'image_analysis':
        return 'normal';
      case 'text_extraction':
        return 'normal';
      case 'video_analysis':
        return 'low';
      default:
        return 'normal';
    }
  }

  private getAnalysisParameters(jobType: string, evidenceType: string): any {
    return {
      jobType,
      evidenceType,
      enableAI: true,
      confidenceThreshold: 0.7,
      language: 'en',
      detectLegalTerms: true,
      extractMetadata: true
    };
  }

  private getExpectedDuration(jobType: string): number {
    switch (jobType) {
      case 'image_analysis':
        return 30;
      case 'audio_transcription':
        return 120;
      case 'video_analysis':
        return 300;
      case 'text_extraction':
        return 15;
      case 'legal_analysis':
        return 60;
      default:
        return 60;
    }
  }

  private async performAnalysis(job: EvidenceAnalysisJob): Promise<any> {
    // Simulate analysis based on job type
    // In production, this would call actual AI services
    
    switch (job.jobType) {
      case 'image_analysis':
        return {
          detectedObjects: ['badge', 'uniform', 'vehicle'],
          confidence: 0.85,
          faces: 2,
          text: 'Officer John Smith - Badge #1234'
        };
        
      case 'audio_transcription':
        return {
          transcript: 'Officer: License and registration please. Citizen: Here you go officer.',
          confidence: 0.92,
          speakers: 2,
          legalTerms: ['license', 'registration']
        };
        
      case 'legal_analysis':
        return {
          legalRelevance: 'high',
          detectedRights: ['4th Amendment'],
          recommendedActions: ['Document search refusal'],
          confidence: 0.88
        };
        
      default:
        return {
          processed: true,
          confidence: 0.75
        };
    }
  }

  private async updateEvidenceWithAnalysis(evidenceId: string, jobType: string, results: any): Promise<void> {
    const updateData: Partial<InsertEvidenceCatalog> = {
      processingStatus: 'completed',
      processingProgress: 100,
      lastProcessed: new Date()
    };

    switch (jobType) {
      case 'image_analysis':
        updateData.detectedObjects = results.detectedObjects;
        updateData.detectedText = results.text;
        updateData.detectedFaces = { count: results.faces };
        break;
        
      case 'audio_transcription':
        updateData.detectedSpeech = results.transcript;
        break;
        
      case 'legal_analysis':
        updateData.legalRelevance = results.legalRelevance;
        updateData.detectedLegalTerms = results.detectedRights;
        updateData.admissibilityScore = results.confidence;
        break;
    }

    await db
      .update(evidenceCatalog)
      .set(updateData)
      .where(eq(evidenceCatalog.id, evidenceId));
  }

  private async analyzeRelationship(evidence1: EvidenceCatalog, evidence2: EvidenceCatalog): Promise<{
    type: string;
    confidence: number;
    similarities: any;
    differences: any;
    timeDifference: number | null;
    locationDistance: number | null;
  }> {
    const timeDiff = evidence1.capturedAt && evidence2.capturedAt
      ? Math.abs(new Date(evidence1.capturedAt).getTime() - new Date(evidence2.capturedAt).getTime()) / 1000
      : null;

    let confidence = 0;
    let relationshipType = 'supplementary';

    // Same incident
    if (evidence1.incidentId && evidence1.incidentId === evidence2.incidentId) {
      confidence += 0.4;
      relationshipType = 'sequence';
    }

    // Similar time (within 1 hour)
    if (timeDiff && timeDiff < 3600) {
      confidence += 0.3;
    }

    // Same evidence type
    if (evidence1.evidenceType === evidence2.evidenceType) {
      confidence += 0.2;
    }

    // Similar file names
    if (evidence1.fileName.includes(evidence2.fileName.substring(0, 5)) || 
        evidence2.fileName.includes(evidence1.fileName.substring(0, 5))) {
      confidence += 0.1;
      relationshipType = 'duplicate';
    }

    return {
      type: relationshipType,
      confidence: Math.min(confidence, 1.0),
      similarities: {
        sameIncident: evidence1.incidentId === evidence2.incidentId,
        sameType: evidence1.evidenceType === evidence2.evidenceType,
        timeProximity: timeDiff ? timeDiff < 3600 : false
      },
      differences: {
        fileSize: Math.abs((evidence1.fileSize || 0) - (evidence2.fileSize || 0)),
        differentMimeTypes: evidence1.mimeType !== evidence2.mimeType
      },
      timeDifference: timeDiff,
      locationDistance: null // Would calculate if location data available
    };
  }

  private async performQualityAssessment(evidence: EvidenceCatalog): Promise<{
    overallQuality: string;
    qualityScore: number;
    visualClarity?: number;
    audioClarity?: number;
    textReadability?: number;
    completeness: number;
    relevance: number;
    qualityIssues: string[];
    suggestions: string[];
    metadataCompleteness: number;
    timestampAccuracy: string;
    locationAccuracy: string;
    notes: string;
  }> {
    let qualityScore = 0.8; // Base score
    const issues: string[] = [];
    const suggestions: string[] = [];

    // File size assessment
    if (evidence.fileSize < 1000) {
      qualityScore -= 0.2;
      issues.push('File size very small');
      suggestions.push('Consider higher quality recording');
    }

    // Metadata completeness
    let metadataScore = 0.5;
    if (evidence.location) metadataScore += 0.2;
    if (evidence.deviceInfo) metadataScore += 0.2;
    if (evidence.cameraSettings) metadataScore += 0.1;

    // Timestamp accuracy
    const timestampAccuracy = evidence.capturedAt ? 'exact' : 'unknown';

    // Location accuracy
    const locationAccuracy = evidence.location ? 'precise' : 'unknown';

    // Overall quality determination
    let overallQuality = 'good';
    if (qualityScore >= 0.9) overallQuality = 'excellent';
    else if (qualityScore >= 0.7) overallQuality = 'good';
    else if (qualityScore >= 0.5) overallQuality = 'fair';
    else overallQuality = 'poor';

    return {
      overallQuality,
      qualityScore,
      completeness: 0.8,
      relevance: 0.9,
      qualityIssues: issues,
      suggestions,
      metadataCompleteness: metadataScore,
      timestampAccuracy,
      locationAccuracy,
      notes: `Automated assessment completed. ${issues.length} issues found.`
    };
  }

  private async evaluateRule(rule: EvidenceCategorizationRule, evidence: EvidenceCatalog): Promise<boolean> {
    const conditions = rule.conditions as any;
    
    // File type rule
    if (rule.ruleType === 'file_type' && conditions.mimeTypes) {
      return conditions.mimeTypes.includes(evidence.mimeType);
    }
    
    // Content analysis rule
    if (rule.ruleType === 'content_analysis' && conditions.detectedObjects) {
      const detectedObjects = evidence.detectedObjects as any;
      if (detectedObjects && Array.isArray(detectedObjects)) {
        return conditions.detectedObjects.some((obj: string) => detectedObjects.includes(obj));
      }
    }
    
    // Keyword rule
    if (rule.ruleType === 'keyword' && conditions.keywords) {
      const searchText = [
        evidence.fileName,
        evidence.detectedText,
        evidence.detectedSpeech
      ].filter(Boolean).join(' ').toLowerCase();
      
      return conditions.keywords.some((keyword: string) => 
        searchText.includes(keyword.toLowerCase())
      );
    }
    
    return false;
  }

  private async applyRuleActions(rule: EvidenceCategorizationRule, evidenceId: string): Promise<void> {
    const actions = rule.actions as any;
    const updateData: Partial<InsertEvidenceCatalog> = {};
    
    if (actions.setCategory) {
      updateData.category = actions.setCategory;
    }
    
    if (actions.setSubCategory) {
      updateData.subCategory = actions.setSubCategory;
    }
    
    if (actions.addTags) {
      const [evidence] = await db
        .select({ tags: evidenceCatalog.tags })
        .from(evidenceCatalog)
        .where(eq(evidenceCatalog.id, evidenceId));
      
      const currentTags = (evidence?.tags as string[]) || [];
      const newTags = [...new Set([...currentTags, ...actions.addTags])];
      updateData.tags = newTags;
    }
    
    if (actions.setRelevance) {
      updateData.legalRelevance = actions.setRelevance;
    }
    
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      await db
        .update(evidenceCatalog)
        .set(updateData)
        .where(eq(evidenceCatalog.id, evidenceId));
    }
  }
}

export const evidenceCatalogService = new EvidenceCatalogService();