import { useState, useEffect, useRef, useCallback } from "react";
import { eventBus } from '../../../../src/core/EventBus';

interface VoiceCommandHook {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  lastCommand: string | null;
  confidence: number;
  startListening: () => void;
  stopListening: () => void;
  registeredCommands: VoiceCommand[];
  addCommand: (command: VoiceCommand) => void;
  removeCommand: (commandId: string) => void;
}

interface VoiceCommand {
  id: string;
  patterns: string[];
  action: (command: string, confidence: number) => void;
  description: string;
  category: 'emergency' | 'recording' | 'navigation' | 'legal' | 'family' | 'system';
  minConfidence?: number;
}

export function useVoiceCommands(): VoiceCommandHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [registeredCommands, setRegisteredCommands] = useState<VoiceCommand[]>([]);

  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                            (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;
      
      recognition.onstart = () => {
        console.log('[VOICE_MODULE] Speech recognition started');
        setError(null);
        eventBus.emit({
          type: 'voice.listening.started',
          module: '@caren/voice',
          payload: { timestamp: Date.now() }
        });
      };
      
      recognition.onresult = (event: any) => {
        if (isProcessingRef.current) return;
        
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.trim().toLowerCase();
          const currentConfidence = result[0].confidence || 0;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            setConfidence(currentConfidence);
            
            // Process the final command
            processVoiceCommand(transcript, currentConfidence);
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('[VOICE_MODULE] Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        
        eventBus.emit({
          type: 'voice.error',
          module: '@caren/voice',
          payload: {
            error: event.error,
            timestamp: Date.now()
          }
        });
      };
      
      recognition.onend = () => {
        console.log('[VOICE_MODULE] Speech recognition ended');
        setIsListening(false);
        
        eventBus.emit({
          type: 'voice.listening.stopped',
          module: '@caren/voice',
          payload: { timestamp: Date.now() }
        });
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }
  }, []);

  // Process voice command
  const processVoiceCommand = useCallback((transcript: string, confidence: number) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    console.log(`[VOICE_MODULE] Processing command: "${transcript}" (confidence: ${confidence})`);
    
    // Find matching commands
    const matchedCommands = registeredCommands.filter(command => {
      const minConfidence = command.minConfidence || 0.7;
      if (confidence < minConfidence) return false;
      
      return command.patterns.some(pattern => 
        transcript.includes(pattern.toLowerCase())
      );
    });
    
    if (matchedCommands.length > 0) {
      // Execute the first matched command (highest priority)
      const command = matchedCommands[0];
      setLastCommand(transcript);
      
      try {
        command.action(transcript, confidence);
        
        eventBus.emit({
          type: 'voice.command.executed',
          module: '@caren/voice',
          payload: {
            command: transcript,
            commandId: command.id,
            category: command.category,
            confidence,
            timestamp: Date.now()
          }
        });
        
        console.log(`[VOICE_MODULE] Command executed: ${command.id}`);
      } catch (error) {
        console.error(`[VOICE_MODULE] Command execution error:`, error);
        setError(`Command execution failed: ${error.message}`);
      }
    } else {
      console.log(`[VOICE_MODULE] No matching commands found for: "${transcript}"`);
      
      eventBus.emit({
        type: 'voice.command.unrecognized',
        module: '@caren/voice',
        payload: {
          command: transcript,
          confidence,
          timestamp: Date.now()
        }
      });
    }
    
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 100);
  }, [registeredCommands]);

  // Default emergency commands
  useEffect(() => {
    const defaultCommands: VoiceCommand[] = [
      {
        id: 'emergency_recording',
        patterns: [
          'emergency record',
          'emergency recording',
          'start emergency',
          'emergency mode',
          'help me record',
          'police encounter',
          'traffic stop',
          'being pulled over'
        ],
        action: (command, confidence) => {
          eventBus.emit({
            type: 'emergency.activate',
            module: '@caren/voice',
            payload: {
              level: 'high',
              trigger: 'voice_command',
              command,
              confidence,
              timestamp: Date.now()
            }
          });
        },
        description: 'Activate emergency recording mode',
        category: 'emergency',
        minConfidence: 0.8
      },
      {
        id: 'start_recording',
        patterns: [
          'start recording',
          'begin recording',
          'record now',
          'start record'
        ],
        action: (command, confidence) => {
          eventBus.emit({
            type: 'recording.start',
            module: '@caren/voice',
            payload: {
              trigger: 'voice_command',
              command,
              confidence,
              timestamp: Date.now()
            }
          });
        },
        description: 'Start regular recording',
        category: 'recording'
      },
      {
        id: 'stop_recording',
        patterns: [
          'stop recording',
          'end recording',
          'stop record'
        ],
        action: (command, confidence) => {
          eventBus.emit({
            type: 'recording.stop',
            module: '@caren/voice',
            payload: {
              trigger: 'voice_command',
              command,
              confidence,
              timestamp: Date.now()
            }
          });
        },
        description: 'Stop current recording',
        category: 'recording'
      },
      {
        id: 'get_legal_rights',
        patterns: [
          'my rights',
          'what are my rights',
          'legal rights',
          'know my rights'
        ],
        action: (command, confidence) => {
          eventBus.emit({
            type: 'legal.rights.request',
            module: '@caren/voice',
            payload: {
              command,
              confidence,
              timestamp: Date.now()
            }
          });
        },
        description: 'Display legal rights information',
        category: 'legal'
      }
    ];

    setRegisteredCommands(prev => {
      // Merge with existing commands, avoiding duplicates
      const existing = prev.filter(cmd => 
        !defaultCommands.some(def => def.id === cmd.id)
      );
      return [...existing, ...defaultCommands];
    });
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isListening) return;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
      setTranscript('');
    } catch (error: any) {
      setError(`Failed to start listening: ${error.message}`);
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (error: any) {
      setError(`Failed to stop listening: ${error.message}`);
    }
  }, [isListening]);

  const addCommand = useCallback((command: VoiceCommand) => {
    setRegisteredCommands(prev => {
      const filtered = prev.filter(cmd => cmd.id !== command.id);
      return [...filtered, command];
    });
    
    eventBus.emit({
      type: 'voice.command.registered',
      module: '@caren/voice',
      payload: {
        commandId: command.id,
        category: command.category,
        patterns: command.patterns,
        timestamp: Date.now()
      }
    });
  }, []);

  const removeCommand = useCallback((commandId: string) => {
    setRegisteredCommands(prev => prev.filter(cmd => cmd.id !== commandId));
    
    eventBus.emit({
      type: 'voice.command.unregistered',
      module: '@caren/voice',
      payload: {
        commandId,
        timestamp: Date.now()
      }
    });
  }, []);

  // Listen for external events
  useEffect(() => {
    const handleVoiceEvent = (event: any) => {
      if (event.type === 'voice.start.request') {
        startListening();
      } else if (event.type === 'voice.stop.request') {
        stopListening();
      }
    };

    eventBus.subscribe('voice.start.request', handleVoiceEvent);
    eventBus.subscribe('voice.stop.request', handleVoiceEvent);
    
    return () => {
      eventBus.unsubscribe('voice.start.request', handleVoiceEvent);
      eventBus.unsubscribe('voice.stop.request', handleVoiceEvent);
    };
  }, [startListening, stopListening]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    lastCommand,
    confidence,
    startListening,
    stopListening,
    registeredCommands,
    addCommand,
    removeCommand
  };
}