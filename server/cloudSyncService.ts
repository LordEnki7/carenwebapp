import { db } from "./db";
import { 
  userDevices, 
  cloudSyncData, 
  syncConflicts, 
  syncSessions, 
  syncStatistics, 
  cloudBackupSettings,
  type InsertUserDevice,
  type InsertCloudSyncData,
  type InsertSyncConflict,
  type InsertSyncSession,
  type UserDevice,
  type CloudSyncData,
  type SyncConflict
} from "@shared/schema";
import { eq, and, desc, asc, gte, lte, isNull } from "drizzle-orm";
import { EncryptionService } from "./security";
import crypto from "crypto";

export interface SyncDataPayload {
  dataType: string;
  entityId: string;
  data: any;
  version: number;
  priority: number;
}

export interface DeviceRegistration {
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  platform: 'ios' | 'android' | 'web' | 'windows' | 'mac';
  appVersion: string;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  conflictsFound: number;
  errors: string[];
  sessionId: string;
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'local' | 'remote' | 'merged';
  mergedData?: any;
}

export class CloudSyncService {
  
  // Device Management
  static async registerDevice(userId: string, registration: DeviceRegistration): Promise<UserDevice> {
    const deviceFingerprint = this.generateDeviceFingerprint(registration);
    const encryptionKeys = this.generateEncryptionKeys();
    
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const deviceData: InsertUserDevice = {
      userId,
      deviceName: registration.deviceName,
      deviceType: registration.deviceType,
      deviceFingerprint,
      platform: registration.platform,
      appVersion: registration.appVersion,
      encryptionPublicKey: encryptionKeys.publicKey,
      lastSyncAt: new Date(),
    };

    const [device] = await db.insert(userDevices).values(deviceData).returning();
    
    // Initialize cloud backup settings for new devices
    await this.initializeCloudBackupSettings(userId);
    
    return device;
  }

  static async getUserDevices(userId: string): Promise<UserDevice[]> {
    return await db.select()
      .from(userDevices)
      .where(and(eq(userDevices.userId, userId), eq(userDevices.isActive, true)))
      .orderBy(desc(userDevices.lastSyncAt));
  }

  static async updateDeviceLastSync(deviceId: string): Promise<void> {
    await db.update(userDevices)
      .set({ lastSyncAt: new Date() })
      .where(eq(userDevices.id, deviceId));
  }

