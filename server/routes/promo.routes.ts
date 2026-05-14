/**
 * promo.routes.ts — C.A.R.E.N. Promo Engine
 *
 * AI-powered content generation → admin approval queue → Meta auto-posting
 * Platforms: Instagram (Reels) + Facebook Page
 */

import { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { promoPosts } from "@shared/schema";
import { eq, desc, and, inArray, lte, isNotNull } from "drizzle-orm";
const ADMIN_KEY = process.env.CAREN_ADMIN_KEY || "CAREN_ADMIN_2025_PRODUCTION";

function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
  const provided = (req.headers as any)["x-admin-key"] || (req.query as any)?.adminKey || (req.body as any)?.adminKey;
  if (provided === ADMIN_KEY) { next(); return; }
  res.status(403).json({ error: "Unauthorized" });
}

const APP_STORE_LINK = "https://apps.apple.com/us/app/c-a-r-e-n-alert/id6745207980";
const PLAY_STORE_LINK = "https://play.google.com/store/apps/details?id=com.carenalert.app";
const CAREN_WEBSITE = "https://carenalert.com";

const VIDEOS = [
  { file: "caren-short.mp4",    label: "One Tap Could Save a Life (22 sec)",        publicUrl: `${CAREN_WEBSITE}/caren-short.mp4` },
  { file: "caren-hero.mp4",     label: "Meet C.A.R.E.N.™ Alert — Full Commercial",  publicUrl: `${CAREN_WEBSITE}/caren-hero.mp4` },
  { file: "caren-attorney.mp4", label: "Be the First Call — Attorney Outreach",      publicUrl: `${CAREN_WEBSITE}/caren-attorney.mp4` },
];

const PLATFORM_GUIDES: Record<string, { tone: string; hookStyle: string; captionStyle: string; maxHashtags: number }> = {
  instagram: {
    tone: "urgent, visual, emotional",
    hookStyle: "Start with a statement that makes someone stop scrolling. Use 'You' or 'If you've ever...' or a startling fact. No more than 15 words.",
    captionStyle: "Hook first line, then break into short punchy sentences. Each paragraph max 2 lines. End with a strong CTA to download. Include the App Store link.",
    maxHashtags: 20,
  },
  facebook: {
    tone: "community-focused, story-driven, relatable",
    hookStyle: "Open with a real scenario or question that resonates with Black families and everyday drivers. Conversational.",
    captionStyle: "Tell a micro-story or pose a situation. 3-4 short paragraphs. Speak to family safety. End with link to download.",
    maxHashtags: 8,
  },
  linkedin: {
    tone: "professional, thought-leadership, mission-driven",
    hookStyle: "Lead with a bold insight, statistic, or mission statement about legal rights, family safety, or civic tech. Under 20 words. No fluff.",
    captionStyle: "Frame around the problem (rights, safety, emergency response), then introduce C.A.R.E.N.™ Alert as the solution. 3–4 paragraphs. Reference the attorney network and AI features for professionals. End with a call to share or download. Include the app link.",
    maxHashtags: 5,
  },
};

const AUDIENCE_CONTEXT: Record<string, string> = {
  primary: `Primary audience: Black Americans — Black drivers, Black families, Black men and women who have had or fear police encounters or roadside emergencies. 
Speak directly to their lived experience. Reference the reality of "driving while Black," knowing your rights in high-stress situations, protecting your children, recording incidents legally and safely. 
Tone: empowering, protective, community-first. Never fear-mongering — this app gives people power and confidence. 
Use culturally resonant language. Don't be preachy. Be real.`,
  broad: `Broader audience: all American drivers and families — people who've been pulled over, had roadside emergencies, or worry about their legal rights in any encounter with law enforcement.
Speak to safety, peace of mind, legal protection, family security. Anyone who drives or has a family member who drives.
Tone: reassuring, practical, empowering. Highlight that this app works for everyone.`,
};

