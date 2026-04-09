import type { Express } from "express";
import { db } from "../db";
import { regionalDirectors, directorActivities, insertRegionalDirectorSchema, insertDirectorActivitySchema } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

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

  // ── DIRECTOR: Get my activity history ─────────────────────────────────────
  app.get("/api/director/:id/activities", async (req, res) => {
    try {
      const directorId = parseInt(req.params.id);
      const activities = await db.select().from(directorActivities)
        .where(eq(directorActivities.directorId, directorId))
        .orderBy(desc(directorActivities.createdAt))
        .limit(50);
      res.json(activities);
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

  console.log("[ROUTES] Regional Director routes registered");
}
