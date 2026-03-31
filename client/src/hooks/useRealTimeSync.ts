import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { initializeWebSocketClient, getWebSocketClient, disconnectWebSocket } from "@/lib/websocketClient";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export function useRealTimeSync() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsClient = useRef(getWebSocketClient());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectWebSocket();
      wsClient.current = null;
      return;
    }

    // Initialize WebSocket connection
    if (!wsClient.current || !wsClient.current.isConnected()) {
      const userId = (user as any)?.id || 'demo-user';
      wsClient.current = initializeWebSocketClient(userId);

      // Set up event handlers for real-time data synchronization
      wsClient.current.on('connected', () => {
        console.log('Real-time sync connected');
        // Request initial data sync
        wsClient.current?.requestSync();
      });

      wsClient.current.on('disconnected', () => {
        console.log('Real-time sync disconnected');
      });

      wsClient.current.on('error', (event, data) => {
        console.error('Real-time sync error:', data);
        toast({
          title: "Sync Error",
          description: "Real-time synchronization encountered an issue",
          variant: "destructive",
        });
      });

      // Handle data sync events
      wsClient.current.on('data_sync', (event, syncData) => {
        console.log('Received full data sync:', syncData);
        
        // Update all cached data with fresh sync data
        if (syncData.incidents) {
          queryClient.setQueryData(['/api/incidents'], syncData.incidents);
        }
        if (syncData.emergencyContacts) {
          queryClient.setQueryData(['/api/emergency-contacts'], syncData.emergencyContacts);
        }
        if (syncData.emergencyAlerts) {
          queryClient.setQueryData(['/api/emergency-alerts'], syncData.emergencyAlerts);
        }
        if (syncData.generatedDocuments) {
          queryClient.setQueryData(['/api/generated-legal-documents'], syncData.generatedDocuments);
        }

        toast({
          title: "Data Synchronized",
          description: "Your data has been synchronized across devices",
        });
      });

      // Handle real-time data updates
      wsClient.current.on('incident_created', (event, incident) => {
        console.log('New incident received:', incident);
        queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        
        toast({
          title: "New Incident",
          description: `Incident "${incident.title}" was created`,
        });
      });

      wsClient.current.on('incident_updated', (event, incident) => {
        console.log('Incident updated:', incident);
        queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/incidents', incident.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      });

      wsClient.current.on('incident_deleted', (event, data) => {
        console.log('Incident deleted:', data);
        queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        
        toast({
          title: "Incident Deleted",
          description: "An incident was deleted",
        });
      });

      wsClient.current.on('emergency_contact_created', (event, contact) => {
        console.log('New emergency contact received:', contact);
        queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        
        toast({
          title: "Emergency Contact Added",
          description: `Contact "${contact.name}" was added`,
        });
      });

      wsClient.current.on('emergency_contact_updated', (event, contact) => {
        console.log('Emergency contact updated:', contact);
        queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
      });

      wsClient.current.on('emergency_contact_deleted', (event, data) => {
        console.log('Emergency contact deleted:', data);
        queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        
        toast({
          title: "Emergency Contact Removed",
          description: "An emergency contact was removed",
        });
      });

      wsClient.current.on('emergency_alert_created', (event, alert) => {
        console.log('New emergency alert received:', alert);
        queryClient.invalidateQueries({ queryKey: ['/api/emergency-alerts'] });
        
        toast({
          title: "Emergency Alert",
          description: `Emergency alert: ${alert.alertType}`,
          variant: "destructive",
        });
      });

      wsClient.current.on('document_generated', (event, document) => {
        console.log('New document generated:', document);
        queryClient.invalidateQueries({ queryKey: ['/api/generated-legal-documents'] });
        
        toast({
          title: "Document Generated",
          description: `Document "${document.title}" was generated`,
        });
      });

      wsClient.current.on('max_reconnect_attempts', () => {
        toast({
          title: "Sync Unavailable",
          description: "Real-time synchronization is temporarily unavailable. Please refresh the page.",
          variant: "destructive",
        });
      });
    }

    return () => {
      // Cleanup function will be called when component unmounts or user changes
      if (wsClient.current) {
        disconnectWebSocket();
        wsClient.current = null;
      }
    };
  }, [isAuthenticated, user, queryClient, toast]);

  const requestSync = () => {
    if (wsClient.current && wsClient.current.isConnected()) {
      wsClient.current.requestSync();
    }
  };

  const getConnectionStatus = () => {
    return wsClient.current ? wsClient.current.getConnectionState() : 'disconnected';
  };

  const isConnected = () => {
    return wsClient.current ? wsClient.current.isConnected() : false;
  };

  return {
    requestSync,
    getConnectionStatus,
    isConnected,
    wsClient: wsClient.current
  };
}