// ── DB auto-migration ──────────────────────────────────────────────────────────
async function ensurePromoTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS promo_posts (
        id SERIAL PRIMARY KEY,
        platform VARCHAR NOT NULL,
        audience_lane VARCHAR NOT NULL DEFAULT 'broad',
        video_file VARCHAR NOT NULL,
        hook TEXT NOT NULL,
        caption TEXT NOT NULL,
        hashtags TEXT NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'draft',
        scheduled_at TIMESTAMP,
        posted_at TIMESTAMP,
        post_url VARCHAR,
        error_message TEXT,
        reach INTEGER,
        likes INTEGER,
        comments INTEGER,
        shares INTEGER,
        is_winner BOOLEAN DEFAULT false,
        batch_id VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (e) {
    // table likely already exists
  }
}

// ── Meta API helpers ───────────────────────────────────────────────────────────

async function getMetaConfig(): Promise<{ token: string; pageId: string; igUserId: string | null } | null> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID || ""; // set once token is available
  if (!token) return null;

  let igUserId: string | null = process.env.META_IG_USER_ID || null;

  // Auto-fetch Instagram User ID from page if not cached
  if (!igUserId && pageId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const r = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${token}`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await r.json() as any;
      igUserId = data?.instagram_business_account?.id || null;
      if (igUserId) process.env.META_IG_USER_ID = igUserId;
    } catch { /* ignore — IG account may not be linked yet */ }
  }

  return { token, pageId, igUserId };
}

async function postToFacebook(token: string, pageId: string, caption: string, videoUrl: string): Promise<{ postUrl: string }> {
  // Post video to Facebook Page
  const body = new URLSearchParams({
    file_url: videoUrl,
    description: caption,
    access_token: token,
  });
  const r = await fetch(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
    method: "POST",
    body,
  });
  const data = await r.json() as any;
  if (!r.ok || data.error) throw new Error(data.error?.message || "Facebook post failed");
  return { postUrl: `https://www.facebook.com/${pageId}/videos/${data.id}` };
}

async function postToInstagram(token: string, igUserId: string, caption: string, videoUrl: string): Promise<{ postUrl: string }> {
  // Step 1: create media container (Reel)
  const container = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      access_token: token,
    }),
  });
  const containerData = await container.json() as any;
  if (!container.ok || containerData.error) throw new Error(containerData.error?.message || "IG container creation failed");

  const creationId = containerData.id;

  // Step 2: wait for video processing (poll up to 60s)
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const status = await fetch(`https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${token}`);
    const sd = await status.json() as any;
    if (sd.status_code === "FINISHED") break;
    if (sd.status_code === "ERROR") throw new Error("Instagram video processing failed");
  }

  // Step 3: publish
  const pub = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  const pubData = await pub.json() as any;
  if (!pub.ok || pubData.error) throw new Error(pubData.error?.message || "IG publish failed");

  return { postUrl: `https://www.instagram.com/p/${pubData.id}` };
}

async function postToLinkedIn(caption: string, articleUrl: string): Promise<{ postUrl: string }> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const companyUrn = process.env.LINKEDIN_COMPANY_URN; // urn:li:organization:114084274
  if (!token) throw new Error("LINKEDIN_ACCESS_TOKEN not configured");
  if (!companyUrn) throw new Error("LINKEDIN_COMPANY_URN not configured");

  const body = {
    author: companyUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: caption },
        shareMediaCategory: "ARTICLE",
        media: [{
          status: "READY",
          description: { text: "Download C.A.R.E.N.™ Alert — know your rights on every road." },
          originalUrl: articleUrl,
          title: { text: "C.A.R.E.N.™ Alert — Family Protection Platform" },
        }],
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
    body: JSON.stringify(body),
  });
  const data = await r.json() as any;
  if (!r.ok) throw new Error(data?.message || "LinkedIn post failed");
  const postId = data.id?.replace(/^urn:li:ugcPost:/, "") || data.id;
  return { postUrl: `https://www.linkedin.com/company/114084274/` };
}

