#!/usr/bin/env bash
# ============================================================
# C.A.R.E.N.™ Deployment Readiness Checks
# Catches the most common causes of silent production failures
# Run: bash scripts/check-deployment.sh
# Also called automatically by: bash scripts/pre-push-check.sh
# ============================================================

PASS=0; FAIL=0; WARN=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
header() { echo -e "\n${CYAN}${BOLD}▸ $1${RESET}"; }
ok()     { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS+1)); }
fail()   { echo -e "  ${RED}✗ FAIL${RESET} $1"; FAIL=$((FAIL+1)); }
warn()   { echo -e "  ${YELLOW}⚠ WARN${RESET} $1"; WARN=$((WARN+1)); }
hint()   { echo -e "     ${YELLOW}→ $1${RESET}"; }

# ── 1. Required environment variables ────────────────────────────────────────
# Missing env vars cause silent failures at runtime — not build time.
# A missing STRIPE_SECRET_KEY won't stop the server from starting; it just
# makes every payment silently fail.
header "Required environment variables"

check_env() {
  local VAR="$1"
  local IMPACT="$2"
  local VAL="${!VAR:-}"
  if [ -z "$VAL" ]; then
    fail "$VAR is not set"
    hint "Impact: $IMPACT"
  else
    # Show first 8 chars + stars so you can confirm it's the right key without exposing it
    PREVIEW="${VAL:0:8}..."
    ok "$VAR is set ($PREVIEW)"
  fi
}

check_env "DATABASE_URL"         "Server won't start — no database connection"
check_env "STRIPE_SECRET_KEY"    "All payments silently fail"
check_env "GOOGLE_CLIENT_ID"     "Google sign-in broken for all users"
check_env "GOOGLE_CLIENT_SECRET" "Google sign-in broken for all users"

# Email provider — SendGrid is the production provider
# IMPORTANT: MAILTRAP_TOKEN is a SANDBOX/TESTING token only.
#            It captures emails in Mailtrap's test inbox and NEVER delivers to real users.
#            Directors, attorneys, and users will not receive any emails if only Mailtrap is set.
SENDGRID="${SENDGRID_API_KEY:-}"
MAILTRAP="${MAILTRAP_TOKEN:-}"

if [ -n "$SENDGRID" ]; then
  ok "SENDGRID_API_KEY set — real emails will be delivered to recipients"
else
  fail "SENDGRID_API_KEY not set — no emails will be delivered to real users"
  hint "Impact: director messages, attorney drip, emergency alerts, invite emails all silently fail"
fi

if [ -n "$MAILTRAP" ] && [ -z "$SENDGRID" ]; then
  fail "MAILTRAP_TOKEN is set but SENDGRID_API_KEY is missing"
  hint "Mailtrap sandbox ONLY captures test emails — real users never receive them"
  hint "Add SENDGRID_API_KEY to your Dokploy environment variables"
elif [ -n "$MAILTRAP" ]; then
  warn "MAILTRAP_TOKEN is set — this is a sandbox-only token; ensure you're using SENDGRID_API_KEY for real delivery"
fi

# ── 2. Stripe key environment mismatch ───────────────────────────────────────
# Test keys (pk_test_ / sk_test_) in a production build mean real users get
# a "card declined" error on every transaction even with valid cards.
header "Stripe key environment"

STRIPE_SECRET="${STRIPE_SECRET_KEY:-}"
STRIPE_PUBLIC="${VITE_STRIPE_PUBLIC_KEY:-}"
NODE_ENV_VAL="${NODE_ENV:-development}"

if [ -n "$STRIPE_SECRET" ]; then
  if echo "$STRIPE_SECRET" | grep -q "^sk_test_"; then
    if [ "$NODE_ENV_VAL" = "production" ]; then
      fail "STRIPE_SECRET_KEY is a TEST key but NODE_ENV=production"
      hint "Real users will not be charged — switch to live key (sk_live_...)"
    else
      warn "STRIPE_SECRET_KEY is a test key (ok for dev, must switch for production)"
    fi
  elif echo "$STRIPE_SECRET" | grep -q "^sk_live_"; then
    ok "STRIPE_SECRET_KEY is a live key"
  fi
