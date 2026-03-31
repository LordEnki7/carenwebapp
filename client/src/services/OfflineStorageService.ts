import { openDB, IDBPDatabase } from 'idb';

interface OfflineData {
  id: string;
  type: 'legal-rights' | 'emergency-contacts' | 'recording' | 'incident' | 'voice-command';
  data: any;
  timestamp: number;
  synced: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface EmergencyCache {
  legalRights: any[];
  emergencyContacts: any[];
  voiceCommands: any[];
  userSettings: any;
  lastSync: number;
}

class OfflineStorageService {
  private db: IDBPDatabase | null = null;
  private dbName = 'caren-offline-db';
  private version = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB(this.dbName, this.version, {
        upgrade(db) {
          // Store for offline data
          if (!db.objectStoreNames.contains('offline-data')) {
            const offlineStore = db.createObjectStore('offline-data', { keyPath: 'id' });
            offlineStore.createIndex('type', 'type');
            offlineStore.createIndex('priority', 'priority');
            offlineStore.createIndex('synced', 'synced');
            offlineStore.createIndex('timestamp', 'timestamp');
          }

          // Store for emergency cache
          if (!db.objectStoreNames.contains('emergency-cache')) {
            db.createObjectStore('emergency-cache', { keyPath: 'key' });
          }

          // Store for recordings
          if (!db.objectStoreNames.contains('recordings')) {
            const recordingStore = db.createObjectStore('recordings', { keyPath: 'id' });
            recordingStore.createIndex('timestamp', 'timestamp');
            recordingStore.createIndex('emergency', 'emergency');
          }

          // Store for voice commands cache
          if (!db.objectStoreNames.contains('voice-commands')) {
            db.createObjectStore('voice-commands', { keyPath: 'pattern' });
          }
        },
      });
      console.log('Offline storage initialized');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  // Emergency cache methods
  async cacheEmergencyData(data: EmergencyCache): Promise<void> {
    if (!this.db) await this.init();
    
    try {
      const tx = this.db!.transaction('emergency-cache', 'readwrite');
      await tx.objectStore('emergency-cache').put({
        key: 'emergency-data',
        ...data,
        lastSync: Date.now()
      });
      await tx.done;
      console.log('Emergency data cached');
    } catch (error) {
      console.error('Failed to cache emergency data:', error);
    }
  }

  async getEmergencyCache(): Promise<EmergencyCache | null> {
    if (!this.db) await this.init();
    
    try {
      const cached = await this.db!.get('emergency-cache', 'emergency-data');
      return cached || null;
    } catch (error) {
      console.error('Failed to get emergency cache:', error);
      return null;
    }
  }

  // Legal rights offline storage
  async cacheLegalRights(stateCode: string, rights: any[]): Promise<void> {
    const data: OfflineData = {
      id: `legal-rights-${stateCode}`,
      type: 'legal-rights',
      data: { stateCode, rights },
      timestamp: Date.now(),
      synced: true,
      priority: 'critical'
    };

    await this.storeOfflineData(data);
  }

  async getCachedLegalRights(stateCode: string): Promise<any[] | null> {
    const cached = await this.getOfflineData(`legal-rights-${stateCode}`);
    return cached?.data.rights || null;
  }

  // Emergency contacts offline storage
  async cacheEmergencyContacts(contacts: any[]): Promise<void> {
    const data: OfflineData = {
      id: 'emergency-contacts',
      type: 'emergency-contacts',
      data: contacts,
      timestamp: Date.now(),
      synced: true,
      priority: 'critical'
    };

    await this.storeOfflineData(data);
  }

  async getCachedEmergencyContacts(): Promise<any[] | null> {
    const cached = await this.getOfflineData('emergency-contacts');
    return cached?.data || null;
  }

  // Recording storage for offline mode
  async storeRecording(recordingData: {
    id: string;
    blob: Blob;
    metadata: any;
    emergency: boolean;
  }): Promise<void> {
    if (!this.db) await this.init();

    try {
      const arrayBuffer = await recordingData.blob.arrayBuffer();
      
      const tx = this.db!.transaction('recordings', 'readwrite');
      await tx.objectStore('recordings').put({
        id: recordingData.id,
        data: arrayBuffer,
        metadata: recordingData.metadata,
        emergency: recordingData.emergency,
        timestamp: Date.now(),
        synced: false
      });
      await tx.done;
      
      console.log('Recording stored offline:', recordingData.id);
    } catch (error) {
      console.error('Failed to store recording:', error);
    }
  }

  async getRecording(id: string): Promise<Blob | null> {
    if (!this.db) await this.init();

    try {
      const recording = await this.db!.get('recordings', id);
      if (recording && recording.data) {
        return new Blob([recording.data]);
      }
      return null;
    } catch (error) {
      console.error('Failed to get recording:', error);
      return null;
    }
  }

  async getAllUnsynced(): Promise<any[]> {
    if (!this.db) await this.init();

    try {
      const recordings = await this.db!.getAllFromIndex('recordings', 'emergency', true);
      const offlineData = await this.db!.getAllFromIndex('offline-data', 'synced', false);
      
      return [...recordings, ...offlineData];
    } catch (error) {
      console.error('Failed to get unsynced data:', error);
      return [];
    }
  }

