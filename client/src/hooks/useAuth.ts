import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import CrashlyticsService from "@/services/crashlytics";
import { ENV } from "@/config/environment";

// Function to clear all session data
export function clearAllSessionData() {
  try {
    // Clear localStorage
    localStorage.removeItem('demoSessionKey');
    localStorage.removeItem('regularSessionToken');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('customDomainToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('[CLEAR_SESSION] All frontend session data cleared');
    return true;
  } catch (error) {
    console.error('[CLEAR_SESSION] Error clearing session data:', error);
    return false;
  }
}

// Unified logout function that handles all authentication types
export async function performLogout() {
  console.log('🔴 [LOGOUT] Starting unified logout process...');
  console.log('🔴 [LOGOUT] Current localStorage contents:', {
    demoSessionKey: localStorage.getItem('demoSessionKey'),
    sessionToken: localStorage.getItem('sessionToken'),
    regularSessionToken: localStorage.getItem('regularSessionToken'),
    customDomainToken: localStorage.getItem('customDomainToken'),
    user: localStorage.getItem('user'),
    isAuthenticated: localStorage.getItem('isAuthenticated')
  });
  
  try {
    // Check authentication types
    const demoSessionKey = localStorage.getItem('demoSessionKey');
    const sessionToken = localStorage.getItem('sessionToken');
    const regularSessionToken = localStorage.getItem('regularSessionToken');
    
    console.log('🔴 [LOGOUT] Session tokens found:', { 
      demoSessionKey: !!demoSessionKey, 
      sessionToken: !!sessionToken,
      regularSessionToken: !!regularSessionToken
    });
    
    // Clear all session data first
    console.log('🔴 [LOGOUT] Clearing all session data...');
    clearAllSessionData();
    
    // Clear React Query cache
    console.log('🔴 [LOGOUT] Clearing React Query cache...');
    const { queryClient } = await import('@/lib/queryClient');
    queryClient.clear();
    
    // Determine logout approach
    if (demoSessionKey) {
      console.log('🔴 [LOGOUT] Demo logout - redirecting to demo logout endpoint');
      // Demo logout - use GET endpoint that handles redirect
      console.log('🔴 [LOGOUT] Executing window.location.href = "/api/auth/demo-logout"');
      window.location.href = "/api/auth/demo-logout";
      return { success: true, method: 'demo' };
    } else if (sessionToken || regularSessionToken) {
      console.log('🔴 [LOGOUT] Regular logout - calling API endpoint');
      // Regular logout - call POST API
      try {
        console.log('🔴 [LOGOUT] Making fetch request to /api/auth/logout...');
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔴 [LOGOUT] API response:', response.status, response.ok);
        
        if (response.ok) {
          console.log('🔴 [LOGOUT] API logout successful - redirecting in 500ms');
          // Redirect after successful logout
          setTimeout(() => {
            console.log('🔴 [LOGOUT] Executing window.location.href = "/"');
            window.location.href = "/";
          }, 500);
          return { success: true, method: 'api' };
        } else {
          console.log('🔴 [LOGOUT] API logout failed, forcing redirect in 500ms');
          // Force redirect even if API fails
          setTimeout(() => {
            console.log('🔴 [LOGOUT] Force redirect - Executing window.location.href = "/"');
            window.location.href = "/";
          }, 500);
          return { success: false, method: 'api-fallback' };
        }
      } catch (apiError) {
        console.error('🔴 [LOGOUT] API call failed:', apiError);
        // Force redirect on API failure
        setTimeout(() => {
          console.log('🔴 [LOGOUT] API error redirect - Executing window.location.href = "/"');
          window.location.href = "/";
        }, 500);
        return { success: false, method: 'api-error' };
      }
    } else {
      console.log('🔴 [LOGOUT] No session found - direct redirect');
      // No session found, just redirect
      console.log('🔴 [LOGOUT] Direct redirect - Executing window.location.href = "/"');
      window.location.href = "/";
      return { success: true, method: 'direct' };
    }
  } catch (error) {
    console.error('🔴 [LOGOUT] Unified logout error:', error);
    // Emergency fallback - clear everything and redirect
    clearAllSessionData();
    console.log('🔴 [LOGOUT] Emergency fallback - Executing window.location.href = "/"');
    window.location.href = "/";
    return { success: false, method: 'emergency' };
  }
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5000, // Reduced cache time for demo login
    refetchOnWindowFocus: false,
    throwOnError: false, // Prevent unhandled promise rejections
    queryFn: async () => {
      try {
        // Include session tokens in Authorization header (custom domain, demo, or regular)
        const customDomainToken = localStorage.getItem('customDomainToken');
        const demoSessionKey = localStorage.getItem('demoSessionKey');
        const regularSessionToken = localStorage.getItem('regularSessionToken');
        const headers: Record<string, string> = {};
        
        // Priority order: sessionToken (stored by both login types) > Custom domain token > Demo session key > Regular session token
        const sessionToken = localStorage.getItem('sessionToken');
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`;
          console.log('[AUTH] Using sessionToken from login:', sessionToken);
        } else if (customDomainToken) {
          headers.Authorization = `Bearer ${customDomainToken}`;
          console.log('[AUTH] Using custom domain token for cross-domain authentication');
        } else if (demoSessionKey) {
          headers.Authorization = `Bearer ${demoSessionKey}`;
          console.log('[AUTH] Using demo session key:', demoSessionKey);
        } else if (regularSessionToken) {
          headers.Authorization = `Bearer ${regularSessionToken}`;
          console.log('[AUTH] Using regular session token:', regularSessionToken);
        }

        // Abort after 10 seconds so the spinner never hangs indefinitely
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        let response: Response;
        try {
          response = await fetch(`${ENV.API_BASE_URL}/api/auth/user`, {
            credentials: 'include',
            headers,
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }
        
        if (response.status === 401) {
          // Clear invalid session tokens on 401
          console.log('[AUTH] 401 received, clearing invalid session tokens');
          if (sessionToken) {
            localStorage.removeItem('sessionToken');
            console.log('[AUTH] Cleared sessionToken');
          }
          if (customDomainToken) {
            localStorage.removeItem('customDomainToken');
            console.log('[AUTH] Cleared customDomainToken');
          }
          if (demoSessionKey) {
            localStorage.removeItem('demoSessionKey');
            console.log('[AUTH] Cleared demoSessionKey');
          }
          if (regularSessionToken) {
            localStorage.removeItem('regularSessionToken');
            console.log('[AUTH] Cleared regularSessionToken');
          }
          // Also clear user state
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          console.log('[AUTH] All invalid tokens cleared');
          return null;
        }
        
        if (response.status === 404) {
          // Handle 404s during transition gracefully
          console.log('[AUTH] Endpoint not found during transition, retrying...');
          return null;
        }
        
        if (!response.ok) {
          console.log(`[AUTH] API error during transition: ${response.status} ${response.statusText}`);
          return null;
        }
        
        return await response.json();
      } catch (error) {
        console.log('[AUTH] Authentication check failed:', error);
        return null;
      }
    }
  });

  // Stable authentication state to prevent flickering
  const [stableAuth, setStableAuth] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });

  useEffect(() => {
    // Only update after loading is complete and we have a definitive state
    if (!isLoading) {
      const isAuthenticated = !!(user && (user as any).agreedToTerms);
      setStableAuth({
        isAuthenticated,
        isLoading: false,
        user: isAuthenticated ? user : null
      });

      // Set Crashlytics user context when authenticated
      if (isAuthenticated && user) {
        const userId = (user as any).id;
        const email = (user as any).email;
        
        CrashlyticsService.setUserId(userId).then(() => {
          CrashlyticsService.setCustomKey('user_email', email || 'unknown');
          CrashlyticsService.setCustomKey('auth_method', 'replit_auth');
          CrashlyticsService.logBreadcrumb(`User authenticated: ${userId}`);
        }).catch(console.warn);
      } else if (!isLoading) {
        // Clear user context on logout
        CrashlyticsService.setUserId('anonymous').catch(console.warn);
        CrashlyticsService.logBreadcrumb('User logged out');
      }
    }
  }, [user, isLoading]);

  return {
    user: stableAuth.user,
    isLoading: stableAuth.isLoading,
    isAuthenticated: stableAuth.isAuthenticated,
    error
  };
}
