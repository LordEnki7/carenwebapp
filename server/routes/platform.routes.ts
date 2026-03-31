import type { Express } from "express";
import { db } from "../db";
import { eq, desc, sql, and, lte } from "drizzle-orm";
import {
  waitlist,
  feedbackPosts,
  feedbackVotes,
  userFeaturePreferences,
  emailDripCampaigns,
  appAnalytics,
  users,
} from "@shared/schema";

const TIER_CONFIG = {
  tiers: {
    basic_guard: {
      name: "Basic Guard",
      price: "$1",
      features: ["gps_legal_rights", "emergency_sos", "basic_voice_commands"],
    },
    safety_pro: {
      name: "Safety Pro",
      price: "$4.99/mo",
      features: [
        "gps_legal_rights", "emergency_sos", "basic_voice_commands",
        "audio_recording", "emergency_contacts", "ai_legal_assistant", "translation",
      ],
    },
    constitutional_pro: {
      name: "Constitutional Pro",
      price: "$9.99/mo",
      features: [
        "gps_legal_rights", "emergency_sos", "basic_voice_commands",
        "audio_recording", "emergency_contacts", "ai_legal_assistant", "translation",
        "video_recording", "incident_summarizer", "smart_emergency_detection", "voice_coaching",
      ],
    },
    family_protection: {
      name: "Family Protection",
      price: "$19.99/mo",
      features: [
        "gps_legal_rights", "emergency_sos", "basic_voice_commands",
        "audio_recording", "emergency_contacts", "ai_legal_assistant", "translation",
        "video_recording", "incident_summarizer", "smart_emergency_detection", "voice_coaching",
        "attorney_matching", "recording_analysis", "legal_documents", "attorney_messaging", "cloud_sync",
      ],
    },
    enterprise_fleet: {
      name: "Enterprise Fleet",
      price: "$49.99/mo",
      features: [
        "gps_legal_rights", "emergency_sos", "basic_voice_commands",
        "audio_recording", "emergency_contacts", "ai_legal_assistant", "translation",
        "video_recording", "incident_summarizer", "smart_emergency_detection", "voice_coaching",
        "attorney_matching", "recording_analysis", "legal_documents", "attorney_messaging", "cloud_sync",
        "fleet_management", "priority_support", "custom_branding", "analytics_dashboard",
      ],
    },
  },
  allFeatures: [
    { id: "gps_legal_rights", name: "GPS Legal Rights", description: "State-specific legal protections based on your location", icon: "MapPin", tier: "basic_guard" },
    { id: "emergency_sos", name: "Emergency SOS", description: "One-tap emergency alert system", icon: "AlertTriangle", tier: "basic_guard" },
    { id: "basic_voice_commands", name: "Voice Commands", description: "Hands-free voice control", icon: "Mic", tier: "basic_guard" },
    { id: "audio_recording", name: "Audio Recording", description: "Record audio evidence during encounters", icon: "Mic2", tier: "safety_pro" },
    { id: "emergency_contacts", name: "Emergency Contacts", description: "Notify contacts during emergencies", icon: "Users", tier: "safety_pro" },
    { id: "ai_legal_assistant", name: "AI Legal Assistant", description: "Quick AI-powered legal Q&A", icon: "Bot", tier: "safety_pro" },
    { id: "translation", name: "Multi-Language Translation", description: "Legal translation in 15+ languages", icon: "Languages", tier: "safety_pro" },
    { id: "video_recording", name: "Video Recording", description: "Multi-angle video evidence capture", icon: "Video", tier: "constitutional_pro" },
    { id: "incident_summarizer", name: "Incident Summarizer", description: "AI auto-generates incident reports", icon: "FileText", tier: "constitutional_pro" },
    { id: "smart_emergency_detection", name: "Smart Emergency Detection", description: "AI-powered distress signal analysis", icon: "Zap", tier: "constitutional_pro" },
    { id: "voice_coaching", name: "Real-Time Voice Coaching", description: "Live AI guidance during encounters", icon: "Headphones", tier: "constitutional_pro" },
    { id: "attorney_matching", name: "AI Attorney Matching", description: "Case-specific attorney recommendations", icon: "Scale", tier: "family_protection" },
    { id: "recording_analysis", name: "Recording Analysis", description: "AI transcript and rights violation detection", icon: "Search", tier: "family_protection" },
    { id: "legal_documents", name: "Legal Document Generator", description: "Generate FOIA, complaints, demand letters", icon: "Stamp", tier: "family_protection" },
    { id: "attorney_messaging", name: "Attorney Messaging", description: "Encrypted attorney communication", icon: "MessageSquare", tier: "family_protection" },
    { id: "cloud_sync", name: "Cloud Sync", description: "Cross-device data synchronization", icon: "Cloud", tier: "family_protection" },
    { id: "fleet_management", name: "Fleet Management", description: "Multi-vehicle fleet tracking", icon: "Truck", tier: "enterprise_fleet" },
    { id: "priority_support", name: "Priority Support", description: "24/7 premium support access", icon: "Star", tier: "enterprise_fleet" },
    { id: "custom_branding", name: "Custom Branding", description: "White-label app customization", icon: "Palette", tier: "enterprise_fleet" },
    { id: "analytics_dashboard", name: "Analytics Dashboard", description: "Detailed usage and fleet analytics", icon: "BarChart3", tier: "enterprise_fleet" },
  ],
};

