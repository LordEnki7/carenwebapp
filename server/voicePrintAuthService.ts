import { db } from './db';
import { voiceAuthProfiles, voiceAuthAttempts, voiceAuthSettings, users } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

export interface VoiceAuthResult {
  success: boolean;
  userId?: string;
  confidence?: number;
  sessionId?: string;
  failureReason?: string;
  requiresPassphrase?: boolean;
  lockedOut?: boolean;
  lockoutUntil?: Date;
}

export interface VoiceRegistrationData {
  userId: string;
  audioSamples: string[]; // Multiple audio samples for better accuracy
  passphrase?: string;
  deviceInfo?: string;
  environmentalFactors?: {
    noiseLevel: 'quiet' | 'moderate' | 'noisy';
    deviceType: string;
    microphoneQuality: 'low' | 'medium' | 'high';
  };
}

export class VoicePrintAuthService {
  /**
   * Extract voice features from audio data
   */
  private static extractVoiceFeatures(audioData: string): number[] {
    // Convert base64 audio to Uint8Array
    const audioBytes = new Uint8Array(Buffer.from(audioData, 'base64'));
    
    // Extract basic voice biometric features
    const features: number[] = [];
    
    // Voice characteristics analysis
    const sampleRate = 44100; // Assuming 44.1kHz sample rate
    const frameSize = 512;
    const frames = Math.floor(audioBytes.length / frameSize);
    
    for (let i = 0; i < frames && i < 50; i++) {
      const frame = audioBytes.slice(i * frameSize, (i + 1) * frameSize);
      
      // Extract features: energy, zero-crossing rate, spectral centroid
      const energy = this.calculateEnergy(frame);
      const zcr = this.calculateZeroCrossingRate(frame);
      const spectralCentroid = this.calculateSpectralCentroid(frame);
      const spectralRolloff = this.calculateSpectralRolloff(frame);
      const mfcc = this.calculateMFCC(frame);
      
      features.push(energy, zcr, spectralCentroid, spectralRolloff, ...mfcc);
    }
    
    // Normalize features to prevent bias
    return this.normalizeFeatures(features);
  }
  
  private static calculateEnergy(frame: Uint8Array): number {
    let energy = 0;
    for (let i = 0; i < frame.length; i++) {
      const sample = (frame[i] - 128) / 128.0; // Convert to [-1, 1]
      energy += sample * sample;
    }
    return Math.sqrt(energy / frame.length);
  }
  
  private static calculateZeroCrossingRate(frame: Uint8Array): number {
    let crossings = 0;
    let prevSign = Math.sign(frame[0] - 128);
    
    for (let i = 1; i < frame.length; i++) {
      const currentSign = Math.sign(frame[i] - 128);
      if (currentSign !== prevSign && currentSign !== 0) {
        crossings++;
      }
      prevSign = currentSign;
    }
    
    return crossings / frame.length;
  }
  
  private static calculateSpectralCentroid(frame: Uint8Array): number {
    // Simplified spectral centroid calculation
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frame.length; i++) {
      const magnitude = Math.abs(frame[i] - 128);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }
  
  private static calculateSpectralRolloff(frame: Uint8Array): number {
    // Simplified spectral rolloff (85% of energy)
    let totalEnergy = 0;
    const energies: number[] = [];
    
    for (let i = 0; i < frame.length; i++) {
      const energy = Math.pow(frame[i] - 128, 2);
      energies.push(energy);
      totalEnergy += energy;
    }
    
    const threshold = 0.85 * totalEnergy;
    let cumulativeEnergy = 0;
    
    for (let i = 0; i < energies.length; i++) {
      cumulativeEnergy += energies[i];
      if (cumulativeEnergy >= threshold) {
        return i / energies.length;
      }
    }
    
    return 1.0;
  }
  
  private static calculateMFCC(frame: Uint8Array): number[] {
    // Simplified MFCC calculation (first 4 coefficients)
    const mfcc: number[] = [];
    const numCoeffs = 4;
    
    for (let i = 0; i < numCoeffs; i++) {
      let coeff = 0;
      for (let j = 0; j < frame.length; j++) {
        const angle = (Math.PI * i * (j + 0.5)) / frame.length;
        coeff += (frame[j] - 128) * Math.cos(angle);
      }
      mfcc.push(coeff / frame.length);
    }
    
    return mfcc;
  }
  
