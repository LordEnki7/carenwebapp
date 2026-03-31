import { db } from "./db";
import { legalRights } from "@shared/schema";

// Complete expansion for states with incomplete coverage
export const COMPLETE_50_STATE_EXPANSION = [
  // South Carolina - Complete 10 rights
  { state: "SC", category: "DUI Laws", title: "Implied Consent", description: "South Carolina has implied consent laws for DUI testing.", details: "Driving implies consent to chemical testing. Refusal results in license suspension under SC Code 56-5-2950." },
  { state: "SC", category: "Firearm Laws", title: "Concealed Carry", description: "South Carolina requires permits for concealed carry.", details: "SC Code 23-31-210 requires Concealed Weapons Permit (CWP) for concealed carry with specific training requirements." },
  { state: "SC", category: "Traffic Laws", title: "Move Over Law", description: "South Carolina requires moving over for emergency vehicles.", details: "SC Code 56-5-1538 requires drivers to move over or slow down for stopped emergency vehicles." },
  { state: "SC", category: "Drug Laws", title: "Marijuana Penalties", description: "South Carolina has strict marijuana laws.", details: "Possession of any amount of marijuana is illegal with penalties including fines and potential jail time." },
  { state: "SC", category: "Juvenile Laws", title: "Minor Traffic Stops", description: "Special protections for minors during traffic stops.", details: "Minors have additional protections and parents should be contacted for certain violations under SC law." },

  // South Dakota - Complete 10 rights  
  { state: "SD", category: "Traffic Stops", title: "Stop and Identify", description: "South Dakota requires identification during lawful detention.", details: "SDCL 22-10-24 requires providing identification when lawfully detained by police officers." },
  { state: "SD", category: "Recording Rights", title: "Police Recording", description: "South Dakota allows recording police in public.", details: "You can record police officers performing duties in public spaces under First Amendment protection." },
  { state: "SD", category: "Search and Seizure", title: "Vehicle Searches", description: "Probable cause required for vehicle searches.", details: "South Dakota follows federal Fourth Amendment standards requiring probable cause or consent." },
  { state: "SD", category: "Police Accountability", title: "Law Enforcement Training", description: "South Dakota Law Enforcement Training Academy oversight.", details: "File complaints with local agencies and South Dakota Law Enforcement Training Academy." },
  { state: "SD", category: "State-Specific Laws", title: "Constitutional Carry", description: "South Dakota allows constitutional carry of firearms.", details: "SDCL 23-7-7.1 allows carrying concealed handguns without permit for eligible individuals." },
  { state: "SD", category: "DUI Laws", title: "DUI Enforcement", description: "South Dakota has strict DUI laws.", details: "BAC limit 0.08% with enhanced penalties. Implied consent law requires testing compliance." },
  { state: "SD", category: "Traffic Laws", title: "Seatbelt Requirements", description: "South Dakota requires seatbelt use.", details: "SDCL 32-38-1 requires driver and front passenger seatbelt use with specific exemptions." },
  { state: "SD", category: "Privacy Rights", title: "Vehicle Privacy", description: "Protection against unreasonable vehicle searches.", details: "South Dakota constitution Article VI, Section 11 provides search and seizure protections." },
  { state: "SD", category: "Emergency Laws", title: "Emergency Vehicle Laws", description: "Requirements when emergency vehicles approach.", details: "Must yield right-of-way and move over for emergency vehicles under SDCL 32-31-1." },
  { state: "SD", category: "Hunting Laws", title: "Firearm Transportation", description: "Rules for transporting firearms in vehicles.", details: "SDCL 41-6-1.2 governs firearm transportation in motor vehicles during hunting seasons." },

  // Tennessee - Complete 10 rights
  { state: "TN", category: "Traffic Stops", title: "Stop and Identify", description: "Tennessee requires identification during lawful stops.", details: "TCA 40-7-118 requires providing identification when lawfully detained by police officers." },
  { state: "TN", category: "Recording Rights", title: "Recording Police", description: "Tennessee allows recording police in public spaces.", details: "First Amendment protects recording police performing duties in public areas." },
  { state: "TN", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Tennessee follows federal standards requiring probable cause, warrant, or consent for searches." },
  { state: "TN", category: "Police Accountability", title: "POST Commission", description: "Tennessee Peace Officer Standards and Training Commission.", details: "File complaints with local agencies and TN Peace Officer Standards and Training Commission." },
  { state: "TN", category: "State-Specific Laws", title: "Stand Your Ground", description: "Tennessee has Stand Your Ground laws.", details: "TCA 39-11-611 provides Stand Your Ground protections with no duty to retreat." },
  { state: "TN", category: "DUI Laws", title: "Implied Consent", description: "Tennessee implied consent for DUI testing.", details: "TCA 55-10-406 requires compliance with chemical testing or face license suspension." },
  { state: "TN", category: "Firearm Laws", title: "Enhanced Carry Permit", description: "Tennessee enhanced handgun carry permits.", details: "TCA 39-17-1351 allows enhanced carry permits with additional training requirements." },
  { state: "TN", category: "Traffic Laws", title: "Hands-Free Driving", description: "Tennessee prohibits handheld phone use while driving.", details: "TCA 55-8-199 prohibits handheld phone use and texting while driving with exceptions." },
  { state: "TN", category: "Drug Laws", title: "Controlled Substances", description: "Tennessee drug possession penalties.", details: "TCA Title 39 Chapter 17 governs controlled substance possession with specific penalty structures." },
  { state: "TN", category: "Privacy Rights", title: "Consent to Search", description: "Right to refuse consent for searches.", details: "You can refuse consent to search and should clearly state 'I do not consent to searches.'" },

  // Utah - Complete 10 rights
  { state: "UT", category: "Traffic Stops", title: "Stop and Identify", description: "Utah requires identification during lawful detention.", details: "Utah Code 77-7-15 requires providing identification when lawfully detained by police." },
  { state: "UT", category: "Recording Rights", title: "Police Recording", description: "Utah allows recording police in public.", details: "First Amendment protects recording police performing their duties in public spaces." },
  { state: "UT", category: "Search and Seizure", title: "Search Protections", description: "Utah follows Fourth Amendment standards.", details: "Utah Constitution Article I, Section 14 and federal law protect against unreasonable searches." },
  { state: "UT", category: "Police Accountability", title: "POST Council", description: "Utah Peace Officer Standards and Training Council.", details: "File complaints with local agencies and Utah Peace Officer Standards and Training Council." },
  { state: "UT", category: "State-Specific Laws", title: "Stand Your Ground", description: "Utah has Stand Your Ground laws.", details: "Utah Code 76-2-402 provides Stand Your Ground protections in justified force situations." },
  { state: "UT", category: "DUI Laws", title: "DUI Thresholds", description: "Utah has strict DUI laws with low BAC limit.", details: "Utah has 0.05% BAC limit, lowest in nation, with strict enforcement and penalties." },
  { state: "UT", category: "Firearm Laws", title: "Concealed Carry", description: "Utah concealed firearm permit requirements.", details: "Utah Code 53-5-704 requires permits for concealed carry with training requirements." },
  { state: "UT", category: "Traffic Laws", title: "Move Over Law", description: "Utah requires moving over for emergency vehicles.", details: "Utah Code 41-6a-904 requires drivers to move over or slow down for emergency vehicles." },
  { state: "UT", category: "Drug Laws", title: "Controlled Substances", description: "Utah drug possession laws.", details: "Utah Code Title 58 Chapter 37 governs controlled substance possession and penalties." },
  { state: "UT", category: "Privacy Rights", title: "Digital Privacy", description: "Utah has digital privacy protections.", details: "Utah Consumer Privacy Act provides data protection rights including during police interactions." },

  // Vermont - Complete 10 rights
  { state: "VT", category: "Traffic Stops", title: "Miranda Rights", description: "Vermont follows federal Miranda standards.", details: "Miranda rights required for custodial interrogation during traffic stops in Vermont." },
  { state: "VT", category: "Recording Rights", title: "Recording Police", description: "Vermont strongly protects recording police.", details: "Vermont has strong First Amendment protections for recording police in public spaces." },
  { state: "VT", category: "Search and Seizure", title: "Search Protections", description: "Vermont has strong search protections.", details: "Vermont Constitution Chapter I, Article 11 provides robust search and seizure protections." },
  { state: "VT", category: "Police Accountability", title: "Training Council", description: "Vermont Criminal Justice Training Council oversight.", details: "File complaints with local agencies and Vermont Criminal Justice Training Council." },
  { state: "VT", category: "State-Specific Laws", title: "Cannabis Laws", description: "Vermont has legal recreational cannabis.", details: "Vermont allows adult cannabis possession and home cultivation under 18 V.S.A. Chapter 86." },
  { state: "VT", category: "DUI Laws", title: "DUI Enforcement", description: "Vermont DUI laws and penalties.", details: "Vermont has 0.08% BAC limit with implied consent law and license suspension for refusal." },
  { state: "VT", category: "Environmental Laws", title: "Environmental Protections", description: "Vermont has strong environmental laws affecting traffic.", details: "Vermont environmental laws may affect vehicle inspections and emissions requirements." },
  { state: "VT", category: "Privacy Rights", title: "Data Privacy", description: "Vermont has comprehensive data privacy laws.", details: "Vermont Data Privacy Act provides consumer protection rights including police interactions." },
  { state: "VT", category: "Firearm Laws", title: "Universal Background Checks", description: "Vermont requires background checks for firearm sales.", details: "Vermont requires background checks for most firearm sales with specific exemptions." },
  { state: "VT", category: "Traffic Laws", title: "Distracted Driving", description: "Vermont prohibits handheld device use while driving.", details: "Vermont bans handheld phone use and texting while driving with specific enforcement." },

  // Virginia - Complete 10 rights
  { state: "VA", category: "Traffic Stops", title: "Stop and Identify", description: "Virginia requires identification during lawful stops.", details: "Virginia Code 19.2-83 requires providing identification when lawfully detained by police." },
  { state: "VA", category: "Recording Rights", title: "Recording Police", description: "Virginia allows recording police in public.", details: "First Amendment protects recording police performing duties in public spaces in Virginia." },
  { state: "VA", category: "Search and Seizure", title: "Vehicle Searches", description: "Probable cause required for vehicle searches.", details: "Virginia follows federal Fourth Amendment standards for vehicle searches and seizures." },
  { state: "VA", category: "Police Accountability", title: "DCJS Oversight", description: "Virginia Department of Criminal Justice Services oversight.", details: "File complaints with local agencies and Virginia Department of Criminal Justice Services." },
  { state: "VA", category: "State-Specific Laws", title: "Red Flag Laws", description: "Virginia has extreme risk protection orders.", details: "Virginia Code 19.2-152.13 allows temporary removal of firearms from individuals deemed dangerous." },
  { state: "VA", category: "DUI Laws", title: "DUI Penalties", description: "Virginia has strict DUI laws.", details: "Virginia has 0.08% BAC limit with enhanced penalties for high BAC and repeat offenses." },
  { state: "VA", category: "Traffic Laws", title: "Reckless Driving", description: "Virginia has broad reckless driving statute.", details: "Virginia Code 46.2-852 defines reckless driving broadly, including speeds over 80 mph." },
  { state: "VA", category: "Firearm Laws", title: "Concealed Carry", description: "Virginia concealed handgun permit requirements.", details: "Virginia Code 18.2-308 requires permits for concealed carry with training requirements." },
  { state: "VA", category: "Drug Laws", title: "Marijuana Decriminalization", description: "Virginia has decriminalized small amounts of marijuana.", details: "Virginia allows adult possession of up to 1 oz marijuana with restrictions on public use." },
  { state: "VA", category: "Privacy Rights", title: "Consent Requirements", description: "Clear consent required for searches.", details: "Virginia requires voluntary, knowing consent for searches. You can refuse and withdraw consent." },

  // Washington State - Complete 10 rights
  { state: "WA", category: "DUI Laws", title: "DUI Enforcement", description: "Washington has strict DUI laws and enforcement.", details: "BAC limit 0.08% with enhanced penalties for high BAC. Implied consent law requires testing compliance." },
  { state: "WA", category: "Traffic Laws", title: "Distracted Driving", description: "Washington prohibits handheld device use while driving.", details: "RCW 46.61.5249 prohibits handheld phone use and texting while driving with strict enforcement." },
  { state: "WA", category: "Use of Force", title: "Police Use of Force Reform", description: "Washington enacted police accountability reforms.", details: "New laws limit police use of force and require de-escalation under legislative reforms." },
  { state: "WA", category: "Environmental Laws", title: "Vehicle Emissions", description: "Washington has strict vehicle emission standards.", details: "Enhanced vehicle emission testing requirements in certain counties for environmental protection." },
  { state: "WA", category: "Privacy Rights", title: "Data Privacy", description: "Washington has strong data privacy protections.", details: "Washington Privacy Act provides consumer data protection rights including during police interactions." },

  // West Virginia - Complete 10 rights
  { state: "WV", category: "Traffic Stops", title: "Stop and Identify", description: "West Virginia requires identification during lawful stops.", details: "WV Code 61-5-17 requires providing identification when lawfully detained by police officers." },
  { state: "WV", category: "Recording Rights", title: "Recording Police", description: "West Virginia allows recording police in public.", details: "First Amendment protects recording police performing their duties in public spaces." },
  { state: "WV", category: "Search and Seizure", title: "Search Protections", description: "West Virginia follows Fourth Amendment standards.", details: "WV Constitution Article III, Section 6 provides search and seizure protections." },
  { state: "WV", category: "Police Accountability", title: "Training Academy", description: "West Virginia State Police Academy oversight.", details: "File complaints with local agencies and West Virginia State Police Academy training division." },
  { state: "WV", category: "State-Specific Laws", title: "Constitutional Carry", description: "West Virginia allows constitutional carry.", details: "WV Code 61-7-3 allows carrying concealed deadly weapons without permit for eligible persons." },
  { state: "WV", category: "DUI Laws", title: "DUI Penalties", description: "West Virginia DUI laws and enforcement.", details: "WV has 0.08% BAC limit with implied consent requirements and license suspension for refusal." },
  { state: "WV", category: "Traffic Laws", title: "Move Over Law", description: "West Virginia requires moving over for emergency vehicles.", details: "WV Code 17C-7-1 requires drivers to move over or slow down for stopped emergency vehicles." },
  { state: "WV", category: "Drug Laws", title: "Controlled Substances", description: "West Virginia drug possession laws.", details: "WV Code 60A governs controlled substance possession with specific penalty structures." },
  { state: "WV", category: "Firearm Laws", title: "Firearm Rights", description: "West Virginia has strong Second Amendment protections.", details: "WV Constitution Article III, Section 22 provides strong right to keep and bear arms." },
  { state: "WV", category: "Privacy Rights", title: "Consent to Search", description: "Right to refuse consent for searches.", details: "You can refuse consent to search and should clearly state your refusal to officers." },

  // Wisconsin - Complete 10 rights
  { state: "WI", category: "Traffic Stops", title: "Stop and Identify", description: "Wisconsin requires identification during lawful detention.", details: "Wisconsin Statute 968.24 requires providing identification when lawfully detained by police." },
  { state: "WI", category: "Recording Rights", title: "Recording Police", description: "Wisconsin allows recording police in public.", details: "First Amendment protects recording police performing duties in public spaces in Wisconsin." },
  { state: "WI", category: "Search and Seizure", title: "Vehicle Searches", description: "Probable cause required for vehicle searches.", details: "Wisconsin follows federal Fourth Amendment standards for vehicle searches and seizures." },
  { state: "WI", category: "Police Accountability", title: "Training Board", description: "Wisconsin Law Enforcement Standards Board oversight.", details: "File complaints with local agencies and Wisconsin Law Enforcement Standards Board." },
  { state: "WI", category: "State-Specific Laws", title: "Castle Doctrine", description: "Wisconsin has Castle Doctrine protections.", details: "Wisconsin Statute 939.48 provides Castle Doctrine and Stand Your Ground protections." },
  { state: "WI", category: "DUI Laws", title: "OWI Laws", description: "Wisconsin Operating While Intoxicated laws.", details: "Wisconsin has 0.08% BAC limit with progressive penalties for multiple OWI offenses." },
  { state: "WI", category: "Traffic Laws", title: "Move Over Law", description: "Wisconsin requires moving over for emergency vehicles.", details: "Wisconsin Statute 346.072 requires drivers to move over for stopped emergency vehicles." },
  { state: "WI", category: "Firearm Laws", title: "Concealed Carry", description: "Wisconsin concealed carry license requirements.", details: "Wisconsin Statute 175.60 requires licenses for concealed carry with training requirements." },
  { state: "WI", category: "Drug Laws", title: "Controlled Substances", description: "Wisconsin drug possession penalties.", details: "Wisconsin Statute Chapter 961 governs controlled substance possession and penalties." },
  { state: "WI", category: "Privacy Rights", title: "Search Consent", description: "Voluntary consent required for searches.", details: "Wisconsin requires clear, voluntary consent for searches. You can refuse and withdraw consent." },

  // Wyoming - Complete 10 rights
  { state: "WY", category: "Traffic Stops", title: "Stop and Identify", description: "Wyoming requires identification during lawful stops.", details: "Wyoming Statute 6-5-303 requires providing identification when lawfully detained by police." },
  { state: "WY", category: "Recording Rights", title: "Recording Police", description: "Wyoming allows recording police in public.", details: "First Amendment protects recording police performing their duties in public spaces." },
  { state: "WY", category: "Search and Seizure", title: "Search Protections", description: "Wyoming follows Fourth Amendment standards.", details: "Wyoming Constitution Article 1, Section 4 provides search and seizure protections." },
  { state: "WY", category: "Police Accountability", title: "POST Board", description: "Wyoming Peace Officer Standards and Training Board.", details: "File complaints with local agencies and Wyoming Peace Officer Standards and Training Board." },
  { state: "WY", category: "State-Specific Laws", title: "Constitutional Carry", description: "Wyoming allows constitutional carry of firearms.", details: "Wyoming Statute 6-8-104 allows carrying concealed deadly weapons without permit." },
  { state: "WY", category: "DUI Laws", title: "DUI Enforcement", description: "Wyoming DUI laws and penalties.", details: "Wyoming has 0.08% BAC limit with implied consent law and administrative license suspension." },
  { state: "WY", category: "Traffic Laws", title: "Speed Limits", description: "Wyoming has specific speed limit laws.", details: "Wyoming has 80 mph speed limits on interstates with strict enforcement in construction zones." },
  { state: "WY", category: "Firearm Laws", title: "Firearm Rights", description: "Wyoming has strong Second Amendment protections.", details: "Wyoming Constitution Article 1, Section 24 provides strong right to keep and bear arms." },
  { state: "WY", category: "Drug Laws", title: "Controlled Substances", description: "Wyoming drug possession laws.", details: "Wyoming Statute Title 35 Chapter 7 governs controlled substance possession and penalties." },
  { state: "WY", category: "Privacy Rights", title: "Vehicle Privacy", description: "Protection against unreasonable vehicle searches.", details: "Wyoming constitution and federal law protect against unreasonable searches of vehicles." },

  // Washington DC - Complete 10 rights
  { state: "DC", category: "Traffic Stops", title: "Stop and Identify", description: "DC requires identification during lawful stops.", details: "DC Code 22-4504 requires providing identification when lawfully detained by police." },
  { state: "DC", category: "Recording Rights", title: "Recording Police", description: "DC strongly protects recording police.", details: "DC has strong First Amendment protections for recording police performing duties." },
  { state: "DC", category: "Search and Seizure", title: "Vehicle Searches", description: "Probable cause required for vehicle searches.", details: "DC follows federal Fourth Amendment standards for vehicle searches and seizures." },
  { state: "DC", category: "Police Accountability", title: "OPC Oversight", description: "DC Office of Police Complaints provides oversight.", details: "File complaints with MPD and the independent Office of Police Complaints." },
  { state: "DC", category: "State-Specific Laws", title: "Gun Control", description: "DC has strict firearm regulations.", details: "DC has comprehensive gun control laws requiring registration and permits for firearms." },
  { state: "DC", category: "DUI Laws", title: "DUI Enforcement", description: "DC has strict DUI laws.", details: "DC has 0.08% BAC limit with enhanced penalties and administrative license suspension." },
  { state: "DC", category: "Traffic Laws", title: "Vision Zero", description: "DC has aggressive traffic safety enforcement.", details: "DC Vision Zero initiative includes automated enforcement and traffic safety measures." },
  { state: "DC", category: "Drug Laws", title: "Cannabis Decriminalization", description: "DC has decriminalized marijuana possession.", details: "DC allows possession of small amounts of marijuana but prohibits public consumption and sales." },
  { state: "DC", category: "Privacy Rights", title: "Data Privacy", description: "DC has consumer privacy protections.", details: "DC Consumer Privacy Amendment Act provides data protection rights." },
  { state: "DC", category: "Civil Rights", title: "Anti-Discrimination", description: "DC has comprehensive anti-discrimination laws.", details: "DC Human Rights Act provides broad protections against discrimination during police interactions." }
];

export async function seedComplete50StateExpansion() {
  console.log("Starting complete 50-state legal expansion...");
  
  try {
    for (const legalRight of COMPLETE_50_STATE_EXPANSION) {
      await db.insert(legalRights).values(legalRight).onConflictDoNothing();
    }
    
    console.log(`Successfully seeded ${COMPLETE_50_STATE_EXPANSION.length} additional legal rights`);
    return true;
  } catch (error) {
    console.error("Error seeding complete 50-state expansion:", error);
    throw error;
  }
}