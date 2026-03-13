// Priority #2: User Journey Progress Automation Integration
// Utility functions for tracking user actions and triggering milestone progress

interface JourneyTrackingResult {
  success: boolean;
  action: string;
  pointsEarned: number;
  isNewMilestone: boolean;
  sparkleType?: string;
  error?: string;
}

/**
 * Track a user action and trigger milestone progress automation
 * @param action - The action type (e.g., 'first_login', 'emergency_activated')
 * @param metadata - Additional context data for the action
 * @returns Promise with tracking result
 */
export async function trackUserAction(
  action: string, 
  metadata: Record<string, any> = {}
): Promise<JourneyTrackingResult> {
  try {
    console.log(`🎯 Tracking user action: ${action}`, metadata);
    
    const response = await fetch('/api/journey/track-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('sessionToken') && {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
        })
      },
      body: JSON.stringify({
        action,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          url: window.location.pathname,
          userAgent: navigator.userAgent
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Journey tracking failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Show success notification for new milestones
    if (result.isNewMilestone && result.pointsEarned > 0) {
      console.log(`✨ Milestone achieved: ${action} (+${result.pointsEarned} points)`);
      
      // Dispatch custom event for sparkle effects
      window.dispatchEvent(new CustomEvent('journeyMilestone', {
        detail: {
          action,
          points: result.pointsEarned,
          sparkleType: result.milestone.sparkleType,
          location: action
        }
      }));
    }

    return {
      success: true,
      action,
      pointsEarned: result.pointsEarned || 0,
      isNewMilestone: result.isNewMilestone || false,
      sparkleType: result.milestone?.sparkleType
    };

  } catch (error: any) {
    console.error('Journey tracking error:', error.message);
    return {
      success: false,
      action,
      pointsEarned: 0,
      isNewMilestone: false,
      error: error.message
    };
  }
}

/**
 * Pre-defined action tracking functions for common user interactions
 */
export const JourneyActions = {
  // Onboarding milestones
  firstLogin: (source = 'login_page') => 
    trackUserAction('first_login', { source }),
  
  profileCompleted: (fields: string[] = []) => 
    trackUserAction('profile_completed', { completedFields: fields }),
  
  rightsViewed: (state?: string, category?: string) => 
    trackUserAction('rights_viewed', { state, category }),
  
  dashboardAccessed: (sessionType = 'regular') => 
    trackUserAction('dashboard_accessed', { sessionType }),

  // Emergency milestones  
  emergencyActivated: (emergencyType: string, location?: any) =>
    trackUserAction('emergency_activated', { 
      emergencyType, 
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address
      } : undefined
    }),

  // Legal milestones
  attorneyContacted: (method: string, attorneyId?: string) =>
    trackUserAction('attorney_contacted', { method, attorneyId }),

  // Engagement milestones
  recordingCompleted: (duration: number, quality?: string) =>
    trackUserAction('recording_completed', { duration, quality }),
  
  forumPostCreated: (category: string, postId?: string) =>
    trackUserAction('forum_post_created', { category, postId })
};

/**
 * Trigger sparkle effect at specific UI location
 * @param sparkleType - Type of sparkle (gold, silver, bronze, rainbow, emergency)
 * @param location - UI location identifier
 * @param intensity - Effect intensity (low, medium, high)
 * @param duration - Effect duration in milliseconds
 */
export async function triggerSparkleEffect(
  sparkleType: string = 'gold',
  location: string = 'dashboard',
  intensity: string = 'medium',
  duration: number = 2000
): Promise<boolean> {
  try {
    const response = await fetch('/api/journey/trigger-sparkle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sparkleType,
        location,
        intensity,
        duration
      })
    });

    if (response.ok) {
      console.log(`✨ Sparkle effect triggered: ${sparkleType} at ${location}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Sparkle effect error:', error);
    return false;
  }
}

/**
 * Get user journey progress and stats
 * @param userId - Optional user ID (defaults to current user)
 */
export async function getUserJourneyProgress(userId?: string): Promise<any> {
  try {
    const url = userId ? `/api/journey/progress/${userId}` : '/api/journey/progress';
    const response = await fetch(url, {
      headers: {
        ...(localStorage.getItem('sessionToken') && {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
        })
      }
    });

    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Journey progress retrieval error:', error);
    return null;
  }
}

/**
 * Initialize journey tracking for a page
 * Sets up event listeners and tracks page access
 * @param pageName - Name of the page for tracking
 * @param additionalMetadata - Extra context data
 */
export function initializeJourneyTracking(
  pageName: string, 
  additionalMetadata: Record<string, any> = {}
): void {
  // Track page access
  if (pageName === 'dashboard') {
    JourneyActions.dashboardAccessed();
  }
  
  // Set up sparkle effect listener
  window.addEventListener('journeyMilestone', (event: any) => {
    const { sparkleType, location } = event.detail;
    triggerSparkleEffect(sparkleType, location, 'high', 3000);
  });
  
  console.log(`🎯 Journey tracking initialized for ${pageName}`);
}