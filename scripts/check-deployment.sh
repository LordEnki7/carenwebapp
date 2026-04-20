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

# Email provider — Mailtrap sending API is the configured provider
MAILTRAP="${MAILTRAP_TOKEN:-}"

if [ -n "$MAILTRAP" ]; then
  ok "MAILTRAP_TOKEN set — emails will be delivered via Mailtrap sending API"
else
  fail "MAILTRAP_TOKEN not set — no emails will be delivered"
  hint "Impact: director messages, attorney drip, emergency alerts, invite emails all silently fail"
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

# ── 6. Version endpoint reachable ────────────────────────────────────────────
# /api/version shows build time — use this after every Dokploy deploy to
# confirm the NEW code is live: https://carenalert.com/api/version
header "Version endpoint"

VERSION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:5000/api/version 2>/dev/null)
if [ "$VERSION_STATUS" = "200" ]; then
  BUILD_TIME=$(curl -s http://localhost:5000/api/version 2>/dev/null | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).buildTime)}catch{console.log('?')}})" 2>/dev/null)
  ok "/api/version responding — server started at $BUILD_TIME"
  echo ""
  echo -e "  ${YELLOW}After every Dokploy deploy, open this URL to confirm new code is live:${RESET}"
  echo -e "  ${BOLD}  https://carenalert.com/api/version${RESET}"
else
  warn "/api/version not reachable (HTTP $VERSION_STATUS) — start the server first"
fi

# ── 7. Workflow files not staged for push ────────────────────────────────────
# The GitHub PAT does not have `workflow` scope. Any .github/workflows/ file
# staged in git will cause the push to be rejected by GitHub.
header "GitHub push safety"

WORKFLOW_STAGED=$(git ls-files --cached .github/workflows/ 2>/dev/null)
if [ -n "$WORKFLOW_STAGED" ]; then
  fail ".github/workflows/ files are staged — push will be REJECTED by GitHub"
  hint "Fix: git rm --cached .github/workflows/*.yml"
  hint "The PAT token does not have 'workflow' scope"
else
  ok "No .github/workflows/ files staged — push will succeed"
fi

# Confirm correct remote + branch
REMOTE_URL=$(git remote get-url github 2>/dev/null || echo "")
if [ -n "$REMOTE_URL" ]; then
  ok "GitHub remote 'github' → LordEnki7/carenwebapp"
  echo ""
  echo -e "  ${YELLOW}Push command:${RESET} git push github fresh-main:main"
else
  warn "GitHub remote 'github' not configured"
  hint "Run: git remote add github https://\$GITHUB_PERSONAL_ACCESS_TOKEN2@github.com/LordEnki7/carenwebapp.git"
fi

# ── 8. Production API health (carenalert.com) ────────────────────────────────
# Catches: broken Docker container, API routes returning HTML, server not running.
# This would have caught today's issue where /api/version returned HTML.
header "Production API health (carenalert.com)"

PROD_CONTENT_TYPE=$(curl -s -o /dev/null -w "%{content_type}" --max-time 8 https://carenalert.com/api/version 2>/dev/null || echo "")
PROD_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 https://carenalert.com/api/version 2>/dev/null || echo "000")

if [ "$PROD_HTTP" = "000" ]; then
  fail "carenalert.com is not reachable — server may be down"
elif echo "$PROD_CONTENT_TYPE" | grep -q "text/html"; then
  fail "carenalert.com/api/version returned HTML instead of JSON (HTTP $PROD_HTTP)"
  hint "The Express server is not handling API routes — Docker container may be broken"
  hint "Fix: re-deploy from Shell → bash scripts/deploy-to-dokploy.sh"
elif echo "$PROD_CONTENT_TYPE" | grep -q "application/json"; then
  PROD_COMMIT=$(curl -s --max-time 8 https://carenalert.com/api/version 2>/dev/null | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).commit||'?')}catch{console.log('?')}})" 2>/dev/null)
  ok "carenalert.com API is healthy — responding with JSON"

  # ── 9. Production commit matches local HEAD ───────────────────────────────
  # Catches: deploying then forgetting to push, or pushing but Dokploy not deploying.
  LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
  if [ "$PROD_COMMIT" = "$LOCAL_COMMIT" ]; then
    ok "Production is up to date — commit matches local HEAD ($PROD_COMMIT)"
  else
    PROD_SHORT="${PROD_COMMIT:0:7}"
    LOCAL_SHORT="${LOCAL_COMMIT:0:7}"
    warn "Production commit ($PROD_SHORT) does not match local HEAD ($LOCAL_SHORT)"
    hint "This means local changes have NOT been deployed yet"
    hint "Fix: bash scripts/deploy-to-dokploy.sh  then wait ~2 min for Dokploy"
  fi
else
  warn "carenalert.com/api/version returned unexpected content-type: $PROD_CONTENT_TYPE (HTTP $PROD_HTTP)"
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
