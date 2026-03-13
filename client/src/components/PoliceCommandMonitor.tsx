import { useState } from 'react';
import { usePoliceCommandMonitor } from '@/hooks/usePoliceCommandMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Shield, AlertTriangle, Phone } from 'lucide-react';

export default function PoliceCommandMonitor() {
  const {
    isMonitoring,
    currentState,
    detectedCommands,
    confidence,
    location,
    startMonitoring,
    stopMonitoring,
    handleCallSupervisor
  } = usePoliceCommandMonitor();

  const [showDetails, setShowDetails] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Police Command Monitor
          {currentState && (
            <Badge variant="outline" className="ml-2">
              {currentState}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monitor Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isMonitoring ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Monitoring
                </>
              )}
            </Button>
            
            {isMonitoring && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">Listening for unlawful commands</span>
              </div>
            )}
          </div>

          {confidence > 0 && (
            <Badge variant="outline">
              {Math.round(confidence * 100)}% confidence
            </Badge>
          )}
        </div>

        {/* Status Information */}
        {!location && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Location access needed for state-specific legal rights analysis.
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Detections */}
        {detectedCommands.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Detected Violations</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>

            {detectedCommands.slice(-3).map((command, index) => (
              <Card key={index} className={`border-l-4 ${getSeverityColor(command.severity)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getSeverityColor(command.severity)}>
                          {command.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">{command.violation}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Command: "{command.command}"
                      </p>
                      
                      {showDetails && (
                        <div className="space-y-2">
                          <div className="p-2 bg-green-50 rounded">
                            <p className="text-sm font-medium text-green-800">Suggested Response:</p>
                            <p className="text-sm text-green-700">"{command.response}"</p>
                          </div>
                          
                          <div className="p-2 bg-blue-50 rounded">
                            <p className="text-sm font-medium text-blue-800">Recommended Action:</p>
                            <p className="text-sm text-blue-700">{command.suggestedAction}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-3"
                      onClick={() => handleCallSupervisor(command)}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call Supervisor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>This monitor analyzes audio for unlawful police commands based on {currentState || 'federal'} law.</p>
          <p>Commands are analyzed for Fourth, Fifth, and First Amendment violations.</p>
          <p>All detections are automatically documented for legal protection.</p>
        </div>
      </CardContent>
    </Card>
  );
}