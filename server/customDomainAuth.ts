// Custom Domain Authentication System
// Handles authentication challenges specific to custom domain deployments

import { Request, Response, NextFunction } from 'express';
import { randomBytes as cryptoRandomBytes } from 'crypto';

// In-memory token store for custom domain authentication
const customDomainTokens = new Map<string, {
  userId: string;
  user: any;
  createdAt: Date;
  expiresAt: Date;
}>();

// Generate cryptographically secure custom domain token
export function generateCustomDomainToken(userId: string, user: any): string {
  // Use cryptographically secure random token generation
  const randomBytes = cryptoRandomBytes(32).toString('hex');
  const timestamp = Date.now();
  const token = `cdt_${userId}_${timestamp}_${randomBytes}`;
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // Reduced to 12 hours for better security
  
  customDomainTokens.set(token, {
    userId,
    user,
    createdAt: new Date(),
    expiresAt
  });
  
  console.log('[CUSTOM_DOMAIN_AUTH] Generated token for user:', userId);
  return token;
}

// Validate custom domain token with enhanced security
export function validateCustomDomainToken(token: string): { userId: string; user: any } | null {
  // Security: Validate token format before processing
  if (!token || !token.startsWith('cdt_') || token.length < 64) {
    console.log('[CUSTOM_DOMAIN_AUTH] Invalid token format:', token?.substring(0, 10) + '...');
    return null;
  }
  
  const tokenData = customDomainTokens.get(token);
  
  if (!tokenData) {
    console.log('[CUSTOM_DOMAIN_AUTH] Token not found:', token.substring(0, 20) + '...');
    return null;
  }
  
  if (new Date() > tokenData.expiresAt) {
    console.log('[CUSTOM_DOMAIN_AUTH] Token expired:', token.substring(0, 20) + '...');
    customDomainTokens.delete(token);
    return null;
  }
  
  console.log('[CUSTOM_DOMAIN_AUTH] Token validated for user:', tokenData.userId);
  return {
    userId: tokenData.userId,
    user: tokenData.user
  };
}

// Enhanced authentication middleware for custom domains
export function customDomainAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log('[CUSTOM_DOMAIN_AUTH] Checking authentication...');
  
  // Check session-based authentication first
  if (req.session && (req.session as any).userId) {
    console.log('[CUSTOM_DOMAIN_AUTH] Session authentication valid');
    return next();
  }
  
  // Check custom domain token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const tokenData = validateCustomDomainToken(token);
    
    if (tokenData) {
      // Inject user data into request for API compatibility
      (req as any).user = tokenData.user;
      (req as any).userId = tokenData.userId;
      console.log('[CUSTOM_DOMAIN_AUTH] Token authentication valid');
      return next();
    }
  }
  
  // SECURITY: Query parameter tokens removed for production security
  // Tokens should only be passed via Authorization header for security
  
  console.log('[CUSTOM_DOMAIN_AUTH] No valid authentication found');
  return res.status(401).json({ 
    message: 'Authentication required',
    customDomainSupport: true,
    hint: 'Use Bearer token or login again'
  });
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = new Date();
  let cleanedCount = 0;
  
  for (const [token, data] of customDomainTokens.entries()) {
    if (now > data.expiresAt) {
      customDomainTokens.delete(token);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log('[CUSTOM_DOMAIN_AUTH] Cleaned up', cleanedCount, 'expired tokens');
  }
}, 60 * 60 * 1000); // Clean up every hour

export default {
  generateCustomDomainToken,
  validateCustomDomainToken,
  customDomainAuthMiddleware
};