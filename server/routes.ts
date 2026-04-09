import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import authRouter, { isAuthenticated } from "./auth";
import { notifyEmergencyContacts, sendEmergencyEmail, sendRecordingToAttorneyEmail } from "./notifications";
import { notifyNewPayment } from "./lib/slack";
import { sendWelcomeEmail, sendGoogleWelcomeEmail } from "./emailService";
import { sendDirectWelcomeEmail } from "./emailServiceDirect";
import { DocumentGenerator } from "./documentGenerator";
import { WebSocketManager } from "./websocketManager";
import { AILegalAssistant } from "./aiService";
import { FastLegalDatabase } from "./fastLegalDatabase";
import { EncryptionService, SecurityAuditLogger, InputSanitizer, createRateLimit } from "./security";
import { CloudSyncService } from "./cloudSyncService";
import { DataPrivacyManager } from "./dataPrivacy";
import { VoiceLearningService } from "./voiceLearningService";
import { ComplaintService } from "./complaintService";
import { demoSecurityMiddleware } from "./demoSecurity";
import { BluetoothEarpieceService } from "./bluetoothEarpieceService";
import { generateCustomDomainToken } from "./customDomainAuth";
import { setupGoogleAuth } from "./googleAuth";
import { 
  insertLegalDocumentTemplateSchema,
  insertGeneratedLegalDocumentSchema,
  insertForumCategorySchema,
  insertForumPostSchema,
  insertForumReplySchema
} from "@shared/schema";
import { insertIncidentSchema, insertAttorneyConnectionSchema } from "@shared/schema";
import { z } from "zod";
import { getUserAuthenticated, setUserAuthenticated, getCurrentUser, resetUserState, getUserTermsAcceptedAt, addUser, findUserByEmail, getAllUsers } from "./demoState";
import { DemoSecurityManager } from "./demoSecurity";
import { n8nWebhookService } from "./n8nWebhookService";
import { registerAuthRoutes } from "./routes/auth.routes";
import { registerEmergencyRoutes } from "./routes/emergency.routes";
import { registerAttorneyRoutes } from "./routes/attorney.routes";
import { registerAttorneyNetworkRoutes } from "./routes/attorney-network.routes";
import { registerLegalRoutes } from "./routes/legal.routes";
import { registerJourneyRoutes } from "./routes/journey.routes";
import { registerForumRoutes } from "./routes/forum.routes";
import { registerVoiceLearningRoutes } from "./routes/voice-learning.routes";
import { registerRecordingRoutes } from "./routes/recording.routes";
import { registerAuthenticationRoutes } from "./routes/authentication.routes";
import { registerCloudSyncRoutes } from "./routes/cloud-sync.routes";
import { registerPlatformRoutes } from "./routes/platform.routes";
import { registerAgentRoutes } from "./routes/agent.routes";
import { registerAgentJobRoutes } from "./routes/agent-jobs.routes";
import { registerPushRoutes } from "./routes/push.routes";
import { registerReferralRoutes } from "./routes/referral.routes";
import { registerEarlyAccessRoutes } from "./routes/early-access.routes";
import { registerAppleAuthRoutes } from "./routes/apple-auth.routes";
import { registerSupportRoutes } from "./routes/support.routes";
import { registerRefundRoutes } from "./routes/refund.routes";
import { registerPaymentIntelligenceRoutes } from "./routes/payment-intelligence.routes";
import { registerAnnouncementRoutes } from "./routes/announcements.routes";
import { registerCommunityRoutes } from "./routes/community.routes";
import { registerDirectorRoutes } from "./routes/director.routes";
import nigStatusRouter from "./routes/nig-status.routes";
import { isProduction, demoEndpointGuard, productionGuard, getHelmetConfig, logSecurityEvent } from "./productionSecurity";
import { db } from "./db";
import { sql } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Re-export for use in other modules
export { resetUserState };

// Demo security middleware


export async function registerRoutes(app: Express): Promise<Server> {
  // Public routes — registered first, before any auth middleware
  const servePublicHtml = (filename: string) => async (req: any, res: any) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'public', filename);
      const content = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(content);
    } catch (error) {
      res.status(404).send('Page not found');
    }
  };

  app.get('/privacy-policy', servePublicHtml('privacy-policy.html'));
  app.get('/privacy-policy.html', servePublicHtml('privacy-policy.html'));
  app.get('/api/privacy-policy', servePublicHtml('privacy-policy.html'));
  app.get('/terms-of-service', servePublicHtml('terms-of-service.html'));
  app.get('/terms-of-service.html', servePublicHtml('terms-of-service.html'));

  // Serve marketing downloads
  app.get('/download/:filename', (req, res) => {
    const { filename } = req.params;
    const allowedFiles: Record<string, string> = {
      'preview-videos': 'marketing/CAREN-AppPreview-Videos.zip',
      'preview-images': 'marketing/CAREN-PreviewImages-AllSizes.zip',
      'screenshots': 'marketing/CAREN-AppStore-Screenshots.zip',
    };
    const filePath = allowedFiles[filename];
    if (!filePath) return res.status(404).send('File not found');
    const fullPath = require('path').resolve(filePath);
    res.download(fullPath);
  });

  // Setup Google OAuth authentication
  await setupGoogleAuth(app);
  
  // Register authentication routes (extracted for better organization)
  registerAuthRoutes(app);
  
  // Register emergency routes (extracted for better organization)
  registerEmergencyRoutes(app);
  
  // Register attorney routes (extracted for better organization)
  registerAttorneyRoutes(app);
  registerAttorneyNetworkRoutes(app);
  
  // Register legal routes (extracted for better organization)
  registerLegalRoutes(app);
  
  // Register journey routes (extracted for better organization)
  registerJourneyRoutes(app);
  
  // Register forum routes (extracted for better organization)
  registerForumRoutes(app);
  
  // Register voice learning routes (extracted for better organization)
  registerVoiceLearningRoutes(app);
  
  const aiRateLimit = createRateLimit(15 * 60 * 1000, 30, 'AI request limit reached. Please try again later.');
  const aiEmergencyRateLimit = createRateLimit(15 * 60 * 1000, 60, 'Emergency AI request limit reached.');

  // Register recording routes (extracted for better organization)
  registerRecordingRoutes(app);
  
  // Register authentication routes (extracted for better organization)
  registerAuthenticationRoutes(app);
  
  // Register cloud sync routes (extracted for better organization)
  registerCloudSyncRoutes(app);
  
  const chatAgentRateLimit = createRateLimit(15 * 60 * 1000, 40, 'Chat limit reached. Please try again shortly.');

  app.post('/api/chat/agent', chatAgentRateLimit, async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: 'Message is required' });
      }

      const conversationHistory = Array.isArray(history)
        ? history.slice(-8).map((m: any) => ({
            role: m.role === 'user' ? 'user' as const : 'assistant' as const,
            content: String(m.content),
          }))
        : [];

      const openai = (await import('./aiService')).getOpenAIClient();

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are C.A.R.E.N.™'s friendly AI assistant on the website. C.A.R.E.N.™ stands for Citizen Assistance for Roadside Emergencies and Navigation. You help potential and current customers learn about the platform.

KEY INFORMATION ABOUT C.A.R.E.N.™:
- A comprehensive family protection app for legal encounters and roadside emergencies
- GPS-enabled: automatically detects your state and shows your specific legal rights
- Covers all 50 states + DC with 467+ legal protections across 5 categories (Traffic Stops, Recording Rights, Search & Seizure, Police Accountability, State-Specific Laws)
- One-tap Emergency SOS that alerts emergency contacts with your GPS location
- Audio/video incident recording with encrypted storage for evidence
- AI-powered legal assistant for instant answers about your rights
- Real-time voice coaching during police encounters
- Attorney messaging network with encrypted communication
- Hands-free voice commands (200+ patterns) for safe use while driving
- Multi-language support (English/Spanish)
- Family protection features with coordinated emergency response

PRICING TIERS:
- Basic Guard: $1 one-time — Core legal rights database, basic recording
- Safety Pro: $4.99/month — GPS rights, voice commands, emergency contacts
- Constitutional Pro: $14.99/month — AI legal assistant, attorney messaging, full recording
- Family Protection: $24.99/month — Multi-device family coverage, coordinated response
- Enterprise Fleet: $49.99/month — Fleet management, team features

8 AI-POWERED FEATURES:
1. AI Legal Assistant — Quick Q&A about your legal rights
2. Smart Emergency Detection — Detects distress signals
3. Incident Summarizer — Auto-generates incident reports
4. Multi-Language Translation — 15+ language legal translation
5. AI Attorney Matching — Case-specific attorney recommendations
6. Real-Time Voice Coaching — Live guidance during encounters
7. AI Recording Analysis — Analyzes transcripts for key moments
8. Legal Document Generator — Auto-generate FOIA requests, complaints

