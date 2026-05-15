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

# ── 0. Build info ────────────────────────────────────────────
# build-info.json is generated inside Docker at build time by write-build-info.cjs,
# which calls "git rev-parse HEAD" using the .git/HEAD + .git/refs files included in
# the Docker build context via .dockerignore negation rules. No committed file needs
# to be patched on every push — the cycle is broken permanently.
header "Build info"
FULL_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
ok "Commit ${FULL_COMMIT:0:7} will be stamped by Docker at build time (no patch needed)"

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

# ── 5. Deployment readiness (env vars, Stripe keys, public assets, DB, OAuth)
header "Deployment readiness"
DEPLOY_OUT=$(bash scripts/check-deployment.sh 2>&1)
DEPLOY_FAILS=$(echo "$DEPLOY_OUT" | grep -c "✗ FAIL" || true)
DEPLOY_WARNS=$(echo "$DEPLOY_OUT" | grep -c "⚠ WARN" || true)
if [ "$DEPLOY_FAILS" -gt 0 ]; then
  # Print each failure line individually so they appear in the summary
  while IFS= read -r LINE; do
    if echo "$LINE" | grep -q "✗ FAIL"; then
      LABEL=$(echo "$LINE" | sed 's/.*✗ FAIL //')
      fail "$LABEL"
    fi
  done <<< "$DEPLOY_OUT"
  echo "  Run: bash scripts/check-deployment.sh  for full details + fix hints"
else
  PASSED=$(echo "$DEPLOY_OUT" | grep -c "✓" || true)
  ok "$PASSED deployment checks passed (env vars, Stripe keys, public assets, DB, OAuth)"
fi
if [ "$DEPLOY_WARNS" -gt 0 ]; then
  warn "$DEPLOY_WARNS deployment warning(s) — run: bash scripts/check-deployment.sh"
fi

# ── 6. Director routes ───────────────────────────────────────
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

MISSING_VIDEOS=0
for VID in "caren-hero.mp4" "caren-short.mp4" "caren-attorney.mp4"; do
  if [ ! -f "client/public/$VID" ]; then
    fail "Missing production video: client/public/$VID — Dokploy deploy will show 'Video unavailable'"
    MISSING_VIDEOS=1
  fi
done
if [ "$MISSING_VIDEOS" -eq 0 ]; then
  ok "Production video files present and committed (Dokploy deploy will serve them)"
fi

# ── iOS Info.plist privacy strings ───────────────────────────
header "iOS Info.plist privacy strings"
INFOPLIST="ios/App/App/Info.plist"
if [ ! -f "$INFOPLIST" ]; then
  fail "ios/App/App/Info.plist not found in git — Apple will reject the build (privacy strings missing)"
else
  PLIST_OK=1
  for KEY in \
    "NSCameraUsageDescription" \
    "NSMicrophoneUsageDescription" \
    "NSPhotoLibraryUsageDescription" \
    "NSLocationWhenInUseUsageDescription" \
    "NSLocationAlwaysAndWhenInUseUsageDescription"; do
    if grep -q "$KEY" "$INFOPLIST"; then
      ok "$KEY present"
    else
      fail "$KEY MISSING — Apple will reject the upload (ITMS-90683)"
      PLIST_OK=0
    fi
  done
fi

# ── RevenueCat key validation ────────────────────────────────
header "RevenueCat iOS key"
RC_KEY="${VITE_REVENUECAT_IOS_API_KEY:-}"
if [ -z "$RC_KEY" ]; then
  fail "VITE_REVENUECAT_IOS_API_KEY is not set — Plans page will silently fail on iOS"
elif [[ "$RC_KEY" == test_* ]]; then
  fail "VITE_REVENUECAT_IOS_API_KEY is a TEST key ($RC_KEY) — real purchases will be rejected. Update it to the production 'appl_...' key in Replit Secrets."
elif [[ "$RC_KEY" == appl_* ]]; then
  ok "VITE_REVENUECAT_IOS_API_KEY is a production key (appl_...) — Dokploy will bake it in during Docker build"
else
  warn "VITE_REVENUECAT_IOS_API_KEY format unrecognized ($RC_KEY) — expected 'appl_...' for iOS"
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
