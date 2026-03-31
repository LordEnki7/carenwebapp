import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { getCurrentUser } from "../demoState";
import { VoiceLearningService } from "../voiceLearningService";

/**
 * Voice Learning Routes Module
 * 
 * Handles all voice learning and training endpoints including:
 * - Voice pattern recognition and training
 * - Command customization and profiles
 * - Voice learning analytics
 */
export function registerVoiceLearningRoutes(app: Express) {
  console.log('[ROUTES] Registering voice learning routes...');



  // Initialize voice profile for new user
  app.post('/api/voice-learning/profile/initialize', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { language = 'en-US' } = req.body;
      const profile = await VoiceLearningService.initializeUserVoiceProfile(currentUser.id, language);
      
      res.json({
        success: true,
        profile: {
          id: profile.id,
          profileName: profile.profileName,
          language: profile.language,
          confidenceThreshold: profile.confidenceThreshold,
          adaptationLevel: profile.adaptationLevel,
          totalTrainingSessions: profile.totalTrainingSessions,
          isActive: profile.isActive
        }
      });
      
    } catch (error) {
      console.error('Voice profile initialization error:', error);
      res.status(500).json({ message: 'Failed to initialize voice profile' });
    }
  });

  // Get user's voice profile
  app.get('/api/voice-learning/profile', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const profile = await VoiceLearningService.getUserVoiceProfile(currentUser.id);
      
      if (!profile) {
        return res.status(404).json({ message: 'Voice profile not found' });
      }
      
      res.json({
        success: true,
        profile: {
          id: profile.id,
          profileName: profile.profileName,
          language: profile.language,
          confidenceThreshold: profile.confidenceThreshold,
          adaptationLevel: profile.adaptationLevel,
          totalTrainingSessions: profile.totalTrainingSessions,
          lastTrainingDate: profile.lastTrainingDate,
          isActive: profile.isActive
        }
      });
      
    } catch (error) {
      console.error('Get voice profile error:', error);
      res.status(500).json({ message: 'Failed to retrieve voice profile' });
    }
  });

  // Create custom voice command
  app.post('/api/voice-learning/commands', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { commandName, triggerPhrases, actionType, actionData, priority = 5, category = 'custom' } = req.body;
      
      if (!commandName || !triggerPhrases || !Array.isArray(triggerPhrases) || !actionType) {
        return res.status(400).json({ message: 'Missing required fields: commandName, triggerPhrases, actionType' });
      }
      
      const command = await VoiceLearningService.createCustomVoiceCommand(currentUser.id, {
        commandName,
        triggerPhrases,
        actionType,
        actionParameters: actionData,
        priority,
        actionTarget: category,
        isEnabled: true,
        totalAttempts: 0,
        successfulAttempts: 0,
        successRate: "1.0"
      });
      
      res.json({
        success: true,
        command: {
          id: command.id,
          commandName: command.commandName,
          triggerPhrases: command.triggerPhrases,
          actionType: command.actionType,
          actionParameters: command.actionParameters,
          priority: command.priority,
          actionTarget: command.actionTarget,
          isEnabled: command.isEnabled,
          successRate: command.successRate
        }
      });
      
    } catch (error) {
      console.error('Create voice command error:', error);
      res.status(500).json({ message: 'Failed to create voice command' });
    }
  });

  // Get user's custom voice commands
  app.get('/api/voice-learning/commands', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const commands = await VoiceLearningService.getUserCustomCommands(currentUser.id);
      
      res.json({
        success: true,
        commands: commands.map(cmd => ({
          id: cmd.id,
          commandName: cmd.commandName,
          triggerPhrases: cmd.triggerPhrases,
          actionType: cmd.actionType,
          actionParameters: cmd.actionParameters,
          priority: cmd.priority,
          actionTarget: cmd.actionTarget,
          isEnabled: cmd.isEnabled,
          successRate: cmd.successRate,
          totalAttempts: cmd.totalAttempts,
          successfulAttempts: cmd.successfulAttempts,
          lastUsed: cmd.lastUsed
        })),
        count: commands.length
      });
      
    } catch (error) {
      console.error('Get voice commands error:', error);
      res.status(500).json({ message: 'Failed to retrieve voice commands' });
    }
  });

  // Match voice input against custom commands
  app.post('/api/voice-learning/match', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { transcript, confidence = 0.8 } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ message: 'Missing required field: transcript' });
      }
      
      const matches = await VoiceLearningService.matchVoiceCommand(currentUser.id, transcript, confidence);
      
      res.json({
        success: true,
        matches: matches.map(match => ({
          command: {
            id: match.command.id,
            commandName: match.command.commandName,
            actionType: match.command.actionType,
            actionParameters: match.command.actionParameters
          },
          confidence: match.confidence,
          matchType: match.matchType
        })),
        transcript,
        originalConfidence: confidence
      });
      
    } catch (error) {
      console.error('Voice command matching error:', error);
      res.status(500).json({ message: 'Failed to match voice command' });
    }
  });

  // Record voice command usage analytics
  app.post('/api/voice-learning/analytics', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { 
        commandId, 
        commandType, 
        recognizedPhrase, 
        intendedCommand, 
        confidence, 
        executionTime, 
        wasSuccessful, 
        errorType, 
        contextInfo 
      } = req.body;
      
      await VoiceLearningService.recordVoiceCommandUsage(currentUser.id, {
        commandId,
        commandType,
        recognizedPhrase,
        intendedCommand,
        confidence: confidence?.toString(),
        executionTime,
        wasSuccessful,
        errorType,
        contextInfo
      });
      
      res.json({ success: true, message: 'Analytics recorded successfully' });
      
    } catch (error) {
      console.error('Record analytics error:', error);
      res.status(500).json({ message: 'Failed to record analytics' });
    }
  });

  // Start voice training session
  app.post('/api/voice-learning/training/start', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { sessionType, commandId } = req.body;
      
      if (!sessionType) {
        return res.status(400).json({ message: 'Missing required field: sessionType' });
      }
      
      const session = await VoiceLearningService.startTrainingSession(
        currentUser.id,
        sessionType,
        commandId
      );
      
      res.json({
        success: true,
        session: {
          id: session.id,
          sessionType: session.sessionType,
          commandId: session.commandId,
          isCompleted: session.isCompleted,
          createdAt: session.createdAt
        }
      });
      
    } catch (error) {
      console.error('Start training session error:', error);
      res.status(500).json({ message: 'Failed to start training session' });
    }
  });

  // Complete voice training session
  app.post('/api/voice-learning/training/complete', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { sessionId, results } = req.body;
      
      if (!sessionId || !results) {
        return res.status(400).json({ message: 'Missing required fields: sessionId, results' });
      }
      
      const trainingResult = await VoiceLearningService.completeTrainingSession(sessionId, results);
      
      res.json({
        success: true,
        result: {
          accuracy: trainingResult.accuracy,
          improvementSuggestions: trainingResult.improvementSuggestions,
          patternsDetected: trainingResult.patternsDetected,
          nextTrainingDate: trainingResult.nextTrainingDate
        }
      });
      
    } catch (error) {
      console.error('Complete training session error:', error);
      res.status(500).json({ message: 'Failed to complete training session' });
    }
  });

  // Get voice learning analytics
  app.get('/api/voice-learning/analytics', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const analytics = await VoiceLearningService.getVoiceLearningAnalytics(currentUser.id);
      
      res.json({
        success: true,
        analytics: {
          totalCommands: analytics.totalCommands,
          averageAccuracy: analytics.averageAccuracy,
          mostUsedCommands: analytics.mostUsedCommands,
          learningProgress: analytics.learningProgress,
          recommendedTraining: analytics.recommendedTraining
        }
      });
      
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: 'Failed to retrieve analytics' });
    }
  });

  // Get voice learning settings
  app.get('/api/voice-learning/settings', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const settings = await VoiceLearningService.getVoiceLearningSettings(currentUser.id);
      
      if (!settings) {
        // Initialize default settings if not found
        const newSettings = await VoiceLearningService.initializeVoiceLearningSettings(currentUser.id);
        return res.json({ success: true, settings: newSettings });
      }
      
      res.json({ success: true, settings });
      
    } catch (error) {
      console.error('Get voice settings error:', error);
      res.status(500).json({ message: 'Failed to retrieve voice settings' });
    }
  });

  // Update voice learning settings
  app.put('/api/voice-learning/settings', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const allowedUpdates = [
        'adaptiveLearning', 'backgroundLearning', 'personalizedSuggestions',
        'voiceFeedback', 'learningReminders', 'privacyMode', 'dataRetention',
        'shareAnonymousData', 'preferredTrainingTime', 'maxTrainingDuration'
      ];
      
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {} as any);
      
      const updatedSettings = await VoiceLearningService.updateVoiceLearningSettings(
        currentUser.id,
        updates
      );
      
      res.json({ success: true, settings: updatedSettings });
      
    } catch (error) {
      console.error('Update voice settings error:', error);
      res.status(500).json({ message: 'Failed to update voice settings' });
    }
  });

  // Delete custom voice command
  app.delete('/api/voice-learning/commands/:commandId', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { commandId } = req.params;
      
      if (!commandId || isNaN(parseInt(commandId))) {
        return res.status(400).json({ message: 'Invalid command ID' });
      }
      
      const deleted = await VoiceLearningService.deleteCustomVoiceCommand(
        currentUser.id,
        parseInt(commandId)
      );
      
      if (!deleted) {
        return res.status(404).json({ message: 'Command not found' });
      }
      
      res.json({ success: true, message: 'Voice command deleted successfully' });
      
    } catch (error) {
      console.error('Delete voice command error:', error);
      res.status(500).json({ message: 'Failed to delete voice command' });
    }
  });

  // Update custom voice command
  app.put('/api/voice-learning/commands/:commandId', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { commandId } = req.params;
      
      if (!commandId || isNaN(parseInt(commandId))) {
        return res.status(400).json({ message: 'Invalid command ID' });
      }
      
      const allowedUpdates = [
        'commandName', 'triggerPhrases', 'actionType', 'actionData',
        'priority', 'category', 'isEnabled'
      ];
      
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {} as any);
      
      const updatedCommand = await VoiceLearningService.updateCustomVoiceCommand(
        currentUser.id,
        parseInt(commandId),
        updates
      );
      
      if (!updatedCommand) {
        return res.status(404).json({ message: 'Command not found' });
      }
      
      res.json({
        success: true,
        command: {
          id: updatedCommand.id,
          commandName: updatedCommand.commandName,
          triggerPhrases: updatedCommand.triggerPhrases,
          actionType: updatedCommand.actionType,
          priority: updatedCommand.priority,
          isEnabled: updatedCommand.isEnabled
        }
      });
      
    } catch (error) {
      console.error('Update voice command error:', error);
      res.status(500).json({ message: 'Failed to update voice command' });
    }
  });

  console.log('[ROUTES] Voice learning routes registered successfully');
}