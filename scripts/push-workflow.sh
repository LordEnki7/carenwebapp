#!/usr/bin/env bash
# ============================================================
# Push the GitHub Actions build workflow to GitHub.
# Run from Replit Shell tab:
#   bash scripts/push-workflow.sh
# ============================================================

set -e
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'

echo ""
echo -e "${BOLD}C.A.R.E.N Alert — Push GitHub Actions Workflow${RESET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Refresh remote URL with current PAT
git remote set-url github "https://$GITHUB_PERSONAL_ACCESS_TOKEN2@github.com/LordEnki7/carenwebapp.git" 2>/dev/null || true

# Force-add the workflow file (it's in .gitignore, so -f is required)
echo -e "\n${YELLOW}Step 1 — Staging workflow file...${RESET}"
git add -f .github/workflows/build-aab.yml
echo -e "  ${GREEN}✓ Staged: .github/workflows/build-aab.yml${RESET}"

# Commit (needed because git push only pushes commits, not staged files)
echo -e "\n${YELLOW}Step 2 — Committing...${RESET}"
git config user.email "deploy@carenalert.com" 2>/dev/null || true
git config user.name "CAREN Deploy" 2>/dev/null || true
git commit -m "ci: add GitHub Actions workflow for Android AAB build" --no-verify || \
  echo -e "  ${GREEN}✓ Nothing new to commit (workflow unchanged)${RESET}"

# Push to GitHub
echo -e "\n${YELLOW}Step 3 — Pushing to GitHub...${RESET}"
if git push github fresh-main:main --no-verify; then
  echo ""
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${GREEN}${BOLD}✓ Workflow pushed to GitHub!${RESET}"
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  echo "  Next:"
  echo "  1. Go to github.com/LordEnki7/carenwebapp"
  echo "  2. Click the Actions tab"
  echo "  3. Click 'Build Android AAB for Google Play Store'"
  echo "  4. Click 'Run workflow' → Run workflow (green button)"
  echo ""
  echo "  The AAB and APK files will be ready to download in ~5 minutes."
  echo "  Download from the Actions run page under 'Artifacts'."
  echo ""
else
  echo ""
  echo -e "${RED}${BOLD}✗ Push failed — your GitHub token needs 'workflow' permission.${RESET}"
  echo ""
  echo "  Fix in 60 seconds:"
  echo "  1. Go to: https://github.com/settings/tokens"
  echo "  2. Find the token used as GITHUB_PERSONAL_ACCESS_TOKEN2"
  echo "  3. Click it → check the 'workflow' checkbox → Update token"
  echo "  4. If a new token value was generated, update it in Replit:"
  echo "     Click the padlock icon in the left sidebar → GITHUB_PERSONAL_ACCESS_TOKEN2"
  echo "  5. Run this script again"
  echo ""
fi
