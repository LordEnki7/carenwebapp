import type { Express } from "express";
import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { referrals, users } from "@shared/schema";
import { neon } from "@neondatabase/serverless";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Tier definitions ──────────────────────────────────────────────────────────
const REWARD_TIERS = [
  { tier: 1,  minReferrals: 1,  days: 7,   label: "1 week premium",       ambassador: false },
  { tier: 3,  minReferrals: 3,  days: 30,  label: "1 month premium",      ambassador: false },
  { tier: 10, minReferrals: 10, days: 90,  label: "3 months premium + Safety Ambassador", ambassador: true },
];

/**
 * Check a referrer's current converted count vs their already-granted tier.
 * Grants any new tiers they've crossed since last check.
 * Uses raw SQL so the new columns work even before Drizzle schema is updated.
 */
async function grantReferralRewards(referrerId: string): Promise<void> {
  try {
    const rawSql = neon(process.env.DATABASE_URL!);

    // Get their current referral_count and reward_tier
    const rows = await rawSql(
      `SELECT referral_count, referral_reward_tier, premium_expires_at
       FROM users WHERE id = $1`,
      [referrerId]
    );
    if (!rows.length) return;

    const row = rows[0] as any;
    const count: number = Number(row.referral_count ?? 0);
    const currentTier: number = Number(row.referral_reward_tier ?? 0);
    const existingExpiry: Date | null = row.premium_expires_at ? new Date(row.premium_expires_at) : null;

    // Find all tiers newly crossed
    const newTiers = REWARD_TIERS.filter(
      t => count >= t.minReferrals && currentTier < t.tier
    );
    if (!newTiers.length) return;

    // Stack all new days onto the expiry
    const totalDays = newTiers.reduce((sum, t) => sum + t.days, 0);
    const highestNewTier = Math.max(...newTiers.map(t => t.tier));
    const isAmbassador = newTiers.some(t => t.ambassador);

    const base = existingExpiry && existingExpiry > new Date() ? existingExpiry : new Date();
    const newExpiry = new Date(base);
    newExpiry.setDate(newExpiry.getDate() + totalDays);

    await rawSql(
      `UPDATE users SET
         premium_expires_at = GREATEST(COALESCE(premium_expires_at, NOW()), $1::TIMESTAMP),
         referral_reward_tier = $2,
         is_safety_ambassador = CASE WHEN $3 THEN TRUE ELSE is_safety_ambassador END,
         updated_at = NOW()
       WHERE id = $4`,
      [newExpiry.toISOString(), highestNewTier, isAmbassador, referrerId]
    );

    const tierLabels = newTiers.map(t => t.label).join(" + ");
    console.log(
      `[REFERRAL_REWARDS] User ${referrerId} reached tier ${highestNewTier} ` +
      `(${count} referrals) — granted: ${tierLabels} — expires ${newExpiry.toISOString()}`
    );
  } catch (err) {
    console.error("[REFERRAL_REWARDS] Error granting rewards:", err);
  }
}

