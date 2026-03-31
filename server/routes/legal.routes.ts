import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { FastLegalDatabase } from "../fastLegalDatabase";
import { AILegalAssistant } from "../aiService";

/**
 * Legal Routes Module
 * 
 * Handles all legal-related endpoints including:
 * - Legal rights database and queries  
 * - State-specific legal information
 * - Legal document generation and templates
 * - AI legal assistance
 */
export function registerLegalRoutes(app: Express) {
  console.log('[ROUTES] Registering legal routes...');

  // Legal rights endpoint
  app.get('/api/legal-rights', async (req: any, res) => {
    try {
      const { state } = req.query;
      
      if (!state) {
        return res.status(400).json({ message: 'State parameter is required' });
      }

      const legalDb = new FastLegalDatabase();
      const rights = legalDb.getLegalRights(state);
      
      if (!rights) {
        return res.status(404).json({ message: `Legal rights not found for state: ${state}` });
      }

      res.json(rights);
    } catch (error) {
      console.error('Error fetching legal rights:', error);
      res.status(500).json({ message: 'Failed to fetch legal rights' });
    }
  });

  // Legal document template endpoints  
  app.get('/api/legal-document-templates', async (req, res) => {
    try {
      const { category, state } = req.query;
      const templates = await storage.getLegalDocumentTemplates(
        category as string, 
        state as string
      );
      res.json(templates);
    } catch (error) {
      console.error("Error fetching legal document templates:", error);
      res.status(500).json({ message: "Failed to fetch legal document templates" });
    }
  });

  // Get legal document template by ID
  app.get('/api/legal-document-templates/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getLegalDocumentTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching legal document template:", error);
      res.status(500).json({ message: "Failed to fetch legal document template" });
    }
  });

  // Create legal document template
  app.post('/api/legal-document-templates', isAuthenticated, async (req: any, res) => {
    try {
      const templateData = insertLegalDocumentTemplateSchema.parse(req.body);
      const template = await storage.createLegalDocumentTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Error creating legal document template:", error);
      res.status(500).json({ message: "Failed to create legal document template" });
    }
  });

  console.log('[ROUTES] Legal routes registered successfully');
}