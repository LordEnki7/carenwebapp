# C.A.R.E.N. Platform Deployment Setup Guide

## Quick Start Instructions

### 1. Extract and Install
```bash
# Extract the backup ZIP file
unzip caren_complete_backup_20250708_174539.zip

# Navigate to project directory
cd caren_project

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with these variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# Authentication Secrets
SESSION_SECRET=your_random_session_secret_here
CUSTOM_DOMAIN_SECRET=your_custom_domain_secret

# Email Configuration (for notifications)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password

# SMS Configuration (for emergency alerts)
TEXTBELT_API_KEY=your_textbelt_api_key

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Admin Access
CAREN_ADMIN_2025_PRODUCTION=your_admin_access_key

# Development/Production Mode
NODE_ENV=development
```

### 3. Database Setup
```sql
-- Create the database tables (run these SQL commands)
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

-- Add other tables as needed by running:
-- npm run db:push
```

### 4. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 5. Access Points
- **Main App**: http://localhost:5000
- **Admin Dashboard**: http://localhost:5000/admin (requires admin key)
- **Demo Access**: http://localhost:5000/demo-login

## Required External Services

### 1. PostgreSQL Database
- Create a PostgreSQL database
- Update DATABASE_URL in .env file

### 2. Email Service (Gmail SMTP)
- Enable 2-factor authentication on Gmail
- Generate app-specific password
- Update GMAIL_USER and GMAIL_PASS

### 3. SMS Service (TextBelt)
- Sign up at textbelt.com
- Get API key for SMS notifications
- Update TEXTBELT_API_KEY

### 4. Payment Processing (Stripe)
- Create Stripe account
- Get test/live API keys
- Update STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY

## Features Included
✓ Complete authentication system
✓ Emergency recording and evidence management
✓ Attorney contact network
✓ GPS-aware legal rights database (50 states)
✓ Voice command system
✓ Emergency notification system
✓ Payment processing for subscriptions
✓ Admin dashboard with analytics
✓ Mobile-responsive design
✓ PWA capabilities

## Troubleshooting
- If authentication fails, check SESSION_SECRET configuration
- If database errors occur, verify DATABASE_URL and run migrations
- If payments don't work, verify Stripe keys
- If email/SMS fails, check service credentials

## Support
All source code, configurations, and documentation are included in the backup.
Refer to replit.md for detailed architecture and changelog information.