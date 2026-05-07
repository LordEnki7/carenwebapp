# C.A.R.E.N.™ Alert — Mobile App Feature Roadmap
**Citizen Assistance for Roadside Emergencies and Navigation**

This document is a complete handoff for building the C.A.R.E.N. mobile app. The live production web app is at **https://carenalert.com**. The backend API is fully built and deployed — the mobile app should connect to it. Do not rebuild the backend.

---

## Backend API
- **Base URL**: `https://carenalert.com/api`
- **Stack**: Node.js + Express + PostgreSQL (Neon serverless)
- **Auth**: Session cookies + Google OAuth + Apple Sign-In + custom token auth
- **Version check**: `GET https://carenalert.com/api/version`

---

## Authentication

### Screens
- Sign In (email/password)
- Sign Up / Register
- Google OAuth sign-in
- Apple Sign-In (iOS native)
- Password Reset
- Onboarding flow (first-time user setup)

### API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/user` — get current session user
- `GET /api/auth/google` → Google OAuth flow
- `POST /api/auth/apple` → Apple Sign-In (native iOS)
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Notes
- After Google OAuth, server redirects with `?google_auth=true&session_token=...` query params
- Apple Sign-In uses native iOS plugin (`AppleSignInPlugin.swift`)
- Sessions are cookie-based (secure, httpOnly, sameSite: lax)
- Custom token auth is also supported via `Authorization: Bearer <token>` header

---

## Subscription Plans & Payments

### Plans (5 tiers)

| Plan | Price | Key Features |
|---|---|---|
| **Community Guardian** | $0.99 one-time | State legal rights database (all 50 states + DC), lifetime access |
| **Standard** | $4.99/mo | GPS rights, voice activation, incident recording, Emergency SOS, 10-min dashcam buffer |
| **Legal Shield** | $9.99/mo | Everything in Standard + AI legal assistant, attorney matching, voice coaching, AI incident summarizer, translation, social sharing |
| **Family Plan** | $29.99/mo | Up to 6 linked accounts, shared incidents, family emergency network, centralized dashboard |
| **Fleet & Enterprise** | $49.99/mo | Fleet monitoring, admin analytics, compliance reports, custom API integration |

### RevenueCat Product IDs (iOS)
- `com.caren.safetyapp.community_guardian_v2`
- `com.caren.safetyapp.standard_plan_monthly_v3`
- `com.caren.safetyapp.legal_shield_monthly_v3`
- `com.caren.safetyapp.family_plan_monthly_v3`
- `com.caren.safetyapp.fleet_enterprise_monthly_v3`

### iOS Purchase Flow
- Use RevenueCat SDK for all iOS in-app purchases
- `iapService.initialize()` → `iapService.purchase(productId)` → `iapService.restorePurchases()`

### Web/Stripe Flow
- `POST /api/subscription/create-checkout-session` — creates Stripe checkout URL
- `GET /api/subscription/session-status?session_id=...` — verify payment
- `POST /api/subscription/activate` — activate subscription after success
- `POST /api/refunds/request` — request a refund

---

## Core Feature Screens

### 1. Dashboard (Home)
- Welcome with user's name and active plan badge
- Quick-access buttons: Record, SOS, Rights, Attorney
- Active subscription status
- Recent incidents summary
- Emergency contacts status
- **Route**: `/dashboard`

### 2. Emergency SOS
- 1-tap SOS button (prominent, accessible at all times)
- Notifies emergency contacts with GPS location
- Records audio/video automatically on activation
- Shows user's current legal rights for their GPS location
- AI-guided voice coaching during the encounter
- **Route**: `/emergency-pullover`
- **Key API**: Emergency routes via `POST /api/emergency/*`

### 3. Legal Rights (GPS-Aware)
- Detects user's state via GPS
- Displays state-specific constitutional protections (467+ rights across 50 states + DC)
- Searchable rights database
- Voice-activated rights display ("What are my rights?")
- Interactive map view of rights by state
- **Routes**: `/rights`, `/legal-rights-map`
- **Key API**: `GET /api/legal/rights?state=TX`

