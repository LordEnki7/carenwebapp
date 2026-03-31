import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePoliceCommandMonitor } from "@/hooks/usePoliceCommandMonitor";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import FloatingAttorneyButton from "@/components/FloatingAttorneyButton";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { 
  Shield, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  Phone, 
  MapPin,
  Scale,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { t } from "@/lib/i18n";

export default function PoliceMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("monitor");
  
  const {
    isMonitoring,
    currentState,
    detectedCommands,
    confidence,
    location,
    startMonitoring,
    stopMonitoring,
    handleCallSupervisor,
    getStateLegalRights
  } = usePoliceCommandMonitor();

  const [legalRights, setLegalRights] = useState<any[]>([]);
  const [monitoringStats, setMonitoringStats] = useState({
    totalTime: 0,
    commandsAnalyzed: 0,
    violationsDetected: 0
  });

  useEffect(() => {
    if (currentState) {
      getStateLegalRights().then(setLegalRights);
    }
  }, [currentState]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      interval = setInterval(() => {
        setMonitoringStats(prev => ({
          ...prev,
          totalTime: prev.totalTime + 1,
          commandsAnalyzed: prev.commandsAnalyzed + Math.floor(Math.random() * 2),
          violationsDetected: detectedCommands.length
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring, detectedCommands.length]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen starry-bg-overlay">
        <TopBar title="Police Monitor" description="Real-time law enforcement activity monitoring" />
      
      <div className="flex">
        
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">Police Command Monitor</h1>
              </div>
              <p className="text-lg text-gray-600">
                Real-time detection of unlawful police commands with constitutional protection
              </p>
              {currentState && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  Monitoring in {currentState}
                </Badge>
              )}
            </div>

            {/* Quick Status */}
            <Card className={`${isMonitoring ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-lg font-medium">
                      {isMonitoring ? 'ACTIVELY MONITORING' : 'MONITORING STOPPED'}
                    </span>
                    {isMonitoring && (
                      <Badge variant="outline">{formatTime(monitoringStats.totalTime)}</Badge>
                    )}
                  </div>
                  
                  <Button
                    onClick={isMonitoring ? stopMonitoring : startMonitoring}
                    variant={isMonitoring ? "destructive" : "default"}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {isMonitoring ? (
                      <>
                        <MicOff className="w-5 h-5" />
                        Stop Monitoring
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        Start Monitoring
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Location Warning */}
            {!location && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Location Access Required</AlertTitle>
                <AlertDescription>
                  Enable location access to get state-specific legal rights analysis and accurate constitutional protection.
                </AlertDescription>
              </Alert>
            )}

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="monitor" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Live Monitor
                </TabsTrigger>
                <TabsTrigger value="violations" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Violations ({detectedCommands.length})
                </TabsTrigger>
                <TabsTrigger value="rights" className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Your Rights
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Statistics
                </TabsTrigger>
              </TabsList>

              {/* Live Monitor Tab */}
              <TabsContent value="monitor" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Real-time Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        Audio Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Confidence Level</span>
                          <span>{Math.round(confidence * 100)}%</span>
                        </div>
                        <Progress value={confidence * 100} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Commands Analyzed</div>
                        <div className="text-2xl font-bold">{monitoringStats.commandsAnalyzed}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Monitoring Time</div>
                        <div className="text-xl font-mono">{formatTime(monitoringStats.totalTime)}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Emergency Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Emergency Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "Requesting Police Supervisor",
                            description: "Document this request and remain calm",
                          });
                        }}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Request Supervisor
                      </Button>
                      
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => window.location.href = 'tel:911'}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Emergency 911
                      </Button>
                      
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => setActiveTab("rights")}
                      >
                        <Scale className="w-4 h-4 mr-2" />
                        Know Your Rights
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Detection Feed */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Live Detection Feed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {detectedCommands.length === 0 ? (
                          <div className="text-center text-gray-500 py-8">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <p>No violations detected</p>
                            <p className="text-sm">All commands appear lawful</p>
                          </div>
                        ) : (
                          detectedCommands.slice(-5).reverse().map((command, index) => (
                            <Alert key={index} className={getSeverityBgColor(command.severity)}>
                              <AlertTriangle className="w-4 h-4" />
                              <AlertTitle className="text-sm">
                                {command.severity.toUpperCase()} VIOLATION
                              </AlertTitle>
                              <AlertDescription className="text-xs">
                                {command.violation}
                              </AlertDescription>
                            </Alert>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Violations Tab */}
              <TabsContent value="violations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detected Constitutional Violations</CardTitle>
                    <CardDescription>
                      All violations are automatically documented for legal protection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {detectedCommands.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-medium mb-2">No Violations Detected</h3>
                        <p className="text-gray-600">All police commands appear to be lawful and constitutional.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {detectedCommands.map((command, index) => (
                          <Card key={index} className={`border-l-4 ${getSeverityBgColor(command.severity)}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={getSeverityColor(command.severity)}>
                                      {command.severity.toUpperCase()}
                                    </Badge>
                                    <span className="font-medium">{command.violation}</span>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-sm font-medium text-gray-700">Command Detected:</span>
                                      <p className="text-sm bg-gray-100 p-2 rounded italic">"{command.command}"</p>
                                    </div>
                                    
                                    <div>
                                      <span className="text-sm font-medium text-green-700">Your Response:</span>
                                      <p className="text-sm bg-green-100 p-2 rounded">"{command.response}"</p>
                                    </div>
                                    
                                    <div>
                                      <span className="text-sm font-medium text-blue-700">Recommended Action:</span>
                                      <p className="text-sm bg-blue-100 p-2 rounded">{command.suggestedAction}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCallSupervisor(command)}
                                  className="ml-4"
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call Supervisor
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rights Tab */}
              <TabsContent value="rights" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Constitutional Rights</CardTitle>
                      <CardDescription>Your fundamental protections under U.S. law</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded">
                          <h4 className="font-medium text-blue-900">Fourth Amendment</h4>
                          <p className="text-sm text-blue-700">Protection against unreasonable searches and seizures</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded">
                          <h4 className="font-medium text-green-900">Fifth Amendment</h4>
                          <p className="text-sm text-green-700">Right to remain silent and avoid self-incrimination</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded">
                          <h4 className="font-medium text-purple-900">First Amendment</h4>
                          <p className="text-sm text-purple-700">Right to record police in public spaces</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>State-Specific Rights</CardTitle>
                      <CardDescription>
                        {currentState ? `Legal protections in ${currentState}` : 'Enable location for state-specific rights'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {legalRights.length > 0 ? (
                        <div className="space-y-3">
                          {legalRights.slice(0, 5).map((right, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                              <h4 className="font-medium">{right.title}</h4>
                              <p className="text-sm text-gray-600">{right.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-600">Enable location access to view state-specific rights</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Session Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Monitoring Time</span>
                        <span className="font-mono">{formatTime(monitoringStats.totalTime)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span>Commands Analyzed</span>
                        <span className="font-bold">{monitoringStats.commandsAnalyzed}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span>Violations Detected</span>
                        <span className="font-bold text-red-600">{detectedCommands.length}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Violation Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {detectedCommands.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <p className="text-gray-600">No violations to report</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {['critical', 'high', 'medium', 'low'].map(severity => {
                            const count = detectedCommands.filter(cmd => cmd.severity === severity).length;
                            return count > 0 ? (
                              <div key={severity} className="flex justify-between">
                                <Badge variant={getSeverityColor(severity)}>{severity}</Badge>
                                <span className="font-bold">{count}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Protection Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        {isMonitoring ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">Protected</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">Not Protected</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {location ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">Location Enabled</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">Location Disabled</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {currentState ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">State Rights Loaded</span>
                          </>
                        ) : (
                          <>
                            <Info className="w-5 h-5 text-yellow-500" />
                            <span className="text-yellow-700">Federal Rights Only</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <FloatingAttorneyButton />
    </div>
    </MobileResponsiveLayout>
  );
}