export function registerReferralRoutes(app: Express) {

  // ===== GENERATE OR FETCH USER'S REFERRAL CODE =====
  app.post("/api/referrals/generate", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;
    if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });

    const userId = sessionUser.id || sessionUser.claims?.sub;
    try {
      const existing = await db.select().from(referrals)
        .where(and(eq(referrals.referrerId, userId)));

      if (existing.length > 0) {
        const stats = existing.reduce((acc, r) => {
          if (r.status === "converted") acc.converted++;
          else acc.pending++;
          return acc;
        }, { pending: 0, converted: 0 });
        return res.json({ success: true, referralCode: existing[0].referralCode, ...stats, total: existing.length });
      }

      let code = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const clash = await db.select().from(referrals).where(eq(referrals.referralCode, code));
        if (clash.length === 0) break;
        code = generateCode();
        attempts++;
      }

      await db.insert(referrals).values({
        referrerId: userId,
        referralCode: code,
        status: "pending",
        rewardGranted: false,
      });

      await db.update(users).set({ referralCode: code }).where(eq(users.id, userId)).catch(() => {});

      res.json({ success: true, referralCode: code, pending: 0, converted: 0, total: 0 });
    } catch (err: any) {
      console.error("[ReferralRoutes] Generate error:", err);
      res.status(500).json({ error: "Failed to generate referral code" });
    }
  });

  // ===== GET MY REFERRAL STATS (with tier info) =====
  app.get("/api/referrals/my", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;

    // Fallback: resolve userId from Bearer token (covers iOS/mobile where cookies aren't sent)
    let userId: string | null = sessionUser?.id || sessionUser?.claims?.sub || null;
    if (!userId) {
      const authHeader = (req.headers as any).authorization as string | undefined;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token.startsWith('cdt_')) {
          // Format: cdt_{userId}_{timestamp}_{suffix}
          userId = token.split('_')[1] || null;
        } else if (token.startsWith('session_')) {
          userId = token.split('_')[1] || null;
        }
      }
    }

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const myReferrals = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
      if (myReferrals.length === 0) {
        return res.json({
          referralCode: null,
          pending: 0, converted: 0, total: 0,
          rewardEarned: false,
          rewardTier: 0,
          isSafetyAmbassador: false,
          nextTierAt: 1,
          nextTierReward: "1 week premium",
        });
      }

      const code = myReferrals[0].referralCode;
      const converted = myReferrals.filter(r => r.status === "converted" && r.referredUserId).length;
      const total = myReferrals.filter(r => r.referredUserId).length;
      const rewardEarned = converted >= 1;

      // Get tier info from users table
      const rawSql = neon(process.env.DATABASE_URL!);
      const userRows = await rawSql(
        `SELECT referral_count, referral_reward_tier, is_safety_ambassador, premium_expires_at FROM users WHERE id = $1`,
        [userId]
      );
      const userRow = (userRows[0] as any) ?? {};
      const referralCount = Number(userRow.referral_count ?? total);
      const rewardTier = Number(userRow.referral_reward_tier ?? 0);
      const isSafetyAmbassador = userRow.is_safety_ambassador === true;

      // Determine next tier
      const nextTier = REWARD_TIERS.find(t => t.minReferrals > referralCount);
      const nextTierAt = nextTier?.minReferrals ?? null;
      const nextTierReward = nextTier?.label ?? "Maximum tier reached — you're a Safety Ambassador!";

      res.json({
        referralCode: code,
        pending: total - converted,
        converted,
        total,
        rewardEarned,
        rewardTier,
        referralCount,
        isSafetyAmbassador,
        nextTierAt,
        nextTierReward,
        premiumExpiresAt: userRow.premium_expires_at ?? null,
      });
    } catch (err: any) {
      console.error("[REFERRAL_MY] Error:", err?.message || err);
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  });

  // ===== CREDIT A REFERRAL (called when a new user signs up with ?ref=CODE) =====
  app.post("/api/referrals/credit", async (req, res) => {
    const { referralCode, referredUserId, referredEmail } = req.body;
    if (!referralCode) return res.status(400).json({ error: "Referral code required" });

    try {
      const [sourceRef] = await db.select().from(referrals).where(eq(referrals.referralCode, referralCode));
      if (!sourceRef) return res.status(404).json({ error: "Referral code not found" });

      await db.insert(referrals).values({
        referrerId: sourceRef.referrerId,
        referralCode,
        referredEmail,
        referredUserId,
        status: referredUserId ? "converted" : "pending",
        rewardGranted: false,
      }).onConflictDoNothing();

      if (referredUserId) {
        await db.update(users).set({
          referralSource: referralCode,
          referralCount: sql`referral_count + 1`,
        }).where(eq(users.id, sourceRef.referrerId)).catch(() => {});

        // ── Grant any newly unlocked reward tiers ──
        await grantReferralRewards(sourceRef.referrerId);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("[ReferralRoutes] Credit error:", err);
      res.status(500).json({ error: "Credit failed" });
    }
  });
}
