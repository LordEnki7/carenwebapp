import type { Express, Request } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "../db";
import { directorOutreach } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";

// Mailtrap event types we handle
type MailtrapEvent =
  | "delivery"
  | "open"
  | "click"
  | "bounce"
  | "spam"
  | "unsubscribe"
  | "reject";

interface MailtrapWebhookEvent {
  event: MailtrapEvent;
  email: string;
  timestamp: number;
  message_id?: string;
  sending_stream?: string;
  response?: string;
  bounce_category?: string;   // "hard" | "soft" | "spam" | "transient"
  user_agent?: string;
  url?: string;
  custom_variables?: Record<string, string>;
}

// Map Mailtrap event → outreach status we want to store
const EVENT_TO_STATUS: Partial<Record<MailtrapEvent, string>> = {
  delivery:    "delivered",
  open:        "opened",
  bounce:      "bounced",
  spam:        "spam_complaint",
  unsubscribe: "unsubscribed",
  reject:      "rejected",
};

// Status priority — higher rank wins so we never downgrade a record
const STATUS_RANK: Record<string, number> = {
  failed: 0, sent: 1, delivered: 2, opened: 3, clicked: 4,
  replied: 5, bounced: 1, spam_complaint: 1, unsubscribed: 1, rejected: 1,
};

// Negative-outcome statuses always overwrite regardless of rank
const NEGATIVE_STATUSES = new Set(["bounced", "spam_complaint", "unsubscribed", "rejected"]);

/**
 * Verify the Mailtrap webhook signature.
 * Mailtrap sends: X-MT-Signature: sha256=<hex_hmac>
 * We compute HMAC-SHA256 of the raw body with our secret and compare.
 */
function verifyMailtrapSignature(req: Request & { rawBody?: Buffer }): boolean {
  const secret = process.env.MAILTRAP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[MAILTRAP WEBHOOK] No MAILTRAP_WEBHOOK_SECRET set — skipping signature check");
    return true; // Fail open only until secret is configured
  }

  const header = (req.headers["x-mt-signature"] as string) || "";
  if (!header.startsWith("sha256=")) {
    console.warn("[MAILTRAP WEBHOOK] Missing or malformed X-MT-Signature header");
    return false;
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    console.warn("[MAILTRAP WEBHOOK] No raw body available for signature check");
    return false;
  }

  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function registerWebhookRoutes(app: Express) {
  // ── POST /api/webhooks/mailtrap ─────────────────────────────────────────────
  // Register this URL in Mailtrap → Sending → Webhooks
  // URL: https://carenalert.com/api/webhooks/mailtrap
  //
  // Handles: delivery, open, click, bounce, spam, unsubscribe
  // Auto-updates director_outreach status so you can track email engagement in admin
  app.post("/api/webhooks/mailtrap", async (req: any, res) => {
    // Verify signature first — reject forged requests before any processing
    if (!verifyMailtrapSignature(req)) {
      console.warn("[MAILTRAP WEBHOOK] Signature verification failed — request rejected");
      return res.sendStatus(401);
    }

    // Always respond 200 quickly — Mailtrap retries on non-2xx responses
    res.sendStatus(200);

    try {
      const events: MailtrapWebhookEvent[] = Array.isArray(req.body?.events)
        ? req.body.events
        : Array.isArray(req.body)
        ? req.body
        : [req.body];

      for (const evt of events) {
        if (!evt?.event || !evt?.email) continue;

        const eventLabel = evt.event.toUpperCase();
        const ts = evt.timestamp
          ? new Date(evt.timestamp * 1000).toISOString()
          : new Date().toISOString();

        // Log every event to server / Dokploy logs
        console.log(
          `[MAILTRAP WEBHOOK] ${eventLabel} → ${evt.email} at ${ts}` +
          (evt.bounce_category ? ` (${evt.bounce_category} bounce)` : "")
        );

        // Update the most recent director_outreach record for this email
        const newStatus = EVENT_TO_STATUS[evt.event];
        if (!newStatus) continue;

        const [record] = await db
          .select()
          .from(directorOutreach)
          .where(eq(directorOutreach.prospectEmail, evt.email.toLowerCase()))
          .orderBy(desc(directorOutreach.sentAt))
          .limit(1);

        if (!record) continue;

        const currentRank = STATUS_RANK[record.status ?? "sent"] ?? 0;
        const newRank = STATUS_RANK[newStatus] ?? 0;

        if (newRank > currentRank || NEGATIVE_STATUSES.has(newStatus)) {
          await db
            .update(directorOutreach)
            .set({ status: newStatus })
            .where(eq(directorOutreach.id, record.id));
          console.log(
            `[MAILTRAP WEBHOOK] Outreach #${record.id} (${record.prospectName}): ${record.status} → ${newStatus}`
          );
        }
      }
    } catch (err: any) {
      // Never fail after 200 is sent — log and move on
      console.error("[MAILTRAP WEBHOOK] Processing error:", err?.message || err);
    }
  });

  // ── GET /api/webhooks/mailtrap/test ─────────────────────────────────────────
  // Ping this URL to confirm the endpoint is reachable before saving it in Mailtrap
  app.get("/api/webhooks/mailtrap/test", (_req, res) => {
    res.json({
      ok: true,
      message: "Mailtrap webhook endpoint is reachable",
      url: "https://carenalert.com/api/webhooks/mailtrap",
      signatureVerification: !!process.env.MAILTRAP_WEBHOOK_SECRET,
      accepts: ["delivery", "open", "click", "bounce", "spam", "unsubscribe"],
    });
  });
}
