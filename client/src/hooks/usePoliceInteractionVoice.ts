import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PoliceInteractionVoice {
  isListening: boolean;
  isSupported: boolean;
  currentResponse: string | null;
  activateInteractionMode: () => void;
  deactivateInteractionMode: () => void;
  speakResponse: (response: string) => void;
}

interface InteractionCommand {
  triggers: string[];
  response: string;
  category: 'rights' | 'refusal' | 'request' | 'documentation';
  importance: 'critical' | 'important' | 'standard';
  description: string;
}

export function usePoliceInteractionVoice(): PoliceInteractionVoice {
  // DISABLED: Police interaction voice completely disabled for rebuild
  console.log('🎤 POLICE INTERACTION VOICE COMPLETELY DISABLED');
  
  return {
    isListening: false,
    isSupported: false,
    currentResponse: null,
    activateInteractionMode: () => {},
    deactivateInteractionMode: () => {},
    speakResponse: () => {}
  };

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  // Critical police interaction responses
  const interactionCommands: InteractionCommand[] = [
    // Constitutional Rights Invocation
    {
      triggers: [
        'assert my rights',
        'invoke my rights',
        'constitutional rights',
        'fifth amendment',
        'invoke fifth amendment',
        'right to remain silent'
      ],
      response: "I am invoking my Fifth Amendment right to remain silent. I will not answer any questions without my attorney present.",
      category: 'rights',
      importance: 'critical',
      description: 'Invoke Fifth Amendment protection'
    },
    
    {
      triggers: [
        'fourth amendment',
        'invoke fourth amendment',
        'search rights',
        'no search consent'
      ],
      response: "I am invoking my Fourth Amendment rights. I do not consent to any searches of my person, vehicle, or belongings.",
      category: 'rights',
      importance: 'critical',
      description: 'Invoke Fourth Amendment protection'
    },

    // Search and Seizure Refusals
    {
      triggers: [
        'refuse search',
        'decline search',
        'no search',
        'do not consent to search',
        'I do not consent'
      ],
      response: "I do not consent to any searches. I am exercising my constitutional right to refuse this search.",
      category: 'refusal',
      importance: 'critical',
      description: 'Clearly refuse search consent'
    },

    {
      triggers: [
        'no vehicle search',
        'refuse car search',
        'do not search my car',
        'no consent vehicle'
      ],
      response: "I do not consent to a search of my vehicle. I am exercising my Fourth Amendment rights.",
      category: 'refusal',
      importance: 'critical',
      description: 'Refuse vehicle search'
    },

    // Legal Representation Requests
    {
      triggers: [
        'request attorney',
        'want my lawyer',
        'need an attorney',
        'lawyer request',
        'speak to attorney',
        'contact my lawyer'
      ],
      response: "I am requesting to speak with my attorney. I will not answer any questions until my lawyer is present.",
      category: 'request',
      importance: 'critical',
      description: 'Request legal representation'
    },

    // Supervisor Requests
    {
      triggers: [
        'request supervisor',
        'call your supervisor',
        'want to speak to supervisor',
        'need a supervisor',
        'escalate to supervisor'
      ],
      response: "I am requesting to speak with your supervisor. Please call your supervising officer to this location.",
      category: 'request',
      importance: 'important',
      description: 'Request supervising officer'
    },

    // Documentation Statements
    {
      triggers: [
        'recording for safety',
        'documenting interaction',
        'recording this encounter',
        'legal documentation',
        'evidence recording'
      ],
      response: "Officer, I am recording this interaction for my safety and legal protection. This is my constitutional right.",
      category: 'documentation',
      importance: 'important',
      description: 'Announce recording for safety'
    },

    {
      triggers: [
        'state badge number',
        'officer identification',
        'badge number request',
        'identify yourself'
      ],
      response: "Officer, please state your badge number and department for my records. I am documenting this interaction.",
      category: 'documentation',
      importance: 'important',
      description: 'Request officer identification'
    },

    // Medical and Safety Requests
    {
      triggers: [
        'medical attention',
        'need medical help',
        'call ambulance',
        'medical emergency',
        'feeling unwell'
      ],
      response: "I am requesting immediate medical attention. Please call an ambulance. I may have a medical condition.",
      category: 'request',
      importance: 'critical',
      description: 'Request medical assistance'
    },

    // Compliance Statements
    {
      triggers: [
        'cooperative compliance',
        'peaceful compliance',
        'complying peacefully',
        'not resisting'
      ],
      response: "Officer, I am complying peacefully with your lawful orders. I am not resisting and pose no threat.",
      category: 'documentation',
      importance: 'important',
      description: 'State peaceful compliance'
    },

    // Emergency Contact Requests
    {
      triggers: [
        'call emergency contact',
        'notify my family',
        'contact my emergency contact',
        'call my family'
      ],
      response: "Officer, I am requesting to call my emergency contact. This is for my safety and their awareness of this situation.",
      category: 'request',
      importance: 'important',
      description: 'Request emergency contact notification'
    }
  ];

  // High-quality speech synthesis for clear communication
  const speakResponse = (response: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.rate = 0.8; // Slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.voice = speechSynthesis.getVoices().find(voice => 
        voice.lang.includes('en') && voice.name.includes('Male')
      ) || speechSynthesis.getVoices()[0];
      
      utterance.onstart = () => {
        setCurrentResponse(response);
      };
      
      utterance.onend = () => {
        setCurrentResponse(null);
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "Police Interaction Mode Active",
          description: "Listening for constitutional rights commands",
          variant: "destructive"
        });
      };

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.toLowerCase().trim();
          
          // Find matching command
          const matchedCommand = interactionCommands.find(command =>
            command.triggers.some(trigger => 
              transcript.includes(trigger.toLowerCase())
            )
          );

          if (matchedCommand) {
            speakResponse(matchedCommand.response);
            
            toast({
              title: `${matchedCommand.category.toUpperCase()} Response`,
              description: matchedCommand.description,
              variant: matchedCommand.importance === 'critical' ? 'destructive' : 'default'
            });

            // Log the interaction for legal documentation
            console.log('Police Interaction Voice Command:', {
              trigger: transcript,
              response: matchedCommand.response,
              category: matchedCommand.category,
              importance: matchedCommand.importance,
              timestamp: new Date().toISOString()
            });
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Police interaction voice error:', event.error);
        
        if (event.error === 'no-speech') {
          // Restart recognition after brief pause
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Recognition restart error:', e);
              }
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still in interaction mode
        if (isListening) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('Recognition auto-restart error:', e);
            }
          }, 500);
        }
      };
    }

    // Load speech synthesis voices
    if ('speechSynthesis' in window) {
      synthRef.current = speechSynthesis;
      
      // Ensure voices are loaded
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          console.log('Speech synthesis voices loaded');
        });
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isListening, toast]);

  const activateInteractionMode = () => {
    if (!isSupported) {
      toast({
        title: "Voice Commands Not Supported",
        description: "Speech recognition unavailable in this browser",
        variant: "destructive"
      });
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        
        // Announce activation
        speakResponse("Police interaction voice commands activated. I am listening for your constitutional rights commands.");
        
      } catch (err) {
        toast({
          title: "Voice Command Error",
          description: "Could not start police interaction mode",
          variant: "destructive"
        });
      }
    }
  };

  const deactivateInteractionMode = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      
      toast({
        title: "Police Interaction Mode Deactivated",
        description: "Voice commands stopped",
      });
    }
  };

  return {
    isListening,
    isSupported,
    currentResponse,
    activateInteractionMode,
    deactivateInteractionMode,
    speakResponse
  };
}