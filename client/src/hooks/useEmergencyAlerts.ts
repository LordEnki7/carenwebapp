import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { apiRequest } from "@/lib/queryClient";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: 'primary' | 'secondary';
}

interface EmergencyAlert {
  type: 'police_encounter' | 'traffic_stop' | 'arrest' | 'civil_rights' | 'workplace' | 'property' | 'medical' | 'general';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
  };
  timestamp: Date;
  userMessage?: string;
  incidentId?: string;
}

export function useEmergencyAlerts() {
  const [isSending, setIsSending] = useState(false);
  const [lastAlertSent, setLastAlertSent] = useState<Date | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const { toast } = useToast();
  const { location, isLoading: locationLoading, error: locationError } = useGeolocation();

  // Check if push is already enabled on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      setIsPushEnabled(true);
    }
  }, []);

  const enablePushNotifications = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({ title: "Not Supported", description: "Browser push notifications not supported on this device.", variant: "destructive" });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({ title: "Permission Denied", description: "Allow notifications in browser settings to enable push alerts.", variant: "destructive" });
        return false;
      }

      // Get VAPID public key from server
      const keyRes = await apiRequest("GET", "/api/push/vapid-public-key");
      const keyData = await keyRes.json();
      if (!keyData.publicKey) {
        toast({ title: "Push Not Configured", description: "Push notifications are not yet configured on this server.", variant: "destructive" });
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
      };

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      const sub = subscription.toJSON();
      await apiRequest("POST", "/api/push/subscribe", {
        endpoint: sub.endpoint,
        keys: sub.keys,
      });

      setIsPushEnabled(true);
      toast({ title: "Push Alerts Enabled!", description: "You'll get browser notifications when SOS is triggered." });
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      toast({ title: "Push Setup Failed", description: "Could not enable push notifications. Please try again.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const sendEmergencyAlert = useCallback(async (alertType: EmergencyAlert['type'], customMessage?: string) => {
    if (isSending) return;
    
    setIsSending(true);
    
    try {
      // Get current location
      if (!location && !locationLoading) {
        throw new Error("Location not available for emergency alert");
      }

      const alertData: EmergencyAlert = {
        type: alertType,
        location: {
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          address: location?.address,
          city: location?.city,
          state: location?.state || location?.stateCode,
        },
        timestamp: new Date(),
        userMessage: customMessage,
      };

      // Send alert to server
      await apiRequest('/api/emergency-alerts', 'POST', alertData);

      setLastAlertSent(new Date());
      
      toast({
        title: "Emergency Alert Sent",
        description: "Your emergency contacts have been notified with your location",
        variant: "destructive"
      });

      return true;
    } catch (error) {
      console.error('Emergency alert failed:', error);
      toast({
        title: "Alert Failed",
        description: "Could not send emergency alert. Please try again or call directly.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSending(false);
    }
  }, [location, locationLoading, isSending, toast]);

  const sendLocationUpdate = useCallback(async () => {
    if (!location) return false;

    try {
      await apiRequest('/api/emergency-alerts/location-update', 'POST', {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        city: location.city,
        state: location.state,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Location update failed:', error);
      return false;
    }
  }, [location]);

  const getAlertMessage = (alertType: EmergencyAlert['type'], location: EmergencyAlert['location']) => {
    const locationText = location.address 
      ? `${location.address}, ${location.city}, ${location.state}`
      : `${location.latitude}, ${location.longitude}`;

    const messages = {
      police_encounter: `🚨 EMERGENCY ALERT: I'm having a police encounter at ${locationText}. This is an automated alert from C.A.R.E.N.™ Please monitor my safety.`,
      traffic_stop: `🚨 EMERGENCY ALERT: I've been pulled over in a traffic stop at ${locationText}. This is an automated alert from C.A.R.E.N.™ Please monitor my situation.`,
      arrest: `🚨 URGENT ALERT: I may be under arrest at ${locationText}. This is an automated emergency alert from C.A.R.E.N.™ Please contact an attorney immediately.`,
      civil_rights: `🚨 EMERGENCY ALERT: I'm experiencing a civil rights incident at ${locationText}. This is an automated alert from C.A.R.E.N.™ Please monitor my safety.`,
      workplace: `🚨 ALERT: I'm dealing with a workplace emergency at ${locationText}. This is an automated alert from C.A.R.E.N.™ Please monitor my situation.`,
      property: `🚨 ALERT: I'm experiencing a property-related emergency at ${locationText}. This is an automated alert from C.A.R.E.N.™ Please monitor my safety.`,
      medical: `🚨 MEDICAL ALERT: I'm experiencing a medical emergency at ${locationText}. This is an automated alert from C.A.R.E.N.™ Please check on my welfare.`,
      general: `🚨 EMERGENCY ALERT: I need help at ${locationText}. This is an automated alert from C.A.R.E.N.™ Please monitor my safety.`
    };

    return messages[alertType];
  };

  const canSendAlert = useCallback(() => {
    // Prevent spam alerts - allow one every 2 minutes
    if (lastAlertSent) {
      const timeSinceLastAlert = Date.now() - lastAlertSent.getTime();
      return timeSinceLastAlert > 120000; // 2 minutes
    }
    return true;
  }, [lastAlertSent]);

  return {
    sendEmergencyAlert,
    sendLocationUpdate,
    enablePushNotifications,
    isPushEnabled,
    isSending,
    lastAlertSent,
    canSendAlert: canSendAlert(),
    getAlertMessage,
    hasLocation: !!location && !locationError,
    locationError
  };
}