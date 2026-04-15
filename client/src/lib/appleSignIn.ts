import { Capacitor, registerPlugin } from '@capacitor/core';

export interface AppleSignInResult {
  identityToken: string;
  authorizationCode: string;
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  user: string;
}

interface AppleSignInPlugin {
  signIn(): Promise<AppleSignInResult>;
}

const AppleSignIn = registerPlugin<AppleSignInPlugin>('AppleSignIn');

export function isAppleSignInAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  if (!isAppleSignInAvailable()) {
    throw new Error('Sign in with Apple is only available on the iOS app.');
  }

  const result = await AppleSignIn.signIn();
  return result;
}
