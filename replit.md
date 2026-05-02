# C.A.R.E.N.™ Alert (Citizen Assistance for Roadside Emergencies and Navigation)

## Overview

C.A.R.E.N.™ Alert is a comprehensive family protection platform providing GPS-enabled, state-specific legal protection and coordinated emergency response. It integrates real-time voice commands, multi-angle video recording, attorney communication, and roadside assistance. The platform offers peace of mind and protection during legal encounters and vehicle emergencies, leveraging AI for legal assistance, smart emergency detection, incident summarization, multi-language legal translation, attorney matching, and real-time voice coaching.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

C.A.R.E.N.™ uses a modular, event-driven architecture with core modules (Authentication, Emergency Response, Voice Command, Legal Rights) and specialized feature modules (Bluetooth, Recording, Location). An Event Bus ensures loose coupling, prioritizing security, performance, and user experience.

The frontend is built with React and TypeScript, using Vite, TailwindCSS with shadcn/ui, React Query for server state, and React hooks for local state. React Router manages navigation with authentication-protected routes. The application supports PWA capabilities and utilizes Capacitor for native iOS/Android wrappers. The UI/UX features a dark, "cyber" aesthetic with glassmorphism, neon accents, and space-inspired backgrounds.

The backend is developed with Node.js and Express.js in TypeScript, offering RESTful APIs with WebSocket support. Authentication uses Replit OpenID Connect, supporting Google OAuth and custom token-based authentication. Security includes rate limiting, session management, AES-256-GCM encryption, biometric authentication, and GDPR compliance. Data storage uses PostgreSQL with Drizzle ORM, and file storage utilizes browser-based blob storage with secure cloud sync and end-to-end encryption.

Key features include:
-   **GPS-Enabled Legal System**: Automatic location detection, OpenStreetMap reverse geocoding, and real-time state identification for displaying legal rights based on a comprehensive legal database (all 50 states + DC, 467+ legal protections).
-   **Voice Command System**: Hands-free emergency activation with 200+ voice patterns and multi-language support (English/Spanish).
-   **Recording and Evidence System**: Browser-based audio/video recording with live preview, GPS coordinate embedding, and court-ready evidence packages (printable HTML with disclaimers). Footage is preserved in Cloudflare R2 with chunked uploads. Includes an "Always-On Dashcam" for continuous background recording with a 10-minute rolling buffer and on-demand upload.
-   **AI-Powered Features**: Includes a Legal Assistant, Emergency Detection, Incident Summarizer, Multi-Language Translation, Attorney Matching, Real-Time Voice Coaching, Recording Analysis, Legal Document Generator, an AI Chat Agent, and an AI Agent Dashboard. This dashboard includes an AI Executive Team for business data analysis, an AI Agent Job System with Human-in-the-Loop Approval, and a Specialized Agent Fleet for focused tasks.
-   **Referral System**: Unique 8-character codes with a dedicated dashboard and tiered rewards for users.
-   **Browser Push Notifications**: VAPID keys for SOS alerts.
-   **C.A.R.E.N. Support Agent**: AI-powered customer support chat widget.
-   **C.A.R.E.N. Legal Access Network (CLAN)**: A comprehensive attorney network system with an application form, admin approval, attorney portal, upgraded matching algorithm, and outreach CRM. Extended attorney access links for incidents are supported (1 day to 10 years duration).
-   **Live Attorney Video/Voice Calls**: Daily.co-powered real-time video calls between users and network attorneys. Users request calls from the Attorney Directory (visible on available/emergency_only attorneys). Attorneys see flashing incoming call alerts in their portal (polls every 5s), can accept/decline, and the Daily.co prebuilt iframe opens for both parties. Call history and duration are logged in the `video_calls` DB table. Requires `DAILY_API_KEY` env var (graceful fallback when absent). Routes: `server/routes/video-calls.routes.ts`. Frontend: `VideoCallModal.tsx`, updated `AttorneyDirectory.tsx`, updated `AttorneyPortal.tsx` (new Calls tab).
-   **Regional Director Program**: Full director recruitment system with application, portal, and admin panel, including a commission system.
-   **Social Media Posting System**: Integrated into the AI Agent Dashboard for AI caption generation, queue management, and one-click posting to multiple platforms.
-   **Legal Hold**: Ability to place incidents under legal hold to prevent deletion.
-   **Launch Incentive System**: Features Founders Access, Refer & Earn, and Story Spotlight programs with associated rewards.

## External Dependencies

-   **PostgreSQL**: Primary database.
-   **Replit Auth**: User authentication and authorization.
-   **OpenStreetMap Nominatim**: Reverse geocoding.
-   **TextBelt API**: SMS emergency notifications.
-   **Gmail SMTP**: Email emergency notifications.
-   **Stripe**: Payment processing.
-   **Replit AI Integrations**: AI-powered features (gpt-5 and gpt-4o models).
-   **Cloudflare R2**: Cloud incident recording storage.
-   **SendGrid**: Email service.
-   **Drizzle ORM**: Database operations.
-   **shadcn/ui**: Component library.
-   **React Query**: Server state management.
-   **Capacitor**: Native mobile app wrapper.
-   **Vite**: Build system.
-   **bcryptjs**: Password hashing.
-   **passport-google-oauth20**: Google OAuth integration.