/**
 * botProtection.ts
 * Detects and blocks automated/bot login attempts.
 * Three layers: failed-attempt lockout, honeypot field check, anomaly detection.
 */

import type { Request, Response, NextFunction } from "express";

// ─── In-memory trackers ────────────────────────────────────────────────────
// These reset on server restart — good enough for abuse prevention.
// For persistent tracking across restarts, move to Redis or the DB.

interface FailRecord {
  count: number;
  firstFailAt: number;
  lockedUntil?: number;
}

const ipFailMap   = new Map<string, FailRecord>(); // keyed by IP
const emailFailMap = new Map<string, FailRecord>(); // keyed by lowercase email

const MAX_FAILS      = 5;         // attempts before lockout
const WINDOW_MS      = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS     = 30 * 60 * 1000; // 30-minute lockout

// ─── Helpers ──────────────────────────────────────────────────────────────

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function now(): number {
  return Date.now();
}

function checkAndRecord(map: Map<string, FailRecord>, key: string): { blocked: boolean; minutesLeft?: number } {
  const rec = map.get(key);
  const t = now();

  if (rec) {
    // Locked out?
    if (rec.lockedUntil && t < rec.lockedUntil) {
      const minutesLeft = Math.ceil((rec.lockedUntil - t) / 60000);
      return { blocked: true, minutesLeft };
    }

    // Window expired — reset
    if (t - rec.firstFailAt > WINDOW_MS) {
      map.set(key, { count: 1, firstFailAt: t });
      return { blocked: false };
    }

    // Within window — increment
    rec.count++;
    if (rec.count >= MAX_FAILS) {
      rec.lockedUntil = t + LOCKOUT_MS;
      map.set(key, rec);
      return { blocked: true, minutesLeft: 30 };
    }

    map.set(key, rec);
    return { blocked: false };
  }

  // First failure
  map.set(key, { count: 1, firstFailAt: t });
  return { blocked: false };
}

function resetRecord(map: Map<string, FailRecord>, key: string): void {
  map.delete(key);
}

// ─── Bot signal scoring ────────────────────────────────────────────────────

interface BotSignals {
  score: number;
  reasons: string[];
}

export function scoreBotSignals(req: Request): BotSignals {
  const signals: string[] = [];
  let score = 0;

  const ua = req.headers["user-agent"] || "";
  const referer = req.headers["referer"] || req.headers["referrer"] || "";
  const contentType = req.headers["content-type"] || "";
  const acceptLang = req.headers["accept-language"] || "";
  const accept = req.headers["accept"] || "";

  // Missing user-agent is a strong bot signal
  if (!ua) {
    score += 40;
    signals.push("no User-Agent header");
  }

  // Common headless/script user-agents
  const botPatterns = ["python-requests", "curl/", "axios/", "node-fetch", "got/", "wget/", "httpx", "scrapy", "okhttp", "java/", "go-http-client"];
  if (ua && botPatterns.some(p => ua.toLowerCase().includes(p))) {
    score += 50;
    signals.push(`bot-like User-Agent: ${ua}`);
  }

  // navigator.webdriver hint (some headless browsers pass this)
  if (ua.includes("HeadlessChrome") || ua.includes("PhantomJS")) {
    score += 60;
    signals.push("headless browser detected in User-Agent");
  }

  // No referer on a login POST — bots often hit the API directly
  if (!referer) {
    score += 15;
    signals.push("no Referer header");
  }

  // No Accept-Language — browsers always send this
  if (!acceptLang) {
    score += 20;
    signals.push("no Accept-Language header");
  }

  // Accept header looks like a non-browser client
  if (accept && !accept.includes("text/html") && !accept.includes("*/*")) {
    score += 10;
    signals.push("non-browser Accept header");
  }

  // Content-Type missing or wrong for a form submit
  if (!contentType.includes("application/json") && !contentType.includes("application/x-www-form-urlencoded")) {
    score += 5;
    signals.push("unusual Content-Type");
  }

  return { score, reasons: signals };
}

// ─── Honeypot check ────────────────────────────────────────────────────────

/**
 * Checks if the honeypot field was filled in.
 * The frontend MUST render a hidden input named `_hp` that humans never fill.
 * If `_hp` is present in the body, it's a bot.
 */
export function honeypotTriggered(body: Record<string, any>): boolean {
  return typeof body["_hp"] === "string" && body["_hp"].length > 0;
}

