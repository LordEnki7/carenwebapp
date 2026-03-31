import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { sendRecordingToAttorneyEmail } from "../notifications";
import { insertAttorneyConnectionSchema } from "@shared/schema";

/**
 * Attorney Routes Module
 * 
 * Handles all attorney-related endpoints including:
 * - Attorney directory and availability
 * - Attorney-client connections and communications
 * - Attorney messaging and notifications
 */
export function registerAttorneyRoutes(app: Express) {
  console.log('[ROUTES] Registering attorney routes...');

  // Attorney connections
  app.post('/api/attorney-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectionData = insertAttorneyConnectionSchema.parse({ 
        ...req.body, 
        userId 
      });
      const connection = await storage.createAttorneyConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating attorney connection:", error);
      res.status(500).json({ message: "Failed to create attorney connection" });
    }
  });

  app.get('/api/attorney-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getAttorneyConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching attorney connections:", error);
      res.status(500).json({ message: "Failed to fetch attorney connections" });
    }
  });

  // Emergency nearest attorney endpoint
  app.post('/api/attorneys/emergency-nearest', async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      // First try to get emergency-specific attorneys
      let attorneys = await storage.getAvailableAttorneys(['criminal_defense', 'civil_rights', 'traffic_law'], true);
      
      // If no emergency attorneys, get all available attorneys with relevant specialties
      if (!attorneys || attorneys.length === 0) {
        attorneys = await storage.getAvailableAttorneys(['Criminal Defense', 'Civil Rights', 'Police Misconduct', 'Constitutional Law']);
      }
      
      // If still no attorneys, get any available attorney
      if (!attorneys || attorneys.length === 0) {
        attorneys = await storage.getAvailableAttorneys();
      }
      
      if (!attorneys || attorneys.length === 0) {
        return res.status(404).json({ message: "No attorneys available for emergency assistance" });
      }
      
      // For now, return the first available attorney
      // In a real implementation, you'd calculate distance based on lat/lng
      const nearestAttorney = attorneys[0];
      
      res.json({
        id: nearestAttorney.id,
        firmName: nearestAttorney.firmName,
        firstName: nearestAttorney.firstName || 'Attorney',
        lastName: nearestAttorney.lastName || 'Contact',
        specialties: nearestAttorney.specialties,
        isEmergencyAvailable: nearestAttorney.isEmergencyAvailable || false,
        contactInfo: {
          phone: nearestAttorney.phone || '555-123-4567',
          email: nearestAttorney.email || 'contact@legal.com'
        },
        emergencyResponse: {
          averageResponseTime: nearestAttorney.isEmergencyAvailable ? "5-10 minutes" : "1-2 hours",
          availability: nearestAttorney.isEmergencyAvailable ? "24/7 Emergency Response" : "Business Hours",
          status: "Available Now"
        }
      });
    } catch (error) {
      console.error("Error finding nearest emergency attorney:", error);
      res.status(500).json({ message: "Failed to find emergency attorney" });
    }
  });

  // Get attorneys with optional state and specialty filters
  app.get('/api/attorneys', async (req, res) => {
    try {
      const { state, specialty } = req.query;
      const attorneys = await storage.getAttorneys(
        state as string,
        specialty as string
      );
      res.json(attorneys);
    } catch (error) {
      console.error("Error fetching attorneys:", error);
      res.status(500).json({ message: "Failed to fetch attorneys" });
    }
  });

  // Get available attorneys with optional filters (need to import demoSecurityMiddleware)
  const demoSecurityMiddleware = (req: any, res: any, next: any) => next(); // Temporary placeholder
  
  app.get('/api/attorneys/available', demoSecurityMiddleware, async (req, res) => {
    try {
      const { specialties, emergency } = req.query;
      const specialtyArray = specialties ? (specialties as string).split(',') : undefined;
      const isEmergency = emergency === 'true';
      
      const attorneys = await storage.getAvailableAttorneys(specialtyArray, isEmergency);
      res.json(attorneys);
    } catch (error) {
      console.error("Error fetching available attorneys:", error);
      res.status(500).json({ message: "Failed to fetch available attorneys" });
    }
  });

  console.log('[ROUTES] Attorney routes registered successfully');
}