import type { Express } from "express";
import { db } from "../db";
import { earlyAccessTesters, testerMissions, testerCompletions, testerBugReports } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { notifyNewSignup } from "../lib/slack";

function generateAccessCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

async function sendEarlyAccessEmail(to: string, name: string, labLink: string, isInvite = false) {
  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: "projectdna7@carenalert.com",
        pass: process.env.SMTP_PASSWORD!
      }
    });
    const subject = isInvite
      ? "You've Been Selected — C.A.R.E.N. Early Access"
      : "You're In — C.A.R.E.N. Early Access Approved";
    await transporter.sendMail({
      from: '"C.A.R.E.N. Team" <info@carenalert.com>',
      to,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f9">

          <!-- Header -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px 12px 0 0;overflow:hidden">
            <tr>
              <td bgcolor="#0d1b2a" style="background-color:#0d1b2a;padding:40px 32px;text-align:center;border-radius:12px 12px 0 0">
                <div style="display:inline-block;background-color:#0a3050;border:1px solid #0077b6;border-radius:20px;padding:6px 18px;margin-bottom:18px">
                  <span style="color:#00d2ff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif">C.A.R.E.N. Early Access Program</span>
                </div>
                <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px 0;line-height:1.3;font-weight:800;font-family:Arial,sans-serif">You've Been Selected</h1>
                <p style="color:#90b4ce;margin:0;font-size:14px;font-family:Arial,sans-serif">Personal invitation from the C.A.R.E.N. team</p>
              </td>
            </tr>
          </table>

          <!-- Body -->
          <div style="background:#ffffff;padding:36px 32px">
            <p style="color:#1a1a2e;font-size:16px;line-height:1.7;margin:0 0 16px 0">Hi <strong>${name}</strong>,</p>

            <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 16px 0">We're selecting a <strong style="color:#1a2e4a">limited group of drivers</strong> for early access to a safety app designed to <strong style="color:#0077b6">protect you during traffic stops</strong>.</p>

            <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 24px 0">You were personally selected — not just as a tester, but as a <strong style="color:#1a2e4a">founding community member</strong> helping us build something that saves lives.</p>

            <!-- Features box -->
            <div style="background:#f0f7ff;border-left:4px solid #0077b6;border-radius:0 10px 10px 0;padding:18px 22px;margin:0 0 28px 0">
              <p style="color:#1a2e4a;margin:0 0 10px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px">What C.A.R.E.N. does for you:</p>
              <p style="color:#444;margin:0;font-size:14px;line-height:1.9">
                ✅ &nbsp;Detects your state and shows your legal rights in real time<br/>
                ✅ &nbsp;Records video and audio evidence during any encounter<br/>
                ✅ &nbsp;Notifies your emergency contacts instantly<br/>
                ✅ &nbsp;Connects you with an attorney if needed
              </p>
            </div>

            <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 8px 0;font-weight:600">Download the app — choose your device below:</p>
            <p style="color:#666;font-size:13px;margin:0 0 22px 0">Tap the button that matches your phone.</p>

            <!-- iPhone card -->
            <div style="background:#f8f9fa;border:2px solid #e8edf2;border-radius:12px;padding:20px 22px;margin-bottom:14px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48" style="vertical-align:middle;padding-right:14px">
                    <div style="background:#f0f0f0;border-radius:10px;width:44px;height:44px;text-align:center;line-height:44px;font-size:22px">🍎</div>
                  </td>
                  <td style="vertical-align:middle">
                    <p style="color:#1a1a2e;margin:0;font-size:16px;font-weight:700">iPhone</p>
                    <p style="color:#777;margin:0;font-size:12px">Download via Apple TestFlight</p>
                  </td>
                </tr>
              </table>
              <a href="https://testflight.apple.com/join/1ahkrNU5" style="display:block;background:#1a1a2e;color:#ffffff;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;margin-top:16px;letter-spacing:0.3px">Download on TestFlight →</a>
            </div>

            <!-- Android card -->
            <div style="background:#f8f9fa;border:2px solid #e8edf2;border-radius:12px;padding:20px 22px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48" style="vertical-align:middle;padding-right:14px">
                    <div style="background:#e8f5e9;border-radius:10px;width:44px;height:44px;text-align:center;line-height:44px;font-size:22px">🤖</div>
                  </td>
                  <td style="vertical-align:middle">
                    <p style="color:#1a1a2e;margin:0;font-size:16px;font-weight:700">Android</p>
                    <p style="color:#777;margin:0;font-size:12px">Download from Google Play Store</p>
                  </td>
                </tr>
              </table>
              <a href="https://play.google.com/store/apps/details?id=com.caren.caren" style="display:block;background:#00875a;color:#ffffff;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;margin-top:16px;letter-spacing:0.3px">Download on Google Play →</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#f4f6f9;padding:24px 32px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0">
            <p style="color:#888;font-size:12px;margin:0;line-height:1.8">This invitation was sent personally by the C.A.R.E.N. team.<br/>C.A.R.E.N. Early Access Program &nbsp;|&nbsp; <a href="https://carenalert.com" style="color:#0077b6;text-decoration:none">carenalert.com</a></p>
          </div>

        </div>
      `
    });
    console.log(`[EARLY_ACCESS] Email sent via Hostinger SMTP to ${to}`);
  } catch (emailErr) {
    console.error("[EARLY_ACCESS] Email failed:", emailErr);
  }
}

export function registerEarlyAccessRoutes(app: Express) {

  // Public: Apply to Early Access Lab
  app.post("/api/early-access/apply", async (req, res) => {
    try {
      const { name, email, phone, deviceType, whyJoin } = req.body;
      if (!name || !email) return res.status(400).json({ error: "Name and email required" });

      const existing = await db.select().from(earlyAccessTesters).where(eq(earlyAccessTesters.email, email));
      if (existing.length > 0) return res.status(409).json({ error: "This email is already registered" });

      const [tester] = await db.insert(earlyAccessTesters).values({
        name, email, phone, deviceType, whyJoin, status: "pending"
      }).returning();

      notifyNewSignup(name, email, deviceType || "Unknown").catch(() => {});

      res.json({ success: true, message: "Application received! We'll review it and email you within 24 hours.", tester });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public: Activate account via access code from email
  app.post("/api/early-access/activate", async (req, res) => {
    try {
      const { code } = req.body;
      const [tester] = await db.select().from(earlyAccessTesters)
        .where(eq(earlyAccessTesters.accessCode, code));
      if (!tester) return res.status(404).json({ error: "Invalid access code" });
      if (tester.status === "rejected") return res.status(403).json({ error: "This application was not approved" });

      if (tester.status === "approved") {
        await db.update(earlyAccessTesters)
          .set({ status: "active", onboardedAt: new Date(), lastActiveAt: new Date() })
          .where(eq(earlyAccessTesters.id, tester.id));
      }

      const updated = await db.select().from(earlyAccessTesters).where(eq(earlyAccessTesters.id, tester.id));
      res.json({ success: true, tester: updated[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tester: Get dashboard (missions + progress)
  app.get("/api/early-access/dashboard/:code", async (req, res) => {
    try {
      const [tester] = await db.select().from(earlyAccessTesters)
        .where(eq(earlyAccessTesters.accessCode, req.params.code));
      if (!tester || tester.status === "pending" || tester.status === "rejected") {
        return res.status(403).json({ error: "Access denied" });
      }

      const missions = await db.select().from(testerMissions).where(eq(testerMissions.isActive, true));
      const completions = await db.select().from(testerCompletions).where(eq(testerCompletions.testerId, tester.id));
      const completedIds = new Set(completions.map(c => c.missionId));

      const daysActive = tester.onboardedAt
        ? Math.floor((Date.now() - new Date(tester.onboardedAt).getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1;

      const availableMissions = missions.filter(m => m.dayNumber <= daysActive);
      const missionsWithStatus = availableMissions.map(m => ({
        ...m,
        completed: completedIds.has(m.id),
        completion: completions.find(c => c.missionId === m.id) || null
      }));

      await db.update(earlyAccessTesters)
        .set({ lastActiveAt: new Date() })
        .where(eq(earlyAccessTesters.id, tester.id));

      res.json({
        tester,
        missions: missionsWithStatus,
        daysActive,
        totalMissions: missions.length,
        completedCount: completedIds.size
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tester: Complete a mission
  app.post("/api/early-access/complete-mission", async (req, res) => {
    try {
      const { accessCode, missionId, feedback, rating, bugDescription } = req.body;
      const [tester] = await db.select().from(earlyAccessTesters).where(eq(earlyAccessTesters.accessCode, accessCode));
      if (!tester) return res.status(403).json({ error: "Invalid access code" });

      const existing = await db.select().from(testerCompletions)
        .where(sql`tester_id = ${tester.id} AND mission_id = ${missionId}`);
      if (existing.length > 0) return res.status(409).json({ error: "Mission already completed" });

      const [mission] = await db.select().from(testerMissions).where(eq(testerMissions.id, missionId));
      if (!mission) return res.status(404).json({ error: "Mission not found" });

      await db.insert(testerCompletions).values({ testerId: tester.id, missionId, feedback, rating, bugDescription });
      await db.update(earlyAccessTesters)
        .set({
          missionsCompleted: (tester.missionsCompleted || 0) + 1,
          score: (tester.score || 0) + (mission.pointValue || 10),
          lastActiveAt: new Date()
        })
        .where(eq(earlyAccessTesters.id, tester.id));

      res.json({ success: true, pointsEarned: mission.pointValue });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tester: Submit a bug report
  app.post("/api/early-access/bug-report", async (req, res) => {
    try {
      const { accessCode, title, description, severity, category, deviceInfo } = req.body;
      const [tester] = await db.select().from(earlyAccessTesters).where(eq(earlyAccessTesters.accessCode, accessCode));
      if (!tester) return res.status(403).json({ error: "Invalid access code" });

      const [bug] = await db.insert(testerBugReports).values({
        testerId: tester.id, title, description, severity: severity || "medium", category, deviceInfo
      }).returning();

      await db.update(earlyAccessTesters)
        .set({ bugsReported: (tester.bugsReported || 0) + 1, score: (tester.score || 0) + 20 })
        .where(eq(earlyAccessTesters.id, tester.id));

      res.json({ success: true, bug });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Get all testers
  app.get("/api/early-access/admin/testers", async (req, res) => {
    try {
      const testers = await db.select().from(earlyAccessTesters).orderBy(desc(earlyAccessTesters.createdAt));
      res.json(testers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Approve tester and send email
  app.post("/api/early-access/admin/approve/:id", async (req, res) => {
    try {
      const accessCode = generateAccessCode();
      const [tester] = await db.update(earlyAccessTesters)
        .set({ status: "approved", accessCode })
        .where(eq(earlyAccessTesters.id, parseInt(req.params.id)))
        .returning();

      const labLink = `${process.env.APP_URL || "https://carenalert.com"}/early-access?code=${accessCode}`;
      await sendEarlyAccessEmail(tester.email, tester.name, labLink, false);
      res.json({ success: true, tester, labLink });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Reject tester
  app.post("/api/early-access/admin/reject/:id", async (req, res) => {
    try {
      await db.update(earlyAccessTesters)
        .set({ status: "rejected" })
        .where(eq(earlyAccessTesters.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Invite tester directly by email
  app.post("/api/early-access/admin/invite", async (req, res) => {
    try {
      const { name, email, deviceType } = req.body;
      if (!name || !email) return res.status(400).json({ error: "Name and email required" });

      const existing = await db.select().from(earlyAccessTesters).where(eq(earlyAccessTesters.email, email));
      if (existing.length > 0) return res.status(409).json({ error: "Email already registered" });

      const accessCode = generateAccessCode();
      const [tester] = await db.insert(earlyAccessTesters).values({
        name, email, deviceType: deviceType || "both", status: "approved", accessCode, invitedByAdmin: true
      }).returning();

      const labLink = `${process.env.APP_URL || "https://carenalert.com"}/early-access?code=${accessCode}`;
      await sendEarlyAccessEmail(email, name, labLink, true);
      res.json({ success: true, tester, labLink });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Launch readiness stats
  app.get("/api/early-access/admin/stats", async (req, res) => {
    try {
      const testers = await db.select().from(earlyAccessTesters);
      const bugs = await db.select().from(testerBugReports);
      const completions = await db.select().from(testerCompletions);
      const missions = await db.select().from(testerMissions);

      const total = testers.length;
      const active = testers.filter(t => t.status === "active").length;
      const pending = testers.filter(t => t.status === "pending").length;
      const avgScore = total > 0 ? Math.round(testers.reduce((s, t) => s + (t.score || 0), 0) / total) : 0;
      const criticalBugs = bugs.filter(b => b.severity === "critical").length;
      const totalMissions = missions.length;
      const avgCompletion = active > 0
        ? Math.round((completions.length / Math.max(active * totalMissions, 1)) * 100)
        : 0;

      const launchScore = Math.min(100, Math.round(
        (active >= 10 ? 25 : (active / 10) * 25) +
        (avgCompletion >= 70 ? 25 : (avgCompletion / 70) * 25) +
        (criticalBugs === 0 ? 25 : criticalBugs <= 2 ? 15 : 5) +
        (avgScore >= 100 ? 25 : (avgScore / 100) * 25)
      ));

      res.json({
        total, active, pending,
        completed: testers.filter(t => t.status === "completed").length,
        avgScore, avgCompletion,
        totalBugs: bugs.length, criticalBugs,
        highBugs: bugs.filter(b => b.severity === "high").length,
        totalCompletions: completions.length,
        launchScore, launchReady: launchScore >= 75,
        topTesters: [...testers].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Test SMTP connection
  app.post("/api/early-access/admin/test-smtp", async (req, res) => {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: {
          user: "projectdna7@carenalert.com",
          pass: process.env.SMTP_PASSWORD!
        }
      });
      await transporter.verify();
      // Send the full invite email as a preview
      const previewEmail = req.body.email || "projectdna7@yahoo.com";
      const previewName = req.body.name || "Shawn";
      const previewLink = "https://carenalert.com/early-access?code=PREVIEW-LINK-EXAMPLE";
      await sendEarlyAccessEmail(previewEmail, previewName, previewLink, true);
      res.json({ success: true, message: `Full invite email preview sent to ${previewEmail}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin: Resend all invite emails
  app.post("/api/early-access/admin/resend-all", async (req, res) => {
    try {
      const testers = await db.select().from(earlyAccessTesters)
        .where(eq(earlyAccessTesters.invitedByAdmin, true));
      const results = [];
      for (const t of testers) {
        const labLink = `${process.env.APP_URL || "https://carenalert.com"}/early-access?code=${t.accessCode}`;
        try {
          await sendEarlyAccessEmail(t.email, t.name, labLink, true);
          results.push({ email: t.email, status: "sent" });
        } catch (e: any) {
          results.push({ email: t.email, status: "failed", error: e.message });
        }
      }
      res.json({ success: true, total: testers.length, results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Send personal Shakim email to all testers
  app.post("/api/early-access/admin/send-personal-shakim", async (req, res) => {
    try {
      const testers = await db.select().from(earlyAccessTesters)
        .where(eq(earlyAccessTesters.invitedByAdmin, true));
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: { user: "projectdna7@carenalert.com", pass: process.env.SMTP_PASSWORD! }
      });
      const results = [];
      for (const t of testers) {
        try {
          await transporter.sendMail({
            from: '"Shawn Williams" <info@carenalert.com>',
            replyTo: "projectdna7@yahoo.com",
            to: t.email,
            subject: "I Wanted You to See This First",
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:40px 32px;color:#1a1a1a;line-height:1.8;font-size:15px">
                <p>Hey,</p>
                <p>I wanted to personally reach out and share something with you that I'm involved in.</p>
                <p>I've been working closely with a project called <strong>C.A.R.E.N.</strong>, and it's something I believe can really make a difference — especially in situations involving traffic stops and roadside interactions.</p>
                <p>This isn't just another app. It's built around real-world safety, giving drivers the ability to record, track, and have a layer of protection when it matters most.</p>
                <p>I don't send things out unless I truly stand behind them, and this is one of those.</p>
                <p>Right now, we're opening up a small early access group to test it out, and I thought of you.</p>
                <p>If you're open to checking it out, download it free below — and even just letting me know you tried it helps more than you know.</p>

                <div style="margin:28px 0">
                  <a href="https://testflight.apple.com/join/1ahkrNU5" style="display:block;background:#1a1a2e;color:#ffffff;padding:14px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;margin-bottom:12px">📱 iPhone — Download on TestFlight →</a>
                  <a href="https://play.google.com/store/apps/details?id=com.caren.caren" style="display:block;background:#34a853;color:#ffffff;padding:14px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;text-align:center">🤖 Android — Download on Google Play →</a>
                </div>

                <p>No pressure — just wanted to put it on your radar.</p>
                <p>Appreciate you taking the time. Reply back and let me know what you think — I read every message.</p>
                <p style="margin-top:32px">– Shawn "Shakim" Williams<br/><a href="mailto:projectdna7@yahoo.com" style="color:#0077b6">projectdna7@yahoo.com</a></p>
              </div>
            `
          });
          results.push({ email: t.email, status: "sent" });
        } catch (e: any) {
          results.push({ email: t.email, status: "failed", error: e.message });
        }
      }
      res.json({ success: true, total: testers.length, results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Send Google Play follow-up email to all invited testers
  app.post("/api/early-access/admin/send-google-play-followup", async (req, res) => {
    try {
      const testers = await db.select().from(earlyAccessTesters)
        .where(eq(earlyAccessTesters.invitedByAdmin, true));
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: { user: "projectdna7@carenalert.com", pass: process.env.SMTP_PASSWORD! }
      });
      const results = [];
      for (const t of testers) {
        try {
          await transporter.sendMail({
            from: '"C.A.R.E.N. Team" <info@carenalert.com>',
            to: t.email,
            subject: "Your C.A.R.E.N. spot is still waiting — activate in 2 taps",
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f9">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="#0d1b2a" style="background-color:#0d1b2a;padding:36px 32px;text-align:center;border-radius:12px 12px 0 0">
                      <div style="display:inline-block;background-color:#0a3050;border:1px solid #0077b6;border-radius:20px;padding:6px 18px;margin-bottom:16px">
                        <span style="color:#00d2ff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">C.A.R.E.N. Early Access</span>
                      </div>
                      <h1 style="color:#ffffff;font-size:26px;margin:0 0 8px 0;font-weight:800">Your spot is still waiting, ${t.name.split(' ')[0]}</h1>
                      <p style="color:#90b4ce;margin:0;font-size:14px">Don't miss your chance to be a founding member</p>
                    </td>
                  </tr>
                </table>
                <div style="background:#ffffff;padding:36px 32px">
                  <p style="color:#1a1a2e;font-size:16px;line-height:1.7;margin:0 0 16px 0">Hi <strong>${t.name}</strong>,</p>
                  <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 16px 0">
                    We noticed you haven't activated your C.A.R.E.N. Early Access spot yet. <strong>Your invitation is still open</strong> — but we're filling seats fast and can't hold it indefinitely.
                  </p>
                  <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 24px 0">
                    C.A.R.E.N. protects you during traffic stops — showing your legal rights in real time, recording evidence, and alerting your family. <strong>This is free access while we're in testing.</strong>
                  </p>

                  <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:0 10px 10px 0;padding:16px 20px;margin:0 0 28px 0">
                    <p style="color:#92400e;margin:0;font-size:14px;font-weight:700">⏳ Limited spots remaining</p>
                    <p style="color:#78350f;margin:6px 0 0 0;font-size:13px;line-height:1.6">We selected 30 drivers. Once all spots are claimed, this access closes. Activate yours now before it's reassigned.</p>
                  </div>

                  <p style="color:#1a1a2e;font-size:15px;font-weight:700;margin:0 0 8px 0">Android users — activate in 2 taps:</p>
                  <div style="background:#f8f9fa;border:2px solid #34a853;border-radius:12px;padding:20px 22px;margin-bottom:20px">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" style="vertical-align:middle;padding-right:14px">
                          <div style="background:#e8f5e9;border-radius:10px;width:40px;height:40px;text-align:center;line-height:40px;font-size:20px">🤖</div>
                        </td>
                        <td style="vertical-align:middle">
                          <p style="color:#1a1a2e;margin:0;font-size:15px;font-weight:700">Android / Google Play</p>
                          <p style="color:#555;margin:0;font-size:12px">Tap → "Become a tester" → Install</p>
                        </td>
                      </tr>
                    </table>
                    <a href="https://play.google.com/store/apps/details?id=com.caren.caren" style="display:block;background:#34a853;color:#ffffff;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;margin-top:16px">Join on Google Play →</a>
                  </div>

                  <p style="color:#1a1a2e;font-size:15px;font-weight:700;margin:0 0 8px 0">iPhone users:</p>
                  <div style="background:#f8f9fa;border:2px solid #1a1a2e;border-radius:12px;padding:20px 22px;margin-bottom:28px">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" style="vertical-align:middle;padding-right:14px">
                          <div style="background:#f0f0f0;border-radius:10px;width:40px;height:40px;text-align:center;line-height:40px;font-size:20px">🍎</div>
                        </td>
                        <td style="vertical-align:middle">
                          <p style="color:#1a1a2e;margin:0;font-size:15px;font-weight:700">iPhone / TestFlight</p>
                          <p style="color:#555;margin:0;font-size:12px">Tap → Install TestFlight → Accept invite</p>
                        </td>
                      </tr>
                    </table>
                    <a href="https://testflight.apple.com/join/1ahkrNU5" style="display:block;background:#1a1a2e;color:#ffffff;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;margin-top:16px">Join on TestFlight →</a>
                  </div>

                  <p style="color:#888;font-size:13px;line-height:1.6;margin:0">Questions? Reply to this email — we read every message.<br/>Thank you for being part of C.A.R.E.N.</p>
                </div>
                <div style="background:#0d1b2a;padding:20px 32px;text-align:center;border-radius:0 0 12px 12px">
                  <p style="color:#90b4ce;margin:0;font-size:12px">C.A.R.E.N.™ — Citizen Assistance for Roadside Emergencies and Navigation<br/>carenalert.com</p>
                </div>
              </div>
            `
          });
          results.push({ email: t.email, status: "sent" });
        } catch (e: any) {
          results.push({ email: t.email, status: "failed", error: e.message });
        }
      }
      res.json({ success: true, total: testers.length, results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: All bug reports
  app.get("/api/early-access/admin/bugs", async (req, res) => {
    try {
      const bugs = await db.select().from(testerBugReports).orderBy(desc(testerBugReports.createdAt));
      res.json(bugs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update bug status
  app.patch("/api/early-access/admin/bugs/:id", async (req, res) => {
    try {
      const { status } = req.body;
      await db.update(testerBugReports)
        .set({ status })
        .where(eq(testerBugReports.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log("[ROUTES] Early Access Lab routes registered");
}
