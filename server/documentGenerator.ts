import { type Incident, type LegalDocumentTemplate, type GeneratedLegalDocument } from "@shared/schema";

interface DocumentData {
  incident?: Incident;
  userName?: string;
  userEmail?: string;
  date?: string;
  location?: string;
  customFields?: Record<string, any>;
}

export class DocumentGenerator {
  // Replace template placeholders with actual data
  static generateDocument(template: LegalDocumentTemplate, data: DocumentData): string {
    let content = template.template;
    
    // Standard replacements
    const replacements: Record<string, string> = {
      '{{date}}': data.date || new Date().toLocaleDateString(),
      '{{currentDate}}': new Date().toLocaleDateString(),
      '{{currentTime}}': new Date().toLocaleTimeString(),
      '{{userName}}': data.userName || '[USER NAME]',
      '{{userEmail}}': data.userEmail || '[USER EMAIL]',
      '{{incidentDate}}': data.incident?.createdAt ? new Date(data.incident.createdAt).toLocaleDateString() : '[INCIDENT DATE]',
      '{{incidentTime}}': data.incident?.createdAt ? new Date(data.incident.createdAt).toLocaleTimeString() : '[INCIDENT TIME]',
      '{{incidentTitle}}': data.incident?.title || '[INCIDENT TITLE]',
      '{{incidentDescription}}': data.incident?.description || '[INCIDENT DESCRIPTION]',
      '{{incidentLocation}}': this.formatLocation(data.incident?.location) || data.location || '[INCIDENT LOCATION]',
      '{{incidentPriority}}': data.incident?.priority || '[PRIORITY]',
      '{{incidentStatus}}': data.incident?.status || '[STATUS]',
      '{{incidentId}}': data.incident?.id?.toString() || '[INCIDENT ID]',
      '{{incidentType}}': data.incident?.title || data.customFields?.incidentType || '[INCIDENT TYPE]',
      
      // Emergency and contact fields
      '{{emergencyContactName}}': data.customFields?.emergencyContactName || '[EMERGENCY CONTACT]',
      '{{emergencyNumber}}': data.customFields?.emergencyNumber || '911',
      '{{currentStatus}}': data.customFields?.currentStatus || 'Reported',
      '{{currentLocation}}': data.customFields?.currentLocation || this.formatLocation(data.incident?.location) || '[CURRENT LOCATION]',
      '{{assistanceRequired}}': data.customFields?.assistanceRequired || 'To be determined',
      '{{emergencyServices}}': data.customFields?.emergencyServices || 'Contacted as needed',
      
      // Situation and rights fields
      '{{situationType}}': data.customFields?.situationType || data.incident?.title || 'Police Encounter',
      '{{stateSpecificRights}}': data.customFields?.stateSpecificRights || 'Consult local attorney for state-specific guidance',
      
      // Vehicle and property fields
      '{{licensePlate}}': data.customFields?.licensePlate || '[LICENSE PLATE]',
      '{{vehicleInfo}}': data.customFields?.vehicleInfo || '[VEHICLE INFO]',
      '{{vehicleVIN}}': data.customFields?.vehicleVIN || '[VIN]',
      '{{insuranceCompany}}': data.customFields?.insuranceCompany || '[INSURANCE COMPANY]',
      '{{policyNumber}}': data.customFields?.policyNumber || '[POLICY NUMBER]',
      '{{repairCost}}': data.customFields?.repairCost || '[REPAIR COST]',
      '{{vehicleDrivable}}': data.customFields?.vehicleDrivable || '[DRIVABLE STATUS]',
      
      // Officer and law enforcement fields
      '{{officerBadge}}': data.customFields?.officerBadge || '[OFFICER BADGE]',
      '{{policeDepartment}}': data.customFields?.policeDepartment || '[POLICE DEPARTMENT]',
      '{{stopReason}}': data.customFields?.stopReason || '[STOP REASON]',
      '{{policeReportNumber}}': data.customFields?.policeReportNumber || '[REPORT NUMBER]',
      '{{officerName}}': data.customFields?.officerName || '[OFFICER NAME]',
      
      // Evidence and documentation fields
      '{{audioRecording}}': data.customFields?.audioRecording || '[AUDIO RECORDING]',
      '{{videoRecording}}': data.customFields?.videoRecording || '[VIDEO RECORDING]',
      '{{witnessPresent}}': data.customFields?.witnessPresent || '[WITNESS PRESENT]',
      '{{citationIssued}}': data.customFields?.citationIssued || '[CITATION STATUS]',
      '{{arrestMade}}': data.customFields?.arrestMade || '[ARREST STATUS]',
      '{{vehicleSearched}}': data.customFields?.vehicleSearched || '[SEARCH STATUS]',
      '{{propertySeized}}': data.customFields?.propertySeized || '[SEIZURE STATUS]',
      '{{rightsExercised}}': data.customFields?.rightsExercised || '[RIGHTS EXERCISED]',
      
      // Photo and evidence fields
      '{{photo1}}': data.customFields?.photo1 || '[PHOTO 1]',
      '{{photo2}}': data.customFields?.photo2 || '[PHOTO 2]',
      '{{photo3}}': data.customFields?.photo3 || '[PHOTO 3]',
      '{{witnessName}}': data.customFields?.witnessName || '[WITNESS NAME]',
      '{{witnessContact}}': data.customFields?.witnessContact || '[WITNESS CONTACT]',
      
      // Medical and injury fields
      '{{injuryType}}': data.customFields?.injuryType || '[INJURY TYPE]',
      '{{bodyPartsAffected}}': data.customFields?.bodyPartsAffected || '[BODY PARTS]',
      '{{injurySeverity}}': data.customFields?.injurySeverity || '[SEVERITY]',
      '{{painLevel}}': data.customFields?.painLevel || '[PAIN LEVEL]',
      '{{immediateTreatment}}': data.customFields?.immediateTreatment || '[TREATMENT]',
      '{{medicalFacility}}': data.customFields?.medicalFacility || '[MEDICAL FACILITY]',
      '{{doctorName}}': data.customFields?.doctorName || '[DOCTOR NAME]',
      '{{medicalRecordNumber}}': data.customFields?.medicalRecordNumber || '[RECORD NUMBER]',
      '{{witness1}}': data.customFields?.witness1 || '[WITNESS 1]',
      '{{witness2}}': data.customFields?.witness2 || '[WITNESS 2]',
      '{{healthInsurance}}': data.customFields?.healthInsurance || '[HEALTH INSURANCE]',
      '{{autoInsurance}}': data.customFields?.autoInsurance || '[AUTO INSURANCE]',
      '{{daysMissed}}': data.customFields?.daysMissed || '[DAYS MISSED]',
      '{{workRestrictions}}': data.customFields?.workRestrictions || '[WORK RESTRICTIONS]',
      
      // Insurance claim fields
      '{{agentName}}': data.customFields?.agentName || '[AGENT NAME]',
      '{{agentPhone}}': data.customFields?.agentPhone || '[AGENT PHONE]',
      '{{claimNumber}}': data.customFields?.claimNumber || '[CLAIM NUMBER]',
      '{{vehicle1Damage}}': data.customFields?.vehicle1Damage || '[VEHICLE 1 DAMAGE]',
      '{{vehicle2Damage}}': data.customFields?.vehicle2Damage || '[VEHICLE 2 DAMAGE]',
      '{{otherPropertyDamage}}': data.customFields?.otherPropertyDamage || '[OTHER DAMAGE]',
      '{{vehicleRepairCost}}': data.customFields?.vehicleRepairCost || '[REPAIR COST]',
      '{{medicalExpenses}}': data.customFields?.medicalExpenses || '[MEDICAL EXPENSES]',
      '{{lostWages}}': data.customFields?.lostWages || '[LOST WAGES]',
      '{{otherExpenses}}': data.customFields?.otherExpenses || '[OTHER EXPENSES]',
      '{{totalClaim}}': data.customFields?.totalClaim || '[TOTAL CLAIM]',
      '{{policeReport}}': data.customFields?.policeReport || '[POLICE REPORT]',
      '{{medicalRecords}}': data.customFields?.medicalRecords || '[MEDICAL RECORDS]',
      '{{repairEstimates}}': data.customFields?.repairEstimates || '[REPAIR ESTIMATES]',
      '{{photos}}': data.customFields?.photos || '[PHOTOS]',
      '{{otherDriverName}}': data.customFields?.otherDriverName || '[OTHER DRIVER]',
      '{{otherInsurance}}': data.customFields?.otherInsurance || '[OTHER INSURANCE]',
      '{{otherPolicyNumber}}': data.customFields?.otherPolicyNumber || '[OTHER POLICY]',
    };

    // Apply custom field replacements
    if (data.customFields) {
      Object.entries(data.customFields).forEach(([key, value]) => {
        replacements[`{{${key}}}`] = String(value);
      });
    }

    // Replace all placeholders
    Object.entries(replacements).forEach(([placeholder, value]) => {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return content;
  }

  // Format location data from JSON to readable string
  private static formatLocation(location: any): string | null {
    if (!location) return null;
    
    if (typeof location === 'string') {
      return location;
    }
    
    if (typeof location === 'object') {
      const parts = [];
      if (location.address) parts.push(location.address);
      if (location.city) parts.push(location.city);
      if (location.state) parts.push(location.state);
      if (location.zipCode) parts.push(location.zipCode);
      
      return parts.length > 0 ? parts.join(', ') : null;
    }
    
    return null;
  }

  // Generate title for the document based on template and incident data
  static generateDocumentTitle(template: LegalDocumentTemplate, incident?: Incident): string {
    const incidentInfo = incident ? ` - ${incident.title}` : '';
    const date = new Date().toLocaleDateString();
    return `${template.name}${incidentInfo} (${date})`;
  }

  // Validate required fields are present in data
  static validateRequiredFields(template: LegalDocumentTemplate, data: DocumentData): { isValid: boolean; missingFields: string[] } {
    const requiredFields = template.fields as string[] || [];
    const missingFields: string[] = [];
    
    requiredFields.forEach(field => {
      const placeholder = `{{${field}}}`;
      
      // Check if the field exists in our standard replacements or custom fields
      const hasValue = this.hasFieldValue(field, data);
      
      if (!hasValue) {
        missingFields.push(field);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  private static hasFieldValue(field: string, data: DocumentData): boolean {
    // Check standard fields
    switch (field) {
      case 'userName':
        return !!data.userName;
      case 'userEmail':
        return !!data.userEmail;
      case 'incidentDate':
      case 'incidentTime':
        return !!data.incident?.createdAt;
      case 'incidentTitle':
        return !!data.incident?.title;
      case 'incidentDescription':
        return !!data.incident?.description;
      case 'incidentLocation':
        return !!(this.formatLocation(data.incident?.location) || data.location);
      case 'incidentPriority':
        return !!data.incident?.priority;
      case 'incidentStatus':
        return !!data.incident?.status;
      case 'incidentId':
        return !!data.incident?.id;
      case 'incidentType':
        return !!(data.incident?.title || data.customFields?.incidentType);
      case 'date':
      case 'currentDate':
      case 'currentTime':
        return true; // Always available
      case 'emergencyContactName':
      case 'emergencyNumber':
      case 'currentStatus':
      case 'currentLocation':
      case 'assistanceRequired':
      case 'emergencyServices':
      case 'situationType':
      case 'stateSpecificRights':
        return true; // These have default values
      default:
        // Check custom fields
        return !!(data.customFields && data.customFields[field]);
    }
  }

  // New method to auto-populate template based on incident data
  static getRecommendedTemplates(incident: any): LegalDocumentTemplate[] {
    if (!incident) return [];
    
    const recommended: LegalDocumentTemplate[] = [];
    const incidentTitle = incident.title?.toLowerCase() || '';
    const incidentDescription = incident.description?.toLowerCase() || '';
    
    // Auto-suggest templates based on incident content
    if (incidentTitle.includes('traffic') || incidentTitle.includes('stop') || incidentTitle.includes('police')) {
      recommended.push(...LEGAL_DOCUMENT_TEMPLATES.filter(t => t.category === 'traffic_stop'));
    }
    
    if (incidentTitle.includes('injury') || incidentDescription.includes('injured') || incidentDescription.includes('hurt')) {
      recommended.push(...LEGAL_DOCUMENT_TEMPLATES.filter(t => t.category === 'personal_injury'));
    }
    
    if (incidentTitle.includes('damage') || incidentDescription.includes('damage') || incidentTitle.includes('accident')) {
      recommended.push(...LEGAL_DOCUMENT_TEMPLATES.filter(t => t.category === 'property_damage'));
    }
    
    if (incidentTitle.includes('rights') || incidentDescription.includes('violation') || incidentDescription.includes('constitutional')) {
      recommended.push(...LEGAL_DOCUMENT_TEMPLATES.filter(t => t.category === 'civil_rights'));
    }
    
    // Always include general templates
    recommended.push(...LEGAL_DOCUMENT_TEMPLATES.filter(t => t.category === 'general' || t.type === 'incident_report'));
    
    // Remove duplicates
    return recommended.filter((template, index, self) => 
      index === self.findIndex(t => t.name === template.name)
    );
  }

  // Method to generate multiple documents from a single incident
  static generateDocumentBundle(incident: any, userData: any): { templateId: number; content: string; title: string }[] {
    const documents: { templateId: number; content: string; title: string }[] = [];
    const recommendedTemplates = this.getRecommendedTemplates(incident);
    
    recommendedTemplates.forEach(template => {
      const documentData = {
        incident,
        userName: userData.name || userData.firstName + ' ' + userData.lastName || userData.email,
        userEmail: userData.email,
        customFields: {}
      };
      
      try {
        const content = this.generateDocument(template, documentData);
        const title = this.generateDocumentTitle(template, incident);
        documents.push({
          templateId: template.id || 0,
          content,
          title
        });
      } catch (error) {
        console.error(`Failed to generate document for template ${template.name}:`, error);
      }
    });
    
    return documents;
  }
}

// Predefined legal document templates
export const LEGAL_DOCUMENT_TEMPLATES = [
  {
    name: "Police Encounter Incident Report",
    type: "incident_report",
    category: "traffic_stop",
    template: `INCIDENT REPORT

Date: {{currentDate}}
Reported by: {{userName}}
Email: {{userEmail}}

INCIDENT DETAILS
Date of Incident: {{incidentDate}}
Time of Incident: {{incidentTime}}
Location: {{incidentLocation}}

DESCRIPTION
{{incidentDescription}}

INCIDENT SUMMARY
Title: {{incidentTitle}}
Priority Level: {{incidentPriority}}
Current Status: {{incidentStatus}}

ADDITIONAL INFORMATION
This report was generated automatically from recorded incident data. All information provided is based on user-documented evidence and should be considered preliminary pending official investigation.

Signature: _______________________
Date: {{currentDate}}`,
    fields: ["userName", "userEmail", "incidentDate", "incidentTime", "incidentLocation", "incidentDescription", "incidentTitle"],
    state: null,
    isActive: true,
  },
  {
    name: "Traffic Stop Documentation",
    type: "incident_report",
    category: "traffic_stop",
    template: `TRAFFIC STOP DOCUMENTATION

Date: {{currentDate}}
Driver: {{userName}}
Contact: {{userEmail}}

STOP DETAILS
Date of Stop: {{incidentDate}}
Time of Stop: {{incidentTime}}
Location: {{incidentLocation}}
Officer Badge/Name: {{officerBadge}}
Police Department: {{policeDepartment}}
Reason Given for Stop: {{stopReason}}

VEHICLE INFORMATION
License Plate: {{licensePlate}}
Vehicle Make/Model: {{vehicleInfo}}

INTERACTION SUMMARY
{{incidentDescription}}

RIGHTS EXERCISED
☐ Remained Silent
☐ Refused Vehicle Search
☐ Requested Attorney
☐ Recorded Interaction
☐ Other: {{rightsExercised}}

EVIDENCE COLLECTED
Audio Recording: {{audioRecording}}
Video Recording: {{videoRecording}}
Witness Present: {{witnessPresent}}

OUTCOME
Citation Issued: {{citationIssued}}
Arrest Made: {{arrestMade}}
Vehicle Searched: {{vehicleSearched}}
Property Seized: {{propertySeized}}

This documentation was automatically generated from incident data recorded during the traffic stop.

Signature: _______________________
Date: {{currentDate}}`,
    fields: ["userName", "userEmail", "incidentDate", "incidentTime", "incidentLocation", "incidentDescription", "officerBadge", "stopReason"],
    state: null,
    isActive: true,
  },
  {
    name: "Vehicle Damage Assessment Report",
    type: "assessment_report",
    category: "property_damage",
    template: `VEHICLE DAMAGE ASSESSMENT REPORT

Date: {{currentDate}}
Vehicle Owner: {{userName}}
Contact Information: {{userEmail}}

INCIDENT INFORMATION
Date of Incident: {{incidentDate}}
Time of Incident: {{incidentTime}}
Location: {{incidentLocation}}

VEHICLE DETAILS
License Plate: {{licensePlate}}
Make/Model/Year: {{vehicleInfo}}
VIN: {{vehicleVIN}}
Insurance Company: {{insuranceCompany}}
Policy Number: {{policyNumber}}

DAMAGE ASSESSMENT
{{incidentDescription}}

Estimated Repair Cost: $\{{repairCost}}
Vehicle Drivable: {{vehicleDrivable}}

PHOTOS/EVIDENCE
Photo 1: {{photo1}}
Photo 2: {{photo2}}
Photo 3: {{photo3}}

WITNESS INFORMATION
Witness Name: {{witnessName}}
Witness Contact: {{witnessContact}}

POLICE REPORT
Report Number: {{policeReportNumber}}
Officer Name: {{officerName}}

This assessment was generated automatically from incident documentation.

Signature: _______________________
Date: {{currentDate}}`,
    fields: ["userName", "userEmail", "incidentDate", "incidentTime", "incidentLocation", "incidentDescription"],
    state: null,
    isActive: true,
  },
  {
    name: "Civil Rights Violation Complaint",
    type: "complaint",
    category: "civil_rights",
    template: `CIVIL RIGHTS VIOLATION COMPLAINT

TO: [APPROPRIATE AUTHORITY]
FROM: {{userName}}
DATE: {{currentDate}}

I, {{userName}}, hereby file this formal complaint regarding a civil rights violation that occurred on {{incidentDate}} at {{incidentLocation}}.

INCIDENT DETAILS:
{{incidentDescription}}

VIOLATIONS ALLEGED:
☐ Excessive Force
☐ Unlawful Search and Seizure  
☐ False Arrest/Imprisonment
☐ Discrimination
☐ Other: ________________

RELIEF REQUESTED:
☐ Investigation of the incident
☐ Disciplinary action against involved officers
☐ Policy changes to prevent future violations
☐ Other: ________________

I declare under penalty of perjury that the foregoing is true and correct.

Signature: _______________________
{{userName}}
Date: {{currentDate}}`,
    fields: ["userName", "incidentDate", "incidentLocation", "incidentDescription"],
    state: null,
    isActive: true,
  },
  {
    name: "Personal Injury Documentation",
    type: "injury_report",
    category: "personal_injury",
    template: `PERSONAL INJURY DOCUMENTATION

Date: {{currentDate}}
Injured Party: {{userName}}
Contact: {{userEmail}}

INCIDENT DETAILS
Date of Injury: {{incidentDate}}
Time of Injury: {{incidentTime}}
Location: {{incidentLocation}}

DESCRIPTION OF INCIDENT
{{incidentDescription}}

INJURY DETAILS
Type of Injury: {{injuryType}}
Body Parts Affected: {{bodyPartsAffected}}
Severity: {{injurySeverity}}
Pain Level (1-10): \{{painLevel}}

MEDICAL TREATMENT
Immediate Treatment: {{immediateTreatment}}
Hospital/Clinic: {{medicalFacility}}
Doctor Name: {{doctorName}}
Medical Record Number: {{medicalRecordNumber}}

WITNESS INFORMATION
Witness 1: {{witness1}}
Witness 2: {{witness2}}

INSURANCE INFORMATION
Health Insurance: {{healthInsurance}}
Auto Insurance: {{autoInsurance}}

WORK IMPACT
Days Missed: {{daysMissed}}
Work Restrictions: {{workRestrictions}}

This injury documentation was automatically generated from incident records.

Signature: _______________________
Date: {{currentDate}}`,
    fields: ["userName", "userEmail", "incidentDate", "incidentTime", "incidentLocation", "incidentDescription"],
    state: null,
    isActive: true,
  },
  {
    name: "Insurance Claim Preparation",
    type: "insurance_claim",
    category: "insurance",
    template: `INSURANCE CLAIM DOCUMENTATION

Date: {{currentDate}}
Claimant: {{userName}}
Contact: {{userEmail}}

POLICY INFORMATION
Insurance Company: {{insuranceCompany}}
Policy Number: {{policyNumber}}
Agent Name: {{agentName}}
Agent Phone: {{agentPhone}}

INCIDENT DETAILS
Date of Loss: {{incidentDate}}
Time of Loss: {{incidentTime}}
Location: {{incidentLocation}}
Claim Number: {{claimNumber}}

DESCRIPTION OF LOSS
{{incidentDescription}}

PROPERTY DAMAGE
Vehicle 1: {{vehicle1Damage}}
Vehicle 2: {{vehicle2Damage}}
Other Property: {{otherPropertyDamage}}

ESTIMATED DAMAGES
Vehicle Repair: $\{{vehicleRepairCost}}
Medical Expenses: $\{{medicalExpenses}}
Lost Wages: $\{{lostWages}}
Other Expenses: $\{{otherExpenses}}
Total Claim: $\{{totalClaim}}

SUPPORTING DOCUMENTATION
Police Report: {{policeReport}}
Medical Records: {{medicalRecords}}
Repair Estimates: {{repairEstimates}}
Photos: {{photos}}

THIRD PARTY INFORMATION
Other Driver: {{otherDriverName}}
Other Insurance: {{otherInsurance}}
Other Policy: {{otherPolicyNumber}}

This claim documentation was automatically compiled from incident data.

Signature: _______________________
Date: {{currentDate}}`,
    fields: ["userName", "userEmail", "incidentDate", "incidentTime", "incidentLocation", "incidentDescription"],
    state: null,
    isActive: true,
  },
  {
    name: "Witness Statement",
    type: "witness_statement", 
    category: "general",
    template: `WITNESS STATEMENT

I, {{userName}}, make this statement regarding events that occurred on {{incidentDate}} at {{incidentLocation}}.

WITNESS INFORMATION:
Name: {{userName}}
Email: {{userEmail}}
Date of Statement: {{currentDate}}

STATEMENT OF EVENTS:
{{incidentDescription}}

I declare that this statement is true and accurate to the best of my knowledge and recollection.

Witness Signature: _______________________
{{userName}}
Date: {{currentDate}}`,
    fields: ["userName", "userEmail", "incidentDate", "incidentLocation", "incidentDescription"],
    state: null,
    isActive: true,
  },
  {
    name: "Emergency Contact Notification Letter",
    type: "notification_letter",
    category: "emergency",
    template: `EMERGENCY CONTACT NOTIFICATION

Date: {{currentDate}}
To: {{emergencyContactName}}
From: C.A.R.E.N.™ Emergency System

URGENT NOTIFICATION

This is an automated notification regarding {{userName}}.

INCIDENT DETAILS
Date: {{incidentDate}}
Time: {{incidentTime}}
Location: {{incidentLocation}}
Type: {{incidentType}}

SITUATION SUMMARY
{{incidentDescription}}

CURRENT STATUS
Status: {{currentStatus}}
Location: {{currentLocation}}
Assistance Required: {{assistanceRequired}}

CONTACT INFORMATION
Primary Contact: {{userEmail}}
Emergency Services: {{emergencyServices}}

AUTOMATED RESPONSE ACTIONS
☐ Emergency contacts notified
☐ Location shared with authorized contacts
☐ Legal documentation initiated
☐ Attorney consultation requested

This notification was automatically generated by the C.A.R.E.N.™ system based on an emergency alert.

For immediate assistance, contact: {{emergencyNumber}}

System Generated: {{currentDate}}`,
    fields: ["userName", "incidentDate", "incidentTime", "incidentLocation", "incidentDescription"],
    state: null,
    isActive: true,
  },
  {
    name: "Legal Rights Advisory Notice",
    type: "advisory_notice",
    category: "legal_rights",
    template: `LEGAL RIGHTS ADVISORY NOTICE

Date: {{currentDate}}
Subject: Your Legal Rights During {{situationType}}

Dear {{userName}},

This notice provides important information about your legal rights based on your current situation.

SITUATION
Date: {{incidentDate}}
Location: {{incidentLocation}}
Type: {{situationType}}

YOUR FUNDAMENTAL RIGHTS
✓ Right to Remain Silent
   - You are not required to answer questions beyond providing identification
   - Anything you say can be used against you in court

✓ Right to Legal Representation
   - You have the right to request an attorney
   - You can refuse to answer questions until an attorney is present

✓ Right Against Unreasonable Search
   - Police need probable cause or your consent to search your vehicle
   - You can clearly state: "I do not consent to any searches"

✓ Right to Record
   - You may record police interactions in public spaces
   - Inform officers you are recording for transparency

RECOMMENDED ACTIONS
☐ Remain calm and cooperative
☐ Keep hands visible at all times
☐ Follow lawful orders
☐ Do not resist, even if you believe the stop is unlawful
☐ Remember details for later documentation
☐ Contact legal representation if needed

STATE-SPECIFIC CONSIDERATIONS
{{stateSpecificRights}}

DOCUMENTATION
This advisory was generated based on your incident report from {{incidentDate}}.
Incident ID: {{incidentId}}

For legal assistance, contact your attorney or use the C.A.R.E.N.™ attorney network.

Generated: {{currentDate}}`,
    fields: ["userName", "incidentDate", "incidentLocation"],
    state: null,
    isActive: true,
  },
  {
    name: "Follow-Up Action Checklist",
    type: "checklist",
    category: "follow_up",
    template: `POST-INCIDENT ACTION CHECKLIST

Date: {{currentDate}}
Incident Date: {{incidentDate}}
Person: {{userName}}

IMMEDIATE ACTIONS (Within 24 Hours)
☐ Document all details while memory is fresh
☐ Take photos of any damage or injuries
☐ Collect witness contact information
☐ File police report if not already done
☐ Contact insurance company
☐ Seek medical attention if injured
☐ Notify employer if work-related

FOLLOW-UP ACTIONS (Within 1 Week)
☐ Obtain copy of police report
☐ Contact attorney if legal issues suspected
☐ Follow up with medical providers
☐ Keep detailed records of all expenses
☐ Document ongoing symptoms or issues
☐ Contact other parties' insurance if applicable

ONGOING MONITORING (Next 30 Days)
☐ Track medical appointments and treatments
☐ Monitor vehicle repair progress
☐ Document lost wages or time off work
☐ Keep receipts for all related expenses
☐ Follow up on insurance claim status
☐ Consider independent medical evaluation

DOCUMENTATION TO MAINTAIN
☐ All medical records and bills
☐ Vehicle repair estimates and invoices
☐ Insurance correspondence
☐ Photos and video evidence
☐ Witness statements
☐ Police reports and court documents

LEGAL CONSIDERATIONS
☐ Statute of limitations research
☐ Legal consultation if needed
☐ Documentation of rights violations
☐ Evidence preservation

IMPORTANT REMINDERS
- Keep detailed records of all communications
- Never sign documents without legal review
- Avoid discussing fault or blame
- Preserve all physical evidence

This checklist was generated based on your incident from {{incidentDate}}.

Completed by: _______________________
Date: {{currentDate}}`,
    fields: ["userName", "incidentDate"],
    state: null,
    isActive: true,
  }
];