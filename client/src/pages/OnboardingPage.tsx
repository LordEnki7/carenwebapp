import React from 'react';
import OnboardingVideo from '@/components/OnboardingVideo';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function OnboardingPage() {
  const { completeOnboarding, skipOnboarding } = useOnboarding();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <OnboardingVideo
          autoPlay={true}
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
          redirectToSignIn={true}
          showLanguageSelector={true}
        />
      </div>
    </div>
  );
}