const DRIP_EMAILS = [
  {
    subject: "Welcome to C.A.R.E.N.™ - Getting Started",
    body: `<h2>Welcome to C.A.R.E.N.™!</h2>
<p>Thank you for joining C.A.R.E.N.™ - your Citizen Assistance for Roadside Emergencies and Navigation platform.</p>
<h3>Getting Started Guide</h3>
<ul>
<li><strong>Set Up Your Profile</strong> - Add your emergency contacts and vehicle information</li>
<li><strong>Enable GPS</strong> - Allow location access for state-specific legal protections</li>
<li><strong>Test Voice Commands</strong> - Say "Hey CAREN" to activate hands-free mode</li>
<li><strong>Review Your Rights</strong> - Browse your state's legal protections for traffic stops</li>
</ul>
<p>Your safety is our priority. Let's get you protected!</p>`,
  },
  {
    subject: "Know Your Rights - GPS Legal Protection",
    body: `<h2>Know Your Rights Wherever You Are</h2>
<p>Did you know your legal rights change depending on which state you're in?</p>
<h3>GPS-Powered Legal Protection</h3>
<p>C.A.R.E.N.™'s GPS Legal Rights feature automatically detects your location and provides:</p>
<ul>
<li><strong>State-Specific Rights</strong> - Know exactly what you can and cannot do during a traffic stop</li>
<li><strong>Recording Laws</strong> - Understand one-party vs two-party consent laws</li>
<li><strong>Search & Seizure</strong> - Know when officers can and cannot search your vehicle</li>
<li><strong>Right to Silence</strong> - Understand your Fifth Amendment protections in your state</li>
</ul>
<p>Open the app now and check your current location's legal protections!</p>`,
  },
  {
    subject: "Stay Safe - Emergency Features",
    body: `<h2>Emergency Features That Could Save Your Life</h2>
<p>C.A.R.E.N.™ has powerful emergency features designed to keep you safe.</p>
<h3>Key Emergency Features</h3>
<ul>
<li><strong>Emergency SOS</strong> - One-tap alert that notifies your emergency contacts with your GPS location</li>
<li><strong>Voice-Activated Recording</strong> - Start recording hands-free during encounters</li>
<li><strong>Emergency Contact Sharing</strong> - Automatically share your location with trusted contacts</li>
<li><strong>De-escalation Guide</strong> - Real-time guidance for handling tense situations</li>
</ul>
<p>Have you set up your emergency contacts yet? Do it now for maximum protection.</p>`,
  },
  {
    subject: "AI-Powered Protection",
    body: `<h2>AI-Powered Protection at Your Fingertips</h2>
<p>C.A.R.E.N.™ uses advanced AI to provide you with intelligent protection features.</p>
<h3>AI Features Overview</h3>
<ul>
<li><strong>AI Legal Assistant</strong> - Get instant answers to legal questions during encounters</li>
<li><strong>Smart Emergency Detection</strong> - AI analyzes audio for signs of distress</li>
<li><strong>Incident Summarizer</strong> - Automatically generates detailed incident reports</li>
<li><strong>Voice Coaching</strong> - Real-time AI guidance on what to say during traffic stops</li>
<li><strong>Recording Analysis</strong> - AI reviews recordings for potential rights violations</li>
</ul>
<p>Upgrade your plan to unlock all AI-powered features!</p>`,
  },
  {
    subject: "You're Protected - What's Next?",
    body: `<h2>You're Protected - What's Next?</h2>
<p>You've been using C.A.R.E.N.™ and we hope you're feeling more protected on the road.</p>
<h3>Maximize Your Protection</h3>
<ul>
<li><strong>Upgrade Your Plan</strong> - Get access to premium features like AI attorney matching and video recording</li>
<li><strong>Share with Family</strong> - Protect your loved ones with the Family Protection plan</li>
<li><strong>Join the Community</strong> - Share experiences and learn from others in our forum</li>
</ul>
<h3>We'd Love Your Feedback</h3>
<p>Your input helps us improve C.A.R.E.N.™ for everyone. Visit our feedback board to share your thoughts and vote on features you'd like to see!</p>
<p>Thank you for being part of the C.A.R.E.N.™ community. Stay safe!</p>`,
  },
];

