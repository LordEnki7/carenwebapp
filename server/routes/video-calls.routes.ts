import type { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc, or } from "drizzle-orm";
import { videoCalls } from "@shared/schema";
import { neon } from "@neondatabase/serverless";

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

function getUserId(req: Request): string | null {
  return (req.session as any)?.userId || (req.session as any)?.user?.id || null;
}

async function createDailyRoom(callId: number): Promise<{ roomName: string; roomUrl: string }> {
  const roomName = `caren-legal-${callId}-${Date.now()}`;

  if (!process.env.DAILY_API_KEY) {
    const fallbackUrl = `https://carenalert.daily.co/${roomName}`;
    return { roomName, roomUrl: fallbackUrl };
  }

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
        max_participants: 2,
        enable_screenshare: false,
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[VIDEO_CALLS] Daily.co room creation failed:", err);
    return { roomName, roomUrl: `https://carenalert.daily.co/${roomName}` };
  }

  const data: any = await res.json();
  return { roomName: data.name, roomUrl: data.url };
}

async function notifyAttorneyViaSMS(attorney: any, callId: number, incidentType: string, incidentState: string) {
  if (!attorney?.phone) return;
  const message = `🚨 C.A.R.E.N. Alert: Emergency call request! A user needs legal help with a ${incidentType?.replace(/_/g, " ") || "incident"} in ${incidentState || "their state"}. Log in to your attorney portal to accept: https://carenalert.com/attorney-portal`;
  try {
    const apiKey = process.env.TEXTBELT_API_KEY || '160040e53102b2285931df3013d933b0e46ebf7cqeCXDWl6beXnP8pfl4LFyke6F';
    await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ phone: attorney.phone, message, key: apiKey }).toString(),
    });
  } catch (e) {
    console.error("[VIDEO_CALLS] SMS notify failed:", e);
  }
}

