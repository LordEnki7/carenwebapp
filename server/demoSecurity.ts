// Demo Security Manager - Limits and protections for demo mode
export class DemoSecurityManager {
  private static demoSessions = new Map<string, {
    startTime: number;
    actionCount: number;
    lastActivity: number;
  }>();

  // Demo session limits
  private static readonly DEMO_TIME_LIMIT = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_ACTIONS_PER_SESSION = 100;
  private static readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private static readonly MAX_ACTIONS_PER_MINUTE = 20;

  static initDemoSession(sessionId: string): boolean {
    const sessionData = {
      startTime: Date.now(),
      actionCount: 0,
      lastActivity: Date.now()
    };
    
    this.demoSessions.set(sessionId, sessionData);
    
    console.log('[DEMO_SECURITY] Initialized demo session:', sessionId);
    console.log('[DEMO_SECURITY] Session data:', sessionData);
    console.log('[DEMO_SECURITY] Total sessions in map:', this.demoSessions.size);
    
    return true;
  }

  static isValidDemoSession(sessionId: string): boolean {
    const session = this.demoSessions.get(sessionId);
    if (!session) return false;

    const now = Date.now();
    
    // Check time limit
    if (now - session.startTime > this.DEMO_TIME_LIMIT) {
      this.demoSessions.delete(sessionId);
      return false;
    }

    // Check action limit
    if (session.actionCount > this.MAX_ACTIONS_PER_SESSION) {
      return false;
    }

    return true;
  }

  static recordDemoAction(sessionId: string, userId?: string): boolean {
    // Try session ID first
    let session = this.demoSessions.get(sessionId);
    
    // If session not found but we have userId, try that as fallback
    if (!session && userId) {
      session = this.demoSessions.get(userId);
      console.log(`[DEMO_ACTION] Using user ID fallback: ${userId}`);
    }
    
    if (!session) {
      console.log(`[DEMO_ACTION] No session found for ${sessionId} or ${userId}`);
      return false;
    }

    const now = Date.now();
    
    // Rate limiting check
    if (now - session.lastActivity < this.RATE_LIMIT_WINDOW) {
      // Count recent actions
      const recentActions = session.actionCount; // Simplified for demo
      if (recentActions > this.MAX_ACTIONS_PER_MINUTE) {
        console.log(`[DEMO_ACTION] Rate limit exceeded`);
        return false;
      }
    }

    session.actionCount++;
    session.lastActivity = now;
    console.log(`[DEMO_ACTION] Action recorded. New count: ${session.actionCount}`);
    return true;
  }

  static getDemoStats(): any {
    return {
      activeSessions: this.demoSessions.size,
      totalActions: Array.from(this.demoSessions.values()).reduce((sum, s) => sum + s.actionCount, 0)
    };
  }

  static getSessionStats(sessionId: string): {
    timeRemaining: number;
    actionsRemaining: number;
    startTime: number;
    isValid: boolean;
  } {
    console.log('[DEMO_SECURITY] Looking for session:', sessionId);
    console.log('[DEMO_SECURITY] Available sessions:', Array.from(this.demoSessions.keys()));
    console.log('[DEMO_SECURITY] Total sessions:', this.demoSessions.size);
    
    const session = this.demoSessions.get(sessionId);
    
    if (!session) {
      console.log('[DEMO_SECURITY] Session not found!');
      return {
        timeRemaining: 0,
        actionsRemaining: 0,
        startTime: 0,
        isValid: false
      };
    }

    const now = Date.now();
    const elapsed = now - session.startTime;
    const timeRemaining = Math.max(0, this.DEMO_TIME_LIMIT - elapsed);
    const actionsRemaining = Math.max(0, this.MAX_ACTIONS_PER_SESSION - session.actionCount);
    
    return {
      timeRemaining,
      actionsRemaining,
      startTime: session.startTime,
      isValid: timeRemaining > 0 && actionsRemaining > 0
    };
  }

  static cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.demoSessions.entries()) {
      if (now - session.startTime > this.DEMO_TIME_LIMIT) {
        this.demoSessions.delete(sessionId);
      }
    }
  }
}

// Demo Security Middleware - Rate limiting and action tracking for demo users
export const demoSecurityMiddleware = (req: any, res: any, next: any) => {
  console.log(`[MIDDLEWARE_DEBUG] ${req.method} ${req.path} - Session: ${req.sessionID}, User: ${req.session?.user?.id}`);
  
  // Check if user is in demo mode
  const isDemoUser = req.session?.user?.id === 'demo-user-123' || 
                     req.session?.user?.subscriptionTier === 'demo';
  
  console.log(`[MIDDLEWARE_DEBUG] Demo user check: ${isDemoUser}`);
  
  if (!isDemoUser) {
    console.log(`[MIDDLEWARE_DEBUG] Not demo user, passing through`);
    return next(); // Not a demo user, proceed normally
  }

  const sessionId = req.sessionID;
  const userId = req.session?.user?.id;
  
  console.log(`[MIDDLEWARE_DEBUG] Demo user detected: ${userId}, SessionID: ${sessionId}`);
  
  // Check if demo session is valid - use user ID as fallback
  const isSessionValid = DemoSecurityManager.isValidDemoSession(sessionId) || 
                         DemoSecurityManager.isValidDemoSession(userId);
  
  console.log(`[MIDDLEWARE_DEBUG] Session valid: ${isSessionValid}`);
  
  if (!isSessionValid) {
    console.log(`[MIDDLEWARE_DEBUG] Session invalid, blocking request`);
    return res.status(429).json({
      error: 'Demo session expired or action limit exceeded',
      demoLimits: {
        message: 'Demo session has expired or reached the action limit',
        upgradeRequired: true
      }
    });
  }

  // Record the action for demo tracking (only for non-status endpoints)
  if (!req.path.includes('/demo/status') && !req.path.includes('/auth/user')) {
    const actionRecorded = DemoSecurityManager.recordDemoAction(sessionId, userId);
    console.log(`[MIDDLEWARE_DEBUG] Action recorded: ${actionRecorded}`);
  } else {
    console.log(`[MIDDLEWARE_DEBUG] Skipping action record for status/auth endpoint`);
  }

  next();
};