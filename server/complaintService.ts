import { db } from "./db";
import { 
  officerComplaints, 
  complaintEvidence, 
  complaintUpdates, 
  complaintTemplates, 
  complaintAgencies,
  type InsertOfficerComplaint,
  type OfficerComplaint,
  type InsertComplaintEvidence,
  type ComplaintEvidence,
  type InsertComplaintUpdate,
  type ComplaintUpdate,
  type ComplaintTemplate,
  type ComplaintAgency
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export class ComplaintService {
  // Create a new complaint
  static async createComplaint(userId: string, complaintData: InsertOfficerComplaint): Promise<OfficerComplaint> {
    // Generate a proper UUID for the complaint ID
    const complaintId = randomUUID();
    
    // Ensure dates are proper Date objects
    const processedData = {
      ...complaintData,
      incidentDate: new Date(complaintData.incidentDate),
      filedAt: complaintData.filedAt ? new Date(complaintData.filedAt) : undefined,
      resolvedAt: complaintData.resolvedAt ? new Date(complaintData.resolvedAt) : undefined,
    };
    
    const [complaint] = await db
      .insert(officerComplaints)
      .values({
        ...processedData,
        id: complaintId,
        userId,
      })
      .returning();
    
    return complaint;
  }

  // Get user's complaints
  static async getUserComplaints(userId: string): Promise<OfficerComplaint[]> {
    return await db
      .select()
      .from(officerComplaints)
      .where(eq(officerComplaints.userId, userId))
      .orderBy(desc(officerComplaints.createdAt));
  }

  // Get complaint by ID
  static async getComplaintById(complaintId: string, userId: string): Promise<OfficerComplaint | null> {
    const [complaint] = await db
      .select()
      .from(officerComplaints)
      .where(and(
        eq(officerComplaints.id, complaintId),
        eq(officerComplaints.userId, userId)
      ));
    
    return complaint || null;
  }

  // Update complaint status
  static async updateComplaintStatus(
    complaintId: string, 
    userId: string, 
    status: string,
    updateTitle: string,
    updateDescription: string
  ): Promise<OfficerComplaint> {
    // Update the complaint
    const [complaint] = await db
      .update(officerComplaints)
      .set({ 
        status,
        lastUpdated: new Date()
      })
      .where(and(
        eq(officerComplaints.id, complaintId),
        eq(officerComplaints.userId, userId)
      ))
      .returning();

    // Add status update record
    await this.addComplaintUpdate(complaintId, {
      updateType: 'status_change',
      title: updateTitle,
      description: updateDescription,
      updatedBy: 'user',
      isPublic: true
    });

    return complaint;
  }

  // Add complaint evidence
  static async addComplaintEvidence(complaintId: string, evidenceData: InsertComplaintEvidence): Promise<ComplaintEvidence> {
    const evidenceId = `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [evidence] = await db
      .insert(complaintEvidence)
      .values({
        ...evidenceData,
        id: evidenceId,
        complaintId,
      })
      .returning();

    // Update complaint to reflect evidence attachment
    await db
      .update(officerComplaints)
      .set({ 
        evidenceAttached: true,
        lastUpdated: new Date()
      })
      .where(eq(officerComplaints.id, complaintId));

    return evidence;
  }

  // Get complaint evidence
  static async getComplaintEvidence(complaintId: string): Promise<ComplaintEvidence[]> {
    return await db
      .select()
      .from(complaintEvidence)
      .where(eq(complaintEvidence.complaintId, complaintId))
      .orderBy(desc(complaintEvidence.createdAt));
  }

  // Add complaint update
  static async addComplaintUpdate(complaintId: string, updateData: Omit<InsertComplaintUpdate, 'complaintId'>): Promise<ComplaintUpdate> {
    const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [update] = await db
      .insert(complaintUpdates)
      .values({
        ...updateData,
        id: updateId,
        complaintId,
      })
      .returning();

    return update;
  }

  // Get complaint updates
  static async getComplaintUpdates(complaintId: string): Promise<ComplaintUpdate[]> {
    return await db
      .select()
      .from(complaintUpdates)
      .where(eq(complaintUpdates.complaintId, complaintId))
      .orderBy(desc(complaintUpdates.createdAt));
  }

  // Get available agencies for jurisdiction
  static async getAvailableAgencies(jurisdiction: string): Promise<ComplaintAgency[]> {
    return await db
      .select()
      .from(complaintAgencies)
      .where(and(
        eq(complaintAgencies.jurisdiction, jurisdiction),
        eq(complaintAgencies.isActive, true)
      ));
  }

  // Get complaint templates for agency
  static async getComplaintTemplates(jurisdiction: string, complaintType: string): Promise<ComplaintTemplate[]> {
    return await db
      .select()
      .from(complaintTemplates)
      .where(and(
        eq(complaintTemplates.jurisdiction, jurisdiction),
        eq(complaintTemplates.complaintType, complaintType),
        eq(complaintTemplates.isActive, true)
      ));
  }

  // File complaint (mark as filed)
  static async fileComplaint(
    complaintId: string, 
    userId: string, 
    filingDetails: {
      complaintNumber?: string;
      filedAt: Date;
      responseDeadline?: Date;
    }
  ): Promise<OfficerComplaint> {
    const [complaint] = await db
      .update(officerComplaints)
      .set({
        status: 'filed',
        currentStep: 'filing',
        complaintNumber: filingDetails.complaintNumber,
        filedAt: filingDetails.filedAt,
        responseDeadline: filingDetails.responseDeadline,
        lastUpdated: new Date()
      })
      .where(and(
        eq(officerComplaints.id, complaintId),
        eq(officerComplaints.userId, userId)
      ))
      .returning();

    // Add filing update
    await this.addComplaintUpdate(complaintId, {
      updateType: 'status_change',
      title: 'Complaint Filed Successfully',
      description: `Your complaint has been officially filed${filingDetails.complaintNumber ? ` with reference number: ${filingDetails.complaintNumber}` : ''}.`,
      updatedBy: 'system',
      isPublic: true
    });

    return complaint;
  }

  // Generate complaint summary for attorney
  static async generateComplaintSummary(complaintId: string): Promise<{
    complaint: OfficerComplaint;
    evidence: ComplaintEvidence[];
    updates: ComplaintUpdate[];
  }> {
    const complaint = await db
      .select()
      .from(officerComplaints)
      .where(eq(officerComplaints.id, complaintId));

    const evidence = await this.getComplaintEvidence(complaintId);
    const updates = await this.getComplaintUpdates(complaintId);

    return {
      complaint: complaint[0],
      evidence,
      updates
    };
  }

  // Get complaint statistics for user
  static async getUserComplaintStats(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    recent: OfficerComplaint[];
  }> {
    const complaints = await this.getUserComplaints(userId);
    
    const byStatus = complaints.reduce((acc, complaint) => {
      acc[complaint.status] = (acc[complaint.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = complaints.reduce((acc, complaint) => {
      acc[complaint.complaintType] = (acc[complaint.complaintType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: complaints.length,
      byStatus,
      byType,
      recent: complaints.slice(0, 5)
    };
  }
}