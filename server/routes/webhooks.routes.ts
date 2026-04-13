import type { Express } from "express";
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

export function registerWebhookRoutes(app: Express) {
  // ── POST /api/webhooks/mailtrap ─────────────────────────────────────────────
  // Register this URL in Mailtrap → Sending → Webhooks
  // URL: https://carenalert.com/api/webhooks/mailtrap
  //
  // Handles: delivery, open, click, bounce, spam, unsubscribe
  // Auto-updates director_outreach status so you can see email activity in admin
  app.post("/api/webhooks/mailtrap", async (req, res) => {
    // Always respond 200 immediately — Mailtrap retries on non-2xx responses
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
        const ts = evt.timestamp ? new Date(evt.timestamp * 1000).toISOString() : new Date().toISOString();

        // Log every event so it shows in server logs / Dokploy logs
        console.log(`[MAILTRAP WEBHOOK] ${eventLabel} → ${evt.email} at ${ts}${evt.bounce_category ? ` (${evt.bounce_category} bounce)` : ""}`);

        // Update the most recent director_outreach record for this email
        const newStatus = EVENT_TO_STATUS[evt.event];
        if (newStatus) {
          // Find the most recent outreach record for this email
          const [record] = await db
            .select()
            .from(directorOutreach)
            .where(eq(directorOutreach.prospectEmail, evt.email.toLowerCase()))
            .orderBy(desc(directorOutreach.sentAt))
            .limit(1);

          if (record) {
            // Only upgrade the status (don't overwrite "replied" with "opened", etc.)
            const STATUS_RANK: Record<string, number> = {
              failed: 0, sent: 1, delivered: 2, opened: 3, clicked: 4,
              replied: 5, bounced: 1, spam_complaint: 1, unsubscribed: 1, rejected: 1,
            };
            const currentRank = STATUS_RANK[record.status ?? "sent"] ?? 0;
            const newRank = STATUS_RANK[newStatus] ?? 0;

            if (newRank > currentRank || ["bounced", "spam_complaint", "unsubscribed", "rejected"].includes(newStatus)) {
              await db
                .update(directorOutreach)
                .set({ status: newStatus })
                .where(eq(directorOutreach.id, record.id));
              console.log(`[MAILTRAP WEBHOOK] Updated outreach #${record.id} (${record.prospectName}) status: ${record.status} → ${newStatus}`);
            }
          }
        }
      }
    } catch (err: any) {
      // Log errors but never fail — we already sent 200
      console.error("[MAILTRAP WEBHOOK] Processing error:", err?.message || err);
    }
  });

  // ── GET /api/webhooks/mailtrap/test ─────────────────────────────────────────
  // Quick health-check so you can verify the URL is reachable before pasting into Mailtrap
  app.get("/api/webhooks/mailtrap/test", (_req, res) => {
    res.json({
      ok: true,
      message: "Mailtrap webhook endpoint is reachable",
      url: "https://carenalert.com/api/webhooks/mailtrap",
      accepts: ["delivery", "open", "click", "bounce", "spam", "unsubscribe"],
    });
  });
}
