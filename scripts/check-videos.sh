#!/usr/bin/env bash
# Video format and server validation — runs as part of pre-push checks
# Tests: HTTP 206 range support, moov atom position, H.264 codec, file size
# NOTE: Browser playback in Replit dev proxy is a known limitation.
#       Verify actual playback on carenalert.com (production).

FFPROBE=/nix/store/3zc5jbvqzrn8zmva4fx5p0nh4yy03wk4-ffmpeg-6.1.1-bin/bin/ffprobe
BASE="http://localhost:5000"
PASS=0; FAIL=0; WARN=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; RESET='\033[0m'
ok()   { echo -e "  ${GREEN}PASS${RESET} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}FAIL${RESET} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}WARN${RESET} $1"; WARN=$((WARN+1)); }

for VIDEO in caren-hero caren-short caren-attorney; do
  echo ""
  echo "--- $VIDEO.mp4 ---"

  # 1. HTTP 206 Range request support
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "Range: bytes=0-1023" "$BASE/${VIDEO}.mp4" 2>/dev/null || echo "000")
  if [ "$STATUS" = "206" ]; then
    ok "HTTP 206 range request"
  elif [ "$STATUS" = "200" ]; then
    warn "HTTP 200 (no Range support) — browser may need to download full file"
  else
    fail "HTTP $STATUS on range request — server route may be broken"
  fi

  # 2. moov atom at beginning (faststart)
  ATOM=$(node -e "
    const fs=require('fs');
    try {
      const fd=fs.openSync('client/public/${VIDEO}.mp4','r');
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
    ok "moov atom at beginning (faststart) — browsers can read metadata from first bytes"
  elif echo "$ATOM" | grep -q "mdat"; then
    fail "moov atom at END — browser cannot decode video until full download (run ffmpeg -movflags faststart)"
  else
    warn "atom structure unclear: $ATOM"
  fi

  # 3. H.264 codec (required for all browsers without plugin)
  if command -v "$FFPROBE" >/dev/null 2>&1; then
    CODEC=$("$FFPROBE" -v error -select_streams v:0 \
      -show_entries stream=codec_name -of csv=p=0 \
      "client/public/${VIDEO}.mp4" 2>/dev/null | tr -d '\n')
    if [ "$CODEC" = "h264" ]; then
      ok "codec=h264 (universally supported)"
    elif [ "$CODEC" = "hevc" ] || [ "$CODEC" = "h265" ]; then
      fail "codec=hevc — Chrome on Windows/Linux won't play H.265 without hardware support"
    else
      warn "codec=$CODEC — verify browser compatibility"
    fi
  else
    warn "ffprobe not found — skipping codec check"
  fi

  # 4. File size < 25MB for dev proxy compatibility
  if [ -f "client/public/${VIDEO}.mp4" ]; then
    SIZE=$(stat -c%s "client/public/${VIDEO}.mp4" 2>/dev/null || stat -f%z "client/public/${VIDEO}.mp4" 2>/dev/null || echo 0)
    SIZE_MB=$((SIZE / 1048576))
    if [ "$SIZE_MB" -lt 25 ]; then
      ok "size=${SIZE_MB}MB — proxy-safe (<25MB)"
    elif [ "$SIZE_MB" -lt 50 ]; then
      warn "size=${SIZE_MB}MB — may timeout through Replit dev proxy; OK in production"
    else
      fail "size=${SIZE_MB}MB — too large for Replit dev proxy (re-encode with ffmpeg -crf 23)"
    fi
  else
    fail "file not found: client/public/${VIDEO}.mp4"
  fi
done

echo ""
echo "============================================"
echo "Results: $PASS passed | $WARN warnings | $FAIL failed"
echo ""
echo "IMPORTANT: Browser video playback in the Replit dev URL is a known proxy"
echo "limitation. To verify actual video playback, visit:"
echo "  https://carenalert.com  (production)"
echo "============================================"
echo ""

[ "$FAIL" -eq 0 ]
