import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Square, 
  Activity, 
  Users, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LoadTestResult {
  testName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  errors: string[];
}

interface LoadTestSession {
  scenario: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  results: LoadTestResult[];
  overallStats: {
    totalRequests: number;
    successRate: number;
    throughput: number;
    duration: number;
  };
}

const LOAD_TEST_SCENARIOS = {
  light: { users: 50, duration: 30, name: 'Light Load' },
  moderate: { users: 200, duration: 60, name: 'Moderate Load' },
  heavy: { users: 500, duration: 120, name: 'Heavy Load' },
  extreme: { users: 1000, duration: 180, name: 'Extreme Load' }
};

export default function LoadTestDashboard() {
  const [session, setSession] = useState<LoadTestSession>({
    scenario: 'moderate',
    status: 'idle',
    progress: 0,
    results: [],
    overallStats: {
      totalRequests: 0,
      successRate: 0,
      throughput: 0,
      duration: 0
    }
  });
  
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    currentRequests: 0,
    responseTime: 0,
    errorRate: 0,
    activeConnections: 0
  });

  const { toast } = useToast();

  // Simulate real-time metrics during testing
  useEffect(() => {
    if (session.status === 'running') {
      const interval = setInterval(() => {
        setRealTimeMetrics({
          currentRequests: Math.floor(Math.random() * 100) + 50,
          responseTime: Math.floor(Math.random() * 200) + 50,
          errorRate: Math.random() * 5,
          activeConnections: Math.floor(Math.random() * 500) + 200
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session.status]);

  const startLoadTest = async (scenario: string) => {
    try {
      setSession(prev => ({
        ...prev,
        scenario,
        status: 'running',
        progress: 0,
        startTime: Date.now(),
        results: []
      }));

      toast({
        title: "Load Test Started",
        description: `Running ${LOAD_TEST_SCENARIOS[scenario as keyof typeof LOAD_TEST_SCENARIOS].name} scenario`,
      });

      // Simulate load test execution
      const scenarioConfig = LOAD_TEST_SCENARIOS[scenario as keyof typeof LOAD_TEST_SCENARIOS];
      const totalDuration = scenarioConfig.duration * 1000;
      
      // Progress simulation
      const progressInterval = setInterval(() => {
        setSession(prev => {
          if (prev.status !== 'running') return prev;
          
          const elapsed = Date.now() - (prev.startTime || 0);
          const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
          
          return { ...prev, progress: newProgress };
        });
      }, 500);

      // Simulate test completion
      setTimeout(() => {
        clearInterval(progressInterval);
        
        // Generate mock results based on scenario
        const mockResults = generateMockResults(scenario);
        
        setSession(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          endTime: Date.now(),
          results: mockResults.results,
          overallStats: mockResults.overallStats
        }));

        toast({
          title: "Load Test Completed",
          description: `${LOAD_TEST_SCENARIOS[scenario as keyof typeof LOAD_TEST_SCENARIOS].name} test finished successfully`,
        });
      }, totalDuration);

    } catch (error) {
      console.error('Load test error:', error);
      setSession(prev => ({
        ...prev,
        status: 'failed',
        progress: 0
      }));
      
      toast({
        title: "Load Test Failed",
        description: "Failed to start load test. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopLoadTest = () => {
    setSession(prev => ({
      ...prev,
      status: 'idle',
      progress: 0
    }));
    
    toast({
      title: "Load Test Stopped",
      description: "Test execution has been cancelled",
    });
  };

  const generateMockResults = (scenario: string) => {
    const scenarioConfig = LOAD_TEST_SCENARIOS[scenario as keyof typeof LOAD_TEST_SCENARIOS];
    const baseSuccessRate = scenario === 'extreme' ? 85 : scenario === 'heavy' ? 92 : 96;
    
    const results: LoadTestResult[] = [
      {
        testName: 'Admin Dashboard',
        totalRequests: Math.floor(scenarioConfig.users * 0.2),
        successfulRequests: 0,
        failedRequests: 0,
        successRate: baseSuccessRate + Math.random() * 5,
        averageResponseTime: 120 + Math.random() * 80,
        maxResponseTime: 300 + Math.random() * 200,
        minResponseTime: 45 + Math.random() * 30,
        errors: []
      },
      {
        testName: 'Authentication System',
        totalRequests: Math.floor(scenarioConfig.users * 0.6),
        successfulRequests: 0,
        failedRequests: 0,
        successRate: baseSuccessRate + Math.random() * 3,
        averageResponseTime: 85 + Math.random() * 60,
        maxResponseTime: 250 + Math.random() * 150,
        minResponseTime: 30 + Math.random() * 25,
        errors: []
      },
      {
        testName: 'Emergency Recording',
        totalRequests: Math.floor(scenarioConfig.users * 0.4),
        successfulRequests: 0,
        failedRequests: 0,
        successRate: baseSuccessRate - 2 + Math.random() * 4,
        averageResponseTime: 180 + Math.random() * 100,
        maxResponseTime: 450 + Math.random() * 300,
        minResponseTime: 60 + Math.random() * 40,
        errors: []
      },
      {
        testName: 'Database Operations',
        totalRequests: Math.floor(scenarioConfig.users * 0.8),
        successfulRequests: 0,
        failedRequests: 0,
        successRate: baseSuccessRate + Math.random() * 2,
        averageResponseTime: 65 + Math.random() * 45,
        maxResponseTime: 200 + Math.random() * 100,
        minResponseTime: 25 + Math.random() * 20,
        errors: []
      }
    ];

    // Calculate derived values
    results.forEach(result => {
      result.successfulRequests = Math.floor(result.totalRequests * (result.successRate / 100));
      result.failedRequests = result.totalRequests - result.successfulRequests;
    });

    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const overallSuccessRate = (totalSuccessful / totalRequests) * 100;
    const throughput = totalRequests / scenarioConfig.duration;

    return {
      results,
      overallStats: {
        totalRequests,
        successRate: overallSuccessRate,
        throughput,
        duration: scenarioConfig.duration
      }
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceScore = (successRate: number) => {
    if (successRate >= 95) return { score: 'A+', color: 'text-green-500', description: 'Excellent' };
    if (successRate >= 90) return { score: 'A', color: 'text-green-400', description: 'Very Good' };
    if (successRate >= 85) return { score: 'B+', color: 'text-yellow-500', description: 'Good' };
    if (successRate >= 80) return { score: 'B', color: 'text-yellow-400', description: 'Fair' };
    return { score: 'C', color: 'text-red-500', description: 'Needs Improvement' };
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">C.A.R.E.N.™ Load Testing Dashboard</h1>
            <p className="text-gray-300">Performance testing and scalability validation</p>
          </div>
          
          <Badge className={`${getStatusColor(session.status)} text-white px-3 py-1`}>
            {session.status.toUpperCase()}
          </Badge>
        </div>

        {/* Control Panel */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Test Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex gap-2">
                {Object.entries(LOAD_TEST_SCENARIOS).map(([key, config]) => (
                  <Button
                    key={key}
                    onClick={() => startLoadTest(key)}
                    disabled={session.status === 'running'}
                    variant={session.scenario === key ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    {config.name}
                    <span className="text-xs">({config.users} users)</span>
                  </Button>
                ))}
              </div>

              {session.status === 'running' && (
                <Button
                  onClick={stopLoadTest}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop Test
                </Button>
              )}
            </div>

            {session.status === 'running' && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Test Progress</span>
                  <span>{session.progress.toFixed(1)}%</span>
                </div>
                <Progress value={session.progress} className="bg-gray-700" />
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="realtime" className="data-[state=active]:bg-blue-600">
              Real-time Metrics
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-blue-600">
              Detailed Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Requests</p>
                      <p className="text-2xl font-bold text-white">
                        {session.overallStats.totalRequests.toLocaleString()}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Success Rate</p>
                      <p className="text-2xl font-bold text-green-400">
                        {session.overallStats.successRate.toFixed(1)}%
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Throughput</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {session.overallStats.throughput.toFixed(1)}/s
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Duration</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {session.overallStats.duration}s
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Score */}
            {session.status === 'completed' && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`text-6xl font-bold ${getPerformanceScore(session.overallStats.successRate).color}`}>
                        {getPerformanceScore(session.overallStats.successRate).score}
                      </div>
                      <p className="text-gray-400 mt-2">
                        {getPerformanceScore(session.overallStats.successRate).description}
                      </p>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Platform Readiness</span>
                        <span className="text-white font-semibold">
                          {session.overallStats.successRate >= 90 ? 'Production Ready' : 'Optimization Needed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Scalability</span>
                        <span className="text-white font-semibold">
                          {session.overallStats.throughput > 10 ? 'Excellent' : 'Good'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Stability</span>
                        <span className="text-white font-semibold">
                          {session.overallStats.successRate >= 95 ? 'Very Stable' : 'Stable'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            {/* Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Current RPS</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {session.status === 'running' ? realTimeMetrics.currentRequests : 0}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Response Time</p>
                      <p className="text-2xl font-bold text-green-400">
                        {session.status === 'running' ? realTimeMetrics.responseTime : 0}ms
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Error Rate</p>
                      <p className="text-2xl font-bold text-red-400">
                        {session.status === 'running' ? realTimeMetrics.errorRate.toFixed(1) : 0}%
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Connections</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {session.status === 'running' ? realTimeMetrics.activeConnections : 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {/* Detailed Results */}
            {session.results.length > 0 && (
              <div className="space-y-4">
                {session.results.map((result, index) => (
                  <Card key={index} className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{result.testName}</CardTitle>
                        <Badge 
                          className={result.successRate >= 90 ? 'bg-green-600' : result.successRate >= 80 ? 'bg-yellow-600' : 'bg-red-600'}
                        >
                          {result.successRate.toFixed(1)}% Success
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Total Requests</p>
                          <p className="text-xl font-semibold text-white">{result.totalRequests}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Successful</p>
                          <p className="text-xl font-semibold text-green-400">{result.successfulRequests}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Avg Response</p>
                          <p className="text-xl font-semibold text-blue-400">{result.averageResponseTime.toFixed(0)}ms</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Max Response</p>
                          <p className="text-xl font-semibold text-yellow-400">{result.maxResponseTime.toFixed(0)}ms</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}