### 4. Incident Recording
- One-tap recording (audio + video)
- Multi-angle camera support
- 10-minute rolling dashcam buffer (always-on mode)
- Auto-upload to Cloudflare R2 cloud storage
- Evidence catalog / management
- Court-ready evidence package generation (PDF)
- AI incident summarizer — auto-writes a report from the recording
- **Routes**: `/record`, `/dashcam`, `/evidence-catalog`
- **Key APIs**:
  - `POST /api/recordings/start`
  - `POST /api/recordings/stop`
  - `GET /api/recordings`
  - `POST /api/recordings/:id/upload`

### 5. Voice Commands & Coaching
- 200+ voice command patterns (English + Spanish)
- Hands-free activation ("Hey C.A.R.E.N.", "I'm being pulled over", etc.)
- Real-time voice coaching during traffic stops
- Voice learning — system learns your voice over time
- Voice print authentication
- Bluetooth earpiece integration for private audio
- **Routes**: `/voice-commands`, `/voice-coaching`, `/voice-learning`, `/voice-print-auth`, `/unified-voice-hub`
- **Key APIs**:
  - `POST /api/voice-learning/match`
  - `POST /api/voice-learning/training/start`
  - `GET /api/voice-learning/commands`

### 6. AI Legal Assistant
- Ask legal questions mid-encounter (chat interface)
- AI-powered responses based on user's state laws
- "Quick Legal Chat" — fast single-question mode
- Available in Legal Shield and above
- **Key API**: `POST /api/chat/agent`

### 7. Attorney Network (CLAN)
- Find attorneys in your area
- Attorney directory with filters (specialty, location, rating)
- Attorney matching — AI matches you to the right attorney
- Direct connect / video call with attorney via Daily.co
- Attorney portal (separate login for attorneys)
- **Routes**: `/attorneys`, `/find-attorney`, `/attorney-matching`, `/attorney-portal`
- **Key APIs**: Attorney network routes via `/api/attorney-network/*`

### 8. Emergency Sharing
- Share live location + incident in real-time
- Notify pre-set emergency contacts (SMS + email)
- Social media sharing with AI-generated captions
- Share to family network members
- **Route**: `/emergency-sharing`

### 9. Evidence & Complaints
- File formal complaints with evidence attached
- Track complaint status
- Upload photos, videos, documents as evidence
- Court-ready package export
- **Routes**: `/file-complaint`, `/complaints`, `/evidence-catalog`
- **Key APIs**:
  - `GET /api/complaints`
  - `POST /api/complaints`
  - `POST /api/complaints/:id/evidence`
  - `POST /api/complaints/:id/submit`

### 10. Police Report Generator
- AI-assisted police report writing
- Pre-filled with incident details from recording
- Legal document templates
- Export to PDF
- **Routes**: `/police-report`, `/legal-document-generator`

### 11. Translation Hub
- Real-time legal rights translation (English ↔ Spanish + more)
- Voice translation during encounter
- Available in Legal Shield and above
- **Route**: `/translation-hub`

### 12. Community Forum
- Categories, posts, replies
- Story submissions / spotlights
- Feedback board
- Announcements from C.A.R.E.N. team
- **Routes**: `/community`, `/share-story`, `/feedback-board`
- **Key APIs**:
  - `GET /api/forum/categories`
  - `GET /api/forum/stats`
  - `POST /api/forum/posts`

### 13. Roadside Assistance
- GPS-based roadside help
- Emergency service locator
- De-escalation guide
- **Routes**: `/roadside-assistance`, `/de-escalation-guide`

### 14. Dashcam (Always-On)
- Continuous 10-minute rolling buffer
- Auto-saves last 10 minutes on SOS trigger
- Background recording (even when app is minimized)
- **Route**: `/dashcam`

### 15. Police Monitor
- Track police interactions
- Record badge numbers, officer info
- Time-stamp log of events
- **Route**: `/police-monitor`

---

## Device & Hardware Integration

### Bluetooth Earpiece
- Pair Bluetooth earpiece for private audio coaching
- Hear rights and coaching without phone in hand
- Audio routing control
- **Routes**: `/bluetooth-earpiece`, `/bluetooth-devices`, `/device-setup`, `/unified-device-setup`

