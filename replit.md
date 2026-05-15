# C.A.R.E.N.™ Alert (Citizen Assistance for Roadside Emergencies and Navigation)

C.A.R.E.N.™ Alert is a family protection platform with GPS-enabled legal rights display, emergency response, attorney network, AI features, and incident recording for legal encounters and vehicle emergencies.

## Run & Operate
- **Dev server**: `npm run dev` (Express + Vite on port 5000)
- **Typecheck**: `npx tsc --noEmit`
- **Pre-push check**: `bash scripts/pre-push-check.sh`
- **Push to production**: `git push github fresh-main:main` — then trigger **Dokploy redeploy** in the Dokploy dashboard (user must click this manually). Dokploy now runs `vite build` inside Docker — no manual pre-build needed.
- **Confirm production live**: check `https://carenalert.com/api/version` — commit hash must match local HEAD
- **Do NOT use**: `bash scripts/deploy-to-dokploy.sh` (causes git lock issues in Replit sandbox) or Replit Publish button (wrong deploy method)
- **Admin dashboard**: `/admin` — key is stored as env secret, never hardcode or display it
- **Required env vars**: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `DAILY_API_KEY`, `CLOUDFLARE_R2_*`, `MAILTRAP_TOKEN`

## Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, shadcn/ui, React Query, Wouter routing, Capacitor (iOS/Android)
- **Backend**: Node.js + Express.js (TypeScript), Drizzle ORM, PostgreSQL (Neon serverless)
- **Auth**: Replit OpenID Connect + Google OAuth + custom token auth
- **AI**: Replit AI Integrations (gpt-5, gpt-4o via `AI_INTEGRATIONS_OPENAI_API_KEY`)
- **Payments**: Stripe (live keys in production)
- **Storage**: Cloudflare R2 for incident recordings
- **Email**: SendGrid + Mailtrap + SMTP (Hostinger)
- **SMS**: TextBelt (45 credits remaining as of 2026-05-03)
- **Video calls**: Daily.co

## Where Things Live
- `client/src/pages/SimpleAdminDashboard.tsx` — admin dashboard (users, abuse monitor, health, analytics)
- `server/routes.ts` — all API routes (~6300 lines)
- `server/storage.ts` — all DB operations via Drizzle
- `server/healthCheck.ts` — 11-integration health checks (runs on startup + `GET /api/health`)
- `server/dbSafety.ts` — safe user deletion with audit trail (`softDeleteUser`)
- `shared/schema.ts` — DB schema + Zod types
- `client/src/buildTimestamp.ts` — auto-generated deploy timestamp for Docker cache busting
- Schema source of truth: `shared/schema.ts`

## Architecture Decisions
- **Tabs in admin are controlled** (`value={activeTab}` + `onValueChange`) so `jumpToUser()` can switch to Manage Users tab programmatically
- **Delete is optimistic**: deleted users are immediately removed from `allUsers` state; no second round-trip needed
- **Abuse scan excludes**: attorney seed IDs (`attorney_*`), demo users (`demo-user*`), seed accounts (`seed-*`) from signup burst detection
- **Pre-push hook** runs TypeScript check + server health + video checks before every `git push` — must pass or push is blocked
- **Dokploy** is the production host. It rebuilds from GitHub on manual trigger. Docker build runs Vite inside the container using Dokploy's own env vars.
- **Git lock issue**: `.git/refs/remotes/github/main.lock` sometimes goes stale after a push — Replit sandbox blocks `rm` on git files; workaround is that the push still succeeds and Replit auto-commits pending changes in the next checkpoint

## Product
- GPS-enabled legal rights for all 50 states + DC (467+ protections)
- Voice command emergency activation (200+ patterns, English/Spanish)
- Multi-angle video recording → Cloudflare R2, court-ready evidence packages
- Always-On Dashcam (10-min rolling buffer)
- AI Legal Assistant, Incident Summarizer, Attorney Matching, Voice Coaching
- C.A.R.E.N. Legal Access Network (CLAN): attorney applications, portal, video calls
- Regional Director Program with commissions
- Referral system with tiered rewards
- Founders Access / Refer & Earn / Story Spotlight launch incentives
- Admin dashboard: user management, abuse monitor, system health, analytics

## User Preferences
- **Communication**: Simple, everyday language — no technical jargon unless asked
- **Don't ask**: the user to run commands they shouldn't have to — just do it
- **Deployment**: User pushes to GitHub → Dokploy rebuilds → carenalert.com updates. The one step the agent cannot do is click "Redeploy" in Dokploy — that requires the user
- **Recall**: User has noted their recall isn't strong — be proactive, don't wait to be asked, and handle the full flow end-to-end whenever possible
- **Tone**: Supportive, calm, direct. The user builds something that genuinely helps people in serious situations

## Gotchas
- `git commit` and `rm .git/**` are blocked in the Replit main agent sandbox — Replit auto-commits via checkpoints instead
- `git push github fresh-main:main` works (non-destructive) but may leave a stale `.git/refs/remotes/github/main.lock` — harmless, resolves on next checkpoint
- Attorney seed accounts (`attorney_1` through `attorney_N`) exist in the DB and must be excluded from abuse scan heuristics
- `demo-user-123` / `demo@caren.app` is a persistent demo account — treat as test data, not a real user
- TextBelt SMS credits are limited (45 as of 2026-05-03) — don't trigger test SMS calls unnecessarily
- The Learning Analytics tab hits a `column "effectiveness" does not exist` DB error — known issue, non-blocking
- Admin tabs are horizontally scrollable (`overflow-x-auto` flex row) — do NOT revert to `grid-cols-N`

## Pointers
- Health check skill: `server/healthCheck.ts`
- Pre-push script: `scripts/pre-push-check.sh`
- Deploy check script: `scripts/check-deployment.sh`
- Video check script: `scripts/check-videos.sh`
