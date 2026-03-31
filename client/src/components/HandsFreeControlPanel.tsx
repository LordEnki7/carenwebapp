import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Shield, 
  Phone, 
  MessageSquare, 
  Users, 
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { usePoliceInteractionVoice } from '@/hooks/usePoliceInteractionVoice';
import { useVoiceEmergencyContacts } from '@/hooks/useVoiceEmergencyContacts';
import { useToast } from '@/hooks/use-toast';

interface HandsFreeControlPanelProps {
  isEmergencyMode?: boolean;
  onRecordingStart?: () => void;
  onEmergencyAlert?: () => void;
}

export function HandsFreeControlPanel({ 
  isEmergencyMode = false,
  onRecordingStart,
  onEmergencyAlert 
}: HandsFreeControlPanelProps) {
  const [masterVoiceControl, setMasterVoiceControl] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  
  const policeInteraction = usePoliceInteractionVoice();
  const emergencyContacts = useVoiceEmergencyContacts();
  const { toast } = useToast();

  // Voice command patterns for hands-free control
  const handsFreeCommands = [
    // Master Control
    {
      pattern: 'activate hands free mode',
      action: () => activateAllSystems(),
      category: 'control',
      description: 'Activate all hands-free systems'
    },
    {
      pattern: 'deactivate hands free mode',
      action: () => deactivateAllSystems(),
      category: 'control',
      description: 'Deactivate all hands-free systems'
    },
    
    // Quick Emergency Actions
    {
      pattern: 'emergency mode now',
      action: () => activateEmergencyMode(),
      category: 'emergency',
      description: 'Activate full emergency protocol'
    },
    {
      pattern: 'start emergency recording',
      action: () => {
        onRecordingStart?.();
        speakFeedback('Emergency recording started automatically');
      },
      category: 'emergency',
      description: 'Start emergency recording immediately'
    },
    
    // System Status
    {
      pattern: 'system status',
      action: () => announceSystemStatus(),
      category: 'status',
      description: 'Announce current system status'
    }
  ];

  const speakFeedback = (text: string) => {
    if (audioFeedback && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const activateAllSystems = () => {
    setMasterVoiceControl(true);
    policeInteraction.activateInteractionMode();
    emergencyContacts.activateVoiceContacts();
    setActiveModules(['police', 'contacts', 'recording', 'navigation']);
    
    speakFeedback('All hands-free systems activated. You now have complete voice control.');
    
    toast({
      title: "Hands-Free Mode Activated",
      description: "All voice control systems are now active",
      variant: "default"
    });
  };

  const deactivateAllSystems = () => {
    setMasterVoiceControl(false);
    policeInteraction.deactivateInteractionMode();
    emergencyContacts.deactivateVoiceContacts();
    setActiveModules([]);
    
    speakFeedback('Hands-free mode deactivated.');
    
    toast({
      title: "Hands-Free Mode Deactivated",
      description: "Voice control systems stopped",
    });
  };

  const activateEmergencyMode = () => {
    // Activate all critical systems
    activateAllSystems();
    
    // Trigger emergency alert
    onEmergencyAlert?.();
    
    // Start recording if available
    onRecordingStart?.();
    
    speakFeedback('Emergency mode activated. Recording started. All emergency contacts will be notified. Constitutional rights protection active.');
    
    toast({
      title: "EMERGENCY MODE ACTIVE",
      description: "All emergency protocols activated",
      variant: "destructive"
    });
  };

  const announceSystemStatus = () => {
    const statusItems = [];
    
    if (policeInteraction.isListening) {
      statusItems.push('Police interaction voice commands active');
    }
    
    if (emergencyContacts.isListening) {
      statusItems.push('Emergency contact voice control active');
    }
    
    if (masterVoiceControl) {
      statusItems.push('Master voice control enabled');
    } else {
      statusItems.push('Voice control inactive');
    }
    
    const statusMessage = statusItems.length > 0 
      ? `System status: ${statusItems.join(', ')}`
      : 'All voice control systems are inactive';
    
    speakFeedback(statusMessage);
  };

  const toggleModule = (module: string) => {
    setActiveModules(prev => {
      const newModules = prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module];
      
      // Activate/deactivate specific systems
      switch (module) {
        case 'police':
          if (newModules.includes('police')) {
            policeInteraction.activateInteractionMode();
          } else {
            policeInteraction.deactivateInteractionMode();
          }
          break;
        case 'contacts':
          if (newModules.includes('contacts')) {
            emergencyContacts.activateVoiceContacts();
          } else {
            emergencyContacts.deactivateVoiceContacts();
          }
          break;
      }
      
      return newModules;
    });
  };

  const getModuleStatus = (module: string) => {
    switch (module) {
      case 'police':
        return policeInteraction.isListening;
      case 'contacts':
        return emergencyContacts.isListening;
      default:
        return activeModules.includes(module);
    }
  };

  const voiceControlModules = [
    {
      id: 'police',
      name: 'Constitutional Rights',
      description: 'Voice commands for asserting legal rights',
      icon: Shield,
      critical: true,
      commands: ['assert my rights', 'refuse search', 'request attorney', 'invoke fifth amendment']
    },
    {
      id: 'contacts',
      name: 'Emergency Contacts',
      description: 'Voice control for emergency communications',
      icon: Users,
      critical: true,
      commands: ['notify all contacts', 'call emergency contact', 'send my location']
    },
    {
      id: 'recording',
      name: 'Evidence Recording',
      description: 'Voice-controlled incident documentation',
      icon: Mic,
      critical: true,
      commands: ['start recording', 'stop recording', 'emergency recording']
    },
    {
      id: 'navigation',
      name: 'App Navigation',
      description: 'Hands-free app navigation',
      icon: MessageSquare,
      critical: false,
      commands: ['go to dashboard', 'open attorney page', 'show my rights']
    }
  ];

  return (
    <Card className={`cyber-card ${isEmergencyMode ? 'border-red-500/30 bg-red-500/20' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="cyber-text-primary flex items-center justify-between">
          <div className="flex items-center gap-2">
            {masterVoiceControl ? (
              <Volume2 className="w-5 h-5 text-green-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
            Hands-Free Control Center
          </div>
          <Badge variant={masterVoiceControl ? 'default' : 'outline'} className={`${masterVoiceControl ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'border-gray-500/30 text-gray-400'}`}>
            {masterVoiceControl ? 'Active' : 'Inactive'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Master Controls */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium cyber-text-primary">Master Voice Control</div>
            <div className="text-sm cyber-text-secondary">
              Enable complete hands-free operation
            </div>
          </div>
          <Switch
            checked={masterVoiceControl}
            onCheckedChange={(checked) => {
              if (checked) {
                activateAllSystems();
              } else {
                deactivateAllSystems();
              }
            }}
          />
        </div>

        <Separator />

        {/* Audio Feedback Control */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium cyber-text-primary">Audio Feedback</div>
            <div className="text-sm cyber-text-secondary">
              Spoken confirmations and guidance
            </div>
          </div>
          <Switch
            checked={audioFeedback}
            onCheckedChange={setAudioFeedback}
          />
        </div>

        <Separator />

        {/* Emergency Quick Actions */}
        {isEmergencyMode && (
          <>
            <div className="bg-red-500/20 p-3 rounded border border-red-500/30">
              <div className="font-medium text-red-400 mb-2">Emergency Actions</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={activateEmergencyMode}
                  className="text-xs bg-red-600 hover:bg-red-700"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Full Emergency
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => emergencyContacts.notifyAllContacts()}
                  className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/20"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Alert Contacts
                </Button>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Voice Control Modules */}
        <div className="space-y-3">
          <div className="font-medium cyber-text-primary">Voice Control Modules</div>
          {voiceControlModules.map((module) => {
            const IconComponent = module.icon;
            const isActive = getModuleStatus(module.id);
            
            return (
              <div
                key={module.id}
                className={`p-3 rounded border ${
                  isActive 
                    ? 'border-green-500/30 bg-green-500/20' 
                    : 'border-gray-500/30 bg-gray-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`w-4 h-4 ${
                      isActive ? 'text-green-400' : 'text-gray-400'
                    }`} />
                    <span className="font-medium cyber-text-primary">{module.name}</span>
                    {module.critical && (
                      <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                        Critical
                      </Badge>
                    )}
                  </div>
                  {isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleModule(module.id)}
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                    >
                      Activate
                    </Button>
                  )}
                </div>
                
                <div className="text-sm cyber-text-secondary mb-2">
                  {module.description}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {module.commands.slice(0, 3).map((command, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs"
                    >
                      "{command}"
                    </Badge>
                  ))}
                  {module.commands.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{module.commands.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* System Status */}
        <div className="mt-4 p-3 bg-blue-500/20 rounded border border-blue-500/30">
          <div className="font-medium text-blue-400 mb-1">Voice Command Status</div>
          <div className="text-sm cyber-text-secondary">
            {masterVoiceControl 
              ? 'All systems active - Complete hands-free control enabled'
              : 'Systems inactive - Touch/click required for interaction'
            }
          </div>
          {masterVoiceControl && (
            <div className="text-xs text-blue-400 mt-1">
              Say "system status" to hear current status aloud
            </div>
          )}
        </div>

        {/* Quick Help */}
        <div className="text-xs cyber-text-secondary">
          <div className="font-medium mb-1 cyber-text-primary">Quick Voice Commands:</div>
          <div>"activate hands free mode" - Enable all systems</div>
          <div>"emergency mode now" - Full emergency activation</div>
          <div>"system status" - Hear current status</div>
        </div>
      </CardContent>
    </Card>
  );
}