import type { Express } from "express";
import { db } from "../db";
import { regionalDirectors, directorActivities, directorCommissions, directorOutreach, insertRegionalDirectorSchema, insertDirectorActivitySchema, insertDirectorCommissionSchema } from "@shared/schema";
import { eq, desc, and, sql, asc } from "drizzle-orm";
import { sendEmail } from "../mailer";

const EMAIL_TEMPLATES: Record<string, { subject: string; html: (name: string, city: string) => string }> = {
  initial_outreach: {
    subject: "Exclusive Opportunity: Become a C.A.R.E.N.™ Regional Director",
    html: (name, city) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #22d3ee; font-size: 24px; margin: 0;">C.A.R.E.N.™ ALERT</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0;">Citizen Assistance for Roadside Emergencies &amp; Navigation</p>
        </div>
        <p style="font-size: 16px;">Dear ${name},</p>
        <p>We are reaching out to you because we believe you have the leadership, community presence, and drive to make a real difference in <strong style="color: #22d3ee;">${city}</strong>.</p>
        <p>C.A.R.E.N.™ ALERT is a revolutionary safety platform that protects families during police encounters and roadside emergencies — providing real-time legal rights coaching, GPS-enabled incident recording, and emergency response coordination.</p>
        <p><strong style="color: #a78bfa;">We are currently selecting Regional Directors</strong> to lead our expansion in key cities across the country. As a Regional Director, you would:</p>
        <ul style="line-height: 1.9; color: #cbd5e1;">
          <li>Represent C.A.R.E.N.™ in your local community</li>
          <li>Build your own network of subscribers and attorneys</li>
          <li>Earn <strong style="color: #22d3ee;">20%–35% commission</strong> on every subscription you bring in</li>
          <li>Grow into Senior, State, and National Director roles</li>
        </ul>
        <p>This is a ground-floor opportunity with a platform that is already in the Google Play Store and growing fast.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://carenalert.com/become-director" style="background: #22d3ee; color: #0f172a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Apply to Become a Director</a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">If you have questions or would like to schedule a call, simply reply to this email. We would love to speak with you.</p>
        <p>With respect,<br/><strong style="color: #22d3ee;">The C.A.R.E.N.™ ALERT Leadership Team</strong></p>
        <hr style="border-color: #1e293b; margin: 24px 0;"/>
        <p style="color: #475569; font-size: 11px; text-align: center;">C.A.R.E.N.™ ALERT · carenalert.com · To unsubscribe, reply with "unsubscribe".</p>
      </div>
    `,
  },
  follow_up: {
    subject: "Following Up — Regional Director Opportunity with C.A.R.E.N.™",
    html: (name, city) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #22d3ee; font-size: 24px; margin: 0;">C.A.R.E.N.™ ALERT</h1>
        </div>
        <p style="font-size: 16px;">Dear ${name},</p>
        <p>We wanted to follow up on our previous message about the <strong style="color: #a78bfa;">Regional Director opportunity</strong> in <strong style="color: #22d3ee;">${city}</strong>.</p>
        <p>We understand you are busy, but we did not want you to miss this chance. Director spots in your area are limited, and we are moving forward with selections soon.</p>
        <p>As a reminder — this role lets you earn commissions, build community impact, and grow with a platform that is already live and gaining traction nationwide.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://carenalert.com/become-director" style="background: #22d3ee; color: #0f172a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Apply Now</a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">Reply to this email with any questions — we are happy to talk.</p>
        <p>With respect,<br/><strong style="color: #22d3ee;">The C.A.R.E.N.™ ALERT Leadership Team</strong></p>
        <hr style="border-color: #1e293b; margin: 24px 0;"/>
        <p style="color: #475569; font-size: 11px; text-align: center;">C.A.R.E.N.™ ALERT · carenalert.com · To unsubscribe, reply with "unsubscribe".</p>
      </div>
    `,
  },
  final_invite: {
    subject: "Last Chance — Regional Director Spot in Your City",
    html: (name, city) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #22d3ee; font-size: 24px; margin: 0;">C.A.R.E.N.™ ALERT</h1>
        </div>
        <p style="font-size: 16px;">Dear ${name},</p>
        <p>We have one remaining <strong style="color: #f59e0b;">Regional Director position</strong> available in the <strong style="color: #22d3ee;">${city}</strong> area, and we want to give you the final opportunity to claim it before we move on.</p>
        <p>This is the last message we will send. If this opportunity interests you, now is the time to act.</p>
        <div style="background: #1e293b; border: 1px solid #22d3ee33; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #22d3ee; font-weight: bold; text-align: center;">Director Benefits at a Glance</p>
          <ul style="margin: 12px 0 0; line-height: 1.9; color: #cbd5e1;">
            <li>20%–35% recurring commission on every subscription</li>
            <li>Exclusive territory in your city</li>
            <li>Access to the full C.A.R.E.N.™ platform and tools</li>
            <li>Path to State and National Director promotions</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://carenalert.com/become-director" style="background: #f59e0b; color: #0f172a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Claim My Spot Now</a>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">We wish you the best regardless of your decision.</p>
        <p>With respect,<br/><strong style="color: #22d3ee;">The C.A.R.E.N.™ ALERT Leadership Team</strong></p>
        <hr style="border-color: #1e293b; margin: 24px 0;"/>
        <p style="color: #475569; font-size: 11px; text-align: center;">C.A.R.E.N.™ ALERT · carenalert.com · To unsubscribe, reply with "unsubscribe".</p>
      </div>
    `,
  },
};

const ADMIN_KEY = "CAREN_ADMIN_2025_PRODUCTION";

function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function calcScore(attorneys: number, users: number, partnerships: number, streak: number): number {
  return Math.min(100, (attorneys * 10) + (users * 2) + (partnerships * 5) + (streak * 2));
}

export function registerDirectorRoutes(app: Express) {

  // ── PUBLIC: Submit director application ────────────────────────────────────
  app.post("/api/director/apply", async (req, res) => {
    try {
      const parsed = insertRegionalDirectorSchema.safeParse({
        ...req.body,
        status: "pending",
        level: "regional_director",
      });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      }
      // Check for duplicate email
      const existing = await db.select().from(regionalDirectors)
        .where(eq(regionalDirectors.email, parsed.data.email));
      if (existing.length > 0) {
        return res.status(409).json({ error: "An application with this email already exists." });
      }
      const [created] = await db.insert(regionalDirectors).values(parsed.data).returning();
      res.status(201).json({ success: true, id: created.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DIRECTOR: Get my profile (matched by session email or userId) ──────────
  app.get("/api/director/me", async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const email = req.query.email as string;
      if (!userId && !email) return res.status(401).json({ error: "Not authenticated" });

      let rows: any[] = [];
      if (userId) {
        rows = await db.select().from(regionalDirectors).where(eq(regionalDirectors.userId, userId));
      }
      if (!rows.length && email) {
        rows = await db.select().from(regionalDirectors).where(eq(regionalDirectors.email, email));
      }
      if (!rows.length) return res.status(404).json({ error: "No director profile found" });

      const director = rows[0];
      // Fetch this week's activities
      const weekOf = getWeekStart();
      const activities = await db.select().from(directorActivities)
        .where(and(
          eq(directorActivities.directorId, director.id),
          eq(directorActivities.weekOf, weekOf)
        ));

      // Aggregate lifetime stats
      const allActivities = await db.select().from(directorActivities)
        .where(eq(directorActivities.directorId, director.id));

      const lifetime = allActivities.reduce((acc: any, a) => {
        acc[a.type] = (acc[a.type] || 0) + (a.count || 1);
        return acc;
      }, {});

      const score = calcScore(
        lifetime.attorney_onboarded || 0,
        lifetime.user_added || 0,
        lifetime.partnership_created || 0,
        0
      );

      res.json({ ...director, weekActivities: activities, lifetime, score });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DIRECTOR: Log an activity ──────────────────────────────────────────────
  app.post("/api/director/activity", async (req: any, res) => {
    try {
      const { directorId, type, count, notes } = req.body;
      if (!directorId || !type) return res.status(400).json({ error: "directorId and type required" });

      const weekOf = getWeekStart();
      const parsed = insertDirectorActivitySchema.safeParse({ directorId, type, count: count || 1, notes, weekOf });
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });

      const [created] = await db.insert(directorActivities).values(parsed.data).returning();
      res.status(201).json({ success: true, activity: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Get all directors ───────────────────────────────────────────────
  app.get("/api/director/admin/all", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });

      const directors = await db.select().from(regionalDirectors).orderBy(desc(regionalDirectors.createdAt));

      // Enrich with lifetime stats and scores
      const enriched = await Promise.all(directors.map(async (d) => {
        const activities = await db.select().from(directorActivities)
          .where(eq(directorActivities.directorId, d.id));
        const lifetime = activities.reduce((acc: any, a) => {
          acc[a.type] = (acc[a.type] || 0) + (a.count || 1);
          return acc;
        }, {});
        const score = calcScore(
          lifetime.attorney_onboarded || 0,
          lifetime.user_added || 0,
          lifetime.partnership_created || 0,
          0
        );
        return { ...d, lifetime, score };
      }));

      res.json(enriched);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Get dashboard stats ─────────────────────────────────────────────
  app.get("/api/director/admin/stats", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });

      const directors = await db.select().from(regionalDirectors);
      const total = directors.length;
      const approved = directors.filter(d => d.status === "approved").length;
      const pending = directors.filter(d => d.status === "pending").length;
      const cities = [...new Set(directors.map(d => d.city))].length;

      const allActivities = await db.select().from(directorActivities);
      const totalAttorneys = allActivities.filter(a => a.type === "attorney_onboarded").reduce((s, a) => s + (a.count || 1), 0);
      const totalUsers = allActivities.filter(a => a.type === "user_added").reduce((s, a) => s + (a.count || 1), 0);
      const totalPartnerships = allActivities.filter(a => a.type === "partnership_created").reduce((s, a) => s + (a.count || 1), 0);

      res.json({ total, approved, pending, cities, totalAttorneys, totalUsers, totalPartnerships });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Update director status ──────────────────────────────────────────
  app.put("/api/director/admin/:id/status", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      if (!["pending", "approved", "rejected", "paused"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const [updated] = await db.update(regionalDirectors)
        .set({ status, adminNotes: adminNotes || null, updatedAt: new Date() })
        .where(eq(regionalDirectors.id, id))
        .returning();
      res.json({ success: true, director: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Update level ────────────────────────────────────────────────────
  app.put("/api/director/admin/:id/level", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const { level } = req.body;
      const validLevels = ["regional_director", "senior_director", "state_director", "national_director"];
      if (!validLevels.includes(level)) return res.status(400).json({ error: "Invalid level" });
      const [updated] = await db.update(regionalDirectors)
        .set({ level, updatedAt: new Date() })
        .where(eq(regionalDirectors.id, id))
        .returning();
      res.json({ success: true, director: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Assign territory ────────────────────────────────────────────────
  app.put("/api/director/admin/:id/territory", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const { territory } = req.body;
      const [updated] = await db.update(regionalDirectors)
        .set({ territory: territory || null, updatedAt: new Date() })
        .where(eq(regionalDirectors.id, id))
        .returning();
      res.json({ success: true, director: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Add a note ──────────────────────────────────────────────────────
  app.put("/api/director/admin/:id/notes", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const { adminNotes } = req.body;
      const [updated] = await db.update(regionalDirectors)
        .set({ adminNotes, updatedAt: new Date() })
        .where(eq(regionalDirectors.id, id))
        .returning();
      res.json({ success: true, director: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── PUBLIC: Leaderboard (approved directors, ranked by score) ─────────────
  app.get("/api/director/leaderboard", async (_req, res) => {
    try {
      const directors = await db.select({
        id: regionalDirectors.id,
        name: regionalDirectors.name,
        city: regionalDirectors.city,
        state: regionalDirectors.state,
        level: regionalDirectors.level,
        territory: regionalDirectors.territory,
      }).from(regionalDirectors)
        .where(eq(regionalDirectors.status, "approved"))
        .orderBy(asc(regionalDirectors.id));

      const enriched = await Promise.all(directors.map(async (d) => {
        const activities = await db.select().from(directorActivities)
          .where(eq(directorActivities.directorId, d.id));
        const lifetime = activities.reduce((acc: any, a) => {
          acc[a.type] = (acc[a.type] || 0) + (a.count || 1);
          return acc;
        }, {});
        const score = calcScore(
          lifetime.attorney_onboarded || 0,
          lifetime.user_added || 0,
          lifetime.partnership_created || 0,
          0
        );
        const commissions = await db.select().from(directorCommissions)
          .where(eq(directorCommissions.directorId, d.id));
        const totalEarned = commissions
          .filter(c => c.status !== "cancelled")
          .reduce((s, c) => s + parseFloat(c.commissionAmount || "0"), 0);
        return { ...d, score, lifetime, totalEarned: parseFloat(totalEarned.toFixed(2)) };
      }));

      // Sort by score desc
      enriched.sort((a, b) => b.score - a.score);

      res.json(enriched.map((d, i) => ({ ...d, rank: i + 1 })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Manually add a commission entry ────────────────────────────────
  app.post("/api/director/admin/commission", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const { directorId, referredEmail, planName, planAmount, commissionRate, notes, periodStart } = req.body;
      if (!directorId || !planName || !planAmount) {
        return res.status(400).json({ error: "directorId, planName, and planAmount are required" });
      }
      const rate = parseFloat(commissionRate || "0.20");
      const amount = parseFloat(planAmount);
      const commissionAmount = (amount * rate).toFixed(2);
      const period = periodStart || new Date().toISOString().slice(0, 7);

      const parsed = insertDirectorCommissionSchema.safeParse({
        directorId: parseInt(directorId),
        referredEmail: referredEmail || null,
        planName,
        planAmount: amount.toFixed(2),
        commissionRate: rate.toFixed(4),
        commissionAmount,
        status: "pending",
        periodStart: period,
        notes: notes || null,
      });
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });

      const [created] = await db.insert(directorCommissions).values(parsed.data).returning();
      res.status(201).json({ success: true, commission: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Update commission status (pending → paid / cancelled) ──────────
  app.put("/api/director/admin/commission/:id/status", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!["pending", "paid", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const [updated] = await db.update(directorCommissions)
        .set({ status, updatedAt: new Date() })
        .where(eq(directorCommissions.id, id))
        .returning();
      res.json({ success: true, commission: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Get all commissions ─────────────────────────────────────────────
  app.get("/api/director/admin/commissions", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const commissions = await db.select({
        commission: directorCommissions,
        directorName: regionalDirectors.name,
        directorCity: regionalDirectors.city,
        directorState: regionalDirectors.state,
      })
        .from(directorCommissions)
        .leftJoin(regionalDirectors, eq(directorCommissions.directorId, regionalDirectors.id))
        .orderBy(desc(directorCommissions.createdAt))
        .limit(200);
      res.json(commissions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DIRECTOR: Get activity history by id (must be after /admin/* routes) ───
  app.get("/api/director/:id/activities", async (req, res) => {
    try {
      const directorId = parseInt(req.params.id);
      if (isNaN(directorId)) return res.status(400).json({ error: "Invalid director id" });
      const activities = await db.select().from(directorActivities)
        .where(eq(directorActivities.directorId, directorId))
        .orderBy(desc(directorActivities.createdAt))
        .limit(50);
      res.json(activities);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DIRECTOR: Get commissions by id (must be after /admin/* routes) ────────
  app.get("/api/director/:id/commissions", async (req, res) => {
    try {
      const directorId = parseInt(req.params.id);
      if (isNaN(directorId)) return res.status(400).json({ error: "Invalid director id" });
      const commissions = await db.select().from(directorCommissions)
        .where(eq(directorCommissions.directorId, directorId))
        .orderBy(desc(directorCommissions.createdAt))
        .limit(100);
      res.json(commissions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Send outreach email to a prospect ──────────────────────────────
  app.post("/api/director/admin/outreach/send", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const { prospectName, prospectEmail, prospectCity, prospectState, templateKey, customSubject, customHtml, notes } = req.body;
      if (!prospectName || !prospectEmail) return res.status(400).json({ error: "Name and email are required" });

      const city = prospectCity || "your city";
      let subject: string;
      let html: string;

      if (templateKey && EMAIL_TEMPLATES[templateKey]) {
        subject = EMAIL_TEMPLATES[templateKey].subject;
        html = EMAIL_TEMPLATES[templateKey].html(prospectName, city);
      } else if (customSubject && customHtml) {
        subject = customSubject;
        html = customHtml.replace(/\{name\}/g, prospectName).replace(/\{city\}/g, city);
      } else {
        return res.status(400).json({ error: "Either templateKey or customSubject+customHtml is required" });
      }

      const sent = await sendEmail({ to: prospectEmail, subject, html });
      const status = sent ? "sent" : "failed";

      const [record] = await db.insert(directorOutreach).values({
        prospectName,
        prospectEmail,
        prospectCity: prospectCity || null,
        prospectState: prospectState || null,
        templateUsed: templateKey || "custom",
        status,
        notes: notes || null,
      }).returning();

      res.json({ success: sent, record });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Get outreach log ────────────────────────────────────────────────
  app.get("/api/director/admin/outreach", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const records = await db.select().from(directorOutreach).orderBy(desc(directorOutreach.sentAt)).limit(200);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Update outreach status (e.g. mark replied) ─────────────────────
  app.put("/api/director/admin/outreach/:id/status", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!["sent", "failed", "replied", "not_interested"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const [updated] = await db.update(directorOutreach).set({ status }).where(eq(directorOutreach.id, id)).returning();
      res.json({ success: true, record: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log("[ROUTES] Regional Director routes registered");
}
