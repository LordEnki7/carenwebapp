import { useState, useEffect, useCallback } from 'react';

interface AchievementTrigger {
  action: string;
  value?: number;
  metadata?: Record<string, any>;
}

interface UseAchievementsOptions {
  userId?: string;
  autoTrack?: boolean;
}

export function useAchievements(options: UseAchievementsOptions = {}) {
  const { userId, autoTrack = true } = options;
  
  // Track achievement progress
  const triggerAchievement = useCallback((trigger: AchievementTrigger) => {
    const { action, value = 1, metadata = {} } = trigger;
    
    // Update the global stats function if available
    if ((window as any).updateUserStats) {
      (window as any).updateUserStats(action, value);
    }
    
    // Also store in localStorage for immediate tracking
    const currentStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    const newStats = {
      ...currentStats,
      [action]: (currentStats[action] || 0) + value,
      last_updated: new Date().toISOString()
    };
    localStorage.setItem('user_stats', JSON.stringify(newStats));
    
    console.log(`Achievement trigger: ${action} (+${value})`, metadata);
  }, []);

  // Common achievement triggers
  const achievementTriggers = {
    // Onboarding
    login: () => triggerAchievement({ action: 'login' }),
    firstVisit: () => triggerAchievement({ action: 'first_visit' }),
    profileComplete: () => triggerAchievement({ action: 'profile_complete' }),
    
    // Incidents
    createIncident: () => triggerAchievement({ action: 'incidents_created' }),
    recordVideo: () => triggerAchievement({ action: 'videos_recorded' }),
    addLocation: () => triggerAchievement({ action: 'locations_added' }),
    
    // Emergency Contacts
    addEmergencyContact: () => triggerAchievement({ action: 'emergency_contacts_added' }),
    testEmergencySystem: () => triggerAchievement({ action: 'emergency_tests' }),
    
    // Legal Rights
    viewLegalRights: () => triggerAchievement({ action: 'legal_rights_viewed' }),
    learnState: (state: string) => triggerAchievement({ 
      action: 'states_learned', 
      metadata: { state } 
    }),
    visitState: (state: string) => triggerAchievement({ 
      action: 'states_visited', 
      metadata: { state } 
    }),
    
    // Subscription
    upgradePlan: (plan: string) => triggerAchievement({ 
      action: 'subscription_upgraded',
      metadata: { plan }
    }),
    activateFamilyPlan: () => triggerAchievement({ action: 'family_plan_active' }),
    enableTeenProtection: () => triggerAchievement({ action: 'teen_protection_enabled' }),
    
    // Engagement
    dailyLogin: () => triggerAchievement({ action: 'daily_logins' }),
    shareApp: () => triggerAchievement({ action: 'app_shares' }),
    helpFamily: () => triggerAchievement({ action: 'family_helped' }),
    
    // Advanced Features
    bluetoothConnect: () => triggerAchievement({ action: 'bluetooth_devices_connected' }),
    useVoiceCommand: () => triggerAchievement({ action: 'voice_commands_used' }),
    generateDocument: () => triggerAchievement({ action: 'documents_generated' }),
    
    // Expertise
    helpOthers: () => triggerAchievement({ action: 'others_helped' }),
    reportBug: () => triggerAchievement({ action: 'bugs_reported' }),
    provideFeedback: () => triggerAchievement({ action: 'feedback_provided' })
  };

  // Auto-track certain actions if enabled
  useEffect(() => {
    if (!autoTrack) return;
    
    // Track page visits
    const handlePageChange = () => {
      const path = window.location.pathname;
      
      if (path.includes('/dashboard')) {
        triggerAchievement({ action: 'dashboard_visits' });
      } else if (path.includes('/incidents')) {
        triggerAchievement({ action: 'incidents_page_visits' });
      } else if (path.includes('/emergency')) {
        triggerAchievement({ action: 'emergency_page_visits' });
      } else if (path.includes('/rights')) {
        triggerAchievement({ action: 'rights_page_visits' });
      }
    };
    
    // Track initial page load
    handlePageChange();
    
    // Track navigation changes
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setTimeout(handlePageChange, 100);
    };
    
    // Track time spent (session duration)
    const startTime = Date.now();
    const trackSession = () => {
      const sessionDuration = Date.now() - startTime;
      if (sessionDuration > 60000) { // More than 1 minute
        triggerAchievement({ action: 'active_sessions' });
      }
    };
    
    const sessionTimer = setInterval(trackSession, 60000); // Check every minute
    
    return () => {
      clearInterval(sessionTimer);
      window.history.pushState = originalPushState;
    };
  }, [autoTrack, triggerAchievement]);

  // Get current user stats
  const getUserStats = useCallback(() => {
    return JSON.parse(localStorage.getItem('user_stats') || '{}');
  }, []);

  // Get achievement progress
  const getProgress = useCallback(() => {
    return JSON.parse(localStorage.getItem('user_achievement_progress') || '{}');
  }, []);

  // Reset progress (for testing)
  const resetProgress = useCallback(() => {
    localStorage.removeItem('user_achievement_progress');
    localStorage.removeItem('user_stats');
    if ((window as any).updateUserStats) {
      // Reset the achievement system
      window.location.reload();
    }
  }, []);

  return {
    triggerAchievement,
    ...achievementTriggers,
    getUserStats,
    getProgress,
    resetProgress
  };
}