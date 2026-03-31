import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pgPkg from "pg";

const { Pool } = pgPkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const isNeon = process.env.DATABASE_URL.includes("neon.tech");

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;

if (isNeon) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql);
  console.log("[DB] Connected using Neon serverless driver");
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(pool);
  console.log("[DB] Connected using standard PostgreSQL driver");
}

export { db };
