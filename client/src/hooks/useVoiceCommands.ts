import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface VoiceCommandHook {
  isListening: boolean;
  isSupported: boolean;
  confidence: number;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  lastCommand: string | null;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  stressLevel: number;
}

interface VoiceCommand {
  patterns: string[];
  action: () => void;
  confidence: number;
  description: string;
  category: 'emergency' | 'recording' | 'navigation' | 'legal' | 'family';
}

export function useVoiceCommands(onEmergencyRecord?: () => void, onNormalRecord?: () => void, onStopRecording?: () => void, navigate?: (path: string) => void, setLocation?: (path: string) => void): VoiceCommandHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [stressLevel, setStressLevel] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const voiceStressRef = useRef<number[]>([]);
  const backgroundListeningRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Emergency voice commands
  const voiceCommands: VoiceCommand[] = [
    // Critical Emergency Recording Commands
    {
      patterns: [
        'emergency record',
        'emergency recording', 
        'start emergency recording',
        'start emergency',
        'emergency mode',
        'emergency situation',
        'police encounter',
        'traffic stop emergency',
        'test emergency',
        'emergency test',
        'record emergency',
        'begin emergency',
        'help me record',
        'I need to record this',
        'document this encounter',
        'officer approaching',
        'pulled over',
        'being detained',
        'arrest in progress',
        'police lights behind me',
        'checkpoint ahead',
        'sobriety checkpoint',
        'border patrol stop',
        'ICE encounter',
        'federal agents',
        'suspicious activity',
        'harassment incident',
        'discrimination event',
        'workplace incident',
        'civil rights violation'
      ],
      action: () => {
        console.log('🚨 EMERGENCY RECORD COMMAND TRIGGERED');
        
        // Navigate to record page first
        if (navigate) {
          console.log('🚨 Navigating to /record?emergency=true');
          navigate('/record?emergency=true');
        }
        
        // Trigger comprehensive emergency recording event
        setTimeout(() => {
          const event = new CustomEvent('emergencyRecording', {
            detail: { 
              type: 'police_encounter',
              priority: 'critical',
              timestamp: new Date().toISOString()
            }
          });
          window.dispatchEvent(event);
          console.log('🚨 EMERGENCY RECORDING EVENT DISPATCHED');
        }, 500); // Small delay to ensure page loads
        
        toast({
          title: "🚨 Emergency Recording Activated",
          description: "Connecting devices and notifying contacts...",
          variant: "destructive"
        });
        speakFeedback("Emergency recording activated. Connecting devices and notifying emergency contacts. Stay calm and comply with lawful orders.");
      },
      confidence: 0.6,
      description: "Start emergency incident recording",
      category: 'emergency'
    },

    // Traffic Stop Specific Commands
    {
      patterns: [
        'traffic stop',
        'getting pulled over',
        'police lights',
        'state trooper',
        'highway patrol',
        'speeding ticket',
        'license and registration',
        'field sobriety test',
        'breathalyzer test',
        'vehicle search',
        'consent to search',
        'probable cause',
        'roadside inspection'
      ],
      action: () => {
        if (onEmergencyRecord) {
          onEmergencyRecord();
          toast({
            title: "Traffic Stop Recording Active",
            description: "Know your rights: You can remain silent and refuse searches",
            variant: "destructive"
          });
          speakFeedback("Traffic stop recording started. You have the right to remain silent and refuse consent to search.");
        }
      },
      confidence: 0.7,
      description: "Traffic stop emergency recording",
      category: 'emergency'
    },

    // Stop Recording Commands
    {
      patterns: [
        'stop recording',
        'end recording',
        'finish recording',
        'stop incident recording',
        'recording complete',
        'end incident'
      ],
      action: () => {
        if (onStopRecording) {
          onStopRecording();
          toast({
            title: "Recording Stopped",
            description: "Incident recording has been saved",
          });
          speakFeedback("Recording stopped and saved.");
        }
      },
      confidence: 0.9,
      description: "Stop current recording",
      category: 'recording'
    },

    // Detention and Arrest Commands
    {
      patterns: [
        'being arrested',
        'under arrest',
        'detained',
        'in custody',
        'handcuffed',
        'miranda rights',
        'read my rights',
        'booking process',
        'jail intake',
        'interrogation',
        'police questioning',
        'want a lawyer',
        'need an attorney',
        'invoking counsel'
      ],
      action: () => {
        if (setLocation) {
          setLocation('/record');
        }
        if (navigate) {
          navigate('/record');
        }
        setTimeout(() => {
          if (onEmergencyRecord) {
            onEmergencyRecord();
          }
          toast({
            title: "Detention Recording Active",
            description: "Invoke your right to remain silent and request an attorney",
            variant: "destructive"
          });
          speakFeedback("Detention recording active. Clearly state: I invoke my right to remain silent and want an attorney.");
        }, 500);
      },
      confidence: 0.8,
      description: "Arrest and detention recording",
      category: 'emergency'
    },

    // Public Safety Incidents
    {
      patterns: [
        'excessive force',
        'police brutality',
        'officer misconduct',
        'unreasonable search',
        'illegal detention',
        'rights violated',
        'first amendment audit',
        'public photography',
        'recording in public',
        'filming police',
        'freedom of press',
        'journalist credentials',
        'peaceful protest',
        'demonstration',
        'public assembly'
      ],
      action: () => {
        if (onEmergencyRecord) {
          onEmergencyRecord();
          toast({
            title: "Civil Rights Documentation",
            description: "Recording potential rights violation for legal review",
            variant: "destructive"
          });
          speakFeedback("Civil rights documentation active. Continue recording and remain calm.");
        }
      },
      confidence: 0.7,
      description: "Civil rights violation recording",
      category: 'emergency'
    },

    // Workplace and Discrimination Incidents
    {
      patterns: [
        'workplace harassment',
        'sexual harassment',
        'racial discrimination',
        'hostile work environment',
        'wrongful termination',
        'retaliation incident',
        'whistleblower protection',
        'HR violation',
        'employment law issue',
        'hostile supervisor',
        'unsafe working conditions',
        'labor law violation'
      ],
      action: () => {
        if (onEmergencyRecord) {
          onEmergencyRecord();
          toast({
            title: "Workplace Incident Recording",
            description: "Documenting incident for HR and legal review",
            variant: "destructive"
          });
          speakFeedback("Workplace incident recording started. Document all details carefully.");
        }
      },
      confidence: 0.7,
      description: "Workplace incident documentation",
      category: 'emergency'
    },

    // Home and Property Incidents
    {
      patterns: [
        'home invasion',
        'break in attempt',
        'trespassing',
        'property damage',
        'vandalism',
        'neighbor dispute',
        'noise complaint',
        'property theft',
        'burglary in progress',
        'suspicious person',
        'security breach',
        'unauthorized entry'
      ],
      action: () => {
        if (onEmergencyRecord) {
          onEmergencyRecord();
          toast({
            title: "Property Incident Recording",
            description: "Documenting property-related incident",
            variant: "destructive"
          });
          speakFeedback("Property incident recording active. Ensure your safety first.");
        }
      },
      confidence: 0.7,
      description: "Property incident recording",
      category: 'emergency'
    },

    // Medical and Health Emergencies
    {
      patterns: [
        'medical emergency',
        'health incident',
        'medical malpractice',
        'hospital error',
        'medication error',
        'insurance denial',
        'healthcare discrimination',
        'patient rights violation',
        'medical consent issue',
        'emergency room incident'
      ],
      action: () => {
        if (onEmergencyRecord) {
          onEmergencyRecord();
          toast({
            title: "Medical Incident Recording",
            description: "Documenting healthcare-related incident",
            variant: "destructive"
          });
          speakFeedback("Medical incident recording started. Document all interactions and decisions.");
        }
      },
      confidence: 0.7,
      description: "Medical incident documentation",
      category: 'emergency'
    },

    // Standard Recording Commands
    {
      patterns: [
        'start recording',
        'begin recording',
        'record audio',
        'record video',
        'start capture'
      ],
      action: () => {
        if (onNormalRecord) {
          onNormalRecord();
          toast({
            title: "Recording Started",
            description: "Audio/video recording initiated"
          });
        }
      },
      confidence: 0.8,
      description: "Start normal recording",
      category: 'recording'
    },

    // Legal Rights Commands
    {
      patterns: [
        'know my rights',
        'what are my rights',
        'legal rights',
        'show legal information',
        'police rights',
        'traffic stop rights'
      ],
      action: () => {
        window.location.href = '/rights';
        toast({
          title: "Legal Rights",
          description: "Displaying your legal rights and protections"
        });
      },
      confidence: 0.8,
      description: "Show legal rights information",
      category: 'legal'
    },

    // Send Recording to Attorney Commands
    {
      patterns: [
        'send recording to my attorney',
        'send recording to attorney',
        'send this to my lawyer',
        'email recording to attorney',
        'send evidence to lawyer',
        'forward recording to attorney',
        'attorney needs this recording',
        'send to legal counsel',
        'deliver recording to attorney',
        'transmit recording to lawyer',
        'share recording with attorney',
        'attorney should see this'
      ],
      action: async () => {
        try {
          // Get current recordings and send to attorney
          const response = await fetch('/api/send-recording-to-attorney', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              includeEmergencyAlert: true,
              priority: 'high'
            })
          });
          
          if (response.ok) {
            toast({
              title: "Recording Sent to Attorney",
              description: "Recording delivered to attorney and family notified",
              variant: "default"
            });
            speakFeedback("Recording has been sent to your attorney and emergency contacts have been notified.");
          } else {
            throw new Error('Failed to send recording');
          }
        } catch (error) {
          toast({
            title: "Send Failed",
            description: "Could not send recording to attorney. Please try again.",
            variant: "destructive"
          });
          speakFeedback("Unable to send recording. Please ensure you have an attorney configured.");
        }
      },
      confidence: 0.9,
      description: "Send current recording to attorney with family alerts",
      category: 'recording'
    },

    // Family Emergency Coordination Commands
    {
      patterns: [
        'family emergency alert',
        'alert my family',
        'notify all family members',
        'send family alert',
        'family help needed',
        'coordinate family response',
        'emergencia familiar',
        'alertar familia',
        'ayuda familiar necesaria',
        'coordinar respuesta familiar'
      ],
      action: () => {
        // Trigger family-specific emergency with location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const familyAlert = {
              type: 'family_emergency',
              message: 'Emergency alert from family member - immediate assistance needed',
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: new Date().toISOString()
              },
              priority: 'critical'
            };
            
            window.dispatchEvent(new CustomEvent('triggerFamilyEmergency', { detail: familyAlert }));
          });
        } else {
          window.dispatchEvent(new CustomEvent('triggerFamilyEmergency', { 
            detail: { 
              type: 'family_emergency',
              message: 'Emergency alert from family member - immediate assistance needed',
              priority: 'critical'
            } 
          }));
        }
        
        toast({
          title: "Family Emergency Alert",
          description: "Alerting all family members with your location",
          variant: "destructive"
        });
        speakFeedback("Family emergency alert activated. All family members are being notified with your location and situation.");
        setLastCommand('family emergency');
      },
      confidence: 0.95,
      description: "Alert all family members in emergency",
      category: 'family'
    },

    // Family Location Sharing Commands
    {
      patterns: [
        'share location with family',
        'send my location to family',
        'family location update',
        'where am I family',
        'tell family where I am',
        'family GPS location',
        'compartir ubicación familia',
        'enviar ubicación a familia',
        'actualización ubicación familiar'
      ],
      action: () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const locationData = {
              type: 'location_update',
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: new Date().toISOString()
              },
              message: 'Location shared via voice command'
            };
            
            window.dispatchEvent(new CustomEvent('shareFamilyLocation', { detail: locationData }));
          });
        }
        
        toast({
          title: "Location Shared",
          description: "Sending current location to family members"
        });
        speakFeedback("Sharing your current location with all family members now.");
        setLastCommand('share family location');
      },
      confidence: 0.9,
      description: "Share location with family members",
      category: 'family'
    },

    // Family Status Check Commands
    {
      patterns: [
        'check family status',
        'family check in',
        'are my family members safe',
        'family safety status',
        'family member locations',
        'where is my family',
        'verificar estado familiar',
        'revisar seguridad familia',
        '¿está segura mi familia?'
      ],
      action: () => {
        toast({
          title: "Family Status Check",
          description: "Checking safety status of all family members"
        });
        speakFeedback("Checking safety status and last known locations of all family members.");
        setLastCommand('family status check');
        window.dispatchEvent(new CustomEvent('checkFamilyStatus'));
      },
      confidence: 0.8,
      description: "Check family member safety status",
      category: 'family'
    },

    // Family Coordination for Teen Drivers
    {
      patterns: [
        'teen driver alert',
        'notify parents teen emergency',
        'teen help needed',
        'young driver emergency',
        'student driver incident',
        'teen traffic stop',
        'alerta conductor joven',
        'emergencia conductor adolescente',
        'ayuda conductor estudiante'
      ],
      action: () => {
        toast({
          title: "Teen Driver Emergency",
          description: "Notifying parents and family immediately",
          variant: "destructive"
        });
        speakFeedback("Teen driver emergency alert activated. Notifying parents and family members immediately with your location.");
        setLastCommand('teen emergency');
        window.dispatchEvent(new CustomEvent('triggerTeenEmergency', { 
          detail: { 
            type: 'teen_emergency',
            message: 'Teen driver emergency - parent notification required',
            priority: 'high'
          } 
        }));
      },
      confidence: 0.9,
      description: "Alert parents for teen driver emergency",
      category: 'family'
    },

    // Family Group Recording Commands
    {
      patterns: [
        'family incident recording',
        'record for family',
        'document family emergency',
        'family evidence recording',
        'family protection recording',
        'grabación incidente familiar',
        'documentar emergencia familiar',
        'grabación protección familia'
      ],
      action: () => {
        // Navigate to record page with family context
        if (navigate) {
          navigate('/record?emergency=true&family=true');
        }
        
        toast({
          title: "Family Incident Recording",
          description: "Recording incident with family coordination",
          variant: "destructive"
        });
        speakFeedback("Family incident recording activated. This recording will be shared with designated family members.");
        setLastCommand('family recording');
        
        // Trigger family recording notification
        window.dispatchEvent(new CustomEvent('startFamilyRecording'));
      },
      confidence: 0.8,
      description: "Start family coordinated recording",
      category: 'family'
    },

    // Individual Emergency Contact Commands
    {
      patterns: [
        'call emergency contacts',
        'notify contacts',
        'send emergency alert',
        'contact attorney',
        'call my lawyer',
        'alert next of kin',
        'emergency notification',
        'send distress signal',
        'panic button',
        'SOS alert',
        'immediate assistance',
        'call for backup',
        'witness needed',
        'notify employer',
        'contact union representative',
        'alert civil rights organization'
      ],
      action: () => {
        toast({
          title: "Emergency Contacts Notified",
          description: "Alerting your emergency contacts and attorney",
          variant: "destructive"
        });
        speakFeedback("Emergency contacts have been notified with your location and situation.");
        setLastCommand('emergency contacts');
        window.dispatchEvent(new CustomEvent('triggerEmergencyAlert'));
      },
      confidence: 0.7,
      description: "Notify emergency contacts and legal support",
      category: 'emergency'
    },

    // Specific Legal Rights Invocation (English)
    {
      patterns: [
        'fourth amendment',
        'unreasonable search',
        'warrant required',
        'search my vehicle',
        'search my person',
        'search my property',
        'consent to search',
        'refuse search',
        'no consent',
        'show me the warrant',
        'probable cause',
        'reasonable suspicion',
        'stop and frisk',
        'terry stop',
        'detention limits',
        'am I free to leave',
        'am I under arrest',
        'miranda warning'
      ],
      action: () => {
        window.location.href = '/rights';
        toast({
          title: "Fourth Amendment Rights",
          description: "You have the right to refuse searches without a warrant",
        });
        speakFeedback("Fourth Amendment protects against unreasonable searches. You can refuse consent to search.");
      },
      confidence: 0.8,
      description: "Fourth Amendment search rights",
      category: 'legal'
    },

    // Spanish Constitutional Rights (Derechos Constitucionales)
    {
      patterns: [
        'cuarta enmienda',
        'búsqueda irrazonable',
        'se requiere orden judicial',
        'buscar mi vehículo',
        'registrar mi persona',
        'registrar mi propiedad',
        'consentimiento para buscar',
        'rechazar búsqueda',
        'no consiento',
        'muéstreme la orden',
        'causa probable',
        'sospecha razonable',
        'detener y registrar',
        'límites de detención',
        'soy libre de irme',
        'estoy bajo arresto',
        'advertencia miranda',
        'quinta enmienda',
        'derecho a permanecer en silencio',
        'derecho a un abogado',
        'no quiero hablar',
        'quiero un abogado',
        'no entiendo inglés',
        'hablo español',
        'necesito intérprete',
        'derechos constitucionales',
        'no consiento a la búsqueda',
        'tengo derecho al silencio'
      ],
      action: () => {
        window.location.href = '/rights';
        toast({
          title: "Derechos Constitucionales",
          description: "Tiene derecho a rechazar búsquedas sin orden judicial",
        });
        speakFeedback("La Cuarta Enmienda protege contra búsquedas irrazonables. Puede rechazar el consentimiento para buscar. You have constitutional rights.");
      },
      confidence: 0.8,
      description: "Spanish constitutional rights",
      category: 'legal'
    },

    // Fifth Amendment Rights (English & Spanish)
    {
      patterns: [
        'fifth amendment',
        'right to remain silent',
        'plead the fifth',
        'invoke fifth amendment',
        'self incrimination',
        'refuse to answer',
        'quinta enmienda',
        'derecho al silencio',
        'me declaro en silencio',
        'invoco la quinta enmienda',
        'auto incriminación',
        'me niego a responder'
      ],
      action: () => {
        toast({
          title: "Fifth Amendment / Quinta Enmienda",
          description: "You have the right to remain silent / Tiene derecho a permanecer en silencio",
        });
        speakFeedback("Fifth Amendment invoked. You have the right to remain silent. Quinta Enmienda invocada. Tiene derecho a permanecer en silencio.");
      },
      confidence: 0.9,
      description: "Fifth Amendment silence rights",
      category: 'legal'
    },

    // Bluetooth Camera Connection Commands
    {
      patterns: [
        'connect camera',
        'pair camera',
        'connect bluetooth camera',
        'pair dashcam',
        'connect dashcam',
        'pair body camera',
        'connect body camera',
        'bluetooth camera',
        'scan for cameras',
        'find cameras',
        'connect recording device',
        'pair recording device',
        'bluetooth dashcam',
        'wireless camera',
        'external camera',
        'multi camera setup',
        'camera pairing mode',
        'sync cameras'
      ],
      action: () => {
        // Navigate to record page with Bluetooth integration
        if (navigate) {
          navigate('/record?bluetooth=true');
        }
        
        // Trigger Bluetooth device scanning
        window.dispatchEvent(new CustomEvent('startBluetoothScan', {
          detail: { deviceType: 'camera' }
        }));
        
        toast({
          title: "Bluetooth Camera Connection",
          description: "Scanning for available cameras and recording devices",
        });
        speakFeedback("Bluetooth camera connection activated. Put your camera in pairing mode and I'll scan for devices.");
      },
      confidence: 0.8,
      description: "Connect Bluetooth cameras and dashcams",
      category: 'recording'
    },

    // Specific Dashcam Commands
    {
      patterns: [
        'connect my dashcam',
        'pair my dashcam',
        'dashcam recording',
        'activate dashcam',
        'sync dashcam',
        'car camera',
        'front camera',
        'rear camera',
        'parking camera',
        'traffic camera'
      ],
      action: () => {
        window.dispatchEvent(new CustomEvent('connectDashcam'));
        toast({
          title: "Dashcam Connection",
          description: "Connecting to vehicle dashcam system",
        });
        speakFeedback("Connecting to your dashcam. Ensure it's in pairing mode and within range.");
      },
      confidence: 0.9,
      description: "Connect vehicle dashcam",
      category: 'recording'
    },

    // Body Camera Commands
    {
      patterns: [
        'connect body camera',
        'pair body cam',
        'wearable camera',
        'action camera',
        'chest camera',
        'shoulder camera',
        'personal recorder',
        'bodycam'
      ],
      action: () => {
        window.dispatchEvent(new CustomEvent('connectBodyCamera'));
        toast({
          title: "Body Camera Connection",
          description: "Connecting to wearable recording device",
        });
        speakFeedback("Connecting to your body camera. Make sure it's powered on and in pairing mode.");
      },
      confidence: 0.9,
      description: "Connect wearable body camera",
      category: 'recording'
    },

    // Multi-Camera Setup Commands
    {
      patterns: [
        'connect all cameras',
        'multi camera mode',
        'sync all devices',
        'coordinate recording',
        'all angles',
        'multiple cameras',
        'camera network',
        'recording array',
        'full coverage'
      ],
      action: () => {
        window.dispatchEvent(new CustomEvent('connectAllCameras'));
        toast({
          title: "Multi-Camera Setup",
          description: "Connecting to all available recording devices",
        });
        speakFeedback("Multi-camera mode activated. Scanning for all available cameras and recording devices.");
      },
      confidence: 0.8,
      description: "Connect multiple recording devices",
      category: 'recording'
    },

    // Camera Control Commands
    {
      patterns: [
        'start all cameras',
        'record all angles',
        'activate all devices',
        'begin multi recording',
        'start coordinated recording',
        'full documentation',
        'record everything',
        'all camera record'
      ],
      action: () => {
        // Start recording on all connected cameras
        window.dispatchEvent(new CustomEvent('startAllCameraRecording'));
        if (onEmergencyRecord) {
          onEmergencyRecord();
        }
        toast({
          title: "Multi-Camera Recording Started",
          description: "Recording from all connected devices",
          variant: "destructive"
        });
        speakFeedback("All cameras recording. Multiple angles are being documented for comprehensive evidence.");
      },
      confidence: 0.9,
      description: "Start recording on all connected cameras",
      category: 'emergency'
    },

    // First Amendment Protection
    {
      patterns: [
        'first amendment',
        'freedom of speech',
        'right to record',
        'filming police',
        'public photography',
        'freedom of press',
        'journalist rights',
        'peaceful assembly',
        'freedom of religion',
        'right to protest',
        'public forum',
        'expressive conduct',
        'symbolic speech'
      ],
      action: () => {
        window.location.href = '/rights';
        toast({
          title: "First Amendment Rights",
          description: "You have the right to record police in public spaces",
        });
        speakFeedback("First Amendment protects your right to record police activities in public spaces.");
      },
      confidence: 0.8,
      description: "First Amendment recording rights",
      category: 'legal'
    },

    // Court and Legal Process Commands
    {
      patterns: [
        'arraignment',
        'bail hearing',
        'court appearance',
        'legal representation',
        'public defender',
        'habeas corpus',
        'due process',
        'speedy trial',
        'jury trial',
        'plea bargain',
        'sentencing',
        'appeal process',
        'civil lawsuit',
        'federal court',
        'state court',
        'constitutional rights'
      ],
      action: () => {
        window.location.href = '/attorneys';
        toast({
          title: "Legal Process Information",
          description: "Connecting you with legal resources and attorney network",
        });
        speakFeedback("Accessing legal process information and attorney connections.");
      },
      confidence: 0.8,
      description: "Legal process and court rights",
      category: 'legal'
    },

    // Specific Incident Documentation
    {
      patterns: [
        'document badge number',
        'record officer name',
        'patrol car number',
        'time and date',
        'witness information',
        'injury documentation',
        'property damage',
        'evidence collection',
        'chain of custody',
        'incident report',
        'complaint number',
        'case number',
        'booking number',
        'citation number'
      ],
      action: () => {
        if (onEmergencyRecord) {
          onEmergencyRecord();
          toast({
            title: "Evidence Documentation Mode",
            description: "Recording details for legal documentation",
            variant: "destructive"
          });
          speakFeedback("Evidence documentation mode active. Record all identifying numbers, names, and details.");
        }
      },
      confidence: 0.8,
      description: "Evidence and detail documentation",
      category: 'emergency'
    },

    // De-escalation and Safety Commands
    {
      patterns: [
        'de-escalate situation',
        'remain calm',
        'comply peacefully',
        'hands visible',
        'no sudden movements',
        'following orders',
        'peaceful compliance',
        'non-threatening posture',
        'step back',
        'show my hands',
        'keep recording',
        'stay quiet',
        'do not resist',
        'peaceful resolution'
      ],
      action: () => {
        toast({
          title: "De-escalation Guidance",
          description: "Keep hands visible, remain calm, comply with lawful orders",
        });
        speakFeedback("Keep your hands visible, remain calm, and comply with lawful orders while recording continues.");
      },
      confidence: 0.8,
      description: "De-escalation and safety guidance",
      category: 'legal'
    },

    // Language and Communication Assistance
    {
      patterns: [
        'language interpreter',
        'spanish interpreter',
        'translation needed',
        'english not first language',
        'communication barrier',
        'interpreter rights',
        'language assistance',
        'translation services',
        'communication help',
        'language support'
      ],
      action: () => {
        toast({
          title: "Language Rights",
          description: "You have the right to an interpreter in legal proceedings",
        });
        speakFeedback("You have the right to language interpretation services. Request an interpreter if needed.");
      },
      confidence: 0.8,
      description: "Language and interpretation rights",
      category: 'legal'
    },

    // Legal Questions - ID Requirements
    {
      patterns: [
        'do i have to give the police officer my id',
        'do i need to show my id',
        'must i provide identification',
        'am i required to show id',
        'do i have to hand over my id',
        'is id required',
        'id state requirements',
        'identification laws',
        'must show identification',
        'id display rights',
        'do i need to show my id here in ohio',
        'is ohio a id state',
        'ohio id requirements',
        'show id to police'
      ],
      action: async () => {
        const response = await handleLegalQuestion("Do I have to give the police officer my ID?");
        speakFeedback(response);
      },
      confidence: 0.95,
      description: "ID requirement legal questions",
      category: 'legal'
    },

    // Legal Questions - Search Rights
    {
      patterns: [
        'can police search my car',
        'do i have to consent to search',
        'search warrant required',
        'fourth amendment rights',
        'refuse search',
        'probable cause search',
        'vehicle search rights',
        'search and seizure',
        'consent to search'
      ],
      action: async () => {
        const response = await handleLegalQuestion("Can police search my vehicle without consent?");
        speakFeedback(response);
      },
      confidence: 0.9,
      description: "Search rights legal questions",
      category: 'legal'
    },

    // Legal Questions - Traffic Stop Rights
    {
      patterns: [
        'what are my rights during traffic stop',
        'traffic stop rights',
        'pulled over rights',
        'police encounter rights',
        'roadside rights',
        'traffic citation rights',
        'ticket signing requirements',
        'refuse to sign ticket'
      ],
      action: async () => {
        const response = await handleLegalQuestion("What are my rights during a traffic stop?");
        speakFeedback(response);
      },
      confidence: 0.9,
      description: "Traffic stop rights questions",
      category: 'legal'
    },

    // Location Commands
    {
      patterns: [
        'get location',
        'where am I',
        'current location',
        'GPS location',
        'what state am I in'
      ],
      action: () => {
        // This would trigger GPS location detection
        toast({
          title: "Location Detection",
          description: "Getting your current location and legal information"
        });
      },
      confidence: 0.8,
      description: "Get current location and legal context",
      category: 'navigation'
    },

    // Silent Mode Commands
    {
      patterns: [
        'remain silent',
        'I want to remain silent',
        'invoke silence',
        'fifth amendment',
        'I plead the fifth'
      ],
      action: () => {
        toast({
          title: "Right to Remain Silent",
          description: "You are exercising your Fifth Amendment right. Stay calm and comply with lawful orders.",
        });
      },
      confidence: 0.8,
      description: "Invoke right to remain silent",
      category: 'legal'
    },

    // Stop Commands
    {
      patterns: [
        'stop recording',
        'end recording',
        'stop listening',
        'turn off',
        'cancel'
      ],
      action: () => {
        setIsListening(false);
        toast({
          title: "Voice Commands Stopped",
          description: "Voice recognition disabled"
        });
      },
      confidence: 0.9,
      description: "Stop voice commands",
      category: 'recording'
    }
  ];

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setError(event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access for voice commands",
            variant: "destructive"
          });
        }
      };

      recognition.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        setTranscript(currentTranscript);
        
        // Process final results for command matching
        if (event.results[event.results.length - 1].isFinal) {
          const finalTranscript = currentTranscript.toLowerCase().trim();
          const resultConfidence = event.results[event.results.length - 1][0].confidence;
          setConfidence(resultConfidence);
          
          // Match against voice commands
          processVoiceCommand(finalTranscript, resultConfidence);
        }
      };
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Voice stress analysis function
  const analyzeVoiceStress = (transcript: string, confidence: number) => {
    const stressKeywords = [
      'help', 'scared', 'afraid', 'nervous', 'worried', 'panic', 'emergency',
      'ayuda', 'miedo', 'asustado', 'nervioso', 'preocupado', 'pánico', 'emergencia'
    ];
    
    const urgencyKeywords = [
      'now', 'immediately', 'quick', 'fast', 'hurry', 'urgent',
      'ahora', 'inmediatamente', 'rápido', 'urgente', 'prisa'
    ];
    
    const threatKeywords = [
      'gun', 'weapon', 'violence', 'hurt', 'harm', 'threat', 'danger',
      'pistola', 'arma', 'violencia', 'lastimar', 'daño', 'amenaza', 'peligro'
    ];
    
    let stress = 0;
    
    // Analyze speech patterns
    if (confidence < 0.3) stress += 0.2;
    if (transcript.includes('!') || transcript.toUpperCase() === transcript) stress += 0.3;
    
    // Check for stress keywords
    stressKeywords.forEach(keyword => {
      if (transcript.toLowerCase().includes(keyword)) stress += 0.4;
    });
    
    urgencyKeywords.forEach(keyword => {
      if (transcript.toLowerCase().includes(keyword)) stress += 0.2;
    });
    
    threatKeywords.forEach(keyword => {
      if (transcript.toLowerCase().includes(keyword)) stress += 0.6;
    });
    
    // Maintain stress level history
    voiceStressRef.current.push(stress);
    if (voiceStressRef.current.length > 10) {
      voiceStressRef.current.shift();
    }
    
    // Calculate average stress level
    const avgStress = voiceStressRef.current.reduce((a, b) => a + b, 0) / voiceStressRef.current.length;
    setStressLevel(Math.min(1.0, avgStress));
    
    // Determine threat level
    if (avgStress > 0.8) {
      setThreatLevel('critical');
      return 'critical';
    } else if (avgStress > 0.6) {
      setThreatLevel('high');
      return 'high';
    } else if (avgStress > 0.4) {
      setThreatLevel('medium');
      return 'medium';
    } else {
      setThreatLevel('low');
      return 'low';
    }
  };

  // Emergency escalation based on threat level
  const handleEmergencyEscalation = (threatLevel: string, transcript: string) => {
    if (threatLevel === 'critical') {
      // Immediate emergency recording and notifications
      if (onEmergencyRecord) {
        onEmergencyRecord();
      }
      
      // Auto-notify emergency contacts
      window.dispatchEvent(new CustomEvent('autoEmergencyAlert', {
        detail: { 
          reason: 'Voice stress critical level detected',
          transcript: transcript,
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: "CRITICAL THREAT DETECTED",
        description: "Emergency recording and contacts auto-activated",
        variant: "destructive"
      });
      
      speakFeedback("Critical threat detected. Emergency recording activated. Emergency contacts notified.");
      
    } else if (threatLevel === 'high') {
      // High priority recording with family alerts
      if (onEmergencyRecord) {
        onEmergencyRecord();
      }
      
      toast({
        title: "High Threat Level",
        description: "Emergency recording started automatically",
        variant: "destructive"
      });
      
      speakFeedback("High stress detected. Emergency recording activated for your protection.");
    }
  };

  const processVoiceCommand = (transcript: string, confidence: number) => {
    // First analyze voice stress and handle emergency escalation
    const currentThreatLevel = analyzeVoiceStress(transcript, confidence);
    handleEmergencyEscalation(currentThreatLevel, transcript);

    // Check for legal questions first (priority handling)
    const legalQuestionKeywords = [
      'do i have to give',
      'do i need to show',
      'must i provide',
      'am i required',
      'is id required',
      'id state',
      'ohio id',
      'show id',
      'give id',
      'hand over id',
      'display id'
    ];

    // Handle legal questions with AI service
    for (const keyword of legalQuestionKeywords) {
      if (transcript.includes(keyword)) {
        setLastCommand('legal question');
        handleLegalQuestion(transcript).then(response => {
          speakFeedback(response);
          toast({
            title: "Legal Information",
            description: response.substring(0, 100) + "...",
          });
        }).catch(error => {
          console.error('Legal question error:', error);
          speakFeedback("I don't know the answer to that specific legal question. Please check the legal rights section in the app or contact an attorney for guidance.");
        });
        return;
      }
    }

    // Process standard voice commands
    for (const command of voiceCommands) {
      for (const pattern of command.patterns) {
        if (transcript.includes(pattern.toLowerCase()) && confidence >= command.confidence) {
          setLastCommand(pattern);
          command.action();
          
          // Give audio feedback for emergency commands
          if (command.category === 'emergency') {
            speakFeedback("Emergency command activated");
          }
          
          return;
        }
      }
    }
    
    // No command matched - provide contextual help based on keywords
    if (transcript.includes('help') || transcript.includes('emergency')) {
      toast({
        title: "Emergency Voice Commands",
        description: "Say 'emergency record', 'police encounter', or 'traffic stop' to start documentation"
      });
      speakFeedback("For emergency recording, say: emergency record, police encounter, or traffic stop emergency.");
    } else if (transcript.includes('police') || transcript.includes('officer') || transcript.includes('cop')) {
      toast({
        title: "Police Encounter Commands",
        description: "Say 'police encounter', 'know my rights', or 'remain silent'"
      });
      speakFeedback("For police encounters, say: police encounter, know my rights, or remain silent.");
    } else if (transcript.includes('search') || transcript.includes('warrant')) {
      toast({
        title: "Search Rights Commands",
        description: "Say 'refuse search', 'fourth amendment', or 'show me the warrant'"
      });
      speakFeedback("For search situations, say: refuse search, fourth amendment, or show me the warrant.");
    } else if (transcript.includes('arrest') || transcript.includes('detained')) {
      toast({
        title: "Arrest/Detention Commands",
        description: "Say 'being arrested', 'want a lawyer', or 'miranda rights'"
      });
      speakFeedback("For arrest situations, say: being arrested, want a lawyer, or miranda rights.");
    } else {
      // General help for unrecognized commands
      toast({
        title: "Voice Command Available",
        description: "Try: emergency record, know my rights, or call emergency contacts"
      });
    }
  };

  const handleLegalQuestion = async (question: string): Promise<string> => {
    try {
      // Get user's location for state-specific answers
      let userState = 'federal';
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const locationData = await response.json();
          userState = locationData.address?.state || 'federal';
        } catch (error) {
          console.log('Location not available, using federal laws');
        }
      }

      // Call AI service for legal question
      const aiResponse = await fetch('/api/ai/legal-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: {
            userState,
            userLocation: userState,
            quickResponse: true
          }
        })
      });

      if (aiResponse.ok) {
        const data = await aiResponse.json();
        
        // Focus on ID display rights for ID-related questions
        if (question.toLowerCase().includes('id') || question.toLowerCase().includes('identification')) {
          return `In most states, you can DISPLAY your ID without physically handing it over. Hold your ID up for the officer to see and say "I'm displaying my ID for you to see." This prevents ID retention. ${data.answer}`;
        }
        
        return data.answer;
      } else {
        // Fallback responses for common questions
        if (question.toLowerCase().includes('id') || question.toLowerCase().includes('identification')) {
          return "You can DISPLAY your ID without physically handing it over. Hold your ID up for the officer to see and say 'I'm displaying my ID for you to see.' This prevents the officer from walking away with your identification.";
        }
        
        return "I recommend consulting the legal rights information in the app or contacting an attorney for specific legal guidance.";
      }
    } catch (error) {
      console.error('Legal question error:', error);
      
      // Provide critical ID display information even if AI fails
      if (question.toLowerCase().includes('id') || question.toLowerCase().includes('identification')) {
        return "CRITICAL: You can DISPLAY your ID without physically handing it over. Hold your ID up for the officer to see and say 'I'm displaying my ID for you to see.' This prevents ID retention and protects your rights.";
      }
      
      return "Please check the legal rights section in the app or contact an attorney for specific legal guidance.";
    }
  };

  const speakFeedback = (message: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.2;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Set language based on content for bilingual support
      if (message.includes('español') || message.includes('Enmienda') || message.includes('derecho') || 
          message.includes('tiene') || message.includes('puede') || message.includes('La Cuarta')) {
        utterance.lang = 'es-US';
      } else {
        utterance.lang = 'en-US';
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        toast({
          title: "Voice Commands Active",
          description: "Say 'emergency record' for incident documentation"
        });
      } catch (error) {
        setError('Could not start voice recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    isSupported,
    confidence,
    transcript,
    error,
    startListening,
    stopListening,
    lastCommand,
    threatLevel,
    stressLevel
  };
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
  start: () => void;
  stop: () => void;
}