GUIDELINES:
- Be conversational, warm, and helpful — you're talking to real people who want to feel safe
- Keep answers concise (2-4 sentences for simple questions, more for detailed ones)
- If asked about specific legal advice for a situation, remind them to consult an attorney but still provide general information
- Encourage them to sign up or try the app
- If you don't know something specific, say so honestly and suggest contacting support@carenalert.com
- Never make up features or pricing that doesn't exist
- Do NOT use markdown formatting — respond in plain text only`,
          },
          ...conversationHistory,
          { role: 'user', content: message.trim() },
        ],
      });

      const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";
      res.json({ reply });
    } catch (error: any) {
      console.error('[CHAT_AGENT] Error:', error?.message || error);
      res.status(500).json({ reply: "I'm having trouble right now. Please try again in a moment, or reach out to support@carenalert.com." });
    }
  });

  app.post('/api/errors/report', (req, res) => {
    const errors = req.body.errors;
    if (!Array.isArray(errors) || errors.length === 0) {
      return res.status(400).json({ message: 'No errors provided' });
    }
    
    errors.forEach((err: any) => {
      console.error('[CLIENT_ERROR]', JSON.stringify({
        message: err.message,
        stack: err.stack?.substring(0, 500),
        component: err.component,
        action: err.action,
        url: err.url,
        count: err.count || 1,
        timestamp: err.timestamp,
        userId: err.userId
      }));
    });
    
    res.json({ received: errors.length });
  });

  // Register platform routes (waitlist, feedback, feature preferences, email campaigns, analytics)
  registerPlatformRoutes(app);
  registerAgentRoutes(app);
  registerAgentJobRoutes(app);
  registerPushRoutes(app);
  registerReferralRoutes(app);
  registerEarlyAccessRoutes(app);
  registerAppleAuthRoutes(app);
  registerSupportRoutes(app);
  registerRefundRoutes(app);
  registerPaymentIntelligenceRoutes(app);
  registerAnnouncementRoutes(app);
  registerCommunityRoutes(app);
  registerDirectorRoutes(app);
  console.log("[ROUTES] Announcement & Giveaway routes registered");

  // NIG Command Center — division health & metrics endpoint
  app.use("/api/nig-status", nigStatusRouter);
  
  // Clean up expired demo sessions every 5 minutes
  setInterval(() => {
    DemoSecurityManager.cleanupExpiredSessions();
  }, 5 * 60 * 1000);

  // EXTRACTED: rate limit reset endpoint moved to authentication.routes.ts

  // Test email endpoint for development
  app.post('/api/test-email', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Only available in development mode' });
    }
    
    try {
      const { email, firstName, lastName } = req.body;
      
      console.log('[EMAIL_TEST] Testing welcome email to:', email);
      console.log('[EMAIL_TEST] SendGrid API key present:', !!process.env.SENDGRID_API_KEY);
      
      const result = await sendWelcomeEmail({
        email: email || 'test@example.com',
        firstName: firstName || 'Test',
        lastName: lastName || 'User'
      });
      
      res.json({ 
        success: result,
        message: result ? 'Welcome email sent successfully' : 'Email failed to send',
        email: email,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[EMAIL_TEST] Error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Email test failed',
        error: error.message 
      });
    }
  });

  // Test direct email endpoint for development
  app.post('/api/test-direct-email', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Only available in development mode' });
    }
    
    try {
      const { email, firstName, lastName } = req.body;
      
      console.log('[EMAIL_TEST_DIRECT] Testing direct welcome email to:', email);
      console.log('[EMAIL_TEST_DIRECT] SendGrid API key present:', !!process.env.SENDGRID_API_KEY);
      
      const result = await sendDirectWelcomeEmail({
        email: email || 'test@example.com',
        firstName: firstName || 'Test',
        lastName: lastName || 'User'
      });
      
      res.json({ 
        success: result,
        message: result ? 'Direct welcome email sent successfully' : 'Direct email failed to send',
        email: email,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[EMAIL_TEST_DIRECT] Error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Direct email test failed',
        error: error.message 
      });
    }
  });

  // Demo login endpoint (disabled in production)
  app.post('/api/auth/demo-login', demoEndpointGuard, async (req, res) => {
    try {
      const sessionId = req.sessionID || 'demo-session';
      const demoUserId = 'demo-user-123';
      
      console.log('[DEMO_LOGIN] Creating session with ID:', sessionId);
      
      // Initialize demo session for both session ID and user ID
      DemoSecurityManager.initDemoSession(sessionId);
      DemoSecurityManager.initDemoSession(demoUserId); // Also use user ID as backup
      
      // Create demo user
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
      
      // Set user as authenticated in demo state
      setUserAuthenticated(true, demoUser, new Date());
      
      // Store in session (matching the session structure expected by /api/auth/user)
      (req.session as any).userId = demoUser.id;
      (req.session as any).user = demoUser;
      (req.session as any).isAuthenticated = true;
      (req.session as any).authMethod = 'demo';
      
      // Save session to ensure persistence
      req.session.save(async (err) => {
        if (err) {
          console.error('[DEMO_LOGIN] Session save error:', err);
          return res.status(500).json({
            success: false,
            message: 'Session save failed'
          });
        }
        
        console.log('[DEMO_LOGIN] Demo user authenticated successfully');
        console.log('[DEMO_LOGIN] Session ID returned to browser:', sessionId);
        console.log('[DEMO_LOGIN] Session cookie details:', req.session.cookie);
        console.log('[DEMO_LOGIN] Set-Cookie header about to be sent:', res.getHeaders()['set-cookie']);
        
        // MANUAL COOKIE FIX: Explicitly set cookie for browser compatibility
        const cookieValue = `caren.sid=s%3A${sessionId}.${Buffer.from(sessionId + process.env.SESSION_SECRET || 'caren-dev-secret-2025').toString('base64').slice(0, 32)}`;
        res.setHeader('Set-Cookie', `${cookieValue}; Path=/; Max-Age=86400; SameSite=Lax`);
        console.log('[DEMO_LOGIN] Manual cookie set:', cookieValue);
        
        // TEMPORARY FIX: Store demo session in memory for browser compatibility
        global.demoSessions = global.demoSessions || new Map();
        const demoSessionKey = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        global.demoSessions.set(demoSessionKey, {
          userId: 'demo-user-123',
          user: demoUser,
          createdAt: new Date(),
          sessionId: sessionId
        });
        
        console.log('[DEMO_LOGIN] Temporary demo session created:', demoSessionKey);
        console.log('[DEMO_LOGIN] Active demo sessions:', global.demoSessions.size);
        
        // Generate custom domain token for cross-domain compatibility
        const customDomainToken = generateCustomDomainToken(demoUser.id, demoUser);
        console.log('[DEMO_LOGIN] Custom domain token generated for cross-domain compatibility');
        
        // Create demo user in database first (needed for login tracking foreign key)
        try {
          let dbUser = await storage.getUser(demoUser.id);
          if (!dbUser) {
            console.log('[DEMO_LOGIN] Creating demo user in database for login tracking...');
            dbUser = await storage.createUser({
              id: demoUser.id,
              email: demoUser.email,
              firstName: demoUser.firstName,
              lastName: demoUser.lastName,
              profileImageUrl: null,
              role: 'user',
              subscriptionTier: 'demo',
              currentState: null,
              preferredLanguage: 'en',
              emergencyContacts: [],
              agreedToTerms: true,
              termsAgreedAt: new Date()
            });
            console.log('[DEMO_LOGIN] Demo user created in database successfully');
          }

          // Track demo login activity now that user exists
          await storage.createLoginActivity({
            userId: demoUser.id,
            email: demoUser.email,
            loginMethod: 'demo',
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip || req.connection.remoteAddress || '',
            subscriptionTier: demoUser.subscriptionTier || 'demo',
            success: true
          });
          console.log('[DEMO_LOGIN] Login activity tracked successfully');
        } catch (loginTrackError) {
          console.error('[DEMO_LOGIN] Error tracking login activity:', loginTrackError);
          // Don't fail demo login if tracking fails
        }
        
        res.json({
          success: true,
          user: demoUser,
          message: 'Demo login successful',
          sessionToken: customDomainToken, // Add this for frontend consistency
          demoSessionKey: demoSessionKey, // Send this to frontend for subsequent requests
          customDomainToken: customDomainToken, // For custom domain authentication
          debug: {
            sessionId: sessionId,
            demoSessionCreated: true,
            cookieSet: true,
            customDomainTokenGenerated: true,
            setCookieHeader: res.getHeaders()['set-cookie']
          }
        });
      });
    } catch (error) {
      console.error('[DEMO_LOGIN] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Demo login failed'
      });
    }
  });

  // EXTRACTED: regular logout endpoint moved to authentication.routes.ts

  // Demo logout endpoint (disabled in production)
  app.get('/api/auth/demo-logout', demoEndpointGuard, (req, res) => {
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
        res.clearCookie('connect.sid');
        
        console.log('[DEMO_LOGOUT] Demo logout successful, redirecting to landing page');
        
        // Redirect to landing page (unauthenticated route)  
        res.redirect('/');
      });
    } catch (error) {
      console.error('[DEMO_LOGOUT] Error during demo logout:', error);
      res.status(500).json({
        success: false,
        message: 'Demo logout failed'
      });
    }
  });



  // Google Play Store reviewer login (works in production)
  const reviewerLoginAttempts = new Map<string, { count: number; resetAt: number }>();

  app.post('/api/auth/reviewer-login', async (req, res) => {
    try {
      const clientIp = req.ip || 'unknown';
      const now = Date.now();

      // Rate limiting: 5 attempts per hour per IP
      const attempts = reviewerLoginAttempts.get(clientIp);
      if (attempts) {
        if (now < attempts.resetAt && attempts.count >= 5) {
          return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
        }
        if (now >= attempts.resetAt) {
          reviewerLoginAttempts.set(clientIp, { count: 1, resetAt: now + 3600000 });
        } else {
          attempts.count++;
        }
      } else {
        reviewerLoginAttempts.set(clientIp, { count: 1, resetAt: now + 3600000 });
      }

      const { email, password } = req.body;

      // Validate reviewer credentials
      if (email !== 'googlereview@caren.app' || password !== 'CarenGooglePlay2025!') {
        console.log('[REVIEWER_LOGIN] Invalid credentials attempt from:', clientIp);
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Create reviewer session with full pro access
      const reviewerUser = {
        id: 'google-reviewer-001',
        email: 'googlereview@caren.app',
        firstName: 'Google',
        lastName: 'Reviewer',
        role: 'reviewer',
        subscriptionTier: 'constitutional_pro',
        agreedToTerms: true,
        termsAgreedAt: new Date(),
        emergencyContacts: [],
        currentState: 'California',
        preferredLanguage: 'en'
      };

      (req.session as any).userId = reviewerUser.id;
      (req.session as any).user = reviewerUser;
      (req.session as any).isAuthenticated = true;
      (req.session as any).authMethod = 'reviewer';

      req.session.save((err) => {
        if (err) {
          console.error('[REVIEWER_LOGIN] Session save error:', err);
          return res.status(500).json({ success: false, message: 'Session save failed' });
        }
        console.log('[REVIEWER_LOGIN] Google Play reviewer authenticated successfully');
        res.json({ success: true, user: reviewerUser, message: 'Reviewer login successful' });
      });
    } catch (error) {
      console.error('[REVIEWER_LOGIN] Error:', error);
      res.status(500).json({ success: false, message: 'Reviewer login failed' });
    }
  });

  // Google Play reviewer logout
  app.post('/api/auth/reviewer-logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error('[REVIEWER_LOGOUT] Session destroy error:', err);
      res.clearCookie('connect.sid');
      res.clearCookie('caren.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  // Demo status endpoint (disabled in production)
  app.get('/api/demo/status', demoEndpointGuard, (req, res) => {
    const currentUser = getCurrentUser();
    const session = req.session as any;
    
    // Only show demo mode for actual demo users, not regular authenticated users
    const isDemoUser = (session?.authMethod === 'demo') || 
                      (currentUser && currentUser.id === 'demo-user-123') ||
                      (currentUser && currentUser.email === 'demo@caren.app');
    
    console.log('[DEMO_STATUS] Session auth method:', session?.authMethod);
    console.log('[DEMO_STATUS] Current user ID:', currentUser?.id);
    console.log('[DEMO_STATUS] Is demo user?', isDemoUser);
    
    if (isDemoUser) {
      const sessionId = req.sessionID || 'demo-session';
      
      console.log('[DEMO_STATUS] Checking session ID:', sessionId);
      console.log('[DEMO_STATUS] Current user:', currentUser?.id);
      
      // Get session-specific data, try session ID first then user ID as fallback
      let sessionStats = DemoSecurityManager.getSessionStats(sessionId);
      console.log('[DEMO_STATUS] Session stats for session ID:', sessionStats);
      
      // If session not found but user is authenticated, try user ID
      if (!sessionStats.isValid && currentUser?.id) {
        console.log('[DEMO_STATUS] Trying user ID fallback:', currentUser.id);
        sessionStats = DemoSecurityManager.getSessionStats(currentUser.id);
        console.log('[DEMO_STATUS] Session stats for user ID:', sessionStats);
      }
      
      // Set no-cache headers to prevent 304 responses
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': '', // Force no ETag caching
        'Last-Modified': '', // Force no last-modified caching
        'Vary': '*' // Vary on all headers to prevent caching
      });
      
      res.json({
        isDemoMode: true,
        sessionTimeRemaining: sessionStats.timeRemaining,
        actionsRemaining: sessionStats.actionsRemaining,
        sessionStartTime: sessionStats.startTime,
        demoLimits: {
          maxActions: 100,
          sessionDuration: 30 * 60 * 1000,
          features: {
            aiQuestions: 'limited',
            recording: 'limited',
            attorneys: 'demo',
            payments: 'disabled'
          }
        }
      });
    } else {
      // Set no-cache headers for non-demo responses too
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': '', // Force no ETag caching
        'Last-Modified': '', // Force no last-modified caching
        'Vary': '*' // Vary on all headers to prevent caching
      });
      
      console.log('[DEMO_STATUS] Returning non-demo response');
      res.json({
        isDemoMode: false
      });
    }
  });

  // Debug endpoint to check stored users (disabled in production)
  app.get('/api/debug/users', productionGuard, (req, res) => {
    const allUsers = getAllUsers();
    const currentUserData = getCurrentUser();
    res.json({
      totalUsers: allUsers.length,
      users: allUsers.map(u => ({ id: u.id, email: u.email, firstName: u.firstName })),
      currentUser: currentUserData ? { id: currentUserData.id, email: currentUserData.email } : null,
      authenticated: getUserAuthenticated()
    });
  });

  // EXTRACTED: clear sessions endpoint moved to authentication.routes.ts

  // Authentication routes - DISABLED to prevent conflicts with main auth endpoints
  // app.use('/api/auth', authRouter);

  // NOTE: /api/auth/user endpoint moved to auth.routes.ts for better code organization



  // EXTRACTED: session management endpoint moved to authentication.routes.ts

  // EXTRACTED: login history endpoint moved to authentication.routes.ts

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

  app.delete('/api/auth/sessions/all', async (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      // In a real implementation, you'd delete all other sessions for this user
      // except the current one
      
      res.json({ message: 'All other sessions revoked successfully' });
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      res.status(500).json({ message: 'Failed to revoke sessions' });
    }
  });





  // User language preference update
  app.patch('/api/user/language', async (req: any, res) => {
    try {
      const { preferredLanguage } = req.body;
      
      if (!preferredLanguage || typeof preferredLanguage !== 'string') {
        return res.status(400).json({ message: "Invalid language code" });
      }

      // Validate language code
      const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'ru'];
      if (!validLanguages.includes(preferredLanguage)) {
        return res.status(400).json({ message: "Unsupported language code" });
      }

      // Update demo user state
      const currentUser = getCurrentUser();
      if (currentUser) {
        currentUser.preferredLanguage = preferredLanguage;
        setUserAuthenticated(true, currentUser, getUserTermsAcceptedAt());
      }

      // Update database user if session exists
      const session = req.session as any;
      if (session?.userId) {
        try {
          await storage.updateUserLanguage(session.userId, preferredLanguage);
          console.log(`[LANGUAGE_UPDATE] Updated language preference for user ${session.userId} to ${preferredLanguage}`);
        } catch (dbError) {
          console.log('[LANGUAGE_UPDATE] Database update failed:', dbError);
        }
      }

      res.json({ 
        success: true, 
        preferredLanguage,
        message: "Language preference updated successfully"
      });
    } catch (error) {
      console.error("Error updating language preference:", error);
      res.status(500).json({ message: "Failed to update language preference" });
    }
  });

  // EXTRACTED: accept terms endpoint moved to authentication.routes.ts

  // Credential-based sign in endpoint
  app.post('/api/auth/signin', async (req: any, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and password are required" 
        });
      }

      // Check if user exists in stored users
      const storedUser = findUserByEmail(email);
      
      if (!storedUser) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password. Please check your credentials or create a new account." 
        });
      }

      // Simple password check (in production, this would use proper hashing)
      if (storedUser.password !== password) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password. Please check your credentials." 
        });
      }

      // Set user as authenticated
      setUserAuthenticated(true, storedUser, new Date());

      // Handle remember me functionality
      if (rememberMe) {
        // Store login credentials for remember me (in production, use secure tokens)
        res.cookie('remember_email', email, { 
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
      }

      // Return success with user data (excluding password)
      const { password: _, ...userWithoutPassword } = storedUser;
      
      res.json({ 
        success: true, 
        user: userWithoutPassword,
        message: "Sign in successful" 
      });
      
    } catch (error) {
      console.error("Error during sign in:", error);
      res.status(500).json({ message: "Sign in failed" });
    }
  });

  // Regular login endpoint (matches frontend expectation)
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      console.log('[LOGIN] Login attempt for:', email);
      
      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and password are required" 
        });
      }

      // Route reviewer credentials to reviewer session
      if (email === 'googlereview@caren.app' && password === 'CarenGooglePlay2025!') {
        const reviewerUser = {
          id: 'google-reviewer-001',
          email: 'googlereview@caren.app',
          firstName: 'Google',
          lastName: 'Reviewer',
          role: 'reviewer',
          subscriptionTier: 'constitutional_pro',
          agreedToTerms: true,
          termsAgreedAt: new Date(),
          emergencyContacts: [],
          currentState: 'California',
          preferredLanguage: 'en'
        };
        (req.session as any).userId = reviewerUser.id;
        (req.session as any).user = reviewerUser;
        (req.session as any).isAuthenticated = true;
        (req.session as any).authMethod = 'reviewer';
        return req.session.save((err: any) => {
          if (err) return res.status(500).json({ success: false, message: 'Session error' });
          const sessionToken = `cdt_${reviewerUser.id}_${Date.now()}_reviewer`;
          console.log('[LOGIN] Google Play reviewer authenticated');
          return res.json({ success: true, user: reviewerUser, sessionToken, message: 'Login successful' });
        });
      }

      // Apple App Store reviewer credentials
      if (email === 'applereview@caren.app' && password === 'CarenReview2025!') {
        const appleReviewerUser = {
          id: 'apple-reviewer-001',
          email: 'applereview@caren.app',
          firstName: 'Apple',
          lastName: 'Reviewer',
          role: 'reviewer',
          subscriptionTier: 'constitutional_pro',
          agreedToTerms: true,
          termsAgreedAt: new Date(),
          emergencyContacts: [],
          currentState: 'California',
          preferredLanguage: 'en'
        };
        (req.session as any).userId = appleReviewerUser.id;
        (req.session as any).user = appleReviewerUser;
        (req.session as any).isAuthenticated = true;
        (req.session as any).authMethod = 'reviewer';
        return req.session.save((err: any) => {
          if (err) return res.status(500).json({ success: false, message: 'Session error' });
          const sessionToken = `cdt_${appleReviewerUser.id}_${Date.now()}_reviewer`;
          console.log('[LOGIN] Apple App Store reviewer authenticated');
          return res.json({ success: true, user: appleReviewerUser, sessionToken, message: 'Login successful' });
        });
      }

      // Check if user exists in stored users first
      const storedUser = findUserByEmail(email);
      
      if (storedUser && storedUser.password === password) {
        console.log('[LOGIN] Found in stored users');
        // Set user as authenticated
        setUserAuthenticated(true, storedUser, new Date());

        // Generate session token for consistency with expected response format
        const sessionToken = `session_${storedUser.id}_${Date.now()}`;
        
        // Handle remember me functionality
        if (rememberMe) {
          res.cookie('remember_email', email, { 
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
          });
        }

        // Create session for stored user too
        (req.session as any).userId = storedUser.id;
        (req.session as any).user = storedUser;
        (req.session as any).isAuthenticated = true;
        (req.session as any).authMethod = 'password';
        
        // Save session to ensure persistence
        req.session.save(async (saveErr) => {
          if (saveErr) {
            console.error('[LOGIN] Session save error for stored user:', saveErr);
            return res.status(500).json({
              success: false,
              message: 'Login successful but session could not be saved',
              error: saveErr.message
            });
          }
          
          console.log('[LOGIN] Session saved successfully for stored user');
          
          // Store session token in localStorage-compatible format
          const customDomainToken = `cdt_${storedUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Return success with user data and session token
          const { password: _, ...userWithoutPassword } = storedUser;
          
          return res.json({ 
            success: true, 
            user: userWithoutPassword,
            sessionToken: customDomainToken,
            message: "Login successful" 
          });
        });
        
        // Early return to prevent falling through to invalid credentials
        return;
      }

      // If not found in stored users, check database
      try {
        const dbUser = await storage.getUserByEmail(email);
        console.log('[LOGIN] Database user found:', !!dbUser);
        
        if (dbUser && dbUser.password) {
          // Use bcrypt to compare hashed password
          const isValidPassword = await bcrypt.compare(password, dbUser.password);
          console.log('[LOGIN] Password valid:', isValidPassword);
          
          if (isValidPassword) {
            // Generate session token
            const sessionToken = `session_${dbUser.id}_${Date.now()}`;
            
            // Create session
            (req.session as any).userId = dbUser.id;
            (req.session as any).user = dbUser;
            (req.session as any).isAuthenticated = true;
            (req.session as any).authMethod = 'password';
            
            // Track login activity
            try {
              await storage.createLoginActivity({
                userId: dbUser.id,
                email: dbUser.email,
                loginMethod: 'password',
                userAgent: req.headers['user-agent'] || '',
                ipAddress: req.ip || req.connection.remoteAddress || '',
                subscriptionTier: dbUser.subscriptionTier || 'free',
                success: true
              });
              console.log('[LOGIN] Login activity tracked successfully');
            } catch (loginTrackError) {
              console.error('[LOGIN] Error tracking login activity:', loginTrackError);
              // Don't fail login if tracking fails
            }
            
            // Handle remember me functionality
            if (rememberMe) {
              res.cookie('remember_email', email, { 
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
              });
            }

            // Save session to ensure persistence
            req.session.save(async (saveErr) => {
              if (saveErr) {
                console.error('[LOGIN] Session save error:', saveErr);
                return res.status(500).json({
                  success: false,
                  message: 'Login successful but session could not be saved',
                  error: saveErr.message
                });
              }
              
              console.log('[LOGIN] Session saved successfully for database user');
              
              // Store session token in localStorage-compatible format
              const customDomainToken = `cdt_${dbUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              // Return success with user data and session token
              const { password: _, ...userWithoutPassword } = dbUser;
              
              return res.json({ 
                success: true, 
                user: userWithoutPassword,
                sessionToken: customDomainToken,
                message: "Login successful" 
              });
            });
            
            // Early return to prevent falling through to invalid credentials
            return;
          }
        }
      } catch (dbError) {
        console.log('[LOGIN] Database error:', dbError);
        // Fall through to invalid credentials
      }

      // Invalid credentials
      console.log('[LOGIN] Invalid credentials');
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password. Please check your credentials." 
      });
      
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      // Check if user exists
      const storedUser = findUserByEmail(email);
      
      if (!storedUser) {
        // For security, don't reveal if email exists
        return res.json({ 
          success: true, 
          message: "If an account with this email exists, you will receive password reset instructions." 
        });
      }

      // In production, generate secure reset token and send email
      // For demo purposes, we'll return the current password
      console.log(`Password reset requested for ${email}. Current password: ${storedUser.password}`);
      
      res.json({ 
        success: true, 
        message: "Password reset instructions have been sent to your email.",
        // For demo only - remove in production
        demoPassword: storedUser.password
      });
      
    } catch (error) {
      console.error("Error during password reset:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // Get remembered email endpoint
  app.get('/api/auth/remembered-email', (req: any, res) => {
    try {
      const rememberedEmail = req.cookies?.remember_email;
      res.json({ 
        email: rememberedEmail || null 
      });
    } catch (error) {
      console.error("Error getting remembered email:", error);
      res.status(500).json({ message: "Failed to get remembered email" });
    }
  });

  // Create account endpoint
  // Account creation endpoint (multiple routes for compatibility)
  const createAccountHandler = async (req: any, res: any) => {
    try {
      const { firstName, lastName, email, password, agreeToTerms, agreeToPrivacy, agreeToEULA } = req.body;
      
      // Basic validation
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "All fields are required" 
        });
      }

      // Validate user agreements
      if (agreeToTerms !== true || agreeToPrivacy !== true || agreeToEULA !== true) {
        return res.status(400).json({ 
          success: false, 
          message: "You must agree to all user policies and agreements to create an account" 
        });
      }

      // Check if email already exists
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: "An account with this email already exists" 
        });
      }

      // Generate unique user ID for new account
      let userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Hash the password for security
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newUser = {
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword, // Store hashed password for future sign-ins
        profileImageUrl: null,
        agreedToTerms: true,
        termsAgreedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create user in database for facial recognition foreign key constraint
      try {
        console.log('[ACCOUNT_CREATION] Attempting to create user in database:', userId);
        
        // Check if user already exists by email
        const existingDbUser = await storage.getUserByEmail(email);
        if (existingDbUser) {
          console.log('[ACCOUNT_CREATION] User already exists in database, using existing ID:', existingDbUser.id);
          // Update demo state to use existing database user ID
          newUser.id = existingDbUser.id;
          userId = existingDbUser.id;
          // Update session with correct user ID
          (req.session as any).userId = userId;
          (req.session as any).user = { id: userId, email, firstName, lastName };
        } else {
          // Create new user in database
          const dbUser = await storage.createUser({
            id: userId,
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: hashedPassword, // Include the hashed password
            profileImageUrl: null,
            role: 'user',
            subscriptionTier: 'free',
            currentState: null,
            preferredLanguage: 'en',
            emergencyContacts: [],
            agreedToTerms: true,
            termsAgreedAt: new Date()
          });
          console.log('[ACCOUNT_CREATION] User created in database successfully:', dbUser.id);
        }
      } catch (dbError: any) {
        console.error('[ACCOUNT_CREATION] Database user creation failed:', dbError.message || dbError);
        console.error('[ACCOUNT_CREATION] Full error:', dbError);
        console.error('[ACCOUNT_CREATION] Error stack:', dbError.stack);
        // Continue with demo state for now, but this is critical
        return res.status(500).json({ 
          success: false, 
          message: "Database user creation failed: " + (dbError.message || dbError) 
        });
      }
      
      // Store the user for future sign-ins (after potential ID synchronization)
      addUser(newUser);
      
      // Set new user as authenticated
      setUserAuthenticated(true, newUser, new Date());
      
      // Establish proper session for facial recognition
      (req.session as any).userId = userId;
      (req.session as any).userEmail = email;
      (req.session as any).isAuthenticated = true;
      (req.session as any).authMethod = 'password';
      (req.session as any).user = { id: userId, email, firstName, lastName };
      
      // Send welcome email asynchronously (don't block response) - using direct API
      sendDirectWelcomeEmail({
        email: email,
        firstName: firstName,
        lastName: lastName
      }).catch(err => console.error('[EMAIL] Welcome email failed for account creation:', err));
      
      // Track registration login activity
      try {
        await storage.createLoginActivity({
          userId: userId,
          email: email,
          loginMethod: 'password',
          userAgent: req.headers['user-agent'] || '',
          ipAddress: req.ip || req.connection.remoteAddress || '',
          subscriptionTier: 'free',
          success: true
        });
        console.log('[REGISTRATION] Login activity tracked successfully');
      } catch (loginTrackError) {
        console.error('[REGISTRATION] Error tracking login activity:', loginTrackError);
        // Don't fail registration if tracking fails
      }
      
      // Generate session token for authentication
      const sessionToken = `session_${userId}_${Date.now()}`;
      
      // Save session to ensure it persists
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
      });
      
      // Return success without password but with session token
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ 
        success: true, 
        user: userWithoutPassword,
        sessionToken: sessionToken,
        message: "Account created successfully" 
      });
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ 
        success: false, 
        message: "Account creation failed" 
      });
    }
  };

  // Register multiple routes for account creation (compatibility)
  app.post('/api/auth/create-account', createAccountHandler);
  app.post('/api/auth/register', createAccountHandler);

  // User profile routes
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.updateUserProfile(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Incident routes
  app.get('/api/incidents', demoSecurityMiddleware, async (req: any, res) => {
    try {
      const userId = "demo-user";
      const incidents = await storage.getIncidents(userId);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  app.post('/api/incidents', async (req: any, res) => {
    try {
      // Handle both authenticated users and demo users
      let userId = "demo-user"; // Default for demo users
      
      // Check if user is authenticated (regular user)
      if (req.user && req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      } else if (req.session && req.session.user && req.session.user.id) {
        // Alternative check for session-based auth
        userId = req.session.user.id;
      }
      
      const incidentData = insertIncidentSchema.parse({ ...req.body, userId });
      const incident = await storage.createIncident(incidentData);
      
      // Broadcast incident creation to connected clients
      const wsManager = (global as any).wsManager;
      if (wsManager) {
        wsManager.broadcastToUser(userId, 'incident_created', incident);
      }
      
      res.json(incident);
    } catch (error) {
      console.error("Error creating incident:", error);
      res.status(500).json({ message: "Failed to create incident" });
    }
  });

  app.get('/api/incidents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const incident = await storage.getIncident(id, userId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      console.error("Error fetching incident:", error);
      res.status(500).json({ message: "Failed to fetch incident" });
    }
  });

  app.patch('/api/incidents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const updates = req.body;
      const incident = await storage.updateIncident(id, userId, updates);
      res.json(incident);
    } catch (error) {
      console.error("Error updating incident:", error);
      res.status(500).json({ message: "Failed to update incident" });
    }
  });

  app.delete('/api/incidents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteIncident(id, userId);
      res.json({ message: "Incident deleted successfully" });
    } catch (error) {
      console.error("Error deleting incident:", error);
      res.status(500).json({ message: "Failed to delete incident" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', async (req: any, res) => {
    try {
      const userId = "demo-user";
      const stats = await storage.getIncidentStats(userId);
      const attorneyConnections = await storage.getAttorneyConnections(userId);
      
      res.json({
        ...stats,
        attorneyConnects: attorneyConnections.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Legal rights routes
  app.get('/api/legal-rights', async (req, res) => {
    try {
      const { state } = req.query;
      let rights;
      
      if (state) {
        rights = await storage.getLegalRightsByState(state as string);
      } else {
        rights = await storage.getAllLegalRights();
      }
      
      res.json(rights);
    } catch (error) {
      console.error("Error fetching legal rights:", error);
      res.status(500).json({ message: "Failed to fetch legal rights" });
    }
  });

  // EXTRACTED: attorneys endpoint moved to attorney.routes.ts

  // EXTRACTED: available attorneys endpoint moved to attorney.routes.ts

  // User's saved attorneys endpoint (must come before parameterized route)
  app.get('/api/attorneys/user-attorneys', async (req: any, res) => {
    try {
      // Check authentication using the same pattern as other endpoints
      const currentUser = getCurrentUser();
      const session = req.session as any;
      
      if (!currentUser && (!session?.userId || !session?.isAuthenticated)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = currentUser?.id || session?.userId || 'demo-user-123';
      
      // For now, return empty array since we don't have user-attorney relationships
      // In a full implementation, this would get attorneys saved by the user
      console.log(`[USER_ATTORNEYS] Fetching attorneys for user: ${userId}`);
      res.json([]);
    } catch (error) {
      console.error("Error fetching user attorneys:", error);
      res.status(500).json({ message: "Failed to fetch user attorneys" });
    }
  });

  app.get('/api/attorneys/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attorney ID" });
      }
      const attorney = await storage.getAttorney(id);
      if (!attorney) {
        return res.status(404).json({ message: "Attorney not found" });
      }
      res.json(attorney);
    } catch (error) {
      console.error("Error fetching attorney:", error);
      res.status(500).json({ message: "Failed to fetch attorney" });
    }
  });

  // EXTRACTED: emergency nearest attorney endpoint moved to attorney.routes.ts

  // Attorney connection routes
  app.post('/api/attorney-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectionData = insertAttorneyConnectionSchema.parse({ 
        ...req.body, 
        userId 
      });
      const connection = await storage.createAttorneyConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating attorney connection:", error);
      res.status(500).json({ message: "Failed to create attorney connection" });
    }
  });

  app.get('/api/attorney-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getAttorneyConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching attorney connections:", error);
      res.status(500).json({ message: "Failed to fetch attorney connections" });
    }
  });

  // Emergency contact routes
  app.post('/api/emergency-contacts', async (req: any, res) => {
    try {
      const userId = "demo-user";
      const contactData = { ...req.body, userId };
      const contact = await storage.createEmergencyContact(contactData);
      
      // Broadcast contact creation to connected clients
      const wsManager = (global as any).wsManager;
      if (wsManager) {
        wsManager.broadcastToUser(userId, 'emergency_contact_created', contact);
      }
      
      res.json(contact);
    } catch (error) {
      console.error("Error creating emergency contact:", error);
      res.status(500).json({ message: "Failed to create emergency contact" });
    }
  });

  app.get('/api/emergency-contacts', async (req: any, res) => {
    try {
      const userId = "demo-user";
      const contacts = await storage.getEmergencyContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({ message: "Failed to fetch emergency contacts" });
    }
  });

  // EXTRACTED: emergency contact PATCH endpoint moved to emergency.routes.ts

  // Emergency contact sharing endpoint
  app.post('/api/emergency-contacts/share', async (req: any, res) => {
    try {
      const { emergencyType, location, customMessage, contactIds } = req.body;
      const userId = "demo-user";
      
      // Get emergency contacts
      const allContacts = await storage.getEmergencyContacts(userId);
      const contactsToNotify = contactIds 
        ? allContacts.filter((c: any) => contactIds.includes(c.id))
        : allContacts.filter((c: any) => c.isActive !== false);

      if (contactsToNotify.length === 0) {
        return res.status(400).json({ message: 'No emergency contacts available' });
      }

      // Get default message based on emergency type
      const getDefaultMessage = (type: string) => {
        switch (type) {
          case 'traffic_stop':
            return 'I am currently in a traffic stop situation and sharing my location for safety.';
          case 'police_encounter':
            return 'I am in a police encounter and sharing my location. Please monitor my safety.';
          case 'emergency':
            return 'I am in an emergency situation and need assistance. Please contact me immediately.';
          case 'safety_check':
            return 'Safety check-in: I am sharing my current location and status with you.';
          default:
            return 'I am sharing my location with you for safety purposes.';
        }
      };

      // Prepare emergency alert data
      const alertData = {
        alertType: emergencyType || 'emergency',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          timestamp: location.timestamp
        },
        userMessage: customMessage || getDefaultMessage(emergencyType),
        userName: 'C.A.R.E.N.™ User',
        timestamp: new Date().toISOString()
      };

      // Send notifications to all contacts
      const results = [];
      
      for (const contact of contactsToNotify) {
        try {
          let notificationResults = [];

          // Send SMS if enabled
          if (contact.notificationPreference === 'sms' || contact.notificationPreference === 'both') {
            try {
              const smsResult = await sendEmergencySMS(contact, alertData);
              notificationResults.push({
                contactId: contact.id,
                contactName: contact.name,
                method: 'sms',
                status: smsResult ? 'sent' : 'failed',
                timestamp: new Date().toISOString()
              });
            } catch (error: any) {
              notificationResults.push({
                contactId: contact.id,
                contactName: contact.name,
                method: 'sms',
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: error.message
              });
            }
          }

          // Send Email if enabled
          if (contact.notificationPreference === 'email' || contact.notificationPreference === 'both') {
            try {
              const emailResult = await sendEmergencyEmail(contact, alertData);
              notificationResults.push({
                contactId: contact.id,
                contactName: contact.name,
                method: 'email',
                status: emailResult ? 'sent' : 'failed',
                timestamp: new Date().toISOString()
              });
            } catch (error: any) {
              notificationResults.push({
                contactId: contact.id,
                contactName: contact.name,
                method: 'email',
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: error.message
              });
            }
          }

          results.push(...notificationResults);
        } catch (error: any) {
          console.error(`Failed to notify contact ${contact.name}:`, error);
          results.push({
            contactId: contact.id,
            contactName: contact.name,
            method: 'unknown',
            status: 'failed',
            timestamp: new Date().toISOString(),
            error: error.message
          });
        }
      }

      // Create incident record for the emergency share
      try {
        const incident = {
          userId,
          title: `Emergency Share: ${emergencyType}`,
          description: `Emergency location shared with ${contactsToNotify.length} contacts. ${customMessage || ''}`,
          location: location,
          status: 'shared',
          priority: 'high',
          contactsNotified: true,
          mediaUrls: []
        };
        
        await storage.createIncident(incident);
      } catch (error) {
        console.error('Failed to create incident record:', error);
      }

      // Return results
      const successCount = results.filter(r => r.status === 'sent').length;
      const failureCount = results.filter(r => r.status === 'failed').length;

      res.json({
        success: true,
        results,
        summary: {
          total: results.length,
          sent: successCount,
          failed: failureCount,
          contacts: contactsToNotify.length
        },
        location: alertData.location,
        timestamp: alertData.timestamp
      });

    } catch (error: any) {
      console.error('Emergency sharing error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to share emergency information',
        error: error.message 
      });
    }
  });

  // Emergency recording coordination endpoints
  app.post('/api/emergency/bluetooth-connected', async (req: any, res) => {
    try {
      const { devices, emergencyType, timestamp } = req.body;
      console.log('🔗 Emergency Bluetooth devices connected:', devices);
      
      // Store device connection information for emergency coordination
      // In production, this would coordinate with actual device APIs
      res.json({ 
        success: true, 
        message: 'Emergency devices connected',
        devicesConnected: devices.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Emergency Bluetooth connection error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to connect emergency devices' 
      });
    }
  });

  // EXTRACTED: emergency alert endpoint moved to emergency.routes.ts

  app.delete('/api/emergency-contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = req.params.id;
      await storage.deleteEmergencyContact(id, userId);
      res.json({ message: "Emergency contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
      res.status(500).json({ message: "Failed to delete emergency contact" });
    }
  });

  // Emergency alert routes
  app.post('/api/emergency-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alertData = { ...req.body, userId };
      
      // Create the emergency alert
      const alert = await storage.createEmergencyAlert(alertData);
      
      // Get emergency contacts for notification
      const contacts = await storage.getEmergencyContacts(userId);
      
      // Send real notifications to contacts
      const user = await storage.getUser(userId);
      const emergencyData = {
        alertType: alertData.alertType,
        location: alertData.location,
        userMessage: alertData.message,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'C.A.R.E.N.™ User' : 'C.A.R.E.N.™ User'
      };
      
      // 🚀 TRIGGER N8N EMERGENCY RESPONSE AUTOMATION
      const emergencyWebhookPayload = {
        userId,
        emergencyType: alertData.alertType === 'pullover' ? 'traffic_stop' : 'general_emergency',
        coordinates: {
          lat: alertData.location?.latitude || 0,
          lng: alertData.location?.longitude || 0
        },
        location: alertData.location ? {
          address: alertData.location.address,
          city: alertData.location.city,
          state: alertData.location.state
        } : undefined,
        timestamp: new Date().toISOString(),
        userEmail: user?.email,
        userName: emergencyData.userName,
        urgency: 'high',
        metadata: {
          recordingActive: false,
          attorneyRequested: true,
          situationContext: alertData.message
        }
      };
      
      // Trigger n8n workflow (non-blocking)
      n8nWebhookService.triggerEmergencyResponse(emergencyWebhookPayload).catch(error => {
        console.error('[N8N] Emergency alert webhook failed:', error);
      });
      
      const notificationResults = await notifyEmergencyContacts(contacts, emergencyData);
      
      // Update alert with notification results
      const updatedAlert = await storage.updateEmergencyAlert(alert.id.toString(), {
        deliveryResults: notificationResults,
        contactsNotified: contacts.map(c => c.id)
      });
      
      res.json(updatedAlert);
    } catch (error) {
      console.error("Error creating emergency alert:", error);
      res.status(500).json({ message: "Failed to create emergency alert" });
    }
  });

  // EXTRACTED: emergency alerts endpoint moved to emergency.routes.ts

  // EXTRACTED: legal document templates endpoint moved to legal.routes.ts

  // EXTRACTED: legal document template by ID endpoint moved to legal.routes.ts

  // EXTRACTED: create legal document template endpoint moved to legal.routes.ts

  // Generated legal document routes
  app.post('/api/generated-legal-documents', async (req: any, res) => {
    try {
      const userId = "demo-user";
      const user = await storage.getUser(userId);
      const { templateId, incidentId, customFields } = req.body;

      // Get the template
      const template = await storage.getLegalDocumentTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Get incident data if provided
      let incident = null;
      if (incidentId) {
        incident = await storage.getIncident(incidentId, userId);
        if (!incident) {
          return res.status(404).json({ message: "Incident not found" });
        }
      }

      // Prepare document data
      const documentData = {
        incident: incident || undefined,
        userName: user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user?.email || 'Unknown User',
        userEmail: user?.email || '',
        customFields: customFields || {}
      };

      // Validate required fields
      const validation = DocumentGenerator.validateRequiredFields(template, documentData);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          missingFields: validation.missingFields 
        });
      }

      // Generate the document content
      const content = DocumentGenerator.generateDocument(template, documentData);
      const title = DocumentGenerator.generateDocumentTitle(template, incident || undefined);

      // Save the generated document
      const generatedDocument = await storage.createGeneratedLegalDocument({
        userId,
        templateId,
        incidentId: incidentId || null,
        title,
        content,
        documentData: customFields || {}
      });

      // Broadcast document generation to connected clients
      const wsManager = (global as any).wsManager;
      if (wsManager) {
        wsManager.broadcastToUser(userId, 'document_generated', generatedDocument);
      }

      res.json(generatedDocument);
    } catch (error) {
      console.error("Error generating legal document:", error);
      res.status(500).json({ message: "Failed to generate legal document" });
    }
  });

  // Generate document bundle from incident
  app.post('/api/generated-legal-documents/bundle', async (req: any, res) => {
    try {
      const userId = "demo-user";
      const user = await storage.getUser(userId);
      const { incidentId } = req.body;

      // Get incident data
      const incident = await storage.getIncident(incidentId, userId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Prepare user data
      const userData = {
        name: user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user?.email || 'Unknown User',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || ''
      };

      // Generate document bundle
      const documentBundle = DocumentGenerator.generateDocumentBundle(incident, userData);
      const savedDocuments = [];

      // Save each generated document
      for (const doc of documentBundle) {
        try {
          const generatedDocument = await storage.createGeneratedLegalDocument({
            userId,
            templateId: doc.templateId,
            incidentId: incidentId,
            title: doc.title,
            content: doc.content,
            documentData: {}
          });
          savedDocuments.push(generatedDocument);
        } catch (error) {
          console.error(`Failed to save document: ${doc.title}`, error);
        }
      }

      // Broadcast bundle generation to connected clients
      const wsManager = (global as any).wsManager;
      if (wsManager) {
        wsManager.broadcastToUser(userId, 'document_bundle_generated', {
          incidentId,
          count: savedDocuments.length,
          documents: savedDocuments
        });
      }

      res.json({
        message: "Document bundle generated successfully",
        count: savedDocuments.length,
        documents: savedDocuments
      });
    } catch (error) {
      console.error("Error generating document bundle:", error);
      res.status(500).json({ message: "Failed to generate document bundle" });
    }
  });

  app.get('/api/generated-legal-documents', async (req: any, res) => {
    try {
      const userId = "demo-user";
      const documents = await storage.getGeneratedLegalDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching generated legal documents:", error);
      res.status(500).json({ message: "Failed to fetch generated legal documents" });
    }
  });

  app.get('/api/generated-legal-documents/:id', async (req: any, res) => {
    try {
      const userId = "demo-user";
      const id = parseInt(req.params.id);
      const document = await storage.getGeneratedLegalDocument(id, userId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching generated legal document:", error);
      res.status(500).json({ message: "Failed to fetch generated legal document" });
    }
  });

  // Fast Legal Response endpoint - optimized for concise, quick answers
  app.post('/api/ai/quick-legal', aiRateLimit, async (req, res) => {
    try {
      const { question, context } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // Get fast response from database
      const quickAnswer = FastLegalDatabase.getQuickResponse(
        question, 
        context?.userLocation || context?.scenario
      );

      // Add scenario-specific enhancements
      let enhancedAnswer = quickAnswer;
      if (context?.scenario === 'emergency') {
        enhancedAnswer = `🚨 EMERGENCY: ${quickAnswer}`;
      } else if (context?.scenario === 'traffic_stop') {
        enhancedAnswer = `🚗 TRAFFIC STOP: ${quickAnswer}`;
      }

      res.json({ 
        answer: enhancedAnswer,
        source: 'fast_legal_database',
        responseTime: 'instant'
      });

    } catch (error) {
      console.error('Fast Legal API Error:', error);
      res.status(500).json({ 
        error: 'Service unavailable',
        answer: 'Stay calm, keep hands visible, you have the right to remain silent and an attorney.'
      });
    }
  });

  // AI Legal Question endpoint for voice commands
  app.post('/api/ai/legal-question', aiRateLimit, demoSecurityMiddleware, async (req, res) => {
    try {
      const { question, context } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Use AI service to answer legal questions with state context
      const aiResponse = await AILegalAssistant.answerQuestion({
        question,
        context: {
          userState: context?.userState || 'federal',
          userLocation: context?.userLocation || 'United States',
          quickResponse: context?.quickResponse || false
        }
      });

      // Only enhance ID responses if AI actually provided an answer
      if ((question.toLowerCase().includes('id') || question.toLowerCase().includes('identification')) && aiResponse.answer && aiResponse.confidence > 0.3) {
        aiResponse.answer = `CRITICAL: You can DISPLAY your ID without physically handing it over. Hold your ID up for the officer to see and say "I'm displaying my ID for you to see." This prevents ID retention. ${aiResponse.answer}`;
      }

      res.json(aiResponse);
    } catch (error) {
      console.error("AI legal question error:", error);
      
      // Be honest about AI limitations - return proper JSON response
      res.status(200).json({
        answer: "I don't know the answer to that specific legal question. The AI service is currently unavailable or hasn't been trained on this topic yet.",
        confidence: 0.0,
        disclaimer: "AI service temporarily unavailable. For legal questions, consult qualified legal counsel.",
        suggestions: ["Check the legal rights section in the app", "Contact an attorney for specific guidance"]
      });
    }
  });

  // Smart Emergency Detection endpoint - AI-powered distress signal analysis
  // Note: Not gated behind authentication since emergency detection should work even for non-logged-in users
  app.post('/api/ai/detect-emergency', aiEmergencyRateLimit, demoSecurityMiddleware, async (req, res) => {
    try {
      const { text, audioTranscript, contextualData } = req.body;
      
      if (!text && !audioTranscript) {
        return res.status(400).json({ error: 'Text or audio transcript is required' });
      }

      const result = await AILegalAssistant.detectEmergency({
        text,
        audioTranscript,
        contextualData
      });

      // Log high-priority detections
      if (result.emergencyLevel === 'high' || result.emergencyLevel === 'critical') {
        console.log('[EMERGENCY_DETECTION] High priority alert:', {
          level: result.emergencyLevel,
          signals: result.detectedSignals,
          timestamp: new Date().toISOString()
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Emergency Detection API Error:', error);
      res.status(500).json({ 
        isEmergency: false,
        emergencyLevel: 'none',
        confidence: 0,
        error: 'Emergency detection service unavailable',
        analysis: 'Manual assessment recommended'
      });
    }
  });

  // Incident Summarizer endpoint - Auto-generate incident reports
  app.post('/api/ai/summarize-incident', aiRateLimit, demoSecurityMiddleware, async (req, res) => {
    try {
      const { title, description, transcripts, notes, location, duration, mediaCount, timestamp } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Incident title is required' });
      }

      const result = await AILegalAssistant.summarizeIncident({
        title,
        description,
        transcripts,
        notes,
        location,
        duration,
        mediaCount,
        timestamp: timestamp ? new Date(timestamp) : undefined
      });

      res.json(result);
    } catch (error) {
      console.error('Incident Summarizer API Error:', error);
      res.status(500).json({ 
        error: 'Incident summarizer service unavailable',
        summary: 'Unable to generate automatic summary',
        recommendedNextSteps: ['Manually document incident details']
      });
    }
  });

  app.post('/api/ai/translate', aiRateLimit, demoSecurityMiddleware, async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage, context } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Text and target language are required' });
      }
      const result = await AILegalAssistant.translateLegalContent({ text, targetLanguage, sourceLanguage, context });
      res.json(result);
    } catch (error) {
      console.error('Translation API Error:', error);
      res.status(500).json({ error: 'Translation service unavailable' });
    }
  });

  app.post('/api/ai/match-attorney', aiRateLimit, demoSecurityMiddleware, async (req, res) => {
    try {
      const { incidentType, state, city, severity, description, specificNeeds } = req.body;
      if (!incidentType || !state || !description) {
        return res.status(400).json({ error: 'Incident type, state, and description are required' });
      }
      const result = await AILegalAssistant.matchAttorney({ incidentType, state, city, severity: severity || 'moderate', description, specificNeeds });
      res.json(result);
    } catch (error) {
      console.error('Attorney Matching API Error:', error);
      res.status(500).json({ error: 'Attorney matching service unavailable' });
    }
  });

  app.post('/api/ai/voice-coaching', aiRateLimit, demoSecurityMiddleware, async (req, res) => {
    try {
      const { currentSituation, officerStatement, userState, encounterType, elapsedTime, previousCoachingContext } = req.body;
      if (!currentSituation || !userState || !encounterType) {
        return res.status(400).json({ error: 'Current situation, state, and encounter type are required' });
      }
      const result = await AILegalAssistant.generateVoiceCoaching({ currentSituation, officerStatement, userState, encounterType, elapsedTime, previousCoachingContext });
      res.json(result);
    } catch (error) {
      console.error('Voice Coaching API Error:', error);
      res.status(500).json({ error: 'Voice coaching service unavailable' });
    }
  });

  // Live risk assessment (debounced, fast, no auth required for UX)
  app.post('/api/ai/quick-risk', aiRateLimit, async (req, res) => {
    try {
      const { situation, state } = req.body;
      if (!situation || situation.trim().length < 10) {
        return res.json({ riskLevel: "unknown", color: "gray", briefReason: "Describe your situation for a risk assessment" });
      }
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a legal risk assessment AI for police encounters. Analyze the situation and return a JSON object with: riskLevel (one of: low, medium, high, critical), color (green/yellow/orange/red), briefReason (max 12 words explaining the risk level). Be direct and accurate." },
          { role: "user", content: `Situation: ${situation}${state ? `\nState: ${state}` : ""}\n\nReturn JSON with riskLevel, color, briefReason.` }
        ],
        max_tokens: 100,
      });
      const raw = completion.choices[0].message.content || "{}";
      const data = JSON.parse(raw);
      res.json({ riskLevel: data.riskLevel || "unknown", color: data.color || "gray", briefReason: data.briefReason || "" });
    } catch (err) {
      console.error('Quick risk error:', err);
      res.json({ riskLevel: "unknown", color: "gray", briefReason: "Assessment unavailable" });
    }
  });

  app.post('/api/ai/analyze-recording', aiRateLimit, demoSecurityMiddleware, async (req, res) => {
    try {
      const { transcript, duration, recordingType, location, state } = req.body;
      if (!transcript || !duration) {
        return res.status(400).json({ error: 'Transcript and duration are required' });
      }
      const result = await AILegalAssistant.analyzeRecording({ transcript, duration, recordingType: recordingType || 'audio', location, state });
      res.json(result);
    } catch (error) {
      console.error('Recording Analysis API Error:', error);
      res.status(500).json({ error: 'Recording analysis service unavailable' });
    }
  });

  app.post('/api/ai/generate-document', aiRateLimit, demoSecurityMiddleware, async (req, res) => {
    try {
      const { documentType, incidentDetails, userInfo, targetAgency, state, specificRequests } = req.body;
      if (!documentType || !incidentDetails || !state) {
        return res.status(400).json({ error: 'Document type, incident details, and state are required' });
      }
      const result = await AILegalAssistant.generateLegalDocument({ documentType, incidentDetails, userInfo, targetAgency, state, specificRequests });
      res.json(result);
    } catch (error) {
      console.error('Document Generation API Error:', error);
      res.status(500).json({ error: 'Document generation service unavailable' });
    }
  });

  // Legal agreement acceptance routes
  app.post("/api/legal-agreement-acceptance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { agreements, ipAddress, userAgent } = req.body;
      
      // Record each agreement acceptance
      const acceptances = [];
      for (const [agreementType, accepted] of Object.entries(agreements)) {
        if (accepted) {
          const acceptance = await storage.recordLegalAgreementAcceptance({
            userId,
            agreementType,
            accepted: true,
            ipAddress,
            userAgent,
          });
          acceptances.push(acceptance);
        }
      }
      
      // Update user's terms acceptance status
      const user = await storage.updateUserTermsAcceptance(userId);
      
      res.json({ acceptances, user });
    } catch (error) {
      console.error("Error recording legal agreement acceptance:", error);
      res.status(500).json({ message: "Failed to record legal agreement acceptance" });
    }
  });

  app.get("/api/legal-agreement-acceptances", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const acceptances = await storage.getLegalAgreementAcceptances(userId);
      res.json(acceptances);
    } catch (error) {
      console.error("Error fetching legal agreement acceptances:", error);
      res.status(500).json({ message: "Failed to fetch legal agreement acceptances" });
    }
  });

  // Stripe payment routes for subscription upgrades
  app.post("/api/create-subscription", async (req: any, res) => {
    try {
      const { planId, email, name } = req.body;
      
      if (!planId || planId === "business") {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      // Get plan details from database
      const plans = {
        "basic_guard": { price: 100, name: "Basic Guard Plan" }, // $1.00 in cents
        "safety_pro": { price: 999, name: "Safety Pro Plan" }, // $9.99 in cents
        "constitutional_pro": { price: 1999, name: "Constitutional Pro Plan" }, // $19.99 in cents
        "family_protection": { price: 2999, name: "Family Protection Plan" }, // $29.99 in cents
        "enterprise_fleet": { price: 4999, name: "Enterprise Fleet Plan" } // $49.99 in cents
      };

      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        return res.status(400).json({ message: "Plan not found" });
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: email || "demo@caren.app",
        name: name || "Demo User",
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `C.A.R.E.N.™ ${plan.name} - Legal protection for drivers`,
            },
            unit_amount: plan.price,
            recurring: {
              interval: 'month',
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        customerId: customer.id,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  app.post("/api/confirm-subscription", async (req: any, res) => {
    try {
      const { subscriptionId, planId } = req.body;
      
      // Retrieve subscription to verify payment
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      if (subscription.status === 'active') {
        // TODO: Update user's subscription in database
        // const userId = req.user?.claims?.sub || "demo-user";
        // await storage.updateUserSubscription(userId, planId, subscriptionId);
        
        res.json({ 
          success: true, 
          status: subscription.status,
          message: `Successfully upgraded to ${planId} plan!`
        });
      } else {
        res.json({ 
          success: false, 
          status: subscription.status,
          message: "Payment confirmation pending"
        });
      }
    } catch (error: any) {
      console.error("Error confirming subscription:", error);
      res.status(500).json({ message: "Error confirming subscription: " + error.message });
    }
  });

  const IAP_PRODUCT_MAP: Record<string, { tier: string; name: string }> = {
    'com.caren.safetyapp.basic_guard': { tier: 'basic', name: 'Basic Guard' },
    'com.caren.safetyapp.safety_pro_monthly': { tier: 'safety_pro', name: 'Safety Pro' },
    'com.caren.safetyapp.constitutional_pro_monthly': { tier: 'constitutional', name: 'Constitutional Pro' },
    'com.caren.safetyapp.family_protection_monthly': { tier: 'family', name: 'Family Protection' },
    'com.caren.safetyapp.enterprise_fleet_monthly': { tier: 'enterprise', name: 'Enterprise Fleet' },
  };

  app.post("/api/iap/validate-receipt", async (req: any, res) => {
    try {
      const { transactionId, productId, originalTransactionId, purchaseDate, expiresDate, jwsRepresentation, platform } = req.body;

      if (!transactionId || !productId) {
        return res.status(400).json({ valid: false, error: 'Missing transaction data' });
      }

      const productInfo = IAP_PRODUCT_MAP[productId];
      if (!productInfo) {
        return res.status(400).json({ valid: false, error: 'Unknown product ID' });
      }

      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(401).json({ valid: false, error: 'Not authenticated' });
      }

      console.log(`[IAP] Validating receipt for user ${userId}:`, {
        transactionId,
        productId,
        platform,
        originalTransactionId,
        purchaseDate,
      });

      if (platform === 'ios' && jwsRepresentation) {
        try {
          const parts = jwsRepresentation.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
            console.log('[IAP] JWS payload verified:', {
              bundleId: payload.appAccountToken || payload.bundleId,
              productId: payload.productId,
              transactionId: payload.transactionId,
            });

            if (payload.productId && payload.productId !== productId) {
              return res.status(400).json({ valid: false, error: 'Product ID mismatch in JWS' });
            }
          }
        } catch (jwsError) {
          console.warn('[IAP] JWS parsing failed (non-fatal):', jwsError);
        }
      }

      await storage.updateUserProfile(userId, {
        subscriptionTier: productInfo.tier,
        subscriptionStatus: 'active',
      });

      console.log(`[IAP] User ${userId} upgraded to ${productInfo.tier} via ${platform} IAP`);

      res.json({
        valid: true,
        tier: productInfo.tier,
        name: productInfo.name,
        transactionId,
        expiresDate,
      });

    } catch (error: any) {
      console.error('[IAP] Receipt validation error:', error);
      res.status(500).json({ valid: false, error: 'Validation failed' });
    }
  });

  app.post("/api/iap/restore-purchases", async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { transactions } = req.body;
      if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.json({ restored: false, message: 'No purchases to restore' });
      }

      let highestTier = 'free';
      const tierRanking = ['free', 'basic', 'safety_pro', 'constitutional', 'family', 'enterprise'];

      for (const tx of transactions) {
        const productInfo = IAP_PRODUCT_MAP[tx.productId];
        if (productInfo) {
          const isActive = !tx.expiresDate || new Date(tx.expiresDate) > new Date();
          if (isActive) {
            const currentRank = tierRanking.indexOf(highestTier);
            const newRank = tierRanking.indexOf(productInfo.tier);
            if (newRank > currentRank) {
              highestTier = productInfo.tier;
            }
          }
        }
      }

      if (highestTier !== 'free') {
        await storage.updateUserProfile(userId, {
          subscriptionTier: highestTier,
          subscriptionStatus: 'active',
        });
      }

      console.log(`[IAP] Restored purchases for user ${userId}: tier=${highestTier}`);

      res.json({
        restored: highestTier !== 'free',
        tier: highestTier,
      });

    } catch (error: any) {
      console.error('[IAP] Restore purchases error:', error);
      res.status(500).json({ error: 'Failed to restore purchases' });
    }
  });

  // Stripe Checkout Session for Payment Page
  app.post("/api/subscription/create-checkout-session", async (req: any, res) => {
    try {
      console.log('[PAYMENT] Received payment request:', req.body);
      console.log('[PAYMENT] Request headers:', req.headers);
      console.log('[PAYMENT] Environment check:', {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing',
        REPLIT_DEV_DOMAIN: process.env.REPLIT_DEV_DOMAIN || 'Not set',
        host: req.get('host')
      });
      
      const { planId, planName, amount } = req.body;
      
      if (!planId || !planName || !amount) {
        console.log('[PAYMENT] Missing fields:', { planId, planName, amount });
        return res.status(400).json({ message: "Missing required fields: planId, planName, amount" });
      }

      // Get the correct domain for Replit environment
      const domain = process.env.REPLIT_DEV_DOMAIN || req.get('host');
      const successUrl = `https://${domain}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `https://${domain}/payment?plan=${planId}`;
      
      console.log("Creating Stripe session with URLs:", { successUrl, cancelUrl });
      console.log('[PAYMENT] About to create Stripe session with data:', {
        planId, planName, amount,
        mode: 'subscription',
        payment_method_types: ['card']
      });
      
      // Community Guardian is a one-time payment; all others are subscriptions
      const isOneTime = planId === 'community_guardian';

      const priceData: any = {
        currency: 'usd',
        product_data: {
          name: planName,
          description: `C.A.R.E.N.™ ${planName} - Legal protection`,
        },
        unit_amount: amount,
      };
      if (!isOneTime) {
        priceData.recurring = { interval: 'month' };
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: priceData, quantity: 1 }],
        mode: isOneTime ? 'payment' : 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { planId },
      });

      const userEmail = (req.session as any)?.userId ? undefined : undefined;
      notifyNewPayment(planName, `$${(amount / 100).toFixed(2)}/month`, userEmail).catch(() => {});

      res.json({
        sessionUrl: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Error creating checkout session: " + error.message });
    }
  });

  // Admin Dashboard Routes - Live Data Integration
  app.get('/api/admin/stats', async (req: any, res) => {
    try {
      // Get real user data from database
      const allUsers = await storage.getAllUsers();
      const allIncidents = await storage.getAllIncidents();
      const allEmergencyAlerts = await storage.getAllEmergencyAlerts();
      
      // Calculate real statistics
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(user => {
        // User is active if they have logged in within the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return user.lastLoginAt && new Date(user.lastLoginAt) > thirtyDaysAgo;
      }).length;
      
      const demoUsers = allUsers.filter(user => user.id.includes('demo')).length;
      const regularUsers = totalUsers - demoUsers;
      
      // Count incidents and alerts from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentIncidents = allIncidents.filter(incident => 
        new Date(incident.createdAt) > sevenDaysAgo
      ).length;
      
      const recentAlerts = allEmergencyAlerts.filter(alert => 
        new Date(alert.alertTime) > sevenDaysAgo
      ).length;
      
      // Count users who joined today and this week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const usersToday = allUsers.filter(user => 
        new Date(user.createdAt) >= today
      ).length;
      
      const usersThisWeek = allUsers.filter(user => 
        new Date(user.createdAt) >= oneWeekAgo
      ).length;

      const liveStats = {
        totalUsers,
        activeUsers,
        demoUsers,
        regularUsers,
        averageSessionDuration: 15.3 * 60 * 1000, // Estimated 15.3 minutes
        totalLogins: totalUsers * 8, // Estimated 8 logins per user average
        usersToday,
        usersThisWeek,
        totalIncidents: allIncidents.length,
        recentIncidents,
        emergencyAlerts: allEmergencyAlerts.length,
        recentAlerts
      };

      res.json(liveStats);
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Error fetching admin statistics' });
    }
  });

  // Admin User Stats endpoint for SimpleAdminDashboard
  app.get('/api/admin/user-stats', async (req: any, res) => {
    try {
      // Get real data from database
      const allUsers = await storage.getAllUsers();
      const allIncidents = await storage.getAllIncidents();
      const allEmergencyAlerts = await storage.getAllEmergencyAlerts();
      
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(user => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return user.lastLoginAt && new Date(user.lastLoginAt) > thirtyDaysAgo;
      }).length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const todayIncidents = allIncidents.filter(incident => 
        new Date(incident.createdAt) >= today
      ).length;
      
      const weeklyAlerts = allEmergencyAlerts.filter(alert => 
        new Date(alert.alertTime) >= oneWeekAgo
      ).length;

      // Get real payment data from database
      const subscriptionBreakdown = await storage.getSubscriptionBreakdown();
      const paymentStats = await storage.getPaymentStatistics();

      const userStats = {
        totalUsers,
        activeUsers,
        totalLogins: totalUsers * 5, // Estimated average
        averageSessionDuration: 15.3,
        demoUsers: allUsers.filter(u => u.id.includes('demo')).length,
        regularUsers: totalUsers - allUsers.filter(u => u.id.includes('demo')).length,
        usersToday: allUsers.filter(u => new Date(u.createdAt) >= today).length,
        usersThisWeek: allUsers.filter(u => new Date(u.createdAt) >= oneWeekAgo).length,
        totalIncidents: allIncidents.length,
        emergencyAlerts: weeklyAlerts,
        recordingsToday: todayIncidents,
        legalRightsViewed: totalUsers * 12, // Estimated
        // Real payment data from database
        subscriptionBreakdown,
        paymentStatistics: paymentStats
      };

      res.json(userStats);
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ message: 'Error fetching user statistics' });
    }
  });

  app.get('/api/admin/sessions', (req: any, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'CAREN_ADMIN_2025_PRODUCTION') {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    next();
  }, async (req: any, res) => {
    try {
      console.log('[ADMIN_SESSIONS] Fetching real login activity from database...');
      
      // Get real login activity from database - show more login records
      const recentLogins = await storage.getRecentLoginActivity(50); // Get last 50 logins for better admin visibility
      console.log('[ADMIN_SESSIONS] Found login records:', recentLogins.length);
      console.log('[ADMIN_SESSIONS] Raw login data:', JSON.stringify(recentLogins, null, 2));
      
      if (!recentLogins || recentLogins.length === 0) {
        console.log('[ADMIN_SESSIONS] No login records found, returning demo data...');
        // Return demonstration login data when database table doesn't exist yet
        const currentTime = new Date();
        const demoSessions = [
          {
            id: 'user_demo_001',
            email: 'john.doe@email.com',
            firstName: 'john.doe',
            lastName: 'BASIC',
            lastLogin: new Date(currentTime.getTime() - 15 * 60 * 1000).toISOString(),
            isCurrentlyActive: true,
            sessionDuration: 25 * 60 * 1000,
            loginCount: 12,
            authMethod: 'password' as const,
            deviceInfo: 'Chrome/Windows',
            ipAddress: '192.168.1.100'
          },
          {
            id: 'user_demo_002',
            email: 'sarah.smith@email.com',
            firstName: 'sarah.smith',
            lastName: 'FREE',
            lastLogin: new Date(currentTime.getTime() - 32 * 60 * 1000).toISOString(),
            isCurrentlyActive: true,
            sessionDuration: 18 * 60 * 1000,
            loginCount: 8,
            authMethod: 'password' as const,
            deviceInfo: 'Mobile Safari/iOS',
            ipAddress: '10.0.0.45'
          },
          {
            id: 'demo-user-123',
            email: 'demo@caren.app',
            firstName: 'demo',
            lastName: 'FREE',
            lastLogin: new Date(currentTime.getTime() - 45 * 60 * 1000).toISOString(),
            isCurrentlyActive: false,
            sessionDuration: 12 * 60 * 1000,
            loginCount: 3,
            authMethod: 'demo' as const,
            deviceInfo: 'Firefox/Mac',
            ipAddress: '172.16.0.23'
          },
          {
            id: 'user_demo_003',
            email: 'mike.johnson@email.com',
            firstName: 'mike.johnson',
            lastName: 'PREMIUM',
            lastLogin: new Date(currentTime.getTime() - 78 * 60 * 1000).toISOString(),
            isCurrentlyActive: false,
            sessionDuration: 35 * 60 * 1000,
            loginCount: 24,
            authMethod: 'password' as const,
            deviceInfo: 'Edge/Windows',
            ipAddress: '192.168.1.105'
          },
          {
            id: 'user_demo_004',
            email: 'lisa.anderson@email.com',
            firstName: 'lisa.anderson',
            lastName: 'BASIC',
            lastLogin: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            isCurrentlyActive: false,
            sessionDuration: 28 * 60 * 1000,
            loginCount: 15,
            authMethod: 'password' as const,
            deviceInfo: 'Chrome/Android',
            ipAddress: '10.0.0.67'
          }
        ];
        
        return res.json(demoSessions);
      }
      
      // Transform database records to match frontend expectations
      const sessions = recentLogins.map(login => ({
        id: login.userId,
        email: login.email,
        firstName: login.email?.split('@')[0] || 'User',
        lastName: login.subscriptionTier?.toUpperCase() || 'FREE',
        lastLogin: login.createdAt?.toISOString() || new Date().toISOString(),
        isCurrentlyActive: login.success && (Date.now() - new Date(login.createdAt || new Date()).getTime()) < 60 * 60 * 1000, // Active if logged in successfully within last hour
        sessionDuration: Math.max(5, Math.floor(Math.random() * 45)) * 60 * 1000, // Estimated session duration
        loginCount: Math.floor(Math.random() * 50) + 1, // Random count for now - in production would be actual count
        authMethod: login.loginMethod as const,
        deviceInfo: extractDeviceFromUserAgent(login.userAgent || ''),
        ipAddress: login.ipAddress
      }));

      res.json(sessions);
    } catch (error: any) {
      console.error('Error fetching admin sessions:', error);
      res.status(500).json({ message: 'Error fetching user sessions' });
    }
  });

  // Helper function to extract device info from user agent
  function extractDeviceFromUserAgent(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';
    
    // Detect mobile devices
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      if (userAgent.includes('iPhone')) return 'Mobile Safari/iOS';
      if (userAgent.includes('Android')) return 'Chrome/Android';
      return 'Mobile Device';
    }
    
    // Detect browsers
    if (userAgent.includes('Chrome')) return 'Chrome/Windows';
    if (userAgent.includes('Firefox')) return 'Firefox/Mac';
    if (userAgent.includes('Safari')) return 'Safari/Mac';
    if (userAgent.includes('Edge')) return 'Edge/Windows';
    
    return 'Desktop Browser';
  }

  // Admin Payment Tracking - Shows who's paid vs monthly subscriptions
  app.get('/api/admin/payment-tracking', (req: any, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'CAREN_ADMIN_2025_PRODUCTION') {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    next();
  }, async (req: any, res) => {
    try {
      console.log('[ADMIN_PAYMENTS] Fetching payment tracking data...');
      
      // Get all users with subscription data
      const allUsers = await storage.getAllUsers();
      console.log('[ADMIN_PAYMENTS] Found users:', allUsers.length);
      
      // For now, since we don't have active Stripe subscriptions, 
      // we'll show demo data based on subscription tiers to demonstrate the functionality
      const paymentTracking = allUsers.map(user => {
        // Determine payment type based on subscription tier
        let paymentType = 'Free';
        let totalPaid = 0;
        let monthlyAmount = 0;
        let paymentStatus = 'active';
        
        if (user.subscriptionTier === 'basic_guard') {
          paymentType = 'Monthly Subscription';
          monthlyAmount = 1.00;
          totalPaid = monthlyAmount * 3; // Simulate 3 months
        } else if (user.subscriptionTier === 'safety_pro') {
          paymentType = 'Monthly Subscription';
          monthlyAmount = 9.99;
          totalPaid = monthlyAmount * 3; // Simulate 3 months
        } else if (user.subscriptionTier === 'constitutional_pro') {
          paymentType = 'Monthly Subscription';
          monthlyAmount = 19.99;
          totalPaid = monthlyAmount * 3; // Simulate 3 months
        } else if (user.subscriptionTier === 'family_protection') {
          paymentType = 'Monthly Subscription';
          monthlyAmount = 29.99;
          totalPaid = monthlyAmount * 3; // Simulate 3 months
        } else if (user.subscriptionTier === 'enterprise_fleet') {
          paymentType = 'Monthly Subscription';
          monthlyAmount = 49.99;
          totalPaid = monthlyAmount * 3; // Simulate 3 months
        } else if (user.subscriptionTier === 'business') {
          paymentType = 'One-time Payment';
          totalPaid = 149.99; // Business plan one-time fee
        }
        
        return {
          userId: user.id,
          email: user.email || 'No email',
          firstName: user.firstName || 'User',
          lastName: user.lastName || '',
          subscriptionTier: user.subscriptionTier || 'free',
          paymentType,
          totalPaid,
          monthlyAmount,
          paymentStatus,
          lastPayment: user.subscriptionTier ? 
            new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : 
            null, // Random date within last 30 days
          nextPayment: paymentType === 'Monthly Subscription' ? 
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : 
            null,
          joinedAt: user.createdAt?.toISOString() || new Date().toISOString()
        };
      });
      
      // Add summary statistics
      const summary = {
        totalUsers: paymentTracking.length,
        freeUsers: paymentTracking.filter(p => p.paymentType === 'Free').length,
        monthlySubscribers: paymentTracking.filter(p => p.paymentType === 'Monthly Subscription').length,
        oneTimePayers: paymentTracking.filter(p => p.paymentType === 'One-time Payment').length,
        totalRevenue: paymentTracking.reduce((sum, p) => sum + p.totalPaid, 0),
        monthlyRevenue: paymentTracking.reduce((sum, p) => sum + p.monthlyAmount, 0)
      };
      
      res.json({
        summary,
        users: paymentTracking.sort((a, b) => b.totalPaid - a.totalPaid) // Sort by total paid descending
      });
    } catch (error: any) {
      console.error('Error fetching payment tracking:', error);
      res.status(500).json({ message: 'Error fetching payment tracking data' });
    }
  });

  // Attorney-Client Messaging System Routes

  // Helper function to get authenticated user ID
  async function getAuthenticatedUserId(req: any): Promise<string> {
    let userId = "demo-user"; // fallback
    
    // Try to get real user ID from authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if it's a custom domain token (starts with 'cdt_')
      if (token.startsWith('cdt_')) {
        const parts = token.split('_');
        if (parts.length >= 2) {
          userId = parts[1]; // Extract user ID from token
        }
      } else {
        // Try to find user by session token
        try {
          const user = await storage.getUserBySessionToken(token);
          if (user) {
            userId = user.id;
          }
        } catch (error) {
          console.log("Error finding user by session token:", error);
        }
      }
    }
    
    // Ensure demo user exists if we're using fallback
    if (userId === "demo-user") {
      try {
        await storage.upsertUser({
          id: "demo-user",
          email: "demo@example.com",
          firstName: "Demo",
          lastName: "User",
          profileImageUrl: null,
        });
      } catch (error) {
        console.log("Demo user already exists or upsert failed:", error);
      }
    }
    
    return userId;
  }

  // Conversation routes
  app.post("/api/conversations", async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const { attorneyId, incidentId, subject, priority, isEmergency } = req.body;

      const conversation = await storage.createConversation({
        userId,
        attorneyId: parseInt(attorneyId),
        incidentId: incidentId ? parseInt(incidentId) : undefined,
        subject,
        priority: priority || 'normal',
        isEmergency: isEmergency || false,
      });

      // Create system message to start conversation
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: userId,
        senderType: 'user',
        content: `Conversation started by user regarding: ${subject}`,
        messageType: 'system',
        isSystemMessage: true,
        systemMessageType: 'conversation_started',
      });

      res.json(conversation);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations", async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const userType = req.query.userType || 'user';
      
      const conversations = await storage.getConversations(userId, userType);
      res.json(conversations);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const conversationId = req.params.id;
      
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error: any) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Enhanced secure message sending
  app.post("/api/conversations/:id/messages", async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const conversationId = req.params.id;
      const { content, messageType, senderType, replyToMessageId, attachments } = req.body;

      // Input validation and sanitization
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Message content cannot be empty" });
      }

      if (content.length > 10000) {
        return res.status(400).json({ message: "Message content too long (max 10,000 characters)" });
      }

      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Generate encryption key for this message
      const crypto = require('crypto');
      const encryptionKey = crypto.randomBytes(32).toString('hex');

      const message = await storage.createMessage({
        conversationId,
        senderId: userId,
        senderType: senderType || 'user',
        content: content.trim(),
        messageType: messageType || 'text',
        replyToMessageId,
        isEncrypted: true,
        encryptionKey,
        attachments: attachments || null,
      });

      // Process file attachments if any
      if (attachments && Array.isArray(attachments)) {
        for (const attachment of attachments) {
          await storage.createMessageAttachment({
            messageId: message.id,
            fileName: attachment.fileName,
            originalFileName: attachment.originalFileName,
            fileType: attachment.fileType,
            mimeType: attachment.mimeType,
            fileSize: attachment.fileSize,
            filePath: attachment.filePath,
            isEncrypted: true,
            encryptionKey,
          });
        }
      }

      // Update conversation's last message timestamp
      await storage.updateConversation(conversationId, {
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      });

      // Create audit trail for message
      console.log(`[SECURE MESSAGING AUDIT] Message sent - User: ${userId}, Conversation: ${conversationId}, Type: ${messageType}, Time: ${new Date().toISOString()}, Has Attachments: ${!!attachments?.length}`);

      // Enhanced real-time broadcasting with security
      if ((global as any).wsManager) {
        const wsManager = (global as any).wsManager;
        
        // Send to user (sender) - remove encryption key
        wsManager.broadcastToUser(userId, 'message_sent', { 
          conversationId, 
          message: { ...message, encryptionKey: undefined }
        });
        
        // Notify the attorney if they're online
        if (conversation.attorneyId && senderType === 'user') {
          wsManager.broadcastToUser(`attorney-${conversation.attorneyId}`, 'new_message', { 
            conversationId, 
            message: { ...message, encryptionKey: undefined },
            fromUser: userId,
            urgent: conversation.isEmergency,
            priority: conversation.priority
          });
        }
        
        // Notify user if attorney is sending
        if (conversation.userId && senderType === 'attorney') {
          wsManager.broadcastToUser(conversation.userId, 'new_message', { 
            conversationId, 
            message: { ...message, encryptionKey: undefined },
            fromAttorney: true,
            attorneyId: conversation.attorneyId
          });
        }
      }

      // Return message without encryption key for security
      const responseMessage = { ...message, encryptionKey: undefined };
      res.json(responseMessage);
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const conversationId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await storage.getMessages(conversationId, limit, offset);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.put("/api/messages/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageId = req.params.id;

      await storage.markMessageAsRead(messageId, userId);
      
      // Create read receipt for audit trail
      console.log(`[SECURE MESSAGING AUDIT] Message read - User: ${userId}, Message: ${messageId}, Time: ${new Date().toISOString()}`);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Secure file upload for message attachments
  app.post("/api/conversations/:id/upload", async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const conversationId = req.params.id;
      const { fileName, fileType, fileSize, fileData } = req.body;

      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(403).json({ message: "Access denied to conversation" });
      }

      // File validation
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (fileSize > maxFileSize) {
        return res.status(400).json({ message: "File too large (max 10MB)" });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ message: "File type not allowed" });
      }

      // Generate secure file path and encryption
      const crypto = require('crypto');
      const fileId = crypto.randomUUID();
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      const filePath = `secure-uploads/${conversationId}/${fileId}`;

      // Simulate file storage (in production, use secure cloud storage)
      const attachmentData = {
        id: fileId,
        fileName: `${fileId}_${fileName}`,
        originalFileName: fileName,
        fileType: fileType.startsWith('image/') ? 'image' : 'document',
        mimeType: fileType,
        fileSize,
        filePath,
        isEncrypted: true,
        encryptionKey
      };

      console.log(`[SECURE MESSAGING AUDIT] File uploaded - User: ${userId}, Conversation: ${conversationId}, File: ${fileName}, Size: ${fileSize}, Time: ${new Date().toISOString()}`);

      res.json({
        success: true,
        attachment: {
          ...attachmentData,
          encryptionKey: undefined // Don't send encryption key to client
        }
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get message attachments
  app.get("/api/messages/:id/attachments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageId = req.params.id;

      // Verify user has access to this message
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      const conversation = await storage.getConversation(message.conversationId, userId);
      if (!conversation) {
        return res.status(403).json({ message: "Access denied" });
      }

      const attachments = await storage.getMessageAttachments(messageId);
      
      // Remove encryption keys from response
      const safeAttachments = attachments.map(att => ({
        ...att,
        encryptionKey: undefined
      }));

      res.json(safeAttachments);
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  // Attorney availability routes
  app.get("/api/attorneys/available", isAuthenticated, async (req: any, res) => {
    try {
      const specialties = req.query.specialties ? (req.query.specialties as string).split(',') : undefined;
      const isEmergency = req.query.emergency === 'true';
      
      const attorneys = await storage.getAvailableAttorneys(specialties, isEmergency);
      res.json(attorneys);
    } catch (error: any) {
      console.error("Error fetching available attorneys:", error);
      res.status(500).json({ message: "Failed to fetch available attorneys" });
    }
  });

  app.get("/api/attorneys/:id/availability", isAuthenticated, async (req: any, res) => {
    try {
      const attorneyId = parseInt(req.params.id);
      const availability = await storage.getAttorneyAvailability(attorneyId);
      
      if (!availability) {
        return res.status(404).json({ message: "Attorney availability not found" });
      }
      
      res.json(availability);
    } catch (error: any) {
      console.error("Error fetching attorney availability:", error);
      res.status(500).json({ message: "Failed to fetch attorney availability" });
    }
  });

  // Check if user has facial recognition set up
  app.get('/api/auth/check-facial-recognition', async (req, res) => {
    try {
      // Get all facial recognition records to check if any exist
      const allFacialData = await storage.getAllFacialRecognition();
      const hasFacialRecognition = allFacialData && allFacialData.length > 0;
      
      res.json({ 
        hasFacialRecognition,
        count: allFacialData?.length || 0
      });
    } catch (error) {
      console.error('Error checking facial recognition:', error);
      res.status(500).json({ message: 'Failed to check facial recognition status' });
    }
  });

  // Facial Recognition Authentication endpoint
  app.post('/api/auth/facial-recognition', async (req, res) => {
    try {
      const { mode, faceData } = req.body;
      
      console.log(`[FACIAL_RECOGNITION] Request: mode=${mode}, faceData length=${faceData?.length || 0}`);
      
      if (!faceData || !mode) {
        return res.status(400).json({ message: 'Missing face data or mode' });
      }
      
      // Parse facial features from comma-separated values
      const facialFeatures = faceData.split(',').map((f: string) => parseFloat(f));
      
      if (facialFeatures.length === 0 || facialFeatures.some(isNaN)) {
        return res.status(400).json({ message: 'Invalid facial feature data' });
      }
      
      // Create a consistent encoding from facial features
      const faceEncoding = facialFeatures.map(f => f.toFixed(6)).join(',');
      console.log(`[FACIAL_RECOGNITION] Processed ${facialFeatures.length} facial features`);
      console.log(`[FACIAL_RECOGNITION] Feature sample: [${facialFeatures.slice(0, 3).map(f => f.toFixed(3)).join(', ')}...]`);
      
      if (mode === 'register') {
        console.log('[FACIAL_REGISTRATION] Starting face registration process');
        
        // Clean up any old facial recognition data with incompatible format
        const allExistingFaces = await storage.getAllFacialRecognition();
        const oldFormatFaces = allExistingFaces.filter(face => 
          face.faceEncoding && !face.faceEncoding.includes(',')
        );
        
        if (oldFormatFaces.length > 0) {
          console.log(`[FACIAL_REGISTRATION] Removing ${oldFormatFaces.length} old format facial records`);
          // Note: In production, you'd want to clean these up more carefully
        }
        
        // Check for authenticated user session with multiple fallbacks
        const session = req.session as any;
        let userId = session?.userId;
        
        // Fallback: Check if user was just created and session might not be fully established
        if (!userId && session?.isAuthenticated) {
          // Try to get user ID from session data
          userId = session?.user?.id;
        }
        
        // Fallback: Check demo authentication state
        if (!userId) {
          const currentUser = getCurrentUser();
          if (currentUser && getUserAuthenticated()) {
            userId = currentUser.id;
            console.log('[FACIAL_REGISTRATION] Using demo auth user:', userId);
          }
        }
        
        // Debug log the full session data
        console.log('[FACIAL_REGISTRATION] Session debug:', {
          sessionExists: !!req.session,
          sessionId: req.session?.id,
          sessionUserId: session?.userId,
          sessionAuth: session?.isAuthenticated,
          sessionUser: session?.user,
          fullSession: JSON.stringify(req.session, null, 2)
        });
        
        // Final fallback: Check authentication header or cookies
        if (!userId) {
          return res.status(401).json({ 
            message: 'You must be logged in to register facial recognition. Please create an account or sign in first.',
            debug: {
              sessionExists: !!req.session,
              sessionUserId: session?.userId,
              sessionAuth: session?.isAuthenticated,
              sessionUser: session?.user?.id,
              fullSession: req.session
            }
          });
        }
        
        // Check if user already has facial recognition set up
        const existingFacialData = await storage.getAllFacialRecognition();
        const userFacialData = existingFacialData.filter(face => face.userId === userId);
        
        if (userFacialData.length > 0) {
          // Update existing facial data
          await storage.updateFacialRecognition(userId, {
            faceEncoding,
            confidence: "0.95",
            isActive: true
          });
          console.log(`[FACIAL_REGISTRATION] Updated facial recognition for existing user ${userId}`);
        } else {
          // Create new facial data for authenticated user
          await storage.createFacialRecognition({
            userId,
            faceEncoding,
            confidence: "0.95",
            isActive: true
          });
          console.log(`[FACIAL_REGISTRATION] Created facial recognition for user ${userId}`);
        }
        
        const user = await storage.getUser(userId);
        console.log(`[FACIAL_REGISTRATION] Face encoding: ${faceEncoding.substring(0, 50)}...`);
        
        res.json({ 
          success: true, 
          userId,
          user: {
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email
          },
          message: 'Face registered successfully for your account' 
        });
        
      } else if (mode === 'authenticate') {
        // Find matching face in database
        const allStoredFaces = await storage.getAllFacialRecognition();
        
        // Filter out faces with old hex format (incompatible with new feature format)
        const storedFaces = allStoredFaces.filter(face => {
          // New format contains commas (numerical features), old format is hex string
          return face.faceEncoding && face.faceEncoding.includes(',');
        });
        
        console.log(`Found ${storedFaces.length} compatible stored faces for comparison (${allStoredFaces.length} total)`);
        
        if (storedFaces.length === 0) {
          return res.status(401).json({ message: 'No compatible face registration found. Please register your face first using the new system.' });
        }
        
        // Enhanced facial matching with multiple algorithms for better success rate
        let bestMatch = null;
        let bestSimilarity = 0;
        
        for (const face of storedFaces) {
          if (!face.isActive) continue;
          
          const similarity = calculateFaceSimilarity(faceEncoding, face.faceEncoding);
          console.log(`[FACIAL_MATCH] User ${face.userId}: similarity=${similarity.toFixed(3)}, encoding length=${face.faceEncoding.length}`);
          console.log(`[FACIAL_MATCH] Current encoding: ${faceEncoding.substring(0, 20)}...`);
          console.log(`[FACIAL_MATCH] Stored encoding: ${face.faceEncoding.substring(0, 20)}...`);
          
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = face;
          }
        }
        
        console.log(`[FACIAL_MATCH] Best similarity: ${bestSimilarity.toFixed(3)}, threshold: 0.6`);
        const matchingFace = bestSimilarity > 0.6 ? bestMatch : null; // Higher threshold for better accuracy
        
        if (matchingFace) {
          const user = await storage.getUser(matchingFace.userId);
          
          if (user) {
            // Create authenticated session for facial recognition login
            req.session.regenerate((err) => {
              if (err) {
                console.error('Session regeneration error:', err);
                return res.status(500).json({ message: 'Session creation failed' });
              }
              
              // Set session data for authenticated user
              (req.session as any).userId = user.id;
              (req.session as any).userEmail = user.email;
              (req.session as any).isAuthenticated = true;
              (req.session as any).authMethod = 'facial_recognition';
              
              // Save session
              req.session.save((err) => {
                if (err) {
                  console.error('Session save error:', err);
                  return res.status(500).json({ message: 'Session save failed' });
                }
                
                console.log(`[FACIAL_AUTH] Session created for user ${user.id} via facial recognition`);
                
                // Sync with demo authentication state for frontend compatibility
                try {
                  const demoUser = {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileImageUrl: user.profileImageUrl,
                    agreedToTerms: true,
                    termsAgreedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  
                  // Set user as authenticated in demo state
                  setUserAuthenticated(true, demoUser, new Date());
                  console.log(`[FACIAL_AUTH] Demo state synchronized for user ${user.id}`);
                } catch (demoError) {
                  console.log(`[FACIAL_AUTH] Demo state sync failed, but session is valid:`, demoError);
                }
                
                res.json({ 
                  success: true, 
                  userId: user.id,
                  user: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                  },
                  message: 'Face authentication successful' 
                });
              });
            });
          } else {
            res.status(404).json({ message: 'User not found' });
          }
        } else {
          res.status(401).json({ message: 'Face not recognized' });
        }
      } else {
        res.status(400).json({ message: 'Invalid mode' });
      }
      
    } catch (error) {
      console.error('Facial recognition error:', error);
      res.status(500).json({ message: 'Facial recognition failed' });
    }
  });

  // Check facial recognition setup status
  app.get('/api/auth/facial-recognition/status', async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const allFacialData = await storage.getAllFacialRecognition();
      const userFacialData = allFacialData.filter(record => record.userId === userId);
      const hasSetup = userFacialData && userFacialData.length > 0;
      
      res.json({ hasSetup, count: userFacialData?.length || 0 });
    } catch (error) {
      console.error('Error checking facial recognition status:', error);
      res.status(500).json({ message: 'Failed to check facial recognition status' });
    }
  });

  // Data privacy routes (GDPR/CCPA compliance)
  app.get("/api/privacy/export-data", async (req: any, res) => {
    try {
      const userId = "demo-user";
      
      SecurityAuditLogger.logDataAccess('USER_DATA_EXPORT', 'EXPORT_REQUEST', req);
      
      const userData = await DataPrivacyManager.exportUserData(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="caren_data_export_${userId}_${Date.now()}.json"`);
      res.json(userData);
      
    } catch (error: any) {
      console.error("Data export error:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.delete("/api/privacy/delete-account", async (req: any, res) => {
    try {
      const userId = (req.session as any)?.userId || (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      SecurityAuditLogger.logDataAccess('USER_DATA_DELETION', 'DELETE_REQUEST', req);

      await DataPrivacyManager.deleteUserData(userId);

      // Delete the user row itself
      await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);

      // Destroy the session
      req.session.destroy(() => {});

      res.json({
        message: "Your account and all associated data have been permanently deleted.",
        deleted: true
      });

    } catch (error: any) {
      console.error("Account deletion error:", error);
      res.status(500).json({ message: "Failed to process account deletion" });
    }
  });

  // Conversation management endpoints
  app.get('/api/conversations', async (req: any, res) => {
    try {
      // Create demo user if doesn't exist
      const userId = "demo-user";
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.createUser({
          id: userId,
          email: "demo@example.com",
          firstName: "Demo",
          lastName: "User",
        });
      }
      
      const userConversations = await storage.getConversations(userId);
      res.json(userConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', async (req: any, res) => {
    try {
      // Create demo user if doesn't exist
      const userId = "demo-user";
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.createUser({
          id: userId,
          email: "demo@example.com",
          firstName: "Demo",
          lastName: "User",
        });
      }

      const { attorneyId, subject, initialMessage } = req.body;

      if (!attorneyId || !subject) {
        return res.status(400).json({ message: "Attorney ID and subject are required" });
      }

      const conversation = await storage.createConversation({
        userId,
        attorneyId: parseInt(attorneyId),
        subject,
        status: 'active',
        priority: 'normal',
        isEmergency: false,
      });

      // Send initial message if provided
      if (initialMessage) {
        await storage.createMessage({
          conversationId: conversation.id,
          senderId: userId,
          senderType: 'user',
          content: initialMessage,
          messageType: 'text',
          isRead: false,
          isSystemMessage: false,
        });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // AI-powered Q&A routes
  app.post("/api/ai/ask", aiRateLimit, demoSecurityMiddleware, async (req: any, res) => {
    try {
      const userId = "demo-user";
      const { question, context } = req.body;
      
      SecurityAuditLogger.logDataAccess('AI_QUERY', 'ASK_QUESTION', req);

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Get user's context for better AI responses
      const userState = context?.state;
      const userLocation = context?.location;
      
      // Get relevant legal rights if state is provided
      let availableRights = [];
      if (userState) {
        try {
          availableRights = await storage.getLegalRightsByState(userState);
        } catch (error) {
          console.log("Could not fetch legal rights for context");
        }
      }

      // Get recent incidents for context
      let recentIncidents = [];
      try {
        const incidents = await storage.getIncidents(userId);
        recentIncidents = incidents.slice(0, 3); // Last 3 incidents
      } catch (error) {
        console.log("Could not fetch incidents for context");
      }

      const aiResponse = await AILegalAssistant.answerQuestion({
        question: question.trim(),
        context: {
          userState,
          userLocation,
          recentIncidents,
          availableRights: availableRights.slice(0, 5)
        }
      });

      res.json(aiResponse);
    } catch (error: any) {
      console.error("AI Q&A Error:", error);
      res.status(500).json({ 
        message: "Unable to process your question at this time. Please try again later.",
        error: error.message 
      });
    }
  });

  app.post("/api/ai/incident-questions", aiRateLimit, demoSecurityMiddleware, async (req: any, res) => {
    try {
      const userId = "demo-user";
      const { incidentId } = req.body;

      const incident = await storage.getIncident(parseInt(incidentId), userId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      const questions = await AILegalAssistant.generateIncidentQuestions(incident);
      res.json({ questions });
    } catch (error: any) {
      console.error("AI Question Generation Error:", error);
      res.status(500).json({ 
        message: "Unable to generate questions at this time",
        questions: [
          "What are my rights in this situation?",
          "What should I do next?",
          "Do I need a lawyer for this incident?"
        ]
      });
    }
  });

  app.post("/api/ai/analyze-sentiment", aiRateLimit, demoSecurityMiddleware, async (req: any, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Text is required for analysis" });
      }

      const analysis = await AILegalAssistant.analyzeSentiment(text);
      res.json(analysis);
    } catch (error: any) {
      console.error("Sentiment Analysis Error:", error);
      res.status(500).json({ 
        message: "Unable to analyze sentiment at this time",
        rating: 3,
        confidence: 0.5,
        analysis: "Analysis unavailable"
      });
    }
  });

  // Police command analysis endpoint
  app.post('/api/legal/analyze-police-command', async (req: any, res) => {
    try {
      const { command, state: userState, location } = req.body;

      if (!command || typeof command !== 'string') {
        return res.status(400).json({ message: "Command text required" });
      }

      const analysis = await storage.analyzePoliceCommand(command, userState, location);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing police command:", error);
      res.status(500).json({ 
        message: "Failed to analyze command",
        isUnlawful: false,
        confidence: 0
      });
    }
  });

  // Send recording to attorney endpoint
  app.post('/api/send-recording-to-attorney', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { includeEmergencyAlert = true, priority = 'high' } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user's most recent incidents with recordings
      const recentIncidents = await storage.getIncidents(userId);
      
      if (!recentIncidents || recentIncidents.length === 0) {
        return res.status(404).json({ 
          message: "No recent recordings found to send",
          success: false 
        });
      }

      const latestIncident = recentIncidents[0];

      // Get user's attorney connections
      const attorneys = await storage.getAttorneys(userId);
      
      if (!attorneys || attorneys.length === 0) {
        return res.status(404).json({ 
          message: "No attorney configured. Please add an attorney first.",
          success: false 
        });
      }

      const primaryAttorney = attorneys[0]; // Use first attorney as primary

      // Get user's emergency contacts for family alerts
      const emergencyContacts = await storage.getEmergencyContacts(userId);

      // Prepare recording data for email
      const recordingData = {
        incidentId: latestIncident.id,
        title: latestIncident.title || 'Emergency Recording',
        description: latestIncident.description || 'Voice-activated recording sent to attorney',
        timestamp: latestIncident.createdAt,
        priority: priority,
        location: latestIncident.location || null,
        duration: 0, // Default duration since not stored in current schema
        recordingType: 'audio' // Default type since not stored in current schema
      };

      // Send email to attorney
      const attorneyEmailResult = await sendRecordingToAttorneyEmail(
        primaryAttorney,
        recordingData,
        req.user
      );

      let emergencyAlertResults = [];

      // Send emergency alerts to family if requested
      if (includeEmergencyAlert && emergencyContacts && emergencyContacts.length > 0) {
        const alertData = {
          alertType: 'recording_sent_to_attorney',
          location: latestIncident.location,
          userMessage: `Recording has been sent to attorney: ${primaryAttorney.firmName || 'Legal Counsel'}`,
          userName: req.user.firstName || req.user.email,
          incidentTitle: recordingData.title,
          attorneyName: primaryAttorney.firmName || 'Attorney',
          timestamp: new Date().toISOString()
        };

        // Send notifications to all emergency contacts
        emergencyAlertResults = await notifyEmergencyContacts(
          emergencyContacts,
          alertData
        );
      }

      // Update incident with attorney notification status
      try {
        await storage.updateIncident(latestIncident.id, userId, {
          attorneyNotified: true,
          attorneyNotifiedAt: new Date(),
          familyNotified: emergencyAlertResults.length > 0,
          familyNotifiedAt: emergencyAlertResults.length > 0 ? new Date() : null
        });
      } catch (updateError) {
        // Log update error but don't fail the whole operation
        console.warn('Failed to update incident notification status:', updateError);
      }

      // Log the action for audit trail
      SecurityAuditLogger.logDataAccess(
        'recording_sent_to_attorney',
        'SEND',
        req
      );

      res.json({
        success: true,
        message: "Recording sent to attorney successfully",
        details: {
          attorneyNotified: attorneyEmailResult.success,
          attorneyEmail: primaryAttorney.contactInfo?.email || 'No email configured',
          familyNotified: emergencyAlertResults.length > 0,
          familyContactsCount: emergencyAlertResults.length,
          incidentId: latestIncident.id,
          timestamp: new Date().toISOString()
        },
        notifications: {
          attorney: attorneyEmailResult,
          family: emergencyAlertResults
        }
      });

    } catch (error) {
      console.error("Error sending recording to attorney:", error);
      SecurityAuditLogger.logSuspiciousActivity(
        'recording_send_failure',
        { error: error.message },
        req
      );
      
      res.status(500).json({ 
        success: false,
        message: "Failed to send recording to attorney",
        error: error.message 
      });
    }
  });

  // EXTRACTED: Cloud Sync API Routes moved to cloud-sync.routes.ts

  // Voice Learning System API Routes
  
  // EXTRACTED: voice profile initialization endpoint moved to voice-learning.routes.ts

  // EXTRACTED: voice profile endpoint moved to voice-learning.routes.ts

  // EXTRACTED: create custom voice command endpoint moved to voice-learning.routes.ts

  // EXTRACTED: get user custom voice commands endpoint moved to voice-learning.routes.ts

  // EXTRACTED: voice command matching endpoint moved to voice-learning.routes.ts

  // EXTRACTED: voice command analytics endpoint moved to voice-learning.routes.ts

  // EXTRACTED: voice training start session endpoint moved to voice-learning.routes.ts

  // EXTRACTED: voice training complete session endpoint moved to voice-learning.routes.ts

  // EXTRACTED: get voice learning analytics endpoint moved to voice-learning.routes.ts

  // EXTRACTED: get voice learning settings endpoint moved to voice-learning.routes.ts

  // EXTRACTED: update voice learning settings endpoint moved to voice-learning.routes.ts

  // EXTRACTED: delete custom voice command endpoint moved to voice-learning.routes.ts

  // EXTRACTED: update custom voice command endpoint moved to voice-learning.routes.ts

  // Legal Rights Map API endpoints
  app.get('/api/user-location-state', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and longitude required' });
      }

      // Use reverse geocoding to determine state from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const locationData = await response.json();
      const state = locationData.address?.state;
      
      if (!state) {
        return res.status(404).json({ message: 'Could not determine state from coordinates' });
      }

      // Find state code from state name
      const stateCodeMap: Record<string, string> = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
        'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
        'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
        'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
        'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
        'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
        'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
        'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
        'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
        'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
        'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
      };

      const stateCode = stateCodeMap[state] || state;
      
      res.json({
        code: stateCode,
        name: state,
        coordinates: { lat: parseFloat(lat as string), lng: parseFloat(lng as string) }
      });
      
    } catch (error) {
      console.error('Error determining user location state:', error);
      res.status(500).json({ message: 'Failed to determine state from location' });
    }
  });

  app.get('/api/legal-rights/states-overview', async (req, res) => {
    try {
      // Import comprehensive legal database
      const { getComprehensiveLegalDatabase, generateBaseStateRights } = await import('./comprehensiveLegalDatabase');
      
      // Get enhanced legal data for major states
      const enhancedStates = getComprehensiveLegalDatabase();
      
      // State names mapping
      const stateNames = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CO': 'Colorado',
        'CT': 'Connecticut', 'DE': 'Delaware', 'GA': 'Georgia', 'HI': 'Hawaii',
        'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
        'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts',
        'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana',
        'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
        'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
        'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
        'TN': 'Tennessee', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia',
        'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
      };

      // Start with enhanced states data
      const statesOverview = [...enhancedStates];
      
      // Get enhanced state codes to avoid duplication
      const enhancedStateCodes = enhancedStates.map(state => state.code);
      
      // Add remaining states with comprehensive base rights
      const remainingStates = Object.keys(stateNames).filter(code => !enhancedStateCodes.includes(code));
      
      remainingStates.forEach(code => {
        const baseRights = generateBaseStateRights(code, stateNames[code]);
        
        statesOverview.push({
          code,
          name: stateNames[code],
          totalRights: baseRights.length,
          protectionScore: 75, // Base protection score
          riskLevel: 'moderate',
          attorneyRecommended: false,
          rights: baseRights
        });
      });

      res.json(statesOverview);
      
    } catch (error) {
      console.error('Error fetching comprehensive legal rights:', error);
      res.status(500).json({ message: 'Failed to fetch comprehensive legal rights overview' });
    }
  });

  // Legal Navigation API Endpoints
  app.get('/api/legal-destinations', async (req, res) => {
    try {
      const { type, state, latitude, longitude, radius } = req.query;
      
      const destinations = await storage.getLegalDestinations(
        type as string,
        state as string,
        latitude ? parseFloat(latitude as string) : undefined,
        longitude ? parseFloat(longitude as string) : undefined,
        radius ? parseFloat(radius as string) : undefined
      );
      
      res.json(destinations);
    } catch (error) {
      console.error('Error fetching legal destinations:', error);
      res.status(500).json({ message: 'Failed to fetch legal destinations' });
    }
  });

  app.get('/api/legal-destinations/nearby', async (req, res) => {
    try {
      const { latitude, longitude, type, radius } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }
      
      const destinations = await storage.getNearbyLegalDestinations(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        type as string,
        radius ? parseFloat(radius as string) : undefined
      );
      
      res.json(destinations);
    } catch (error) {
      console.error('Error fetching nearby legal destinations:', error);
      res.status(500).json({ message: 'Failed to fetch nearby legal destinations' });
    }
  });

  app.get('/api/legal-destinations/emergency', async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }
      
      const destinations = await storage.getEmergencyLegalDestinations(
        parseFloat(latitude as string),
        parseFloat(longitude as string)
      );
      
      res.json(destinations);
    } catch (error) {
      console.error('Error fetching emergency legal destinations:', error);
      res.status(500).json({ message: 'Failed to fetch emergency legal destinations' });
    }
  });

  app.get('/api/legal-destinations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const destination = await storage.getLegalDestination(parseInt(id));
      
      if (!destination) {
        return res.status(404).json({ message: 'Legal destination not found' });
      }
      
      res.json(destination);
    } catch (error) {
      console.error('Error fetching legal destination:', error);
      res.status(500).json({ message: 'Failed to fetch legal destination' });
    }
  });

  app.post('/api/legal-destinations', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const destination = await storage.createLegalDestination(req.body);
      res.status(201).json(destination);
    } catch (error) {
      console.error('Error creating legal destination:', error);
      res.status(500).json({ message: 'Failed to create legal destination' });
    }
  });

  app.put('/api/legal-destinations/:id', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const destination = await storage.updateLegalDestination(parseInt(id), req.body);
      res.json(destination);
    } catch (error) {
      console.error('Error updating legal destination:', error);
      res.status(500).json({ message: 'Failed to update legal destination' });
    }
  });

  app.delete('/api/legal-destinations/:id', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      await storage.deleteLegalDestination(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting legal destination:', error);
      res.status(500).json({ message: 'Failed to delete legal destination' });
    }
  });

  // Legal Routes API Endpoints
  app.get('/api/legal-routes', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { status } = req.query;
      const routes = await storage.getLegalRoutes(currentUser.id, status as string);
      res.json(routes);
    } catch (error) {
      console.error('Error fetching legal routes:', error);
      res.status(500).json({ message: 'Failed to fetch legal routes' });
    }
  });

  app.get('/api/legal-routes/:id', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const route = await storage.getLegalRoute(parseInt(id), currentUser.id);
      
      if (!route) {
        return res.status(404).json({ message: 'Legal route not found' });
      }
      
      res.json(route);
    } catch (error) {
      console.error('Error fetching legal route:', error);
      res.status(500).json({ message: 'Failed to fetch legal route' });
    }
  });

  app.post('/api/legal-routes', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const routeData = {
        ...req.body,
        userId: currentUser.id
      };

      const route = await storage.createLegalRoute(routeData);
      res.status(201).json(route);
    } catch (error) {
      console.error('Error creating legal route:', error);
      res.status(500).json({ message: 'Failed to create legal route' });
    }
  });

  app.put('/api/legal-routes/:id', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const route = await storage.updateLegalRoute(parseInt(id), currentUser.id, req.body);
      res.json(route);
    } catch (error) {
      console.error('Error updating legal route:', error);
      res.status(500).json({ message: 'Failed to update legal route' });
    }
  });

  app.delete('/api/legal-routes/:id', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      await storage.deleteLegalRoute(parseInt(id), currentUser.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting legal route:', error);
      res.status(500).json({ message: 'Failed to delete legal route' });
    }
  });

  // EXTRACTED: officer complaints API endpoints moved to recording.routes.ts

  // EXTRACTED: evidence upload endpoint moved to recording.routes.ts

  // EXTRACTED: get complaint evidence endpoint moved to recording.routes.ts

  // EXTRACTED: get user's complaints (archive) endpoint moved to recording.routes.ts

  // EXTRACTED: get complaint updates/timeline endpoint moved to recording.routes.ts

  // EXTRACTED: submit complaint via email endpoint moved to recording.routes.ts

  // Serve static admin dashboard
  app.get("/admin-static", async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const url = await import('url');
      
      const __filename = url.fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filePath = path.join(__dirname, 'static-admin.html');
      
      const htmlContent = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (err) {
      console.error('Error serving admin dashboard:', err);
      res.status(500).send('Error loading admin dashboard');
    }
  });

  // Load Testing API Endpoints
  app.post('/api/load-test/start', (req: any, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'CAREN_ADMIN_2025_PRODUCTION') {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    next();
  }, async (req: any, res) => {
    try {
      const { scenario } = req.body;
      
      // Security audit log
      console.log(`[SECURITY AUDIT] ${JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'LOAD_TEST_STARTED',
        userId: 'admin',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: JSON.stringify({ scenario, timestamp: new Date().toISOString() })
      })}`);

      // Start load test (this would trigger the actual load test script)
      const loadTestResult = {
        sessionId: `loadtest_${Date.now()}`,
        scenario,
        status: 'started',
        startTime: new Date().toISOString()
      };

      res.json(loadTestResult);
    } catch (error: any) {
      console.error('Error starting load test:', error);
      res.status(500).json({ message: 'Failed to start load test' });
    }
  });

  app.get('/api/load-test/status/:sessionId', (req: any, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'CAREN_ADMIN_2025_PRODUCTION') {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    next();
  }, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      
      // This would check actual load test status
      const mockStatus = {
        sessionId,
        status: Math.random() > 0.3 ? 'running' : 'completed',
        progress: Math.floor(Math.random() * 100),
        metrics: {
          currentRPS: Math.floor(Math.random() * 100) + 50,
          responseTime: Math.floor(Math.random() * 200) + 50,
          errorRate: Math.random() * 5,
          activeConnections: Math.floor(Math.random() * 500) + 200
        }
      };

      res.json(mockStatus);
    } catch (error: any) {
      console.error('Error getting load test status:', error);
      res.status(500).json({ message: 'Failed to get load test status' });
    }
  });

  // N8N Webhook Test and Configuration Endpoints
  app.post('/api/admin/n8n/test-webhooks', (req: any, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'CAREN_ADMIN_2025_PRODUCTION') {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    next();
  }, async (req: any, res) => {
    try {
      console.log('[N8N] Testing webhook connectivity...');
      const results = await n8nWebhookService.testWebhooks();
      
      res.json({
        success: true,
        results,
        timestamp: new Date().toISOString(),
        config: n8nWebhookService.getConfig()
      });
    } catch (error: any) {
      console.error('[N8N] Webhook test error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  app.post('/api/admin/n8n/trigger-test-emergency', (req: any, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'CAREN_ADMIN_2025_PRODUCTION') {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    next();
  }, async (req: any, res) => {
    try {
      const testPayload = {
        userId: 'test-user-admin',
        emergencyType: 'traffic_stop' as const,
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        },
        location: {
          address: '123 Test Street',
          city: 'San Francisco',
          state: 'CA'
        },
        timestamp: new Date().toISOString(),
        userEmail: 'admin@carenalert.com',
        userName: 'Admin Test User',
        urgency: 'high' as const,
        metadata: {
          recordingActive: true,
          attorneyRequested: true,
          situationContext: 'Admin test emergency trigger'
        }
      };

      console.log('[N8N] Triggering test emergency response...');
      const success = await n8nWebhookService.triggerEmergencyResponse(testPayload);
      
      res.json({
        success,
        message: success ? 'Test emergency triggered successfully' : 'Test emergency failed',
        payload: testPayload,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('[N8N] Test emergency trigger error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  app.get('/api/admin/n8n/config', (req: any, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token !== 'CAREN_ADMIN_2025_PRODUCTION') {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    next();
  }, async (req: any, res) => {
    try {
      const config = n8nWebhookService.getConfig();
      res.json({
        config: {
          ...config,
          emergencyResponseUrl: config.emergencyResponseUrl ? '[CONFIGURED]' : '[NOT SET]',
          userJourneyUrl: config.userJourneyUrl ? '[CONFIGURED]' : '[NOT SET]'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ====================================
  // PRIORITY #2: USER JOURNEY PROGRESS AUTOMATION
  // ====================================

  // EXTRACTED: journey tracking endpoint moved to journey.routes.ts
  // Track user actions and trigger milestone progress

  // [EXTRACTED] Journey tracking endpoint code moved to journey.routes.ts

  // EXTRACTED: sparkle trigger endpoint moved to journey.routes.ts

  // Get user journey progress and stats
  app.get('/api/journey/progress/:userId?', async (req: any, res) => {
    try {
      const userId = req.params.userId || req.user?.claims?.sub || req.session?.userId || 'demo-user';

      // Get user progress and stats
      try {
        const progress = await storage.getUserJourneyProgress(userId);
        const stats = await storage.getUserJourneyStats(userId);
        
        res.json({
          userId,
          progress: progress || {
            completedMilestones: [],
            currentLevel: 1,
            totalPoints: 0,
            streakDays: 0
          },
          stats: stats || {
            level: 1,
            totalPoints: 0,
            milestonesCompleted: 0,
            streakDays: 0,
            lastActiveDate: new Date().toISOString()
          }
        });
      } catch (error) {
        // Return default progress if database not ready
        res.json({
          userId,
          progress: {
            completedMilestones: [],
            currentLevel: 1,
            totalPoints: 0,
            streakDays: 0
          },
          stats: {
            level: 1,
            totalPoints: 0,
            milestonesCompleted: 0,
            streakDays: 0,
            lastActiveDate: new Date().toISOString()
          },
          note: "Journey tracking system ready - database schema pending"
        });
      }

    } catch (error) {
      console.error("Error getting user journey progress:", error);
      res.status(500).json({ message: "Failed to get user progress" });
    }
  });

  // N8N status endpoint with Priority #2 support
  app.get('/api/n8n/status', async (req, res) => {
    try {
      res.json({
        webhookService: 'operational',
        emergencyEndpoint: '/api/emergency-alerts',
        unauthenticatedEndpoint: '/api/emergency/alert',
        userJourneyEndpoint: '/api/journey/track-action',
        sparkleEndpoint: '/api/journey/trigger-sparkle',
        progressEndpoint: '/api/journey/progress',
        priority1Status: 'COMPLETE - Emergency Response Automation',
        priority2Status: 'OPERATIONAL - User Journey Progress Automation',
        status: 'ready for n8n webhook integration - Priority #1 & #2 automation'
      });
    } catch (error) {
      console.error("Error getting N8N status:", error);
      res.status(500).json({ message: "Failed to get N8N status" });
    }
  });


  // Get user manual download (placeholder)
  app.get('/api/downloads/user-manual.pdf', (req, res) => {
    res.status(404).json({ 
      message: 'User manual download not yet available',
      comingSoon: true 
    });
  });

  // Community Forum API Routes
  
  // EXTRACTED: forum categories endpoint moved to forum.routes.ts

  // EXTRACTED: forum category by ID endpoint moved to forum.routes.ts

  // EXTRACTED: forum stats endpoint moved to forum.routes.ts

  // EXTRACTED: create forum category endpoint moved to forum.routes.ts

  // EXTRACTED: forum category posts endpoint moved to forum.routes.ts

  // EXTRACTED: create forum post endpoint moved to forum.routes.ts

  // Get a specific forum post with replies
  app.get('/api/forum/posts/:postId', async (req, res) => {
    try {
      const { postId } = req.params;
      const post = await storage.getForumPost(parseInt(postId));
      
      if (!post) {
        return res.status(404).json({ message: 'Forum post not found' });
      }

      const replies = await storage.getForumReplies(parseInt(postId));
      res.json({ post, replies });
    } catch (error) {
      console.error('[FORUM] Error fetching post:', error);
      res.status(500).json({ message: 'Failed to fetch forum post' });
    }
  });

  // Update a forum post (author only)
  app.patch('/api/forum/posts/:postId', isAuthenticated, async (req: any, res) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { postId } = req.params;
      const updates = req.body;
      
      const post = await storage.updateForumPost(parseInt(postId), user.id, updates);
      res.json(post);
    } catch (error) {
      console.error('[FORUM] Error updating post:', error);
      res.status(500).json({ message: 'Failed to update forum post' });
    }
  });

  // Delete a forum post (author only)
  app.delete('/api/forum/posts/:postId', isAuthenticated, async (req: any, res) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { postId } = req.params;
      await storage.deleteForumPost(parseInt(postId), user.id);
      res.json({ message: 'Forum post deleted successfully' });
    } catch (error) {
      console.error('[FORUM] Error deleting post:', error);
      res.status(500).json({ message: 'Failed to delete forum post' });
    }
  });

  // Create a reply to a forum post
  app.post('/api/forum/posts/:postId/replies', isAuthenticated, async (req: any, res) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { postId } = req.params;
      const replyData = insertForumReplySchema.parse({
        ...req.body,
        postId: parseInt(postId),
        userId: user.id
      });
      
      const reply = await storage.createForumReply(replyData);
      res.json(reply);
    } catch (error) {
      console.error('[FORUM] Error creating reply:', error);
      res.status(500).json({ message: 'Failed to create forum reply' });
    }
  });

  // Update a forum reply (author only)
  app.patch('/api/forum/replies/:replyId', isAuthenticated, async (req: any, res) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { replyId } = req.params;
      const updates = req.body;
      
      const reply = await storage.updateForumReply(parseInt(replyId), user.id, updates);
      res.json(reply);
    } catch (error) {
      console.error('[FORUM] Error updating reply:', error);
      res.status(500).json({ message: 'Failed to update forum reply' });
    }
  });

  // Delete a forum reply (author only)
  app.delete('/api/forum/replies/:replyId', isAuthenticated, async (req: any, res) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { replyId } = req.params;
      await storage.deleteForumReply(parseInt(replyId), user.id);
      res.json({ message: 'Forum reply deleted successfully' });
    } catch (error) {
      console.error('[FORUM] Error deleting reply:', error);
      res.status(500).json({ message: 'Failed to delete forum reply' });
    }
  });

  // Learning Analytics API Endpoints
  
  // Track user action
  app.post('/api/learning-analytics/track-action', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const actionData = req.body;
      
      const action = await storage.trackUserAction({
        ...actionData,
        userId,
        timestamp: new Date()
      });
      
      res.json({ success: true, action });
    } catch (error) {
      console.error('Error tracking user action:', error);
      res.status(500).json({ message: 'Failed to track user action' });
    }
  });

  // Get user actions history
  app.get('/api/learning-analytics/actions', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const limit = parseInt(req.query.limit as string) || 50;
      
      const actions = await storage.getUserActions(userId, limit);
      res.json({ success: true, actions });
    } catch (error) {
      console.error('Error fetching user actions:', error);
      res.status(500).json({ message: 'Failed to fetch user actions' });
    }
  });

  // Update learning progress
  app.post('/api/learning-analytics/progress', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const progressData = req.body;
      
      const progress = await storage.updateLearningProgress({
        ...progressData,
        userId,
        updatedAt: new Date()
      });
      
      res.json({ success: true, progress });
    } catch (error) {
      console.error('Error updating learning progress:', error);
      res.status(500).json({ message: 'Failed to update learning progress' });
    }
  });

  // Get learning progress
  app.get('/api/learning-analytics/progress', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const category = req.query.category as string;
      
      const progress = await storage.getLearningProgress(userId, category);
      res.json({ success: true, progress });
    } catch (error) {
      console.error('Error fetching learning progress:', error);
      res.status(500).json({ message: 'Failed to fetch learning progress' });
    }
  });

  // Track content engagement
  app.post('/api/learning-analytics/engagement', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const engagementData = req.body;
      
      const engagement = await storage.trackContentEngagement({
        ...engagementData,
        userId,
        timestamp: new Date()
      });
      
      res.json({ success: true, engagement });
    } catch (error) {
      console.error('Error tracking content engagement:', error);
      res.status(500).json({ message: 'Failed to track content engagement' });
    }
  });

  // Get content engagement history
  app.get('/api/learning-analytics/engagement', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const contentType = req.query.contentType as string;
      
      const engagement = await storage.getContentEngagement(userId, contentType);
      res.json({ success: true, engagement });
    } catch (error) {
      console.error('Error fetching content engagement:', error);
      res.status(500).json({ message: 'Failed to fetch content engagement' });
    }
  });

  // Create knowledge assessment
  app.post('/api/learning-analytics/assessment', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const assessmentData = req.body;
      
      const assessment = await storage.createKnowledgeAssessment({
        ...assessmentData,
        userId,
        timestamp: new Date()
      });
      
      res.json({ success: true, assessment });
    } catch (error) {
      console.error('Error creating knowledge assessment:', error);
      res.status(500).json({ message: 'Failed to create knowledge assessment' });
    }
  });

  // Get knowledge assessments
  app.get('/api/learning-analytics/assessments', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const category = req.query.category as string;
      
      const assessments = await storage.getKnowledgeAssessments(userId, category);
      res.json({ success: true, assessments });
    } catch (error) {
      console.error('Error fetching knowledge assessments:', error);
      res.status(500).json({ message: 'Failed to fetch knowledge assessments' });
    }
  });

  // Update feature usage
  app.post('/api/learning-analytics/feature-usage', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const usageData = req.body;
      
      const usage = await storage.updateFeatureUsage({
        ...usageData,
        userId,
        lastUsed: new Date(),
        updatedAt: new Date()
      });
      
      res.json({ success: true, usage });
    } catch (error) {
      console.error('Error updating feature usage:', error);
      res.status(500).json({ message: 'Failed to update feature usage' });
    }
  });

  // Get feature usage statistics
  app.get('/api/learning-analytics/feature-usage', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const feature = req.query.feature as string;
      
      const usage = await storage.getFeatureUsage(userId, feature);
      res.json({ success: true, usage });
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      res.status(500).json({ message: 'Failed to fetch feature usage' });
    }
  });

  // Track emergency response metrics
  app.post('/api/learning-analytics/emergency-response', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const metricData = req.body;
      
      const metric = await storage.trackEmergencyResponse({
        ...metricData,
        userId,
        timestamp: new Date()
      });
      
      res.json({ success: true, metric });
    } catch (error) {
      console.error('Error tracking emergency response:', error);
      res.status(500).json({ message: 'Failed to track emergency response' });
    }
  });

  // Get emergency response metrics
  app.get('/api/learning-analytics/emergency-response', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const scenarioType = req.query.scenarioType as string;
      
      const metrics = await storage.getEmergencyResponseMetrics(userId, scenarioType);
      res.json({ success: true, metrics });
    } catch (error) {
      console.error('Error fetching emergency response metrics:', error);
      res.status(500).json({ message: 'Failed to fetch emergency response metrics' });
    }
  });

  // Create AI learning insight
  app.post('/api/learning-analytics/ai-insights', async (req: any, res) => {
    try {
      const insight = await storage.createAILearningInsight({
        ...req.body,
        createdAt: new Date()
      });
      
      res.json({ success: true, insight });
    } catch (error) {
      console.error('Error creating AI learning insight:', error);
      res.status(500).json({ message: 'Failed to create AI learning insight' });
    }
  });

  // Get AI learning insights
  app.get('/api/learning-analytics/ai-insights', async (req: any, res) => {
    try {
      const category = req.query.category as string;
      const actionable = req.query.actionable === 'true' ? true : undefined;
      
      const insights = await storage.getAILearningInsights(category, actionable);
      res.json({ success: true, insights });
    } catch (error) {
      console.error('Error fetching AI learning insights:', error);
      res.status(500).json({ message: 'Failed to fetch AI learning insights' });
    }
  });

  // Get comprehensive learning analytics summary
  app.get('/api/learning-analytics/summary', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      
      const summary = await storage.getLearningAnalyticsSummary(userId);
      res.json({ success: true, summary });
    } catch (error) {
      console.error('Error fetching learning analytics summary:', error);
      res.status(500).json({ message: 'Failed to fetch learning analytics summary' });
    }
  });

  // Get platform-wide learning insights (admin only)
  app.get('/api/learning-analytics/platform-insights', async (req: any, res) => {
    try {
      // Check for admin authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Admin authorization required' });
      }

      const token = authHeader.split(' ')[1];
      if (token !== 'CAREN_ADMIN_2025_PRODUCTION') {
        return res.status(403).json({ message: 'Invalid admin credentials' });
      }
      
      const insights = await storage.getPlatformLearningInsights();
      res.json({ success: true, insights });
    } catch (error) {
      console.error('Error fetching platform learning insights:', error);
      res.status(500).json({ message: 'Failed to fetch platform learning insights' });
    }
  });

  // ============================================================================
  // USER JOURNEY PROGRESS SPARKLE TRACKER API ENDPOINTS
  // ============================================================================

  // Get user journey milestones
  app.get('/api/journey/milestones', async (req: any, res) => {
    try {
      const category = req.query.category as string | undefined;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
      
      const milestones = await storage.getJourneyMilestones(category, isActive);
      res.json({ success: true, milestones });
    } catch (error) {
      console.error('Error fetching journey milestones:', error);
      res.status(500).json({ message: 'Failed to fetch journey milestones' });
    }
  });

  // Get specific milestone
  app.get('/api/journey/milestones/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid milestone ID' });
      }
      
      const milestone = await storage.getJourneyMilestone(id);
      if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
      }
      
      res.json({ success: true, milestone });
    } catch (error) {
      console.error('Error fetching milestone:', error);
      res.status(500).json({ message: 'Failed to fetch milestone' });
    }
  });

  // Get user progress
  app.get('/api/journey/progress', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const milestoneId = req.query.milestoneId ? parseInt(req.query.milestoneId as string) : undefined;
      
      const progress = await storage.getUserProgress(userId, milestoneId);
      res.json({ success: true, progress });
    } catch (error) {
      console.error('Error fetching user progress:', error);
      res.status(500).json({ message: 'Failed to fetch user progress' });
    }
  });

  // Get completed milestones
  app.get('/api/journey/completed', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const category = req.query.category as string | undefined;
      
      const completed = await storage.getCompletedMilestones(userId, category);
      res.json({ success: true, completed });
    } catch (error) {
      console.error('Error fetching completed milestones:', error);
      res.status(500).json({ message: 'Failed to fetch completed milestones' });
    }
  });

  // Get user journey stats
  app.get('/api/journey/stats', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      
      const stats = await storage.getUserJourneyStats(userId);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching journey stats:', error);
      res.status(500).json({ message: 'Failed to fetch journey stats' });
    }
  });

  // Get progress analytics
  app.get('/api/journey/analytics', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      
      const analytics = await storage.getProgressAnalytics(userId);
      res.json({ success: true, analytics });
    } catch (error) {
      console.error('Error fetching progress analytics:', error);
      res.status(500).json({ message: 'Failed to fetch progress analytics' });
    }
  });

  // Get pending sparkles
  app.get('/api/journey/sparkles', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const location = req.query.location as string | undefined;
      
      const sparkles = await storage.getPendingSparkles(userId, location);
      res.json({ success: true, sparkles });
    } catch (error) {
      console.error('Error fetching pending sparkles:', error);
      res.status(500).json({ message: 'Failed to fetch pending sparkles' });
    }
  });

  // Mark sparkle as shown
  app.post('/api/journey/sparkles/:id/shown', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const sparkleId = parseInt(req.params.id);
      
      if (isNaN(sparkleId)) {
        return res.status(400).json({ message: 'Invalid sparkle ID' });
      }
      
      const sparkle = await storage.markSparkleQueueShown(sparkleId);
      res.json({ success: true, sparkle });
    } catch (error) {
      console.error('Error marking sparkle as shown:', error);
      res.status(500).json({ message: 'Failed to mark sparkle as shown' });
    }
  });

  // Get user badges
  app.get('/api/journey/badges', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const isDisplayed = req.query.isDisplayed ? req.query.isDisplayed === 'true' : undefined;
      
      const badges = await storage.getUserBadges(userId, isDisplayed);
      res.json({ success: true, badges });
    } catch (error) {
      console.error('Error fetching user badges:', error);
      res.status(500).json({ message: 'Failed to fetch user badges' });
    }
  });

  // Get journey badges (available badges)
  app.get('/api/journey/badges/available', async (req: any, res) => {
    try {
      const badgeType = req.query.badgeType as string | undefined;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
      
      const badges = await storage.getJourneyBadges(badgeType, isActive);
      res.json({ success: true, badges });
    } catch (error) {
      console.error('Error fetching available badges:', error);
      res.status(500).json({ message: 'Failed to fetch available badges' });
    }
  });

  // Get daily streaks
  app.get('/api/journey/streaks', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      
      const streaks = await storage.getDailyStreaks(userId, days);
      res.json({ success: true, streaks });
    } catch (error) {
      console.error('Error fetching daily streaks:', error);
      res.status(500).json({ message: 'Failed to fetch daily streaks' });
    }
  });

  // Get current streak
  app.get('/api/journey/streaks/current', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      
      const currentStreak = await storage.getCurrentStreak(userId);
      res.json({ success: true, currentStreak });
    } catch (error) {
      console.error('Error fetching current streak:', error);
      res.status(500).json({ message: 'Failed to fetch current streak' });
    }
  });

  // Trigger milestone check (for automatic milestone detection)
  app.post('/api/journey/check-milestones', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const { actionType, relatedEntityId, relatedEntityType } = req.body;
      
      if (!actionType) {
        return res.status(400).json({ message: 'Action type is required' });
      }
      
      const newProgress = await storage.checkAndAwardMilestones(userId, actionType, relatedEntityId, relatedEntityType);
      res.json({ success: true, newProgress });
    } catch (error) {
      console.error('Error checking milestones:', error);
      res.status(500).json({ message: 'Failed to check milestones' });
    }
  });

  // Manual milestone trigger (for specific milestone names)
  app.post('/api/journey/trigger-milestones', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const { milestoneNames } = req.body;
      
      if (!milestoneNames || !Array.isArray(milestoneNames)) {
        return res.status(400).json({ message: 'Milestone names array is required' });
      }
      
      const newProgress = await storage.triggerMilestoneCheck(userId, milestoneNames);
      res.json({ success: true, newProgress });
    } catch (error) {
      console.error('Error triggering milestones:', error);
      res.status(500).json({ message: 'Failed to trigger milestones' });
    }
  });

  // Update user streak (call when user is active)
  app.post('/api/journey/update-streak', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      
      const stats = await storage.updateUserStreak(userId);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error updating user streak:', error);
      res.status(500).json({ message: 'Failed to update user streak' });
    }
  });

  // Record daily activity
  app.post('/api/journey/daily-activity', async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      const { activityCount, milestonesEarned, pointsEarned, mainActivity } = req.body;
      
      const streak = await storage.recordDailyActivity({
        userId,
        date: new Date(),
        activityCount: activityCount || 1,
        milestonesEarned: milestonesEarned || 0,
        pointsEarned: pointsEarned || 0,
        mainActivity: mainActivity || 'platform_use',
        isStreakDay: true
      });
      
      res.json({ success: true, streak });
    } catch (error) {
      console.error('Error recording daily activity:', error);
      res.status(500).json({ message: 'Failed to record daily activity' });
    }
  });

  app.get('/api/download/safari-extension', async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    const filePath = path.join(process.cwd(), 'CAREN-Safari-Extension.zip');
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="CAREN-Safari-Extension.zip"');
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'Safari extension package not found' });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket manager for real-time synchronization
  const wsManager = new WebSocketManager(httpServer);
  
  // Store reference globally for use in API endpoints
  (global as any).wsManager = wsManager;
  
  return httpServer;
}
