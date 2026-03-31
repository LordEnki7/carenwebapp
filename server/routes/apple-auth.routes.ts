import { Express } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

export function registerAppleAuthRoutes(app: Express) {
  app.post('/api/auth/apple', async (req, res) => {
    try {
      const { identityToken, email, givenName, familyName, appleUserId: bodyAppleId } = req.body;

      if (!identityToken) {
        return res.status(400).json({ error: 'Identity token required' });
      }

      // Decode JWT payload from Apple identity token (base64url encoded)
      const parts = identityToken.split('.');
      if (parts.length !== 3) {
        return res.status(400).json({ error: 'Invalid identity token format' });
      }

      let payload: any;
      try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
      } catch {
        return res.status(400).json({ error: 'Failed to decode identity token' });
      }

      const appleUserId: string = payload.sub || bodyAppleId;
      const tokenEmail: string | undefined = payload.email || email;

      if (!appleUserId) {
        return res.status(400).json({ error: 'Invalid token: missing user identifier' });
      }

      // Find existing user by Apple ID first, then by email
      let user = await storage.getUserByAppleId(appleUserId);

      if (!user && tokenEmail) {
        user = await storage.getUserByEmail(tokenEmail);
        if (user) {
          // Link existing account to Apple ID
          user = await storage.linkAppleAccount(user.id, appleUserId);
        }
      }

      if (!user) {
        // Create new user from Apple Sign In
        const newUser = {
          id: crypto.randomUUID(),
          email: tokenEmail || null,
          firstName: givenName || null,
          lastName: familyName || null,
          googleId: null,
          appleId: appleUserId,
          profileImageUrl: null,
          password: null,
          role: 'user' as const,
          subscriptionTier: 'basic_guard',
          currentState: null,
          preferredLanguage: 'en',
          emergencyContacts: null,
          agreedToTerms: false,
          termsAgreedAt: null,
        };
        user = await storage.createUser(newUser);
      }

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).user = user;

      const sessionToken = `cdt_${user.id}_${Date.now()}_apple`;

      return res.json({
        success: true,
        user: { ...user, password: undefined },
        sessionToken,
        message: 'Sign in with Apple successful',
      });
    } catch (error: any) {
      console.error('[APPLE_AUTH] Error:', error);
      return res.status(500).json({ error: 'Apple authentication failed. Please try again.' });
    }
  });
}
