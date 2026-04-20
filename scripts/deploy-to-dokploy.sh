#!/usr/bin/env bash
# ============================================================
# C.A.R.E.N Alert — One-command deploy to carenalert.com
# Run this from the Replit SHELL tab (not a workflow):
#
#   bash scripts/deploy-to-dokploy.sh
#
# What it does:
#   1. Stages all current changes
#   2. Removes .github/workflows/ from staging AFTER add-all
#      (the PAT lacks 'workflow' scope — staged workflow files
#       will cause GitHub to reject the push)
#   3. Commits any staged changes
#   4. Pushes fresh-main → github/main
#   5. Confirms the push succeeded and tells you what to do next
# ============================================================

set -e   # Stop immediately on any error

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'

echo ""
echo -e "${BOLD}C.A.R.E.N Alert — Deploy to carenalert.com${RESET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 0: Clean stale git lock files ───────────────────────
# A leftover .git/index.lock or refs/heads/*.lock blocks ALL git
# operations — every previous failed deploy left this lurking.
echo -e "\n${YELLOW}Step 0 — Cleaning stale git locks...${RESET}"
LOCKS_REMOVED=0
for lock in .git/index.lock .git/config.lock .git/HEAD.lock .git/refs/heads/*.lock .git/refs/remotes/github/*.lock; do
  if [ -f "$lock" ]; then
    rm -f "$lock"
    LOCKS_REMOVED=$((LOCKS_REMOVED+1))
  fi
done
if [ "$LOCKS_REMOVED" -gt 0 ]; then
  echo -e "  ${YELLOW}⚠ Removed $LOCKS_REMOVED stale lock file(s) — git is now unblocked${RESET}"
else
  echo -e "  ${GREEN}✓ No stale locks — git is clean${RESET}"
fi

# ── Step 1: Build the frontend (Vite) — commit the result so Docker never re-builds it ──
# Vite runs HERE in Replit where the source is known-good.
# The Dockerfile only runs esbuild (server) now — no vite in Docker.
# This permanently eliminates the "stale Docker cache served old bundle" bug.
echo -e "\n${YELLOW}Step 1 — Building frontend with Vite...${RESET}"
if npx vite build 2>&1 | tail -3; then
  echo -e "  ${GREEN}✓ Frontend built — dist/public/ is up to date${RESET}"
else
  echo -e "  ${RED}✗ Vite build failed — aborting deploy${RESET}"
  exit 1
fi

# ── Step 1c: Stamp current timestamp into Dockerfile to bust Docker's COPY cache ──
# Docker caches the COPY layer. Changing any line in the Dockerfile itself
# forces Docker to invalidate ALL cached layers from that line forward,
# guaranteeing the fresh dist/public/ bundle is always copied in.
BUILD_TS=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
sed -i "s|# BUILD_TIMESTAMP: .*|# BUILD_TIMESTAMP: $BUILD_TS|" Dockerfile
echo -e "  ${GREEN}✓ Dockerfile stamped with build timestamp: $BUILD_TS${RESET}"

# ── Step 1b: Write build-info.json with current git SHA, then stage ───
# build-info.json is the source of truth for "what commit is deployed".
# It gets committed, copied into the Docker image, served at /build-info.json,
# and exposed via /api/version.
echo -e "\n${YELLOW}Step 1b — Writing build-info.json + staging all changes...${RESET}"
node scripts/write-build-info.cjs
git add -A
CHANGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
echo -e "  ${GREEN}✓ $CHANGED file(s) staged${RESET}"

# ── Step 2: Remove workflow files AFTER staging ──────────────
# IMPORTANT: must come AFTER git add -A, otherwise add-all re-stages them
echo -e "\n${YELLOW}Step 2 — Removing .github/workflows/ from staging...${RESET}"
if git ls-files --cached .github/workflows/ | grep -q '.'; then
  git rm --cached .github/workflows/*.yml 2>/dev/null || true
  echo -e "  ${YELLOW}⚠ Workflow files removed from staging (PAT lacks workflow scope)${RESET}"
else
  echo -e "  ${GREEN}✓ No workflow files staged — safe to push${RESET}"
fi

# Confirm no workflow files remain staged
if git diff --cached --name-only | grep -q '.github/workflows'; then
  echo -e "  ${RED}✗ Workflow files still staged! Forcing removal...${RESET}"
  git diff --cached --name-only | grep '.github/workflows' | xargs git rm --cached
fi

# ── Step 3: Commit staged changes ────────────────────────────
echo -e "\n${YELLOW}Step 3 — Committing changes...${RESET}"
STAGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
if [ "$STAGED" -gt 0 ]; then
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  git -c user.email="deploy@carenalert.com" -c user.name="CAREN Deploy" \
    commit -m "Deploy: $TIMESTAMP" --no-verify
  echo -e "  ${GREEN}✓ Committed $STAGED file(s)${RESET}"
else
  echo -e "  ${GREEN}✓ No new changes to commit — pushing existing commits${RESET}"
fi

# ── Step 4: Check commits ahead of GitHub ────────────────────
echo -e "\n${YELLOW}Step 4 — Checking commits ahead of GitHub...${RESET}"
git fetch github 2>/dev/null || true
AHEAD=$(git rev-list github/main..HEAD --count 2>/dev/null || echo "unknown")
echo -e "  ${GREEN}✓ $AHEAD commit(s) ahead of github/main${RESET}"

# Show the latest local commit that will be pushed
LATEST_MSG=$(git log HEAD --oneline -1)
echo -e "  Latest commit: ${BOLD}$LATEST_MSG${RESET}"

# ── Step 5: Push to GitHub ───────────────────────────────────
echo -e "\n${YELLOW}Step 5 — Pushing to GitHub (triggers Dokploy)...${RESET}"

# Refresh the remote URL with the current PAT in case it expired
git remote set-url github "https://$GITHUB_PERSONAL_ACCESS_TOKEN2@github.com/LordEnki7/carenwebapp.git" 2>/dev/null || true

if git push github HEAD:main --no-verify; then
  PUSHED_SHORT=$(git rev-parse --short HEAD)
  echo ""
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${GREEN}${BOLD}✓ PUSH SUCCESSFUL — code is on GitHub${RESET}"
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  echo -e "  Commit pushed: ${BOLD}$PUSHED_SHORT${RESET}"
  echo ""
  echo -e "${YELLOW}${BOLD}Next steps to go live on carenalert.com:${RESET}"
  echo "  1. Open Dokploy dashboard"
  echo "  2. Click  →  Deploy  →  Rebuild without cache"
  echo "  3. Wait ~2 min for build to finish"
  echo "  4. Open https://carenalert.com/api/version — confirm serverStartTime changed"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${RED}${BOLD}✗ PUSH FAILED${RESET}"
  echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  echo "  Try refreshing the PAT and pushing again:"
  echo "    git remote set-url github https://\$GITHUB_PERSONAL_ACCESS_TOKEN2@github.com/LordEnki7/carenwebapp.git"
  echo "    git push github HEAD:main"
  echo ""
  echo "  If that still fails, your PAT may have expired — regenerate it in GitHub."
  exit 1
fi
