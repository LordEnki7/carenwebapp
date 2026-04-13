#!/usr/bin/env bash
# ============================================================
# C.A.R.E.N.™ Pre-Push Validation Checklist
# Run manually: bash scripts/pre-push-check.sh
# Installed as: .git/hooks/pre-push  (runs automatically on git push)
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

PASS=0
FAIL=0
WARN=0
BASE="http://localhost:5000"

header()  { echo -e "\n${CYAN}${BOLD}▸ $1${RESET}"; }
ok()      { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS+1)); }
fail()    { echo -e "  ${RED}✗${RESET} $1"; FAIL=$((FAIL+1)); }
warn()    { echo -e "  ${YELLOW}⚠${RESET} $1"; WARN=$((WARN+1)); }

echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  C.A.R.E.N.™ Pre-Push Validation${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# ── 1. TypeScript check ──────────────────────────────────────
header "TypeScript"
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  fail "TypeScript errors found (run: npx tsc --noEmit)"
else
  ok "No TypeScript errors"
fi

# ── 2. Server is running ─────────────────────────────────────
header "Server health"
if ! curl -sf --max-time 5 "$BASE/api/auth/user" > /dev/null 2>&1; then
  # 401 is fine — server is running but user not authenticated
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE/api/auth/user" 2>/dev/null || echo "000")
  if [ "$HTTP" = "401" ] || [ "$HTTP" = "200" ]; then
    ok "Server running (HTTP $HTTP on /api/auth/user)"
  else
    fail "Server not responding or returned unexpected status $HTTP"
  fi
else
  ok "Server running and /api/auth/user responding"
fi

# ── 3. Subscription plans API ────────────────────────────────
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE/api/subscription-plans" 2>/dev/null || echo "000")
if [ "$HTTP" = "200" ] || [ "$HTTP" = "304" ]; then
  ok "Subscription plans API responding (HTTP $HTTP)"
else
  fail "Subscription plans API not responding (HTTP $HTTP)"
fi

# ── 4. Video quality + format checks ─────────────────────────
header "Video format validation (codec, faststart, size, HTTP 206)"
if bash scripts/check-videos.sh 2>&1 | grep -q "^  FAIL"; then
  fail "Video format issues detected — run: bash scripts/check-videos.sh"
else
  ok "All video files: H.264, moov-first, proxy-safe, HTTP 206 OK"
fi
echo ""
echo "  ⚠  Note: Browser video playback in Replit dev URL is a known"
echo "     proxy limitation. Verify actual playback on carenalert.com"

# ── 5. Director routes ───────────────────────────────────────
header "Director system"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE/api/directors/leaderboard" 2>/dev/null || echo "000")
if [ "$HTTP" = "200" ] || [ "$HTTP" = "304" ]; then
  ok "Director leaderboard API responding"
else
  warn "Director leaderboard returned HTTP $HTTP (may need admin key)"
fi

# ── 6. Attorney outreach drip route registered ───────────────
header "Attorney drip system"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  -X POST -H "x-admin-key: CAREN_ADMIN_2025_PRODUCTION" \
  "$BASE/api/attorney-network/outreach/99999/drip" 2>/dev/null || echo "000")
if [ "$HTTP" = "404" ] || [ "$HTTP" = "403" ]; then
  ok "Drip email route registered (HTTP $HTTP for non-existent lead)"
elif [ "$HTTP" = "000" ]; then
  fail "Could not reach drip email route"
else
  ok "Drip email route responding (HTTP $HTTP)"
fi

# ── 7. Sign-in page renders ──────────────────────────────────
header "Frontend"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE/" 2>/dev/null || echo "000")
if [ "$HTTP" = "200" ]; then
  ok "Frontend root (/) rendering"
else
  fail "Frontend root returned HTTP $HTTP"
fi

# ── 8. .gitignore safety check ───────────────────────────────
header "Git safety checks"
if grep -q "\.github/workflows" .gitignore 2>/dev/null; then
  ok ".github/workflows/ is excluded from git (prevents workflow scope error)"
else
  warn ".github/workflows/ is NOT in .gitignore — push will fail without 'workflow' token scope"
fi

if grep -q "\*\.mp4" .gitignore 2>/dev/null; then
  ok "*.mp4 files excluded from git (large files won't bloat repo)"
else
  warn "*.mp4 not in .gitignore — large video files may be committed"
fi

# ── Summary ──────────────────────────────────────────────────
echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}${PASS} passed${RESET}  ${YELLOW}${WARN} warnings${RESET}  ${RED}${FAIL} failed${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}${BOLD}✗ Pre-push checks FAILED — fix the issues above before pushing.${RESET}\n"
  exit 1
else
  echo -e "${GREEN}${BOLD}✓ All checks passed — safe to push.${RESET}\n"
  exit 0
fi
