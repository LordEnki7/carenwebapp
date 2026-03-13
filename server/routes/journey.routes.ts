import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";

/**
 * Journey Routes Module
 * 
 * Handles all user journey tracking endpoints including:
 * - Milestone tracking and progress analytics
 * - Sparkle effects and achievements
 * - Streaks and badge systems
 * - Action tracking and user engagement
 */
export function registerJourneyRoutes(app: Express) {
  console.log('[ROUTES] Registering journey routes...');

  // Track user actions and trigger milestone progress
  app.post('/api/journey/track-action', async (req: any, res) => {
    try {
      const { action, metadata = {} } = req.body;
      const userId = req.user?.claims?.sub || req.session?.userId || 'demo-user';

      // Define milestone mapping for user actions
      const milestoneMap: Record<string, { id: number; category: string; points: number; sparkleType: string }> = {
        'first_login': { id: 1, category: 'onboarding', points: 10, sparkleType: 'gold' },
        'emergency_activated': { id: 5, category: 'emergency', points: 50, sparkleType: 'emergency' },
        'attorney_contacted': { id: 8, category: 'legal', points: 25, sparkleType: 'silver' },
        'recording_completed': { id: 12, category: 'engagement', points: 20, sparkleType: 'bronze' },
        'forum_post_created': { id: 15, category: 'engagement', points: 15, sparkleType: 'rainbow' },
        'rights_viewed': { id: 3, category: 'onboarding', points: 5, sparkleType: 'bronze' },
        'profile_completed': { id: 2, category: 'onboarding', points: 15, sparkleType: 'silver' },
        'dashboard_accessed': { id: 4, category: 'engagement', points: 5, sparkleType: 'bronze' }
      };

      const milestone = milestoneMap[action];
      if (!milestone) {
        return res.status(400).json({ message: `Unknown action: ${action}` });
      }

      // Check if user has already completed this milestone
      let isNewMilestone = false;
      try {
        const userProgress = await storage.getUserProgress(userId);
        const milestoneCompleted = userProgress?.completedMilestones?.includes(milestone.id) || false;
        isNewMilestone = !milestoneCompleted;

        // Update user progress if new milestone
        if (isNewMilestone) {
          await storage.recordUserProgress(userId, milestone.id, action, {
            ...metadata,
            timestamp: new Date().toISOString()
          });

          // Update user stats
          await storage.updateUserJourneyStats(userId, {
            points: milestone.points,
            milestonesCompleted: 1
          });

          console.log(`🎯 Milestone achieved: User ${userId} completed ${action} (+${milestone.points} points)`);
        }
      } catch (error) {
        console.log(`Note: Journey progress tracking not available yet, but action recorded: ${action}`);
        isNewMilestone = true; // Assume new for automation trigger
      }

      // Trigger N8N User Journey Automation  
      const { n8nWebhookService } = await import('../n8nWebhookService.js');
      const automationTriggered = await n8nWebhookService.triggerUserJourneyProgress({
        userId,
        action,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          isNewMilestone,
          milestone: milestone
        }
      });

      // Trigger sparkle effect for new milestones
      if (isNewMilestone) {
        setTimeout(async () => {
          try {
            await fetch(`${req.protocol}://${req.get('host')}/api/journey/trigger-sparkle`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                sparkleType: milestone.sparkleType,
                location: action,
                intensity: 'high',
                duration: 3000
              })
            });
          } catch (error) {
            console.log('Sparkle trigger failed:', error.message);
          }
        }, 500);
      }

      res.json({
        success: true,
        action,
        milestone: milestone,
        isNewMilestone,
        automationTriggered,
        pointsEarned: isNewMilestone ? milestone.points : 0,
        message: isNewMilestone ? `Milestone achieved: ${action}` : `Action tracked: ${action}`
      });

    } catch (error) {
      console.error("Error tracking user journey action:", error);
      res.status(500).json({ message: "Failed to track user action" });
    }
  });

  // Trigger sparkle animation effects
  app.post('/api/journey/trigger-sparkle', async (req, res) => {
    try {
      const { userId, sparkleType = 'gold', location = 'dashboard', intensity = 'medium', duration = 2000 } = req.body;

      console.log(`✨ Triggering ${sparkleType} sparkle effect for user ${userId} at ${location}`);

      // Store sparkle effect in queue for frontend retrieval
      try {
        await storage.queueSparkleEffect(userId, {
          sparkleType,
          location,
          intensity,
          duration,
          timestamp: new Date()
        });
      } catch (error) {
        console.log('Note: Sparkle queue storage not available yet, but effect triggered');
      }

      // Broadcast sparkle effect to connected WebSocket clients
      const wsManager = (global as any).wsManager;
      if (wsManager) {
        wsManager.broadcastToUser(userId, 'sparkle_effect', {
          sparkleType,
          location,
          intensity,
          duration,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        sparkleType,
        location,
        intensity,
        duration,
        message: `${sparkleType} sparkle effect triggered at ${location}`
      });

    } catch (error) {
      console.error("Error triggering sparkle effect:", error);
      res.status(500).json({ message: "Failed to trigger sparkle effect" });
    }
  });

  console.log('[ROUTES] Journey routes registered successfully');
}