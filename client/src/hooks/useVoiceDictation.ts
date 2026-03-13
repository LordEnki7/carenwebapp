import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface VoiceDictationHook {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startDictation: (fieldName?: string) => void;
  stopDictation: () => void;
  clearTranscript: () => void;
  appendToTranscript: (text: string) => void;
  currentField: string | null;
}

interface DictationCommand {
  pattern: string;
  action: (transcript: string) => string;
  description: string;
}

export function useVoiceDictation(): VoiceDictationHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentField, setCurrentField] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Voice commands for form filling
  const dictationCommands: DictationCommand[] = [
    {
      pattern: 'new paragraph',
      action: (text) => text + '\n\n',
      description: 'Add paragraph break'
    },
    {
      pattern: 'new line',
      action: (text) => text + '\n',
      description: 'Add line break'
    },
    {
      pattern: 'period',
      action: (text) => text + '. ',
      description: 'Add period'
    },
    {
      pattern: 'comma',
      action: (text) => text + ', ',
      description: 'Add comma'
    },
    {
      pattern: 'question mark',
      action: (text) => text + '? ',
      description: 'Add question mark'
    },
    {
      pattern: 'exclamation point',
      action: (text) => text + '! ',
      description: 'Add exclamation point'
    },
    {
      pattern: 'delete last word',
      action: (text) => text.split(' ').slice(0, -1).join(' '),
      description: 'Remove last word'
    },
    {
      pattern: 'clear all',
      action: () => '',
      description: 'Clear all text'
    }
  ];

  // Text-to-speech feedback for dictation
  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  // Process dictation commands
  const processCommands = (text: string): string => {
    let processedText = text;
    
    dictationCommands.forEach(command => {
      if (text.toLowerCase().includes(command.pattern)) {
        const beforeCommand = text.substring(0, text.toLowerCase().indexOf(command.pattern));
        const afterCommand = text.substring(text.toLowerCase().indexOf(command.pattern) + command.pattern.length);
        processedText = command.action(beforeCommand) + afterCommand;
      }
    });

    return processedText;
  };

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        if (currentField) {
          speakFeedback(`Dictating ${currentField}. Speak clearly.`);
        }
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            setConfidence(result[0].confidence);
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          const processedText = processCommands(finalTranscript);
          setTranscript(prev => prev + ' ' + processedText);
        }
      };

      recognition.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          speakFeedback('No speech detected. Try speaking again.');
        } else if (event.error === 'network') {
          speakFeedback('Network error. Check your connection.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (currentField && transcript) {
          speakFeedback('Dictation complete.');
        }
      };
    } else {
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentField, transcript]);

  const startDictation = (fieldName?: string) => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return;
    }

    if (recognitionRef.current && !isListening) {
      setCurrentField(fieldName || 'field');
      setError(null);
      
      try {
        recognitionRef.current.start();
        toast({
          title: "Voice Dictation Active",
          description: `Dictating ${fieldName || 'text'}. Speak clearly.`,
        });
      } catch (err) {
        setError('Failed to start speech recognition');
      }
    }
  };

  const stopDictation = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setCurrentField(null);
      
      toast({
        title: "Dictation Stopped",
        description: "Voice input completed",
      });
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setConfidence(0);
  };

  const appendToTranscript = (text: string) => {
    setTranscript(prev => prev + (prev ? ' ' : '') + text);
  };

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    startDictation,
    stopDictation,
    clearTranscript,
    appendToTranscript,
    currentField
  };
}