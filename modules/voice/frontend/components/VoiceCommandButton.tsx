import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { useToast } from "@/hooks/use-toast";
import { eventBus } from '../../../../src/core/EventBus';

interface VoiceCommandButtonProps {
  onCommandExecuted?: (command: string) => void;
  showTranscript?: boolean;
  className?: string;
}

export default function VoiceCommandButton({ 
  onCommandExecuted, 
  showTranscript = true,
  className = ""
}: VoiceCommandButtonProps) {
  const [showStatus, setShowStatus] = useState(false);
  const { toast } = useToast();
  
  const { 
    isListening, 
    isSupported, 
    lastCommand,
    error, 
    startListening, 
    stopListening,
    registeredCommands
  } = useVoiceCommands();

  // Emergency command patterns
  const emergencyPatterns = [
    'emergency', 'emergency mode', 'emergency record', 'emergency recording',
    'start emergency', 'begin emergency', 'record emergency', 'help me record',
    'police encounter', 'traffic stop emergency', 'officer approaching',
    'being pulled over', 'pulled over', 'being detained'
  ];

  // Check if command is emergency-related
  const isEmergencyCommand = (command: string): boolean => {
    return emergencyPatterns.some(pattern => 
      command.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  // Handle command execution
  useEffect(() => {
    if (isListening || lastCommand) {
      setShowStatus(true);
      if (lastCommand && onCommandExecuted) {
        onCommandExecuted(lastCommand);
      }

      // Enhanced emergency detection with event bus integration
      if (lastCommand && isEmergencyCommand(lastCommand)) {
        console.log('🚨 EMERGENCY COMMAND DETECTED IN VOICE BUTTON:', lastCommand);
        
        // Emit emergency activation event
        eventBus.emit({
          type: 'emergency.activate',
          module: '@caren/voice',
          payload: {
            level: 'high',
            trigger: 'voice_command',
            command: lastCommand,
            timestamp: Date.now()
          }
        });

        toast({
          title: "Emergency Activated",
          description: `Command recognized: "${lastCommand}"`,
          variant: "destructive"
        });
      }
    }
  }, [isListening, lastCommand, onCommandExecuted, toast]);

  // Show error notifications
  useEffect(() => {
    if (error) {
      toast({
        title: "Voice Command Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      setShowStatus(false);
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Voice commands not supported in this browser
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        onClick={handleToggle}
        variant={isListening ? "destructive" : "outline"}
        size="lg"
        className={`w-full transition-all duration-200 ${
          isListening 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        {isListening ? (
          <>
            <Mic className="w-5 h-5 mr-2" />
            Listening...
          </>
        ) : (
          <>
            <MicOff className="w-4 h-4 mr-2" />
            Start Voice Commands
          </>
        )}
      </Button>

      {/* Status Display */}
      {showStatus && (
        <Card className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 space-y-2">
            {/* Status Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isListening ? (
                  <Mic className="w-4 h-4 text-green-500 animate-pulse" />
                ) : (
                  <MicOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm font-medium">
                  Voice Status
                </span>
              </div>
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Last Command */}
            {lastCommand && (
              <div className="text-xs">
                <span className="text-gray-500">Last command: </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  "{lastCommand}"
                </span>
              </div>
            )}

            {/* Registered Commands Count */}
            <div className="text-xs text-gray-500">
              {registeredCommands.length} commands available
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {showTranscript && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Try saying:</div>
          <div className="space-y-0.5 ml-2">
            <div>• "Emergency recording"</div>
            <div>• "Start recording"</div>
            <div>• "Help me"</div>
          </div>
        </div>
      )}
    </div>
  );
}