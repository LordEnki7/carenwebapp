import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";
import { sendGoogleWelcomeEmail } from "./emailService";
import { sendDirectGoogleWelcomeEmail } from "./emailServiceDirect";

export async function setupGoogleAuth(app: Express) {
  // Only setup Google auth if credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('[GOOGLE_AUTH] Google OAuth credentials not provided, skipping Google authentication setup');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      console.log('[GOOGLE_AUTH] Processing Google profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      // Check if user already exists by Google ID
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (!user) {
        // Check if user exists by email
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await storage.getUserByEmail(email);
          if (user) {
            // Link Google account to existing user
            await storage.linkGoogleAccount(user.id, profile.id);
            console.log('[GOOGLE_AUTH] Linked Google account to existing user:', user.id);
          }
        }
      }

      if (!user) {
        // Create new user with Google data
        const newUserId = uuidv4();
        const userData = {
          id: newUserId,
          email: profile.emails?.[0]?.value || null,
          firstName: profile.name?.givenName || null,
          lastName: profile.name?.familyName || null,
          googleId: profile.id,
          profileImageUrl: profile.photos?.[0]?.value || null,
          agreedToTerms: false, // Will need to agree to terms after OAuth
          role: "user" as const,
          subscriptionTier: "free" as const,
          preferredLanguage: "en"
        };

        user = await storage.createUser(userData);
        console.log('[GOOGLE_AUTH] Created new user from Google account:', user.id);
        
        // Send Google welcome email asynchronously (don't block response) - using direct API
        sendDirectGoogleWelcomeEmail({
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || ''
        }).catch(err => console.error('[EMAIL] Google welcome email failed for new user:', err));
      }

      return done(null, user);
    } catch (error) {
      console.error('[GOOGLE_AUTH] Error processing Google authentication:', error);
      return done(error, null);
    }
  }));

  // Google authentication routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signin?error=google_auth_failed' }),
    async (req, res) => {
      try {
        const user = req.user as any;
        
        // Generate session token for Google authenticated user
        const sessionToken = `gauth_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        
        // Store session in database/memory for validation
        req.session.userId = user.id;
        req.session.authMethod = 'google';
        req.session.sessionToken = sessionToken;

        console.log('[GOOGLE_AUTH] Google authentication successful for user:', user.id);

        // Send Google welcome email for existing users returning (optional, non-blocking)
        if (user.email && user.firstName) {
          sendGoogleWelcomeEmail({
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || ''
          }).catch(err => console.error('[EMAIL] Google welcome email failed for returning user:', err));
        }

        // Check if user needs to agree to terms
        if (!user.agreedToTerms) {
          // Redirect to terms agreement page with session token
          res.redirect(`/signin?google_auth=true&session_token=${sessionToken}&needs_terms=true`);
        } else {
          // Direct to dashboard with session token
          res.redirect(`/?google_auth=success&session_token=${sessionToken}`);
        }
      } catch (error) {
        console.error('[GOOGLE_AUTH] Error in Google callback:', error);
        res.redirect('/signin?error=callback_error');
      }
    }
  );

  console.log('[GOOGLE_AUTH] Google OAuth authentication setup complete');
}