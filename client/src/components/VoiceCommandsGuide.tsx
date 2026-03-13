import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { 
  Mic, 
  MicIcon, 
  Shield, 
  Navigation, 
  Video, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Home,
  Settings,
  Play,
  Square,
  Phone
} from 'lucide-react';

interface VoiceCommand {
  command: string;
  description: string;
  example: string;
  category: 'emergency' | 'navigation' | 'recording' | 'information';
  priority: 'critical' | 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

const voiceCommands: VoiceCommand[] = [
  // Emergency Commands (Critical Priority)
  {
    command: "CAREN Emergency",
    description: "Activate emergency mode with immediate recording and family notification",
    example: "Say: 'CAREN Emergency' or just 'Emergency'",
    category: "emergency",
    priority: "critical",
    icon: <AlertTriangle className="h-4 w-4 text-red-500" />
  },
  {
    command: "CAREN Help",
    description: "Request emergency assistance and start incident documentation",
    example: "Say: 'CAREN Help' or 'Help me'",
    category: "emergency",
    priority: "critical",
    icon: <Phone className="h-4 w-4 text-red-500" />
  },

  // Recording Commands (High Priority)
  {
    command: "Record Start",
    description: "Begin recording incident documentation immediately",
    example: "Say: 'Record Start' or 'Start recording'",
    category: "recording",
    priority: "high",
    icon: <Play className="h-4 w-4 text-blue-500" />
  },
  {
    command: "Record Stop",
    description: "Stop current recording and save incident documentation",
    example: "Say: 'Record Stop' or 'Stop recording'",
    category: "recording",
    priority: "high",
    icon: <Square className="h-4 w-4 text-blue-500" />
  },

  // Navigation Commands (Medium Priority)
  {
    command: "Navigate Home",
    description: "Return to main dashboard",
    example: "Say: 'Navigate Home' or 'Go home'",
    category: "navigation",
    priority: "medium",
    icon: <Home className="h-4 w-4 text-green-500" />
  },
  {
    command: "Navigate Rights",
    description: "Display legal rights for current location",
    example: "Say: 'Navigate Rights' or 'Show my rights'",
    category: "navigation",
    priority: "medium",
    icon: <Shield className="h-4 w-4 text-green-500" />
  },
  {
    command: "Navigate Settings",
    description: "Open application settings and preferences",
    example: "Say: 'Navigate Settings' or 'Open settings'",
    category: "navigation",
    priority: "medium",
    icon: <Settings className="h-4 w-4 text-green-500" />
  },

  // Information Commands (Low Priority)
  {
    command: "Show Help",
    description: "Display this voice commands reference guide",
    example: "Say: 'Show Help' or 'Voice commands'",
    category: "information",
    priority: "low",
    icon: <HelpCircle className="h-4 w-4 text-gray-500" />
  }
];

const categoryConfig = {
  emergency: {
    title: "Emergency Commands",
    description: "Critical commands for urgent situations",
    color: "destructive",
    icon: <AlertTriangle className="h-5 w-5" />
  },
  recording: {
    title: "Recording Commands", 
    description: "Start and stop incident documentation",
    color: "default",
    icon: <Video className="h-5 w-5" />
  },
  navigation: {
    title: "Navigation Commands",
    description: "Move between app sections",
    color: "secondary",
    icon: <Navigation className="h-5 w-5" />
  },
  information: {
    title: "Information Commands",
    description: "Get help and guidance",
    color: "outline",
    icon: <HelpCircle className="h-5 w-5" />
  }
} as const;

const priorityColors = {
  critical: "destructive",
  high: "default", 
  medium: "secondary",
  low: "outline"
} as const;

interface VoiceCommandsGuideProps {
  isCompact?: boolean;
  showOnlyEmergency?: boolean;
}

export function VoiceCommandsGuide({ isCompact = false, showOnlyEmergency = false }: VoiceCommandsGuideProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    emergency: true, // Emergency always expanded by default
    recording: !isCompact,
    navigation: !isCompact,
    information: !isCompact
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredCommands = showOnlyEmergency 
    ? voiceCommands.filter(cmd => cmd.category === 'emergency')
    : voiceCommands;

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);

