import { storage } from "./storage";
import { LEGAL_DOCUMENT_TEMPLATES } from "./documentGenerator";

async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // Seed legal rights for different states
    const legalRightsData = [
      // California
      {
        state: "CA",
        category: "Traffic Stops",
        title: "Right to Remain Silent",
        description: "You have the right to remain silent during a traffic stop. You are not required to answer questions beyond providing identification.",
        details: "Under the Fifth Amendment, you cannot be compelled to incriminate yourself. During a traffic stop, you must provide your driver's license, registration, and insurance, but you are not required to answer questions about where you're going or what you're doing."
      },
      {
        state: "CA",
        category: "Recording Rights",
        title: "Right to Record Police",
        description: "In California, you have the right to record police officers performing their duties in public spaces.",
        details: "California Penal Code Section 148 protects your right to record police as long as you don't interfere with their duties. You can record from a reasonable distance and should announce you are recording."
      },
      {
        state: "CA",
        category: "Search and Seizure",
        title: "Vehicle Search Limitations",
        description: "Police need probable cause or consent to search your vehicle during a traffic stop.",
        details: "Under the Fourth Amendment and California law, officers cannot search your vehicle without probable cause, a warrant, or your consent. You have the right to refuse a search request."
      },
      // Texas
      {
        state: "TX",
        category: "Traffic Stops",
        title: "Identification Requirements",
        description: "In Texas, you must provide identification when lawfully detained by police.",
        details: "Texas Penal Code Section 38.02 requires you to provide your name, residence address, and date of birth if lawfully arrested or detained. However, you are not required to answer other questions."
      },
      {
        state: "TX",
        category: "Recording Rights",
        title: "Public Recording Rights",
        description: "Texas law protects your right to record police in public spaces.",
        details: "You have the right to record police officers performing their duties in public areas as long as you don't interfere with their work. Stay at a reasonable distance and be respectful."
      },
      // New York
      {
        state: "NY",
        category: "Traffic Stops",
        title: "Stop and Frisk Protections",
        description: "Police must have reasonable suspicion to stop and frisk you in New York.",
        details: "Under Terry v. Ohio and New York law, police can only stop and frisk you if they have reasonable, articulable suspicion that you are engaged in criminal activity."
      },
      {
        state: "NY",
        category: "Recording Rights",
        title: "Photography and Recording",
        description: "New York protects your right to photograph and record police in public.",
        details: "You have the right to record police officers in public spaces. New York courts have consistently upheld this right as protected under the First Amendment."
      },
      // Florida
      {
        state: "FL",
        category: "Traffic Stops",
        title: "Miranda Rights Application",
        description: "Miranda rights apply when you are in custody and being interrogated.",
        details: "In Florida, police must read you your Miranda rights if you are in custody and being interrogated. During a simple traffic stop, Miranda warnings are typically not required."
      },
      {
        state: "FL",
        category: "Search and Seizure",
        title: "Consent to Search",
        description: "You have the right to refuse consent to search your vehicle or person.",
        details: "Florida law requires clear, voluntary consent for searches. You can refuse consent and should clearly state 'I do not consent to any searches.'"
      }
    ];

    for (const rights of legalRightsData) {
      await storage.createLegalRights(rights);
    }

    // Create sample attorney users first
    const attorneyUsers = [
      {
        id: "attorney_1",
        email: "contact@civilrightslaw.com",
        firstName: "John",
        lastName: "Smith",
        profileImageUrl: null,
      },
      {
        id: "attorney_2",
        email: "info@rodriguezlaw.com",
        firstName: "Maria",
        lastName: "Rodriguez",
        profileImageUrl: null,
      },
      {
        id: "attorney_3",
        email: "contact@metrolegal.com",
        firstName: "David",
        lastName: "Chen",
        profileImageUrl: null,
      },
      {
        id: "attorney_4",
        email: "help@sunshinelaw.com",
        firstName: "Sarah",
        lastName: "Johnson",
        profileImageUrl: null,
      },
      {
        id: "attorney_5",
        email: "advocates@pacificlaw.com",
        firstName: "Michael",
        lastName: "Brown",
        profileImageUrl: null,
      },
      {
        id: "attorney_6",
        email: "justice@lonestarlaw.com",
        firstName: "Robert",
        lastName: "Davis",
        profileImageUrl: null,
      }
    ];

    for (const user of attorneyUsers) {
      await storage.upsertUser(user);
    }

    // Create attorney profiles
    const attorneyData = [
      {
        userId: "attorney_1",
        firmName: "Civil Rights Law Group",
        bio: "Dedicated to protecting civil rights and fighting police misconduct. Over 15 years of experience in constitutional law and civil rights litigation.",
        specialties: ["Civil Rights", "Police Misconduct", "Constitutional Law"],
        states: ["CA", "NV"],
        rating: 5,
        verified: true,
        contactInfo: {
          email: "contact@civilrightslaw.com",
          phone: "(555) 123-4567",
          website: "https://civilrightslaw.com"
        }
      },
      {
        userId: "attorney_2",
        firmName: "Rodriguez & Associates",
        bio: "Experienced criminal defense and traffic law attorneys serving the community for over 20 years. Bilingual services available.",
        specialties: ["Criminal Defense", "Traffic Law", "Immigration Law"],
        states: ["TX", "NM"],
        rating: 5,
        verified: true,
        contactInfo: {
          email: "info@rodriguezlaw.com",
          phone: "(555) 234-5678",
          website: "https://rodriguezlaw.com"
        }
      },
      {
        userId: "attorney_3",
        firmName: "Metropolitan Legal Defense",
        bio: "Premier legal defense firm specializing in constitutional rights and police accountability cases in the New York metropolitan area.",
        specialties: ["Constitutional Law", "Civil Rights", "Criminal Defense"],
        states: ["NY", "NJ", "CT"],
        rating: 5,
        verified: true,
        contactInfo: {
          email: "contact@metrolegal.com",
          phone: "(555) 345-6789",
          website: "https://metrolegal.com"
        }
      },
      {
        userId: "attorney_4",
        firmName: "Sunshine State Legal",
        bio: "Florida-based law firm with expertise in traffic violations, civil rights, and personal injury. Free consultations available.",
        specialties: ["Traffic Law", "Personal Injury", "Civil Rights"],
        states: ["FL"],
        rating: 4,
        verified: true,
        contactInfo: {
          email: "help@sunshinelaw.com",
          phone: "(555) 456-7890",
          website: "https://sunshinelaw.com"
        }
      },
      {
        userId: "attorney_5",
        firmName: "Pacific Coast Advocates",
        bio: "Committed to justice and equality. Specializing in civil rights cases and police accountability throughout the West Coast.",
        specialties: ["Civil Rights", "Police Misconduct", "Constitutional Law"],
        states: ["CA", "OR", "WA"],
        rating: 5,
        verified: true,
        contactInfo: {
          email: "advocates@pacificlaw.com",
          phone: "(555) 567-8901",
          website: "https://pacificlaw.com"
        }
      },
      {
        userId: "attorney_6",
        firmName: "Lone Star Justice",
        bio: "Texas law firm dedicated to protecting individual rights and providing aggressive legal representation in criminal and civil matters.",
        specialties: ["Criminal Defense", "Civil Rights", "Traffic Law"],
        states: ["TX"],
        rating: 4,
        verified: true,
        contactInfo: {
          email: "justice@lonestarlaw.com",
          phone: "(555) 678-9012",
          website: "https://lonestarlaw.com"
        }
      }
    ];

    for (const attorney of attorneyData) {
      await storage.createAttorney(attorney);
    }

    // Create a test user for demonstration
    const testUser = {
      id: "test_user_1",
      email: "testuser@example.com",
      firstName: "Test",
      lastName: "User",
      profileImageUrl: null,
    };
    await storage.upsertUser(testUser);

    // Add temporary emergency contacts for testing
    const emergencyContactsData = [
      {
        userId: "test_user_1",
        name: "Emergency Contact 1",
        phone: "+15551234567",
        email: "contact1@example.com",
        relationship: "Family",
        priority: "primary" as const,
        isActive: true,
      },
      {
        userId: "test_user_1", 
        name: "Emergency Contact 2",
        phone: "+15559876543",
        email: "contact2@example.com",
        relationship: "Friend",
        priority: "secondary" as const,
        isActive: true,
      },
      {
        userId: "test_user_1",
        name: "Legal Advocate",
        phone: "+15555551234",
        email: "advocate@example.com", 
        relationship: "Legal",
        priority: "primary" as const,
        isActive: true,
      }
    ];

    for (const contact of emergencyContactsData) {
      await storage.createEmergencyContact(contact);
    }

    console.log("Database seeded successfully!");
    // Seed legal document templates
    console.log("Seeding legal document templates...");
    const existingTemplates = await storage.getLegalDocumentTemplates();
    
    if (existingTemplates.length === 0) {
      const legalDocumentTemplatesData = [
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
        }
      ];

      for (const templateData of legalDocumentTemplatesData) {
        await storage.createLegalDocumentTemplate(templateData);
      }
      console.log(`✅ Legal document templates seeded successfully (${legalDocumentTemplatesData.length} templates)`);
    } else {
      console.log("✅ Legal document templates already exist, skipping...");
    }

    console.log(`- Created ${attorneyUsers.length} attorney users`);
    console.log(`- Created ${legalRightsData.length} legal rights entries`);
    console.log(`- Created ${attorneyData.length} attorney profiles`);
    console.log(`- Created ${emergencyContactsData.length} test emergency contacts`);

    // Seed legal document templates
    console.log("Seeding legal document templates...");
    let templatesCreated = 0;
    for (const templateData of LEGAL_DOCUMENT_TEMPLATES) {
      try {
        await storage.createLegalDocumentTemplate(templateData);
        templatesCreated++;
      } catch (error) {
        console.log(`Template ${templateData.name} may already exist, skipping...`);
      }
    }
    console.log(`- Created ${templatesCreated} legal document templates`);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase();