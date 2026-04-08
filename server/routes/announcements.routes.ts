import type { Express } from "express";
import { db } from "../db";
import { announcements, giveawayEntries } from "@shared/schema";
import { eq, desc, and, or, isNull, gte } from "drizzle-orm";

export function registerAnnouncementRoutes(app: Express) {

  // Admin: Get ALL announcements (active + inactive)
  app.get("/api/announcements/all", async (req, res) => {
    try {
      const adminKey = req.headers["x-admin-key"];
      if (adminKey !== "CAREN_ADMIN_2025_PRODUCTION") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const rows = await db.select().from(announcements)
        .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public: Get all active announcements
  app.get("/api/announcements", async (req, res) => {
    try {
      const now = new Date();
      const rows = await db.select().from(announcements)
        .where(and(
          eq(announcements.isActive, true),
          or(isNull(announcements.expiresAt), gte(announcements.expiresAt, now))
        ))
        .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Create announcement or giveaway
  app.post("/api/announcements", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { title, content, type, imageUrl, isPinned, expiresAt } = req.body;
      if (!title || !content) return res.status(400).json({ error: "Title and content required" });

      const [row] = await db.insert(announcements).values({
        title,
        content,
        type: type || "announcement",
        imageUrl: imageUrl || null,
        isPinned: isPinned || false,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: userId,
      }).returning();

      res.json({ success: true, announcement: row });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Toggle active status
  app.patch("/api/announcements/:id/toggle", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const [existing] = await db.select().from(announcements)
        .where(eq(announcements.id, parseInt(req.params.id)));
      if (!existing) return res.status(404).json({ error: "Not found" });

      const [updated] = await db.update(announcements)
        .set({ isActive: !existing.isActive })
        .where(eq(announcements.id, existing.id))
        .returning();

      res.json({ success: true, announcement: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Delete announcement
  app.delete("/api/announcements/:id", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      await db.update(announcements)
        .set({ isActive: false })
        .where(eq(announcements.id, parseInt(req.params.id)));

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // User: Enter giveaway
  app.post("/api/announcements/:id/enter", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const announcementId = parseInt(req.params.id);
      const [announcement] = await db.select().from(announcements)
        .where(and(eq(announcements.id, announcementId), eq(announcements.type, "giveaway")));
      if (!announcement) return res.status(404).json({ error: "Giveaway not found" });

      const existing = await db.select().from(giveawayEntries)
        .where(and(eq(giveawayEntries.announcementId, announcementId), eq(giveawayEntries.userId, userId)));
      if (existing.length > 0) return res.status(409).json({ error: "already_entered" });

      await db.insert(giveawayEntries).values({ announcementId, userId });

      const entries = await db.select().from(giveawayEntries)
        .where(eq(giveawayEntries.announcementId, announcementId));

      res.json({ success: true, totalEntries: entries.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // User: Check if entered a giveaway
  app.get("/api/announcements/:id/entry-status", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.json({ entered: false });

      const announcementId = parseInt(req.params.id);
      const existing = await db.select().from(giveawayEntries)
        .where(and(eq(giveawayEntries.announcementId, announcementId), eq(giveawayEntries.userId, userId)));

      const entries = await db.select().from(giveawayEntries)
        .where(eq(giveawayEntries.announcementId, announcementId));

      res.json({ entered: existing.length > 0, totalEntries: entries.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
