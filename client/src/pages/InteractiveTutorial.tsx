import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Mic, 
  Camera, 
  Shield, 
  MessageSquare, 
  Phone,
  MapPin,
  Play,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Target,
  Zap,
  Users,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'learning' | 'core' | 'emergency' | 'advanced';
  estimatedTime: string;
  practicalExample: string;
  voiceCommands?: string[];
  learningPoints: string[];
  nextAction: string;
}

export default function InteractiveTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const { toast } = useToast();

  const tutorialSteps: TutorialStep[] = [
    {
      id: "adaptive-learning",
      title: "How C.A.R.E.N.™ Learns From You",
      description: "The core purpose of this app is to learn from your interactions and respond better over time.",
      icon: Brain,
      category: 'learning',
      estimatedTime: "3 minutes",
      practicalExample: "Every time you use voice commands, C.A.R.E.N.™ analyzes your speech patterns, preferred phrases, and context to improve recognition accuracy.",
      learningPoints: [
        "C.A.R.E.N.™ tracks your voice patterns and preferred commands",
        "The system adapts to your speaking style and emergency scenarios",
        "AI learns from successful and failed interactions to improve responses",
        "Personal adaptations are stored securely and never shared"
      ],
      nextAction: "Try the Adaptive Learning Dashboard to see your personal learning profile"
    },
    {
      id: "voice-commands",
      title: "Hands-Free Voice Control",
      description: "Master the voice commands that enable hands-free operation during critical situations.",
      icon: Mic,
      category: 'core',
      estimatedTime: "5 minutes",
      practicalExample: "During a traffic stop, say 'Start recording' to begin documentation while keeping your hands visible.",
      voiceCommands: ["Start recording", "Emergency alert", "Know my rights", "Call attorney", "Stop recording"],
      learningPoints: [
        "Voice commands work even when your phone screen is locked",
        "Emergency commands have lower confidence thresholds for reliability",
        "C.A.R.E.N.™ learns your preferred command variations over time",
        "Commands automatically trigger GPS location capture and legal documentation"
      ],
      nextAction: "Practice voice commands in a safe environment before needing them"
    },
    {
      id: "incident-recording",
      title: "Smart Evidence Capture",
      description: "Learn how to document incidents with GPS-enabled audio/video recording that automatically includes legal context.",
      icon: Camera,
      category: 'core',
      estimatedTime: "4 minutes",
      practicalExample: "Start recording during any police encounter. The system automatically captures GPS coordinates, timestamps, and relevant legal rights for your state.",
      voiceCommands: ["Start recording", "Add incident note", "Stop recording", "Emergency recording"],
      learningPoints: [
        "Recording includes GPS coordinates and accurate timestamps",
        "System automatically identifies your state and relevant legal protections",
        "Audio is processed for key phrases and legal context",
        "Evidence is securely stored with encryption and backup"
      ],
      nextAction: "Test the recording system to familiarize yourself with the interface"
    },
    {
      id: "legal-rights",
      title: "GPS-Aware Legal Database",
      description: "Access your constitutional rights and state-specific legal protections based on your current location.",
      icon: Shield,
      category: 'core',
      estimatedTime: "6 minutes",
      practicalExample: "When pulled over in Texas, C.A.R.E.N.™ automatically shows Texas-specific recording laws, search and seizure protections, and traffic stop procedures.",
      learningPoints: [
        "467+ legal protections across all 50 states plus DC",
        "GPS automatically detects your location and shows relevant rights",
        "State-specific laws for recording, searches, and police interactions",
        "Constitutional rights are always available regardless of location"
      ],
      nextAction: "Browse your state's legal rights to understand your protections"
    },
    {
      id: "emergency-system",
      title: "Emergency Response Network",
      description: "Activate emergency protocols that alert your contacts and connect you with legal assistance.",
      icon: Phone,
      category: 'emergency',
      estimatedTime: "4 minutes",
      practicalExample: "Voice command 'Emergency alert' instantly notifies your emergency contacts with your GPS location and begins incident documentation.",
      voiceCommands: ["Emergency alert", "Call 911", "Contact attorney", "Alert family"],
      learningPoints: [
        "Emergency contacts receive SMS and email with your GPS location",
        "System can automatically contact attorneys in your area",
        "Emergency mode prioritizes recording and documentation",
        "All emergency actions are logged for legal evidence"
      ],
      nextAction: "Set up your emergency contacts and test the notification system"
    },
    {
      id: "attorney-network",
      title: "Secure Legal Communication",
      description: "Connect with verified attorneys through encrypted messaging and emergency consultation.",
      icon: MessageSquare,
      category: 'core',
      estimatedTime: "3 minutes",
      practicalExample: "During or after an incident, message attorneys directly through the app with end-to-end encryption and attorney-client privilege protection.",
      learningPoints: [
        "All attorney communications are end-to-end encrypted",
        "Emergency attorney contact available 24/7 in supported areas",
        "Attorney matching based on your location and legal needs",
        "Conversation history is protected by attorney-client privilege"
      ],
      nextAction: "Browse available attorneys in your area and send a test message"
    },
    {
      id: "ai-learning-system",
      title: "Continuous Learning & Adaptation",
      description: "Understand how C.A.R.E.N.™'s AI continuously improves your experience through pattern recognition.",
      icon: Zap,
      category: 'learning',
      estimatedTime: "5 minutes",
      practicalExample: "If you often say 'start video' instead of 'start recording', C.A.R.E.N.™ learns this pattern and adds it as a custom voice trigger.",
      learningPoints: [
        "AI analyzes your interaction patterns to identify improvements",
        "System creates personalized voice command adaptations",
        "Learning extends to preferred response styles and urgency levels",
        "All learning happens locally with privacy protection"
      ],
      nextAction: "Visit the Adaptive Learning Dashboard to see your learning insights"
    },
    {
      id: "family-coordination",
      title: "Family-Wide Protection",
      description: "Coordinate emergency response across multiple family members with shared alerts and location tracking.",
      icon: Users,
      category: 'advanced',
      estimatedTime: "4 minutes",
      practicalExample: "When one family member activates emergency mode, all family accounts receive real-time alerts with GPS location and incident details.",
      learningPoints: [
        "Family Protection plan supports up to 6 family accounts",
        "Shared emergency contacts and attorney network access",
        "Real-time location sharing during emergency situations",
        "Coordinated incident documentation across multiple devices"
      ],
      nextAction: "Upgrade to Family Protection plan and invite family members"
    }
  ];

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const current = tutorialSteps[currentStep];

  const handleStepComplete = async () => {
    setIsSimulating(true);
    
    // Simulate learning from tutorial interaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setCompletedSteps(prev => [...prev, current.id]);
    
    toast({
      title: "Step Completed! 🎉",
      description: `C.A.R.E.N.™ learned from your ${current.title.toLowerCase()} tutorial interaction.`,
    });
    
    setIsSimulating(false);
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learning': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'core': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'emergency': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'advanced': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              C.A.R.E.N.™ Interactive Tutorial
            </h1>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Learn how C.A.R.E.N.™ adapts to your needs and master the essential features for legal protection and emergency response.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Tutorial Progress</span>
            <span className="text-sm text-cyan-400 font-medium">{currentStep + 1} of {tutorialSteps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Step */}
        <Card className="bg-gray-800/50 border-gray-700/50 mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="cyber-card p-3 rounded-lg">
                  <current.icon className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl cyber-text-primary">{current.title}</CardTitle>
                    <Badge className={getCategoryColor(current.category)}>
                      {current.category}
                    </Badge>
                  </div>
                  <p className="text-gray-300">{current.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Estimated Time</div>
                <div className="text-cyan-400 font-medium">{current.estimatedTime}</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Practical Example */}
            <div className="cyber-card p-4 rounded-lg border border-cyan-500/20">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-cyan-300 mb-2">Practical Example</h4>
                  <p className="text-gray-300 text-sm">{current.practicalExample}</p>
                </div>
              </div>
            </div>

            {/* Voice Commands */}
            {current.voiceCommands && (
              <div>
                <h4 className="font-medium mb-3 cyber-text-primary flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Commands to Practice
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {current.voiceCommands.map((command, index) => (
                    <Badge key={index} variant="outline" className="cyber-badge p-2 text-center justify-center">
                      "{command}"
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Points */}
            <div>
              <h4 className="font-medium mb-3 cyber-text-primary flex items-center gap-2">
                <Brain className="h-4 w-4" />
                How C.A.R.E.N.™ Learns From This
              </h4>
              <div className="space-y-2">
                {current.learningPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Action */}
            <div className="cyber-card p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-purple-300 mb-2">Next Action</h4>
                  <p className="text-gray-300 text-sm">{current.nextAction}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="cyber-button-outline"
                >
                  Previous
                </Button>
                
                <Button
                  onClick={handleStepComplete}
                  disabled={completedSteps.includes(current.id) || isSimulating}
                  className="cyber-button"
                >
                  {isSimulating ? (
                    <>
                      <Brain className="h-4 w-4 mr-2 animate-pulse" />
                      Learning...
                    </>
                  ) : completedSteps.includes(current.id) ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              </div>

              <Button
                onClick={handleNext}
                disabled={currentStep === tutorialSteps.length - 1}
                className="cyber-button-primary"
              >
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step Overview */}
        <Card className="bg-gray-800/30 border-gray-700/50">
          <CardHeader>
            <CardTitle className="cyber-text-primary flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tutorial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {tutorialSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    index === currentStep
                      ? 'border-cyan-500/50 bg-cyan-500/10'
                      : completedSteps.includes(step.id)
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-gray-700/50 bg-gray-800/20 hover:border-gray-600/50'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon className={`h-4 w-4 ${
                      index === currentStep ? 'text-cyan-400' : 
                      completedSteps.includes(step.id) ? 'text-green-400' : 'text-gray-400'
                    }`} />
                    <span className="text-xs font-medium text-gray-300">{step.title}</span>
                  </div>
                  <div className="text-xs text-gray-500">{step.estimatedTime}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}