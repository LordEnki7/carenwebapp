import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map, Navigation, MapPin, Info, BookOpen, Scale, Shield, AlertTriangle, ArrowLeft, RotateCcw, Mic, MicOff, Volume2, VolumeX, Building, Phone, Globe, Clock, Star } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import type { LegalDestination } from '@shared/schema';

interface LegalRight {
  id: number;
  title: string;
  description: string;
  category: 'traffic' | 'recording' | 'search' | 'accountability' | 'state_specific';
  severity: 'low' | 'medium' | 'high' | 'critical';
  content: string;
  examples: string[];
  consequences: string[];
  relatedRights: string[];
}

interface StateData {
  code: string;
  name: string;
  rights: LegalRight[];
  totalRights: number;
  protectionScore: number;
  coordinates: { x: number; y: number };
  isHighlighted: boolean;
}

const CATEGORY_COLORS = {
  traffic: '#3b82f6',      // Blue
  recording: '#10b981',    // Green
  search: '#f59e0b',       // Orange
  accountability: '#ef4444', // Red
  state_specific: '#8b5cf6' // Purple
};

const CATEGORY_ICONS = {
  traffic: Navigation,
  recording: MapPin,
  search: Shield,
  accountability: Scale,
  state_specific: BookOpen
};

const SEVERITY_COLORS = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626'
};

