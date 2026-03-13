import { db } from "./db";
import { legalRights } from "@shared/schema";

// Comprehensive 50 States + DC Legal Rights Database
export const ALL_STATES_LEGAL_DATA = [
  // Alabama
  { state: "AL", category: "Traffic Stops", title: "Identification Requirements", description: "Alabama requires identification during lawful detention.", details: "Under Alabama law, you must provide identification when lawfully detained. You may DISPLAY your ID rather than physically surrender it to the officer. Failure to identify can result in arrest under obstruction statutes." },
  { state: "AL", category: "Traffic Stops", title: "ID Display vs. Surrender Rights", description: "You can display your ID without physically handing it over.", details: "CRITICAL: In Alabama, when asked for ID, you can hold up your identification for the officer to see and read without physically surrendering it. This prevents ID retention and protects against officers walking away with your identification." },
  { state: "AL", category: "Recording Rights", title: "Public Recording Laws", description: "Alabama follows one-party consent for recordings.", details: "You can record police in public spaces. Alabama is a one-party consent state for audio recordings." },
  { state: "AL", category: "Search and Seizure", title: "Vehicle Search Protections", description: "Police need probable cause or consent for vehicle searches.", details: "Alabama follows federal Fourth Amendment standards. Officers need probable cause, a warrant, or consent to search your vehicle." },
  { state: "AL", category: "Police Accountability", title: "Complaint Procedures", description: "Alabama has state-level police oversight mechanisms.", details: "File complaints with local departments and the Alabama Peace Officers Standards and Training Commission." },
  { state: "AL", category: "State-Specific Laws", title: "Stand Your Ground", description: "Alabama has Stand Your Ground laws.", details: "Alabama Code Section 13A-3-23 provides Stand Your Ground protections with no duty to retreat in places you have a right to be." },

  // Alaska
  { state: "AK", category: "Traffic Stops", title: "Miranda Rights Application", description: "Miranda rights required for custodial interrogation.", details: "Alaska follows federal Miranda standards. Rights must be read before custodial interrogation." },
  { state: "AK", category: "Recording Rights", title: "Photography Rights", description: "Alaska protects recording of police in public.", details: "You have the right to record police performing duties in public spaces under First Amendment protections." },
  { state: "AK", category: "Search and Seizure", title: "Consent Requirements", description: "Clear, voluntary consent required for searches.", details: "Alaska requires unambiguous consent for searches. You can withdraw consent at any time." },
  { state: "AK", category: "Police Accountability", title: "Oversight Bodies", description: "Alaska has limited police oversight mechanisms.", details: "Complaints handled primarily at municipal level with some state oversight through Department of Public Safety." },
  { state: "AK", category: "State-Specific Laws", title: "Firearm Rights", description: "Alaska has strong Second Amendment protections.", details: "Alaska has constitutional carry laws and strong protections for lawful firearm possession." },

  // Arizona
  { state: "AZ", category: "Traffic Stops", title: "Stop and Identify", description: "Arizona requires identification during investigative stops.", details: "Arizona Revised Statutes 13-2412 requires providing identification when lawfully detained by police. You may DISPLAY your ID rather than physically surrender it to the officer." },
  { state: "AZ", category: "Traffic Stops", title: "ID Display vs. Surrender Rights", description: "You can display your ID without physically handing it over.", details: "CRITICAL: In Arizona, when asked for ID during a lawful stop, you can hold up your identification for the officer to see and read without physically surrendering it. This prevents ID retention and protects against officers walking away with your identification." },
  { state: "AZ", category: "Recording Rights", title: "Public Recording", description: "Arizona protects recording police in public spaces.", details: "You can record police officers performing their duties in public. Keep reasonable distance and don't interfere." },
  { state: "AZ", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Arizona follows federal standards requiring probable cause, warrant, or consent for vehicle searches." },
  { state: "AZ", category: "Police Accountability", title: "Complaint Process", description: "Arizona has municipal and county complaint systems.", details: "File complaints with local law enforcement agencies and the Arizona Peace Officer Standards and Training Board." },
  { state: "AZ", category: "State-Specific Laws", title: "Immigration Enforcement", description: "Arizona has specific immigration-related police powers.", details: "SB 1070 and related laws give police authority to check immigration status during lawful stops." },

  // Arkansas
  { state: "AR", category: "Traffic Stops", title: "Identification Laws", description: "Arkansas requires identification when lawfully arrested.", details: "Arkansas Code 5-54-120 requires providing identification when arrested or lawfully detained." },
  { state: "AR", category: "Recording Rights", title: "Recording Police", description: "Arkansas allows recording police in public.", details: "First Amendment protects your right to record police performing duties in public spaces." },
  { state: "AR", category: "Search and Seizure", title: "Search Protections", description: "Fourth Amendment protections apply in Arkansas.", details: "Police need probable cause, warrant, or consent to search. You have right to refuse consent." },
  { state: "AR", category: "Police Accountability", title: "State Oversight", description: "Arkansas Commission on Law Enforcement Standards.", details: "Complaints can be filed with local agencies and the Arkansas Commission on Law Enforcement Standards and Training." },
  { state: "AR", category: "State-Specific Laws", title: "Castle Doctrine", description: "Arkansas has strong Castle Doctrine laws.", details: "Arkansas Code 5-2-620 provides strong protection for defending your home and property." },

  // California (Enhanced)
  { state: "CA", category: "Traffic Stops", title: "Right to Remain Silent", description: "Fifth Amendment protections during traffic stops.", details: "You must provide license, registration, and insurance but are not required to answer questions about your activities. In California, you may DISPLAY your ID rather than physically surrender it to the officer." },
  { state: "CA", category: "Traffic Stops", title: "ID Display vs. Surrender Rights", description: "You can display your ID without physically handing it over.", details: "CRITICAL: In California, when asked for ID during a traffic stop, you can hold up your identification for the officer to see and read without physically surrendering it. This prevents ID retention and protects against officers walking away with your identification. Simply say 'I'm displaying my ID for you to see.'" },
  { state: "CA", category: "Recording Rights", title: "Police Recording Rights", description: "Strong protections for recording police.", details: "California Penal Code 148 protects recording police. You can record from reasonable distance without interfering." },
  { state: "CA", category: "Search and Seizure", title: "Vehicle Search Limits", description: "Strict probable cause requirements.", details: "California requires clear probable cause or consent for vehicle searches. Search incident to arrest has limited scope." },
  { state: "CA", category: "Police Accountability", title: "CPRA and Local Oversight", description: "Strong civilian oversight mechanisms.", details: "California has Civilian Police Review Agencies and SB 1421 transparency requirements." },
  { state: "CA", category: "State-Specific Laws", title: "Sanctuary State Laws", description: "Limited cooperation with immigration enforcement.", details: "SB 54 limits local law enforcement cooperation with federal immigration authorities." },

  // Colorado
  { state: "CO", category: "Traffic Stops", title: "Stop and Identify", description: "Colorado requires identification during lawful detention.", details: "Colorado Revised Statutes 16-3-103 requires identification when lawfully detained by police." },
  { state: "CO", category: "Recording Rights", title: "Recording Rights", description: "Colorado protects recording police in public.", details: "You have the right to record police performing their duties in public spaces." },
  { state: "CO", category: "Search and Seizure", title: "Search Protections", description: "Probable cause required for searches.", details: "Colorado follows federal Fourth Amendment standards for searches and seizures." },
  { state: "CO", category: "Police Accountability", title: "POST Board", description: "Colorado Peace Officers Standards and Training.", details: "Complaints handled by local agencies and the Colorado Peace Officers Standards and Training Board." },
  { state: "CO", category: "State-Specific Laws", title: "Cannabis Laws", description: "Legal cannabis possession laws.", details: "Colorado allows adult cannabis possession but prohibits public consumption and impaired driving." },

  // Connecticut
  { state: "CT", category: "Traffic Stops", title: "Miranda Requirements", description: "Miranda rights for custodial interrogation.", details: "Connecticut follows federal Miranda standards for custodial interrogation during traffic stops." },
  { state: "CT", category: "Recording Rights", title: "Public Recording", description: "Connecticut allows recording police publicly.", details: "First Amendment protects recording police performing duties in public spaces." },
  { state: "CT", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Connecticut requires probable cause, warrant, or consent for vehicle searches following federal standards." },
  { state: "CT", category: "Police Accountability", title: "State Oversight", description: "Connecticut Police Officer Standards and Training Council.", details: "File complaints with local departments and the Connecticut Police Officer Standards and Training Council." },
  { state: "CT", category: "State-Specific Laws", title: "Assault Weapon Laws", description: "Connecticut has strict assault weapon regulations.", details: "Connecticut General Statutes Chapter 943 regulates assault weapons and high-capacity magazines with specific requirements." },

  // Delaware
  { state: "DE", category: "Traffic Stops", title: "Stop and Identify", description: "Delaware requires identification during lawful stops.", details: "Delaware Code Title 11, Section 1902 requires providing identification when lawfully detained by police." },
  { state: "DE", category: "Recording Rights", title: "Police Recording", description: "Delaware protects recording police in public.", details: "You can record police officers performing their duties in public spaces under First Amendment protection." },
  { state: "DE", category: "Search and Seizure", title: "Search Protections", description: "Fourth Amendment search protections apply.", details: "Delaware follows federal search and seizure standards requiring probable cause, warrant, or consent." },
  { state: "DE", category: "Police Accountability", title: "POST Council", description: "Delaware Police Officers Standards and Training Council.", details: "Complaints handled by local agencies and the Delaware Police Officers Standards and Training Council." },
  { state: "DE", category: "State-Specific Laws", title: "Deadly Force Laws", description: "Delaware has specific deadly force statutes.", details: "Delaware Code Title 11, Section 464 governs use of deadly force in defense of person and property." },
  { state: "CT", category: "Search and Seizure", title: "Consent Laws", description: "Voluntary consent required for searches.", details: "Connecticut requires clear, voluntary consent for searches. You can refuse and withdraw consent." },
  { state: "CT", category: "Police Accountability", title: "Police Officer Standards", description: "Connecticut Police Officer Standards and Training Council.", details: "File complaints with local departments and the Police Officer Standards and Training Council." },
  { state: "CT", category: "State-Specific Laws", title: "Gun Laws", description: "Connecticut has strict firearm regulations.", details: "Connecticut requires permits for handgun possession and has assault weapon restrictions." },

  // Delaware
  { state: "DE", category: "Traffic Stops", title: "Identification Requirements", description: "Delaware stop and identify laws.", details: "Delaware Code Title 11, Section 1902 requires identification when lawfully detained." },
  { state: "DE", category: "Recording Rights", title: "Recording Police", description: "Delaware protects recording in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "DE", category: "Search and Seizure", title: "Search Standards", description: "Fourth Amendment protections apply.", details: "Delaware follows federal standards requiring probable cause or consent for searches." },
  { state: "DE", category: "Police Accountability", title: "Training Council", description: "Delaware Council on Police Training.", details: "Complaints can be filed with the Delaware Council on Police Training and local agencies." },
  { state: "DE", category: "State-Specific Laws", title: "DUI Laws", description: "Delaware implied consent laws.", details: "Delaware has implied consent laws for chemical testing during DUI investigations." },

  // Florida (Enhanced)
  { state: "FL", category: "Traffic Stops", title: "Miranda Rights Application", description: "Miranda required for custodial interrogation.", details: "Florida follows federal Miranda requirements. Simple traffic stops typically don't require Miranda warnings." },
  { state: "FL", category: "Recording Rights", title: "Recording Police", description: "Strong First Amendment protections.", details: "Florida courts consistently uphold the right to record police in public spaces." },
  { state: "FL", category: "Search and Seizure", title: "Consent Requirements", description: "Clear consent required for searches.", details: "Florida requires voluntary, intelligent consent for searches. You can clearly refuse consent." },
  { state: "FL", category: "Police Accountability", title: "FDLE Oversight", description: "Florida Department of Law Enforcement oversight.", details: "Complaints handled by local agencies and Florida Department of Law Enforcement." },
  { state: "FL", category: "State-Specific Laws", title: "Stand Your Ground", description: "Strong Stand Your Ground laws.", details: "Florida Statute 776.013 provides broad Stand Your Ground protections with immunity provisions." },

  // Georgia
  { state: "GA", category: "Traffic Stops", title: "Stop and Identify", description: "Georgia requires identification during lawful stops.", details: "Georgia Code 16-11-36 requires providing identification when lawfully detained." },
  { state: "GA", category: "Recording Rights", title: "Public Recording", description: "Georgia allows recording police in public.", details: "You have the right to record police performing duties in public spaces under First Amendment." },
  { state: "GA", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Georgia follows federal Fourth Amendment standards for vehicle searches." },
  { state: "GA", category: "Police Accountability", title: "POST Council", description: "Georgia Peace Officer Standards and Training Council.", details: "File complaints with local agencies and the Georgia POST Council." },
  { state: "GA", category: "State-Specific Laws", title: "Citizens Arrest", description: "Georgia citizen's arrest laws.", details: "Georgia Code 17-4-60 allows citizen's arrest under specific circumstances." },

  // Hawaii
  { state: "HI", category: "Traffic Stops", title: "Miranda Rights", description: "Miranda required for custodial interrogation.", details: "Hawaii follows federal Miranda standards for custodial interrogation." },
  { state: "HI", category: "Recording Rights", title: "Recording Police", description: "Hawaii protects recording in public spaces.", details: "First Amendment protects your right to record police performing duties publicly." },
  { state: "HI", category: "Search and Seizure", title: "Search Protections", description: "Fourth Amendment and Hawaii Constitution protections.", details: "Hawaii Constitution Article I, Section 7 provides strong search and seizure protections." },
  { state: "HI", category: "Police Accountability", title: "Standards Board", description: "Hawaii Law Enforcement Standards Board.", details: "Complaints filed with local departments and the Law Enforcement Standards Board." },
  { state: "HI", category: "State-Specific Laws", title: "Aloha Spirit Law", description: "Hawaii promotes peaceful conflict resolution.", details: "Hawaii Revised Statutes promote the Aloha Spirit in all interactions, including with law enforcement." },

  // Idaho
  { state: "ID", category: "Traffic Stops", title: "Identification Laws", description: "Idaho stop and identify requirements.", details: "Idaho Code 19-612 requires identification when lawfully detained by police." },
  { state: "ID", category: "Recording Rights", title: "Public Recording", description: "Idaho allows recording police in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "ID", category: "Search and Seizure", title: "Consent Requirements", description: "Voluntary consent required for searches.", details: "Idaho requires clear, voluntary consent for searches without probable cause or warrant." },
  { state: "ID", category: "Police Accountability", title: "POST Academy", description: "Idaho Peace Officer Standards and Training.", details: "Complaints handled by local agencies and Idaho POST Academy." },
  { state: "ID", category: "State-Specific Laws", title: "Constitutional Carry", description: "Idaho allows constitutional carry.", details: "Idaho allows concealed carry without permit for residents over 18." },

  // Illinois
  { state: "IL", category: "Traffic Stops", title: "Stop and Frisk Laws", description: "Reasonable suspicion required for stops.", details: "Illinois follows Terry stop standards requiring reasonable suspicion for investigative stops." },
  { state: "IL", category: "Recording Rights", title: "Recording Police", description: "Illinois strongly protects recording rights.", details: "Illinois specifically protects recording police under the Freedom of Information Act." },
  { state: "IL", category: "Search and Seizure", title: "Vehicle Search Standards", description: "Probable cause required for vehicle searches.", details: "Illinois follows federal Fourth Amendment standards for vehicle searches." },
  { state: "IL", category: "Police Accountability", title: "Training Board", description: "Illinois Law Enforcement Training and Standards Board.", details: "File complaints with local agencies and the Illinois Law Enforcement Training and Standards Board." },
  { state: "IL", category: "State-Specific Laws", title: "FOID Requirements", description: "Firearm Owner's Identification Card required.", details: "Illinois requires FOID card for firearm and ammunition possession." },

  // Indiana
  { state: "IN", category: "Traffic Stops", title: "Identification Requirements", description: "Indiana stop and identify laws.", details: "Indiana Code 34-28-5-3.5 requires identification when lawfully detained." },
  { state: "IN", category: "Recording Rights", title: "Public Recording", description: "Indiana allows recording police in public.", details: "You have the right to record police performing duties in public spaces." },
  { state: "IN", category: "Search and Seizure", title: "Search Protections", description: "Fourth Amendment protections apply.", details: "Indiana follows federal standards for searches requiring probable cause or consent." },
  { state: "IN", category: "Police Accountability", title: "Training Board", description: "Indiana Law Enforcement Training Board.", details: "Complaints filed with local departments and the Indiana Law Enforcement Training Board." },
  { state: "IN", category: "State-Specific Laws", title: "Stand Your Ground", description: "Indiana has Stand Your Ground laws.", details: "Indiana Code 35-41-3-2 provides Stand Your Ground protections." },

  // Iowa
  { state: "IA", category: "Traffic Stops", title: "Miranda Requirements", description: "Miranda rights for custodial interrogation.", details: "Iowa follows federal Miranda standards for custodial interrogation." },
  { state: "IA", category: "Recording Rights", title: "Recording Police", description: "Iowa protects recording in public spaces.", details: "First Amendment protects recording police performing duties in public." },
  { state: "IA", category: "Search and Seizure", title: "Consent Laws", description: "Voluntary consent required for searches.", details: "Iowa requires clear, voluntary consent for searches without probable cause." },
  { state: "IA", category: "Police Accountability", title: "Training Council", description: "Iowa Law Enforcement Academy.", details: "Complaints handled by local agencies and the Iowa Law Enforcement Academy." },
  { state: "IA", category: "State-Specific Laws", title: "Shall Issue", description: "Iowa is a shall-issue state for concealed carry.", details: "Iowa issues concealed carry permits to qualified applicants." },

  // Kansas
  { state: "KS", category: "Traffic Stops", title: "Stop and Identify", description: "Kansas requires identification during detention.", details: "Kansas Statutes 22-2402 requires identification when lawfully detained." },
  { state: "KS", category: "Recording Rights", title: "Public Recording", description: "Kansas allows recording police in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "KS", category: "Search and Seizure", title: "Search Standards", description: "Probable cause required for searches.", details: "Kansas follows federal Fourth Amendment standards for searches and seizures." },
  { state: "KS", category: "Police Accountability", title: "Training Commission", description: "Kansas Commission on Peace Officers' Standards and Training.", details: "File complaints with local agencies and Kansas POST Commission." },
  { state: "KS", category: "State-Specific Laws", title: "Constitutional Carry", description: "Kansas allows constitutional carry.", details: "Kansas allows concealed carry without permit for residents 21 and older." },

  // Kentucky
  { state: "KY", category: "Traffic Stops", title: "Identification Laws", description: "Kentucky stop and identify requirements.", details: "Kentucky requires identification when lawfully arrested or detained." },
  { state: "KY", category: "Recording Rights", title: "Recording Police", description: "Kentucky protects recording in public spaces.", details: "First Amendment protects your right to record police performing duties publicly." },
  { state: "KY", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Kentucky follows federal standards requiring probable cause or consent for vehicle searches." },
  { state: "KY", category: "Police Accountability", title: "Training Council", description: "Kentucky Law Enforcement Council.", details: "Complaints filed with local departments and the Kentucky Law Enforcement Council." },
  { state: "KY", category: "State-Specific Laws", title: "Stand Your Ground", description: "Kentucky has Stand Your Ground laws.", details: "Kentucky Revised Statutes 503.055 provides Stand Your Ground protections." },

  // Louisiana
  { state: "LA", category: "Traffic Stops", title: "Stop and Identify", description: "Louisiana requires identification during lawful stops.", details: "Louisiana Code of Criminal Procedure Article 215.1 requires identification when detained." },
  { state: "LA", category: "Recording Rights", title: "Public Recording", description: "Louisiana allows recording police in public.", details: "You have the right to record police performing duties in public spaces." },
  { state: "LA", category: "Search and Seizure", title: "Search Protections", description: "Fourth Amendment protections apply.", details: "Louisiana follows federal standards for searches requiring probable cause or consent." },
  { state: "LA", category: "Police Accountability", title: "POST Council", description: "Louisiana Peace Officer Standards and Training Council.", details: "File complaints with local agencies and Louisiana POST Council." },
  { state: "LA", category: "State-Specific Laws", title: "Stand Your Ground", description: "Louisiana has Stand Your Ground laws.", details: "Louisiana Revised Statutes 14:19 provides Stand Your Ground protections." },

  // Maine
  { state: "ME", category: "Traffic Stops", title: "Miranda Rights", description: "Miranda required for custodial interrogation.", details: "Maine follows federal Miranda standards for custodial interrogation." },
  { state: "ME", category: "Recording Rights", title: "Recording Police", description: "Maine protects recording in public spaces.", details: "First Amendment protects recording police performing duties in public." },
  { state: "ME", category: "Search and Seizure", title: "Consent Requirements", description: "Clear consent required for searches.", details: "Maine requires voluntary, intelligent consent for searches without warrant or probable cause." },
  { state: "ME", category: "Police Accountability", title: "Training Academy", description: "Maine Criminal Justice Academy.", details: "Complaints handled by local agencies and the Maine Criminal Justice Academy." },
  { state: "ME", category: "State-Specific Laws", title: "Constitutional Carry", description: "Maine allows constitutional carry.", details: "Maine allows concealed carry without permit for residents 21 and older." },

  // Maryland
  { state: "MD", category: "Traffic Stops", title: "Stop and Frisk Laws", description: "Reasonable suspicion required for stops.", details: "Maryland follows Terry stop standards requiring reasonable suspicion." },
  { state: "MD", category: "Recording Rights", title: "Recording Police", description: "Maryland strongly protects recording rights.", details: "Maryland courts have strongly upheld the right to record police in public." },
  { state: "MD", category: "Search and Seizure", title: "Vehicle Search Standards", description: "Probable cause required for vehicle searches.", details: "Maryland follows federal Fourth Amendment standards for vehicle searches." },
  { state: "MD", category: "Police Accountability", title: "Training Commission", description: "Maryland Police Training and Standards Commission.", details: "File complaints with local agencies and the Maryland Police Training Commission." },
  { state: "MD", category: "State-Specific Laws", title: "Handgun Permit", description: "Maryland requires permits for handgun possession.", details: "Maryland has strict handgun licensing requirements and may-issue concealed carry." },

  // Massachusetts
  { state: "MA", category: "Traffic Stops", title: "Miranda Requirements", description: "Miranda rights for custodial interrogation.", details: "Massachusetts follows federal Miranda standards with some enhanced state protections." },
  { state: "MA", category: "Recording Rights", title: "Public Recording", description: "Massachusetts allows recording police in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "MA", category: "Search and Seizure", title: "Search Protections", description: "Strong Fourth Amendment and state protections.", details: "Massachusetts Constitution Article XIV provides enhanced search and seizure protections." },
  { state: "MA", category: "Police Accountability", title: "POST Commission", description: "Massachusetts Peace Officer Standards and Training Commission.", details: "Complaints filed with local departments and POST Commission." },
  { state: "MA", category: "State-Specific Laws", title: "Gun Laws", description: "Massachusetts has strict firearm regulations.", details: "Massachusetts requires licenses for firearm possession and has assault weapon restrictions." },

  // Michigan
  { state: "MI", category: "Traffic Stops", title: "Identification Laws", description: "Michigan stop and identify requirements.", details: "Michigan Compiled Laws 780.655 requires identification when lawfully detained." },
  { state: "MI", category: "Recording Rights", title: "Recording Police", description: "Michigan protects recording in public spaces.", details: "First Amendment protects your right to record police performing duties publicly." },
  { state: "MI", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Michigan follows federal standards requiring probable cause or consent for searches." },
  { state: "MI", category: "Police Accountability", title: "Training Council", description: "Michigan Commission on Law Enforcement Standards.", details: "File complaints with local agencies and Michigan COLES." },
  { state: "MI", category: "State-Specific Laws", title: "Castle Doctrine", description: "Michigan has Castle Doctrine laws.", details: "Michigan Compiled Laws 780.972 provides strong home defense protections." },

  // Minnesota
  { state: "MN", category: "Traffic Stops", title: "Stop and Identify", description: "Minnesota requires identification during detention.", details: "Minnesota Statutes 629.72 requires identification when lawfully detained." },
  { state: "MN", category: "Recording Rights", title: "Public Recording", description: "Minnesota allows recording police in public.", details: "You have the right to record police performing duties in public spaces." },
  { state: "MN", category: "Search and Seizure", title: "Search Standards", description: "Probable cause required for searches.", details: "Minnesota follows federal Fourth Amendment standards for searches." },
  { state: "MN", category: "Police Accountability", title: "POST Board", description: "Minnesota Peace Officer Standards and Training Board.", details: "Complaints handled by local agencies and Minnesota POST Board." },
  { state: "MN", category: "State-Specific Laws", title: "Shall Issue", description: "Minnesota is shall-issue for concealed carry.", details: "Minnesota issues concealed carry permits to qualified applicants." },

  // Mississippi
  { state: "MS", category: "Traffic Stops", title: "Identification Requirements", description: "Mississippi stop and identify laws.", details: "Mississippi requires identification when lawfully arrested or detained." },
  { state: "MS", category: "Recording Rights", title: "Recording Police", description: "Mississippi protects recording in public spaces.", details: "First Amendment protects recording police performing duties in public." },
  { state: "MS", category: "Search and Seizure", title: "Consent Laws", description: "Voluntary consent required for searches.", details: "Mississippi requires clear, voluntary consent for searches without probable cause." },
  { state: "MS", category: "Police Accountability", title: "Training Academy", description: "Mississippi Law Enforcement Officers Training Academy.", details: "File complaints with local departments and the Mississippi Training Academy." },
  { state: "MS", category: "State-Specific Laws", title: "Enhanced Castle Doctrine", description: "Mississippi has strong Castle Doctrine laws.", details: "Mississippi Code 97-3-15 provides enhanced Castle Doctrine protections." },

  // Missouri
  { state: "MO", category: "Traffic Stops", title: "Stop and Identify", description: "Missouri requires identification during lawful stops.", details: "Missouri Revised Statutes 544.193 requires identification when lawfully detained." },
  { state: "MO", category: "Recording Rights", title: "Public Recording", description: "Missouri allows recording police in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "MO", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Missouri follows federal Fourth Amendment standards for vehicle searches." },
  { state: "MO", category: "Police Accountability", title: "POST Program", description: "Missouri Peace Officer Standards and Training Program.", details: "Complaints filed with local agencies and Missouri POST Program." },
  { state: "MO", category: "State-Specific Laws", title: "Constitutional Carry", description: "Missouri allows constitutional carry.", details: "Missouri allows concealed carry without permit for residents 19 and older." },

  // Montana
  { state: "MT", category: "Traffic Stops", title: "Identification Laws", description: "Montana stop and identify requirements.", details: "Montana Code 46-5-401 requires identification when lawfully detained." },
  { state: "MT", category: "Recording Rights", title: "Recording Police", description: "Montana protects recording in public spaces.", details: "First Amendment protects your right to record police performing duties publicly." },
  { state: "MT", category: "Search and Seizure", title: "Search Protections", description: "Strong Fourth Amendment and state protections.", details: "Montana Constitution Article II, Section 11 provides enhanced search protections." },
  { state: "MT", category: "Police Accountability", title: "Training Academy", description: "Montana Law Enforcement Academy.", details: "Complaints handled by local agencies and Montana Law Enforcement Academy." },
  { state: "MT", category: "State-Specific Laws", title: "Constitutional Carry", description: "Montana allows constitutional carry.", details: "Montana allows concealed carry without permit in most areas." },

  // Nebraska
  { state: "NE", category: "Traffic Stops", title: "Miranda Rights", description: "Miranda required for custodial interrogation.", details: "Nebraska follows federal Miranda standards for custodial interrogation." },
  { state: "NE", category: "Recording Rights", title: "Public Recording", description: "Nebraska allows recording police in public.", details: "You have the right to record police performing duties in public spaces." },
  { state: "NE", category: "Search and Seizure", title: "Consent Requirements", description: "Clear consent required for searches.", details: "Nebraska requires voluntary, intelligent consent for searches without warrant." },
  { state: "NE", category: "Police Accountability", title: "Training Center", description: "Nebraska Law Enforcement Training Center.", details: "File complaints with local departments and Nebraska Training Center." },
  { state: "NE", category: "State-Specific Laws", title: "Concealed Carry", description: "Nebraska is shall-issue for concealed carry.", details: "Nebraska issues concealed handgun permits to qualified applicants." },

  // Nevada
  { state: "NV", category: "Traffic Stops", title: "Stop and Identify", description: "Nevada requires identification during detention.", details: "Nevada Revised Statutes 171.123 requires identification when lawfully detained." },
  { state: "NV", category: "Recording Rights", title: "Recording Police", description: "Nevada protects recording in public spaces.", details: "First Amendment protects recording police performing duties in public." },
  { state: "NV", category: "Search and Seizure", title: "Vehicle Search Standards", description: "Probable cause required for vehicle searches.", details: "Nevada follows federal Fourth Amendment standards for vehicle searches." },
  { state: "NV", category: "Police Accountability", title: "POST Committee", description: "Nevada Peace Officers' Standards and Training Committee.", details: "Complaints filed with local agencies and Nevada POST Committee." },
  { state: "NV", category: "State-Specific Laws", title: "Stand Your Ground", description: "Nevada has Stand Your Ground laws.", details: "Nevada Revised Statutes 200.120 provides Stand Your Ground protections." },

  // New Hampshire
  { state: "NH", category: "Traffic Stops", title: "Identification Requirements", description: "New Hampshire stop and identify laws.", details: "New Hampshire requires identification when lawfully arrested or detained." },
  { state: "NH", category: "Recording Rights", title: "Public Recording", description: "New Hampshire allows recording police in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "NH", category: "Search and Seizure", title: "Search Protections", description: "Fourth Amendment protections apply.", details: "New Hampshire follows federal standards for searches requiring probable cause or consent." },
  { state: "NH", category: "Police Accountability", title: "Police Standards", description: "New Hampshire Police Standards and Training Council.", details: "File complaints with local departments and the Police Standards Council." },
  { state: "NH", category: "State-Specific Laws", title: "Constitutional Carry", description: "New Hampshire allows constitutional carry.", details: "New Hampshire allows concealed carry without permit." },

  // New Jersey
  { state: "NJ", category: "Traffic Stops", title: "Miranda Requirements", description: "Miranda rights for custodial interrogation.", details: "New Jersey follows federal Miranda standards with some enhanced protections." },
  { state: "NJ", category: "Recording Rights", title: "Recording Police", description: "New Jersey protects recording in public spaces.", details: "First Amendment protects your right to record police performing duties publicly." },
  { state: "NJ", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "New Jersey follows federal Fourth Amendment standards for vehicle searches." },
  { state: "NJ", category: "Police Accountability", title: "Training Commission", description: "New Jersey Police Training Commission.", details: "Complaints handled by local agencies and the Police Training Commission." },
  { state: "NJ", category: "State-Specific Laws", title: "Gun Laws", description: "New Jersey has strict firearm regulations.", details: "New Jersey requires permits for firearm possession and has strict carry laws." },

  // New Mexico
  { state: "NM", category: "Traffic Stops", title: "Stop and Identify", description: "New Mexico requires identification during detention.", details: "New Mexico requires identification when lawfully detained by police." },
  { state: "NM", category: "Recording Rights", title: "Public Recording", description: "New Mexico allows recording police in public.", details: "You have the right to record police performing duties in public spaces." },
  { state: "NM", category: "Search and Seizure", title: "Search Standards", description: "Probable cause required for searches.", details: "New Mexico follows federal Fourth Amendment standards for searches." },
  { state: "NM", category: "Police Accountability", title: "Training Academy", description: "New Mexico Law Enforcement Academy.", details: "File complaints with local agencies and New Mexico Law Enforcement Academy." },
  { state: "NM", category: "State-Specific Laws", title: "Concealed Carry", description: "New Mexico is shall-issue for concealed carry.", details: "New Mexico issues concealed handgun licenses to qualified applicants." },

  // New York (Enhanced)
  { state: "NY", category: "Traffic Stops", title: "Stop and Frisk Protections", description: "Reasonable suspicion required for investigative stops.", details: "New York follows Terry v. Ohio standards requiring reasonable, articulable suspicion for stops." },
  { state: "NY", category: "Recording Rights", title: "Photography and Recording", description: "Strong protections for recording police.", details: "New York courts consistently uphold First Amendment protections for recording police in public." },
  { state: "NY", category: "Search and Seizure", title: "Vehicle Search Standards", description: "Probable cause required for vehicle searches.", details: "New York follows federal Fourth Amendment standards with some enhanced state protections." },
  { state: "NY", category: "Police Accountability", title: "DCJS Oversight", description: "Division of Criminal Justice Services oversight.", details: "Complaints filed with local agencies and New York State Division of Criminal Justice Services." },
  { state: "NY", category: "State-Specific Laws", title: "SAFE Act", description: "New York has strict firearm regulations.", details: "New York SAFE Act requires permits and has assault weapon restrictions." },

  // North Carolina
  { state: "NC", category: "Traffic Stops", title: "Identification Laws", description: "North Carolina stop and identify requirements.", details: "North Carolina requires identification when lawfully arrested or detained." },
  { state: "NC", category: "Recording Rights", title: "Recording Police", description: "North Carolina protects recording in public spaces.", details: "First Amendment protects recording police performing duties in public." },
  { state: "NC", category: "Search and Seizure", title: "Consent Laws", description: "Voluntary consent required for searches.", details: "North Carolina requires clear, voluntary consent for searches without probable cause." },
  { state: "NC", category: "Police Accountability", title: "Training Commission", description: "North Carolina Criminal Justice Education and Training Standards Commission.", details: "File complaints with local departments and the Training Standards Commission." },
  { state: "NC", category: "State-Specific Laws", title: "Stand Your Ground", description: "North Carolina has Stand Your Ground laws.", details: "North Carolina General Statutes 14-51.3 provides Stand Your Ground protections." },

  // North Dakota
  { state: "ND", category: "Traffic Stops", title: "Miranda Rights", description: "Miranda required for custodial interrogation.", details: "North Dakota follows federal Miranda standards for custodial interrogation." },
  { state: "ND", category: "Recording Rights", title: "Public Recording", description: "North Dakota allows recording police in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "ND", category: "Search and Seizure", title: "Search Protections", description: "Fourth Amendment protections apply.", details: "North Dakota follows federal standards for searches requiring probable cause or consent." },
  { state: "ND", category: "Police Accountability", title: "Training Academy", description: "North Dakota Peace Officer Standards and Training.", details: "Complaints handled by local agencies and North Dakota POST." },
  { state: "ND", category: "State-Specific Laws", title: "Constitutional Carry", description: "North Dakota allows constitutional carry.", details: "North Dakota allows concealed carry without permit for residents." },

  // Ohio
  { state: "OH", category: "Traffic Stops", title: "Stop and Identify", description: "Ohio requires identification during lawful stops.", details: "Ohio Revised Code 2921.29 requires identification when lawfully detained." },
  { state: "OH", category: "Recording Rights", title: "Recording Police", description: "Ohio protects recording in public spaces.", details: "First Amendment protects your right to record police performing duties publicly." },
  { state: "OH", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Ohio follows federal Fourth Amendment standards for vehicle searches." },
  { state: "OH", category: "Police Accountability", title: "Training Commission", description: "Ohio Peace Officer Training Commission.", details: "File complaints with local agencies and Ohio Peace Officer Training Commission." },
  { state: "OH", category: "State-Specific Laws", title: "Stand Your Ground", description: "Ohio has Stand Your Ground laws.", details: "Ohio Revised Code 2901.09 provides Stand Your Ground protections." },

  // Oklahoma
  { state: "OK", category: "Traffic Stops", title: "Identification Requirements", description: "Oklahoma stop and identify laws.", details: "Oklahoma Statutes Title 21, Section 1276 requires identification when detained." },
  { state: "OK", category: "Recording Rights", title: "Public Recording", description: "Oklahoma allows recording police in public.", details: "You have the right to record police performing duties in public spaces." },
  { state: "OK", category: "Search and Seizure", title: "Search Standards", description: "Probable cause required for searches.", details: "Oklahoma follows federal Fourth Amendment standards for searches." },
  { state: "OK", category: "Police Accountability", title: "Training Academy", description: "Oklahoma Council on Law Enforcement Education and Training.", details: "Complaints filed with local agencies and Oklahoma CLEET." },
  { state: "OK", category: "State-Specific Laws", title: "Constitutional Carry", description: "Oklahoma allows constitutional carry.", details: "Oklahoma allows concealed carry without permit for residents 21 and older." },

  // Oregon
  { state: "OR", category: "Traffic Stops", title: "Miranda Requirements", description: "Miranda rights for custodial interrogation.", details: "Oregon follows federal Miranda standards for custodial interrogation." },
  { state: "OR", category: "Recording Rights", title: "Recording Police", description: "Oregon protects recording in public spaces.", details: "First Amendment protects recording police performing duties in public." },
  { state: "OR", category: "Search and Seizure", title: "Consent Requirements", description: "Clear consent required for searches.", details: "Oregon requires voluntary, intelligent consent for searches without warrant or probable cause." },
  { state: "OR", category: "Police Accountability", title: "Training Standards", description: "Oregon Department of Public Safety Standards and Training.", details: "File complaints with local departments and Oregon DPSST." },
  { state: "OR", category: "State-Specific Laws", title: "Sanctuary State", description: "Oregon has sanctuary state protections.", details: "Oregon limits cooperation with federal immigration enforcement." },

  // Pennsylvania
  { state: "PA", category: "Traffic Stops", title: "Stop and Identify", description: "Pennsylvania requires identification during detention.", details: "Pennsylvania requires identification when lawfully arrested or detained." },
  { state: "PA", category: "Recording Rights", title: "Public Recording", description: "Pennsylvania allows recording police in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "PA", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Pennsylvania follows federal Fourth Amendment standards for vehicle searches." },
  { state: "PA", category: "Police Accountability", title: "Training Commission", description: "Pennsylvania Municipal Police Officers' Education and Training Commission.", details: "Complaints filed with local agencies and Pennsylvania Training Commission." },
  { state: "PA", category: "State-Specific Laws", title: "Castle Doctrine", description: "Pennsylvania has Castle Doctrine laws.", details: "Pennsylvania Consolidated Statutes Title 18, Section 505 provides Castle Doctrine protections." },

  // Rhode Island
  { state: "RI", category: "Traffic Stops", title: "Miranda Rights", description: "Miranda required for custodial interrogation.", details: "Rhode Island follows federal Miranda standards for custodial interrogation." },
  { state: "RI", category: "Recording Rights", title: "Recording Police", description: "Rhode Island protects recording in public spaces.", details: "First Amendment protects your right to record police performing duties publicly." },
  { state: "RI", category: "Search and Seizure", title: "Search Protections", description: "Fourth Amendment protections apply.", details: "Rhode Island follows federal standards for searches requiring probable cause or consent." },
  { state: "RI", category: "Police Accountability", title: "Training Academy", description: "Rhode Island Municipal Police Training Academy.", details: "Complaints handled by local agencies and the Rhode Island Training Academy." },
  { state: "RI", category: "State-Specific Laws", title: "Gun Laws", description: "Rhode Island has moderate firearm regulations.", details: "Rhode Island requires permits for concealed carry and has some firearm restrictions." },

  // South Carolina
  { state: "SC", category: "Traffic Stops", title: "Identification Laws", description: "South Carolina stop and identify requirements.", details: "South Carolina Code 16-17-470 requires identification when lawfully detained." },
  { state: "SC", category: "Recording Rights", title: "Public Recording", description: "South Carolina allows recording police in public.", details: "You have the right to record police performing duties in public spaces." },
  { state: "SC", category: "Search and Seizure", title: "Consent Laws", description: "Voluntary consent required for searches.", details: "South Carolina requires clear, voluntary consent for searches without probable cause." },
  { state: "SC", category: "Police Accountability", title: "Training Academy", description: "South Carolina Criminal Justice Academy.", details: "File complaints with local departments and South Carolina Criminal Justice Academy." },
  { state: "SC", category: "State-Specific Laws", title: "Stand Your Ground", description: "South Carolina has Stand Your Ground laws.", details: "South Carolina Code 16-11-410 provides Stand Your Ground protections." },

  // South Dakota
  { state: "SD", category: "Traffic Stops", title: "Miranda Requirements", description: "Miranda rights for custodial interrogation.", details: "South Dakota follows federal Miranda standards for custodial interrogation." },
  { state: "SD", category: "Recording Rights", title: "Recording Police", description: "South Dakota protects recording in public spaces.", details: "First Amendment protects recording police performing duties in public." },
  { state: "SD", category: "Search and Seizure", title: "Search Standards", description: "Probable cause required for searches.", details: "South Dakota follows federal Fourth Amendment standards for searches." },
  { state: "SD", category: "Police Accountability", title: "Training Commission", description: "South Dakota Law Enforcement Officers Standards and Training Commission.", details: "Complaints filed with local agencies and South Dakota Training Commission." },
  { state: "SD", category: "State-Specific Laws", title: "Constitutional Carry", description: "South Dakota allows constitutional carry.", details: "South Dakota allows concealed carry without permit." },

  // Tennessee
  { state: "TN", category: "Traffic Stops", title: "Stop and Identify", description: "Tennessee requires identification during detention.", details: "Tennessee Code 40-7-116 requires identification when lawfully detained." },
  { state: "TN", category: "Recording Rights", title: "Public Recording", description: "Tennessee allows recording police in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "TN", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Tennessee follows federal Fourth Amendment standards for vehicle searches." },
  { state: "TN", category: "Police Accountability", title: "Training Academy", description: "Tennessee Law Enforcement Training Academy.", details: "File complaints with local agencies and Tennessee Training Academy." },
  { state: "TN", category: "State-Specific Laws", title: "Stand Your Ground", description: "Tennessee has Stand Your Ground laws.", details: "Tennessee Code 39-11-611 provides Stand Your Ground protections." },

  // Texas (Enhanced)
  { state: "TX", category: "Traffic Stops", title: "Identification Requirements", description: "Texas requires identification during lawful detention.", details: "Texas Penal Code Section 38.02 requires providing name, address, and date of birth when lawfully detained." },
  { state: "TX", category: "Recording Rights", title: "Public Recording Rights", description: "Strong protections for recording police.", details: "Texas protects recording police in public spaces. Stay at reasonable distance and don't interfere with duties." },
  { state: "TX", category: "Search and Seizure", title: "Vehicle Search Protections", description: "Probable cause required for vehicle searches.", details: "Texas follows federal Fourth Amendment standards requiring probable cause, warrant, or consent for vehicle searches." },
  { state: "TX", category: "Police Accountability", title: "TCOLE Oversight", description: "Texas Commission on Law Enforcement oversight.", details: "File complaints with local agencies and the Texas Commission on Law Enforcement." },
  { state: "TX", category: "State-Specific Laws", title: "Constitutional Carry", description: "Texas allows constitutional carry.", details: "Texas allows concealed carry without permit for residents 21 and older." },

  // Utah
  { state: "UT", category: "Traffic Stops", title: "Identification Laws", description: "Utah stop and identify requirements.", details: "Utah Code 77-7-15 requires identification when lawfully detained." },
  { state: "UT", category: "Recording Rights", title: "Recording Police", description: "Utah protects recording in public spaces.", details: "First Amendment protects your right to record police performing duties publicly." },
  { state: "UT", category: "Search and Seizure", title: "Search Protections", description: "Fourth Amendment protections apply.", details: "Utah follows federal standards for searches requiring probable cause or consent." },
  { state: "UT", category: "Police Accountability", title: "POST Academy", description: "Utah Peace Officer Standards and Training.", details: "Complaints handled by local agencies and Utah POST Academy." },
  { state: "UT", category: "State-Specific Laws", title: "Concealed Carry", description: "Utah is shall-issue for concealed carry.", details: "Utah issues concealed firearm permits to qualified applicants." },

  // Vermont
  { state: "VT", category: "Traffic Stops", title: "Miranda Rights", description: "Miranda required for custodial interrogation.", details: "Vermont follows federal Miranda standards for custodial interrogation." },
  { state: "VT", category: "Recording Rights", title: "Public Recording", description: "Vermont allows recording police in public.", details: "You have the right to record police performing duties in public spaces." },
  { state: "VT", category: "Search and Seizure", title: "Consent Requirements", description: "Clear consent required for searches.", details: "Vermont requires voluntary, intelligent consent for searches without warrant or probable cause." },
  { state: "VT", category: "Police Accountability", title: "Training Council", description: "Vermont Police Academy.", details: "File complaints with local departments and the Vermont Police Academy." },
  { state: "VT", category: "State-Specific Laws", title: "Constitutional Carry", description: "Vermont allows constitutional carry.", details: "Vermont has always allowed concealed carry without permit." },

  // Virginia
  { state: "VA", category: "Traffic Stops", title: "Stop and Identify", description: "Virginia requires identification during detention.", details: "Virginia Code 19.2-83 requires identification when lawfully detained." },
  { state: "VA", category: "Recording Rights", title: "Recording Police", description: "Virginia protects recording in public spaces.", details: "First Amendment protects recording police performing duties in public." },
  { state: "VA", category: "Search and Seizure", title: "Vehicle Search Standards", description: "Probable cause required for vehicle searches.", details: "Virginia follows federal Fourth Amendment standards for vehicle searches." },
  { state: "VA", category: "Police Accountability", title: "Training Academy", description: "Virginia Department of Criminal Justice Services.", details: "Complaints filed with local agencies and Virginia DCJS." },
  { state: "VA", category: "State-Specific Laws", title: "Shall Issue", description: "Virginia is shall-issue for concealed carry.", details: "Virginia issues concealed handgun permits to qualified applicants." },

  // Washington
  { state: "WA", category: "Traffic Stops", title: "Miranda Requirements", description: "Miranda rights for custodial interrogation.", details: "Washington follows federal Miranda standards for custodial interrogation." },
  { state: "WA", category: "Recording Rights", title: "Public Recording", description: "Washington allows recording police in public.", details: "You can record police officers performing their duties in public spaces." },
  { state: "WA", category: "Search and Seizure", title: "Search Protections", description: "Strong Fourth Amendment and state protections.", details: "Washington Constitution Article I, Section 7 provides enhanced search and seizure protections." },
  { state: "WA", category: "Police Accountability", title: "Training Commission", description: "Washington State Criminal Justice Training Commission.", details: "File complaints with local departments and Washington Training Commission." },
  { state: "WA", category: "State-Specific Laws", title: "Cannabis Laws", description: "Washington has legal cannabis laws.", details: "Washington allows adult cannabis possession but prohibits public consumption and impaired driving." },

  // West Virginia
  { state: "WV", category: "Traffic Stops", title: "Identification Laws", description: "West Virginia stop and identify requirements.", details: "West Virginia requires identification when lawfully arrested or detained." },
  { state: "WV", category: "Recording Rights", title: "Recording Police", description: "West Virginia protects recording in public spaces.", details: "First Amendment protects your right to record police performing duties publicly." },
  { state: "WV", category: "Search and Seizure", title: "Consent Laws", description: "Voluntary consent required for searches.", details: "West Virginia requires clear, voluntary consent for searches without probable cause." },
  { state: "WV", category: "Police Accountability", title: "Training Academy", description: "West Virginia State Police Academy.", details: "Complaints handled by local agencies and West Virginia State Police Academy." },
  { state: "WV", category: "State-Specific Laws", title: "Constitutional Carry", description: "West Virginia allows constitutional carry.", details: "West Virginia allows concealed carry without permit for residents 21 and older." },

  // Wisconsin
  { state: "WI", category: "Traffic Stops", title: "Stop and Identify", description: "Wisconsin requires identification during detention.", details: "Wisconsin Statutes 968.24 requires identification when lawfully detained." },
  { state: "WI", category: "Recording Rights", title: "Public Recording", description: "Wisconsin allows recording police in public.", details: "You have the right to record police performing duties in public spaces." },
  { state: "WI", category: "Search and Seizure", title: "Vehicle Search Laws", description: "Probable cause required for vehicle searches.", details: "Wisconsin follows federal Fourth Amendment standards for vehicle searches." },
  { state: "WI", category: "Police Accountability", title: "Training Board", description: "Wisconsin Law Enforcement Standards Board.", details: "File complaints with local agencies and Wisconsin Training Board." },
  { state: "WI", category: "State-Specific Laws", title: "Castle Doctrine", description: "Wisconsin has Castle Doctrine laws.", details: "Wisconsin Statutes 939.48 provides Castle Doctrine protections." },

  // Wyoming
  { state: "WY", category: "Traffic Stops", title: "Miranda Rights", description: "Miranda required for custodial interrogation.", details: "Wyoming follows federal Miranda standards for custodial interrogation." },
  { state: "WY", category: "Recording Rights", title: "Recording Police", description: "Wyoming protects recording in public spaces.", details: "First Amendment protects recording police performing duties in public." },
  { state: "WY", category: "Search and Seizure", title: "Search Standards", description: "Probable cause required for searches.", details: "Wyoming follows federal Fourth Amendment standards for searches." },
  { state: "WY", category: "Police Accountability", title: "Training Academy", description: "Wyoming Law Enforcement Academy.", details: "Complaints filed with local agencies and Wyoming Law Enforcement Academy." },
  { state: "WY", category: "State-Specific Laws", title: "Constitutional Carry", description: "Wyoming allows constitutional carry.", details: "Wyoming allows concealed carry without permit for residents." },

  // Washington DC
  { state: "DC", category: "Traffic Stops", title: "Stop and Frisk Laws", description: "Reasonable suspicion required for investigative stops.", details: "Washington DC follows Terry stop standards requiring reasonable suspicion." },
  { state: "DC", category: "Recording Rights", title: "Recording Police", description: "DC strongly protects recording rights.", details: "Washington DC has strong protections for recording police in public spaces." },
  { state: "DC", category: "Search and Seizure", title: "Vehicle Search Standards", description: "Probable cause required for vehicle searches.", details: "DC follows federal Fourth Amendment standards for vehicle searches." },
  { state: "DC", category: "Police Accountability", title: "Police Complaints Board", description: "DC Office of Police Complaints.", details: "File complaints with DC Metropolitan Police and the Office of Police Complaints." },
  { state: "DC", category: "State-Specific Laws", title: "Gun Laws", description: "DC has strict firearm regulations.", details: "Washington DC requires registration for all firearms and has strict carry restrictions." }
];

export async function seed50StatesLegalData() {
  console.log("Starting comprehensive 50-state legal rights seeding...");
  
  try {
    // Insert all 50 states + DC legal data
    for (const legalRight of ALL_STATES_LEGAL_DATA) {
      await db.insert(legalRights).values(legalRight).onConflictDoNothing();
    }
    
    console.log(`Successfully seeded ${ALL_STATES_LEGAL_DATA.length} legal rights across all 50 states + DC`);
    
    // Verify coverage
    const coverage = await db
      .select({
        state: legalRights.state,
        count: legalRights.state
      })
      .from(legalRights)
      .groupBy(legalRights.state);
    
    console.log(`Legal rights coverage: ${coverage.length} states/territories covered`);
    console.log("States covered:", coverage.map(c => c.state).sort().join(", "));
    
    return true;
  } catch (error) {
    console.error("Error seeding 50-state legal data:", error);
    throw error;
  }
}