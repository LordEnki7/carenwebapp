import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scale, 
  MapPin, 
  BookOpen, 
  AlertTriangle, 
  Shield, 
  Eye, 
  Phone,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLegalRights } from '../hooks/useLegalRights';
import { eventBus } from '../../../../src/core/EventBus';

interface LegalRightsDisplayProps {
  location?: { state: string; city?: string };
  situation?: 'traffic_stop' | 'arrest' | 'search' | 'questioning' | 'general';
  className?: string;
}

export default function LegalRightsDisplay({
  location,
  situation = 'general',
  className = ''
}: LegalRightsDisplayProps) {
  const {
    rights,
    currentLocation,
    isLoading,
    error,
    getRightsForSituation,
    getLocationSpecificRights
  } = useLegalRights();

  const [activeRights, setActiveRights] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState('overview');

  // Load rights when component mounts or situation changes
  useEffect(() => {
    const loadRights = async () => {
      let rightsData = [];

      if (situation !== 'general') {
        rightsData = await getRightsForSituation(situation);
      }

      if (location) {
        const locationRights = await getLocationSpecificRights(location.state, location.city);
        rightsData = [...rightsData, ...locationRights];
      }

      setActiveRights(rightsData);
    };

    loadRights();
  }, [situation, location, getRightsForSituation, getLocationSpecificRights]);

  // Listen for legal rights events
  useEffect(() => {
    const handleLegalEvent = (event: any) => {
      console.log(`[LEGAL_RIGHTS] Received event: ${event.type}`, event.payload);

      switch (event.type) {
        case 'legal.rights.request':
        case 'legal.rights.display':
          // Refresh rights display
          setSelectedTab('overview');
          break;

        case 'location.updated':
          if (event.payload.state) {
            getLocationSpecificRights(event.payload.state, event.payload.city);
          }
          break;

        default:
          break;
      }
    };

    eventBus.subscribe('legal.*', handleLegalEvent);
    eventBus.subscribe('location.updated', handleLegalEvent);
    
    return () => {
      eventBus.unsubscribe('legal.*', handleLegalEvent);
      eventBus.unsubscribe('location.updated', handleLegalEvent);
    };
  }, [getLocationSpecificRights]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Get situation-specific icon
  const getSituationIcon = () => {
    switch (situation) {
      case 'traffic_stop':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'arrest':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'search':
        return <Eye className="w-5 h-5 text-yellow-500" />;
      case 'questioning':
        return <Phone className="w-5 h-5 text-green-500" />;
      default:
        return <Scale className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get situation title
  const getSituationTitle = () => {
    switch (situation) {
      case 'traffic_stop':
        return 'Traffic Stop Rights';
      case 'arrest':
        return 'Arrest Rights';
      case 'search':
        return 'Search & Seizure Rights';
      case 'questioning':
        return 'Questioning Rights';
      default:
        return 'Your Legal Rights';
    }
  };

  // Categorize rights
  const categorizeRights = (rightsData: any[]) => {
    const categories = {
      essential: rightsData.filter(r => r.priority === 'high' || r.category === 'constitutional'),
      recording: rightsData.filter(r => r.category === 'recording'),
      interaction: rightsData.filter(r => r.category === 'police_interaction'),
      legal: rightsData.filter(r => r.category === 'legal_procedure'),
      state: rightsData.filter(r => r.scope === 'state' || r.scope === 'local')
    };

    return categories;
  };

  const categories = categorizeRights(activeRights);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading legal rights...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50 dark:bg-red-900/20`}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 dark:text-red-300">Failed to load legal rights</p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-blue-200 bg-blue-50 dark:bg-blue-900/20`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSituationIcon()}
          {getSituationTitle()}
        </CardTitle>
        
        {currentLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{currentLocation.city}, {currentLocation.state}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recording">Recording</TabsTrigger>
            <TabsTrigger value="interaction">Interaction</TabsTrigger>
            <TabsTrigger value="state">State Law</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Essential Rights
              </h4>
              
              {categories.essential.length > 0 ? (
                <div className="space-y-2">
                  {categories.essential.slice(0, 3).map((right, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {right.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {right.description}
                          </p>
                        </div>
                        <Badge variant={right.priority === 'high' ? 'destructive' : 'secondary'}>
                          {right.priority || 'normal'}
                        </Badge>
                      </div>
                      
                      {right.action && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                          <strong>Action:</strong> {right.action}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No essential rights loaded for this situation.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recording" className="space-y-4">
            <ScrollArea className="h-64">
              {categories.recording.length > 0 ? (
                <div className="space-y-3">
                  {categories.recording.map((right, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {right.title}
                        </h5>
                        <Badge variant="outline">{right.scope || 'federal'}</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {right.description}
                      </p>
                      
                      {right.restrictions && (
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                          <strong>Restrictions:</strong> {right.restrictions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No recording rights information available.
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="interaction" className="space-y-4">
            <ScrollArea className="h-64">
              {categories.interaction.length > 0 ? (
                <div className="space-y-3">
                  {categories.interaction.map((right, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {right.title}
                      </h5>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {right.description}
                      </p>
                      
                      {right.examples && (
                        <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          <strong>Example:</strong> {right.examples}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No interaction rights information available.
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="state" className="space-y-4">
            <ScrollArea className="h-64">
              {categories.state.length > 0 ? (
                <div className="space-y-3">
                  {categories.state.map((right, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {right.title}
                        </h5>
                        <Badge variant="secondary">{right.jurisdiction || currentLocation?.state}</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {right.description}
                      </p>
                      
                      {right.statute && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <strong>Statute:</strong> {right.statute}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No state-specific rights information available.
                </p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Quick Action Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                eventBus.emit({
                  type: 'recording.start.emergency',
                  module: '@caren/legal',
                  payload: {
                    situation,
                    location: currentLocation,
                    timestamp: Date.now()
                  }
                });
              }}
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Start Recording
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                eventBus.emit({
                  type: 'legal.rights.share',
                  module: '@caren/legal',
                  payload: {
                    rights: activeRights,
                    situation,
                    location: currentLocation,
                    timestamp: Date.now()
                  }
                });
              }}
            >
              <Clock className="w-3 h-3 mr-1" />
              Share Rights
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}