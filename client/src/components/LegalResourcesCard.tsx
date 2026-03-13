import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Video, Search } from "lucide-react";
import { useState } from "react";
import { US_STATES } from "@/types";
import { useLegalRights } from "@/hooks/useLegalRights";
import { t } from "@/lib/i18n";

export default function LegalResourcesCard() {
  const [selectedState, setSelectedState] = useState("CA");
  const { data: legalRights, isLoading } = useLegalRights(selectedState);

  const rightsByCategory = legalRights?.reduce((acc, right) => {
    if (!acc[right.category]) acc[right.category] = [];
    acc[right.category].push(right);
    return acc;
  }, {} as Record<string, typeof legalRights>) || {};

  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'silence': return Info;
      case 'recording': return Video;
      case 'search': return Search;
      default: return Info;
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t("yourRights")}</h2>
        <p className="text-sm text-gray-600">{t("rightsDescription")}</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("currentState")}
          </label>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(rightsByCategory).map(([category, rights]) => {
              const Icon = getIcon(category);
              const right = rights[0]; // Take first right in category
              
              return (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center">
                    <Icon className="w-4 h-4 text-blue-500 mr-2" />
                    {right.title}
                  </h4>
                  <p className="text-xs text-gray-600">{right.description}</p>
                </div>
              );
            })}
            
            {Object.keys(rightsByCategory).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>No legal rights information available for this state.</p>
              </div>
            )}
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          {t("viewCompleteGuide")}
        </Button>
      </CardContent>
    </Card>
  );
}
