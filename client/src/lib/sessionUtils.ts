import { clearAllSessionData } from "@/hooks/useAuth";

// Function to clear all session data on both frontend and backend
export async function clearAllSessions() {
  try {
    console.log('[SESSION_UTILS] Starting complete session cleanup');
    
    // Step 1: Clear frontend localStorage and sessionStorage
    const frontendCleared = clearAllSessionData();
    console.log('[SESSION_UTILS] Frontend session data cleared:', frontendCleared);
    
    // Step 2: Call backend to clear server-side sessions
    const response = await fetch('/api/auth/clear-sessions', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('[SESSION_UTILS] Backend session clear result:', result);
    
    // Step 3: Force page refresh to ensure clean state
    if (result.success) {
      console.log('[SESSION_UTILS] All sessions cleared successfully, refreshing page');
      window.location.href = '/';
      return true;
    } else {
      console.error('[SESSION_UTILS] Backend session clear failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('[SESSION_UTILS] Error clearing sessions:', error);
    return false;
  }
}

// Function to check authentication status
export async function checkAuthenticationStatus() {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('[SESSION_UTILS] User authenticated:', user.id);
      return { authenticated: true, user };
    } else {
      console.log('[SESSION_UTILS] User not authenticated');
      return { authenticated: false, user: null };
    }
  } catch (error) {
    console.error('[SESSION_UTILS] Auth check error:', error);
    return { authenticated: false, user: null };
  }
}