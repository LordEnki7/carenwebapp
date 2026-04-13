#!/usr/bin/env bash
# Video validation — runs as part of pre-push checks
# Checks: git tracking, file presence, HTTP 206, moov atom, codec, size
#
# WHY EACH CHECK EXISTS:
#   git tracked   → File not in git = file not in Dokploy container = "Video unavailable"
#   file present  → Sanity check before anything else
#   HTTP 206      → Browser needs range-request support to stream efficiently
#   moov atom     → Must be at START of file or browser can't decode until full download
#   H.264 codec   → Only codec supported everywhere without plugins
#   file size     → >50MB files timeout through reverse proxies

FFPROBE=/nix/store/3zc5jbvqzrn8zmva4fx5p0nh4yy03wk4-ffmpeg-6.1.1-bin/bin/ffprobe
BASE="http://localhost:5000"
PASS=0; FAIL=0; WARN=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'
ok()   { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✗ FAIL${RESET} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}⚠ WARN${RESET} $1"; WARN=$((WARN+1)); }

for VIDEO in caren-hero caren-short caren-attorney; do
  FILE="client/public/${VIDEO}.mp4"
  echo ""
  echo -e "${BOLD}--- ${VIDEO}.mp4 ---${RESET}"

  # ── Check 1: Git tracking ────────────────────────────────────────────────
  # This is the #1 deployment killer — file on disk but not in git means
  # Dokploy/Docker builds will never have it, causing "Video unavailable"
  if git ls-files --error-unmatch "$FILE" > /dev/null 2>&1; then
    ok "tracked by git → will be included in Dokploy/Docker deployments"
  else
    fail "NOT tracked by git → Dokploy deploy will NOT have this file → 'Video unavailable'"
    echo -e "     ${YELLOW}Fix: add '!${VIDEO}.mp4' to .gitignore exceptions, then git add $FILE${RESET}"
  fi

  # ── Check 2: File exists on disk ─────────────────────────────────────────
  if [ ! -f "$FILE" ]; then
    fail "file missing: $FILE"
    continue
  fi

  # ── Check 3: HTTP 206 range request ──────────────────────────────────────
  if curl -s --max-time 5 "$BASE/${VIDEO}.mp4" > /dev/null 2>&1; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
      -H "Range: bytes=0-1023" "$BASE/${VIDEO}.mp4" 2>/dev/null || echo "000")
    if [ "$STATUS" = "206" ]; then
      ok "HTTP 206 range streaming supported"
    elif [ "$STATUS" = "200" ]; then
      warn "HTTP 200 only — no range support, browser downloads full file before playing"
    elif [ "$STATUS" = "404" ]; then
      fail "HTTP 404 — server route missing or file not in public/ directory"
    else
      fail "HTTP $STATUS — unexpected server response"
    fi
  else
    warn "server not reachable at $BASE — skipping HTTP check (run server first)"
  fi

  # ── Check 4: moov atom position ──────────────────────────────────────────
  ATOM=$(node -e "
    const fs=require('fs');
    try {
      const fd=fs.openSync('${FILE}','r');
      const buf=Buffer.alloc(8);
      fs.readSync(fd,buf,0,8,0);
      const a1=buf.slice(4,8).toString('ascii');
      const sz=buf.readUInt32BE(0);
      fs.readSync(fd,buf,0,8,sz);
      const a2=buf.slice(4,8).toString('ascii');
      fs.closeSync(fd);
      process.stdout.write(a1+','+a2);
    } catch(e) { process.stdout.write('error'); }
  " 2>/dev/null)
  if echo "$ATOM" | grep -q "moov"; then
    ok "moov atom at start (faststart) — browser can decode immediately"
  elif echo "$ATOM" | grep -q "mdat"; then
    fail "moov atom at END — browser must download full file before playing"
    echo -e "     ${YELLOW}Fix: ffmpeg -i $FILE -c copy -movflags faststart /tmp/fixed.mp4 && mv /tmp/fixed.mp4 $FILE${RESET}"
  else
    warn "atom structure unclear ($ATOM) — verify file is a valid mp4"
  fi

  # ── Check 5: H.264 codec ─────────────────────────────────────────────────
  if command -v "$FFPROBE" >/dev/null 2>&1; then
    CODEC=$("$FFPROBE" -v error -select_streams v:0 \
      -show_entries stream=codec_name -of csv=p=0 \
      "$FILE" 2>/dev/null | tr -d '\n')
    if [ "$CODEC" = "h264" ]; then
      ok "codec=h264 (plays in all browsers)"
    elif [ "$CODEC" = "hevc" ] || [ "$CODEC" = "h265" ]; then
      fail "codec=hevc — Chrome on Windows/Linux will not play this without hardware support"
    elif [ -z "$CODEC" ]; then
      warn "could not detect codec — verify file is a valid mp4"
    else
      warn "codec=$CODEC — check browser compatibility before deploying"
    fi
  else
    warn "ffprobe not available — skipping codec check"
  fi

  # ── Check 6: File size ───────────────────────────────────────────────────
  SIZE=$(stat -c%s "$FILE" 2>/dev/null || stat -f%z "$FILE" 2>/dev/null || echo 0)
  SIZE_MB=$((SIZE / 1048576))
  if [ "$SIZE_MB" -lt 25 ]; then
    ok "size=${SIZE_MB}MB — good (under 25MB)"
  elif [ "$SIZE_MB" -lt 50 ]; then
    warn "size=${SIZE_MB}MB — may be slow through reverse proxies; consider re-encoding at lower bitrate"
  else
    fail "size=${SIZE_MB}MB — too large (re-encode: ffmpeg -i $FILE -crf 28 -vf scale=1280:-2 /tmp/out.mp4)"
  fi

done

echo ""
echo "============================================"
echo -e "Results: ${GREEN}$PASS passed${RESET} | ${YELLOW}$WARN warnings${RESET} | ${RED}$FAIL failed${RESET}"
echo ""
if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}✗ Deployment will have broken video playback. Fix failures above before pushing.${RESET}"
else
  echo -e "${GREEN}✓ Videos are deployment-ready.${RESET}"
fi
echo ""
echo "Note: Browser video playback through the Replit dev URL is not testable"
echo "here due to proxy limitations. Verify visually on: https://carenalert.com"
echo "============================================"
echo ""

[ "$FAIL" -eq 0 ]
