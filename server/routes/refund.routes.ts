import { Express } from "express";
import { db } from "../db";
import { refundRequests, users } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { getOpenAIClient } from "../aiService";
import { createRateLimit } from "../security";
import { sendEmail } from "../mailer";

const REFUND_POLICY_ENGINE_PROMPT = `ROLE: C.A.R.E.N. Refund Policy Engine

MISSION
You are the authority that determines whether a refund request is approved, denied, escalated, or partially approved based strictly on defined policy rules. You do not guess. You evaluate facts against rules only.

REFUND POLICY RULES

RULE 1 — TIME WINDOW
Standard refund window = 7 days from transaction date.
IF request is outside 7-day window → NOT ELIGIBLE (deny or escalate for exceptional cases)

RULE 2 — USAGE CHECK
IF service fully used → NOT eligible (unless system failure)
IF partially used → consider partial refund
IF unused → eligible

RULE 3 — VALID REASONS
Valid: duplicate_charge, accidental_purchase, technical_failure, billing_error, service_not_delivered
Invalid (generally): change_of_mind outside window, heavy usage followed by refund request

RULE 4 — DUPLICATE CHARGES
IF duplicate_charge detected → auto-approve full refund

RULE 5 — TECHNICAL FAILURE
IF confirmed technical failure → approve or escalate if unclear

RULE 6 — SUBSCRIPTION RULE
First billing cycle + unused → eligible
After usage → partial or deny depending on usage level

RULE 7 — REPEAT REFUND DETECTION
IF previous_refunds_count > 3 → flag HIGH RISK → escalate instead of auto-approve

RULE 8 — FRAUD / ABUSE FLAGS
IF account has abuse flags → DO NOT approve automatically → escalate for review

RULE 9 — AUTO APPROVAL THRESHOLD
IF amount ≤ $20 AND no abuse detected → allow auto-approval

RULE 10 — HIGH VALUE REQUESTS
IF amount > $100 → always escalate for human review

REQUIRED OUTPUT FORMAT (JSON only, no other text):
{
  "decision": "approved" | "denied" | "partial" | "escalated",
  "confidence_level": "high" | "medium" | "low",
  "decision_reason": "Clear explanation of why this decision was made",
  "policy_rules_applied": ["RULE 1", "RULE 4", ...],
  "refund_amount": 0.00,
  "escalation_required": true | false,
  "fraud_flag": false,
  "quality_score": 1-10,
  "action_log": "Step 1: Checked time window. Step 2: Verified usage. Step 3: Applied rules...",
  "quality_review": "Brief assessment of fairness, accuracy, and consistency"
}`;

