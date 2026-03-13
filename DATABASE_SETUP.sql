-- C.A.R.E.N. Platform Database Setup Script
-- Run these commands in your PostgreSQL database

-- Create login activity tracking table
CREATE TABLE IF NOT EXISTS login_activity (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  email VARCHAR(255),
  login_method VARCHAR(50),
  user_agent TEXT,
  ip_address VARCHAR(45),
  subscription_tier VARCHAR(50),
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'Community Guardian',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  relationship VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attorneys table
CREATE TABLE IF NOT EXISTS attorneys (
  id SERIAL PRIMARY KEY,
  firm_name VARCHAR(255),
  contact_info JSONB,
  specialties TEXT[],
  states TEXT[],
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample attorney data
INSERT INTO attorneys (firm_name, contact_info, specialties, states, is_available) VALUES
('Pacific Legal Rights', '{"name": "Sarah Johnson", "phone": "(555) 123-4567", "email": "sarah@pacificlegal.com"}', ARRAY['civil_rights', 'constitutional_law'], ARRAY['CA', 'WA', 'OR'], true),
('Lone Star Constitutional Law', '{"name": "Michael Rodriguez", "phone": "(555) 234-5678", "email": "michael@lonestarlaw.com"}', ARRAY['constitutional_law', 'criminal_defense'], ARRAY['TX', 'OK', 'LA'], true),
('Justice & Rights Law Firm', '{"name": "Emily Chen", "phone": "(555) 345-6789", "email": "emily@justicelaw.com"}', ARRAY['civil_rights', 'police_misconduct'], ARRAY['NY', 'NJ', 'CT'], true)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_attorneys_specialties ON attorneys USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_attorneys_states ON attorneys USING GIN(states);

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;