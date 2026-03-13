import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, User, Shield, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { eventBus } from '../../../../src/core/EventBus';

interface AuthButtonProps {
  variant?: 'button' | 'card' | 'minimal';
  showUserInfo?: boolean;
  onLoginSuccess?: (user: any) => void;
  onLogoutComplete?: () => void;
  className?: string;
}

export default function AuthButton({
  variant = 'button',
  showUserInfo = false,
  onLoginSuccess,
  onLogoutComplete,
  className = ''
}: AuthButtonProps) {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle login
  const handleLogin = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await login();
      
      if (onLoginSuccess && user) {
        onLoginSuccess(user);
      }

      // Emit authentication event
      eventBus.emit({
        type: 'auth.login.success',
        module: '@caren/auth',
        payload: {
          userId: user?.id,
          username: user?.username,
          timestamp: Date.now()
        }
      });

    } catch (error: any) {
      console.error('[AUTH_MODULE] Login error:', error);
      
      eventBus.emit({
        type: 'auth.login.error',
        module: '@caren/auth',
        payload: {
          error: error.message,
          timestamp: Date.now()
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await logout();
      
      if (onLogoutComplete) {
        onLogoutComplete();
      }

      // Emit logout event
      eventBus.emit({
        type: 'auth.logout.success',
        module: '@caren/auth',
        payload: {
          timestamp: Date.now()
        }
      });

    } catch (error: any) {
      console.error('[AUTH_MODULE] Logout error:', error);
      
      eventBus.emit({
        type: 'auth.logout.error',
        module: '@caren/auth',
        payload: {
          error: error.message,
          timestamp: Date.now()
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Listen for authentication events from other modules
  useEffect(() => {
    const handleAuthEvent = (event: any) => {
      console.log(`[AUTH_BUTTON] Received event: ${event.type}`, event.payload);

      switch (event.type) {
        case 'auth.login.request':
          handleLogin();
          break;

        case 'auth.logout.request':
          handleLogout();
          break;

        case 'auth.session.expired':
          // Automatically redirect to login
          handleLogin();
          break;

        default:
          break;
      }
    };

    eventBus.subscribe('auth.*', handleAuthEvent);
    
    return () => {
      eventBus.unsubscribe('auth.*', handleAuthEvent);
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Button disabled className={className}>
        <User className="w-4 h-4 mr-2 animate-pulse" />
        Loading...
      </Button>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthenticated && user ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.profileImageUrl} alt={user.username} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.username
                    }
                  </p>
                  {user.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">
                  Active
                </Badge>
              </div>

              {/* User Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    eventBus.emit({
                      type: 'navigation.settings',
                      module: '@caren/auth',
                      payload: { timestamp: Date.now() }
                    });
                  }}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Sign in to access all C.A.R.E.N. features and personalized protection.
              </p>
              
              <Button
                onClick={handleLogin}
                className="w-full"
                disabled={isProcessing}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isProcessing ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Minimal variant (just avatar or icon)
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isAuthenticated && user ? (
          <>
            <Avatar className="w-8 h-8 cursor-pointer" onClick={handleLogout}>
              <AvatarImage src={user.profileImageUrl} alt={user.username} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            {showUserInfo && (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user.username}
              </span>
            )}
          </>
        ) : (
          <Button
            onClick={handleLogin}
            variant="ghost"
            size="sm"
            disabled={isProcessing}
          >
            <LogIn className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // Default button variant
  return (
    <Button
      onClick={isAuthenticated ? handleLogout : handleLogin}
      variant={isAuthenticated ? "outline" : "default"}
      className={className}
      disabled={isProcessing}
    >
      {isAuthenticated ? (
        <>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4 mr-2" />
          {isProcessing ? 'Signing In...' : 'Sign In'}
        </>
      )}
    </Button>
  );
}