const DRIP_INTERVALS_MS = [
  0,
  2 * 24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  5 * 24 * 60 * 60 * 1000,
];

async function sendDripEmail(toEmail: string, step: number): Promise<boolean> {
  const emailContent = DRIP_EMAILS[step];
  if (!emailContent) return false;

  const { sendEmail } = await import('../mailer');
  return sendEmail({
    to: toEmail,
    from: 'info@carenalert.com',
    fromName: 'C.A.R.E.N.™ Support Team',
    subject: emailContent.subject,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
<div style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:white;padding:30px;border-radius:10px;text-align:center;margin-bottom:30px;">
<h1 style="margin:0;font-size:24px;">C.A.R.E.N.™</h1>
<p style="margin:5px 0 0;opacity:0.9;">${emailContent.subject}</p>
</div>
<div style="padding:20px;">${emailContent.body}</div>
<div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:30px;text-align:center;color:#64748b;font-size:12px;">
<p>C.A.R.E.N.™ - Citizen Assistance for Roadside Emergencies and Navigation</p>
</div></body></html>`,
  });
}

export function registerPlatformRoutes(app: Express) {
  console.log("[ROUTES] Registering platform routes...");

  // ===== WAITLIST =====

  app.post("/api/waitlist", async (req, res) => {
    try {
      const { email, name, phone, interestedTier, referralSource, referredBy } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const existing = await db.select().from(waitlist).where(eq(waitlist.email, email)).limit(1);
      if (existing.length > 0) {
        return res.status(409).json({ message: "Email already on waitlist" });
      }

      const referralCode = `CAREN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const [entry] = await db.insert(waitlist).values({
        email,
        name: name || null,
        phone: phone || null,
        interestedTier: interestedTier || "basic_guard",
        referralSource: referralSource || null,
        referralCode,
        referredBy: referredBy || null,
      }).returning();

      if (referredBy) {
        await db.update(waitlist)
          .set({ referralCount: sql`${waitlist.referralCount} + 1` })
          .where(eq(waitlist.referralCode, referredBy));
      }

      const position = await db.select({ count: sql<number>`count(*)` }).from(waitlist);
      res.json({ success: true, position: Number(position[0].count), referralCode: entry.referralCode });
    } catch (error) {
      console.error("[WAITLIST] Error adding to waitlist:", error);
      res.status(500).json({ message: "Failed to add to waitlist" });
    }
  });

  app.get("/api/waitlist/referral/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const [entry] = await db.select({
        referralCount: waitlist.referralCount,
        name: waitlist.name,
      }).from(waitlist).where(eq(waitlist.referralCode, code)).limit(1);
      if (!entry) return res.status(404).json({ message: "Referral code not found" });
      const tier = entry.referralCount >= 100 ? "hardware" : entry.referralCount >= 25 ? "founding_badge" : entry.referralCount >= 5 ? "3_months_free" : entry.referralCount >= 1 ? "early_access" : "none";
      res.json({ referralCount: entry.referralCount, tier, name: entry.name });
    } catch (error) {
      res.status(500).json({ message: "Failed to check referral" });
    }
  });

  app.get("/api/waitlist/count", async (_req, res) => {
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(waitlist);
      res.json({ count: Number(result[0].count) });
    } catch (error) {
      console.error("[WAITLIST] Error getting count:", error);
      res.status(500).json({ message: "Failed to get waitlist count" });
    }
  });

  app.get("/api/waitlist", async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session?.userId || session?.passport?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const entries = await db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
      res.json(entries);
    } catch (error) {
      console.error("[WAITLIST] Error fetching entries:", error);
      res.status(500).json({ message: "Failed to fetch waitlist" });
    }
  });

  // ===== FEEDBACK BOARD =====

  app.get("/api/feedback/stats", async (_req, res) => {
    try {
      const totalPosts = await db.select({ count: sql<number>`count(*)` }).from(feedbackPosts);
      const totalVotes = await db.select({ total: sql<number>`coalesce(sum(${feedbackPosts.votes}), 0)` }).from(feedbackPosts);
      const byCategory = await db
        .select({ category: feedbackPosts.category, count: sql<number>`count(*)` })
        .from(feedbackPosts)
        .groupBy(feedbackPosts.category);
      const byStatus = await db
        .select({ status: feedbackPosts.status, count: sql<number>`count(*)` })
        .from(feedbackPosts)
        .groupBy(feedbackPosts.status);

      res.json({
        totalPosts: Number(totalPosts[0].count),
        totalVotes: Number(totalVotes[0].total),
        byCategory: byCategory.map((r) => ({ category: r.category, count: Number(r.count) })),
        byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      });
    } catch (error) {
      console.error("[FEEDBACK] Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch feedback stats" });
    }
  });

  app.get("/api/feedback", async (req, res) => {
    try {
      const { category } = req.query;
      let query = db.select().from(feedbackPosts).orderBy(desc(feedbackPosts.votes), desc(feedbackPosts.createdAt));

      if (category && typeof category === "string") {
        const posts = await db.select().from(feedbackPosts)
          .where(eq(feedbackPosts.category, category))
          .orderBy(desc(feedbackPosts.votes), desc(feedbackPosts.createdAt));
        return res.json(posts);
      }

      const posts = await query;
      res.json(posts);
    } catch (error) {
      console.error("[FEEDBACK] Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch feedback posts" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    try {
      const { authorName, title, description, category } = req.body;
      if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required" });
      }

      const session = req.session as any;
      const userId = session?.userId || session?.passport?.user?.id || null;

      const [post] = await db.insert(feedbackPosts).values({
        userId,
        authorName: authorName || "Anonymous",
        title,
        description,
        category: category || "feature_request",
      }).returning();

      res.json(post);
    } catch (error) {
      console.error("[FEEDBACK] Error creating post:", error);
      res.status(500).json({ message: "Failed to create feedback post" });
    }
  });

  app.post("/api/feedback/:id/vote", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { visitorId } = req.body;
      if (!visitorId) return res.status(400).json({ message: "visitorId is required" });

      const existing = await db.select().from(feedbackVotes)
        .where(and(eq(feedbackVotes.postId, postId), eq(feedbackVotes.visitorId, visitorId)))
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ message: "Already voted" });
      }

      await db.insert(feedbackVotes).values({ postId, visitorId });
      await db.update(feedbackPosts).set({ votes: sql`${feedbackPosts.votes} + 1` }).where(eq(feedbackPosts.id, postId));

      res.json({ success: true });
    } catch (error) {
      console.error("[FEEDBACK] Error voting:", error);
      res.status(500).json({ message: "Failed to vote" });
    }
  });

  app.delete("/api/feedback/:id/vote", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { visitorId } = req.body;
      if (!visitorId) return res.status(400).json({ message: "visitorId is required" });

      const existing = await db.select().from(feedbackVotes)
        .where(and(eq(feedbackVotes.postId, postId), eq(feedbackVotes.visitorId, visitorId)))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ message: "Vote not found" });
      }

      await db.delete(feedbackVotes).where(
        and(eq(feedbackVotes.postId, postId), eq(feedbackVotes.visitorId, visitorId))
      );
      await db.update(feedbackPosts).set({ votes: sql`GREATEST(${feedbackPosts.votes} - 1, 0)` }).where(eq(feedbackPosts.id, postId));

      res.json({ success: true });
    } catch (error) {
      console.error("[FEEDBACK] Error removing vote:", error);
      res.status(500).json({ message: "Failed to remove vote" });
    }
  });

  // ===== FEATURE PREFERENCES =====

  app.get("/api/feature-tiers", (_req, res) => {
    res.json(TIER_CONFIG);
  });

  app.get("/api/feature-preferences", async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session?.userId || session?.passport?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const [prefs] = await db.select().from(userFeaturePreferences).where(eq(userFeaturePreferences.userId, userId)).limit(1);
      res.json(prefs || null);
    } catch (error) {
      console.error("[FEATURE_PREFS] Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch feature preferences" });
    }
  });

  app.post("/api/feature-preferences", async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session?.userId || session?.passport?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const { enabledFeatures, dashboardLayout } = req.body;

      const existing = await db.select().from(userFeaturePreferences).where(eq(userFeaturePreferences.userId, userId)).limit(1);

      if (existing.length > 0) {
        const [updated] = await db.update(userFeaturePreferences)
          .set({ enabledFeatures, dashboardLayout, updatedAt: new Date() })
          .where(eq(userFeaturePreferences.userId, userId))
          .returning();
        return res.json(updated);
      }

      const [created] = await db.insert(userFeaturePreferences).values({
        userId,
        enabledFeatures,
        dashboardLayout,
      }).returning();

      res.json(created);
    } catch (error) {
      console.error("[FEATURE_PREFS] Error saving preferences:", error);
      res.status(500).json({ message: "Failed to save feature preferences" });
    }
  });

  // ===== EMAIL DRIP CAMPAIGNS =====

  app.post("/api/email-campaigns/enroll", async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session?.userId || session?.passport?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email not found" });
      }

      const existing = await db.select().from(emailDripCampaigns)
        .where(and(eq(emailDripCampaigns.userId, userId), eq(emailDripCampaigns.status, "active")))
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ message: "Already enrolled in an active campaign" });
      }

      const [campaign] = await db.insert(emailDripCampaigns).values({
        userId,
        email: user.email,
        campaignType: "onboarding",
        currentStep: 0,
        totalSteps: 5,
        nextSendAt: new Date(),
        status: "active",
      }).returning();

      res.json({ success: true, campaign });
    } catch (error) {
      console.error("[DRIP] Error enrolling:", error);
      res.status(500).json({ message: "Failed to enroll in campaign" });
    }
  });

  app.get("/api/email-campaigns/status", async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session?.userId || session?.passport?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const campaigns = await db.select().from(emailDripCampaigns)
        .where(eq(emailDripCampaigns.userId, userId))
        .orderBy(desc(emailDripCampaigns.createdAt));

      res.json(campaigns);
    } catch (error) {
      console.error("[DRIP] Error fetching status:", error);
      res.status(500).json({ message: "Failed to fetch campaign status" });
    }
  });

  app.post("/api/email-campaigns/process", async (_req, res) => {
    try {
      const now = new Date();
      const pending = await db.select().from(emailDripCampaigns)
        .where(and(
          eq(emailDripCampaigns.status, "active"),
          lte(emailDripCampaigns.nextSendAt, now)
        ));

      let processed = 0;
      let errors = 0;

      for (const campaign of pending) {
        const step = campaign.currentStep;
        const sent = await sendDripEmail(campaign.email, step);

        if (sent) {
          const newStep = step + 1;
          if (newStep >= campaign.totalSteps) {
            await db.update(emailDripCampaigns)
              .set({ currentStep: newStep, lastSentAt: now, status: "completed", updatedAt: now })
              .where(eq(emailDripCampaigns.id, campaign.id));
          } else {
            const intervalMs = DRIP_INTERVALS_MS[newStep] || 3 * 24 * 60 * 60 * 1000;
            const nextSend = new Date(now.getTime() + intervalMs);
            await db.update(emailDripCampaigns)
              .set({ currentStep: newStep, lastSentAt: now, nextSendAt: nextSend, updatedAt: now })
              .where(eq(emailDripCampaigns.id, campaign.id));
          }
          processed++;
        } else {
          errors++;
        }
      }

      res.json({ success: true, processed, errors, total: pending.length });
    } catch (error) {
      console.error("[DRIP] Error processing campaigns:", error);
      res.status(500).json({ message: "Failed to process campaigns" });
    }
  });

  app.get("/api/email-campaigns/admin", async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session?.userId || session?.passport?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const campaigns = await db.select().from(emailDripCampaigns).orderBy(desc(emailDripCampaigns.createdAt));
      res.json(campaigns);
    } catch (error) {
      console.error("[DRIP] Error fetching admin campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // ===== APP ANALYTICS =====

  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { eventType, eventName, metadata, sessionId, deviceInfo } = req.body;
      if (!eventType || !eventName) {
        return res.status(400).json({ message: "eventType and eventName are required" });
      }

      const session = req.session as any;
      const userId = session?.userId || session?.passport?.user?.id || null;

      const [event] = await db.insert(appAnalytics).values({
        userId,
        eventType,
        eventName,
        metadata: metadata || null,
        sessionId: sessionId || null,
        deviceInfo: deviceInfo || null,
      }).returning();

      res.json({ success: true, eventId: event.id });
    } catch (error) {
      console.error("[ANALYTICS] Error tracking event:", error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session?.userId || session?.passport?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const totalEvents = await db.select({ count: sql<number>`count(*)` }).from(appAnalytics);
      const byType = await db
        .select({ eventType: appAnalytics.eventType, count: sql<number>`count(*)` })
        .from(appAnalytics)
        .groupBy(appAnalytics.eventType);
      const byName = await db
        .select({ eventName: appAnalytics.eventName, count: sql<number>`count(*)` })
        .from(appAnalytics)
        .groupBy(appAnalytics.eventName)
        .orderBy(sql`count(*) desc`)
        .limit(20);
      const dailyCounts = await db
        .select({
          date: sql<string>`date(${appAnalytics.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(appAnalytics)
        .where(sql`${appAnalytics.createdAt} >= now() - interval '30 days'`)
        .groupBy(sql`date(${appAnalytics.createdAt})`)
        .orderBy(sql`date(${appAnalytics.createdAt})`);
      const activeUsers = await db
        .select({ count: sql<number>`count(distinct ${appAnalytics.userId})` })
        .from(appAnalytics)
        .where(sql`${appAnalytics.userId} is not null`);

      res.json({
        totalEvents: Number(totalEvents[0].count),
        eventsByType: byType.map((r) => ({ type: r.eventType, count: Number(r.count) })),
        eventsByName: byName.map((r) => ({ name: r.eventName, count: Number(r.count) })),
        dailyCounts: dailyCounts.map((r) => ({ date: r.date, count: Number(r.count) })),
        activeUsers: Number(activeUsers[0].count),
      });
    } catch (error) {
      console.error("[ANALYTICS] Error fetching dashboard:", error);
      res.status(500).json({ message: "Failed to fetch analytics dashboard" });
    }
  });

  app.get("/api/analytics/user/:userId", async (req, res) => {
    try {
      const session = req.session as any;
      const adminId = session?.userId || session?.passport?.user?.id;
      if (!adminId) return res.status(401).json({ message: "Authentication required" });

      const [admin] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetUserId = req.params.userId;
      const events = await db.select().from(appAnalytics)
        .where(eq(appAnalytics.userId, targetUserId))
        .orderBy(desc(appAnalytics.createdAt))
        .limit(500);

      res.json(events);
    } catch (error) {
      console.error("[ANALYTICS] Error fetching user analytics:", error);
      res.status(500).json({ message: "Failed to fetch user analytics" });
    }
  });

  console.log("[ROUTES] Platform routes registered successfully");
}
