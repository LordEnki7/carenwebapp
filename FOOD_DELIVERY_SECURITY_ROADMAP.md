# Security Roadmap — Food Delivery Mobile App
*Security patterns built and battle-tested on a production app. Adapt these for your food delivery backend.*

---

## 1. Environment Variables — No Hardcoded Secrets

**The rule:** Every API key, admin password, secret token, and database URL lives in environment variables only. Never in code files.

**What to set as env vars:**
- `DATABASE_URL` — your database connection string
- `ADMIN_KEY` — your admin dashboard password (long, random string)
- `STRIPE_SECRET_KEY` — payment processing
- `JWT_SECRET` or `SESSION_SECRET` — for signing auth tokens/sessions
- Any third-party API keys (maps, SMS, push notifications, etc.)

**How to use in code (Node.js example):**
```js
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) throw new Error('ADMIN_KEY env var is required');
```

**Never do this:**
```js
const ADMIN_KEY = 'mypassword123'; // ❌ anyone who reads your code owns your app
```

---

## 2. Rate Limiting

Prevents bots and attackers from hammering your endpoints — especially login, checkout, and admin routes.

**Install:**
```bash
npm install express-rate-limit
```

**Apply to sensitive routes:**
```js
import rateLimit from 'express-rate-limit';

// Admin routes — strict
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // 30 requests per 15 min
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/admin', adminLimiter);

// Login/register — prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Checkout/payment — prevent abuse
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many payment requests' },
});
app.use('/api/orders/checkout', paymentLimiter);
```

---

## 3. Admin Dashboard Protection

Your admin panel (where you see orders, users, revenue) must be locked down hard.

**Pattern — require admin key on every admin request:**
```js
const ADMIN_KEY = process.env.ADMIN_KEY;
const adminKeyFailLog: Record<string, { count: number; lastAt: Date }> = {};

function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-admin-key'] as string || req.query.adminKey as string;

  if (!key || key !== ADMIN_KEY) {
    // Log failed attempts
    const ip = req.ip || 'unknown';
    if (!adminKeyFailLog[ip]) adminKeyFailLog[ip] = { count: 0, lastAt: new Date() };
    adminKeyFailLog[ip].count++;
    adminKeyFailLog[ip].lastAt = new Date();

    console.warn(`[SECURITY] Failed admin key attempt from IP: ${ip} | UA: ${req.headers['user-agent']} | Total: ${adminKeyFailLog[ip].count}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Apply to all admin routes
app.use('/api/admin', requireAdminKey);
```

**Expose failed attempts to your admin dashboard:**
```js
app.get('/api/admin/failed-attempts', requireAdminKey, (req, res) => {
  const attempts = Object.entries(adminKeyFailLog).map(([ip, data]) => ({
    ip,
    count: data.count,
    lastAt: data.lastAt,
  }));
  res.json({ attempts });
});
```

---

## 4. Honeypot Trap Endpoints

Hackers and bots scan every app looking for common weak points — WordPress admin panels, `.env` files, phpMyAdmin, etc. Your food delivery app has none of those, but bots don't know that. Set traps on those URLs so you catch and log every scanner.

**How it works:**
- Register fake URLs that no real user would ever visit
- When anything hits those URLs, log their full fingerprint (IP, browser, time, what they tried)
- Delay the response 8 seconds (wastes their time, slows their scanner)
- Return fake content so they think they found something

**Create `server/honeypot.ts`:**
```ts
import { Express, Request, Response } from 'express';

interface ThreatEntry {
  ip: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  method: string;
}

const threatLog: ThreatEntry[] = [];

// URLs that real users never visit — bots always do
const TRAP_URLS = [
  '/wp-admin', '/wp-admin/login', '/wp-login.php',
  '/admin/login', '/administrator',
  '/.env', '/.env.local', '/.env.production',
  '/config.php', '/configuration.php', '/config.json',
  '/phpMyAdmin', '/phpmyadmin', '/pma',
  '/api/v1/users/admin', '/api/config', '/api/debug',
  '/server-status', '/server-info',
  '/backup.zip', '/backup.sql', '/dump.sql',
  '/install.php', '/setup.php', '/setup',
  '/.git/config', '/.git/HEAD',
  '/actuator', '/actuator/env', '/actuator/health',
  '/console', '/h2-console',
  '/api/swagger', '/api-docs', '/swagger-ui.html',
  '/debug', '/trace', '/heapdump',
];

export function registerHoneypotRoutes(app: Express) {
  for (const url of TRAP_URLS) {
    app.all(url, (req: Request, res: Response) => {
      const entry: ThreatEntry = {
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        url: req.originalUrl,
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        method: req.method,
      };
      threatLog.push(entry);
      console.warn(`[HONEYPOT] Trap hit: ${entry.method} ${entry.url} from ${entry.ip} | UA: ${entry.userAgent}`);

      // Delay 8 seconds to waste attacker's time
      setTimeout(() => {
        res.status(200).send('<!-- WordPress 6.4.1 -->');
      }, 8000);
    });
  }
  console.log(`[HONEYPOT] ${TRAP_URLS.length} trap endpoints registered`);
}

