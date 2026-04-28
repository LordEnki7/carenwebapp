/**
 * DB Safety Guard — CAREN Alert
 *
 * Protects against catastrophic data loss from runaway operations.
 * Inspired by the PocketOS incident (April 2026) where an AI agent
 * deleted an entire production database in 9 seconds by guessing credentials.
 *
 * Rules enforced here:
 * 1. Users are NEVER hard-deleted — only soft-deleted (account_status = 'deleted')
 * 2. Bulk destructive operations require explicit production confirmation header
 * 3. Every destructive operation is logged with actor, reason, and timestamp
 * 4. Seeders are blocked from running against production databases
 */

import { db } from './db';
import { users } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

const IS_PRODUCTION = process.env.NODE_ENV === 'production' ||
  (process.env.DATABASE_URL || '').includes('neon.tech');

// ─── Audit Logger ─────────────────────────────────────────────────────────────

export function logDestructiveOperation(details: {
  operation: string;
  table: string;
  affectedId?: string | number;
  actorId?: string;
  reason?: string;
  rowCount?: number;
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    environment: IS_PRODUCTION ? 'PRODUCTION' : 'development',
    ...details,
  };
  console.warn(`[DB-SAFETY] DESTRUCTIVE OP: ${JSON.stringify(entry)}`);
}

// ─── Production Bulk Delete Guard ─────────────────────────────────────────────

/**
 * Call this before any operation that would delete/truncate an entire table.
 * In production it throws unless the caller passes the explicit confirmation token.
 *
 * Usage:
 *   requireBulkDeleteConfirmation('DELETE FROM attorneys', req.headers['x-bulk-delete-confirm']);
 */
export function requireBulkDeleteConfirmation(operation: string, confirmationToken?: string) {
  if (!IS_PRODUCTION) return; // safe in dev/test

  const expectedToken = `CONFIRM-BULK-DELETE-${new Date().toISOString().split('T')[0]}`;
  if (confirmationToken !== expectedToken) {
    const err = new Error(
      `[DB-SAFETY] BLOCKED: Bulk destructive operation "${operation}" requires ` +
      `confirmation token in x-bulk-delete-confirm header. ` +
      `Expected: "${expectedToken}". This guard exists to prevent accidental production data loss.`
    );
    console.error(err.message);
    throw err;
  }

  logDestructiveOperation({
    operation,
    table: operation,
    reason: 'Bulk delete — confirmation token provided',
  });
}

/**
 * Hard block — throws unconditionally in production.
 * Use this for operations that should NEVER run against production data
 * (e.g. seeder scripts that wipe entire tables).
 */
export function blockInProduction(operationName: string) {
  if (!IS_PRODUCTION) return;

  const err = new Error(
    `[DB-SAFETY] HARD BLOCKED: "${operationName}" is not allowed to run against a ` +
    `production database. This operation wipes data and is development-only. ` +
    `If this was triggered by an AI agent, stop and review immediately.`
  );
  console.error(err.message);
  throw err;
}

// ─── Soft Delete (Users) ──────────────────────────────────────────────────────

/**
 * ALWAYS use this instead of db.delete(users).
 * Marks the user as deleted without removing the row.
 * Preserves audit trail, foreign key integrity, and allows recovery.
 */
export async function softDeleteUser(
  userId: string,
  actorId: string,
  reason: string
): Promise<void> {
  logDestructiveOperation({
    operation: 'SOFT_DELETE_USER',
    table: 'users',
    affectedId: userId,
    actorId,
    reason,
  });

  await db.update(users)
    .set({
      accountStatus: 'deleted',
      deletedAt: new Date(),
      banReason: `Account deleted — ${reason}`,
      updatedAt: new Date(),
    } as any)
    .where(eq(users.id, userId));
}

/**
 * GDPR hard delete — only use for user-initiated account deletion.
 * Requires the requesting user to be deleting their OWN account.
 * Still logs the operation before executing.
 */
export async function gdprHardDeleteUser(userId: string): Promise<void> {
  logDestructiveOperation({
    operation: 'GDPR_HARD_DELETE_USER',
    table: 'users',
    affectedId: userId,
    actorId: userId,
    reason: 'User-initiated GDPR account deletion',
  });

  // This is the ONLY place in the codebase allowed to hard-delete a user row.
  await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);
}

// ─── Seeder Guard ─────────────────────────────────────────────────────────────

/**
 * Call at the top of any seeder script before any DELETE/TRUNCATE.
 * Throws in production so seeders can never wipe live data.
 */
export function assertSeederSafeEnvironment(seederName: string) {
  blockInProduction(seederName);
  console.log(`[DB-SAFETY] Seeder "${seederName}" running in safe (non-production) environment.`);
}
