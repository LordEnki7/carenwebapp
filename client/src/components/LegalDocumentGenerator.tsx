import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Download, Eye, Plus, Zap, Grid3X3 } from "lucide-react";
import type { LegalDocumentTemplate, GeneratedLegalDocument, Incident } from "@shared/schema";
import DocumentTemplateCard from "./DocumentTemplateCard";
import DocumentPreview from "./DocumentPreview";

export default function LegalDocumentGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<number | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [viewDocument, setViewDocument] = useState<GeneratedLegalDocument | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [autoGenerateMode, setAutoGenerateMode] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<LegalDocumentTemplate | null>(null);
  const [showTemplateGrid, setShowTemplateGrid] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch legal document templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/legal-document-templates'],
    retry: false,
  });

  // Fetch user incidents
  const { data: incidents = [], isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/incidents'],
    retry: false,
  });

  // Fetch generated documents
  const { data: generatedDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/generated-legal-documents'],
    retry: false,
  });

  // Generate document mutation
  const generateDocument = useMutation({
    mutationFn: async (data: { templateId: number; incidentId?: number; customFields?: Record<string, string> }) => {
      return await apiRequest("POST", "/api/generated-legal-documents", data);
    },
    onSuccess: () => {
      toast({
        title: "Document Generated",
        description: "Your legal document has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/generated-legal-documents'] });
      setSelectedTemplate(null);
      setSelectedIncident(null);
      setCustomFields({});
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate document",
        variant: "destructive",
      });
    },
  });

  // Auto-generate documents bundle mutation
  const generateDocumentBundle = useMutation({
    mutationFn: async (data: { incidentId: number }) => {
      return await apiRequest("POST", "/api/generated-legal-documents/bundle", data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Document Bundle Generated",
        description: `Generated ${response.count} documents automatically from your incident data.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/generated-legal-documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Bundle Generation Failed",
        description: error.message || "Failed to generate document bundle",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a document template",
        variant: "destructive",
      });
      return;
    }

    generateDocument.mutate({
      templateId: selectedTemplate,
      incidentId: selectedIncident || undefined,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    });
  };

  const downloadDocument = (document: GeneratedLegalDocument) => {
    const blob = new Blob([document.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getTemplateFields = (templateId: number): string[] => {
    const template = templates.find((t: LegalDocumentTemplate) => t.id === templateId);
    return template?.fields as string[] || [];
  };

  const requiredFields = selectedTemplate ? getTemplateFields(selectedTemplate) : [];
  const customFieldsNeeded = requiredFields.filter(field => 
    !['userName', 'userEmail', 'incidentDate', 'incidentTime', 'incidentLocation', 'incidentDescription', 'incidentTitle', 'incidentPriority', 'incidentStatus', 'date', 'currentDate'].includes(field)
  );

  // Filter templates by category
  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter((t: LegalDocumentTemplate) => t.category === selectedCategory);

  // Get unique categories for filter
  const categories = Array.from(new Set(templates.map((t: LegalDocumentTemplate) => t.category)));

  if (templatesLoading || incidentsLoading || documentsLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Automated Legal Document Templates
          </CardTitle>
          <CardDescription>
            Generate comprehensive legal documentation automatically from your incident data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {incidents.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Quick Document Generation</h3>
              <p className="text-sm text-blue-700 mb-3">
                Generate complete document packages automatically based on your incidents
              </p>
              <div className="flex flex-wrap gap-2">
                {incidents.slice(0, 3).map((incident: Incident) => (
                  <Button
                    key={incident.id}
                    variant="outline"
                    size="sm"
                    onClick={() => generateDocumentBundle.mutate({ incidentId: incident.id })}
                    disabled={generateDocumentBundle.isPending}
                    className="text-xs"
                  >
                    Generate Bundle: {incident.title}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Custom Document Generation
          </CardTitle>
          <CardDescription>
            Create specific legal documents from templates using your incident data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Filter */}
          <div>
            <Label>Document Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Document Template</Label>
              <Select value={selectedTemplate?.toString() || ""} onValueChange={(value) => setSelectedTemplate(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map((template: LegalDocumentTemplate) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        <span className="text-xs text-gray-500">{template.type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Related Incident (Optional)</Label>
              <Select value={selectedIncident?.toString() || ""} onValueChange={(value) => setSelectedIncident(value === "none" ? null : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an incident" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No incident</SelectItem>
                  {incidents.map((incident: Incident) => (
                    <SelectItem key={incident.id} value={incident.id.toString()}>
                      {incident.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Fields */}
          {customFieldsNeeded.length > 0 && (
            <div className="space-y-3">
              <Label>Additional Information Required</Label>
              {customFieldsNeeded.map((field) => (
                <div key={field}>
                  <Label className="text-sm text-muted-foreground capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Input
                    placeholder={`Enter ${field}`}
                    value={customFields[field] || ''}
                    onChange={(e) => setCustomFields(prev => ({ ...prev, [field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={!selectedTemplate || generateDocument.isPending}
            className="w-full"
          >
            {generateDocument.isPending ? "Generating..." : "Generate Document"}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Generated Documents
          </CardTitle>
          <CardDescription>
            View and download your previously generated legal documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents generated yet. Create your first document above.
            </div>
          ) : (
            <div className="space-y-3">
              {generatedDocuments.map((document: GeneratedLegalDocument) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{document.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(document.createdAt!).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{document.status || 'draft'}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewDocument(document)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewDocument?.title}</DialogTitle>
            <DialogDescription>
              Generated on {viewDocument?.createdAt ? new Date(viewDocument.createdAt).toLocaleDateString() : ''}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-muted rounded-lg">
              {viewDocument?.content}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewDocument(null)}>
              Close
            </Button>
            {viewDocument && (
              <Button onClick={() => downloadDocument(viewDocument)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}