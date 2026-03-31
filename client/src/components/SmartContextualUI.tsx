import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { 
  Clock, 
  Moon, 
  Sun, 
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  getTimeContext,
  detectSituation,
  getPredictiveFeatures,
  getContextualHelp,
  trackFeatureUsage,
  type TimeContext,
  type SituationContext,
  type PredictiveFeature,
  type ContextualHelp
} from "@/utils/contextualIntelligence";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SmartContextualUIProps {
  className?: string;
  showAll?: boolean;
}

export default function SmartContextualUI({ 
  className,
  showAll = false 
}: SmartContextualUIProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [timeContext, setTimeContext] = useState<TimeContext>(getTimeContext());
  const [situation, setSituation] = useState<SituationContext>(detectSituation(location));
  const [predictiveFeatures, setPredictiveFeatures] = useState<PredictiveFeature[]>([]);
  const [contextualHelp, setContextualHelp] = useState<ContextualHelp>({ pageId: '', tips: [], quickActions: [], relatedFeatures: [] });
  const [showTimeAlert, setShowTimeAlert] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);

  const userTier = user?.subscriptionTier || 'free';

  // Update contexts when location or time changes
  useEffect(() => {
    const updateContexts = () => {
      const newTimeContext = getTimeContext();
      const newSituation = detectSituation(location, recentActions, user?.currentState || undefined);
      const newPredictiveFeatures = getPredictiveFeatures(newSituation, userTier);
      const newContextualHelp = getContextualHelp(location, newSituation, userTier);

      setTimeContext(newTimeContext);
      setSituation(newSituation);
      setPredictiveFeatures(newPredictiveFeatures);
      setContextualHelp(newContextualHelp);

      // Show time alert for high-risk periods
      setShowTimeAlert(
        newTimeContext.isDarkHours && 
        newTimeContext.trafficStopRisk === 'high' &&
        (newSituation.type === 'emergency' || newSituation.type === 'police_encounter')
      );
    };

    updateContexts();
    
    // Update every minute for time context
    const interval = setInterval(updateContexts, 60000);
    return () => clearInterval(interval);
  }, [location, recentActions, userTier, user?.currentState]);

  // Track page visits
  useEffect(() => {
    const pageFeature = location.split('/').pop() || 'dashboard';
    trackFeatureUsage(pageFeature, situation.type);
    
    // Add to recent actions
    setRecentActions(prev => [pageFeature, ...prev.slice(0, 4)]);
  }, [location, situation.type]);

  const handleFeatureClick = useCallback((feature: PredictiveFeature) => {
    trackFeatureUsage(feature.featureId, 'predictive_suggestion');
    window.location.href = feature.href;
  }, []);

  const getTimeThemeClass = () => {
    if (timeContext.isDarkHours) {
      return "bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-purple-400/30";
    }
    return "bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-cyan-400/30";
  };

  const getSituationColor = (urgency: SituationContext['urgency']) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (!showAll && situation.urgency === 'low' && !timeContext.isDarkHours) {
    return null; // Hide during normal conditions unless showAll is true
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Time Context Alert */}
      {showTimeAlert && (
        <Alert className={cn("border-l-4 border-l-orange-500", getTimeThemeClass())}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>
                High-risk hours: Enhanced caution recommended during night traffic stops.
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowTimeAlert(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Situation Context */}
      {situation.urgency !== 'low' && (
        <Card className={cn("border-l-4", getTimeThemeClass())}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Situation Detected
              <Badge variant={getSituationColor(situation.urgency)}>
                {situation.urgency.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="text-sm text-cyan-300">
              Context: {situation.type.replace('_', ' ').toUpperCase()}
            </div>
            
            {situation.suggestedActions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Quick Actions:</div>
                <div className="flex flex-wrap gap-2">
                  {situation.suggestedActions.slice(0, 3).map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => window.location.href = action.href}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {situation.contextualHelp.length > 0 && (
              <Collapsible open={showHelp} onOpenChange={setShowHelp}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                    <span className="flex items-center gap-2 text-sm">
                      <HelpCircle className="h-3 w-3" />
                      Contextual Tips ({situation.contextualHelp.length})
                    </span>
                    <ChevronRight className={cn("h-3 w-3 transition-transform", showHelp && "rotate-90")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2">
                  {situation.contextualHelp.map((tip, index) => (
                    <div key={index} className="text-xs text-cyan-300 p-2 bg-gray-800/50 rounded">
                      • {tip}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}

      {/* Predictive Feature Suggestions */}
      {predictiveFeatures.length > 0 && (
        <Card className={getTimeThemeClass()}>
          <CardHeader className="pb-2">
            <Collapsible open={showPredictions} onOpenChange={setShowPredictions}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Smart Suggestions
                    <Badge variant="secondary">{predictiveFeatures.length}</Badge>
                  </CardTitle>
                  <ChevronRight className={cn("h-3 w-3 transition-transform", showPredictions && "rotate-90")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-3 space-y-2">
                  {predictiveFeatures.map((feature) => (
                    <div
                      key={feature.featureId}
                      className="flex items-center gap-3 p-2 rounded border hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => handleFeatureClick(feature)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{feature.name}</div>
                        <div className="text-xs text-cyan-300">{feature.reason}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {feature.relevanceScore}%
                      </Badge>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>
      )}

      {/* Context-Sensitive Help */}
      {contextualHelp.tips.length > 0 && showAll && (
        <Card className={getTimeThemeClass()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Page Help
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {contextualHelp.tips.slice(0, 2).map((tip) => (
              <div key={tip.id} className="space-y-1">
                <div className="font-medium text-sm">{tip.title}</div>
                <div className="text-xs text-cyan-300">{tip.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Time Context Indicator */}
      {(timeContext.isDarkHours || showAll) && (
        <div className="flex items-center gap-2 text-xs text-cyan-300">
          {timeContext.isDarkHours ? (
            <Moon className="h-3 w-3" />
          ) : (
            <Sun className="h-3 w-3" />
          )}
          <span>
            {timeContext.timeOfDay.toUpperCase()} • 
            Traffic Risk: {timeContext.trafficStopRisk.toUpperCase()}
          </span>
          <Clock className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}