# C.A.R.E.N.™ Alert (Citizen Assistance for Roadside Emergencies and Navigation)

## Overview

C.A.R.E.N.™ Alert is a comprehensive family protection platform offering GPS-enabled, state-specific legal protection and coordinated emergency response. It integrates real-time voice commands, multi-angle video recording, attorney communication, and roadside assistance within a unified ecosystem (PWA and native mobile applications). The platform aims to cover legal encounters and vehicle emergencies with family notification systems, leveraging AI for legal assistance, smart emergency detection, incident summarization, multi-language legal translation, attorney matching, and real-time voice coaching during police encounters.

## User Preferences

Preferred communication style: Simple, everyday language.

## Feature Integrity Rules — NEVER VIOLATE THESE

These rules exist because a previous agent silently replaced working Sign in with Apple code with a stub that threw a fake error, breaking an App Store-required feature without the user knowing.

### 1. NEVER stub out or disable a working feature
- If a feature is working, do NOT replace it with a `throw new Error(...)` placeholder
- If a package is broken or missing, find a replacement — do not stub and move on
- If something truly cannot be fixed, tell the user explicitly and get their approval before disabling it

### 2. NEVER hide a broken feature with a misleading message
- Error messages like "this feature will be enabled in a future release" must NEVER be silently hardcoded
- If a feature doesn't work, the user must be told clearly — not deceived by a fake status message

### 3. App Store required features are untouchable without explicit approval
- **Sign in with Apple** is REQUIRED by App Store guidelines (Guideline 4.8) for any app offering social login
- **In-app purchases** for digital goods must go through Apple's system — never bypass this
- These features must ALWAYS be functional. Never stub, disable, or redirect them without explicit user approval

### 4. Before removing or replacing any feature
- Read the existing code and understand what it does
- Tell the user what you're changing and why
- Confirm the replacement works before removing the original

### 5. Document any known limitations clearly in replit.md
- If Sign in with Apple doesn't work on Simulator — document it here, don't hide it in the code
- Known limitations: Sign in with Apple requires a real device (iOS Simulator blocks iCloud)

---

## Deployment Policy — Pushing Code to carenalert.com

> **Root cause of past failures:** Replit's checkpoint system commits code to Replit's own git branch but NEVER pushes to GitHub automatically. Dokploy watches GitHub, not Replit. So if you don't run the push command below, Dokploy keeps deploying old code forever — even when everything looks up-to-date in Replit.

### THE ONE COMMAND TO DEPLOY

Open the **Shell tab** in Replit and run:

```bash
bash scripts/deploy-to-dokploy.sh
```

This single script handles everything:
1. **Runs `npx vite build`** to produce a fresh `dist/public/` bundle in Replit (where code is known-good)
2. Writes `build-info.json` with the current commit SHA
3. Stages all changes including the new `dist/public/` bundle
4. Removes `.github/workflows/` from staging (PAT lacks workflow scope)
5. Commits and pushes to `github/main` (what Dokploy watches)
6. Prints confirmation and next steps

**WHY THE FRONTEND IS PRE-BUILT:** Docker layer caching caused Dokploy to serve old JS bundles (missing features like Plans in footer) even after `git push`. The fix: build in Replit, commit `dist/public/` to git, and have the Dockerfile skip vite build entirely. The Dockerfile now only runs the fast server-side esbuild step.

**IMPORTANT:** This script MUST be run from the **Shell tab** — not a workflow, not the AI agent. Only the Shell tab can run `git push`.

---

### After the Push — Verify Deployment

Once the script prints **✓ PUSH SUCCESSFUL**:

Dokploy auto-deploys on every push. Wait ~2 minutes and the new code is live. You can verify at `https://carenalert.com` — check the footer for Plans tab.

> **No more "Rebuild without cache" needed.** Since the frontend bundle is pre-built and committed to git, Docker layer caching cannot serve stale JS. A regular Dokploy auto-deploy is always sufficient.

---

### Troubleshooting