export default function LegalRightsMap() {
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showRightDetails, setShowRightDetails] = useState<LegalRight | null>(null);
  const [animationPhase, setAnimationPhase] = useState<number>(0);
  const [currentUserState, setCurrentUserState] = useState<any>(null);
  
  // Voice Command AI states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [voiceQuestion, setVoiceQuestion] = useState<string>('');
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiConversationHistory, setAiConversationHistory] = useState<Array<{question: string, answer: string, timestamp: Date}>>([]);
  
  // Legal Navigation states
  const [selectedDestination, setSelectedDestination] = useState<LegalDestination | null>(null);
  const [showDestinationDetails, setShowDestinationDetails] = useState(false);
  const [destinationFilter, setDestinationFilter] = useState<'all' | 'police_station' | 'courthouse' | 'attorney_office'>('all');
  
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<any>(null);
  const { toast } = useToast();
  const { getCurrentLocation } = useGeolocation();

  // Fetch legal rights data with explicit fetch function
  const { data: statesData, isLoading, error, refetch } = useQuery({
    queryKey: ['legal-rights-states'],
    queryFn: async () => {
      console.log('Fetching legal rights data...');
      const response = await fetch('/api/legal-rights/states-overview', {
        credentials: 'include'
      });
      console.log('API Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('API Response data:', data);
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    initialData: []
  });

  // Debug logging
  console.log('States data:', statesData);
  console.log('Loading state:', isLoading);
  console.log('Error:', error);
  if (error) {
    console.error('Legal rights API error:', error);
  }
  if (statesData && statesData.length > 0) {
    console.log('Successfully loaded', statesData.length, 'states');
  }

  // Fetch emergency legal destinations based on user location
  const { data: emergencyDestinations, isLoading: emergencyLoading } = useQuery({
    queryKey: ['emergency-legal-destinations'],
    queryFn: async () => {
      const location = await getCurrentLocation();
      if (!location) return [];
      
      const response = await fetch(`/api/legal-destinations/emergency?latitude=${location.latitude}&longitude=${location.longitude}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch emergency destinations');
      return await response.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: []
  });

  // Fetch nearby legal destinations based on filter and user location
  const { data: nearbyDestinations, isLoading: nearbyLoading } = useQuery({
    queryKey: ['nearby-legal-destinations', destinationFilter],
    queryFn: async () => {
      const location = await getCurrentLocation();
      if (!location) return [];
      
      const params = new URLSearchParams({
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        radius: '25'
      });
      
      if (destinationFilter !== 'all') {
        params.append('type', destinationFilter);
      }
      
      const response = await fetch(`/api/legal-destinations/nearby?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch nearby destinations');
      return await response.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: []
  });

  // Voice Command AI Functions
  const initializeVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Recognition Not Available",
        description: "Your browser doesn't support voice recognition. Please use Chrome or Edge for voice commands.",
        variant: "destructive"
      });
      return false;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      toast({
        title: "Voice AI Active",
        description: "Ask me about state-specific legal rights and protections...",
      });
    };
    
    recognitionRef.current.onresult = async (event: any) => {
      const question = event.results[0][0].transcript;
      setVoiceQuestion(question);
      setIsListening(false);
      
      // Process the voice question with AI
      await handleAIQuestion(question);
    };
    
    recognitionRef.current.onerror = (event: any) => {
      setIsListening(false);
      toast({
        title: "Voice Recognition Error",
        description: "Please try speaking again or check your microphone permissions.",
        variant: "destructive"
      });
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
    
    return true;
  };

  const handleAIQuestion = async (question: string) => {
    try {
      setShowAiDialog(true);
      
      // Build context from current state and user location
      const context = {
        userState: selectedState?.name || currentUserState?.name,
        userLocation: currentUserState?.name || 'Unknown',
        availableRights: selectedState?.rights || [],
        currentProtectionScore: selectedState?.protectionScore || 0
      };

      const response = await fetch('/api/ai/legal-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question, context })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const aiResult = await response.json();
      const answer = typeof aiResult.answer === 'string' ? aiResult.answer : aiResult.answer?.[0]?.text || 'No response available';
      
      setAiResponse(answer);
      
      // Add to conversation history
      setAiConversationHistory(prev => [...prev, {
        question,
        answer,
        timestamp: new Date()
      }]);
      
      // Speak the response
      speakResponse(answer);
      
    } catch (error) {
      console.error('AI Question Error:', error);
      const fallbackResponse = generateFallbackResponse(question);
      setAiResponse(fallbackResponse);
      speakResponse(fallbackResponse);
      
      toast({
        title: "AI Service Unavailable",
        description: "Providing fallback legal information. Consider consulting an attorney.",
        variant: "destructive"
      });
    }
  };

  const generateFallbackResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('record') || lowerQuestion.includes('film')) {
      return "Generally, you have the right to record police in public spaces in most states. However, laws vary significantly. In many states like California, you must maintain a reasonable distance. Always check your state's specific recording laws and consult with an attorney for legal advice.";
    }
    
    if (lowerQuestion.includes('traffic stop') || lowerQuestion.includes('pulled over')) {
      return "During a traffic stop, you generally have the right to remain silent, ask if you're free to leave, and display your ID rather than surrender it. Keep your hands visible and comply with lawful orders. Laws vary by state, so consult your state's specific protections and an attorney for legal advice.";
    }
    
    if (lowerQuestion.includes('search') || lowerQuestion.includes('warrant')) {
      return "The Fourth Amendment protects against unreasonable searches. Police generally need a warrant, consent, or exigent circumstances to search. You can clearly state 'I do not consent to any searches.' State laws vary significantly, so consult an attorney for your specific situation.";
    }
    
    if (lowerQuestion.includes('rights') || lowerQuestion.includes('constitutional')) {
      return "Your key constitutional rights during police encounters include: the right to remain silent (5th Amendment), protection from unreasonable searches (4th Amendment), and the right to an attorney (6th Amendment). State laws provide additional protections. This is general information - consult an attorney for legal advice.";
    }
    
    return "I'm unable to provide specific legal information right now. This platform provides state laws and constitutional information, but never gives legal advice. For your specific situation, please consult with a qualified attorney in your jurisdiction who can provide proper legal counsel.";
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const startVoiceCommand = () => {
    if (initializeVoiceRecognition()) {
      recognitionRef.current?.start();
    }
  };

  const stopVoiceCommand = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const detectImportantFYIs = (state: StateData): string[] => {
    const fyis: string[] = [];
    
    if (!state.rights || state.rights.length === 0) return fyis;
    
    // Check for critical recording rights
    const recordingRights = state.rights.filter(r => r.category === 'recording' && r.severity === 'critical');
    if (recordingRights.length > 0) {
      fyis.push(`🎥 IMPORTANT: ${state.name} has specific recording laws you should know about.`);
    }
    
    // Check for protection score
    if (state.protectionScore && state.protectionScore >= 85) {
      fyis.push(`🛡️ FYI: ${state.name} offers strong constitutional protections (${state.protectionScore}% protection score).`);
    } else if (state.protectionScore && state.protectionScore < 70) {
      fyis.push(`⚠️ IMPORTANT: ${state.name} has limited legal protections (${state.protectionScore}% protection score). Extra caution advised.`);
    }
    
    // Check for state-specific rights
    const stateSpecific = state.rights.filter(r => r.category === 'state_specific');
    if (stateSpecific.length > 2) {
      fyis.push(`📋 FYI: ${state.name} has ${stateSpecific.length} unique state-specific legal protections.`);
    }
    
    // Check for critical accountability rights
    const criticalAccountability = state.rights.filter(r => r.category === 'accountability' && r.severity === 'critical');
    if (criticalAccountability.length > 0) {
      fyis.push(`⚖️ IMPORTANT: ${state.name} has enhanced police accountability requirements.`);
    }
    
    return fyis;
  };

  // Auto-speak important FYIs when state changes
  useEffect(() => {
    if (selectedState && selectedState.rights && selectedState.rights.length > 0) {
      const fyis = detectImportantFYIs(selectedState);
      if (fyis.length > 0) {
        const fyiText = `Here are important legal FYIs for ${selectedState.name}: ${fyis.join(' ')}`;
        setTimeout(() => {
          if (!isSpeaking && !isListening) {
            speakResponse(fyiText);
          }
        }, 1000);
      }
    }
  }, [selectedState]);

  // Animation cycle for highlighting different categories
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Mock US states coordinate data (simplified for demo)
  const stateCoordinates: Record<string, { x: number; y: number }> = {
    'CA': { x: 10, y: 60 },
    'TX': { x: 35, y: 75 },
    'FL': { x: 75, y: 85 },
    'NY': { x: 75, y: 25 },
    'IL': { x: 50, y: 40 },
    'PA': { x: 70, y: 35 },
    'OH': { x: 65, y: 40 },
    'GA': { x: 70, y: 70 },
    'NC': { x: 75, y: 60 },
    'MI': { x: 60, y: 30 },
    'NJ': { x: 75, y: 30 },
    'VA': { x: 75, y: 55 },
    'WA': { x: 15, y: 15 },
    'AZ': { x: 25, y: 70 },
    'MA': { x: 80, y: 25 },
    'TN': { x: 60, y: 60 },
    'IN': { x: 60, y: 45 },
    'MO': { x: 45, y: 55 },
    'MD': { x: 75, y: 45 },
    'WI': { x: 50, y: 30 },
    'CO': { x: 35, y: 50 },
    'MN': { x: 45, y: 25 },
    'SC': { x: 75, y: 65 },
    'AL': { x: 65, y: 70 },
    'LA': { x: 50, y: 80 },
    'KY': { x: 65, y: 55 },
    'OR': { x: 15, y: 25 },
    'OK': { x: 40, y: 65 },
    'CT': { x: 78, y: 30 },
    'UT': { x: 30, y: 45 },
    'IA': { x: 45, y: 40 },
    'NV': { x: 20, y: 50 },
    'AR': { x: 50, y: 65 },
    'MS': { x: 55, y: 75 },
    'KS': { x: 40, y: 55 },
    'NM': { x: 30, y: 65 },
    'NE': { x: 40, y: 45 },
    'ID': { x: 25, y: 30 },
    'WV': { x: 70, y: 50 },
    'HI': { x: 25, y: 90 },
    'NH': { x: 80, y: 20 },
    'ME': { x: 85, y: 15 },
    'RI': { x: 81, y: 28 },
    'MT': { x: 30, y: 25 },
    'DE': { x: 76, y: 42 },
    'SD': { x: 40, y: 35 },
    'ND': { x: 40, y: 20 },
    'AK': { x: 5, y: 85 },
    'VT': { x: 79, y: 22 },
    'WY': { x: 32, y: 35 },
    'DC': { x: 76, y: 44 }
  };

  // Create fallback data if API isn't working
  const fallbackStatesData = Object.keys(stateCoordinates).map(code => ({
    code,
    name: getStateName(code),
    totalRights: Math.floor(Math.random() * 20) + 5,
    rights: [{
      id: 1,
      title: `${getStateName(code)} Legal Rights`,
      description: `Constitutional protections and state-specific laws in ${getStateName(code)}`,
      category: 'accountability' as const,
      severity: 'medium' as const,
      content: `Legal protections available in ${getStateName(code)}`,
      examples: ['Constitutional rights', 'Due process'],
      consequences: ['Civil rights violations subject to action'],
      relatedRights: ['Fourth Amendment', 'Fifth Amendment']
    }],
    protectionScore: Math.floor(Math.random() * 100),
    coordinates: stateCoordinates[code],
    isHighlighted: currentUserState?.code === code
  }));

  function getStateName(code: string): string {
    const stateNames: Record<string, string> = {
      'CA': 'California', 'TX': 'Texas', 'FL': 'Florida', 'NY': 'New York',
      'IL': 'Illinois', 'PA': 'Pennsylvania', 'OH': 'Ohio', 'GA': 'Georgia',
      'NC': 'North Carolina', 'MI': 'Michigan', 'NJ': 'New Jersey', 'VA': 'Virginia',
      'WA': 'Washington', 'AZ': 'Arizona', 'MA': 'Massachusetts', 'TN': 'Tennessee',
      'IN': 'Indiana', 'MO': 'Missouri', 'MD': 'Maryland', 'WI': 'Wisconsin',
      'CO': 'Colorado', 'MN': 'Minnesota', 'SC': 'South Carolina', 'AL': 'Alabama',
      'LA': 'Louisiana', 'KY': 'Kentucky', 'OR': 'Oregon', 'OK': 'Oklahoma',
      'CT': 'Connecticut', 'UT': 'Utah', 'IA': 'Iowa', 'NV': 'Nevada',
      'AR': 'Arkansas', 'MS': 'Mississippi', 'KS': 'Kansas', 'NM': 'New Mexico',
      'NE': 'Nebraska', 'ID': 'Idaho', 'WV': 'West Virginia', 'HI': 'Hawaii',
      'NH': 'New Hampshire', 'ME': 'Maine', 'RI': 'Rhode Island', 'MT': 'Montana',
      'DE': 'Delaware', 'SD': 'South Dakota', 'ND': 'North Dakota', 'AK': 'Alaska',
      'VT': 'Vermont', 'WY': 'Wyoming', 'DC': 'Washington DC'
    };
    return stateNames[code] || code;
  }

  const processedStatesData: StateData[] = Array.isArray(statesData) && statesData.length > 0 
    ? statesData.map((state: any) => ({
        ...state,
        coordinates: stateCoordinates[state.code] || { x: 50, y: 50 },
        isHighlighted: currentUserState?.code === state.code
      })) 
    : fallbackStatesData;

  const getCategoryForAnimation = () => {
    const categories = ['traffic', 'recording', 'search', 'accountability', 'state_specific'];
    return categories[animationPhase];
  };

  const getStateProtectionScore = (state: StateData) => {
    if (!state.rights) return 0;
    const totalRights = state.rights.length;
    const criticalRights = state.rights.filter(r => r.severity === 'critical').length;
    const highRights = state.rights.filter(r => r.severity === 'high').length;
    
    return Math.min(100, (criticalRights * 25) + (highRights * 15) + (totalRights * 2));
  };

  const handleStateClick = (state: StateData) => {
    console.log('State clicked:', state);
    setSelectedState(state);
    setSelectedCategory(null);
    
    // Add visual feedback
    const element = document.querySelector(`[data-state="${state.code}"]`);
    if (element) {
      element.classList.add('brightness-125');
      setTimeout(() => element.classList.remove('brightness-125'), 300);
    }
  };

  const filteredRights = selectedState?.rights?.filter(right =>
    !selectedCategory || right.category === selectedCategory
  ) || [];

  if (isLoading) {
    return (
      <div className="cyber-page-background min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="cyber-card rounded-xl p-8 text-center">
            <Map className="mx-auto h-12 w-12 text-cyan-400 animate-pulse mb-4" />
            <h2 className="cyber-subtitle text-xl mb-2">Loading Legal Rights Map...</h2>
            <p className="text-cyan-400">Preparing interactive state-by-state legal protections</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-page-background min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="cyber-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button size="sm" className="cyber-button-secondary flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="cyber-title text-3xl mb-2">Interactive Legal Rights Map</h1>
                <p className="text-cyan-400">Explore your constitutional protections across all 50 states with animated explanations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Voice AI Controls */}
              <div className="flex items-center gap-2">
                {!isListening && !isSpeaking && (
                  <Button
                    onClick={startVoiceCommand}
                    className="cyber-button-primary flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Ask AI
                  </Button>
                )}
                
                {isListening && (
                  <Button
                    onClick={stopVoiceCommand}
                    className="cyber-button-emergency flex items-center gap-2 animate-pulse"
                  >
                    <MicOff className="h-4 w-4" />
                    Listening...
                  </Button>
                )}
                
                {isSpeaking && (
                  <Button
                    onClick={stopSpeaking}
                    className="cyber-button-warning flex items-center gap-2 animate-pulse"
                  >
                    <VolumeX className="h-4 w-4" />
                    Speaking...
                  </Button>
                )}
                
                {aiConversationHistory.length > 0 && (
                  <Button
                    onClick={() => setShowAiDialog(true)}
                    className="cyber-button-secondary flex items-center gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                    AI Chat ({aiConversationHistory.length})
                  </Button>
                )}
              </div>
              
              <Button
                onClick={() => getCurrentLocation()}
                className="cyber-button-primary flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Find My Location
              </Button>
              <Button
                onClick={() => refetch()}
                className="cyber-button-secondary flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh Data
              </Button>
              {currentUserState && (
                <Badge variant="secondary" className="text-sm bg-green-500/20 text-green-300 border-green-400/30">
                  Currently in {(currentUserState as any)?.name || 'Unknown'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="cyber-card rounded-xl">
          <Tabs defaultValue="legal-rights" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border-b border-gray-700">
              <TabsTrigger value="legal-rights" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Legal Rights Map
              </TabsTrigger>
              <TabsTrigger value="legal-navigation" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Legal Navigation
              </TabsTrigger>
            </TabsList>

            {/* Legal Rights Map Tab */}
            <TabsContent value="legal-rights" className="p-6 space-y-6">
              {/* Legend and Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-200">Legal Protection Categories</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(CATEGORY_COLORS).map(([category, color]) => {
                      const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                      return (
                        <div key={category} className="flex items-center gap-2">
                          <div className="p-1 rounded" style={{ backgroundColor: color + '20' }}>
                            <Icon className="h-4 w-4" style={{ color }} />
                          </div>
                          <span className="text-sm text-gray-300 capitalize">{category.replace('_', ' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="cyber-subtitle text-lg mb-4">Protection Strength</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded border border-green-300/30"></div>
                      <span className="text-sm text-green-300">Strong Protection (70+ score)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded border border-yellow-300/30"></div>
                      <span className="text-sm text-yellow-300">Moderate Protection (40-69 score)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded border border-red-300/30"></div>
                      <span className="text-sm text-red-300">Limited Protection (0-39 score)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Map */}
              <div>
          <div className="aspect-[5/3] bg-gradient-to-br from-slate-900/90 to-cyan-900/50 rounded-lg overflow-hidden relative border border-cyan-500/30">
            <svg viewBox="0 0 1000 600" className="w-full h-full">
              {/* US Map Background */}
              <rect width="1000" height="600" fill="url(#mapGradient)" />
              
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#164e63" stopOpacity="0.7" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* State Shapes - Simplified but recognizable US map */}
              {processedStatesData.map((state) => {
                const protectionScore = getStateProtectionScore(state);
                const isCurrentLocation = state.isHighlighted;
                const isHovered = selectedState?.code === state.code;
                
                let stateColor = '#64748b'; // Default slate
                if (protectionScore >= 70) stateColor = '#10b981'; // Green
                else if (protectionScore >= 40) stateColor = '#f59e0b'; // Yellow  
                else if (protectionScore >= 10) stateColor = '#ef4444'; // Red
                else stateColor = '#6b7280'; // Gray

                // Enhanced state coordinates and major cities
                const getStateData = (code: string) => {
                  const stateData: { [key: string]: { 
                    center: { x: number; y: number }, 
                    cities: { name: string; x: number; y: number }[]
                  } } = {
                    'CA': { 
                      center: { x: 100, y: 300 }, 
                      cities: [
                        { name: 'Los Angeles', x: 90, y: 350 },
                        { name: 'San Francisco', x: 80, y: 280 },
                        { name: 'San Diego', x: 95, y: 380 },
                        { name: 'Sacramento', x: 85, y: 260 }
                      ]
                    },
                    'TX': { 
                      center: { x: 400, y: 400 }, 
                      cities: [
                        { name: 'Houston', x: 420, y: 450 },
                        { name: 'Dallas', x: 410, y: 380 },
                        { name: 'Austin', x: 400, y: 420 },
                        { name: 'San Antonio', x: 390, y: 440 }
                      ]
                    },
                    'FL': { 
                      center: { x: 800, y: 450 }, 
                      cities: [
                        { name: 'Miami', x: 850, y: 500 },
                        { name: 'Orlando', x: 820, y: 460 },
                        { name: 'Tampa', x: 800, y: 470 },
                        { name: 'Jacksonville', x: 820, y: 420 }
                      ]
                    },
                    'NY': { 
                      center: { x: 770, y: 180 }, 
                      cities: [
                        { name: 'New York City', x: 800, y: 210 },
                        { name: 'Albany', x: 780, y: 170 },
                        { name: 'Buffalo', x: 740, y: 160 },
                        { name: 'Syracuse', x: 760, y: 170 }
                      ]
                    },
                    'IL': { 
                      center: { x: 570, y: 250 }, 
                      cities: [
                        { name: 'Chicago', x: 580, y: 230 },
                        { name: 'Springfield', x: 560, y: 270 },
                        { name: 'Rockford', x: 570, y: 220 },
                        { name: 'Peoria', x: 560, y: 250 }
                      ]
                    },
                    'PA': { 
                      center: { x: 750, y: 200 }, 
                      cities: [
                        { name: 'Philadelphia', x: 780, y: 210 },
                        { name: 'Pittsburgh', x: 720, y: 210 },
                        { name: 'Harrisburg', x: 760, y: 200 },
                        { name: 'Allentown', x: 770, y: 190 }
                      ]
                    },
                    'OH': { 
                      center: { x: 680, y: 220 }, 
                      cities: [
                        { name: 'Columbus', x: 680, y: 230 },
                        { name: 'Cleveland', x: 680, y: 200 },
                        { name: 'Cincinnati', x: 660, y: 250 },
                        { name: 'Toledo', x: 670, y: 200 }
                      ]
                    },
                    'GA': { 
                      center: { x: 720, y: 350 }, 
                      cities: [
                        { name: 'Atlanta', x: 720, y: 340 },
                        { name: 'Savannah', x: 750, y: 360 },
                        { name: 'Augusta', x: 740, y: 350 },
                        { name: 'Columbus', x: 710, y: 360 }
                      ]
                    },
                    'NC': { 
                      center: { x: 750, y: 320 }, 
                      cities: [
                        { name: 'Charlotte', x: 730, y: 340 },
                        { name: 'Raleigh', x: 760, y: 320 },
                        { name: 'Greensboro', x: 740, y: 320 },
                        { name: 'Asheville', x: 720, y: 330 }
                      ]
                    },
                    'MI': { 
                      center: { x: 620, y: 190 }, 
                      cities: [
                        { name: 'Detroit', x: 630, y: 200 },
                        { name: 'Grand Rapids', x: 610, y: 200 },
                        { name: 'Lansing', x: 620, y: 190 },
                        { name: 'Flint', x: 625, y: 195 }
                      ]
                    },
                    'WA': { 
                      center: { x: 150, y: 80 }, 
                      cities: [
                        { name: 'Seattle', x: 140, y: 70 },
                        { name: 'Spokane', x: 180, y: 70 },
                        { name: 'Tacoma', x: 145, y: 75 },
                        { name: 'Vancouver', x: 145, y: 85 }
                      ]
                    },
                    'OR': { 
                      center: { x: 130, y: 140 }, 
                      cities: [
                        { name: 'Portland', x: 125, y: 120 },
                        { name: 'Eugene', x: 120, y: 140 },
                        { name: 'Salem', x: 122, y: 130 },
                        { name: 'Bend', x: 140, y: 140 }
                      ]
                    }
                  };
                  
                  // Default data for states not detailed above
                  const defaultData = {
                    center: stateCoordinates[code] ? 
                      { x: stateCoordinates[code].x * 10, y: stateCoordinates[code].y * 6 } : 
                      { x: 500, y: 300 },
                    cities: []
                  };
                  
                  return stateData[code] || defaultData;
                };

                const stateData = getStateData(state.code);
                
                return (
                  <g key={state.code} className="state-group">
                    {/* State Shape - Large Rectangle Representing State Boundaries */}
                    <rect
                      x={stateData.center.x - 30}
                      y={stateData.center.y - 20}
                      width="60"
                      height="40"
                      fill={stateColor}
                      stroke={isCurrentLocation ? '#ef4444' : '#1e293b'}
                      strokeWidth={isCurrentLocation ? '3' : '1'}
                      rx="3"
                      data-state={state.code}
                      className={`cursor-pointer transition-all duration-300 ${
                        isHovered ? 'brightness-125' : 'hover:brightness-110'
                      } ${selectedState?.code === state.code ? 'ring-2 ring-cyan-400' : ''}`}
                      onClick={() => handleStateClick(state)}
                      filter={isCurrentLocation ? "url(#glow)" : "none"}
                      opacity={isHovered ? 1 : 0.8}
                    />
                    
                    {/* State Code Label - Centered in State */}
                    <text
                      x={stateData.center.x}
                      y={stateData.center.y - 5}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#ffffff"
                      className="pointer-events-none font-bold drop-shadow-lg"
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                    >
                      {state.code}
                    </text>
                    
                    {/* Protection Score Badge */}
                    <circle
                      cx={stateData.center.x + 20}
                      cy={stateData.center.y - 15}
                      r="6"
                      fill={stateColor}
                      stroke="#ffffff"
                      strokeWidth="1"
                      className="pointer-events-none"
                    />
                    <text
                      x={stateData.center.x + 20}
                      y={stateData.center.y - 12}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#ffffff"
                      className="pointer-events-none font-bold"
                    >
                      {Math.round(protectionScore)}
                    </text>
                    
                    {/* Major Cities - Show as smaller dots */}
                    {stateData.cities.map((city, index) => (
                      <g key={`${state.code}-${city.name}`}>
                        <circle
                          cx={city.x}
                          cy={city.y}
                          r="3"
                          fill="#fbbf24"
                          stroke="#ffffff"
                          strokeWidth="1"
                          className="cursor-pointer hover:r-4 transition-all"
                          onClick={() => handleStateClick(state)}
                        />
                        <text
                          x={city.x}
                          y={city.y - 8}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#ffffff"
                          className="pointer-events-none font-medium"
                          style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.8)' }}
                        >
                          {city.name}
                        </text>
                      </g>
                    ))}
                    
                    {/* Township/County Indicators - Small grid pattern inside state */}
                    {Array.from({ length: 6 }, (_, i) => (
                      <rect
                        key={`township-${i}`}
                        x={stateData.center.x - 25 + (i % 3) * 17}
                        y={stateData.center.y - 10 + Math.floor(i / 3) * 17}
                        width="10"
                        height="10"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="0.5"
                        className="pointer-events-none"
                      />
                    ))}
                    
                    {/* Current Location Pulse Animation */}
                    {isCurrentLocation && (
                      <circle
                        cx={stateData.center.x}
                        cy={stateData.center.y}
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        className="animate-ping"
                        opacity="0.7"
                      />
                    )}
                  </g>
                );
              })}
              
              {/* Removed confusing moving circle animation */}
              
              {/* Map Title */}
              <text
                x="500"
                y="40"
                textAnchor="middle"
                fontSize="24"
                fill="#00d4ff"
                className="font-bold"
                style={{ textShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}
              >
                United States Legal Protection Map
              </text>
              
              {/* Enhanced Legend */}
              <g transform="translate(50, 480)">
                <rect x="0" y="0" width="400" height="120" fill="rgba(0,0,0,0.8)" rx="5" stroke="#00d4ff" strokeWidth="1" />
                
                {/* Protection Levels */}
                <text x="10" y="20" fontSize="12" fill="#00d4ff" className="font-semibold">Protection Levels:</text>
                <circle cx="20" cy="35" r="6" fill="#10b981" />
                <text x="35" y="40" fontSize="10" fill="#ffffff">Strong (70+)</text>
                <circle cx="20" cy="55" r="6" fill="#f59e0b" />
                <text x="35" y="60" fontSize="10" fill="#ffffff">Moderate (40-69)</text>
                <circle cx="150" cy="35" r="6" fill="#ef4444" />
                <text x="165" y="40" fontSize="10" fill="#ffffff">Limited (10-39)</text>
                <circle cx="150" cy="55" r="6" fill="#6b7280" />
                <text x="165" y="60" fontSize="10" fill="#ffffff">Unknown (0-9)</text>
                
                {/* Map Elements */}
                <text x="10" y="80" fontSize="12" fill="#00d4ff" className="font-semibold">Map Elements:</text>
                <rect x="15" y="85" width="25" height="15" fill="#10b981" rx="2" />
                <text x="50" y="95" fontSize="10" fill="#ffffff">States</text>
                <circle cx="130" cy="92" r="3" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
                <text x="145" y="96" fontSize="10" fill="#ffffff">Major Cities</text>
                <rect x="230" y="88" width="8" height="8" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                <text x="250" y="95" fontSize="10" fill="#ffffff">Townships/Counties</text>
              </g>
            </svg>
          </div>
        </div>

        {/* State Details Panel */}
        {selectedState && (
          <div className="cyber-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="cyber-title text-2xl mb-2">
                  {selectedState.name} Legal Protections
                </h2>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30">
                    {selectedState.rights?.length || 0} Total Rights
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Protection Score:</span>
                    <Progress 
                      value={getStateProtectionScore(selectedState)} 
                      className="w-24 h-2" 
                    />
                    <span className="text-sm font-bold">
                      {getStateProtectionScore(selectedState)}/100
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedState(null)}>
                Close Details
              </Button>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {Object.keys(CATEGORY_COLORS).map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(CATEGORY_COLORS).map(([category, color]) => {
                    const categoryRights = selectedState.rights?.filter(r => r.category === category) || [];
                    const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                    
                    return (
                      <Card key={category} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedCategory(category)}>
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <div
                              className="p-2 rounded-full"
                              style={{ backgroundColor: `${color}20`, color: color }}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm capitalize mb-1">
                            {category.replace('_', ' ')}
                          </h3>
                          <p className="text-2xl font-bold" style={{ color: color }}>
                            {categoryRights.length}
                          </p>
                          <p className="text-xs text-gray-500">protections</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {Object.keys(CATEGORY_COLORS).map(category => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="grid gap-4">
                    {selectedState.rights?.filter(r => r.category === category).map((right: LegalRight) => (
                      <Card key={right.id} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setShowRightDetails(right)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {right.title}
                              <Badge 
                                variant="secondary" 
                                style={{ backgroundColor: SEVERITY_COLORS[right.severity] + '20', color: SEVERITY_COLORS[right.severity] }}
                              >
                                {right.severity}
                              </Badge>
                            </CardTitle>
                            <AlertTriangle 
                              className="h-5 w-5 text-orange-500" 
                              style={{ color: SEVERITY_COLORS[right.severity] }}
                            />
                          </div>
                          <CardDescription className="text-sm">
                            {right.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Right Details Dialog */}
        <Dialog open={!!showRightDetails} onOpenChange={() => setShowRightDetails(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                {showRightDetails?.title}
              </DialogTitle>
              <DialogDescription>
                Detailed explanation of this legal protection
              </DialogDescription>
            </DialogHeader>
            
            {showRightDetails && (
              <ScrollArea className="max-h-96 pr-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{showRightDetails.content}</p>
                  </div>
                  
                  {showRightDetails.examples?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Examples</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {showRightDetails.examples.map((example, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {showRightDetails.consequences?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Potential Consequences if Violated</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {showRightDetails.consequences.map((consequence, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            {consequence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {showRightDetails.relatedRights?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Related Rights</h4>
                      <div className="flex flex-wrap gap-2">
                        {showRightDetails.relatedRights.map((relatedRight, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {relatedRight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* AI Conversation Dialog */}
        <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
          <DialogContent className="cyber-card max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="cyber-title flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-cyan-400" />
                Voice AI Legal Assistant
              </DialogTitle>
              <DialogDescription className="text-cyan-400">
                State-specific legal information and important FYIs
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Current Question & Response */}
              {voiceQuestion && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-400/30">
                    <h4 className="font-semibold text-blue-300 mb-2">Your Question:</h4>
                    <p className="text-gray-200">{voiceQuestion}</p>
                  </div>
                  
                  {aiResponse && (
                    <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/30">
                      <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        AI Response:
                        {isSpeaking && (
                          <Badge className="bg-green-600 text-gray-100 animate-pulse">Speaking</Badge>
                        )}
                      </h4>
                      <p className="text-gray-200 leading-relaxed">{aiResponse}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={() => speakResponse(aiResponse)}
                          size="sm"
                          className="cyber-button-secondary"
                          disabled={isSpeaking}
                        >
                          <Volume2 className="h-3 w-3 mr-1" />
                          Replay Audio
                        </Button>
                        {isSpeaking && (
                          <Button
                            onClick={stopSpeaking}
                            size="sm"
                            className="cyber-button-emergency"
                          >
                            <VolumeX className="h-3 w-3 mr-1" />
                            Stop
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conversation History */}
              {aiConversationHistory.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-cyan-300">Conversation History:</h4>
                  <ScrollArea className="h-[300px] space-y-3">
                    {aiConversationHistory.map((conversation, index) => (
                      <div key={index} className="space-y-2 p-3 rounded-lg border border-gray-600/30">
                        <div className="text-sm text-gray-400">
                          {conversation.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-400/20">
                          <div className="text-blue-300 text-xs font-medium mb-1">Question:</div>
                          <div className="text-gray-200 text-sm">{conversation.question}</div>
                        </div>
                        <div className="p-2 rounded bg-green-500/10 border border-green-400/20">
                          <div className="text-green-300 text-xs font-medium mb-1 flex items-center gap-1">
                            <Volume2 className="h-3 w-3" />
                            AI Response:
                          </div>
                          <div className="text-gray-200 text-sm leading-relaxed">{conversation.answer}</div>
                          <Button
                            onClick={() => speakResponse(conversation.answer)}
                            size="sm"
                            className="cyber-button-secondary mt-2"
                            disabled={isSpeaking}
                          >
                            <Volume2 className="h-3 w-3 mr-1" />
                            Replay
                          </Button>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {/* Important FYIs for Selected State */}
              {selectedState && (
                <div className="p-4 rounded-lg bg-yellow-500/20 border border-yellow-400/30">
                  <h4 className="font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Important Legal FYIs for {selectedState.name}:
                  </h4>
                  <div className="space-y-2">
                    {detectImportantFYIs(selectedState).map((fyi, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="text-yellow-400 mt-1">•</div>
                        <p className="text-gray-200 text-sm">{fyi}</p>
                      </div>
                    ))}
                    {selectedState.protectionScore && (
                      <div className="mt-3 p-2 rounded bg-gray-700/50">
                        <div className="text-sm text-gray-300 mb-1">Protection Score:</div>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedState.protectionScore} className="flex-1" />
                          <span className="text-cyan-400 font-semibold">{selectedState.protectionScore}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Voice Commands Help */}
              <div className="p-4 rounded-lg bg-purple-500/20 border border-purple-400/30">
                <h4 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Example Voice Questions:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-300">• "Can I record police in [state]?"</div>
                  <div className="text-gray-300">• "What are my traffic stop rights?"</div>
                  <div className="text-gray-300">• "Do I have to surrender my ID?"</div>
                  <div className="text-gray-300">• "What should I know about [state] laws?"</div>
                  <div className="text-gray-300">• "Can police search my car?"</div>
                  <div className="text-gray-300">• "What's the protection score for [state]?"</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-600/30">
                <div className="flex gap-2">
                  {!isListening && !isSpeaking && (
                    <Button
                      onClick={() => {
                        setShowAiDialog(false);
                        startVoiceCommand();
                      }}
                      className="cyber-button-primary"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Ask Another Question
                    </Button>
                  )}
                  
                  {isSpeaking && (
                    <Button
                      onClick={stopSpeaking}
                      className="cyber-button-emergency"
                    >
                      <VolumeX className="h-4 w-4 mr-2" />
                      Stop Speaking
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setAiConversationHistory([]);
                    setAiResponse('');
                    setVoiceQuestion('');
                    setShowAiDialog(false);
                  }}
                  className="cyber-button-secondary"
                >
                  Clear History
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
            </TabsContent>

            {/* Legal Navigation Tab */}
            <TabsContent value="legal-navigation" className="p-6 space-y-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-2">Legal Navigation System</h3>
                  <p className="text-gray-300">Find nearby police stations, courthouses, and attorney offices based on your location</p>
                </div>

                {/* Destination Filter */}
                <div className="flex justify-center gap-2 mb-6">
                  <Button
                    onClick={() => setDestinationFilter('all')}
                    variant={destinationFilter === 'all' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    All Destinations
                  </Button>
                  <Button
                    onClick={() => setDestinationFilter('police_station')}
                    variant={destinationFilter === 'police_station' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Police Stations
                  </Button>
                  <Button
                    onClick={() => setDestinationFilter('courthouse')}
                    variant={destinationFilter === 'courthouse' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Building className="h-4 w-4" />
                    Courthouses
                  </Button>
                  <Button
                    onClick={() => setDestinationFilter('attorney_office')}
                    variant={destinationFilter === 'attorney_office' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Scale className="h-4 w-4" />
                    Attorneys
                  </Button>
                </div>

                {/* Emergency Destinations */}
                {emergencyDestinations && emergencyDestinations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Emergency Legal Destinations (Within 10 miles)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {emergencyDestinations.slice(0, 6).map((destination: LegalDestination & { distance?: number }) => (
                        <Card key={destination.id} className="cyber-card border-red-500/30 hover:border-red-400/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedDestination(destination);
                                setShowDestinationDetails(true);
                              }}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-white truncate">{destination.name}</h5>
                              <Badge variant="destructive" className="text-xs">EMERGENCY</Badge>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{destination.address}, {destination.city}</p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span className="capitalize">{destination.type?.replace('_', ' ')}</span>
                              {destination.distance && (
                                <span className="text-cyan-400 font-medium">
                                  {destination.distance.toFixed(1)} miles
                                </span>
                              )}
                            </div>
                            {destination.hours && (
                              <div className="mt-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {typeof destination.hours === 'object' ? destination.hours.hours : destination.hours}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Destinations */}
                <div>
                  <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Nearby Legal Destinations (Within 25 miles)
                    {(nearbyLoading || emergencyLoading) && (
                      <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full ml-2" />
                    )}
                  </h4>
                  
                  {nearbyDestinations && nearbyDestinations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {nearbyDestinations.map((destination: LegalDestination & { distance?: number }) => (
                        <Card key={destination.id} className="cyber-card hover:border-cyan-400/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedDestination(destination);
                                setShowDestinationDetails(true);
                              }}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-white truncate">{destination.name}</h5>
                              {destination.emergencyOnly && (
                                <Badge variant="destructive" className="text-xs">EMERGENCY</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{destination.address}</p>
                            <p className="text-sm text-gray-400 mb-3">{destination.city}, {destination.state} {destination.zipCode}</p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                              <span className="capitalize flex items-center gap-1">
                                {destination.type === 'police_station' && <Shield className="h-3 w-3" />}
                                {destination.type === 'courthouse' && <Building className="h-3 w-3" />}
                                {destination.type === 'attorney_office' && <Scale className="h-3 w-3" />}
                                {destination.type?.replace('_', ' ')}
                              </span>
                              {destination.distance && (
                                <span className="text-cyan-400 font-medium">
                                  {destination.distance.toFixed(1)} miles
                                </span>
                              )}
                            </div>

                            {destination.rating && (
                              <div className="flex items-center gap-1 text-xs text-yellow-400 mb-2">
                                <Star className="h-3 w-3 fill-current" />
                                <span>{destination.rating}</span>
                                {destination.reviewCount && (
                                  <span className="text-gray-500">({destination.reviewCount} reviews)</span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs">
                              {destination.phone && (
                                <div className="flex items-center gap-1 text-green-400">
                                  <Phone className="h-3 w-3" />
                                  <span>Call</span>
                                </div>
                              )}
                              {destination.website && (
                                <div className="flex items-center gap-1 text-blue-400">
                                  <Globe className="h-3 w-3" />
                                  <span>Website</span>
                                </div>
                              )}
                              {destination.hours && (
                                <div className="flex items-center gap-1 text-cyan-400">
                                  <Clock className="h-3 w-3" />
                                  <span>Hours</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-400 mb-2">No destinations found</h3>
                      <p className="text-gray-500">Allow location access to find nearby legal destinations</p>
                      <Button 
                        onClick={() => getCurrentLocation()} 
                        className="mt-4 cyber-button-primary"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Enable Location
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Destination Details Dialog */}
        <Dialog open={showDestinationDetails} onOpenChange={setShowDestinationDetails}>
          <DialogContent className="cyber-card border-cyan-500/30 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl text-cyan-400 flex items-center gap-2">
                {selectedDestination?.type === 'police_station' && <Shield className="h-5 w-5" />}
                {selectedDestination?.type === 'courthouse' && <Building className="h-5 w-5" />}
                {selectedDestination?.type === 'attorney_office' && <Scale className="h-5 w-5" />}
                {selectedDestination?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Detailed information for this legal destination
              </DialogDescription>
            </DialogHeader>
            
            {selectedDestination && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-400" />
                        <span className="text-gray-300">
                          {selectedDestination.address}<br />
                          {selectedDestination.city}, {selectedDestination.state} {selectedDestination.zipCode}
                        </span>
                      </div>
                      {selectedDestination.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-400" />
                          <a href={`tel:${selectedDestination.phone}`} className="text-green-400 hover:underline">
                            {selectedDestination.phone}
                          </a>
                        </div>
                      )}
                      {selectedDestination.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-400" />
                          <a href={selectedDestination.website} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-400 hover:underline">
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white capitalize">{selectedDestination.type?.replace('_', ' ')}</span>
                      </div>
                      {selectedDestination.hours && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-cyan-400 mt-0.5" />
                          <div>
                            <span className="text-gray-300">
                              {typeof selectedDestination.hours === 'object' 
                                ? selectedDestination.hours.hours 
                                : selectedDestination.hours}
                            </span>
                            {typeof selectedDestination.hours === 'object' && selectedDestination.hours.description && (
                              <div className="text-gray-500 text-xs">{selectedDestination.hours.description}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedDestination.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-white">{selectedDestination.rating}</span>
                          {selectedDestination.reviewCount && (
                            <span className="text-gray-500">({selectedDestination.reviewCount} reviews)</span>
                          )}
                        </div>
                      )}
                      {selectedDestination.emergencyOnly && (
                        <Badge variant="destructive" className="mt-2">Emergency Services Only</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {selectedDestination.specialties && selectedDestination.specialties.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDestination.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDestination.additionalInfo && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Additional Information</h4>
                    <p className="text-gray-300 text-sm">{selectedDestination.additionalInfo}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  {selectedDestination.phone && (
                    <Button asChild className="cyber-button-primary">
                      <a href={`tel:${selectedDestination.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </a>
                    </Button>
                  )}
                  {selectedDestination.website && (
                    <Button asChild variant="outline">
                      <a href={selectedDestination.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (selectedDestination.latitude && selectedDestination.longitude) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedDestination.latitude},${selectedDestination.longitude}`;
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}