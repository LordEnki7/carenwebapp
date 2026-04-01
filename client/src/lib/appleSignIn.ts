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
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Sign in with Apple is only available on the iOS app.');
  }

  // @vite-ignore tells the bundler not to resolve this at build time —
  // it is only ever called on iOS native where the plugin is available.
  const pkg = '@capacitor-community/apple-sign-in';
  const { SignInWithApple } = await import(/* @vite-ignore */ pkg);

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
