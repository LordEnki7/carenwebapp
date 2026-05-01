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

// ── Generate a shareable attorney link (configurable expiry) ──────────────
router.post("/:id/share", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    // durationDays: 1 (default/24hr), 7, 30, 90, or 0 (permanent = 10 years)
    const durationDays = parseInt(req.body.durationDays ?? "1", 10) || 1;
    const sql = getSql();

    const rows = await sql(
      `SELECT id, chunk_count, state, started_at FROM cloud_incidents
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Incident not found" });

    const shareToken = randomUUID();
    const msToAdd = durationDays === 0
      ? 10 * 365 * 24 * 60 * 60 * 1000  // "permanent" = 10 years
      : durationDays * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + msToAdd);

    await sql(
      `UPDATE cloud_incidents SET share_token = $1, share_expires_at = $2, updated_at = NOW() WHERE id = $3`,
      [shareToken, expiresAt.toISOString(), id]
    );

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "https://carenalert.com";
    const shareUrl = `${baseUrl}/incidents/shared/${shareToken}`;
    const label = durationDays === 0 ? "Permanent" : durationDays === 1 ? "24 hours" : `${durationDays} days`;
    return res.json({ shareUrl, expiresAt: expiresAt.toISOString(), label });
  } catch (err: any) {
    console.error("[INCIDENTS] Share error:", err.message);
    return res.status(500).json({ message: "Failed to generate share link" });
  }
});

// ── Toggle legal hold on an incident ──────────────────────────────────────
router.patch("/:id/legal-hold", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const { hold, reason } = req.body; // hold: boolean, reason: string (optional)
    const sql = getSql();

    const rows = await sql(
      `SELECT id, is_legal_hold FROM cloud_incidents WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Incident not found" });

    const setHold = hold === true || hold === "true";
    await sql(
      `UPDATE cloud_incidents
         SET is_legal_hold = $1,
             legal_hold_reason = $2,
             legal_hold_set_at = $3,
             updated_at = NOW()
       WHERE id = $4`,
      [setHold, setHold ? (reason || null) : null, setHold ? new Date().toISOString() : null, id]
    );

    console.log(`[INCIDENTS] Legal hold ${setHold ? "SET" : "CLEARED"} on incident ${id} by user ${userId}`);
    return res.json({ success: true, isLegalHold: setHold });
  } catch (err: any) {
    console.error("[INCIDENTS] Legal hold error:", err.message);
    return res.status(500).json({ message: "Failed to update legal hold" });
  }
});

