import { db } from "./db";
import { 
  livestreamSessions, 
  streamParticipants, 
  streamMessages, 
  streamRecordings, 
  streamAnalytics,
  type InsertLivestreamSession,
  type InsertStreamParticipant,
  type InsertStreamMessage,
  type InsertStreamRecording,
  type InsertStreamAnalytics,
  type LivestreamSession,
  type StreamParticipant,
  type StreamMessage,
  type StreamRecording
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export interface StreamSessionConfig {
  sessionName: string;
  attorneyId: string;
  incidentId?: number;
  emergencyLevel?: 'normal' | 'urgent' | 'critical';
  streamQuality?: 'auto' | '720p' | '480p' | '360p';
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  chatEnabled?: boolean;
  isRecorded?: boolean;
}

export interface StreamConnection {
  sessionId: string;
  userId: string;
  role: 'host' | 'attorney' | 'viewer' | 'moderator';
  deviceInfo?: any;
}

export interface ChatMessage {
  sessionId: string;
  senderId: string;
  message: string;
  messageType?: 'chat' | 'system' | 'emergency' | 'legal_note';
  isPrivate?: boolean;
  recipientId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export class LivestreamService {
  /**
   * Create a new live streaming session
   */
  static async createSession(userId: string, config: StreamSessionConfig): Promise<LivestreamSession> {
    const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sessionData: InsertLivestreamSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      attorneyId: config.attorneyId,
      incidentId: config.incidentId,
      sessionName: config.sessionName,
      streamKey,
      emergencyLevel: config.emergencyLevel || 'normal',
      streamQuality: config.streamQuality || 'auto',
      audioEnabled: config.audioEnabled ?? true,
      videoEnabled: config.videoEnabled ?? true,
      chatEnabled: config.chatEnabled ?? true,
      isRecorded: config.isRecorded ?? true,
    };

    const [session] = await db.insert(livestreamSessions).values(sessionData).returning();
    
    // Add the creator as host participant
    await this.addParticipant({
      sessionId: session.id,
      userId,
      role: 'host',
      deviceInfo: { role: 'session_creator' }
    });

    return session;
  }

  /**
   * Start a streaming session
   */
  static async startSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const [session] = await db
        .select()
        .from(livestreamSessions)
        .where(and(eq(livestreamSessions.id, sessionId), eq(livestreamSessions.userId, userId)));

      if (!session) {
        throw new Error('Session not found or unauthorized');
      }

      await db
        .update(livestreamSessions)
        .set({
          status: 'active',
          startTime: new Date(),
          updatedAt: new Date()
        })
        .where(eq(livestreamSessions.id, sessionId));

      // Log analytics event
      await this.logAnalytics({
        sessionId,
        userId,
        eventType: 'session_start',
        eventData: { status: 'active' }
      });

      return true;
    } catch (error) {
      console.error('Error starting session:', error);
      return false;
    }
  }

  /**
   * End a streaming session
   */
  static async endSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const [session] = await db
        .select()
        .from(livestreamSessions)
        .where(and(eq(livestreamSessions.id, sessionId), eq(livestreamSessions.userId, userId)));

      if (!session) {
        throw new Error('Session not found or unauthorized');
      }

      const endTime = new Date();
      const duration = session.startTime ? 
        Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000) : 0;

      await db
        .update(livestreamSessions)
        .set({
          status: 'ended',
          endTime,
          duration,
          updatedAt: new Date()
        })
        .where(eq(livestreamSessions.id, sessionId));

      // End all active participants
      await db
        .update(streamParticipants)
        .set({
          leftAt: endTime,
          isActive: false
        })
        .where(and(
          eq(streamParticipants.sessionId, sessionId),
          eq(streamParticipants.isActive, true)
        ));

      // Log analytics event
      await this.logAnalytics({
        sessionId,
        userId,
        eventType: 'session_end',
        eventData: { duration, endTime }
      });

      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      return false;
    }
  }

  /**
   * Add participant to stream
   */
  static async addParticipant(connection: StreamConnection): Promise<StreamParticipant> {
    const participantData: InsertStreamParticipant = {
      id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: connection.sessionId,
      userId: connection.userId,
      role: connection.role,
      deviceInfo: connection.deviceInfo,
      permissions: this.getDefaultPermissions(connection.role),
    };

    const [participant] = await db.insert(streamParticipants).values(participantData).returning();

    // Update viewer count
    await this.updateViewerCount(connection.sessionId);

    // Log analytics event
    await this.logAnalytics({
      sessionId: connection.sessionId,
      userId: connection.userId,
      eventType: 'participant_join',
      eventData: { role: connection.role }
    });

    return participant;
  }

  /**
   * Remove participant from stream
   */
  static async removeParticipant(sessionId: string, userId: string): Promise<boolean> {
    try {
      const leftAt = new Date();
      
      const [participant] = await db
        .select()
        .from(streamParticipants)
        .where(and(
          eq(streamParticipants.sessionId, sessionId),
          eq(streamParticipants.userId, userId),
          eq(streamParticipants.isActive, true)
        ));

      if (participant) {
        const duration = Math.floor((leftAt.getTime() - participant.joinedAt.getTime()) / 1000);

        await db
          .update(streamParticipants)
          .set({
            leftAt,
            duration,
            isActive: false
          })
          .where(and(
            eq(streamParticipants.sessionId, sessionId),
            eq(streamParticipants.userId, userId)
          ));

        // Update viewer count
        await this.updateViewerCount(sessionId);

        // Log analytics event
        await this.logAnalytics({
          sessionId,
          userId,
          eventType: 'participant_leave',
          eventData: { duration }
        });
      }

      return true;
    } catch (error) {
      console.error('Error removing participant:', error);
      return false;
    }
  }

  /**
   * Send chat message
   */
  static async sendMessage(messageData: ChatMessage): Promise<StreamMessage> {
    const messageInsert: InsertStreamMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: messageData.sessionId,
      senderId: messageData.senderId,
      message: messageData.message,
      messageType: messageData.messageType || 'chat',
      isPrivate: messageData.isPrivate || false,
      recipientId: messageData.recipientId,
      priority: messageData.priority || 'normal',
    };

    const [message] = await db.insert(streamMessages).values(messageInsert).returning();

    // Log analytics event
    await this.logAnalytics({
      sessionId: messageData.sessionId,
      userId: messageData.senderId,
      eventType: 'message_sent',
      eventData: { messageType: messageData.messageType, isPrivate: messageData.isPrivate }
    });

    return message;
  }

  /**
   * Get chat messages for session
   */
  static async getChatMessages(sessionId: string, userId: string, limit: number = 50): Promise<StreamMessage[]> {
    return await db
      .select()
      .from(streamMessages)
      .where(and(
        eq(streamMessages.sessionId, sessionId),
        eq(streamMessages.isDeleted, false)
      ))
      .orderBy(desc(streamMessages.timestamp))
      .limit(limit);
  }

  /**
   * Get user's streaming sessions
   */
  static async getUserSessions(userId: string): Promise<LivestreamSession[]> {
    return await db
      .select()
      .from(livestreamSessions)
      .where(eq(livestreamSessions.userId, userId))
      .orderBy(desc(livestreamSessions.createdAt));
  }

  /**
   * Get session details
   */
  static async getSessionDetails(sessionId: string): Promise<LivestreamSession | null> {
    const [session] = await db
      .select()
      .from(livestreamSessions)
      .where(eq(livestreamSessions.id, sessionId));

    return session || null;
  }

  /**
   * Get session participants
   */
  static async getSessionParticipants(sessionId: string): Promise<StreamParticipant[]> {
    return await db
      .select()
      .from(streamParticipants)
      .where(eq(streamParticipants.sessionId, sessionId))
      .orderBy(asc(streamParticipants.joinedAt));
  }

  /**
   * Record stream segment
   */
  static async recordSegment(recordingData: Omit<InsertStreamRecording, 'id' | 'createdAt'>): Promise<StreamRecording> {
    const recording: InsertStreamRecording = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...recordingData,
    };

    const [streamRecording] = await db.insert(streamRecordings).values(recording).returning();
    return streamRecording;
  }

  /**
   * Get session recordings
   */
  static async getSessionRecordings(sessionId: string): Promise<StreamRecording[]> {
    return await db
      .select()
      .from(streamRecordings)
      .where(and(
        eq(streamRecordings.sessionId, sessionId),
        eq(streamRecordings.isAvailable, true)
      ))
      .orderBy(asc(streamRecordings.segmentNumber));
  }

  /**
   * Update viewer count
   */
  private static async updateViewerCount(sessionId: string): Promise<void> {
    const activeParticipants = await db
      .select()
      .from(streamParticipants)
      .where(and(
        eq(streamParticipants.sessionId, sessionId),
        eq(streamParticipants.isActive, true)
      ));

    await db
      .update(livestreamSessions)
      .set({
        viewerCount: activeParticipants.length,
        updatedAt: new Date()
      })
      .where(eq(livestreamSessions.id, sessionId));
  }

  /**
   * Log analytics event
   */
  private static async logAnalytics(analyticsData: Omit<InsertStreamAnalytics, 'id' | 'timestamp'>): Promise<void> {
    const analytics: InsertStreamAnalytics = {
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...analyticsData,
    };

    await db.insert(streamAnalytics).values(analytics);
  }

  /**
   * Get default permissions for role
   */
  private static getDefaultPermissions(role: string): any {
    switch (role) {
      case 'host':
        return {
          speak: true,
          mute: true,
          kick: true,
          record: true,
          moderate: true,
          endSession: true
        };
      case 'attorney':
        return {
          speak: true,
          mute: false,
          kick: false,
          record: true,
          moderate: true,
          endSession: false
        };
      case 'moderator':
        return {
          speak: true,
          mute: true,
          kick: true,
          record: false,
          moderate: true,
          endSession: false
        };
      case 'viewer':
      default:
        return {
          speak: false,
          mute: false,
          kick: false,
          record: false,
          moderate: false,
          endSession: false
        };
    }
  }

  /**
   * Get session analytics
   */
  static async getSessionAnalytics(sessionId: string): Promise<any> {
    const analytics = await db
      .select()
      .from(streamAnalytics)
      .where(eq(streamAnalytics.sessionId, sessionId))
      .orderBy(asc(streamAnalytics.timestamp));

    const participants = await this.getSessionParticipants(sessionId);
    const messages = await this.getChatMessages(sessionId, '', 1000);

    return {
      totalEvents: analytics.length,
      participants: participants.length,
      messages: messages.length,
      eventTypes: analytics.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageConnectionQuality: analytics
        .filter(a => a.connectionQuality)
        .reduce((sum, a) => sum + (a.connectionQuality || 0), 0) / 
        analytics.filter(a => a.connectionQuality).length || 0,
      totalBandwidth: analytics.reduce((sum, a) => sum + (a.bandwidth || 0), 0),
      averageLatency: analytics
        .filter(a => a.latency)
        .reduce((sum, a) => sum + (a.latency || 0), 0) / 
        analytics.filter(a => a.latency).length || 0,
    };
  }

  /**
   * Update session settings
   */
  static async updateSessionSettings(
    sessionId: string, 
    userId: string, 
    settings: Partial<Pick<LivestreamSession, 'streamQuality' | 'audioEnabled' | 'videoEnabled' | 'chatEnabled'>>
  ): Promise<boolean> {
    try {
      await db
        .update(livestreamSessions)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(and(
          eq(livestreamSessions.id, sessionId),
          eq(livestreamSessions.userId, userId)
        ));

      // Log analytics event
      await this.logAnalytics({
        sessionId,
        userId,
        eventType: 'settings_update',
        eventData: settings
      });

      return true;
    } catch (error) {
      console.error('Error updating session settings:', error);
      return false;
    }
  }
}