**"Authentication failed" / push rejected:**
```bash
git remote set-url github https://$GITHUB_PERSONAL_ACCESS_TOKEN2@github.com/LordEnki7/carenwebapp.git
git push github fresh-main:main
```

**"could not lock config file":**
```bash
rm -f .git/config.lock
git push github fresh-main:main
```

**"refusing to allow a OAuth App to create or update workflow":**
```bash
git rm --cached .github/workflows/*.yml
git push github fresh-main:main
```

**Dokploy deploys but site still shows old version:**
- Hard refresh the browser (Ctrl+Shift+R / Cmd+Shift+R)
- Check `https://carenalert.com/api/version` — if timestamp is old, Dokploy got the push but didn't rebuild. Click **Deploy** manually in Dokploy dashboard.

---

### Key Git Facts (Never Forget)

| Thing | Value |
|-------|-------|
| GitHub remote name | `github` (NOT `origin`) |
| Local branch to push | `fresh-main` |
| GitHub target branch | `main` |
| Dokploy watches | `github/main` |
| Replit checkpoints | Commit to Replit only — do NOT push to GitHub |

---

## Pre-Push Validation

Before pushing, run the full validation checklist (optional but recommended):

```bash
bash scripts/pre-push-check.sh
```

This runs 13 checks automatically:
1. TypeScript — no type errors
2. Server health — `/api/auth/user` and `/api/subscription-plans` respond
3. Video streaming — `caren-hero.mp4` and `caren-short.mp4` return HTTP 206 on Range requests
4. Director leaderboard API responds
5. Attorney drip email route is registered
6. Frontend root `/` renders
7. `.github/workflows/` is in `.gitignore` (prevents GitHub push errors due to PAT scope)
8. Production video files (`caren-hero.mp4`, `caren-short.mp4`, `caren-attorney.mp4`) are present
9. Database connection reachable
10. Stripe keys are live keys (not test keys)
11. All public assets tracked by git
12. `/api/version` endpoint responds
13. No `.github/workflows/` files staged

Named validation commands (for in-session use): `typecheck`, `server-health`, `video-stream`, `check-deployment`

---

## Android Play Store App — Build & Submit Guide

### Why a New APK Is Needed (One-Time)

The Capacitor config now includes `server.url: 'https://carenalert.com'`, which makes the
Android WebView load the app live from carenalert.com instead of bundled assets. This fixes:
- **Video not playing** — MP4s were never bundled in the APK; they now stream from the server
- **Google Sign-In** — the Google button now opens a Chrome Custom Tab (real browser) instead of
  the WebView; Google blocked WebView OAuth since 2021

After this one new APK is submitted, **all future code changes auto-update** via Dokploy — no
more Play Store submissions for web changes.

### Steps to Build & Submit the New AAB

Run these commands in Android Studio's terminal (or your local machine with JDK + Android SDK):

```bash
# 1. In Replit Shell — build the web assets first
npm run build

# 2. Sync Capacitor config & web assets to the android/ project
npx cap sync android

# 3. Open Android Studio (or run Gradle directly)
cd android
./gradlew bundleRelease

# The signed AAB will be at:
#   android/app/build/outputs/bundle/release/app-release.aab
```

The keystore is already configured in `capacitor.config.ts` buildOptions:
- Path: `android/caren-release.jks`
- Password: `carenstore123`
- Alias: `caren-key`

### Submitting to Google Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Select the CAREN Alert app
3. Open Testing → Internal Testing
4. Create new release → upload `app-release.aab`
5. Submit for review

### Google Sign-In on Android — How It Works Now

| Scenario | Behavior |
|----------|----------|
| Desktop / web browser | Standard redirect to `/api/auth/google` |
| Android native app | Opens Chrome Custom Tab (real Chrome browser) |
| iOS native app | Google button hidden; use Apple Sign In or email |

The Chrome Custom Tab completes OAuth normally (no "disallowed_useragent" block), then the
WebView detects the session via cookie polling once the tab closes.

---

## System Architecture

### System Design

