import { Express } from "express";
import { db } from "../db";
import { supportTickets } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmail } from "../mailer";
import { getOpenAIClient } from "../aiService";
import { createRateLimit } from "../security";

const SUPPORT_SYSTEM_PROMPT = `ROLE: C.A.R.E.N. Customer Support and Complaint Resolution Agent

MISSION
You are the frontline customer support and complaint resolution agent for C.A.R.E.N. (Citizen Assistance for Roadside Emergencies and Navigation).

Your mission is to provide fast, respectful, helpful, calm, and solution-focused support to users while protecting the C.A.R.E.N. brand and improving customer trust.

You must handle as much of the support experience as possible, while knowing when to escalate issues that require human review, backend access, legal sensitivity, emergency judgment, or executive attention.

PRIMARY GOALS
1. Resolve user issues quickly and politely
2. Reduce customer frustration
3. Protect the reputation of C.A.R.E.N.
4. Improve customer confidence and trust
5. Escalate serious or sensitive issues correctly
6. Record useful support insights for future improvement

PERSONALITY AND TONE
Always be: very polite, calm, kind, respectful, reassuring, patient, clear, professional, solution-oriented.
Never be: rude, defensive, dismissive, argumentative, robotic, cold, sarcastic, blaming.

COMMUNICATION STYLE
- Greet warmly and acknowledge the concern
- Explain things clearly without technical jargon
- Stay calm even if the user is upset
- Make the user feel heard
- Confirm the next step or resolution

C.A.R.E.N. PLATFORM KNOWLEDGE
C.A.R.E.N. is a family protection platform with:
- GPS-enabled legal rights by state (all 50 states + DC)
- Recording system for police encounters and incidents
- Emergency SOS with contact notification
- Voice-activated emergency commands
- AI legal assistant and attorney matching
- Subscription plans: Basic Guard ($1/mo), Safety Pro ($9.99/mo), Constitutional Pro ($19.99/mo), Family Protection ($29.99/mo), Enterprise Fleet ($49.99/mo)
- Available on web browser, iOS, and Android

ISSUE TYPES TO HANDLE
- Login problems and account questions
- Feature navigation help
- Recording questions
- Subscription and billing questions
- App performance complaints
- General confusion or frustration
- Onboarding help
- Complaints about app behavior

COMPLAINT HANDLING RULES
1. Acknowledge the complaint clearly
2. Validate frustration without admitting fault unless verified
3. Stay calm and polite
4. Identify the real issue
5. Offer the clearest available solution
6. If unresolvable, explain the next step honestly
7. End by showing the customer they were heard

NEVER: argue with the customer, blame the customer, make legal admissions, promise what you cannot deliver.

SAFETY RULES
If a user mentions a traffic stop, police contact, danger, or immediate emergency:
- Prioritize safety above all
- Encourage compliance with lawful instructions
- Suggest using C.A.R.E.N. features only if safe to do so
- Encourage contacting emergency services where appropriate
- Example: "Your safety comes first. Stay calm, follow lawful instructions, and only use the app if it is safe to do so."

LEGAL BOUNDARY
You are not a lawyer. Do not provide legal advice beyond general information. Do not make guarantees about legal outcomes.

ESCALATION — When the user asks to speak to a human, or mentions legal action, threats, serious harm, or the issue cannot be resolved, tell them clearly:
"I'm going to flag this for our support team to follow up with you directly. Can you share your email address so we can reach you?"
Then output a JSON block at the END of your response (hidden from the user) in this exact format:
{"escalate":true,"reason":"<brief reason>","category":"<category>","severity":<1-4>}

For all normal responses do NOT include any JSON. Keep responses conversational, warm, and helpful. Do not use markdown formatting — respond in plain text only. Keep answers concise (3-5 sentences typically) unless step-by-step instructions are needed.`;

