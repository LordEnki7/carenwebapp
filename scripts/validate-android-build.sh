#!/bin/bash

# ============================================================
# C.A.R.E.N.™ Android Build Validator
# Run this before every Play Store upload to catch issues early
# Usage: bash scripts/validate-android-build.sh
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  ${GREEN}✔ PASS${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✘ FAIL${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}⚠ WARN${NC} $1"; WARN=$((WARN+1)); }
section() { echo -e "\n${CYAN}▶ $1${NC}"; }

echo ""
echo "============================================================"
echo "  C.A.R.E.N.™ Android Build Validator"
echo "============================================================"

# ── 1. WEB ASSETS ────────────────────────────────────────────
section "Web Assets (Capacitor WebDir)"

if [ -f "dist/public/index.html" ]; then
  pass "dist/public/index.html exists"
else
  fail "dist/public/index.html NOT FOUND — run 'npm run build' first"
fi

if [ -f "android/app/src/main/assets/public/index.html" ]; then
  pass "Android assets synced (index.html present)"
else
  fail "Android assets NOT synced — run 'npx cap sync android' first"
fi

# ── 2. CAPACITOR CONFIG ───────────────────────────────────────
section "Capacitor Config (capacitor.config.ts)"

CAP_APP_ID=$(grep -o "appId: '[^']*'" capacitor.config.ts | head -1 | cut -d"'" -f2)
GRADLE_APP_ID=$(grep 'applicationId "' android/app/build.gradle | head -1 | sed 's/.*applicationId "\([^"]*\)".*/\1/')

if [ "$CAP_APP_ID" = "$GRADLE_APP_ID" ]; then
  pass "App ID matches: $CAP_APP_ID"
else
  fail "App ID MISMATCH — capacitor.config.ts='$CAP_APP_ID' vs build.gradle='$GRADLE_APP_ID'"
fi

WEB_DIR=$(grep -o "webDir: '[^']*'" capacitor.config.ts | head -1 | cut -d"'" -f2)
if [ -d "$WEB_DIR" ]; then
  pass "webDir '$WEB_DIR' exists"
else
  fail "webDir '$WEB_DIR' does NOT exist"
fi

# ── 3. ANDROID MANIFEST ───────────────────────────────────────
section "AndroidManifest.xml"

MANIFEST="android/app/src/main/AndroidManifest.xml"

if grep -q "android.permission.INTERNET" "$MANIFEST"; then
  pass "INTERNET permission declared"
else
  fail "INTERNET permission missing from manifest"
fi

if grep -q "android:exported=\"true\"" "$MANIFEST"; then
  pass "MainActivity marked as exported (required for API 31+)"
else
  fail "MainActivity missing android:exported='true' — required for Android 12+"
fi

if grep -q "android.intent.action.MAIN" "$MANIFEST"; then
  pass "MAIN intent filter present"
else
  fail "MAIN intent filter missing — app won't appear in launcher"
fi

# ── 4. SPLASH SCREEN / STYLES ────────────────────────────────
section "Splash Screen & Styles"

STYLES="android/app/src/main/res/values/styles.xml"
COLORS="android/app/src/main/res/values/colors.xml"

if [ -f "$STYLES" ]; then
  pass "styles.xml exists"
else
  fail "styles.xml NOT FOUND"
fi

if [ -f "$COLORS" ]; then
  pass "colors.xml exists"
else
  fail "colors.xml NOT FOUND — referenced resources will crash the app"
fi

if grep -q "postSplashScreenTheme" "$STYLES" 2>/dev/null; then
  pass "postSplashScreenTheme defined (required for Android 12+)"
else
  fail "postSplashScreenTheme MISSING — app will crash on Android 12+ devices"
fi

if grep -q "windowSplashScreenBackground" "$STYLES" 2>/dev/null; then
  pass "windowSplashScreenBackground defined"
else
  warn "windowSplashScreenBackground not set — splash may look wrong on Android 12+"
fi

if grep -q "splash_background" "$COLORS" 2>/dev/null; then
  pass "splash_background color defined in colors.xml"
else
  fail "splash_background color missing from colors.xml"
fi

# Check splash drawable exists
if [ -f "android/app/src/main/res/drawable/splash.png" ] || \
   [ -f "android/app/src/main/res/drawable/splash.xml" ]; then
  pass "Splash drawable exists"
else
  fail "Splash drawable (splash.png or splash.xml) NOT FOUND"
fi

# ── 5. VERSION CODE ───────────────────────────────────────────
section "Version Code & Name"

VERSION_CODE=$(grep 'versionCode ' android/app/build.gradle | head -1 | grep -o '[0-9]*')
VERSION_NAME=$(grep 'versionName "' android/app/build.gradle | head -1 | sed 's/.*versionName "\([^"]*\)".*/\1/')

if [ -n "$VERSION_CODE" ]; then
  pass "versionCode: $VERSION_CODE"
else
  fail "versionCode not found in build.gradle"
fi

if [ -n "$VERSION_NAME" ]; then
  pass "versionName: $VERSION_NAME"
else
  fail "versionName not found in build.gradle"
fi

# ── 6. KEYSTORE ───────────────────────────────────────────────
section "Signing / Keystore"

KEYSTORE_PATH="android/caren-release.jks"
KEYSTORE_ALT="android/caren-release.jjs"

if [ -f "$KEYSTORE_PATH" ]; then
  pass "Keystore found: $KEYSTORE_PATH"
elif [ -f "$KEYSTORE_ALT" ]; then
  warn "Keystore found with wrong extension (.jjs instead of .jks): $KEYSTORE_ALT"
else
  fail "Keystore NOT FOUND at $KEYSTORE_PATH — release build will fail"
fi

if grep -q "signingConfig signingConfigs.release" android/app/build.gradle; then
  pass "Release signing config applied to release build type"
else
  fail "Release signing config not applied — APK/AAB will be unsigned"
fi

# ── 7. SDK VERSIONS ───────────────────────────────────────────
section "SDK Versions"

MIN_SDK=$(grep "minSdkVersion" android/variables.gradle | grep -o '[0-9]*')
TARGET_SDK=$(grep "targetSdkVersion" android/variables.gradle | grep -o '[0-9]*')
COMPILE_SDK=$(grep "compileSdkVersion" android/variables.gradle | grep -o '[0-9]*')

if [ "$TARGET_SDK" -ge "34" ] 2>/dev/null; then
  pass "targetSdkVersion $TARGET_SDK meets Google Play requirement (≥34)"
else
  fail "targetSdkVersion $TARGET_SDK is below Google Play requirement (must be ≥34)"
fi

if [ "$COMPILE_SDK" -ge "34" ] 2>/dev/null; then
  pass "compileSdkVersion $COMPILE_SDK"
else
  warn "compileSdkVersion $COMPILE_SDK — should match or exceed targetSdkVersion"
fi

pass "minSdkVersion $MIN_SDK"

# ── 8. CRITICAL FILES ─────────────────────────────────────────
section "Critical Required Files"

FILES=(
  "android/app/src/main/java/com/caren/app/MainActivity.java"
  "android/app/src/main/res/values/strings.xml"
  "android/app/build.gradle"
  "android/variables.gradle"
  "android/gradlew"
)

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    pass "$f"
  else
    fail "$f NOT FOUND"
  fi
done

# ── SUMMARY ───────────────────────────────────────────────────
echo ""
echo "============================================================"
echo -e "  Results: ${GREEN}$PASS passed${NC}  ${RED}$FAIL failed${NC}  ${YELLOW}$WARN warnings${NC}"
echo "============================================================"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\n  ${RED}BUILD BLOCKED — Fix all FAIL items before uploading to Play Store.${NC}"
  echo ""
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "\n  ${YELLOW}Build can proceed but review warnings above.${NC}"
  echo ""
  exit 0
else
  echo -e "\n  ${GREEN}All checks passed — safe to build and upload to Play Store!${NC}"
  echo ""
  exit 0
fi
