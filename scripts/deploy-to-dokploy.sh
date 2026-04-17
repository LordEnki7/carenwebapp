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

# ── Step 1: Stage everything FIRST ───────────────────────────
echo -e "\n${YELLOW}Step 1 — Staging all changes...${RESET}"
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
  echo ""
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${GREEN}${BOLD}✓ PUSH SUCCESSFUL — Dokploy will now deploy!${RESET}"
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  echo "  Next steps:"
  echo "  1. Go to Dokploy dashboard → check build status"
  echo "  2. Once deployed, visit:"
  echo -e "     ${BOLD}https://carenalert.com/api/version${RESET}"
  echo "     to confirm the new code is live (timestamp will change)"
  echo "  3. Check the site at https://carenalert.com"
  echo ""
else
  echo ""
  echo -e "${RED}${BOLD}✗ PUSH FAILED${RESET}"
  echo ""
  echo "  Try refreshing the PAT and pushing again:"
  echo "  git remote set-url github https://\$GITHUB_PERSONAL_ACCESS_TOKEN2@github.com/LordEnki7/carenwebapp.git"
  echo "  git push github HEAD:main"
  echo ""
  echo "  If that still fails, check your PAT token hasn't expired in GitHub."
  exit 1
fi
