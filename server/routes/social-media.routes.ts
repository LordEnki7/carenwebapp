import { Express } from "express";
import { db } from "../db";
import { socialMediaPosts } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const VIDEOS = [
  { file: "caren-hero.mp4", label: "Meet C.A.R.E.N.™ Alert — 1:02 Commercial" },
  { file: "caren-short.mp4", label: "One Tap Could Save a Life — 22 sec" },
  { file: "caren-attorney.mp4", label: "Be the First Call — Attorney Network Outreach" },
];

const PLATFORM_GUIDES: Record<string, { tone: string; maxHashtags: number; style: string }> = {
  youtube: { tone: "informative and professional", maxHashtags: 10, style: "Use a compelling title and a full description with timestamps if relevant. Explain the platform's value clearly." },
  linkedin: { tone: "professional and thought-leadership", maxHashtags: 5, style: "Lead with a bold insight or statistic. Speak to professionals, business owners, and community leaders." },
  instagram: { tone: "urgent and emotional", maxHashtags: 25, style: "Hook in the first line. Use line breaks for readability. End with a strong CTA. Emojis are welcome." },
  tiktok: { tone: "direct, punchy, youth-oriented", maxHashtags: 6, style: "Keep it short. Use trending language. First sentence is the hook. Make it feel native to TikTok." },
  twitter: { tone: "sharp and bold", maxHashtags: 3, style: "Under 280 characters for the core message. One powerful hook. Link to carenalert.com." },
  facebook: { tone: "community-focused and relatable", maxHashtags: 5, style: "Tell a short story or pose a question. Speak to families and everyday drivers. Invite sharing." },
};

