# Quick Start Guide

## 1. Extract Files
```bash
unzip caren_complete_backup_20250708_174539.zip
cd caren_project
```

## 2. Install Dependencies
```bash
npm install
```

## 3. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env  # or your preferred editor
```

## 4. Setup Database
```bash
# Run the database setup script in PostgreSQL
psql -d your_database_name -f DATABASE_SETUP.sql

# Or manually run the SQL commands from DATABASE_SETUP.sql
```

## 5. Start Application
```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

## 6. Access
- App: http://localhost:5000
- Admin: http://localhost:5000/admin
- Demo: http://localhost:5000/demo-login

## Required API Keys
- PostgreSQL database
- Gmail SMTP (email@gmail.com + app password)
- TextBelt SMS (textbelt.com)
- Stripe payments (stripe.com)

See DEPLOYMENT_SETUP_GUIDE.md for detailed instructions.