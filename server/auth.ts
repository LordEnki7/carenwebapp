import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { sendWelcomeEmail } from './emailService';

const router = express.Router();

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  preferredLanguage: z.string().min(1),
  agreeToTerms: z.boolean(),
  agreeToPrivacy: z.boolean(),
  confirmPassword: z.string().optional(), // Optional field for frontend validation
  agreeToEULA: z.boolean().optional(), // Optional field
});

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    console.log(`[AUTH_LOGIN] Login attempt for email: ${email}`);
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    console.log(`[AUTH_LOGIN] User found:`, user ? 'yes' : 'no');
    console.log(`[AUTH_LOGIN] User has password:`, user?.password ? 'yes' : 'no');
    
    if (!user || !user.password) {
      console.log(`[AUTH_LOGIN] Login failed - user not found or no password`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(`[AUTH_LOGIN] Password validation result:`, isValidPassword);
    
    if (!isValidPassword) {
      console.log(`[AUTH_LOGIN] Login failed - invalid password`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Create session
    (req.session as any).userId = user.id;
    (req.session as any).email = user.email;
    (req.session as any).firstName = user.firstName;
    (req.session as any).lastName = user.lastName;
    (req.session as any).role = user.role;
    (req.session as any).subscriptionTier = user.subscriptionTier;
    
    console.log(`[AUTH_LOGIN] Session created for user: ${user.id}`);
    console.log(`[AUTH_LOGIN] Session data:`, {
      userId: (req.session as any).userId,
      email: (req.session as any).email
    });
    
    // Explicitly save the session
    req.session.save((err) => {
      if (err) {
        console.error('[AUTH_LOGIN] Session save error:', err);
        return res.status(500).json({ error: 'Session creation failed' });
      }
      
      console.log(`[AUTH_LOGIN] Session saved successfully`);
      console.log(`[AUTH_LOGIN] Session ID after save:`, req.sessionID);
      console.log(`[AUTH_LOGIN] Set-Cookie headers:`, res.getHeaders()['set-cookie']);
      console.log(`[AUTH_LOGIN] Response about to be sent with session data`);
      
      // Return user data (without password) - session token removed for security
      // Authentication now relies solely on httpOnly session cookies
      const { password: _, ...userWithoutPassword } = user;
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Only include session token in development for debugging
      if (!isProduction) {
        const sessionToken = `session_${user.id}_${Date.now()}`;
        (req.session as any).sessionToken = sessionToken;
        res.json({ 
          user: userWithoutPassword,
          sessionToken: sessionToken, // Development only
          message: 'Login successful' 
        });
      } else {
        res.json({ 
          user: userWithoutPassword,
          message: 'Login successful' 
        });
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, preferredLanguage, agreeToTerms, agreeToPrivacy } = registerSchema.parse(req.body);
    
    console.log(`[AUTH_REGISTER] Registration attempt for email: ${email}`);
    console.log(`[AUTH_REGISTER] Terms agreed: ${agreeToTerms}, Privacy agreed: ${agreeToPrivacy}`);
    
    // Validate that user has agreed to terms and privacy policy
    if (!agreeToTerms || !agreeToPrivacy) {
      console.log(`[AUTH_REGISTER] Registration failed - terms not accepted`);
      return res.status(400).json({ error: 'You must agree to the User Agreement and Privacy Policy' });
    }
    
    // Check if user already exists with a password
    const existingUser = await storage.getUserByEmail(email);
    console.log(`[AUTH_REGISTER] Existing user found:`, existingUser ? 'yes' : 'no');
    
    if (existingUser && existingUser.password) {
      console.log(`[AUTH_REGISTER] Registration failed - email already exists with password:`, existingUser.id);
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // If user exists but has no password (legacy data), update the existing user
    if (existingUser && !existingUser.password) {
      console.log(`[AUTH_REGISTER] Updating existing user without password:`, existingUser.id);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Update the existing user with password and new data
      const updatedUser = await storage.updateUserProfile(existingUser.id, {
        firstName,
        lastName,
        password: hashedPassword,
        agreedToTerms: true,
        termsAgreedAt: new Date(),
      });
      
      console.log(`[AUTH_REGISTER] Successfully updated existing user:`, updatedUser.id);
      
      // Create session
      (req.session as any).userId = updatedUser.id;
      (req.session as any).email = updatedUser.email;
      (req.session as any).firstName = updatedUser.firstName;
      (req.session as any).lastName = updatedUser.lastName;
      (req.session as any).role = updatedUser.role;
      (req.session as any).subscriptionTier = updatedUser.subscriptionTier;
      
      console.log(`[AUTH_REGISTER] Session created for updated user: ${updatedUser.id}`);
      
      // Explicitly save the session
      req.session.save((err) => {
        if (err) {
          console.error('[AUTH_REGISTER] Session save error:', err);
          return res.status(500).json({ error: 'Session creation failed' });
        }
        
        console.log(`[AUTH_REGISTER] Session saved successfully for updated user`);
        
        // Send welcome email asynchronously (don't block response)
        sendWelcomeEmail({
          email: updatedUser.email || '',
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || ''
        }).catch(err => console.error('[EMAIL] Welcome email failed for updated user:', err));
        
        return res.status(201).json({ 
          user: { 
            id: updatedUser.id, 
            email: updatedUser.email, 
            firstName: updatedUser.firstName, 
            lastName: updatedUser.lastName 
          } 
        });
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const newUser = await storage.createUser({
      id: uuidv4(),
      email,
      firstName,
      lastName,
      password: hashedPassword,
      profileImageUrl: null,
      role: 'user',
      subscriptionTier: 'free',
      currentState: null,
      preferredLanguage: preferredLanguage || 'en',
      emergencyContacts: null,
      agreedToTerms: agreeToTerms,
      termsAgreedAt: new Date(),
    });
    
    // Create session
    const session = req.session as any;
    session.userId = newUser.id;
    session.email = newUser.email;
    session.firstName = newUser.firstName;
    session.lastName = newUser.lastName;
    session.role = newUser.role;
    session.subscriptionTier = newUser.subscriptionTier;
    
    // Send welcome email asynchronously (don't block response)
    sendWelcomeEmail({
      email: newUser.email || '',
      firstName: newUser.firstName || '',
      lastName: newUser.lastName || ''
    }).catch(err => console.error('[EMAIL] Welcome email failed for new user:', err));
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ 
      user: userWithoutPassword,
      message: 'Account created successfully' 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    // Check if user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If that email is registered, you will receive password reset instructions' });
    }
    
    // In a real app, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with expiration
    // 3. Send email with reset link
    
    // For now, just return success message
    res.json({ message: 'If that email is registered, you will receive password reset instructions' });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Get current user route
router.get('/user', async (req, res) => {
  console.log(`[AUTH_ROUTER] /user route called - this is the auth.ts router!`);
  console.log(`[AUTH_USER] Authorization header:`, req.headers.authorization);
  try {
    // Check Authorization header for session token (demo or regular)
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (sessionToken) {
      console.log(`[AUTH_USER] Checking session token:`, sessionToken);
      
      // Check demo sessions first
      if (global.demoSessions && global.demoSessions.has(sessionToken)) {
        const demoSession = global.demoSessions.get(sessionToken);
        console.log(`[AUTH_USER] Found demo session! Returning user:`, demoSession.user.id);
        return res.json(demoSession.user);
      }
      
      // Check for regular session token (fallback for cookie issues)
      if (sessionToken.startsWith('session_')) {
        console.log(`[AUTH_USER] Checking regular session token`);
        const userId = sessionToken.split('_')[1];
        if (userId) {
          const user = await storage.getUser(userId);
          if (user) {
            console.log(`[AUTH_USER] Session token authentication successful for user:`, userId);
            const { password: _, ...userWithoutPassword } = user;
            return res.json(userWithoutPassword);
          }
        }
      }
      
      console.log(`[AUTH_USER] Session token not found or invalid`);
    }
    
    const session = req.session as any;
    console.log(`[AUTH_USER] Session check - sessionId:`, req.sessionID);
    console.log(`[AUTH_USER] Session data:`, {
      userId: session.userId,
      email: session.email,
      hasSession: !!req.session,
      sessionKeys: Object.keys(session || {})
    });
    
    // Check for regular authenticated session
    if (session.userId) {
      console.log(`[AUTH_USER] Regular session found for user:`, session.userId);
      // Get user from database
      const user = await storage.getUser(session.userId);
      if (user) {
        console.log(`[AUTH_USER] Database user found, returning data`);
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      } else {
        console.log(`[AUTH_USER] User not found in database for session`);
      }
    }
    
    // No valid session found
    if (!session.userId) {
      console.log(`[AUTH_USER] No userId in session and no valid demo session - returning 401`);
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Handle demo user specially
    if (session.userId === 'demo-user-123') {
      console.log(`[AUTH_USER] Demo user detected - returning demo user data`);
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
      return res.json(demoUser);
    }
    
    const user = await storage.getUser(session.userId);
    console.log(`[AUTH_USER] User lookup result:`, user ? 'found' : 'not found');
    
    if (!user) {
      console.log(`[AUTH_USER] User not found in database - returning 401`);
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log(`[AUTH_USER] Successfully returning user data for:`, user.id);
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('caren.sid');
    res.json({ message: 'Logged out successfully' });
  });
});



// Authentication middleware
export const isAuthenticated = (req: any, res: any, next: any) => {
  const session = req.session as any;
  if (!session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

export default router;