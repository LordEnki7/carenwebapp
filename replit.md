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

### App Store Rejection Fixes (Build 13+)
- **Sign in with Apple** added: `@capacitor-community/apple-sign-in` plugin (already installed), `appleId varchar` column on users table, `server/routes/apple-auth.routes.ts` endpoint, `client/src/lib/appleSignIn.ts` helper, `client/src/components/auth/AppleSignInButton.tsx` button (renders only on iOS), handler in `SimpleSignInForm.tsx`
- **Terms/Privacy links** fixed in `client/src/pages/Payment.tsx`: plain text replaced with clickable `<a href="/terms-of-service">` and `<a href="/privacy-policy">` links
- **IAP crash fixed**: `client/src/lib/iapService.ts` rewritten to remove broken `registerPlugin('StoreKit')` that was crashing on tap; now throws a user-friendly error on native instead of crashing silently
- **DB**: `apple_id VARCHAR` column added to Neon DB via direct SQL (`ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id VARCHAR`)
- **Remaining user action needed**: (1) Accept Apple Paid Apps Agreement in ASC, (2) Create IAP products in ASC with these IDs: `com.caren.safetyapp.community_guardian`, `com.caren.safetyapp.standard_plan_monthly`, `com.caren.safetyapp.legal_shield_monthly`, `com.caren.safetyapp.family_plan_monthly`, `com.caren.safetyapp.fleet_enterprise_monthly`, (3) Enable "Sign in with Apple" capability in Xcode → Signing & Capabilities, (4) Run `npx cap sync ios` before archiving

### iOS Blank Screen Fix (Build 9+)
- **Root cause**: `scheme: 'CAREN Alert'` had a space, making WKWebView URL (`caren alert://localhost/`) invalid → blank screen on every launch
- **Fix**: Changed to `scheme: 'carenalert'` in `capacitor.config.ts`
- **Also fixed**: `getEnvironment()` in `client/src/config/environment.ts` was throwing a hard crash if `VITE_PRODUCTION_API_URL` was not set — changed to fall back to `https://carenalert.com` so the app always connects to the live backend
- **CORS**: Added `carenalert://localhost` to the allowed origins list in `server/index.ts`
- **iPad mode**: `preferredContentMode` set to `'recommended'` for iPadOS 26+ compatibility

### iPad Blank Screen Fix (App Store Review Rejection)
- **Root cause 1**: `useAuth` hook used hardcoded relative URL `fetch('/api/auth/user')` — in Capacitor iOS, relative URLs resolve to `carenalert://localhost/api/auth/user` (a local file path), NOT the backend server. This caused the auth check to silently fail, leaving the app stuck on the loading spinner indefinitely.
- **Fix**: Changed to `fetch(\`${ENV.API_BASE_URL}/api/auth/user\`)` in `client/src/hooks/useAuth.ts` — `ENV.API_BASE_URL` is `''` for web (relative, correct) and `https://carenalert.com` for mobile (absolute, correct).
- **Root cause 2**: `preferredContentMode: 'mobile'` forced iPhone layout on iPadOS 26's redesigned iPad interface, breaking WKWebView rendering.
- **Fix**: Changed to `preferredContentMode: 'recommended'` in `capacitor.config.ts`.
- **Also added**: `https://carenalert.com` to CSP `connectSrc` in `server/productionSecurity.ts`.

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

### ⚠️ RECURRING ISSUE: 37% iOS Loading Hang — NEVER BREAK THIS RULE
- **Root cause**: Eagerly importing large page components (Dashboard 42KB, Record 52KB, etc.) bloats the initial JS bundle. WKWebView on iOS then freezes at ~37% while parsing it.
- **The rule**: Every page component in `client/src/App.tsx` MUST use `const X = lazy(() => import("@/pages/X"))`. NEVER use `import X from "@/pages/X"` for page-level components.
- **Only exception**: `BrowserCompatibleSignIn` stays eager — it IS the loading screen and is shown immediately.
- **Second cause**: `SESSION_DEBUG` middleware in `server/index.ts` was logging EVERY request including Vite `/src/` file requests (50+ per page load), flooding the server. Rule: SESSION_DEBUG must ONLY log `/api/auth/` requests — never all requests.
- **How to detect**: If you see dozens of `[SESSION_DEBUG] GET /src/components/...` lines in the server log, the middleware is misconfigured.
- **Current fix applied**: `Dashboard`, `Record`, `Rights`, `Landing`, `Login`, `OnboardingPage` are all `lazy()` in App.tsx. SESSION_DEBUG only logs `/api/auth/` routes.

### GitHub Repository
- Repo: `https://github.com/LordEnki7/carenwebapp`
- Push token stored as `GITHUB_PERSONAL_ACCESS_TOKEN2` environment secret
- Push from `/tmp/caren-push` folder using: `cd /tmp/caren-push && git push origin main --force`