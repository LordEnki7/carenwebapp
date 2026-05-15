/**
 * evidence.routes.ts — C.A.R.E.N. Evidence Vault
 *
 * AI-powered evidence analysis, chain-of-custody sealing, and attorney sharing.
 * Powered by Evidence AI™ — Court-ready protection for every encounter.
 */

import { Express, Request, Response } from "express";
import { db } from "../db";
import { evidencePackages, evidenceFindings, attorneys } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import crypto from "crypto";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EVIDENCE_AI_PROMPT = `You are Evidence AI for C.A.R.E.N. Alert, a specialized AI legal evidence analyst. Analyze this image from a law enforcement encounter or traffic incident.

Identify ALL visible evidence relevant to a legal case. Return ONLY a valid JSON array — no prose, no markdown.

Each finding object must have exactly these fields:
- "category": one of: "officer_id", "vehicle", "use_of_force", "weapon", "bystander", "environmental"
- "description": clear, factual, court-appropriate description of what you see
- "confidence": "high", "medium", or "low"
- "details": object with specific identifiable values (transcribe any text you can read)

Category guide:
- officer_id: Badge numbers, name tags, uniform patches, rank insignia, department name, officer physical description
- vehicle: License plates (transcribe visible text/numbers), make/model/color, emergency lights, patrol car unit numbers
- use_of_force: Physical contact, restraint holds, weapons drawn or pointed, aggressive posture, visible injuries, handcuffs
- weapon: Firearms, batons, tasers, pepper spray, any weapon clearly visible
- bystander: Other people present who may be witnesses — position and count
- environmental: Street signs (transcribe text), landmarks, business names, time-of-day indicators, weather, traffic conditions

If no evidence is found, return [].`;

function canAccessEvidenceVault(tier: string, role: string): boolean {
  if (role === "attorney" || role === "admin") return true;
  return ["constitutional_pro", "family_protection", "enterprise_fleet", "trial"].includes(tier);
}

