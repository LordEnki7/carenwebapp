import { sendEmail } from './mailer';

export interface DripEmailParams {
  email: string;
  contactName?: string;
  firmName: string;
  state: string;
  city?: string;
}

const APPLY_URL = 'https://carenalert.com/attorney-apply';
const CAREN_EMAIL = 'info@carenalert.com';
const CAREN_NAME = 'C.A.R.E.N™ Alert Legal Access Network';

function brandedLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0f1a; font-family: 'Helvetica Neue', Arial, sans-serif; color: #cbd5e1; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0e7490 0%, #0f172a 100%); padding: 32px 32px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #00e5ff; letter-spacing: 1px; }
    .header p { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
    .body { padding: 32px; }
    .body h2 { font-size: 18px; color: #f1f5f9; margin-top: 0; }
    .body p { font-size: 14px; line-height: 1.7; color: #94a3b8; margin: 0 0 16px; }
    .body ul { padding-left: 20px; margin: 0 0 20px; }
    .body ul li { font-size: 14px; line-height: 1.7; color: #94a3b8; margin-bottom: 6px; }
    .body ul li strong { color: #e2e8f0; }
    .cta { text-align: center; margin: 28px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #0e7490, #7c3aed); color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; letter-spacing: 0.5px; }
    .divider { border: none; border-top: 1px solid #1e293b; margin: 24px 0; }
    .footer { text-align: center; padding: 20px 32px; }
    .footer p { font-size: 11px; color: #475569; margin: 4px 0; }
    .footer a { color: #0e7490; text-decoration: none; }
    .badge { display: inline-block; background: #0c4a6e20; border: 1px solid #0e749040; color: #38bdf8; font-size: 11px; padding: 4px 10px; border-radius: 20px; margin: 4px 3px; }
    .highlight-box { background: #0c4a6e15; border: 1px solid #0e749030; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .highlight-box p { margin: 0; color: #7dd3fc; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>C.A.R.E.N™ Alert</h1>
        <p>Legal Access Network — CLAN</p>
      </div>
      <div class="body">
        ${body}
      </div>
      <hr class="divider" />
      <div class="footer">
        <p>C.A.R.E.N™ Alert (Citizen Assistance for Roadside Emergencies and Navigation)</p>
        <p><a href="https://carenalert.com">carenalert.com</a> &nbsp;|&nbsp; <a href="mailto:${CAREN_EMAIL}">${CAREN_EMAIL}</a></p>
        <p style="margin-top:12px;color:#334155;">To opt out of these emails, reply with "unsubscribe" in the subject line.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email 1: Initial outreach ───────────────────────────────────────────────
function email1({ contactName, firmName, state }: DripEmailParams): { subject: string; html: string; text: string } {
  const name = contactName || `${firmName} Team`;
  const subject = `Join the C.A.R.E.N™ Alert Legal Access Network — Attorneys in ${state} Needed`;
  const html = brandedLayout(subject, `
    <h2>Hello ${name},</h2>
    <p>My name is Shawn Williams, founder of <strong>C.A.R.E.N™ Alert</strong> — a GPS-powered legal protection platform that helps everyday citizens understand and exercise their rights during traffic stops and police encounters.</p>
    <p>We are actively building the <strong>C.A.R.E.N™ Alert Legal Access Network (CLAN)</strong> — a curated directory of verified attorneys across the country — and I believe <strong>${firmName}</strong> would be an excellent fit.</p>
    <p><strong>What CLAN membership means for your firm:</strong></p>
    <ul>
      <li><strong>Verified directory listing</strong> visible to thousands of C.A.R.E.N™ Alert users in ${state}</li>
      <li><strong>AI-powered client matching</strong> — clients with active incidents are matched to attorneys by practice area, state, and urgency</li>
      <li><strong>No referral fees. No revenue sharing.</strong> Your listing is directory-only — any engagement goes directly to you</li>
      <li><strong>Emergency availability badge</strong> for attorneys who opt into urgent cases</li>
      <li><strong>Early-access status</strong> as a founding member of the network</li>
    </ul>
    <div class="highlight-box">
      <p>🛡️ C.A.R.E.N™ Alert serves users in all 50 states with 467+ legal protections. Our users are actively seeking legal help at the moment they need it most.</p>
    </div>
    <p>Joining takes less than 10 minutes. Click below to apply — no commitment required, and your listing can be updated anytime from your attorney portal.</p>
    <div class="cta">
      <a href="${APPLY_URL}">Apply to Join CLAN →</a>
    </div>
    <p>If you have any questions or would prefer to connect by phone, please reply to this email and I will personally reach out.</p>
    <p>Thank you for your time,<br/><strong>Shawn Williams</strong><br/>Founder, C.A.R.E.N™ Alert<br/><a href="mailto:${CAREN_EMAIL}" style="color:#38bdf8;">${CAREN_EMAIL}</a></p>
  `);
  const text = `Hello ${name},\n\nI'm reaching out to invite ${firmName} to join the C.A.R.E.N™ Alert Legal Access Network (CLAN).\n\nC.A.R.E.N™ Alert is a GPS-powered legal protection platform. CLAN is our curated attorney directory — no referral fees, no revenue sharing. Just a verified listing visible to thousands of users in ${state}.\n\nApply here: ${APPLY_URL}\n\nThank you,\nShawn Williams\nFounder, C.A.R.E.N™ Alert`;
  return { subject, html, text };
}

// ─── Email 2: Follow-up ───────────────────────────────────────────────────────
function email2({ contactName, firmName, state }: DripEmailParams): { subject: string; html: string; text: string } {
  const name = contactName || `${firmName} Team`;
  const subject = `Following up — Your spot in the C.A.R.E.N™ Alert network (${state})`;
  const html = brandedLayout(subject, `
    <h2>Hi ${name},</h2>
    <p>I wanted to follow up on my previous message about joining the <strong>C.A.R.E.N™ Alert Legal Access Network</strong>. I know inboxes get busy, so I'm keeping this brief.</p>
    <p>Here are the three things attorneys tell us matter most about CLAN:</p>
    <ul>
      <li>📍 <strong>Zero cost to join.</strong> Your listing is free. We never take a cut of any case, referral, or retainer.</li>
      <li>⚡ <strong>Warm, motivated leads.</strong> Clients contact attorneys through C.A.R.E.N™ Alert while an incident is happening or immediately after — they're ready to engage.</li>
      <li>🏆 <strong>Practice area targeting.</strong> Our AI matches clients to attorneys by state and specialty — so you only receive relevant inquiries.</li>
    </ul>
    <p>We currently have limited verified spots per state, and ${state} is an active market for us. I'd love to have <strong>${firmName}</strong> represented.</p>
    <div class="cta">
      <a href="${APPLY_URL}">Apply Now — Takes ~10 Minutes →</a>
    </div>
    <p>If this isn't the right fit, no worries at all — just reply and I'll update our records. Otherwise, I look forward to welcoming you to the network.</p>
    <p>Best,<br/><strong>Shawn Williams</strong><br/>Founder, C.A.R.E.N™ Alert</p>
  `);
  const text = `Hi ${name},\n\nFollowing up on the C.A.R.E.N™ Alert Legal Access Network invitation for ${firmName}.\n\nKey benefits: zero cost, no referral fees, warm leads in ${state}, practice area matching.\n\nApply here: ${APPLY_URL}\n\nBest,\nShawn Williams`;
  return { subject, html, text };
}

// ─── Email 3: Value proof / how matching works ────────────────────────────────
function email3({ contactName, firmName, state }: DripEmailParams): { subject: string; html: string; text: string } {
  const name = contactName || `${firmName} Team`;
  const subject = `How C.A.R.E.N™ Alert connects clients to attorneys in ${state}`;
  const html = brandedLayout(subject, `
    <h2>Hi ${name},</h2>
    <p>I want to give you a clearer picture of how clients actually find attorneys through C.A.R.E.N™ Alert — because the matching system is what makes this different from a typical directory.</p>
    <p><strong>Here's what happens when a C.A.R.E.N™ Alert user needs legal help:</strong></p>
    <ul>
      <li>The app detects the user's GPS location and identifies which state's laws apply</li>
      <li>The user describes their situation (traffic stop, search and seizure, civil rights, etc.)</li>
      <li>Our AI scores available attorneys on <strong>state licensure, practice area, availability, and language</strong></li>
      <li>The top-matched attorneys are presented — the client connects directly</li>
    </ul>
    <div class="highlight-box">
      <p>💼 Most C.A.R.E.N™ Alert users are seeking help with traffic-related matters, civil rights questions, or general criminal defense. Attorneys licensed in ${state} with those specialties consistently rank highest in matches.</p>
    </div>
    <p>Once you're in the network, you control your profile — availability, practice areas, languages spoken, and whether you accept emergency cases. There's no obligation to respond to every inquiry.</p>
    <p>If ${firmName} handles any of the following, CLAN is built for you:</p>
    <div style="text-align:center;margin:16px 0;">
      <span class="badge">Traffic Defense</span>
      <span class="badge">Civil Rights</span>
      <span class="badge">Criminal Defense</span>
      <span class="badge">DUI/DWI</span>
      <span class="badge">Police Misconduct</span>
      <span class="badge">Search & Seizure</span>
    </div>
    <div class="cta">
      <a href="${APPLY_URL}">Join the Network →</a>
    </div>
    <p>Happy to answer any questions by email or phone — just reply here.</p>
    <p>Warm regards,<br/><strong>Shawn Williams</strong><br/>Founder, C.A.R.E.N™ Alert</p>
  `);
  const text = `Hi ${name},\n\nHere's how C.A.R.E.N™ Alert client matching works: GPS-based location detection → case type description → AI matches attorneys by state, specialty, and availability.\n\nIf ${firmName} handles traffic defense, civil rights, or criminal defense in ${state}, you're a great fit.\n\nApply: ${APPLY_URL}\n\nShawn Williams`;
  return { subject, html, text };
}

// ─── Email 4: Urgency / limited spots ─────────────────────────────────────────
function email4({ contactName, firmName, state }: DripEmailParams): { subject: string; html: string; text: string } {
  const name = contactName || `${firmName} Team`;
  const subject = `Limited verified spots left in ${state} — C.A.R.E.N™ Alert CLAN`;
  const html = brandedLayout(subject, `
    <h2>Hi ${name},</h2>
    <p>I've reached out a few times about the <strong>C.A.R.E.N™ Alert Legal Access Network</strong>, and I want to be transparent: we are approaching capacity for verified attorney slots in <strong>${state}</strong>.</p>
    <p>We deliberately limit the number of verified attorneys per state to ensure that each firm receives meaningful visibility — not just a listing buried in an oversaturated directory. Once we hit the cap, we move to a waitlist.</p>
    <p><strong>What you get as a verified CLAN member:</strong></p>
    <ul>
      <li>✅ "Verified by C.A.R.E.N™ Alert" badge on your profile</li>
      <li>✅ Priority placement in client matching results</li>
      <li>✅ Dedicated attorney portal to manage your profile, availability, and incoming connections</li>
      <li>✅ Access to C.A.R.E.N™ Alert's growing base of subscribers — users who are actively engaged with their legal rights</li>
    </ul>
    <p>If now isn't the right time for <strong>${firmName}</strong>, I completely understand. But if there's any interest, I'd encourage applying before the ${state} cohort closes.</p>
    <div class="cta">
      <a href="${APPLY_URL}">Secure Your Spot →</a>
    </div>
    <p>Thank you for your consideration,<br/><strong>Shawn Williams</strong><br/>Founder, C.A.R.E.N™ Alert<br/><a href="mailto:${CAREN_EMAIL}" style="color:#38bdf8;">${CAREN_EMAIL}</a></p>
  `);
  const text = `Hi ${name},\n\nWe're approaching our verified attorney cap in ${state}. Once full, we move to a waitlist. Apply now to secure your spot.\n\n${APPLY_URL}\n\nShawn Williams, C.A.R.E.N™ Alert`;
  return { subject, html, text };
}

// ─── Email 5: Final / closing the file ────────────────────────────────────────
function email5({ contactName, firmName, state }: DripEmailParams): { subject: string; html: string; text: string } {
  const name = contactName || `${firmName} Team`;
  const subject = `Closing your file — C.A.R.E.N™ Alert CLAN (${firmName})`;
  const html = brandedLayout(subject, `
    <h2>Hi ${name},</h2>
    <p>I don't want to keep filling your inbox, so this will be my last message about the C.A.R.E.N™ Alert Legal Access Network — for now.</p>
    <p>I completely respect that the timing may not be right for <strong>${firmName}</strong>, and I appreciate you considering it at all.</p>
    <div class="highlight-box">
      <p>📌 The door is always open. If circumstances change, you can apply at any time at <a href="${APPLY_URL}" style="color:#38bdf8;">${APPLY_URL}</a>. Your application will be prioritized.</p>
    </div>
    <p>A few things that may be worth knowing as the platform grows:</p>
    <ul>
      <li>We are on track to expand C.A.R.E.N™ Alert to iOS, Android, and desktop — giving attorneys in the network exposure across all platforms</li>
      <li>Attorneys who join in the early stages of each state cohort tend to receive the highest visibility in matching results as the user base scales</li>
      <li>We are adding new features to the attorney portal — including secure messaging, document sharing, and availability scheduling</li>
    </ul>
    <p>If you'd ever like to reconnect, reply to any of my emails and I'll pick up the conversation from here. Wishing ${firmName} continued success.</p>
    <p>With respect,<br/><strong>Shawn Williams</strong><br/>Founder, C.A.R.E.N™ Alert<br/><a href="https://carenalert.com" style="color:#38bdf8;">carenalert.com</a></p>
  `);
  const text = `Hi ${name},\n\nThis is my last message about CLAN for now. The application is always open at ${APPLY_URL} whenever the timing is right for ${firmName}.\n\nWishing you success,\nShawn Williams, C.A.R.E.N™ Alert`;
  return { subject, html, text };
}

// ─── Main dispatch function ────────────────────────────────────────────────────
const DRIP_EMAILS = [email1, email2, email3, email4, email5];

export async function sendNextDripEmail(
  params: DripEmailParams,
  currentStep: number
): Promise<{ sent: boolean; nextStep: number; subject: string }> {
  if (currentStep >= DRIP_EMAILS.length) {
    return { sent: false, nextStep: currentStep, subject: '' };
  }

  if (!params.email) {
    throw new Error('No email address on this lead');
  }

  const stepFn = DRIP_EMAILS[currentStep];
  const { subject, html, text } = stepFn(params);

  const sent = await sendEmail({
    to: params.email,
    from: CAREN_EMAIL,
    fromName: CAREN_NAME,
    subject,
    html,
    text,
  });

  if (!sent) {
    throw new Error('Email delivery failed — check MAILTRAP_TOKEN');
  }

  return { sent: true, nextStep: currentStep + 1, subject };
}

export const DRIP_SEQUENCE_LENGTH = DRIP_EMAILS.length;
