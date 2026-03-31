import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface SyncDataPayload {
  dataType: string;
  entityId: string;
  data: any;
  version: number;
  priority: number;
}

interface AutoSyncOptions {
  enabled: boolean;
  interval: number; // in milliseconds
  syncOnChange: boolean;
  syncOnFocus: boolean;
  syncOnNetworkReconnect: boolean;
}

export function useAutoSync(options: AutoSyncOptions = {
  enabled: true,
  interval: 30000, // 30 seconds
  syncOnChange: true,
  syncOnFocus: true,
  syncOnNetworkReconnect: true
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout>();
  const isOnlineRef = useRef(navigator.onLine);

  // Get user devices for sync
  const { data: devices } = useQuery({
    queryKey: ['/api/cloud-sync/devices'],
    enabled: options.enabled
  });

  // Auto sync mutation
  const autoSyncMutation = useMutation({
    mutationFn: async (payload: SyncDataPayload) => {
      const response = await fetch('/api/cloud-sync/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync'] });
    },
    onError: (error) => {
      console.error('Auto sync failed:', error);
    }
  });

  // Function to trigger sync for specific data
  const triggerSync = async (dataType: string, entityId: string, data: any, priority: number = 1) => {
    if (!options.enabled || !devices?.success) return;

    const payload: SyncDataPayload = {
      dataType,
      entityId,
      data,
      version: Date.now(), // Use timestamp as version
      priority
    };

    try {
      await autoSyncMutation.mutateAsync(payload);
    } catch (error) {
      console.error('Sync trigger failed:', error);
    }
  };

  // Function to sync all pending data
  const syncAllData = async () => {
    if (!options.enabled) return;

    try {
      // Get all local data that needs syncing
      const localData = [
        // Incidents
        ...(JSON.parse(localStorage.getItem('incidents') || '[]')).map((incident: any) => ({
          dataType: 'incidents',
          entityId: incident.id,
          data: incident,
          version: incident.lastModified || Date.now(),
          priority: incident.isEmergency ? 5 : 3
        })),
        // Emergency contacts
        ...(JSON.parse(localStorage.getItem('emergencyContacts') || '[]')).map((contact: any) => ({
          dataType: 'emergencyContacts',
          entityId: contact.id,
          data: contact,
          version: contact.lastModified || Date.now(),
          priority: 4
        })),
        // User preferences
        {
          dataType: 'userPreferences',
          entityId: 'preferences',
          data: JSON.parse(localStorage.getItem('userPreferences') || '{}'),
          version: Date.now(),
          priority: 2
        }
      ];

      // Sync each data item
      for (const item of localData) {
        await autoSyncMutation.mutateAsync(item);
      }

      toast({
        title: "Sync Complete",
        description: `Successfully synced ${localData.length} items to cloud`,
      });

    } catch (error) {
      console.error('Full sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync data to cloud. Will retry automatically.",
        variant: "destructive"
      });
    }
  };

  // Set up automatic sync interval
  useEffect(() => {
    if (!options.enabled || !options.interval) return;

    intervalRef.current = setInterval(() => {
      syncAllData();
    }, options.interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [options.enabled, options.interval]);

  // Sync on window focus
  useEffect(() => {
    if (!options.enabled || !options.syncOnFocus) return;

    const handleFocus = () => {
      syncAllData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [options.enabled, options.syncOnFocus]);

  // Sync on network reconnect
  useEffect(() => {
    if (!options.enabled || !options.syncOnNetworkReconnect) return;

    const handleOnline = () => {
      if (!isOnlineRef.current) {
        isOnlineRef.current = true;
        toast({
          title: "Back Online",
          description: "Syncing data to cloud...",
        });
        syncAllData();
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      toast({
        title: "Offline",
        description: "Data will sync when connection is restored.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [options.enabled, options.syncOnNetworkReconnect]);

  return {
    triggerSync,
    syncAllData,
    isAutoSyncing: autoSyncMutation.isPending,
    lastSyncError: autoSyncMutation.error,
    syncStatus: autoSyncMutation.status
  };
}