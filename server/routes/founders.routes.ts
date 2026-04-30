import { Router, Request, Response } from "express";
import { neon } from "@neondatabase/serverless";

const router = Router();

const FOUNDERS_LIMIT = 100;
const PREMIUM_MONTHS = 3;

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

/** Returns current claim count + remaining spots */
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const sql = getSql();
    const rows = await sql(`SELECT COUNT(*) AS cnt FROM founders_claims`);
    const count = Number((rows[0] as any).cnt ?? 0);
    return res.json({
      claimed: count,
      remaining: Math.max(0, FOUNDERS_LIMIT - count),
      isFull: count >= FOUNDERS_LIMIT,
      limit: FOUNDERS_LIMIT,
    });
  } catch (err) {
    console.error("[FOUNDERS] status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/** Returns whether the currently authenticated user is a founding member */
router.get("/my-status", async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.json({ isFoundingMember: false, claimed: false });

  try {
    const sql = getSql();
    const rows = await sql(
      `SELECT u.is_founding_member, u.premium_expires_at, fc.claimed_at, fc.expires_at
       FROM users u
       LEFT JOIN founders_claims fc ON fc.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    if (!rows.length) return res.json({ isFoundingMember: false, claimed: false });
    const row = rows[0] as any;
    return res.json({
      isFoundingMember: row.is_founding_member === true,
      claimed: !!row.claimed_at,
      claimedAt: row.claimed_at ?? null,
      expiresAt: row.expires_at ?? row.premium_expires_at ?? null,
    });
  } catch (err) {
    console.error("[FOUNDERS] my-status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/** Claim founders access — must be authenticated */
router.post("/claim", async (req: Request, res: Response) => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Please sign in to claim founders access." });
  }

  try {
    const sql = getSql();

    // Check if already claimed
    const existing = await sql(
      `SELECT id FROM founders_claims WHERE user_id = $1`,
      [userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "You have already claimed founders access." });
    }

    // Check counter
    const countRows = await sql(`SELECT COUNT(*) AS cnt FROM founders_claims`);
    const count = Number((countRows[0] as any).cnt ?? 0);
    if (count >= FOUNDERS_LIMIT) {
      return res.status(410).json({
        message: "All 100 Founding Member spots have been claimed. Stay tuned for future offers.",
      });
    }

    // Get user email
    const userRows = await sql(`SELECT email FROM users WHERE id = $1`, [userId]);
    const email = (userRows[0] as any)?.email ?? null;

    // Calculate expiry: 3 months from now (stack if premium_expires_at is in the future)
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + PREMIUM_MONTHS);

    // Insert founders claim
    await sql(
      `INSERT INTO founders_claims (user_id, email, claimed_at, expires_at, granted_by)
       VALUES ($1, $2, NOW(), $3, 'system')`,
      [userId, email, expiresAt.toISOString()]
    );

    // Update user: set is_founding_member + premium_expires_at (stack if already has time)
    await sql(
      `UPDATE users SET
         is_founding_member = TRUE,
         premium_expires_at = GREATEST(
           COALESCE(premium_expires_at, NOW()),
           $1::TIMESTAMP
         ),
         updated_at = NOW()
       WHERE id = $2`,
      [expiresAt.toISOString(), userId]
    );

    console.log(`[FOUNDERS] Claim #${count + 1} by user ${userId} (${email}) — expires ${expiresAt.toISOString()}`);

    return res.json({
      success: true,
      message: "Welcome, Founding Member! You now have 3 months of premium access.",
      spotNumber: count + 1,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[FOUNDERS] claim error:", err);
    return res.status(500).json({ message: "Server error — please try again." });
  }
});

/** Admin: list all founders claims */
router.get("/admin/list", async (req: Request, res: Response) => {
  const role = (req.session as any)?.userRole;
  if (role !== "admin") return res.status(403).json({ message: "Admin only" });

  try {
    const sql = getSql();
    const rows = await sql(
      `SELECT fc.id, fc.user_id, fc.email, fc.claimed_at, fc.expires_at,
              u.first_name, u.last_name
       FROM founders_claims fc
       LEFT JOIN users u ON u.id = fc.user_id
       ORDER BY fc.claimed_at ASC`
    );
    const count = rows.length;
    return res.json({
      claims: rows,
      count,
      remaining: Math.max(0, FOUNDERS_LIMIT - count),
      limit: FOUNDERS_LIMIT,
    });
  } catch (err) {
    console.error("[FOUNDERS] admin list error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
