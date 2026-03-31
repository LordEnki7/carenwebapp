import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { notifyEmergencyContacts, sendEmergencyEmail } from "../notifications";
import { n8nWebhookService } from "../n8nWebhookService";
import { sendPushNotification } from "./push.routes";
import { insertIncidentSchema } from "@shared/schema";
import { z } from "zod";
import { notifySOS } from "../lib/slack";

/**
 * Emergency Routes Module
 * 
 * Handles all emergency-related endpoints including:
 * - Emergency contact management
 * - Incident recording and reporting
 * - Emergency notifications
 * - n8n webhook automation
 */
export function registerEmergencyRoutes(app: Express) {
  console.log('[ROUTES] Registering emergency routes...');

  // Emergency contact routes
  app.post('/api/emergency-contacts', async (req: any, res) => {
    try {
      const userId = "demo-user";
      const contactData = { ...req.body, userId };
      const contact = await storage.createEmergencyContact(contactData);
      
      // Broadcast contact creation to connected clients
      const wsManager = (global as any).wsManager;
      if (wsManager) {
        wsManager.broadcastToUser(userId, 'emergency_contact_created', contact);
      }
      
      res.json(contact);
    } catch (error) {
      console.error("Error creating emergency contact:", error);
      res.status(500).json({ message: "Failed to create emergency contact" });
    }
  });

  app.get('/api/emergency-contacts', async (req: any, res) => {
    try {
      const userId = "demo-user";
      const contacts = await storage.getEmergencyContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({ message: "Failed to fetch emergency contacts" });
    }
  });

  app.patch('/api/emergency-contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const contact = await storage.updateEmergencyContact(id, updates);
      res.json(contact);
    } catch (error) {
      console.error("Error updating emergency contact:", error);
      res.status(500).json({ message: "Failed to update emergency contact" });
    }
  });

  // Emergency alert endpoint with n8n automation
  app.post('/api/emergency/alert', async (req: any, res) => {
    try {
      const { type, message, location, timestamp, urgency } = req.body;
      console.log('🚨 Emergency alert triggered:', { type, urgency, location });
      const userName = req.session?.userId ? "C.A.R.E.N. User" : "Anonymous";
      const locationStr = location?.address || location?.city || "Unknown location";
      notifySOS(userName, locationStr, type || "Emergency", urgency || "high").catch(() => {});
      
      // Get user ID from session or default to demo user
      const userId = req.session?.userId || "demo-user";
      const user = await storage.getUser(userId);
      
      // 🚀 TRIGGER N8N EMERGENCY RESPONSE AUTOMATION
      const emergencyWebhookPayload = {
        userId,
        emergencyType: type === 'traffic_stop' ? 'traffic_stop' : 'general_emergency',
        coordinates: {
          lat: location?.latitude || 0,
          lng: location?.longitude || 0
        },
        location: location ? {
          address: location.address,
          city: location.city,
          state: location.state
        } : undefined,
        timestamp: timestamp || new Date().toISOString(),
        userEmail: user?.email,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : undefined,
        urgency: urgency === 'critical' ? 'critical' : urgency === 'high' ? 'high' : 'medium',
        metadata: {
          recordingActive: false,
          attorneyRequested: false,
          situationContext: message
        }
      };
      
      // Trigger n8n workflow (non-blocking - emergency response continues even if webhook fails)
      try {
        await n8nWebhookService.triggerEmergencyResponse(emergencyWebhookPayload);
      } catch (error: any) {
        console.error('[N8N] Emergency webhook failed, continuing with manual emergency response:', error);
      }
      
      // Get emergency contacts
      const contacts = await storage.getEmergencyContacts(userId);
      
      if (contacts.length === 0) {
        console.log('⚠️ No emergency contacts found for user:', userId);
        return res.json({ 
          success: true,
          contactsNotified: 0,
          message: 'Emergency mode activated but no contacts configured'
        });
      }

      const alertData = {
        type,
        message: `EMERGENCY: ${message}`,
        location: location || 'Location unavailable',
        timestamp: timestamp || new Date().toISOString(),
        urgency: urgency || 'high'
      };

      // Send notifications to all emergency contacts
      const notificationResults = [];
      
      for (const contact of contacts) {
        try {
          if (contact.email) {
            await sendEmergencyEmail({
              to: contact.email,
              subject: `🚨 EMERGENCY ALERT - ${contact.name}`,
              message: `${alertData.message}\n\nLocation: ${alertData.location}\nTime: ${alertData.timestamp}\n\nThis is an automated emergency notification from C.A.R.E.N.™`,
              priority: alertData.urgency
            });
            notificationResults.push({ 
              contact: contact.name, 
              method: 'email', 
              status: 'sent',
              destination: contact.email 
            });
          }

          // Note: SMS functionality would be added here with proper TextBelt integration
          console.log(`📧 Emergency notification sent to ${contact.name} (${contact.email})`);
          
        } catch (notificationError: any) {
          console.error(`Failed to notify ${contact.name}:`, notificationError);
          notificationResults.push({ 
            contact: contact.name, 
            method: 'email', 
            status: 'failed',
            error: notificationError.message 
          });
        }
      }

      // Create incident record for emergency
      try {
        const incident = {
          userId,
          title: `Emergency Recording - ${type}`,
          description: alertData.message,
          location: alertData.location,
          status: 'active',
          priority: 'high',
          timestamp: new Date(alertData.timestamp),
          mediaUrls: []
        };
        
        await storage.createIncident(incident);
        console.log('✅ Emergency incident record created');
      } catch (incidentError) {
        console.error('Failed to create emergency incident record:', incidentError);
      }

      const successCount = notificationResults.filter(r => r.status === 'sent').length;

      // Send browser push notification to the SOS user's own devices
      if (userId) {
        const locationStr = alertData.location && alertData.location !== 'Location not available'
          ? ` at ${alertData.location}` : '';
        sendPushNotification(userId, `🚨 SOS ACTIVE — ${type}`, `Emergency alert sent to ${successCount} contact(s)${locationStr}. Stay calm.`, '/dashboard').catch(() => {});
      }
      
      res.json({
        success: true,
        contactsNotified: successCount,
        totalContacts: contacts.length,
        results: notificationResults,
        emergencyId: `emergency_${Date.now()}`,
        timestamp: alertData.timestamp
      });

    } catch (error: any) {
      console.error('Emergency alert error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send emergency alerts',
        error: error.message 
      });
    }
  });

  // Get emergency alerts for authenticated user
  app.get('/api/emergency-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getEmergencyAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching emergency alerts:", error);
      res.status(500).json({ message: "Failed to fetch emergency alerts" });
    }
  });

  console.log('[ROUTES] Emergency routes registered successfully');
}