  private static normalizeFeatures(features: number[]): number[] {
    if (features.length === 0) return features;
    
    const mean = features.reduce((sum, val) => sum + val, 0) / features.length;
    const variance = features.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / features.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return features;
    
    return features.map(val => (val - mean) / stdDev);
  }
  
  /**
   * Calculate similarity between two voice feature vectors
   */
  private static calculateVoiceSimilarity(features1: number[], features2: number[]): number {
    if (features1.length !== features2.length) return 0;
    
    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }
  
  /**
   * Register voice print for authentication
   */
  static async registerVoicePrint(data: VoiceRegistrationData): Promise<{
    success: boolean;
    profileId?: number;
    message?: string;
  }> {
    try {
      // Check if user already has a voice auth profile
      const existingProfile = await db
        .select()
        .from(voiceAuthProfiles)
        .where(eq(voiceAuthProfiles.userId, data.userId))
        .limit(1);
      
      if (existingProfile.length > 0) {
        return {
          success: false,
          message: 'Voice authentication already registered for this user'
        };
      }
      
      // Extract features from multiple audio samples
      const allFeatures: number[][] = [];
      for (const audioSample of data.audioSamples) {
        const features = this.extractVoiceFeatures(audioSample);
        allFeatures.push(features);
      }
      
      // Calculate average features for primary authentication
      const avgFeatures = this.calculateAverageFeatures(allFeatures);
      
      // Use first sample as backup
      const backupFeatures = allFeatures[0] || avgFeatures;
      
      // Calculate confidence based on consistency between samples
      const confidence = this.calculateRegistrationConfidence(allFeatures);
      
      // Create voice authentication profile
      const [profile] = await db
        .insert(voiceAuthProfiles)
        .values({
          userId: data.userId,
          isEnabled: true,
          authVoiceFeatures: JSON.stringify(avgFeatures),
          backupVoiceFeatures: JSON.stringify(backupFeatures),
          confidenceThreshold: confidence > 0.9 ? "0.85" : "0.80", // Lower threshold for less consistent voices
          registrationSamples: data.audioSamples,
          environmentalFactors: data.environmentalFactors || null,
        })
        .returning();
      
      // Create default settings
      await db
        .insert(voiceAuthSettings)
        .values({
          userId: data.userId,
          requirePassphrase: data.passphrase ? true : false,
          customPassphrase: data.passphrase || null,
          adaptiveThreshold: true,
          emergencyBypass: true,
          biometricFallback: true,
          notifyOnAuth: true,
        });
      
      return {
        success: true,
        profileId: profile.id,
        message: 'Voice authentication registered successfully'
      };
    } catch (error) {
      console.error('Voice print registration error:', error);
      return {
        success: false,
        message: 'Failed to register voice authentication'
      };
    }
  }
  
  private static calculateAverageFeatures(allFeatures: number[][]): number[] {
    if (allFeatures.length === 0) return [];
    
    const featureLength = allFeatures[0].length;
    const avgFeatures: number[] = new Array(featureLength).fill(0);
    
    for (const features of allFeatures) {
      for (let i = 0; i < featureLength && i < features.length; i++) {
        avgFeatures[i] += features[i];
      }
    }
    
    return avgFeatures.map(sum => sum / allFeatures.length);
  }
  
  private static calculateRegistrationConfidence(allFeatures: number[][]): number {
    if (allFeatures.length < 2) return 0.8; // Default for single sample
    
    const avgFeatures = this.calculateAverageFeatures(allFeatures);
    let totalSimilarity = 0;
    
    for (const features of allFeatures) {
      const similarity = this.calculateVoiceSimilarity(features, avgFeatures);
      totalSimilarity += similarity;
    }
    
    return totalSimilarity / allFeatures.length;
  }
  
