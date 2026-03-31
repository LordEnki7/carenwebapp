import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CloudSyncHook {
  devices: any[];
  storageUsage: any;
  conflicts: any[];
  backupSettings: any;
  isLoading: boolean;
  registerDevice: (deviceData: any) => Promise<void>;
  syncNow: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: string, mergedData?: any) => Promise<void>;
  updateBackupSettings: (settings: any) => Promise<void>;
  syncIncident: (incident: any) => Promise<void>;
  syncEmergencyContact: (contact: any) => Promise<void>;
  syncUserPreferences: (preferences: any) => Promise<void>;
}

export function useCloudSync(): CloudSyncHook {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  // Fetch devices
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['/api/cloud-sync/devices'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch storage usage
  const { data: storageData, isLoading: storageLoading } = useQuery({
    queryKey: ['/api/cloud-sync/storage-usage'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch conflicts
  const { data: conflictsData, isLoading: conflictsLoading } = useQuery({
    queryKey: ['/api/cloud-sync/conflicts'],
    refetchInterval: 15000 // Check for conflicts every 15 seconds
  });

  // Fetch backup settings
  const { data: backupData, isLoading: backupLoading } = useQuery({
    queryKey: ['/api/cloud-sync/backup-settings'],
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Device registration mutation
  const registerDeviceMutation = useMutation({
    mutationFn: async (deviceData: any) => {
      return apiRequest('/api/cloud-sync/devices/register', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync/devices'] });
      toast({
        title: "Device Registered",
        description: "Your device has been registered for cloud sync",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register device",
        variant: "destructive"
      });
    }
  });

  // Manual sync mutation
  const syncNowMutation = useMutation({
    mutationFn: async () => {
      // Sync all local data
      const incidents = JSON.parse(localStorage.getItem('incidents') || '[]');
      const contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
      const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');

      const syncPromises = [];

      // Sync incidents
      for (const incident of incidents) {
        syncPromises.push(
          apiRequest('/api/cloud-sync/sync', {
            method: 'POST',
            body: JSON.stringify({
              dataType: 'incidents',
              entityId: incident.id,
              data: incident,
              version: incident.lastModified || Date.now(),
              priority: incident.isEmergency ? 5 : 3
            })
          })
        );
      }

      // Sync emergency contacts
      for (const contact of contacts) {
        syncPromises.push(
          apiRequest('/api/cloud-sync/sync', {
            method: 'POST',
            body: JSON.stringify({
              dataType: 'emergencyContacts',
              entityId: contact.id,
              data: contact,
              version: contact.lastModified || Date.now(),
              priority: 4
            })
          })
        );
      }

      // Sync user preferences
      if (Object.keys(preferences).length > 0) {
        syncPromises.push(
          apiRequest('/api/cloud-sync/sync', {
            method: 'POST',
            body: JSON.stringify({
              dataType: 'userPreferences',
              entityId: 'preferences',
              data: preferences,
              version: Date.now(),
              priority: 2
            })
          })
        );
      }

      await Promise.all(syncPromises);
      return { syncedItems: syncPromises.length };
    },
    onSuccess: (data) => {
      setLastSyncTime(Date.now());
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync'] });
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.syncedItems} items to cloud`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync data to cloud",
        variant: "destructive"
      });
    }
  });

  // Conflict resolution mutation
  const resolveConflictMutation = useMutation({
    mutationFn: async ({ conflictId, resolution, mergedData }: any) => {
      return apiRequest('/api/cloud-sync/conflicts/resolve', {
        method: 'POST',
        body: JSON.stringify({ conflictId, resolution, mergedData })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync/conflicts'] });
      toast({
        title: "Conflict Resolved",
        description: "The data conflict has been resolved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Resolution Failed",
        description: error.message || "Failed to resolve conflict",
        variant: "destructive"
      });
    }
  });

  // Backup settings mutation
  const updateBackupSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest('/api/cloud-sync/backup-settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync/backup-settings'] });
      toast({
        title: "Settings Updated",
        description: "Backup settings have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update backup settings",
        variant: "destructive"
      });
    }
  });

  // Individual sync functions for specific data types
  const syncIncident = async (incident: any) => {
    try {
      await apiRequest('/api/cloud-sync/sync', {
        method: 'POST',
        body: JSON.stringify({
          dataType: 'incidents',
          entityId: incident.id,
          data: incident,
          version: incident.lastModified || Date.now(),
          priority: incident.isEmergency ? 5 : 3
        })
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync'] });
    } catch (error) {
      console.error('Failed to sync incident:', error);
    }
  };

  const syncEmergencyContact = async (contact: any) => {
    try {
      await apiRequest('/api/cloud-sync/sync', {
        method: 'POST',
        body: JSON.stringify({
          dataType: 'emergencyContacts',
          entityId: contact.id,
          data: contact,
          version: contact.lastModified || Date.now(),
          priority: 4
        })
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync'] });
    } catch (error) {
      console.error('Failed to sync emergency contact:', error);
    }
  };

  const syncUserPreferences = async (preferences: any) => {
    try {
      await apiRequest('/api/cloud-sync/sync', {
        method: 'POST',
        body: JSON.stringify({
          dataType: 'userPreferences',
          entityId: 'preferences',
          data: preferences,
          version: Date.now(),
          priority: 2
        })
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync'] });
    } catch (error) {
      console.error('Failed to sync user preferences:', error);
    }
  };

  // Auto-sync on data changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'incidents' || e.key === 'emergencyContacts' || e.key === 'userPreferences') {
        // Trigger sync after a short delay to batch changes
        setTimeout(() => {
          syncNowMutation.mutate();
        }, 2000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Periodic auto-sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (devicesData?.devices?.length > 0) {
        syncNowMutation.mutate();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [devicesData?.devices]);

  const isLoading = devicesLoading || storageLoading || conflictsLoading || backupLoading;

  return {
    devices: devicesData?.devices || [],
    storageUsage: storageData?.usage || null,
    conflicts: conflictsData?.conflicts || [],
    backupSettings: backupData?.settings || null,
    isLoading,
    registerDevice: registerDeviceMutation.mutateAsync,
    syncNow: syncNowMutation.mutateAsync,
    resolveConflict: async (conflictId: string, resolution: string, mergedData?: any) => {
      await resolveConflictMutation.mutateAsync({ conflictId, resolution, mergedData });
    },
    updateBackupSettings: updateBackupSettingsMutation.mutateAsync,
    syncIncident,
    syncEmergencyContact,
    syncUserPreferences
  };
}