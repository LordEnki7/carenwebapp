import { db } from './db';
import { sql } from 'drizzle-orm';

export interface HealthResult {
  service: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  latencyMs?: number;
  detail?: string;
}

// ── individual checks ─────────────────────────────────────────────────────────

async function checkDatabase(): Promise<HealthResult> {
  const t = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { service: 'Database (PostgreSQL)', status: 'ok', message: 'Connected', latencyMs: Date.now() - t };
  } catch (e: any) {
    return { service: 'Database (PostgreSQL)', status: 'error', message: 'Connection failed', detail: e.message };
  }
}

async function checkSMS(): Promise<HealthResult> {
  const key = process.env.TEXTBELT_API_KEY || '160040e53102b2285931df3013d933b0e46ebf7cqeCXDWl6beXnP8pfl4LFyke6F';
  const t = Date.now();
  try {
    const res = await fetch(`https://textbelt.com/quota/${key}`, { signal: AbortSignal.timeout(8000) });
    const raw = await res.text();
    let data: any = {};
    try { data = JSON.parse(raw); } catch { return { service: 'SMS (TextBelt)', status: 'error', message: 'Invalid API key — TextBelt returned non-JSON', detail: raw.slice(0, 80) }; }
    if (!data.success) return { service: 'SMS (TextBelt)', status: 'error', message: `API key rejected: ${data.error || 'unknown'}` };
    const quota = data.quotaRemaining ?? 0;
    if (quota === 0) return { service: 'SMS (TextBelt)', status: 'error', message: 'Out of SMS credits — emergency texts WILL FAIL', latencyMs: Date.now() - t };
    if (quota < 10) return { service: 'SMS (TextBelt)', status: 'warning', message: `Low credits: ${quota} remaining`, latencyMs: Date.now() - t };
    return { service: 'SMS (TextBelt)', status: 'ok', message: `${quota} credits remaining`, latencyMs: Date.now() - t };
  } catch (e: any) {
    return { service: 'SMS (TextBelt)', status: 'error', message: 'Request failed', detail: e.message };
  }
}

async function checkEmail(): Promise<HealthResult> {
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  const hasGmail = !!process.env.GMAIL_APP_PASSWORD;
  if (!hasSmtp && !hasGmail) {
    return { service: 'Email (SMTP)', status: 'error', message: 'No email transport configured — emergency emails WILL FAIL', detail: 'Need SMTP_HOST+SMTP_USER+SMTP_PASSWORD or GMAIL_APP_PASSWORD' };
  }
  const provider = hasSmtp ? `SMTP (${process.env.SMTP_HOST})` : 'Gmail';
  return { service: 'Email (SMTP)', status: 'ok', message: `Configured via ${provider}` };
}

async function checkStripe(): Promise<HealthResult> {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key) return { service: 'Stripe (Payments)', status: 'error', message: 'STRIPE_SECRET_KEY not set — payments WILL FAIL' };
  if (key.startsWith('sk_live_')) return { service: 'Stripe (Payments)', status: 'ok', message: 'Live key configured' };
  if (key.startsWith('sk_test_')) return { service: 'Stripe (Payments)', status: 'warning', message: 'Test key active — no real charges will go through' };
  return { service: 'Stripe (Payments)', status: 'error', message: 'Key format unrecognized', detail: key.slice(0, 12) + '...' };
}

async function checkDailyCo(): Promise<HealthResult> {
  const key = process.env.DAILY_API_KEY;
  if (!key) return { service: 'Daily.co (Video Calls)', status: 'error', message: 'DAILY_API_KEY not set — video calls WILL FAIL' };
  const t = Date.now();
  try {
    const res = await fetch('https://api.daily.co/v1/', { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) });
    if (res.ok) return { service: 'Daily.co (Video Calls)', status: 'ok', message: 'API key valid', latencyMs: Date.now() - t };
    return { service: 'Daily.co (Video Calls)', status: 'error', message: `API returned ${res.status}`, detail: 'Key may be invalid or expired', latencyMs: Date.now() - t };
  } catch (e: any) {
    return { service: 'Daily.co (Video Calls)', status: 'error', message: 'Request failed', detail: e.message };
  }
}

async function checkCloudflareR2(): Promise<HealthResult> {
  const id = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secret = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const account = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'carenincidents';
  if (!id || !secret || !account) {
    return { service: 'Cloudflare R2 (Recording Storage)', status: 'error', message: 'R2 credentials missing — incident recordings WILL FAIL' };
  }
  return { service: 'Cloudflare R2 (Recording Storage)', status: 'ok', message: `Credentials present, bucket: ${bucket}` };
}

