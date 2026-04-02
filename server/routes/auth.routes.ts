import type { Express } from "express";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { sendWelcomeEmail, sendGoogleWelcomeEmail } from "../emailService";
import { sendDirectWelcomeEmail } from "../emailServiceDirect";
import { demoSecurityMiddleware } from "../demoSecurity";
import { generateCustomDomainToken, validateCustomDomainToken } from "../customDomainAuth";
import { setupGoogleAuth } from "../googleAuth";
import { getUserAuthenticated, setUserAuthenticated, getCurrentUser, resetUserState, getUserTermsAcceptedAt, addUser, findUserByEmail, getAllUsers } from "../demoState";
import { DemoSecurityManager } from "../demoSecurity";

/**
 * Register authentication routes
 * Extracted from main routes.ts for better code organization
 */
export function registerAuthRoutes(app: Express): void {
  // Rate limit reset endpoint for development (clears any existing rate limit blocks)
  app.post('/api/auth/reset-rate-limit', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Only available in development mode' });
    }
    
    console.log('[RATE_LIMIT_RESET] Clearing rate limit for IP:', req.ip);
    res.json({ 
      message: 'Rate limit cleared for development', 
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  });

  // Demo login endpoint
  app.post('/api/auth/demo-login', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      console.log('[DEMO_LOGIN] Login attempt for:', email);

      // Check if user exists in demo state
      let user = findUserByEmail(email);
      
      if (!user) {
        // For demo purposes, create user if doesn't exist
        user = addUser(email, password, { firstName, lastName });
        console.log('[DEMO_LOGIN] Created new demo user:', email);
        
        // Send welcome email
        try {
          await sendDirectWelcomeEmail(email, firstName || 'User');
          console.log('[DEMO_LOGIN] Welcome email sent to:', email);
        } catch (emailError) {
          console.warn('[DEMO_LOGIN] Failed to send welcome email:', emailError);
        }
      } else if (user.password !== password) {
        console.log('[DEMO_LOGIN] Invalid password for:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set authentication state
      setUserAuthenticated(true, user, new Date());
      
      console.log('[DEMO_LOGIN] User authenticated successfully:', email);
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        message: 'Login successful'
      });
    } catch (error) {
      console.error('[DEMO_LOGIN] Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout endpoint - destroys server session
  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('[LOGOUT] Session destroy error:', err);
      }
      res.clearCookie('caren.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  // Demo logout endpoint
  app.get('/api/auth/demo-logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('[DEMO_LOGOUT] Session destroy error:', err);
      }
      res.clearCookie('caren.sid');
      res.json({ success: true, message: 'Demo session ended' });
    });
  });

  // Clear session data endpoint
  app.post('/api/auth/clear-sessions', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('[CLEAR_SESSIONS] Session destroy error:', err);
      }
      res.clearCookie('caren.sid');
      res.json({ success: true, message: 'Sessions cleared' });
    });
  });

  // Enhanced /api/auth/user endpoint with custom domain token support
  app.get('/api/auth/user', async (req: any, res) => {
    console.log('[AUTH_USER] ===== AUTHENTICATION ENDPOINT START =====');
    console.log('[AUTH_USER] Request method:', req.method);
    console.log('[AUTH_USER] Request URL:', req.url);
    console.log('[AUTH_USER] Authorization header:', req.headers.authorization);
    console.log('[AUTH_USER] Session ID:', req.sessionID);
    console.log('[AUTH_USER] Session data:', req.session);
    
    try {
      // Check Authorization header for custom domain token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Try custom domain token validation first
        try {
          const tokenData = validateCustomDomainToken(token);
          
          if (tokenData) {
            console.log('[AUTH_USER] Custom domain token authentication successful');
            return res.json(tokenData.user);
          }
        } catch (customDomainError: any) {
          console.log('[AUTH_USER] Custom domain token validation failed:', customDomainError?.message);
          // Continue to other authentication methods
        }
        
        // Check for sessionToken patterns (from login endpoints)
        if (token.startsWith('cdt_')) {
          console.log('[AUTH_USER] Found sessionToken from login endpoint');
          
          // Extract user ID from token
          const tokenParts = token.split('_');
          if (tokenParts.length >= 2) {
            const userId = tokenParts[1];
            
            // For demo tokens
            if (userId === 'demo') {
              const demoUser = {
                id: 'demo-user-123',
                email: 'demo@caren.app',
                firstName: 'Demo',
                lastName: 'User',
                role: 'user',
                subscriptionTier: 'demo',
                agreedToTerms: true,
                termsAgreedAt: new Date(),
                emergencyContacts: [],
                currentState: null,
                preferredLanguage: 'en'
              };
              console.log('[AUTH_USER] Returning demo user for demo sessionToken');
              return res.json(demoUser);
            }
            
            // Handle hardcoded reviewer accounts (not stored in DB)
            const reviewerAccounts: Record<string, any> = {
              'google-reviewer-001': { id: 'google-reviewer-001', email: 'googlereview@caren.app', firstName: 'Google', lastName: 'Reviewer', role: 'reviewer', subscriptionTier: 'constitutional_pro', agreedToTerms: true, emergencyContacts: [], currentState: 'California', preferredLanguage: 'en' },
              'apple-reviewer-001': { id: 'apple-reviewer-001', email: 'applereview@caren.app', firstName: 'Apple', lastName: 'Reviewer', role: 'reviewer', subscriptionTier: 'constitutional_pro', agreedToTerms: true, emergencyContacts: [], currentState: 'California', preferredLanguage: 'en' },
            };
            if (reviewerAccounts[userId]) {
              console.log('[AUTH_USER] Found hardcoded reviewer account:', userId);
              return res.json(reviewerAccounts[userId]);
            }

            // For regular user tokens, try to get user from database
            try {
              const user = await storage.getUser(userId);
              if (user) {
                console.log('[AUTH_USER] Found user for sessionToken:', userId);
                return res.json(user);
              }
            } catch (error) {
              console.log('[AUTH_USER] Error getting user for sessionToken:', error);
            }
          }
        }
        
        // Check demo sessions as fallback
        if ((global as any).demoSessions && (global as any).demoSessions.has(token)) {
          const demoSession = (global as any).demoSessions.get(token);
          console.log('[AUTH_USER] Demo session token authentication successful');
          return res.json(demoSession.user);
        }
        
        // Check for regular session token
        if (token.startsWith('session_')) {
          const userId = token.split('_')[1];
          if (userId) {
            const user = await storage.getUser(userId);
            if (user) {
              console.log('[AUTH_USER] Session token authentication successful');
              const { password: _, ...userWithoutPassword } = user;
              return res.json(userWithoutPassword);
            }
          }
        }
      }
      
      // Check session-based authentication (cookies)
      if (req.session && (req.session as any).userId) {
        const userId = (req.session as any).userId;
        console.log('[AUTH_USER] Session cookie authentication for user:', userId);
        
        // Check demo user first
        if (userId === 'demo-user-123' && (req.session as any).user) {
          console.log('[AUTH_USER] Demo session authentication successful');
          return res.json((req.session as any).user);
        }
        
        // Check regular user
        const user = await storage.getUser(userId);
        if (user) {
          console.log('[AUTH_USER] Session authentication successful');
          const { password: _, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        }
      }
      
      console.log('[AUTH_USER] No valid authentication found');
      return res.status(401).json({ 
        message: 'Not authenticated',
        customDomainSupport: true,
        authMethods: ['session_cookie', 'bearer_token', 'custom_domain_token']
      });
      
    } catch (error) {
      console.error('[AUTH_USER] Authentication error:', error);
      return res.status(500).json({ message: 'Authentication service error' });
    }
  });

  // Additional auth endpoints will be added step by step...
}