// ─── Anomaly logging ───────────────────────────────────────────────────────

export function logLoginAttempt(opts: {
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  blocked?: boolean;
  reason?: string;
  botScore?: number;
}): void {
  const tag = opts.blocked ? "[BOT-BLOCK]" : opts.success ? "[LOGIN-OK]" : "[LOGIN-FAIL]";
  const botTag = opts.botScore !== undefined && opts.botScore > 0 ? ` botScore=${opts.botScore}` : "";
  console.log(
    `[AUTH-GUARD] ${tag} email=${opts.email} ip=${opts.ip} ua="${opts.userAgent}"${botTag}${opts.reason ? ` reason="${opts.reason}"` : ""}`
  );
}

// ─── Main middleware factory ───────────────────────────────────────────────

/**
 * Call this at the TOP of any login/register route handler, before doing any
 * credential lookup. Pass the email from the request body.
 *
 * Returns null if the request should proceed.
 * Returns a Response (already sent) if the request was blocked — caller should return immediately.
 */
// Owner / platform admin accounts are never locked out
const OWNER_WHITELIST = new Set([
  (process.env.OWNER_EMAIL || '').toLowerCase(),
  'carenwebapp@yahoo.com',
]);

export function checkBotProtection(
  req: Request,
  res: Response,
  email: string
): boolean {
  // Never lock out the platform owner
  if (OWNER_WHITELIST.has(email.toLowerCase().trim())) return false;

  const ip = getClientIp(req);
  const ua = req.headers["user-agent"] || "";

  // 1. Honeypot
  if (honeypotTriggered(req.body)) {
    logLoginAttempt({ email, ip, userAgent: ua, success: false, blocked: true, reason: "honeypot" });
    // Fake success — don't reveal that we detected anything
    res.json({ success: false, message: "Invalid email or password." });
    return true;
  }

  // 2. IP lockout check
  const ipCheck = checkAndRecord(ipFailMap, ip);
  if (ipCheck.blocked) {
    logLoginAttempt({ email, ip, userAgent: ua, success: false, blocked: true, reason: `ip-lockout ${ipCheck.minutesLeft}min left` });
    res.status(429).json({
      success: false,
      message: `Too many failed attempts. Try again in ${ipCheck.minutesLeft} minutes.`,
    });
    return true;
  }

  // 3. Email lockout check (prevents targeting one account from rotating IPs)
  const emailKey = email.toLowerCase().trim();
  const emailCheck = checkAndRecord(emailFailMap, emailKey);
  if (emailCheck.blocked) {
    logLoginAttempt({ email, ip, userAgent: ua, success: false, blocked: true, reason: `email-lockout ${emailCheck.minutesLeft}min left` });
    res.status(429).json({
      success: false,
      message: `Too many failed attempts for this account. Try again in ${emailCheck.minutesLeft} minutes.`,
    });
    return true;
  }

  // 4. High bot score — log but don't block outright (unless score is extreme)
  const { score, reasons } = scoreBotSignals(req);
  if (score >= 60) {
    logLoginAttempt({ email, ip, userAgent: ua, success: false, blocked: true, reason: `bot-score=${score}: ${reasons.join(", ")}`, botScore: score });
    res.status(403).json({
      success: false,
      message: "Automated requests are not allowed.",
    });
    return true;
  }

  if (score > 0) {
    // Suspicious but not conclusive — log and let through
    logLoginAttempt({ email, ip, userAgent: ua, success: false, blocked: false, reason: `suspicious bot-score=${score}: ${reasons.join(", ")}`, botScore: score });
  }

  return false; // not blocked
}

/**
 * Call on SUCCESSFUL login to clear the failure records for this IP and email.
 */
export function recordLoginSuccess(req: Request, email: string): void {
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"] || "";
  resetRecord(ipFailMap, ip);
  resetRecord(emailFailMap, email.toLowerCase().trim());
  logLoginAttempt({ email, ip, userAgent: ua, success: true });
}

/**
 * Call on FAILED login (wrong password, unknown email) to increment failure counters.
 */
export function recordLoginFailure(req: Request, email: string, reason = "invalid credentials"): void {
  const ip = getClientIp(req);
  const ua = req.headers["user-agent"] || "";
  checkAndRecord(ipFailMap, ip);
  checkAndRecord(emailFailMap, email.toLowerCase().trim());
  logLoginAttempt({ email, ip, userAgent: ua, success: false, reason });
}
