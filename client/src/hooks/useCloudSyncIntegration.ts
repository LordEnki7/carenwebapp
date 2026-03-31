import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface SyncData {
  dataType: string;
  entityId: string;
  data: any;
  priority?: number;
}

export function useCloudSyncIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if cloud sync is available
  const { data: devices, isLoading } = useQuery({
    queryKey: ['/api/cloud-sync/devices'],
    retry: false
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (payload: SyncData) => {
      const response = await fetch('/api/cloud-sync/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType: payload.dataType,
          entityId: payload.entityId,
          data: payload.data,
          version: Date.now(),
          priority: payload.priority || 3
        })
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync'] });
    },
    onError: (error: any) => {
      console.error('Cloud sync error:', error);
    }
  });

  // Function to sync incidents
  const syncIncident = async (incident: any) => {
    if (!devices?.success || !incident?.id) return;
    
    try {
      await syncMutation.mutateAsync({
        dataType: 'incidents',
        entityId: incident.id,
        data: { ...incident, lastModified: Date.now() },
        priority: incident.isEmergency ? 5 : 3
      });
    } catch (error) {
      console.error('Failed to sync incident:', error);
    }
  };

  // Function to sync emergency contacts
  const syncEmergencyContact = async (contact: any) => {
    if (!devices?.success || !contact?.id) return;
    
    try {
      await syncMutation.mutateAsync({
        dataType: 'emergencyContacts',
        entityId: contact.id,
        data: { ...contact, lastModified: Date.now() },
        priority: 4
      });
    } catch (error) {
      console.error('Failed to sync emergency contact:', error);
    }
  };

  // Function to sync user preferences
  const syncUserPreferences = async (preferences: any) => {
    if (!devices?.success) return;
    
    try {
      await syncMutation.mutateAsync({
        dataType: 'userPreferences',
        entityId: 'preferences',
        data: { ...preferences, lastModified: Date.now() },
        priority: 2
      });
    } catch (error) {
      console.error('Failed to sync user preferences:', error);
    }
  };

  // Auto-sync when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!devices?.success) return;

      const syncDelay = 3000; // 3 second delay to batch changes

      if (e.key === 'incidents' && e.newValue) {
        setTimeout(() => {
          try {
            const incidents = JSON.parse(e.newValue);
            incidents.forEach((incident: any) => {
              if (incident.lastModified > Date.now() - 10000) { // Only sync recently modified
                syncIncident(incident);
              }
            });
          } catch (error) {
            console.error('Failed to parse incidents for sync:', error);
          }
        }, syncDelay);
      }

      if (e.key === 'emergencyContacts' && e.newValue) {
        setTimeout(() => {
          try {
            const contacts = JSON.parse(e.newValue);
            contacts.forEach((contact: any) => {
              if (contact.lastModified > Date.now() - 10000) { // Only sync recently modified
                syncEmergencyContact(contact);
              }
            });
          } catch (error) {
            console.error('Failed to parse contacts for sync:', error);
          }
        }, syncDelay);
      }

      if (e.key === 'userPreferences' && e.newValue) {
        setTimeout(() => {
          try {
            const preferences = JSON.parse(e.newValue);
            syncUserPreferences(preferences);
          } catch (error) {
            console.error('Failed to parse preferences for sync:', error);
          }
        }, syncDelay);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [devices?.success]);

  // Periodic sync every 5 minutes
  useEffect(() => {
    if (!devices?.success) return;

    const syncInterval = setInterval(() => {
      // Sync all data periodically
      try {
        const incidents = JSON.parse(localStorage.getItem('incidents') || '[]');
        const contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
        const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');

        incidents.forEach((incident: any) => syncIncident(incident));
        contacts.forEach((contact: any) => syncEmergencyContact(contact));
        if (Object.keys(preferences).length > 0) {
          syncUserPreferences(preferences);
        }
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, 300000); // 5 minutes

    return () => clearInterval(syncInterval);
  }, [devices?.success]);

  return {
    isCloudSyncEnabled: devices?.success || false,
    isSyncing: syncMutation.isPending,
    syncIncident,
    syncEmergencyContact,
    syncUserPreferences,
    lastSyncError: syncMutation.error
  };
}