  // Voice commands caching
  async cacheVoiceCommands(commands: any[]): Promise<void> {
    if (!this.db) await this.init();

    try {
      const tx = this.db!.transaction('voice-commands', 'readwrite');
      
      for (const command of commands) {
        await tx.objectStore('voice-commands').put(command);
      }
      
      await tx.done;
      console.log('Voice commands cached');
    } catch (error) {
      console.error('Failed to cache voice commands:', error);
    }
  }

  async getCachedVoiceCommands(): Promise<any[]> {
    if (!this.db) await this.init();

    try {
      return await this.db!.getAll('voice-commands');
    } catch (error) {
      console.error('Failed to get cached voice commands:', error);
      return [];
    }
  }

  // Generic offline data methods
  private async storeOfflineData(data: OfflineData): Promise<void> {
    if (!this.db) await this.init();

    try {
      const tx = this.db!.transaction('offline-data', 'readwrite');
      await tx.objectStore('offline-data').put(data);
      await tx.done;
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  private async getOfflineData(id: string): Promise<OfflineData | null> {
    if (!this.db) await this.init();

    try {
      return await this.db!.get('offline-data', id) || null;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  // Sync methods
  async syncToServer(): Promise<boolean> {
    const unsyncedData = await this.getAllUnsynced();
    
    if (unsyncedData.length === 0) {
      return true;
    }

    try {
      const response = await fetch('/api/sync-offline-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: unsyncedData })
      });

      if (response.ok) {
        // Mark data as synced
        await this.markAsSynced(unsyncedData.map(d => d.id));
        console.log('Offline data synced successfully');
        return true;
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
    
    return false;
  }

  private async markAsSynced(ids: string[]): Promise<void> {
    if (!this.db) await this.init();

    try {
      const tx = this.db!.transaction(['offline-data', 'recordings'], 'readwrite');
      
      for (const id of ids) {
        // Try both stores
        const offlineData = await tx.objectStore('offline-data').get(id);
        if (offlineData) {
          offlineData.synced = true;
          await tx.objectStore('offline-data').put(offlineData);
        }
        
        const recording = await tx.objectStore('recordings').get(id);
        if (recording) {
          recording.synced = true;
          await tx.objectStore('recordings').put(recording);
        }
      }
      
      await tx.done;
    } catch (error) {
      console.error('Failed to mark data as synced:', error);
    }
  }

  // Storage management
  async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? Math.round((used / quota) * 100) : 0;
        
        return { used, quota, percentage };
      }
      
      return { used: 0, quota: 0, percentage: 0 };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { used: 0, quota: 0, percentage: 0 };
    }
  }

  async clearOldData(olderThanDays: number = 7): Promise<void> {
    if (!this.db) await this.init();

    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    try {
      const tx = this.db!.transaction(['offline-data', 'recordings'], 'readwrite');
      
      // Clear old offline data (except critical priority)
      const allOfflineData = await tx.objectStore('offline-data').getAll();
      for (const item of allOfflineData) {
        if (item.timestamp < cutoffTime && item.priority !== 'critical' && item.synced) {
          await tx.objectStore('offline-data').delete(item.id);
        }
      }
      
      // Clear old recordings (keep emergency recordings longer)
      const allRecordings = await tx.objectStore('recordings').getAll();
      for (const recording of allRecordings) {
        const isOld = recording.emergency 
          ? recording.timestamp < (cutoffTime - (7 * 24 * 60 * 60 * 1000)) // Keep emergency recordings 14 days
          : recording.timestamp < cutoffTime;
          
        if (isOld && recording.synced) {
          await tx.objectStore('recordings').delete(recording.id);
        }
      }
      
      await tx.done;
      console.log('Old data cleared');
    } catch (error) {
      console.error('Failed to clear old data:', error);
    }
  }

  // Emergency mode - preload critical data
  async preloadEmergencyData(): Promise<void> {
    try {
      // Preload legal rights for current state
      const userState = localStorage.getItem('caren-user-state') || 'CA';
      const legalRightsResponse = await fetch(`/api/legal-rights?state=${userState}`);
      if (legalRightsResponse.ok) {
        const rights = await legalRightsResponse.json();
        await this.cacheLegalRights(userState, rights);
      }

      // Preload emergency contacts
      const contactsResponse = await fetch('/api/emergency-contacts');
      if (contactsResponse.ok) {
        const contacts = await contactsResponse.json();
        await this.cacheEmergencyContacts(contacts);
      }

      // Cache voice commands
      const voiceCommandsResponse = await fetch('/api/voice-commands');
      if (voiceCommandsResponse.ok) {
        const commands = await voiceCommandsResponse.json();
        await this.cacheVoiceCommands(commands);
      }

      console.log('Emergency data preloaded');
    } catch (error) {
      console.error('Failed to preload emergency data:', error);
    }
  }
}

export const offlineStorage = new OfflineStorageService();