async function checkAI(): Promise<HealthResult> {
  const replitKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const key = replitKey || openaiKey;
  const keyLabel = replitKey ? 'AI_INTEGRATIONS_OPENAI_API_KEY' : 'OPENAI_API_KEY';

  if (!key) {
    return { service: 'AI (OpenAI)', status: 'error', message: 'No AI key set — AI features WILL FAIL', detail: 'Need AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY' };
  }

  // Actually test the key by calling the models endpoint — catches invalid keys and quota exceeded
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com';
  const t = Date.now();
  try {
    const res = await fetch(`${baseURL}/v1/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - t;

    if (res.status === 200) {
      return { service: 'AI (OpenAI)', status: 'ok', message: `Key valid (${keyLabel})`, latencyMs };
    }
    if (res.status === 401) {
      return { service: 'AI (OpenAI)', status: 'error', message: `API key rejected — AI features WILL FAIL`, detail: `${keyLabel} is invalid or revoked`, latencyMs };
    }
    if (res.status === 429) {
      let detail = 'Check billing at platform.openai.com';
      try { const body: any = await res.json(); detail = body?.error?.message?.slice(0, 100) || detail; } catch {}
      return { service: 'AI (OpenAI)', status: 'error', message: `Quota exceeded — AI features WILL FAIL`, detail, latencyMs };
    }
    return { service: 'AI (OpenAI)', status: 'warning', message: `Unexpected response ${res.status} from OpenAI`, detail: keyLabel, latencyMs };
  } catch (e: any) {
    return { service: 'AI (OpenAI)', status: 'error', message: 'Could not reach OpenAI API', detail: e.message };
  }
}

async function checkPushNotifications(): Promise<HealthResult> {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return { service: 'Push Notifications (VAPID)', status: 'error', message: 'VAPID keys missing — SOS push alerts WILL FAIL' };
  return { service: 'Push Notifications (VAPID)', status: 'ok', message: 'VAPID keys configured' };
}

async function checkGoogleOAuth(): Promise<HealthResult> {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) return { service: 'Google OAuth (Sign-in)', status: 'error', message: 'Google OAuth keys missing — Google login WILL FAIL' };
  return { service: 'Google OAuth (Sign-in)', status: 'ok', message: 'Client ID and secret configured' };
}

async function checkLinkedIn(): Promise<HealthResult> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const urn = process.env.LINKEDIN_AUTHOR_URN;
  if (!token || !urn) return { service: 'LinkedIn (Social Posting)', status: 'warning', message: 'LinkedIn not fully configured — social posting disabled' };
  return { service: 'LinkedIn (Social Posting)', status: 'ok', message: 'Access token and author URN set' };
}

async function checkSessionSecret(): Promise<HealthResult> {
  const secret = process.env.SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  if (!secret && isProduction) return { service: 'Session Security', status: 'error', message: 'SESSION_SECRET not set in production — sessions are insecure' };
  if (!secret) return { service: 'Session Security', status: 'warning', message: 'SESSION_SECRET not set — using insecure dev default' };
  if (secret.length < 32) return { service: 'Session Security', status: 'warning', message: 'SESSION_SECRET is too short (< 32 chars)' };
  return { service: 'Session Security', status: 'ok', message: 'Secret configured and adequate length' };
}

// ── main runner ───────────────────────────────────────────────────────────────

let cachedResults: { results: HealthResult[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute cache to avoid hammering external APIs

export async function runHealthChecks(forceRefresh = false): Promise<HealthResult[]> {
  if (!forceRefresh && cachedResults && Date.now() - cachedResults.timestamp < CACHE_TTL_MS) {
    return cachedResults.results;
  }

  const checks = await Promise.allSettled([
    checkDatabase(),
    checkSMS(),
    checkEmail(),
    checkStripe(),
    checkDailyCo(),
    checkCloudflareR2(),
    checkAI(),
    checkPushNotifications(),
    checkGoogleOAuth(),
    checkLinkedIn(),
    checkSessionSecret(),
  ]);

  const results = checks.map((c, i) =>
    c.status === 'fulfilled'
      ? c.value
      : { service: `Check #${i}`, status: 'error' as const, message: 'Health check itself crashed', detail: String((c as PromiseRejectedResult).reason) }
  );

  cachedResults = { results, timestamp: Date.now() };
  return results;
}

// ── startup diagnostics ───────────────────────────────────────────────────────

export async function runStartupDiagnostics(): Promise<void> {
  console.log('\n[HEALTH] ══════════════════════════════════════════');
  console.log('[HEALTH] Running startup diagnostics...');

  const results = await runHealthChecks(true);

  const errors = results.filter(r => r.status === 'error');
  const warnings = results.filter(r => r.status === 'warning');
  const ok = results.filter(r => r.status === 'ok');

  for (const r of results) {
    const icon = r.status === 'ok' ? '✓' : r.status === 'warning' ? '⚠' : '✗';
    const suffix = r.latencyMs !== undefined ? ` (${r.latencyMs}ms)` : '';
    const detail = r.detail ? ` | ${r.detail}` : '';
    console.log(`[HEALTH] ${icon} ${r.service}: ${r.message}${suffix}${detail}`);
  }

  console.log(`[HEALTH] ── ${ok.length} ok, ${warnings.length} warnings, ${errors.length} errors ──`);

  if (errors.length > 0) {
    console.error(`[HEALTH] ✗ ${errors.length} CRITICAL issue(s) detected:`);
    for (const e of errors) {
      console.error(`[HEALTH]   ✗ ${e.service}: ${e.message}`);
    }
  }

  console.log('[HEALTH] ══════════════════════════════════════════\n');
}