  // Encryption and Security
  static generateDeviceFingerprint(registration: DeviceRegistration): string {
    const fingerprint = `${registration.platform}_${registration.deviceType}_${registration.appVersion}_${Date.now()}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  static generateEncryptionKeys(): { publicKey: string; privateKey: string } {
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    };
  }

  static encryptSyncData(data: any, devicePublicKey: string): {
    encryptedData: string;
    encryptionIv: string;
    encryptionTag: string;
    dataHash: string;
  } {
    const jsonData = JSON.stringify(data);
    const encryption = EncryptionService.encrypt(jsonData);
    const dataHash = crypto.createHash('sha256').update(jsonData).digest('hex');
    
    return {
      encryptedData: encryption.encrypted,
      encryptionIv: encryption.iv,
      encryptionTag: encryption.tag,
      dataHash
    };
  }

  static decryptSyncData(encryptedData: string, iv: string, tag: string, key: string): any {
    const decrypted = EncryptionService.decrypt({
      encrypted: encryptedData,
      key,
      iv,
      tag
    });
    
    return JSON.parse(decrypted);
  }

  // Data Synchronization
  static async syncDataToCloud(
    userId: string, 
    deviceId: string, 
    payload: SyncDataPayload
  ): Promise<CloudSyncData> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const encrypted = this.encryptSyncData(payload.data, device.encryptionPublicKey);
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const syncData: InsertCloudSyncData = {
      userId,
      dataType: payload.dataType,
      entityId: payload.entityId,
      encryptedData: encrypted.encryptedData,
      encryptionIv: encrypted.encryptionIv,
      encryptionTag: encrypted.encryptionTag,
      dataHash: encrypted.dataHash,
      version: payload.version,
      deviceOrigin: deviceId,
      lastModifiedDeviceId: deviceId,
      syncPriority: payload.priority,
      syncStatus: 'synced',
      successfulSyncAt: new Date()
    };

    const [result] = await db.insert(cloudSyncData).values(syncData).returning();
    
    await this.updateDeviceLastSync(deviceId);
    
    return result;
  }

  static async getCloudDataForSync(
    userId: string, 
    dataType?: string, 
    since?: Date
  ): Promise<CloudSyncData[]> {
    let conditions = [
      eq(cloudSyncData.userId, userId),
      eq(cloudSyncData.isDeleted, false),
      eq(cloudSyncData.syncStatus, 'synced')
    ];

    if (dataType) {
      conditions.push(eq(cloudSyncData.dataType, dataType));
    }

    if (since) {
      conditions.push(gte(cloudSyncData.updatedAt, since));
    }

    return await db.select()
      .from(cloudSyncData)
      .where(and(...conditions))
      .orderBy(desc(cloudSyncData.updatedAt));
  }

  // Conflict Resolution
  static async detectConflicts(
    userId: string,
    localData: SyncDataPayload,
    deviceId: string
  ): Promise<SyncConflict | null> {
    const existing = await db.select()
      .from(cloudSyncData)
      .where(and(
        eq(cloudSyncData.userId, userId),
        eq(cloudSyncData.dataType, localData.dataType),
        eq(cloudSyncData.entityId, localData.entityId),
        eq(cloudSyncData.isDeleted, false)
      ))
      .orderBy(desc(cloudSyncData.version))
      .limit(1);

    if (existing.length === 0) {
      return null; // No conflict, this is new data
    }

    const remoteVersion = existing[0].version;
    const localVersion = localData.version;

    if (localVersion <= remoteVersion && existing[0].deviceOrigin !== deviceId) {
      // Conflict detected
      const conflictId = `conflict_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      const conflictData: InsertSyncConflict = {
        userId,
        dataType: localData.dataType,
        entityId: localData.entityId,
        conflictType: 'version_mismatch',
        localVersion,
        remoteVersion,
        localData: JSON.stringify(localData.data),
        remoteData: existing[0].encryptedData,
        conflictMetadata: {
          localDeviceId: deviceId,
          remoteDeviceId: existing[0].deviceOrigin,
          detectedAt: new Date().toISOString()
        }
      };

      const [conflict] = await db.insert(syncConflicts).values(conflictData).returning();
      return conflict;
    }

