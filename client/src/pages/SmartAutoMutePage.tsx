import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import { SmartAutoMute } from '@/components/SmartAutoMute';
import { Brain, Shield, Mic, Settings, AlertTriangle, Play, Square } from 'lucide-react';
import MobileResponsiveLayout from '@/components/MobileResponsiveLayout';

export default function SmartAutoMutePage() {
  const { toast } = useToast();
  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startMicrophoneTest = async () => {
    try {
      setIsTestingMicrophone(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Disable to allow Smart Auto-Mute to handle noise
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      setTestStream(stream);
      
      toast({
        title: "Microphone Test Started",
        description: "Smart Auto-Mute is now analyzing your audio input",
      });
    } catch (error) {
      console.error('Failed to start microphone test:', error);
      toast({
        title: "Microphone Access Failed",
        description: "Please allow microphone permissions to test Smart Auto-Mute",
        variant: "destructive"
      });
      setIsTestingMicrophone(false);
    }
  };

  const stopMicrophoneTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setTestStream(null);
    }
    setIsTestingMicrophone(false);
    
    toast({
      title: "Microphone Test Stopped",
      description: "Audio analysis has been disabled",
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen cyber-page-background">
      <div className="p-6">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="cyber-title text-3xl">
                  Smart Auto-Mute System
                </h1>
                <p className="text-lg text-cyan-300">
                  Intelligent audio management for legal protection during recordings
                </p>
              </div>
              
              {/* Test Controls */}
              <div className="flex items-center gap-3">
                {!isTestingMicrophone ? (
                  <Button
                    onClick={startMicrophoneTest}
                    className="cyber-button-primary"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Test Microphone
                  </Button>
                ) : (
                  <Button
                    onClick={stopMicrophoneTest}
                    className="cyber-button-danger"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Test
                  </Button>
                )}
              </div>
            </div>

            {/* Feature Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-300">
                    <Brain className="w-5 h-5" />
                    AI Audio Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm">
                    Advanced machine learning algorithms analyze audio patterns in real-time, 
                    detecting voice characteristics, background noise, and potential threats 
                    to automatically protect your recordings.
                  </p>
                </CardContent>
              </Card>

              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-300">
                    <Shield className="w-5 h-5" />
                    Police Voice Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm">
                    Specialized detection algorithms identify authoritative voice patterns 
                    and automatically mute audio when police or law enforcement speech 
                    is detected, protecting your privacy during encounters.
                  </p>
                </CardContent>
              </Card>

              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-300">
                    <AlertTriangle className="w-5 h-5" />
                    Trigger Phrase Protection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm">
                    Voice recognition technology monitors for specific phrases like 
                    "turn off that device" or "stop recording" and immediately mutes 
                    audio to prevent interference with your documentation.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            {isTestingMicrophone && (
              <Card className="cyber-card border-green-500/50 bg-green-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-300">
                    <Mic className="w-5 h-5 animate-pulse" />
                    Live Audio Analysis Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-200">
                    Smart Auto-Mute is now analyzing your microphone input. 
                    Try speaking, making noise, or testing trigger phrases to see the system in action.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Smart Auto-Mute Component */}
            <SmartAutoMute
              mediaStream={testStream}
              onMuteChange={(isMuted) => {
                if (isMuted) {
                  toast({
                    title: "Smart Auto-Mute Activated",
                    description: "Audio has been intelligently muted for protection",
                    variant: "destructive"
                  });
                } else {
                  toast({
                    title: "Smart Auto-Mute Deactivated",
                    description: "Audio recording has resumed",
                  });
                }
              }}
            />

            {/* Usage Instructions */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-300">
                  <Settings className="w-5 h-5" />
                  How to Use Smart Auto-Mute
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-300 mb-2">During Traffic Stops</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Enable Smart Auto-Mute before starting recording</li>
                      <li>• System automatically detects police voices</li>
                      <li>• Mutes audio when commands to stop recording are heard</li>
                      <li>• Protects against audio fishing expeditions</li>
                      <li>• Use emergency override if critical audio must be captured</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-300 mb-2">Configuration Tips</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Adjust sensitivity based on environment noise</li>
                      <li>• Enable emergency override for critical situations</li>
                      <li>• Test trigger phrase detection before encounters</li>
                      <li>• Monitor audio quality indicators for optimal performance</li>
                      <li>• Review mute logs after incidents for analysis</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-cyan-500/20 pt-4">
                  <h4 className="font-semibold text-orange-300 mb-2">Legal Protection Features</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                    <div>
                      <strong className="text-orange-200">Privacy Protection:</strong> 
                      Automatically mutes when police request to stop recording, 
                      preventing constitutional violations while maintaining evidence.
                    </div>
                    <div>
                      <strong className="text-orange-200">Evidence Integrity:</strong> 
                      Prevents contamination of recordings with irrelevant or 
                      prejudicial audio that could compromise legal proceedings.
                    </div>
                    <div>
                      <strong className="text-orange-200">Rights Preservation:</strong> 
                      Protects your right to record while respecting officer requests, 
                      maintaining both legal compliance and constitutional rights.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-cyan-300">Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-cyan-200 mb-2">Audio Analysis</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Real-time frequency domain analysis</li>
                      <li>• Voice pattern recognition (85-255Hz fundamental)</li>
                      <li>• Background noise threshold detection</li>
                      <li>• Audio quality assessment and optimization</li>
                      <li>• Confidence scoring for mute decisions</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-200 mb-2">Performance</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Sub-100ms response time for mute activation</li>
                      <li>• 44.1kHz sample rate for high-quality analysis</li>
                      <li>• Minimal CPU impact (~2-5% usage)</li>
                      <li>• Hardware-accelerated audio processing</li>
                      <li>• Offline capability for emergency situations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </MobileResponsiveLayout>
  );
}