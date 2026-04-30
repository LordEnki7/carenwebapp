import { Router, Request, Response } from "express";
import { neon } from "@neondatabase/serverless";
import { getUploadUrl, getDownloadUrl, deleteObject, listIncidentChunks, chunkKey, metaKey, uploadMetadata } from "../services/r2-storage";
import { randomUUID } from "crypto";

const router = Router();

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

function getUserId(req: Request): string | null {
  return (req.session as any)?.userId || (req.session as any)?.user?.id || null;
}

// ── Create a new incident (called the moment recording starts) ─────────────
router.post("/start", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { latitude, longitude, state, address, triggerType } = req.body;
    const incidentId = randomUUID();
    const sql = getSql();

    await sql(
      `INSERT INTO cloud_incidents
         (id, user_id, status, trigger_type, latitude, longitude, state, address, chunk_count, started_at)
       VALUES ($1, $2, 'recording', $3, $4, $5, $6, $7, 0, NOW())`,
      [incidentId, userId, triggerType || "manual", latitude || null, longitude || null, state || null, address || null]
    );

    // Upload initial metadata to R2
    try {
      await uploadMetadata(metaKey(userId, incidentId), {
        incidentId,
        userId,
        triggerType: triggerType || "manual",
        latitude, longitude, state, address,
        startedAt: new Date().toISOString(),
        status: "recording",
      });
    } catch (r2Err) {
      console.warn("[INCIDENTS] R2 metadata upload failed (non-fatal):", (r2Err as any)?.message);
    }

    console.log(`[INCIDENTS] Started incident ${incidentId} for user ${userId} — trigger: ${triggerType}`);
    return res.json({ incidentId, status: "recording" });
  } catch (err: any) {
    console.error("[INCIDENTS] Start error:", err.message);
    return res.status(500).json({ message: "Failed to start incident" });
  }
});

// ── Get a presigned URL to upload a chunk directly from the browser ────────
router.post("/chunk-url", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { incidentId, chunkIndex, contentType } = req.body;
    if (!incidentId || chunkIndex === undefined) {
      return res.status(400).json({ message: "incidentId and chunkIndex required" });
    }

    const key = chunkKey(userId, incidentId, chunkIndex);
    const uploadUrl = await getUploadUrl(key, contentType || "video/webm", 300);

    // Increment chunk count in DB
    const sql = getSql();
    await sql(
      `UPDATE cloud_incidents SET chunk_count = chunk_count + 1, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [incidentId, userId]
    );

    return res.json({ uploadUrl, key });
  } catch (err: any) {
    console.error("[INCIDENTS] Chunk URL error:", err.message);
    return res.status(500).json({ message: "Failed to generate upload URL" });
  }
});

// ── Mark an incident as complete ───────────────────────────────────────────
router.post("/end", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { incidentId, durationSeconds, notes } = req.body;
    if (!incidentId) return res.status(400).json({ message: "incidentId required" });

    const sql = getSql();
    await sql(
      `UPDATE cloud_incidents
       SET status = 'complete', duration_seconds = $1, notes = $2, ended_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND user_id = $4`,
      [durationSeconds || null, notes || null, incidentId, userId]
    );

    console.log(`[INCIDENTS] Ended incident ${incidentId} — ${durationSeconds}s`);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[INCIDENTS] End error:", err.message);
    return res.status(500).json({ message: "Failed to end incident" });
  }
});

// ── List all incidents for the current user ────────────────────────────────
router.get("/my", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const sql = getSql();
    const rows = await sql(
      `SELECT id, status, trigger_type, latitude, longitude, state, address,
              chunk_count, duration_seconds, notes, started_at, ended_at
       FROM cloud_incidents
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY started_at DESC
       LIMIT 50`,
      [userId]
    );
    return res.json(rows);
  } catch (err: any) {
    console.error("[INCIDENTS] List error:", err.message);
    return res.status(500).json({ message: "Failed to fetch incidents" });
  }
});

// ── Get playback URLs for a specific incident ──────────────────────────────
router.get("/:id/playback", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const sql = getSql();

    // Verify ownership
    const rows = await sql(
      `SELECT id, chunk_count, status FROM cloud_incidents WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Incident not found" });

    const incident = rows[0] as any;
    const chunks: string[] = [];

    for (let i = 0; i < incident.chunk_count; i++) {
      const key = chunkKey(userId, id, i);
      try {
        const url = await getDownloadUrl(key, 3600);
        chunks.push(url);
      } catch {}
    }

    return res.json({ incidentId: id, chunkUrls: chunks, chunkCount: incident.chunk_count });
  } catch (err: any) {
    console.error("[INCIDENTS] Playback error:", err.message);
    return res.status(500).json({ message: "Failed to get playback URLs" });
  }
});

// ── Generate a shareable attorney link (24hr expiry) ──────────────────────
router.post("/:id/share", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const sql = getSql();

    const rows = await sql(
      `SELECT id, chunk_count, state, started_at, latitude, longitude FROM cloud_incidents
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Incident not found" });

    const incident = rows[0] as any;
    const shareToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await sql(
      `UPDATE cloud_incidents SET share_token = $1, share_expires_at = $2, updated_at = NOW() WHERE id = $3`,
      [shareToken, expiresAt.toISOString(), id]
    );

    const shareUrl = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "https://carenalert.com"}/incident/${shareToken}`;
    return res.json({ shareUrl, expiresAt: expiresAt.toISOString() });
  } catch (err: any) {
    console.error("[INCIDENTS] Share error:", err.message);
    return res.status(500).json({ message: "Failed to generate share link" });
  }
});

// ── View a shared incident (public, token-based) ───────────────────────────
router.get("/shared/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const sql = getSql();

    const rows = await sql(
      `SELECT id, user_id, chunk_count, status, trigger_type, state, address,
              latitude, longitude, duration_seconds, started_at, share_expires_at
       FROM cloud_incidents
       WHERE share_token = $1 AND share_expires_at > NOW() AND deleted_at IS NULL`,
      [token]
    );
    if (!rows.length) return res.status(404).json({ message: "Shared incident not found or expired" });

    const incident = rows[0] as any;
    const chunks: string[] = [];

    for (let i = 0; i < incident.chunk_count; i++) {
      const key = chunkKey(incident.user_id, incident.id, i);
      try {
        const url = await getDownloadUrl(key, 3600);
        chunks.push(url);
      } catch {}
    }

    return res.json({ incident, chunkUrls: chunks });
  } catch (err: any) {
    console.error("[INCIDENTS] Shared view error:", err.message);
    return res.status(500).json({ message: "Failed to load shared incident" });
  }
});

// ── Soft-delete an incident ────────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const sql = getSql();

    await sql(
      `UPDATE cloud_incidents SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to delete incident" });
  }
});

export default router;
