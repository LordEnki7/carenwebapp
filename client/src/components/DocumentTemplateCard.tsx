import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Info } from "lucide-react";
import type { LegalDocumentTemplate } from "@shared/schema";

interface DocumentTemplateCardProps {
  template: LegalDocumentTemplate;
  onSelect: (templateId: number) => void;
  onPreview: (template: LegalDocumentTemplate) => void;
  isSelected: boolean;
}

export default function DocumentTemplateCard({ 
  template, 
  onSelect, 
  onPreview, 
  isSelected 
}: DocumentTemplateCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'traffic_stop': return '🚔';
      case 'civil_rights': return '⚖️';
      case 'personal_injury': return '🏥';
      case 'property_damage': return '🔧';
      case 'insurance': return '📄';
      case 'emergency': return '🚨';
      case 'legal_rights': return '📋';
      case 'follow_up': return '✅';
      default: return '📄';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'traffic_stop': return 'bg-blue-100 text-blue-800';
      case 'civil_rights': return 'bg-purple-100 text-purple-800';
      case 'personal_injury': return 'bg-red-100 text-red-800';
      case 'property_damage': return 'bg-orange-100 text-orange-800';
      case 'insurance': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'legal_rights': return 'bg-indigo-100 text-indigo-800';
      case 'follow_up': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => onSelect(template.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getCategoryIcon(template.category)}</span>
            <div>
              <CardTitle className="text-sm font-medium leading-tight">
                {template.name}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {formatTypeName(template.type)}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(template);
            }}
            className="h-6 w-6 p-0"
          >
            <Info className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getCategoryColor(template.category)}`}
          >
            {formatCategoryName(template.category)}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FileText className="h-3 w-3" />
            {Array.isArray(template.fields) ? template.fields.length : 0} fields
          </div>
        </div>
        
        {template.state && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {template.state} Specific
            </Badge>
          </div>
        )}
        
        <div className="mt-3">
          <Button 
            size="sm" 
            className="w-full text-xs h-7"
            variant={isSelected ? "default" : "outline"}
          >
            <Plus className="h-3 w-3 mr-1" />
            {isSelected ? 'Selected' : 'Use Template'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}