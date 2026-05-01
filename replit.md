# C.A.R.E.N.™ Alert (Citizen Assistance for Roadside Emergencies and Navigation)

## Overview

C.A.R.E.N.™ Alert is a comprehensive family protection platform designed to provide GPS-enabled, state-specific legal protection and coordinated emergency response. It integrates real-time voice commands, multi-angle video recording, attorney communication, and roadside assistance within a unified ecosystem (PWA and native mobile applications). The platform aims to cover legal encounters and vehicle emergencies with family notification systems, leveraging AI for legal assistance, smart emergency detection, incident summarization, multi-language legal translation, attorney matching, and real-time voice coaching during police encounters. Its vision is to offer unparalleled peace of mind and protection, positioning itself as a vital tool for personal and family safety in challenging situations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

C.A.R.E.N.™ employs a modular, event-driven architecture with independent core modules (Authentication, Emergency Response, Voice Command, Legal Rights) and specialized feature modules (Bluetooth, Recording, Location). An Event Bus ensures loose coupling, prioritizing security, performance, and user experience.

The frontend is built with React and TypeScript, using Vite for bundling, and TailwindCSS with shadcn/ui for components. React Query manages server state, while React hooks handle local state. React Router manages navigation with authentication-protected routes. The application supports PWA capabilities and utilizes Capacitor for native iOS/Android wrappers. The UI/UX features a dark, "cyber" aesthetic with glassmorphism, neon accents (cyan, purple, green), and space-inspired backgrounds.

The backend is developed with Node.js and Express.js in TypeScript, offering RESTful APIs with WebSocket support for real-time features. Authentication is managed via Replit OpenID Connect, supporting Google OAuth and custom token-based authentication. Security measures include rate limiting, robust session management, AES-256-GCM encryption, biometric authentication, and GDPR compliance. Data storage primarily uses PostgreSQL with Drizzle ORM, with PostgreSQL also backing session management. File storage uses browser-based blob storage with secure cloud sync and end-to-end encryption.

Key features include:
-   **GPS-Enabled Legal System**: Automatic location detection, OpenStreetMap reverse geocoding, and real-time state identification for displaying legal rights based on a comprehensive legal database covering all 50 states + DC with 467+ legal protections.
-   **Voice Command System**: Hands-free emergency activation with 200+ voice patterns and multi-language support (English/Spanish).
-   **Recording and Evidence System**: Browser-based audio/video recording with live preview and GPS coordinate embedding.
-   **AI-Powered Features**: Includes a Legal Assistant, Emergency Detection, Incident Summarizer, Multi-Language Translation, Attorney Matching, Real-Time Voice Coaching, Recording Analysis, Legal Document Generator, an AI Chat Agent, and an AI Agent Dashboard for business growth tools. It also features an AI Executive Team (CMO, COO, CSO, CFO) for business data analysis, an AI Agent Job System with Human-in-the-Loop Approval, and a Specialized Agent Fleet (Daily Scan, Growth Engine, Revenue Generator, System Optimizer, Opportunity Hunt) for focused tasks in the Command Center. Opportunity Briefs and Rich Execution Audit Reports provide structured insights and quality reviews.
-   **Referral System**: Unique 8-character codes with a dedicated dashboard.
-   **Browser Push Notifications**: VAPID keys for SOS alerts.
-   **C.A.R.E.N. Support Agent**: AI-powered customer support chat widget handling complaints, feature questions, troubleshooting, and escalations, storing conversations in `support_tickets` and emailing admin for escalated cases.
-   **C.A.R.E.N. Legal Access Network (CLAN)**: A comprehensive attorney network system including an Attorney Application Form (public, multi-step with AI scoring), an Admin Approval Panel, an Attorney Portal for profile management, an Upgraded Matching Algorithm, and an Outreach CRM.
-   **Regional Director Program**: Full director recruitment system with a public application form, Director Portal (Dashboard/Commissions/Leaderboard), and Director Admin Panel. Includes a commission system with tier-based rates (20%–35% by level) and a performance scoring formula.

## Launch Incentive System

### Phase 1 — Founders Access (LIVE)
- Public page at `/founders` — accessible without login
- Live counter: tracks how many of the first 100 spots have been claimed
- Authenticated users can click "Claim Your Spot Now" to get 3 months premium access
- Founding Member badge appears in dashboard for claimed users
- Backend: `server/routes/founders.routes.ts` — mounted at `/api/founders`
- DB: `founders_claims` table, `is_founding_member` + `premium_expires_at` columns on users

### Phase 2 — Refer & Earn (LIVE)
- Tiered rewards on top of existing referral system
- 1 ref = 1 week, 3 refs = 1 month, 10 refs = 3 months + Safety Ambassador badge
- `premium_expires_at` stacks when rewards are granted (GREATEST pattern)
- Backend: `server/routes/referral.routes.ts` — `grantReferralRewards()` function
- Dashboard: tier progress bar, tier ladder (3 steps), Safety Ambassador badge card
- DB: `referral_count`, `referral_reward_tier`, `is_safety_ambassador` columns on users

### Phase 3 — Story Spotlight / UGC (LIVE)
- User submission form at `/share-story` with consent checkbox
- Tracks existing submissions, prevents duplicates, shows review status
- Admin approval panel at `/admin/stories` — approve / feature / reject + grant reward
- Monthly winner gets 1 free month premium — auto-credited to account
- Featured stories available at public endpoint `GET /api/stories/featured`
- Backend: `server/routes/story-submissions.routes.ts` — mounted at `/api/stories`
- Admin panel card added to `/admin` dashboard
- Story Spotlight CTA section added to `/founders` page
- DB: `story_submissions` table (id, user_id, name, email, title, story, video_url, consent_given, status, admin_notes, featured_month, reward_granted)

