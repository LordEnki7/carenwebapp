import { Express } from "express";
import { db } from "../db";
import { socialMediaPosts } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const VIDEOS = [
  { file: "caren-hero.mp4", label: "Meet C.A.R.E.N. — 1:02 Commercial" },
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
      const audienceContext = isAttorneyVideo
        ? `This video is specifically targeted at ATTORNEYS and legal professionals, recruiting them to join the C.A.R.E.N. Legal Access Network (CLAN). The goal is to get attorneys to apply at carenalert.com to become a partner attorney. Speak directly to attorneys — highlight new client acquisition, referral income, and being part of a mission-driven platform. Do NOT speak to everyday drivers for this one.`
        : `This video targets everyday drivers and families. Speak to people who want legal protection and safety on the road.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a viral social media copywriter for C.A.R.E.N. (Citizen Assistance for Roadside Emergencies and Navigation) — a GPS-powered driver safety and legal protection platform. You write posts that are authentic, urgent, and compelling. You deeply understand each platform's culture and algorithm.`,
          },
          {
            role: "user",
            content: `Write a social media post for ${platform.toUpperCase()} to accompany this video: "${videoLabel}".

Audience context: ${audienceContext}

Platform guidance: ${guide.style}
Tone: ${guide.tone}
Max hashtags: ${guide.maxHashtags}

${isAttorneyVideo ? `Attorney recruitment angles to weave in naturally (pick 2-3):
- Get pre-screened, motivated clients delivered to you
- Passive referral income with no cold calling
- Join a growing national attorney network
- Be the first attorney in your market before spots fill up
- Help clients who genuinely need legal representation
- Apply at carenalert.com/attorney-application` : `C.A.R.E.N. features to weave in naturally (pick 2-3):
- Real-time multi-angle video recording during traffic stops
- GPS-powered state-specific legal rights database (all 50 states)
- One-tap emergency SOS with family notification
- Attorney matching and legal document generation
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

  console.log("[ROUTES] Social Media Agent routes registered");
}