// ── Shared publish logic (used by manual endpoint + scheduler) ─────────────────

async function autoPublishPost(postId: number): Promise<string> {
  const [post] = await db.select().from(promoPosts).where(eq(promoPosts.id, postId));
  if (!post) throw new Error("Post not found");
  if (post.status !== "approved") throw new Error("Post is not in approved state");

  const video = VIDEOS.find(v => v.file === post.videoFile) || VIDEOS[0];
  const fullCaption = `${post.hook}\n\n${post.caption}\n\n${post.hashtags}`;
  let postUrl = "";

  if (post.platform === "linkedin") {
    const result = await postToLinkedIn(fullCaption, APP_STORE_LINK);
    postUrl = result.postUrl;
  } else {
    const config = await getMetaConfig();
    if (!config?.token) throw new Error("META_PAGE_ACCESS_TOKEN not configured");
    if (post.platform === "facebook") {
      const result = await postToFacebook(config.token, config.pageId, fullCaption, video.publicUrl);
      postUrl = result.postUrl;
    } else if (post.platform === "instagram") {
      if (!config.igUserId) throw new Error("Instagram Business Account not linked to Facebook Page");
      const result = await postToInstagram(config.token, config.igUserId, fullCaption, video.publicUrl);
      postUrl = result.postUrl;
    }
  }

  await db.update(promoPosts).set({
    status: "posted",
    postedAt: new Date(),
    postUrl,
    errorMessage: null,
    scheduledAt: null,
  }).where(eq(promoPosts.id, postId));

  console.log(`[PROMO] Published post ${postId} → ${post.platform}: ${postUrl}`);
  return postUrl;
}

// ── Scheduler: fires approved posts when scheduledAt <= now ────────────────────

function startPromoScheduler() {
  setInterval(async () => {
    try {
      const due = await db.select().from(promoPosts).where(
        and(
          eq(promoPosts.status, "approved"),
          isNotNull(promoPosts.scheduledAt),
          lte(promoPosts.scheduledAt, new Date()),
        )
      );
      if (due.length === 0) return;

      console.log(`[PROMO_SCHEDULER] ${due.length} post(s) due — publishing now`);
      for (const post of due) {
        try {
          await autoPublishPost(post.id);
        } catch (e: any) {
          console.error(`[PROMO_SCHEDULER] Post ${post.id} failed: ${e.message}`);
          await db.update(promoPosts)
            .set({ status: "failed", errorMessage: e.message })
            .where(eq(promoPosts.id, post.id));
        }
      }
    } catch (e) {
      console.error("[PROMO_SCHEDULER] Scheduler error:", e);
    }
  }, 60_000);
  console.log("[PROMO_SCHEDULER] Running — checks every 60s for due posts");
}

// ── Route registration ─────────────────────────────────────────────────────────

