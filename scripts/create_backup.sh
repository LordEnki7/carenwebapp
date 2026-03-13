#!/bin/bash

# C.A.R.E.N. Automated Backup and Verification Script
# Usage: ./scripts/create_backup.sh [milestone_name]

set -e

# Configuration
PROJECT_ROOT="/home/runner/workspace"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MILESTONE=${1:-"checkpoint"}
BACKUP_NAME="caren_${MILESTONE}_${TIMESTAMP}.tar.gz"

echo "🔄 C.A.R.E.N. Backup Policy - Creating Verified Backup"
echo "Milestone: $MILESTONE"
echo "Timestamp: $TIMESTAMP"
echo "---"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create timestamped backup
echo "📦 Creating backup archive..."
cd "$PROJECT_ROOT"
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
  --exclude=node_modules \
  --exclude=.git \
  --exclude="*.log" \
  --exclude=dist \
  --exclude=build \
  --exclude=backups/* \
  --exclude=.cache \
  --exclude=.replit \
  --exclude=.config \
  .

# Verify backup integrity
echo "🔍 Verifying backup integrity..."

# Check file size and count
BACKUP_SIZE=$(ls -lh "$BACKUP_DIR/$BACKUP_NAME" | awk '{print $5}')
FILE_COUNT=$(tar -tzf "$BACKUP_DIR/$BACKUP_NAME" | wc -l)
echo "Backup size: $BACKUP_SIZE"
echo "Total files: $FILE_COUNT"

# Verify essential files
echo "📋 Checking essential files..."
ESSENTIAL_FILES=(
  "./package.json"
  "./PROJECT_SUMMARY.md"
  "./BACKUP_POLICY.md"
  "./shared/schema.ts"
  "./server/seed.ts"
  "./client/src/pages/Rights.tsx"
  "./client/src/hooks/useGeolocation.ts"
  "./client/src/components/LocationAwareLegalRights.tsx"
  "./client/src/pages/Record.tsx"
)

MISSING_FILES=()
for file in "${ESSENTIAL_FILES[@]}"; do
  if tar -tzf "$BACKUP_DIR/$BACKUP_NAME" | grep -q "^$file$"; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file"
    MISSING_FILES+=("$file")
  fi
done

# Check key components
echo "🔧 Verifying key components..."
GPS_COMPONENTS=$(tar -tzf "$BACKUP_DIR/$BACKUP_NAME" | grep -E "(useGeolocation|LocationAware)" | wc -l)
LEGAL_COMPONENTS=$(tar -tzf "$BACKUP_DIR/$BACKUP_NAME" | grep -E "(Rights\.tsx|seed\.ts)" | wc -l)
RECORDING_COMPONENTS=$(tar -tzf "$BACKUP_DIR/$BACKUP_NAME" | grep -E "Record\.tsx" | wc -l)
echo "GPS components: $GPS_COMPONENTS found"
echo "Legal system components: $LEGAL_COMPONENTS found"
echo "Recording components: $RECORDING_COMPONENTS found"

# Test file extraction
echo "📄 Testing file extraction..."
if tar -xOf "$BACKUP_DIR/$BACKUP_NAME" ./PROJECT_SUMMARY.md >/dev/null 2>&1; then
  echo "  ✅ PROJECT_SUMMARY.md extraction successful"
else
  echo "  ❌ PROJECT_SUMMARY.md extraction failed"
fi

SEED_STATES=$(tar -xOf "$BACKUP_DIR/$BACKUP_NAME" ./server/seed.ts 2>/dev/null | grep -c "state:" || echo "0")
echo "  📊 Legal database states: $SEED_STATES"

# Final validation
echo "🎯 Final Validation"
VALIDATION_PASSED=true

BACKUP_SIZE_BYTES=$(stat -c%s "$BACKUP_DIR/$BACKUP_NAME")
if [ "$BACKUP_SIZE_BYTES" -lt 5242880 ]; then
  echo "❌ Backup size too small ($BACKUP_SIZE)"
  VALIDATION_PASSED=false
fi

if [ "$FILE_COUNT" -lt 100 ]; then
  echo "❌ Too few files ($FILE_COUNT)"
  VALIDATION_PASSED=false
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo "❌ Missing essential files: ${MISSING_FILES[*]}"
  VALIDATION_PASSED=false
fi

# Success confirmation
if [ "$VALIDATION_PASSED" = true ]; then
  echo "✅ Backup verification PASSED"
  echo "📁 Backup saved: $BACKUP_NAME"
  echo ""
  echo "🔄 Backup Policy Compliance: COMPLETE"
  echo "Your C.A.R.E.N. system is safely preserved and verified."
else
  echo "❌ Backup verification FAILED"
  echo "Please review the errors above and retry."
  exit 1
fi

# Cleanup old backups
echo "🧹 Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t caren_*.tar.gz | tail -n +11 | xargs -r rm -f
echo "Cleanup complete - keeping 10 most recent backups"

echo ""
echo "🎉 Backup and verification process complete!"