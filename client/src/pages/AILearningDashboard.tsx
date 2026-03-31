import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, TrendingUp, Database, AlertCircle, CheckCircle, Clock, Users, BarChart3, Lightbulb, Target, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface LearningStatistics {
  totalIncidents: number;
  analyzedIncidents: number;
  analysisProgress: string;
  totalPatterns: number;
  pendingUpdates: number;
  topPatterns: Array<{
    pattern: string;
    frequency: number;
    states: string[];
    confidence: number;
  }>;
}

interface AILearningPattern {
  id: number;
  pattern: string;
  frequency: number;
  affectedStates: string[];
  legalCategories: string[];
  severity: string;
  confidenceScore: number;
  firstSeen: string;
  lastSeen: string;
}

interface KnowledgeUpdate {
  id: number;
  targetDatabase: string;
  updateType: string;
  stateCode: string;
  category: string;
  title: string;
  content: string;
  justification: string;
  sourceIncidents: number[];
  confidenceLevel: number;
  status: string;
  createdAt: string;
}

export default function AILearningDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch learning statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['ai-learning-statistics'],
    queryFn: async () => {
      const response = await fetch('/api/ai-learning/statistics', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      return data.statistics as LearningStatistics;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch learning patterns
  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['ai-learning-patterns'],
    queryFn: async () => {
      const response = await fetch('/api/ai-learning/patterns?limit=100&minFrequency=2', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch patterns');
      const data = await response.json();
      return data.patterns as AILearningPattern[];
    }
  });

  // Fetch pending knowledge updates
  const { data: pendingUpdates, isLoading: updatesLoading } = useQuery({
    queryKey: ['ai-learning-pending-updates'],
    queryFn: async () => {
      const response = await fetch('/api/ai-learning/pending-updates', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch pending updates');
      const data = await response.json();
      return data.pendingUpdates as KnowledgeUpdate[];
    }
  });

  // Batch analyze incidents mutation
  const batchAnalyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-learning/batch-analyze', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to start batch analysis');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Started",
        description: `Analyzing ${data.analyzedCount} incidents in background`
      });
      queryClient.invalidateQueries({ queryKey: ['ai-learning-statistics'] });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Could not start batch analysis",
        variant: "destructive"
      });
    }
  });

  // Generate knowledge updates mutation
  const generateUpdatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-learning/generate-updates', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to generate updates');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Updates Generated",
        description: `Generated ${data.updatesGenerated} knowledge updates for review`
      });
      queryClient.invalidateQueries({ queryKey: ['ai-learning-pending-updates'] });
      queryClient.invalidateQueries({ queryKey: ['ai-learning-statistics'] });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Could not generate knowledge updates",
        variant: "destructive"
      });
    }
  });

  // Apply knowledge update mutation
  const applyUpdateMutation = useMutation({
    mutationFn: async (updateId: number) => {
      const response = await fetch(`/api/ai-learning/apply-update/${updateId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to apply update');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Update Applied",
        description: "Knowledge update has been applied to the database"
      });
      queryClient.invalidateQueries({ queryKey: ['ai-learning-pending-updates'] });
      queryClient.invalidateQueries({ queryKey: ['ai-learning-statistics'] });
    },
    onError: () => {
      toast({
        title: "Apply Failed",
        description: "Could not apply knowledge update",
        variant: "destructive"
      });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'add_right': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'modify_content': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'add_statute': return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'update_severity': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      case 'add_example': return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="cyber-card border-b border-cyan-400/20 mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="cyber-button-secondary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="cyber-title text-3xl mb-2 flex items-center gap-3">
                  <Brain className="h-8 w-8 text-cyan-400" />
                  AI Learning Dashboard
                </h1>
                <p className="text-cyan-400">
                  Monitor and manage AI learning from user incidents to enhance our legal database
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => batchAnalyzeMutation.mutate()}
                disabled={batchAnalyzeMutation.isPending}
                className="cyber-button-primary"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {batchAnalyzeMutation.isPending ? 'Analyzing...' : 'Batch Analyze'}
              </Button>
              
              <Button
                onClick={() => generateUpdatesMutation.mutate()}
                disabled={generateUpdatesMutation.isPending}
                className="cyber-button-warning"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {generateUpdatesMutation.isPending ? 'Generating...' : 'Generate Updates'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="cyber-tabs-list">
            <TabsTrigger value="overview" className="cyber-tabs-trigger">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="patterns" className="cyber-tabs-trigger">
              <Target className="h-4 w-4 mr-2" />
              Learning Patterns
            </TabsTrigger>
            <TabsTrigger value="updates" className="cyber-tabs-trigger">
              <Database className="h-4 w-4 mr-2" />
              Knowledge Updates
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="cyber-card animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-8 bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : statistics ? (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="cyber-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Total Incidents</p>
                          <p className="text-3xl font-bold text-cyan-400">{statistics.totalIncidents}</p>
                        </div>
                        <Users className="h-8 w-8 text-cyan-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cyber-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Analyzed</p>
                          <p className="text-3xl font-bold text-green-400">{statistics.analyzedIncidents}</p>
                          <p className="text-xs text-green-400">{statistics.analysisProgress}% complete</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cyber-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Patterns Found</p>
                          <p className="text-3xl font-bold text-purple-400">{statistics.totalPatterns}</p>
                        </div>
                        <Target className="h-8 w-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cyber-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Pending Updates</p>
                          <p className="text-3xl font-bold text-yellow-400">{statistics.pendingUpdates}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Analysis Progress */}
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="cyber-title">Analysis Progress</CardTitle>
                    <CardDescription>Overall learning system progress and effectiveness</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Incidents Analyzed</span>
                        <span className="text-sm text-cyan-400">{statistics.analysisProgress}%</span>
                      </div>
                      <Progress value={parseFloat(statistics.analysisProgress)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Top Patterns Preview */}
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="cyber-title">Top Learning Patterns</CardTitle>
                    <CardDescription>Most frequently identified patterns across user incidents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {statistics.topPatterns?.map((pattern, index) => (
                          <div key={index} className="p-3 rounded-lg border border-gray-600/30">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-white text-sm">{pattern.pattern}</p>
                              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                                {pattern.frequency}x
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">
                                States: {pattern.states?.join(', ') || 'Unknown'}
                              </span>
                              <span className="text-cyan-400">
                                Confidence: {(pattern.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="cyber-card">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-gray-400">No learning statistics available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Learning Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="cyber-title">Identified Learning Patterns</CardTitle>
                <CardDescription>
                  Patterns identified across user incidents that can improve our legal database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patternsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-4 rounded-lg border border-gray-600/30 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : patterns && patterns.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {patterns.map((pattern) => (
                        <div key={pattern.id} className="p-4 rounded-lg border border-gray-600/30">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-white">{pattern.pattern}</h4>
                            <div className="flex gap-2">
                              <Badge className={getSeverityColor(pattern.severity)}>
                                {pattern.severity}
                              </Badge>
                              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                                {pattern.frequency} occurrences
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400 mb-1">Affected States:</p>
                              <p className="text-white">{pattern.affectedStates?.join(', ') || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-1">Legal Categories:</p>
                              <p className="text-white">{pattern.legalCategories?.join(', ') || 'Unknown'}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex justify-between items-center">
                            <div className="text-xs text-gray-400">
                              First seen: {new Date(pattern.firstSeen).toLocaleDateString()} • 
                              Last seen: {new Date(pattern.lastSeen).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-cyan-400">
                              Confidence: {(pattern.confidenceScore * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No learning patterns found yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Patterns will appear as incidents are analyzed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Updates Tab */}
          <TabsContent value="updates" className="space-y-6">
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="cyber-title">Pending Knowledge Updates</CardTitle>
                <CardDescription>
                  AI-generated database improvements waiting for review and approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {updatesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 rounded-lg border border-gray-600/30 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                        <div className="h-16 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : pendingUpdates && pendingUpdates.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {pendingUpdates.map((update) => (
                        <div key={update.id} className="p-4 rounded-lg border border-gray-600/30">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-white">{update.title}</h4>
                            <div className="flex gap-2">
                              <Badge className={getUpdateTypeColor(update.updateType)}>
                                {update.updateType.replace('_', ' ')}
                              </Badge>
                              <Badge variant="secondary">
                                {update.stateCode}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-400 mb-1">Target:</p>
                            <p className="text-white text-sm">{update.targetDatabase} • {update.category}</p>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-400 mb-1">Justification:</p>
                            <p className="text-white text-sm">{update.justification}</p>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-1">Proposed Content:</p>
                            <div className="bg-gray-800/50 p-3 rounded text-sm text-white">
                              {update.content}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-400">
                              Based on {update.sourceIncidents?.length || 0} incidents • 
                              Confidence: {(update.confidenceLevel * 100).toFixed(1)}% • 
                              Created: {new Date(update.createdAt).toLocaleDateString()}
                            </div>
                            
                            <Button
                              onClick={() => applyUpdateMutation.mutate(update.id)}
                              disabled={applyUpdateMutation.isPending}
                              size="sm"
                              className="cyber-button-primary"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Apply Update
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No pending knowledge updates</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Updates will appear as patterns are analyzed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}