  const categoriesOrder: (keyof typeof categoryConfig)[] = ['emergency', 'recording', 'navigation', 'information'];

  if (isCompact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="h-5 w-5" />
            Quick Voice Commands
          </CardTitle>
          <CardDescription>
            Say these commands for hands-free control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredCommands.slice(0, 4).map((command, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              {command.icon}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{command.command}</p>
                <p className="text-xs text-muted-foreground truncate">{command.example}</p>
              </div>
              <Badge variant={priorityColors[command.priority]} className="text-xs">
                {command.priority}
              </Badge>
            </div>
          ))}
          {!showOnlyEmergency && filteredCommands.length > 4 && (
            <Button variant="outline" size="sm" className="w-full mt-2">
              <HelpCircle className="h-4 w-4 mr-2" />
              View All Commands
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MicIcon className="h-6 w-6" />
          Voice Commands Reference
        </CardTitle>
        <CardDescription>
          CAREN listens continuously for these voice commands. Speak clearly and wait for confirmation.
        </CardDescription>
        
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <Mic className="h-5 w-5 text-blue-600" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">Voice Recognition Active</p>
            <p className="text-blue-700 dark:text-blue-200">Say any command below - no wake word needed</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {categoriesOrder.map((categoryKey) => {
          const commands = groupedCommands[categoryKey];
          if (!commands || commands.length === 0) return null;
          
          const config = categoryConfig[categoryKey];
          const isExpanded = expandedCategories[categoryKey];
          
          return (
            <div key={categoryKey} className="space-y-2">
              <Collapsible 
                open={isExpanded} 
                onOpenChange={() => toggleCategory(categoryKey)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                    <div className="flex items-center gap-3">
                      {config.icon}
                      <div className="text-left">
                        <h3 className="font-semibold">{config.title}</h3>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2">
                  {commands.map((command, index) => (
                    <Card key={index} className="border-l-4 border-l-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            {command.icon}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base mb-1">
                                "{command.command}"
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {command.description}
                              </p>
                              <div className="bg-muted/50 rounded-md p-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                  Example
                                </p>
                                <p className="text-sm font-mono">
                                  {command.example}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Badge variant={priorityColors[command.priority]}>
                            {command.priority}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
              
              {categoryKey !== 'information' && <Separator />}
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                Emergency Keywords
              </h4>
              <p className="text-yellow-800 dark:text-yellow-200 mb-2">
                These words will automatically trigger emergency mode even without the "CAREN" prefix:
              </p>
              <div className="flex flex-wrap gap-1">
                {['emergency', 'help me', 'police', 'pulled over', 'traffic stop'].map((keyword) => (
                  <Badge key={keyword} variant="outline" className="text-xs border-yellow-300 text-yellow-800 dark:text-yellow-200">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Voice Recognition Tips
              </h4>
              <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Speak clearly and at normal volume</li>
                <li>• Wait for the beep confirmation after each command</li>
                <li>• Commands work in any order - "Emergency CAREN" is the same as "CAREN Emergency"</li>
                <li>• If a command doesn't work, try saying it slightly differently</li>
                <li>• Voice recognition works even when the app is in the background</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick floating voice commands indicator
export function VoiceCommandsFloatingIndicator() {
  const [showQuickCommands, setShowQuickCommands] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQuickCommands(!showQuickCommands)}
          className="bg-background/80 backdrop-blur-sm border-2 shadow-lg"
        >
          <Mic className="h-4 w-4 mr-2" />
          Voice Commands
        </Button>
        
        {showQuickCommands && (
          <div className="absolute bottom-full right-0 mb-2 w-80">
            <VoiceCommandsGuide isCompact={true} />
          </div>
        )}
      </div>
    </div>
  );
}