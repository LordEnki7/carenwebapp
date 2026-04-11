import { Capacitor } from '@capacitor/core';

export interface AppleSignInResult {
  identityToken: string;
  authorizationCode: string;
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  user: string;
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  throw new Error('Sign in with Apple is only available on the iOS app. This feature will be enabled in a future iOS release.');
}

export function isAppleSignInAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}
