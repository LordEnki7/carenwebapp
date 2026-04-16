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

  try {
    const result = await AppleSignIn.signIn();
    return result;
  } catch (error: any) {
    // "not implemented" means the native Swift plugin isn't compiled into this build.
    // This happens when the app was built without running `npx cap sync ios` first.
    if (
      error?.message?.toLowerCase().includes('not implemented') ||
      error?.message?.toLowerCase().includes('plugin') ||
      error?.code === 'UNIMPLEMENTED'
    ) {
      throw new Error(
        'Sign in with Apple requires a fresh Xcode build.\n\nOn your Mac, run:\n  npx cap sync ios\nThen press ⌘R in Xcode to rebuild.'
      );
    }
    // User cancelled — don't treat that as an error
    if (error?.message === 'cancelled' || error?.message?.toLowerCase().includes('cancel')) {
      throw new Error('cancelled');
    }
    throw error;
  }
}
