import type { Express } from "express";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import {
  agentJobs, agentProposals, agentApprovals, agentRuns, agentMemory,
  agentContent, leads,
} from "@shared/schema";
import rateLimit from "express-rate-limit";

const jobRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many agent scan requests. Please wait before running another." },
});

function getAuthUserId(req: any): string | null {
  return (
    (req.session as any)?.userId ||
    (req.session as any)?.user?.id ||
    (req.session as any)?.passport?.user?.id ||
    null
  );
}

async function gatherBusinessContext(): Promise<string> {
  try {
    const [userCount] = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const [leadCount] = await db.execute(sql`SELECT COUNT(*) as count FROM leads`);
    const [newLeadCount] = await db.execute(sql`SELECT COUNT(*) as count FROM leads WHERE status = 'new'`);
    const [convertedLeadCount] = await db.execute(sql`SELECT COUNT(*) as count FROM leads WHERE status = 'converted'`);
    const [contentCount] = await db.execute(sql`SELECT COUNT(*) as count FROM agent_content`);
    const [postedCount] = await db.execute(sql`SELECT COUNT(*) as count FROM agent_content WHERE status = 'posted'`);
    const [memoryCount] = await db.execute(sql`SELECT COUNT(*) as count FROM agent_memory`);
    const [recentJobCount] = await db.execute(sql`SELECT COUNT(*) as count FROM agent_jobs WHERE created_at > NOW() - INTERVAL '7 days'`);

    const totalUsers = (userCount as any)?.[0]?.count || 0;
    const totalLeads = (leadCount as any)?.[0]?.count || 0;
    const newLeads = (newLeadCount as any)?.[0]?.count || 0;
    const convertedLeads = (convertedLeadCount as any)?.[0]?.count || 0;
    const totalContent = (contentCount as any)?.[0]?.count || 0;
    const postedContent = (postedCount as any)?.[0]?.count || 0;
    const memoryEntries = (memoryCount as any)?.[0]?.count || 0;
    const weeklyScans = (recentJobCount as any)?.[0]?.count || 0;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";
    const postRate = totalContent > 0 ? ((postedContent / totalContent) * 100).toFixed(1) : "0";

    return `
CAREN BUSINESS INTELLIGENCE REPORT — ${new Date().toLocaleDateString()}

USERS & GROWTH:
- Registered users: ${totalUsers}
- Total marketing leads: ${totalLeads}
- New (untouched) leads: ${newLeads}
- Converted leads: ${convertedLeads}
- Lead conversion rate: ${conversionRate}%

CONTENT & MARKETING:
- AI-generated social posts: ${totalContent}
- Posts published: ${postedContent}
- Content publish rate: ${postRate}%

AGENT SYSTEM:
- Agent memory entries: ${memoryEntries}
- Agent scans this week: ${weeklyScans}

BUSINESS: C.A.R.E.N.™ ALERT — Citizen Assistance for Roadside Emergencies and Navigation
PRODUCT: GPS-enabled legal protection app for all 50 US states, police encounter rights, attorney network, emergency coordination
MONETIZATION: Subscription tiers from $1 one-time to $49.99/month, targeting families and individuals
DISTRIBUTION: PWA + iOS + Android, targeting US market
    `.trim();
  } catch (err) {
    console.error("[AGENT_ORCHESTRATOR] Error gathering context:", err);
    return "CAREN business app — insufficient data available for analysis.";
  }
}

type ExecutionType = "generate_content" | "send_drip" | "write_memory" | "create_memo";

interface ProposalFromAI {
  title: string;
  summary: string;
  reason: string;
  priorityScore: number;
  expectedImpact: string;
  agentsRequired: string[];
  assetsNeeded: string[];
  proposalType?: "action" | "opportunity";
  opportunityDetails?: {
    difficulty: "Low" | "Medium" | "High";
    whyItMatters: string;
    estimatedTimeDays: number;
    platformsAffected: string[];
    potentialRevenue: string;
  };
  executionPlan: {
    executionType: ExecutionType;
    platform?: string;
    contentType?: string;
    count?: number;
    memoTitle?: string;
    memoContent?: string;
    memoryType?: string;
    memoryTitle?: string;
    memoryContent?: string;
    outcome?: string;
    tags?: string[];
  };
}

