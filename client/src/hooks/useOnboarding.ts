import { useState, useEffect } from 'react';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  preferredLanguage: 'en' | 'es';
  onboardingCompleted: boolean;
}

export const useOnboarding = () => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasSeenOnboarding: false,
    preferredLanguage: 'en',
    onboardingCompleted: false
  });

  const [showOnboardingVideo, setShowOnboardingVideo] = useState(false);

  // Load onboarding state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('caren_onboarding_state');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        setOnboardingState(parsedState);
      } catch (error) {
        console.error('Error parsing onboarding state:', error);
      }
    }
  }, []);

  // Save onboarding state to localStorage
  const updateOnboardingState = (updates: Partial<OnboardingState>) => {
    const newState = { ...onboardingState, ...updates };
    setOnboardingState(newState);
    localStorage.setItem('caren_onboarding_state', JSON.stringify(newState));
  };

  // Check if user should see onboarding video
  const shouldShowOnboarding = (isNewUser = false) => {
    // Show for new users who haven't seen it
    if (isNewUser && !onboardingState.hasSeenOnboarding) {
      return true;
    }
    // Show if manually triggered
    return showOnboardingVideo;
  };

  // Mark onboarding as completed
  const completeOnboarding = () => {
    updateOnboardingState({
      hasSeenOnboarding: true,
      onboardingCompleted: true
    });
    setShowOnboardingVideo(false);
  };

  // Skip onboarding
  const skipOnboarding = () => {
    updateOnboardingState({
      hasSeenOnboarding: true,
      onboardingCompleted: false
    });
    setShowOnboardingVideo(false);
  };

  // Set preferred language
  const setPreferredLanguage = (language: 'en' | 'es') => {
    updateOnboardingState({ preferredLanguage: language });
  };

  // Manually trigger onboarding (for replay)
  const triggerOnboarding = () => {
    setShowOnboardingVideo(true);
  };

  // Reset onboarding (for testing)
  const resetOnboarding = () => {
    localStorage.removeItem('caren_onboarding_state');
    setOnboardingState({
      hasSeenOnboarding: false,
      preferredLanguage: 'en',
      onboardingCompleted: false
    });
    setShowOnboardingVideo(false);
  };

  return {
    onboardingState,
    showOnboardingVideo,
    shouldShowOnboarding,
    completeOnboarding,
    skipOnboarding,
    setPreferredLanguage,
    triggerOnboarding,
    resetOnboarding
  };
};