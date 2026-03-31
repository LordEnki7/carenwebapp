import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface MascotState {
  isVisible: boolean;
  personality: 'guardian' | 'navigator' | 'family';
  currentMessage: string;
  userProgress: number;
  isEmergency: boolean;
  lastInteraction: number;
}

interface UseMascotGuideOptions {
  autoShow?: boolean;
  dismissible?: boolean;
  emergencyMode?: boolean;
  progressTracking?: boolean;
}

export function useMascotGuide(options: UseMascotGuideOptions = {}) {
  const {
    autoShow = true,
    dismissible = true,
    emergencyMode = false,
    progressTracking = true
  } = options;

  const [location] = useLocation();
  const [mascotState, setMascotState] = useState<MascotState>({
    isVisible: false,
    personality: 'guardian',
    currentMessage: '',
    userProgress: 0,
    isEmergency: false,
    lastInteraction: Date.now()
  });

  // Calculate user progress based on app usage
  const calculateProgress = () => {
    let progress = 0;
    
    // Check localStorage for user engagement indicators
    const incidentsCreated = localStorage.getItem('incidents_created');
    const emergencyContactsAdded = localStorage.getItem('emergency_contacts_added');
    const legalRightsViewed = localStorage.getItem('legal_rights_viewed');
    const subscriptionActive = localStorage.getItem('subscription_active');
    
    if (incidentsCreated && parseInt(incidentsCreated) > 0) progress += 25;
    if (emergencyContactsAdded && parseInt(emergencyContactsAdded) > 0) progress += 25;
    if (legalRightsViewed === 'true') progress += 25;
    if (subscriptionActive === 'true') progress += 25;
    
    return progress;
  };

  // Show mascot based on current page and context
  const showMascot = (message?: string, personality?: MascotState['personality']) => {
    setMascotState(prev => ({
      ...prev,
      isVisible: true,
      currentMessage: message || prev.currentMessage,
      personality: personality || prev.personality,
      lastInteraction: Date.now()
    }));
  };

  // Hide mascot
  const hideMascot = () => {
    setMascotState(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  // Trigger emergency mode
  const activateEmergencyMode = () => {
    setMascotState(prev => ({
      ...prev,
      isVisible: true,
      isEmergency: true,
      personality: 'guardian',
      currentMessage: 'Emergency protocols activated. Stay calm, I\'m documenting everything and alerting your contacts.'
    }));
  };

  // Clear emergency mode
  const deactivateEmergencyMode = () => {
    setMascotState(prev => ({
      ...prev,
      isEmergency: false
    }));
  };

  // Send custom message
  const sendMessage = (message: string, personality?: MascotState['personality']) => {
    showMascot(message, personality);
  };

  // Celebrate user achievements
  const celebrate = (achievement: string) => {
    const celebrationMessages = {
      'first_incident': 'Great job documenting your first incident! You\'re building important evidence.',
      'emergency_contact_added': 'Excellent! Your emergency contacts can now help protect you.',
      'subscription_upgraded': 'Welcome to enhanced protection! You now have access to premium features.',
      'legal_rights_learned': 'Knowledge is power! You\'re better prepared to protect your rights.',
      'family_protection': 'Your family is now safer with coordinated protection features!',
      'onboarding_complete': 'Welcome to the CAREN family! You\'re now ready to stay protected.',
      'level_up': 'Congratulations! You\'ve reached a new level of legal protection expertise.',
      'achievement_unlocked': 'Way to go! Your dedication to legal protection is paying off.'
    };

    const message = celebrationMessages[achievement as keyof typeof celebrationMessages] || 
                   'Congratulations! You\'re making great progress with your legal protection.';
    
    showMascot(message);
  };

  // Auto-show based on page and user behavior
  useEffect(() => {
    if (!autoShow) return;

    const handlePageVisit = () => {
      let personality: MascotState['personality'] = 'guardian';
      let shouldShow = false;

      // Determine if mascot should appear based on current page
      if (location.includes('/dashboard')) {
        shouldShow = true;
        personality = 'guardian';
      } else if (location.includes('/incidents')) {
        shouldShow = true;
        personality = 'guardian';
      } else if (location.includes('/gps') || location.includes('/rights')) {
        shouldShow = true;
        personality = 'navigator';
      } else if (location.includes('/family') || location.includes('/subscription')) {
        shouldShow = true;
        personality = 'family';
      }

      // Don't show if recently dismissed (within 5 minutes)
      const lastDismissed = localStorage.getItem('mascot_last_dismissed');
      if (lastDismissed && Date.now() - parseInt(lastDismissed) < 5 * 60 * 1000) {
        shouldShow = false;
      }

      if (shouldShow) {
        setTimeout(() => {
          setMascotState(prev => ({
            ...prev,
            isVisible: true,
            personality,
            userProgress: progressTracking ? calculateProgress() : 0
          }));
        }, 2000); // Delay to avoid immediate popup
      }
    };

    handlePageVisit();
  }, [location, autoShow, progressTracking]);

  // Handle emergency mode activation
  useEffect(() => {
    if (emergencyMode) {
      activateEmergencyMode();
    }
  }, [emergencyMode]);

  // Update progress periodically
  useEffect(() => {
    if (!progressTracking) return;

    const interval = setInterval(() => {
      const newProgress = calculateProgress();
      if (newProgress !== mascotState.userProgress) {
        setMascotState(prev => ({
          ...prev,
          userProgress: newProgress
        }));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [progressTracking, mascotState.userProgress]);

  // Handle dismissal
  const handleDismiss = () => {
    if (dismissible) {
      hideMascot();
      localStorage.setItem('mascot_last_dismissed', Date.now().toString());
    }
  };

  return {
    mascotState,
    showMascot,
    hideMascot,
    sendMessage,
    celebrate,
    activateEmergencyMode,
    deactivateEmergencyMode,
    handleDismiss,
    currentPage: location
  };
}