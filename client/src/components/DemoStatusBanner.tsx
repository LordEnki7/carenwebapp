import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

interface DemoStatus {
  isDemoMode: boolean;
  sessionTimeRemaining?: number;
  actionsRemaining?: number;
  sessionStartTime?: number;
  demoLimits?: {
    maxActions: number;
    sessionDuration: number;
    features: {
      aiQuestions: string;
      recording: string;
      attorneys: string;
      payments: string;
    };
  };
}

export function DemoStatusBanner() {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { isAuthenticated, isLoading } = useAuth();

  // Debug logging for authentication state
  useEffect(() => {
    console.log('[DEMO_STATUS_BANNER] Auth state:', { isAuthenticated, isLoading });
  }, [isAuthenticated, isLoading]);

  // Don't fetch demo status until authentication is confirmed
  const { data: demoStatus } = useQuery<DemoStatus>({
    queryKey: ['/api/demo/status'],
    enabled: !isLoading && isAuthenticated,
    retry: false,
    refetchInterval: (query) => query.state.status === 'error' ? false : 5000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 10000,
    queryFn: async () => {
      const demoSessionKey = localStorage.getItem('demoSessionKey');
      const regularSessionToken = localStorage.getItem('regularSessionToken');
      const headers: Record<string, string> = {};

      if (demoSessionKey) {
        headers.Authorization = `Bearer ${demoSessionKey}`;
      } else if (regularSessionToken) {
        headers.Authorization = `Bearer ${regularSessionToken}`;
      }

      const response = await fetch('/api/demo/status', {
        credentials: 'include',
        headers: { ...headers, 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`${response.status}`);
      }

      return response.json();
    }
  });

  // Debug logging
  useEffect(() => {
    console.log('[DEMO_STATUS_BANNER] Current demo status data:', demoStatus);
    console.log('[DEMO_STATUS_BANNER] Is demo mode?', demoStatus?.isDemoMode);
    console.log('[DEMO_STATUS_BANNER] Auth state:', { isAuthenticated, isLoading });
    console.log('[DEMO_STATUS_BANNER] Demo session key in localStorage:', localStorage.getItem('demoSessionKey'));
    console.log('[DEMO_STATUS_BANNER] Regular session token in localStorage:', localStorage.getItem('regularSessionToken'));
    
    if (demoStatus) {
      console.log('[DEMO_STATUS_BANNER] Time remaining:', demoStatus.sessionTimeRemaining);
      console.log('[DEMO_STATUS_BANNER] Actions remaining:', demoStatus.actionsRemaining);
    }
  }, [demoStatus, isAuthenticated, isLoading]);

  useEffect(() => {
    if (demoStatus?.isDemoMode && demoStatus.sessionTimeRemaining !== undefined) {
      const updateTimer = () => {
        // Calculate real-time remaining based on current time
        const now = Date.now();
        const sessionStart = demoStatus.sessionStartTime || now;
        const sessionDuration = demoStatus.demoLimits?.sessionDuration || 30 * 60 * 1000;
        const elapsed = now - sessionStart;
        const remaining = Math.max(0, sessionDuration - elapsed);
        
        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [demoStatus]);

  // Early return if not authenticated - only show for authenticated users
  if (isLoading) {
    console.log('[DEMO_STATUS_BANNER] Still loading auth state, not showing banner');
    return null;
  }

  if (!isAuthenticated) {
    console.log('[DEMO_STATUS_BANNER] Not authenticated, not showing banner');
    return null;
  }

  if (!demoStatus?.isDemoMode) {
    return null;
  }

  const isLowTime = demoStatus.sessionTimeRemaining && demoStatus.sessionTimeRemaining < 5 * 60 * 1000; // Less than 5 minutes
  const isLowActions = demoStatus.actionsRemaining && demoStatus.actionsRemaining < 20;

  return (
    <Alert className={`mb-4 border-orange-500/50 bg-orange-500/10 ${isLowTime || isLowActions ? 'animate-pulse' : ''}`}>
      <AlertTriangle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <span className="text-orange-300 font-medium">
            🚀 DEMO MODE
          </span>
          
          {demoStatus.sessionTimeRemaining && (
            <div className="flex items-center gap-1 text-cyan-300">
              <Clock className="h-3 w-3" />
              <span className="text-sm font-mono">{timeLeft}</span>
            </div>
          )}

          {demoStatus.actionsRemaining !== undefined && (
            <div className="flex items-center gap-1 text-cyan-300">
              <Zap className="h-3 w-3" />
              <span className="text-sm">{demoStatus.actionsRemaining} actions left</span>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400">
          Limited features • No payment required
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function DemoLimitReachedBanner({ error }: { error: string }) {
  return (
    <Alert className="mb-4 border-red-500/50 bg-red-500/10">
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertDescription className="text-red-300">
        <div className="font-medium mb-1">Demo Limit Reached</div>
        <div className="text-sm text-red-400">{error}</div>
        <div className="text-xs text-gray-400 mt-2">
          Sign up for a free account to continue using C.A.R.E.N.™
        </div>
      </AlertDescription>
    </Alert>
  );
}