fi

if [ -n "$STRIPE_PUBLIC" ]; then
  if echo "$STRIPE_PUBLIC" | grep -q "^pk_test_"; then
    if [ "$NODE_ENV_VAL" = "production" ]; then
      fail "VITE_STRIPE_PUBLIC_KEY is a TEST key but NODE_ENV=production"
      hint "Payment form will fail for real users — switch to live key (pk_live_...)"
    else
      warn "VITE_STRIPE_PUBLIC_KEY is a test key (ok for dev, must switch for production)"
    fi
  elif echo "$STRIPE_PUBLIC" | grep -q "^pk_live_"; then
    ok "VITE_STRIPE_PUBLIC_KEY is a live key"
  fi
fi

# ── 3. Untracked files in client/public/ ─────────────────────────────────────
# Any file in client/public/ that isn't committed to git will be missing from
# the Dokploy container — exactly what caused the "Video unavailable" issue.
header "Public asset git tracking"

UNTRACKED=0
for ASSET in client/public/*; do
  # Skip directories
  [ -f "$ASSET" ] || continue
  BASENAME=$(basename "$ASSET")
  if ! git ls-files --error-unmatch "$ASSET" > /dev/null 2>&1; then
    fail "$BASENAME is NOT tracked by git → will be missing after Dokploy deploy"
    hint "Fix: git add $ASSET  (and add an exception to .gitignore if needed)"
    UNTRACKED=$((UNTRACKED+1))
  fi
done
if [ "$UNTRACKED" -eq 0 ]; then
  COUNT=$(git ls-files client/public/ | wc -l | tr -d ' ')
  ok "All $COUNT files in client/public/ are tracked by git"
fi

# ── 4. Google OAuth production callback URL ───────────────────────────────────
# Google OAuth requires the exact redirect URI to be registered in Google Cloud
# Console. Wrong domain = "redirect_uri_mismatch" for every user signing in.
header "Google OAuth configuration"

GCLIENT="${GOOGLE_CLIENT_ID:-}"
if [ -z "$GCLIENT" ]; then
  warn "GOOGLE_CLIENT_ID not set — skipping OAuth callback check"
else
  ok "GOOGLE_CLIENT_ID is set"
  echo ""
  echo -e "  ${YELLOW}Manual verification required:${RESET}"
  echo    "  Go to https://console.cloud.google.com → APIs & Services → Credentials"
  echo    "  → Your OAuth 2.0 Client → Authorized redirect URIs"
  echo    "  Confirm these are listed:"
  echo -e "    ${BOLD}https://carenalert.com/api/auth/google/callback${RESET}"
  echo -e "    ${BOLD}http://localhost:5000/api/auth/google/callback${RESET}  (dev)"
fi

# ── 5. Database connection reachable ─────────────────────────────────────────
# Confirms the DATABASE_URL actually connects — wrong password or host in
# Dokploy env vars causes immediate server crash on startup.
header "Database connection"

DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ]; then
  fail "DATABASE_URL not set — database check skipped"
else
  # Extract host from URL for a quick TCP check
  DB_HOST=$(echo "$DB_URL" | sed 's|.*@\([^/:]*\).*|\1|')
  if node -e "
    const { Client } = require('pg');
    const c = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    c.connect().then(() => { console.log('ok'); c.end(); }).catch(e => { console.log('fail:' + e.message); process.exit(1); });
  " 2>/dev/null | grep -q "^ok"; then
    ok "Database connection successful (host: $DB_HOST)"
  else
    fail "Cannot connect to database (host: $DB_HOST)"
    hint "Check DATABASE_URL in your Dokploy environment variables"
    hint "Verify the DB host allows connections from the deployment server"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}${PASS} passed${RESET}  ${YELLOW}${WARN} warnings${RESET}  ${RED}${FAIL} failed${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}${BOLD}✗ Deployment issues found — fix failures above before pushing.${RESET}"
  exit 1
else
  echo -e "${GREEN}${BOLD}✓ Deployment checks passed.${RESET}"
  exit 0
fi
