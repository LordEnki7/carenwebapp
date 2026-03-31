import type { Express } from "express";
import { db } from "../db";
import { eq, desc, sql, lt, and, isNull, or } from "drizzle-orm";
import { leads, agentContent, insertLeadSchema } from "@shared/schema";
import rateLimit from "express-rate-limit";
import { sendEmail } from '../mailer';

const leadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many submissions, please try again later." },
});

const contentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many generation requests." },
});

async function sendLeadWelcomeEmail(email: string, firstName?: string | null) {
  const name = firstName || 'there';
  await sendEmail({
    to: email,
    from: 'noreply@carenalert.com',
    fromName: 'C.A.R.E.N.™ ALERT',
    subject: "Welcome to C.A.R.E.N.™ ALERT — You're Protected",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:12px;">
      <h1 style="color:#06b6d4;font-size:28px;margin-bottom:4px;">C.A.R.E.N.™ ALERT</h1>
      <p style="color:#94a3b8;font-size:13px;margin-bottom:32px;">Citizen Assistance for Roadside Emergencies and Navigation</p>
      <h2 style="color:#f8fafc;">Welcome${firstName ? `, ${firstName}` : ""}! You're now protected.</h2>
      <p style="color:#cbd5e1;line-height:1.7;">Thank you for joining C.A.R.E.N.™ ALERT. You now have access to GPS-enabled legal protection for all 50 states — putting your rights in your hands, wherever you are.</p>
      <div style="background:#1e293b;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #06b6d4;">
        <h3 style="color:#06b6d4;margin-top:0;">What's waiting for you:</h3>
        <ul style="color:#cbd5e1;line-height:2.2;padding-left:20px;">
          <li>📍 State-specific legal rights for all 50 states</li>
          <li>🎥 Emergency recording &amp; evidence catalog</li>
          <li>🤖 AI-powered legal assistant</li>
          <li>⚖️ Attorney matching network</li>
          <li>🎙️ Real-time voice coaching during encounters</li>
          <li>🚨 Family emergency coordination</li>
        </ul>
      </div>
      <a href="https://carenalert.com" style="display:inline-block;background:#06b6d4;color:#000;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Start Protecting Yourself →</a>
      <p style="color:#475569;font-size:12px;margin-top:32px;border-top:1px solid #1e293b;padding-top:16px;">
        © 2025 C.A.R.E.N.™ ALERT. All rights reserved.<br>
        <a href="https://carenalert.com/privacy" style="color:#475569;">Unsubscribe</a>
      </p>
    </div>
  `,
  });
}

export function registerAgentRoutes(app: Express) {

  // ===== LEAD CAPTURE (public) =====
  app.post("/api/leads", leadRateLimit, async (req, res) => {
    try {
      const parsed = insertLeadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      }

      const existing = await db.select({ id: leads.id }).from(leads)
        .where(eq(leads.email, parsed.data.email)).limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ message: "Already subscribed! Check your inbox." });
      }

      const [lead] = await db.insert(leads).values(parsed.data).returning();
      sendLeadWelcomeEmail(lead.email, lead.firstName);

      res.json({ success: true, message: "You're in! Check your email." });
    } catch (err) {
      console.error("[AgentRoutes] Lead capture error:", err);
      res.status(500).json({ error: "Failed to save" });
    }
  });

  // ===== GET ALL LEADS =====
  app.get("/api/leads", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user; if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
    const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
    res.json(allLeads);
  });

  // ===== UPDATE LEAD STATUS =====
  app.patch("/api/leads/:id", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user; if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    const { status, notes } = req.body;
    await db.update(leads).set({ status, notes }).where(eq(leads.id, parseInt(id)));
    res.json({ success: true });
  });

  // ===== DELETE LEAD =====
  app.delete("/api/leads/:id", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user; if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
    await db.delete(leads).where(eq(leads.id, parseInt(req.params.id)));
    res.json({ success: true });
  });

  // ===== GENERATE SOCIAL MEDIA CONTENT =====
  app.post("/api/agent/generate-content", contentRateLimit, async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user; if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });

    const { platform = "instagram", count = 5 } = req.body;

    const systemPrompt = `You are a social media marketing expert for C.A.R.E.N.™ ALERT (Citizen Assistance for Roadside Emergencies and Navigation). The app provides GPS-enabled legal protection, emergency recording, AI legal assistance, and roadside safety tools for all 50 US states. Target audience: everyday drivers, civil rights advocates, families, and people who want to know their legal rights. Tone: empowering, urgent, educational, never fearful. Always include the ™ trademark symbol.`;

    const platformPrompts: Record<string, string> = {
      tiktok: `Generate exactly ${count} TikTok video scripts for C.A.R.E.N.™ ALERT. Each script is 30-60 seconds when spoken. Hook viewers in the first 3 seconds. Cover topics: knowing your rights during traffic stops, why recording matters, how C.A.R.E.N.™ protects you, legal rights by state, emergency features. Format EACH as:
---
HOOK: [first 3-second attention-grabber]
BODY: [main content, 4-6 sentences]
CTA: [call to action]
HASHTAGS: [10 relevant hashtags]
---`,
      instagram: `Generate exactly ${count} Instagram captions for C.A.R.E.N.™ ALERT. Mix educational (know your rights), feature-highlighting, and community posts. Format EACH as:
---
CAPTION: [caption text, 3-5 sentences with emojis]
HASHTAGS: [15 relevant hashtags]
---`,
      twitter: `Generate exactly ${count} tweets for C.A.R.E.N.™ ALERT. Keep each tweet under 250 characters. Mix fact tweets, tips, and feature highlights. Format EACH as:
---
TWEET: [tweet text]
HASHTAGS: [5 hashtags]
---`,
      facebook: `Generate exactly ${count} Facebook posts for C.A.R.E.N.™ ALERT. Longer form, community-focused, educational. Format EACH as:
---
POST: [post text, 4-8 sentences]
HASHTAGS: [8 relevant hashtags]
---`,
    };

    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: platformPrompts[platform] || platformPrompts.instagram },
        ],
        max_tokens: 3000,
      });

      const raw = completion.choices[0].message.content || "";
      const blocks = raw.split("---").map(b => b.trim()).filter(b => b.length > 30);

      const posts: { content: string; hashtags: string }[] = [];

      for (const block of blocks) {
        let content = "";
        let hashtags = "#CAREN #KnowYourRights #CivilRights #LegalProtection #CARENAlert";

        const hashtagMatch = block.match(/HASHTAGS:\s*([^\n]+)/);
        if (hashtagMatch) hashtags = hashtagMatch[1].trim();

        if (platform === "tiktok") {
          content = block.replace(/HASHTAGS:[^\n]*/g, "").trim();
        } else if (platform === "twitter") {
          const tweetMatch = block.match(/TWEET:\s*([^\n]+)/);
          if (tweetMatch) content = tweetMatch[1].trim();
        } else {
          const bodyMatch = block.match(/(?:CAPTION|POST):\s*([\s\S]+?)(?=HASHTAGS:|$)/);
          if (bodyMatch) content = bodyMatch[1].trim();
        }

        if (content && content.length > 10) {
          posts.push({ content, hashtags });
        }
      }

      if (posts.length === 0) {
        posts.push({ content: raw, hashtags: "#CAREN #KnowYourRights #CivilRights" });
      }

      const saved = await db.insert(agentContent).values(
        posts.map(p => ({
          platform,
          contentType: platform === "tiktok" ? "script" : "post",
          content: p.content,
          hashtags: p.hashtags,
          status: "ready",
        }))
      ).returning();

      res.json({ success: true, count: saved.length, content: saved });
    } catch (err: any) {
      console.error("[AgentRoutes] Content generation error:", err);
      res.status(500).json({ error: "Content generation failed", details: err.message });
    }
  });

  // ===== GET ALL GENERATED CONTENT =====
  app.get("/api/agent/content", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user; if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
    const { platform } = req.query;
    let query = db.select().from(agentContent).orderBy(desc(agentContent.generatedAt)).$dynamic();
    if (platform && platform !== "all") {
      query = query.where(eq(agentContent.platform, platform as string));
    }
    const content = await query.limit(200);
    res.json(content);
  });

  // ===== UPDATE CONTENT STATUS =====
  app.patch("/api/agent/content/:id", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user; if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    const { status } = req.body;
    await db.update(agentContent).set({
      status,
      postedAt: status === "posted" ? new Date() : undefined,
    }).where(eq(agentContent.id, parseInt(id)));
    res.json({ success: true });
  });

  // ===== DELETE CONTENT =====
  app.delete("/api/agent/content/:id", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user; if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
    await db.delete(agentContent).where(eq(agentContent.id, parseInt(req.params.id)));
    res.json({ success: true });
  });

  // ===== EXECUTIVE AI BRIEFING =====
  app.post("/api/agent/executive-briefing", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;
    if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });

    const { role } = req.body;
    const validRoles = ["cmo", "coo", "cso", "cfo"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    try {
      // Gather live data
      const [totalLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads);
      const [newLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.status, "new"));
      const [convertedLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.status, "converted"));
      const [totalContent] = await db.select({ count: sql<number>`count(*)` }).from(agentContent);
      const [readyContent] = await db.select({ count: sql<number>`count(*)` }).from(agentContent).where(eq(agentContent.status, "ready"));
      const [postedContent] = await db.select({ count: sql<number>`count(*)` }).from(agentContent).where(eq(agentContent.status, "posted"));

      const { users } = await import("@shared/schema");
      const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const platformContent = await db.select({
        platform: agentContent.platform,
        count: sql<number>`count(*)`
      }).from(agentContent).groupBy(agentContent.platform);

      const dataContext = `
Current business metrics for C.A.R.E.N.™ ALERT:
- Total registered users: ${Number(totalUsers?.count ?? 0)}
- Total leads captured: ${Number(totalLeads?.count ?? 0)} (${Number(newLeads?.count ?? 0)} new, ${Number(convertedLeads?.count ?? 0)} converted)
- Lead conversion rate: ${Number(totalLeads?.count ?? 0) > 0 ? Math.round((Number(convertedLeads?.count ?? 0) / Number(totalLeads?.count ?? 1)) * 100) : 0}%
- Social media content generated: ${Number(totalContent?.count ?? 0)} posts (${Number(readyContent?.count ?? 0)} ready to post, ${Number(postedContent?.count ?? 0)} published)
- Content by platform: ${platformContent.map(p => `${p.platform}: ${Number(p.count)}`).join(", ") || "none yet"}
- App: GPS-enabled legal rights platform, 50-state coverage, 6 subscription tiers ($1 one-time to $49.99/month)
`.trim();

      const roleConfig: Record<string, { title: string; persona: string; focus: string }> = {
        cmo: {
          title: "Chief Marketing Officer",
          persona: "You are the CMO of C.A.R.E.N.™ ALERT, a civil rights technology startup. You focus on lead generation, brand awareness, content marketing, social media growth, and converting leads into paying subscribers.",
          focus: "marketing performance, lead quality, content strategy, social media engagement, email campaigns, and subscriber acquisition"
        },
        coo: {
          title: "Chief Operating Officer",
          persona: "You are the COO of C.A.R.E.N.™ ALERT. You focus on operational efficiency, user experience, feature adoption, platform reliability, and scaling the business systematically.",
          focus: "user growth, feature utilization, operational bottlenecks, onboarding optimization, and scaling the platform"
        },
        cso: {
          title: "Chief Strategy Officer",
          persona: "You are the CSO of C.A.R.E.N.™ ALERT. You focus on long-term growth strategy, market positioning, competitive advantage, new market opportunities, and strategic partnerships.",
          focus: "growth opportunities, market positioning, strategic priorities, expansion plans, and competitive differentiation"
        },
        cfo: {
          title: "Chief Financial Officer",
          persona: "You are the CFO of C.A.R.E.N.™ ALERT. You focus on revenue optimization, subscription tier performance, conversion rates, cost efficiency, and financial health of the business.",
          focus: "revenue per user, subscription conversion optimization, pricing strategy, financial sustainability, and monetization"
        }
      };

      const config = roleConfig[role];

      const assetInstructions: Record<string, string> = {
        cmo: `For each recommendation, create a "social_post" draft asset. Include: platform (tiktok/instagram/twitter/facebook), content (the actual post text), and hashtags.`,
        coo: `For each recommendation, create an "ops_checklist" draft asset. Include: title and content (a concise actionable checklist or process document in plain text).`,
        cso: `For each recommendation, create a "strategy_doc" draft asset. Include: title and content (a strategy memo or outreach template the owner can use immediately).`,
        cfo: `For each recommendation, create a "financial_memo" draft asset. Include: title and content (a financial analysis, pricing recommendation, or revenue action memo).`,
      };

      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${config.persona} You are direct, data-driven, and action-oriented. You produce specific recommendations WITH ready-to-use draft assets based on real business data. Never give generic advice. Always return valid JSON.`
          },
          {
            role: "user",
            content: `Here is today's business data:\n\n${dataContext}\n\nProvide your executive briefing. Return a JSON object with exactly this structure:\n{\n  "situation": "2-3 sentences on what the data tells you right now",\n  "watchOut": "1-2 sentence risk or warning based on the numbers",\n  "recommendations": [\n    {\n      "id": "rec_1",\n      "priority": 1,\n      "action": "specific action title (under 10 words)",\n      "rationale": "1 sentence tying this to the actual numbers",\n      "assetType": "${role === "cmo" ? "social_post" : role === "coo" ? "ops_checklist" : role === "cso" ? "strategy_doc" : "financial_memo"}",\n      "draft": { ${role === "cmo" ? '"platform": "instagram", "content": "full post text", "hashtags": "#CAREN #KnowYourRights"' : '"title": "asset title", "content": "full draft text"'} }\n    }\n  ]\n}\n\nProduce exactly 3 recommendations. ${assetInstructions[role]} Make each draft asset genuinely useful and ready to use.`
          }
        ],
        max_tokens: 2000,
      });

      const raw = completion.choices[0].message.content || "{}";
      let parsed: any = {};
      try { parsed = JSON.parse(raw); } catch { parsed = { situation: raw, watchOut: "", recommendations: [] }; }

      res.json({
        success: true,
        role,
        title: config.title,
        situation: parsed.situation || "",
        watchOut: parsed.watchOut || "",
        recommendations: (parsed.recommendations || []).map((r: any, i: number) => ({
          ...r,
          id: r.id || `rec_${i + 1}`,
          status: "pending",
        })),
        generatedAt: new Date().toISOString(),
        dataSnapshot: {
          users: Number(totalUsers?.count ?? 0),
          leads: Number(totalLeads?.count ?? 0),
          content: Number(totalContent?.count ?? 0),
        }
      });
    } catch (err: any) {
      console.error("[AgentRoutes] Executive briefing error:", err);
      res.status(500).json({ error: "Briefing generation failed", details: err.message });
    }
  });

  // ===== APPROVE RECOMMENDATION (save draft asset to queue) =====
  app.post("/api/agent/approve-recommendation", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;
    if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });

    const { assetType, draft, action } = req.body;

    try {
      if (assetType === "social_post" && draft?.content) {
        const [saved] = await db.insert(agentContent).values({
          platform: draft.platform || "instagram",
          contentType: "post",
          content: draft.content,
          hashtags: draft.hashtags || "#CAREN #KnowYourRights",
          status: "ready",
        }).returning();
        return res.json({ success: true, saved: true, item: saved, message: "Post saved to Content queue" });
      }
      // For non-content assets (ops/strategy/financial), just confirm approved — no DB save needed
      return res.json({ success: true, saved: false, message: `${action || "Recommendation"} approved` });
    } catch (err: any) {
      console.error("[AgentRoutes] Approve recommendation error:", err);
      res.status(500).json({ error: "Approval failed", details: err.message });
    }
  });

  // ===== LEAD STATUS UPDATE (PATCH) =====
  app.patch("/api/leads/:id", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;
    if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.params;
    const { status, notes } = req.body;
    const validStatuses = ["new", "contacted", "converted", "unsubscribed"];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });
    try {
      const updates: any = {};
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      if (status === "converted") updates.convertedAt = new Date();
      const [updated] = await db.update(leads).set(updates).where(eq(leads.id, parseInt(id))).returning();
      res.json({ success: true, lead: updated });
    } catch (err: any) {
      res.status(500).json({ error: "Update failed", details: err.message });
    }
  });

  // ===== EMAIL DRIP CAMPAIGN =====
  async function sendDripEmail(email: string, firstName: string | null | undefined, step: number) {
    const name = firstName || "there";
    const drips: Array<{ subject: string; headline: string; body: string; cta: string }> = [
      { subject: "", headline: "", body: "", cta: "" }, // Step 0 = welcome (already sent)
      {
        subject: "Did you know you have the right to record police? 📹",
        headline: "Your Recording Rights — Know Before You Need Them",
        body: `Hey ${name},<br><br>One of the most powerful tools you have in any police encounter is your right to record — but the rules vary by state.<br><br>C.A.R.E.N.™ ALERT knows your state's specific recording laws automatically using your GPS. Whether you're in a two-party consent state or a single-party state, you'll know your rights in real time.<br><br><strong>Key fact:</strong> In all 50 states, it is legal to record police in public — but there are important rules about distance, interference, and audio consent.`,
        cta: "Check My State's Laws →",
      },
      {
        subject: "What to do in the first 30 seconds of a traffic stop 🚗",
        headline: "The 30-Second Protocol That Could Save Your Life",
        body: `Hey ${name},<br><br>The first 30 seconds of a traffic stop are the most critical — and most people freeze because they don't know exactly what to do.<br><br>C.A.R.E.N.™ ALERT's Voice Coaching feature walks you through exactly what to say and do in real time, based on your specific state's laws and the officer's statements.<br><br><strong>The protocol:</strong> Hands visible. Engine off. Window down. Recording started. Rights stated calmly.`,
        cta: "Try Voice Coaching Now →",
      },
      {
        subject: "3 words that can protect you in any encounter 🛡️",
        headline: "\"I Do Not Consent\"",
        body: `Hey ${name},<br><br>Three words that have legal power in every state: <strong>"I do not consent."</strong><br><br>Saying these words clearly — on camera — significantly limits what law enforcement can do without a warrant. C.A.R.E.N.™ ALERT's AI Legal Assistant helps you understand exactly when and how to use this phrase based on your specific situation.<br><br>Don't wait until you're in the moment to learn this. Know it now.`,
        cta: "Ask the AI Legal Assistant →",
      },
      {
        subject: "Your protection starts at $1 — here's why it's worth it 💡",
        headline: "Full Legal Protection for Less Than a Coffee",
        body: `Hey ${name},<br><br>C.A.R.E.N.™ ALERT offers protection starting at just <strong>$1 one-time</strong> — and the constitutional_pro plan is $9.99/month for complete coverage including attorney matching, AI coaching, emergency family coordination, and evidence cataloging.<br><br>The question isn't whether you can afford to be protected. It's whether you can afford not to be.<br><br>Thousands of encounters happen every day where people wish they'd been prepared. Today is a good day to get ready.`,
        cta: "View Pricing & Protect Yourself →",
      },
    ];

    if (step < 1 || step > 4) return false;
    const drip = drips[step];

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:40px;border-radius:12px;">
        <h1 style="color:#06b6d4;font-size:24px;margin-bottom:4px;">C.A.R.E.N.™ ALERT</h1>
        <p style="color:#94a3b8;font-size:12px;margin-bottom:28px;">Citizen Assistance for Roadside Emergencies and Navigation</p>
        <h2 style="color:#f8fafc;font-size:20px;">${drip.headline}</h2>
        <div style="color:#cbd5e1;line-height:1.8;margin:20px 0;">${drip.body}</div>
        <a href="https://citizen-care-projectdna7.replit.app" style="display:inline-block;background:#06b6d4;color:#000;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;margin:16px 0;">${drip.cta}</a>
        <p style="color:#475569;font-size:11px;margin-top:32px;border-top:1px solid #1e293b;padding-top:16px;">
          © 2025 C.A.R.E.N.™ ALERT. You're receiving this because you signed up for updates.<br>
          <a href="https://citizen-care-projectdna7.replit.app/privacy" style="color:#475569;">Unsubscribe</a>
        </p>
      </div>
    `;

    return sendEmail({
      to: email,
      from: 'noreply@carenalert.com',
      fromName: 'C.A.R.E.N.™ ALERT',
      subject: drip.subject,
      html,
    });
  }

  // Process all due drip emails
  app.post("/api/agent/drip/process", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;
    if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });

    const DRIP_DELAYS_DAYS = [0, 2, 5, 10, 14];
    try {
      const allLeads = await db.select().from(leads).where(lt(leads.dripStep, 4));
      const now = new Date();
      let sent = 0, skipped = 0;

      for (const lead of allLeads) {
        const step = (lead.dripStep ?? 0);
        const nextStep = step + 1;
        if (nextStep > 4) { skipped++; continue; }
        const daysSinceLastDrip = lead.lastDripAt
          ? (now.getTime() - new Date(lead.lastDripAt).getTime()) / (1000 * 60 * 60 * 24)
          : (now.getTime() - new Date(lead.createdAt!).getTime()) / (1000 * 60 * 60 * 24);
        const requiredDays = DRIP_DELAYS_DAYS[nextStep] - DRIP_DELAYS_DAYS[step];
        if (daysSinceLastDrip < requiredDays) { skipped++; continue; }
        const ok = await sendDripEmail(lead.email, lead.firstName, nextStep);
        if (ok) {
          await db.update(leads).set({ dripStep: nextStep, lastDripAt: now }).where(eq(leads.id, lead.id));
          sent++;
        }
      }
      res.json({ success: true, sent, skipped });
    } catch (err: any) {
      res.status(500).json({ error: "Drip process failed", details: err.message });
    }
  });

  // Send next drip to a specific lead immediately
  app.post("/api/agent/drip/lead/:id", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user;
    if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
    try {
      const [lead] = await db.select().from(leads).where(eq(leads.id, parseInt(req.params.id)));
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      const nextStep = (lead.dripStep ?? 0) + 1;
      if (nextStep > 4) return res.json({ success: false, message: "All drip emails already sent" });
      const ok = await sendDripEmail(lead.email, lead.firstName, nextStep);
      if (ok) {
        await db.update(leads).set({ dripStep: nextStep, lastDripAt: new Date() }).where(eq(leads.id, lead.id));
        return res.json({ success: true, message: `Drip step ${nextStep} sent to ${lead.email}`, nextStep });
      }
      res.status(500).json({ error: "Email send failed" });
    } catch (err: any) {
      res.status(500).json({ error: "Drip send failed", details: err.message });
    }
  });

  // ===== AGENT STATS =====
  app.get("/api/agent/stats", async (req, res) => {
    const sessionUser = (req.session as any)?.user || (req.session as any)?.passport?.user; if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
    const [totalLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads);
    const [totalContent] = await db.select({ count: sql<number>`count(*)` }).from(agentContent);
    const [readyContent] = await db.select({ count: sql<number>`count(*)` }).from(agentContent)
      .where(eq(agentContent.status, "ready"));
    const [postedContent] = await db.select({ count: sql<number>`count(*)` }).from(agentContent)
      .where(eq(agentContent.status, "posted"));
    const [newLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads)
      .where(eq(leads.status, "new"));

    res.json({
      leads: { total: Number(totalLeads?.count ?? 0), new: Number(newLeads?.count ?? 0) },
      content: {
        total: Number(totalContent?.count ?? 0),
        ready: Number(readyContent?.count ?? 0),
        posted: Number(postedContent?.count ?? 0),
      },
    });
  });
}