C.A.R.E.N.™ employs a modular, event-driven architecture with independent core modules (Authentication, Emergency Response, Voice Command, Legal Rights) and specialized feature modules (Bluetooth, Recording, Location). An Event Bus ensures loose coupling. The system prioritizes security, performance, and user experience.

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for bundling, and TailwindCSS with shadcn/ui for components. React Query manages server state, while React hooks handle local state. React Router manages navigation with authentication-protected routes. The application supports PWA capabilities and utilizes Capacitor for native iOS/Android wrappers. The UI/UX features a dark, "cyber" aesthetic with glassmorphism, neon accents (cyan, purple, green), and space-inspired backgrounds.

### Backend Architecture

The backend is developed with Node.js and Express.js in TypeScript, offering RESTful APIs with WebSocket support for real-time features. Authentication is managed via Replit OpenID Connect, supporting Google OAuth and custom token-based authentication. Security measures include rate limiting, robust session management, AES-256-GCM encryption, biometric authentication, and GDPR compliance.

### Data Storage Solutions

PostgreSQL is the primary database, managed with Drizzle ORM. Session management is also PostgreSQL-backed. File storage uses browser-based blob storage with secure cloud sync and end-to-end encryption. Client-side caching is implemented with React Query, and service workers provide offline storage.

### Key Features and Technical Implementations

-   **GPS-Enabled Legal System**: Automatic location detection, OpenStreetMap reverse geocoding, and real-time state identification for displaying legal rights.
-   **Comprehensive Legal Database**: Covers all 50 states + DC with 467+ legal protections across categories like Traffic Stops, Recording Rights, Search/Seizure, and Police Accountability.
-   **Voice Command System**: Hands-free emergency activation with 200+ voice patterns and multi-language support (English/Spanish).
-   **Recording and Evidence System**: Browser-based audio/video recording with live preview and GPS coordinate embedding.
-   **AI-Powered Features**: Includes a Legal Assistant, Emergency Detection, Incident Summarizer, Multi-Language Translation, Attorney Matching, Real-Time Voice Coaching, Recording Analysis, Legal Document Generator, an AI Chat Agent, and an AI Agent Dashboard for business growth tools. The system also features AI Executive Team agents (CMO, COO, CSO, CFO) for business data analysis, an AI Agent Job System with Human-in-the-Loop Approval for strategic execution, and a Specialized Agent Fleet (Daily Scan, Growth Engine, Revenue Generator, System Optimizer, Opportunity Hunt) in the Command Center for focused tasks. Opportunity Briefs are generated with structured details, and Rich Execution Audit Reports provide post-action quality reviews.
-   **Referral System**: Unique 8-character codes with a dedicated dashboard.
-   **Browser Push Notifications**: VAPID keys for SOS alerts.
-   **C.A.R.E.N. Support Agent**: AI-powered customer support chat widget that handles complaints, feature questions, troubleshooting, and escalations, storing conversations in `support_tickets` and emailing admin for escalated cases.
-   **C.A.R.E.N. Legal Access Network (CLAN)**: A comprehensive attorney network system, including an Attorney Application Form (public, multi-step with AI scoring), an Admin Approval Panel, an Attorney Portal for profile management, an Upgraded Matching Algorithm for client-attorney pairing, and an Outreach CRM for recruitment.
-   **Regional Director Program (Phase 1 & 2)**: Full director recruitment system including: a public application form (`/become-director`, 3-step with shadcn Select), Director Portal (`/director-portal`, tabbed: Dashboard/Commissions/Leaderboard), and Director Admin Panel (`/director-admin`, tabbed: Directors/Commissions/Leaderboard). Commission system with tier-based rates (20%–35% by level), performance scoring formula, and a live leaderboard. DB tables: `regional_directors`, `director_activities`, `director_commissions`. Admin key: `CAREN_ADMIN_2025_PRODUCTION`. Route ordering: all `/admin/*` routes registered before parameterized `/:id` routes to prevent Express match conflicts.

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
-   **SendGrid**: Email service.
-   **Replit AI Integrations**: AI-powered features (gpt-5 and gpt-4o models).