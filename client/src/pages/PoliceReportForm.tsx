import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { 
  Shield, 
  FileText, 
  User, 
  MapPin,
  Camera,
  Save,
  Download,
  AlertTriangle,
  Clock,
  Phone
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

interface PoliceReportFormData {
  // Officer Information
  officerName: string;
  officerBadgeNumber: string;
  officerDepartment: string;
  supervisorName: string;
  supervisorBadgeNumber: string;
  vehicleNumber: string;
  
  // Incident Details
  incidentDate: string;
  incidentLocation: string;
  incidentDescription: string;
  witnessInformation: Array<{
    name: string;
    contact: string;
    statement: string;
  }>;
  
  // Legal Information
  rightsMiranda: boolean;
  searchConducted: boolean;
  searchConsent: boolean;
  arrestMade: boolean;
  chargesPressed: string;
  
  // Additional Fields
  reportType: string;
  complainantName: string;
  complainantContact: string;
  damages: string;
  injuries: string;
  propertyRecovered: string;
  
  // Attorney Integration
  severityLevel?: string;
  attorneyRequested?: boolean;
}

export default function PoliceReportForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("officer");
  
  const [formData, setFormData] = useState<PoliceReportFormData>({
    officerName: "",
    officerBadgeNumber: "",
    officerDepartment: "",
    supervisorName: "",
    supervisorBadgeNumber: "",
    vehicleNumber: "",
    incidentDate: new Date().toISOString().split('T')[0],
    incidentLocation: "",
    incidentDescription: "",
    witnessInformation: [],
    rightsMiranda: false,
    searchConducted: false,
    searchConsent: false,
    arrestMade: false,
    chargesPressed: "",
    reportType: "Traffic Stop",
    complainantName: "",
    complainantContact: "",
    damages: "",
    injuries: "",
    propertyRecovered: ""
  });

  // Get current location for incident location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data.display_name) {
              setFormData(prev => ({
                ...prev,
                incidentLocation: data.display_name
              }));
            }
          } catch (error) {
            console.error("Error getting location:", error);
          }
        }
      );
    }
  }, []);

  const { data: existingReports } = useQuery({
    queryKey: ['/api/police-reports'],
    enabled: !!user
  });

  const saveReportMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/police-reports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (response: any) => {
      const { report, severityLevel, suggestedAttorneys, legalInformation } = response;
      
      setFormData(prev => ({
        ...prev,
        severityLevel
      }));

      toast({
        title: "Report Saved",
        description: "Police report data has been saved successfully"
      });

      // Show legal information for high severity cases
      if (severityLevel === 'high' || severityLevel === 'critical') {
        toast({
          title: "Legal Information Available",
          description: legalInformation || "State law provides specific procedures and remedies for serious incidents. Attorney consultation may be beneficial.",
          variant: "default"
        });
        
        if (suggestedAttorneys && suggestedAttorneys.length > 0) {
          // Show attorney suggestions
          setShowAttorneyRecommendations(true);
          setSuggestedAttorneys(suggestedAttorneys);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/police-reports'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save police report data",
        variant: "destructive"
      });
    }
  });

  const [showAttorneyRecommendations, setShowAttorneyRecommendations] = useState(false);
  const [suggestedAttorneys, setSuggestedAttorneys] = useState<any[]>([]);

  const requestAttorneyMutation = useMutation({
    mutationFn: ({ reportId, attorneyId, urgencyLevel }: any) => 
      apiRequest(`/api/police-reports/${reportId}/request-attorney`, {
        method: 'POST',
        body: JSON.stringify({ attorneyId, urgencyLevel })
      }),
    onSuccess: () => {
      toast({
        title: "Attorney Contacted",
        description: "Your attorney has been notified and will respond as soon as possible"
      });
      setFormData(prev => ({ ...prev, attorneyRequested: true }));
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to contact attorney",
        variant: "destructive"
      });
    }
  });

  const updateField = (field: keyof PoliceReportFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnessInformation: [
        ...prev.witnessInformation,
        { name: "", contact: "", statement: "" }
      ]
    }));
  };

  const updateWitness = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      witnessInformation: prev.witnessInformation.map((witness, i) => 
        i === index ? { ...witness, [field]: value } : witness
      )
    }));
  };

  const removeWitness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      witnessInformation: prev.witnessInformation.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    saveReportMutation.mutate(formData);
  };

  const generateReport = () => {
    const reportContent = generatePoliceReportContent(formData);
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `police-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Generated",
      description: "Police report document has been downloaded"
    });
  };

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen starry-bg-overlay">
        <TopBar title="Police Report Form" description="Collect information for filing police reports" />
      
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 p-6 overflow-auto ml-64">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">Police Report Data Collection</h1>
              </div>
              <p className="text-lg text-gray-600">
                Gather all necessary information for filing a comprehensive police report
              </p>
            </div>

            {/* Severity Alert */}
            {formData.severityLevel && (
              <div className={`p-4 rounded-lg border mb-6 ${
                formData.severityLevel === 'critical' ? 'bg-red-50 border-red-200' :
                formData.severityLevel === 'high' ? 'bg-orange-50 border-orange-200' :
                formData.severityLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${
                    formData.severityLevel === 'critical' ? 'text-red-500' :
                    formData.severityLevel === 'high' ? 'text-orange-500' :
                    formData.severityLevel === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <span className="font-semibold">
                    Incident Severity: {formData.severityLevel?.toUpperCase()}
                  </span>
                </div>
                {(formData.severityLevel === 'high' || formData.severityLevel === 'critical') && (
                  <p className="text-sm">
                    Based on state law, incidents involving arrests, searches, or charges may have specific legal remedies available. 
                    Attorney consultation and proper documentation are important for protecting your rights.
                  </p>
                )}
              </div>
            )}

            {/* Attorney Recommendations */}
            {showAttorneyRecommendations && suggestedAttorneys.length > 0 && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Phone className="w-5 h-5" />
                    Recommended Attorneys
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    These attorneys practice in areas of law relevant to your documented incident and are licensed in your state.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suggestedAttorneys.map((attorney) => (
                      <div key={attorney.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <div className="font-medium">{attorney.firmName || 'Attorney'}</div>
                          <div className="text-sm text-gray-600">
                            Specialties: {(attorney.specialties || []).join(', ')}
                          </div>
                          <div className="text-sm text-blue-600">
                            Relevance Score: {attorney.relevanceScore}/5
                          </div>
                        </div>
                        <Button
                          onClick={() => requestAttorneyMutation.mutate({
                            reportId: 'current-report', // You'd use actual report ID
                            attorneyId: attorney.id,
                            urgencyLevel: formData.severityLevel
                          })}
                          disabled={requestAttorneyMutation.isPending}
                          size="sm"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Contact
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* State Legal Information */}
            {formData.reportType && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">State Legal Information & Remedies</h3>
                <StateLegalInformation 
                  state={userState}
                  incidentType={formData.reportType.toLowerCase().replace(' ', '_')}
                  severityLevel={formData.severityLevel || 'low'}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mb-6">
              <Button onClick={handleSave} disabled={saveReportMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveReportMutation.isPending ? "Saving..." : "Save Data"}
              </Button>
              <Button onClick={generateReport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              {(formData.severityLevel === 'high' || formData.severityLevel === 'critical') && !formData.attorneyRequested && (
                <Button 
                  onClick={() => setShowAttorneyRecommendations(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Find Attorney
                </Button>
              )}
            </div>

            {/* Form Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="officer" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Officer Info
                </TabsTrigger>
                <TabsTrigger value="incident" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Incident Details
                </TabsTrigger>
                <TabsTrigger value="legal" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Legal Information
                </TabsTrigger>
                <TabsTrigger value="additional" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Additional Info
                </TabsTrigger>
              </TabsList>

              {/* Officer Information Tab */}
              <TabsContent value="officer" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Police Officer Information</CardTitle>
                    <CardDescription>
                      Collect details about the officer(s) involved in the incident
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="officerName">Officer Name</Label>
                        <Input
                          id="officerName"
                          value={formData.officerName}
                          onChange={(e) => updateField('officerName', e.target.value)}
                          placeholder="Officer's full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="officerBadgeNumber">Badge Number</Label>
                        <Input
                          id="officerBadgeNumber"
                          value={formData.officerBadgeNumber}
                          onChange={(e) => updateField('officerBadgeNumber', e.target.value)}
                          placeholder="Officer's badge number"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="officerDepartment">Department/Agency</Label>
                        <Input
                          id="officerDepartment"
                          value={formData.officerDepartment}
                          onChange={(e) => updateField('officerDepartment', e.target.value)}
                          placeholder="Police department or agency"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                        <Input
                          id="vehicleNumber"
                          value={formData.vehicleNumber}
                          onChange={(e) => updateField('vehicleNumber', e.target.value)}
                          placeholder="Police vehicle number"
                        />
                      </div>
                    </div>

                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="supervisorName">Supervisor Name (if applicable)</Label>
                        <Input
                          id="supervisorName"
                          value={formData.supervisorName}
                          onChange={(e) => updateField('supervisorName', e.target.value)}
                          placeholder="Supervisor's name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supervisorBadgeNumber">Supervisor Badge Number</Label>
                        <Input
                          id="supervisorBadgeNumber"
                          value={formData.supervisorBadgeNumber}
                          onChange={(e) => updateField('supervisorBadgeNumber', e.target.value)}
                          placeholder="Supervisor's badge number"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Incident Details Tab */}
              <TabsContent value="incident" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Incident Information</CardTitle>
                    <CardDescription>
                      Record details about what happened during the incident
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="incidentDate">Date & Time</Label>
                        <Input
                          id="incidentDate"
                          type="datetime-local"
                          value={formData.incidentDate}
                          onChange={(e) => updateField('incidentDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="reportType">Report Type</Label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={formData.reportType}
                          onChange={(e) => updateField('reportType', e.target.value)}
                        >
                          <option value="Traffic Stop">Traffic Stop</option>
                          <option value="Search & Seizure">Search & Seizure</option>
                          <option value="Arrest">Arrest</option>
                          <option value="Police Misconduct">Police Misconduct</option>
                          <option value="Use of Force">Use of Force</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="incidentLocation">Location</Label>
                      <Input
                        id="incidentLocation"
                        value={formData.incidentLocation}
                        onChange={(e) => updateField('incidentLocation', e.target.value)}
                        placeholder="Exact location of the incident"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="incidentDescription">Incident Description</Label>
                      <Textarea
                        id="incidentDescription"
                        value={formData.incidentDescription}
                        onChange={(e) => updateField('incidentDescription', e.target.value)}
                        placeholder="Detailed description of what happened..."
                        rows={6}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Witness Information</Label>
                        <Button onClick={addWitness} size="sm" variant="outline">
                          <User className="w-4 h-4 mr-2" />
                          Add Witness
                        </Button>
                      </div>
                      
                      {formData.witnessInformation.map((witness, index) => (
                        <Card key={index} className="mb-3">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <Input
                                placeholder="Witness name"
                                value={witness.name}
                                onChange={(e) => updateWitness(index, 'name', e.target.value)}
                              />
                              <Input
                                placeholder="Contact information"
                                value={witness.contact}
                                onChange={(e) => updateWitness(index, 'contact', e.target.value)}
                              />
                              <Button 
                                onClick={() => removeWitness(index)}
                                variant="destructive"
                                size="sm"
                              >
                                Remove
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Witness statement..."
                              value={witness.statement}
                              onChange={(e) => updateWitness(index, 'statement', e.target.value)}
                              rows={3}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Legal Information Tab */}
              <TabsContent value="legal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Legal Rights & Actions</CardTitle>
                    <CardDescription>
                      Document what legal rights were exercised and what actions were taken
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rightsMiranda"
                          checked={formData.rightsMiranda}
                          onCheckedChange={(checked) => updateField('rightsMiranda', checked)}
                        />
                        <Label htmlFor="rightsMiranda">Miranda rights were read</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="searchConducted"
                          checked={formData.searchConducted}
                          onCheckedChange={(checked) => updateField('searchConducted', checked)}
                        />
                        <Label htmlFor="searchConducted">Search was conducted</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="searchConsent"
                          checked={formData.searchConsent}
                          onCheckedChange={(checked) => updateField('searchConsent', checked)}
                        />
                        <Label htmlFor="searchConsent">Consent given for search</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="arrestMade"
                          checked={formData.arrestMade}
                          onCheckedChange={(checked) => updateField('arrestMade', checked)}
                        />
                        <Label htmlFor="arrestMade">Arrest was made</Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="chargesPressed">Charges Pressed (if any)</Label>
                      <Textarea
                        id="chargesPressed"
                        value={formData.chargesPressed}
                        onChange={(e) => updateField('chargesPressed', e.target.value)}
                        placeholder="List any charges that were filed..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Additional Information Tab */}
              <TabsContent value="additional" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                    <CardDescription>
                      Record any additional details relevant to the police report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="complainantName">Your Name</Label>
                        <Input
                          id="complainantName"
                          value={formData.complainantName}
                          onChange={(e) => updateField('complainantName', e.target.value)}
                          placeholder="Your full legal name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="complainantContact">Your Contact Information</Label>
                        <Input
                          id="complainantContact"
                          value={formData.complainantContact}
                          onChange={(e) => updateField('complainantContact', e.target.value)}
                          placeholder="Phone number or email"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="damages">Property Damage (if any)</Label>
                      <Textarea
                        id="damages"
                        value={formData.damages}
                        onChange={(e) => updateField('damages', e.target.value)}
                        placeholder="Describe any property damage..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="injuries">Injuries (if any)</Label>
                      <Textarea
                        id="injuries"
                        value={formData.injuries}
                        onChange={(e) => updateField('injuries', e.target.value)}
                        placeholder="Describe any injuries sustained..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="propertyRecovered">Property Recovered</Label>
                      <Textarea
                        id="propertyRecovered"
                        value={formData.propertyRecovered}
                        onChange={(e) => updateField('propertyRecovered', e.target.value)}
                        placeholder="List any property that was recovered..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Instructions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Important Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• <strong>Ask for officer identification:</strong> "May I have your name and badge number for my records?"</p>
                  <p>• <strong>Request supervisor:</strong> "I would like to speak with your supervisor, please."</p>
                  <p>• <strong>Document everything:</strong> Write down or remember all details as they happen.</p>
                  <p>• <strong>Stay calm and polite:</strong> Cooperation helps ensure your safety and legal protection.</p>
                  <p>• <strong>Save frequently:</strong> Use the Save Data button to preserve your information.</p>
                  <p>• <strong>Generate report:</strong> Download the completed report for filing with authorities.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </MobileResponsiveLayout>
  );
}

function generatePoliceReportContent(data: PoliceReportFormData): string {
  const date = new Date().toLocaleDateString();
  
  return `POLICE INCIDENT REPORT
Generated on: ${date}

OFFICER INFORMATION:
Officer Name: ${data.officerName || 'Not provided'}
Badge Number: ${data.officerBadgeNumber || 'Not provided'}
Department: ${data.officerDepartment || 'Not provided'}
Vehicle Number: ${data.vehicleNumber || 'Not provided'}
Supervisor Name: ${data.supervisorName || 'Not provided'}
Supervisor Badge: ${data.supervisorBadgeNumber || 'Not provided'}

INCIDENT DETAILS:
Date/Time: ${data.incidentDate || 'Not provided'}
Location: ${data.incidentLocation || 'Not provided'}
Report Type: ${data.reportType || 'Not provided'}
Description: ${data.incidentDescription || 'Not provided'}

COMPLAINANT INFORMATION:
Name: ${data.complainantName || 'Not provided'}
Contact: ${data.complainantContact || 'Not provided'}

WITNESS INFORMATION:
${data.witnessInformation.length > 0 
  ? data.witnessInformation.map((w, i) => 
      `Witness ${i + 1}:\nName: ${w.name}\nContact: ${w.contact}\nStatement: ${w.statement}\n`
    ).join('\n')
  : 'No witnesses recorded'}

LEGAL ACTIONS:
Miranda Rights Read: ${data.rightsMiranda ? 'Yes' : 'No'}
Search Conducted: ${data.searchConducted ? 'Yes' : 'No'}
Search Consent Given: ${data.searchConsent ? 'Yes' : 'No'}
Arrest Made: ${data.arrestMade ? 'Yes' : 'No'}
Charges: ${data.chargesPressed || 'None'}

ADDITIONAL INFORMATION:
Property Damage: ${data.damages || 'None reported'}
Injuries: ${data.injuries || 'None reported'}
Property Recovered: ${data.propertyRecovered || 'None reported'}

This report was generated using the C.A.R.E.N.™ legal protection platform.
For legal assistance, contact an attorney immediately.`;
}