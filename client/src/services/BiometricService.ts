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

    this.biometricCache = {
      isAvailable: false,
      biometryType: 'none',
      isEnrolled: false
    };

    console.log('[BIOMETRIC] Native biometric plugin not available in this build');
    return this.biometricCache;
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

    return {
      success: false,
      error: 'Biometric authentication not available',
      method: 'none'
    };
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
    return false;
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
