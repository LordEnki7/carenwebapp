import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  MessageSquare, 
  Mic,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Settings,
  Zap
} from "lucide-react";

interface LearningStats {
  totalInteractions: number;
  successfulInteractions: number;
  successRate: number;
  adaptationCount: number;
  learningStatus: 'initializing' | 'active' | 'optimized' | 'error';
  recentInsights: AdaptiveLearningInsight[];
}

interface AdaptiveLearningInsight {
  id: number;
  pattern: string;
  frequency: number;
  successRate: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementationStatus: 'pending' | 'implemented' | 'testing' | 'verified';
  recommendedAdaptation: string;
  createdAt: string;
}

interface UserLearningProfile {
  voicePatterns: {
    preferredCommands: string[];
    speechRate: 'slow' | 'normal' | 'fast';
    commonMispronunciations: { [key: string]: string };
  };
  behaviorPatterns: {
    mostUsedFeatures: string[];
    emergencyTriggerPatterns: string[];
  };
  preferences: {
    responseStyle: 'formal' | 'casual' | 'technical';
    confirmationNeeded: boolean;
    audioFeedback: boolean;
  };
  adaptations: {
    customVoiceCommands: { [trigger: string]: string };
    personalizedResponses: { [context: string]: string };
    learningAdjustments: string[];
  };
}