function generateTicketId(): string {
  return `CAREN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

async function sendEscalationEmail(ticket: {
  ticketId: string;
  userEmail?: string;
  userName?: string;
  category?: string;
  severity?: number;
  reason: string;
  summary: string;
}): Promise<boolean> {
  const severityLabel = ["", "Level 1 – Minor", "Level 2 – Repeated Frustration", "Level 3 – Serious", "Level 4 – URGENT"][ticket.severity || 1];

  return sendEmail({
    to: "info@carenalert.com",
    subject: `[ESCALATION] ${severityLabel} — Ticket ${ticket.ticketId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 24px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 16px 24px; border-radius: 8px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 20px; color: white;">⚠️ C.A.R.E.N. Support Escalation</h1>
          <p style="margin: 4px 0 0; color: #c4b5fd; font-size: 14px;">Ticket ${ticket.ticketId}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 8px 0; color: #94a3b8; width: 140px;">Severity:</td><td style="padding: 8px 0; color: #f87171; font-weight: bold;">${severityLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8;">Category:</td><td style="padding: 8px 0; color: #e2e8f0;">${ticket.category || "Unknown"}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8;">User Email:</td><td style="padding: 8px 0; color: #e2e8f0;">${ticket.userEmail || "Not provided"}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8;">User Name:</td><td style="padding: 8px 0; color: #e2e8f0;">${ticket.userName || "Unknown"}</td></tr>
        </table>

        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px; color: #a78bfa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Escalation Reason</h3>
          <p style="margin: 0; color: #e2e8f0;">${ticket.reason}</p>
        </div>

        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px;">
          <h3 style="margin: 0 0 8px; color: #a78bfa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Conversation Summary</h3>
          <p style="margin: 0; color: #e2e8f0; white-space: pre-wrap;">${ticket.summary}</p>
        </div>

        <p style="margin-top: 24px; font-size: 12px; color: #475569; text-align: center;">C.A.R.E.N.™ ALERT — Support System</p>
      </div>
    `,
    text: `CAREN Support Escalation\nTicket: ${ticket.ticketId}\nSeverity: ${severityLabel}\nCategory: ${ticket.category}\nUser: ${ticket.userEmail || "Unknown"}\nReason: ${ticket.reason}\nSummary: ${ticket.summary}`,
  });
}

export function registerSupportRoutes(app: Express) {
  const supportChatRateLimit = createRateLimit(15 * 60 * 1000, 30, "Support chat limit reached. Please try again shortly.");

  // ── AI Support Chat ──────────────────────────────────────────────────────────
  app.post("/api/support/chat", supportChatRateLimit, async (req, res) => {
    try {
      const { message, history = [], sessionId, userEmail, userName } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: SUPPORT_SYSTEM_PROMPT },
        ...history.slice(-12).map((m: { role: string; content: string }) => ({
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

      const rawReply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";

      // Parse escalation JSON if present at end of reply
      let reply = rawReply;
      let escalationData: { escalate: boolean; reason: string; category: string; severity: number } | null = null;

      const jsonMatch = rawReply.match(/\{[\s\S]*"escalate"[\s\S]*\}$/);
      if (jsonMatch) {
        try {
          escalationData = JSON.parse(jsonMatch[0]);
          reply = rawReply.replace(jsonMatch[0], "").trim();
        } catch {
          // ignore parse errors
        }
      }

      // If escalation triggered, save ticket and email support team
      if (escalationData?.escalate) {
        const ticketId = generateTicketId();
        const fullHistory = [...history, { role: "user", content: message }, { role: "assistant", content: reply }];
        const conversationSummary = fullHistory
          .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Agent"}: ${m.content}`)
          .join("\n\n");

        try {
          await db.insert(supportTickets).values({
            ticketId,
            userId: (req.session as any)?.userId || null,
            userEmail: userEmail || null,
            userName: userName || null,
            issueCategory: escalationData.category,
            severityLevel: escalationData.severity,
            conversationSummary,
            status: "escalated",
            escalated: true,
            escalationReason: escalationData.reason,
            emailSent: false,
          });

          const emailSent = await sendEscalationEmail({
            ticketId,
            userEmail,
            userName,
            category: escalationData.category,
            severity: escalationData.severity,
            reason: escalationData.reason,
            summary: conversationSummary,
          });

          // Update emailSent flag
          if (emailSent) {
            await db.update(supportTickets).set({ emailSent: true }).where(eq(supportTickets.ticketId, ticketId));
          }

          console.log(`[SUPPORT] Escalation ticket created: ${ticketId} — ${escalationData.category} (severity ${escalationData.severity})`);
        } catch (dbError) {
          console.error("[SUPPORT] Failed to save escalation ticket:", dbError);
        }
      }

      res.json({ reply, escalated: !!escalationData?.escalate });
    } catch (error: any) {
      console.error("[SUPPORT_CHAT] Error:", error.message);
      res.status(500).json({
        reply: "I'm having trouble right now. Please try again in a moment, or email us directly at support@carenalert.com.",
      });
    }
  });

  // ── Save resolved ticket ─────────────────────────────────────────────────────
  app.post("/api/support/tickets/resolved", async (req, res) => {
    try {
      const { userEmail, userName, summary, category, qualityScore } = req.body;
      const ticketId = generateTicketId();

      await db.insert(supportTickets).values({
        ticketId,
        userId: (req.session as any)?.userId || null,
        userEmail: userEmail || null,
        userName: userName || null,
        issueCategory: category || "general_question",
        severityLevel: 1,
        conversationSummary: summary,
        status: "resolved",
        escalated: false,
        qualityScore: qualityScore || null,
      });

      res.json({ success: true, ticketId });
    } catch (error) {
      console.error("[SUPPORT] Error saving resolved ticket:", error);
      res.status(500).json({ success: false });
    }
  });

  // ── Admin: list all tickets ──────────────────────────────────────────────────
  app.get("/api/support/tickets", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Simple admin check — could be enhanced with proper role check
      const tickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(200);

      res.json(tickets);
    } catch (error) {
      console.error("[SUPPORT] Error fetching tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  // ── Admin: update ticket status ──────────────────────────────────────────────
  app.patch("/api/support/tickets/:ticketId/status", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { ticketId } = req.params;
      const { status } = req.body;

      await db
        .update(supportTickets)
        .set({ status, updatedAt: new Date() })
        .where(eq(supportTickets.ticketId, ticketId));

      res.json({ success: true });
    } catch (error) {
      console.error("[SUPPORT] Error updating ticket:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });
}
