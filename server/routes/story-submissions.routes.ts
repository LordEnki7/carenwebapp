import { Router, Request, Response } from "express";
import { neon } from "@neondatabase/serverless";

const router = Router();

const ADMIN_KEY = process.env.CAREN_ADMIN_KEY || "CAREN_ADMIN_2025_PRODUCTION";

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

function isAdmin(req: Request): boolean {
  const key = (req.headers["x-admin-key"] as string) || (req.query.adminKey as string);
  return key === ADMIN_KEY;
}

router.post("/submit", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { name, email, title, story, videoUrl, consentGiven } = req.body;

    if (!name || !title || !story) {
      return res.status(400).json({ message: "Name, title, and story are required" });
    }
    if (!consentGiven) {
      return res.status(400).json({ message: "Consent is required to submit your story" });
    }

    const sql = getSql();

    const existing = await sql(
      `SELECT id FROM story_submissions WHERE user_id = $1 AND status NOT IN ('rejected')`,
      [userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "You already have a pending or approved story submission" });
    }

    const rows = await sql(
      `INSERT INTO story_submissions (user_id, name, email, title, story, video_url, consent_given, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, title, status, created_at`,
      [userId, name, email || null, title, story, videoUrl || null, consentGiven]
    );

    return res.json({ success: true, submission: rows[0] });
  } catch (err) {
    console.error("[STORIES] Submit error:", err);
    return res.status(500).json({ message: "Failed to submit story" });
  }
});

router.get("/my", async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const sql = getSql();
    const rows = await sql(
      `SELECT id, title, status, admin_notes, featured_month, reward_granted, created_at
       FROM story_submissions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch submissions" });
  }
});

router.get("/featured", async (_req: Request, res: Response) => {
  try {
    const sql = getSql();
    const rows = await sql(
      `SELECT id, name, title, story, featured_month, created_at
       FROM story_submissions
       WHERE status = 'featured'
       ORDER BY created_at DESC
       LIMIT 12`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch featured stories" });
  }
});

router.get("/admin/list", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  try {
    const status = req.query.status as string | undefined;
    const sql = getSql();

    let rows;
    if (status && status !== "all") {
      rows = await sql(
        `SELECT ss.*, u.email as user_email, u.first_name, u.last_name
         FROM story_submissions ss
         LEFT JOIN users u ON ss.user_id = u.id
         WHERE ss.status = $1
         ORDER BY ss.created_at DESC
         LIMIT 100`,
        [status]
      );
    } else {
      rows = await sql(
        `SELECT ss.*, u.email as user_email, u.first_name, u.last_name
         FROM story_submissions ss
         LEFT JOIN users u ON ss.user_id = u.id
         ORDER BY ss.created_at DESC
         LIMIT 100`
      );
    }
    return res.json(rows);
  } catch (err) {
    console.error("[STORIES] Admin list error:", err);
    return res.status(500).json({ message: "Failed to list stories" });
  }
});

router.put("/admin/:id/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  try {
    const { id } = req.params;
    const { status, adminNotes, featuredMonth } = req.body;

    const valid = ["pending", "approved", "featured", "rejected"];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const sql = getSql();
    await sql(
      `UPDATE story_submissions
       SET status = $1, admin_notes = $2, featured_month = $3, updated_at = NOW()
       WHERE id = $4`,
      [status, adminNotes || null, featuredMonth || null, id]
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update story status" });
  }
});

router.post("/admin/:id/grant-reward", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  try {
    const { id } = req.params;
    const sql = getSql();

    const story = await sql(
      `SELECT user_id, reward_granted FROM story_submissions WHERE id = $1`,
      [id]
    );
    if (!story.length) {
      return res.status(404).json({ message: "Story not found" });
    }

    const s = story[0] as any;
    if (s.reward_granted) {
      return res.status(409).json({ message: "Reward already granted" });
    }

    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);

    await sql(
      `UPDATE users
       SET premium_expires_at = GREATEST(COALESCE(premium_expires_at, NOW()), $1::timestamptz),
           subscription_tier = 'premium',
           updated_at = NOW()
       WHERE id = $2`,
      [newExpiry.toISOString(), s.user_id]
    );

    await sql(
      `UPDATE story_submissions SET reward_granted = TRUE, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    return res.json({ success: true, message: "1 month premium granted" });
  } catch (err) {
    console.error("[STORIES] Grant reward error:", err);
    return res.status(500).json({ message: "Failed to grant reward" });
  }
});

router.get("/admin/stats", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  try {
    const sql = getSql();
    const rows = await sql(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'featured') AS featured,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        COUNT(*) AS total
      FROM story_submissions
    `);
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