export async function registerPromoRoutes(app: Express) {
  await ensurePromoTable();

  // GET: check Meta connection status
  app.get("/api/promo/meta-status", requireAdminKey, async (_req: Request, res: Response) => {
    const config = await getMetaConfig();
    const pageId = process.env.META_PAGE_ID || null;
    const linkedinReady = !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_COMPANY_URN);
    res.json({
      connected: !!config?.token,
      hasPageId: !!pageId,
      hasIgUserId: !!config?.igUserId,
      pageId,
      igUserId: config?.igUserId || null,
      linkedinConnected: linkedinReady,
      linkedinCompanyUrn: process.env.LINKEDIN_COMPANY_URN || null,
    });
  });

  // GET: all drafts
  app.get("/api/promo/drafts", requireAdminKey, async (_req: Request, res: Response) => {
    try {
      const drafts = await db.select().from(promoPosts)
        .where(eq(promoPosts.status, "draft"))
        .orderBy(desc(promoPosts.createdAt));
      res.json(drafts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET: approved (ready to post)
  app.get("/api/promo/approved", requireAdminKey, async (_req: Request, res: Response) => {
    try {
      const posts = await db.select().from(promoPosts)
        .where(eq(promoPosts.status, "approved"))
        .orderBy(desc(promoPosts.createdAt));
      res.json(posts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET: posted (performance feed)
  app.get("/api/promo/posted", requireAdminKey, async (_req: Request, res: Response) => {
    try {
      const posts = await db.select().from(promoPosts)
        .where(inArray(promoPosts.status, ["posted", "failed"]))
        .orderBy(desc(promoPosts.postedAt));
      res.json(posts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST: generate a batch of AI content
  app.post("/api/promo/generate", requireAdminKey, async (req: Request, res: Response) => {
    try {
      const { platforms = ["instagram", "facebook"], lanes = ["primary", "broad"], videoFile = "caren-short.mp4", count = 7 } = req.body;

      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const video = VIDEOS.find(v => v.file === videoFile) || VIDEOS[0];
      const batchId = `batch_${Date.now()}`;
      const generated: any[] = [];

      for (const lane of lanes as string[]) {
        for (const platform of platforms as string[]) {
          const guide = PLATFORM_GUIDES[platform] || PLATFORM_GUIDES.instagram;
          const audienceCtx = AUDIENCE_CONTEXT[lane] || AUDIENCE_CONTEXT.broad;
          const postsPerCombo = Math.max(1, Math.floor(count / (lanes.length * platforms.length)));

          const prompt = `You are a social media content expert for C.A.R.E.N.™ Alert — a mobile app that gives people GPS-enabled legal rights display, emergency response tools, attorney connection, and incident recording for vehicle stops and roadside emergencies.

${audienceCtx}

Platform: ${platform.toUpperCase()}
Platform tone: ${guide.tone}
Video being paired with this post: "${video.label}"
App Store link to include: ${APP_STORE_LINK}
Google Play link to include: ${PLAY_STORE_LINK}

Generate EXACTLY ${postsPerCombo} social media post(s) for this platform.

Each post must have:
- hook: ${guide.hookStyle}
- caption: ${guide.captionStyle} Make sure the App Store or Play Store link is woven into the caption naturally. Keep it under 2200 chars.
- hashtags: exactly ${guide.maxHashtags} relevant hashtags as a single string with spaces between them. Include a mix of: rights hashtags, safety hashtags, Black community hashtags (for primary lane), driving/car hashtags, app-specific tags like #CARENAlert #KnowYourRights.

Respond ONLY with valid JSON — an array of objects, each with keys: hook, caption, hashtags.
No markdown, no extra text. Just the JSON array.`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.85,
          });

          const raw = completion.choices[0].message.content?.trim() || "[]";
          const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "").trim();

          let posts: any[] = [];
          try { posts = JSON.parse(cleaned); } catch { posts = []; }

          for (const post of posts) {
            if (!post.hook || !post.caption) continue;
            const [inserted] = await db.insert(promoPosts).values({
              platform,
              audienceLane: lane,
              videoFile: video.file,
              hook: post.hook,
              caption: post.caption,
              hashtags: post.hashtags || "",
              status: "draft",
              batchId,
            }).returning();
            generated.push(inserted);
          }
        }
      }

      res.json({ success: true, count: generated.length, batchId, posts: generated });
    } catch (e: any) {
      console.error("[PROMO] Generate error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // PATCH: approve a draft
  app.patch("/api/promo/:id/approve", requireAdminKey, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { hook, caption, hashtags, scheduledAt } = req.body;
      const updates: any = { status: "approved" };
      if (hook) updates.hook = hook;
      if (caption) updates.caption = caption;
      if (hashtags) updates.hashtags = hashtags;
      if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);

      const [updated] = await db.update(promoPosts).set(updates).where(eq(promoPosts.id, id)).returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PATCH: skip a draft
  app.patch("/api/promo/:id/skip", requireAdminKey, async (_req: Request, res: Response) => {
    try {
      const id = parseInt(_req.params.id);
      const [updated] = await db.update(promoPosts).set({ status: "skipped" }).where(eq(promoPosts.id, id)).returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST: publish an approved post immediately (bypasses scheduler)
  app.post("/api/promo/:id/publish", requireAdminKey, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await autoPublishPost(id);
      const [updated] = await db.select().from(promoPosts).where(eq(promoPosts.id, id));
      res.json(updated);
    } catch (e: any) {
      console.error("[PROMO] Publish error:", e);
      await db.update(promoPosts).set({ status: "failed", errorMessage: e.message }).where(eq(promoPosts.id, parseInt(req.params.id)));
      res.status(500).json({ error: e.message });
    }
  });

  // PATCH: schedule an approved post for a future time
  app.patch("/api/promo/:id/schedule", requireAdminKey, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { scheduledAt } = req.body;
      if (!scheduledAt) return res.status(400).json({ error: "scheduledAt is required" });

      const [updated] = await db.update(promoPosts)
        .set({ scheduledAt: new Date(scheduledAt) })
        .where(and(eq(promoPosts.id, id), eq(promoPosts.status, "approved")))
        .returning();

      if (!updated) return res.status(404).json({ error: "Post not found or not in approved state" });
      console.log(`[PROMO] Post ${id} scheduled for ${scheduledAt}`);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // PATCH: cancel a scheduled post (keeps it approved, clears time)
  app.patch("/api/promo/:id/unschedule", requireAdminKey, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [updated] = await db.update(promoPosts)
        .set({ scheduledAt: null })
        .where(and(eq(promoPosts.id, id), eq(promoPosts.status, "approved")))
        .returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST: sync performance metrics from Meta
  app.post("/api/promo/:id/sync-metrics", requireAdminKey, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [post] = await db.select().from(promoPosts).where(eq(promoPosts.id, id));
      if (!post || post.status !== "posted") return res.status(400).json({ error: "Post not found or not posted" });

      const config = await getMetaConfig();
      if (!config?.token) return res.status(503).json({ error: "Meta not configured" });

      // Extract post ID from URL and fetch insights
      const postId = post.postUrl?.split("/").filter(Boolean).pop();
      if (!postId) return res.status(400).json({ error: "No post URL stored" });

      const r = await fetch(`https://graph.facebook.com/v19.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${config.token}`);
      const data = await r.json() as any;

      const likes = data?.likes?.summary?.total_count || 0;
      const comments = data?.comments?.summary?.total_count || 0;
      const shares = data?.shares?.count || 0;
      const total = likes + comments + shares;

      // Mark as winner if above threshold
      const isWinner = total >= 50;

      const [updated] = await db.update(promoPosts).set({ likes, comments, shares, isWinner }).where(eq(promoPosts.id, id)).returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // DELETE: remove a draft or skipped post
  app.delete("/api/promo/:id", requireAdminKey, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(promoPosts).where(and(eq(promoPosts.id, id), inArray(promoPosts.status, ["draft", "skipped"])));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET: stats summary
  app.get("/api/promo/stats", requireAdminKey, async (_req: Request, res: Response) => {
    try {
      const all = await db.select().from(promoPosts);
      const drafts = all.filter(p => p.status === "draft").length;
      const approved = all.filter(p => p.status === "approved").length;
      const posted = all.filter(p => p.status === "posted").length;
      const winners = all.filter(p => p.isWinner).length;
      const totalLikes = all.reduce((s, p) => s + (p.likes || 0), 0);
      const totalComments = all.reduce((s, p) => s + (p.comments || 0), 0);
      const totalShares = all.reduce((s, p) => s + (p.shares || 0), 0);
      res.json({ drafts, approved, posted, winners, totalLikes, totalComments, totalShares });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  startPromoScheduler();
  console.log("[PROMO] Promo Engine routes registered");
}
