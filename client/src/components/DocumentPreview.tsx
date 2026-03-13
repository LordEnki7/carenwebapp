import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { LegalDocumentTemplate } from "@shared/schema";

interface DocumentPreviewProps {
  template: LegalDocumentTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentPreview({ template, isOpen, onClose }: DocumentPreviewProps) {
  if (!template) return null;

  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTypeName = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPlaceholders = (templateText: string) => {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders = new Set<string>();
    let match;
    
    while ((match = placeholderRegex.exec(templateText)) !== null) {
      placeholders.add(match[1]);
    }
    
    return Array.from(placeholders);
  };

  const placeholders = getPlaceholders(template.template);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.name}
          </DialogTitle>
          <DialogDescription>
            Preview of the {formatTypeName(template.type)} template
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Information */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Template Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {formatCategoryName(template.category)}
                  </Badge>
                  <Badge variant="outline">
                    {formatTypeName(template.type)}
                  </Badge>
                </div>
                {template.state && (
                  <Badge variant="outline" className="text-xs">
                    {template.state} Specific
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Required Fields</h3>
              <div className="space-y-1">
                {Array.isArray(template.fields) && template.fields.map((field: string) => (
                  <div key={field} className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-700">
                    {field}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">All Placeholders</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {placeholders.map((placeholder) => (
                  <div key={placeholder} className="text-xs px-2 py-1 bg-blue-50 rounded text-blue-700">
                    {`{{${placeholder}}}`}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Template Preview */}
          <div className="lg:col-span-2">
            <h3 className="font-medium mb-2">Template Content</h3>
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {template.template}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}