  /**
   * Authenticate user using voice print
   */
  static async authenticateVoice(
    audioData: string,
    passphrase?: string,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<VoiceAuthResult> {
    try {
      const extractedFeatures = this.extractVoiceFeatures(audioData);
      const sessionId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get all voice auth profiles
      const profiles = await db
        .select()
        .from(voiceAuthProfiles)
        .where(eq(voiceAuthProfiles.isEnabled, true));
      
      let bestMatch: {
        userId: string;
        confidence: number;
        profile: typeof profiles[0];
      } | null = null;
      
      // Find best matching voice print
      for (const profile of profiles) {
        // Check if account is locked out
        if (profile.isLockedOut && profile.lockoutUntil && new Date() < profile.lockoutUntil) {
          continue;
        }
        
        const storedFeatures = JSON.parse(profile.authVoiceFeatures);
        const backupFeatures = profile.backupVoiceFeatures ? JSON.parse(profile.backupVoiceFeatures) : null;
        
        // Check against primary features
        const primarySimilarity = this.calculateVoiceSimilarity(extractedFeatures, storedFeatures);
        let maxSimilarity = primarySimilarity;
        
        // Check against backup features if available
        if (backupFeatures) {
          const backupSimilarity = this.calculateVoiceSimilarity(extractedFeatures, backupFeatures);
          maxSimilarity = Math.max(primarySimilarity, backupSimilarity);
        }
        
        const threshold = parseFloat(profile.confidenceThreshold || "0.85");
        
        if (maxSimilarity > threshold && (!bestMatch || maxSimilarity > bestMatch.confidence)) {
          bestMatch = {
            userId: profile.userId,
            confidence: maxSimilarity,
            profile
          };
        }
      }
      
      // If no match found, log failed attempt
      if (!bestMatch) {
        return {
          success: false,
          failureReason: 'voice_mismatch',
          sessionId
        };
      }
      
      // Check passphrase if required
      const settings = await db
        .select()
        .from(voiceAuthSettings)
        .where(eq(voiceAuthSettings.userId, bestMatch.userId))
        .limit(1);
      
      if (settings.length > 0 && settings[0].requirePassphrase) {
        if (!passphrase || passphrase !== settings[0].customPassphrase) {
          // Log failed attempt
          await this.logAuthAttempt({
            userId: bestMatch.userId,
            audioSample: audioData,
            extractedFeatures: JSON.stringify(extractedFeatures),
            confidenceScore: bestMatch.confidence.toString(),
            wasSuccessful: false,
            failureReason: 'incorrect_passphrase',
            deviceInfo,
            ipAddress,
            userAgent,
            sessionId
          });
          
          return {
            success: false,
            failureReason: 'incorrect_passphrase',
            requiresPassphrase: true,
            sessionId
          };
        }
      }
      
      // Successful authentication
      await db
        .update(voiceAuthProfiles)
        .set({
          lastAuthSuccess: new Date(),
          failedAttempts: 0,
          isLockedOut: false,
          lockoutUntil: null,
        })
        .where(eq(voiceAuthProfiles.userId, bestMatch.userId));
      
      // Log successful attempt
      await this.logAuthAttempt({
        userId: bestMatch.userId,
        audioSample: audioData,
        extractedFeatures: JSON.stringify(extractedFeatures),
        confidenceScore: bestMatch.confidence.toString(),
        wasSuccessful: true,
        deviceInfo,
        ipAddress,
        userAgent,
        sessionId
      });
      
      return {
        success: true,
        userId: bestMatch.userId,
        confidence: bestMatch.confidence,
        sessionId
      };
      
    } catch (error) {
      console.error('Voice authentication error:', error);
      return {
        success: false,
        failureReason: 'system_error'
      };
    }
  }
  
  /**
   * Log authentication attempt
   */
  private static async logAuthAttempt(data: {
    userId: string;
    audioSample: string;
    extractedFeatures: string;
    confidenceScore: string;
    wasSuccessful: boolean;
    failureReason?: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    environmentalNoise?: string;
    attemptDuration?: number;
  }): Promise<void> {
    try {
      await db.insert(voiceAuthAttempts).values(data);
      
      // Handle failed attempts and lockout
      if (!data.wasSuccessful) {
        const profile = await db
          .select()
          .from(voiceAuthProfiles)
          .where(eq(voiceAuthProfiles.userId, data.userId))
          .limit(1);
        
        if (profile.length > 0) {
          const newFailedAttempts = (profile[0].failedAttempts || 0) + 1;
          const maxAttempts = profile[0].maxAuthAttempts || 3;
          
          if (newFailedAttempts >= maxAttempts) {
            const lockoutDuration = profile[0].lockoutDuration || 15;
            const lockoutUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
            
            await db
              .update(voiceAuthProfiles)
              .set({
                failedAttempts: newFailedAttempts,
                isLockedOut: true,
                lockoutUntil
              })
              .where(eq(voiceAuthProfiles.userId, data.userId));
          } else {
            await db
              .update(voiceAuthProfiles)
              .set({
                failedAttempts: newFailedAttempts
              })
              .where(eq(voiceAuthProfiles.userId, data.userId));
          }
        }
      }
    } catch (error) {
      console.error('Failed to log auth attempt:', error);
    }
  }
  
  /**
   * Get voice authentication status for user
   */
  static async getAuthStatus(userId: string): Promise<{
    isRegistered: boolean;
    isEnabled: boolean;
    isLockedOut: boolean;
    lockoutUntil?: Date;
    failedAttempts: number;
    maxAttempts: number;
    lastAuthSuccess?: Date;
    requiresPassphrase: boolean;
  }> {
    try {
      const [profile] = await db
        .select()
        .from(voiceAuthProfiles)
        .where(eq(voiceAuthProfiles.userId, userId))
        .limit(1);
      
      const [settings] = await db
        .select()
        .from(voiceAuthSettings)
        .where(eq(voiceAuthSettings.userId, userId))
        .limit(1);
      
      if (!profile) {
        return {
          isRegistered: false,
          isEnabled: false,
          isLockedOut: false,
          failedAttempts: 0,
          maxAttempts: 3,
          requiresPassphrase: false
        };
      }
      
      return {
        isRegistered: true,
        isEnabled: profile.isEnabled,
        isLockedOut: profile.isLockedOut || false,
        lockoutUntil: profile.lockoutUntil || undefined,
        failedAttempts: profile.failedAttempts || 0,
        maxAttempts: profile.maxAuthAttempts || 3,
        lastAuthSuccess: profile.lastAuthSuccess || undefined,
        requiresPassphrase: settings?.requirePassphrase || false
      };
    } catch (error) {
      console.error('Get auth status error:', error);
      return {
        isRegistered: false,
        isEnabled: false,
        isLockedOut: false,
        failedAttempts: 0,
        maxAttempts: 3,
        requiresPassphrase: false
      };
    }
  }
  
  /**
   * Update voice authentication settings
   */
  static async updateAuthSettings(
    userId: string,
    settings: Partial<{
      isEnabled: boolean;
      requirePassphrase: boolean;
      customPassphrase: string;
      confidenceThreshold: number;
      maxAuthAttempts: number;
      lockoutDuration: number;
      adaptiveThreshold: boolean;
      emergencyBypass: boolean;
      biometricFallback: boolean;
    }>
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Update profile settings
      if (settings.isEnabled !== undefined || 
          settings.confidenceThreshold !== undefined ||
          settings.maxAuthAttempts !== undefined ||
          settings.lockoutDuration !== undefined) {
        
        const profileUpdates: any = {};
        if (settings.isEnabled !== undefined) profileUpdates.isEnabled = settings.isEnabled;
        if (settings.confidenceThreshold !== undefined) profileUpdates.confidenceThreshold = settings.confidenceThreshold.toString();
        if (settings.maxAuthAttempts !== undefined) profileUpdates.maxAuthAttempts = settings.maxAuthAttempts;
        if (settings.lockoutDuration !== undefined) profileUpdates.lockoutDuration = settings.lockoutDuration;
        
        await db
          .update(voiceAuthProfiles)
          .set(profileUpdates)
          .where(eq(voiceAuthProfiles.userId, userId));
      }
      
      // Update user settings
      const userUpdates: any = {};
      if (settings.requirePassphrase !== undefined) userUpdates.requirePassphrase = settings.requirePassphrase;
      if (settings.customPassphrase !== undefined) userUpdates.customPassphrase = settings.customPassphrase;
      if (settings.adaptiveThreshold !== undefined) userUpdates.adaptiveThreshold = settings.adaptiveThreshold;
      if (settings.emergencyBypass !== undefined) userUpdates.emergencyBypass = settings.emergencyBypass;
      if (settings.biometricFallback !== undefined) userUpdates.biometricFallback = settings.biometricFallback;
      
      if (Object.keys(userUpdates).length > 0) {
        await db
          .update(voiceAuthSettings)
          .set(userUpdates)
          .where(eq(voiceAuthSettings.userId, userId));
      }
      
      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      console.error('Update auth settings error:', error);
      return { success: false, message: 'Failed to update settings' };
    }
  }
  
  /**
   * Reset lockout for user
   */
  static async resetLockout(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await db
        .update(voiceAuthProfiles)
        .set({
          isLockedOut: false,
          lockoutUntil: null,
          failedAttempts: 0
        })
        .where(eq(voiceAuthProfiles.userId, userId));
      
      return { success: true, message: 'Lockout reset successfully' };
    } catch (error) {
      console.error('Reset lockout error:', error);
      return { success: false, message: 'Failed to reset lockout' };
    }
  }
}