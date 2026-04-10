import type { Express } from "express";
import { db } from "../db";
import { regionalDirectors, directorActivities, directorCommissions, insertRegionalDirectorSchema, insertDirectorActivitySchema, insertDirectorCommissionSchema } from "@shared/schema";
import { eq, desc, and, sql, asc } from "drizzle-orm";

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

  console.log("[ROUTES] Regional Director routes registered");
}
