import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Shield, FileText, Users } from "lucide-react";

interface StateLegalInformationProps {
  state: string;
  incidentType: string;
  severityLevel: string;
}

export default function StateLegalInformation({ state, incidentType, severityLevel }: StateLegalInformationProps) {
  
  const getStateLegalInfo = (state: string, incidentType: string) => {
    // This would connect to the legal rights database in a real implementation
    const legalInfo = {
      'CA': {
        'traffic_stop': {
          laws: [
            "California Vehicle Code Section 2800 - Duty to comply with lawful police orders",
            "California Constitution Article 1, Section 13 - Protection against unreasonable searches",
            "California Penal Code Section 148 - Resisting arrest definitions and limits"
          ],
          remedies: [
            "File complaint with police department Internal Affairs",
            "Submit complaint to California Department of Justice",
            "Civil rights lawsuit under 42 U.S.C. § 1983 for constitutional violations",
            "Exclusionary rule - evidence from illegal searches cannot be used in court"
          ],
          procedures: [
            "You have the right to remain silent beyond providing identification",
            "You have the right to refuse consent to vehicle searches",
            "Officers must have reasonable suspicion to extend a traffic stop",
            "You have the right to record police interactions in public"
          ],
          ticketSigning: {
            required: true,
            details: "California requires you to sign traffic tickets. Signing is NOT an admission of guilt - it's a promise to appear in court or pay the fine. Refusal to sign can result in arrest under Vehicle Code Section 40302."
          }
        },
        'arrest': {
          laws: [
            "California Penal Code Section 836 - Arrest authority and limitations",
            "Miranda v. Arizona - Right to remain silent and attorney",
            "California Penal Code Section 825 - Arraignment timing requirements"
          ],
          remedies: [
            "Immediate right to attorney representation",
            "Right to bail hearing within 48 hours",
            "Motion to suppress evidence from illegal arrest",
            "Civil lawsuit for false arrest or excessive force"
          ],
          procedures: [
            "Must be informed of charges against you",
            "Right to one phone call immediately after booking",
            "Right to medical attention if injured",
            "Right to interpreter if needed"
          ],
          ticketSigning: {
            required: false,
            details: "Ticket signing not applicable during arrest situations. Focus on exercising your Miranda rights and requesting attorney representation."
          }
        }
      },
      'TX': {
        'traffic_stop': {
          laws: [
            "Texas Transportation Code Section 543.005 - Duty to comply with officer directions",
            "Texas Code of Criminal Procedure Article 14.01 - Arrest without warrant",
            "Fourth Amendment - Protection against unreasonable searches"
          ],
          remedies: [
            "File complaint with Texas Commission on Law Enforcement",
            "Internal Affairs complaint with local department",
            "Civil rights lawsuit under federal law",
            "Exclusionary rule for illegally obtained evidence"
          ],
          procedures: [
            "Required to provide driver's license, registration, and insurance",
            "Right to refuse consent to vehicle searches",
            "Right to remain silent beyond required information",
            "Right to record interactions in public"
          ],
          ticketSigning: {
            required: true,
            details: "Texas requires signature on traffic citations under Transportation Code Section 543.005. Signature is a promise to appear, not an admission of guilt. Refusal to sign may result in arrest."
          }
        }
      },
      'FL': {
        'traffic_stop': {
          laws: [
            "Florida Statute 316.072 - Obedience to authorized persons directing traffic",
            "Florida Constitution Article I, Section 12 - Searches and seizures",
            "Florida Statute 901.151 - Stop and frisk law"
          ],
          remedies: [
            "Complaint to Florida Department of Law Enforcement",
            "Internal Affairs complaint with agency",
            "Civil rights action under state and federal law",
            "Motion to suppress illegally obtained evidence"
          ],
          procedures: [
            "Must provide driver's license and vehicle registration",
            "Right to refuse consent to searches",
            "Right to remain silent beyond identification",
            "Right to record police interactions"
          ],
          ticketSigning: {
            required: true,
            details: "Florida requires signing traffic citations under Statute 318.14. Your signature acknowledges receipt and promises to respond - it is NOT an admission of guilt. Refusal may result in arrest."
          }
        }
      },
      'NY': {
        'traffic_stop': {
          laws: [
            "New York Vehicle and Traffic Law Section 1180 - Basic speed law",
            "New York Constitution Article I, Section 12 - Security against unreasonable searches",
            "New York Criminal Procedure Law Article 140 - Arrest procedures"
          ],
          remedies: [
            "Complaint to New York State Police Standards and Training",
            "Civilian Complaint Review Board (NYC)",
            "Civil rights lawsuit under state and federal law",
            "Suppression of evidence from illegal stops"
          ],
          procedures: [
            "Required to show license, registration, and insurance",
            "Right to refuse consent to vehicle searches",
            "Right to remain silent beyond required documents",
            "Right to record police interactions in public"
          ],
          ticketSigning: {
            required: false,
            details: "New York generally does NOT require signature on traffic tickets. Officers may ask you to sign, but you are not legally required to do so. Refusal to sign cannot be grounds for arrest in most cases."
          }
        }
      },
      // Add more states as needed
      'default': {
        'traffic_stop': {
          laws: [
            "Fourth Amendment - Protection against unreasonable searches and seizures",
            "Terry v. Ohio - Reasonable suspicion standard for stops",
            "Miranda v. Arizona - Rights during custodial interrogation"
          ],
          remedies: [
            "File complaint with police department",
            "Contact state attorney general's office",
            "Civil rights lawsuit under federal law",
            "Exclusionary rule for illegally obtained evidence"
          ],
          procedures: [
            "Right to remain silent beyond required identification",
            "Right to refuse consent to searches",
            "Right to record police interactions in public spaces",
            "Right to ask if you are free to leave"
          ],
          ticketSigning: {
            required: "varies",
            details: "Ticket signing requirements vary by state. Generally, signing is a promise to appear or pay, not an admission of guilt. Check your specific state's requirements or consult local legal resources."
          }
        }
      }
    };

    const stateInfo = legalInfo[state as keyof typeof legalInfo] || legalInfo['default'];
    return stateInfo[incidentType as keyof typeof stateInfo] || stateInfo['traffic_stop'];
  };

  const legalInfo = getStateLegalInfo(state, incidentType);

  return (
    <div className="space-y-4">
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            {state} State Laws
          </CardTitle>
          <CardDescription>
            Applicable laws and statutes for your documented incident
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {legalInfo.laws.map((law: string, index: number) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                <FileText className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="text-sm">{law}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Your Rights & Procedures
          </CardTitle>
          <CardDescription>
            Constitutional protections and proper procedures during police encounters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {legalInfo.procedures.map((procedure: string, index: number) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                <Shield className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span className="text-sm">{procedure}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Available Remedies
          </CardTitle>
          <CardDescription>
            Legal remedies and recourse options under {state} law
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {legalInfo.remedies.map((remedy: string, index: number) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                <Users className="w-4 h-4 mt-0.5 text-orange-600 flex-shrink-0" />
                <span className="text-sm">{remedy}</span>
              </div>
            ))}
          </div>
          
          {severityLevel === 'high' || severityLevel === 'critical' ? (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Documentation Note:</strong> For incidents involving arrests, searches, or charges, 
                comprehensive documentation and prompt legal consultation are important for preserving your rights 
                and available remedies under {state} law.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Ticket Signing Requirements */}
      {(legalInfo as any).ticketSigning && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              {state} Ticket Signing Requirements
            </CardTitle>
            <CardDescription>
              State-specific requirements for signing traffic citations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border ${
              (legalInfo as any).ticketSigning.required === true ? 'bg-red-50 border-red-200' :
              (legalInfo as any).ticketSigning.required === false ? 'bg-green-50 border-green-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  (legalInfo as any).ticketSigning.required === true ? 'bg-red-500 text-white' :
                  (legalInfo as any).ticketSigning.required === false ? 'bg-green-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {(legalInfo as any).ticketSigning.required === true ? '!' :
                   (legalInfo as any).ticketSigning.required === false ? '✓' : '?'}
                </div>
                <div>
                  <div className="font-semibold mb-2">
                    Signature {(legalInfo as any).ticketSigning.required === true ? 'REQUIRED' :
                              (legalInfo as any).ticketSigning.required === false ? 'NOT REQUIRED' : 'VARIES'}
                  </div>
                  <p className="text-sm">
                    {(legalInfo as any).ticketSigning.details}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}