import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useVoiceNavigation } from '@/hooks/useVoiceNavigation';
import { useToast } from '@/hooks/use-toast';

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
    transcript, 
    error, 
    startListening, 
    stopListening, 
    lastCommand 
  } = useVoiceNavigation();

  // Emergency command patterns to detect
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

  // Show status when listening or command executed
  useEffect(() => {
    if (isListening || lastCommand) {
      setShowStatus(true);
      if (lastCommand && onCommandExecuted) {
        onCommandExecuted(lastCommand);
      }

      // Enhanced emergency detection
      if (lastCommand && isEmergencyCommand(lastCommand)) {
        console.log('🚨 EMERGENCY COMMAND DETECTED IN VOICE BUTTON:', lastCommand);
        
        // Trigger emergency recording event after navigation
        setTimeout(() => {
          console.log('🚨 DISPATCHING EMERGENCY RECORDING EVENT');
          const emergencyEvent = new CustomEvent('emergencyRecording', {
            detail: {
              source: 'voice_command_button',
              command: lastCommand,
              timestamp: new Date().toISOString(),
              priority: 'critical',
              handsFree: true
            }
          });
          window.dispatchEvent(emergencyEvent);

          // Also dispatch auto-start recording event
          setTimeout(() => {
            const autoStartEvent = new CustomEvent('autoStartRecording', {
              detail: {
                source: 'emergency_voice_button',
                emergency: true,
                handsFree: true
              }
            });
            window.dispatchEvent(autoStartEvent);
            console.log('🚨 AUTO-START RECORDING EVENT DISPATCHED');
          }, 1000); // Extra delay to ensure Record page is loaded

          toast({
            title: "🚨 EMERGENCY RECORDING ACTIVATED",
            description: "Stay calm. Recording starting automatically. Know your rights.",
            variant: "destructive"
          });

        }, 500); // Wait for navigation to complete
      }
    } else {
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isListening, lastCommand, onCommandExecuted, toast]);

  if (!isSupported) {
    return null;
  }

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      setShowStatus(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Voice Status Card */}
      {showStatus && showTranscript && (
        <Card className="absolute bottom-16 right-0 mb-2 cyber-card max-w-xs">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Voice Commands</span>
              <Badge variant={isListening ? 'default' : 'secondary'} className={`text-xs ${
                isListening ? 'bg-cyan-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                {isListening ? 'Listening' : 'Ready'}
              </Badge>
            </div>
            
            {transcript && (
              <div className="text-xs text-gray-300 mb-2">
                Heard: "{transcript}"
              </div>
            )}
            
            {lastCommand && (
              <div className="text-xs text-cyan-400 mb-2">
                Executed: {lastCommand}
              </div>
            )}
            
            {error && (
              <div className="text-xs text-red-400 mb-2">
                {error}
              </div>
            )}
            
            <div className="text-xs text-gray-300">
              {isListening ? (
                "🎤 Speak your command clearly"
              ) : (
                "Click microphone to start"
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Control Button */}
      <Button
        onClick={handleToggle}
        variant={isListening ? "default" : "outline"}
        size="sm"
        className={`rounded-full w-12 h-12 ${
          isListening 
            ? 'bg-cyan-500 hover:bg-cyan-600 text-white animate-pulse border-cyan-400' 
            : 'bg-gray-800/50 hover:bg-gray-700 text-cyan-400 border-gray-600 hover:border-cyan-500'
        }`}
        title={isListening ? 'Stop Voice Commands (Click or say "stop")' : 'Start Voice Commands'}
      >
        {isListening ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}