import type { Express } from "express";
import { db } from "../db";
import { isAuthenticated } from "../auth";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import {
  attorneys,
  attorneyApplications,
  attorneyOutreach,
  insertAttorneyApplicationSchema,
  insertAttorneyOutreachSchema,
} from "@shared/schema";
import { getOpenAIClient } from "../aiService";
import nodemailer from "nodemailer";

const ADMIN_EMAIL = "info@carenalert.com";

function isAdmin(req: any): boolean {
  const adminKey = req.headers["x-admin-key"] || req.query.adminKey;
  return adminKey === "CAREN_ADMIN_2025_PRODUCTION";
}

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "projectdna7@carenalert.com",
    pass: process.env.SMTP_PASSWORD,
  },
});

// ─── MATCHING ALGORITHM ─────────────────────────────────────────────────────

const incidentPracticeMap: Record<string, string[]> = {
  traffic_stop: ["Traffic Law", "Criminal Defense", "Civil Rights", "Police Misconduct"],
  accident: ["Personal Injury", "Motor Vehicle Defense", "Insurance Disputes"],
  civil_rights: ["Civil Rights", "Police Misconduct", "Constitutional Law"],
  insurance: ["Insurance Disputes", "Consumer Protection"],
  criminal_defense: ["Criminal Defense", "Traffic Law"],
  dui: ["Criminal Defense", "Traffic Law", "DUI Defense"],
};

function scoreAttorney(attorney: any, request: any): number {
  let score = 0;

  if (!attorney.verified && attorney.profile_status !== "approved") return 0;

  // State match — required
  const statesLicensed = (attorney.statesLicensed || attorney.states_licensed || []) as string[];
  if (!statesLicensed.includes(request.state)) return 0;
  score += 25;

  // County match
  const counties = (attorney.countiesServed || attorney.counties_served || []) as string[];
  if (request.county && counties.includes(request.county)) score += 20;

  // City match
  if (request.city && counties.includes(request.city)) score += 10;

  // Practice area fit
  const needed = incidentPracticeMap[request.incidentType] || [];
  const specialties = (attorney.specialties || []) as string[];
  const practiceMatches = specialties.filter((a: string) =>
    needed.some((n) => a.toLowerCase().includes(n.toLowerCase()))
  ).length;
  score += practiceMatches * 10;

  // Language match
  const languages = (attorney.languages || ["English"]) as string[];
  if (request.language && languages.includes(request.language)) score += 10;

  // Urgency / emergency
  if (request.urgent && attorney.emergencyAvailable) score += 15;

  // Availability status
  const status = attorney.availabilityStatus || attorney.availability_status || "offline";
  if (status === "available") score += 15;
  else if (status === "emergency_only" && request.urgent) score += 10;
  else if (status === "busy") score += 2;
  else if (status === "offline") score -= 20;

  // Performance weight
  const responseRate = attorney.responseRate || 0;
  const profileScore = attorney.profileScore || attorney.profile_score || 0;
  score += Math.round(responseRate * 0.1);
  score += Math.round(profileScore * 0.05);

  // Response speed
  const avgMin = attorney.avgResponseMinutes || attorney.avg_response_minutes || 60;
  if (avgMin <= 5) score += 10;
  else if (avgMin <= 15) score += 7;
  else if (avgMin <= 30) score += 4;
  else if (avgMin <= 60) score += 2;

  return Math.max(0, score);
}

// ─── AI SCORING FOR APPLICATIONS ────────────────────────────────────────────

