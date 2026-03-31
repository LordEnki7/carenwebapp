import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '../../../../src/core/EventBus';

interface EmergencyHook {
  isEmergencyActive: boolean;
  emergencyLevel: EmergencyLevel;
  activeEmergencyId: string | null;
  emergencyStartTime: number | null;
  activateEmergency: (level: EmergencyLevel, trigger: string) => string;
  deactivateEmergency: () => void;
  updateEmergencyLevel: (level: EmergencyLevel) => void;
  error: string | null;
}

type EmergencyLevel = 'low' | 'medium' | 'high' | 'critical';

interface EmergencySession {
  id: string;
  level: EmergencyLevel;
  startTime: number;
  trigger: string;
  events: EmergencyEvent[];
  isActive: boolean;
}

interface EmergencyEvent {
  id: string;
  type: string;
  timestamp: number;
  data: any;
}

export function useEmergency(): EmergencyHook {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('low');
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
  const [emergencyStartTime, setEmergencyStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emergencySession, setEmergencySession] = useState<EmergencySession | null>(null);

  // Generate unique emergency ID
  const generateEmergencyId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `emergency_${timestamp}_${random}`;
  };

  // Activate emergency mode
  const activateEmergency = useCallback((level: EmergencyLevel, trigger: string): string => {
    if (isEmergencyActive) {
      console.log('[EMERGENCY_MODULE] Emergency already active, updating level');
      updateEmergencyLevel(level);
      return activeEmergencyId || '';
    }

    const emergencyId = generateEmergencyId();
    const startTime = Date.now();

    console.log(`[EMERGENCY_MODULE] Activating emergency: ${emergencyId} (level: ${level})`);

    const session: EmergencySession = {
      id: emergencyId,
      level,
      startTime,
      trigger,
      events: [],
      isActive: true
    };

    setEmergencySession(session);
    setIsEmergencyActive(true);
    setEmergencyLevel(level);
    setActiveEmergencyId(emergencyId);
    setEmergencyStartTime(startTime);
    setError(null);

    // Emit emergency activation event
    eventBus.emit({
      type: 'emergency.activated',
      module: '@caren/emergency',
      payload: {
        emergencyId,
        level,
        trigger,
        startTime,
        timestamp: Date.now()
      }
    });

    // Trigger automated emergency responses
    triggerEmergencyResponses(level, emergencyId);

    return emergencyId;
  }, [isEmergencyActive, activeEmergencyId]);

  // Deactivate emergency mode
  const deactivateEmergency = useCallback(() => {
    if (!isEmergencyActive || !activeEmergencyId) {
      console.log('[EMERGENCY_MODULE] No active emergency to deactivate');
      return;
    }

    const endTime = Date.now();
    const duration = emergencyStartTime ? endTime - emergencyStartTime : 0;

    console.log(`[EMERGENCY_MODULE] Deactivating emergency: ${activeEmergencyId} (duration: ${duration}ms)`);

    // Emit emergency deactivation event
    eventBus.emit({
      type: 'emergency.deactivated',
      module: '@caren/emergency',
      payload: {
        emergencyId: activeEmergencyId,
        duration,
        endTime,
        timestamp: Date.now()
      }
    });

    // Reset state
    setIsEmergencyActive(false);
    setEmergencyLevel('low');
    setActiveEmergencyId(null);
    setEmergencyStartTime(null);
    setEmergencySession(null);
  }, [isEmergencyActive, activeEmergencyId, emergencyStartTime]);

  // Update emergency level
  const updateEmergencyLevel = useCallback((level: EmergencyLevel) => {
    if (!isEmergencyActive || !activeEmergencyId) return;

    console.log(`[EMERGENCY_MODULE] Updating emergency level: ${emergencyLevel} -> ${level}`);

    setEmergencyLevel(level);

    if (emergencySession) {
      setEmergencySession(prev => prev ? { ...prev, level } : null);
    }

    eventBus.emit({
      type: 'emergency.level.updated',
      module: '@caren/emergency',
      payload: {
        emergencyId: activeEmergencyId,
        oldLevel: emergencyLevel,
        newLevel: level,
        timestamp: Date.now()
      }
    });

    // Trigger additional responses if level increased
    if (getLevelPriority(level) > getLevelPriority(emergencyLevel)) {
      triggerEmergencyResponses(level, activeEmergencyId);
    }
  }, [isEmergencyActive, activeEmergencyId, emergencyLevel, emergencySession]);

  // Get priority number for level comparison
  const getLevelPriority = (level: EmergencyLevel): number => {
    switch (level) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 0;
    }
  };

  // Trigger automated emergency responses
  const triggerEmergencyResponses = (level: EmergencyLevel, emergencyId: string) => {
    console.log(`[EMERGENCY_MODULE] Triggering emergency responses for level: ${level}`);

    // Always start recording
    eventBus.emit({
      type: 'recording.start.emergency',
      module: '@caren/emergency',
      payload: {
        emergencyId,
        level,
        priority: 'high',
        timestamp: Date.now()
      }
    });

    // Capture location
    eventBus.emit({
      type: 'location.capture',
      module: '@caren/emergency',
      payload: {
        emergencyId,
        level,
        timestamp: Date.now()
      }
    });

    // Level-specific responses
    if (level === 'high' || level === 'critical') {
      // Notify emergency contacts
      eventBus.emit({
        type: 'emergency.contacts.notify',
        module: '@caren/emergency',
        payload: {
          emergencyId,
          level,
          timestamp: Date.now()
        }
      });

      // Start live streaming if critical
      if (level === 'critical') {
        eventBus.emit({
          type: 'emergency.livestream.start',
          module: '@caren/emergency',
          payload: {
            emergencyId,
            level,
            timestamp: Date.now()
          }
        });
      }
    }

    // Always display legal rights
    eventBus.emit({
      type: 'legal.rights.display',
      module: '@caren/emergency',
      payload: {
        emergencyId,
        level,
        timestamp: Date.now()
      }
    });
  };

  // Listen for external emergency events
  useEffect(() => {
    const handleEmergencyEvent = (event: any) => {
      console.log(`[EMERGENCY_MODULE] Received event: ${event.type}`, event.payload);

      switch (event.type) {
        case 'emergency.activate':
          if (event.payload.level && event.payload.trigger) {
            activateEmergency(event.payload.level, event.payload.trigger);
          }
          break;

        case 'emergency.deactivate':
          deactivateEmergency();
          break;

        case 'emergency.level.change':
          if (event.payload.level) {
            updateEmergencyLevel(event.payload.level);
          }
          break;

        case 'voice.command.executed':
          // Check if voice command is emergency-related
          if (event.payload.category === 'emergency') {
            const level = event.payload.confidence > 0.9 ? 'high' : 'medium';
            activateEmergency(level, 'voice_command');
          }
          break;

        case 'emergency.panic.button':
          activateEmergency('critical', 'panic_button');
          break;

        default:
          break;
      }
    };

    // Subscribe to various emergency-related events
    const eventTypes = [
      'emergency.activate',
      'emergency.deactivate',
      'emergency.level.change',
      'voice.command.executed',
      'emergency.panic.button'
    ];

    eventTypes.forEach(eventType => {
      eventBus.subscribe(eventType, handleEmergencyEvent);
    });

    return () => {
      eventTypes.forEach(eventType => {
        eventBus.unsubscribe(eventType, handleEmergencyEvent);
      });
    };
  }, [activateEmergency, deactivateEmergency, updateEmergencyLevel]);

  // Auto-escalation based on duration
  useEffect(() => {
    if (!isEmergencyActive || !emergencyStartTime) return;

    const escalationInterval = setInterval(() => {
      const duration = Date.now() - emergencyStartTime;
      const minutes = Math.floor(duration / 60000);

      // Auto-escalate after certain durations
      if (minutes >= 10 && emergencyLevel === 'low') {
        updateEmergencyLevel('medium');
      } else if (minutes >= 20 && emergencyLevel === 'medium') {
        updateEmergencyLevel('high');
      } else if (minutes >= 30 && emergencyLevel === 'high') {
        updateEmergencyLevel('critical');
      }
    }, 60000); // Check every minute

    return () => clearInterval(escalationInterval);
  }, [isEmergencyActive, emergencyStartTime, emergencyLevel, updateEmergencyLevel]);

  return {
    isEmergencyActive,
    emergencyLevel,
    activeEmergencyId,
    emergencyStartTime,
    activateEmergency,
    deactivateEmergency,
    updateEmergencyLevel,
    error
  };
}