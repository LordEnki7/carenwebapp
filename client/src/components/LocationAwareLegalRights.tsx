import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLegalRights } from "@/hooks/useLegalRights";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { MapPin, Navigation, RefreshCw, AlertTriangle, Shield, Scale, Info } from "lucide-react";

export default function LocationAwareLegalRights() {
  const { location, isLoading, getCurrentLocation, error } = useGeolocation();
  const { data: legalRights, isLoading: rightsLoading } = useLegalRights(location?.stateCode);
  const [showAllRights, setShowAllRights] = useState(false);

  const stateSpecificRights = legalRights?.filter(right => right.state === location?.stateCode) || [];
  const displayedRights = showAllRights ? stateSpecificRights : stateSpecificRights.slice(0, 3);

  const getStateSpecificInfo = (stateCode: string) => {
    const stateInfo: Record<string, { name: string; highlights: string[]; emergencyNumber?: string }> = {
      'CA': {
        name: 'California',
        highlights: [
          'Strong recording rights - You can record police in public',
          'Vehicle searches require probable cause or consent',
          'Right to remain silent during traffic stops'
        ],
        emergencyNumber: '911'
      },
      'TX': {
        name: 'Texas',
        highlights: [
          'Must provide ID when lawfully detained',
          'Open carry and concealed carry laws vary by location',
          'Recording police is generally protected'
        ],
        emergencyNumber: '911'
      },
      'NY': {
        name: 'New York',
        highlights: [
          'Stop and frisk requires reasonable suspicion',
          'Right to record police in public spaces',
          'Vehicle searches need probable cause'
        ],
        emergencyNumber: '911'
      },
      'FL': {
        name: 'Florida',
        highlights: [
          'Stand Your Ground law applies',
          'Must consent to vehicle searches',
          'Recording police is legally protected'
        ],
        emergencyNumber: '911'
      }
    };

    return stateInfo[stateCode] || {
      name: 'Unknown State',
      highlights: ['General constitutional rights apply'],
      emergencyNumber: '911'
    };
  };

  const stateInfo = location?.stateCode ? getStateSpecificInfo(location.stateCode) : null;

  return (
    <div className="space-y-6">
      {/* Location Status */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Current Location</h3>
                <p className="text-sm text-blue-700">GPS-based legal information</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => getCurrentLocation()}
              disabled={isLoading}
              className="border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {isLoading ? 'Updating...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-amber-800">
                {error.message}. Using general legal information.
              </AlertDescription>
            </Alert>
          ) : location ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {location.city}, {location.stateCode}
                  </p>
                  <p className="text-sm text-gray-600">{location.address}</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {location.stateCode} Laws Apply
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                Accuracy: ±{Math.round(location.accuracy)}m • Updated: {new Date(location.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Getting your location...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* State-Specific Legal Highlights */}
      {stateInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">{stateInfo.name} Legal Highlights</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stateInfo.highlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{highlight}</p>
                </div>
              ))}
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Emergency: {stateInfo.emergencyNumber}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Based on {location?.stateCode} jurisdiction
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Legal Rights */}
      {stateSpecificRights.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Your Rights in {location?.stateCode}</h3>
              </div>
              <Badge variant="secondary">{stateSpecificRights.length} rights</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {rightsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedRights.map((right) => (
                  <div key={right.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{right.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {right.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{right.description}</p>
                    {right.details && (
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer hover:text-blue-600 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          More details
                        </summary>
                        <p className="mt-1 pl-4">{right.details}</p>
                      </details>
                    )}
                  </div>
                ))}
                
                {stateSpecificRights.length > 3 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAllRights(!showAllRights)}
                    className="w-full"
                  >
                    {showAllRights 
                      ? 'Show Less' 
                      : `Show ${stateSpecificRights.length - 3} More Rights`
                    }
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Rights Available */}
      {!rightsLoading && stateSpecificRights.length === 0 && location?.stateCode && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Scale className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h3 className="font-medium text-amber-900 mb-1">
                No State-Specific Rights Available
              </h3>
              <p className="text-sm text-amber-700">
                We don't have specific legal information for {location.stateCode} yet. 
                General constitutional rights still apply.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal Disclaimer */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription className="text-xs">
          This information is for educational purposes only and should not be considered legal advice. 
          Laws can change and vary by municipality. Consult with a qualified attorney for specific legal guidance.
        </AlertDescription>
      </Alert>
    </div>
  );
}