export function registerSocialMediaRoutes(app: Express) {

  // ── DB migration for social_media_posts table ─────────────────────────────
  app.get("/api/social/init", async (_req, res) => {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS social_media_posts (
          id SERIAL PRIMARY KEY,
          platform VARCHAR NOT NULL,
          video_file VARCHAR NOT NULL,
          title VARCHAR,
          caption TEXT,
          hashtags TEXT,
          status VARCHAR DEFAULT 'draft',
          scheduled_at TIMESTAMP,
          posted_at TIMESTAMP,
          post_url VARCHAR,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET: all posts ─────────────────────────────────────────────────────────
  app.get("/api/social/posts", async (_req, res) => {
    try {
      const posts = await db.select().from(socialMediaPosts).orderBy(desc(socialMediaPosts.createdAt));
      res.json(posts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST: AI generate caption ─────────────────────────────────────────────
  app.post("/api/social/generate", async (req, res) => {
    try {
      const { platform, videoFile } = req.body;
      if (!platform || !videoFile) return res.status(400).json({ error: "platform and videoFile required" });

      const guide = PLATFORM_GUIDES[platform] || PLATFORM_GUIDES.instagram;
      const video = VIDEOS.find(v => v.file === videoFile);
      const videoLabel = video?.label || videoFile;

      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const isAttorneyVideo = videoFile === "caren-attorney.mp4";

      // ── COMPLIANCE RULES for attorney content ────────────────────────────
      // C.A.R.E.N.™ Alert is NOT a law firm. We do NOT provide legal advice.
      // We do NOT share fees, referral payments, or any portion of legal fees.
      // Attorneys keep 100% of their fees. We are a directory + connection tool only.
      // We do NOT "recommend" any attorney — the user always chooses.
      // We cannot use "best attorney" language or imply paid boosting.
      // Compliant message: structured visibility, direct user connection, mission-driven.
      // ─────────────────────────────────────────────────────────────────────

      const audienceContext = isAttorneyVideo
        ? `This video is targeted at ATTORNEYS and legal professionals. The goal is to invite them to apply to join the C.A.R.E.N.™ Alert Legal Access Network (CLAN) — a free verified attorney directory.

CRITICAL COMPLIANCE RULES — you MUST follow these exactly:
- Do NOT mention referral fees, referral income, commissions, or any form of payment from C.A.R.E.N.™ Alert to attorneys. There are none.
- Do NOT say C.A.R.E.N.™ Alert "delivers clients" or "guarantees clients." We do not.
- Do NOT say C.A.R.E.N.™ Alert "recommends" attorneys. Users choose independently.
- Do NOT use phrases like "passive income," "referral income," or any income-related language.
- DO say C.A.R.E.N.™ Alert is NOT a law firm and does NOT provide legal advice.
- DO say attorneys retain 100% of their fees and remain fully independent.
- DO emphasize this is a directory listing with structured visibility, not a referral scheme.
- The attorney applies once, gets listed, and users in their area can find and contact them directly.`
        : `This video targets everyday drivers and families. Speak to people who want legal protection and safety on the road.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a compliant social media copywriter for C.A.R.E.N.™ Alert (Citizen Assistance for Roadside Emergencies and Navigation). C.A.R.E.N.™ Alert is NOT a law firm. It does NOT provide legal advice. It does NOT share legal fees or pay referral fees to attorneys. You write posts that are authentic, compelling, and fully compliant with bar association advertising rules and legal ethics. You deeply understand each platform's culture and algorithm.`,
          },
          {
            role: "user",
            content: `Write a social media post for ${platform.toUpperCase()} to accompany this video: "${videoLabel}".

Audience context: ${audienceContext}

Platform guidance: ${guide.style}
Tone: ${guide.tone}
Max hashtags: ${guide.maxHashtags}

${isAttorneyVideo ? `COMPLIANT attorney recruitment angles (pick 2-3, use exact framing):
- "Be part of a growing national attorney directory" (not a referral network)
- "Get visibility to users who need legal help in your area"
- "You stay fully independent — 100% of your fees remain yours"
- "C.A.R.E.N.™ Alert is not a law firm and does not share fees"
- "Be an early verified attorney in your market"
- "Help people who need legal representation at critical moments"
- "Apply at carenalert.com/attorney-application"
- Always end with: C.A.R.E.N.™ Alert does not provide legal advice. Attorneys are independent professionals.` : `C.A.R.E.N.™ Alert features to weave in naturally (pick 2-3):
- Real-time multi-angle video recording during traffic stops
- GPS-powered state-specific legal rights database (all 50 states)
- One-tap emergency SOS with family notification
- Attorney directory and legal document generation
- Voice-commanded, hands-free operation
- Available on iOS and Android
- Download at carenalert.com`}

Return JSON with exactly these fields:
{
  "title": "Video title (for YouTube only, leave blank for other platforms)",
  "caption": "The full post body text",
  "hashtags": "Space-separated hashtags starting with #"
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST: Save/schedule a post ─────────────────────────────────────────────
  app.post("/api/social/save", async (req, res) => {
    try {
      const { platform, videoFile, title, caption, hashtags, scheduledAt } = req.body;
      const [post] = await db.insert(socialMediaPosts).values({
        platform,
        videoFile,
        title: title || null,
        caption: caption || null,
        hashtags: hashtags || null,
        status: scheduledAt ? "scheduled" : "draft",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      }).returning();
      res.json({ success: true, post });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DELETE: Remove a post ─────────────────────────────────────────────────
  app.delete("/api/social/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(socialMediaPosts).where(eq(socialMediaPosts.id, id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── PUT: Mark as posted (manual) ──────────────────────────────────────────
  app.put("/api/social/posts/:id/mark-posted", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { postUrl } = req.body;
      const [updated] = await db.update(socialMediaPosts)
        .set({ status: "posted", postedAt: new Date(), postUrl: postUrl || null })
        .where(eq(socialMediaPosts.id, id))
        .returning();
      res.json({ success: true, post: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Platform status endpoints ──────────────────────────────────────────────
  app.get("/api/social/linkedin/status", async (_req, res) => {
    const hasToken = !!process.env.LINKEDIN_ACCESS_TOKEN;
    const hasAuthor = !!process.env.LINKEDIN_AUTHOR_URN;
    res.json({ connected: hasToken && hasAuthor, hasToken, hasAuthor });
  });

  app.get("/api/social/twitter/status", async (_req, res) => {
    const connected = !!(
      process.env.TWITTER_API_KEY &&
      process.env.TWITTER_API_SECRET &&
      process.env.TWITTER_ACCESS_TOKEN &&
      process.env.TWITTER_ACCESS_TOKEN_SECRET
    );
    res.json({ connected });
  });

  app.get("/api/social/facebook/status", async (_req, res) => {
    const connected = !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID);
    res.json({ connected });
  });

  app.get("/api/social/instagram/status", async (_req, res) => {
    const connected = !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID);
    res.json({ connected });
  });

  // ── LinkedIn: post a saved post ────────────────────────────────────────────
  app.post("/api/social/linkedin/post/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const token = process.env.LINKEDIN_ACCESS_TOKEN;
      const authorUrn = process.env.LINKEDIN_AUTHOR_URN;

      if (!token || !authorUrn) {
        return res.status(400).json({
          error: "LinkedIn credentials not configured. Add LINKEDIN_ACCESS_TOKEN and LINKEDIN_AUTHOR_URN to your secrets."
        });
      }

      const [post] = await db.select().from(socialMediaPosts).where(eq(socialMediaPosts.id, id));
      if (!post) return res.status(404).json({ error: "Post not found" });

      const fullText = [
        post.caption,
        post.hashtags ? `\n\n${post.hashtags}` : "",
      ].join("").trim();

      const body: any = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: fullText },
            shareMediaCategory: "ARTICLE",
            media: [
              {
                status: "READY",
                originalUrl: "https://carenalert.com",
                title: { attributes: [], text: post.title || "C.A.R.E.N.™ Alert — Roadside Safety & Legal Protection" },
              },
            ],
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[LINKEDIN] Post failed:", errText);
        return res.status(response.status).json({ error: `LinkedIn API error: ${errText}` });
      }

      const data: any = await response.json();
      const postId = data.id || "";
      const postUrl = postId
        ? `https://www.linkedin.com/feed/update/${postId}`
        : "https://www.linkedin.com/in/me/recent-activity/shares/";

      await db.update(socialMediaPosts)
        .set({ status: "posted", postedAt: new Date(), postUrl })
        .where(eq(socialMediaPosts.id, id));

      res.json({ success: true, postUrl });
    } catch (err: any) {
      console.error("[LINKEDIN] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── X / Twitter: post a saved post ────────────────────────────────────────
  app.post("/api/social/twitter/post/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const apiKey            = process.env.TWITTER_API_KEY;
      const apiSecret         = process.env.TWITTER_API_SECRET;
      const accessToken       = process.env.TWITTER_ACCESS_TOKEN;
      const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

      if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
        return res.status(400).json({
          error: "X/Twitter credentials not configured. Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_TOKEN_SECRET to your Secrets."
        });
      }

      const [post] = await db.select().from(socialMediaPosts).where(eq(socialMediaPosts.id, id));
      if (!post) return res.status(404).json({ error: "Post not found" });

      const { TwitterApi } = await import("twitter-api-v2");
      const client = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken,
        accessSecret: accessTokenSecret,
      });

      const tweetText = [
        post.caption || "",
        post.hashtags ? `\n${post.hashtags}` : "",
      ].join("").trim().slice(0, 280);

      const { data: tweet } = await client.v2.tweet(tweetText);

      const postUrl = `https://x.com/i/web/status/${tweet.id}`;

      await db.update(socialMediaPosts)
        .set({ status: "posted", postedAt: new Date(), postUrl })
        .where(eq(socialMediaPosts.id, id));

      res.json({ success: true, postUrl, tweetId: tweet.id });
    } catch (err: any) {
      console.error("[TWITTER] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Facebook: post a saved post ────────────────────────────────────────────
  app.post("/api/social/facebook/post/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      const pageId    = process.env.FACEBOOK_PAGE_ID;

      if (!pageToken || !pageId) {
        return res.status(400).json({
          error: "Facebook credentials not configured. Add FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID to your Secrets."
        });
      }

      const [post] = await db.select().from(socialMediaPosts).where(eq(socialMediaPosts.id, id));
      if (!post) return res.status(404).json({ error: "Post not found" });

      const message = [
        post.caption || "",
        post.hashtags ? `\n\n${post.hashtags}` : "",
      ].join("").trim();

      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            link: "https://carenalert.com",
            access_token: pageToken,
          }),
        }
      );

      const data: any = await response.json();
      if (!response.ok || data.error) {
        console.error("[FACEBOOK] Post error:", data.error);
        return res.status(400).json({ error: data.error?.message || "Facebook API error" });
      }

      const postUrl = `https://www.facebook.com/${data.id}`;

      await db.update(socialMediaPosts)
        .set({ status: "posted", postedAt: new Date(), postUrl })
        .where(eq(socialMediaPosts.id, id));

      res.json({ success: true, postUrl, postId: data.id });
    } catch (err: any) {
      console.error("[FACEBOOK] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Instagram: post a saved post (via Meta Graph API) ─────────────────────
  // Instagram requires a 2-step process: create media container → publish
  app.post("/api/social/instagram/post/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pageToken    = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      const igAccountId  = process.env.INSTAGRAM_ACCOUNT_ID;

      if (!pageToken || !igAccountId) {
        return res.status(400).json({
          error: "Instagram credentials not configured. Add FACEBOOK_PAGE_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID to your Secrets."
        });
      }

      const [post] = await db.select().from(socialMediaPosts).where(eq(socialMediaPosts.id, id));
      if (!post) return res.status(404).json({ error: "Post not found" });

      const caption = [
        post.caption || "",
        post.hashtags ? `\n\n${post.hashtags}` : "",
      ].join("").trim();

      // Step 1: Create media container (image_url required for static posts)
      // For video posts, use video_url and media_type: REELS
      const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            video_url: `https://carenalert.com/${post.videoFile}`,
            caption,
            media_type: "REELS",
            access_token: pageToken,
          }),
        }
      );

      const container: any = await containerRes.json();
      if (!containerRes.ok || container.error) {
        console.error("[INSTAGRAM] Container error:", container.error);
        return res.status(400).json({ error: container.error?.message || "Instagram container creation failed" });
      }

      // Step 2: Publish the container
      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: container.id,
            access_token: pageToken,
          }),
        }
      );

      const published: any = await publishRes.json();
      if (!publishRes.ok || published.error) {
        console.error("[INSTAGRAM] Publish error:", published.error);
        return res.status(400).json({ error: published.error?.message || "Instagram publish failed" });
      }

      const postUrl = `https://www.instagram.com/p/${published.id}`;

      await db.update(socialMediaPosts)
        .set({ status: "posted", postedAt: new Date(), postUrl })
        .where(eq(socialMediaPosts.id, id));

      res.json({ success: true, postUrl, mediaId: published.id });
    } catch (err: any) {
      console.error("[INSTAGRAM] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Incident Social Share: Generate AI caption ────────────────────────────
  app.post("/api/incidents/:id/social-share/generate", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const incidentId = req.params.id;
      const { platform } = req.body;
      if (!platform) return res.status(400).json({ error: "platform required" });

      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`
        SELECT * FROM cloud_incidents
        WHERE id = ${incidentId} AND user_id = ${userId} AND deleted_at IS NULL
      `;
      if (!rows.length) return res.status(404).json({ error: "Incident not found" });
      const incident = rows[0];

      const guide = PLATFORM_GUIDES[platform] || PLATFORM_GUIDES.instagram;

      const dateStr = new Date(incident.started_at).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });
      const duration = incident.duration_seconds
        ? `${Math.floor(incident.duration_seconds / 60)}m ${incident.duration_seconds % 60}s`
        : "unknown duration";
      const stateInfo = incident.state ? `in ${incident.state}` : "on the road";
      const triggerLabel =
        incident.trigger_type === "emergency" ? "an emergency situation" :
        incident.trigger_type === "traffic_stop" ? "a traffic stop" :
        "a roadside incident";

      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a social media copywriter for C.A.R.E.N.™ Alert. You help users share their roadside incident experiences to raise awareness and advocate for their rights. C.A.R.E.N.™ Alert is NOT a law firm. Posts must be authentic, empowering, and community-focused. Never include identifying details about specific officers. Keep the tone factual and rights-focused.`,
          },
          {
            role: "user",
            content: `Write a ${platform.toUpperCase()} post for a user sharing their documented roadside incident recorded with C.A.R.E.N.™ Alert.

Incident context:
- Date: ${dateStr}
- Location: ${stateInfo}
- Type: ${triggerLabel}
- Duration recorded: ${duration}
- Address: ${incident.address || "not captured"}

Platform guidance: ${guide.style}
Tone: ${guide.tone}
Max hashtags: ${guide.maxHashtags}

Goals:
- Share the experience to raise awareness
- Highlight that documentation protects rights
- Encourage others to know their rights and record safely
- Reference C.A.R.E.N.™ Alert as the tool used (carenalert.com)
- Do NOT name or identify any individuals involved
- Do NOT make legal conclusions about the incident

Include a brief advisory disclaimer at the end: "Recorded with C.A.R.E.N.™ Alert. This post is for awareness only and does not constitute legal advice."

Return JSON with exactly these fields:
{
  "title": "Post title (YouTube only, blank for others)",
  "caption": "The full post body text",
  "hashtags": "Space-separated hashtags starting with #"
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      res.json(result);
    } catch (err: any) {
      console.error("[INCIDENT SHARE] Generate error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Incident Social Share: Save as draft ──────────────────────────────────
  app.post("/api/incidents/:id/social-share/save", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const incidentId = req.params.id;
      const { platform, caption, hashtags, title } = req.body;
      if (!platform || !caption) return res.status(400).json({ error: "platform and caption required" });

      const [post] = await db.insert(socialMediaPosts).values({
        platform,
        videoFile: `incident:${incidentId}`,
        title: title || null,
        caption,
        hashtags: hashtags || null,
        status: "draft",
      }).returning();

      res.json({ success: true, post });
    } catch (err: any) {
      console.error("[INCIDENT SHARE] Save error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  console.log("[ROUTES] Social Media Agent routes registered");
}
