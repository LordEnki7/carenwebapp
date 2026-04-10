# C.A.R.E.N.™ (Citizen Assistance for Roadside Emergencies and Navigation)

## Overview

C.A.R.E.N.™ is a comprehensive family protection platform offering GPS-enabled, state-specific legal protection and coordinated emergency response. It integrates real-time voice commands, multi-angle video recording, attorney communication, and roadside assistance within a unified ecosystem (PWA and native mobile applications). The platform aims to cover legal encounters and vehicle emergencies with family notification systems, leveraging AI for legal assistance, smart emergency detection, incident summarization, multi-language legal translation, attorney matching, and real-time voice coaching during police encounters.

## User Preferences

Preferred communication style: Simple, everyday language.

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