async function aiScoreApplication(app: any): Promise<{ score: number; notes: string }> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an attorney network quality reviewer for C.A.R.E.N. 
Score this attorney application 0-100 based on:
- Practice fit (traffic defense, civil rights, criminal defense, personal injury = high value)
- Emergency availability (huge plus)
- Languages beyond English (plus)
- Years of experience
- Bio quality
- Malpractice insurance
- Consultation type (free = better for users)
Return JSON: { "score": number, "notes": "brief reason" }`,
        },
        {
          role: "user",
          content: JSON.stringify({
            practiceAreas: app.practice_areas,
            states: app.states_licensed,
            emergencyAvailable: app.emergency_available,
            availability24_7: app.availability_24_7,
            languages: app.languages,
            yearsExperience: app.years_experience,
            bio: app.bio,
            malpracticeInsurance: app.malpractice_insurance,
            consultationType: app.consultation_type,
          }),
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });
    return JSON.parse(response.choices[0].message.content || '{"score":50,"notes":""}');
  } catch {
    return { score: 50, notes: "Auto-scored (AI unavailable)" };
  }
}

export function registerAttorneyNetworkRoutes(app: Express) {
  console.log("[ROUTES] Registering attorney network routes...");

  // ── PHASE 1: ATTORNEY APPLICATION FORM ──────────────────────────────────

  // Public endpoint — no auth required
  app.post("/api/attorney-network/apply", async (req, res) => {
    try {
      const parsed = insertAttorneyApplicationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid application data", errors: parsed.error.errors });
      }

      const data = parsed.data;

      // Check duplicate email
      const existing = await db
        .select({ id: attorneyApplications.id })
        .from(attorneyApplications)
        .where(eq(attorneyApplications.email, data.email))
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ message: "An application with this email already exists." });
      }

      const [application] = await db
        .insert(attorneyApplications)
        .values({ ...data, verificationStatus: "pending" })
        .returning();

      // AI score in background
      aiScoreApplication(application).then(async ({ score, notes }) => {
        await db
          .update(attorneyApplications)
          .set({ score, adminNotes: notes, updatedAt: new Date() })
          .where(eq(attorneyApplications.id, application.id));
      });

      // Notify admin
      try {
        await transporter.sendMail({
          from: '"C.A.R.E.N. Network" <info@carenalert.com>',
          to: ADMIN_EMAIL,
          subject: `New Attorney Application — ${data.firstName} ${data.lastName} (${data.firmName})`,
          html: `
            <h2>New Attorney Network Application</h2>
            <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Firm:</strong> ${data.firmName}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Bar Number:</strong> ${data.barNumber}</p>
            <p><strong>States Licensed:</strong> ${(data.statesLicensed as string[]).join(", ")}</p>
            <p><strong>Practice Areas:</strong> ${(data.practiceAreas as string[]).join(", ")}</p>
            <p><strong>Emergency Available:</strong> ${data.emergencyAvailable ? "Yes" : "No"}</p>
            <p>Review at: <a href="https://carenalert.com/support-admin">Admin Panel</a></p>
          `,
        });
      } catch (emailErr) {
        console.warn("[ATTORNEY NETWORK] Admin email failed:", emailErr);
      }

      res.json({ success: true, message: "Application submitted successfully. We will review and contact you within 3 business days.", id: application.id });
    } catch (error: any) {
      console.error("[ATTORNEY NETWORK] Apply error:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // ── PHASE 2: ADMIN APPROVAL PANEL ───────────────────────────────────────

  app.get("/api/attorney-network/applications", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admin access required" });
    try {
      const { status } = req.query;
      let query = db.select().from(attorneyApplications).orderBy(desc(attorneyApplications.createdAt));
      const apps = await query;
      const filtered = status ? apps.filter((a) => a.verificationStatus === status) : apps;
      res.json(filtered);
    } catch (error) {
      console.error("[ATTORNEY NETWORK] Fetch applications error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.patch("/api/attorney-network/applications/:id/decision", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admin access required" });
    try {
      const { id } = req.params;
      const { decision, adminNotes, score } = req.body; // decision: approved | rejected | hold

      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id || "admin";

      const [updated] = await db
        .update(attorneyApplications)
        .set({
          verificationStatus: decision,
          adminNotes,
          score: score !== undefined ? score : undefined,
          approvedBy: decision === "approved" ? userId : null,
          approvedAt: decision === "approved" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(attorneyApplications.id, parseInt(id)))
        .returning();

      if (!updated) return res.status(404).json({ message: "Application not found" });

      // If approved, create an attorney record
      if (decision === "approved") {
        const existing = await db
          .select({ id: attorneys.id })
          .from(attorneys)
          .where(eq(attorneys.email, updated.email))
          .limit(1);

        if (existing.length === 0) {
          const newAttorneyData: any = {
            firstName: updated.firstName,
            lastName: updated.lastName,
            email: updated.email,
            phone: updated.phone || "",
            firmName: updated.firmName,
            firmWebsite: updated.firmWebsite,
            barNumber: updated.barNumber,
            barState: (updated.statesLicensed as string[])[0] || "",
            specialties: updated.practiceAreas,
            statesLicensed: updated.statesLicensed,
            languages: updated.languages,
            emergencyAvailable: updated.emergencyAvailable,
            malpracticeInsurance: updated.malpracticeInsurance,
            agreementSigned: updated.agreementSigned,
            consultationType: updated.consultationType,
            countiesServed: updated.countiesServed,
            profileStatus: "approved",
            profileScore: updated.score || 50,
            yearsExperience: updated.yearsExperience,
            bio: updated.bio,
            verified: false,
            activeStatus: true,
          };
          await db.insert(attorneys).values(newAttorneyData);
        }

        // Send approval email to attorney
        try {
          await transporter.sendMail({
            from: '"C.A.R.E.N. Network" <info@carenalert.com>',
            to: updated.email,
            subject: "Welcome to the C.A.R.E.N. Attorney Network!",
            html: `
              <h2>Welcome, ${updated.firstName}!</h2>
              <p>Your application to join the <strong>C.A.R.E.N. Legal Access Network</strong> has been approved.</p>
              <p>Your profile is now active in our verified attorney directory.</p>
              <p>Next steps:</p>
              <ul>
                <li>Log in to your attorney portal to complete your profile</li>
                <li>Set your availability status</li>
                <li>Add your coverage areas and counties</li>
              </ul>
              <p>Visit: <a href="https://carenalert.com/attorney-portal">Attorney Portal →</a></p>
              <br/>
              <p>Questions? Email us at info@carenalert.com</p>
              <p>— The C.A.R.E.N. Team</p>
            `,
          });
        } catch (emailErr) {
          console.warn("[ATTORNEY NETWORK] Approval email failed:", emailErr);
        }
      }

      res.json({ success: true, application: updated });
    } catch (error: any) {
      console.error("[ATTORNEY NETWORK] Decision error:", error);
      res.status(500).json({ message: "Failed to process decision" });
    }
  });

  app.post("/api/attorney-network/applications/:id/rescore", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admin access required" });
    try {
      const [app] = await db
        .select()
        .from(attorneyApplications)
        .where(eq(attorneyApplications.id, parseInt(req.params.id)))
        .limit(1);

      if (!app) return res.status(404).json({ message: "Not found" });

      const { score, notes } = await aiScoreApplication(app);
      const [updated] = await db
        .update(attorneyApplications)
        .set({ score, adminNotes: notes, updatedAt: new Date() })
        .where(eq(attorneyApplications.id, app.id))
        .returning();

      res.json({ score, notes, application: updated });
    } catch (error) {
      console.error("[ATTORNEY NETWORK] Rescore error:", error);
      res.status(500).json({ message: "Failed to rescore" });
    }
  });

  // ── PHASE 3: ATTORNEY PORTAL (attorney-facing) ──────────────────────────

  // Get own profile (attorney who is also a user)
  app.get("/api/attorney-network/my-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id || req.user?.claims?.sub;
      const [attorney] = await db
        .select()
        .from(attorneys)
        .where(eq(attorneys.userId, userId))
        .limit(1);

      if (!attorney) return res.status(404).json({ message: "Attorney profile not found" });
      res.json(attorney);
    } catch (error) {
      console.error("[ATTORNEY NETWORK] My profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update own profile
  app.patch("/api/attorney-network/my-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id || req.user?.claims?.sub;
      const [attorney] = await db
        .select({ id: attorneys.id })
        .from(attorneys)
        .where(eq(attorneys.userId, userId))
        .limit(1);

      if (!attorney) return res.status(404).json({ message: "Attorney profile not found" });

      const allowed = [
        "bio", "phone", "firmWebsite", "languages", "emergencyAvailable",
        "availabilityStatus", "countiesServed", "consultationType", "malpracticeInsurance",
        "availability", "profileImage",
      ];
      const updates: Record<string, any> = { updatedAt: new Date() };
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      const [updated] = await db
        .update(attorneys)
        .set(updates)
        .where(eq(attorneys.id, attorney.id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("[ATTORNEY NETWORK] Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Toggle availability status
  app.patch("/api/attorney-network/my-availability", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id || req.user?.claims?.sub;
      const { availabilityStatus } = req.body;

      const validStatuses = ["available", "busy", "offline", "emergency_only"];
      if (!validStatuses.includes(availabilityStatus)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const [attorney] = await db
        .select({ id: attorneys.id })
        .from(attorneys)
        .where(eq(attorneys.userId, userId))
        .limit(1);

      if (!attorney) return res.status(404).json({ message: "Attorney profile not found" });

      await db
        .update(attorneys)
        .set({ availabilityStatus, lastActive: new Date(), updatedAt: new Date() } as any)
        .where(eq(attorneys.id, attorney.id));

      res.json({ success: true, availabilityStatus });
    } catch (error) {
      console.error("[ATTORNEY NETWORK] Availability update error:", error);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  // ── PHASE 4: UPGRADED MATCHING ALGORITHM ────────────────────────────────

  app.post("/api/attorney-network/match", async (req, res) => {
    try {
      const { incidentType, state, county, city, language, urgent, limit = 10 } = req.body;

      if (!state) return res.status(400).json({ message: "state is required" });

      const allAttorneys = await db.select().from(attorneys).where(eq(attorneys.activeStatus, true));

      const scored = allAttorneys
        .map((att) => ({ attorney: att, score: scoreAttorney(att, { incidentType, state, county, city, language, urgent }) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      const results = scored.map(({ attorney: att, score }) => ({
        id: att.id,
        fullName: `${att.firstName} ${att.lastName}`,
        firmName: att.firmName,
        practiceAreas: att.specialties,
        languages: att.languages,
        availabilityStatus: (att as any).availabilityStatus || "offline",
        consultationType: (att as any).consultationType || "paid",
        avgResponseMinutes: (att as any).avgResponseMinutes || 60,
        countiesServed: (att as any).countiesServed || [],
        emergencyAvailable: att.emergencyAvailable,
        rating: att.rating,
        phone: att.phone,
        email: att.email,
        bio: att.bio,
        yearsExperience: att.yearsExperience,
        matchScore: score,
      }));

      res.json(results);
    } catch (error) {
      console.error("[ATTORNEY NETWORK] Match error:", error);
      res.status(500).json({ message: "Failed to match attorneys" });
    }
  });

  // ── PHASE 5: OUTREACH CRM ────────────────────────────────────────────────

  app.get("/api/attorney-network/outreach", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admin access required" });
    try {
      const { state, status } = req.query;
      const leads = await db.select().from(attorneyOutreach).orderBy(desc(attorneyOutreach.createdAt));
      const filtered = leads.filter((l) => {
        if (state && l.state !== state) return false;
        if (status && l.status !== status) return false;
        return true;
      });
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch outreach leads" });
    }
  });

  app.post("/api/attorney-network/outreach", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admin access required" });
    try {
      const parsed = insertAttorneyOutreachSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });

      const [lead] = await db.insert(attorneyOutreach).values(parsed.data).returning();
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to create outreach lead" });
    }
  });

  app.patch("/api/attorney-network/outreach/:id", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admin access required" });
    try {
      const { id } = req.params;
      const allowed = ["status", "notes", "contactMethod", "lastContactDate", "nextFollowUpDate", "score", "contactName", "contactTitle", "email", "phone"];
      const updates: Record<string, any> = { updatedAt: new Date() };
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      const [updated] = await db
        .update(attorneyOutreach)
        .set(updates)
        .where(eq(attorneyOutreach.id, parseInt(id)))
        .returning();

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update outreach lead" });
    }
  });

  app.delete("/api/attorney-network/outreach/:id", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admin access required" });
    try {
      await db.delete(attorneyOutreach).where(eq(attorneyOutreach.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Stats for admin overview
  app.get("/api/attorney-network/stats", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admin access required" });
    try {
      const [appStats] = await db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE verification_status = 'pending') as pending,
          COUNT(*) FILTER (WHERE verification_status = 'approved') as approved,
          COUNT(*) FILTER (WHERE verification_status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE verification_status = 'hold') as hold,
          COUNT(*) as total
        FROM attorney_applications
      `);

      const [outreachStats] = await db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'not_contacted') as not_contacted,
          COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
          COUNT(*) FILTER (WHERE status = 'interested') as interested,
          COUNT(*) FILTER (WHERE status = 'onboarded') as onboarded,
          COUNT(*) as total
        FROM attorney_outreach
      `);

      const [networkStats] = await db.execute(sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE availability_status = 'available') as available,
          COUNT(*) FILTER (WHERE emergency_available = true) as emergency_ready,
          COUNT(*) FILTER (WHERE verified = true) as verified
        FROM attorneys
        WHERE active_status = true
      `);

      res.json({ applications: appStats, outreach: outreachStats, network: networkStats });
    } catch (error) {
      console.error("[ATTORNEY NETWORK] Stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  console.log("[ROUTES] Attorney network routes registered successfully");
}
