import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Security Configuration
export const SECURITY_CONFIG = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  },
  session: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Advanced Encryption Service
export class EncryptionService {
  static generateKey(): string {
    return crypto.randomBytes(SECURITY_CONFIG.encryption.keyLength).toString('hex');
  }

  static encrypt(text: string, key?: string): { encrypted: string; key: string; iv: string; tag: string } {
    const encryptionKey = key || this.generateKey();
    const iv = crypto.randomBytes(SECURITY_CONFIG.encryption.ivLength);
    const cipher = crypto.createCipher(SECURITY_CONFIG.encryption.algorithm, Buffer.from(encryptionKey, 'hex'));
    cipher.setAAD(Buffer.from('C.A.R.E.N.™', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      key: encryptionKey,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decrypt(encryptedData: { encrypted: string; key: string; iv: string; tag: string }): string {
    try {
      const decipher = crypto.createDecipher(SECURITY_CONFIG.encryption.algorithm, Buffer.from(encryptedData.key, 'hex'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      decipher.setAAD(Buffer.from('C.A.R.E.N.™', 'utf8'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed - data may be corrupted');
    }
  }

  static hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Input Sanitization
export class InputSanitizer {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>'"&]/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      })
      .trim()
      .substring(0, 10000); // Limit length
  }

  static sanitizeEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = this.sanitizeString(email).toLowerCase();
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }

  static validateFileUpload(file: { name: string; type: string; size: number }): boolean {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'
    ];
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.mp3', '.wav', '.mp4', '.webm'];
    
    if (file.size > maxSize) {
      throw new Error('File size exceeds maximum allowed (50MB)');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('File extension not allowed');
    }
    
    return true;
  }
}

// Security Audit Logger
export class SecurityAuditLogger {
  static logSecurityEvent(event: string, details: any, req?: Request): void {
    const timestamp = new Date().toISOString();
    const ip = req?.ip || req?.connection.remoteAddress || 'unknown';
    const userAgent = req?.get('User-Agent') || 'unknown';
    const userId = (req as any)?.user?.id || 'anonymous';
    
    const logEntry = {
      timestamp,
      event,
      userId,
      ip,
      userAgent,
      details: typeof details === 'object' ? JSON.stringify(details) : details
    };
    
    console.log(`[SECURITY AUDIT] ${JSON.stringify(logEntry)}`);
    
    // In production, send to security monitoring service
    // await securityMonitoringService.log(logEntry);
  }

  static logAuthAttempt(success: boolean, email: string, req: Request): void {
    this.logSecurityEvent('AUTH_ATTEMPT', {
      success,
      email: InputSanitizer.sanitizeEmail(email),
      timestamp: new Date().toISOString()
    }, req);
  }

  static logDataAccess(resource: string, action: string, req: Request): void {
    this.logSecurityEvent('DATA_ACCESS', {
      resource,
      action,
      timestamp: new Date().toISOString()
    }, req);
  }

  static logSuspiciousActivity(activity: string, details: any, req: Request): void {
    this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      activity,
      details,
      severity: 'HIGH',
      timestamp: new Date().toISOString()
    }, req);
  }
}

// Rate Limiting
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    handler: (req, res) => {
      SecurityAuditLogger.logSuspiciousActivity('RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        path: req.path,
        method: req.method
      }, req);
      
      res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Security Headers - Development vs Production
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      connectSrc: ["'self'", "wss:", "https:", "ws:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
});

// Request Validation Middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Skip security validation for authentication endpoints to prevent middleware conflicts
    if (req.path === '/api/auth/user' || req.path.startsWith('/api/auth/')) {
      console.log('[SECURITY] Bypassing validation for auth endpoint:', req.path);
      next();
      return;
    }
    
    // Sanitize body parameters
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = InputSanitizer.sanitizeString(req.body[key]);
        }
      }
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = InputSanitizer.sanitizeString(req.query[key] as string);
        }
      }
    }
    
    // Log request for audit
    SecurityAuditLogger.logDataAccess(req.path, req.method, req);
    
    next();
  } catch (error) {
    console.error('[SECURITY] Validation error:', error);
    SecurityAuditLogger.logSuspiciousActivity('REQUEST_VALIDATION_FAILED', {
      error: (error as Error).message,
      path: req.path,
      method: req.method
    }, req);
    
    res.status(400).json({
      error: 'Invalid request data',
      message: 'Request contains invalid or potentially harmful data'
    });
  }
};

// API Key Validation
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    SecurityAuditLogger.logSuspiciousActivity('MISSING_API_KEY', {
      path: req.path,
      method: req.method
    }, req);
    
    return res.status(401).json({
      error: 'API key required',
      message: 'Valid API key must be provided in X-API-Key header'
    });
  }
  
  // In production, validate against stored API keys
  // For now, we'll use a simple validation
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (validApiKeys.length > 0 && !validApiKeys.includes(apiKey)) {
    SecurityAuditLogger.logSuspiciousActivity('INVALID_API_KEY', {
      providedKey: apiKey.substring(0, 8) + '...',
      path: req.path,
      method: req.method
    }, req);
    
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  next();
};

// Data Masking for Logs
export const maskSensitiveData = (data: any): any => {
  const sensitiveFields = ['password', 'ssn', 'creditCard', 'token', 'key', 'secret'];
  
  if (typeof data === 'string') {
    return data.length > 4 ? data.substring(0, 4) + '***' : '***';
  }
  
  if (typeof data === 'object' && data !== null) {
    const masked = { ...data };
    
    for (const key in masked) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        masked[key] = maskSensitiveData(masked[key]);
      } else if (typeof masked[key] === 'object') {
        masked[key] = maskSensitiveData(masked[key]);
      }
    }
    
    return masked;
  }
  
  return data;
};