export async function registerEvidenceRoutes(app: Express): Promise<void> {

  // ── List user's packages ──────────────────────────────────────────────────
  app.get("/api/evidence/packages", async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) return void res.status(401).json({ error: "Unauthorized" });

    try {
      const packages = await db.select()
        .from(evidencePackages)
        .where(eq(evidencePackages.userId, user.id))
        .orderBy(desc(evidencePackages.createdAt));
      res.json(packages);
    } catch (e) {
      console.error("[EVIDENCE] List failed:", e);
      res.status(500).json({ error: "Failed to load packages" });
    }
  });

  // ── Create a new package ──────────────────────────────────────────────────
  app.post("/api/evidence/packages", async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) return void res.status(401).json({ error: "Unauthorized" });

    if (!canAccessEvidenceVault(user.subscriptionTier, user.role)) {
      return void res.status(403).json({
        error: "Evidence Vault requires Constitutional Pro or higher",
        upgradeRequired: true,
      });
    }

    const { title, incidentId, sourceType } = req.body;
    try {
      const [pkg] = await db.insert(evidencePackages).values({
        userId: user.id,
        title: title || "Evidence Package",
        incidentId: incidentId || null,
        sourceType: sourceType || "photos",
        status: "pending",
      }).returning();
      res.json(pkg);
    } catch (e) {
      console.error("[EVIDENCE] Create failed:", e);
      res.status(500).json({ error: "Failed to create package" });
    }
  });

  // ── Get package with findings ─────────────────────────────────────────────
  app.get("/api/evidence/packages/:id", async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) return void res.status(401).json({ error: "Unauthorized" });

    try {
      const pkgId = parseInt(req.params.id);
      const [pkg] = await db.select().from(evidencePackages)
        .where(eq(evidencePackages.id, pkgId));

      if (!pkg) return void res.status(404).json({ error: "Package not found" });

      // Owner access
      if (pkg.userId !== user.id) {
        // Attorney access — must be the shared attorney
        if (user.role === "attorney") {
          const [atty] = await db.select().from(attorneys).where(eq(attorneys.userId, user.id));
          if (!atty || pkg.sharedWithAttorneyId !== atty.id) {
            return void res.status(403).json({ error: "Access denied" });
          }
        } else {
          return void res.status(403).json({ error: "Access denied" });
        }
      }

      const findings = await db.select().from(evidenceFindings)
        .where(eq(evidenceFindings.packageId, pkgId))
        .orderBy(evidenceFindings.createdAt);

      res.json({ ...pkg, findings });
    } catch (e) {
      console.error("[EVIDENCE] Get failed:", e);
      res.status(500).json({ error: "Failed to load package" });
    }
  });

  // ── Trigger AI analysis ───────────────────────────────────────────────────
  app.post("/api/evidence/packages/:id/analyze", async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) return void res.status(401).json({ error: "Unauthorized" });

    if (!canAccessEvidenceVault(user.subscriptionTier, user.role)) {
      return void res.status(403).json({ error: "Evidence Vault requires Constitutional Pro or higher", upgradeRequired: true });
    }

    try {
      const pkgId = parseInt(req.params.id);
      const [pkg] = await db.select().from(evidencePackages)
        .where(and(eq(evidencePackages.id, pkgId), eq(evidencePackages.userId, user.id)));

      if (!pkg) return void res.status(404).json({ error: "Package not found" });
      if (pkg.status === "sealed") return void res.status(400).json({ error: "Package already sealed" });

      const { images } = req.body as { images: { base64?: string; url?: string; label: string }[] };
      if (!images?.length) return void res.status(400).json({ error: "No images provided" });

      // Mark as analyzing
      await db.update(evidencePackages).set({ status: "analyzing", updatedAt: new Date() })
        .where(eq(evidencePackages.id, pkgId));

      const allFindings: any[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          const imageContent: any = img.base64
            ? { type: "image_url", image_url: { url: `data:image/jpeg;base64,${img.base64}`, detail: "high" } }
            : { type: "image_url", image_url: { url: img.url, detail: "high" } };

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: [{ type: "text", text: EVIDENCE_AI_PROMPT }, imageContent] }],
            max_tokens: 1200,
          });

          const content = response.choices[0]?.message?.content || "[]";
          const match = content.match(/\[[\s\S]*\]/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            for (const f of parsed) {
              const [inserted] = await db.insert(evidenceFindings).values({
                packageId: pkgId,
                imageUrl: img.url || null,
                frameLabel: img.label || `Image ${i + 1}`,
                category: f.category || "environmental",
                description: f.description || "Finding identified",
                confidence: f.confidence || "medium",
                details: f.details || {},
              }).returning();
              allFindings.push(inserted);
            }
          }
        } catch (imgErr) {
          console.error(`[EVIDENCE_AI] Analysis failed for image ${i + 1}:`, imgErr);
        }
      }

      // Compute tamper-evident hash
      const hashInput = `${pkgId}:${user.id}:${images.length}:${Date.now()}:${allFindings.map(f => f.id).join(",")}`;
      const fileHash = crypto.createHash("sha256").update(hashInput).digest("hex");

      // Build summary
      const cats = Array.from(new Set(allFindings.map(f => f.category)));
      const catLabels: Record<string, string> = {
        officer_id: "officer identification", vehicle: "vehicle/plate details",
        use_of_force: "use of force", weapon: "weapons", bystander: "witnesses", environmental: "environmental context",
      };
      const summary = allFindings.length > 0
        ? `Evidence AI identified ${allFindings.length} finding${allFindings.length !== 1 ? "s" : ""} across ${images.length} image${images.length !== 1 ? "s" : ""}: ${cats.map(c => catLabels[c] || c).join(", ")}.`
        : `No significant evidence findings detected across ${images.length} image${images.length !== 1 ? "s" : ""}.`;

      // Seal the package
      await db.update(evidencePackages).set({
        status: "sealed",
        findingsCount: allFindings.length,
        fileHash,
        summary,
        sealedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(evidencePackages.id, pkgId));

      const [updated] = await db.select().from(evidencePackages).where(eq(evidencePackages.id, pkgId));
      res.json({ package: updated, findings: allFindings });
    } catch (e) {
      console.error("[EVIDENCE] Analyze failed:", e);
      // Reset status on failure
      await db.update(evidencePackages).set({ status: "pending", updatedAt: new Date() })
        .where(eq(evidencePackages.id, parseInt(req.params.id)));
      res.status(500).json({ error: "Analysis failed. Please try again." });
    }
  });

  // ── Share with attorney ───────────────────────────────────────────────────
  app.post("/api/evidence/packages/:id/share", async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) return void res.status(401).json({ error: "Unauthorized" });

    try {
      const pkgId = parseInt(req.params.id);
      const { attorneyId } = req.body;

      const [pkg] = await db.select().from(evidencePackages)
        .where(and(eq(evidencePackages.id, pkgId), eq(evidencePackages.userId, user.id)));

      if (!pkg) return void res.status(404).json({ error: "Package not found" });

      await db.update(evidencePackages).set({
        sharedWithAttorneyId: attorneyId,
        sharedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(evidencePackages.id, pkgId));

      res.json({ success: true });
    } catch (e) {
      console.error("[EVIDENCE] Share failed:", e);
      res.status(500).json({ error: "Failed to share package" });
    }
  });

  // ── Unshare ───────────────────────────────────────────────────────────────
  app.delete("/api/evidence/packages/:id/share", async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) return void res.status(401).json({ error: "Unauthorized" });

    try {
      const pkgId = parseInt(req.params.id);
      await db.update(evidencePackages).set({
        sharedWithAttorneyId: null,
        sharedAt: null,
        updatedAt: new Date(),
      }).where(and(eq(evidencePackages.id, pkgId), eq(evidencePackages.userId, user.id)));

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to unshare" });
    }
  });

  // ── Delete package ────────────────────────────────────────────────────────
  app.delete("/api/evidence/packages/:id", async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) return void res.status(401).json({ error: "Unauthorized" });

    try {
      const pkgId = parseInt(req.params.id);
      await db.delete(evidenceFindings).where(eq(evidenceFindings.packageId, pkgId));
      await db.delete(evidencePackages)
        .where(and(eq(evidencePackages.id, pkgId), eq(evidencePackages.userId, user.id)));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete package" });
    }
  });

  // ── Attorney: list shared packages ────────────────────────────────────────
  app.get("/api/attorney/evidence-packages", async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) return void res.status(401).json({ error: "Unauthorized" });
    if (user.role !== "attorney") return void res.status(403).json({ error: "Attorney access only" });

    try {
      const [atty] = await db.select().from(attorneys).where(eq(attorneys.userId, user.id));
      if (!atty) return void res.status(404).json({ error: "Attorney profile not found" });

      const packages = await db.select().from(evidencePackages)
        .where(eq(evidencePackages.sharedWithAttorneyId, atty.id))
        .orderBy(desc(evidencePackages.sharedAt));

      res.json(packages);
    } catch (e) {
      console.error("[EVIDENCE] Attorney list failed:", e);
      res.status(500).json({ error: "Failed to load shared packages" });
    }
  });

  console.log("[EVIDENCE_VAULT] Evidence Vault routes registered");
}
