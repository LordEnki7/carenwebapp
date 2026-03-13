import { useState, useCallback } from 'react';
import { BiometricService, BiometricAuthResult, BiometricCapabilities } from '@/services/BiometricService';

export function useBiometricAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null);
  const [lastResult, setLastResult] = useState<BiometricAuthResult | null>(null);

  const checkCapabilities = useCallback(async () => {
    const caps = await BiometricService.checkBiometricCapabilities();
    setCapabilities(caps);
    return caps;
  }, []);

  const authenticateForAttorney = useCallback(async (): Promise<BiometricAuthResult> => {
    setIsAuthenticating(true);
    try {
      const result = await BiometricService.authenticateForAttorneyMessaging();
      setLastResult(result);
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const authenticateForFeature = useCallback(async (feature: string): Promise<BiometricAuthResult> => {
    setIsAuthenticating(true);
    try {
      const result = await BiometricService.requireBiometricForFeature(feature);
      setLastResult(result);
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const requireSecureAccess = useCallback(async (
    feature: 'attorney_messaging' | 'evidence_export' | 'account_settings',
    onSuccess: () => void,
    onFailure?: (error: string) => void
  ) => {
    const isRequired = await BiometricService.isSecureAccessRequired(feature);
    
    if (!isRequired) {
      onSuccess();
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await BiometricService.requireBiometricForFeature(feature);
      setLastResult(result);
      
      if (result.success) {
        onSuccess();
      } else if (onFailure) {
        onFailure(result.error || 'Authentication failed');
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  return {
    isAuthenticating,
    capabilities,
    lastResult,
    checkCapabilities,
    authenticateForAttorney,
    authenticateForFeature,
    requireSecureAccess,
    isBiometricAvailable: capabilities?.isAvailable ?? false
  };
}