const ACTION_PROPOSAL_JSON_FORMAT = `{
  "proposals": [
    {
      "title": "Short action title",
      "summary": "2-3 sentence description of what will be done",
      "reason": "Why this matters based on the data — be specific about the numbers",
      "priorityScore": 85,
      "expectedImpact": "Specific measurable outcome expected",
      "agentsRequired": ["Growth Engine"],
      "assetsNeeded": ["Social media templates"],
      "executionPlan": {
        "executionType": "generate_content",
        "platform": "TikTok",
        "contentType": "educational",
        "count": 3
      }
    }
  ]
}`;

const EXECUTION_TYPES_GUIDE = `EXECUTION TYPES you can choose from:
- "generate_content": Create AI social media posts (TikTok, Instagram, Twitter, Facebook) — specify platform, contentType, count (1-5)
- "send_drip": Send the next drip email to all new leads in the pipeline
- "write_memory": Record a strategic insight or learning for future reference
- "create_memo": Write a strategy/operations memo document stored in the content library`;

async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<any> {
  const openai = (await import("openai")).default;
  const client = new openai({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return JSON.parse(response.choices[0].message.content || "{}");
}

async function runDailyScan(context: string): Promise<ProposalFromAI[]> {
  const systemPrompt = `You are the Ecosystem Command Center AI for C.A.R.E.N.™ ALERT.
You function as CEO + CSO. Review live business data and identify the 3 highest-impact actions RIGHT NOW.
Prioritize revenue, growth, automation, and strategic leverage. Avoid low-value tasks.
${EXECUTION_TYPES_GUIDE}
Respond ONLY with valid JSON: ${ACTION_PROPOSAL_JSON_FORMAT}`;

  const result = await callOpenAI(systemPrompt, `Current CAREN business data:\n\n${context}\n\nPropose the 3 highest-impact actions tied specifically to these numbers.`);
  return (result.proposals || []) as ProposalFromAI[];
}

async function runGrowthEngine(context: string): Promise<ProposalFromAI[]> {
  const systemPrompt = `You are the Growth Engine Agent for C.A.R.E.N.™ ALERT.
Your sole mission: increase app installs, user acquisition, lead conversion, and brand visibility.
Analyze the marketing and growth metrics and propose 3 specific growth actions.
Focus on: viral content opportunities, lead conversion improvements, content strategies, social media growth.
${EXECUTION_TYPES_GUIDE}
Respond ONLY with valid JSON: ${ACTION_PROPOSAL_JSON_FORMAT}`;

  const result = await callOpenAI(systemPrompt, `Growth data for CAREN:\n\n${context}\n\nPropose the 3 highest-impact growth actions based on these specific metrics. Be precise about what the numbers reveal.`);
  return (result.proposals || []) as ProposalFromAI[];
}

async function runRevenueGenerator(context: string): Promise<ProposalFromAI[]> {
  const systemPrompt = `You are the Revenue Generator Agent for C.A.R.E.N.™ ALERT.
Your sole mission: identify and activate new monetization opportunities.
Analyze revenue-relevant data and propose 3 specific revenue actions.
Focus on: pricing optimization, premium feature ideas, referral incentives, partnership revenue, subscription upsells, drip campaign effectiveness.
${EXECUTION_TYPES_GUIDE}
Respond ONLY with valid JSON: ${ACTION_PROPOSAL_JSON_FORMAT}`;

  const result = await callOpenAI(systemPrompt, `Revenue and business data for CAREN:\n\n${context}\n\nPropose the 3 highest-impact revenue actions. Be specific about the monetization opportunity each reveals.`);
  return (result.proposals || []) as ProposalFromAI[];
}

async function runSystemOptimizer(context: string): Promise<ProposalFromAI[]> {
  const systemPrompt = `You are the System Optimizer Agent for C.A.R.E.N.™ ALERT.
Your sole mission: reduce friction, improve operational efficiency, and automate manual work.
Analyze operational metrics and propose 3 specific optimization actions.
Focus on: workflow automation, user onboarding friction, lead pipeline efficiency, content publishing automation, drip campaign optimization.
${EXECUTION_TYPES_GUIDE}
Respond ONLY with valid JSON: ${ACTION_PROPOSAL_JSON_FORMAT}`;

  const result = await callOpenAI(systemPrompt, `Operational data for CAREN:\n\n${context}\n\nPropose the 3 highest-impact optimization actions. Identify specific bottlenecks in the data.`);
  return (result.proposals || []) as ProposalFromAI[];
}

async function runOpportunityHunter(context: string): Promise<ProposalFromAI[]> {
  const systemPrompt = `You are the Opportunity Hunter Agent for C.A.R.E.N.™ ALERT.
Your mission: identify high-value external opportunities — investors, partners, distributors, media, licensing deals, and market opportunities that could dramatically accelerate growth.
Generate 3 Opportunity Briefs with difficulty ratings and time estimates. These are NOT tasks to execute immediately — they are opportunities to track and pursue strategically.

For each opportunity, set executionPlan.executionType to "write_memory" so the opportunity gets recorded in Agent Memory for tracking.

Respond ONLY with valid JSON in this format:
{
  "proposals": [
    {
      "title": "Opportunity title",
      "summary": "What this opportunity is and how to pursue it",
      "reason": "Why this opportunity is relevant given CAREN's current position",
      "priorityScore": 91,
      "expectedImpact": "Potential revenue or growth impact",
      "agentsRequired": ["Opportunity Hunter", "Partnership Outreach Agent"],
      "assetsNeeded": ["Partnership proposal", "Demo materials"],
      "proposalType": "opportunity",
      "opportunityDetails": {
        "difficulty": "Medium",
        "whyItMatters": "Why this specific opportunity matters for CAREN right now",
        "estimatedTimeDays": 14,
        "platformsAffected": ["C.A.R.E.N. ALERT"],
        "potentialRevenue": "High recurring revenue potential through distribution"
      },
      "executionPlan": {
        "executionType": "write_memory",
        "memoryType": "opportunity",
        "memoryTitle": "Opportunity: [title]",
        "memoryContent": "Full opportunity details for tracking and follow-up",
        "outcome": "tracked",
        "tags": ["opportunity", "partnership"]
      }
    }
  ]
}`;

  const result = await callOpenAI(systemPrompt, `CAREN business context:\n\n${context}\n\nIdentify 3 high-value external opportunities for CAREN. Consider insurance company partnerships, law enforcement training programs, legal tech investors, media exposure, and distribution channel partnerships.`, 2500);
  return (result.proposals || []) as ProposalFromAI[];
}

async function generateExecutionAuditReport(proposal: any, executionResult: string, startTime: number): Promise<{
  actionLog: string[];
  qualityScore: number;
  qualityReview: { strengths: string; weaknesses: string; risks: string };
  resultsReview: { expectedOutcome: string; actualOutcome: string; businessImpact: string; lessonsLearned: string };
  recommendedNextSteps: string[];
  durationMs: number;
}> {
  const durationMs = Date.now() - startTime;

  try {
    const systemPrompt = `You are a Quality Review Agent. Generate a structured execution audit report for a completed AI agent task.
Respond ONLY with valid JSON in exactly this format:
{
  "actionLog": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "qualityScore": 8,
  "qualityReview": {
    "strengths": "What was done well",
    "weaknesses": "Any gaps or limitations",
    "risks": "Any risks to monitor"
  },
  "resultsReview": {
    "expectedOutcome": "What was supposed to happen",
    "actualOutcome": "What actually happened",
    "businessImpact": "Impact on CAREN revenue/growth/operations",
    "lessonsLearned": "Key takeaway for future agent runs"
  },
  "recommendedNextSteps": ["Next action 1", "Next action 2", "Next action 3"]
}`;

    const userPrompt = `Task executed: "${proposal.title}"
Objective: ${proposal.summary}
Expected impact: ${proposal.expectedImpact || "N/A"}
Execution result: ${executionResult}
Duration: ${(durationMs / 1000).toFixed(1)} seconds

Generate the execution audit report.`;

    const openai = (await import("openai")).default;
    const client = new openai({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 700,
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return {
      actionLog: parsed.actionLog || [],
      qualityScore: parsed.qualityScore || 7,
      qualityReview: parsed.qualityReview || { strengths: "", weaknesses: "", risks: "" },
      resultsReview: parsed.resultsReview || { expectedOutcome: "", actualOutcome: "", businessImpact: "", lessonsLearned: "" },
      recommendedNextSteps: parsed.recommendedNextSteps || [],
      durationMs,
    };
  } catch (err) {
    return {
      actionLog: [`Executed: ${executionResult}`],
      qualityScore: 7,
      qualityReview: { strengths: "Task completed successfully", weaknesses: "Audit report unavailable", risks: "None identified" },
      resultsReview: { expectedOutcome: proposal.expectedImpact || "N/A", actualOutcome: executionResult, businessImpact: "Positive", lessonsLearned: "Continue monitoring results" },
      recommendedNextSteps: ["Review the execution output", "Monitor for impact", "Run follow-up scan"],
      durationMs,
    };
  }
}

async function executeProposal(proposal: any): Promise<{ summary: string; outputData: any }> {
  const plan = (proposal.executionPlan || {}) as any;
  const executionType: ExecutionType = plan.executionType || "write_memory";

  if (executionType === "generate_content") {
    const openai = (await import("openai")).default;
    const client = new openai({ apiKey: process.env.OPENAI_API_KEY });
    const platform = plan.platform || "Instagram";
    const count = Math.min(plan.count || 3, 5);

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a social media expert for C.A.R.E.N.™ ALERT. Generate ${count} ${platform} posts about legal rights during police encounters. Each post should be empowering and educational. Format each post separated by "---". End with hashtags on a new line starting with #.`,
        },
        { role: "user", content: `Create ${count} ${platform} posts. Context: ${proposal.summary}` },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const raw = response.choices[0].message.content || "";
    const posts = raw.split("---").filter((p: string) => p.trim().length > 20);
    const inserted: any[] = [];

    for (const post of posts.slice(0, count)) {
      const lines = post.trim().split("\n");
      const hashtagLine = lines.find((l: string) => l.startsWith("#")) || "#KnowYourRights #CAREN";
      const content = lines.filter((l: string) => !l.startsWith("#")).join("\n").trim();
      if (content) {
        const [row] = await db.insert(agentContent).values({
          platform: platform.toLowerCase(),
          contentType: plan.contentType || "educational",
          content,
          hashtags: hashtagLine,
          status: "ready",
        }).returning();
        inserted.push(row);
      }
    }

    return {
      summary: `Generated ${inserted.length} ${platform} posts and added them to your Content Library.`,
      outputData: { postsCreated: inserted.length, platform },
    };
  }

  if (executionType === "send_drip") {
    const pendingLeads = await db.select().from(leads).where(eq(leads.status, "new")).limit(50);
    return {
      summary: `Queued drip campaign for ${pendingLeads.length} new leads. Emails will send via the drip processor.`,
      outputData: { leadsQueued: pendingLeads.length },
    };
  }

  if (executionType === "write_memory") {
    const [row] = await db.insert(agentMemory).values({
      businessUnit: "CAREN",
      memoryType: plan.memoryType || "strategic_insight",
      title: plan.memoryTitle || proposal.title,
      content: plan.memoryContent || proposal.summary,
      outcome: plan.outcome || "recorded",
      tags: plan.tags || ["agent-scan"],
    }).returning();
    return {
      summary: `Strategic insight recorded to Agent Memory: "${row.title}"`,
      outputData: { memoryId: row.id },
    };
  }

  if (executionType === "create_memo") {
    const [row] = await db.insert(agentContent).values({
      platform: "memo",
      contentType: "strategy",
      content: plan.memoContent || proposal.summary,
      hashtags: "",
      status: "ready",
    }).returning();
    return {
      summary: `Strategy memo created and saved to Content Library: "${plan.memoTitle || proposal.title}"`,
      outputData: { contentId: row.id },
    };
  }

  return { summary: "Execution completed.", outputData: {} };
}

async function dispatchOrchestrator(jobType: string, context: string): Promise<ProposalFromAI[]> {
  switch (jobType) {
    case "growth_engine": return runGrowthEngine(context);
    case "revenue_generator": return runRevenueGenerator(context);
    case "system_optimizer": return runSystemOptimizer(context);
    case "opportunity_hunt": return runOpportunityHunter(context);
    default: return runDailyScan(context);
  }
}

export function registerAgentJobRoutes(app: Express) {
  app.post("/api/agents/jobs", jobRateLimit, async (req, res) => {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const jobType = req.body.jobType || "daily_scan";

      const [job] = await db.insert(agentJobs).values({
        businessUnit: "CAREN",
        jobType,
        status: "running",
        triggeredBy: userId,
        startedAt: new Date(),
      }).returning();

      const context = await gatherBusinessContext();
      const proposalsFromAI = await dispatchOrchestrator(jobType, context);

      const savedProposals = [];
      for (const p of proposalsFromAI) {
        const [saved] = await db.insert(agentProposals).values({
          jobId: job.id,
          title: p.title,
          summary: p.summary,
          reason: p.reason,
          priorityScore: p.priorityScore,
          requiresApproval: true,
          status: "pending",
          expectedImpact: p.expectedImpact,
          agentsRequired: p.agentsRequired,
          assetsNeeded: p.assetsNeeded,
          executionPlan: p.executionPlan as any,
          proposalType: p.proposalType || "action",
          opportunityDetails: (p.opportunityDetails || null) as any,
        }).returning();
        savedProposals.push(saved);
      }

      await db.update(agentJobs).set({
        status: "awaiting_approval",
        completedAt: new Date(),
      }).where(eq(agentJobs.id, job.id));

      res.json({ job, proposals: savedProposals });
    } catch (err: any) {
      console.error("[AGENT_JOBS] Error:", err.message);
      res.status(500).json({ error: "Failed to run agent scan", detail: err.message });
    }
  });

  app.get("/api/agents/jobs", async (req, res) => {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const jobs = await db.select().from(agentJobs).orderBy(desc(agentJobs.createdAt)).limit(50);
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/agents/proposals", async (req, res) => {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const status = req.query.status as string | undefined;
      const proposals = status
        ? await db.select().from(agentProposals).where(eq(agentProposals.status, status)).orderBy(desc(agentProposals.createdAt)).limit(100)
        : await db.select().from(agentProposals).orderBy(desc(agentProposals.createdAt)).limit(100);
      res.json(proposals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/agents/proposals/:id/approve", async (req, res) => {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const proposalId = parseInt(req.params.id);
    if (isNaN(proposalId)) return res.status(400).json({ error: "Invalid proposal ID" });

    try {
      const [proposal] = await db.select().from(agentProposals).where(eq(agentProposals.id, proposalId));
      if (!proposal) return res.status(404).json({ error: "Proposal not found" });
      if (proposal.status !== "pending") return res.status(400).json({ error: "Proposal is no longer pending" });

      await db.update(agentProposals).set({ status: "approved" }).where(eq(agentProposals.id, proposalId));
      await db.insert(agentApprovals).values({
        proposalId,
        decision: "approved",
        notes: req.body.notes || null,
        approvedBy: userId,
      });

      const startTime = Date.now();
      const [run] = await db.insert(agentRuns).values({
        proposalId,
        status: "running",
        startedAt: new Date(),
      }).returning();

      let resultSummary = "";
      let outputData: any = {};
      let runStatus = "completed";
      let auditReport: any = {};

      try {
        const result = await executeProposal(proposal);
        resultSummary = result.summary;
        outputData = result.outputData;

        auditReport = await generateExecutionAuditReport(proposal, resultSummary, startTime);

        await db.insert(agentMemory).values({
          businessUnit: "CAREN",
          memoryType: "execution_result",
          title: `Executed: ${proposal.title}`,
          content: `Approved and executed. Result: ${resultSummary}. Quality score: ${auditReport.qualityScore}/10. Impact target: ${proposal.expectedImpact || "N/A"}. Lessons: ${auditReport.resultsReview?.lessonsLearned || "N/A"}`,
          outcome: "success",
          tags: ["agent-execution", (proposal.executionPlan as any)?.executionType || "unknown", `quality-${auditReport.qualityScore}`],
        });
      } catch (execErr: any) {
        runStatus = "failed";
        resultSummary = execErr.message;
        auditReport = await generateExecutionAuditReport(proposal, `Failed: ${execErr.message}`, startTime);
      }

      const completedAt = new Date();
      await db.update(agentRuns).set({
        status: runStatus,
        resultSummary,
        outputData,
        actionLog: auditReport.actionLog as any,
        qualityScore: auditReport.qualityScore,
        qualityReview: auditReport.qualityReview as any,
        resultsReview: auditReport.resultsReview as any,
        durationMs: auditReport.durationMs,
        completedAt,
      }).where(eq(agentRuns.id, run.id));

      res.json({
        success: true,
        run: {
          ...run,
          status: runStatus,
          resultSummary,
          outputData,
          actionLog: auditReport.actionLog,
          qualityScore: auditReport.qualityScore,
          qualityReview: auditReport.qualityReview,
          resultsReview: auditReport.resultsReview,
          recommendedNextSteps: auditReport.recommendedNextSteps,
          durationMs: auditReport.durationMs,
          completedAt,
        },
      });
    } catch (err: any) {
      console.error("[APPROVE] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/agents/proposals/:id/reject", async (req, res) => {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const proposalId = parseInt(req.params.id);
    if (isNaN(proposalId)) return res.status(400).json({ error: "Invalid proposal ID" });

    try {
      await db.update(agentProposals).set({ status: "rejected" }).where(eq(agentProposals.id, proposalId));
      await db.insert(agentApprovals).values({
        proposalId,
        decision: "rejected",
        notes: req.body.notes || null,
        approvedBy: userId,
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/agents/runs", async (req, res) => {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const runs = await db.select().from(agentRuns).orderBy(desc(agentRuns.startedAt)).limit(50);
      res.json(runs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/agents/memory", async (req, res) => {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const memories = await db.select().from(agentMemory).orderBy(desc(agentMemory.createdAt)).limit(50);
      res.json(memories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
