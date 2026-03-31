import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventBus } from '../../../../src/core/EventBus';
import { apiRequest } from '../../../../client/src/lib/queryClient';

interface AuthHook {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

interface User {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useAuth(): AuthHook {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query user information
  const { 
    data: user, 
    isLoading, 
    error: queryError,
    refetch: refreshUser 
  } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: () => apiRequest('GET', '/api/auth/user'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const isAuthenticated = !!user && !queryError;

  // Login mutation (redirects to authentication provider)
  const loginMutation = useMutation({
    mutationFn: async () => {
      console.log('[AUTH_MODULE] Initiating login redirect...');
      
      // For Replit auth, we need to redirect to the login endpoint
      window.location.href = '/api/login';
      
      // This won't actually return since we're redirecting
      throw new Error('Redirecting to login...');
    },
    onError: (error: any) => {
      // Only set error if it's not a redirect
      if (!error.message.includes('Redirecting')) {
        setError(`Login failed: ${error.message}`);
        
        eventBus.emit({
          type: 'auth.login.error',
          module: '@caren/auth',
          payload: {
            error: error.message,
            timestamp: Date.now()
          }
        });
      }
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('[AUTH_MODULE] Initiating logout...');
      
      // Clear user data from cache first
      queryClient.setQueryData(['/api/auth/user'], null);
      
      // Redirect to logout endpoint
      window.location.href = '/api/logout';
      
      throw new Error('Redirecting to logout...');
    },
    onError: (error: any) => {
      // Only set error if it's not a redirect
      if (!error.message.includes('Redirecting')) {
        setError(`Logout failed: ${error.message}`);
        
        eventBus.emit({
          type: 'auth.logout.error',
          module: '@caren/auth',
          payload: {
            error: error.message,
            timestamp: Date.now()
          }
        });
      }
    }
  });

  // Login function
  const login = useCallback(async () => {
    setError(null);
    await loginMutation.mutateAsync();
  }, [loginMutation]);

  // Logout function
  const logout = useCallback(async () => {
    setError(null);
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  // Handle authentication state changes
  useEffect(() => {
    if (user && !queryError) {
      console.log('[AUTH_MODULE] User authenticated:', user.username);
      
      eventBus.emit({
        type: 'auth.state.authenticated',
        module: '@caren/auth',
        payload: {
          userId: user.id,
          username: user.username,
          timestamp: Date.now()
        }
      });
    } else if (queryError) {
      console.log('[AUTH_MODULE] User not authenticated');
      
      eventBus.emit({
        type: 'auth.state.unauthenticated',
        module: '@caren/auth',
        payload: {
          error: queryError.message,
          timestamp: Date.now()
        }
      });
    }
  }, [user, queryError]);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      const errorMessage = queryError.message;
      
      // Don't show error for 401 Unauthorized (user just not logged in)
      if (!errorMessage.includes('401') && !errorMessage.includes('Unauthorized')) {
        setError(`Authentication error: ${errorMessage}`);
      }
    } else {
      setError(null);
    }
  }, [queryError]);

  // Listen for external authentication events
  useEffect(() => {
    const handleAuthEvent = (event: any) => {
      console.log(`[AUTH_MODULE] Received event: ${event.type}`, event.payload);

      switch (event.type) {
        case 'auth.refresh.request':
          refreshUser();
          break;

        case 'auth.login.request':
          login();
          break;

        case 'auth.logout.request':
          logout();
          break;

        case 'auth.session.expired':
          // Clear cache and redirect to login
          queryClient.clear();
          login();
          break;

        default:
          break;
      }
    };

    const eventTypes = [
      'auth.refresh.request',
      'auth.login.request',
      'auth.logout.request',
      'auth.session.expired'
    ];

    eventTypes.forEach(eventType => {
      eventBus.subscribe(eventType, handleAuthEvent);
    });
    
    return () => {
      eventTypes.forEach(eventType => {
        eventBus.unsubscribe(eventType, handleAuthEvent);
      });
    };
  }, [login, logout, refreshUser, queryClient]);

  // Periodic authentication check
  useEffect(() => {
    const checkAuthInterval = setInterval(() => {
      // Only check if we think we're authenticated
      if (isAuthenticated && !isLoading) {
        refreshUser();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(checkAuthInterval);
  }, [isAuthenticated, isLoading, refreshUser]);

  // Handle browser tab focus (refresh auth state)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated) {
        refreshUser();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, refreshUser]);

  return {
    user: user || null,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser: async () => {
      await refreshUser();
    },
    error: error || (queryError && !queryError.message.includes('401') ? queryError.message : null)
  };
}