import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface OptimizedVoiceCommand {
  patterns: string[];
  action: () => void | Promise<void>;
  confidence: number;
  description: string;
  category: 'emergency' | 'navigation' | 'recording' | 'legal' | 'family';
  priority: 'critical' | 'high' | 'medium' | 'low';
  autoExecute?: boolean;
  mobileOptimized: boolean;
  keywords: string[]; // Key terms for fuzzy matching
}

interface VoiceCommandHook {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  confidence: number;
  error: string | null;
  lastCommand: string | null;
  isSupported: boolean;
  performanceStats: {
    totalCommands: number;
    successfulMatches: number;
    averageConfidence: number;
    emergencyCommands: number;
  };
}

export function useOptimizedVoiceCommands(): VoiceCommandHook {
  // DISABLED: Voice commands completely disabled for rebuild
  console.log('🎤 OPTIMIZED VOICE COMMANDS COMPLETELY DISABLED');
  
  return {
    isListening: false,
    startListening: () => {},
    stopListening: () => {},
    transcript: '',
    confidence: 0,
    error: null,
    lastCommand: null,
    isSupported: false,
    performanceStats: {
      totalCommands: 0,
      successfulMatches: 0,
      averageConfidence: 0,
      emergencyCommands: 0
    }
  };

  const [, setLocation] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [performanceStats, setPerformanceStats] = useState({
    totalCommands: 0,
    successfulMatches: 0,
    averageConfidence: 0,
    emergencyCommands: 0
  });
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Comprehensive optimized voice commands
  const optimizedCommands: OptimizedVoiceCommand[] = [
    // CRITICAL EMERGENCY COMMANDS (Highest Priority)
    {
      patterns: [
        'emergency record now',
        'police emergency',
        'traffic stop emergency',
        'help record this',
        'being pulled over',
        'officer approaching',
        'need emergency recording',
        'document police encounter',
        'start emergency documentation',
        'emergency situation record'
      ],
      keywords: ['emergency', 'police', 'record', 'help', 'pulled', 'officer', 'document'],
      action: async () => {
        console.log('🚨 CRITICAL EMERGENCY COMMAND EXECUTED');
        setLocation('/record');
        
        // Auto-start recording after navigation
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('autoStartRecording', { 
            detail: { 
              source: 'optimized_voice_emergency',
              priority: 'critical',
              handsFree: true
            }
          }));
        }, 500);

        toast({
          title: "EMERGENCY RECORDING ACTIVE",
          description: "Stay calm. Recording started. Know your rights.",
          variant: "destructive"
        });

        speakFeedback("Emergency recording activated. Stay calm and comply with lawful orders. You have the right to remain silent.");
        updateStats('emergency');
      },
      confidence: 0.4, // Lower threshold for emergency
      description: "Critical emergency recording",
      category: 'emergency',
      priority: 'critical',
      autoExecute: true,
      mobileOptimized: true
    },

    // STOP RECORDING COMMANDS (High Priority)
    {
      patterns: [
        'stop recording',
        'end recording',
        'stop record',
        'finish recording',
        'halt recording',
        'stop video recording',
        'stop video',
        'end video recording',
        'stop audio recording',
        'stop audio',
        'recording stop',
        'end record'
      ],
      keywords: ['stop', 'end', 'finish', 'halt', 'recording', 'record', 'video', 'audio'],
      action: () => {
        console.log('🛑 OPTIMIZED STOP RECORDING COMMAND EXECUTED');
        window.dispatchEvent(new CustomEvent('stopRecording', { 
          detail: { source: 'optimized_voice_command' }
        }));
        
        toast({
          title: "Recording Stopped",
          description: "Voice command: Recording ended",
        });
        speakFeedback("Recording stopped. Incident documented.");
        updateStats('recording');
      },
      confidence: 0.6,
      description: "Stop current recording",
      category: 'recording',
      priority: 'high',
      autoExecute: true,
      mobileOptimized: true
    },

    // VIDEO RECORDING COMMANDS
    {
      patterns: [
        'start video recording',
        'record video',
        'video recording',
        'start video',
        'begin video recording',
        'video documentation',
        'record with video',
        'start video documentation'
      ],
      keywords: ['video', 'recording', 'start', 'record', 'documentation'],
      action: () => {
        console.log('📹 OPTIMIZED VIDEO RECORDING COMMAND EXECUTED');
        setLocation('/record');
        toast({
          title: "Video Recording Mode",
          description: "Opening video recording for incident documentation",
        });
        speakFeedback("Video recording mode activated. Documenting with video.");
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('autoStartVideoRecording', { 
            detail: { source: 'optimized_voice_command', recordingType: 'video' }
          }));
        }, 500);
        updateStats('recording');
      },
      confidence: 0.7,
      description: "Start video recording",
      category: 'recording',
      priority: 'high',
      autoExecute: false,
      mobileOptimized: true
    },

    // LEGAL RIGHTS COMMANDS
    {
      patterns: [
        'show my rights',
        'legal rights',
        'know my rights',
        'what are my rights',
        'constitutional rights',
        'my legal rights',
        'civil rights',
        'legal protections'
      ],
      keywords: ['rights', 'legal', 'constitutional', 'civil', 'protections'],
      action: () => {
        setLocation('/rights');
        toast({
          title: "Legal Rights",
          description: "Viewing your legal protections",
        });
        speakFeedback("Legal rights page opened. Review your protections.");
        updateStats('legal');
      },
      confidence: 0.7,
      description: "Show legal rights",
      category: 'legal',
      priority: 'medium',
      autoExecute: false,
      mobileOptimized: true
    },

    // EMERGENCY CONTACT COMMANDS
    {
      patterns: [
        'alert my family',
        'notify emergency contacts',
        'send emergency alert',
        'alert my contacts',
        'family emergency alert',
        'notify my emergency contact',
        'emergency notification'
      ],
      keywords: ['alert', 'family', 'emergency', 'contacts', 'notify'],
      action: () => {
        toast({
          title: "Emergency Alert Sent",
          description: "Notifying your emergency contacts with location",
          variant: "destructive"
        });
        speakFeedback("Emergency alert sent to all your contacts with current location.");
        window.dispatchEvent(new CustomEvent('triggerEmergencyAlert', { detail: { type: 'family' } }));
        updateStats('emergency');
      },
      confidence: 0.6,
      description: "Alert emergency contacts",
      category: 'emergency',
      priority: 'critical',
      autoExecute: true,
      mobileOptimized: true
    },

    // NAVIGATION COMMANDS
    {
      patterns: [
        'go home',
        'open dashboard',
        'main page',
        'dashboard',
        'home screen'
      ],
      keywords: ['home', 'dashboard', 'main'],
      action: () => {
        setLocation('/');
        toast({
          title: "Dashboard",
          description: "Returning to main dashboard",
        });
        speakFeedback("Dashboard opened.");
        updateStats('navigation');
      },
      confidence: 0.7,
      description: "Open main dashboard",
      category: 'navigation',
      priority: 'low',
      autoExecute: false,
      mobileOptimized: true
    }
  ];

  // Enhanced speech feedback
  const speakFeedback = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.log('Speech synthesis error:', error);
      }
    }
  }, []);

  // Update performance statistics
  const updateStats = useCallback((category: string) => {
    setPerformanceStats(prev => ({
      totalCommands: prev.totalCommands + 1,
      successfulMatches: prev.successfulMatches + 1,
      averageConfidence: (prev.averageConfidence + confidence) / 2,
      emergencyCommands: category === 'emergency' ? prev.emergencyCommands + 1 : prev.emergencyCommands
    }));
  }, [confidence]);

  // Advanced fuzzy matching algorithm
  const findOptimizedMatch = useCallback((text: string, speechConfidence: number): OptimizedVoiceCommand | null => {
    const normalizedText = text.toLowerCase().trim();
    console.log('🎯 OPTIMIZED VOICE MATCHING:', normalizedText, 'Confidence:', speechConfidence.toFixed(3));
    
    // Step 1: Exact phrase matching
    for (const command of optimizedCommands) {
      for (const pattern of command.patterns) {
        if (normalizedText === pattern.toLowerCase()) {
          console.log('✅ EXACT OPTIMIZED MATCH:', pattern);
          return command;
        }
      }
    }
    
    // Step 2: Emergency context detection with priority
    const emergencyKeywords = ['emergency', 'help', 'police', 'stop', 'danger', 'record'];
    const hasEmergencyKeyword = emergencyKeywords.some(keyword => normalizedText.includes(keyword));
    
    if (hasEmergencyKeyword) {
      const emergencyCommands = optimizedCommands.filter(cmd => 
        cmd.priority === 'critical' || cmd.category === 'emergency'
      );
      
      for (const command of emergencyCommands) {
        // Check keyword matches for emergency commands
        const keywordMatches = command.keywords.filter(keyword => 
          normalizedText.includes(keyword)
        ).length;
        
        if (keywordMatches >= 2 || (keywordMatches >= 1 && speechConfidence >= 0.3)) {
          console.log('🚨 EMERGENCY OPTIMIZED MATCH:', command.description, 'Keywords:', keywordMatches);
          return command;
        }
      }
    }
    
    // Step 3: Advanced scoring algorithm
    let bestMatch: { command: OptimizedVoiceCommand, score: number } | null = null;
    
    for (const command of optimizedCommands) {
      let score = 0;
      
      // Keyword-based scoring
      const keywordMatches = command.keywords.filter(keyword => 
        normalizedText.includes(keyword)
      ).length;
      score += (keywordMatches / command.keywords.length) * 0.4;
      
      // Pattern similarity scoring
      for (const pattern of command.patterns) {
        const normalizedPattern = pattern.toLowerCase();
        
        if (normalizedText.includes(normalizedPattern)) {
          score += 0.3;
        } else if (normalizedPattern.includes(normalizedText)) {
          score += 0.2;
        } else {
          // Word-based partial matching
          const patternWords = normalizedPattern.split(' ');
          const textWords = normalizedText.split(' ');
          
          const exactMatches = patternWords.filter(word => textWords.includes(word)).length;
          const partialMatches = patternWords.filter(word => 
            textWords.some(textWord => 
              (word.length > 3 && textWord.includes(word.substring(0, word.length - 1))) ||
              (textWord.length > 3 && word.includes(textWord.substring(0, textWord.length - 1)))
            )
          ).length;
          
          score += (exactMatches * 0.2 + partialMatches * 0.1) / patternWords.length;
        }
      }
      
      // Apply confidence weighting
      score *= command.confidence;
      
      // Priority boosting
      const priorityBoost = { critical: 1.3, high: 1.2, medium: 1.1, low: 1.0 };
      score *= priorityBoost[command.priority];
      
      // Mobile optimization boost
      if (command.mobileOptimized) {
        score *= 1.1;
      }
      
      // Check if this is the best match
      if (score >= 0.4 && speechConfidence >= command.confidence && 
          (!bestMatch || score > bestMatch.score)) {
        bestMatch = { command, score };
        console.log('🎯 NEW OPTIMIZED BEST MATCH:', command.description, 'Score:', score.toFixed(3));
      }
    }
    
    if (bestMatch) {
      console.log('✅ OPTIMIZED MATCH SELECTED:', bestMatch.command.description, 'Score:', bestMatch.score.toFixed(3));
      return bestMatch.command;
    }
    
    console.log('❌ NO OPTIMIZED MATCH FOUND for:', normalizedText);
    return null;
  }, [optimizedCommands]);

  // Initialize optimized speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;
        
        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          console.log('🎤 OPTIMIZED VOICE RECOGNITION STARTED');
        };
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let maxConfidence = 0;
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const resultText = result[0].transcript;
            const resultConfidence = result[0].confidence || 0.5;
            
            if (result.isFinal) {
              finalTranscript += resultText;
              maxConfidence = Math.max(maxConfidence, resultConfidence);
            }
          }
          
          if (finalTranscript.trim()) {
            setTranscript(finalTranscript);
            setConfidence(maxConfidence);
            
            console.log('🎯 PROCESSING OPTIMIZED COMMAND:', finalTranscript, 'Confidence:', maxConfidence.toFixed(3));
            
            const matchedCommand = findOptimizedMatch(finalTranscript, maxConfidence);
            if (matchedCommand) {
              setLastCommand(matchedCommand.description);
              
              try {
                console.log('🚀 EXECUTING OPTIMIZED COMMAND:', matchedCommand.description);
                if (matchedCommand.autoExecute) {
                  matchedCommand.action();
                } else {
                  speakFeedback(`Executing ${matchedCommand.description}`);
                  setTimeout(() => matchedCommand.action(), 500);
                }
              } catch (error) {
                console.error('❌ OPTIMIZED COMMAND ERROR:', error);
                toast({
                  title: "Command Error",
                  description: "Failed to execute voice command",
                  variant: "destructive"
                });
              }
            } else {
              setPerformanceStats(prev => ({ ...prev, totalCommands: prev.totalCommands + 1 }));
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('🎤 OPTIMIZED VOICE ERROR:', event.error);
          setError(`Voice recognition error: ${event.error}`);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
        setError('Speech recognition not supported');
      }
    }
  }, [findOptimizedMatch, speakFeedback, toast, updateStats]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        console.log('🎤 STARTING OPTIMIZED VOICE RECOGNITION');
      } catch (error) {
        setError('Could not start optimized voice recognition');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      console.log('🎤 STOPPING OPTIMIZED VOICE RECOGNITION');
    }
  }, [isListening]);

  return {
    isListening,
    startListening,
    stopListening,
    transcript,
    confidence,
    error,
    lastCommand,
    isSupported,
    performanceStats
  };
}