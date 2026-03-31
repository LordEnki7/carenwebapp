import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LegalAgreementModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

interface AgreementState {
  userAgreement: boolean;
  eula: boolean;
  disclaimer: boolean;
  cookies: boolean;
  privacy: boolean;
}

export default function LegalAgreementModal({ isOpen, onAccept, onDecline }: LegalAgreementModalProps) {
  const [agreements, setAgreements] = useState<AgreementState>({
    userAgreement: false,
    eula: false,
    disclaimer: false,
    cookies: false,
    privacy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const allAgreed = Object.values(agreements).every(Boolean);

  const handleAgreementChange = (key: keyof AgreementState, checked: boolean) => {
    setAgreements(prev => ({ ...prev, [key]: checked }));
  };

  const handleAccept = async () => {
    if (!allAgreed) return;
    
    setIsSubmitting(true);
    try {
      // Record agreement acceptance on backend
      const response = await fetch('/api/legal-agreement-acceptance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agreements: {
            user_agreement: agreements.userAgreement,
            eula: agreements.eula,
            disclaimer: agreements.disclaimer,
            cookies: agreements.cookies,
            privacy: agreements.privacy,
          },
          ipAddress: '', // Could be obtained from backend
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record agreement acceptance');
      }

      toast({
        title: "Legal Agreements Accepted",
        description: "Your agreement acceptance has been recorded successfully.",
      });
      
      onAccept();
    } catch (error) {
      console.error('Error recording legal agreement acceptance:', error);
      toast({
        title: "Error",
        description: "Failed to record agreement acceptance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Legal Agreements - C.A.R.E.N.™ Platform</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="user-agreement">User Agreement</TabsTrigger>
            <TabsTrigger value="eula">EULA</TabsTrigger>
            <TabsTrigger value="disclaimer">Disclaimer</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
            <TabsTrigger value="accept">Accept All</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Legal Requirements</CardTitle>
                <CardDescription>
                  To use the C.A.R.E.N.™ platform, you must read and accept all legal agreements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">User Agreement</h3>
                      <p className="text-sm text-muted-foreground">
                        Defines your rights and responsibilities when using C.A.R.E.N.™
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">End User License Agreement</h3>
                      <p className="text-sm text-muted-foreground">
                        Software licensing terms and usage restrictions.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Disclaimer</h3>
                      <p className="text-sm text-muted-foreground">
                        Important limitations and liability information.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Cookies Policy</h3>
                      <p className="text-sm text-muted-foreground">
                        How we use cookies and tracking technologies.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-agreement">
            <Card>
              <CardHeader>
                <CardTitle>User Agreement</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded p-4">
                  <div className="space-y-4 text-sm">
                    <h3 className="font-semibold">User Agreement</h3>
                    <p>
                      This User Agreement ("Agreement") is a legal agreement between you ("User" or "you") and The C.A.R.E.N.™ Inc. ("Company," "we," "us," or "our"), located at 1298 Winston Rd. South Euclid Ohio 44121, governing your use of the C.A.R.E.N web application and related services ("Service").
                    </p>
                    <p>
                      By accessing or using the Service, you agree to be bound by this Agreement. If you do not agree with any part of this Agreement, you may not use the Service.
                    </p>
                    
                    <h4 className="font-semibold">1. Service Description</h4>
                    <p>
                      The C.A.R.E.N app provides information and guidance regarding state-specific driving laws, legal rights during traffic stops, and related legal information.
                    </p>
                    
                    <h4 className="font-semibold">2. User Responsibilities</h4>
                    <p>
                      You agree to use the Service in compliance with all applicable laws and regulations. You are responsible for maintaining the confidentiality of your account credentials and ensuring that your account information is accurate and up-to-date.
                    </p>
                    
                    <h4 className="font-semibold">3. Privacy Policy</h4>
                    <p>
                      Our Privacy Policy outlines how we collect, use, and disclose your personal information. By using the Service, you consent to the collection and use of your information as described in the Privacy Policy.
                    </p>
                    
                    <h4 className="font-semibold">4. Intellectual Property</h4>
                    <p>
                      The Service and its original content, features, and functionality are owned by The C.A.R.E.N.™ Inc. and are protected by intellectual property laws.
                    </p>
                    
                    <h4 className="font-semibold">5. Limitation of Liability and Hold Harmless Clause</h4>
                    <p>
                      The C.A.R.E.N.™ Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to the use of the Service. By using the Service, you agree to hold harmless and indemnify The C.A.R.E.N.™ Inc. from any claims, damages, or legal issues that may arise from a traffic stop or any action taken based on information obtained from the Service during or after a traffic stop.
                    </p>
                    
                    <h4 className="font-semibold">6. Termination</h4>
                    <p>
                      The C.A.R.E.N.™ Inc. reserves the right to terminate or suspend access to the Service at any time, without prior notice, for any reason.
                    </p>
                    
                    <h4 className="font-semibold">7. Amendments</h4>
                    <p>
                      The C.A.R.E.N.™ Inc. reserves the right to modify or replace this Agreement at any time. Continued use of the Service after any such changes constitutes your consent to the changes.
                    </p>
                    
                    <h4 className="font-semibold">8. Governing Law</h4>
                    <p>
                      This Agreement shall be governed by and construed in accordance with the laws of Ohio, without regard to its conflict of law principles.
                    </p>
                    
                    <h4 className="font-semibold">9. Contact Information</h4>
                    <p>
                      If you have any questions about this Agreement, please contact us at <a href="https://carenalert.com/help">carenalert.com/help</a>.
                    </p>
                  </div>
                </ScrollArea>
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="user-agreement"
                    checked={agreements.userAgreement}
                    onCheckedChange={(checked) => handleAgreementChange('userAgreement', checked as boolean)}
                  />
                  <label htmlFor="user-agreement" className="text-sm font-medium">
                    I have read and agree to the User Agreement
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eula">
            <Card>
              <CardHeader>
                <CardTitle>End User License Agreement (EULA)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded p-4">
                  <div className="space-y-4 text-sm">
                    <h3 className="font-semibold">End User License Agreement (EULA) for The C.A.R.E.N.™ Web App</h3>
                    <p>
                      This End User License Agreement ("Agreement") governs your use of The C.A.R.E.N.™ web application ("The C.A.R.E.N.™," "the app," "we," "us," or "our"). By using The C.A.R.E.N.™, you agree to be bound by this Agreement.
                    </p>
                    
                    <h4 className="font-semibold">1. License Grant</h4>
                    <p>
                      <strong>Limited License:</strong> Subject to the terms of this Agreement, we grant you a limited, non-exclusive, non-transferable license to access and use The C.A.R.E.N.™ for personal use to obtain state-specific information relevant to Ohio's driving laws and interactions with law enforcement.
                    </p>
                    <p>
                      <strong>Restrictions:</strong> You agree not to:
                      • Modify, adapt, or create derivative works of The C.A.R.E.N.™
                      • Use The C.A.R.E.N.™ for any illegal, unauthorized, or prohibited purposes.
                    </p>
                    
                    <h4 className="font-semibold">2. No Legal Advice</h4>
                    <p>
                      <strong>Informational Purpose:</strong> The information provided within The C.A.R.E.N.™ is for informational purposes only and is not intended as legal advice. We do not provide legal counsel, and users should consult appropriate legal professionals for specific advice tailored to their circumstances.
                    </p>
                    
                    <h4 className="font-semibold">3. Disclaimer of Warranties</h4>
                    <p>
                      <strong>As-Is Basis:</strong> The C.A.R.E.N.™ is provided "as is" without warranties of any kind, whether express or implied. We do not warrant the accuracy, reliability, or completeness of the information provided within the app.
                    </p>
                    
                    <h4 className="font-semibold">4. Limitation of Liability</h4>
                    <p>
                      <strong>No Liability for Actions:</strong> We shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with the use or inability to use The C.A.R.E.N.™, including but not limited to reliance on the information provided within the app.
                    </p>
                    
                    <h4 className="font-semibold">5. Governing Law and Jurisdiction</h4>
                    <p>
                      <strong>Ohio Jurisdiction:</strong> This Agreement shall be governed by and construed in accordance with the laws of the State of Ohio. Any disputes arising from this Agreement shall be subject to the exclusive jurisdiction of the courts in Ohio.
                    </p>
                    
                    <h4 className="font-semibold">6. Termination</h4>
                    <p>
                      <strong>Termination of License:</strong> We reserve the right to terminate this license at any time if you breach any terms of this Agreement. Upon termination, you must cease all use of The C.A.R.E.N.™
                    </p>
                  </div>
                </ScrollArea>
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="eula"
                    checked={agreements.eula}
                    onCheckedChange={(checked) => handleAgreementChange('eula', checked as boolean)}
                  />
                  <label htmlFor="eula" className="text-sm font-medium">
                    I have read and agree to the End User License Agreement
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disclaimer">
            <Card>
              <CardHeader>
                <CardTitle>Disclaimer</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded p-4">
                  <div className="space-y-4 text-sm">
                    <h3 className="font-semibold">Disclaimer for The C.A.R.E.N.™ Web App</h3>
                    <p>
                      The C.A.R.E.N.™ web application ("The C.A.R.E.N.™," "the app," "we," "us," or "our") is designed to provide information to Ohio drivers regarding state-specific laws, regulations, and rights during interactions with law enforcement. Please read this disclaimer carefully before using The C.A.R.E.N.™
                    </p>
                    
                    <h4 className="font-semibold">Informational Purpose Only</h4>
                    <p>
                      <strong>No Legal Advice:</strong> The information provided within The C.A.R.E.N.™ is for informational purposes only and should not be construed as legal advice. It is not intended to replace professional legal counsel or guidance.
                    </p>
                    <p>
                      <strong>Accuracy Not Guaranteed:</strong> While we strive to provide accurate and up-to-date information, we do not guarantee the accuracy, reliability, or completeness of the information provided within The C.A.R.E.N.™
                    </p>
                    
                    <h4 className="font-semibold">Understanding Your Rights</h4>
                    <p>
                      <strong>Educational Resource:</strong> The C.A.R.E.N.™ aims to educate users about their rights and responsibilities as Ohio drivers and offer insights into state-specific laws. It is not a substitute for legal representation or professional advice.
                    </p>
                    
                    <h4 className="font-semibold">Limitation of Liability</h4>
                    <p>
                      <strong>No Liability for Actions:</strong> We shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with the use or reliance on the information provided within The C.A.R.E.N.™
                    </p>
                    
                    <h4 className="font-semibold">Consult Legal Professionals</h4>
                    <p>
                      <strong>Seek Legal Counsel:</strong> Users are encouraged to consult with qualified legal professionals for specific advice tailored to their individual circumstances or legal concerns.
                    </p>
                    
                    <h4 className="font-semibold">Governing Law and Jurisdiction</h4>
                    <p>
                      <strong>Ohio Jurisdiction:</strong> This Disclaimer shall be governed by and construed in accordance with the laws of the State of Ohio. Any disputes arising from this Disclaimer shall be subject to the exclusive jurisdiction of the courts in Ohio.
                    </p>
                  </div>
                </ScrollArea>
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="disclaimer"
                    checked={agreements.disclaimer}
                    onCheckedChange={(checked) => handleAgreementChange('disclaimer', checked as boolean)}
                  />
                  <label htmlFor="disclaimer" className="text-sm font-medium">
                    I have read and understand the Disclaimer
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cookies">
            <Card>
              <CardHeader>
                <CardTitle>Cookies Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded p-4">
                  <div className="space-y-4 text-sm">
                    <h3 className="font-semibold">Cookies Policy for The C.A.R.E.N.™ Web App</h3>
                    
                    <h4 className="font-semibold">What Are Cookies?</h4>
                    <p>
                      <strong>Cookies:</strong> The C.A.R.E.N.™ web application ("The C.A.R.E.N.™," "the app," "we," "us," or "our") may use cookies and similar technologies to enhance user experience and provide relevant information to Ohio drivers. Cookies are small pieces of data stored on your device when you visit websites or use applications.
                    </p>
                    
                    <h4 className="font-semibold">How We Use Cookies</h4>
                    <p>
                      <strong>Essential Cookies:</strong> We use essential cookies necessary for the functioning of The C.A.R.E.N.™ These cookies enable core functionalities such as session management and security.
                    </p>
                    <p>
                      <strong>Analytics Cookies:</strong> We may use analytics cookies to gather information about how users interact with The C.A.R.E.N.™ This helps us improve the app's performance and user experience.
                    </p>
                    <p>
                      <strong>Preference Cookies:</strong> Preference cookies allow The C.A.R.E.N.™ to remember user preferences, such as language settings, to enhance the user experience.
                    </p>
                    
                    <h4 className="font-semibold">Third-Party Cookies</h4>
                    <p>
                      <strong>Third-Party Services:</strong> We may engage third-party services that use cookies on The C.A.R.E.N.™ These services include analytics tools or plugins. Please note that third parties may also use cookies as per their own policies.
                    </p>
                    
                    <h4 className="font-semibold">Your Cookie Choices</h4>
                    <p>
                      <strong>Consent:</strong> By using The C.A.R.E.N.™, you consent to the use of cookies as described in this policy. You can manage or delete cookies using your browser settings. Please note that disabling cookies may affect certain functionalities of the app.
                    </p>
                    
                    <h4 className="font-semibold">Changes to This Policy</h4>
                    <p>
                      <strong>Policy Updates:</strong> We reserve the right to update or change this Cookies Policy at any time. Any updates will be posted on The C.A.R.E.N.™ with a revised effective date.
                    </p>
                  </div>
                </ScrollArea>
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="cookies"
                    checked={agreements.cookies}
                    onCheckedChange={(checked) => handleAgreementChange('cookies', checked as boolean)}
                  />
                  <label htmlFor="cookies" className="text-sm font-medium">
                    I accept the Cookies Policy
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accept">
            <Card>
              <CardHeader>
                <CardTitle>Accept All Legal Agreements</CardTitle>
                <CardDescription>
                  Review your acceptance status and proceed with registration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">User Agreement</span>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={agreements.userAgreement}
                          onCheckedChange={(checked) => handleAgreementChange('userAgreement', checked as boolean)}
                        />
                        <span className={`text-xs ${agreements.userAgreement ? 'text-green-600' : 'text-red-600'}`}>
                          {agreements.userAgreement ? 'Accepted' : 'Required'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">End User License Agreement</span>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={agreements.eula}
                          onCheckedChange={(checked) => handleAgreementChange('eula', checked as boolean)}
                        />
                        <span className={`text-xs ${agreements.eula ? 'text-green-600' : 'text-red-600'}`}>
                          {agreements.eula ? 'Accepted' : 'Required'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Disclaimer</span>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={agreements.disclaimer}
                          onCheckedChange={(checked) => handleAgreementChange('disclaimer', checked as boolean)}
                        />
                        <span className={`text-xs ${agreements.disclaimer ? 'text-green-600' : 'text-red-600'}`}>
                          {agreements.disclaimer ? 'Accepted' : 'Required'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">Cookies Policy</span>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={agreements.cookies}
                          onCheckedChange={(checked) => handleAgreementChange('cookies', checked as boolean)}
                        />
                        <span className={`text-xs ${agreements.cookies ? 'text-green-600' : 'text-red-600'}`}>
                          {agreements.cookies ? 'Accepted' : 'Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!allAgreed && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        You must accept all legal agreements to continue using C.A.R.E.N.™
                      </p>
                    </div>
                  )}
                  
                  {allAgreed && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        All legal agreements have been accepted. You may proceed with registration.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between space-x-4 pt-4">
          <Button variant="outline" onClick={onDecline}>
            Decline & Exit
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={!allAgreed || isSubmitting}
            className={allAgreed ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isSubmitting ? "Recording Acceptance..." : allAgreed ? "Accept All & Continue" : "Please Accept All Agreements"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}