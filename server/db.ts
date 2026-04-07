import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon, neonConfig } from "@neondatabase/serverless";
import pgPkg from "pg";

const { Pool } = pgPkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const isNeon = process.env.DATABASE_URL.includes("neon.tech");

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;
let rawPool: InstanceType<typeof Pool> | null = null;

if (isNeon) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql);
  console.log("[DB] Connected using Neon serverless driver");
} else {
  rawPool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(rawPool);
  console.log("[DB] Connected using standard PostgreSQL driver");
}

/**
 * Safely adds any missing columns to the users table.
 * Uses IF NOT EXISTS so it's safe to run on every startup.
 * This handles production databases that may be behind on schema changes.
 */
export async function runAutoMigrations(): Promise<void> {
  const migrations = [
    // Apple Sign In support
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id VARCHAR`,
    // Terms acceptance tracking
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMP`,
    // Profile fields that may be missing on older deployments
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR DEFAULT 'en'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS current_state VARCHAR`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'basic_guard'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user'`,
  ];

  try {
    if (isNeon) {
      const sql = neon(process.env.DATABASE_URL!);
      for (const migration of migrations) {
        try {
          await sql(migration);
        } catch (e: any) {
          // Log but don't crash — column may already exist with different constraints
          if (!e.message?.includes('already exists')) {
            console.warn(`[MIGRATION] Warning for: ${migration.slice(0, 60)}...`, e.message);
          }
        }
      }
    } else if (rawPool) {
      const client = await rawPool.connect();
      try {
        for (const migration of migrations) {
          try {
            await client.query(migration);
          } catch (e: any) {
            if (!e.message?.includes('already exists')) {
              console.warn(`[MIGRATION] Warning for: ${migration.slice(0, 60)}...`, e.message);
            }
          }
        }
      } finally {
        client.release();
      }
    }
    console.log("[MIGRATION] Auto-migrations completed successfully");
  } catch (error) {
    console.error("[MIGRATION] Auto-migration error (non-fatal):", error);
  }
}

export { db };