export function getThreatLog() { return threatLog; }

export function getThreatStats() {
  const ipCounts: Record<string, number> = {};
  for (const entry of threatLog) {
    ipCounts[entry.ip] = (ipCounts[entry.ip] || 0) + 1;
  }
  const topAttackers = Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  return {
    total: threatLog.length,
    last24h: threatLog.filter(e => Date.now() - e.timestamp.getTime() < 86400000).length,
    topAttackers,
    recentHits: threatLog.slice(-20).reverse(),
  };
}
```

**Register in your main `server/index.ts` or `routes.ts` (at the very end, after all real routes):**
```ts
import { registerHoneypotRoutes, getThreatStats } from './honeypot';

// ... all your real routes above ...

// Expose threat data to admin dashboard
app.get('/api/admin/threats', requireAdminKey, (req, res) => {
  res.json(getThreatStats());
});

// Register honeypot traps last
registerHoneypotRoutes(app);
```

---

## 5. Secure Session & Cookie Configuration

If you're using sessions (for login state), configure cookies correctly so they can't be stolen.

```js
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET!, // long random string, never hardcode
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,   // JS can't read the cookie (blocks XSS attacks)
    secure: true,     // HTTPS only (set to false in local dev only)
    sameSite: 'lax',  // blocks cross-site request forgery
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));
```

**For production vs development:**
```js
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // only HTTPS in prod
  sameSite: 'lax',
}
```

---

## 6. CORS — Lock Down Who Can Call Your API

Only your own app should be able to call your backend.

```js
import cors from 'cors';

const allowedOrigins = [
  'https://yourdeliveryapp.com',
  'https://www.yourdeliveryapp.com',
  // Add your mobile app's webview origin if applicable
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman in dev)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // required for cookies/sessions
}));
```

---

## 7. Helmet — Security Headers

One line that adds a dozen security headers automatically.

```bash
npm install helmet
```

```js
import helmet from 'helmet';
app.use(helmet());
```

This automatically sets headers that block clickjacking, MIME sniffing, XSS attacks, and more.

---

## 8. Input Validation — Never Trust User Input

Every piece of data from users (order details, addresses, payment amounts) must be validated before touching your database.

```bash
npm install zod
```

```js
import { z } from 'zod';

const orderSchema = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int().min(1).max(50),
  })).min(1),
  deliveryAddress: z.string().min(5).max(200),
  tipPercent: z.number().min(0).max(100).optional(),
});

app.post('/api/orders', async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid order data', details: parsed.error.flatten() });
  }
  // Use parsed.data — it's clean and type-safe
});
```

---

## 9. SQL Injection Prevention

Use an ORM (Drizzle, Prisma, or Sequelize) — never concatenate user input into SQL strings.

```js
// ❌ NEVER do this
const user = await db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`);

// ✅ Always use parameterized queries or an ORM
const user = await db.select().from(users).where(eq(users.email, req.body.email));
```

---

## 10. Security Audit Logging

Log every sensitive action so you have a trail if something goes wrong.

```js
function securityLog(event: string, userId: string | 'anonymous', req: Request, details?: object) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details,
  }));
}

// Use it like:
securityLog('ORDER_PLACED', req.user.id, req, { orderId, amount });
securityLog('PAYMENT_FAILED', req.user.id, req, { reason });
securityLog('LOGIN_SUCCESS', user.id, req);
securityLog('LOGIN_FAILED', 'anonymous', req, { email: req.body.email });
```

---

## 11. Admin Security Dashboard (Optional but Recommended)

A simple admin screen that shows:
- **Trap hits** — how many bots/scanners have hit your honeypot
- **Top attacker IPs** — ranked by number of attempts
- **Failed admin key attempts** — who's trying to break in
- **Recent threat log** — full list of suspicious activity

Connect it to `/api/admin/threats` (built in step 4 above).

---

## Quick Checklist Before Launch

- [ ] All secrets in environment variables — nothing hardcoded
- [ ] Rate limiting on login, register, checkout, and admin routes
- [ ] Admin dashboard protected by strong key (env var, not hardcoded)
- [ ] Honeypot traps registered on common attack URLs
- [ ] Session cookies set to `httpOnly: true`, `secure: true`, `sameSite: lax`
- [ ] CORS locked to your own domain in production
- [ ] Helmet installed for security headers
- [ ] All user input validated with Zod before DB access
- [ ] ORM used for all database queries (no raw SQL string concatenation)
- [ ] Security logging on sensitive actions (login, payment, order)

---

## Packages to Install

```bash
npm install express-rate-limit helmet cors express-session zod
```

Optional but useful:
```bash
npm install drizzle-orm  # ORM for safe DB queries
npm install connect-pg-simple  # store sessions in PostgreSQL (survives restarts)
```

---

*These patterns are running in production on carenalert.com as of 2026-05-07.*
