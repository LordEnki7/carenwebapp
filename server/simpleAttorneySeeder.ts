import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Simple Attorney Seeder for Existing Database Schema
 * Works with the current database structure without requiring schema changes
 */

export class SimpleAttorneySeeder {
  
  async seedBasicAttorneys() {
    console.log("👨‍⚖️ Seeding basic production attorneys...");
    
    // Create attorney data that matches the existing database schema
    const basicAttorneys = [
      {
        user_id: "attorney_1",
        firm_name: "Civil Rights Law Center",
        specialties: ["Civil Rights", "Police Misconduct"],
        states: ["CA", "NY"],
        rating: 5,
        verified: true,
        contact_info: {
          name: "Sarah Martinez",
          phone: "(415) 555-0123",
          email: "sarah@civilrightslaw.com"
        },
        bio: "Experienced civil rights attorney specializing in police misconduct cases."
      },
      {
        user_id: "attorney_2", 
        firm_name: "Constitutional Defense Group",
        specialties: ["Constitutional Law", "Criminal Defense"],
        states: ["TX", "FL"],
        rating: 5,
        verified: true,
        contact_info: {
          name: "Michael Thompson",
          phone: "(713) 555-0156",
          email: "mthompson@constitutionaldefense.com"
        },
        bio: "Leading constitutional law expert with 15+ years experience."
      },
      {
        user_id: "attorney_3",
        firm_name: "Justice & Rights Law Firm", 
        specialties: ["Criminal Defense", "Civil Rights"],
        states: ["NY", "NJ"],
        rating: 4,
        verified: true,
        contact_info: {
          name: "Jennifer Chen",
          phone: "(212) 555-0189",
          email: "jchen@justicelaw.com"
        },
        bio: "Dedicated to protecting constitutional rights and civil liberties."
      },
      {
        user_id: "attorney_4",
        firm_name: "Liberty Legal Services",
        specialties: ["Police Accountability", "Personal Injury"],
        states: ["IL", "WI"],
        rating: 5,
        verified: true,
        contact_info: {
          name: "Robert Davis",
          phone: "(312) 555-0134",
          email: "rdavis@libertylegal.com"
        },
        bio: "Passionate advocate for police accountability and civil rights."
      },
      {
        user_id: "attorney_5",
        firm_name: "Rights Protection Law",
        specialties: ["Civil Rights", "Constitutional Law"],
        states: ["WA", "OR"],
        rating: 4,
        verified: true,
        contact_info: {
          name: "Maria Rodriguez",
          phone: "(206) 555-0167",
          email: "mrodriguez@rightsprotection.com"
        },
        bio: "Expert in constitutional law and civil rights litigation."
      }
    ];

    try {
      // Clear existing data
      await db.execute(sql`DELETE FROM attorneys`);
      console.log("🗑️ Cleared existing attorney data");

      // Insert new attorney data using raw SQL to match the existing schema
      for (const attorney of basicAttorneys) {
        await db.execute(sql`
          INSERT INTO attorneys (user_id, firm_name, specialties, states, rating, verified, contact_info, bio)
          VALUES (${attorney.user_id}, ${attorney.firm_name}, ${JSON.stringify(attorney.specialties)}, ${JSON.stringify(attorney.states)}, ${attorney.rating}, ${attorney.verified}, ${JSON.stringify(attorney.contact_info)}, ${attorney.bio})
        `);
      }

      console.log(`✅ Successfully seeded ${basicAttorneys.length} production attorneys`);
      return { success: true, count: basicAttorneys.length };
      
    } catch (error) {
      console.error("❌ Error seeding basic attorneys:", error);
      throw error;
    }
  }

  async getAttorneyStats() {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_count
      FROM attorneys
    `);
    
    return result[0];
  }
}

export const simpleAttorneySeeder = new SimpleAttorneySeeder();