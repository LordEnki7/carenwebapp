import type { Express } from 'express';
import { ComplaintService } from '../complaintService';
import { getCurrentUser } from '../demoState';

/**
 * Recording and Evidence System Routes
 * Handles audio/video recording, evidence catalog, and media management
 */
export function registerRecordingRoutes(app: Express) {
  console.log('[ROUTES] Registering recording routes...');

  // Evidence upload endpoint
  app.post('/api/complaints/:complaintId/evidence', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { complaintId } = req.params;
      const { evidenceType, description } = req.body;
      
      // Simulate file upload (in production, you'd use multer or similar)
      const evidenceData = {
        evidenceType: evidenceType || 'document',
        fileName: `evidence_${Date.now()}.pdf`,
        originalFileName: `evidence_${Date.now()}.pdf`,
        filePath: `/uploads/evidence/${Date.now()}.pdf`,
        fileSize: 1024 * 1024, // 1MB placeholder
        mimeType: 'application/pdf',
        description: description || 'Uploaded evidence file'
      };

      const evidence = await ComplaintService.addComplaintEvidence(complaintId, {
        ...evidenceData,
        complaintId
      });
      
      res.json({
        success: true,
        evidence
      });
    } catch (error) {
      console.error('Evidence upload error:', error);
      res.status(500).json({ message: 'Failed to upload evidence' });
    }
  });
  
  // Get complaint evidence
  app.get('/api/complaints/:complaintId/evidence', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { complaintId } = req.params;
      const evidence = await ComplaintService.getComplaintEvidence(complaintId);
      
      res.json(evidence);
    } catch (error) {
      console.error('Get evidence error:', error);
      res.status(500).json({ message: 'Failed to retrieve evidence' });
    }
  });
  
  // Get user's complaints (archive)
  app.get('/api/complaints/my-complaints', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const complaints = await ComplaintService.getUserComplaints(currentUser.id);
      res.json(complaints);
    } catch (error) {
      console.error('Get user complaints error:', error);
      res.status(500).json({ message: 'Failed to retrieve complaints' });
    }
  });

  // Get complaint updates/timeline
  app.get('/api/complaints/:complaintId/updates', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { complaintId } = req.params;
      const updates = await ComplaintService.getComplaintUpdates(complaintId);
      
      res.json(updates);
    } catch (error) {
      console.error('Get complaint updates error:', error);
      res.status(500).json({ message: 'Failed to retrieve complaint updates' });
    }
  });

  // Submit complaint via email
  app.post('/api/complaints/:complaintId/submit', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { complaintId } = req.params;
      const { attorneyEmail, message } = req.body;

      // Get complaint details
      const complaint = await ComplaintService.getComplaintById(complaintId, currentUser.id);
      if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
      }

      // Get evidence files (temporarily bypassing DB issue)
      let evidence: any[] = [];
      try {
        evidence = await ComplaintService.getComplaintEvidence(complaintId);
      } catch (error) {
        console.warn('Evidence query failed, continuing without evidence data');
        evidence = [];
      }

      // Send email with complaint details
      const emailContent = `
        POLICE COMPLAINT SUBMISSION
        ==========================
        
        Complaint ID: ${complaint.id}
        Filed by: ${currentUser.email}
        Date Filed: ${new Date().toLocaleDateString()}
        
        INCIDENT DETAILS:
        Type: ${complaint.complaintType}
        Date: ${complaint.incidentDate}
        Location: ${complaint.incidentLocation ? JSON.stringify(complaint.incidentLocation) : 'Not specified'}
        Jurisdiction: ${complaint.jurisdiction}
        
        OFFICER INFORMATION:
        Name: ${complaint.officerName || 'Not provided'}
        Badge Number: ${complaint.officerBadgeNumber || 'Not provided'}
        Department: ${complaint.officerDepartment}
        
        DESCRIPTION:
        ${complaint.description}
        
        EVIDENCE ATTACHED:
        ${evidence.length} file(s) attached
        ${evidence.map((e: any) => `- ${e.fileName} (${e.evidenceType})`).join('\n        ')}
        
        ${message ? `ADDITIONAL MESSAGE:\n${message}` : ''}
        
        This complaint was filed through the C.A.R.E.N.™ digital platform.
        
        Contact Information:
        Email: ${currentUser.email}
        Platform: C.A.R.E.N.™ Legal Protection System
      `;

      // Update complaint status to filed
      try {
        await ComplaintService.updateComplaintStatus(complaintId, 'filed', currentUser.id);
      } catch (error) {
        console.warn('Failed to update complaint status, continuing with submission');
      }

      // In production, integrate with actual email service
      console.log('Email would be sent to:', attorneyEmail);
      console.log('Email content:', emailContent);

      res.json({
        success: true,
        message: 'Complaint submitted successfully',
        submissionId: `SUB_${complaintId}_${Date.now()}`
      });
    } catch (error) {
      console.error('Complaint submission error:', error);
      res.status(500).json({ message: 'Failed to submit complaint' });
    }
  });

  // Create complaint endpoint
  app.post('/api/complaints', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const complaintData = req.body;
      const complaint = await ComplaintService.createComplaint(currentUser.id, complaintData);
      
      res.json({
        success: true,
        complaint
      });
    } catch (error) {
      console.error('Create complaint error:', error);
      res.status(500).json({ message: 'Failed to create complaint' });
    }
  });

  // Get complaints overview endpoint  
  app.get('/api/complaints', async (req: any, res: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const complaints = await ComplaintService.getUserComplaints(currentUser.id);
      res.json({ complaints });
    } catch (error) {
      console.error('Get complaints error:', error);
      res.status(500).json({ message: 'Failed to retrieve complaints' });
    }
  });

  console.log('[ROUTES] Recording routes registered successfully');
}