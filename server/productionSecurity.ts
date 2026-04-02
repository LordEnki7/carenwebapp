import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import crypto from 'crypto';

export const isProduction = process.env.NODE_ENV === 'production';

export function getSecureSessionConfig() {
  return {
    name: 'caren.sid',
    secret: process.env.SESSION_SECRET || 'caren-dev-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: 'lax' as const, // 'lax' allows OAuth redirect flows to work in all browsers
      maxAge: 24 * 60 * 60 * 1000,
      domain: isProduction ? undefined : undefined,
    },
    rolling: true,
  };
}

export function productionGuard(req: Request, res: Response, next: NextFunction) {
  if (isProduction) {
    return res.status(403).json({ 
      error: 'This endpoint is disabled in production',
      code: 'PRODUCTION_BLOCKED'
    });
  }
  next();
}

export function demoEndpointGuard(req: Request, res: Response, next: NextFunction) {
  if (isProduction) {
    console.log(`[SECURITY] Blocked demo endpoint access in production: ${req.path}`);
    return res.status(403).json({ 
      error: 'Demo mode is disabled in production',
      code: 'DEMO_DISABLED'
    });
  }
  next();
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

export function getHelmetConfig(nonce?: string) {
  if (!isProduction) {
    return helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    });
  }

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://js.stripe.com',
          'https://accounts.google.com',
          'https://replit.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://carenalert.com',
          'https://www.carenalert.com',
          'https://api.stripe.com',
          'https://nominatim.openstreetmap.org',
          'wss://*.replit.dev',
          'wss://*.replit.app',
          'https://*.replit.app',
          'https://*.replit.dev',
          'https://accounts.google.com',
          'https://oauth2.googleapis.com',
        ],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        workerSrc: ["'self'", 'blob:'],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://accounts.google.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'", 'https://accounts.google.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
}

export function sanitizeSessionResponse(user: any) {
  if (!user) return null;
  
  const { password, sessionToken, customDomainToken, ...safeUser } = user;
  return safeUser;
}

export function logSecurityEvent(event: string, details: any, req?: Request) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req?.ip || 'unknown',
    userAgent: req?.get('user-agent') || 'unknown',
    path: req?.path || 'unknown',
  };
  
  if (isProduction) {
    console.log('[SECURITY_AUDIT]', JSON.stringify(logEntry));
  } else {
    console.log('[SECURITY_DEV]', event, details);
  }
}
