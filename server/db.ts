import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pgPkg from "pg";

const { Pool } = pgPkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const isNeon = process.env.DATABASE_URL.includes("neon.tech");

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;
let rawPool: InstanceType<typeof Pool> | null = null;

if (isNeon) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql);
  console.log("[DB] Connected using Neon serverless driver");
} else {
  rawPool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(rawPool);
  console.log("[DB] Connected using standard PostgreSQL driver");
}

/**
 * Full schema creation + column migrations.
 * Creates all tables if they don't exist, then adds any missing columns.
 * Safe to run on every startup — all statements use IF NOT EXISTS / DO NOTHING.
 */
export async function runAutoMigrations(): Promise<void> {
  // Tables in dependency order (no FKs enforced here — app handles integrity)
  const createTables = [
    // 1. Sessions (no deps)
    `CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMP NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)`,

    // 2. Users (no deps)
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY NOT NULL,
      email VARCHAR UNIQUE,
      first_name VARCHAR,
      last_name VARCHAR,
      password VARCHAR,
      google_id VARCHAR,
      apple_id VARCHAR,
      profile_image_url VARCHAR,
      role VARCHAR NOT NULL DEFAULT 'user',
      subscription_tier VARCHAR NOT NULL DEFAULT 'basic_guard',
      current_state VARCHAR,
      preferred_language VARCHAR DEFAULT 'en',
      emergency_contacts JSONB,
      agreed_to_terms BOOLEAN DEFAULT FALSE,
      terms_agreed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 3. Login activity
    `CREATE TABLE IF NOT EXISTS login_activity (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR,
      email VARCHAR,
      login_method VARCHAR NOT NULL,
      user_agent TEXT,
      ip_address VARCHAR,
      subscription_tier VARCHAR,
      success BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 4. Facial recognition
    `CREATE TABLE IF NOT EXISTS facial_recognition (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      face_encoding TEXT NOT NULL,
      confidence DECIMAL(5,4),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 5. Incidents
    `CREATE TABLE IF NOT EXISTS incidents (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      description TEXT,
      location JSONB,
      status VARCHAR NOT NULL DEFAULT 'active',
      priority VARCHAR NOT NULL DEFAULT 'normal',
      media_urls JSONB,
      cloud_backup BOOLEAN DEFAULT FALSE,
      contacts_notified BOOLEAN DEFAULT FALSE,
      report_generated BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 6. Legal rights
    `CREATE TABLE IF NOT EXISTS legal_rights (
      id SERIAL PRIMARY KEY,
      state VARCHAR NOT NULL,
      category VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      description TEXT NOT NULL,
      details TEXT,
      last_updated TIMESTAMP DEFAULT NOW()
    )`,

    // 7. Attorneys
    `CREATE TABLE IF NOT EXISTS attorneys (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR,
      first_name VARCHAR NOT NULL,
      last_name VARCHAR NOT NULL,
      email VARCHAR NOT NULL UNIQUE,
      phone VARCHAR,
      firm_name VARCHAR NOT NULL,
      firm_address TEXT,
      firm_website VARCHAR,
      bar_number VARCHAR NOT NULL,
      bar_state VARCHAR NOT NULL,
      specialties JSONB NOT NULL DEFAULT '[]',
      states_licensed JSONB NOT NULL DEFAULT '[]',
      years_experience INTEGER,
      education JSONB,
      rating DECIMAL(3,2) DEFAULT 0.00,
      review_count INTEGER DEFAULT 0,
      hourly_rate DECIMAL(10,2),
      emergency_available BOOLEAN DEFAULT FALSE,
      languages JSONB DEFAULT '["English"]',
      verified BOOLEAN DEFAULT FALSE,
      verified_at TIMESTAMP,
      verification_documents JSONB,
      contact_info JSONB,
      bio TEXT,
      profile_image VARCHAR,
      availability JSONB,
      active_status BOOLEAN DEFAULT TRUE,
      last_active TIMESTAMP DEFAULT NOW(),
      counties_served JSONB DEFAULT '[]',
      availability_status VARCHAR DEFAULT 'offline',
      profile_score INTEGER DEFAULT 0,
      avg_response_minutes INTEGER DEFAULT 60,
      consultation_type VARCHAR DEFAULT 'paid',
      profile_status VARCHAR DEFAULT 'pending',
      malpractice_insurance BOOLEAN DEFAULT FALSE,
      agreement_signed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 8. Attorney connections
    `CREATE TABLE IF NOT EXISTS attorney_connections (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      attorney_id INTEGER NOT NULL,
      incident_id INTEGER,
      status VARCHAR NOT NULL DEFAULT 'pending',
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 9. AAA members
    `CREATE TABLE IF NOT EXISTS aaa_members (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      membership_number VARCHAR NOT NULL,
      membership_type VARCHAR NOT NULL,
      member_name VARCHAR NOT NULL,
      phone_number VARCHAR NOT NULL,
      expiration_date TIMESTAMP,
      emergency_contact VARCHAR,
      vehicle_info JSONB,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 10. User actions (analytics)
    `CREATE TABLE IF NOT EXISTS user_actions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR,
      session_id VARCHAR,
      action VARCHAR NOT NULL,
      feature VARCHAR NOT NULL,
      details JSONB,
      duration INTEGER,
      location JSONB,
      device_info JSONB,
      timestamp TIMESTAMP DEFAULT NOW()
    )`,

    // 11. Learning progress
    `CREATE TABLE IF NOT EXISTS learning_progress (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      category VARCHAR NOT NULL,
      skill_area VARCHAR NOT NULL,
      level INTEGER DEFAULT 1,
      previous_level INTEGER DEFAULT 1,
      improvement_score DECIMAL(5,2),
      practice_count INTEGER DEFAULT 0,
      success_rate DECIMAL(5,2) DEFAULT 0.00,
      time_spent INTEGER DEFAULT 0,
      last_activity TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 12. Content engagement
    `CREATE TABLE IF NOT EXISTS content_engagement (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR,
      content_type VARCHAR NOT NULL,
      content_id VARCHAR NOT NULL,
      content_title VARCHAR,
      engagement_type VARCHAR NOT NULL,
      time_spent INTEGER DEFAULT 0,
      scroll_depth DECIMAL(5,2),
      interaction_count INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      rating INTEGER,
      feedback TEXT,
      timestamp TIMESTAMP DEFAULT NOW()
    )`,

    // 13. Knowledge assessments
    `CREATE TABLE IF NOT EXISTS knowledge_assessments (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      category VARCHAR NOT NULL,
      questions JSONB NOT NULL,
      answers JSONB NOT NULL,
      correct_answers JSONB NOT NULL,
      score DECIMAL(5,2) NOT NULL,
      time_spent INTEGER NOT NULL,
      improvement_from_previous DECIMAL(5,2),
      areas_for_improvement JSONB,
      timestamp TIMESTAMP DEFAULT NOW()
    )`,

    // 14. Emergency response metrics
    `CREATE TABLE IF NOT EXISTS emergency_response_metrics (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      response_type VARCHAR NOT NULL,
      response_time INTEGER NOT NULL,
      accuracy_score DECIMAL(5,2),
      steps_completed INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      improvement_from_previous DECIMAL(5,2),
      scenario_type VARCHAR,
      timestamp TIMESTAMP DEFAULT NOW()
    )`,

    // 15. AI learning insights
    `CREATE TABLE IF NOT EXISTS ai_learning_insights (
      id SERIAL PRIMARY KEY,
      category VARCHAR NOT NULL,
      insight TEXT NOT NULL,
      confidence DECIMAL(5,2) NOT NULL,
      data_points INTEGER NOT NULL,
      user_segment VARCHAR,
      actionable BOOLEAN DEFAULT FALSE,
      implementation_status VARCHAR DEFAULT 'pending',
      impact TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 16. Emergency assistance requests
    `CREATE TABLE IF NOT EXISTS emergency_assistance_requests (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      incident_id INTEGER,
      aaa_member_id INTEGER,
      request_type VARCHAR NOT NULL,
      location JSONB NOT NULL,
      description TEXT,
      status VARCHAR NOT NULL DEFAULT 'requested',
      estimated_arrival TIMESTAMP,
      service_provider VARCHAR,
      service_provider_phone VARCHAR,
      completed_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 17. Attorney applications
    `CREATE TABLE IF NOT EXISTS attorney_applications (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR NOT NULL,
      last_name VARCHAR NOT NULL,
      email VARCHAR NOT NULL UNIQUE,
      phone VARCHAR,
      firm_name VARCHAR NOT NULL,
      firm_website VARCHAR,
      states_licensed JSONB NOT NULL DEFAULT '[]',
      bar_number VARCHAR NOT NULL,
      practice_areas JSONB NOT NULL DEFAULT '[]',
      counties_served JSONB DEFAULT '[]',
      languages JSONB DEFAULT '["English"]',
      emergency_available BOOLEAN DEFAULT FALSE,
      availability_24_7 BOOLEAN DEFAULT FALSE,
      consultation_type VARCHAR DEFAULT 'paid',
      malpractice_insurance BOOLEAN DEFAULT FALSE,
      years_experience INTEGER,
      preferred_contact VARCHAR DEFAULT 'email',
      bio TEXT,
      agreement_signed BOOLEAN DEFAULT FALSE,
      verification_status VARCHAR DEFAULT 'pending',
      score INTEGER DEFAULT 0,
      admin_notes TEXT,
      approved_by VARCHAR,
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 18. Attorney outreach CRM
    `CREATE TABLE IF NOT EXISTS attorney_outreach (
      id SERIAL PRIMARY KEY,
      firm_name VARCHAR NOT NULL,
      contact_name VARCHAR,
      contact_title VARCHAR,
      email VARCHAR,
      phone VARCHAR,
      website VARCHAR,
      state VARCHAR NOT NULL,
      city VARCHAR,
      practice_areas JSONB DEFAULT '[]',
      contact_method VARCHAR DEFAULT 'email',
      status VARCHAR DEFAULT 'not_contacted',
      last_contact_date TIMESTAMP,
      next_follow_up_date TIMESTAMP,
      notes TEXT,
      score INTEGER DEFAULT 0,
      source VARCHAR DEFAULT 'manual',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 19. Emergency contacts
    `CREATE TABLE IF NOT EXISTS emergency_contacts (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      name VARCHAR NOT NULL,
      phone VARCHAR NOT NULL,
      email VARCHAR,
      relationship VARCHAR NOT NULL,
      priority VARCHAR NOT NULL DEFAULT 'secondary',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 20. Emergency alerts
    `CREATE TABLE IF NOT EXISTS emergency_alerts (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      alert_type VARCHAR NOT NULL,
      location JSONB,
      user_message TEXT,
      incident_id INTEGER,
      status VARCHAR NOT NULL DEFAULT 'sent',
      contacts_notified JSONB,
      delivery_results JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 21. Legal document templates
    `CREATE TABLE IF NOT EXISTS legal_document_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      category VARCHAR NOT NULL,
      template TEXT NOT NULL,
      fields JSONB NOT NULL,
      state VARCHAR,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 22. Generated legal documents
    `CREATE TABLE IF NOT EXISTS generated_legal_documents (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      incident_id INTEGER,
      template_id INTEGER NOT NULL,
      title VARCHAR NOT NULL,
      content TEXT NOT NULL,
      document_data JSONB NOT NULL,
      format VARCHAR NOT NULL DEFAULT 'pdf',
      status VARCHAR NOT NULL DEFAULT 'generated',
      file_path VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 23. Legal agreement acceptances
    `CREATE TABLE IF NOT EXISTS legal_agreement_acceptances (
      id VARCHAR PRIMARY KEY NOT NULL,
      user_id VARCHAR NOT NULL,
      agreement_type VARCHAR NOT NULL,
      accepted BOOLEAN NOT NULL,
      accepted_at TIMESTAMP DEFAULT NOW(),
      ip_address VARCHAR,
      user_agent TEXT
    )`,

    // 24. Police report data
    `CREATE TABLE IF NOT EXISTS police_report_data (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      incident_id VARCHAR(255),
      officer_name VARCHAR(255),
      officer_badge_number VARCHAR(100),
      officer_department VARCHAR(255),
      supervisor_name VARCHAR(255),
      supervisor_badge_number VARCHAR(100),
      vehicle_number VARCHAR(100),
      incident_date TIMESTAMP,
      incident_location VARCHAR(500),
      incident_description TEXT,
      witness_information JSONB,
      rights_miranda BOOLEAN DEFAULT FALSE,
      search_conducted BOOLEAN DEFAULT FALSE,
      search_consent BOOLEAN DEFAULT FALSE,
      arrest_made BOOLEAN DEFAULT FALSE,
      charges_pressed VARCHAR(500),
      evidence_photos JSONB,
      evidence_videos JSONB,
      evidence_audio JSONB,
      report_type VARCHAR(100),
      complainant_name VARCHAR(255),
      complainant_contact VARCHAR(255),
      damages TEXT,
      injuries TEXT,
      property_recovered TEXT,
      severity_level VARCHAR(50) DEFAULT 'low',
      attorney_requested BOOLEAN DEFAULT FALSE,
      attorney_contacted_id INTEGER,
      attorney_response_time TIMESTAMP,
      report_submitted BOOLEAN DEFAULT FALSE,
      report_number VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 25. Subscription plans
    `CREATE TABLE IF NOT EXISTS subscription_plans (
      id VARCHAR PRIMARY KEY NOT NULL,
      name VARCHAR NOT NULL,
      tier VARCHAR NOT NULL,
      price VARCHAR NOT NULL,
      billing_cycle VARCHAR NOT NULL,
      features JSONB NOT NULL,
      max_incidents INTEGER DEFAULT -1,
      max_emergency_contacts INTEGER DEFAULT -1,
      max_attorney_connections INTEGER DEFAULT -1,
      cloud_storage_days INTEGER DEFAULT -1,
      emergency_lawyer_calls INTEGER DEFAULT 0,
      priority_support BOOLEAN DEFAULT FALSE,
      attorney_response_time_minutes INTEGER DEFAULT -1,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 26. User subscriptions
    `CREATE TABLE IF NOT EXISTS user_subscriptions (
      id VARCHAR PRIMARY KEY NOT NULL,
      user_id VARCHAR NOT NULL,
      plan_id VARCHAR NOT NULL,
      status VARCHAR NOT NULL,
      current_period_start TIMESTAMP,
      current_period_end TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      stripe_subscription_id VARCHAR,
      stripe_customer_id VARCHAR,
      usage_stats JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 27. Feature usage
    `CREATE TABLE IF NOT EXISTS feature_usage (
      id VARCHAR PRIMARY KEY NOT NULL,
      user_id VARCHAR NOT NULL,
      feature VARCHAR NOT NULL,
      usage_count INTEGER DEFAULT 0,
      last_used TIMESTAMP,
      billing_cycle VARCHAR NOT NULL,
      cycle_start TIMESTAMP NOT NULL,
      cycle_end TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 28. Conversations (attorney-client messaging)
    `CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR PRIMARY KEY NOT NULL,
      user_id VARCHAR NOT NULL,
      attorney_id INTEGER NOT NULL,
      incident_id INTEGER,
      subject VARCHAR NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'active',
      priority VARCHAR NOT NULL DEFAULT 'normal',
      last_message_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 29. Messages
    `CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR PRIMARY KEY NOT NULL,
      conversation_id VARCHAR NOT NULL,
      sender_id VARCHAR NOT NULL,
      sender_type VARCHAR NOT NULL,
      content TEXT NOT NULL,
      message_type VARCHAR NOT NULL DEFAULT 'text',
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 30. Message attachments
    `CREATE TABLE IF NOT EXISTS message_attachments (
      id VARCHAR PRIMARY KEY NOT NULL,
      message_id VARCHAR NOT NULL,
      file_name VARCHAR NOT NULL,
      file_type VARCHAR NOT NULL,
      file_size INTEGER,
      file_url VARCHAR NOT NULL,
      thumbnail_url VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 31. Officer complaints
    `CREATE TABLE IF NOT EXISTS officer_complaints (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      incident_id INTEGER,
      officer_name VARCHAR,
      officer_badge VARCHAR,
      department VARCHAR NOT NULL,
      department_address TEXT,
      department_phone VARCHAR,
      incident_date TIMESTAMP NOT NULL,
      incident_location VARCHAR NOT NULL,
      complaint_type VARCHAR NOT NULL,
      description TEXT NOT NULL,
      witnesses JSONB,
      evidence_urls JSONB,
      status VARCHAR NOT NULL DEFAULT 'draft',
      submission_method VARCHAR,
      submitted_at TIMESTAMP,
      confirmation_number VARCHAR,
      follow_up_dates JSONB,
      resolution TEXT,
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 32. Complaint evidence
    `CREATE TABLE IF NOT EXISTS complaint_evidence (
      id SERIAL PRIMARY KEY,
      complaint_id INTEGER NOT NULL,
      evidence_type VARCHAR NOT NULL,
      file_url VARCHAR NOT NULL,
      file_name VARCHAR NOT NULL,
      file_size INTEGER,
      description TEXT,
      uploaded_at TIMESTAMP DEFAULT NOW()
    )`,

    // 33. Complaint updates
    `CREATE TABLE IF NOT EXISTS complaint_updates (
      id SERIAL PRIMARY KEY,
      complaint_id INTEGER NOT NULL,
      update_type VARCHAR NOT NULL,
      description TEXT NOT NULL,
      updated_by VARCHAR NOT NULL,
      is_public BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 34. Referral codes
    `CREATE TABLE IF NOT EXISTS referral_codes (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL UNIQUE,
      code VARCHAR NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 35. Referral tracking
    `CREATE TABLE IF NOT EXISTS referral_tracking (
      id SERIAL PRIMARY KEY,
      referrer_id VARCHAR NOT NULL,
      referred_id VARCHAR NOT NULL UNIQUE,
      code VARCHAR NOT NULL,
      converted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 36. Support tickets
    `CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR,
      session_id VARCHAR NOT NULL,
      issue_type VARCHAR NOT NULL DEFAULT 'general',
      messages JSONB NOT NULL DEFAULT '[]',
      status VARCHAR NOT NULL DEFAULT 'open',
      escalated BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // 37. Push notification subscriptions
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh VARCHAR NOT NULL,
      auth VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // 38. Session tokens (for custom domain auth)
    `CREATE TABLE IF NOT EXISTS session_tokens (
      id SERIAL PRIMARY KEY,
      token VARCHAR NOT NULL UNIQUE,
      user_id VARCHAR NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
  ];

  // Additional ALTER TABLE statements for columns that may be missing on existing deployments
  const addMissingColumns = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR DEFAULT 'en'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_state VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'basic_guard'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contacts JSONB`,
  ];

  const allMigrations = [...createTables, ...addMissingColumns];

  try {
    if (isNeon) {
      const sql = neon(process.env.DATABASE_URL!);
      for (const migration of allMigrations) {
        try {
          await sql(migration);
        } catch (e: any) {
          if (!e.message?.includes('already exists')) {
            console.warn(`[MIGRATION] Warning for: ${migration.slice(0, 70)}...`, e.message);
          }
        }
      }
    } else if (rawPool) {
      const client = await rawPool.connect();
      try {
        for (const migration of allMigrations) {
          try {
            await client.query(migration);
          } catch (e: any) {
            if (!e.message?.includes('already exists')) {
              console.warn(`[MIGRATION] Warning for: ${migration.slice(0, 70)}...`, e.message);
            }
          }
        }
      } finally {
        client.release();
      }
    }
    console.log("[MIGRATION] Auto-migrations completed successfully");
  } catch (error) {
    console.error("[MIGRATION] Auto-migration error (non-fatal):", error);
  }
}

export { db };
