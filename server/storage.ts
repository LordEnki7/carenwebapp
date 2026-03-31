import {
  users,
  incidents,
  legalRights,
  attorneys,
  attorneyConnections,
  type User,
  type UpsertUser,
  type Incident,
  type InsertIncident,
  type LegalRights,
  type InsertLegalRights,
  type Attorney,
  type InsertAttorney,
  type AttorneyConnection,
  type InsertAttorneyConnection,
  emergencyContacts,
  type EmergencyContact,
  type InsertEmergencyContact,
  emergencyAlerts,
  type EmergencyAlert,
  type InsertEmergencyAlert,
  legalDocumentTemplates,
  generatedLegalDocuments,
  legalAgreementAcceptances,
  type LegalDocumentTemplate,
  type InsertLegalDocumentTemplate,
  type GeneratedLegalDocument,
  type InsertGeneratedLegalDocument,
  type LegalAgreementAcceptance,
  type InsertLegalAgreementAcceptance,
  conversations,
  messages,
  messageAttachments,
  attorneyAvailability,
  messageReadReceipts,
  conversationNotes,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type MessageAttachment,
  type InsertMessageAttachment,
  type AttorneyAvailability,
  type InsertAttorneyAvailability,
  type MessageReadReceipt,
  type InsertMessageReadReceipt,
  type ConversationNote,
  type InsertConversationNote,
  facialRecognition,
  type FacialRecognition,
  type InsertFacialRecognition,
  loginActivity,
  type LoginActivity,
  type InsertLoginActivity,
  forumCategories,
  forumPosts,
  forumReplies,
  type ForumCategory,
  type InsertForumCategory,
  type ForumPost,
  type InsertForumPost,
  type ForumReply,
  type InsertForumReply,
  userActions,
  learningProgress,
  contentEngagement,
  knowledgeAssessments,
  featureUsage,
  emergencyResponseMetrics,
  aiLearningInsights,
  type InsertUserAction,
  type UserAction,
  type InsertLearningProgress,
  type LearningProgress,
  // User Journey Progress Sparkle Tracker imports
  journeyMilestones,
  userJourneyProgress,
  userJourneyStats,
  sparkleQueue,
  journeyBadges,
  userBadges,
  dailyStreaks,
  type JourneyMilestone,
  type InsertJourneyMilestone,
  type UserJourneyProgress,
  type InsertUserJourneyProgress,
  type UserJourneyStats,
  type InsertUserJourneyStats,
  type SparkleQueue,
  type InsertSparkleQueue,
  type JourneyBadge,
  type InsertJourneyBadge,
  type UserBadge,
  type InsertUserBadge,
  type DailyStreak,
  type InsertDailyStreak,
  type InsertContentEngagement,
  type ContentEngagement,
  type InsertKnowledgeAssessment,
  type KnowledgeAssessment,
  type InsertFeatureUsage,
  type FeatureUsage,
  type InsertEmergencyResponseMetric,
  type EmergencyResponseMetric,
  type InsertAILearningInsight,
  type AILearningInsight,
  legalDestinations,
  legalRoutes,
  type LegalDestination,
  type InsertLegalDestination,
  type LegalRoute,
  type InsertLegalRoute,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  linkGoogleAccount(userId: string, googleId: string): Promise<User>;
  linkAppleAccount(userId: string, appleId: string): Promise<User>;
  updateUserProfile(id: string, updates: Partial<User>): Promise<User>;
  updateUserLanguage(id: string, language: string): Promise<User>;

  // Incident operations
  createIncident(incident: InsertIncident): Promise<Incident>;
  getIncidents(userId: string): Promise<Incident[]>;
  getIncident(id: number, userId: string): Promise<Incident | undefined>;
  updateIncident(id: number, userId: string, updates: Partial<Incident>): Promise<Incident>;
  deleteIncident(id: number, userId: string): Promise<void>;
  getIncidentStats(userId: string): Promise<{
    total: number;
    cloudBackups: number;
    emergencyContacts: number;
  }>;

  // Legal rights operations
  getLegalRightsByState(state: string): Promise<LegalRights[]>;
  getAllLegalRights(): Promise<LegalRights[]>;
  createLegalRights(rights: InsertLegalRights): Promise<LegalRights>;

  // Attorney operations
  getAttorneys(state?: string, specialty?: string): Promise<Attorney[]>;
  getAttorney(id: number): Promise<Attorney | undefined>;
  createAttorney(attorney: InsertAttorney): Promise<Attorney>;
  
  // Attorney connection operations
  createAttorneyConnection(connection: InsertAttorneyConnection): Promise<AttorneyConnection>;
  getAttorneyConnections(userId: string): Promise<AttorneyConnection[]>;
  updateAttorneyConnection(id: number, updates: Partial<AttorneyConnection>): Promise<AttorneyConnection>;

  // Emergency contact operations
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  getEmergencyContacts(userId: string): Promise<EmergencyContact[]>;
  updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact>;
  deleteEmergencyContact(id: string, userId: string): Promise<void>;

  // Emergency alert operations
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getEmergencyAlerts(userId: string): Promise<EmergencyAlert[]>;
  updateEmergencyAlert(id: string, updates: Partial<EmergencyAlert>): Promise<EmergencyAlert>;

  // Legal document template operations
  getLegalDocumentTemplates(category?: string, state?: string): Promise<LegalDocumentTemplate[]>;
  getLegalDocumentTemplate(id: number): Promise<LegalDocumentTemplate | undefined>;
  createLegalDocumentTemplate(template: InsertLegalDocumentTemplate): Promise<LegalDocumentTemplate>;

  // Generated legal document operations
  createGeneratedLegalDocument(document: InsertGeneratedLegalDocument): Promise<GeneratedLegalDocument>;
  getGeneratedLegalDocuments(userId: string): Promise<GeneratedLegalDocument[]>;
  getGeneratedLegalDocument(id: number, userId: string): Promise<GeneratedLegalDocument | undefined>;
  updateGeneratedLegalDocument(id: number, userId: string, updates: Partial<GeneratedLegalDocument>): Promise<GeneratedLegalDocument>;

  // Legal agreement acceptance operations
  recordLegalAgreementAcceptance(acceptance: InsertLegalAgreementAcceptance): Promise<LegalAgreementAcceptance>;
  getLegalAgreementAcceptances(userId: string): Promise<LegalAgreementAcceptance[]>;
  updateUserTermsAcceptance(userId: string): Promise<User>;

  // Attorney-Client Messaging operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversations(userId: string, userType?: string): Promise<Conversation[]>;
  getConversation(id: string, userId: string): Promise<Conversation | undefined>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(conversationId: string, limit?: number, offset?: number): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  
  // Attachment operations
  createMessageAttachment(attachment: InsertMessageAttachment): Promise<MessageAttachment>;
  getMessageAttachments(messageId: string): Promise<MessageAttachment[]>;
  
  // Attorney availability operations
  getAttorneyAvailability(attorneyId: number): Promise<AttorneyAvailability | undefined>;
  updateAttorneyAvailability(attorneyId: number, updates: Partial<AttorneyAvailability>): Promise<AttorneyAvailability>;
  getAvailableAttorneys(specialties?: string[], isEmergency?: boolean): Promise<Attorney[]>;
  
  // Conversation notes operations (attorney-only)
  createConversationNote(note: InsertConversationNote): Promise<ConversationNote>;
  getConversationNotes(conversationId: string, attorneyId: number): Promise<ConversationNote[]>;

  // Facial recognition operations
  createFacialRecognition(recognition: InsertFacialRecognition): Promise<FacialRecognition>;
  getAllFacialRecognition(): Promise<FacialRecognition[]>;
  
  // Authentication operations
  createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Admin operations for live data
  getAllUsers(): Promise<User[]>;
  getAllIncidents(): Promise<Incident[]>;
  getAllEmergencyAlerts(): Promise<EmergencyAlert[]>;

  // Login activity tracking operations
  createLoginActivity(activity: InsertLoginActivity): Promise<LoginActivity>;
  getRecentLoginActivity(limit?: number): Promise<LoginActivity[]>;
  getLoginActivityByUser(userId: string): Promise<LoginActivity[]>;

  // Payment and subscription analytics operations
  getSubscriptionBreakdown(): Promise<{
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  }>;
  getPaymentStatistics(): Promise<{
    totalRevenue: number;
    monthlyRevenue: number;
    averageRevenuePerUser: number;
    conversionRate: number;
    premiumUsers: number;
    paidUsers: number;
  }>;

  // Community Forum operations
  getForumCategories(state?: string): Promise<ForumCategory[]>;
  getForumCategory(id: number): Promise<ForumCategory | undefined>;
  createForumCategory(category: InsertForumCategory): Promise<ForumCategory>;
  getForumPosts(categoryId: number, page?: number, limit?: number): Promise<ForumPost[]>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  updateForumPost(id: number, userId: string, updates: Partial<ForumPost>): Promise<ForumPost>;
  deleteForumPost(id: number, userId: string): Promise<void>;
  getForumReplies(postId: number): Promise<ForumReply[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  updateForumReply(id: number, userId: string, updates: Partial<ForumReply>): Promise<ForumReply>;
  deleteForumReply(id: number, userId: string): Promise<void>;
  getForumStats(): Promise<{
    totalMembers: number;
    totalPosts: number;
    totalCategories: number;
    totalReplies: number;
  }>;

  // User Learning Analytics operations
  trackUserAction(action: InsertUserAction): Promise<UserAction>;
  getUserActions(userId: string, limit?: number): Promise<UserAction[]>;
  
  updateLearningProgress(progress: InsertLearningProgress): Promise<LearningProgress>;
  getLearningProgress(userId: string, category?: string): Promise<LearningProgress[]>;
  
  trackContentEngagement(engagement: InsertContentEngagement): Promise<ContentEngagement>;
  getContentEngagement(userId: string, contentType?: string): Promise<ContentEngagement[]>;
  
  createKnowledgeAssessment(assessment: InsertKnowledgeAssessment): Promise<KnowledgeAssessment>;
  getKnowledgeAssessments(userId: string, category?: string): Promise<KnowledgeAssessment[]>;
  
  updateFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage>;
  getFeatureUsage(userId: string, feature?: string): Promise<FeatureUsage[]>;
  
  trackEmergencyResponse(metric: InsertEmergencyResponseMetric): Promise<EmergencyResponseMetric>;
  getEmergencyResponseMetrics(userId: string, scenarioType?: string): Promise<EmergencyResponseMetric[]>;
  
  createAILearningInsight(insight: InsertAILearningInsight): Promise<AILearningInsight>;
  getAILearningInsights(category?: string, actionable?: boolean): Promise<AILearningInsight[]>;

  // Analytics aggregation methods
  getLearningAnalyticsSummary(userId: string): Promise<{
    totalActions: number;
    averageSessionTime: number;
    skillImprovement: number;
    mostUsedFeatures: string[];
    learningGoals: string[];
    recommendedContent: string[];
  }>;

  getPlatformLearningInsights(): Promise<{
    userEngagementTrends: any[];
    popularContent: any[];
    commonLearningPaths: any[];
    effectiveFeatures: any[];
    improvementAreas: any[];
  }>;

  // Legal Navigation operations
  createLegalDestination(destination: InsertLegalDestination): Promise<LegalDestination>;
  getLegalDestinations(type?: string, state?: string, latitude?: number, longitude?: number, radius?: number): Promise<LegalDestination[]>;
  getLegalDestination(id: number): Promise<LegalDestination | undefined>;
  updateLegalDestination(id: number, updates: Partial<LegalDestination>): Promise<LegalDestination>;
  deleteLegalDestination(id: number): Promise<void>;
  
  createLegalRoute(route: InsertLegalRoute): Promise<LegalRoute>;
  getLegalRoutes(userId: string, status?: string): Promise<LegalRoute[]>;
  getLegalRoute(id: number, userId: string): Promise<LegalRoute | undefined>;
  updateLegalRoute(id: number, userId: string, updates: Partial<LegalRoute>): Promise<LegalRoute>;
  deleteLegalRoute(id: number, userId: string): Promise<void>;
  
  getNearbyLegalDestinations(latitude: number, longitude: number, type?: string, radius?: number): Promise<LegalDestination[]>;
  getEmergencyLegalDestinations(latitude: number, longitude: number): Promise<LegalDestination[]>;

  // User Journey Progress Sparkle Tracker operations
  
  // Journey milestones operations
  createJourneyMilestone(milestone: InsertJourneyMilestone): Promise<JourneyMilestone>;
  getJourneyMilestones(category?: string, isActive?: boolean): Promise<JourneyMilestone[]>;
  getJourneyMilestone(id: number): Promise<JourneyMilestone | undefined>;
  updateJourneyMilestone(id: number, updates: Partial<JourneyMilestone>): Promise<JourneyMilestone>;
  
  // User progress tracking operations
  recordUserProgress(progress: InsertUserJourneyProgress): Promise<UserJourneyProgress>;
  getUserProgress(userId: string, milestoneId?: number): Promise<UserJourneyProgress[]>;
  getCompletedMilestones(userId: string, category?: string): Promise<UserJourneyProgress[]>;
  markSparkleShown(progressId: number): Promise<UserJourneyProgress>;
  
  // User journey stats operations
  getUserJourneyStats(userId: string): Promise<UserJourneyStats | undefined>;
  updateUserJourneyStats(userId: string, updates: Partial<UserJourneyStats>): Promise<UserJourneyStats>;
  incrementUserPoints(userId: string, points: number): Promise<UserJourneyStats>;
  updateUserStreak(userId: string): Promise<UserJourneyStats>;
  
  // Sparkle queue operations
  addSparkleToQueue(sparkle: InsertSparkleQueue): Promise<SparkleQueue>;
  getPendingSparkles(userId: string, location?: string): Promise<SparkleQueue[]>;
  markSparkleQueueShown(sparkleId: number): Promise<SparkleQueue>;
  cleanupExpiredSparkles(): Promise<void>;
  
  // Journey badges operations
  createJourneyBadge(badge: InsertJourneyBadge): Promise<JourneyBadge>;
  getJourneyBadges(badgeType?: string, isActive?: boolean): Promise<JourneyBadge[]>;
  getJourneyBadge(id: number): Promise<JourneyBadge | undefined>;
  
  // User badges operations
  awardUserBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  getUserBadges(userId: string, isDisplayed?: boolean): Promise<UserBadge[]>;
  markBadgeShown(badgeId: number, userId: string): Promise<UserBadge>;
  checkBadgeEligibility(userId: string, badgeId: number): Promise<boolean>;
  
  // Daily streak operations
  recordDailyActivity(streak: InsertDailyStreak): Promise<DailyStreak>;
  getDailyStreaks(userId: string, days?: number): Promise<DailyStreak[]>;
  getCurrentStreak(userId: string): Promise<number>;
  
  // Progress analytics operations
  getProgressAnalytics(userId: string): Promise<{
    totalMilestones: number;
    completedMilestones: number;
    currentLevel: number;
    totalPoints: number;
    currentStreak: number;
    recentAchievements: UserJourneyProgress[];
    nextMilestones: JourneyMilestone[];
    progressPercentage: number;
  }>;
  
  // Milestone trigger operations (for automatic milestone detection)
  checkAndAwardMilestones(userId: string, actionType: string, relatedEntityId?: string, relatedEntityType?: string): Promise<UserJourneyProgress[]>;
  triggerMilestoneCheck(userId: string, milestoneNames: string[]): Promise<UserJourneyProgress[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLanguage(id: string, language: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ preferredLanguage: language, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.appleId, appleId));
    return user;
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ googleId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async linkAppleAccount(userId: string, appleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ appleId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  // Incident operations
  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async getIncidents(userId: string): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .where(eq(incidents.userId, userId))
      .orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: number, userId: string): Promise<Incident | undefined> {
    const [incident] = await db
      .select()
      .from(incidents)
      .where(and(eq(incidents.id, id), eq(incidents.userId, userId)));
    return incident;
  }

  async updateIncident(id: number, userId: string, updates: Partial<Incident>): Promise<Incident> {
    const [incident] = await db
      .update(incidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(incidents.id, id), eq(incidents.userId, userId)))
      .returning();
    return incident;
  }

  async deleteIncident(id: number, userId: string): Promise<void> {
    await db
      .delete(incidents)
      .where(and(eq(incidents.id, id), eq(incidents.userId, userId)));
  }

  async getIncidentStats(userId: string): Promise<{
    total: number;
    cloudBackups: number;
    emergencyContacts: number;
  }> {
    const userIncidents = await this.getIncidents(userId);
    return {
      total: userIncidents.length,
      cloudBackups: userIncidents.filter(i => i.cloudBackup).length,
      emergencyContacts: userIncidents.filter(i => i.contactsNotified).length,
    };
  }

  // Legal rights operations
  async getLegalRightsByState(state: string): Promise<LegalRights[]> {
    return await db
      .select()
      .from(legalRights)
      .where(eq(legalRights.state, state))
      .orderBy(legalRights.category);
  }

  async getAllLegalRights(): Promise<LegalRights[]> {
    return await db.select().from(legalRights).orderBy(legalRights.state, legalRights.category);
  }

  async createLegalRights(rights: InsertLegalRights): Promise<LegalRights> {
    const [newRights] = await db.insert(legalRights).values(rights).returning();
    return newRights;
  }

  // Attorney operations
  async getAttorneys(state?: string, specialty?: string): Promise<Attorney[]> {
    const results = await db.execute(sql`
      SELECT 
        id,
        user_id as "userId",
        firm_name as "firmName",
        specialties,
        states,
        rating,
        verified,
        contact_info as "contactInfo",
        bio,
        created_at as "createdAt"
      FROM attorneys 
      WHERE verified = true
      ORDER BY rating DESC NULLS LAST
    `);
    
    return results.rows.map((row: any) => {
      const contactInfo = row.contactInfo || {};
      return {
        id: row.id,
        userId: row.userId,
        firstName: contactInfo.name?.split(' ')[0] || 'Attorney',
        lastName: contactInfo.name?.split(' ').slice(1).join(' ') || 'Contact',
        email: contactInfo.email,
        phone: contactInfo.phone,
        firmName: row.firmName,
        specialties: row.specialties || [],
        rating: row.rating || 5,
        verified: row.verified || false,
        isEmergencyAvailable: false, // Default since this column doesn't exist in DB
        bio: row.bio,
        createdAt: row.createdAt,
        updatedAt: row.createdAt
      };
    });
  }

  async getAttorney(id: number): Promise<Attorney | undefined> {
    const [attorney] = await db.select().from(attorneys).where(eq(attorneys.id, id));
    return attorney;
  }

  async createAttorney(attorney: InsertAttorney): Promise<Attorney> {
    const [newAttorney] = await db.insert(attorneys).values(attorney).returning();
    return newAttorney;
  }

  // Attorney connection operations
  async createAttorneyConnection(connection: InsertAttorneyConnection): Promise<AttorneyConnection> {
    const [newConnection] = await db.insert(attorneyConnections).values(connection).returning();
    return newConnection;
  }

  async getAttorneyConnections(userId: string): Promise<AttorneyConnection[]> {
    return await db
      .select()
      .from(attorneyConnections)
      .where(eq(attorneyConnections.userId, userId))
      .orderBy(desc(attorneyConnections.createdAt));
  }

  async updateAttorneyConnection(id: number, updates: Partial<AttorneyConnection>): Promise<AttorneyConnection> {
    const [connection] = await db
      .update(attorneyConnections)
      .set(updates)
      .where(eq(attorneyConnections.id, id))
      .returning();
    return connection;
  }

  // Emergency contact operations
  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const [newContact] = await db
      .insert(emergencyContacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return await db
      .select()
      .from(emergencyContacts)
      .where(and(eq(emergencyContacts.userId, userId), eq(emergencyContacts.isActive, true)))
      .orderBy(emergencyContacts.priority, emergencyContacts.name);
  }

  async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact> {
    const [contact] = await db
      .update(emergencyContacts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(emergencyContacts.id, parseInt(id)))
      .returning();
    return contact;
  }

  async deleteEmergencyContact(id: string, userId: string): Promise<void> {
    await db
      .update(emergencyContacts)
      .set({ isActive: false })
      .where(and(eq(emergencyContacts.id, parseInt(id)), eq(emergencyContacts.userId, userId)));
  }

  // Emergency alert operations
  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [newAlert] = await db
      .insert(emergencyAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async getEmergencyAlerts(userId: string): Promise<EmergencyAlert[]> {
    return await db
      .select()
      .from(emergencyAlerts)
      .where(eq(emergencyAlerts.userId, userId))
;
  }

  async updateEmergencyAlert(id: string, updates: Partial<EmergencyAlert>): Promise<EmergencyAlert> {
    const [alert] = await db
      .update(emergencyAlerts)
      .set(updates)
      .where(eq(emergencyAlerts.id, parseInt(id)))
      .returning();
    return alert;
  }

  // Legal document template operations
  async getLegalDocumentTemplates(category?: string, state?: string): Promise<LegalDocumentTemplate[]> {
    let query = db.select().from(legalDocumentTemplates);
    
    if (category && state) {
      return await query.where(
        and(
          eq(legalDocumentTemplates.isActive, true),
          eq(legalDocumentTemplates.category, category),
          or(
            eq(legalDocumentTemplates.state, state),
            sql`${legalDocumentTemplates.state} IS NULL`
          )
        )
      );
    } else if (category) {
      return await query.where(
        and(
          eq(legalDocumentTemplates.isActive, true),
          eq(legalDocumentTemplates.category, category)
        )
      );
    } else if (state) {
      return await query.where(
        and(
          eq(legalDocumentTemplates.isActive, true),
          or(
            eq(legalDocumentTemplates.state, state),
            sql`${legalDocumentTemplates.state} IS NULL`
          )
        )
      );
    }
    
    return await query.where(eq(legalDocumentTemplates.isActive, true));
  }

  async getLegalDocumentTemplate(id: number): Promise<LegalDocumentTemplate | undefined> {
    const [template] = await db
      .select()
      .from(legalDocumentTemplates)
      .where(and(eq(legalDocumentTemplates.id, id), eq(legalDocumentTemplates.isActive, true)));
    return template;
  }

  async createLegalDocumentTemplate(templateData: InsertLegalDocumentTemplate): Promise<LegalDocumentTemplate> {
    const [template] = await db
      .insert(legalDocumentTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  // Generated legal document operations
  async createGeneratedLegalDocument(documentData: InsertGeneratedLegalDocument): Promise<GeneratedLegalDocument> {
    const [document] = await db
      .insert(generatedLegalDocuments)
      .values(documentData)
      .returning();
    return document;
  }

  async getGeneratedLegalDocuments(userId: string): Promise<GeneratedLegalDocument[]> {
    return await db
      .select()
      .from(generatedLegalDocuments)
      .where(eq(generatedLegalDocuments.userId, userId))
      .orderBy(desc(generatedLegalDocuments.createdAt));
  }

  async getGeneratedLegalDocument(id: number, userId: string): Promise<GeneratedLegalDocument | undefined> {
    const [document] = await db
      .select()
      .from(generatedLegalDocuments)
      .where(
        and(
          eq(generatedLegalDocuments.id, id),
          eq(generatedLegalDocuments.userId, userId)
        )
      );
    return document;
  }

  async updateGeneratedLegalDocument(id: number, userId: string, updates: Partial<GeneratedLegalDocument>): Promise<GeneratedLegalDocument> {
    const [document] = await db
      .update(generatedLegalDocuments)
      .set(updates)
      .where(
        and(
          eq(generatedLegalDocuments.id, id),
          eq(generatedLegalDocuments.userId, userId)
        )
      )
      .returning();
    return document;
  }

  // Legal agreement acceptance operations
  async recordLegalAgreementAcceptance(acceptanceData: InsertLegalAgreementAcceptance): Promise<LegalAgreementAcceptance> {
    const id = `agreement_${acceptanceData.userId}_${acceptanceData.agreementType}_${Date.now()}`;
    const [acceptance] = await db
      .insert(legalAgreementAcceptances)
      .values({
        id,
        ...acceptanceData,
      })
      .returning();
    return acceptance;
  }

  async getLegalAgreementAcceptances(userId: string): Promise<LegalAgreementAcceptance[]> {
    return await db
      .select()
      .from(legalAgreementAcceptances)
      .where(eq(legalAgreementAcceptances.userId, userId))
      .orderBy(desc(legalAgreementAcceptances.acceptedAt));
  }

  async updateUserTermsAcceptance(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        agreedToTerms: true,
        termsAgreedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  // Attorney-Client Messaging operations
  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [conversation] = await db
      .insert(conversations)
      .values({
        ...conversationData,
        id: conversationId,
      })
      .returning();
    return conversation;
  }

  async getConversations(userId: string, userType?: string): Promise<Conversation[]> {
    let query = db.select().from(conversations);
    
    if (userType === 'attorney') {
      // For attorneys, get conversations where they are the assigned attorney
      query = query.where(eq(conversations.attorneyId, parseInt(userId)));
    } else {
      // For users, get conversations where they are the user
      query = query.where(eq(conversations.userId, userId));
    }
    
    return await query.orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string, userId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          or(
            eq(conversations.userId, userId),
            eq(conversations.attorneyId, parseInt(userId))
          )
        )
      );
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const [conversation] = await db
      .update(conversations)
      .set({ 
        ...updates, 
        updatedAt: new Date() 
      })
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [message] = await db
      .insert(messages)
      .values({
        ...messageData,
        id: messageId,
      })
      .returning();

    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, messageData.conversationId));

    return message;
  }

  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(messages.id, messageId));

    // Create read receipt
    const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db
      .insert(messageReadReceipts)
      .values({
        id: receiptId,
        messageId,
        userId,
      });
  }

  // Attachment operations
  async createMessageAttachment(attachmentData: InsertMessageAttachment): Promise<MessageAttachment> {
    const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [attachment] = await db
      .insert(messageAttachments)
      .values({
        ...attachmentData,
        id: attachmentId,
      })
      .returning();
    return attachment;
  }

  async getMessageAttachments(messageId: string): Promise<MessageAttachment[]> {
    return await db
      .select()
      .from(messageAttachments)
      .where(eq(messageAttachments.messageId, messageId));
  }

  // Attorney availability operations
  async getAttorneyAvailability(attorneyId: number): Promise<AttorneyAvailability | undefined> {
    const [availability] = await db
      .select()
      .from(attorneyAvailability)
      .where(eq(attorneyAvailability.attorneyId, attorneyId));
    return availability;
  }

  async updateAttorneyAvailability(attorneyId: number, updates: Partial<AttorneyAvailability>): Promise<AttorneyAvailability> {
    const [availability] = await db
      .update(attorneyAvailability)
      .set({ 
        ...updates, 
        updatedAt: new Date() 
      })
      .where(eq(attorneyAvailability.attorneyId, attorneyId))
      .returning();
    return availability;
  }

  async getAvailableAttorneys(specialties?: string[], isEmergency?: boolean): Promise<any[]> {
    try {
      // Using raw SQL to match actual database schema
      const results = await db.execute(sql`
        SELECT id, firm_name, specialties, rating, verified, contact_info, bio 
        FROM attorneys 
        WHERE verified = true
      `);
      
      // Convert to array and filter by specialties if provided
      let filteredResults = results.rows;
      if (specialties && specialties.length > 0) {
        filteredResults = results.rows.filter((attorney: any) => {
          if (!attorney.specialties) return false;
          const attorneySpecialties = typeof attorney.specialties === 'string' 
            ? JSON.parse(attorney.specialties) 
            : attorney.specialties;
          return Array.isArray(attorneySpecialties) &&
            specialties.some(specialty => 
              attorneySpecialties.includes(specialty)
            );
        });
      }

      return filteredResults.map((attorney: any) => {
        const contactInfo = attorney.contact_info ? 
          (typeof attorney.contact_info === 'string' ? JSON.parse(attorney.contact_info) : attorney.contact_info) 
          : {};
        
        return {
          id: attorney.id,
          firmName: attorney.firm_name || 'Legal Firm',
          firstName: 'Attorney',
          lastName: 'Contact',
          phone: contactInfo.phone || '555-123-4567',
          email: contactInfo.email || 'contact@legal.com',
          specialties: attorney.specialties || [],
          rating: attorney.rating || 4.5,
          isVerified: attorney.verified,
          isEmergencyAvailable: isEmergency || false,
          bio: attorney.bio || 'Experienced attorney'
        };
      });
    } catch (error) {
      console.error('Error in getAvailableAttorneys:', error);
      return [];
    }
  }

  async analyzePoliceCommand(command: string, userState?: string, location?: any): Promise<any> {
    try {
      const commandLower = command.toLowerCase();

      // Define unlawful command patterns by category
      const unlawfulPatterns = {
        search_violations: {
          patterns: [
            'empty your pockets',
            'take off your clothes',
            'strip search',
            'search your car without',
            'i don\'t need a warrant',
            'consent to search',
            'let me look in your'
          ],
          violation: 'Fourth Amendment violation - Unreasonable search without warrant or probable cause',
          response: 'I do not consent to any searches. I invoke my Fourth Amendment rights.',
          severity: 'high' as const
        },
        silence_violations: {
          patterns: [
            'you have to answer',
            'you must tell me',
            'you can\'t remain silent',
            'stop being difficult',
            'if you don\'t talk'
          ],
          violation: 'Fifth Amendment violation - Compelling self-incrimination',
          response: 'I invoke my Fifth Amendment right to remain silent.',
          severity: 'high' as const
        },
        movement_violations: {
          patterns: [
            'you can\'t leave',
            'sit down and don\'t move',
            'you\'re not free to go',
            'stay right here'
          ],
          violation: 'Fourth Amendment violation - Unlawful detention without reasonable suspicion',
          response: 'Am I free to leave? I do not consent to any detention.',
          severity: 'critical' as const
        },
        recording_violations: {
          patterns: [
            'stop recording',
            'put that camera away',
            'delete that video',
            'you can\'t film'
          ],
          violation: 'First Amendment violation - Restricting right to record police in public',
          response: 'I have a First Amendment right to record police activity in public.',
          severity: 'medium' as const
        },
        identification_violations: {
          patterns: [
            'show me your papers',
            'give me your id right now',
            'you have to show identification'
          ],
          violation: 'Fourth Amendment violation - Demanding ID without reasonable suspicion',
          response: 'I invoke my rights. Am I required to show ID under state law?',
          severity: 'medium' as const
        }
      };

      // Check for state-specific violations
      const stateSpecificViolations = await this.getStateSpecificViolations(userState);

      // Analyze command against patterns
      for (const [category, data] of Object.entries(unlawfulPatterns)) {
        for (const pattern of data.patterns) {
          if (commandLower.includes(pattern)) {
            return {
              isUnlawful: true,
              detectedCommand: command,
              category,
              violation: data.violation,
              suggestedResponse: data.response,
              severity: data.severity,
              confidence: 0.85,
              suggestedAction: 'Request supervisor immediately and document interaction',
              stateRights: stateSpecificViolations
            };
          }
        }
      }

      // Check state-specific patterns
      for (const stateViolation of stateSpecificViolations) {
        if (commandLower.includes(stateViolation.pattern.toLowerCase())) {
          return {
            isUnlawful: true,
            detectedCommand: command,
            category: 'state_specific',
            violation: stateViolation.violation,
            suggestedResponse: stateViolation.response,
            severity: stateViolation.severity,
            confidence: 0.9,
            suggestedAction: 'Request supervisor and cite state-specific law',
            stateRights: stateSpecificViolations
          };
        }
      }

      return {
        isUnlawful: false,
        confidence: 0,
        message: 'No unlawful commands detected'
      };
    } catch (error) {
      console.error("Error analyzing police command:", error);
      return {
        isUnlawful: false,
        confidence: 0,
        error: 'Analysis failed'
      };
    }
  }

  private async getStateSpecificViolations(userState?: string): Promise<any[]> {
    if (!userState) return [];

    // State-specific unlawful command patterns
    const statePatterns: Record<string, any[]> = {
      'California': [
        {
          pattern: 'get out of the car',
          violation: 'California Vehicle Code violation - Officer needs reasonable suspicion for exit order',
          response: 'Under California law, I need to know the reason for the exit order.',
          severity: 'high'
        }
      ],
      'New York': [
        {
          pattern: 'stop and frisk',
          violation: 'NY CPL violation - Stop and frisk requires reasonable suspicion of criminal activity',
          response: 'I do not consent to searches. What reasonable suspicion do you have?',
          severity: 'high'
        }
      ],
      'Texas': [
        {
          pattern: 'show me your license',
          violation: 'Texas Transportation Code - ID only required during lawful traffic stop',
          response: 'Am I being detained for a traffic violation? What is your reasonable suspicion?',
          severity: 'medium'
        }
      ],
      'Florida': [
        {
          pattern: 'you have to answer',
          violation: 'Florida Statute violation - Right to remain silent is absolute',
          response: 'I invoke my Florida constitutional right to remain silent.',
          severity: 'high'
        }
      ]
    };

    return statePatterns[userState] || [];
  }

  // Conversation notes operations (attorney-only)
  async createConversationNote(noteData: InsertConversationNote): Promise<ConversationNote> {
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [note] = await db
      .insert(conversationNotes)
      .values({
        ...noteData,
        id: noteId,
      })
      .returning();
    return note;
  }

  async getConversationNotes(conversationId: string, attorneyId: number): Promise<ConversationNote[]> {
    return await db
      .select()
      .from(conversationNotes)
      .where(
        and(
          eq(conversationNotes.conversationId, conversationId),
          eq(conversationNotes.attorneyId, attorneyId)
        )
      )
      .orderBy(desc(conversationNotes.createdAt));
  }

  // Facial recognition operations
  async createFacialRecognition(recognition: InsertFacialRecognition): Promise<FacialRecognition> {
    const [newRecognition] = await db.insert(facialRecognition).values(recognition).returning();
    return newRecognition;
  }

  async getAllFacialRecognition(): Promise<FacialRecognition[]> {
    return await db.select().from(facialRecognition).where(eq(facialRecognition.isActive, true));
  }

  async updateFacialRecognition(userId: string, updates: Partial<FacialRecognition>): Promise<FacialRecognition> {
    const [updatedRecognition] = await db
      .update(facialRecognition)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(facialRecognition.userId, userId))
      .returning();
    return updatedRecognition;
  }

  async getFacialRecognitionByEmail(email: string): Promise<FacialRecognition | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    
    const [recognition] = await db
      .select()
      .from(facialRecognition)
      .where(and(
        eq(facialRecognition.userId, user.id),
        eq(facialRecognition.isActive, true)
      ));
    return recognition;
  }

  // Admin operations for live data
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents);
  }

  async getAllEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts);
  }

  // Login activity tracking operations
  async createLoginActivity(activity: InsertLoginActivity): Promise<LoginActivity> {
    try {
      const [loginRecord] = await db
        .insert(loginActivity)
        .values(activity)
        .returning();
      return loginRecord;
    } catch (error) {
      console.error("Error creating login activity:", error);
      throw error;
    }
  }

  async getRecentLoginActivity(limit: number = 20): Promise<LoginActivity[]> {
    try {
      return await db
        .select()
        .from(loginActivity)
        .orderBy(desc(loginActivity.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching recent login activity:", error);
      
      // Return empty array so routes.ts can handle fallback properly
      return [];
    }
  }

  async getLoginActivityByUser(userId: string): Promise<LoginActivity[]> {
    try {
      return await db
        .select()
        .from(loginActivity)
        .where(eq(loginActivity.userId, userId))
        .orderBy(desc(loginActivity.createdAt));
    } catch (error) {
      console.error("Error fetching login activity by user:", error);
      return [];
    }
  }

  // Payment and subscription analytics operations
  async getSubscriptionBreakdown(): Promise<{
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  }> {
    try {
      const allUsers = await this.getAllUsers();
      
      // Count users by subscription tier
      const breakdown = {
        free: 0,
        basic: 0,
        premium: 0,
        enterprise: 0
      };

      for (const user of allUsers) {
        const tier = user.subscriptionTier || 'basic_guard';
        switch (tier) {
          case 'basic_guard':
            breakdown.free++;
            break;
          case 'safety_pro':
          case 'pro':
          case 'basic':
            breakdown.basic++;
            break;
          case 'premium':
          case 'constitutional_pro':
            breakdown.premium++;
            break;
          case 'enterprise':
          case 'business':
          case 'family_protection':
          case 'enterprise_fleet':
            breakdown.enterprise++;
            break;
          default:
            breakdown.free++; // Default unknown tiers to basic_guard
        }
      }

      return breakdown;
    } catch (error) {
      console.error("Error fetching subscription breakdown:", error);
      return { free: 0, basic: 0, premium: 0, enterprise: 0 };
    }
  }

  async getPaymentStatistics(): Promise<{
    totalRevenue: number;
    monthlyRevenue: number;
    averageRevenuePerUser: number;
    conversionRate: number;
    premiumUsers: number;
    paidUsers: number;
  }> {
    try {
      const subscriptionBreakdown = await this.getSubscriptionBreakdown();
      const totalUsers = subscriptionBreakdown.free + subscriptionBreakdown.basic + subscriptionBreakdown.premium + subscriptionBreakdown.enterprise;
      
      // Since there are no actual payments or Stripe integrations yet,
      // all revenue metrics should be $0.00
      // Subscription tiers in database don't represent actual payments
      
      return {
        totalRevenue: 0.00,        // No actual revenue yet
        monthlyRevenue: 0.00,      // No actual monthly payments yet  
        averageRevenuePerUser: 0.00, // No revenue to average
        conversionRate: 0.00,      // No paid conversions yet
        premiumUsers: 0,           // No actual premium subscribers
        paidUsers: 0              // No actual paying users
      };
    } catch (error) {
      console.error("Error calculating payment statistics:", error);
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        averageRevenuePerUser: 0,
        conversionRate: 0,
        premiumUsers: 0,
        paidUsers: 0
      };
    }
  }

  // Community Forum operations
  async getForumCategories(state?: string): Promise<ForumCategory[]> {
    if (state) {
      return await db
        .select()
        .from(forumCategories)
        .where(and(eq(forumCategories.isActive, true), eq(forumCategories.state, state)))
        .orderBy(forumCategories.name);
    }
    return await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.isActive, true))
      .orderBy(forumCategories.name);
  }

  async getForumCategory(id: number): Promise<ForumCategory | undefined> {
    const [category] = await db
      .select()
      .from(forumCategories)
      .where(and(eq(forumCategories.id, id), eq(forumCategories.isActive, true)));
    return category;
  }

  async createForumCategory(category: InsertForumCategory): Promise<ForumCategory> {
    const [newCategory] = await db.insert(forumCategories).values(category).returning();
    return newCategory;
  }

  async getForumPosts(categoryId: number, page = 1, limit = 20): Promise<ForumPost[]> {
    const offset = (page - 1) * limit;
    return await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.categoryId, categoryId))
      .orderBy(desc(forumPosts.isPinned), desc(forumPosts.lastReplyAt), desc(forumPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    
    // Update category post count and last post time
    await db
      .update(forumCategories)
      .set({ 
        postCount: sql`${forumCategories.postCount} + 1`,
        lastPostAt: new Date()
      })
      .where(eq(forumCategories.id, newPost.categoryId));
    
    return newPost;
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    
    if (post) {
      // Increment view count
      await db
        .update(forumPosts)
        .set({ viewCount: sql`${forumPosts.viewCount} + 1` })
        .where(eq(forumPosts.id, id));
    }
    
    return post;
  }

  async updateForumPost(id: number, userId: string, updates: Partial<ForumPost>): Promise<ForumPost> {
    const [post] = await db
      .update(forumPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(forumPosts.id, id), eq(forumPosts.userId, userId)))
      .returning();
    return post;
  }

  async deleteForumPost(id: number, userId: string): Promise<void> {
    await db
      .delete(forumPosts)
      .where(and(eq(forumPosts.id, id), eq(forumPosts.userId, userId)));
  }

  async getForumReplies(postId: number): Promise<ForumReply[]> {
    return await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.postId, postId))
      .orderBy(forumReplies.createdAt);
  }

  async createForumReply(reply: InsertForumReply): Promise<ForumReply> {
    const [newReply] = await db.insert(forumReplies).values(reply).returning();
    
    // Update post reply count and last reply info
    await db
      .update(forumPosts)
      .set({ 
        replyCount: sql`${forumPosts.replyCount} + 1`,
        lastReplyAt: new Date(),
        lastReplyUserId: newReply.userId
      })
      .where(eq(forumPosts.id, newReply.postId));
    
    return newReply;
  }

  async updateForumReply(id: number, userId: string, updates: Partial<ForumReply>): Promise<ForumReply> {
    const [reply] = await db
      .update(forumReplies)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(forumReplies.id, id), eq(forumReplies.userId, userId)))
      .returning();
    return reply;
  }

  async deleteForumReply(id: number, userId: string): Promise<void> {
    await db
      .delete(forumReplies)
      .where(and(eq(forumReplies.id, id), eq(forumReplies.userId, userId)));
  }

  async getForumStats(): Promise<{
    totalMembers: number;
    totalPosts: number;
    totalCategories: number;
    totalReplies: number;
  }> {
    try {
      // Get total members count
      const membersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      const totalMembers = parseInt(membersResult.rows[0]?.count as string || '0');

      // Get total posts count
      const postsResult = await db.execute(sql`SELECT COUNT(*) as count FROM forum_posts`);
      const totalPosts = parseInt(postsResult.rows[0]?.count as string || '0');

      // Get total active categories count
      const categoriesResult = await db.execute(sql`SELECT COUNT(*) as count FROM forum_categories WHERE is_active = true`);
      const totalCategories = parseInt(categoriesResult.rows[0]?.count as string || '0');

      // Get total replies count
      const repliesResult = await db.execute(sql`SELECT COUNT(*) as count FROM forum_replies`);
      const totalReplies = parseInt(repliesResult.rows[0]?.count as string || '0');

      return {
        totalMembers,
        totalPosts,
        totalCategories,
        totalReplies
      };
    } catch (error) {
      console.error('[FORUM] Error fetching forum stats:', error);
      // Return zero stats instead of throwing error
      return {
        totalMembers: 0,
        totalPosts: 0,
        totalCategories: 0,
        totalReplies: 0
      };
    }
  }

  // User Learning Analytics operations
  async trackUserAction(action: InsertUserAction): Promise<UserAction> {
    const [newAction] = await db.insert(userActions).values(action).returning();
    return newAction;
  }

  async getUserActions(userId: string, limit: number = 50): Promise<UserAction[]> {
    return await db
      .select()
      .from(userActions)
      .where(eq(userActions.userId, userId))
      .orderBy(desc(userActions.timestamp))
      .limit(limit);
  }

  async updateLearningProgress(progress: InsertLearningProgress): Promise<LearningProgress> {
    const existing = await db
      .select()
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.userId, progress.userId!),
          eq(learningProgress.category, progress.category!),
          eq(learningProgress.skillArea, progress.skillArea!)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(learningProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(learningProgress.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(learningProgress).values(progress).returning();
      return created;
    }
  }

  async getLearningProgress(userId: string, category?: string): Promise<LearningProgress[]> {
    let query = db.select().from(learningProgress).where(eq(learningProgress.userId, userId));
    
    if (category) {
      query = query.where(eq(learningProgress.category, category));
    }
    
    return await query.orderBy(desc(learningProgress.updatedAt));
  }

  async trackContentEngagement(engagement: InsertContentEngagement): Promise<ContentEngagement> {
    const [newEngagement] = await db.insert(contentEngagement).values(engagement).returning();
    return newEngagement;
  }

  async getContentEngagement(userId: string, contentType?: string): Promise<ContentEngagement[]> {
    let query = db.select().from(contentEngagement).where(eq(contentEngagement.userId, userId));
    
    if (contentType) {
      query = query.where(eq(contentEngagement.contentType, contentType));
    }
    
    return await query.orderBy(desc(contentEngagement.timestamp));
  }

  async createKnowledgeAssessment(assessment: InsertKnowledgeAssessment): Promise<KnowledgeAssessment> {
    const [newAssessment] = await db.insert(knowledgeAssessments).values(assessment).returning();
    return newAssessment;
  }

  async getKnowledgeAssessments(userId: string, category?: string): Promise<KnowledgeAssessment[]> {
    let query = db.select().from(knowledgeAssessments).where(eq(knowledgeAssessments.userId, userId));
    
    if (category) {
      query = query.where(eq(knowledgeAssessments.category, category));
    }
    
    return await query.orderBy(desc(knowledgeAssessments.timestamp));
  }

  async updateFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage> {
    const existing = await db
      .select()
      .from(featureUsage)
      .where(
        and(
          eq(featureUsage.userId, usage.userId!),
          eq(featureUsage.feature, usage.feature!)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(featureUsage)
        .set({
          usageCount: existing[0].usageCount + 1,
          totalTimeUsed: existing[0].totalTimeUsed + (usage.totalTimeUsed || 0),
          lastUsed: new Date(),
          effectiveness: usage.effectiveness || existing[0].effectiveness,
          userRating: usage.userRating || existing[0].userRating,
          updatedAt: new Date(),
        })
        .where(eq(featureUsage.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(featureUsage).values(usage).returning();
      return created;
    }
  }

  async getFeatureUsage(userId: string, feature?: string): Promise<FeatureUsage[]> {
    let query = db.select().from(featureUsage).where(eq(featureUsage.userId, userId));
    
    if (feature) {
      query = query.where(eq(featureUsage.feature, feature));
    }
    
    return await query.orderBy(desc(featureUsage.updatedAt));
  }

  async trackEmergencyResponse(metric: InsertEmergencyResponseMetric): Promise<EmergencyResponseMetric> {
    const [newMetric] = await db.insert(emergencyResponseMetrics).values(metric).returning();
    return newMetric;
  }

  async getEmergencyResponseMetrics(userId: string, scenarioType?: string): Promise<EmergencyResponseMetric[]> {
    let query = db.select().from(emergencyResponseMetrics).where(eq(emergencyResponseMetrics.userId, userId));
    
    if (scenarioType) {
      query = query.where(eq(emergencyResponseMetrics.scenarioType, scenarioType));
    }
    
    return await query.orderBy(desc(emergencyResponseMetrics.timestamp));
  }

  async createAILearningInsight(insight: InsertAILearningInsight): Promise<AILearningInsight> {
    const [newInsight] = await db.insert(aiLearningInsights).values(insight).returning();
    return newInsight;
  }

  async getAILearningInsights(category?: string, actionable?: boolean): Promise<AILearningInsight[]> {
    let query = db.select().from(aiLearningInsights);
    
    if (category) {
      query = query.where(eq(aiLearningInsights.category, category));
    }
    
    if (actionable !== undefined) {
      query = query.where(eq(aiLearningInsights.actionable, actionable));
    }
    
    return await query.orderBy(desc(aiLearningInsights.createdAt));
  }

  async getLearningAnalyticsSummary(userId: string): Promise<{
    totalActions: number;
    averageSessionTime: number;
    skillImprovement: number;
    mostUsedFeatures: string[];
    learningGoals: string[];
    recommendedContent: string[];
  }> {
    try {
      // Get total actions count
      const actionsResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM user_actions WHERE user_id = ${userId}`
      );
      const totalActions = parseInt(actionsResult.rows[0]?.count as string || '0');

      // Get average session time
      const sessionTimeResult = await db.execute(
        sql`SELECT AVG(duration) as avg_duration FROM user_actions WHERE user_id = ${userId} AND duration IS NOT NULL`
      );
      const averageSessionTime = parseFloat(sessionTimeResult.rows[0]?.avg_duration as string || '0');

      // Get skill improvement trend
      const skillResult = await db.execute(
        sql`SELECT AVG(improvement_score) as improvement FROM learning_progress WHERE user_id = ${userId}`
      );
      const skillImprovement = parseFloat(skillResult.rows[0]?.improvement as string || '0');

      // Get most used features
      const featuresResult = await db.execute(
        sql`SELECT feature FROM feature_usage WHERE user_id = ${userId} ORDER BY usage_count DESC LIMIT 5`
      );
      const mostUsedFeatures = featuresResult.rows.map(row => row.feature as string);

      // Generate learning goals based on weak areas
      const weakAreasResult = await db.execute(
        sql`SELECT skill_area FROM learning_progress WHERE user_id = ${userId} AND level < 5 ORDER BY level ASC LIMIT 3`
      );
      const learningGoals = weakAreasResult.rows.map(row => `Improve ${row.skill_area} skills`);

      // Recommend content based on engagement patterns
      const contentResult = await db.execute(
        sql`SELECT content_type FROM content_engagement WHERE user_id = ${userId} AND rating >= 4 GROUP BY content_type ORDER BY COUNT(*) DESC LIMIT 3`
      );
      const recommendedContent = contentResult.rows.map(row => `More ${row.content_type} content`);

      return {
        totalActions,
        averageSessionTime,
        skillImprovement,
        mostUsedFeatures,
        learningGoals: learningGoals.length > 0 ? learningGoals : ['Complete emergency response training'],
        recommendedContent: recommendedContent.length > 0 ? recommendedContent : ['Legal rights tutorials', 'Emergency scenarios', 'State-specific laws']
      };
    } catch (error) {
      console.error('Error generating learning analytics summary:', error);
      return {
        totalActions: 0,
        averageSessionTime: 0,
        skillImprovement: 0,
        mostUsedFeatures: [],
        learningGoals: ['Complete emergency response training'],
        recommendedContent: ['Legal rights tutorials', 'Emergency scenarios', 'State-specific laws']
      };
    }
  }

  async getPlatformLearningInsights(): Promise<{
    userEngagementTrends: any[];
    popularContent: any[];
    commonLearningPaths: any[];
    effectiveFeatures: any[];
    improvementAreas: any[];
  }> {
    try {
      // User engagement trends over time
      const engagementResult = await db.execute(
        sql`SELECT DATE(timestamp) as date, COUNT(*) as actions FROM user_actions WHERE timestamp >= NOW() - INTERVAL '30 days' GROUP BY DATE(timestamp) ORDER BY date`
      );

      // Most popular content by engagement
      const popularResult = await db.execute(
        sql`SELECT content_type, content_title, COUNT(*) as views, AVG(rating) as avg_rating FROM content_engagement WHERE completed = true GROUP BY content_type, content_title ORDER BY views DESC LIMIT 10`
      );

      // Common learning progression paths
      const pathsResult = await db.execute(
        sql`SELECT category, skill_area, AVG(level) as avg_level, COUNT(*) as users FROM learning_progress GROUP BY category, skill_area ORDER BY users DESC LIMIT 10`
      );

      // Most effective features by user satisfaction
      const effectiveResult = await db.execute(
        sql`SELECT feature, AVG(effectiveness) as avg_effectiveness, AVG(user_rating) as avg_rating, COUNT(*) as usage_count FROM feature_usage WHERE effectiveness IS NOT NULL GROUP BY feature ORDER BY avg_effectiveness DESC LIMIT 10`
      );

      // Areas needing improvement
      const improvementResult = await db.execute(
        sql`SELECT skill_area, AVG(level) as avg_level, COUNT(*) as user_count FROM learning_progress WHERE level < 5 GROUP BY skill_area ORDER BY avg_level ASC LIMIT 5`
      );

      return {
        userEngagementTrends: engagementResult.rows,
        popularContent: popularResult.rows,
        commonLearningPaths: pathsResult.rows,
        effectiveFeatures: effectiveResult.rows,
        improvementAreas: improvementResult.rows
      };
    } catch (error) {
      console.error('Error generating platform learning insights:', error);
      return {
        userEngagementTrends: [],
        popularContent: [],
        commonLearningPaths: [],
        effectiveFeatures: [],
        improvementAreas: []
      };
    }
  }

  // Legal Navigation operations
  async createLegalDestination(destination: InsertLegalDestination): Promise<LegalDestination> {
    const [newDestination] = await db.insert(legalDestinations).values(destination).returning();
    return newDestination;
  }

  async getLegalDestinations(type?: string, state?: string, latitude?: number, longitude?: number, radius?: number): Promise<LegalDestination[]> {
    let query = db.select().from(legalDestinations);
    
    const conditions = [];
    if (type) conditions.push(eq(legalDestinations.type, type));
    if (state) conditions.push(eq(legalDestinations.state, state));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    let results = await query.orderBy(legalDestinations.name);
    
    // If coordinates provided, filter by radius
    if (latitude && longitude && radius && results.length > 0) {
      results = results.filter(dest => {
        const destLat = parseFloat(dest.latitude);
        const destLng = parseFloat(dest.longitude);
        const distance = this.calculateDistance(latitude, longitude, destLat, destLng);
        return distance <= radius;
      });
    }
    
    return results;
  }

  async getLegalDestination(id: number): Promise<LegalDestination | undefined> {
    const [destination] = await db.select().from(legalDestinations).where(eq(legalDestinations.id, id));
    return destination;
  }

  async updateLegalDestination(id: number, updates: Partial<LegalDestination>): Promise<LegalDestination> {
    const [destination] = await db
      .update(legalDestinations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(legalDestinations.id, id))
      .returning();
    return destination;
  }

  async deleteLegalDestination(id: number): Promise<void> {
    await db.delete(legalDestinations).where(eq(legalDestinations.id, id));
  }

  async createLegalRoute(route: InsertLegalRoute): Promise<LegalRoute> {
    const [newRoute] = await db.insert(legalRoutes).values(route).returning();
    return newRoute;
  }

  async getLegalRoutes(userId: string, status?: string): Promise<LegalRoute[]> {
    let query = db.select().from(legalRoutes).where(eq(legalRoutes.userId, userId));
    
    if (status) {
      query = query.where(and(eq(legalRoutes.userId, userId), eq(legalRoutes.status, status)));
    }
    
    return await query.orderBy(desc(legalRoutes.createdAt));
  }

  async getLegalRoute(id: number, userId: string): Promise<LegalRoute | undefined> {
    const [route] = await db
      .select()
      .from(legalRoutes)
      .where(and(eq(legalRoutes.id, id), eq(legalRoutes.userId, userId)));
    return route;
  }

  async updateLegalRoute(id: number, userId: string, updates: Partial<LegalRoute>): Promise<LegalRoute> {
    const [route] = await db
      .update(legalRoutes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(legalRoutes.id, id), eq(legalRoutes.userId, userId)))
      .returning();
    return route;
  }

  async deleteLegalRoute(id: number, userId: string): Promise<void> {
    await db
      .delete(legalRoutes)
      .where(and(eq(legalRoutes.id, id), eq(legalRoutes.userId, userId)));
  }

  async getNearbyLegalDestinations(latitude: number, longitude: number, type?: string, radius: number = 25): Promise<LegalDestination[]> {
    let query = db.select().from(legalDestinations);
    
    if (type) {
      query = query.where(eq(legalDestinations.type, type));
    }
    
    const results = await query.orderBy(legalDestinations.name);
    
    // Filter by distance and sort by proximity
    const nearby = results
      .map(dest => ({
        ...dest,
        distance: this.calculateDistance(latitude, longitude, parseFloat(dest.latitude), parseFloat(dest.longitude))
      }))
      .filter(dest => dest.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    
    return nearby;
  }

  async getEmergencyLegalDestinations(latitude: number, longitude: number): Promise<LegalDestination[]> {
    // Get police stations and emergency attorney offices within 10 miles
    const policeStations = await this.getNearbyLegalDestinations(latitude, longitude, 'police_station', 10);
    const emergencyAttorneys = await db
      .select()
      .from(legalDestinations)
      .where(and(eq(legalDestinations.type, 'attorney_office'), eq(legalDestinations.emergencyOnly, true)));
    
    const nearbyEmergencyAttorneys = emergencyAttorneys
      .map(dest => ({
        ...dest,
        distance: this.calculateDistance(latitude, longitude, parseFloat(dest.latitude), parseFloat(dest.longitude))
      }))
      .filter(dest => dest.distance <= 15)
      .sort((a, b) => a.distance - b.distance);
    
    return [...policeStations, ...nearbyEmergencyAttorneys];
  }

  // Helper method to calculate distance between two coordinates (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // User Journey Progress Sparkle Tracker implementation
  
  // Journey milestones operations
  async createJourneyMilestone(milestone: InsertJourneyMilestone): Promise<JourneyMilestone> {
    const [newMilestone] = await db.insert(journeyMilestones).values(milestone).returning();
    return newMilestone;
  }

  async getJourneyMilestones(category?: string, isActive?: boolean): Promise<JourneyMilestone[]> {
    let query = db.select().from(journeyMilestones);
    
    const conditions = [];
    if (category) {
      conditions.push(eq(journeyMilestones.category, category));
    }
    if (isActive !== undefined) {
      conditions.push(eq(journeyMilestones.isActive, isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(journeyMilestones.sortOrder, journeyMilestones.createdAt);
  }

  async getJourneyMilestone(id: number): Promise<JourneyMilestone | undefined> {
    const [milestone] = await db
      .select()
      .from(journeyMilestones)
      .where(eq(journeyMilestones.id, id));
    return milestone;
  }

  async updateJourneyMilestone(id: number, updates: Partial<JourneyMilestone>): Promise<JourneyMilestone> {
    const [milestone] = await db
      .update(journeyMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(journeyMilestones.id, id))
      .returning();
    return milestone;
  }

  // User progress tracking operations
  async recordUserProgress(progress: InsertUserJourneyProgress): Promise<UserJourneyProgress> {
    const [newProgress] = await db.insert(userJourneyProgress).values(progress).returning();
    return newProgress;
  }

  async getUserProgress(userId: string, milestoneId?: number): Promise<UserJourneyProgress[]> {
    let query = db.select().from(userJourneyProgress).where(eq(userJourneyProgress.userId, userId));
    
    if (milestoneId) {
      query = query.where(and(eq(userJourneyProgress.userId, userId), eq(userJourneyProgress.milestoneId, milestoneId)));
    }
    
    return await query.orderBy(desc(userJourneyProgress.completedAt));
  }

  async getCompletedMilestones(userId: string, category?: string): Promise<UserJourneyProgress[]> {
    let query = db.select({
      id: userJourneyProgress.id,
      userId: userJourneyProgress.userId,
      milestoneId: userJourneyProgress.milestoneId,
      completedAt: userJourneyProgress.completedAt,
      sparkleShown: userJourneyProgress.sparkleShown,
      sparkleShownAt: userJourneyProgress.sparkleShownAt,
      pointsAwarded: userJourneyProgress.pointsAwarded,
      relatedEntityId: userJourneyProgress.relatedEntityId,
      relatedEntityType: userJourneyProgress.relatedEntityType,
      completionData: userJourneyProgress.completionData,
      createdAt: userJourneyProgress.createdAt,
      milestoneName: journeyMilestones.name,
      milestoneTitle: journeyMilestones.title,
      milestoneCategory: journeyMilestones.category
    })
    .from(userJourneyProgress)
    .innerJoin(journeyMilestones, eq(userJourneyProgress.milestoneId, journeyMilestones.id))
    .where(eq(userJourneyProgress.userId, userId));
    
    if (category) {
      query = query.where(and(eq(userJourneyProgress.userId, userId), eq(journeyMilestones.category, category)));
    }
    
    return await query.orderBy(desc(userJourneyProgress.completedAt));
  }

  async markSparkleShown(progressId: number): Promise<UserJourneyProgress> {
    const [progress] = await db
      .update(userJourneyProgress)
      .set({ sparkleShown: true, sparkleShownAt: new Date() })
      .where(eq(userJourneyProgress.id, progressId))
      .returning();
    return progress;
  }

  // User journey stats operations
  async getUserJourneyStats(userId: string): Promise<UserJourneyStats | undefined> {
    const [stats] = await db
      .select()
      .from(userJourneyStats)
      .where(eq(userJourneyStats.userId, userId));
    return stats;
  }

  async updateUserJourneyStats(userId: string, updates: Partial<UserJourneyStats>): Promise<UserJourneyStats> {
    const [stats] = await db
      .insert(userJourneyStats)
      .values({ userId, ...updates, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userJourneyStats.userId,
        set: { ...updates, updatedAt: new Date() }
      })
      .returning();
    return stats;
  }

  async incrementUserPoints(userId: string, points: number): Promise<UserJourneyStats> {
    const currentStats = await this.getUserJourneyStats(userId);
    const newTotalPoints = (currentStats?.totalPoints || 0) + points;
    const newLevel = Math.floor(newTotalPoints / 100) + 1; // Level up every 100 points
    
    return await this.updateUserJourneyStats(userId, {
      totalPoints: newTotalPoints,
      currentLevel: newLevel
    });
  }

  async updateUserStreak(userId: string): Promise<UserJourneyStats> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Check if user was active yesterday
    const [yesterdayActivity] = await db
      .select()
      .from(dailyStreaks)
      .where(and(eq(dailyStreaks.userId, userId), eq(dailyStreaks.date, yesterday)));
    
    const currentStats = await this.getUserJourneyStats(userId);
    let newStreak = 1;
    
    if (yesterdayActivity && currentStats) {
      newStreak = currentStats.currentStreak + 1;
    }
    
    const longestStreak = Math.max(currentStats?.longestStreak || 0, newStreak);
    
    return await this.updateUserJourneyStats(userId, {
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastActivityDate: today
    });
  }

  // Sparkle queue operations
  async addSparkleToQueue(sparkle: InsertSparkleQueue): Promise<SparkleQueue> {
    const [newSparkle] = await db.insert(sparkleQueue).values(sparkle).returning();
    return newSparkle;
  }

  async getPendingSparkles(userId: string, location?: string): Promise<SparkleQueue[]> {
    let query = db.select().from(sparkleQueue)
      .where(and(eq(sparkleQueue.userId, userId), eq(sparkleQueue.isShown, false)));
    
    if (location) {
      query = query.where(and(
        eq(sparkleQueue.userId, userId), 
        eq(sparkleQueue.isShown, false),
        eq(sparkleQueue.location, location)
      ));
    }
    
    return await query.orderBy(sparkleQueue.createdAt);
  }

  async markSparkleQueueShown(sparkleId: number): Promise<SparkleQueue> {
    const [sparkle] = await db
      .update(sparkleQueue)
      .set({ isShown: true, shownAt: new Date() })
      .where(eq(sparkleQueue.id, sparkleId))
      .returning();
    return sparkle;
  }

  async cleanupExpiredSparkles(): Promise<void> {
    await db
      .delete(sparkleQueue)
      .where(sql`expires_at < NOW()`);
  }

  // Journey badges operations
  async createJourneyBadge(badge: InsertJourneyBadge): Promise<JourneyBadge> {
    const [newBadge] = await db.insert(journeyBadges).values(badge).returning();
    return newBadge;
  }

  async getJourneyBadges(badgeType?: string, isActive?: boolean): Promise<JourneyBadge[]> {
    let query = db.select().from(journeyBadges);
    
    const conditions = [];
    if (badgeType) {
      conditions.push(eq(journeyBadges.badgeType, badgeType));
    }
    if (isActive !== undefined) {
      conditions.push(eq(journeyBadges.isActive, isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(journeyBadges.sortOrder, journeyBadges.createdAt);
  }

  async getJourneyBadge(id: number): Promise<JourneyBadge | undefined> {
    const [badge] = await db
      .select()
      .from(journeyBadges)
      .where(eq(journeyBadges.id, id));
    return badge;
  }

  // User badges operations
  async awardUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [newUserBadge] = await db.insert(userBadges).values(userBadge).returning();
    return newUserBadge;
  }

  async getUserBadges(userId: string, isDisplayed?: boolean): Promise<UserBadge[]> {
    let query = db.select({
      id: userBadges.id,
      userId: userBadges.userId,
      badgeId: userBadges.badgeId,
      earnedAt: userBadges.earnedAt,
      isDisplayed: userBadges.isDisplayed,
      sparkleShown: userBadges.sparkleShown,
      sparkleShownAt: userBadges.sparkleShownAt,
      pointsAwarded: userBadges.pointsAwarded,
      earningContext: userBadges.earningContext,
      createdAt: userBadges.createdAt,
      badgeName: journeyBadges.name,
      badgeTitle: journeyBadges.title,
      badgeType: journeyBadges.badgeType,
      rarity: journeyBadges.rarity,
      icon: journeyBadges.icon
    })
    .from(userBadges)
    .innerJoin(journeyBadges, eq(userBadges.badgeId, journeyBadges.id))
    .where(eq(userBadges.userId, userId));
    
    if (isDisplayed !== undefined) {
      query = query.where(and(eq(userBadges.userId, userId), eq(userBadges.isDisplayed, isDisplayed)));
    }
    
    return await query.orderBy(desc(userBadges.earnedAt));
  }

  async markBadgeShown(badgeId: number, userId: string): Promise<UserBadge> {
    const [userBadge] = await db
      .update(userBadges)
      .set({ sparkleShown: true, sparkleShownAt: new Date() })
      .where(and(eq(userBadges.badgeId, badgeId), eq(userBadges.userId, userId)))
      .returning();
    return userBadge;
  }

  async checkBadgeEligibility(userId: string, badgeId: number): Promise<boolean> {
    const badge = await this.getJourneyBadge(badgeId);
    if (!badge) return false;
    
    // Check if user already has this badge
    const existingBadge = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
    
    if (existingBadge.length > 0) return false;
    
    // Check badge requirements
    const requirements = badge.requirements as any;
    if (requirements.milestones) {
      const milestoneNames = requirements.milestones;
      const completedMilestones = await db
        .select({ count: sql`COUNT(*)` })
        .from(userJourneyProgress)
        .innerJoin(journeyMilestones, eq(userJourneyProgress.milestoneId, journeyMilestones.id))
        .where(and(
          eq(userJourneyProgress.userId, userId),
          inArray(journeyMilestones.name, milestoneNames)
        ));
      
      const completedCount = Number(completedMilestones[0]?.count || 0);
      return completedCount >= milestoneNames.length;
    }
    
    return true;
  }

  // Daily streak operations
  async recordDailyActivity(streak: InsertDailyStreak): Promise<DailyStreak> {
    const [newStreak] = await db
      .insert(dailyStreaks)
      .values(streak)
      .onConflictDoUpdate({
        target: [dailyStreaks.userId, dailyStreaks.date],
        set: {
          activityCount: sql`${dailyStreaks.activityCount} + 1`,
          milestonesEarned: sql`${dailyStreaks.milestonesEarned} + ${streak.milestonesEarned || 0}`,
          pointsEarned: sql`${dailyStreaks.pointsEarned} + ${streak.pointsEarned || 0}`
        }
      })
      .returning();
    return newStreak;
  }

  async getDailyStreaks(userId: string, days?: number): Promise<DailyStreak[]> {
    let query = db.select().from(dailyStreaks).where(eq(dailyStreaks.userId, userId));
    
    if (days) {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.where(and(eq(dailyStreaks.userId, userId), sql`date >= ${startDate}`));
    }
    
    return await query.orderBy(desc(dailyStreaks.date));
  }

  async getCurrentStreak(userId: string): Promise<number> {
    const stats = await this.getUserJourneyStats(userId);
    return stats?.currentStreak || 0;
  }

  // Progress analytics operations
  async getProgressAnalytics(userId: string): Promise<{
    totalMilestones: number;
    completedMilestones: number;
    currentLevel: number;
    totalPoints: number;
    currentStreak: number;
    recentAchievements: UserJourneyProgress[];
    nextMilestones: JourneyMilestone[];
    progressPercentage: number;
  }> {
    const [totalMilestonesResult] = await db
      .select({ count: sql`COUNT(*)` })
      .from(journeyMilestones)
      .where(eq(journeyMilestones.isActive, true));
    
    const totalMilestones = Number(totalMilestonesResult.count);
    
    const completedMilestones = await this.getUserProgress(userId);
    const completedCount = completedMilestones.length;
    
    const stats = await this.getUserJourneyStats(userId);
    
    const recentAchievements = await db
      .select()
      .from(userJourneyProgress)
      .where(eq(userJourneyProgress.userId, userId))
      .orderBy(desc(userJourneyProgress.completedAt))
      .limit(5);
    
    const completedMilestoneIds = completedMilestones.map(cm => cm.milestoneId);
    const nextMilestones = await db
      .select()
      .from(journeyMilestones)
      .where(and(
        eq(journeyMilestones.isActive, true),
        completedMilestoneIds.length > 0 ? sql`id NOT IN (${completedMilestoneIds.join(',')})` : sql`1=1`
      ))
      .orderBy(journeyMilestones.sortOrder)
      .limit(5);
    
    const progressPercentage = totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0;
    
    return {
      totalMilestones,
      completedMilestones: completedCount,
      currentLevel: stats?.currentLevel || 1,
      totalPoints: stats?.totalPoints || 0,
      currentStreak: stats?.currentStreak || 0,
      recentAchievements,
      nextMilestones,
      progressPercentage
    };
  }

  // Milestone trigger operations (for automatic milestone detection)
  async checkAndAwardMilestones(userId: string, actionType: string, relatedEntityId?: string, relatedEntityType?: string): Promise<UserJourneyProgress[]> {
    // Get milestones that match the action type
    const applicableMilestones = await db
      .select()
      .from(journeyMilestones)
      .where(and(
        eq(journeyMilestones.isActive, true),
        sql`requirements->>'action' = ${actionType}`
      ));
    
    const awardedMilestones: UserJourneyProgress[] = [];
    
    for (const milestone of applicableMilestones) {
      // Check if user already completed this milestone
      const existing = await db
        .select()
        .from(userJourneyProgress)
        .where(and(
          eq(userJourneyProgress.userId, userId),
          eq(userJourneyProgress.milestoneId, milestone.id)
        ));
      
      if (existing.length === 0) {
        // Award the milestone
        const progress = await this.recordUserProgress({
          userId,
          milestoneId: milestone.id,
          pointsAwarded: milestone.points,
          relatedEntityId,
          relatedEntityType,
          completionData: { actionType, triggeredAt: new Date().toISOString() }
        });
        
        // Update user stats
        await this.incrementUserPoints(userId, milestone.points);
        
        // Add sparkle to queue
        await this.addSparkleToQueue({
          userId,
          sparkleType: milestone.sparkleType || 'gold',
          location: 'dashboard',
          relatedMilestoneId: milestone.id,
          triggerAction: actionType
        });
        
        awardedMilestones.push(progress);
      }
    }
    
    return awardedMilestones;
  }

  async triggerMilestoneCheck(userId: string, milestoneNames: string[]): Promise<UserJourneyProgress[]> {
    const milestones = await db
      .select()
      .from(journeyMilestones)
      .where(and(
        eq(journeyMilestones.isActive, true),
        inArray(journeyMilestones.name, milestoneNames)
      ));
    
    const awardedMilestones: UserJourneyProgress[] = [];
    
    for (const milestone of milestones) {
      // Check if user already completed this milestone
      const existing = await db
        .select()
        .from(userJourneyProgress)
        .where(and(
          eq(userJourneyProgress.userId, userId),
          eq(userJourneyProgress.milestoneId, milestone.id)
        ));
      
      if (existing.length === 0) {
        const progress = await this.recordUserProgress({
          userId,
          milestoneId: milestone.id,
          pointsAwarded: milestone.points,
          completionData: { triggeredAt: new Date().toISOString(), manualTrigger: true }
        });
        
        await this.incrementUserPoints(userId, milestone.points);
        
        await this.addSparkleToQueue({
          userId,
          sparkleType: milestone.sparkleType || 'gold',
          location: 'dashboard',
          relatedMilestoneId: milestone.id,
          triggerAction: 'manual_trigger'
        });
        
        awardedMilestones.push(progress);
      }
    }
    
    return awardedMilestones;
  }

}

export const storage = new DatabaseStorage();
