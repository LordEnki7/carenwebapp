import { VoiceCommandsGuide } from "@/components/VoiceCommandsGuide";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function VoiceCommandsPage() {
  // Voice commands disabled
  const isListening = false;
  const isSupported = false;
  const transcript = "";
  const confidence = 0;
  const lastCommand = "";
  const error = null;
  
  const { toast } = useToast();

  const testVoiceCommand = () => {
    toast({
      title: "🎤 Voice Commands Disabled",
      description: "Voice commands have been disabled",
    });
  };

  const speakExample = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Voice commands ready. Say CAREN emergency for help, Record start to document incidents, or Navigate home for dashboard.");
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice Commands</h1>
          <p className="text-muted-foreground">
            Complete guide to hands-free control of CAREN
          </p>
        </div>
      </div>

      {/* Voice Recognition Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isListening ? (
              <Mic className="h-5 w-5 text-green-500 animate-pulse" />
            ) : (
              <MicOff className="h-5 w-5 text-gray-500" />
            )}
            Voice Recognition Status
          </CardTitle>
          <CardDescription>
            Current state and controls for voice recognition system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg font-bold">
                {!isSupported ? (
                  <span className="text-red-500">Not Supported</span>
                ) : isListening ? (
                  <span className="text-green-500">Listening</span>
                ) : (
                  <span className="text-yellow-500">Stopped</span>
                )}
              </p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Confidence</p>
              <p className="text-lg font-bold">
                {confidence > 0 ? `${Math.round(confidence * 100)}%` : '--'}
              </p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Last Command</p>
              <p className="text-lg font-bold truncate">
                {lastCommand || '--'}
              </p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Current Speech</p>
              <p className="text-sm font-mono truncate">
                {transcript || 'Waiting...'}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "default"}
              disabled={!isSupported}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
            
            <Button onClick={testVoiceCommand} variant="outline">
              <Mic className="h-4 w-4 mr-2" />
              Test Voice
            </Button>
            
            <Button onClick={speakExample} variant="outline">
              <Volume2 className="h-4 w-4 mr-2" />
              Hear Examples
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Complete Voice Commands Guide */}
      <VoiceCommandsGuide />

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>
            Common issues and solutions for voice recognition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Voice Commands Not Working?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check that microphone permissions are enabled</li>
                <li>• Ensure you're using Chrome, Edge, or Safari (best support)</li>
                <li>• Speak clearly and at normal volume</li>
                <li>• Try refreshing the page if recognition seems stuck</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Commands Not Recognized?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Make sure to include the command prefix (CAREN, Record, Navigate)</li>
                <li>• Wait for the previous command to complete</li>
                <li>• Try rephrasing the command slightly</li>
                <li>• Check the confidence level - aim for above 70%</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Emergency Commands</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Emergency keywords work without prefixes</li>
                <li>• Just say "emergency", "help me", or "pulled over"</li>
                <li>• CAREN will automatically start recording and notify contacts</li>
                <li>• Voice feedback confirms activation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}