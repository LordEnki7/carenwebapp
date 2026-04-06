import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

export interface AppleSignInResult {
  identityToken: string;
  authorizationCode: string;
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  user: string;
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Sign in with Apple is only available on the iOS app.');
  }

  const result = await SignInWithApple.authorize({
    clientId: 'com.caren.safetyapp',
    redirectURI: 'https://carenalert.com/api/auth/apple/callback',
    scopes: 'email name',
    state: Math.random().toString(36).substring(2),
    nonce: Math.random().toString(36).substring(2),
  });

  return {
    identityToken: result.response.identityToken,
    authorizationCode: result.response.authorizationCode,
    email: result.response.email,
    givenName: result.response.givenName,
    familyName: result.response.familyName,
    user: result.response.user,
  };
}

export function isAppleSignInAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}
