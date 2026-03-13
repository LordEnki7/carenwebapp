import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Upload, Clock, Shield, AlertTriangle, CheckCircle, Brain, Lightbulb, Scale, BookOpen, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { 
  OfficerComplaint, 
  InsertOfficerComplaint, 
  ComplaintEvidence, 
  ComplaintUpdate,
  ComplaintAgency,
  ComplaintTemplate 
} from "@shared/schema";

interface ComplaintSuggestion {
  id: string;
  type: 'constitutional_violation' | 'misconduct' | 'excessive_force' | 'discrimination' | 'procedural_violation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  legalBasis: string[];
  suggestedActions: string[];
  evidence: string[];
  timelineUrgency: 'immediate' | 'within_24h' | 'within_week' | 'within_month';
  jurisdiction: string;
  applicableLaws: string[];
  precedentCases?: string[];
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function FileComplaint() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("form");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<ComplaintSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ComplaintSuggestion | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  
  // Evidence upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<ComplaintEvidence[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    complaintType: "",
    officerBadgeNumber: "",
    officerName: "",
    department: "",
    incidentDate: "",
    incidentTime: "",
    jurisdiction: "",
    description: "",
    witnessNames: "",
    evidenceDescription: "",
    desiredOutcome: "",
    severity: "medium" as "low" | "medium" | "high" | "critical"
  });

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            
            setLocation({
              latitude,
              longitude,
              address: data.display_name || "Unknown address",
              city: data.address?.city || data.address?.town || data.address?.village || "Unknown city",
              state: data.address?.state || "Unknown state",
              zipCode: data.address?.postcode || "Unknown zip"
            });
            
            // Set jurisdiction based on state
            setFormData(prev => ({
              ...prev,
              jurisdiction: data.address?.state || "Unknown"
            }));
          } catch (error) {
            console.error("Error getting location details:", error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Access",
            description: "Unable to access location. Please enter jurisdiction manually.",
            variant: "destructive"
          });
        }
      );
    }
  }, [toast]);

  // Query for agencies based on jurisdiction
  const { data: agencies } = useQuery({
    queryKey: ['/api/complaint-agencies', formData.jurisdiction],
    enabled: !!formData.jurisdiction && formData.jurisdiction !== "Unknown"
  });

  // Query for templates based on jurisdiction and complaint type
  const { data: templates } = useQuery({
    queryKey: ['/api/complaint-templates', formData.jurisdiction, formData.complaintType],
    enabled: !!formData.jurisdiction && !!formData.complaintType
  });

  // Query for user's incidents (for AI analysis)
  const { data: userIncidents } = useQuery({
    queryKey: ["/api/incidents"],
    enabled: true
  });

  // AI Complaint Suggestions mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (data: { incidentId: number; additionalContext?: string }) => {
      const response = await fetch(`/api/complaint-suggestions/analyze/${data.incidentId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ additionalContext: data.additionalContext })
      });
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      setAiSuggestions(data.suggestions || []);
      setShowAiAnalysis(true);
      setActiveTab("suggestions");
      toast({
        title: "AI Analysis Complete",
        description: `Generated ${data.suggestions?.length || 0} complaint suggestions based on incident analysis.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Analysis Failed",
        description: error.message || "Failed to generate complaint suggestions",
        variant: "destructive"
      });
    }
  });

  // Legal research mutation
  const legalResearchMutation = useMutation({
    mutationFn: async (suggestion: ComplaintSuggestion) => {
      const response = await fetch("/api/complaint-suggestions/legal-research", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ suggestion })
      });
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Legal Research Complete",
        description: "Additional legal resources and precedents found."
      });
    }
  });

  // Create complaint mutation
  const createComplaintMutation = useMutation({
    mutationFn: async (complaintData: InsertOfficerComplaint) => {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(complaintData)
      });
      const data = await response.json();
      return data.complaint;
    },
    onSuccess: (complaint: OfficerComplaint) => {
      setComplaintId(complaint.id);
      setActiveTab("evidence");
      toast({
        title: "Complaint Created",
        description: "Your complaint has been created successfully. You can now add evidence.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create complaint",
        variant: "destructive"
      });
    }
  });

  // Evidence upload mutation
  const uploadEvidenceMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/complaints/${complaintId}/evidence`, {
        method: 'POST',
        body: formData
      });
      return response.json();
    },
    onSuccess: (data) => {
      setEvidenceFiles(prev => [...prev, data.evidence]);
      toast({
        title: "Evidence Uploaded",
        description: "Your evidence has been uploaded successfully."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/complaints/${complaintId}/evidence`] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload evidence",
        variant: "destructive"
      });
    }
  });

  // Submit complaint mutation (email to attorney)
  const submitComplaintMutation = useMutation({
    mutationFn: async (submissionData: { attorneyEmail: string; message?: string }) => {
      const response = await fetch(`/api/complaints/${complaintId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Complaint Submitted Successfully",
        description: `Your complaint has been filed and sent to ${data.attorneyEmail}. You will receive a confirmation email shortly.`,
        duration: 5000
      });
      // Redirect to dashboard after successful submission
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit complaint",
        variant: "destructive"
      });
    }
  });

  // Query for complaint evidence
  const { data: complaintEvidence } = useQuery({
    queryKey: [`/api/complaints/${complaintId}/evidence`],
    enabled: !!complaintId
  });

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!complaintId) {
      toast({
        title: "No Complaint",
        description: "Please create a complaint first before uploading evidence.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      // Create evidence record immediately for UI update
      const mockEvidence = {
        id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        evidenceType: getEvidenceType(file.type),
        fileSize: file.size,
        description: `${file.name} - uploaded evidence`
      };
      
      // Add to local state immediately
      setEvidenceFiles(prev => [...prev, mockEvidence as any]);
      
      // Then upload to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('evidenceType', getEvidenceType(file.type));
      formData.append('description', `${file.name} - uploaded evidence`);
      
      try {
        await uploadEvidenceMutation.mutateAsync(formData);
      } catch (error) {
        console.error('Upload error:', error);
        // Remove from local state if upload fails
        setEvidenceFiles(prev => prev.filter(e => e.id !== mockEvidence.id));
      }
    }
    
    setIsUploading(false);
  };

  // Determine evidence type from file MIME type
  const getEvidenceType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'document';
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.complaintType || !formData.description || !formData.incidentDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Create valid Date object
    const dateTimeString = `${formData.incidentDate}T${formData.incidentTime || '00:00'}:00`;
    const incidentDateTime = new Date(dateTimeString);
    
    // Validate the date
    if (isNaN(incidentDateTime.getTime())) {
      toast({
        title: "Invalid Date",
        description: "Please enter a valid incident date and time",
        variant: "destructive"
      });
      return;
    }

    const complaintData = {
      userId: "demo-user", // This will be replaced by actual user ID from authentication
      complaintType: formData.complaintType,
      officerBadgeNumber: formData.officerBadgeNumber || null,
      officerName: formData.officerName || null,
      officerDepartment: formData.department || "",
      incidentDate: incidentDateTime,
      incidentLocation: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        city: location.city,
        state: location.state
      } : null,
      jurisdiction: formData.jurisdiction,
      description: formData.description,
      witnessesPresent: !!formData.witnessNames,
      witnessCount: formData.witnessNames ? formData.witnessNames.split(',').length : 0,
      evidenceAttached: !!formData.evidenceDescription,
      evidenceTypes: formData.evidenceDescription ? ["documents"] : null,
      disciplinaryAction: formData.desiredOutcome || null,
      priority: formData.severity,
      status: "draft",
      filingMethod: "online",
      targetAgency: "police_department"
    };

    createComplaintMutation.mutate(complaintData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-300 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default: return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button size="sm" className="cyber-button-secondary flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                File Complaint Against Officer
              </h1>
              <p className="text-gray-400 mt-1">
                Document and report police misconduct or violations
              </p>
            </div>
          </div>
          {location && (
            <div className="text-right">
              <div className="text-sm text-cyan-400">Current Location</div>
              <div className="text-xs text-gray-400">{location.city}, {location.state}</div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-cyan-500/20">
            <TabsTrigger value="form" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <FileText className="h-4 w-4 mr-2" />
              Complaint Form
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Brain className="h-4 w-4 mr-2" />
              AI Suggestions
            </TabsTrigger>
            <TabsTrigger value="evidence" disabled={!complaintId} className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <Upload className="h-4 w-4 mr-2" />
              Evidence
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!complaintId} className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <Shield className="h-4 w-4 mr-2" />
              Review
            </TabsTrigger>
            <TabsTrigger value="submit" disabled={!complaintId} className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit
            </TabsTrigger>
          </TabsList>

          {/* Complaint Form Tab */}
          <TabsContent value="form" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Incident Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Complaint Type */}
                  <div className="space-y-2">
                    <Label htmlFor="complaintType" className="text-gray-300">
                      Complaint Type *
                    </Label>
                    <Select value={formData.complaintType} onValueChange={(value) => handleInputChange("complaintType", value)}>
                      <SelectTrigger className="cyber-input">
                        <SelectValue placeholder="Select complaint type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-cyan-500/30">
                        <SelectItem value="excessive_force">Excessive Force</SelectItem>
                        <SelectItem value="misconduct">Professional Misconduct</SelectItem>
                        <SelectItem value="discrimination">Discrimination/Bias</SelectItem>
                        <SelectItem value="unlawful_search">Unlawful Search/Seizure</SelectItem>
                        <SelectItem value="false_arrest">False Arrest</SelectItem>
                        <SelectItem value="harassment">Harassment</SelectItem>
                        <SelectItem value="violation_of_rights">Violation of Constitutional Rights</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Severity */}
                  <div className="space-y-2">
                    <Label htmlFor="severity" className="text-gray-300">
                      Severity Level
                    </Label>
                    <Select value={formData.severity} onValueChange={(value: any) => handleInputChange("severity", value)}>
                      <SelectTrigger className="cyber-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-cyan-500/30">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={getSeverityColor(formData.severity)}>
                      {formData.severity.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Officer Information */}
                  <div className="space-y-2">
                    <Label htmlFor="officerName" className="text-gray-300">
                      Officer Name
                    </Label>
                    <Input
                      id="officerName"
                      value={formData.officerName}
                      onChange={(e) => handleInputChange("officerName", e.target.value)}
                      placeholder="Officer's full name"
                      className="cyber-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="officerBadgeNumber" className="text-gray-300">
                      Badge Number
                    </Label>
                    <Input
                      id="officerBadgeNumber"
                      value={formData.officerBadgeNumber}
                      onChange={(e) => handleInputChange("officerBadgeNumber", e.target.value)}
                      placeholder="Badge/ID number"
                      className="cyber-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-gray-300">
                      Department/Agency
                    </Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      placeholder="Police department or agency"
                      className="cyber-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jurisdiction" className="text-gray-300">
                      Jurisdiction
                    </Label>
                    <Input
                      id="jurisdiction"
                      value={formData.jurisdiction}
                      onChange={(e) => handleInputChange("jurisdiction", e.target.value)}
                      placeholder="State/jurisdiction"
                      className="cyber-input"
                    />
                  </div>

                  {/* Incident Date/Time */}
                  <div className="space-y-2">
                    <Label htmlFor="incidentDate" className="text-gray-300">
                      Incident Date *
                    </Label>
                    <Input
                      id="incidentDate"
                      type="date"
                      value={formData.incidentDate}
                      onChange={(e) => handleInputChange("incidentDate", e.target.value)}
                      className="cyber-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incidentTime" className="text-gray-300">
                      Incident Time
                    </Label>
                    <Input
                      id="incidentTime"
                      type="time"
                      value={formData.incidentTime}
                      onChange={(e) => handleInputChange("incidentTime", e.target.value)}
                      className="cyber-input"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">
                    Detailed Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Provide a detailed description of what happened..."
                    rows={6}
                    className="cyber-input"
                  />
                </div>

                {/* Witnesses */}
                <div className="space-y-2">
                  <Label htmlFor="witnessNames" className="text-gray-300">
                    Witness Information
                  </Label>
                  <Textarea
                    id="witnessNames"
                    value={formData.witnessNames}
                    onChange={(e) => handleInputChange("witnessNames", e.target.value)}
                    placeholder="Names and contact information of any witnesses..."
                    rows={3}
                    className="cyber-input"
                  />
                </div>

                {/* Evidence Description */}
                <div className="space-y-2">
                  <Label htmlFor="evidenceDescription" className="text-gray-300">
                    Evidence Description
                  </Label>
                  <Textarea
                    id="evidenceDescription"
                    value={formData.evidenceDescription}
                    onChange={(e) => handleInputChange("evidenceDescription", e.target.value)}
                    placeholder="Describe any evidence you have (photos, videos, documents)..."
                    rows={3}
                    className="cyber-input"
                  />
                </div>

                {/* Desired Outcome */}
                <div className="space-y-2">
                  <Label htmlFor="desiredOutcome" className="text-gray-300">
                    Desired Outcome
                  </Label>
                  <Textarea
                    id="desiredOutcome"
                    value={formData.desiredOutcome}
                    onChange={(e) => handleInputChange("desiredOutcome", e.target.value)}
                    placeholder="What outcome are you seeking from this complaint?"
                    rows={3}
                    className="cyber-input"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={createComplaintMutation.isPending}
                    className="cyber-btn-primary"
                  >
                    {createComplaintMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Creating Complaint...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Create Complaint
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-purple-300 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI-Powered Complaint Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!showAiAnalysis ? (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <Brain className="h-16 w-16 mx-auto text-purple-400 mb-4" />
                      <h3 className="text-lg font-semibold text-purple-300 mb-2">
                        AI Complaint Analysis
                      </h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Our AI system can analyze your incident and suggest specific complaint types, 
                        legal violations, and recommended actions based on the incident details.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="incidentSelect" className="text-gray-300">
                            Select an Incident to Analyze
                          </Label>
                          <Select value={selectedIncidentId?.toString() || ""} onValueChange={(value) => setSelectedIncidentId(parseInt(value))}>
                            <SelectTrigger className="cyber-input">
                              <SelectValue placeholder="Choose an incident from your records" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-cyan-500/20">
                              {userIncidents && Array.isArray(userIncidents) && userIncidents.length > 0 ? (
                                userIncidents.map((incident: any) => (
                                  <SelectItem key={incident.id} value={incident.id.toString()} className="text-gray-300">
                                    {incident.title || `Incident ${incident.id}`} - {new Date(incident.createdAt).toLocaleDateString()}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-incidents" disabled className="text-gray-500">
                                  No incidents available for analysis
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button
                          onClick={() => selectedIncidentId && generateSuggestionsMutation.mutate({ incidentId: selectedIncidentId })}
                          disabled={!selectedIncidentId || generateSuggestionsMutation.isPending}
                          className="cyber-btn-primary"
                        >
                          {generateSuggestionsMutation.isPending ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing Incident...
                            </>
                          ) : (
                            <>
                              <Lightbulb className="h-4 w-4 mr-2" />
                              Generate AI Suggestions
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-purple-300">
                        AI Analysis Results ({aiSuggestions.length} suggestions)
                      </h3>
                      <Button
                        onClick={() => {
                          setShowAiAnalysis(false);
                          setAiSuggestions([]);
                          setSelectedSuggestion(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="cyber-btn-secondary"
                      >
                        New Analysis
                      </Button>
                    </div>

                    {/* AI Suggestions List */}
                    <div className="space-y-4">
                      {aiSuggestions.map((suggestion, index) => (
                        <Card key={suggestion.id} className="bg-slate-800/50 border border-purple-500/20 hover:border-purple-400/40 transition-colors">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-2 h-2 rounded-full ${getSeverityColor(suggestion.severity).split(' ')[0]}`} />
                                  <h4 className="font-semibold text-purple-300">{suggestion.title}</h4>
                                  <Badge className={getSeverityColor(suggestion.severity)}>
                                    {suggestion.severity.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-400">
                                    {Math.round(suggestion.confidence * 100)}% confidence
                                  </span>
                                  <Badge variant="outline" className="text-purple-300 border-purple-500/30">
                                    {suggestion.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>

                              <p className="text-gray-300 text-sm">{suggestion.description}</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <h5 className="font-semibold text-cyan-300 mb-1 flex items-center">
                                    <Scale className="h-3 w-3 mr-1" />
                                    Legal Basis
                                  </h5>
                                  <ul className="text-gray-400 space-y-1">
                                    {suggestion.legalBasis.slice(0, 3).map((basis, i) => (
                                      <li key={i}>• {basis}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h5 className="font-semibold text-green-300 mb-1 flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Suggested Actions
                                  </h5>
                                  <ul className="text-gray-400 space-y-1">
                                    {suggestion.suggestedActions.slice(0, 3).map((action, i) => (
                                      <li key={i}>• {action}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                                <div className="flex items-center space-x-4 text-xs text-gray-400">
                                  <span>Jurisdiction: {suggestion.jurisdiction}</span>
                                  <span>Urgency: {suggestion.timelineUrgency.replace('_', ' ')}</span>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => setSelectedSuggestion(suggestion)}
                                    size="sm"
                                    className="cyber-btn-secondary"
                                  >
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    View Details
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      // Auto-fill form with suggestion data
                                      setFormData(prev => ({
                                        ...prev,
                                        complaintType: suggestion.type,
                                        description: suggestion.description,
                                        severity: suggestion.severity
                                      }));
                                      setActiveTab("form");
                                      toast({
                                        title: "Form Updated",
                                        description: "Complaint form filled with AI suggestion data"
                                      });
                                    }}
                                    size="sm"
                                    className="cyber-btn-primary"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Use Suggestion
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Selected Suggestion Details Modal */}
                    {selectedSuggestion && (
                      <Card className="bg-slate-800/70 border border-purple-500/30">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-purple-300 flex items-center">
                              <BookOpen className="h-5 w-5 mr-2" />
                              Detailed Analysis: {selectedSuggestion.title}
                            </CardTitle>
                            <Button
                              onClick={() => setSelectedSuggestion(null)}
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white"
                            >
                              ×
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="font-semibold text-cyan-300 mb-2">Legal Basis & Laws</h5>
                              <ul className="text-gray-300 space-y-1 text-sm">
                                {selectedSuggestion.legalBasis.map((basis, i) => (
                                  <li key={i}>• {basis}</li>
                                ))}
                              </ul>
                              <div className="mt-4">
                                <h5 className="font-semibold text-cyan-300 mb-2">Applicable Laws</h5>
                                <ul className="text-gray-300 space-y-1 text-sm">
                                  {selectedSuggestion.applicableLaws.map((law, i) => (
                                    <li key={i}>• {law}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div>
                              <h5 className="font-semibold text-green-300 mb-2">Recommended Actions</h5>
                              <ul className="text-gray-300 space-y-1 text-sm">
                                {selectedSuggestion.suggestedActions.map((action, i) => (
                                  <li key={i}>• {action}</li>
                                ))}
                              </ul>
                              <div className="mt-4">
                                <h5 className="font-semibold text-orange-300 mb-2">Evidence to Collect</h5>
                                <ul className="text-gray-300 space-y-1 text-sm">
                                  {selectedSuggestion.evidence.map((evidence, i) => (
                                    <li key={i}>• {evidence}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          {selectedSuggestion.precedentCases && selectedSuggestion.precedentCases.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-yellow-300 mb-2">Precedent Cases</h5>
                              <ul className="text-gray-300 space-y-1 text-sm">
                                {selectedSuggestion.precedentCases.map((case_name, i) => (
                                  <li key={i}>• {case_name}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-700">
                            <Button
                              onClick={() => legalResearchMutation.mutate(selectedSuggestion)}
                              disabled={legalResearchMutation.isPending}
                              className="cyber-btn-secondary"
                            >
                              {legalResearchMutation.isPending ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Researching...
                                </>
                              ) : (
                                <>
                                  <Users className="h-4 w-4 mr-2" />
                                  Get Legal Research
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  complaintType: selectedSuggestion.type,
                                  description: selectedSuggestion.description,
                                  severity: selectedSuggestion.severity
                                }));
                                setSelectedSuggestion(null);
                                setActiveTab("form");
                                toast({
                                  title: "Form Updated",
                                  description: "Complaint form filled with detailed AI analysis"
                                });
                              }}
                              className="cyber-btn-primary"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Use This Analysis
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evidence Tab */}
          <TabsContent value="evidence" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Evidence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label htmlFor="evidence-upload" className="cursor-pointer block">
                    <Upload className="h-12 w-12 mx-auto text-cyan-400 mb-4" />
                    <p className="text-cyan-300 text-lg font-medium mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-gray-400 text-sm">
                      Photos, videos, audio recordings, documents (PDF, DOC, TXT)
                    </p>
                  </label>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                    <p className="text-cyan-300">Uploading evidence...</p>
                  </div>
                )}

                {/* Uploaded Evidence List */}
                {(evidenceFiles.length > 0 || (Array.isArray(complaintEvidence) && complaintEvidence.length > 0)) && (
                  <div className="space-y-3">
                    <h3 className="text-cyan-300 font-medium">Uploaded Evidence</h3>
                    
                    {/* Show locally added evidence files */}
                    {evidenceFiles.filter(evidence => evidence && evidence.evidenceType).map((evidence: any) => (
                      <div key={evidence.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            evidence.evidenceType === 'photo' ? 'bg-blue-400' :
                            evidence.evidenceType === 'video' ? 'bg-purple-400' :
                            evidence.evidenceType === 'audio' ? 'bg-green-400' :
                            'bg-yellow-400'
                          }`} />
                          <div>
                            <p className="text-cyan-300 text-sm font-medium">{evidence.fileName || 'Unknown file'}</p>
                            <p className="text-gray-400 text-xs">{(evidence.evidenceType || 'unknown').toUpperCase()}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-cyan-300 border-cyan-500/30">
                          {evidence.fileSize ? `${(evidence.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                        </Badge>
                      </div>
                    ))}

                    {/* Show database evidence files */}
                    {Array.isArray(complaintEvidence) && complaintEvidence.map((evidence: ComplaintEvidence) => (
                      <div key={evidence.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            evidence.evidenceType === 'photo' ? 'bg-blue-400' :
                            evidence.evidenceType === 'video' ? 'bg-purple-400' :
                            evidence.evidenceType === 'audio' ? 'bg-green-400' :
                            'bg-yellow-400'
                          }`} />
                          <div>
                            <p className="text-cyan-300 text-sm font-medium">{evidence.fileName}</p>
                            <p className="text-gray-400 text-xs">{evidence.evidenceType.toUpperCase()}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-cyan-300 border-cyan-500/30">
                          {evidence.fileSize ? `${(evidence.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Continue Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setActiveTab("review")}
                    className="cyber-btn-primary"
                  >
                    Continue to Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Review Your Complaint
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Complaint Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-cyan-300 font-medium border-b border-cyan-500/30 pb-2">Incident Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-cyan-300">{formData.complaintType.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-cyan-300">{formData.incidentDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time:</span>
                        <span className="text-cyan-300">{formData.incidentTime || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Severity:</span>
                        <Badge className={`${
                          formData.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                          formData.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                          formData.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {formData.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-cyan-300 font-medium border-b border-cyan-500/30 pb-2">Officer Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-cyan-300">{formData.officerName || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Badge #:</span>
                        <span className="text-cyan-300">{formData.officerBadgeNumber || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Department:</span>
                        <span className="text-cyan-300">{formData.department || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Jurisdiction:</span>
                        <span className="text-cyan-300">{formData.jurisdiction}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="text-cyan-300 font-medium border-b border-cyan-500/30 pb-2">Incident Description</h3>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20">
                    <p className="text-gray-300 whitespace-pre-wrap">{formData.description}</p>
                  </div>
                </div>

                {/* Witness Information */}
                {formData.witnessNames && (
                  <div className="space-y-3">
                    <h3 className="text-cyan-300 font-medium border-b border-cyan-500/30 pb-2">Witness Information</h3>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20">
                      <p className="text-gray-300">{formData.witnessNames}</p>
                    </div>
                  </div>
                )}

                {/* Desired Outcome */}
                {formData.desiredOutcome && (
                  <div className="space-y-3">
                    <h3 className="text-cyan-300 font-medium border-b border-cyan-500/30 pb-2">Desired Outcome</h3>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20">
                      <p className="text-gray-300">{formData.desiredOutcome}</p>
                    </div>
                  </div>
                )}

                {/* Evidence Summary */}
                {(evidenceFiles.length > 0 || (Array.isArray(complaintEvidence) && complaintEvidence.length > 0)) && (
                  <div className="space-y-3">
                    <h3 className="text-cyan-300 font-medium border-b border-cyan-500/30 pb-2">Evidence Attached</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Show locally added evidence */}
                      {evidenceFiles.filter(evidence => evidence && evidence.evidenceType).map((evidence: any) => (
                        <div key={evidence.id} className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20 text-center">
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            evidence.evidenceType === 'photo' ? 'bg-blue-500/20' :
                            evidence.evidenceType === 'video' ? 'bg-purple-500/20' :
                            evidence.evidenceType === 'audio' ? 'bg-green-500/20' :
                            'bg-yellow-500/20'
                          }`}>
                            <Upload className="h-4 w-4 text-cyan-300" />
                          </div>
                          <p className="text-cyan-300 text-xs font-medium truncate">{evidence.fileName || 'Unknown file'}</p>
                          <p className="text-gray-400 text-xs">{evidence.evidenceType || 'unknown'}</p>
                        </div>
                      ))}
                      {/* Show database evidence */}
                      {Array.isArray(complaintEvidence) && complaintEvidence.map((evidence: ComplaintEvidence) => (
                        <div key={evidence.id} className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20 text-center">
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            evidence.evidenceType === 'photo' ? 'bg-blue-500/20' :
                            evidence.evidenceType === 'video' ? 'bg-purple-500/20' :
                            evidence.evidenceType === 'audio' ? 'bg-green-500/20' :
                            'bg-yellow-500/20'
                          }`}>
                            <Upload className="h-4 w-4 text-cyan-300" />
                          </div>
                          <p className="text-cyan-300 text-xs font-medium truncate">{evidence.fileName}</p>
                          <p className="text-gray-400 text-xs">{evidence.evidenceType}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Information */}
                {location && (
                  <div className="space-y-3">
                    <h3 className="text-cyan-300 font-medium border-b border-cyan-500/30 pb-2">Location</h3>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20">
                      <p className="text-gray-300 text-sm">{location.address}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setActiveTab("submit")}
                    className="cyber-btn-primary"
                  >
                    Continue to Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submit Tab */}
          <TabsContent value="submit" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit Complaint
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Submission Options */}
                <div className="space-y-4">
                  <h3 className="text-cyan-300 font-medium border-b border-cyan-500/30 pb-2">Submission Method</h3>
                  
                  {/* Attorney Email Option */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="attorney-email"
                        name="submission-method"
                        defaultChecked
                        className="w-4 h-4 text-cyan-500 border-cyan-500/30 focus:ring-cyan-500 focus:ring-2"
                      />
                      <label htmlFor="attorney-email" className="text-cyan-300 font-medium">
                        Send to Attorney via Email
                      </label>
                    </div>
                    
                    <div className="ml-7 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="attorney-email-input" className="text-gray-300">
                          Attorney Email Address *
                        </Label>
                        <Input
                          id="attorney-email-input"
                          type="email"
                          placeholder="attorney@lawfirm.com"
                          className="cyber-input"
                          defaultValue="civilrights@attorneygeneral.gov"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="additional-message" className="text-gray-300">
                          Additional Message (Optional)
                        </Label>
                        <Textarea
                          id="additional-message"
                          placeholder="Any additional information or requests..."
                          className="cyber-input min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Department Filing Option */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="department-filing"
                        name="submission-method"
                        className="w-4 h-4 text-cyan-500 border-cyan-500/30 focus:ring-cyan-500 focus:ring-2"
                      />
                      <label htmlFor="department-filing" className="text-cyan-300 font-medium">
                        File with Police Department Internal Affairs
                      </label>
                    </div>
                    
                    <div className="ml-7">
                      <p className="text-gray-400 text-sm">
                        Submit directly to {formData.department || 'the police department'} Internal Affairs Division
                      </p>
                    </div>
                  </div>

                  {/* Civilian Review Board Option */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="civilian-review"
                        name="submission-method"
                        className="w-4 h-4 text-cyan-500 border-cyan-500/30 focus:ring-cyan-500 focus:ring-2"
                      />
                      <label htmlFor="civilian-review" className="text-cyan-300 font-medium">
                        File with Civilian Review Board
                      </label>
                    </div>
                    
                    <div className="ml-7">
                      <p className="text-gray-400 text-sm">
                        Submit to independent civilian oversight body for {formData.jurisdiction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submission Summary */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20">
                  <h4 className="text-cyan-300 font-medium mb-3">Submission Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Complaint ID:</span>
                      <span className="text-cyan-300">{complaintId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Evidence Files:</span>
                      <span className="text-cyan-300">
                        {Array.isArray(complaintEvidence) ? complaintEvidence.length : 0} files
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Incident Type:</span>
                      <span className="text-cyan-300">{formData.complaintType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Jurisdiction:</span>
                      <span className="text-cyan-300">{formData.jurisdiction}</span>
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-yellow-300 font-medium mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Important Notice
                  </h4>
                  <p className="text-yellow-200 text-sm">
                    Once submitted, this complaint will be officially filed and tracked. You will receive a confirmation 
                    email with your complaint number and next steps. This action cannot be undone.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => {
                      const attorneyEmail = (document.getElementById('attorney-email-input') as HTMLInputElement)?.value || 'civilrights@attorneygeneral.gov';
                      const additionalMessage = (document.getElementById('additional-message') as HTMLTextAreaElement)?.value || '';
                      
                      submitComplaintMutation.mutate({
                        attorneyEmail,
                        message: additionalMessage
                      });
                    }}
                    disabled={submitComplaintMutation.isPending}
                    className="cyber-btn-primary px-8 py-3 text-lg"
                  >
                    {submitComplaintMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Submit Complaint
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}