import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UnlawfulCommand {
  command: string;
  violation: string;
  response: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: string;
}

interface MonitoringState {
  isMonitoring: boolean;
  currentState: string | null;
  detectedCommands: UnlawfulCommand[];
  confidence: number;
}

export function usePoliceCommandMonitor() {
  const [state, setState] = useState<MonitoringState>({
    isMonitoring: false,
    currentState: null,
    detectedCommands: [],
    confidence: 0
  });
  
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Get user location for state-specific legal rights
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          
          // Get state from coordinates
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            const data = await response.json();
            setState(prev => ({ ...prev, currentState: data.address?.state }));
          } catch (error) {
            console.error('Error getting location state:', error);
          }
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const startMonitoring = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Your browser doesn't support continuous voice monitoring",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isMonitoring: true }));
      toast({
        title: "Police Command Monitor Active",
        description: "Listening for unlawful commands and violations",
      });
    };

    recognition.onresult = async (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      // Analyze for unlawful commands
      await analyzePoliceCommand(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to monitor police commands",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      if (state.isMonitoring) {
        // Restart if still monitoring
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopMonitoring = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState(prev => ({ ...prev, isMonitoring: false }));
    
    toast({
      title: "Police Command Monitor Stopped",
      description: "No longer listening for unlawful commands",
    });
  };

  const analyzePoliceCommand = async (transcript: string) => {
    try {
      const response = await fetch('/api/legal/analyze-police-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: transcript,
          state: state.currentState,
          location: location
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        
        if (analysis.isUnlawful) {
          const unlawfulCommand: UnlawfulCommand = {
            command: analysis.detectedCommand,
            violation: analysis.violation,
            response: analysis.suggestedResponse,
            severity: analysis.severity,
            suggestedAction: analysis.suggestedAction
          };

          setState(prev => ({
            ...prev,
            detectedCommands: [...prev.detectedCommands, unlawfulCommand],
            confidence: analysis.confidence
          }));

          // Show immediate alert for high/critical violations
          if (analysis.severity === 'high' || analysis.severity === 'critical') {
            toast({
              title: "⚠️ UNLAWFUL POLICE COMMAND DETECTED",
              description: analysis.violation,
              variant: "destructive",
              action: {
                label: "Call Supervisor",
                onClick: () => handleCallSupervisor(unlawfulCommand)
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing police command:', error);
    }
  };

  const handleCallSupervisor = (command: UnlawfulCommand) => {
    // Create emergency alert for supervisor request
    const alertMessage = `SUPERVISOR REQUEST NEEDED: Officer issued unlawful command: "${command.command}". Violation: ${command.violation}. Location: ${location?.latitude}, ${location?.longitude}`;
    
    toast({
      title: "Requesting Police Supervisor",
      description: "Documenting violation and requesting supervisor presence",
    });

    // Log incident automatically
    fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Unlawful Police Command - ${command.severity.toUpperCase()}`,
        description: alertMessage,
        location: location,
        category: 'police_interaction',
        priority: 'high',
        evidenceType: 'audio_analysis',
        legalViolation: command.violation
      }),
    }).catch(console.error);
  };

  const getStateLegalRights = async () => {
    if (!state.currentState) return [];
    
    try {
      const response = await fetch(`/api/legal-rights/state/${state.currentState}`);
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('Error fetching state legal rights:', error);
      return [];
    }
  };

  return {
    ...state,
    location,
    startMonitoring,
    stopMonitoring,
    handleCallSupervisor,
    getStateLegalRights
  };
}