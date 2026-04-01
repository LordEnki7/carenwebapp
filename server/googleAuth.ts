import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";
import { sendGoogleWelcomeEmail } from "./emailService";
import { sendDirectGoogleWelcomeEmail } from "./emailServiceDirect";

export async function setupGoogleAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('[GOOGLE_AUTH] Google OAuth credentials not provided, skipping Google authentication setup');
    return;
  }

  // Use absolute callback URL so it works correctly behind Dokploy/nginx reverse proxy.
  // A relative URL causes Passport to construct http:// instead of https:// in production.
  const callbackURL = process.env.GOOGLE_CALLBACK_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://carenalert.com/api/auth/google/callback'
      : '/api/auth/google/callback');

  console.log('[GOOGLE_AUTH] Using callback URL:', callbackURL);

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      console.log('[GOOGLE_AUTH] Processing Google profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      let user = await storage.getUserByGoogleId(profile.id);

      if (!user) {
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await storage.getUserByEmail(email);
          if (user) {
            await storage.linkGoogleAccount(user.id, profile.id);
            console.log('[GOOGLE_AUTH] Linked Google account to existing user:', user.id);
          }
        }
      }

      if (!user) {
        const newUserId = uuidv4();
        const userData = {
          id: newUserId,
          email: profile.emails?.[0]?.value || null,
          firstName: profile.name?.givenName || null,
          lastName: profile.name?.familyName || null,
          googleId: profile.id,
          profileImageUrl: profile.photos?.[0]?.value || null,
          agreedToTerms: false,
          role: "user" as const,
          subscriptionTier: "free" as const,
          preferredLanguage: "en"
        };

        user = await storage.createUser(userData);
        console.log('[GOOGLE_AUTH] Created new user from Google account:', user.id);

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

  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signin?error=google_auth_failed' }),
    async (req, res) => {
      try {
        const user = req.user as any;

        const sessionToken = `gauth_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        req.session.userId = user.id;
        (req.session as any).authMethod = 'google';
        (req.session as any).sessionToken = sessionToken;

        console.log('[GOOGLE_AUTH] Google authentication successful for user:', user.id);

        if (user.email && user.firstName) {
          sendGoogleWelcomeEmail({
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || ''
          }).catch(err => console.error('[EMAIL] Google welcome email failed for returning user:', err));
        }

        const redirectTarget = !user.agreedToTerms
          ? `/signin?google_auth=true&session_token=${sessionToken}&needs_terms=true`
          : `/?google_auth=success&session_token=${sessionToken}`;

        // Save session to DB before redirecting — critical for OAuth flows
        req.session.save((err) => {
          if (err) {
            console.error('[GOOGLE_AUTH] Session save error:', err);
            return res.redirect('/signin?error=session_error');
          }
          res.redirect(redirectTarget);
        });
      } catch (error) {
        console.error('[GOOGLE_AUTH] Error in Google callback:', error);
        res.redirect('/signin?error=callback_error');
      }
    }
  );

  console.log('[GOOGLE_AUTH] Google OAuth authentication setup complete');
}