const SUPPORT_REFUND_AGENT_PROMPT = `ROLE: C.A.R.E.N. Customer Support, Payments, and Refund Resolution Agent

MISSION
You handle customer support, complaints, billing issues, subscription issues, and refund requests for the C.A.R.E.N. platform. Your goal is to resolve issues quickly, professionally, and fairly while protecting both the customer experience and the financial integrity of the business.

You must be polite, calm, respectful, and solution-oriented at all times.

CORE RESPONSIBILITIES
• Answer support questions and handle complaints
• Resolve billing and subscription issues
• Evaluate refund requests following strict policy
• Prevent abuse or fraud
• Escalate financial or sensitive cases when required
• Log all financial-related interactions

PAYMENT & REFUND HANDLING RULES

You ARE allowed to:
• Explain billing charges and subscription terms
• Identify duplicate charges
• Guide users through payment issues
• Evaluate refund eligibility based on policy
• Recommend refund approval or denial

You are NOT allowed to:
• Issue refunds without authorization
• Override policy rules
• Make financial promises not backed by policy
• Guess or assume billing data

REFUND RESPONSE STYLE

APPROVAL: "Thanks for bringing this up. I've reviewed your request, and we can move forward with this refund. I'll guide you through the next step."
DENIAL: "I understand why you're asking for this, and I appreciate you explaining the situation. Based on the account details and policy, this charge isn't eligible for a refund, but I do want to help — here's what we can do instead."

NEVER: sound dismissive, blame the customer, deny without explanation.

ESCALATION RULES (PAYMENTS)
Escalate immediately if:
• High-dollar refund request (over $100)
• Multiple refund attempts from same user
• Suspected fraud or chargeback mentioned
• Legal threat or dispute
• Unclear billing records
• Customer demands supervisor

COMPLAINT + REFUND HANDLING FLOW
1. Acknowledge complaint and validate frustration
2. Investigate billing issue
3. Explain findings clearly
4. Offer resolution or next steps
5. Confirm outcome

FRAUD & ABUSE DETECTION
Flag if: repeated refund requests, inconsistent claims, excessive usage before refund, suspicious patterns
If detected → escalate immediately

CUSTOMER TRUST RULE
Always leave the customer feeling respected, heard, treated fairly, clear about what happened.

EXAMPLE RESPONSES:
REFUND REQUEST: "I understand why you're asking for that, and I appreciate you explaining the situation. Let me check the details so I can give you the most accurate answer."
BILLING ISSUE: "Thanks for reaching out — let's take a look at this together so we can clear it up."
FRUSTRATED CUSTOMER: "I hear you, and I understand why that would be frustrating. Let's work through this and get it handled properly."
ESCALATION: "I want to make sure this is handled correctly, so I'm escalating this for a deeper review. I'll make sure everything is clearly documented for you."

C.A.R.E.N. PLATFORM KNOWLEDGE
C.A.R.E.N. subscription plans: Legal Shield ($9.99/mo), Constitutional Pro ($19.99/mo), Family Protection ($29.99/mo), Enterprise Fleet ($49.99/mo).
Refund window is 7 days from purchase.

LEGAL BOUNDARY
You are not a lawyer. Do not provide legal advice. Do not make guarantees.

SAFETY RULES
If a user mentions danger or emergency: prioritize safety above all.

ESCALATION — When needed, output JSON at END of response:
{"escalate":true,"reason":"<brief reason>","category":"billing_dispute|refund_request|fraud_concern|general_complaint","severity":<1-4>}

For normal responses do NOT include JSON. Keep responses warm, plain text, 3-5 sentences unless step-by-step is needed.`;

