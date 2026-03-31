import type { Express } from "express";
import { CloudSyncService } from "../cloudSyncService";
import { SecurityAuditLogger } from "../security";
import { getCurrentUser } from "../demoState";

export function registerCloudSyncRoutes(app: Express): void {
  
  app.post('/api/cloud-sync/devices/register', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const { deviceName, deviceType, platform, appVersion } = req.body;

      if (!deviceName || !deviceType || !platform) {
        return res.status(400).json({ message: 'Missing required device information' });
      }

      const device = await CloudSyncService.registerDevice(userId, {
        deviceName,
        deviceType,
        platform,
        appVersion: appVersion || '1.0.0'
      });

      SecurityAuditLogger.logDataAccess('device_registration', 'POST', req);

      res.json({
        success: true,
        device: {
          id: device.id,
          deviceName: device.deviceName,
          deviceType: device.deviceType,
          platform: device.platform,
          syncEnabled: device.syncEnabled,
          lastSyncAt: device.lastSyncAt
        }
      });

    } catch (error) {
      console.error('Device registration error:', error);
      res.status(500).json({ message: 'Failed to register device' });
    }
  });

  app.get('/api/cloud-sync/devices', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const devices = await CloudSyncService.getUserDevices(userId);

      res.json({
        success: true,
        devices: devices.map(device => ({
          id: device.id,
          deviceName: device.deviceName,
          deviceType: device.deviceType,
          platform: device.platform,
          isActive: device.isActive,
          lastSyncAt: device.lastSyncAt,
          syncEnabled: device.syncEnabled,
          autoSyncEnabled: device.autoSyncEnabled
        }))
      });

    } catch (error) {
      console.error('Get devices error:', error);
      res.status(500).json({ message: 'Failed to retrieve devices' });
    }
  });

  app.post('/api/cloud-sync/sync', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const { deviceId, dataType, entityId, data, version, priority } = req.body;

      if (!deviceId || !dataType || !entityId || !data) {
        return res.status(400).json({ message: 'Missing required sync data' });
      }

      const conflict = await CloudSyncService.detectConflicts(userId, {
        dataType,
        entityId,
        data,
        version: version || 1,
        priority: priority || 1
      }, deviceId);

      if (conflict) {
        return res.json({
          success: false,
          conflict: {
            id: conflict.id,
            conflictType: conflict.conflictType,
            localVersion: conflict.localVersion,
            remoteVersion: conflict.remoteVersion,
            requiresResolution: true
          }
        });
      }

      const syncResult = await CloudSyncService.syncDataToCloud(userId, deviceId, {
        dataType,
        entityId,
        data,
        version: version || 1,
        priority: priority || 1
      });

      SecurityAuditLogger.logDataAccess('cloud_sync', 'POST', req);

      res.json({
        success: true,
        syncId: syncResult.id,
        version: syncResult.version,
        syncedAt: syncResult.successfulSyncAt
      });

    } catch (error) {
      console.error('Cloud sync error:', error);
      res.status(500).json({ message: 'Failed to sync data to cloud' });
    }
  });

  app.get('/api/cloud-sync/data', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const { dataType, since } = req.query;
      const sinceDate = since ? new Date(since as string) : undefined;

      const cloudData = await CloudSyncService.getCloudDataForSync(
        userId, 
        dataType as string, 
        sinceDate
      );

      res.json({
        success: true,
        data: cloudData.map(item => ({
          id: item.id,
          dataType: item.dataType,
          entityId: item.entityId,
          version: item.version,
          syncStatus: item.syncStatus,
          syncPriority: item.syncPriority,
          lastModifiedDeviceId: item.lastModifiedDeviceId,
          updatedAt: item.updatedAt,
        })),
        count: cloudData.length
      });

    } catch (error) {
      console.error('Get cloud data error:', error);
      res.status(500).json({ message: 'Failed to retrieve cloud data' });
    }
  });

  app.get('/api/cloud-sync/conflicts', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const conflicts = await CloudSyncService.getPendingConflicts(userId);

      res.json({
        success: true,
        conflicts: conflicts.map(conflict => ({
          id: conflict.id,
          dataType: conflict.dataType,
          entityId: conflict.entityId,
          conflictType: conflict.conflictType,
          localVersion: conflict.localVersion,
          remoteVersion: conflict.remoteVersion,
          conflictMetadata: conflict.conflictMetadata,
          createdAt: conflict.createdAt
        })),
        count: conflicts.length
      });

    } catch (error) {
      console.error('Get conflicts error:', error);
      res.status(500).json({ message: 'Failed to retrieve conflicts' });
    }
  });

  app.post('/api/cloud-sync/conflicts/resolve', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const { conflictId, resolution, mergedData } = req.body;

      if (!conflictId || !resolution) {
        return res.status(400).json({ message: 'Missing conflict ID or resolution' });
      }

      if (resolution === 'merged' && !mergedData) {
        return res.status(400).json({ message: 'Merged data required for merge resolution' });
      }

      await CloudSyncService.resolveConflict(userId, {
        conflictId,
        resolution,
        mergedData
      });

      SecurityAuditLogger.logDataAccess('conflict_resolution', 'POST', req);

      res.json({
        success: true,
        message: 'Conflict resolved successfully'
      });

    } catch (error) {
      console.error('Conflict resolution error:', error);
      res.status(500).json({ message: 'Failed to resolve conflict' });
    }
  });

  app.post('/api/cloud-sync/full-sync', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const { deviceId, localData } = req.body;

      if (!deviceId || !Array.isArray(localData)) {
        return res.status(400).json({ message: 'Invalid sync request data' });
      }

      const syncResult = await CloudSyncService.performFullSync(userId, deviceId, localData);

      SecurityAuditLogger.logDataAccess('full_sync', 'POST', req);

      res.json({
        success: syncResult.success,
        result: {
          syncedItems: syncResult.syncedItems,
          conflictsFound: syncResult.conflictsFound,
          errors: syncResult.errors,
          sessionId: syncResult.sessionId
        }
      });

    } catch (error) {
      console.error('Full sync error:', error);
      res.status(500).json({ message: 'Failed to perform full sync' });
    }
  });

  app.get('/api/cloud-sync/backup-settings', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const settings = await CloudSyncService.getCloudBackupSettings(userId);

      if (!settings) {
        await CloudSyncService.initializeCloudBackupSettings(userId);
        const newSettings = await CloudSyncService.getCloudBackupSettings(userId);
        return res.json({ success: true, settings: newSettings });
      }

      res.json({ success: true, settings });

    } catch (error) {
      console.error('Get backup settings error:', error);
      res.status(500).json({ message: 'Failed to retrieve backup settings' });
    }
  });

  app.put('/api/cloud-sync/backup-settings', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const allowedUpdates = [
        'isEnabled', 'autoBackupEnabled', 'backupFrequency', 'retentionDays',
        'encryptionEnabled', 'compressionEnabled', 'includePriorityData',
        'includePersonalData', 'includeMediaFiles', 'maxStorageGB',
        'wifiOnlySync', 'lowPowerModeSync', 'notificationsEnabled'
      ];

      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {} as any);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid settings to update' });
      }

      await CloudSyncService.updateCloudBackupSettings(userId, updates);

      SecurityAuditLogger.logDataAccess('backup_settings_update', 'PUT', req);

      res.json({
        success: true,
        message: 'Backup settings updated successfully'
      });

    } catch (error) {
      console.error('Update backup settings error:', error);
      res.status(500).json({ message: 'Failed to update backup settings' });
    }
  });

  app.get('/api/cloud-sync/storage-usage', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const userId = currentUser.id;

      const usage = await CloudSyncService.getStorageUsage(userId);

      res.json({
        success: true,
        usage: {
          totalItems: usage.totalItems,
          storageUsedBytes: usage.storageUsedBytes,
          storageUsedMB: Math.round(usage.storageUsedBytes / 1024 / 1024 * 100) / 100,
          itemsByType: usage.itemsByType
        }
      });

    } catch (error) {
      console.error('Get storage usage error:', error);
      res.status(500).json({ message: 'Failed to retrieve storage usage' });
    }
  });
}
