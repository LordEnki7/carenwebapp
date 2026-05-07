/**
 * honeypot.ts — Attacker Trap System
 *
 * Registers fake "attractive" URLs that no real user ever visits.
 * Anyone who hits these is almost certainly a scanner, bot, or attacker.
 * We log their full fingerprint, slow them down (tarpit), and feed them
 * fake responses so they waste time thinking they found something.
 *
 * Threat log is kept in memory and exposed to the admin dashboard.
 */

import type { Express, Request, Response } from 'express';

// ─── Threat Log ───────────────────────────────────────────────────────────────

export interface ThreatEntry {
  id: number;
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  userAgent: string;
  referer: string;
  body: string;
  headers: Record<string, string>;
  country?: string;
}

const threatLog: ThreatEntry[] = [];
let nextId = 1;
const MAX_LOG = 500; // keep last 500 hits

function getIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function recordThreat(req: Request): ThreatEntry {
  const entry: ThreatEntry = {
    id: nextId++,
    timestamp: new Date().toISOString(),
    ip: getIp(req),
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'] || '',
    referer: (req.headers['referer'] || req.headers['referrer'] || '') as string,
    body: req.body ? JSON.stringify(req.body).substring(0, 500) : '',
    headers: Object.fromEntries(
      Object.entries(req.headers)
        .filter(([k]) => !['cookie', 'authorization'].includes(k))
        .map(([k, v]) => [k, String(v)])
    ),
  };

  threatLog.unshift(entry);
  if (threatLog.length > MAX_LOG) threatLog.pop();

  console.warn(
    `[HONEYPOT] 🍯 TRAP HIT — ip=${entry.ip} method=${entry.method} path=${entry.path} ua="${entry.userAgent}"`
  );

  return entry;
}

// ─── Tarpit delay ─────────────────────────────────────────────────────────────
// Make the attacker wait before getting a response — wastes their time.
function tarpit(ms = 8000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Fake responses ───────────────────────────────────────────────────────────

const fakeLoginPage = `<!DOCTYPE html>
<html><head><title>Login</title></head><body>
<form method="post">
  <input name="user" placeholder="Username" />
  <input name="pass" type="password" placeholder="Password" />
  <button type="submit">Login</button>
</form>
</body></html>`;

const fakeEnvFile = `APP_KEY=base64:fake_key_for_you_haha
DB_PASSWORD=definitely_not_real
ADMIN_SECRET=gotcha_nice_try
`;

// ─── Route registration ────────────────────────────────────────────────────────

export function registerHoneypotRoutes(app: Express): void {
  // WordPress / common CMS probes
  const wpPaths = [
    '/wp-admin', '/wp-admin/', '/wp-login.php', '/wp-admin/admin-ajax.php',
    '/wordpress/wp-admin', '/blog/wp-admin', '/cms/wp-admin',
  ];

  // Database admin probes
  const dbPaths = [
    '/phpmyadmin', '/phpmyadmin/', '/pma', '/mysql', '/adminer',
    '/adminer.php', '/db', '/database',
  ];

  // Config / env file probes
  const configPaths = [
    '/.env', '/.env.local', '/.env.production', '/.env.backup',
    '/config.php', '/config.json', '/config.yml', '/configuration.php',
    '/.git/config', '/backup.sql', '/dump.sql',
  ];

  // Generic admin probes
  const adminPaths = [
    '/admin', '/administrator', '/adminpanel', '/admin-panel',
    '/cpanel', '/plesk', '/webadmin', '/manage', '/panel',
  ];

  // API / debug probes
  const apiPaths = [
    '/api/internal/debug', '/api/internal/setup', '/api/setup',
    '/api/internal/admin', '/api/v1/admin', '/api/debug',
    '/debug', '/setup', '/install', '/install.php',
    '/api/internal/reset', '/api/internal/shell',
  ];

  const allPaths = [...wpPaths, ...dbPaths, ...configPaths, ...adminPaths, ...apiPaths];

  for (const trapPath of allPaths) {
    app.all(trapPath, async (req: Request, res: Response) => {
      recordThreat(req);
      await tarpit(8000);

      // Return different fake content depending on what they were looking for
      if (trapPath.includes('.env') || trapPath.includes('config') || trapPath.includes('backup') || trapPath.includes('.git')) {
        res.set('Content-Type', 'text/plain');
        return res.status(200).send(fakeEnvFile);
      }

      if (trapPath.includes('phpmyadmin') || trapPath.includes('mysql') || trapPath.includes('adminer') || trapPath.includes('database') || trapPath.includes('/db')) {
        res.set('Content-Type', 'text/html');
        return res.status(200).send(fakeLoginPage.replace('<title>Login</title>', '<title>phpMyAdmin</title>'));
      }

      // Default: fake login page
      res.set('Content-Type', 'text/html');
      return res.status(200).send(fakeLoginPage);
    });
  }

  console.log(`[HONEYPOT] ${allPaths.length} trap endpoints registered`);
}

// ─── Admin API to view threat log ─────────────────────────────────────────────

export function getThreatLog(limit = 100): ThreatEntry[] {
  return threatLog.slice(0, limit);
}

export function getThreatStats() {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  const recent = threatLog.filter(e => new Date(e.timestamp).getTime() > last24h);
  const byIp: Record<string, number> = {};
  for (const e of threatLog) {
    byIp[e.ip] = (byIp[e.ip] || 0) + 1;
  }
  const topIps = Object.entries(byIp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, hits]) => ({ ip, hits }));

  return {
    total: threatLog.length,
    last24h: recent.length,
    topIps,
    topPaths: Array.from(new Set(threatLog.map(e => e.path))).slice(0, 10),
  };
}
