// N8N Webhook Integration Service for C.A.R.E.N.™ Emergency Response Automation

interface N8NWebhookConfig {
  emergencyResponseUrl: string;
  userJourneyUrl: string;
  enabled: boolean;
}

interface EmergencyWebhookPayload {
  userId: string;
  emergencyType: 'traffic_stop' | 'recording' | 'attorney_contact' | 'general_emergency';
  coordinates: {
    lat: number;
    lng: number;
  };
  location?: {
    address?: string;
    city?: string;
    state?: string;
    county?: string;
  };
  timestamp: string;
  userEmail?: string;
  userName?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    recordingActive?: boolean;
    attorneyRequested?: boolean;
    situationContext?: string;
  };
}

interface UserJourneyWebhookPayload {
  userId: string;
  action: 'first_login' | 'emergency_activated' | 'attorney_contacted' | 'recording_completed' | 'forum_post_created' | 'rights_viewed';
  metadata: {
    location?: string;
    timestamp: string;
    sessionId?: string;
    feature?: string;
  };
}

class N8NWebhookService {
  private config: N8NWebhookConfig;
  
  constructor() {
    this.config = {
      emergencyResponseUrl: process.env.N8N_EMERGENCY_WEBHOOK_URL || '',
      userJourneyUrl: process.env.N8N_USER_JOURNEY_WEBHOOK_URL || '',
      enabled: process.env.N8N_WEBHOOKS_ENABLED === 'true'
    };
  }

  /**
   * Trigger Emergency Response Automation
   * Called when user activates any emergency feature
   */
  async triggerEmergencyResponse(payload: EmergencyWebhookPayload): Promise<boolean> {
    if (!this.config.enabled || !this.config.emergencyResponseUrl) {
      console.log('[N8N] Emergency webhook disabled or URL not configured');
      return false;
    }

    try {
      console.log(`[N8N] Triggering emergency response for user ${payload.userId} - ${payload.emergencyType}`);
      
      const response = await fetch(this.config.emergencyResponseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CAREN-Platform/1.0'
        },
        body: JSON.stringify({
          ...payload,
          source: 'caren-platform',
          version: '1.0'
        }),
        // 15 second timeout for emergency response
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[N8N] Emergency response triggered successfully:`, result);
        return true;
      } else {
        console.error(`[N8N] Emergency webhook failed:`, response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error(`[N8N] Emergency webhook error:`, error);
      return false;
    }
  }

  /**
   * Trigger User Journey Progress Automation
   * Called when user completes milestone actions
   */
  async triggerUserJourneyProgress(payload: UserJourneyWebhookPayload): Promise<boolean> {
    if (!this.config.enabled || !this.config.userJourneyUrl) {
      console.log('[N8N] User journey webhook disabled or URL not configured');
      return false;
    }

    try {
      console.log(`[N8N] Triggering user journey progress for user ${payload.userId} - ${payload.action}`);
      
      const response = await fetch(this.config.userJourneyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CAREN-Platform/1.0'
        },
        body: JSON.stringify({
          ...payload,
          source: 'caren-platform',
          version: '1.0'
        }),
        // 10 second timeout for user journey
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[N8N] User journey progress triggered successfully:`, result);
        return true;
      } else {
        console.error(`[N8N] User journey webhook failed:`, response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error(`[N8N] User journey webhook error:`, error);
      return false;
    }
  }

  /**
   * Get current webhook configuration
   */
  getConfig(): N8NWebhookConfig {
    return { ...this.config };
  }

  /**
   * Update webhook configuration (for testing/admin)
   */
  updateConfig(newConfig: Partial<N8NWebhookConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Test webhook connectivity
   */
  async testWebhooks(): Promise<{ emergency: boolean; userJourney: boolean }> {
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      source: 'caren-platform-test'
    };

    const results = {
      emergency: false,
      userJourney: false
    };

    // Test emergency webhook
    if (this.config.emergencyResponseUrl) {
      try {
        const response = await fetch(this.config.emergencyResponseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(5000)
        });
        results.emergency = response.ok;
      } catch (error) {
        console.error('[N8N] Emergency webhook test failed:', error);
      }
    }

    // Test user journey webhook
    if (this.config.userJourneyUrl) {
      try {
        const response = await fetch(this.config.userJourneyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(5000)
        });
        results.userJourney = response.ok;
      } catch (error) {
        console.error('[N8N] User journey webhook test failed:', error);
      }
    }

    return results;
  }
}

// Export singleton instance
export const n8nWebhookService = new N8NWebhookService();

// Export types for use in other modules
export type { 
  EmergencyWebhookPayload, 
  UserJourneyWebhookPayload, 
  N8NWebhookConfig 
};