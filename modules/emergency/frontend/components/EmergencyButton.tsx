import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, PhoneCall, MapPin, Clock, CheckCircle } from 'lucide-react';
import { useEmergency } from '../hooks/useEmergency';
import { eventBus } from '../../../../src/core/EventBus';

interface EmergencyButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'card';
  onEmergencyActivated?: (emergencyId: string) => void;
  className?: string;
}

export default function EmergencyButton({
  size = 'lg',
  variant = 'button',
  onEmergencyActivated,
  className = ''
}: EmergencyButtonProps) {
  const {
    isEmergencyActive,
    emergencyLevel,
    activeEmergencyId,
    emergencyStartTime,
    activateEmergency,
    deactivateEmergency,
    error
  } = useEmergency();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Handle emergency activation with countdown
  const handleEmergencyActivation = () => {
    if (isEmergencyActive) {
      // If already active, deactivate
      deactivateEmergency();
      return;
    }

    // Start 3-second countdown for emergency activation
    setIsActivating(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          
          // Activate emergency
          const emergencyId = activateEmergency('high', 'manual_button');
          
          if (emergencyId && onEmergencyActivated) {
            onEmergencyActivated(emergencyId);
          }

          setIsActivating(false);
          setCountdown(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cancel activation during countdown
  const cancelActivation = () => {
    if (countdown !== null) {
      setCountdown(null);
      setIsActivating(false);
    }
  };

  // Subscribe to emergency events
  useEffect(() => {
    const handleEmergencyEvent = (event: any) => {
      if (event.type === 'emergency.activate') {
        console.log('[EMERGENCY_BUTTON] Emergency activated:', event.payload);
      } else if (event.type === 'emergency.deactivate') {
        console.log('[EMERGENCY_BUTTON] Emergency deactivated:', event.payload);
      }
    };

    eventBus.subscribe('emergency.*', handleEmergencyEvent);
    
    return () => {
      eventBus.unsubscribe('emergency.*', handleEmergencyEvent);
    };
  }, []);

  // Get emergency status color
  const getStatusColor = () => {
    if (isEmergencyActive) {
      switch (emergencyLevel) {
        case 'critical': return 'bg-red-600 hover:bg-red-700';
        case 'high': return 'bg-orange-600 hover:bg-orange-700';
        case 'medium': return 'bg-yellow-600 hover:bg-yellow-700';
        case 'low': return 'bg-blue-600 hover:bg-blue-700';
        default: return 'bg-red-600 hover:bg-red-700';
      }
    }
    return 'bg-red-500 hover:bg-red-600';
  };

  // Get emergency status text
  const getStatusText = () => {
    if (countdown !== null) {
      return `Activating in ${countdown}...`;
    }
    if (isEmergencyActive) {
      return `Emergency Active (${emergencyLevel})`;
    }
    return 'Emergency Mode';
  };

  // Calculate time since emergency started
  const getEmergencyDuration = () => {
    if (!emergencyStartTime) return '';
    
    const duration = Math.floor((Date.now() - emergencyStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (variant === 'card') {
    return (
      <Card className={`${className} ${isEmergencyActive ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${isEmergencyActive ? 'text-red-500' : 'text-gray-500'}`} />
            Emergency Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          {isEmergencyActive && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <Badge className={getStatusColor().replace('hover:', '').replace('bg-', 'bg-') + ' text-white'}>
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Level:</span>
                <Badge variant="outline" className="capitalize">
                  {emergencyLevel}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {getEmergencyDuration()}
                </Badge>
              </div>
            </div>
          )}

          {/* Emergency Button */}
          <div className="space-y-2">
            <Button
              onClick={handleEmergencyActivation}
              size="lg"
              className={`w-full ${getStatusColor()} text-white font-semibold ${
                countdown !== null ? 'animate-pulse' : ''
              } ${isEmergencyActive ? 'animate-pulse' : ''}`}
              disabled={isActivating && countdown === null}
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              {getStatusText()}
            </Button>

            {/* Cancel Button during countdown */}
            {countdown !== null && (
              <Button
                onClick={cancelActivation}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Cancel Activation
              </Button>
            )}
          </div>

          {/* Emergency Features */}
          {isEmergencyActive && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Recording started</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>GPS location captured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Emergency contacts notified</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-2 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Button variant
  return (
    <Button
      onClick={handleEmergencyActivation}
      size={size}
      className={`${getStatusColor()} text-white font-semibold ${
        countdown !== null ? 'animate-pulse' : ''
      } ${isEmergencyActive ? 'animate-pulse' : ''} ${className}`}
      disabled={isActivating && countdown === null}
    >
      <AlertTriangle className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
      {getStatusText()}
    </Button>
  );
}