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

      let user: any = null;

      // Step 1: Try lookup by Apple ID (method may not exist on older deployments)
      if (typeof (storage as any).getUserByAppleId === 'function') {
        try {
          user = await (storage as any).getUserByAppleId(appleUserId);
        } catch (e) {
          console.warn('[APPLE_AUTH] getUserByAppleId failed, falling back to email lookup:', e);
        }
      }

      // Step 2: Fall back to email lookup
      if (!user && tokenEmail) {
        try {
          user = await storage.getUserByEmail(tokenEmail);
        } catch (e) {
          console.warn('[APPLE_AUTH] getUserByEmail failed:', e);
        }

        // Step 3: Try to link Apple ID to existing account (optional — non-fatal)
        if (user && typeof (storage as any).linkAppleAccount === 'function') {
          try {
            user = await (storage as any).linkAppleAccount(user.id, appleUserId);
          } catch (e) {
            console.warn('[APPLE_AUTH] linkAppleAccount failed (non-fatal):', e);
          }
        }
      }

      // Step 4: Create brand new user if none found
      if (!user) {
        try {
          const newUser: any = {
            id: crypto.randomUUID(),
            email: tokenEmail || null,
            firstName: givenName || null,
            lastName: familyName || null,
            googleId: null,
            profileImageUrl: null,
            password: null,
            role: 'user',
            subscriptionTier: 'basic_guard',
            currentState: null,
            preferredLanguage: 'en',
            emergencyContacts: null,
            agreedToTerms: true,
            termsAgreedAt: new Date(),
          };

          // Only include appleId if the column likely exists (post-migration)
          try {
            newUser.appleId = appleUserId;
          } catch {
            // ignore — older schema without apple_id column
          }

          user = await storage.createUser(newUser);
        } catch (createErr: any) {
          // If createUser fails due to unknown appleId column, retry without it
          console.warn('[APPLE_AUTH] createUser failed, retrying without appleId:', createErr.message);
          try {
            const fallbackUser: any = {
              id: crypto.randomUUID(),
              email: tokenEmail || `apple_${appleUserId.slice(0, 8)}@caren.app`,
              firstName: givenName || null,
              lastName: familyName || null,
              googleId: null,
              profileImageUrl: null,
              password: null,
              role: 'user',
              subscriptionTier: 'basic_guard',
              currentState: null,
              preferredLanguage: 'en',
              emergencyContacts: null,
              agreedToTerms: true,
            };
            user = await storage.createUser(fallbackUser);
          } catch (fallbackErr: any) {
            console.error('[APPLE_AUTH] createUser fallback also failed:', fallbackErr.message);
            return res.status(500).json({ error: 'Apple authentication failed. Please try again.' });
          }
        }
      }

      // Step 5: Ensure terms are accepted (non-fatal)
      if (user && !user.agreedToTerms) {
        try {
          if (typeof (storage as any).updateUserTermsAcceptance === 'function') {
            user = await (storage as any).updateUserTermsAcceptance(user.id);
          }
        } catch (e) {
          console.warn('[APPLE_AUTH] Could not update agreedToTerms (non-fatal):', e);
        }
      }

      // Step 6: Create session
      (req.session as any).userId = user.id;
      (req.session as any).user = user;

      const sessionToken = `cdt_${user.id}_${Date.now()}_apple`;

      console.log(`[APPLE_AUTH] Sign in successful for user: ${user.id}`);

      return res.json({
        success: true,
        user: { ...user, password: undefined },
        sessionToken,
        message: 'Sign in with Apple successful',
      });

    } catch (error: any) {
      console.error('[APPLE_AUTH] Unhandled error:', error.message, error.stack);
      return res.status(500).json({ error: 'Apple authentication failed. Please try again.' });
    }
  });
}