function generateRefundId(): string {
  return `REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

async function runPolicyEngine(data: {
  userId?: string;
  userEmail?: string;
  transactionId?: string;
  productPurchased?: string;
  transactionDate?: Date;
  amountPaid: number;
  usageStatus: string;
  refundReason: string;
  previousRefundsCount: number;
  accountFlags?: string;
}): Promise<{
  decision: string;
  confidenceLevel: string;
  decisionReason: string;
  policyRulesApplied: string;
  refundAmount: number;
  escalationRequired: boolean;
  fraudFlag: boolean;
  qualityScore: number;
  actionLog: string;
}> {
  const daysSinceTransaction = data.transactionDate
    ? Math.floor((Date.now() - new Date(data.transactionDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const prompt = `Evaluate this refund request using the policy rules:

USER_ID: ${data.userId || "unknown"}
USER_EMAIL: ${data.userEmail || "unknown"}
TRANSACTION_ID: ${data.transactionId || "unknown"}
PRODUCT_PURCHASED: ${data.productPurchased || "unknown"}
TRANSACTION_DATE: ${data.transactionDate ? new Date(data.transactionDate).toISOString() : "unknown"}
DAYS_SINCE_TRANSACTION: ${daysSinceTransaction !== null ? daysSinceTransaction : "unknown"}
AMOUNT_PAID: $${data.amountPaid}
USAGE_STATUS: ${data.usageStatus}
REFUND_REASON: ${data.refundReason}
PREVIOUS_REFUNDS_COUNT: ${data.previousRefundsCount}
ACCOUNT_FLAGS: ${data.accountFlags || "none"}

Apply all applicable policy rules and return the JSON decision format.`;

  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: REFUND_POLICY_ENGINE_PROMPT },
      { role: "user", content: prompt },
    ],
    max_tokens: 800,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const result = JSON.parse(raw);

  return {
    decision: result.decision || "escalated",
    confidenceLevel: result.confidence_level || "low",
    decisionReason: result.decision_reason || "Unable to determine",
    policyRulesApplied: Array.isArray(result.policy_rules_applied)
      ? result.policy_rules_applied.join(", ")
      : result.policy_rules_applied || "",
    refundAmount: result.refund_amount || 0,
    escalationRequired: result.escalation_required || false,
    fraudFlag: result.fraud_flag || false,
    qualityScore: result.quality_score || 5,
    actionLog: result.action_log || "",
  };
}

async function sendRefundEscalationEmail(data: {
  refundId: string;
  userEmail?: string;
  userName?: string;
  amountPaid: number;
  decision: string;
  decisionReason: string;
  refundReason: string;
  fraudFlag: boolean;
}): Promise<void> {
  const urgencyLabel = data.fraudFlag ? "🚨 FRAUD FLAG" : data.amountPaid > 100 ? "⚠️ HIGH VALUE" : "📋 Review Required";

  await sendEmail({
    to: "info@carenalert.com",
    subject: `[REFUND ESCALATION] ${urgencyLabel} — ${data.refundId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; background:#0f172a; color:#e2e8f0; padding:24px; border-radius:12px;">
        <div style="background:linear-gradient(135deg,#dc2626,#7c3aed); padding:16px 24px; border-radius:8px; margin-bottom:24px;">
          <h1 style="margin:0; font-size:20px; color:white;">💰 C.A.R.E.N. Refund Escalation</h1>
          <p style="margin:4px 0 0; color:#fca5a5; font-size:14px;">Refund ID: ${data.refundId}</p>
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
          <tr><td style="padding:8px 0; color:#94a3b8; width:160px;">Amount:</td><td style="color:#fbbf24; font-weight:bold; font-size:18px;">$${data.amountPaid}</td></tr>
          <tr><td style="padding:8px 0; color:#94a3b8;">Decision:</td><td style="color:#e2e8f0;">${data.decision.toUpperCase()}</td></tr>
          <tr><td style="padding:8px 0; color:#94a3b8;">User Email:</td><td style="color:#e2e8f0;">${data.userEmail || "Not provided"}</td></tr>
          <tr><td style="padding:8px 0; color:#94a3b8;">User Name:</td><td style="color:#e2e8f0;">${data.userName || "Unknown"}</td></tr>
          <tr><td style="padding:8px 0; color:#94a3b8;">Refund Reason:</td><td style="color:#e2e8f0;">${data.refundReason}</td></tr>
          <tr><td style="padding:8px 0; color:#94a3b8;">Fraud Flag:</td><td style="color:${data.fraudFlag ? "#f87171" : "#4ade80"};">${data.fraudFlag ? "YES — REVIEW IMMEDIATELY" : "No"}</td></tr>
        </table>
        <div style="background:#1e293b; border:1px solid #334155; border-radius:8px; padding:16px;">
          <h3 style="margin:0 0 8px; color:#a78bfa; font-size:14px; text-transform:uppercase;">Decision Reason</h3>
          <p style="margin:0; color:#e2e8f0;">${data.decisionReason}</p>
        </div>
        <p style="margin-top:24px; font-size:12px; color:#475569; text-align:center;">C.A.R.E.N.™ ALERT — Refund Policy Engine</p>
      </div>
    `,
    text: `CAREN Refund Escalation\nRefund ID: ${data.refundId}\nAmount: $${data.amountPaid}\nDecision: ${data.decision}\nUser: ${data.userEmail}\nReason: ${data.decisionReason}`,
  });
}

export function registerRefundRoutes(app: Express) {
  const refundRateLimit = createRateLimit(60 * 60 * 1000, 5, "Refund request limit reached. Please try again in an hour.");

  // ── Submit Refund Request (runs Policy Engine) ────────────────────────────
  app.post("/api/refunds/request", refundRateLimit, async (req, res) => {
    const startTime = new Date();
    try {
      const {
        transactionId,
        productPurchased,
        transactionDate,
        amountPaid,
        usageStatus = "unknown",
        refundReason,
        userEmail,
        userName,
        accountFlags,
      } = req.body;

      if (!amountPaid || !refundReason) {
        return res.status(400).json({ error: "Amount and reason are required" });
      }

      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;

      // Count previous refunds for this user
      let previousRefundsCount = 0;
      if (userId) {
        const existing = await db
          .select()
          .from(refundRequests)
          .where(eq(refundRequests.userId, userId));
        previousRefundsCount = existing.length;
      }

      // Run the Policy Engine
      const engineResult = await runPolicyEngine({
        userId,
        userEmail,
        transactionId,
        productPurchased,
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        amountPaid: parseFloat(amountPaid),
        usageStatus,
        refundReason,
        previousRefundsCount,
        accountFlags,
      });

      const endTime = new Date();
      const refundId = generateRefundId();

      // Save to DB
      await db.insert(refundRequests).values({
        refundId,
        userId: userId || null,
        userEmail: userEmail || null,
        userName: userName || null,
        transactionId: transactionId || null,
        productPurchased: productPurchased || null,
        transactionDate: transactionDate ? new Date(transactionDate) : null,
        amountPaid: amountPaid.toString(),
        usageStatus,
        refundReason,
        previousRefundsCount,
        accountFlags: accountFlags || null,
        decision: engineResult.decision,
        decisionReason: engineResult.decisionReason,
        confidenceLevel: engineResult.confidenceLevel,
        policyRulesApplied: engineResult.policyRulesApplied,
        refundAmount: engineResult.refundAmount.toString(),
        escalationRequired: engineResult.escalationRequired,
        actionLog: engineResult.actionLog,
        qualityScore: engineResult.qualityScore,
        executionStartTime: startTime,
        executionEndTime: endTime,
        status: engineResult.escalationRequired ? "pending" : engineResult.decision === "approved" ? "reviewed" : "pending",
      });

      // Email team if escalation required or fraud flagged
      if (engineResult.escalationRequired || engineResult.fraudFlag) {
        await sendRefundEscalationEmail({
          refundId,
          userEmail,
          userName,
          amountPaid: parseFloat(amountPaid),
          decision: engineResult.decision,
          decisionReason: engineResult.decisionReason,
          refundReason,
          fraudFlag: engineResult.fraudFlag,
        }).catch(console.error);
      }

      res.json({
        refundId,
        decision: engineResult.decision,
        decisionReason: engineResult.decisionReason,
        confidenceLevel: engineResult.confidenceLevel,
        refundAmount: engineResult.refundAmount,
        escalationRequired: engineResult.escalationRequired,
        message:
          engineResult.decision === "approved"
            ? "Your refund has been approved. Our team will process it within 3-5 business days."
            : engineResult.decision === "escalated"
            ? "Your request has been flagged for human review. Our team will contact you within 1 business day."
            : engineResult.decision === "partial"
            ? "A partial refund has been recommended and is under review."
            : "Your refund request has been reviewed. Please see the details below.",
      });
    } catch (error: any) {
      console.error("[REFUND] Policy engine error:", error.message);
      res.status(500).json({ error: "Refund evaluation failed. Please contact support." });
    }
  });

  // ── Admin: List all refund requests ──────────────────────────────────────
  app.get("/api/refunds", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const refunds = await db
        .select()
        .from(refundRequests)
        .orderBy(desc(refundRequests.createdAt))
        .limit(200);

      res.json(refunds);
    } catch (error) {
      console.error("[REFUND] Error fetching refunds:", error);
      res.status(500).json({ error: "Failed to fetch refund requests" });
    }
  });

  // ── Admin: Update refund status / add notes ───────────────────────────────
  app.patch("/api/refunds/:refundId", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { refundId } = req.params;
      const { status, decision, adminNotes } = req.body;

      await db
        .update(refundRequests)
        .set({
          ...(status && { status }),
          ...(decision && { decision }),
          ...(adminNotes !== undefined && { adminNotes }),
          updatedAt: new Date(),
        })
        .where(eq(refundRequests.refundId, refundId));

      res.json({ success: true });
    } catch (error) {
      console.error("[REFUND] Error updating refund:", error);
      res.status(500).json({ error: "Failed to update refund" });
    }
  });

  // ── Public: Refund chat assistant (embedded in support widget) ─────────────
  app.post("/api/refunds/chat", createRateLimit(15 * 60 * 1000, 20, "Rate limit reached."), async (req, res) => {
    try {
      const { message, history = [], userEmail, userName } = req.body;

      if (!message?.trim()) return res.status(400).json({ error: "Message required" });

      const messages: any[] = [
        { role: "system", content: SUPPORT_REFUND_AGENT_PROMPT },
        ...history.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ];

      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 600,
        temperature: 0.7,
      });

      const rawReply = completion.choices[0]?.message?.content || "I'm sorry, please try again.";

      let reply = rawReply;
      let escalationData: any = null;
      const jsonMatch = rawReply.match(/\{[\s\S]*"escalate"[\s\S]*\}$/);
      if (jsonMatch) {
        try {
          escalationData = JSON.parse(jsonMatch[0]);
          reply = rawReply.replace(jsonMatch[0], "").trim();
        } catch { /* ignore */ }
      }

      res.json({ reply, escalated: !!escalationData?.escalate });
    } catch (error: any) {
      console.error("[REFUND_CHAT] Error:", error.message);
      res.status(500).json({ reply: "I'm having trouble right now. Please email support@carenalert.com." });
    }
  });
}