export function registerVideoCallRoutes(app: Express) {
  console.log("[ROUTES] Video call routes registered");

  app.post("/api/video-calls/request", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const { attorneyId, incidentId, incidentType, incidentState, userNote } = req.body;
      if (!attorneyId) return res.status(400).json({ message: "attorneyId required" });

      const existing = await db
        .select()
        .from(videoCalls)
        .where(and(eq(videoCalls.userId, userId), eq(videoCalls.status, "waiting")))
        .limit(1);
      if (existing.length > 0) {
        return res.json(existing[0]);
      }

      const [call] = await db
        .insert(videoCalls)
        .values({ userId, attorneyId: Number(attorneyId), incidentId, incidentType, incidentState, userNote, status: "waiting" })
        .returning();

      const { roomName, roomUrl } = await createDailyRoom(call.id);
      const [updated] = await db
        .update(videoCalls)
        .set({ roomName, roomUrl })
        .where(eq(videoCalls.id, call.id))
        .returning();

      const sql2 = getSql();
      const attyRows = await sql2`SELECT id, contact_info FROM attorneys WHERE id = ${Number(attorneyId)} LIMIT 1`;
      const atty = attyRows[0];
      if (atty) {
        const ci = typeof atty.contact_info === "string" ? JSON.parse(atty.contact_info) : (atty.contact_info || {});
        notifyAttorneyViaSMS({ phone: ci.phone }, call.id, incidentType, incidentState).catch(() => {});
      }

      console.log(`[VIDEO_CALLS] Call ${call.id} requested by ${userId} → attorney ${attorneyId}`);
      return res.json(updated);
    } catch (err: any) {
      console.error("[VIDEO_CALLS] Request error:", err.message);
      return res.status(500).json({ message: "Failed to request call" });
    }
  });

  app.get("/api/video-calls/my-active", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const [call] = await db
        .select()
        .from(videoCalls)
        .where(and(eq(videoCalls.userId, userId), or(eq(videoCalls.status, "waiting"), eq(videoCalls.status, "active"))))
        .orderBy(desc(videoCalls.requestedAt))
        .limit(1);

      if (!call) return res.json(null);

      let attorney = null;
      try {
        const sql2 = getSql();
        const attyRows = await sql2`SELECT id, firm_name, contact_info FROM attorneys WHERE id = ${call.attorneyId} LIMIT 1`;
        const a = attyRows[0];
        if (a) {
          const ci = typeof a.contact_info === "string" ? JSON.parse(a.contact_info) : (a.contact_info || {});
          attorney = { firstName: ci.name?.split(" ")[0] || "", lastName: ci.name?.split(" ").slice(1).join(" ") || "", firmName: a.firm_name, phone: ci.phone };
        }
      } catch (_) {}

      return res.json({ ...call, attorney });
    } catch (err: any) {
      console.error("[VIDEO_CALLS] my-active error:", err.message);
      return res.status(500).json({ message: "Failed to fetch active call" });
    }
  });

  app.get("/api/video-calls/attorney-incoming", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const sql2 = getSql();
      const attyRows = await sql2`SELECT id FROM attorneys WHERE user_id = ${userId} LIMIT 1`;
      if (!attyRows[0]) return res.json([]);
      const attorneyId = attyRows[0].id;

      const incoming = await db
        .select()
        .from(videoCalls)
        .where(and(eq(videoCalls.attorneyId, attorneyId), eq(videoCalls.status, "waiting")))
        .orderBy(desc(videoCalls.requestedAt))
        .limit(5);

      return res.json(incoming);
    } catch (err: any) {
      console.error("[VIDEO_CALLS] attorney-incoming error:", err.message);
      return res.status(500).json({ message: "Failed to fetch incoming calls" });
    }
  });

  app.patch("/api/video-calls/:id/accept", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const callId = Number(req.params.id);
      const [call] = await db.select().from(videoCalls).where(eq(videoCalls.id, callId)).limit(1);
      if (!call) return res.status(404).json({ message: "Call not found" });

      const [updated] = await db
        .update(videoCalls)
        .set({ status: "active", startedAt: new Date() })
        .where(eq(videoCalls.id, callId))
        .returning();

      return res.json(updated);
    } catch (err: any) {
      console.error("[VIDEO_CALLS] accept error:", err.message);
      return res.status(500).json({ message: "Failed to accept call" });
    }
  });

  app.patch("/api/video-calls/:id/decline", async (req: Request, res: Response) => {
    try {
      const callId = Number(req.params.id);
      const [updated] = await db
        .update(videoCalls)
        .set({ status: "declined", endedAt: new Date() })
        .where(eq(videoCalls.id, callId))
        .returning();
      return res.json(updated);
    } catch (err: any) {
      console.error("[VIDEO_CALLS] decline error:", err.message);
      return res.status(500).json({ message: "Failed to decline call" });
    }
  });

  app.patch("/api/video-calls/:id/end", async (req: Request, res: Response) => {
    try {
      const callId = Number(req.params.id);
      const [call] = await db.select().from(videoCalls).where(eq(videoCalls.id, callId)).limit(1);
      if (!call) return res.status(404).json({ message: "Call not found" });

      const durationSeconds = call.startedAt
        ? Math.round((Date.now() - new Date(call.startedAt).getTime()) / 1000)
        : 0;

      const [updated] = await db
        .update(videoCalls)
        .set({ status: "ended", endedAt: new Date(), durationSeconds })
        .where(eq(videoCalls.id, callId))
        .returning();

      return res.json(updated);
    } catch (err: any) {
      console.error("[VIDEO_CALLS] end error:", err.message);
      return res.status(500).json({ message: "Failed to end call" });
    }
  });

  app.get("/api/video-calls/history", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const sql2 = getSql();
      const attyRows = await sql2`SELECT id FROM attorneys WHERE user_id = ${userId} LIMIT 1`;
      const filter = attyRows[0]
        ? eq(videoCalls.attorneyId, attyRows[0].id)
        : eq(videoCalls.userId, userId);

      const history = await db
        .select()
        .from(videoCalls)
        .where(filter)
        .orderBy(desc(videoCalls.requestedAt))
        .limit(20);

      return res.json(history);
    } catch (err: any) {
      console.error("[VIDEO_CALLS] history error:", err.message);
      return res.status(500).json({ message: "Failed to fetch history" });
    }
  });
}
