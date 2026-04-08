import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export function registerCommunityRoutes(app: Express) {

  // Wall of Guardians — top referrers with rank
  app.get("/api/community/wall", async (req, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT
          u.id,
          COALESCE(u.first_name, split_part(u.email, '@', 1), 'Guardian') AS display_name,
          u.profile_image_url,
          u.subscription_tier,
          COUNT(DISTINCT rt.referred_user_id) FILTER (WHERE rt.status = 'converted') AS referral_count,
          u.created_at
        FROM users u
        LEFT JOIN referral_codes rc ON rc.user_id = u.id
        LEFT JOIN referral_tracking rt ON rt.referral_code = rc.code
        GROUP BY u.id, u.first_name, u.email, u.profile_image_url, u.subscription_tier, u.created_at
        HAVING COUNT(DISTINCT rt.referred_user_id) > 0 OR u.subscription_tier != 'basic_guard'
        ORDER BY referral_count DESC, u.created_at ASC
        LIMIT 20
      `);
      res.json(rows.rows || []);
    } catch (err: any) {
      res.json([]);
    }
  });

  // Current user's rank info
  app.get("/api/community/my-rank", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.json({ referralCount: 0, rank: "New Guardian", rankLevel: 0 });

      const rows = await db.execute(sql`
        SELECT COUNT(DISTINCT rt.referred_user_id) AS referral_count
        FROM referral_codes rc
        LEFT JOIN referral_tracking rt ON rt.referral_code = rc.code AND rt.status = 'converted'
        WHERE rc.user_id = ${userId}
      `);

      const referralCount = parseInt((rows.rows[0] as any)?.referral_count || "0");
      let rank = "New Guardian";
      let rankLevel = 0;
      let rankEmoji = "🌱";

      if (referralCount >= 25) { rank = "Elite Defender"; rankLevel = 4; rankEmoji = "👑"; }
      else if (referralCount >= 10) { rank = "Elite Protector"; rankLevel = 3; rankEmoji = "💪"; }
      else if (referralCount >= 3) { rank = "Protector"; rankLevel = 2; rankEmoji = "🔥"; }
      else if (referralCount >= 1) { rank = "Verified Guardian"; rankLevel = 1; rankEmoji = "⭐"; }

      res.json({ referralCount, rank, rankLevel, rankEmoji });
    } catch (err: any) {
      res.json({ referralCount: 0, rank: "New Guardian", rankLevel: 0, rankEmoji: "🌱" });
    }
  });

  // Community stats (public)
  app.get("/api/community/stats", async (req, res) => {
    try {
      const [userCount] = await db.execute(sql`SELECT COUNT(*) AS total FROM users`);
      const [refCount] = await db.execute(sql`
        SELECT COUNT(DISTINCT referred_user_id) AS total FROM referral_tracking WHERE status = 'converted'
      `);
      res.json({
        totalGuardians: parseInt((userCount as any).rows?.[0]?.total || "0"),
        totalReferrals: parseInt((refCount as any).rows?.[0]?.total || "0"),
      });
    } catch {
      res.json({ totalGuardians: 0, totalReferrals: 0 });
    }
  });
}