export default function AdaptiveLearningDashboard() {
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserLearningProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simulateInteraction, setSimulateInteraction] = useState(false);
  const { toast } = useToast();

  // Simulate learning data for demonstration
  useEffect(() => {
    const loadLearningData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats: LearningStats = {
        totalInteractions: 247,
        successfulInteractions: 198,
        successRate: 80.2,
        adaptationCount: 15,
        learningStatus: 'active',
        recentInsights: [
          {
            id: 1,
            pattern: "User says 'start video' instead of 'record video'",
            frequency: 12,
            successRate: 45.5,
            priority: 'high',
            implementationStatus: 'implemented',
            recommendedAdaptation: "Add 'start video' as custom voice command trigger",
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            pattern: "Emergency commands during high stress have lower confidence",
            frequency: 8,
            successRate: 62.3,
            priority: 'critical',
            implementationStatus: 'testing',
            recommendedAdaptation: "Lower confidence threshold for emergency contexts",
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            pattern: "User prefers technical explanations over casual",
            frequency: 23,
            successRate: 91.2,
            priority: 'medium',
            implementationStatus: 'verified',
            recommendedAdaptation: "Use technical response style for legal questions",
            createdAt: new Date().toISOString()
          },
          {
            id: 4,
            pattern: "Often uses 'know my rights' when pulling over",
            frequency: 18,
            successRate: 88.9,
            priority: 'high',
            implementationStatus: 'implemented',
            recommendedAdaptation: "Create quick rights lookup for traffic stops",
            createdAt: new Date().toISOString()
          }
        ]
      };

      const mockProfile: UserLearningProfile = {
        voicePatterns: {
          preferredCommands: ["start recording", "emergency mode", "know my rights", "call attorney"],
          speechRate: 'normal',
          commonMispronunciations: {
            "constitutional": "constitutional",
            "attorney": "attorney"
          }
        },
        behaviorPatterns: {
          mostUsedFeatures: ["Voice Commands", "Legal Rights", "Emergency Recording", "GPS Location"],
          emergencyTriggerPatterns: ["I'm being pulled over", "emergency situation", "need help now"]
        },
        preferences: {
          responseStyle: 'technical',
          confirmationNeeded: false,
          audioFeedback: true
        },
        adaptations: {
          customVoiceCommands: {
            "start video": "record video",
            "begin recording": "start recording",
            "my rights": "know my rights"
          },
          personalizedResponses: {
            "traffic_stop": "You have the right to remain silent and the right to refuse searches...",
            "emergency": "Emergency mode activated. Recording started. GPS location captured."
          },
          learningAdjustments: [
            "Emergency command confidence threshold lowered to 0.6",
            "Technical response style enabled for legal queries",
            "Custom voice commands for recording actions added"
          ]
        }
      };

      setLearningStats(mockStats);
      setUserProfile(mockProfile);
      setIsLoading(false);
    };

    loadLearningData();
  }, []);

  const handleSimulateInteraction = async () => {
    setSimulateInteraction(true);
    
    // Simulate learning from user interaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Learning Complete",
      description: "System analyzed your interaction and found 2 improvement opportunities.",
    });
    
    // Update stats to show learning
    if (learningStats) {
      setLearningStats({
        ...learningStats,
        totalInteractions: learningStats.totalInteractions + 1,
        successfulInteractions: learningStats.successfulInteractions + 1,
        successRate: ((learningStats.successfulInteractions + 1) / (learningStats.totalInteractions + 1)) * 100,
        adaptationCount: learningStats.adaptationCount + 1
      });
    }
    
    setSimulateInteraction(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'implemented': return 'text-blue-600';
      case 'testing': return 'text-yellow-600';
      case 'pending': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'implemented': return <Zap className="h-4 w-4" />;
      case 'testing': return <AlertCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="cyber-card p-8 text-center">
          <Brain className="h-12 w-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Learning Analytics</h2>
          <p className="text-gray-300">Analyzing your interaction patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="cyber-card p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-cyan-500/20 rounded-full">
            <Brain className="h-8 w-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Adaptive Learning System</h1>
            <p className="text-gray-300">How C.A.R.E.N.™ learns from your interactions to provide better responses</p>
          </div>
        </div>

        {learningStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 rounded-lg border border-cyan-500/30">
              <div className="text-2xl font-bold text-white">{learningStats.totalInteractions}</div>
              <div className="text-sm text-gray-300">Total Interactions</div>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-4 rounded-lg border border-blue-500/30">
              <div className="text-2xl font-bold text-white">{learningStats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-300">Success Rate</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-lg border border-purple-500/30">
              <div className="text-2xl font-bold text-white">{learningStats.adaptationCount}</div>
              <div className="text-sm text-gray-300">Adaptations Applied</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-lg border border-orange-500/30">
              <div className="text-2xl font-bold text-white capitalize">{learningStats.learningStatus}</div>
              <div className="text-sm text-gray-300">Learning Status</div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border-cyan-500/30">
          <TabsTrigger value="insights" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <Lightbulb className="h-4 w-4 mr-2" />
            Learning Insights
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <User className="h-4 w-4 mr-2" />
            Your Profile
          </TabsTrigger>
          <TabsTrigger value="adaptations" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <Settings className="h-4 w-4 mr-2" />
            Adaptations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-cyan-400" />
                Recent Learning Insights
              </CardTitle>
              <CardDescription className="text-gray-300">
                Patterns identified from your interactions that help improve the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {learningStats?.recentInsights.map((insight) => (
                <div key={insight.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getPriorityColor(insight.priority)} text-white`}>
                        {insight.priority.toUpperCase()}
                      </Badge>
                      <span className={`text-sm flex items-center ${getStatusColor(insight.implementationStatus)}`}>
                        {getStatusIcon(insight.implementationStatus)}
                        <span className="ml-1 capitalize">{insight.implementationStatus}</span>
                      </span>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>Used {insight.frequency} times</div>
                      <div>{insight.successRate.toFixed(1)}% success</div>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-white mb-2">{insight.pattern}</h4>
                  <p className="text-gray-300 text-sm mb-3">{insight.recommendedAdaptation}</p>
                  
                  <div className="flex items-center justify-between">
                    <Progress value={insight.successRate} className="flex-1 mr-4" />
                    <span className="text-sm text-gray-400">{insight.successRate.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-white">Test Learning System</CardTitle>
              <CardDescription className="text-gray-300">
                Simulate an interaction to see how the system learns from your behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSimulateInteraction}
                disabled={simulateInteraction}
                className="cyber-button w-full"
              >
                {simulateInteraction ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Learning from Interaction...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Simulate Learning Interaction
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {userProfile && (
            <>
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Mic className="h-5 w-5 mr-2 text-cyan-400" />
                    Voice Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Preferred Commands</h4>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.voicePatterns.preferredCommands.map((command, index) => (
                        <Badge key={index} variant="outline" className="border-cyan-500/50 text-cyan-300">
                          "{command}"
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-2">Speech Rate</h4>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                      {userProfile.voicePatterns.speechRate.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="h-5 w-5 mr-2 text-cyan-400" />
                    Behavior Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Most Used Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {userProfile.behaviorPatterns.mostUsedFeatures.map((feature, index) => (
                        <div key={index} className="bg-gray-700/50 p-2 rounded text-gray-300 text-sm">
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-2">Emergency Trigger Patterns</h4>
                    <div className="space-y-2">
                      {userProfile.behaviorPatterns.emergencyTriggerPatterns.map((pattern, index) => (
                        <div key={index} className="bg-red-500/10 border border-red-500/30 p-2 rounded text-red-300 text-sm">
                          "{pattern}"
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="adaptations" className="space-y-6">
          {userProfile && (
            <>
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-cyan-400" />
                    Custom Voice Commands
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Commands learned from your speech patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(userProfile.adaptations.customVoiceCommands).map(([trigger, action]) => (
                      <div key={trigger} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-cyan-300">"{trigger}"</div>
                        <div className="text-gray-400">→</div>
                        <div className="text-white">"{action}"</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="text-white">Learning Adjustments</CardTitle>
                  <CardDescription className="text-gray-300">
                    System adaptations based on your usage patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userProfile.adaptations.learningAdjustments.map((adjustment, index) => (
                      <div key={index} className="flex items-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                        <span className="text-gray-300">{adjustment}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-cyan-400" />
                Learning Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {learningStats && (
                <>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Success Rate</span>
                        <span className="text-white">{learningStats.successRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={learningStats.successRate} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Learning Progress</span>
                        <span className="text-white">{Math.min(85, (learningStats.adaptationCount / 20) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(85, (learningStats.adaptationCount / 20) * 100)} className="h-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">{learningStats.recentInsights.filter(i => i.implementationStatus === 'verified').length}</div>
                      <div className="text-sm text-gray-300">Verified Adaptations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{learningStats.recentInsights.filter(i => i.priority === 'high' || i.priority === 'critical').length}</div>
                      <div className="text-sm text-gray-300">High Priority Insights</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}