    return null;
  }

  static async resolveConflict(
    userId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    const conflict = await db.select()
      .from(syncConflicts)
      .where(and(
        eq(syncConflicts.id, resolution.conflictId),
        eq(syncConflicts.userId, userId),
        eq(syncConflicts.isResolved, false)
      ))
      .limit(1);

    if (conflict.length === 0) {
      throw new Error('Conflict not found or already resolved');
    }

    let resolvedData: any;
    
    switch (resolution.resolution) {
      case 'local':
        resolvedData = JSON.parse(conflict[0].localData);
        break;
      case 'remote':
        resolvedData = JSON.parse(conflict[0].remoteData);
        break;
      case 'merged':
        resolvedData = resolution.mergedData;
        break;
      default:
        throw new Error('Invalid resolution type');
    }

    // Update the cloud sync data with resolved version
    await db.update(cloudSyncData)
      .set({
        version: Math.max(conflict[0].localVersion, conflict[0].remoteVersion) + 1,
        updatedAt: new Date()
      })
      .where(and(
        eq(cloudSyncData.userId, userId),
        eq(cloudSyncData.dataType, conflict[0].dataType),
        eq(cloudSyncData.entityId, conflict[0].entityId)
      ));

    // Mark conflict as resolved
    await db.update(syncConflicts)
      .set({
        resolution: resolution.resolution,
        resolvedAt: new Date(),
        isResolved: true
      })
      .where(eq(syncConflicts.id, resolution.conflictId));
  }

  static async getPendingConflicts(userId: string): Promise<SyncConflict[]> {
    return await db.select()
      .from(syncConflicts)
      .where(and(
        eq(syncConflicts.userId, userId),
        eq(syncConflicts.isResolved, false)
      ))
      .orderBy(desc(syncConflicts.createdAt));
  }

  // Sync Sessions
  static async startSyncSession(
    userId: string,
    deviceId: string,
    sessionType: 'full_sync' | 'incremental_sync' | 'conflict_resolution',
    syncDirection: 'up' | 'down' | 'bidirectional'
  ): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const sessionData: InsertSyncSession = {
      userId,
      deviceId,
      sessionType,
      status: 'started',
      syncDirection,
      encryptionMethod: 'AES-256-GCM'
    };

    await db.insert(syncSessions).values(sessionData);
    return sessionId;
  }

  static async updateSyncSession(
    sessionId: string,
    updates: {
      status?: 'in_progress' | 'completed' | 'failed' | 'cancelled';
      itemsToSync?: number;
      itemsSynced?: number;
      itemsFailed?: number;
      conflictsFound?: number;
      conflictsResolved?: number;
      transferredBytes?: number;
      errorMessage?: string;
      completedAt?: Date;
      duration?: number;
    }
  ): Promise<void> {
    await db.update(syncSessions)
      .set(updates)
      .where(eq(syncSessions.id, sessionId));
  }

  // Cloud Backup Settings
  static async initializeCloudBackupSettings(userId: string): Promise<void> {
    const existing = await db.select()
      .from(cloudBackupSettings)
      .where(eq(cloudBackupSettings.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      const settingsId = `backup_settings_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      await db.insert(cloudBackupSettings).values({
        id: settingsId,
        userId,
        isEnabled: true,
        autoBackupEnabled: true,
        backupFrequency: 'daily',
        retentionDays: 90,
        encryptionEnabled: true,
        maxStorageGB: 5
      });
    }
  }

  static async getCloudBackupSettings(userId: string) {
    const [settings] = await db.select()
      .from(cloudBackupSettings)
      .where(eq(cloudBackupSettings.userId, userId))
      .limit(1);

    return settings || null;
  }

  static async updateCloudBackupSettings(
    userId: string,
    updates: Partial<{
      isEnabled: boolean;
      autoBackupEnabled: boolean;
      backupFrequency: string;
      retentionDays: number;
      encryptionEnabled: boolean;
      compressionEnabled: boolean;
      includePriorityData: boolean;
      includePersonalData: boolean;
      includeMediaFiles: boolean;
      maxStorageGB: number;
      wifiOnlySync: boolean;
      lowPowerModeSync: boolean;
      notificationsEnabled: boolean;
    }>
  ): Promise<void> {
    await db.update(cloudBackupSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cloudBackupSettings.userId, userId));
  }

  // Utility Methods
  static async getDeviceById(deviceId: string): Promise<UserDevice | null> {
    const [device] = await db.select()
      .from(userDevices)
      .where(eq(userDevices.id, deviceId))
      .limit(1);

    return device || null;
  }

  static async performFullSync(
    userId: string,
    deviceId: string,
    localData: SyncDataPayload[]
  ): Promise<SyncResult> {
    const sessionId = await this.startSyncSession(userId, deviceId, 'full_sync', 'bidirectional');
    
    let syncedItems = 0;
    let conflictsFound = 0;
    const errors: string[] = [];

    try {
      await this.updateSyncSession(sessionId, { 
        status: 'in_progress',
        itemsToSync: localData.length 
      });

      for (const item of localData) {
        try {
          const conflict = await this.detectConflicts(userId, item, deviceId);
          
          if (conflict) {
            conflictsFound++;
          } else {
            await this.syncDataToCloud(userId, deviceId, item);
            syncedItems++;
          }
        } catch (error) {
          errors.push(`Failed to sync ${item.dataType}:${item.entityId} - ${error}`);
        }
      }

      await this.updateSyncSession(sessionId, {
        status: 'completed',
        itemsSynced: syncedItems,
        conflictsFound,
        completedAt: new Date()
      });

      return {
        success: errors.length === 0,
        syncedItems,
        conflictsFound,
        errors,
        sessionId
      };

    } catch (error) {
      await this.updateSyncSession(sessionId, {
        status: 'failed',
        errorMessage: String(error)
      });

      throw error;
    }
  }

  static async getStorageUsage(userId: string): Promise<{
    totalItems: number;
    storageUsedBytes: number;
    itemsByType: Record<string, number>;
  }> {
    const data = await db.select()
      .from(cloudSyncData)
      .where(and(
        eq(cloudSyncData.userId, userId),
        eq(cloudSyncData.isDeleted, false)
      ));

    const itemsByType: Record<string, number> = {};
    let storageUsedBytes = 0;

    for (const item of data) {
      itemsByType[item.dataType] = (itemsByType[item.dataType] || 0) + 1;
      storageUsedBytes += Buffer.byteLength(item.encryptedData, 'utf8');
    }

    return {
      totalItems: data.length,
      storageUsedBytes,
      itemsByType
    };
  }
}