import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Brain, 
  Target, 
  TrendingUp, 
  Settings, 
  Plus, 
  Play, 
  Pause, 
  Volume2,
  Award,
  BarChart3,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  ArrowLeft
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

// Types for voice learning system
interface VoiceProfile {
  id: number;
  profileName: string;
  language: string;
  confidenceThreshold: string;
  adaptationLevel: string;
  totalTrainingSessions: number;
  lastTrainingDate?: string;
  isActive: boolean;
}

interface CustomVoiceCommand {
  id: number;
  commandName: string;
  triggerPhrases: string[];
  actionType: string;
  actionData?: any;
  priority: number;
  category: string;
  isEnabled: boolean;
  successRate: string;
  totalAttempts: number;
  successfulAttempts: number;
  lastUsed?: string;
}

interface VoiceLearningAnalytics {
  totalCommands: number;
  averageAccuracy: number;
  mostUsedCommands: any[];
  learningProgress: number;
  recommendedTraining: string[];
}

interface VoiceLearningSettings {
  adaptiveLearning: boolean;
  backgroundLearning: boolean;
  personalizedSuggestions: boolean;
  voiceFeedback: boolean;
  learningReminders: boolean;
  privacyMode: string;
  dataRetention: string;
  shareAnonymousData: boolean;
  preferredTrainingTime?: string;
  maxTrainingDuration: number;
}

// Form schemas
const commandSchema = z.object({
  commandName: z.string().min(1, "Command name is required"),
  triggerPhrases: z.string().min(1, "At least one trigger phrase is required"),
  actionType: z.string().min(1, "Action type is required"),
  actionData: z.string().optional(),
  priority: z.number().min(1).max(10),
  category: z.string().min(1, "Category is required")
});

const trainingSchema = z.object({
  sessionType: z.string().min(1, "Session type is required"),
  commandId: z.number().optional()
});