### Camera Setup
- Multi-angle camera configuration
- Front + rear camera simultaneous recording
- **Route**: `/camera-setup`

---

## Family Plan Features
- Link up to 6 family accounts
- Shared incident history and recordings
- Family emergency notification network
- Centralized family dashboard
- Family members get SOS alerts when any member triggers

---

## Settings & Account

### Screens
- Account settings (name, email, phone, password)
- Account security (2FA, session management)
- Subscription management (upgrade/downgrade/cancel)
- Emergency contacts management (add/edit/remove)
- Notification preferences
- Accessibility settings (text size, high contrast, audio cues)
- Audio feedback settings
- Smart auto-mute (silences phone during encounters)
- Vehicle readability mode (high-contrast for bright daylight)
- Mobile performance settings
- **Routes**: `/settings`, `/account-security`, `/accessibility-enhancer`, `/audio-feedback-settings`, `/smart-auto-mute`, `/vehicle-readability`

---

## Director / Regional Program
- Regional Director application and portal
- Commission tracking
- Referral system with tiered rewards
- Director leaderboard
- Playbook / training materials
- **Routes**: `/director-apply`, `/director-portal`, `/director-playbook`
- **Key API**: `GET /api/directors/leaderboard`

---

## Launch Incentive Programs (Active)
- **Founders Access** — early adopter benefits
- **Refer & Earn** — referral codes with tiered rewards
- **Story Spotlight** — submit your story for featured placement
- **Waitlist** — pre-launch waitlist with referral tracking
- **Routes**: `/founders`, `/waitlist`, `/share-story`

---

## Notifications
- Emergency SOS received (family network)
- Complaint status updates
- Attorney response received
- Subscription renewal reminders
- Announcement / platform updates
- Push notifications via VAPID (web) — use native push for mobile

---

## Legal / Compliance Pages
- Terms of Service (`/terms`)
- Privacy Policy (`/privacy`)
- EULA (`/eula`)

---

## Key Technical Notes for Mobile Agent

### API Authentication
- All protected endpoints require an active session
- Send cookies with every request (`credentials: 'include'`)
- Token-based auth also supported: `Authorization: Bearer <token>`

### Real-Time Features
- WebSocket connection available for live updates
- Used for: live incident sharing, attorney chat, emergency alerts

### Storage
- Incident recordings → Cloudflare R2
- User data → PostgreSQL (Neon)
- Sessions → PostgreSQL session store

### SMS
- Emergency SOS notifications use TextBelt (45 credits remaining as of 2026-05-03) — conserve for real emergencies only

### Email
- Transactional email via SMTP (Hostinger / smtp.hostinger.com)
- Marketing email via Mailtrap/SendGrid

### Video Calls (Attorney Connect)
- Daily.co API for attorney video calls
- `DAILY_API_KEY` is configured on the server

### AI
- OpenAI (GPT-4o) for legal assistant, voice coaching, incident summarizer
- Rate-limited: AI endpoints have request throttling per user

---

## Priority Build Order (Suggested)

### Phase 1 — Core (Must Have)
1. Auth (sign in, register, Google, Apple)
2. Dashboard / home screen
3. Emergency SOS button + GPS rights display
4. Incident recording (audio/video)
5. Plans & subscription (RevenueCat iOS)

### Phase 2 — Power Features
6. Voice commands + voice coaching
7. AI legal assistant (chat)
8. Attorney directory + matching
9. Evidence catalog + complaint filing
10. Always-on dashcam mode

### Phase 3 — Community & Growth
11. Family plan features
12. Community forum
13. Emergency sharing
14. Translation hub
15. Director / referral program

### Phase 4 — Polish
16. Bluetooth earpiece integration
17. Police monitor
18. Legal document generator
19. Police report form
20. All settings screens

---

## Admin (Do Not Build in Mobile App)
The admin dashboard (`/admin`) is web-only and should not be included in the mobile app. It includes user management, abuse monitoring, system health, analytics, and the security center (honeypot threat monitoring).

---

*Last updated: 2026-05-07 | Production commit: 97d7b5f | carenalert.com*