---

## Social Media Posting System

Built into the AI Agent Dashboard at `/social-agent`. Handles AI caption generation, queue management, and one-click posting to all platforms.

### Backend (`server/routes/social-media.routes.ts`)
- `GET /api/social/posts` — list all queued posts
- `POST /api/social/generate` — AI generates platform-specific caption from a video
- `POST /api/social/save` — save/schedule a post
- `DELETE /api/social/posts/:id` — delete a post
- `PUT /api/social/posts/:id/mark-posted` — manually mark as posted
- `GET /api/social/{platform}/status` — check if platform credentials are configured
- `POST /api/social/linkedin/post/:id` — post to LinkedIn
- `POST /api/social/twitter/post/:id` — post to X/Twitter
- `POST /api/social/facebook/post/:id` — post to Facebook Page
- `POST /api/social/instagram/post/:id` — post as Instagram Reel

### Required Secrets per Platform
| Platform  | Secrets needed |
|-----------|---------------|
| LinkedIn  | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN` |
| X/Twitter | `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET` |
| Facebook  | `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID` |
| Instagram | `FACEBOOK_PAGE_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID` |

### Database
- Table: `social_media_posts` (schema in `shared/schema.ts`)
- Status flow: `draft` → `scheduled` → `posted` | `failed`

---

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
-   **Cloudflare R2**: Cloud incident recording storage (`carenincidents` bucket). Credentials: `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_ENDPOINT`.

---

## Cloud Incident Recording System

Footage is preserved in Cloudflare R2 even if the user's device is destroyed.

### Architecture
- **R2 Service**: `server/services/r2-storage.ts` — presigned URLs, chunk keys, metadata upload
- **Backend Routes**: `server/routes/cloud-incidents.routes.ts` — mounted at `/api/incidents`
- **Frontend Hook**: `client/src/hooks/useCloudRecorder.ts` — MediaRecorder + 15s chunked upload
- **Library Page**: `client/src/pages/Incidents.tsx` — at `/incidents`
- **DB Table**: `cloud_incidents` — id, user_id, status, trigger_type, lat/lng, state, chunk_count, duration_seconds, share_token, share_expires_at

### Key Routes
- `POST /api/incidents/start` — create incident, upload meta.json to R2
- `POST /api/incidents/chunk-url` — return presigned PUT URL for direct browser→R2 upload
- `POST /api/incidents/end` — mark complete with duration
- `GET /api/incidents/my` — list user's incidents
- `GET /api/incidents/:id/playback` — presigned GET URLs for all chunks
- `POST /api/incidents/:id/share` — 24hr attorney share token
- `GET /api/incidents/shared/:token` — public view (no auth needed)
- `DELETE /api/incidents/:id` — soft-delete

### Storage Layout in R2
```
incidents/{incidentId}/chunks/0000.webm
incidents/{incidentId}/chunks/0001.webm
...
incidents/{incidentId}/meta.json
```

### Tier Limits
- Free: 3 incidents max
- Premium: Unlimited

---

## Always-On Dashcam (Step 2 — LIVE)

Continuous background recording that buffers the last 10 minutes in memory and uploads to R2 on demand.

### Architecture
- **Hook**: `client/src/hooks/useDashcam.ts` — `MediaRecorder` with 15s `timeslice`, circular buffer of 40 chunks (10 min rolling window), trigger-to-upload flow
- **Page**: `client/src/pages/Dashcam.tsx` — at `/dashcam`
- **Dashboard card**: purple "Always-On Dashcam" card → `/dashcam`
- **Backend**: Reuses existing `/api/incidents/*` routes (no changes)

### Behavior
- Start → `MediaRecorder` records continuously in 15s chunks (optional `deviceId` for BT cameras)
- Buffer auto-drops oldest chunks when window exceeds 10 min
- "Save Incident" → creates incident, uploads all buffered chunks to R2, marks complete, resets buffer
- Recording continues seamlessly after save
- Status badges: Offline / Standby (buffering) / Uploading…

### Bluetooth Integration (Step 3 — LIVE)
- **Hook**: `client/src/hooks/useBluetooth.ts` — BLE pairing, keyboard trigger, camera enumeration
- **Layer 1 — BT Camera**: `listVideoDevices()` enumerates all `videoinput` devices; dropdown appears when >1 camera found; selected `deviceId` passed to `startDashcam()`
- **Layer 2 — BLE Remote**: Web Bluetooth API device picker; connects to GATT, finds first notifiable characteristic, fires `saveIncident` on change; Chrome/Edge only with graceful fallback
- **Layer 3 — Keyboard/HID Trigger**: Listens for VolumeUp / Space / Enter / MediaPlayPause — works with any BT remote that fires keyboard events; toggle switch in UI
- Bluetooth panel is collapsible (closed by default, non-intrusive)

## Record Page Cloud Backup (Step 1 — LIVE)
- Silent `/api/incidents/start` call on recording start (GPS grabbed in background, non-blocking)
- Blob uploaded to R2 on recording stop (presigned URL flow)
- Cloud status badge: "Cloud active" → "Uploading…" → "Cloud saved ✓" / "Local only"
- All cloud ops are fire-and-forget — local recording never affected