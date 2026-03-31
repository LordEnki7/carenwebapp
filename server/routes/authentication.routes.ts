import type { Express } from 'express';
import { getCurrentUser, addUser, findUserByEmail, setUserAuthenticated, resetUserState } from '../demoState';
import { storage } from '../storage';
import { sendDirectWelcomeEmail } from '../emailServiceDirect';
import bcrypt from 'bcryptjs';

/**
 * Authentication Routes Module
 * Handles user authentication, session management, demo mode, and related security features
 */
export function registerAuthenticationRoutes(app: Express) {
  console.log('[ROUTES] Registering authentication routes...');

  // New user registration endpoint
  app.post('/api/auth/register', async (req: any, res) => {
    try {
      const { firstName, lastName, email, password, phone, preferredLanguage, agreeToTerms, agreeToPrivacy, agreeToEULA } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      if (!agreeToTerms || !agreeToPrivacy || !agreeToEULA) {
        return res.status(400).json({ success: false, message: 'You must agree to all legal documents' });
      }

      console.log('[REGISTER] Registration attempt for:', email);

      // Check if user already exists in storage
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in instead.' });
      }

      // Check database
      try {
        const dbExisting = await storage.getUserByEmail(email);
        if (dbExisting) {
          return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in instead.' });
        }
      } catch (dbCheckErr) {
        console.warn('[REGISTER] DB check error (non-fatal):', dbCheckErr);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate a UUID for the new user (schema requires explicit ID)
      const { v4: uuidv4 } = await import('uuid');
      const newUserId = uuidv4();

      // Create user in database
      let newUser: any;
      try {
        newUser = await storage.createUser({
          id: newUserId,
          email,
          password: hashedPassword,
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || null,
          preferredLanguage: preferredLanguage || 'en',
          subscriptionTier: 'free',
          agreedToTerms: true,
          termsAgreedAt: new Date(),
        });
        console.log('[REGISTER] User created in database:', newUser.id);
      } catch (dbErr) {
        console.error('[REGISTER] DB create error, falling back to in-memory:', dbErr);
        // Fallback: create a minimal in-memory user object
        newUser = {
          id: newUserId,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || null,
          preferredLanguage: preferredLanguage || 'en',
          subscriptionTier: 'free',
          agreedToTerms: true,
          termsAgreedAt: new Date(),
          role: 'user',
        };
      }

      // Also add to in-memory store for session lookups
      try {
        addUser(email, password, { firstName, lastName, id: newUser.id });
      } catch {}

      // Set session
      (req.session as any).userId = newUser.id;
      (req.session as any).user = newUser;
      (req.session as any).isAuthenticated = true;
      (req.session as any).authMethod = 'password';

      req.session.save(async (saveErr: any) => {
        if (saveErr) {
          console.error('[REGISTER] Session save error:', saveErr);
        }

        // Send welcome email (non-blocking)
        try {
          await sendDirectWelcomeEmail(email, firstName || 'User');
        } catch (emailErr) {
          console.warn('[REGISTER] Welcome email failed (non-fatal):', emailErr);
        }

        const sessionToken = `cdt_${newUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { password: _, ...userWithoutPassword } = newUser;

        console.log('[REGISTER] Registration successful for:', email);
        return res.status(201).json({
          success: true,
          user: userWithoutPassword,
          sessionToken,
          message: 'Account created successfully'
        });
      });
    } catch (error) {
      console.error('[REGISTER] Registration error:', error);
      res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  });

  // Rate limit reset endpoint for development
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

  // Regular logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    try {
      console.log('[LOGOUT] Processing logout request');
      
      // Clear session
      req.session.destroy((err) => {
        if (err) {
          console.error('[LOGOUT] Session destroy error:', err);
          return res.status(500).json({
            success: false,
            message: 'Logout failed'
          });
        }
        
        // Clear session cookie
        res.clearCookie('caren.sid');
        
        console.log('[LOGOUT] Logout successful');
        
        res.json({
          success: true,
          message: 'Logout successful'
        });
      });
    } catch (error) {
      console.error('[LOGOUT] Error during logout:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  });

  // Demo logout endpoint  
  app.get('/api/auth/demo-logout', (req, res) => {
    try {
      console.log('[DEMO_LOGOUT] Processing demo logout request');
      
      // Clear demo authentication state
      setUserAuthenticated(false, null, null);
      
      // Clear session
      req.session.destroy((err) => {
        if (err) {
          console.error('[DEMO_LOGOUT] Session destroy error:', err);
        }
        
        // Clear session cookie
        res.clearCookie('caren.sid');
        
        console.log('[DEMO_LOGOUT] Demo logout successful');
        
        res.json({
          success: true,
          message: 'Demo logout successful'
        });
      });
    } catch (error) {
      console.error('[DEMO_LOGOUT] Error during demo logout:', error);
      res.status(500).json({
        success: false,
        message: 'Demo logout failed'
      });
    }
  });

  // User language preference endpoint
  app.patch('/api/user/language', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { language } = req.body;
      if (!language || !['en', 'es'].includes(language)) {
        return res.status(400).json({ message: 'Invalid language. Must be "en" or "es"' });
      }

      // Update user language in storage
      const updatedUser = await storage.updateUserLanguage(currentUser.id, language);
      
      // Update current user state
      setUserAuthenticated(true, updatedUser, new Date());

      res.json({
        success: true,
        language: updatedUser.preferredLanguage,
        message: 'Language preference updated successfully'
      });
    } catch (error) {
      console.error('Update language error:', error);
      res.status(500).json({ message: 'Failed to update language preference' });
    }
  });

  // Accept terms endpoint
  app.post('/api/auth/accept-terms', async (req: any, res) => {
    try {
      // For demo purposes, simulate terms acceptance and update mock user
      const acceptedAt = new Date();
      setUserAuthenticated(true, null, acceptedAt);
      const acceptedTerms = {
        agreedToTerms: true,
        termsAgreedAt: acceptedAt,
        success: true
      };
      
      // In a real implementation, this would update the database
      // For demo, we'll just return success
      res.json(acceptedTerms);
    } catch (error) {
      console.error("Error accepting terms:", error);
      res.status(500).json({ message: "Failed to accept terms" });
    }
  });

  // Clear sessions endpoint
  app.post('/api/auth/clear-sessions', (req, res) => {
    try {
      console.log('[CLEAR_SESSIONS] Clearing all session data');
      
      // Clear in-memory demo sessions
      if (global.demoSessions) {
        global.demoSessions.clear();
      }
      
      // Clear demo state
      setUserAuthenticated(false, null, null);
      resetUserState();
      
      // Clear browser session
      req.session.destroy((err) => {
        if (err) {
          console.error('[CLEAR_SESSIONS] Error destroying session:', err);
        }
        
        // Clear session cookies
        res.clearCookie('caren.sid');
        res.clearCookie('connect.sid');
        
        console.log('[CLEAR_SESSIONS] All session data cleared successfully');
        
        res.json({
          success: true,
          message: 'All session data cleared',
          cleared: {
            demoSessions: true,
            demoState: true,
            browserSession: true,
            cookies: true
          }
        });
      });
    } catch (error) {
      console.error('[CLEAR_SESSIONS] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear session data'
      });
    }
  });

  // Session management endpoint
  app.get('/api/auth/sessions', async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      // In a real implementation, you'd query a sessions database table
      // For now, return current session info
      const sessions = [
        {
          id: req.session.id || 'current',
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop',
          browser: req.headers['user-agent']?.split(' ')[0] || 'Unknown Browser',
          location: 'Your Location', // Would use IP geolocation in production
          ip: req.ip || req.connection.remoteAddress || 'Unknown',
          lastActive: new Date().toISOString(),
          isCurrent: true
        }
      ];

      res.json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  });

  // Login history endpoint
  app.get('/api/auth/login-history', async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      // In a real implementation, you'd query a login_history database table
      const history = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop',
          browser: req.headers['user-agent']?.split(' ')[0] || 'Unknown Browser',
          location: 'Your Location',
          ip: req.ip || req.connection.remoteAddress || 'Unknown',
          success: true
        }
      ];

      res.json(history);
    } catch (error) {
      console.error('Error fetching login history:', error);
      res.status(500).json({ message: 'Failed to fetch login history' });
    }
  });

  // Delete specific session endpoint
  app.delete('/api/auth/sessions/:sessionId', async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { sessionId } = req.params;
      
      // In a real implementation, you'd delete the specific session from database
      // and invalidate it on the session store
      
      res.json({ message: 'Session revoked successfully' });
    } catch (error) {
      console.error('Error revoking session:', error);
      res.status(500).json({ message: 'Failed to revoke session' });
    }
  });

  // Delete all sessions endpoint
  app.delete('/api/auth/sessions/all', async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      // In a real implementation, you'd delete all user sessions from database
      // except the current one, and invalidate them on the session store
      
      res.json({ message: 'All other sessions revoked successfully' });
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      res.status(500).json({ message: 'Failed to revoke all sessions' });
    }
  });

  console.log('[ROUTES] Authentication routes registered successfully');
}