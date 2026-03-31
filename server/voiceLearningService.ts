import { db } from "./db";
import { 
  voiceProfiles, 
  customVoiceCommands, 
  voiceTrainingSessions, 
  voicePatterns, 
  voiceCommandAnalytics, 
  voiceLearningSettings,
  type InsertVoiceProfile,
  type InsertCustomVoiceCommand,
  type InsertVoiceTrainingSession,
  type InsertVoicePattern,
  type InsertVoiceCommandAnalytics,
  type InsertVoiceLearningSettings,
  type VoiceProfile,
  type CustomVoiceCommand,
  type VoiceTrainingSession,
  type VoiceLearningSettings
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export interface VoiceTrainingResult {
  accuracy: number;
  improvementSuggestions: string[];
  patternsDetected: any[];
  nextTrainingDate?: Date;
}

export interface VoiceCommandMatch {
  command: CustomVoiceCommand;
  confidence: number;
  matchType: 'exact' | 'partial' | 'pattern';
}

export interface VoiceLearningAnalytics {
  totalCommands: number;
  averageAccuracy: number;
  mostUsedCommands: any[];
  learningProgress: number;
  recommendedTraining: string[];
}

export class VoiceLearningService {
  
  // Initialize voice profile for new user
  static async initializeUserVoiceProfile(userId: string, language: string = 'en-US'): Promise<VoiceProfile> {
    const profileData: InsertVoiceProfile = {
      userId,
      profileName: "Default Profile",
      language,
      confidenceThreshold: "0.7",
      adaptationLevel: "beginner",
      totalTrainingSessions: 0,
      isActive: true
    };

    const [profile] = await db.insert(voiceProfiles).values(profileData).returning();
    
    // Initialize default settings
    await this.initializeVoiceLearningSettings(userId);
    
    return profile;
  }

  // Initialize default voice learning settings
  static async initializeVoiceLearningSettings(userId: string): Promise<VoiceLearningSettings> {
    const settingsData: InsertVoiceLearningSettings = {
      userId,
      adaptiveLearning: true,
      backgroundLearning: true,
      personalizedSuggestions: true,
      voiceFeedback: true,
      learningReminders: true,
      privacyMode: "standard",
      dataRetention: "1_year",
      shareAnonymousData: false,
      maxTrainingDuration: 10
    };

    const [settings] = await db.insert(voiceLearningSettings).values(settingsData).returning();
    return settings;
  }

  // Get user's voice profile
  static async getUserVoiceProfile(userId: string): Promise<VoiceProfile | null> {
    const [profile] = await db
      .select()
      .from(voiceProfiles)
      .where(and(eq(voiceProfiles.userId, userId), eq(voiceProfiles.isActive, true)))
      .limit(1);
    
    return profile || null;
  }

  // Create custom voice command
  static async createCustomVoiceCommand(
    userId: string, 
    commandData: Omit<InsertCustomVoiceCommand, 'userId' | 'voiceProfileId'>
  ): Promise<CustomVoiceCommand> {
    const profile = await this.getUserVoiceProfile(userId);
    if (!profile) {
      throw new Error('Voice profile not found. Please initialize voice profile first.');
    }

    const commandWithProfile: InsertCustomVoiceCommand = {
      ...commandData,
      userId,
      voiceProfileId: profile.id
    };

    const [command] = await db.insert(customVoiceCommands).values(commandWithProfile).returning();
    return command;
  }

  // Get user's custom voice commands
  static async getUserCustomCommands(userId: string): Promise<CustomVoiceCommand[]> {
    return await db
      .select()
      .from(customVoiceCommands)
      .where(and(
        eq(customVoiceCommands.userId, userId),
        eq(customVoiceCommands.isEnabled, true)
      ))
      .orderBy(desc(customVoiceCommands.priority), asc(customVoiceCommands.commandName));
  }

  // Match voice input against custom commands
  static async matchVoiceCommand(
    userId: string, 
    transcript: string, 
    confidence: number
  ): Promise<VoiceCommandMatch[]> {
    const commands = await this.getUserCustomCommands(userId);
    const matches: VoiceCommandMatch[] = [];
    
    const transcriptLower = transcript.toLowerCase().trim();
    
    for (const command of commands) {
      const triggerPhrases = command.triggerPhrases as string[];
      
      for (const phrase of triggerPhrases) {
        const phraseLower = phrase.toLowerCase().trim();
        
        // Exact match
        if (transcriptLower === phraseLower) {
          matches.push({
            command,
            confidence: confidence * 1.0, // Full confidence for exact match
            matchType: 'exact'
          });
          continue;
        }
        
        // Partial match
        if (transcriptLower.includes(phraseLower) || phraseLower.includes(transcriptLower)) {
          matches.push({
            command,
            confidence: confidence * 0.8, // Reduced confidence for partial
            matchType: 'partial'
          });
          continue;
        }
        
        // Pattern matching (simple word similarity)
        const transcriptWords = transcriptLower.split(' ');
        const phraseWords = phraseLower.split(' ');
        const commonWords = transcriptWords.filter(word => phraseWords.includes(word));
        
        if (commonWords.length >= Math.min(2, phraseWords.length)) {
          matches.push({
            command,
            confidence: confidence * (commonWords.length / phraseWords.length) * 0.6,
            matchType: 'pattern'
          });
        }
      }
    }
    
    // Sort by confidence and return top matches
    return matches
      .sort((a, b) => b.confidence - a.confidence)
      .filter(match => match.confidence >= 0.5) // Filter low confidence matches
      .slice(0, 3); // Return top 3 matches
  }

  // Record voice command usage analytics
  static async recordVoiceCommandUsage(
    userId: string,
    analyticsData: Omit<InsertVoiceCommandAnalytics, 'userId'>
  ): Promise<void> {
    const data: InsertVoiceCommandAnalytics = {
      ...analyticsData,
      userId
    };

    await db.insert(voiceCommandAnalytics).values(data);

    // Update command success rate if it's a custom command
    if (analyticsData.commandId && analyticsData.wasSuccessful) {
      await this.updateCommandSuccessRate(analyticsData.commandId, analyticsData.wasSuccessful);
    }
  }

  // Update command success rate
  static async updateCommandSuccessRate(commandId: number, wasSuccessful: boolean): Promise<void> {
    const [command] = await db
      .select()
      .from(customVoiceCommands)
      .where(eq(customVoiceCommands.id, commandId))
      .limit(1);

    if (command) {
      const newTotalAttempts = (command.totalAttempts || 0) + 1;
      const newSuccessfulAttempts = (command.successfulAttempts || 0) + (wasSuccessful ? 1 : 0);
      const newSuccessRate = newSuccessfulAttempts / newTotalAttempts;

      await db
        .update(customVoiceCommands)
        .set({
          totalAttempts: newTotalAttempts,
          successfulAttempts: newSuccessfulAttempts,
          successRate: newSuccessRate.toString(),
          lastUsed: new Date(),
          updatedAt: new Date()
        })
        .where(eq(customVoiceCommands.id, commandId));
    }
  }

  // Start voice training session
  static async startTrainingSession(
    userId: string,
    sessionType: string,
    commandId?: number
  ): Promise<VoiceTrainingSession> {
    const profile = await this.getUserVoiceProfile(userId);
    if (!profile) {
      throw new Error('Voice profile not found');
    }

    const sessionData: InsertVoiceTrainingSession = {
      userId,
      voiceProfileId: profile.id,
      sessionType,
      commandId,
      isCompleted: false,
      environmentNoise: "quiet", // Default, can be updated
      deviceType: "desktop" // Default, can be updated
    };

    const [session] = await db.insert(voiceTrainingSessions).values(sessionData).returning();
    return session;
  }

  // Complete training session with results
  static async completeTrainingSession(
    sessionId: number,
    results: {
      audioSamples?: any[];
      transcriptionResults?: any[];
      expectedPhrases?: string[];
      accuracyScore?: number;
      improvementSuggestions?: string[];
      sessionDuration?: number;
    }
  ): Promise<VoiceTrainingResult> {
    await db
      .update(voiceTrainingSessions)
      .set({
        audioSamples: results.audioSamples,
        transcriptionResults: results.transcriptionResults,
        expectedPhrases: results.expectedPhrases,
        accuracyScore: results.accuracyScore?.toString(),
        improvementSuggestions: results.improvementSuggestions,
        sessionDuration: results.sessionDuration,
        isCompleted: true,
        updatedAt: new Date()
      })
      .where(eq(voiceTrainingSessions.id, sessionId));

    // Update profile training stats
    const [session] = await db
      .select()
      .from(voiceTrainingSessions)
      .where(eq(voiceTrainingSessions.id, sessionId))
      .limit(1);

    if (session) {
      // Get current profile to increment training sessions
      const [currentProfile] = await db
        .select()
        .from(voiceProfiles)
        .where(eq(voiceProfiles.id, session.voiceProfileId))
        .limit(1);

      if (currentProfile) {
        await db
          .update(voiceProfiles)
          .set({
            totalTrainingSessions: (currentProfile.totalTrainingSessions || 0) + 1,
            lastTrainingDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(voiceProfiles.id, session.voiceProfileId));
      }
    }

    return {
      accuracy: results.accuracyScore || 0,
      improvementSuggestions: results.improvementSuggestions || [],
      patternsDetected: [], // Will be populated by voice pattern analysis
      nextTrainingDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
    };
  }

  // Get voice learning analytics
  static async getVoiceLearningAnalytics(userId: string): Promise<VoiceLearningAnalytics> {
    // Get total custom commands
    const customCommands = await this.getUserCustomCommands(userId);
    
    // Calculate average accuracy from recent training sessions
    const recentSessions = await db
      .select()
      .from(voiceTrainingSessions)
      .where(and(
        eq(voiceTrainingSessions.userId, userId),
        eq(voiceTrainingSessions.isCompleted, true)
      ))
      .orderBy(desc(voiceTrainingSessions.createdAt))
      .limit(10);

    const avgAccuracy = recentSessions.length > 0
      ? recentSessions.reduce((sum, session) => {
          const accuracy = session.accuracyScore ? parseFloat(session.accuracyScore.toString()) : 0;
          return sum + accuracy;
        }, 0) / recentSessions.length
      : 0;

    // Get most used commands
    const commandUsageStats = await db
      .select()
      .from(voiceCommandAnalytics)
      .where(eq(voiceCommandAnalytics.userId, userId))
      .orderBy(desc(voiceCommandAnalytics.createdAt))
      .limit(100);

    // Calculate learning progress (0-100)
    const profile = await this.getUserVoiceProfile(userId);
    const learningProgress = profile 
      ? Math.min(100, ((profile.totalTrainingSessions || 0) * 10) + (avgAccuracy * 50))
      : 0;

    return {
      totalCommands: customCommands.length,
      averageAccuracy: avgAccuracy,
      mostUsedCommands: [], // Will be populated from analytics
      learningProgress,
      recommendedTraining: this.generateTrainingRecommendations(avgAccuracy, customCommands.length)
    };
  }

  // Generate training recommendations
  static generateTrainingRecommendations(accuracy: number, commandCount: number): string[] {
    const recommendations: string[] = [];

    if (accuracy < 0.7) {
      recommendations.push("Practice speaking clearly and at a steady pace");
      recommendations.push("Try training in a quieter environment");
    }

    if (commandCount < 3) {
      recommendations.push("Create more custom voice commands for better personalization");
    }

    if (accuracy > 0.8 && commandCount > 5) {
      recommendations.push("Try advanced voice patterns and complex commands");
      recommendations.push("Enable background learning for continuous improvement");
    }

    return recommendations;
  }

  // Get voice learning settings
  static async getVoiceLearningSettings(userId: string): Promise<VoiceLearningSettings | null> {
    const [settings] = await db
      .select()
      .from(voiceLearningSettings)
      .where(eq(voiceLearningSettings.userId, userId))
      .limit(1);

    return settings || null;
  }

  // Update voice learning settings
  static async updateVoiceLearningSettings(
    userId: string,
    updates: Partial<InsertVoiceLearningSettings>
  ): Promise<VoiceLearningSettings> {
    const [updated] = await db
      .update(voiceLearningSettings)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(voiceLearningSettings.userId, userId))
      .returning();

    return updated;
  }

  // Delete custom voice command
  static async deleteCustomVoiceCommand(userId: string, commandId: number): Promise<boolean> {
    const result = await db
      .delete(customVoiceCommands)
      .where(and(
        eq(customVoiceCommands.id, commandId),
        eq(customVoiceCommands.userId, userId)
      ));

    return result.rowCount > 0;
  }

  // Update custom voice command
  static async updateCustomVoiceCommand(
    userId: string,
    commandId: number,
    updates: Partial<InsertCustomVoiceCommand>
  ): Promise<CustomVoiceCommand | null> {
    const [updated] = await db
      .update(customVoiceCommands)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(customVoiceCommands.id, commandId),
        eq(customVoiceCommands.userId, userId)
      ))
      .returning();

    return updated || null;
  }
}