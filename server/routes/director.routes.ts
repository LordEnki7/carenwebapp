import type { Express } from "express";
import { db } from "../db";
import { regionalDirectors, directorActivities, directorCommissions, directorOutreach, directorPayoutRequests, attorneys, users, insertRegionalDirectorSchema, insertDirectorActivitySchema, insertDirectorCommissionSchema } from "@shared/schema";
import { eq, desc, and, sql, asc, ilike, or } from "drizzle-orm";
import { sendEmail } from "../mailer";

function generateDirectorCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "DIR-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function sendApprovalEmail(director: any) {
  const directorCode = director.directorCode || "";
  const referralLink = `https://carenalert.com/?dref=${directorCode}`;
  const playbookLink = `https://carenalert.com/director-playbook`;
  const portalLink = `https://carenalert.com/director-portal`;
  await sendEmail({
    to: director.email,
    subject: "You're Approved — Welcome to the C.A.R.E.N. Director Team",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; color: #1a1a1a; padding: 40px 36px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="margin-bottom: 28px;">
          <h2 style="color: #0e7490; font-size: 22px; margin: 0 0 4px;">C.A.R.E.N.</h2>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Citizen Assistance for Roadside Emergencies and Navigation</p>
        </div>
        <p style="font-size: 15px; margin-bottom: 20px;">Hello ${director.name},</p>
        <p style="line-height: 1.7;">Your application has been reviewed and <strong style="color: #0e7490;">you are officially approved</strong> as a Regional Director for C.A.R.E.N. in <strong>${director.city}, ${director.state}</strong>.</p>
        <p style="line-height: 1.7;">Your job is not to pressure people. Your job is to open doors, introduce the mission, build trust, and create local momentum for C.A.R.E.N.</p>
        <div style="background: #f0f9ff; border-left: 4px solid #0e7490; padding: 20px 24px; margin: 28px 0; border-radius: 4px;">
          <p style="font-weight: bold; margin: 0 0 12px; color: #0e7490;">Your Director Resources</p>
          <p style="margin: 6px 0;"><strong>Your Personal Referral Link:</strong><br/>
          <a href="${referralLink}" style="color: #0e7490;">${referralLink}</a><br/>
          <span style="color: #6b7280; font-size: 12px;">Share this link when recruiting users — commissions are tracked automatically.</span></p>
          <p style="margin: 14px 0 6px 0;"><strong>Your Director Code:</strong> <span style="font-family: monospace; background: #e0f2fe; padding: 2px 8px; border-radius: 4px;">${directorCode}</span></p>
          <p style="margin: 14px 0 6px 0;"><a href="${portalLink}" style="color: #0e7490; font-weight: bold;">Access Your Director Portal →</a></p>
          <p style="margin: 6px 0;"><a href="${playbookLink}" style="color: #0e7490; font-weight: bold;">Download Your Director Playbook →</a></p>
        </div>
        <p style="line-height: 1.7;">Log into your portal to track your activity, view commissions, and access outreach scripts. Your playbook has everything you need to start opening doors.</p>
        <p style="line-height: 1.7; margin-top: 28px;">Welcome to the team.<br/><br/>Respectfully,<br/><strong>Shawn Williams</strong><br/><span style="color: #6b7280; font-size: 13px;">Founder, C.A.R.E.N.</span></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;"/>
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">C.A.R.E.N. · carenalert.com · <a href="__unsubscribe_url__" style="color: #9ca3af;">Unsubscribe</a></p>
      </div>
    `,
  });
}

const EMAIL_TEMPLATES: Record<string, { subject: string; html: (name: string, city: string) => string }> = {
  initial_outreach: {
    subject: "Appointment as C.A.R.E.N. Regional Director – {city}",
    html: (name, city) => `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; color: #1a1a1a; padding: 40px 36px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="margin-bottom: 28px;">
          <h2 style="color: #0e7490; font-size: 22px; margin: 0 0 4px;">C.A.R.E.N.</h2>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Citizen Assistance for Roadside Emergencies and Navigation</p>
        </div>
        <p style="font-size: 15px; margin-bottom: 20px;">Hello ${name},</p>
        <p style="line-height: 1.7;">I'm reaching out to personally welcome you as a <strong>Regional Director for C.A.R.E.N. in ${city}</strong>.</p>
        <p style="line-height: 1.7;">C.A.R.E.N. (Citizen Assistance for Roadside Emergencies and Navigation) was built with a clear mission — to give drivers protection, documentation, and access to legal support in real-time when situations escalate on the road.</p>
        <p style="line-height: 1.7;">As a Regional Director, you are not just promoting an app — you are helping establish a system that can impact real-world situations where people need support the most.</p>
        <p style="line-height: 1.7;">Your role will be to help build C.A.R.E.N.'s presence in your region by connecting with attorneys, engaging your local community, and increasing awareness of the platform.</p>
        <p style="line-height: 1.7;">You will be among the first group helping shape how C.A.R.E.N. grows across cities, and your contributions will directly influence its expansion.</p>
        <p style="line-height: 1.7;">We are building something meaningful — and I'm glad to have you as part of it.</p>
        <p style="line-height: 1.7;">More details on your responsibilities and next steps are included below.</p>
        <div style="background: #f0f9ff; border-left: 4px solid #0e7490; padding: 20px 24px; margin: 28px 0; border-radius: 4px;">
          <p style="margin: 0 0 12px; font-weight: bold; color: #0e7490; font-size: 15px;">C.A.R.E.N. REGIONAL DIRECTOR PROGRAM</p>
          <p style="margin: 0 0 8px; font-weight: 600;">Title: Regional Director – ${city}</p>
          <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">The Regional Director is responsible for expanding C.A.R.E.N.'s presence, awareness, and adoption within their assigned region by building local partnerships, recruiting attorneys, and driving user growth.</p>
          <p style="margin: 0 0 8px; font-weight: 600; color: #0e7490;">Your Role as a Regional Director:</p>
          <ul style="margin: 0 0 12px; padding-left: 20px; line-height: 1.9; color: #374151;">
            <li><strong>Growth Operator</strong> — Build local momentum and drive user adoption</li>
            <li><strong>Market Builder</strong> — Recruit attorneys and create local partnerships</li>
            <li><strong>Local Ambassador</strong> — Represent C.A.R.E.N. in your community</li>
          </ul>
          <p style="margin: 0; color: #6b7280; font-size: 13px; font-style: italic;">Think: Uber launch teams. DoorDash early city builders. Ground-floor impact.</p>
        </div>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px 24px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 12px; font-weight: bold; color: #111827;">C.A.R.E.N. REGIONAL DIRECTOR AGREEMENT</p>
          <p style="margin: 0 0 8px; color: #374151; font-size: 14px;">This Agreement is made between <strong>Caren Web App LLC</strong> and <strong>${name}</strong>.</p>
          <table style="width: 100%; font-size: 13px; color: #374151; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-weight: 600; width: 140px; vertical-align: top;">1. Role</td><td style="padding: 6px 0;">Appointed as Regional Director for ${city}. Director is an independent contractor, not an employee.</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; vertical-align: top;">2. Purpose</td><td style="padding: 6px 0;">Recruit attorneys, increase user adoption, and build local partnerships.</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; vertical-align: top;">3. Responsibilities</td><td style="padding: 6px 0;">Contact and recruit attorneys · Promote the app online and offline · Build local business partnerships · Submit weekly activity reports</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; vertical-align: top;">4. Compensation</td><td style="padding: 6px 0;">Performance-based commissions · Growth milestone bonuses · Future leadership roles / equity consideration. (No guaranteed salary unless agreed in writing.)</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; vertical-align: top;">5. Territory</td><td style="padding: 6px 0;">Assigned to ${city}. May become exclusive based on performance.</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; vertical-align: top;">6. Conduct</td><td style="padding: 6px 0;">No misrepresentation · No legal advice · No unauthorized agreements · Professional conduct at all times</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; vertical-align: top;">7. Termination</td><td style="padding: 6px 0;">Either party may terminate at any time.</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; vertical-align: top;">8. Confidentiality</td><td style="padding: 6px 0;">All internal strategies and systems are confidential.</td></tr>
          </table>
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 13px;">
            <p style="margin: 0 0 10px; font-weight: 600;">9. Acceptance</p>
            <p style="margin: 0 0 6px;">Director Name: <span style="border-bottom: 1px solid #9ca3af; display: inline-block; width: 200px;">&nbsp;</span></p>
            <p style="margin: 0 0 6px;">Signature: <span style="border-bottom: 1px solid #9ca3af; display: inline-block; width: 210px;">&nbsp;</span></p>
            <p style="margin: 0 0 16px;">Date: <span style="border-bottom: 1px solid #9ca3af; display: inline-block; width: 220px;">&nbsp;</span></p>
            <p style="margin: 0 0 6px;"><strong>Caren Web App LLC</strong></p>
            <p style="margin: 0 0 6px;">Signature: <span style="border-bottom: 1px solid #9ca3af; display: inline-block; width: 210px;">&nbsp;</span></p>
            <p style="margin: 0;">Date: <span style="border-bottom: 1px solid #9ca3af; display: inline-block; width: 220px;">&nbsp;</span></p>
          </div>
        </div>
        <p style="line-height: 1.7; margin-top: 28px;">Respectfully,<br/><strong>Shawn Williams</strong><br/><span style="color: #6b7280; font-size: 13px;">Founder, C.A.R.E.N.</span></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;"/>
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">C.A.R.E.N. · carenalert.com · <a href="__unsubscribe_url__" style="color: #9ca3af;">Unsubscribe</a></p>
      </div>
    `,
  },
  follow_up: {
    subject: "Following Up — Regional Director Role in {city} | C.A.R.E.N.",
    html: (name, city) => `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; color: #1a1a1a; padding: 40px 36px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="margin-bottom: 28px;">
          <h2 style="color: #0e7490; font-size: 22px; margin: 0 0 4px;">C.A.R.E.N.</h2>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Citizen Assistance for Roadside Emergencies and Navigation</p>
        </div>
        <p style="font-size: 15px;">Hello ${name},</p>
        <p style="line-height: 1.7;">I wanted to follow up on the <strong>Regional Director opportunity in ${city}</strong> that I reached out about recently.</p>
        <p style="line-height: 1.7;">C.A.R.E.N. is already live on the Google Play Store and growing. The director role in your area is still open, but we are actively moving forward with selections.</p>
        <p style="line-height: 1.7;">As a reminder — this is a ground-floor position. You would be one of the first people shaping how C.A.R.E.N. expands in ${city}, with performance-based commissions and a path to senior leadership roles.</p>
        <p style="line-height: 1.7;">If you have any questions or want to talk through the role, simply reply to this email. I'm happy to connect.</p>
        <p style="line-height: 1.7; margin-top: 28px;">Respectfully,<br/><strong>Shawn Williams</strong><br/><span style="color: #6b7280; font-size: 13px;">Founder, C.A.R.E.N.</span></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;"/>
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">C.A.R.E.N. · carenalert.com · <a href="__unsubscribe_url__" style="color: #9ca3af;">Unsubscribe</a></p>
      </div>
    `,
  },
  final_invite: {
    subject: "Last Message — Regional Director | C.A.R.E.N. ${city}",
    html: (name, city) => `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; color: #1a1a1a; padding: 40px 36px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="margin-bottom: 28px;">
          <h2 style="color: #0e7490; font-size: 22px; margin: 0 0 4px;">C.A.R.E.N.</h2>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Citizen Assistance for Roadside Emergencies and Navigation</p>
        </div>
        <p style="font-size: 15px;">Hello ${name},</p>
        <p style="line-height: 1.7;">This will be my last message regarding the <strong>Regional Director position in ${city}</strong>.</p>
        <p style="line-height: 1.7;">We are finalizing our director selections and I didn't want to close out without giving you one final opportunity to be part of this.</p>
        <p style="line-height: 1.7;">C.A.R.E.N. is live, growing, and the window to come in at the ground level in your city is closing. If this is something you want to be part of — now is the time.</p>
        <p style="line-height: 1.7;">Simply reply to this email and we will get the process started. If not, I wish you all the best.</p>
        <p style="line-height: 1.7; margin-top: 28px;">Respectfully,<br/><strong>Shawn Williams</strong><br/><span style="color: #6b7280; font-size: 13px;">Founder, C.A.R.E.N.</span></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;"/>
        <p style="color: #9ca3af; font-size: 11px; text-align: center;">C.A.R.E.N. · carenalert.com · <a href="__unsubscribe_url__" style="color: #9ca3af;">Unsubscribe</a></p>
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
  app.post("/api/director/apply", async (req: any, res) => {
    try {
      const { contractSignature, ...rest } = req.body;
      if (!contractSignature || contractSignature.trim().length < 2) {
        return res.status(400).json({ error: "Contract signature is required to complete your application." });
      }
      const parsed = insertRegionalDirectorSchema.safeParse({
        ...rest,
        status: "pending",
        level: "regional_director",
        contractSignature: contractSignature.trim(),
        contractSignedAt: new Date(),
        contractVersion: "v1.0-2025",
        contractIp: req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown",
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
      // Auto-generate unique director code
      let directorCode = generateDirectorCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing2 = await db.select().from(regionalDirectors).where(eq(regionalDirectors.directorCode, directorCode));
        if (!existing2.length) break;
        directorCode = generateDirectorCode();
        attempts++;
      }
      const [created] = await db.insert(regionalDirectors).values({ ...parsed.data, directorCode }).returning();
      console.log(`[DIRECTOR APPLY] New application: ${created.name} (${created.email}) from ${created.city}, ${created.state} — Contract signed as "${created.contractSignature}"`);
      res.status(201).json({ success: true, id: created.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Invite a director by email ────────────────────────────────────
  app.post("/api/director/admin/invite", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const { name, email, phone, territory, level, adminNotes } = req.body;
      if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: "Name and email are required" });

      const emailLower = email.toLowerCase().trim();

      // Check if already exists
      const existing = await db.select().from(regionalDirectors).where(eq(regionalDirectors.email, emailLower));
      if (existing.length) return res.status(409).json({ error: "A director with this email already exists" });

      // Generate secure invite token
      const { randomBytes } = await import("crypto");
      const token = randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

      // Generate director code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "DIR-";
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

      // Create the director record (city/state filled in later — empty string satisfies NOT NULL)
      const [director] = await db.insert(regionalDirectors).values({
        name: name.trim(),
        email: emailLower,
        phone: phone?.trim() || null,
        city: "",
        state: "",
        territory: territory?.trim() || null,
        level: level || "regional_director",
        status: "pending",
        adminNotes: adminNotes?.trim() || null,
        directorCode: code,
        inviteToken: token,
        inviteTokenExpiry: expiry,
        inviteSentAt: new Date(),
      }).returning();

      // Send invite email
      const baseUrl = req.headers.origin || `https://${req.headers.host}` || "https://carenalert.com";
      const inviteUrl = `${baseUrl}/director-invite/${token}`;

      await sendEmail({
        to: emailLower,
        subject: "You're Invited to Join the C.A.R.E.N.™ Regional Director Network",
        html: `
          <div style="font-family:Arial,sans-serif;background:#0a0f1a;color:#e2e8f0;padding:32px;max-width:560px;margin:0 auto;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="color:#00e5ff;font-size:22px;margin:0;">C.A.R.E.N.™ ALERT</h1>
              <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Citizen Assistance for Roadside Emergencies and Navigation</p>
            </div>
            <h2 style="color:#ffffff;font-size:18px;">Welcome, ${name}!</h2>
            <p style="color:#94a3b8;line-height:1.6;">You've been personally invited by the C.A.R.E.N.™ ALERT team to join our <strong style="color:#00e5ff;">Regional Director Network</strong>.</p>
            <p style="color:#94a3b8;line-height:1.6;">As a Regional Director, you'll earn commissions helping grow C.A.R.E.N.'s mission of keeping families safe and legally protected during roadside encounters.</p>
            <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;margin:24px 0;">
              <p style="color:#64748b;font-size:12px;margin:0 0 8px;">Your Director Code:</p>
              <p style="color:#00e5ff;font-size:20px;font-weight:bold;margin:0;letter-spacing:2px;">${code}</p>
            </div>
            <p style="color:#94a3b8;line-height:1.6;">Click the button below to complete your profile and set up your secure portal login. This link expires in <strong style="color:#fbbf24;">72 hours</strong>.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${inviteUrl}" style="background:#00e5ff;color:#0a0f1a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Complete My Profile →</a>
            </div>
            <p style="color:#475569;font-size:12px;text-align:center;">If the button doesn't work, copy and paste this link:<br/><span style="color:#00e5ff;">${inviteUrl}</span></p>
            <hr style="border-color:#1e293b;margin:24px 0;"/>
            <p style="color:#475569;font-size:11px;text-align:center;">C.A.R.E.N.™ ALERT · carenalert.com<br/>This invite expires in 72 hours. If you didn't expect this email, you can safely ignore it.</p>
          </div>
        `,
        text: `Welcome to the C.A.R.E.N.™ Regional Director Network!\n\nYou've been invited by the C.A.R.E.N.™ team.\n\nComplete your profile here: ${inviteUrl}\n\nYour Director Code: ${code}\n\nThis link expires in 72 hours.`,
      });

      console.log(`[DIRECTOR INVITE] Sent invite to ${emailLower} — token expires ${expiry.toISOString()}`);
      res.json({ success: true, directorCode: code, message: `Invite sent to ${emailLower}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── PUBLIC: Validate invite token ────────────────────────────────────────
  app.get("/api/director/invite/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const rows = await db.select().from(regionalDirectors).where(eq(regionalDirectors.inviteToken, token));
      if (!rows.length) return res.status(404).json({ error: "Invalid or expired invite link" });
      const director = rows[0];
      if (!director.inviteTokenExpiry || director.inviteTokenExpiry < new Date()) {
        return res.status(410).json({ error: "This invite link has expired. Please ask the admin to resend your invite." });
      }
      res.json({ name: director.name, email: director.email, directorCode: director.directorCode, territory: director.territory || "" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── PUBLIC: Complete registration via invite token ────────────────────────
  app.post("/api/director/invite/:token/complete", async (req, res) => {
    try {
      const { token } = req.params;
      const { pin, phone, territory, bio, linkedinUrl, referralSource, experience, contractSignature } = req.body;

      if (!pin || pin.toString().length !== 6) return res.status(400).json({ error: "A 6-digit PIN is required" });
      if (!contractSignature?.trim()) return res.status(400).json({ error: "Contract signature is required" });

      const rows = await db.select().from(regionalDirectors).where(eq(regionalDirectors.inviteToken, token));
      if (!rows.length) return res.status(404).json({ error: "Invalid invite link" });
      const director = rows[0];
      if (!director.inviteTokenExpiry || director.inviteTokenExpiry < new Date()) {
        return res.status(410).json({ error: "Invite link has expired" });
      }

      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";

      // Build background text combining bio, experience, and referral source
      const backgroundParts = [
        bio?.trim() ? `Bio: ${bio.trim()}` : "",
        experience?.trim() ? `Experience: ${experience.trim()}` : "",
        referralSource?.trim() ? `Referred by: ${referralSource.trim()}` : "",
      ].filter(Boolean);

      // Build social links combining existing + LinkedIn
      const socialLinksText = [
        director.socialLinks || "",
        linkedinUrl?.trim() ? `LinkedIn: ${linkedinUrl.trim()}` : "",
      ].filter(Boolean).join("\n");

      const [updated] = await db.update(regionalDirectors)
        .set({
          portalPin: pin.toString().trim(),
          phone: phone?.trim() || director.phone,
          territory: territory?.trim() || director.territory,
          background: backgroundParts.length ? backgroundParts.join("\n") : director.background,
          socialLinks: socialLinksText || director.socialLinks,
          contractSignature: contractSignature.trim(),
          contractSignedAt: new Date(),
          contractVersion: "v1.0-2025",
          contractIp: ip,
          contractMethod: "electronic",
          inviteToken: null,          // consume the token
          inviteTokenExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(regionalDirectors.id, director.id))
        .returning();

      console.log(`[DIRECTOR INVITE COMPLETE] ${director.name} completed registration via invite`);
      res.json({ success: true, email: director.email, name: director.name });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Resend invite email ────────────────────────────────────────────
  app.post("/api/director/admin/:id/resend-invite", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const rows = await db.select().from(regionalDirectors).where(eq(regionalDirectors.id, id));
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      const director = rows[0];

      const { randomBytes } = await import("crypto");
      const token = randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 72 * 60 * 60 * 1000);

      await db.update(regionalDirectors).set({ inviteToken: token, inviteTokenExpiry: expiry, inviteSentAt: new Date(), updatedAt: new Date() }).where(eq(regionalDirectors.id, id));

      const baseUrl = req.headers.origin || `https://${req.headers.host}` || "https://carenalert.com";
      const inviteUrl = `${baseUrl}/director-invite/${token}`;

      await sendEmail({
        to: director.email,
        subject: "Your C.A.R.E.N.™ Director Invite Link (Resent)",
        html: `<div style="font-family:Arial,sans-serif;background:#0a0f1a;color:#e2e8f0;padding:32px;max-width:560px;margin:0 auto;border-radius:12px;"><h2 style="color:#00e5ff;">Hi ${director.name},</h2><p style="color:#94a3b8;">Here's your refreshed invite link to complete your C.A.R.E.N.™ Director profile:</p><div style="text-align:center;margin:28px 0;"><a href="${inviteUrl}" style="background:#00e5ff;color:#0a0f1a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Complete My Profile →</a></div><p style="color:#475569;font-size:12px;text-align:center;">Expires in 72 hours · ${inviteUrl}</p></div>`,
        text: `Hi ${director.name},\n\nHere's your refreshed invite link:\n${inviteUrl}\n\nExpires in 72 hours.`,
      });

      res.json({ success: true, message: `Invite resent to ${director.email}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DIRECTOR: Submit external contract document link ──────────────────────
  app.put("/api/director/portal-contract-doc", async (req: any, res) => {
    try {
      const { email, pin, contractDocumentUrl, contractMethod } = req.body;
      if (!email || !pin) return res.status(401).json({ error: "Not authenticated" });
      if (!contractDocumentUrl?.trim()) return res.status(400).json({ error: "Document link is required" });

      const rows = await db.select().from(regionalDirectors).where(eq(regionalDirectors.email, email.toLowerCase().trim()));
      if (!rows.length) return res.status(404).json({ error: "Director not found" });
      const director = rows[0];
      if (!director.portalPin || director.portalPin !== pin.toString().trim()) return res.status(401).json({ error: "Invalid session" });

      const [updated] = await db.update(regionalDirectors)
        .set({
          contractDocumentUrl: contractDocumentUrl.trim(),
          contractMethod: contractMethod || "external",
          updatedAt: new Date(),
        })
        .where(eq(regionalDirectors.id, director.id))
        .returning();
      console.log(`[DIRECTOR CONTRACT DOC] ${director.name} submitted contract doc: ${contractDocumentUrl}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Manually set contract document for a director ──────────────────
  app.put("/api/director/admin/:id/contract-doc", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const { contractDocumentUrl, contractMethod, contractSignature, contractSignedAt } = req.body;
      const [updated] = await db.update(regionalDirectors)
        .set({
          contractDocumentUrl: contractDocumentUrl?.trim() || null,
          contractMethod: contractMethod || "paper",
          contractSignature: contractSignature?.trim() || undefined,
          contractSignedAt: contractSignedAt ? new Date(contractSignedAt) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(regionalDirectors.id, id))
        .returning();
      res.json({ success: true, director: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DIRECTOR: Portal PIN Login (standalone, no app session required) ────────
  app.post("/api/director/portal-login", async (req: any, res) => {
    try {
      const { email, pin } = req.body;
      if (!email || !pin) return res.status(400).json({ error: "Email and PIN are required" });

      const rows = await db.select().from(regionalDirectors).where(eq(regionalDirectors.email, email.toLowerCase().trim()));
      if (!rows.length) return res.status(404).json({ error: "No director account found with that email" });

      const director = rows[0];
      if (!director.portalPin) return res.status(403).json({ error: "No PIN set for this account. Contact your administrator." });
      if (director.portalPin !== pin.toString().trim()) return res.status(401).json({ error: "Incorrect PIN" });
      if (director.status === "rejected") return res.status(403).json({ error: "Your director application was not approved." });

      // Return safe director data (no PIN)
      const { portalPin: _pin, ...safeDirector } = director;
      return res.json({ success: true, director: safeDirector });
    } catch (err) {
      console.error("[DIRECTOR PORTAL LOGIN]", err);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // ── DIRECTOR: Verify portal session (re-fetch by email after login) ─────────
  app.get("/api/director/portal-profile", async (req: any, res) => {
    try {
      const email = req.query.email as string;
      const pin = req.query.pin as string;
      if (!email || !pin) return res.status(401).json({ error: "Not authenticated" });

      const rows = await db.select().from(regionalDirectors).where(eq(regionalDirectors.email, email.toLowerCase().trim()));
      if (!rows.length) return res.status(404).json({ error: "Director not found" });

      const director = rows[0];
      if (!director.portalPin || director.portalPin !== pin.toString().trim()) return res.status(401).json({ error: "Invalid session" });

      const weekOf = getWeekStart();
      const activities = await db.select().from(directorActivities)
        .where(and(eq(directorActivities.directorId, director.id), eq(directorActivities.weekOf, weekOf)));
      const allActivities = await db.select().from(directorActivities).where(eq(directorActivities.directorId, director.id));
      const lifetime = allActivities.reduce((acc: any, a) => {
        acc[a.type] = (acc[a.type] || 0) + (a.count || 1);
        return acc;
      }, {});

      const { portalPin: _pin, ...safeDirector } = director;
      return res.json({ ...safeDirector, activities, lifetime });
    } catch (err) {
      console.error("[DIRECTOR PORTAL PROFILE]", err);
      return res.status(500).json({ error: "Failed to load profile" });
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
      // Fire approval email automatically
      if (status === "approved" && updated) {
        sendApprovalEmail(updated).catch(err => console.error("[DIRECTOR] Approval email failed:", err));
      }
      res.json({ success: true, director: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Set / Reset Director Portal PIN ────────────────────────────────
  app.put("/api/director/admin/:id/pin", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const { pin } = req.body;
      const newPin = pin ? pin.toString().trim() : Math.floor(100000 + Math.random() * 900000).toString();
      if (newPin.length < 4 || newPin.length > 10) return res.status(400).json({ error: "PIN must be 4–10 digits" });
      const [updated] = await db.update(regionalDirectors)
        .set({ portalPin: newPin, updatedAt: new Date() })
        .where(eq(regionalDirectors.id, id))
        .returning();
      res.json({ success: true, pin: newPin, director: { id: updated.id, name: updated.name, email: updated.email } });
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
        subject = EMAIL_TEMPLATES[templateKey].subject
          .replace(/\{city\}/g, city)
          .replace(/\{name\}/g, prospectName)
          .replace(/\$\{city\}/g, city);
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

  // ── DIRECTOR: Submit payout request ───────────────────────────────────────
  app.post("/api/director/payout-request", async (req: any, res) => {
    try {
      const { directorId, amountRequested, paymentMethod, paymentHandle } = req.body;
      if (!directorId || !amountRequested) return res.status(400).json({ error: "directorId and amountRequested required" });
      const amount = parseFloat(amountRequested);
      if (isNaN(amount) || amount < 25) return res.status(400).json({ error: "Minimum payout request is $25.00" });
      const [request] = await db.insert(directorPayoutRequests).values({
        directorId: parseInt(directorId),
        amountRequested: amountRequested.toString(),
        paymentMethod: paymentMethod || null,
        paymentHandle: paymentHandle || null,
        status: "pending",
      }).returning();
      res.json({ success: true, request });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Get all payout requests (must be BEFORE /:id route) ────────────
  app.get("/api/director/admin/payout-requests", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const requests = await db.select({
        id: directorPayoutRequests.id,
        directorId: directorPayoutRequests.directorId,
        directorName: regionalDirectors.name,
        directorEmail: regionalDirectors.email,
        directorCity: regionalDirectors.city,
        directorState: regionalDirectors.state,
        amountRequested: directorPayoutRequests.amountRequested,
        paymentMethod: directorPayoutRequests.paymentMethod,
        paymentHandle: directorPayoutRequests.paymentHandle,
        status: directorPayoutRequests.status,
        adminNotes: directorPayoutRequests.adminNotes,
        requestedAt: directorPayoutRequests.requestedAt,
        processedAt: directorPayoutRequests.processedAt,
      })
      .from(directorPayoutRequests)
      .leftJoin(regionalDirectors, eq(directorPayoutRequests.directorId, regionalDirectors.id))
      .orderBy(desc(directorPayoutRequests.requestedAt));
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Update payout request status ───────────────────────────────────
  app.put("/api/director/admin/payout-request/:id/status", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
      const id = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      if (!["pending", "paid", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });
      const [updated] = await db.update(directorPayoutRequests)
        .set({ status, adminNotes: adminNotes || null, processedAt: status !== "pending" ? new Date() : null })
        .where(eq(directorPayoutRequests.id, id))
        .returning();
      res.json({ success: true, request: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DIRECTOR: Get my own payout requests (must be AFTER admin route) ────────
  app.get("/api/director/:id/payout-requests", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid director id" });
      const requests = await db.select().from(directorPayoutRequests)
        .where(eq(directorPayoutRequests.directorId, id))
        .orderBy(desc(directorPayoutRequests.requestedAt));
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── PUBLIC: Track director referral on signup ─────────────────────────────
  // Called from auth flow when ?dref= param detected
  app.post("/api/director/track-ref", async (req: any, res) => {
    try {
      const { userId, directorCode } = req.body;
      if (!userId || !directorCode) return res.status(400).json({ error: "userId and directorCode required" });
      const dirRow = await db.select().from(regionalDirectors)
        .where(and(eq(regionalDirectors.directorCode, directorCode), eq(regionalDirectors.status, "approved")));
      if (!dirRow.length) return res.status(404).json({ error: "Director code not found" });
      await db.update(users).set({ directorRef: directorCode }).where(eq(users.id, userId));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── ADMIN: Create commission for a director referral ──────────────────────
  // Also called automatically from subscription webhook
  app.post("/api/director/admin/create-commission-for-ref", async (req, res) => {
    try {
      if (req.headers["x-admin-key"] !== ADMIN_KEY) return res.status(400).json({ error: "Forbidden" });
      const { referredUserId, planName, planAmount } = req.body;
      if (!referredUserId || !planName || !planAmount) return res.status(400).json({ error: "referredUserId, planName, planAmount required" });
      const userRows = await db.select().from(users).where(eq(users.id, referredUserId));
      if (!userRows.length || !userRows[0].directorRef) return res.status(404).json({ error: "User not found or no director ref" });
      const dirCode = userRows[0].directorRef;
      const dirRows = await db.select().from(regionalDirectors).where(eq(regionalDirectors.directorCode, dirCode));
      if (!dirRows.length) return res.status(404).json({ error: "Director not found" });
      const director = dirRows[0];
      const RATES: Record<string, number> = { regional_director: 0.20, senior_director: 0.25, state_director: 0.30, national_director: 0.35 };
      const rate = RATES[director.level || "regional_director"] || 0.20;
      const amount = (parseFloat(planAmount) * rate).toFixed(2);
      const periodStart = new Date().toISOString().slice(0, 7);
      const [commission] = await db.insert(directorCommissions).values({
        directorId: director.id,
        referralCode: dirCode,
        referredUserId,
        planName,
        planAmount: planAmount.toString(),
        commissionRate: rate.toString(),
        commissionAmount: amount,
        status: "pending",
        periodStart,
      }).returning();
      res.json({ success: true, commission });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── PUBLIC: Attorney Directory ─────────────────────────────────────────────
  app.get("/api/attorneys/directory", async (req, res) => {
    try {
      const { state, search } = req.query as { state?: string; search?: string };

      // Fetch all approved attorneys using only columns that exist in the actual DB
      const rows = await db.execute(sql`
        SELECT
          a.id,
          a.firm_name AS "firmName",
          a.specialties,
          a.states AS "statesLicensed",
          a.rating,
          a.verified,
          a.contact_info AS "contactInfo",
          a.bio,
          a.availability_status AS "availabilityStatus",
          a.profile_score AS "profileScore",
          a.consultation_type AS "consultationType",
          a.counties_served AS "countiesServed",
          COALESCE(u.first_name, '') AS "firstName",
          COALESCE(u.last_name, '') AS "lastName",
          COALESCE(u.email, '') AS "email"
        FROM attorneys a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.profile_status = 'approved'
        ORDER BY a.profile_score DESC NULLS LAST, a.rating DESC NULLS LAST
      `);

      let results: any[] = Array.isArray(rows) ? rows : (rows as any).rows || [];

      if (state) {
        results = results.filter((a: any) => {
          const licensed = Array.isArray(a.statesLicensed) ? a.statesLicensed : [];
          return licensed.includes(state) || JSON.stringify(a.statesLicensed || "").includes(state);
        });
      }
      if (search) {
        const s = search.toLowerCase();
        results = results.filter((a: any) =>
          `${a.firstName} ${a.lastName} ${a.firmName} ${a.bio || ""}`.toLowerCase().includes(s)
        );
      }

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log("[ROUTES] Regional Director routes registered");
}
