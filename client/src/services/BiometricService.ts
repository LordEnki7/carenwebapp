import { Capacitor } from '@capacitor/core';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  method?: 'fingerprint' | 'face' | 'iris' | 'none';
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType: 'fingerprint' | 'face' | 'iris' | 'none';
  isEnrolled: boolean;
}

class BiometricServiceClass {
  private isNative: boolean;
  private biometricCache: BiometricCapabilities | null = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    if (this.biometricCache) {
      return this.biometricCache;
    }

    if (!this.isNative) {
      this.biometricCache = {
        isAvailable: false,
        biometryType: 'none',
        isEnrolled: false
      };
      return this.biometricCache;
    }

    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      const result = await NativeBiometric.isAvailable();
      
      this.biometricCache = {
        isAvailable: result.isAvailable,
        biometryType: this.mapBiometryType(result.biometryType),
        isEnrolled: result.isAvailable
      };
      
      console.log('[BIOMETRIC] Capabilities:', this.biometricCache);
      return this.biometricCache;
    } catch (error) {
      console.log('[BIOMETRIC] Native biometric not available, using fallback');
      this.biometricCache = {
        isAvailable: false,
        biometryType: 'none',
        isEnrolled: false
      };
      return this.biometricCache;
    }
  }

  private mapBiometryType(type: number | undefined): 'fingerprint' | 'face' | 'iris' | 'none' {
    switch (type) {
      case 1: return 'fingerprint';
      case 2: return 'face';
      case 3: return 'iris';
      default: return 'none';
    }
  }

  async authenticateWithBiometric(reason: string = 'Verify your identity'): Promise<BiometricAuthResult> {
    const capabilities = await this.checkBiometricCapabilities();
    
    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication not available on this device',
        method: 'none'
      };
    }

    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      
      await NativeBiometric.verifyIdentity({
        reason: reason,
        title: 'C.A.R.E.N.™ Security',
        subtitle: 'Authenticate to access sensitive features',
        description: reason,
        useFallback: true,
        fallbackTitle: 'Use Device PIN'
      });

      console.log('[BIOMETRIC] Authentication successful');
      return {
        success: true,
        method: capabilities.biometryType
      };
    } catch (error: any) {
      console.error('[BIOMETRIC] Authentication failed:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed',
        method: capabilities.biometryType
      };
    }
  }

  async authenticateForAttorneyMessaging(): Promise<BiometricAuthResult> {
    return this.authenticateWithBiometric(
      'Verify your identity to access attorney communications'
    );
  }

  async authenticateForSensitiveAction(action: string): Promise<BiometricAuthResult> {
    return this.authenticateWithBiometric(
      `Verify your identity to ${action}`
    );
  }

  async fallbackToPin(): Promise<boolean> {
    if (!this.isNative) {
      return this.showWebFallbackDialog();
    }

    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      await NativeBiometric.verifyIdentity({
        reason: 'Enter your device PIN',
        title: 'C.A.R.E.N.™ Security',
        subtitle: 'Use your device PIN to continue',
        useFallback: true,
        fallbackTitle: 'Use Device PIN'
      });
      return true;
    } catch (error) {
      console.error('[BIOMETRIC] PIN fallback failed:', error);
      return false;
    }
  }

  private showWebFallbackDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = window.confirm(
        'Biometric authentication is not available on this device.\n\n' +
        'For enhanced security, consider using the mobile app with biometric unlock.\n\n' +
        'Continue with standard authentication?'
      );
      resolve(confirmed);
    });
  }

  async isSecureAccessRequired(feature: 'attorney_messaging' | 'evidence_export' | 'account_settings'): Promise<boolean> {
    const sensitiveFeatures = ['attorney_messaging', 'evidence_export', 'account_settings'];
    return sensitiveFeatures.includes(feature);
  }

  async requireBiometricForFeature(feature: string): Promise<BiometricAuthResult> {
    const capabilities = await this.checkBiometricCapabilities();
    
    if (!capabilities.isAvailable) {
      const fallbackSuccess = await this.fallbackToPin();
      return {
        success: fallbackSuccess,
        method: 'none'
      };
    }

    return this.authenticateWithBiometric(`Access ${feature.replace(/_/g, ' ')}`);
  }
}

export const BiometricService = new BiometricServiceClass();
