import type { Express } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { pushSubscriptions } from "@shared/schema";

export function registerPushRoutes(app: Express) {

  // ===== SUBSCRIBE =====
  app.post("/api/push/subscribe", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;
    if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });

    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Invalid subscription object" });
    }

    try {
      const userId = sessionUser.id || sessionUser.claims?.sub;
      // Upsert: if endpoint already exists for this user, skip
      const existing = await db.select().from(pushSubscriptions)
        .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));

      if (existing.length === 0) {
        await db.insert(pushSubscriptions).values({
          userId,
          endpoint,
          p256dhKey: keys.p256dh,
          authKey: keys.auth,
        });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("[PushRoutes] Subscribe error:", err);
      res.status(500).json({ error: "Subscribe failed" });
    }
  });

  // ===== UNSUBSCRIBE =====
  app.delete("/api/push/unsubscribe", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;
    if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });

    const { endpoint } = req.body;
    const userId = sessionUser.id || sessionUser.claims?.sub;
    try {
      await db.delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint || "")));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Unsubscribe failed" });
    }
  });

  // ===== GET VAPID PUBLIC KEY (for browser subscription) =====
  app.get("/api/push/vapid-public-key", (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(503).json({ error: "Push notifications not configured" });
    res.json({ publicKey: key });
  });
}

// ===== SEND PUSH NOTIFICATION (internal utility) =====
export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:admin@carenalert.com";
  if (!publicKey || !privateKey) return;

  try {
    const webpush = await import("web-push");
    webpush.default.setVapidDetails(email, publicKey, privateKey);

    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    const payload = JSON.stringify({ title, body, url: url || "/" });

    for (const sub of subs) {
      try {
        await webpush.default.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dhKey, auth: sub.authKey } },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }
  } catch (err) {
    console.error("[PushRoutes] Send notification error:", err);
  }
}
