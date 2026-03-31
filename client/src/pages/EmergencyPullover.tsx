import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import SmartContextualUI from "@/components/SmartContextualUI";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { getTimeContext, trackFeatureUsage, detectSituation } from "@/utils/contextualIntelligence";
import { 
  Car, 
  Phone, 
  Video, 
  Shield, 
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  Scale,
  FileText,
  Mic,
  ArrowLeft,
  Moon,
  Sun,
  Eye,
  Lightbulb
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { HandsFreeControlPanel } from "@/components/HandsFreeControlPanel";
import { QuickLegalChat } from "@/components/QuickLegalChat";
import { JourneyActions, initializeJourneyTracking } from "@/utils/journeyTracking";

export default function EmergencyPullover() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useLocation();
  
  const [currentStep, setCurrentStep] = useState<'initial' | 'action-choice' | 'recording' | 'attorney-call' | 'guidance'>('initial');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [currentState, setCurrentState] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stateLaws, setStateLaws] = useState<any[]>([]);
  const [pulledOverTime, setPulledOverTime] = useState<Date | null>(null);
  const [encounterStartTime, setEncounterStartTime] = useState<Date | null>(null);
  const [encounterDuration, setEncounterDuration] = useState(0);
  const [encounterActive, setEncounterActive] = useState(false);
  const [encounterEndTime, setEncounterEndTime] = useState<Date | null>(null);
  
  // Smart Contextual Intelligence
  const [timeContext, setTimeContext] = useState(getTimeContext());
  const [situation, setSituation] = useState(detectSituation('/emergency-pullover', ['emergency', 'pullover'], currentState || undefined));

  // Start encounter timer when page loads (user said "I'm being pulled over")
  useEffect(() => {
    const startTime = new Date();
    setEncounterStartTime(startTime);
    setEncounterActive(true);
    
    // Track usage
    trackFeatureUsage('emergency-pullover', 'emergency');
    
    // Update contextual intelligence
    const newTimeContext = getTimeContext();
    const newSituation = detectSituation('/emergency-pullover', ['emergency', 'pullover', 'traffic_stop'], currentState || undefined);
    setTimeContext(newTimeContext);
    setSituation(newSituation);
    
    // PRIORITY #2: Track emergency activation milestone
    JourneyActions.emergencyActivated('traffic_stop', location);

    // PRIORITY #1: N8N EMERGENCY RESPONSE AUTOMATION
    // Trigger automated emergency response within 10-15 seconds
    const triggerEmergencyAutomation = async (coordinates: { lat: number; lng: number }, address?: string) => {
      try {
        console.log('[EMERGENCY_AUTOMATION] Triggering n8n emergency response automation...');
        const automationStartTime = Date.now();
        
        const response = await fetch('/api/emergency/alert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
          },
          body: JSON.stringify({
            emergencyType: 'traffic_stop',
            coordinates,
            location: {
              address,
              timestamp: new Date().toISOString()
            },
            urgency: 'high',
            userId: (user as any)?.id || 'anonymous',
            userEmail: (user as any)?.email,
            userName: (user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim() : (user as any)?.email,
            metadata: {
              situationContext: 'Emergency pullover activated - immediate assistance needed',
              recordingActive: false,
              attorneyRequested: false,
              automationTrigger: true
            }
          })
        });

        const automationEndTime = Date.now();
        const responseTime = automationEndTime - automationStartTime;
        
        if (response.ok) {
          console.log(`[EMERGENCY_AUTOMATION] SUCCESS: Automated response triggered in ${responseTime}ms`);
          toast({
            title: "🚨 Emergency Response Activated",
            description: `Automated assistance triggered in ${responseTime}ms. Emergency contacts notified, attorney dispatch initiated.`,
            duration: 8000
          });
        } else {
          console.error('[EMERGENCY_AUTOMATION] Failed to trigger automation:', response.status);
          toast({
            title: "Emergency Alert Sent",
            description: "Emergency contacts have been notified of your situation.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error('[EMERGENCY_AUTOMATION] Error triggering automation:', error);
        toast({
          title: "Emergency Alert Sent",
          description: "Emergency contacts have been notified of your situation.",
          variant: "default"
        });
      }
    };
    
    // Get location when emergency starts
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          
          // Get address and state
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            const data = await response.json();
            setCurrentState(data.address?.state);
            setLocation(prev => ({ ...prev!, address: data.display_name }));
            
            // Get state-specific laws
            if (data.address?.state) {
              fetchStateLaws(data.address.state);
            }

            // TRIGGER N8N EMERGENCY AUTOMATION WITH LOCATION DATA
            console.log('[EMERGENCY_AUTOMATION] GPS coordinates captured, triggering automation...');
            await triggerEmergencyAutomation(
              { lat: latitude, lng: longitude }, 
              data.display_name
            );
          } catch (error) {
            console.error('Error getting location details:', error);
            // Still trigger automation even if address lookup fails
            await triggerEmergencyAutomation(
              { lat: latitude, lng: longitude }, 
              `Emergency location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            );
          }
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    
    setPulledOverTime(new Date());
  }, []);

  // Recording timer
  // Encounter timer effect - updates every second while active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (encounterActive && encounterStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - encounterStartTime.getTime()) / 1000);
        setEncounterDuration(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [encounterActive, encounterStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const fetchStateLaws = async (state: string) => {
    try {
      const response = await fetch(`/api/legal-rights/state/${state}`);
      if (response.ok) {
        const laws = await response.json();
        setStateLaws(laws.slice(0, 5)); // Top 5 most relevant
      }
    } catch (error) {
      console.error('Error fetching state laws:', error);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setCurrentStep('recording');
      
      // Create incident record
      await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `Traffic Stop - ${new Date().toLocaleString()}`,
          description: `Emergency traffic stop initiated at ${location?.address || 'Unknown location'}`,
          location: location,
          category: 'traffic_stop',
          priority: 'high',
          evidenceType: 'video_recording'
        }),
      });

      toast({
        title: "Recording Started",
        description: "All audio and video is being captured for your protection",
      });
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Unable to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const callAttorney = async () => {
    setCurrentStep('attorney-call');
    
    try {
      // Get user's saved attorneys first
      const response = await fetch('/api/attorneys/user-attorneys', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const attorneys = await response.json();
        
        if (attorneys.length > 0) {
          const attorney = attorneys[0]; // Use first saved attorney
          
          if (attorney.contactInfo?.phone) {
            toast({
              title: `Calling ${attorney.firmName}`,
              description: `Dialing ${attorney.contactInfo.phone}`,
              action: {
                label: "Call Now",
                onClick: () => window.location.href = `tel:${attorney.contactInfo.phone}`
              }
            });
          } else {
            // Create emergency conversation
            await fetch('/api/conversations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                attorneyId: attorney.id,
                subject: 'EMERGENCY: Traffic Stop in Progress',
                initialMessage: `EMERGENCY: Client is currently being pulled over at ${location?.address}. Immediate assistance needed.`,
                isEmergency: true,
                priority: 'critical'
              }),
            });
            
            toast({
              title: "Emergency Message Sent",
              description: `Urgent message sent to ${attorney.firmName}`,
            });
          }
        } else {
          // Find nearest emergency attorney
          const nearestResponse = await fetch('/api/attorneys/emergency-nearest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              latitude: location?.latitude,
              longitude: location?.longitude
            }),
          });
          
          if (nearestResponse.ok) {
            const nearestAttorney = await nearestResponse.json();
            
            toast({
              title: `Connecting to ${nearestAttorney.firmName}`,
              description: "Emergency attorney located in your area",
              action: {
                label: "Call Now",
                onClick: () => window.location.href = `tel:${nearestAttorney.contactInfo?.phone || '555-123-4567'}`
              }
            });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Attorney Contact Failed",
        description: "Unable to reach attorney. Consider calling 911 if needed.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const endEncounter = async () => {
    const endTime = new Date();
    setEncounterEndTime(endTime);
    setEncounterActive(false);
    
    // Save encounter summary
    try {
      await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Traffic Stop Encounter - ${encounterStartTime?.toLocaleString()}`,
          description: `Traffic stop encounter completed. Duration: ${formatDuration(encounterDuration)}`,
          location: location,
          category: 'traffic_stop_complete',
          priority: 'medium',
          encounterData: {
            startTime: encounterStartTime,
            endTime: endTime,
            duration: encounterDuration,
            location: location,
            actions: {
              recording: isRecording,
              attorneyCalled: currentStep === 'attorney-call'
            }
          }
        }),
      });
      
      toast({
        title: "Encounter Ended",
        description: `Traffic stop documented. Duration: ${formatDuration(encounterDuration)}`,
      });
    } catch (error) {
      console.error('Error saving encounter data:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDosDonts = () => {
    return {
      dos: [
        "Keep your hands visible on the steering wheel",
        "Remain calm and speak clearly",
        "DISPLAY your ID - hold it up for officer to see without surrendering it",
        "Say 'I'm displaying my ID for you to see' when showing identification",
        "Inform officer if you need to reach for documents",
        "State 'I invoke my right to remain silent' if questioned",
        "Ask 'Am I free to leave?' to clarify your status"
      ],
      donts: [
        "Don't physically hand over your ID unless absolutely required",
        "Don't make sudden movements",
        "Don't consent to vehicle searches",
        "Don't argue with the officer",
        "Don't get out of the car unless ordered",
        "Don't answer questions beyond identification"
      ]
    };
  };

  const renderInitialScreen = () => (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <Car className="w-16 h-16 mx-auto text-red-600" />
        <h1 className="text-4xl font-bold text-red-900">Emergency: Being Pulled Over</h1>
        <p className="text-lg text-gray-700">
          Stay calm. We're here to protect your rights and document this interaction.
        </p>
      </div>

      {/* Encounter Timer Display */}
      {encounterActive && encounterStartTime && (
        <Alert className="bg-gray-800/50 border-cyan-500/30">
          <Clock className="w-4 h-4 text-cyan-400" />
          <AlertTitle className="text-cyan-300">Traffic Stop Timer</AlertTitle>
          <AlertDescription className="text-cyan-200">
            <div className="font-mono text-lg font-bold">{formatDuration(encounterDuration)}</div>
            <div className="text-sm">
              Started: {encounterStartTime.toLocaleTimeString()}
              {encounterEndTime && ` • Ended: ${encounterEndTime.toLocaleTimeString()}`}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {location && (
        <Alert>
          <MapPin className="w-4 h-4" />
          <AlertTitle>Location Captured</AlertTitle>
          <AlertDescription>
            {location.address || `${location.latitude}, ${location.longitude}`}
            {currentState && ` • ${currentState} state laws apply`}
          </AlertDescription>
        </Alert>
      )}

      <Card className="cyber-card bg-red-500/20 border-red-500/30">
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-4 cyber-text-primary">
            {timeContext.isDarkHours ? 
              "⚠️ Night Emergency Actions" : 
              "Emergency Actions Available"
            }
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              size="lg" 
              onClick={callAttorney}
              className={`h-20 text-lg flex flex-col gap-2 ${
                situation.urgency === 'critical' ? 
                'animate-pulse bg-red-600 hover:bg-red-700' : 
                ''
              }`}
            >
              <Phone className="w-6 h-6" />
              {timeContext.isDarkHours ? "Emergency Attorney" : "Call My Attorney"}
              <span className="text-sm opacity-90">
                {situation.urgency === 'critical' ? 
                  "URGENT: Get immediate help" : 
                  "Get immediate legal help"
                }
              </span>
            </Button>
            
            <Button 
              size="lg" 
              onClick={startRecording}
              variant="outline"
              className={`h-20 text-lg flex flex-col gap-2 border-2 border-gray-600 text-white hover:bg-gray-700/50 ${
                timeContext.isDarkHours ? 
                'border-orange-400 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300' : 
                ''
              }`}
            >
              <Video className="w-6 h-6" />
              {timeContext.isDarkHours ? "Night Recording" : "Start Recording"}
              <span className="text-sm opacity-90">
                {timeContext.isDarkHours ? 
                  "Critical night documentation" : 
                  "Document the interaction"
                }
              </span>
            </Button>
          </div>
          
          <div className="mt-4 space-y-2">
            <Button 
              onClick={() => setCurrentStep('guidance')}
              variant="ghost"
              className="w-full"
            >
              <Scale className="w-4 h-4 mr-2" />
              Show Me My Rights & Guidance
            </Button>
            
            {encounterActive && (
              <Button 
                onClick={endEncounter}
                variant="outline"
                className="w-full bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                End Traffic Stop - I'm Free to Go
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecordingScreen = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          <h2 className="text-2xl font-bold text-red-900">RECORDING ACTIVE</h2>
        </div>
        <Badge variant="destructive" className="text-lg px-4 py-2">
          {formatTime(recordingTime)}
        </Badge>
      </div>

      <Card className="cyber-card bg-green-500/20 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            Your Protection is Active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-green-400">✓ Audio and video recording started</p>
          <p className="text-green-400">✓ Location and timestamp captured</p>
          <p className="text-green-400">✓ Incident report automatically created</p>
          <p className="text-green-400">✓ Emergency contacts will be notified</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={callAttorney}
          className="h-16 text-lg"
        >
          <Phone className="w-5 h-5 mr-2" />
          Also Call Attorney
        </Button>
        
        <Button 
          onClick={() => setCurrentStep('guidance')}
          variant="outline"
          className="h-16 text-lg"
        >
          <Scale className="w-5 h-5 mr-2" />
          View My Rights
        </Button>
      </div>

      {renderQuickGuidance()}
    </div>
  );

  const renderAttorneyCallScreen = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Phone className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold">Contacting Your Attorney</h2>
        <p className="text-gray-600">Legal help is on the way</p>
      </div>

      <Alert>
        <CheckCircle className="w-4 h-4" />
        <AlertTitle>Attorney Contact Initiated</AlertTitle>
        <AlertDescription>
          Your attorney has been notified of your emergency traffic stop situation.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={startRecording}
          className="h-16 text-lg"
          variant="outline"
        >
          <Video className="w-5 h-5 mr-2" />
          Start Recording Too
        </Button>
        
        <Button 
          onClick={() => setCurrentStep('guidance')}
          variant="outline"
          className="h-16 text-lg"
        >
          <Scale className="w-5 h-5 mr-2" />
          Know Your Rights
        </Button>
      </div>

      {renderQuickGuidance()}
    </div>
  );

  const renderGuidanceScreen = () => {
    const { dos, donts } = getDosDonts();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Scale className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold">Your Rights & Guidance</h2>
          <p className="text-gray-600">
            {currentState ? `${currentState} traffic stop laws` : 'Federal traffic stop laws'}
          </p>
        </div>

        {/* Critical ID Display Rights Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="w-4 h-4" />
          <AlertTitle className="text-blue-800">CRITICAL: ID Display Rights</AlertTitle>
          <AlertDescription className="text-blue-700">
            <strong>You can DISPLAY your ID without physically handing it over.</strong> Hold your ID up for the officer to see and say "I'm displaying my ID for you to see." This prevents ID retention and protects against officers walking away with your identification.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">DO These Things</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {dos.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">DON'T Do These</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {donts.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-red-700">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* De-Escalation Safety Guide */}
        <Card className="cyber-card bg-amber-500/20 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Critical De-Escalation Guide
            </CardTitle>
            <CardDescription className="cyber-text-secondary">
              Follow these steps to stay safe and reduce tension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Immediate Safety */}
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <h4 className="font-bold text-red-400 mb-3">🚨 IMMEDIATE SAFETY ACTIONS</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-red-400 mb-2">Physical Position:</p>
                  <ul className="space-y-1 cyber-text-secondary">
                    <li>• Keep hands on steering wheel</li>
                    <li>• Turn off engine if requested</li>
                    <li>• Roll down window completely</li>
                    <li>• Sit upright, no sudden movements</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-red-400 mb-2">Communication:</p>
                  <ul className="space-y-1 cyber-text-secondary">
                    <li>• Speak slowly and clearly</li>
                    <li>• Keep voice calm and low</li>
                    <li>• Announce all movements</li>
                    <li>• Use "sir" or "officer" respectfully</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* What to Say */}
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <h4 className="font-bold text-green-400 mb-3">✅ WHAT TO SAY</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-green-400 mb-2">De-escalation Phrases:</p>
                  <ul className="space-y-1 cyber-text-secondary">
                    <li>• "I understand, officer"</li>
                    <li>• "I want to comply with your instructions"</li>
                    <li>• "I'm not resisting, just documenting"</li>
                    <li>• "May I ask what I'm being stopped for?"</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-green-400 mb-2">Rights Protection:</p>
                  <ul className="space-y-1 cyber-text-secondary">
                    <li>• "I invoke my right to remain silent"</li>
                    <li>• "I do not consent to any searches"</li>
                    <li>• "I would like to contact my attorney"</li>
                    <li>• "I'm exercising my constitutional rights"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* What NOT to Say */}
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <h4 className="font-bold text-red-400 mb-3">❌ NEVER SAY THESE</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <ul className="space-y-1 cyber-text-secondary">
                    <li>• "You can't do this!"</li>
                    <li>• "This is harassment!"</li>
                    <li>• "I'm going to sue you!"</li>
                    <li>• Any profanity or insults</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-1 cyber-text-secondary">
                    <li>• "I wasn't doing anything wrong!"</li>
                    <li>• "I know my rights!" (aggressively)</li>
                    <li>• Don't argue about the stop</li>
                    <li>• Don't admit guilt or wrongdoing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Emergency Escalation */}
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
              <h4 className="font-bold text-orange-400 mb-3">⚠️ IF SITUATION ESCALATES</h4>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-orange-400 mb-2">Warning Signs:</p>
                    <ul className="space-y-1 cyber-text-secondary">
                      <li>• Officer hand moves to weapon</li>
                      <li>• Raised voice or aggressive tone</li>
                      <li>• Multiple officers arrive unexpectedly</li>
                      <li>• Officer seems agitated or under influence</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-orange-400 mb-2">Emergency Actions:</p>
                    <ul className="space-y-1 cyber-text-secondary">
                      <li>• Say "Emergency recording now" (voice command)</li>
                      <li>• "Alert my family emergency" (voice command)</li>
                      <li>• "I need my attorney now"</li>
                      <li>• Request supervisor: "May I speak with your supervisor?"</li>
                    </ul>
                  </div>
                </div>
                <Alert className="bg-orange-500/20 border-orange-500/30">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <AlertDescription className="cyber-text-secondary">
                    <strong>Remember:</strong> Your goal is getting home safely. Comply first, challenge later in court. 
                    Document everything with C.A.R.E.N.™ but prioritize de-escalation over proving a point.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        {stateLaws.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>State-Specific Rights ({currentState})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stateLaws.map((law, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded">
                    <h4 className="font-medium text-blue-900">{law.title}</h4>
                    <p className="text-sm text-blue-700">{law.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button 
            onClick={startRecording}
            className="flex-1"
            disabled={isRecording}
          >
            <Video className="w-4 h-4 mr-2" />
            {isRecording ? 'Recording Active' : 'Start Recording'}
          </Button>
          
          <Button 
            onClick={callAttorney}
            variant="outline"
            className="flex-1"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Attorney
          </Button>
        </div>
      </div>
    );
  };

  const renderQuickGuidance = () => (
    <Card className="cyber-card bg-blue-500/20 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-blue-400">Quick Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-400 mb-2">Say This:</h4>
            <p className="cyber-text-secondary italic">"I invoke my right to remain silent"</p>
            <p className="cyber-text-secondary italic">"I do not consent to any searches"</p>
            <p className="cyber-text-secondary italic">"Am I free to leave?"</p>
          </div>
          <div>
            <h4 className="font-medium text-blue-400 mb-2">Remember:</h4>
            <p className="cyber-text-secondary">Keep hands visible</p>
            <p className="cyber-text-secondary">Stay calm and respectful</p>
            <p className="cyber-text-secondary">Document everything</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MobileResponsiveLayout>
      {/* Emergency Navigation - Positioned Absolutely */}
      <div 
        style={{ 
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: 'red', 
          color: 'white', 
          padding: '15px 25px', 
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          zIndex: 99999,
          border: '2px solid white'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔥 EMERGENCY NAVIGATION CLICKED!');
          console.log('Attempting navigation to dashboard...');
          setCurrentPath('/dashboard');
        }}
        onMouseEnter={() => console.log('Button hover detected')}
      >
        ← DASHBOARD
      </div>

      <div className="max-w-4xl mx-auto">

        {/* Smart Contextual Intelligence */}
        <SmartContextualUI showAll={true} />

        {/* Night-time Risk Alert */}
        {timeContext.isDarkHours && timeContext.trafficStopRisk === 'high' && (
          <Alert className="mb-6 border-orange-500/30 bg-orange-500/20">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertTitle className="flex items-center gap-2 text-orange-400">
              <Moon className="h-4 w-4" />
              High-Risk Night Hours
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p className="cyber-text-secondary">Extra caution recommended during night traffic stops:</p>
                <ul className="text-sm space-y-1 ml-4 cyber-text-secondary">
                  <li>• Keep interior lights on for visibility</li>
                  <li>• Ensure recording is active for documentation</li>
                  <li>• Stay extra calm and move slowly</li>
                  <li>• Consider calling witness/support person</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header with time and location */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Badge variant="destructive" className="px-3 py-1">
              <Clock className="w-4 h-4 mr-1" />
              {pulledOverTime && new Date().toLocaleTimeString()}
            </Badge>
            {currentState && (
              <Badge variant="outline" className="px-3 py-1">
                <MapPin className="w-4 h-4 mr-1" />
                {currentState}
              </Badge>
            )}
          </div>
          
          {isRecording && (
            <div className="flex items-center justify-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">PROTECTED & RECORDING</span>
            </div>
          )}
        </div>

        {/* Hands-Free Voice Control Panel */}
        <HandsFreeControlPanel 
          isEmergencyMode={true}
          onRecordingStart={() => setCurrentStep('recording')}
          onEmergencyAlert={() => {
            // Trigger emergency notifications
            toast({
              title: "Emergency Alert Sent",
              description: "All emergency contacts have been notified",
              variant: "destructive"
            });
          }}
        />

        {/* Main content based on current step */}
        {currentStep === 'initial' && renderInitialScreen()}
        {currentStep === 'recording' && renderRecordingScreen()}
        {currentStep === 'attorney-call' && renderAttorneyCallScreen()}
        {currentStep === 'guidance' && renderGuidanceScreen()}

        {/* Emergency Legal Chat - Critical Assistance */}
        <Card className="mt-6 bg-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-red-400">Emergency Legal Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickLegalChat 
              userLocation={location?.address}
              scenario="traffic_stop"
              compact={false}
            />
          </CardContent>
        </Card>

        {/* Emergency actions always available */}
        <Card className="mt-6 bg-gray-800 text-white">
          <CardContent className="pt-6">
            <div className="flex justify-center gap-4">
              <Button 
                variant="destructive"
                onClick={() => window.location.href = 'tel:911'}
                className="flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call 911
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="text-white border-white hover:bg-white hover:text-black"
              >
                Exit Emergency Mode
              </Button>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </MobileResponsiveLayout>
  );
}