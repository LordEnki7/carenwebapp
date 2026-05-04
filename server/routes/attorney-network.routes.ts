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
  userPersonalAttorneys,
  insertUserPersonalAttorneySchema,
} from "@shared/schema";
import { getOpenAIClient } from "../aiService";
import nodemailer from "nodemailer";
import { sendNextDripEmail, DRIP_SEQUENCE_LENGTH } from "../attorneyDripEmails";

const ADMIN_EMAIL = "info@carenalert.com";

function isAdmin(req: any): boolean {
  const adminKey = req.headers["x-admin-key"] || req.query.adminKey;
  return adminKey === "CAREN_ADMIN_2025_PRODUCTION";
}

// Haversine distance in miles between two lat/lng points
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geocode a city+state using OpenStreetMap Nominatim (already used elsewhere in the app)
async function geocodeLocation(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${city}, ${state}, USA`);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=us`;
    const res = await fetch(url, { headers: { "User-Agent": "CARENAlert/1.0 info@carenalert.com" } });
    const data = await res.json() as any[];
    if (data?.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn("[GEOCODE] Failed:", e);
  }
  return null;
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
          content: `You are an attorney network quality reviewer for C.A.R.E.N.™ Alert 
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
          from: '"C.A.R.E.N.™ Alert Network" <info@carenalert.com>',
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
          const [inserted] = await db.insert(attorneys).values(newAttorneyData).returning();

          // Geocode attorney location in the background
          setImmediate(async () => {
            try {
              const counties = (updated.countiesServed as string[] | null) || [];
              const city = counties.length > 0 ? counties[0] : "";
              const state = (updated.statesLicensed as string[])[0] || updated.barState || "";
              const coords = await geocodeLocation(city || state, state);
              if (coords && inserted?.id) {
                await db.execute(sql`
                  UPDATE attorneys SET lat = ${coords.lat}, lng = ${coords.lng}
                  WHERE id = ${inserted.id}
                `);
                console.log(`[GEOCODE] Attorney ${inserted.id} geocoded: ${coords.lat}, ${coords.lng}`);

                // Notify waitlisted users within 50 miles
                try {
                  const waitlist = await db.execute(sql`
                    SELECT email FROM attorney_state_waitlist
                    WHERE state ILIKE ${state} AND notified = false
                  `);
                  for (const row of (waitlist.rows || []) as any[]) {
                    await transporter.sendMail({
                      from: '"C.A.R.E.N.™ Alert" <info@carenalert.com>',
                      to: row.email,
                      subject: "An Attorney Just Joined Your Area!",
                      html: `<h2>Great news!</h2><p>A verified civil rights attorney has just joined the C.A.R.E.N.™ Alert network in your area (<strong>${state}</strong>).</p><p><a href="https://carenalert.com/attorneys">View Attorneys →</a></p><p>— The C.A.R.E.N.™ Alert Team</p>`,
                    });
                  }
                  if ((waitlist.rows || []).length > 0) {
                    await db.execute(sql`
                      UPDATE attorney_state_waitlist SET notified = true
                      WHERE state ILIKE ${state} AND notified = false
                    `);
                  }
                } catch (notifyErr) {
                  console.warn("[ATTORNEY] Waitlist notify failed:", notifyErr);
                }
              }
            } catch (geoErr) {
              console.warn("[GEOCODE] Background geocode failed:", geoErr);
            }
          });
        }

        // Send approval email to attorney
        try {
          await transporter.sendMail({
            from: '"C.A.R.E.N.™ Alert Network" <info@carenalert.com>',
            to: updated.email,
            subject: "Welcome to the C.A.R.E.N.™ Alert Attorney Network!",
            html: `
              <h2>Welcome, ${updated.firstName}!</h2>
              <p>Your application to join the <strong>C.A.R.E.N.™ Alert Legal Access Network</strong> has been approved.</p>
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
              <p>— The C.A.R.E.N.™ Alert Team</p>
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

  // ── DRIP EMAIL: send next email in 5-step sequence ───────────────────────
  app.post("/api/attorney-network/outreach/:id/drip", isAuthenticated, async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Admin access required" });
    try {
      const leadId = parseInt(req.params.id);
      const [lead] = await db.select().from(attorneyOutreach).where(eq(attorneyOutreach.id, leadId));
      if (!lead) return res.status(404).json({ message: "Lead not found" });

      const currentStep = lead.dripStep ?? 0;
      if (currentStep >= DRIP_SEQUENCE_LENGTH) {
        return res.status(400).json({ message: "Drip sequence already completed — all 5 emails sent" });
      }
      if (!lead.email) {
        return res.status(400).json({ message: "No email address on this lead" });
      }

      const { nextStep, subject } = await sendNextDripEmail(
        {
          email: lead.email,
          contactName: lead.contactName ?? undefined,
          firmName: lead.firmName,
          state: lead.state,
          city: lead.city ?? undefined,
        },
        currentStep
      );

      await db
        .update(attorneyOutreach)
        .set({
          dripStep: nextStep,
          dripLastSentAt: new Date(),
          status: lead.status === "not_contacted" ? "contacted" : lead.status,
          lastContactDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(attorneyOutreach.id, leadId));

      res.json({ success: true, stepSent: currentStep + 1, nextStep, subject });
    } catch (error: any) {
      console.error("[DRIP] Error sending drip email:", error);
      res.status(500).json({ message: error.message || "Failed to send drip email" });
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

  // ─── GEOGRAPHIC COVERAGE CHECK ───────────────────────────────────────────

  // Returns {covered: bool, nearestMiles: number|null} for a given lat/lng
  app.get("/api/attorney-coverage-check", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      if (isNaN(lat) || isNaN(lng)) {
        return res.json({ covered: false, nearestMiles: null });
      }

      const rows = await db.execute(sql`
        SELECT lat, lng FROM attorneys
        WHERE profile_status = 'approved' AND lat IS NOT NULL AND lng IS NOT NULL
      `);

      let nearest: number | null = null;
      for (const row of (rows.rows || []) as any[]) {
        const d = haversineDistance(lat, lng, parseFloat(row.lat), parseFloat(row.lng));
        if (nearest === null || d < nearest) nearest = d;
      }

      res.json({ covered: nearest !== null && nearest <= 50, nearestMiles: nearest !== null ? Math.round(nearest) : null });
    } catch (error) {
      console.error("[COVERAGE] check error:", error);
      res.json({ covered: false, nearestMiles: null });
    }
  });

  // ─── MY ATTORNEY (USER PERSONAL ATTORNEYS) ───────────────────────────────

  app.get("/api/my-attorneys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      const rows = await db
        .select()
        .from(userPersonalAttorneys)
        .where(eq(userPersonalAttorneys.userId, userId))
        .orderBy(desc(userPersonalAttorneys.isPrimary));
      res.json(rows);
    } catch (error) {
      console.error("[MY ATTORNEY] fetch error:", error);
      res.status(500).json({ message: "Failed to fetch your attorneys" });
    }
  });

  app.post("/api/my-attorneys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      const parsed = insertUserPersonalAttorneySchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      // If this is set as primary, unset any existing primary
      if (parsed.data.isPrimary) {
        await db
          .update(userPersonalAttorneys)
          .set({ isPrimary: false })
          .where(eq(userPersonalAttorneys.userId, userId));
      }

      const [created] = await db.insert(userPersonalAttorneys).values(parsed.data).returning();
      res.json(created);
    } catch (error) {
      console.error("[MY ATTORNEY] create error:", error);
      res.status(500).json({ message: "Failed to add attorney" });
    }
  });

  app.patch("/api/my-attorneys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      const id = parseInt(req.params.id);

      const existing = await db
        .select()
        .from(userPersonalAttorneys)
        .where(and(eq(userPersonalAttorneys.id, id), eq(userPersonalAttorneys.userId, userId)))
        .limit(1);
      if (existing.length === 0) return res.status(404).json({ message: "Not found" });

      // If setting as primary, unset others first
      if (req.body.isPrimary) {
        await db
          .update(userPersonalAttorneys)
          .set({ isPrimary: false })
          .where(eq(userPersonalAttorneys.userId, userId));
      }

      const [updated] = await db
        .update(userPersonalAttorneys)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(userPersonalAttorneys.id, id))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error("[MY ATTORNEY] update error:", error);
      res.status(500).json({ message: "Failed to update attorney" });
    }
  });

  app.delete("/api/my-attorneys/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      const id = parseInt(req.params.id);
      await db
        .delete(userPersonalAttorneys)
        .where(and(eq(userPersonalAttorneys.id, id), eq(userPersonalAttorneys.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("[MY ATTORNEY] delete error:", error);
      res.status(500).json({ message: "Failed to delete attorney" });
    }
  });

  // ─── ATTORNEY STATE WAITLIST ─────────────────────────────────────────────

  // Check how many approved attorneys exist in a given state
  app.get("/api/attorney-state-check", async (req, res) => {
    try {
      const { state } = req.query;
      if (!state) return res.json({ count: 0, state: "" });

      const result = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM attorneys
        WHERE active_status = true
          AND verified = true
          AND profile_status = 'approved'
          AND (
            states_licensed::text ILIKE ${`%${state}%`}
            OR bar_state ILIKE ${state as string}
          )
      `);

      const count = parseInt((result.rows?.[0] as any)?.count ?? "0", 10);
      res.json({ count, state });
    } catch (error) {
      console.error("[ATTORNEY] check-state error:", error);
      res.json({ count: 0, state: req.query.state });
    }
  });

  // Save a user to the attorney state waitlist
  app.post("/api/attorney-state-waitlist", async (req: any, res) => {
    try {
      const { email, state, userId } = req.body;
      if (!email || !state) {
        return res.status(400).json({ message: "Email and state are required" });
      }

      await db.execute(sql`
        INSERT INTO attorney_state_waitlist (user_id, email, state, notified)
        VALUES (${userId || null}, ${email}, ${state}, false)
        ON CONFLICT DO NOTHING
      `);

      res.json({ success: true, message: "You'll be notified when an attorney joins your state." });
    } catch (error) {
      console.error("[ATTORNEY] state waitlist error:", error);
      res.status(500).json({ message: "Failed to save notification preference" });
    }
  });

  // Admin: view all state waitlist entries
  app.get("/api/attorney-state-waitlist", async (req: any, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });
    try {
      const rows = await db.execute(sql`
        SELECT state, COUNT(*) as count
        FROM attorney_state_waitlist
        WHERE notified = false
        GROUP BY state
        ORDER BY count DESC
      `);
      res.json(rows.rows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch waitlist" });
    }
  });

  console.log("[ROUTES] Attorney network routes registered successfully");
}
