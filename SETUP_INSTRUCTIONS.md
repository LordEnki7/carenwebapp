# C.A.R.E.N. Setup Instructions for External Editors

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or use Neon/Supabase)
- Basic knowledge of React/TypeScript

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory with:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database-name

# API Keys (Optional - for full functionality)
OPENAI_API_KEY=sk-your-openai-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public

# Session Security
SESSION_SECRET=your-random-session-secret-key-here

# Replit Specific (for authentication)
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.com
```

### 3. Database Setup
```bash
# Push database schema
npm run db:push

# Optional: Seed with demo data
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Features Overview

### Core Emergency System
- **Voice Commands**: "emergency", "help me", "police" 
- **GPS-Aware Legal Rights**: Automatic state detection and legal information
- **Incident Recording**: Audio/video recording with location data
- **Emergency Contacts**: SMS/Email notifications during emergencies

### Authentication Options
- **Demo Mode**: Quick access without account creation
- **Replit Auth**: OAuth integration (requires Replit environment)
- **Custom Domain**: Token-based authentication for deployment

### Key Components
- **Dashboard**: Main interface with status indicators
- **Legal Rights**: 50-state legal database with GPS integration
- **Attorney Network**: Communication system with legal professionals
- **Cloud Sync**: Multi-device data synchronization

## Deployment Options

### Option 1: Replit (Recommended)
- Upload to Replit
- Configure environment variables
- Deploy using Replit's built-in deployment

### Option 2: Vercel/Netlify
- Build: `npm run build`
- Deploy `dist/` folder
- Configure environment variables in hosting platform

### Option 3: Self-Hosted
- Build: `npm run build`
- Serve `dist/` folder with any web server
- Ensure PostgreSQL database is accessible

## Troubleshooting

### Common Issues
1. **Database Connection**: Verify DATABASE_URL format and credentials
2. **Voice Commands**: Ensure HTTPS for microphone access
3. **GPS Location**: Requires HTTPS and user permission
4. **Session Issues**: Check SESSION_SECRET is set

### Development Tips
- Use demo mode for testing without full authentication setup
- GPS simulation available in browser dev tools
- Voice commands work best with clear pronunciation
- Emergency features require microphone permissions

## Technical Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: TailwindCSS + shadcn/ui
- **Real-time**: WebSocket connections
- **Mobile**: Capacitor for native apps

## Support
This is the clean, streamlined version with Voice Transcription and Multi-Speaker ID features removed, focusing on emergency-only voice functionality.