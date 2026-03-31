import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface VoiceNavigationHook {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  lastCommand: string | null;
}

interface VoiceCommand {
  patterns: string[];
  action: () => void;
  confidence: number;
  description: string;
  category: 'navigation' | 'emergency' | 'recording' | 'legal';
}

export function useVoiceNavigation(): VoiceNavigationHook {
  // DISABLED: Voice navigation completely disabled for rebuild
  console.log('🎤 VOICE NAVIGATION COMPLETELY DISABLED');
  
  return {
    isListening: false,
    isSupported: false,
    transcript: '',
    error: null,
    startListening: () => {},
    stopListening: () => {},
    lastCommand: null
  };

  const [, setLocation] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [manualStop, setManualStop] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Text-to-speech feedback
  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // Voice commands with navigation
  const voiceCommands: VoiceCommand[] = [
    // Stop Recording Commands - MUST BE FIRST to prevent conflicts
    {
      patterns: [
        'stop recording',
        'end recording',
        'stop record',
        'finish recording',
        'recording stop',
        'halt recording',
        'end record',
        'stop video recording',
        'stop video',
        'end video recording',
        'stop audio recording',
        'stop audio'
      ],
      action: () => {
        console.log('STOP RECORDING COMMAND EXECUTED');
        // Dispatch stop recording event
        window.dispatchEvent(new CustomEvent('stopRecording', { 
          detail: { source: 'voice_command' }
        }));
        
        toast({
          title: "Recording Stopped",
          description: "Voice command: Recording ended",
        });
        speakFeedback("Recording stopped. Incident documented.");
        setLastCommand('stop recording');
      },
      confidence: 0.95,
      description: "Stop current recording",
      category: 'recording'
    },

    // Recording Commands - Now with Auto-Start
    {
      patterns: [
        'start recording',
        'begin recording',
        'record incident',
        'record new incident',
        'start incident recording',
        'record now',
        'open recording',
        'go to recording'
      ],
      action: () => {
        console.log('START RECORDING COMMAND EXECUTED');
        setLocation('/record');
        toast({
          title: "Recording Started",
          description: "Hands-free incident recording activated",
        });
        speakFeedback("Recording started automatically. Documenting incident.");
        setLastCommand('start recording');
        
        // Delay auto-start to ensure Record component is loaded
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('autoStartRecording', { 
            detail: { source: 'voice_command' }
          }));
        }, 500); // 500ms delay for component to load
      },
      confidence: 0.9,
      description: "Start recording immediately",
      category: 'recording'
    },

    // Simple Record Command - Lower priority
    {
      patterns: [
        'record'
      ],
      action: () => {
        console.log('SIMPLE RECORD COMMAND EXECUTED');
        setLocation('/record');
        toast({
          title: "Recording Page",
          description: "Navigate to recording page",
        });
        speakFeedback("Recording page opened.");
        setLastCommand('record');
      },
      confidence: 0.7,
      description: "Navigate to recording page",
      category: 'recording'
    },

    // Video Recording Commands
    {
      patterns: [
        'start video recording',
        'record video',
        'video recording',
        'start video',
        'begin video recording',
        'video documentation'
      ],
      action: () => {
        console.log('VIDEO RECORDING COMMAND EXECUTED');
        setLocation('/record');
        toast({
          title: "Video Recording Mode",
          description: "Opening video recording for incident documentation",
        });
        speakFeedback("Video recording mode activated. Documenting with video.");
        setLastCommand('video recording');
        
        // Delay auto-start video recording to ensure Record component is loaded
        setTimeout(() => {
          console.log('DISPATCHING autoStartVideoRecording event');
          window.dispatchEvent(new CustomEvent('autoStartVideoRecording', { 
            detail: { source: 'voice_command', recordingType: 'video' }
          }));
          console.log('autoStartVideoRecording event dispatched');
        }, 500); // 500ms delay for component to load
      },
      confidence: 0.9,
      description: "Start video recording",
      category: 'recording'
    },

    // Emergency Recording - Enhanced Auto-Execution
    {
      patterns: [
        'emergency',
        'emergency record',
        'emergency recording',
        'help me now',
        'emergency situation',
        'start emergency recording'
      ],
      action: () => {
        setLocation('/record');
        toast({
          title: "Emergency Recording",
          description: "Opening emergency recording mode",
          variant: "destructive"
        });
        speakFeedback("Emergency recording page opened. Stay calm and document everything.");
        setLastCommand('emergency record');
      },
      confidence: 0.9,
      description: "Open emergency recording",
      category: 'emergency'
    },

    // Legal Rights
    {
      patterns: [
        'show my rights',
        'legal rights',
        'know my rights',
        'open rights',
        'what are my rights',
        'go to rights',
        'legal information'
      ],
      action: () => {
        setLocation('/rights');
        toast({
          title: "Legal Rights",
          description: "Viewing your legal protections",
        });
        speakFeedback("Legal rights page opened. Review your protections.");
        setLastCommand('show rights');
      },
      confidence: 0.9,
      description: "Open legal rights page",
      category: 'legal'
    },

    // Attorney Directory
    {
      patterns: [
        'find attorney',
        'get lawyer',
        'contact attorney',
        'open attorneys',
        'legal help',
        'need lawyer',
        'attorney directory'
      ],
      action: () => {
        setLocation('/attorneys');
        toast({
          title: "Attorney Directory",
          description: "Finding legal representation",
        });
        speakFeedback("Attorney directory opened. Finding legal help.");
        setLastCommand('find attorney');
      },
      confidence: 0.9,
      description: "Open attorney directory",
      category: 'legal'
    },

    // AI Assistant
    {
      patterns: [
        'ask ai',
        'ai assistant',
        'legal question',
        'open ai',
        'get help',
        'ai help',
        'ask question'
      ],
      action: () => {
        setLocation('/ai-assistant');
        toast({
          title: "AI Legal Assistant",
          description: "Ready to answer legal questions",
        });
        speakFeedback("AI assistant ready. What legal question can I help with?");
        setLastCommand('ask ai');
      },
      confidence: 0.9,
      description: "Open AI assistant",
      category: 'legal'
    },

    // Messages
    {
      patterns: [
        'open messages',
        'attorney messages',
        'check messages',
        'message attorney',
        'secure chat',
        'communications'
      ],
      action: () => {
        setLocation('/messages');
        toast({
          title: "Secure Messages",
          description: "Opening attorney communications",
        });
        speakFeedback("Secure messaging opened.");
        setLastCommand('open messages');
      },
      confidence: 0.9,
      description: "Open secure messaging",
      category: 'navigation'
    },

    // Incidents History
    {
      patterns: [
        'view incidents',
        'my incidents',
        'incident history',
        'open incidents',
        'show recordings',
        'past incidents'
      ],
      action: () => {
        setLocation('/incidents');
        toast({
          title: "Incident History",
          description: "Viewing recorded incidents",
        });
        speakFeedback("Incident history opened.");
        setLastCommand('view incidents');
      },
      confidence: 0.9,
      description: "Open incident history",
      category: 'navigation'
    },

    // Dashboard
    {
      patterns: [
        'go home',
        'open dashboard',
        'main page',
        'dashboard',
        'home screen',
        'overview'
      ],
      action: () => {
        setLocation('/');
        toast({
          title: "Dashboard",
          description: "Returning to main dashboard",
        });
        speakFeedback("Dashboard opened.");
        setLastCommand('go home');
      },
      confidence: 0.9,
      description: "Open main dashboard",
      category: 'navigation'
    },

    // Settings Page
    {
      patterns: [
        'open settings',
        'go to settings',
        'settings page',
        'my settings',
        'user settings',
        'preferences',
        'car audio settings',
        'audio settings',
        'bluetooth settings',
        'connection settings'
      ],
      action: () => {
        setLocation('/settings');
        toast({
          title: "Settings",
          description: "Opening settings and car audio connections",
        });
        speakFeedback("Settings opened. Car audio and video connection options available.");
        setLastCommand('open settings');
      },
      confidence: 0.9,
      description: "Open settings page with car audio connection",
      category: 'navigation'
    },

    // Emergency Alert Commands
    {
      patterns: [
        'send alert notice to my friends and family',
        'alert my family',
        'notify emergency contacts',
        'send emergency alert',
        'alert my contacts',
        'family emergency alert'
      ],
      action: () => {
        toast({
          title: "Emergency Alert Sent",
          description: "Notifying your emergency contacts with location",
          variant: "destructive"
        });
        speakFeedback("Emergency alert sent to all your contacts with current location.");
        setLastCommand('emergency alert');
        // Trigger emergency contact notification
        window.dispatchEvent(new CustomEvent('triggerEmergencyAlert', { detail: { type: 'family' } }));
      },
      confidence: 0.9,
      description: "Alert emergency contacts",
      category: 'emergency'
    },

    // Legal Information Commands
    {
      patterns: [
        'does this state have special laws',
        'state specific laws',
        'special laws in this state',
        'state legal requirements',
        'local laws',
        'state regulations'
      ],
      action: () => {
        setLocation('/rights');
        toast({
          title: "State-Specific Laws",
          description: "Checking local legal requirements",
        });
        speakFeedback("Checking state-specific laws and regulations for your location.");
        setLastCommand('state laws');
      },
      confidence: 0.9,
      description: "Check state-specific laws",
      category: 'legal'
    },

    // Roadside Assistance Commands
    {
      patterns: [
        'i need a tow',
        'call tow truck',
        'need towing',
        'tow truck',
        'vehicle breakdown',
        'car broke down'
      ],
      action: () => {
        toast({
          title: "Roadside Assistance",
          description: "Contacting towing services",
        });
        speakFeedback("Contacting roadside assistance for towing. Stay with your vehicle.");
        setLastCommand('tow truck');
        window.dispatchEvent(new CustomEvent('requestRoadsideAssistance', { detail: { type: 'tow' } }));
      },
      confidence: 0.9,
      description: "Request tow truck",
      category: 'emergency'
    },

    {
      patterns: [
        'i have a flat tire call aaa',
        'flat tire',
        'call aaa',
        'aaa roadside',
        'tire emergency',
        'need tire help'
      ],
      action: () => {
        toast({
          title: "AAA Roadside Assistance",
          description: "Contacting AAA for tire assistance",
        });
        speakFeedback("Calling AAA roadside assistance for your flat tire emergency.");
        setLastCommand('aaa tire');
        window.dispatchEvent(new CustomEvent('requestRoadsideAssistance', { detail: { type: 'aaa_tire' } }));
      },
      confidence: 0.9,
      description: "Call AAA for flat tire",
      category: 'emergency'
    },

    // Attorney Communication Commands
    {
      patterns: [
        'call my attorney',
        'contact my lawyer',
        'call lawyer',
        'attorney help',
        'legal counsel',
        'my legal representative'
      ],
      action: () => {
        setLocation('/attorneys');
        toast({
          title: "Contacting Attorney",
          description: "Connecting with your legal counsel",
        });
        speakFeedback("Contacting your attorney immediately.");
        setLastCommand('call attorney');
        window.dispatchEvent(new CustomEvent('contactAttorney', { detail: { urgent: true } }));
      },
      confidence: 0.9,
      description: "Contact attorney",
      category: 'legal'
    },

    // Rights Information Commands
    {
      patterns: [
        'what are my rights',
        'my legal rights',
        'know my rights',
        'constitutional rights',
        'civil rights',
        'legal protections'
      ],
      action: () => {
        setLocation('/rights');
        toast({
          title: "Your Legal Rights",
          description: "Displaying constitutional protections",
        });
        speakFeedback("Here are your constitutional rights and legal protections.");
        setLastCommand('my rights');
      },
      confidence: 0.9,
      description: "Show legal rights",
      category: 'legal'
    },

    // Officer Interaction Commands
    {
      patterns: [
        'what should i say to the officer',
        'officer interaction',
        'talking to police',
        'police conversation',
        'officer communication',
        'what to say'
      ],
      action: () => {
        setLocation('/ai-assistant');
        toast({
          title: "Officer Interaction Guidance",
          description: "AI providing interaction advice",
        });
        speakFeedback("Here's guidance on professional police interaction. Remain calm and respectful.");
        setLastCommand('officer guidance');
        // Auto-populate AI with officer interaction question
        window.dispatchEvent(new CustomEvent('aiAutoQuery', { 
          detail: { query: 'What should I say during a police encounter?' } 
        }));
      },
      confidence: 0.9,
      description: "Officer interaction guidance",
      category: 'legal'
    },

    // Emergency Contact Commands
    {
      patterns: [
        'notify my emergency contact',
        'call emergency contact',
        'contact my family',
        'alert emergency contact',
        'emergency notification'
      ],
      action: () => {
        toast({
          title: "Emergency Contact Notified",
          description: "Alerting your designated emergency contact",
          variant: "destructive"
        });
        speakFeedback("Notifying your emergency contact with current location and situation.");
        setLastCommand('emergency contact');
        window.dispatchEvent(new CustomEvent('triggerEmergencyAlert', { detail: { type: 'primary' } }));
      },
      confidence: 0.9,
      description: "Notify emergency contact",
      category: 'emergency'
    },

    // Emergency Sharing Commands
    {
      patterns: [
        'emergency sharing',
        'open emergency sharing',
        'share my location',
        'emergency location sharing',
        'activate emergency sharing',
        'one tap emergency'
      ],
      action: () => {
        setLocation('/emergency-sharing');
        toast({
          title: "Emergency Sharing",
          description: "Opening emergency contact sharing system",
          variant: "destructive"
        });
        speakFeedback("Emergency sharing activated. One-tap location sharing ready.");
        setLastCommand('emergency sharing');
      },
      confidence: 0.9,
      description: "Open emergency sharing",
      category: 'emergency'
    },

    {
      patterns: [
        'share location with all contacts',
        'notify all emergency contacts',
        'alert all contacts',
        'mass emergency alert',
        'family emergency alert',
        'emergency broadcast'
      ],
      action: () => {
        setLocation('/emergency-sharing');
        toast({
          title: "Mass Emergency Alert",
          description: "Alerting all emergency contacts with location",
          variant: "destructive"
        });
        speakFeedback("Broadcasting emergency alert to all contacts with your location.");
        setLastCommand('mass alert');
        // Trigger emergency sharing component to auto-activate
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('voiceTriggeredEmergencySharing', { 
            detail: { type: 'general_emergency', autoActivate: true } 
          }));
        }, 1000);
      },
      confidence: 0.9,
      description: "Alert all emergency contacts",
      category: 'emergency'
    },

    // Location Sharing Commands
    {
      patterns: [
        'send my location to my lawyer',
        'share location with attorney',
        'location to lawyer',
        'attorney location',
        'send location to counsel'
      ],
      action: () => {
        toast({
          title: "Location Shared",
          description: "Sending current location to your attorney",
        });
        speakFeedback("Sending your exact location to your attorney immediately.");
        setLastCommand('location to lawyer');
        window.dispatchEvent(new CustomEvent('shareLocationWithAttorney'));
      },
      confidence: 0.9,
      description: "Share location with attorney",
      category: 'legal'
    },

    // De-escalation Commands
    {
      patterns: [
        'activate de-escalation mode',
        'de-escalation mode',
        'calm interaction mode',
        'peaceful mode',
        'de-escalate',
        'safe interaction'
      ],
      action: () => {
        toast({
          title: "De-escalation Mode Active",
          description: "Providing calm interaction guidance",
        });
        speakFeedback("De-escalation mode activated. Remain calm, speak slowly, keep hands visible.");
        setLastCommand('de-escalation');
        window.dispatchEvent(new CustomEvent('activateDeEscalation'));
      },
      confidence: 0.9,
      description: "Activate de-escalation mode",
      category: 'emergency'
    },

    // Critical Emergency Commands (Always work offline)
    {
      patterns: [
        'call 911',
        'call nine one one',
        'emergency services',
        'call police',
        'call ambulance',
        'call fire department'
      ],
      action: () => {
        toast({
          title: "Calling 911",
          description: "Connecting to emergency services",
          variant: "destructive"
        });
        speakFeedback("Calling nine one one emergency services now.");
        setLastCommand('call 911');
        // Direct system call to 911
        if (typeof window !== 'undefined' && 'location' in window) {
          window.location.href = 'tel:911';
        }
      },
      confidence: 1.0,
      description: "Call 911 emergency services",
      category: 'emergency'
    },

    {
      patterns: [
        'send help now',
        'immediate help',
        'emergency help',
        'help me now',
        'urgent assistance',
        'need help immediately'
      ],
      action: () => {
        toast({
          title: "Emergency Help Requested",
          description: "Alerting all emergency contacts and services",
          variant: "destructive"
        });
        speakFeedback("Sending emergency help request to all contacts and services now.");
        setLastCommand('send help');
        window.dispatchEvent(new CustomEvent('triggerEmergencyAlert', { detail: { type: 'all' } }));
      },
      confidence: 0.95,
      description: "Send immediate help request",
      category: 'emergency'
    },

    {
      patterns: [
        "i'm in danger",
        'in danger',
        'danger alert',
        'unsafe situation',
        'threatened',
        'feeling unsafe'
      ],
      action: () => {
        toast({
          title: "Danger Alert Activated",
          description: "Recording incident and alerting contacts",
          variant: "destructive"
        });
        speakFeedback("Danger alert activated. Recording situation and notifying emergency contacts.");
        setLastCommand('danger alert');
        setLocation('/record');
        window.dispatchEvent(new CustomEvent('triggerEmergencyAlert', { detail: { type: 'danger' } }));
      },
      confidence: 0.95,
      description: "Activate danger alert",
      category: 'emergency'
    },

    {
      patterns: [
        'panic alert',
        'panic button',
        'panic mode',
        'emergency panic',
        'panic help',
        'immediate panic'
      ],
      action: () => {
        toast({
          title: "PANIC ALERT ACTIVATED",
          description: "All emergency protocols initiated",
          variant: "destructive"
        });
        speakFeedback("Panic alert activated. Recording everything, alerting all contacts, and emergency services.");
        setLastCommand('panic alert');
        setLocation('/record');
        window.dispatchEvent(new CustomEvent('triggerEmergencyAlert', { detail: { type: 'panic' } }));
      },
      confidence: 1.0,
      description: "Activate panic alert",
      category: 'emergency'
    },

    // Arrest/Detention Commands
    {
      patterns: [
        'being arrested',
        'under arrest',
        'detained',
        'in custody',
        'handcuffed',
        'miranda rights',
        'want a lawyer',
        'need an attorney'
      ],
      action: () => {
        setLocation('/record');
        toast({
          title: "Detention Recording",
          description: "Document your rights invocation",
          variant: "destructive"
        });
        speakFeedback("Detention recording ready. Clearly state: I invoke my right to remain silent and want an attorney.");
        setLastCommand('detention recording');
      },
      confidence: 0.8,
      description: "Detention recording mode",
      category: 'emergency'
    },

    // Facial Recognition Sign In Commands
    {
      patterns: [
        'sign in',
        'sign me in',
        'log in',
        'login',
        'face login',
        'facial login',
        'authenticate',
        'face sign in',
        'facial sign in',
        'use my face'
      ],
      action: async () => {
        try {
          // Check if user has facial recognition set up
          const response = await fetch('/api/auth/check-facial-recognition', {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.hasFacialRecognition) {
              // User has facial recognition, proceed with authentication
              window.dispatchEvent(new CustomEvent('triggerFacialSignIn', { 
                detail: { source: 'voice_command' }
              }));
              
              toast({
                title: "Facial Sign In",
                description: "Voice command: Starting facial recognition login",
              });
              speakFeedback("Starting facial recognition sign in. Please look at the camera.");
            } else {
              // User needs to set up facial recognition first
              toast({
                title: "Facial Recognition Not Set Up",
                description: "Please create an account and set up facial recognition first",
                variant: "destructive"
              });
              speakFeedback("Facial recognition not set up. Please create an account first, then set up facial recognition in your dashboard.");
              
              // Navigate to sign-in page
              setLocation('/auth/signin');
            }
          } else {
            // User not found or error, navigate to sign-in
            toast({
              title: "Account Required",
              description: "Please create an account first",
              variant: "destructive"
            });
            speakFeedback("Account required. Please create an account first, then set up facial recognition.");
            setLocation('/auth/signin');
          }
        } catch (error) {
          console.error('Error checking facial recognition:', error);
          toast({
            title: "Sign In Required",
            description: "Please sign in or create an account",
            variant: "destructive"
          });
          speakFeedback("Please sign in or create an account first.");
          setLocation('/auth/signin');
        }
        
        setLastCommand('facial sign in');
      },
      confidence: 0.9,
      description: "Facial recognition sign in",
      category: 'navigation'
    }
  ];

  // Enhanced command matching with fuzzy logic and improved prioritization
  const findMatchingCommand = (text: string): VoiceCommand | null => {
    const normalizedText = text.toLowerCase().trim();
    console.log('🎯 ENHANCED VOICE MATCHING:', normalizedText);
    
    // Step 1: Exact phrase matching (highest priority)
    for (const command of voiceCommands) {
      for (const pattern of command.patterns) {
        const normalizedPattern = pattern.toLowerCase();
        if (normalizedText === normalizedPattern) {
          console.log('✅ EXACT MATCH:', pattern, '→', command.description);
          return command;
        }
      }
    }
    
    // Step 2: Critical emergency pattern detection
    const emergencyKeywords = ['emergency', 'help', 'danger', 'panic', '911', 'stop'];
    const hasEmergencyKeyword = emergencyKeywords.some(keyword => normalizedText.includes(keyword));
    
    if (hasEmergencyKeyword) {
      // Priority processing for emergency commands
      for (const command of voiceCommands) {
        if (command.category === 'emergency' || command.description.includes('Stop')) {
          for (const pattern of command.patterns) {
            const normalizedPattern = pattern.toLowerCase();
            const patternWords = normalizedPattern.split(' ');
            const textWords = normalizedText.split(' ');
            
            // Check for partial word matches in emergency contexts
            const matchCount = patternWords.filter(word => 
              textWords.some(textWord => 
                textWord.includes(word) || word.includes(textWord)
              )
            ).length;
            
            const matchRatio = matchCount / patternWords.length;
            if (matchRatio >= 0.6) { // 60% match threshold for emergency
              console.log('🚨 EMERGENCY PATTERN MATCH:', normalizedPattern, '→', command.description, 'Ratio:', matchRatio);
              return command;
            }
          }
        }
      }
    }
    
    // Step 3: Stop command special handling (must prevent conflicts)
    if ((normalizedText.includes('stop') || normalizedText.includes('end')) && 
        (normalizedText.includes('record') || normalizedText.includes('video') || normalizedText.includes('audio'))) {
      const stopCommand = voiceCommands.find(cmd => 
        cmd.description === "Stop current recording"
      );
      if (stopCommand) {
        console.log('🛑 STOP COMMAND DETECTED:', normalizedText);
        return stopCommand;
      }
    }
    
    // Step 4: Fuzzy matching with confidence scoring
    let bestMatch: { command: VoiceCommand, score: number } | null = null;
    
    for (const command of voiceCommands) {
      for (const pattern of command.patterns) {
        const normalizedPattern = pattern.toLowerCase();
        
        // Calculate similarity score
        let score = 0;
        
        // Word-by-word matching
        const patternWords = normalizedPattern.split(' ');
        const textWords = normalizedText.split(' ');
        
        const exactWordMatches = patternWords.filter(word => textWords.includes(word)).length;
        score += (exactWordMatches / patternWords.length) * 0.5; // 50% weight for exact words
        
        // Substring matching
        if (normalizedText.includes(normalizedPattern)) {
          score += 0.3; // 30% weight for full substring
        } else if (normalizedPattern.includes(normalizedText)) {
          score += 0.2; // 20% weight for reverse substring
        }
        
        // Partial word matching (for speech recognition errors)
        const partialMatches = patternWords.filter(word => 
          textWords.some(textWord => 
            (word.length > 3 && textWord.includes(word.substring(0, word.length - 1))) ||
            (textWord.length > 3 && word.includes(textWord.substring(0, textWord.length - 1)))
          )
        ).length;
        score += (partialMatches / patternWords.length) * 0.2; // 20% weight for partial matches
        
        // Boost score for high-confidence commands
        score *= command.confidence;
        
        // Length penalty for very long patterns (prefer specific matches)
        if (patternWords.length > 4) {
          score *= 0.9;
        }
        
        // Update best match if this score is higher
        if (score > 0.4 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { command, score };
          console.log('🎯 NEW BEST MATCH:', normalizedPattern, '→', command.description, 'Score:', score.toFixed(3));
        }
      }
    }
    
    if (bestMatch) {
      console.log('✅ FUZZY MATCH SELECTED:', bestMatch.command.description, 'Final Score:', bestMatch.score.toFixed(3));
      return bestMatch.command;
    }
    
    // Step 5: Fallback - check for single keyword matches in critical categories
    const criticalKeywords = {
      'record': () => voiceCommands.find(cmd => cmd.patterns.includes('record')),
      'emergency': () => voiceCommands.find(cmd => cmd.category === 'emergency'),
      'rights': () => voiceCommands.find(cmd => cmd.patterns.includes('show my rights')),
      'attorney': () => voiceCommands.find(cmd => cmd.patterns.includes('find attorney')),
      'help': () => voiceCommands.find(cmd => cmd.patterns.includes('ask ai'))
    };
    
    for (const [keyword, getCommand] of Object.entries(criticalKeywords)) {
      if (normalizedText.includes(keyword)) {
        const command = getCommand();
        if (command) {
          console.log('🔄 FALLBACK KEYWORD MATCH:', keyword, '→', command.description);
          return command;
        }
      }
    }
    
    console.log('❌ NO COMMAND MATCH FOUND for:', normalizedText);
    return null;
  };

  // Enhanced speech recognition with optimized performance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        
        const recognition = new SpeechRecognition();
        
        // Optimized recognition settings for maximum performance
        recognition.continuous = false; // Prevents auto-restart loops
        recognition.interimResults = true; // Shows real-time transcription
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3; // Increased for better accuracy
        // Remove grammars property - not needed for modern speech recognition
        
        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          console.log('🎤 ENHANCED VOICE RECOGNITION STARTED');
          
          // Optional: Play start sound feedback
          try {
            if ('speechSynthesis' in window && speechSynthesis.speaking === false) {
              const startBeep = new SpeechSynthesisUtterance('');
              startBeep.volume = 0.1;
              startBeep.rate = 10;
              speechSynthesis.speak(startBeep);
            }
          } catch (e) {
            // Silent fail for audio feedback
          }
        };
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          let confidence = 0;
          
          // Process all speech results with confidence analysis
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            confidence = Math.max(confidence, result[0].confidence || 0.5);
            
            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Update transcript display with confidence indicator
          const displayTranscript = finalTranscript || interimTranscript;
          setTranscript(displayTranscript + (confidence < 0.7 ? ' (low confidence)' : ''));
          
          // Enhanced command processing with confidence thresholds
          if (finalTranscript.trim()) {
            console.log('🎯 PROCESSING VOICE COMMAND:', finalTranscript, 'Confidence:', confidence.toFixed(3));
            
            // Lower confidence threshold for emergency commands
            const isEmergencyContext = finalTranscript.toLowerCase().includes('emergency') || 
                                     finalTranscript.toLowerCase().includes('stop') ||
                                     finalTranscript.toLowerCase().includes('help');
            
            const minConfidence = isEmergencyContext ? 0.3 : 0.5;
            
            if (confidence >= minConfidence) {
              const matchedCommand = findMatchingCommand(finalTranscript);
              if (matchedCommand) {
                console.log('✅ VOICE COMMAND MATCHED:', matchedCommand.description, 'Confidence:', confidence.toFixed(3));
                
                // Enhanced execution with error recovery
                try {
                  console.log('🚀 EXECUTING COMMAND:', matchedCommand.description);
                  
                  // Execute command with timeout protection
                  const executionPromise = Promise.resolve(matchedCommand.action());
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Command execution timeout')), 5000)
                  );
                  
                  Promise.race([executionPromise, timeoutPromise])
                    .then(() => {
                      console.log('✅ COMMAND EXECUTED SUCCESSFULLY:', matchedCommand.description);
                      setLastCommand(matchedCommand.description);
                    })
                    .catch((error) => {
                      console.error('❌ COMMAND EXECUTION ERROR:', error);
                      toast({
                        title: "Voice Command Error",
                        description: `Failed to execute: ${matchedCommand.description}`,
                        variant: "destructive"
                      });
                    });
                    
                } catch (error) {
                  console.error('❌ IMMEDIATE COMMAND ERROR:', error);
                  toast({
                    title: "Voice Command Failed",
                    description: "Please try the command again",
                    variant: "destructive"
                  });
                }
              } else {
                console.log('⚠️ NO COMMAND MATCH FOUND for:', finalTranscript);
                
                // Helpful feedback for unrecognized commands
                if (confidence > 0.7) {
                  toast({
                    title: "Command Not Recognized",
                    description: `"${finalTranscript}" - Try: "record", "emergency", "rights", or "help"`,
                  });
                }
              }
            } else {
              console.log('⚠️ LOW CONFIDENCE COMMAND IGNORED:', finalTranscript, 'Confidence:', confidence.toFixed(3));
              
              if (isEmergencyContext) {
                toast({
                  title: "Please Repeat Command",
                  description: "Emergency command not clear enough. Please speak clearly.",
                  variant: "destructive"
                });
              }
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('🎤 VOICE RECOGNITION ERROR:', event.error);
          console.error('🎤 ERROR EVENT:', event);
          setIsListening(false);
          setError(`Voice recognition error: ${event.error}`);
          
          // Clear any pending restart
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
          }
          
          // Handle different error types gracefully
          switch (event.error) {
            case 'no-speech':
              setError('No speech detected. Try speaking louder.');
              break;
            case 'aborted':
              // Don't show error for manual stops
              setError(null);
              break;
            case 'network':
              setError('Network error - check your connection');
              break;
            case 'not-allowed':
              setError('Microphone access denied. Please allow microphone access in your browser.');
              break;
            case 'audio-capture':
              setError('Microphone not found. Please connect a microphone.');
              break;
            default:
              setError(`Voice recognition error: ${event.error}`);
          }
        };
        
        recognition.onend = () => {
          console.log('Voice recognition ended');
          setIsListening(false);
          
          // Clear any existing restart timeout
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
          }
          
          // No auto-restart - user must manually click to restart
          // This prevents the cycling issue completely
        };
        
        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
        setError('Speech recognition not supported');
      }
    }
  }, []);

  const startListening = async () => {
    console.log('🎤 ATTEMPTING TO START VOICE RECOGNITION');
    console.log('🎤 isListening:', isListening, 'recognitionRef exists:', !!recognitionRef.current);
    
    if (recognitionRef.current && !isListening) {
      try {
        console.log('🎤 CALLING recognition.start()');
        setError(null);
        setManualStop(false);
        
        // Clear any pending restart
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }

        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permissionError) {
          setError('Microphone permission required. Please allow access and try again.');
          return;
        }
        
        recognitionRef.current.start();
        console.log('Manually starting voice recognition');
      } catch (error: any) {
        console.log('Failed to start voice recognition:', error);
        if (error.name === 'InvalidStateError') {
          // Already running, stop first then restart
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              recognitionRef.current.start();
            }
          }, 100);
        } else {
          setError('Failed to start voice recognition. Please try again.');
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        setManualStop(true);
        
        // Clear any pending restart
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        recognitionRef.current.stop();
        console.log('Manually stopping voice recognition');
      } catch (error) {
        console.log('Error stopping voice recognition:', error);
      }
    }
  };

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    lastCommand
  };
}