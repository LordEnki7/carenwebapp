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