import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface VoiceEmergencyContacts {
  isListening: boolean;
  isSupported: boolean;
  activateVoiceContacts: () => void;
  deactivateVoiceContacts: () => void;
  addContactByVoice: () => void;
  callContactByVoice: (contactName: string) => void;
  notifyAllContacts: () => void;
}

interface VoiceContactCommand {
  patterns: string[];
  action: (params?: any) => void;
  category: 'add' | 'call' | 'notify' | 'manage';
  description: string;
}

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

export function useVoiceEmergencyContacts(): VoiceEmergencyContacts {
  // DISABLED: Voice emergency contacts completely disabled for rebuild
  console.log('🎤 VOICE EMERGENCY CONTACTS COMPLETELY DISABLED');
  
  return {
    isListening: false,
    isSupported: false,
    activateVoiceContacts: () => {},
    deactivateVoiceContacts: () => {},
    addContactByVoice: () => {},
    callContactByVoice: () => {},
    notifyAllContacts: () => {}
  };

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactData, setContactData] = useState<Partial<EmergencyContact>>({});
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch emergency contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/emergency-contacts'],
    enabled: true
  });

  // Add emergency contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contact: Omit<EmergencyContact, 'id'>) => {
      const response = await fetch('/api/emergency-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      if (!response.ok) throw new Error('Failed to add contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
      toast({
        title: "Emergency Contact Added",
        description: "Contact successfully added via voice",
      });
      speakFeedback("Emergency contact has been added successfully.");
    }
  });

  // Notify contacts mutation
  const notifyContactsMutation = useMutation({
    mutationFn: async (alertData: any) => {
      const response = await fetch('/api/emergency-contacts/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      if (!response.ok) throw new Error('Failed to notify contacts');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Emergency Contacts Notified",
        description: "All emergency contacts have been alerted",
        variant: "destructive"
      });
      speakFeedback("All emergency contacts have been notified of your situation.");
    }
  });

  // Text-to-speech feedback
  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // Extract phone number from speech
  const extractPhoneNumber = (text: string): string => {
    // Remove all non-digit characters and format
    const digits = text.replace(/\D/g, '');
    
    // Handle spoken numbers (convert words to digits)
    const numberWords: { [key: string]: string } = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'oh': '0'
    };
    
    let processedText = text.toLowerCase();
    Object.entries(numberWords).forEach(([word, digit]) => {
      processedText = processedText.replace(new RegExp(word, 'g'), digit);
    });
    
    const extractedDigits = processedText.replace(/\D/g, '');
    
    // Format as phone number if 10 digits
    if (extractedDigits.length === 10) {
      return `(${extractedDigits.slice(0,3)}) ${extractedDigits.slice(3,6)}-${extractedDigits.slice(6)}`;
    }
    
    return extractedDigits;
  };

  // Voice commands for emergency contacts
  const contactCommands: VoiceContactCommand[] = [
    {
      patterns: [
        'add emergency contact',
        'new emergency contact',
        'create emergency contact',
        'add contact'
      ],
      action: () => {
        setIsAddingContact(true);
        setContactData({});
        speakFeedback("Adding new emergency contact. Please say the contact's name.");
        
        toast({
          title: "Voice Contact Creation",
          description: "Say the contact's name when ready",
        });
      },
      category: 'add',
      description: 'Start adding new emergency contact'
    },

    {
      patterns: [
        'call emergency contact',
        'call my emergency contact',
        'phone emergency contact',
        'dial emergency contact'
      ],
      action: (contactName?: string) => {
        if (contactName) {
          const contact = contacts.find((c: EmergencyContact) => 
            c.name.toLowerCase().includes(contactName.toLowerCase())
          );
          
          if (contact) {
            window.location.href = `tel:${contact.phone}`;
            speakFeedback(`Calling ${contact.name} at ${contact.phone}`);
            
            toast({
              title: "Calling Emergency Contact",
              description: `Dialing ${contact.name}`,
              variant: "destructive"
            });
          } else {
            speakFeedback(`Contact ${contactName} not found. Please try again.`);
          }
        }
      },
      category: 'call',
      description: 'Call specific emergency contact'
    },

    {
      patterns: [
        'notify all emergency contacts',
        'alert all contacts',
        'call all emergency contacts',
        'notify everyone',
        'emergency notification',
        'send emergency alert'
      ],
      action: () => {
        // Get current location for alert
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const alertData = {
              alertType: 'Emergency Voice Alert',
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              },
              userMessage: 'Emergency alert triggered via voice command',
              timestamp: new Date().toISOString()
            };
            
            notifyContactsMutation.mutate(alertData);
          });
        } else {
          // Send alert without location
          const alertData = {
            alertType: 'Emergency Voice Alert',
            userMessage: 'Emergency alert triggered via voice command',
            timestamp: new Date().toISOString()
          };
          
          notifyContactsMutation.mutate(alertData);
        }
      },
      category: 'notify',
      description: 'Notify all emergency contacts'
    },

    {
      patterns: [
        'send my location',
        'share my location',
        'location to contacts',
        'GPS to family'
      ],
      action: () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const alertData = {
              alertType: 'Location Share',
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              },
              userMessage: 'Current location shared via voice command',
              timestamp: new Date().toISOString()
            };
            
            notifyContactsMutation.mutate(alertData);
            speakFeedback("Your current location has been shared with emergency contacts.");
          });
        }
      },
      category: 'notify',
      description: 'Share current location with contacts'
    }
  ];

  // Handle contact addition workflow
  const handleContactAddition = (transcript: string) => {
    if (!contactData.name) {
      setContactData(prev => ({ ...prev, name: transcript.trim() }));
      speakFeedback(`Contact name set to ${transcript.trim()}. Now say their phone number.`);
      return;
    }

    if (!contactData.phone) {
      const phoneNumber = extractPhoneNumber(transcript);
      if (phoneNumber.length >= 10) {
        setContactData(prev => ({ ...prev, phone: phoneNumber }));
        speakFeedback(`Phone number set to ${phoneNumber}. Now say their relationship to you, like family, friend, or attorney.`);
        return;
      } else {
        speakFeedback("Phone number not clear. Please repeat the phone number clearly.");
        return;
      }
    }

    if (!contactData.relationship) {
      const relationship = transcript.trim().toLowerCase();
      const validRelationships = ['family', 'friend', 'attorney', 'colleague', 'neighbor', 'spouse', 'parent', 'sibling'];
      
      const matchedRelationship = validRelationships.find(rel => 
        relationship.includes(rel)
      ) || relationship;

      const newContact = {
        name: contactData.name!,
        phone: contactData.phone!,
        relationship: matchedRelationship
      };

      addContactMutation.mutate(newContact);
      setIsAddingContact(false);
      setContactData({});
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
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.toLowerCase().trim();
          
          if (isAddingContact) {
            handleContactAddition(transcript);
            return;
          }

          // Find matching command
          const matchedCommand = contactCommands.find(command =>
            command.patterns.some(pattern => 
              transcript.includes(pattern.toLowerCase())
            )
          );

          if (matchedCommand) {
            // Extract contact name for call commands
            if (matchedCommand.category === 'call') {
              const nameMatch = transcript.match(/call.*contact\s+(.+)/);
              const contactName = nameMatch ? nameMatch[1] : null;
              matchedCommand.action(contactName);
            } else {
              matchedCommand.action();
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Voice emergency contacts error:', event.error);
      };

      recognition.onend = () => {
        if (isListening) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('Recognition restart error:', e);
            }
          }, 500);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, isAddingContact, contactData, contacts]);

  const activateVoiceContacts = () => {
    if (!isSupported) {
      toast({
        title: "Voice Commands Not Supported",
        description: "Speech recognition unavailable",
        variant: "destructive"
      });
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        speakFeedback("Voice emergency contact management activated. You can add contacts, call contacts, or notify all contacts.");
        
        toast({
          title: "Voice Emergency Contacts Active",
          description: "Listening for contact management commands",
        });
      } catch (err) {
        toast({
          title: "Voice Command Error",
          description: "Could not start voice contact management",
          variant: "destructive"
        });
      }
    }
  };

  const deactivateVoiceContacts = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsAddingContact(false);
      setContactData({});
      
      toast({
        title: "Voice Emergency Contacts Deactivated",
        description: "Contact management stopped",
      });
    }
  };

  const addContactByVoice = () => {
    contactCommands[0].action();
  };

  const callContactByVoice = (contactName: string) => {
    contactCommands[1].action(contactName);
  };

  const notifyAllContacts = () => {
    contactCommands[2].action();
  };

  return {
    isListening,
    isSupported,
    activateVoiceContacts,
    deactivateVoiceContacts,
    addContactByVoice,
    callContactByVoice,
    notifyAllContacts
  };
}