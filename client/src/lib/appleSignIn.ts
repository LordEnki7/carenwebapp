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

export function isAppleSignInAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  if (!isAppleSignInAvailable()) {
    throw new Error('Sign in with Apple is only available on the iOS app.');
  }

  try {
    const result = await SignInWithApple.authorize({
      clientId: 'com.caren.safetyapp',
      redirectURI: 'https://carenalert.com',
      scopes: 'email name',
    });

    const r = result.response;
    return {
      identityToken: r.identityToken,
      authorizationCode: r.authorizationCode,
      email: r.email,
      givenName: r.givenName,
      familyName: r.familyName,
      user: r.user ?? '',
    };
  } catch (error: any) {
    if (
      error?.message === 'cancelled' ||
      error?.message?.toLowerCase().includes('cancel') ||
      error?.code === 1001
    ) {
      throw new Error('cancelled');
    }
    throw error;
  }
}
