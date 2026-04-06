import { Express } from "express";
import { db } from "../db";
import { paymentIntelligenceReports, users, refundRequests } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { getOpenAIClient } from "../aiService";
import { createRateLimit } from "../security";

const PAYMENT_INTELLIGENCE_PROMPT = `ROLE: C.A.R.E.N. Payment and Subscription Intelligence Agent

MISSION
You analyze payments, subscriptions, customer behavior, and financial patterns to increase revenue, reduce refunds, and improve customer retention. You act as a financial intelligence system working alongside Customer Support and Refund systems.

CORE OBJECTIVES
• Detect churn risk before it happens
• Identify refund risk patterns
• Spot upsell opportunities
• Detect fraud and abuse
• Recommend retention actions

DATA ANALYSIS FRAMEWORK

CHURN DETECTION — Signals include:
• Low login frequency
• Recent complaints or support tickets
• Failed or late payments
• Short subscription duration
• Multiple refund requests

CHURN RISK LEVELS: low | medium | high | critical

RETENTION STRATEGY — If churn risk detected, recommend:
• Proactive support outreach
• Feature education or onboarding
• Retention offer (only if policy allows)
• Escalate to human retention team

REFUND PREVENTION — Identify patterns like:
• Confusion about product features
• Unmet expectations
• Failed onboarding
• Feature misunderstanding

UPSELL DETECTION — Flag users who:
• Login frequently
• Use multiple features heavily
• Would benefit from a higher plan

FRAUD DETECTION — Flag if:
• Multiple refund attempts in short period
• Inconsistent usage patterns
• Suspicious subscription behavior

DECISION OUTPUT FORMAT (JSON only, no other text):
{
  "risk_level": "low" | "medium" | "high",
  "churn_probability": "low" | "medium" | "high" | "critical",
  "key_issue_detected": "Brief description of the main issue or pattern",
  "recommended_action": "Specific actionable recommendation",
  "expected_impact": "What impact this action will have on retention/revenue",
  "urgency_level": "low" | "medium" | "high" | "critical",
  "churn_signals": ["signal1", "signal2"],
  "upsell_signals": ["signal1", "signal2"],
  "retention_actions": ["action1", "action2"],
  "payment_health_summary": "2-3 sentence summary of overall payment health",
  "refund_risk_flag": true | false,
  "fraud_flag": true | false,
  "quality_score": 1-10
}`;

function generateReportId(): string {
  return `INTEL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export function registerPaymentIntelligenceRoutes(app: Express) {
  const intelRateLimit = createRateLimit(60 * 60 * 1000, 10, "Analysis rate limit reached.");

  // ── Analyze a single user ─────────────────────────────────────────────────
  app.post("/api/payment-intelligence/analyze", intelRateLimit, async (req, res) => {
    try {
      const adminId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!adminId) return res.status(401).json({ error: "Unauthorized" });

      const { targetUserId, targetUserEmail, targetUserName, planType, context } = req.body;

      // Gather existing refund history for this user
      let previousRefunds: any[] = [];
      if (targetUserId) {
        previousRefunds = await db
          .select()
          .from(refundRequests)
          .where(eq(refundRequests.userId, targetUserId))
          .limit(10);
      }

      const prompt = `Analyze this C.A.R.E.N. subscriber for payment intelligence:

USER_ID: ${targetUserId || "unknown"}
USER_EMAIL: ${targetUserEmail || "unknown"}
USER_NAME: ${targetUserName || "unknown"}
PLAN_TYPE: ${planType || "unknown"}
PREVIOUS_REFUND_REQUESTS: ${previousRefunds.length}
REFUND_HISTORY: ${JSON.stringify(previousRefunds.map(r => ({ decision: r.decision, amount: r.amountPaid, reason: r.refundReason, date: r.createdAt })))}
ADDITIONAL_CONTEXT: ${context || "No additional context provided"}

Evaluate churn risk, refund risk, fraud signals, upsell opportunities, and retention recommendations. Return the JSON decision format.`;

      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: PAYMENT_INTELLIGENCE_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const result = JSON.parse(raw);

      const reportId = generateReportId();

      await db.insert(paymentIntelligenceReports).values({
        reportId,
        userId: targetUserId || null,
        userEmail: targetUserEmail || null,
        userName: targetUserName || null,
        planType: planType || null,
        riskLevel: result.risk_level || "low",
        churnProbability: result.churn_probability || "low",
        keyIssueDetected: result.key_issue_detected || null,
        recommendedAction: result.recommended_action || null,
        expectedImpact: result.expected_impact || null,
        urgencyLevel: result.urgency_level || "low",
        churnSignals: result.churn_signals || [],
        upsellSignals: result.upsell_signals || [],
        retentionActions: result.retention_actions || [],
        paymentHealthSummary: result.payment_health_summary || null,
        refundRiskFlag: result.refund_risk_flag || false,
        fraudFlag: result.fraud_flag || false,
        qualityScore: result.quality_score || 5,
        status: "active",
      });

      res.json({ reportId, ...result });
    } catch (error: any) {
      console.error("[PAYMENT_INTEL] Analysis error:", error.message);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // ── Admin: List all intelligence reports ─────────────────────────────────
  app.get("/api/payment-intelligence/reports", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const reports = await db
        .select()
        .from(paymentIntelligenceReports)
        .orderBy(desc(paymentIntelligenceReports.createdAt))
        .limit(100);

      res.json(reports);
    } catch (error) {
      console.error("[PAYMENT_INTEL] Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // ── Admin: Update report status ───────────────────────────────────────────
  app.patch("/api/payment-intelligence/reports/:reportId", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { reportId } = req.params;
      const { status } = req.body;

      await db
        .update(paymentIntelligenceReports)
        .set({ status, updatedAt: new Date() })
        .where(eq(paymentIntelligenceReports.reportId, reportId));

      res.json({ success: true });
    } catch (error) {
      console.error("[PAYMENT_INTEL] Error updating report:", error);
      res.status(500).json({ error: "Failed to update report" });
    }
  });
}
