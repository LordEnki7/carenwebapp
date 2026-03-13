# C.A.R.E.N.™ (Citizen Assistance for Roadside Emergencies and Navigation)

## Overview

C.A.R.E.N.™ is a comprehensive family protection platform designed to provide GPS-enabled, state-specific legal protection and coordinated emergency response. It integrates real-time voice commands, multi-angle video recording, attorney communication, and roadside assistance. The platform offers a unified ecosystem through Progressive Web App (PWA) and native mobile applications, aiming to cover both legal encounters and vehicle emergencies with coordinated family notification systems. Key capabilities include AI-powered legal assistance, smart emergency detection, incident summarization, multi-language legal translation, AI attorney matching, and real-time voice coaching during police encounters.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### System Design

C.A.R.E.N.™ utilizes a modular, event-driven architecture with independent, reusable core modules (Authentication, Emergency Response, Voice Command, Legal Rights) and specialized feature modules (Bluetooth, Recording, Location). An Event Bus facilitates inter-module communication, ensuring loose coupling. The system is built with a strong focus on security, performance, and user experience.

### Frontend Architecture

The frontend is developed using React with TypeScript, Vite for building, and TailwindCSS with shadcn/ui components. React Query manages server state, while React hooks handle local state. React Router controls navigation with authentication-protected routes. The application supports PWA capabilities and uses Capacitor for native iOS/Android wrappers. The UI/UX features a dark theme with a "cyber" aesthetic, incorporating glassmorphism, neon accents (cyan, purple, green), and space-inspired backgrounds for a professional, readable interface.

### Backend Architecture

The backend runs on Node.js with Express.js, written in TypeScript. It employs RESTful APIs with WebSocket support for real-time features. Authentication is handled via Replit OpenID Connect, supporting Google OAuth and custom token-based authentication. Security measures include rate limiting, robust session management, end-to-end encryption (AES-256-GCM), biometric authentication, and GDPR compliance.

### Data Storage Solutions

PostgreSQL is the primary database, managed with Drizzle ORM for schema changes. Session management is also PostgreSQL-backed. File storage utilizes browser-based blob storage with secure cloud sync and end-to-end encryption. Client-side caching is implemented with React Query, and service workers enable offline storage.

### Key Features and Technical Implementations

- **GPS-Enabled Legal System**: Automatic location detection, OpenStreetMap reverse geocoding, and real-time state identification for displaying legal rights.
- **Comprehensive Legal Database**: Covers all 50 states + DC with 467+ legal protections across categories like Traffic Stops, Recording Rights, Search/Seizure, Police Accountability, and State-Specific Laws.
- **Voice Command System**: Hands-free emergency activation with 200+ voice patterns, multi-language support (English/Spanish), and enhanced pattern recognition.
- **Recording and Evidence System**: Browser-based audio/video recording with live preview and GPS coordinate embedding.
- **AI-Powered Features**:
    - **Legal Assistant**: Quick Q&A using state-specific legal databases.
    - **Emergency Detection**: AI-powered distress signal analysis.
    - **Incident Summarizer**: Auto-generates reports with key events.
    - **Multi-Language Translation**: 15+ language legal translation.
    - **Attorney Matching**: Case-specific recommendations.
    - **Real-Time Voice Coaching**: Live AI guidance during police encounters.
    - **Recording Analysis**: Transcript analysis for legal strength.
    - **Legal Document Generator**: Auto-generates legal documents.
    - **AI Chat Agent**: Floating chat widget for C.A.R.E.N.™ features and legal rights.
    - **AI Agent Dashboard**: Admin hub for AI-powered business growth tools including lead capture, content generation (TikTok, Instagram, X, Facebook), lead management, email campaigns, and agent stats.
    - **AI Executive Team**: Four AI agents (CMO, COO, CSO, CFO) analyze live business data and provide role-specific briefings.
    - **AI Agent Job System with Human-in-the-Loop Approval**: Allows administrators to trigger strategic scans, review AI-generated proposals, and approve/reject executions before they are carried out. This includes automated content generation, drip email campaigns, and strategic insights recorded to Agent Memory.
    - **Specialized Agent Fleet** (Phase 12): Five selectable agents in the Command Center — Daily Scan (full overview), Growth Engine (user acquisition and content), Revenue Generator (monetization and pricing), System Optimizer (workflow efficiency and automation), and Opportunity Hunt (investors, partners, distributors). Each agent has its own focused OpenAI prompt and mission.
    - **Opportunity Briefs** (Phase 12): The Opportunity Hunt agent generates structured Opportunity Briefs (proposalType='opportunity') with difficulty rating (Low/Medium/High), whyItMatters, estimatedTimeDays, platformsAffected, and potentialRevenue. These are displayed in violet-accented cards and stored in Agent Memory when approved.
    - **Rich Execution Audit Reports** (Phase 12): After approving and executing any action proposal, a second AI call generates a full quality report: action log (3-5 steps), quality score (1-10), quality review (strengths/weaknesses/risks), results review (expected vs actual outcome, business impact, lessons learned), and recommended next steps. Stored in agent_runs table and displayed in a structured panel in the UI.
- **Referral System**: Unique 8-character codes for users with a dedicated dashboard for tracking.
- **Browser Push Notifications**: VAPID keys for SOS alerts.

## External Dependencies

-   **PostgreSQL**: Primary database.
-   **Replit Auth**: User authentication and authorization.
-   **OpenStreetMap Nominatim**: Reverse geocoding.
-   **TextBelt API**: SMS emergency notifications.
-   **Gmail SMTP**: Email emergency notifications.
-   **Stripe**: Payment processing.
-   **Vite**: Build system.
-   **Drizzle ORM**: Database operations.
-   **shadcn/ui**: Component library.
-   **React Query**: Server state management.
-   **Capacitor**: Native mobile app wrapper.
-   **bcryptjs**: Password hashing.
-   **passport-google-oauth20**: Google OAuth integration.
-   **SendGrid**: Email service (for welcome emails and drip campaigns).
-   **Replit AI Integrations**: AI-powered features (gpt-5 and gpt-4o models).

## Deployment Notes

### Cross-Browser Compatibility Fix
- Session cookies use `sameSite: 'lax'` (not `'strict'`) — required for OAuth redirects to work in Firefox, Edge, and AVG browsers
- CSP headers include `wss://*.replit.app`, `https://*.replit.app`, and Google OAuth domains
- `upgradeInsecureRequests` removed from CSP to prevent Firefox blocking legitimate connections

### Docker / Dokploy Deployment
- **Dockerfile**: Single-stage build using `node:20-bullseye-slim` with native build deps (cairo, pango, libjpeg) for the `canvas` package
- **nixpacks.toml**: Configures Nixpacks builds with separate install/build phases to avoid double `npm install`
- **`.dockerignore`**: Only excludes `node_modules`, `.git`, large binary files (`zi*`, `*.zip`, `*.aab`, etc.) — does NOT exclude source files
- **`@assets` alias**: Points to `client/src/assets/` (not `attached_assets/`) — images are at `client/src/assets/*.png` for cross-environment compatibility
- Build command: `npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
- Start command: `node dist/index.js`

### GitHub Repository
- Repo: `https://github.com/LordEnki7/carenwebapp`
- Push token stored as `GITHUB_PERSONAL_ACCESS_TOKEN2` environment secret
- Push from `/tmp/caren-push` folder using: `cd /tmp/caren-push && git push origin main --force`