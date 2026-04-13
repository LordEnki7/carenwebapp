import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  password: varchar("password"), // Added for email/password authentication
  googleId: varchar("google_id"), // Added for Google OAuth
  appleId: varchar("apple_id"), // Added for Sign in with Apple
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(), // user, attorney, admin
  subscriptionTier: varchar("subscription_tier").default("basic_guard").notNull(), // basic_guard, safety_pro, constitutional_pro, family_protection, enterprise_fleet
  currentState: varchar("current_state"),
  preferredLanguage: varchar("preferred_language").default("en"),
  emergencyContacts: jsonb("emergency_contacts"),
  agreedToTerms: boolean("agreed_to_terms").default(false),
  termsAgreedAt: timestamp("terms_agreed_at"),
  directorRef: varchar("director_ref", { length: 20 }), // director referral code used at signup
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Login activity tracking table
export const loginActivity = pgTable("login_activity", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  email: varchar("email"), // Store email for tracking even if user is deleted
  loginMethod: varchar("login_method").notNull(), // 'password', 'demo', 'oauth'
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  subscriptionTier: varchar("subscription_tier"),
  success: boolean("success").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Facial recognition data table
export const facialRecognition = pgTable("facial_recognition", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  faceEncoding: text("face_encoding").notNull(), // Base64 encoded face data
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Incidents table
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  location: jsonb("location"), // { lat, lng, address }
  status: varchar("status").default("active").notNull(), // active, resolved, pending
  priority: varchar("priority").default("normal").notNull(), // low, normal, high, emergency
  mediaUrls: jsonb("media_urls"), // array of uploaded file URLs
  cloudBackup: boolean("cloud_backup").default(false),
  contactsNotified: boolean("contacts_notified").default(false),
  reportGenerated: boolean("report_generated").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legal rights by state
export const legalRights = pgTable("legal_rights", {
  id: serial("id").primaryKey(),
  state: varchar("state").notNull(),
  category: varchar("category").notNull(), // silence, recording, search, etc.
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  details: text("details"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Attorneys table - Enhanced for production
export const attorneys = pgTable("attorneys", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id), // Optional - some attorneys may not be platform users
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone"),
  firmName: varchar("firm_name").notNull(),
  firmAddress: text("firm_address"),
  firmWebsite: varchar("firm_website"),
  barNumber: varchar("bar_number").notNull(), // State bar license number
  barState: varchar("bar_state").notNull(), // Primary state bar admission
  specialties: jsonb("specialties").notNull(), // array of legal specialties
  statesLicensed: jsonb("states_licensed").notNull(), // array of states licensed in
  yearsExperience: integer("years_experience"),
  education: jsonb("education"), // law school, degrees, etc.
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  emergencyAvailable: boolean("emergency_available").default(false),
  languages: jsonb("languages").default('["English"]'), // languages spoken
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verificationDocuments: jsonb("verification_documents"), // URLs to verification docs
  contactInfo: jsonb("contact_info"), // structured contact information
  bio: text("bio"),
  profileImage: varchar("profile_image"),
  availability: jsonb("availability"), // schedule/availability data
  activeStatus: boolean("active_status").default(true),
  lastActive: timestamp("last_active").defaultNow(),
  // Network-specific fields
  countiesServed: jsonb("counties_served").default('[]'),
  availabilityStatus: varchar("availability_status").default("offline"), // available | busy | offline | emergency_only
  profileScore: integer("profile_score").default(0), // 0-100
  avgResponseMinutes: integer("avg_response_minutes").default(60),
  consultationType: varchar("consultation_type").default("paid"), // free | paid
  profileStatus: varchar("profile_status").default("pending"), // pending | approved | rejected
  malpracticeInsurance: boolean("malpractice_insurance").default(false),
  agreementSigned: boolean("agreement_signed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attorney connections
export const attorneyConnections = pgTable("attorney_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  attorneyId: integer("attorney_id").notNull().references(() => attorneys.id),
  incidentId: integer("incident_id").references(() => incidents.id),
  status: varchar("status").default("pending").notNull(), // pending, accepted, completed
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export schemas and types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertLoginActivity = typeof loginActivity.$inferInsert;
export type LoginActivity = typeof loginActivity.$inferSelect;

// AAA Roadside Assistance table
export const aaaMembers = pgTable("aaa_members", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  membershipNumber: varchar("membership_number").notNull(),
  membershipType: varchar("membership_type").notNull(), // 'basic' | 'plus' | 'premier'
  memberName: varchar("member_name").notNull(),
  phoneNumber: varchar("phone_number").notNull(),
  expirationDate: timestamp("expiration_date"),
  emergencyContact: varchar("emergency_contact"),
  vehicleInfo: jsonb("vehicle_info"), // Array of vehicles covered
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAAAMemberSchema = createInsertSchema(aaaMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAAAMember = z.infer<typeof insertAAAMemberSchema>;

// User Learning Analytics Tables

// User behavior tracking - tracks every significant action users take
export const userActions = pgTable("user_actions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  action: varchar("action").notNull(), // page_view, button_click, voice_command, feature_use, etc.
  feature: varchar("feature").notNull(), // dashboard, rights, attorney, emergency, forum, etc.
  details: jsonb("details"), // specific action data like page visited, button clicked, etc.
  duration: integer("duration"), // time spent on action/page in seconds
  location: jsonb("location"), // user location when action performed
  deviceInfo: jsonb("device_info"), // device type, screen size, etc.
  timestamp: timestamp("timestamp").defaultNow(),
});

// Learning progress tracking - tracks user improvement over time
export const learningProgress = pgTable("learning_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: varchar("category").notNull(), // rights_knowledge, emergency_response, platform_usage
  skillArea: varchar("skill_area").notNull(), // traffic_stops, recording, constitutional_rights, etc.
  level: integer("level").default(1), // 1-10 skill level
  previousLevel: integer("previous_level").default(1),
  improvementScore: decimal("improvement_score", { precision: 5, scale: 2 }),
  practiceCount: integer("practice_count").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0.00"),
  timeSpent: integer("time_spent").default(0), // total time in seconds
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content engagement tracking - tracks how users engage with educational content
export const contentEngagement = pgTable("content_engagement", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  contentType: varchar("content_type").notNull(), // legal_rights, forum_post, tutorial, guide
  contentId: varchar("content_id").notNull(), // ID of specific content
  contentTitle: varchar("content_title"),
  engagementType: varchar("engagement_type").notNull(), // view, read, complete, share, bookmark
  timeSpent: integer("time_spent").default(0), // seconds
  scrollDepth: decimal("scroll_depth", { precision: 5, scale: 2 }), // percentage scrolled
  interactionCount: integer("interaction_count").default(0), // clicks, taps, etc.
  completed: boolean("completed").default(false),
  rating: integer("rating"), // 1-5 user rating
  feedback: text("feedback"), // user feedback text
  timestamp: timestamp("timestamp").defaultNow(),
});

// Knowledge assessment - tracks user knowledge improvements
export const knowledgeAssessments = pgTable("knowledge_assessments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: varchar("category").notNull(), // constitutional_rights, state_laws, emergency_procedures
  questions: jsonb("questions").notNull(), // array of questions asked
  answers: jsonb("answers").notNull(), // array of user answers
  correctAnswers: jsonb("correct_answers").notNull(), // array of correct answers
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // percentage score
  timeSpent: integer("time_spent").notNull(), // seconds to complete
  improvementFromPrevious: decimal("improvement_from_previous", { precision: 5, scale: 2 }),
  areasForImprovement: jsonb("areas_for_improvement"), // identified weak areas
  timestamp: timestamp("timestamp").defaultNow(),
});

// Feature usage analytics - using existing subscription featureUsage table for analytics

// Emergency response analytics - tracks emergency response improvements
export const emergencyResponseMetrics = pgTable("emergency_response_metrics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  responseType: varchar("response_type").notNull(), // voice_command, manual_trigger, auto_detection
  responseTime: integer("response_time").notNull(), // milliseconds from trigger to action
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }), // how well user followed procedures
  stepsCompleted: integer("steps_completed").default(0),
  totalSteps: integer("total_steps").default(0),
  improvementFromPrevious: decimal("improvement_from_previous", { precision: 5, scale: 2 }),
  scenarioType: varchar("scenario_type"), // traffic_stop, police_encounter, emergency_situation
  timestamp: timestamp("timestamp").defaultNow(),
});

// AI learning insights - tracks what the AI learns from user interactions
export const aiLearningInsights = pgTable("ai_learning_insights", {
  id: serial("id").primaryKey(),
  category: varchar("category").notNull(), // user_patterns, content_preferences, common_questions
  insight: text("insight").notNull(), // what was learned
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // AI confidence in insight
  dataPoints: integer("data_points").notNull(), // number of interactions that led to this insight
  userSegment: varchar("user_segment"), // which user group this applies to
  actionable: boolean("actionable").default(false), // whether this insight can be acted upon
  implementationStatus: varchar("implementation_status").default("pending"), // pending, implemented, tested
  impact: text("impact"), // what impact this insight could have
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export learning analytics types
export type InsertUserAction = typeof userActions.$inferInsert;
export type UserAction = typeof userActions.$inferSelect;

export type InsertLearningProgress = typeof learningProgress.$inferInsert;
export type LearningProgress = typeof learningProgress.$inferSelect;

export type InsertContentEngagement = typeof contentEngagement.$inferInsert;
export type ContentEngagement = typeof contentEngagement.$inferSelect;

export type InsertKnowledgeAssessment = typeof knowledgeAssessments.$inferInsert;
export type KnowledgeAssessment = typeof knowledgeAssessments.$inferSelect;

export type InsertFeatureUsage = typeof featureUsage.$inferInsert;
export type FeatureUsage = typeof featureUsage.$inferSelect;

export type InsertEmergencyResponseMetric = typeof emergencyResponseMetrics.$inferInsert;
export type EmergencyResponseMetric = typeof emergencyResponseMetrics.$inferSelect;

export type InsertAILearningInsight = typeof aiLearningInsights.$inferInsert;
export type AILearningInsight = typeof aiLearningInsights.$inferSelect;
export type AAAMember = typeof aaaMembers.$inferSelect;

// Emergency assistance requests table
export const emergencyAssistanceRequests = pgTable("emergency_assistance_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  incidentId: integer("incident_id").references(() => incidents.id, { onDelete: "set null" }),
  aaaMemberId: integer("aaa_member_id").references(() => aaaMembers.id, { onDelete: "set null" }),
  requestType: varchar("request_type").notNull(), // 'towing' | 'battery' | 'flat_tire' | 'lockout' | 'fuel' | 'other'
  location: jsonb("location").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("requested"), // 'requested' | 'dispatched' | 'en_route' | 'arrived' | 'completed' | 'cancelled'
  estimatedArrival: timestamp("estimated_arrival"),
  serviceProvider: varchar("service_provider"),
  serviceProviderPhone: varchar("service_provider_phone"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmergencyAssistanceRequestSchema = createInsertSchema(emergencyAssistanceRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertEmergencyAssistanceRequest = z.infer<typeof insertEmergencyAssistanceRequestSchema>;
export type EmergencyAssistanceRequest = typeof emergencyAssistanceRequests.$inferSelect;

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;

export const insertLegalRightsSchema = createInsertSchema(legalRights).omit({
  id: true,
  lastUpdated: true,
});
export type InsertLegalRights = z.infer<typeof insertLegalRightsSchema>;
export type LegalRights = typeof legalRights.$inferSelect;

export const insertAttorneySchema = createInsertSchema(attorneys).omit({
  id: true,
  createdAt: true,
});
export type InsertAttorney = z.infer<typeof insertAttorneySchema>;
export type Attorney = typeof attorneys.$inferSelect;

export const insertAttorneyConnectionSchema = createInsertSchema(attorneyConnections).omit({
  id: true,
  createdAt: true,
});
export type InsertAttorneyConnection = z.infer<typeof insertAttorneyConnectionSchema>;
export type AttorneyConnection = typeof attorneyConnections.$inferSelect;

// Attorney Applications - for attorneys applying to join the network
export const attorneyApplications = pgTable("attorney_applications", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone"),
  firmName: varchar("firm_name").notNull(),
  firmWebsite: varchar("firm_website"),
  statesLicensed: jsonb("states_licensed").notNull().default('[]'),
  barNumber: varchar("bar_number").notNull(),
  practiceAreas: jsonb("practice_areas").notNull().default('[]'),
  countiesServed: jsonb("counties_served").default('[]'),
  languages: jsonb("languages").default('["English"]'),
  emergencyAvailable: boolean("emergency_available").default(false),
  availability24_7: boolean("availability_24_7").default(false),
  consultationType: varchar("consultation_type").default("paid"), // free | paid
  malpracticeInsurance: boolean("malpractice_insurance").default(false),
  yearsExperience: integer("years_experience"),
  preferredContact: varchar("preferred_contact").default("email"), // email | phone | app
  bio: text("bio"),
  agreementSigned: boolean("agreement_signed").default(false),
  verificationStatus: varchar("verification_status").default("pending"), // pending | approved | rejected | hold
  score: integer("score").default(0), // 0-100 attorney quality score
  adminNotes: text("admin_notes"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAttorneyApplicationSchema = createInsertSchema(attorneyApplications).omit({
  id: true,
  verificationStatus: true,
  score: true,
  adminNotes: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAttorneyApplication = z.infer<typeof insertAttorneyApplicationSchema>;
export type AttorneyApplication = typeof attorneyApplications.$inferSelect;

// Attorney Outreach CRM - track outreach to potential attorneys
export const attorneyOutreach = pgTable("attorney_outreach", {
  id: serial("id").primaryKey(),
  firmName: varchar("firm_name").notNull(),
  contactName: varchar("contact_name"),
  contactTitle: varchar("contact_title"),
  email: varchar("email"),
  phone: varchar("phone"),
  website: varchar("website"),
  state: varchar("state").notNull(),
  city: varchar("city"),
  practiceAreas: jsonb("practice_areas").default('[]'),
  contactMethod: varchar("contact_method").default("email"), // email | call | linkedin
  status: varchar("status").default("not_contacted"), // not_contacted | contacted | responded | interested | onboarded | passed
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  notes: text("notes"),
  score: integer("score").default(0), // fit score 0-100
  source: varchar("source").default("manual"), // bar_directory | linkedin | referral | cold | manual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAttorneyOutreachSchema = createInsertSchema(attorneyOutreach).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAttorneyOutreach = z.infer<typeof insertAttorneyOutreachSchema>;
export type AttorneyOutreach = typeof attorneyOutreach.$inferSelect;

// Emergency contacts table
export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  relationship: varchar("relationship").notNull(),
  priority: varchar("priority").notNull().default("secondary"), // 'primary' | 'secondary'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;

// Emergency alerts table
export const emergencyAlerts = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type").notNull(), // 'police_encounter' | 'traffic_stop' | etc.
  location: jsonb("location"), // {latitude, longitude, address, city, state}
  userMessage: text("user_message"),
  incidentId: integer("incident_id").references(() => incidents.id),
  status: varchar("status").notNull().default("sent"), // 'sent' | 'delivered' | 'failed'
  contactsNotified: jsonb("contacts_notified"), // Array of contact IDs notified
  deliveryResults: jsonb("delivery_results"), // SMS/email delivery status
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  createdAt: true,
});

export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;

// Legal document templates table
export const legalDocumentTemplates = pgTable("legal_document_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'incident_report' | 'complaint' | 'affidavit' | 'witness_statement'
  category: varchar("category").notNull(), // 'traffic_stop' | 'police_misconduct' | 'civil_rights' | 'general'
  template: text("template").notNull(), // Template with placeholders like {{incidentDate}}
  fields: jsonb("fields").notNull(), // Required fields for template generation
  state: varchar("state"), // State-specific template (null for general)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLegalDocumentTemplateSchema = createInsertSchema(legalDocumentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLegalDocumentTemplate = z.infer<typeof insertLegalDocumentTemplateSchema>;
export type LegalDocumentTemplate = typeof legalDocumentTemplates.$inferSelect;

// Generated legal documents table
export const generatedLegalDocuments = pgTable("generated_legal_documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  incidentId: integer("incident_id").references(() => incidents.id, { onDelete: "cascade" }),
  templateId: integer("template_id").notNull().references(() => legalDocumentTemplates.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(), // Generated document content
  documentData: jsonb("document_data").notNull(), // Data used to generate document
  format: varchar("format").notNull().default("pdf"), // 'pdf' | 'docx' | 'txt'
  status: varchar("status").notNull().default("generated"), // 'generated' | 'downloaded' | 'shared'
  filePath: varchar("file_path"), // Path to generated file
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGeneratedLegalDocumentSchema = createInsertSchema(generatedLegalDocuments).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneratedLegalDocument = z.infer<typeof insertGeneratedLegalDocumentSchema>;
export type GeneratedLegalDocument = typeof generatedLegalDocuments.$inferSelect;

// Legal Agreement Acceptance table
export const legalAgreementAcceptances = pgTable("legal_agreement_acceptances", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agreementType: varchar("agreement_type").notNull(), // user_agreement, eula, disclaimer, cookies, privacy
  accepted: boolean("accepted").notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
});

export const insertLegalAgreementAcceptanceSchema = createInsertSchema(legalAgreementAcceptances).omit({
  id: true,
  acceptedAt: true,
});

export type InsertLegalAgreementAcceptance = z.infer<typeof insertLegalAgreementAcceptanceSchema>;
export type LegalAgreementAcceptance = typeof legalAgreementAcceptances.$inferSelect;

// Police Report Data Collection
export const policeReportData = pgTable("police_report_data", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  incidentId: varchar("incident_id", { length: 255 }),
  
  // Officer Information
  officerName: varchar("officer_name", { length: 255 }),
  officerBadgeNumber: varchar("officer_badge_number", { length: 100 }),
  officerDepartment: varchar("officer_department", { length: 255 }),
  supervisorName: varchar("supervisor_name", { length: 255 }),
  supervisorBadgeNumber: varchar("supervisor_badge_number", { length: 100 }),
  vehicleNumber: varchar("vehicle_number", { length: 100 }),
  
  // Incident Details
  incidentDate: timestamp("incident_date"),
  incidentLocation: varchar("incident_location", { length: 500 }),
  incidentDescription: text("incident_description"),
  witnessInformation: jsonb("witness_information"),
  
  // Legal Information
  rightsMiranda: boolean("rights_miranda").default(false),
  searchConducted: boolean("search_conducted").default(false),
  searchConsent: boolean("search_consent").default(false),
  arrestMade: boolean("arrest_made").default(false),
  chargesPressed: varchar("charges_pressed", { length: 500 }),
  
  // Evidence Collection
  evidencePhotos: jsonb("evidence_photos"),
  evidenceVideos: jsonb("evidence_videos"),
  evidenceAudio: jsonb("evidence_audio"),
  
  // Additional Police Report Fields
  reportType: varchar("report_type", { length: 100 }),
  complainantName: varchar("complainant_name", { length: 255 }),
  complainantContact: varchar("complainant_contact", { length: 255 }),
  damages: text("damages"),
  injuries: text("injuries"),
  propertyRecovered: text("property_recovered"),
  
  // Attorney Integration
  severityLevel: varchar("severity_level", { length: 50 }).default("low"), // low, medium, high, critical
  attorneyRequested: boolean("attorney_requested").default(false),
  attorneyContactedId: integer("attorney_contacted_id").references(() => attorneys.id),
  attorneyResponseTime: timestamp("attorney_response_time"),
  
  // Report Status
  reportSubmitted: boolean("report_submitted").default(false),
  reportNumber: varchar("report_number", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPoliceReportDataSchema = createInsertSchema(policeReportData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPoliceReportData = z.infer<typeof insertPoliceReportDataSchema>;
export type PoliceReportData = typeof policeReportData.$inferSelect;

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  tier: varchar("tier").notNull(), // basic_guard, safety_pro, constitutional_pro, family_protection, enterprise_fleet
  price: varchar("price").notNull(), // Store as string to avoid decimal issues
  billingCycle: varchar("billing_cycle").notNull(), // monthly, yearly
  features: jsonb("features").notNull(),
  maxIncidents: integer("max_incidents").default(-1), // -1 for unlimited
  maxEmergencyContacts: integer("max_emergency_contacts").default(-1),
  maxAttorneyConnections: integer("max_attorney_connections").default(-1),
  cloudStorageDays: integer("cloud_storage_days").default(-1),
  emergencyLawyerCalls: integer("emergency_lawyer_calls").default(0),
  prioritySupport: boolean("priority_support").default(false),
  attorneyResponseTime: integer("attorney_response_time_minutes").default(-1), // -1 for no guarantee
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: varchar("status").notNull(), // active, cancelled, past_due, trialing
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  usageStats: jsonb("usage_stats"), // Track feature usage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feature Usage Tracking table
export const featureUsage = pgTable("feature_usage", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feature: varchar("feature").notNull(),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  billingCycle: varchar("billing_cycle").notNull(),
  cycleStart: timestamp("cycle_start").notNull(),
  cycleEnd: timestamp("cycle_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;
export type FeatureUsage = typeof featureUsage.$inferSelect;

// Attorney-Client Messaging System Tables

// Conversation threads between users and attorneys
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  attorneyId: integer("attorney_id").notNull().references(() => attorneys.id, { onDelete: "cascade" }),
  incidentId: integer("incident_id").references(() => incidents.id, { onDelete: "set null" }),
  subject: varchar("subject").notNull(),
  status: varchar("status").notNull().default("active"), // active, archived, closed
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  isEmergency: boolean("is_emergency").default(false),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual messages within conversations  
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().notNull(),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderType: varchar("sender_type").notNull(), // user, attorney
  content: text("content").notNull(),
  messageType: varchar("message_type").notNull().default("text"), // text, file, voice, system
  attachments: jsonb("attachments"), // Array of attachment objects
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isEncrypted: boolean("is_encrypted").default(true),
  encryptionKey: varchar("encryption_key"), // For end-to-end encryption
  replyToMessageId: varchar("reply_to_message_id"),
  isSystemMessage: boolean("is_system_message").default(false),
  systemMessageType: varchar("system_message_type"), // conversation_started, attorney_assigned, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Message attachments table
export const messageAttachments = pgTable("message_attachments", {
  id: varchar("id").primaryKey().notNull(),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  fileType: varchar("file_type").notNull(), // image, document, audio, video
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  filePath: varchar("file_path").notNull(),
  isEncrypted: boolean("is_encrypted").default(true),
  encryptionKey: varchar("encryption_key"),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Officer Complaints System Tables

// Core complaints table
export const officerComplaints = pgTable("officer_complaints", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  incidentId: integer("incident_id").references(() => incidents.id, { onDelete: "set null" }),
  attorneyId: integer("attorney_id").references(() => attorneys.id, { onDelete: "set null" }),
  
  // Officer Information
  officerName: varchar("officer_name"),
  officerBadgeNumber: varchar("officer_badge_number"),
  officerDepartment: varchar("officer_department").notNull(),
  officerRank: varchar("officer_rank"),
  supervisorName: varchar("supervisor_name"),
  
  // Incident Details
  complaintType: varchar("complaint_type").notNull(), // misconduct, excessive_force, discrimination, violation_of_rights
  incidentDate: timestamp("incident_date").notNull(),
  incidentLocation: jsonb("incident_location"), // { address, city, state, coordinates }
  jurisdiction: varchar("jurisdiction").notNull(), // which authority handles this
  
  // Complaint Details
  description: text("description").notNull(),
  witnessesPresent: boolean("witnesses_present").default(false),
  witnessCount: integer("witness_count").default(0),
  evidenceAttached: boolean("evidence_attached").default(false),
  evidenceTypes: jsonb("evidence_types"), // ['video', 'audio', 'photos', 'documents']
  
  // Filing Information
  filingMethod: varchar("filing_method").notNull(), // internal_affairs, civilian_review, attorney_general, fbi
  targetAgency: varchar("target_agency").notNull(), // specific department or agency
  complaintNumber: varchar("complaint_number"), // assigned by filing agency
  
  // Status Tracking
  status: varchar("status").notNull().default("draft"), // draft, filed, under_review, investigating, resolved, closed
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  currentStep: varchar("current_step").default("preparation"), // preparation, filing, follow_up, resolution
  
  // Outcome Information
  outcome: varchar("outcome"), // sustained, not_sustained, unfounded, exonerated, policy_failure
  disciplinaryAction: text("disciplinary_action"),
  recommendedChanges: text("recommended_changes"),
  
  // Timeline
  filedAt: timestamp("filed_at"),
  responseDeadline: timestamp("response_deadline"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Complaint evidence attachments
export const complaintEvidence = pgTable("complaint_evidence", {
  id: varchar("id").primaryKey().notNull(),
  complaintId: varchar("complaint_id").notNull().references(() => officerComplaints.id, { onDelete: "cascade" }),
  evidenceType: varchar("evidence_type").notNull(), // video, audio, photo, document, witness_statement
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp"), // when evidence was created/captured
  location: jsonb("location"), // GPS coordinates if applicable
  isAuthenticated: boolean("is_authenticated").default(false), // cryptographic verification
  hashSignature: varchar("hash_signature"), // for evidence integrity
  createdAt: timestamp("created_at").defaultNow(),
});

// Complaint status updates and communications
export const complaintUpdates = pgTable("complaint_updates", {
  id: varchar("id").primaryKey().notNull(),
  complaintId: varchar("complaint_id").notNull().references(() => officerComplaints.id, { onDelete: "cascade" }),
  updateType: varchar("update_type").notNull(), // status_change, communication, deadline, outcome
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  updatedBy: varchar("updated_by"), // agency, attorney, system
  isPublic: boolean("is_public").default(true), // visible to complainant
  attachments: jsonb("attachments"), // any supporting documents
  createdAt: timestamp("created_at").defaultNow(),
});

// Template forms for different jurisdictions
export const complaintTemplates = pgTable("complaint_templates", {
  id: varchar("id").primaryKey().notNull(),
  jurisdiction: varchar("jurisdiction").notNull(), // state, city, or agency
  agencyName: varchar("agency_name").notNull(),
  complaintType: varchar("complaint_type").notNull(),
  templateName: varchar("template_name").notNull(),
  formFields: jsonb("form_fields").notNull(), // structured form definition
  submissionMethod: varchar("submission_method").notNull(), // online, mail, in_person, email
  submissionUrl: varchar("submission_url"),
  submissionAddress: text("submission_address"),
  contactInfo: jsonb("contact_info"),
  timeLimit: integer("time_limit"), // days to file complaint
  followUpRequired: boolean("follow_up_required").default(false),
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Complaint filing agencies and their contact information
export const complaintAgencies = pgTable("complaint_agencies", {
  id: varchar("id").primaryKey().notNull(),
  agencyType: varchar("agency_type").notNull(), // internal_affairs, civilian_review, attorney_general, fbi, civil_rights
  agencyName: varchar("agency_name").notNull(),
  jurisdiction: varchar("jurisdiction").notNull(), // state, city, county, federal
  location: jsonb("location"), // state, city coverage
  contactInfo: jsonb("contact_info").notNull(), // phone, email, address, website
  onlineFilingAvailable: boolean("online_filing_available").default(false),
  onlineFilingUrl: varchar("online_filing_url"),
  hoursOfOperation: varchar("hours_of_operation"),
  averageResponseTime: varchar("average_response_time"),
  publicReportsAvailable: boolean("public_reports_available").default(false),
  independentOversight: boolean("independent_oversight").default(false),
  prosecutionAuthority: boolean("prosecution_authority").default(false),
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attorney availability and response times
export const attorneyAvailability = pgTable("attorney_availability", {
  id: varchar("id").primaryKey().notNull(),
  attorneyId: integer("attorney_id").notNull().references(() => attorneys.id, { onDelete: "cascade" }),
  isOnline: boolean("is_online").default(false),
  status: varchar("status").notNull().default("available"), // available, busy, away, offline
  statusMessage: varchar("status_message"),
  lastSeen: timestamp("last_seen"),
  averageResponseTime: integer("average_response_time_minutes").default(60),
  workingHours: jsonb("working_hours"), // Schedule object
  timeZone: varchar("time_zone").default("UTC"),
  emergencyAvailable: boolean("emergency_available").default(false),
  maxConcurrentChats: integer("max_concurrent_chats").default(5),
  currentChatCount: integer("current_chat_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message read receipts for accountability
export const messageReadReceipts = pgTable("message_read_receipts", {
  id: varchar("id").primaryKey().notNull(),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").defaultNow(),
  deviceInfo: varchar("device_info"),
  ipAddress: varchar("ip_address"),
});

// Conversation notes for attorneys (internal)
export const conversationNotes = pgTable("conversation_notes", {
  id: varchar("id").primaryKey().notNull(),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  attorneyId: integer("attorney_id").notNull().references(() => attorneys.id, { onDelete: "cascade" }),
  noteType: varchar("note_type").notNull().default("general"), // general, strategy, follow_up, billing
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(true), // Only visible to attorney
  tags: jsonb("tags"), // Array of tag strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertMessageAttachmentSchema = createInsertSchema(messageAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertAttorneyAvailabilitySchema = createInsertSchema(attorneyAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageReadReceiptSchema = createInsertSchema(messageReadReceipts).omit({
  id: true,
  readAt: true,
});

export const insertConversationNoteSchema = createInsertSchema(conversationNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessageAttachment = z.infer<typeof insertMessageAttachmentSchema>;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type InsertAttorneyAvailability = z.infer<typeof insertAttorneyAvailabilitySchema>;
export type AttorneyAvailability = typeof attorneyAvailability.$inferSelect;
export type InsertMessageReadReceipt = z.infer<typeof insertMessageReadReceiptSchema>;
export type MessageReadReceipt = typeof messageReadReceipts.$inferSelect;
export type InsertConversationNote = z.infer<typeof insertConversationNoteSchema>;
export type ConversationNote = typeof conversationNotes.$inferSelect;

// Officer Complaints Schema Exports
export const insertOfficerComplaintSchema = createInsertSchema(officerComplaints).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertComplaintEvidenceSchema = createInsertSchema(complaintEvidence).omit({
  id: true,
  createdAt: true,
});

export const insertComplaintUpdateSchema = createInsertSchema(complaintUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertComplaintTemplateSchema = createInsertSchema(complaintTemplates).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertComplaintAgencySchema = createInsertSchema(complaintAgencies).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export type InsertOfficerComplaint = z.infer<typeof insertOfficerComplaintSchema>;
export type OfficerComplaint = typeof officerComplaints.$inferSelect;
export type InsertComplaintEvidence = z.infer<typeof insertComplaintEvidenceSchema>;
export type ComplaintEvidence = typeof complaintEvidence.$inferSelect;
export type InsertComplaintUpdate = z.infer<typeof insertComplaintUpdateSchema>;
export type ComplaintUpdate = typeof complaintUpdates.$inferSelect;
export type InsertComplaintTemplate = z.infer<typeof insertComplaintTemplateSchema>;
export type ComplaintTemplate = typeof complaintTemplates.$inferSelect;
export type InsertComplaintAgency = z.infer<typeof insertComplaintAgencySchema>;
export type ComplaintAgency = typeof complaintAgencies.$inferSelect;

// Facial Recognition schema and types
export const insertFacialRecognitionSchema = createInsertSchema(facialRecognition).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFacialRecognition = z.infer<typeof insertFacialRecognitionSchema>;
export type FacialRecognition = typeof facialRecognition.$inferSelect;

// Voice Command Learning System Tables

// User voice profiles for personalized recognition
export const voiceProfiles = pgTable("voice_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  profileName: varchar("profile_name").notNull().default("Default Profile"),
  language: varchar("language").notNull().default("en-US"),
  accent: varchar("accent"), // regional accent detection
  voiceCharacteristics: jsonb("voice_characteristics"), // pitch, tone, speed patterns
  confidenceThreshold: decimal("confidence_threshold", { precision: 5, scale: 4 }).default("0.7"),
  adaptationLevel: varchar("adaptation_level").default("beginner"), // beginner, intermediate, advanced
  totalTrainingSessions: integer("total_training_sessions").default(0),
  lastTrainingDate: timestamp("last_training_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom voice commands created by users
export const customVoiceCommands = pgTable("custom_voice_commands", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voiceProfileId: integer("voice_profile_id").notNull().references(() => voiceProfiles.id, { onDelete: "cascade" }),
  commandName: varchar("command_name").notNull(),
  triggerPhrases: jsonb("trigger_phrases").notNull(), // Array of phrases
  actionType: varchar("action_type").notNull(), // navigation, recording, emergency, custom
  actionTarget: varchar("action_target").notNull(), // page, function, or custom action
  actionParameters: jsonb("action_parameters"), // Additional parameters for the action
  priority: integer("priority").default(1), // Higher numbers = higher priority
  isEnabled: boolean("is_enabled").default(true),
  successRate: decimal("success_rate", { precision: 5, scale: 4 }).default("0.0"),
  totalAttempts: integer("total_attempts").default(0),
  successfulAttempts: integer("successful_attempts").default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training sessions for voice command learning
export const voiceTrainingSessions = pgTable("voice_training_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voiceProfileId: integer("voice_profile_id").notNull().references(() => voiceProfiles.id, { onDelete: "cascade" }),
  sessionType: varchar("session_type").notNull(), // initial_setup, custom_command, adaptation, improvement
  commandId: integer("command_id").references(() => customVoiceCommands.id, { onDelete: "cascade" }),
  audioSamples: jsonb("audio_samples"), // Array of audio data or references
  transcriptionResults: jsonb("transcription_results"), // What was understood
  expectedPhrases: jsonb("expected_phrases"), // What was intended
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 4 }),
  improvementSuggestions: jsonb("improvement_suggestions"),
  sessionDuration: integer("session_duration_seconds"),
  environmentNoise: varchar("environment_noise").default("quiet"), // quiet, moderate, noisy
  deviceType: varchar("device_type"), // desktop, mobile, headset
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice pattern analysis for continuous learning
export const voicePatterns = pgTable("voice_patterns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voiceProfileId: integer("voice_profile_id").notNull().references(() => voiceProfiles.id, { onDelete: "cascade" }),
  patternType: varchar("pattern_type").notNull(), // phoneme, intonation, rhythm, emphasis
  patternData: jsonb("pattern_data").notNull(), // Analyzed pattern characteristics
  frequency: decimal("frequency", { precision: 10, scale: 6 }), // How often this pattern occurs
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  contextTags: jsonb("context_tags"), // When this pattern is most common
  isLearned: boolean("is_learned").default(false),
  lastDetected: timestamp("last_detected"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice command usage analytics
export const voiceCommandAnalytics = pgTable("voice_command_analytics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  commandId: integer("command_id").references(() => customVoiceCommands.id, { onDelete: "cascade" }),
  commandType: varchar("command_type").notNull(), // built_in, custom
  recognizedPhrase: varchar("recognized_phrase"),
  intendedCommand: varchar("intended_command"),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  executionTime: integer("execution_time_ms"),
  wasSuccessful: boolean("was_successful").notNull(),
  errorType: varchar("error_type"), // misrecognition, low_confidence, action_failed
  contextInfo: jsonb("context_info"), // Page, time of day, etc.
  feedbackGiven: boolean("feedback_given").default(false),
  userCorrection: varchar("user_correction"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice learning preferences and settings
export const voiceLearningSettings = pgTable("voice_learning_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  adaptiveLearning: boolean("adaptive_learning").default(true),
  backgroundLearning: boolean("background_learning").default(true),
  personalizedSuggestions: boolean("personalized_suggestions").default(true),
  voiceFeedback: boolean("voice_feedback").default(true),
  learningReminders: boolean("learning_reminders").default(true),
  privacyMode: varchar("privacy_mode").default("standard"), // strict, standard, enhanced
  dataRetention: varchar("data_retention").default("1_year"), // 1_month, 6_months, 1_year, indefinite
  shareAnonymousData: boolean("share_anonymous_data").default(false),
  preferredTrainingTime: varchar("preferred_training_time"), // morning, afternoon, evening, flexible
  maxTrainingDuration: integer("max_training_duration_minutes").default(10),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice prints for speaker identification
export const voicePrints = pgTable("voice_prints", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  speakerType: varchar("speaker_type").notNull(), // user, officer, witness, attorney, unknown
  speakerName: varchar("speaker_name"),
  voiceFeatures: text("voice_features").notNull(), // JSON string of voice feature vector
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  registrationAudio: text("registration_audio"), // Base64 encoded audio sample
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice authentication profiles for secure login
export const voiceAuthProfiles = pgTable("voice_auth_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  isEnabled: boolean("is_enabled").default(false),
  authVoiceFeatures: text("auth_voice_features").notNull(), // Primary authentication voice signature
  backupVoiceFeatures: text("backup_voice_features"), // Secondary voice signature for reliability
  confidenceThreshold: decimal("confidence_threshold", { precision: 5, scale: 4 }).default("0.85"),
  maxAuthAttempts: integer("max_auth_attempts").default(3),
  lockoutDuration: integer("lockout_duration_minutes").default(15),
  registrationSamples: jsonb("registration_samples"), // Multiple voice samples for training
  environmentalFactors: jsonb("environmental_factors"), // Noise, device types used during registration
  lastAuthSuccess: timestamp("last_auth_success"),
  failedAttempts: integer("failed_attempts").default(0),
  isLockedOut: boolean("is_locked_out").default(false),
  lockoutUntil: timestamp("lockout_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice authentication attempts log
export const voiceAuthAttempts = pgTable("voice_auth_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  audioSample: text("audio_sample"), // Base64 encoded attempt audio
  extractedFeatures: text("extracted_features"), // Voice features from attempt
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  wasSuccessful: boolean("was_successful").notNull(),
  failureReason: varchar("failure_reason"), // low_confidence, noise_detected, voice_mismatch, locked_out
  deviceInfo: varchar("device_info"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  environmentalNoise: varchar("environmental_noise"), // quiet, moderate, noisy
  attemptDuration: integer("attempt_duration_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice authentication settings
export const voiceAuthSettings = pgTable("voice_auth_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  requirePassphrase: boolean("require_passphrase").default(false),
  customPassphrase: varchar("custom_passphrase"), // User-defined phrase for authentication
  adaptiveThreshold: boolean("adaptive_threshold").default(true), // Adjust confidence based on environment
  emergencyBypass: boolean("emergency_bypass").default(true), // Allow emergency access
  biometricFallback: boolean("biometric_fallback").default(true), // Fall back to facial recognition
  notifyOnAuth: boolean("notify_on_auth").default(true), // Send notifications on successful auth
  geofencing: boolean("geofencing").default(false), // Require familiar locations
  trustedDevices: jsonb("trusted_devices"), // Device fingerprints for trusted devices
  maxSessionDuration: integer("max_session_duration_hours").default(24),
  requireReauth: boolean("require_reauth").default(false), // Periodic re-authentication
  reauthInterval: integer("reauth_interval_hours").default(8),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User interactions for adaptive learning
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  interactionType: varchar("interaction_type").notNull(), // voice_command, emergency_trigger, legal_question, recording_start, attorney_contact, rights_lookup
  content: text("content").notNull(),
  context: jsonb("context").notNull(), // location, state, timestamp, success, confidence, duration
  outcome: varchar("outcome").notNull(), // successful, failed, partial, retry_needed
  userFeedback: varchar("user_feedback"), // positive, negative, neutral
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferences for personalization
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  preferences: jsonb("preferences").notNull(), // responseStyle, urgencyLevel, confirmationNeeded, audioFeedback
  adaptations: jsonb("adaptations").notNull(), // customVoiceCommands, personalizedResponses, learningAdjustments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Adaptive learning insights
export const adaptiveLearning = pgTable("adaptive_learning", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pattern: text("pattern").notNull(),
  frequency: integer("frequency").notNull(),
  successRate: decimal("success_rate", { precision: 5, scale: 4 }).notNull(),
  userSpecific: boolean("user_specific").notNull(),
  recommendedAdaptation: text("recommended_adaptation").notNull(),
  priority: varchar("priority").notNull(), // low, medium, high, critical
  implementationStatus: varchar("implementation_status").default("pending"), // pending, implemented, testing, verified
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Speaker identification results for incidents
export const speakerIdentifications = pgTable("speaker_identifications", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull().references(() => incidents.id, { onDelete: "cascade" }),
  speakerId: varchar("speaker_id").notNull(), // References voice_prints.id or unknown speaker ID
  speakerType: varchar("speaker_type").notNull(), // user, officer, witness, attorney, unknown
  speakerName: varchar("speaker_name"),
  startTime: decimal("start_time", { precision: 10, scale: 3 }).notNull(), // seconds
  endTime: decimal("end_time", { precision: 10, scale: 3 }).notNull(), // seconds
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  transcript: text("transcript"),
  audioSegment: text("audio_segment"), // Base64 encoded audio segment
  legalKeywords: jsonb("legal_keywords"), // Detected legal terms
  emotionalTone: varchar("emotional_tone"), // calm, stressed, aggressive, fearful
  speakingRate: decimal("speaking_rate", { precision: 5, scale: 2 }), // words per minute
  volumeLevel: decimal("volume_level", { precision: 5, scale: 2 }), // average decibel level
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice Command Learning System Schemas and Types
export const insertVoiceProfileSchema = createInsertSchema(voiceProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomVoiceCommandSchema = createInsertSchema(customVoiceCommands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoiceTrainingSessionSchema = createInsertSchema(voiceTrainingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoicePatternSchema = createInsertSchema(voicePatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoiceCommandAnalyticsSchema = createInsertSchema(voiceCommandAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceLearningSettingsSchema = createInsertSchema(voiceLearningSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVoiceProfile = z.infer<typeof insertVoiceProfileSchema>;
export type VoiceProfile = typeof voiceProfiles.$inferSelect;
export type InsertCustomVoiceCommand = z.infer<typeof insertCustomVoiceCommandSchema>;
export type CustomVoiceCommand = typeof customVoiceCommands.$inferSelect;
export type InsertVoiceTrainingSession = z.infer<typeof insertVoiceTrainingSessionSchema>;
export type VoiceTrainingSession = typeof voiceTrainingSessions.$inferSelect;
export type InsertVoicePattern = z.infer<typeof insertVoicePatternSchema>;
export type VoicePattern = typeof voicePatterns.$inferSelect;
export type InsertVoiceCommandAnalytics = z.infer<typeof insertVoiceCommandAnalyticsSchema>;
export type VoiceCommandAnalytics = typeof voiceCommandAnalytics.$inferSelect;
export type InsertVoiceLearningSettings = z.infer<typeof insertVoiceLearningSettingsSchema>;
export type VoiceLearningSettings = typeof voiceLearningSettings.$inferSelect;

// Multi-Speaker Identification Schema Types
export const insertVoicePrintSchema = createInsertSchema(voicePrints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSpeakerIdentificationSchema = createInsertSchema(speakerIdentifications).omit({
  id: true,
  createdAt: true,
});

export type InsertVoicePrint = z.infer<typeof insertVoicePrintSchema>;
export type VoicePrint = typeof voicePrints.$inferSelect;
export type InsertSpeakerIdentification = z.infer<typeof insertSpeakerIdentificationSchema>;
export type SpeakerIdentification = typeof speakerIdentifications.$inferSelect;

// Secure Cloud Sync Feature Tables

// User devices for cross-device synchronization
export const userDevices = pgTable("user_devices", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceName: varchar("device_name").notNull(),
  deviceType: varchar("device_type").notNull(), // mobile, desktop, tablet
  deviceFingerprint: varchar("device_fingerprint").notNull().unique(),
  platform: varchar("platform").notNull(), // ios, android, web, windows, mac
  appVersion: varchar("app_version"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  encryptionPublicKey: text("encryption_public_key").notNull(),
  syncEnabled: boolean("sync_enabled").default(true),
  autoSyncEnabled: boolean("auto_sync_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cloud sync data with end-to-end encryption
export const cloudSyncData = pgTable("cloud_sync_data", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dataType: varchar("data_type").notNull(), // incidents, contacts, preferences, recordings, documents
  entityId: varchar("entity_id").notNull(), // ID of the synced entity
  encryptedData: text("encrypted_data").notNull(), // AES-256-GCM encrypted JSON
  encryptionIv: varchar("encryption_iv").notNull(),
  encryptionTag: varchar("encryption_tag").notNull(),
  dataHash: varchar("data_hash").notNull(), // SHA-256 hash for integrity
  version: integer("version").default(1).notNull(),
  isDeleted: boolean("is_deleted").default(false),
  conflictResolution: varchar("conflict_resolution").default("latest"), // latest, manual, merge
  syncStatus: varchar("sync_status").default("pending").notNull(), // pending, synced, conflict, error
  deviceOrigin: varchar("device_origin").notNull().references(() => userDevices.id),
  lastModifiedDeviceId: varchar("last_modified_device_id").references(() => userDevices.id),
  syncPriority: integer("sync_priority").default(1), // 1=low, 5=critical
  retryCount: integer("retry_count").default(0),
  lastSyncAttempt: timestamp("last_sync_attempt"),
  successfulSyncAt: timestamp("successful_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sync conflicts that require user resolution
export const syncConflicts = pgTable("sync_conflicts", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dataType: varchar("data_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  conflictType: varchar("conflict_type").notNull(), // version_mismatch, simultaneous_edit, device_offline
  localVersion: integer("local_version").notNull(),
  remoteVersion: integer("remote_version").notNull(),
  localData: text("local_data").notNull(), // Encrypted local version
  remoteData: text("remote_data").notNull(), // Encrypted remote version
  conflictMetadata: jsonb("conflict_metadata"), // Additional conflict info
  resolution: varchar("resolution"), // user_chose_local, user_chose_remote, user_merged, auto_resolved
  resolvedAt: timestamp("resolved_at"),
  resolvedByDeviceId: varchar("resolved_by_device_id").references(() => userDevices.id),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sync sessions to track synchronization activities
export const syncSessions = pgTable("sync_sessions", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceId: varchar("device_id").notNull().references(() => userDevices.id, { onDelete: "cascade" }),
  sessionType: varchar("session_type").notNull(), // full_sync, incremental_sync, conflict_resolution
  status: varchar("status").notNull(), // started, in_progress, completed, failed, cancelled
  itemsToSync: integer("items_to_sync").default(0),
  itemsSynced: integer("items_synced").default(0),
  itemsFailed: integer("items_failed").default(0),
  conflictsFound: integer("conflicts_found").default(0),
  conflictsResolved: integer("conflicts_resolved").default(0),
  syncDirection: varchar("sync_direction").notNull(), // up, down, bidirectional
  compressionEnabled: boolean("compression_enabled").default(true),
  encryptionMethod: varchar("encryption_method").default("AES-256-GCM").notNull(),
  transferredBytes: integer("transferred_bytes").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration_ms"), // Duration in milliseconds
});

// Sync statistics and analytics
export const syncStatistics = pgTable("sync_statistics", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceId: varchar("device_id").notNull().references(() => userDevices.id, { onDelete: "cascade" }),
  dateRange: varchar("date_range").notNull(), // daily, weekly, monthly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalSyncSessions: integer("total_sync_sessions").default(0),
  successfulSyncs: integer("successful_syncs").default(0),
  failedSyncs: integer("failed_syncs").default(0),
  totalDataTransferred: integer("total_data_transferred").default(0), // in bytes
  averageSyncDuration: integer("average_sync_duration_ms").default(0),
  conflictsGenerated: integer("conflicts_generated").default(0),
  conflictsResolved: integer("conflicts_resolved").default(0),
  bandwidthUsed: integer("bandwidth_used").default(0), // in bytes
  storageUsed: integer("storage_used").default(0), // in bytes
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cloud backup settings per user
export const cloudBackupSettings = pgTable("cloud_backup_settings", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  isEnabled: boolean("is_enabled").default(true),
  autoBackupEnabled: boolean("auto_backup_enabled").default(true),
  backupFrequency: varchar("backup_frequency").default("daily").notNull(), // realtime, hourly, daily, weekly
  retentionDays: integer("retention_days").default(90).notNull(),
  encryptionEnabled: boolean("encryption_enabled").default(true),
  compressionEnabled: boolean("compression_enabled").default(true),
  includePriorityData: boolean("include_priority_data").default(true), // incidents, recordings
  includePersonalData: boolean("include_personal_data").default(true), // contacts, preferences
  includeMediaFiles: boolean("include_media_files").default(false), // large files opt-in
  maxStorageGB: integer("max_storage_gb").default(5),
  wifiOnlySync: boolean("wifi_only_sync").default(false),
  lowPowerModeSync: boolean("low_power_mode_sync").default(true),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  lastBackupAt: timestamp("last_backup_at"),
  nextScheduledBackup: timestamp("next_scheduled_backup"),
  storageUsedBytes: integer("storage_used_bytes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports for cloud sync feature
export const insertUserDeviceSchema = createInsertSchema(userDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCloudSyncDataSchema = createInsertSchema(cloudSyncData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyncConflictSchema = createInsertSchema(syncConflicts).omit({
  id: true,
  createdAt: true,
});

export const insertSyncSessionSchema = createInsertSchema(syncSessions).omit({
  id: true,
  startedAt: true,
});

export const insertSyncStatisticsSchema = createInsertSchema(syncStatistics).omit({
  id: true,
  createdAt: true,
});

export const insertCloudBackupSettingsSchema = createInsertSchema(cloudBackupSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserDevice = z.infer<typeof insertUserDeviceSchema>;
export type UserDevice = typeof userDevices.$inferSelect;
export type InsertCloudSyncData = z.infer<typeof insertCloudSyncDataSchema>;
export type CloudSyncData = typeof cloudSyncData.$inferSelect;
export type InsertSyncConflict = z.infer<typeof insertSyncConflictSchema>;
export type SyncConflict = typeof syncConflicts.$inferSelect;
export type InsertSyncSession = z.infer<typeof insertSyncSessionSchema>;
export type SyncSession = typeof syncSessions.$inferSelect;
export type InsertSyncStatistics = z.infer<typeof insertSyncStatisticsSchema>;
export type SyncStatistics = typeof syncStatistics.$inferSelect;
export type InsertCloudBackupSettings = z.infer<typeof insertCloudBackupSettingsSchema>;
export type CloudBackupSettings = typeof cloudBackupSettings.$inferSelect;



// Note: Additional AI learning tables can be added here as needed for enhanced analytics

// Voice Authentication Schema Types
export const insertVoiceAuthProfileSchema = createInsertSchema(voiceAuthProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoiceAuthAttemptSchema = createInsertSchema(voiceAuthAttempts).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceAuthSettingsSchema = createInsertSchema(voiceAuthSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVoiceAuthProfile = z.infer<typeof insertVoiceAuthProfileSchema>;
export type VoiceAuthProfile = typeof voiceAuthProfiles.$inferSelect;
export type InsertVoiceAuthAttempt = z.infer<typeof insertVoiceAuthAttemptSchema>;
export type VoiceAuthAttempt = typeof voiceAuthAttempts.$inferSelect;
export type InsertVoiceAuthSettings = z.infer<typeof insertVoiceAuthSettingsSchema>;
export type VoiceAuthSettings = typeof voiceAuthSettings.$inferSelect;

// Bluetooth Earpiece Integration Tables

// Bluetooth devices registered by users
export const bluetoothDevices = pgTable("bluetooth_devices", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceName: varchar("device_name").notNull(),
  deviceAddress: varchar("device_address").notNull(), // MAC address
  deviceType: varchar("device_type").notNull(), // earpiece, headphones, speaker, unknown
  capabilities: jsonb("capabilities").notNull(), // audio, microphone, voiceCommands, emergencyButton
  signalStrength: integer("signal_strength").default(0), // 0-100
  batteryLevel: integer("battery_level"), // 0-100, nullable if not supported
  isConnected: boolean("is_connected").default(false),
  trustLevel: varchar("trust_level").default("new").notNull(), // trusted, new, suspicious
  lastConnected: timestamp("last_connected"),
  pairingCode: varchar("pairing_code"), // Temporary pairing code
  isPaired: boolean("is_paired").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bluetooth connection history and analytics
export const bluetoothConnections = pgTable("bluetooth_connections", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceId: varchar("device_id").notNull().references(() => bluetoothDevices.id, { onDelete: "cascade" }),
  connectionType: varchar("connection_type").notNull(), // auto, manual, emergency
  connectionTime: timestamp("connection_time").defaultNow(),
  disconnectionTime: timestamp("disconnection_time"),
  duration: integer("duration_seconds"), // Connection duration in seconds
  audioQuality: varchar("audio_quality"), // excellent, good, fair, poor
  signalQuality: integer("signal_quality"), // 0-100
  dataTransferred: integer("data_transferred_bytes").default(0),
  isActive: boolean("is_active").default(true),
  errorMessages: jsonb("error_messages"), // Any connection errors
  performanceMetrics: jsonb("performance_metrics"), // Latency, bitrate, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Bluetooth settings and preferences per user
export const bluetoothSettings = pgTable("bluetooth_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  autoConnect: boolean("auto_connect").default(true),
  voiceCommandsEnabled: boolean("voice_commands_enabled").default(true),
  emergencyModeEnabled: boolean("emergency_mode_enabled").default(true),
  audioQuality: varchar("audio_quality").default("high").notNull(), // high, medium, low
  microphoneSensitivity: integer("microphone_sensitivity").default(75), // 0-100
  volumeLevel: integer("volume_level").default(65), // 0-100
  emergencyActivationPhrase: varchar("emergency_activation_phrase").default("CAREN emergency protocol"),
  trustedDevicesOnly: boolean("trusted_devices_only").default(false),
  batteryAlerts: boolean("battery_alerts").default(true),
  connectionTimeout: integer("connection_timeout_seconds").default(30),
  autoReconnect: boolean("auto_reconnect").default(true),
  backgroundDiscovery: boolean("background_discovery").default(true),
  audioCodec: varchar("audio_codec").default("AAC"), // SBC, AAC, aptX, LDAC
  maxConnectedDevices: integer("max_connected_devices").default(3),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bluetooth Schema exports
export const insertBluetoothDeviceSchema = createInsertSchema(bluetoothDevices).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertBluetoothConnectionSchema = createInsertSchema(bluetoothConnections).omit({
  id: true,
  createdAt: true,
});

export const insertBluetoothSettingsSchema = createInsertSchema(bluetoothSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBluetoothDevice = z.infer<typeof insertBluetoothDeviceSchema>;
export type BluetoothDevice = typeof bluetoothDevices.$inferSelect;
export type InsertBluetoothConnection = z.infer<typeof insertBluetoothConnectionSchema>;
export type BluetoothConnection = typeof bluetoothConnections.$inferSelect;
export type InsertBluetoothSettings = z.infer<typeof insertBluetoothSettingsSchema>;
export type BluetoothSettings = typeof bluetoothSettings.$inferSelect;

// Live streaming sessions with attorneys
export const livestreamSessions = pgTable("livestream_sessions", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  attorneyId: varchar("attorney_id").notNull().references(() => attorneys.id, { onDelete: "cascade" }),
  incidentId: integer("incident_id").references(() => incidents.id, { onDelete: "set null" }),
  sessionName: varchar("session_name").notNull(),
  status: varchar("status").default("pending").notNull(), // pending, active, ended, failed
  streamKey: varchar("stream_key").notNull(), // Unique stream identifier
  viewerCount: integer("viewer_count").default(0),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  duration: integer("duration_seconds"),
  recordingUrl: varchar("recording_url"), // URL to recorded stream
  emergencyLevel: varchar("emergency_level").default("normal").notNull(), // normal, urgent, critical
  location: jsonb("location"), // GPS coordinates and address
  streamQuality: varchar("stream_quality").default("auto").notNull(), // auto, 720p, 480p, 360p
  audioEnabled: boolean("audio_enabled").default(true),
  videoEnabled: boolean("video_enabled").default(true),
  chatEnabled: boolean("chat_enabled").default(true),
  isRecorded: boolean("is_recorded").default(true),
  metadata: jsonb("metadata"), // Additional stream information
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stream participants and permissions
export const streamParticipants = pgTable("stream_participants", {
  id: varchar("id").primaryKey().notNull(),
  sessionId: varchar("session_id").notNull().references(() => livestreamSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").default("viewer").notNull(), // host, attorney, viewer, moderator
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  duration: integer("duration_seconds"),
  permissions: jsonb("permissions"), // speak, mute, kick, record
  isActive: boolean("is_active").default(true),
  connectionQuality: varchar("connection_quality"), // excellent, good, fair, poor
  deviceInfo: jsonb("device_info"), // Browser, OS, device details
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream chat messages
export const streamMessages = pgTable("stream_messages", {
  id: varchar("id").primaryKey().notNull(),
  sessionId: varchar("session_id").notNull().references(() => livestreamSessions.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  messageType: varchar("message_type").default("chat").notNull(), // chat, system, emergency, legal_note
  isPrivate: boolean("is_private").default(false),
  recipientId: varchar("recipient_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  attachments: jsonb("attachments"), // File attachments or media
  priority: varchar("priority").default("normal").notNull(), // low, normal, high, urgent
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
});

// Stream recording segments and highlights
export const streamRecordings = pgTable("stream_recordings", {
  id: varchar("id").primaryKey().notNull(),
  sessionId: varchar("session_id").notNull().references(() => livestreamSessions.id, { onDelete: "cascade" }),
  segmentNumber: integer("segment_number").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration_seconds"),
  fileUrl: varchar("file_url").notNull(),
  fileSize: integer("file_size_bytes"),
  quality: varchar("quality").notNull(), // 720p, 480p, 360p
  isHighlight: boolean("is_highlight").default(false),
  highlightReason: varchar("highlight_reason"), // emergency_moment, legal_statement, evidence
  transcription: text("transcription"), // AI-generated transcript
  keyEvents: jsonb("key_events"), // Timestamps of important moments
  isAvailable: boolean("is_available").default(true),
  expiresAt: timestamp("expires_at"), // Auto-deletion date
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream analytics and metrics
export const streamAnalytics = pgTable("stream_analytics", {
  id: varchar("id").primaryKey().notNull(),
  sessionId: varchar("session_id").notNull().references(() => livestreamSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("event_type").notNull(), // join, leave, speak, mute, quality_change
  eventData: jsonb("event_data"), // Detailed event information
  timestamp: timestamp("timestamp").defaultNow(),
  connectionQuality: integer("connection_quality"), // 0-100
  bandwidth: integer("bandwidth_kbps"),
  latency: integer("latency_ms"),
  deviceType: varchar("device_type"), // mobile, desktop, tablet
  browserType: varchar("browser_type"),
  location: jsonb("location"), // Approximate location for analytics
});

// Live stream schema exports
export const insertLivestreamSessionSchema = createInsertSchema(livestreamSessions).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertStreamParticipantSchema = createInsertSchema(streamParticipants).omit({
  id: true,
  createdAt: true,
});

export const insertStreamMessageSchema = createInsertSchema(streamMessages).omit({
  id: true,
  timestamp: true,
});

export const insertStreamRecordingSchema = createInsertSchema(streamRecordings).omit({
  id: true,
  createdAt: true,
});

export const insertStreamAnalyticsSchema = createInsertSchema(streamAnalytics).omit({
  id: true,
  timestamp: true,
});

export type InsertLivestreamSession = z.infer<typeof insertLivestreamSessionSchema>;
export type LivestreamSession = typeof livestreamSessions.$inferSelect;
export type InsertStreamParticipant = z.infer<typeof insertStreamParticipantSchema>;
export type StreamParticipant = typeof streamParticipants.$inferSelect;
export type InsertStreamMessage = z.infer<typeof insertStreamMessageSchema>;
export type StreamMessage = typeof streamMessages.$inferSelect;
export type InsertStreamRecording = z.infer<typeof insertStreamRecordingSchema>;
export type StreamRecording = typeof streamRecordings.$inferSelect;
export type InsertStreamAnalytics = z.infer<typeof insertStreamAnalyticsSchema>;
export type StreamAnalytics = typeof streamAnalytics.$inferSelect;

// ========================================
// AUTOMATED EVIDENCE CATALOGING SYSTEM
// ========================================

// Evidence catalog - centralized evidence management
export const evidenceCatalog = pgTable("evidence_catalog", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  incidentId: integer("incident_id").references(() => incidents.id, { onDelete: "cascade" }),
  complaintId: varchar("complaint_id").references(() => officerComplaints.id, { onDelete: "cascade" }),
  
  // File Information
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  mimeType: varchar("mime_type").notNull(),
  fileHash: varchar("file_hash").notNull(), // SHA-256 hash for integrity
  
  // Evidence Classification
  evidenceType: varchar("evidence_type").notNull(), // video, audio, photo, document, witness_statement, livestream_recording
  category: varchar("category").notNull(), // traffic_stop, police_encounter, constitutional_violation, misconduct, administrative
  subCategory: varchar("sub_category"), // specific type like body_cam, dash_cam, witness_video, police_report
  
  // Auto-detected Content Analysis
  contentAnalysis: jsonb("content_analysis"), // AI-generated analysis of content
  detectedObjects: jsonb("detected_objects"), // badges, uniforms, vehicles, weapons, etc.
  detectedText: text("detected_text"), // OCR extracted text
  detectedSpeech: text("detected_speech"), // Speech-to-text transcription
  detectedFaces: jsonb("detected_faces"), // Face detection results
  detectedLegalTerms: jsonb("detected_legal_terms"), // Legal keywords found
  
  // Timestamp and Location Data
  capturedAt: timestamp("captured_at").notNull(),
  location: jsonb("location"), // GPS coordinates, address
  deviceInfo: jsonb("device_info"), // Camera make/model, device details
  cameraSettings: jsonb("camera_settings"), // ISO, exposure, etc.
  
  // Legal and Chain of Custody
  chainOfCustody: jsonb("chain_of_custody"), // Who handled evidence when
  isAuthenticated: boolean("is_authenticated").default(false),
  authenticationMethod: varchar("authentication_method"), // digital_signature, blockchain, hash_verification
  legalRelevance: varchar("legal_relevance").default("unknown"), // high, medium, low, unknown
  admissibilityScore: decimal("admissibility_score", { precision: 5, scale: 4 }), // 0-1 score for court admissibility
  
  // Organization and Tagging
  tags: jsonb("tags"), // User and auto-generated tags
  keywords: jsonb("keywords"), // Searchable keywords
  isStarred: boolean("is_starred").default(false),
  isFlagged: boolean("is_flagged").default(false),
  flagReason: varchar("flag_reason"), // quality_issue, duplicate, irrelevant, sensitive
  
  // Processing Status
  processingStatus: varchar("processing_status").default("pending").notNull(), // pending, processing, completed, failed
  processingProgress: integer("processing_progress").default(0), // 0-100 percentage
  processingError: text("processing_error"),
  lastProcessed: timestamp("last_processed"),
  
  // Access and Sharing
  accessLevel: varchar("access_level").default("private").notNull(), // private, attorney_shared, court_ready, public
  sharedWith: jsonb("shared_with"), // Array of user/attorney IDs
  downloadCount: integer("download_count").default(0),
  viewCount: integer("view_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Evidence analysis jobs for background processing
export const evidenceAnalysisJobs = pgTable("evidence_analysis_jobs", {
  id: varchar("id").primaryKey().notNull(),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceCatalog.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  jobType: varchar("job_type").notNull(), // image_analysis, audio_transcription, video_analysis, text_extraction, legal_analysis
  status: varchar("status").default("queued").notNull(), // queued, running, completed, failed, cancelled
  priority: varchar("priority").default("normal").notNull(), // low, normal, high, urgent
  
  // Job Configuration
  analysisParameters: jsonb("analysis_parameters"), // Configuration for specific analysis type
  expectedDuration: integer("expected_duration_seconds"),
  actualDuration: integer("actual_duration_seconds"),
  
  // Results
  results: jsonb("results"), // Analysis results
  confidence: decimal("confidence", { precision: 5, scale: 4 }), // 0-1 confidence in results
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Progress Tracking
  progressStage: varchar("progress_stage"), // extracting, analyzing, correlating, finalizing
  progressDetails: text("progress_details"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Evidence relationships and correlations
export const evidenceRelationships = pgTable("evidence_relationships", {
  id: varchar("id").primaryKey().notNull(),
  primaryEvidenceId: varchar("primary_evidence_id").notNull().references(() => evidenceCatalog.id, { onDelete: "cascade" }),
  relatedEvidenceId: varchar("related_evidence_id").notNull().references(() => evidenceCatalog.id, { onDelete: "cascade" }),
  
  relationshipType: varchar("relationship_type").notNull(), // duplicate, sequence, corroborating, contradicting, supplementary
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(), // 0-1 confidence in relationship
  automatedDetection: boolean("automated_detection").default(true), // auto-detected vs manually added
  
  // Relationship Details
  similarities: jsonb("similarities"), // What makes them related
  differences: jsonb("differences"), // Key differences
  timeDifference: integer("time_difference_seconds"), // Time gap between evidence
  locationDistance: decimal("location_distance_meters", { precision: 10, scale: 2 }), // Physical distance
  
  // Validation
  isValidated: boolean("is_validated").default(false),
  validatedBy: varchar("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Evidence quality metrics and assessments
export const evidenceQuality = pgTable("evidence_quality", {
  id: varchar("id").primaryKey().notNull(),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceCatalog.id, { onDelete: "cascade" }),
  
  // Technical Quality Metrics
  overallQuality: varchar("overall_quality").notNull(), // excellent, good, fair, poor
  qualityScore: decimal("quality_score", { precision: 5, scale: 4 }).notNull(), // 0-1 score
  
  // Specific Quality Assessments
  visualClarity: decimal("visual_clarity", { precision: 5, scale: 4 }), // for images/video
  audioClarity: decimal("audio_clarity", { precision: 5, scale: 4 }), // for audio/video
  textReadability: decimal("text_readability", { precision: 5, scale: 4 }), // for documents
  completeness: decimal("completeness", { precision: 5, scale: 4 }), // how complete the evidence is
  relevance: decimal("relevance", { precision: 5, scale: 4 }), // legal relevance
  
  // Quality Issues
  qualityIssues: jsonb("quality_issues"), // Array of detected issues
  suggestions: jsonb("suggestions"), // Improvement suggestions
  
  // Metadata Quality
  metadataCompleteness: decimal("metadata_completeness", { precision: 5, scale: 4 }),
  timestampAccuracy: varchar("timestamp_accuracy"), // exact, approximate, unknown
  locationAccuracy: varchar("location_accuracy"), // precise, approximate, unknown
  
  // Assessment Details
  assessmentMethod: varchar("assessment_method").notNull(), // automated, manual, hybrid
  assessedBy: varchar("assessed_by"), // system, user_id, or attorney_id
  assessmentNotes: text("assessment_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart evidence categorization rules
export const evidenceCategorizationRules = pgTable("evidence_categorization_rules", {
  id: varchar("id").primaryKey().notNull(),
  ruleName: varchar("rule_name").notNull(),
  ruleType: varchar("rule_type").notNull(), // file_type, content_analysis, metadata, keyword, ai_classification
  
  // Rule Configuration
  conditions: jsonb("conditions").notNull(), // Rule conditions (e.g., file type, detected objects)
  actions: jsonb("actions").notNull(), // Actions to take (e.g., set category, add tags)
  priority: integer("priority").default(1), // Higher number = higher priority
  
  // Rule Application
  isActive: boolean("is_active").default(true),
  applicableScenarios: jsonb("applicable_scenarios"), // When to apply this rule
  
  // Performance Metrics
  timesApplied: integer("times_applied").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 4 }).default("0.0"),
  lastApplied: timestamp("last_applied"),
  
  // Configuration
  userConfigurable: boolean("user_configurable").default(true),
  systemGenerated: boolean("system_generated").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Evidence access logs for security and compliance
export const evidenceAccessLogs = pgTable("evidence_access_logs", {
  id: varchar("id").primaryKey().notNull(),
  evidenceId: varchar("evidence_id").notNull().references(() => evidenceCatalog.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  accessType: varchar("access_type").notNull(), // view, download, share, edit, delete
  accessMethod: varchar("access_method").notNull(), // web, mobile, api, bulk_export
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info"),
  
  // Access Context
  purpose: varchar("purpose"), // case_preparation, court_filing, attorney_review, evidence_analysis
  sharedWith: varchar("shared_with"), // If evidence was shared, who with
  downloadFormat: varchar("download_format"), // original, compressed, watermarked
  
  // Security
  authorized: boolean("authorized").default(true),
  authorizationLevel: varchar("authorization_level"), // owner, attorney, court_order, public
  accessDuration: integer("access_duration_seconds"),
  
  accessedAt: timestamp("accessed_at").defaultNow(),
});

// Schema exports for evidence cataloging system
export const insertEvidenceCatalogSchema = createInsertSchema(evidenceCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvidenceAnalysisJobSchema = createInsertSchema(evidenceAnalysisJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvidenceRelationshipSchema = createInsertSchema(evidenceRelationships).omit({
  id: true,
  createdAt: true,
});

export const insertEvidenceQualitySchema = createInsertSchema(evidenceQuality).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvidenceCategorizationRuleSchema = createInsertSchema(evidenceCategorizationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvidenceAccessLogSchema = createInsertSchema(evidenceAccessLogs).omit({
  id: true,
  accessedAt: true,
});

// TypeScript types for evidence cataloging system
export type InsertEvidenceCatalog = z.infer<typeof insertEvidenceCatalogSchema>;
export type EvidenceCatalog = typeof evidenceCatalog.$inferSelect;
export type InsertEvidenceAnalysisJob = z.infer<typeof insertEvidenceAnalysisJobSchema>;
export type EvidenceAnalysisJob = typeof evidenceAnalysisJobs.$inferSelect;
export type InsertEvidenceRelationship = z.infer<typeof insertEvidenceRelationshipSchema>;
export type EvidenceRelationship = typeof evidenceRelationships.$inferSelect;
export type InsertEvidenceQuality = z.infer<typeof insertEvidenceQualitySchema>;
export type EvidenceQuality = typeof evidenceQuality.$inferSelect;
export type InsertEvidenceCategorizationRule = z.infer<typeof insertEvidenceCategorizationRuleSchema>;
export type EvidenceCategorizationRule = typeof evidenceCategorizationRules.$inferSelect;
export type InsertEvidenceAccessLog = z.infer<typeof insertEvidenceAccessLogSchema>;
export type EvidenceAccessLog = typeof evidenceAccessLogs.$inferSelect;

// User Learning System Schema Types
export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdaptiveLearningSchema = createInsertSchema(adaptiveLearning).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertAdaptiveLearning = z.infer<typeof insertAdaptiveLearningSchema>;
export type AdaptiveLearning = typeof adaptiveLearning.$inferSelect;

// Community Forum System Tables
export const forumCategories = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  state: varchar("state"), // null for general categories, state code for state-specific
  icon: varchar("icon"),
  isActive: boolean("is_active").default(true),
  postCount: integer("post_count").default(0),
  lastPostAt: timestamp("last_post_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => forumCategories.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  replyCount: integer("reply_count").default(0),
  lastReplyAt: timestamp("last_reply_at"),
  lastReplyUserId: varchar("last_reply_user_id").references(() => users.id),
  tags: jsonb("tags"), // array of tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumReplies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => forumPosts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  parentReplyId: integer("parent_reply_id").references(() => forumReplies.id), // for nested replies
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({
  id: true,
  postCount: true,
  lastPostAt: true,
  createdAt: true,
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  viewCount: true,
  replyCount: true,
  lastReplyAt: true,
  lastReplyUserId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type ForumReply = typeof forumReplies.$inferSelect;

// Legal destinations table for emergency routing
export const legalDestinations = pgTable("legal_destinations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // police_station, courthouse, attorney_office, legal_aid
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  phone: varchar("phone"),
  website: varchar("website"),
  hours: jsonb("hours"), // operating hours
  emergencyOnly: boolean("emergency_only").default(false),
  verified: boolean("verified").default(false),
  lastVerified: timestamp("last_verified"),
  specialties: jsonb("specialties"), // for attorney offices: criminal, civil, etc.
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  additionalInfo: text("additional_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legal routes table for saving user routes
export const legalRoutes = pgTable("legal_routes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  originLat: decimal("origin_lat", { precision: 10, scale: 8 }).notNull(),
  originLng: decimal("origin_lng", { precision: 11, scale: 8 }).notNull(),
  originAddress: text("origin_address"),
  destinationId: integer("destination_id").references(() => legalDestinations.id),
  destinationType: varchar("destination_type").notNull(),
  routeData: jsonb("route_data"), // full route information from routing API
  distance: decimal("distance", { precision: 10, scale: 2 }), // in miles
  duration: integer("duration"), // in minutes
  status: varchar("status").default("active").notNull(), // active, completed, cancelled
  priority: varchar("priority").default("normal").notNull(), // normal, urgent, emergency
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLegalDestinationSchema = createInsertSchema(legalDestinations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLegalRouteSchema = createInsertSchema(legalRoutes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLegalDestination = z.infer<typeof insertLegalDestinationSchema>;
export type LegalDestination = typeof legalDestinations.$inferSelect;
export type InsertLegalRoute = z.infer<typeof insertLegalRouteSchema>;
export type LegalRoute = typeof legalRoutes.$inferSelect;

// User Journey Progress Sparkle Tracker System Tables

// Journey milestones and achievements
export const journeyMilestones = pgTable("journey_milestones", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // "first_login", "emergency_setup_complete", "first_recording", "attorney_contacted", etc.
  title: varchar("title").notNull(), // User-friendly display title
  description: text("description"),
  category: varchar("category").notNull(), // "onboarding", "emergency", "legal", "engagement", "advanced"
  points: integer("points").default(10), // Points awarded for completing milestone
  icon: varchar("icon"), // Icon name
  sparkleType: varchar("sparkle_type"), // "gold", "silver", "bronze", "rainbow", "emergency"
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order"), // Display order within category
  requirements: jsonb("requirements"), // Array of milestone IDs required before this one
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress tracking
export const userJourneyProgress = pgTable("user_journey_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  milestoneId: integer("milestone_id").notNull().references(() => journeyMilestones.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").defaultNow(),
  progressData: jsonb("progress_data"), // Additional data about how milestone was completed
  sparkleShown: boolean("sparkle_shown").default(false), // Whether sparkle animation was displayed
  sparkleShownAt: timestamp("sparkle_shown_at"),
  pointsAwarded: integer("points_awarded").notNull(),
  completionMethod: varchar("completion_method"), // "manual", "automatic", "trigger"
  relatedEntityId: varchar("related_entity_id"), // ID of related incident, conversation, etc.
  relatedEntityType: varchar("related_entity_type"), // "incident", "conversation", "recording", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// User journey stats and level progression
export const userJourneyStats = pgTable("user_journey_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  totalPoints: integer("total_points").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1),
  pointsToNextLevel: integer("points_to_next_level").notNull().default(100),
  milestonesCompleted: integer("milestones_completed").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0), // Days with activity
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  preferredSparkleType: varchar("preferred_sparkle_type").default("gold"), // User's favorite sparkle animation
  showSparkles: boolean("show_sparkles").default(true), // User preference for sparkle animations
  journeyStartDate: timestamp("journey_start_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sparkle animation queue for real-time displays
export const sparkleQueue = pgTable("sparkle_queue", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  milestoneId: integer("milestone_id").notNull().references(() => journeyMilestones.id, { onDelete: "cascade" }),
  sparkleType: varchar("sparkle_type").notNull(), // "gold", "silver", "bronze", "rainbow", "emergency"
  priority: integer("priority").notNull().default(1), // Higher numbers shown first
  isShown: boolean("is_shown").default(false),
  shownAt: timestamp("shown_at"),
  expiresAt: timestamp("expires_at"), // Auto-remove old sparkles
  triggerLocation: varchar("trigger_location"), // Page/component where sparkle should appear
  animationData: jsonb("animation_data"), // Custom animation parameters
  createdAt: timestamp("created_at").defaultNow(),
});

// Journey achievement badges
export const journeyBadges = pgTable("journey_badges", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // "emergency_hero", "legal_scholar", "community_helper", etc.
  title: varchar("title").notNull(), // User-friendly display title
  description: text("description").notNull(),
  badgeType: varchar("badge_type").notNull(), // "achievement", "milestone", "special", "time_based"
  rarity: varchar("rarity").notNull(), // "common", "uncommon", "rare", "epic", "legendary"
  iconName: varchar("icon_name").notNull(), // Lucide icon name
  iconColor: varchar("icon_color").notNull(), // Tailwind color class
  backgroundColor: varchar("background_color").notNull(), // Badge background color
  requirements: jsonb("requirements").notNull(), // Conditions to earn badge
  pointsRequired: integer("points_required").default(0),
  milestonesRequired: jsonb("milestones_required"), // Array of milestone IDs
  isHidden: boolean("is_hidden").default(false), // Hidden until earned
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User earned badges
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: integer("badge_id").notNull().references(() => journeyBadges.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow(),
  progressData: jsonb("progress_data"), // How the badge was earned
  isShown: boolean("is_shown").default(false), // Whether badge notification was displayed
  shownAt: timestamp("shown_at"),
  isDisplayed: boolean("is_displayed").default(true), // User can hide badges from profile
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily streak tracking
export const dailyStreaks = pgTable("daily_streaks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(), // Date of activity (YYYY-MM-DD format)
  activityCount: integer("activity_count").notNull().default(0), // Number of meaningful actions
  milestonesEarned: integer("milestones_earned").notNull().default(0),
  pointsEarned: integer("points_earned").notNull().default(0),
  mainActivity: varchar("main_activity"), // Primary activity type for the day
  isStreakDay: boolean("is_streak_day").default(true), // Counts toward streak
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas for User Journey Progress system
export const insertJourneyMilestoneSchema = createInsertSchema(journeyMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserJourneyProgressSchema = createInsertSchema(userJourneyProgress).omit({
  id: true,
  createdAt: true,
});

export const insertUserJourneyStatsSchema = createInsertSchema(userJourneyStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSparkleQueueSchema = createInsertSchema(sparkleQueue).omit({
  id: true,
  createdAt: true,
});

export const insertJourneyBadgeSchema = createInsertSchema(journeyBadges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  createdAt: true,
});

export const insertDailyStreakSchema = createInsertSchema(dailyStreaks).omit({
  id: true,
  createdAt: true,
});

// Export types for User Journey Progress system
export type InsertJourneyMilestone = z.infer<typeof insertJourneyMilestoneSchema>;
export type JourneyMilestone = typeof journeyMilestones.$inferSelect;
export type InsertUserJourneyProgress = z.infer<typeof insertUserJourneyProgressSchema>;
export type UserJourneyProgress = typeof userJourneyProgress.$inferSelect;
export type InsertUserJourneyStats = z.infer<typeof insertUserJourneyStatsSchema>;
export type UserJourneyStats = typeof userJourneyStats.$inferSelect;
export type InsertSparkleQueue = z.infer<typeof insertSparkleQueueSchema>;
export type SparkleQueue = typeof sparkleQueue.$inferSelect;
export type InsertJourneyBadge = z.infer<typeof insertJourneyBadgeSchema>;
export type JourneyBadge = typeof journeyBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertDailyStreak = z.infer<typeof insertDailyStreakSchema>;
export type DailyStreak = typeof dailyStreaks.$inferSelect;

// ===== WAITLIST =====
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  name: varchar("name"),
  phone: varchar("phone"),
  interestedTier: varchar("interested_tier").default("basic_guard"),
  referralSource: varchar("referral_source"),
  referralCode: varchar("referral_code"),
  referredBy: varchar("referred_by"),
  referralCount: integer("referral_count").default(0).notNull(),
  status: varchar("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, createdAt: true });
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;

// ===== FEEDBACK BOARD =====
export const feedbackPosts = pgTable("feedback_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: varchar("author_name"),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").default("feature_request").notNull(),
  status: varchar("status").default("open").notNull(),
  votes: integer("votes").default(0).notNull(),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedbackVotes = pgTable("feedback_votes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => feedbackPosts.id, { onDelete: "cascade" }),
  visitorId: varchar("visitor_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeedbackPostSchema = createInsertSchema(feedbackPosts).omit({ id: true, votes: true, createdAt: true, updatedAt: true });
export type InsertFeedbackPost = z.infer<typeof insertFeedbackPostSchema>;
export type FeedbackPost = typeof feedbackPosts.$inferSelect;
export type FeedbackVote = typeof feedbackVotes.$inferSelect;

// ===== USER FEATURE PREFERENCES (Tiered Feature Picker) =====
export const userFeaturePreferences = pgTable("user_feature_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  enabledFeatures: jsonb("enabled_features").notNull(),
  dashboardLayout: jsonb("dashboard_layout"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserFeaturePreferencesSchema = createInsertSchema(userFeaturePreferences).omit({ id: true, updatedAt: true });
export type InsertUserFeaturePreferences = z.infer<typeof insertUserFeaturePreferencesSchema>;
export type UserFeaturePreferences = typeof userFeaturePreferences.$inferSelect;

// ===== EMAIL DRIP CAMPAIGNS =====
export const emailDripCampaigns = pgTable("email_drip_campaigns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  campaignType: varchar("campaign_type").default("onboarding").notNull(),
  currentStep: integer("current_step").default(0).notNull(),
  totalSteps: integer("total_steps").default(5).notNull(),
  lastSentAt: timestamp("last_sent_at"),
  nextSendAt: timestamp("next_send_at"),
  status: varchar("status").default("active").notNull(),
  openedEmails: jsonb("opened_emails"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailDripCampaignSchema = createInsertSchema(emailDripCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmailDripCampaign = z.infer<typeof insertEmailDripCampaignSchema>;
export type EmailDripCampaign = typeof emailDripCampaigns.$inferSelect;

// ===== APP ANALYTICS =====
export const appAnalytics = pgTable("app_analytics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  eventType: varchar("event_type").notNull(),
  eventName: varchar("event_name").notNull(),
  metadata: jsonb("metadata"),
  sessionId: varchar("session_id"),
  deviceInfo: jsonb("device_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppAnalyticsSchema = createInsertSchema(appAnalytics).omit({ id: true, createdAt: true });
export type InsertAppAnalytics = z.infer<typeof insertAppAnalyticsSchema>;

// ===== LEADS (Marketing Lead Capture) =====
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 100 }).default("landing_page"),
  status: varchar("status", { length: 50 }).default("new"),
  notes: text("notes"),
  dripStep: integer("drip_step").default(0).notNull(),
  lastDripAt: timestamp("last_drip_at"),
  createdAt: timestamp("created_at").defaultNow(),
  convertedAt: timestamp("converted_at"),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, convertedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// ===== AGENT CONTENT (AI-Generated Social Media Content) =====
export const agentContent = pgTable("agent_content", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 50 }).notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  hashtags: text("hashtags"),
  status: varchar("status", { length: 50 }).default("ready"),
  generatedAt: timestamp("generated_at").defaultNow(),
  postedAt: timestamp("posted_at"),
});

export const insertAgentContentSchema = createInsertSchema(agentContent).omit({ id: true, generatedAt: true, postedAt: true });
export type InsertAgentContent = z.infer<typeof insertAgentContentSchema>;
export type AgentContent = typeof agentContent.$inferSelect;
export type AppAnalytics = typeof appAnalytics.$inferSelect;

// ===== REFERRALS =====
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id", { length: 255 }).notNull(),
  referralCode: varchar("referral_code", { length: 20 }).notNull().unique(),
  referredEmail: varchar("referred_email", { length: 255 }),
  referredUserId: varchar("referred_user_id", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  rewardGranted: boolean("reward_granted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  convertedAt: timestamp("converted_at"),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true, convertedAt: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

// ===== PUSH SUBSCRIPTIONS =====
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// ===== AGENT JOB SYSTEM =====
export const agentJobs = pgTable("agent_jobs", {
  id: serial("id").primaryKey(),
  businessUnit: varchar("business_unit", { length: 100 }).default("CAREN"),
  jobType: varchar("job_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("queued"),
  triggeredBy: varchar("triggered_by", { length: 255 }),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertAgentJobSchema = createInsertSchema(agentJobs).omit({ id: true, createdAt: true });
export type InsertAgentJob = z.infer<typeof insertAgentJobSchema>;
export type AgentJob = typeof agentJobs.$inferSelect;

export const agentProposals = pgTable("agent_proposals", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => agentJobs.id),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  reason: text("reason"),
  priorityScore: integer("priority_score").default(50),
  requiresApproval: boolean("requires_approval").default(true),
  status: varchar("status", { length: 50 }).default("pending"),
  expectedImpact: text("expected_impact"),
  agentsRequired: text("agents_required").array(),
  assetsNeeded: text("assets_needed").array(),
  executionPlan: jsonb("execution_plan"),
  proposalType: varchar("proposal_type", { length: 50 }).default("action"),
  opportunityDetails: jsonb("opportunity_details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentProposalSchema = createInsertSchema(agentProposals).omit({ id: true, createdAt: true });
export type InsertAgentProposal = z.infer<typeof insertAgentProposalSchema>;
export type AgentProposal = typeof agentProposals.$inferSelect;

export const agentApprovals = pgTable("agent_approvals", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => agentProposals.id),
  decision: varchar("decision", { length: 50 }).notNull(),
  notes: text("notes"),
  approvedBy: varchar("approved_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentApprovalSchema = createInsertSchema(agentApprovals).omit({ id: true, createdAt: true });
export type InsertAgentApproval = z.infer<typeof insertAgentApprovalSchema>;
export type AgentApproval = typeof agentApprovals.$inferSelect;

export const agentRuns = pgTable("agent_runs", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => agentProposals.id),
  status: varchar("status", { length: 50 }).default("running"),
  resultSummary: text("result_summary"),
  outputData: jsonb("output_data"),
  actionLog: jsonb("action_log"),
  qualityScore: integer("quality_score"),
  qualityReview: jsonb("quality_review"),
  resultsReview: jsonb("results_review"),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAgentRunSchema = createInsertSchema(agentRuns).omit({ id: true, startedAt: true });
export type InsertAgentRun = z.infer<typeof insertAgentRunSchema>;
export type AgentRun = typeof agentRuns.$inferSelect;

export const agentMemory = pgTable("agent_memory", {
  id: serial("id").primaryKey(),
  businessUnit: varchar("business_unit", { length: 100 }).default("CAREN"),
  memoryType: varchar("memory_type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  outcome: varchar("outcome", { length: 100 }),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentMemorySchema = createInsertSchema(agentMemory).omit({ id: true, createdAt: true });
export type InsertAgentMemory = z.infer<typeof insertAgentMemorySchema>;
export type AgentMemory = typeof agentMemory.$inferSelect;

// ============================================================
// C.A.R.E.N. EARLY ACCESS LAB
// ============================================================

export const earlyAccessTesters = pgTable("early_access_testers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  deviceType: varchar("device_type", { length: 50 }), // ios, android, both
  whyJoin: text("why_join"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected, active, completed
  accessCode: varchar("access_code", { length: 32 }).unique(),
  invitedByAdmin: boolean("invited_by_admin").default(false),
  score: integer("score").default(0),
  missionsCompleted: integer("missions_completed").default(0),
  bugsReported: integer("bugs_reported").default(0),
  lastActiveAt: timestamp("last_active_at"),
  onboardedAt: timestamp("onboarded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEarlyAccessTesterSchema = createInsertSchema(earlyAccessTesters).omit({ id: true, createdAt: true, accessCode: true, score: true, missionsCompleted: true, bugsReported: true });
export type InsertEarlyAccessTester = z.infer<typeof insertEarlyAccessTesterSchema>;
export type EarlyAccessTester = typeof earlyAccessTesters.$inferSelect;

export const testerMissions = pgTable("tester_missions", {
  id: serial("id").primaryKey(),
  dayNumber: integer("day_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  pointValue: integer("point_value").default(10),
  instructions: text("instructions"),
  isActive: boolean("is_active").default(true),
});

export const insertTesterMissionSchema = createInsertSchema(testerMissions).omit({ id: true });
export type InsertTesterMission = z.infer<typeof insertTesterMissionSchema>;
export type TesterMission = typeof testerMissions.$inferSelect;

export const testerCompletions = pgTable("tester_completions", {
  id: serial("id").primaryKey(),
  testerId: integer("tester_id").notNull(),
  missionId: integer("mission_id").notNull(),
  status: varchar("status", { length: 50 }).default("completed"), // completed, skipped
  feedback: text("feedback"),
  rating: integer("rating"), // 1-5
  bugDescription: text("bug_description"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertTesterCompletionSchema = createInsertSchema(testerCompletions).omit({ id: true, completedAt: true });
export type InsertTesterCompletion = z.infer<typeof insertTesterCompletionSchema>;
export type TesterCompletion = typeof testerCompletions.$inferSelect;

export const testerBugReports = pgTable("tester_bug_reports", {
  id: serial("id").primaryKey(),
  testerId: integer("tester_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 50 }).default("medium"), // low, medium, high, critical
  category: varchar("category", { length: 100 }),
  deviceInfo: text("device_info"),
  status: varchar("status", { length: 50 }).default("open"), // open, investigating, fixed, wontfix
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTesterBugReportSchema = createInsertSchema(testerBugReports).omit({ id: true, createdAt: true });
export type InsertTesterBugReport = z.infer<typeof insertTesterBugReportSchema>;
export type TesterBugReport = typeof testerBugReports.$inferSelect;

// ─── Support Tickets ──────────────────────────────────────────────────────────
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  userEmail: varchar("user_email"),
  userName: varchar("user_name"),
  issueCategory: varchar("issue_category"), // general_question | feature_guidance | troubleshooting | account_issue | billing_issue | complaint | urgent_safety | legal_sensitive | technical_failure | escalation_request
  severityLevel: integer("severity_level").default(1), // 1=minor 2=repeated 3=serious 4=urgent
  conversationSummary: text("conversation_summary"),
  resolution: text("resolution"),
  status: varchar("status").default("open"), // open | in_progress | escalated | resolved | closed
  escalated: boolean("escalated").default(false),
  escalationReason: text("escalation_reason"),
  emailSent: boolean("email_sent").default(false),
  qualityScore: integer("quality_score"),
  recurringIssue: boolean("recurring_issue").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

// ── Refund Requests ───────────────────────────────────────────────────────────
export const refundRequests = pgTable("refund_requests", {
  id: serial("id").primaryKey(),
  refundId: varchar("refund_id").unique().notNull(),
  ticketId: varchar("ticket_id"),
  userId: varchar("user_id").references(() => users.id),
  userEmail: varchar("user_email"),
  userName: varchar("user_name"),
  transactionId: varchar("transaction_id"),
  productPurchased: varchar("product_purchased"),
  transactionDate: timestamp("transaction_date"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
  usageStatus: varchar("usage_status"), // used | unused | partially_used
  refundReason: varchar("refund_reason"), // accidental_charge | duplicate_charge | subscription_confusion | service_dissatisfaction | technical_failure | billing_error | fraud_concern
  previousRefundsCount: integer("previous_refunds_count").default(0),
  accountFlags: text("account_flags"),
  // Policy Engine Decision
  decision: varchar("decision").default("pending"), // approved | denied | partial | escalated | pending
  decisionReason: text("decision_reason"),
  confidenceLevel: varchar("confidence_level"), // high | medium | low
  policyRulesApplied: text("policy_rules_applied"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  escalationRequired: boolean("escalation_required").default(false),
  // Execution Logging
  actionLog: text("action_log"),
  qualityScore: integer("quality_score"),
  executionStartTime: timestamp("execution_start_time"),
  executionEndTime: timestamp("execution_end_time"),
  // Admin
  adminNotes: text("admin_notes"),
  status: varchar("status").default("pending"), // pending | reviewed | processed | closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type RefundRequest = typeof refundRequests.$inferSelect;

// ── Payment Intelligence Reports ─────────────────────────────────────────────
export const paymentIntelligenceReports = pgTable("payment_intelligence_reports", {
  id: serial("id").primaryKey(),
  reportId: varchar("report_id").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  userEmail: varchar("user_email"),
  userName: varchar("user_name"),
  planType: varchar("plan_type"),
  riskLevel: varchar("risk_level"), // low | medium | high
  churnProbability: varchar("churn_probability"), // low | medium | high | critical
  keyIssueDetected: text("key_issue_detected"),
  recommendedAction: text("recommended_action"),
  expectedImpact: text("expected_impact"),
  urgencyLevel: varchar("urgency_level"), // low | medium | high | critical
  churnSignals: jsonb("churn_signals"),
  upsellSignals: jsonb("upsell_signals"),
  retentionActions: jsonb("retention_actions"),
  paymentHealthSummary: text("payment_health_summary"),
  refundRiskFlag: boolean("refund_risk_flag").default(false),
  fraudFlag: boolean("fraud_flag").default(false),
  qualityScore: integer("quality_score"),
  status: varchar("status").default("active"), // active | reviewed | actioned | dismissed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentIntelligenceReportSchema = createInsertSchema(paymentIntelligenceReports).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPaymentIntelligenceReport = z.infer<typeof insertPaymentIntelligenceReportSchema>;
export type PaymentIntelligenceReport = typeof paymentIntelligenceReports.$inferSelect;

// ── Announcements & Giveaways ─────────────────────────────────────────────────
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("announcement"), // announcement | giveaway
  imageUrl: varchar("image_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  isPinned: boolean("is_pinned").default(false),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

export const giveawayEntries = pgTable("giveaway_entries", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").references(() => announcements.id),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGiveawayEntrySchema = createInsertSchema(giveawayEntries).omit({ id: true, createdAt: true });
export type InsertGiveawayEntry = z.infer<typeof insertGiveawayEntrySchema>;
export type GiveawayEntry = typeof giveawayEntries.$inferSelect;

// ── Regional Director Program ──────────────────────────────────────────────────
export const regionalDirectors = pgTable("regional_directors", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  background: text("background"),
  socialLinks: text("social_links"),
  status: varchar("status", { length: 50 }).default("pending"), // pending | approved | rejected | paused
  level: varchar("level", { length: 50 }).default("regional_director"), // regional_director | senior_director | state_director | national_director
  territory: varchar("territory", { length: 255 }),
  adminNotes: text("admin_notes"),
  directorCode: varchar("director_code", { length: 20 }).unique(), // unique code for referral link e.g. "DIR-AB12CD"
  portalPin: varchar("portal_pin", { length: 10 }), // 6-digit PIN for Director Portal login
  contractSignature: varchar("contract_signature", { length: 255 }), // typed full legal name when signing
  contractSignedAt: timestamp("contract_signed_at"), // timestamp when contract was signed
  contractVersion: varchar("contract_version", { length: 20 }).default("v1.0-2025"), // contract version agreed to
  contractIp: varchar("contract_ip", { length: 100 }), // IP address at time of signing
  contractDocumentUrl: text("contract_document_url"), // link to uploaded/external contract document
  contractMethod: varchar("contract_method", { length: 50 }).default("electronic"), // electronic | paper | docusign | external
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRegionalDirectorSchema = createInsertSchema(regionalDirectors).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRegionalDirector = z.infer<typeof insertRegionalDirectorSchema>;
export type RegionalDirector = typeof regionalDirectors.$inferSelect;

export const directorActivities = pgTable("director_activities", {
  id: serial("id").primaryKey(),
  directorId: integer("director_id").notNull().references(() => regionalDirectors.id),
  type: varchar("type", { length: 50 }).notNull(), // attorney_contacted | attorney_onboarded | user_added | partnership_created | content_posted
  count: integer("count").default(1),
  notes: text("notes"),
  weekOf: varchar("week_of", { length: 20 }), // ISO date string "YYYY-MM-DD" of the week start (Monday)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDirectorActivitySchema = createInsertSchema(directorActivities).omit({ id: true, createdAt: true });
export type InsertDirectorActivity = z.infer<typeof insertDirectorActivitySchema>;
export type DirectorActivity = typeof directorActivities.$inferSelect;

export const directorCommissions = pgTable("director_commissions", {
  id: serial("id").primaryKey(),
  directorId: integer("director_id").notNull().references(() => regionalDirectors.id),
  referralCode: varchar("referral_code", { length: 20 }),
  referredUserId: varchar("referred_user_id").references(() => users.id),
  referredEmail: varchar("referred_email", { length: 255 }),
  planName: varchar("plan_name", { length: 100 }), // e.g. "Standard", "Legal Shield"
  planAmount: decimal("plan_amount", { precision: 10, scale: 2 }), // subscription price
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).default("0.20"), // 20%
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }), // earned
  status: varchar("status", { length: 50 }).default("pending"), // pending | paid | cancelled
  periodStart: varchar("period_start", { length: 20 }), // YYYY-MM
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDirectorCommissionSchema = createInsertSchema(directorCommissions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDirectorCommission = z.infer<typeof insertDirectorCommissionSchema>;
export type DirectorCommission = typeof directorCommissions.$inferSelect;

export const directorOutreach = pgTable("director_outreach", {
  id: serial("id").primaryKey(),
  prospectName: varchar("prospect_name", { length: 255 }).notNull(),
  prospectEmail: varchar("prospect_email", { length: 255 }).notNull(),
  prospectCity: varchar("prospect_city", { length: 100 }),
  prospectState: varchar("prospect_state", { length: 100 }),
  templateUsed: varchar("template_used", { length: 100 }),
  status: varchar("status", { length: 50 }).default("sent"), // sent | failed | replied
  sentAt: timestamp("sent_at").defaultNow(),
  notes: text("notes"),
});

export const insertDirectorOutreachSchema = createInsertSchema(directorOutreach).omit({ id: true, sentAt: true });
export type InsertDirectorOutreach = z.infer<typeof insertDirectorOutreachSchema>;
export type DirectorOutreach = typeof directorOutreach.$inferSelect;

export const directorPayoutRequests = pgTable("director_payout_requests", {
  id: serial("id").primaryKey(),
  directorId: integer("director_id").notNull().references(() => regionalDirectors.id),
  amountRequested: decimal("amount_requested", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 100 }), // e.g. "Venmo", "Zelle", "CashApp", "Check"
  paymentHandle: varchar("payment_handle", { length: 255 }), // e.g. "@username" or email
  status: varchar("status", { length: 50 }).default("pending"), // pending | paid | rejected
  adminNotes: text("admin_notes"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertDirectorPayoutRequestSchema = createInsertSchema(directorPayoutRequests).omit({ id: true, requestedAt: true, processedAt: true });
export type InsertDirectorPayoutRequest = z.infer<typeof insertDirectorPayoutRequestSchema>;
export type DirectorPayoutRequest = typeof directorPayoutRequests.$inferSelect;

// ── Social Media Campaign Posts ────────────────────────────────────────────
export const socialMediaPosts = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  platform: varchar("platform").notNull(), // youtube | linkedin | instagram | tiktok | twitter | facebook
  videoFile: varchar("video_file").notNull(), // filename from /public/
  title: varchar("title"),
  caption: text("caption"),
  hashtags: text("hashtags"),
  status: varchar("status").default("draft"), // draft | scheduled | posted | failed
  scheduledAt: timestamp("scheduled_at"),
  postedAt: timestamp("posted_at"),
  postUrl: varchar("post_url"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({ id: true, createdAt: true, postedAt: true });
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