export default function VoiceLearning() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isListening, setIsListening] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [currentTrainingSession, setCurrentTrainingSession] = useState<any>(null);

  // Fetch voice profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/voice-learning/profile'],
    retry: false
  });

  // Fetch custom commands
  const { data: commandsData, isLoading: commandsLoading } = useQuery({
    queryKey: ['/api/voice-learning/commands']
  });

  // Fetch analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/voice-learning/analytics']
  });

  // Fetch settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/voice-learning/settings']
  });

  // Initialize profile mutation
  const initializeProfileMutation = useMutation({
    mutationFn: (data: { language: string }) => 
      apiRequest('/api/voice-learning/profile/initialize', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-learning/profile'] });
      toast({ title: "Voice profile initialized successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to initialize voice profile", variant: "destructive" });
    }
  });

  // Create command mutation
  const createCommandMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/voice-learning/commands', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-learning/commands'] });
      toast({ title: "Voice command created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create voice command", variant: "destructive" });
    }
  });

  // Delete command mutation
  const deleteCommandMutation = useMutation({
    mutationFn: (commandId: number) => 
      apiRequest(`/api/voice-learning/commands/${commandId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-learning/commands'] });
      toast({ title: "Voice command deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete voice command", variant: "destructive" });
    }
  });

  // Start training mutation
  const startTrainingMutation = useMutation({
    mutationFn: (data: { sessionType: string; commandId?: number }) => 
      apiRequest('/api/voice-learning/training/start', { method: 'POST', body: data }),
    onSuccess: (data) => {
      setCurrentTrainingSession(data.session);
      setIsTraining(true);
      toast({ title: "Training session started!" });
    },
    onError: () => {
      toast({ title: "Failed to start training session", variant: "destructive" });
    }
  });

  // Complete training mutation
  const completeTrainingMutation = useMutation({
    mutationFn: (data: { sessionId: number; results: any }) => 
      apiRequest('/api/voice-learning/training/complete', { method: 'POST', body: data }),
    onSuccess: () => {
      setIsTraining(false);
      setCurrentTrainingSession(null);
      queryClient.invalidateQueries({ queryKey: ['/api/voice-learning/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/voice-learning/profile'] });
      toast({ title: "Training session completed!" });
    },
    onError: () => {
      toast({ title: "Failed to complete training session", variant: "destructive" });
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<VoiceLearningSettings>) => 
      apiRequest('/api/voice-learning/settings', { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-learning/settings'] });
      toast({ title: "Settings updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    }
  });

  // Forms
  const commandForm = useForm<z.infer<typeof commandSchema>>({
    resolver: zodResolver(commandSchema),
    defaultValues: {
      commandName: "",
      triggerPhrases: "",
      actionType: "navigation",
      actionData: "",
      priority: 5,
      category: "custom"
    }
  });

  const trainingForm = useForm<z.infer<typeof trainingSchema>>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      sessionType: "general"
    }
  });

  const profile: VoiceProfile | null = profileData?.profile;
  const commands: CustomVoiceCommand[] = commandsData?.commands || [];
  const analytics: VoiceLearningAnalytics | null = analyticsData?.analytics;
  const settings: VoiceLearningSettings | null = settingsData?.settings;

  // Initialize profile if not exists
  useEffect(() => {
    if (profileData && !profile && !profileLoading) {
      initializeProfileMutation.mutate({ language: 'en-US' });
    }
  }, [profileData, profile, profileLoading]);

  const onCreateCommand = (data: z.infer<typeof commandSchema>) => {
    const triggerPhrasesArray = data.triggerPhrases.split(',').map(phrase => phrase.trim());
    createCommandMutation.mutate({
      ...data,
      triggerPhrases: triggerPhrasesArray,
      actionData: data.actionData ? JSON.parse(data.actionData) : null
    });
    commandForm.reset();
  };

  const onStartTraining = (data: z.infer<typeof trainingSchema>) => {
    startTrainingMutation.mutate(data);
  };

  const simulateTrainingCompletion = () => {
    if (currentTrainingSession) {
      const mockResults = {
        accuracyScore: Math.random() * 0.3 + 0.7, // 70-100%
        improvementSuggestions: ["Speak more clearly", "Reduce background noise"],
        sessionDuration: 300 // 5 minutes
      };
      
      completeTrainingMutation.mutate({
        sessionId: currentTrainingSession.id,
        results: mockResults
      });
    }
  };

  if (profileLoading || commandsLoading || analyticsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button size="sm" className="cyber-button-secondary flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Voice Learning Center</h1>
            <p className="text-muted-foreground">
              Personalize your voice commands and improve recognition accuracy
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isListening ? "destructive" : "default"}
            onClick={() => setIsListening(!isListening)}
            className="flex items-center gap-2"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Learning Progress</p>
                <p className="text-2xl font-bold">{analytics?.learningProgress || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={analytics?.learningProgress || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custom Commands</p>
                <p className="text-2xl font-bold">{commands.length}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                <p className="text-2xl font-bold">{Math.round((analytics?.averageAccuracy || 0) * 100)}%</p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Training Sessions</p>
                <p className="text-2xl font-bold">{profile?.totalTrainingSessions || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="commands" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="commands">Voice Commands</TabsTrigger>
          <TabsTrigger value="training">Training Center</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Voice Commands Tab */}
        <TabsContent value="commands" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Custom Voice Commands</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Command
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Custom Voice Command</DialogTitle>
                  <DialogDescription>
                    Define a new voice command with trigger phrases and actions
                  </DialogDescription>
                </DialogHeader>
                <Form {...commandForm}>
                  <form onSubmit={commandForm.handleSubmit(onCreateCommand)} className="space-y-4">
                    <FormField
                      control={commandForm.control}
                      name="commandName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Command Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Quick Record" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={commandForm.control}
                      name="triggerPhrases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trigger Phrases (comma-separated)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., start recording, begin capture, emergency record"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter multiple phrases separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={commandForm.control}
                        name="actionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Action Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select action type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="navigation">Navigation</SelectItem>
                                <SelectItem value="recording">Recording</SelectItem>
                                <SelectItem value="emergency">Emergency</SelectItem>
                                <SelectItem value="custom">Custom Action</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={commandForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority (1-10)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="10" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={commandForm.control}
                      name="actionData"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action Data (JSON, optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder='{"route": "/record", "autoStart": true}'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Additional data for the action in JSON format
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="submit" disabled={createCommandMutation.isPending}>
                        {createCommandMutation.isPending ? "Creating..." : "Create Command"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {commands.map((command) => (
              <Card key={command.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{command.commandName}</h3>
                        <Badge variant={command.isEnabled ? "default" : "secondary"}>
                          {command.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge variant="outline">Priority {command.priority}</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {command.triggerPhrases.map((phrase, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            "{phrase}"
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Action: {command.actionType}</span>
                        <span>Success Rate: {Math.round(parseFloat(command.successRate) * 100)}%</span>
                        <span>Used: {command.totalAttempts} times</span>
                        {command.lastUsed && (
                          <span>Last: {new Date(command.lastUsed).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteCommandMutation.mutate(command.id)}
                        disabled={deleteCommandMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {commands.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Volume2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Custom Commands</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first custom voice command to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Training Center Tab */}
        <TabsContent value="training" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Voice Training
                </CardTitle>
                <CardDescription>
                  Improve voice recognition accuracy through training sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isTraining ? (
                  <Form {...trainingForm}>
                    <form onSubmit={trainingForm.handleSubmit(onStartTraining)} className="space-y-4">
                      <FormField
                        control={trainingForm.control}
                        name="sessionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Training Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select training type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="general">General Voice Training</SelectItem>
                                <SelectItem value="commands">Command-Specific Training</SelectItem>
                                <SelectItem value="accent">Accent Adaptation</SelectItem>
                                <SelectItem value="noise">Noise Resistance</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={startTrainingMutation.isPending}
                        className="w-full"
                      >
                        {startTrainingMutation.isPending ? "Starting..." : "Start Training Session"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Play className="h-4 w-4" />
                      <span className="font-semibold">Training Session Active</span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Session Type: {currentTrainingSession?.sessionType}
                      </p>
                      <Progress value={65} className="w-full" />
                      <p className="text-xs text-muted-foreground">65% Complete</p>
                    </div>
                    
                    <Button 
                      onClick={simulateTrainingCompletion}
                      disabled={completeTrainingMutation.isPending}
                      className="w-full"
                    >
                      Complete Training Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Training Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.recommendedTraining.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-sm">
                      Complete your first training session to get personalized recommendations
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Accuracy</span>
                      <span>{Math.round((analytics?.averageAccuracy || 0) * 100)}%</span>
                    </div>
                    <Progress value={(analytics?.averageAccuracy || 0) * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Learning Progress</span>
                      <span>{analytics?.learningProgress || 0}%</span>
                    </div>
                    <Progress value={analytics?.learningProgress || 0} className="bg-green-100" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{analytics?.totalCommands || 0}</p>
                      <p className="text-sm text-muted-foreground">Custom Commands</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{profile?.totalTrainingSessions || 0}</p>
                      <p className="text-sm text-muted-foreground">Training Sessions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Voice profile created</span>
                  </div>
                  {profile?.lastTrainingDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span>
                        Last training: {new Date(profile.lastTrainingDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {commands.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span>{commands.length} custom commands active</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Voice Learning Settings
              </CardTitle>
              <CardDescription>
                Configure how the voice learning system behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Learning Features</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="adaptive-learning">Adaptive Learning</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically improve recognition based on your usage
                          </p>
                        </div>
                        <Switch
                          id="adaptive-learning"
                          checked={settings.adaptiveLearning}
                          onCheckedChange={(checked) => 
                            updateSettingsMutation.mutate({ adaptiveLearning: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="background-learning">Background Learning</Label>
                          <p className="text-sm text-muted-foreground">
                            Learn from voice commands in the background
                          </p>
                        </div>
                        <Switch
                          id="background-learning"
                          checked={settings.backgroundLearning}
                          onCheckedChange={(checked) => 
                            updateSettingsMutation.mutate({ backgroundLearning: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="personalized-suggestions">Personalized Suggestions</Label>
                          <p className="text-sm text-muted-foreground">
                            Get training recommendations based on your patterns
                          </p>
                        </div>
                        <Switch
                          id="personalized-suggestions"
                          checked={settings.personalizedSuggestions}
                          onCheckedChange={(checked) => 
                            updateSettingsMutation.mutate({ personalizedSuggestions: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Privacy & Data</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="privacy-mode">Privacy Mode</Label>
                        <Select 
                          value={settings.privacyMode} 
                          onValueChange={(value) => 
                            updateSettingsMutation.mutate({ privacyMode: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="enhanced">Enhanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data-retention">Data Retention</Label>
                        <Select 
                          value={settings.dataRetention} 
                          onValueChange={(value) => 
                            updateSettingsMutation.mutate({ dataRetention: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1_month">1 Month</SelectItem>
                            <SelectItem value="6_months">6 Months</SelectItem>
                            <SelectItem value="1_year">1 Year</SelectItem>
                            <SelectItem value="indefinite">Indefinite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="share-anonymous">Share Anonymous Data</Label>
                          <p className="text-sm text-muted-foreground">
                            Help improve the system with anonymous usage data
                          </p>
                        </div>
                        <Switch
                          id="share-anonymous"
                          checked={settings.shareAnonymousData}
                          onCheckedChange={(checked) => 
                            updateSettingsMutation.mutate({ shareAnonymousData: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}