// ── Evidence package (printable HTML) ─────────────────────────────────────
router.get("/:id/evidence-package", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const sql = getSql();

    const rows = await sql(
      `SELECT ci.*, u.email, u.first_name, u.last_name
       FROM cloud_incidents ci
       JOIN users u ON ci.user_id = u.id
       WHERE ci.id = $1 AND ci.user_id = $2 AND ci.deleted_at IS NULL`,
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Incident not found" });

    const inc = rows[0] as any;
    const packageGenerated = new Date().toUTCString();
    const startedAt = inc.started_at ? new Date(inc.started_at).toUTCString() : "Unknown";
    const endedAt = inc.ended_at ? new Date(inc.ended_at).toUTCString() : "Not recorded";
    const duration = inc.duration_seconds ? `${Math.floor(inc.duration_seconds / 60)}m ${inc.duration_seconds % 60}s` : "Unknown";
    const gps = (inc.latitude && inc.longitude)
      ? `${Number(inc.latitude).toFixed(6)}° N, ${Number(inc.longitude).toFixed(6)}° W`
      : "Not recorded";
    const userName = [inc.first_name, inc.last_name].filter(Boolean).join(" ") || "Account holder";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>C.A.R.E.N. Evidence Package — ${inc.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; color: #111; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 20pt; margin-bottom: 4px; }
    h2 { font-size: 13pt; margin: 24px 0 8px; border-bottom: 1px solid #bbb; padding-bottom: 4px; }
    .subtitle { font-size: 10pt; color: #555; margin-bottom: 24px; }
    .logo { font-size: 9pt; color: #555; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td { padding: 6px 8px; vertical-align: top; }
    td:first-child { font-weight: bold; width: 220px; color: #333; }
    tr:nth-child(even) td { background: #f7f7f7; }
    .disclaimer { margin-top: 32px; padding: 16px; border: 1px solid #c00; font-size: 10pt; line-height: 1.6; }
    .disclaimer strong { color: #c00; }
    .footer { margin-top: 28px; font-size: 9pt; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 9pt; font-weight: bold; }
    .badge-hold { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .badge-complete { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <p class="logo">C.A.R.E.N.™ Alert &nbsp;·&nbsp; Citizen Assistance for Roadside Emergencies and Navigation</p>
  <h1>Incident Evidence Package</h1>
  <p class="subtitle">Generated for legal reference — print or save as PDF using your browser's print function</p>

  <h2>Package Information</h2>
  <table>
    <tr><td>Document Generated</td><td>${packageGenerated} (UTC)</td></tr>
    <tr><td>Incident ID</td><td style="font-family:monospace">${inc.id}</td></tr>
    <tr><td>Short Reference</td><td style="font-family:monospace">${inc.id.slice(0, 8).toUpperCase()}</td></tr>
    <tr><td>Legal Hold Status</td><td>${inc.is_legal_hold
      ? `<span class="badge badge-hold">⚠ LEGAL HOLD ACTIVE</span>${inc.legal_hold_reason ? ` — ${inc.legal_hold_reason}` : ""}`
      : "Not marked as legal hold"}</td></tr>
  </table>

  <h2>Recording Details</h2>
  <table>
    <tr><td>Recording Started</td><td>${startedAt}</td></tr>
    <tr><td>Recording Ended</td><td>${endedAt}</td></tr>
    <tr><td>Duration</td><td>${duration}</td></tr>
    <tr><td>Status at Upload</td><td>${inc.status || "Unknown"} <span class="badge badge-complete">Cloud stored</span></td></tr>
    <tr><td>Trigger Type</td><td>${inc.trigger_type || "manual"}</td></tr>
    <tr><td>Number of Chunks</td><td>${inc.chunk_count} (each chunk is approximately 15 seconds)</td></tr>
  </table>

  <h2>Location at Time of Recording</h2>
  <table>
    <tr><td>GPS Coordinates</td><td>${gps}</td></tr>
    <tr><td>Reported State</td><td>${inc.state || "Not recorded"}</td></tr>
    <tr><td>Reported Address</td><td>${inc.address || "Not recorded"}</td></tr>
    <tr><td>GPS Source</td><td>Device-reported via browser Geolocation API at recording start</td></tr>
  </table>

  <h2>Account Holder</h2>
  <table>
    <tr><td>Name</td><td>${userName}</td></tr>
    <tr><td>Email</td><td>${inc.email || "On file"}</td></tr>
    <tr><td>User ID</td><td style="font-family:monospace">${inc.user_id}</td></tr>
  </table>

  <h2>Storage and Integrity</h2>
  <table>
    <tr><td>Storage Provider</td><td>Cloudflare R2 (carenincidents bucket)</td></tr>
    <tr><td>Storage Region</td><td>Cloudflare global network</td></tr>
    <tr><td>File Path</td><td style="font-family:monospace">incidents/${inc.user_id}/${inc.id}/chunks/</td></tr>
    <tr><td>Upload Method</td><td>Direct browser-to-cloud via presigned URL (no server intermediary)</td></tr>
    <tr><td>Server-Side Integrity</td><td>Cloudflare R2 performs automatic MD5 integrity checks on all uploads</td></tr>
  </table>

  <div class="disclaimer">
    <strong>IMPORTANT DISCLAIMER — READ BEFORE USE IN LEGAL PROCEEDINGS</strong><br><br>
    C.A.R.E.N. Alert is a <strong>cloud storage and metadata logging platform</strong>. This document records information as reported by the user's device and as received by our servers. C.A.R.E.N. Alert makes no representation and provides no warranty regarding:<br><br>
    &bull; The accuracy, completeness, or continuity of the footage<br>
    &bull; The accuracy of the device clock at time of recording<br>
    &bull; Whether the footage was edited on-device before upload<br>
    &bull; The admissibility of this evidence in any jurisdiction<br><br>
    What C.A.R.E.N. Alert can confirm: <em>The file(s) identified above were received by our servers at the timestamps shown, stored in Cloudflare R2 under the incident ID shown, and have not been modified or deleted by C.A.R.E.N. Alert since receipt.</em><br><br>
    <strong>Consult a licensed attorney before presenting this document or the associated footage in any legal proceeding.</strong> Admissibility of digital evidence varies by jurisdiction and circumstance.
  </div>

  <div class="footer">
    C.A.R.E.N.™ Alert &nbsp;·&nbsp; carenalert.com &nbsp;·&nbsp; Evidence package auto-generated ${packageGenerated}<br>
    This document does not constitute legal advice. C.A.R.E.N. Alert is not a law firm and does not provide legal representation.
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="caren-evidence-${inc.id.slice(0,8)}.html"`);
    return res.send(html);
  } catch (err: any) {
    console.error("[INCIDENTS] Evidence package error:", err.message);
    return res.status(500).json({ message: "Failed to generate evidence package" });
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

// ── Soft-delete an incident (blocked if legal hold is active) ─────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const sql = getSql();

    // Guard: refuse deletion if a legal hold is active
    const rows = await sql(
      `SELECT is_legal_hold FROM cloud_incidents WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Incident not found" });

    const inc = rows[0] as any;
    if (inc.is_legal_hold) {
      return res.status(423).json({
        message: "This incident is under a legal hold and cannot be deleted. Remove the legal hold first.",
        code: "LEGAL_HOLD_ACTIVE",
      });
    }

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
