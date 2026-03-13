import type { Express } from "express";
import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { referrals, users } from "@shared/schema";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
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

  // ===== GET MY REFERRAL STATS =====
  app.get("/api/referrals/my", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;
    if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });

    const userId = sessionUser.id || sessionUser.claims?.sub;
    try {
      const myReferrals = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
      if (myReferrals.length === 0) {
        return res.json({ referralCode: null, pending: 0, converted: 0, total: 0, rewardEarned: false });
      }
      const code = myReferrals[0].referralCode;
      const converted = myReferrals.filter(r => r.status === "converted" && r.referredUserId).length;
      const total = myReferrals.filter(r => r.referredUserId).length;
      const rewardEarned = converted >= 1;

      res.json({ referralCode: code, pending: total - converted, converted, total, rewardEarned });
    } catch (err: any) {
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
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("[ReferralRoutes] Credit error:", err);
      res.status(500).json({ error: "Credit failed" });
    }
  });
}
