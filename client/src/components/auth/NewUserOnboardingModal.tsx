import OnboardingWalkthrough from '@/components/OnboardingWalkthrough';

interface NewUserOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userEmail?: string;
}

export default function NewUserOnboardingModal({ 
  isOpen, 
  onComplete,
}: NewUserOnboardingModalProps) {
  const handleComplete = () => {
    localStorage.setItem('caren_onboarding_state', JSON.stringify({
      hasSeenOnboarding: true,
      onboardingCompleted: true,
      preferredLanguage: 'en'
    }));
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('caren_onboarding_state', JSON.stringify({
      hasSeenOnboarding: true,
      onboardingCompleted: false,
      preferredLanguage: 'en'
    }));
    onComplete();
  };

  return (
    <OnboardingWalkthrough
      isOpen={isOpen}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}