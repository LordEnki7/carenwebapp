import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '../../../../src/core/EventBus';

interface LegalRightsHook {
  rights: LegalRight[];
  currentLocation: Location | null;
  isLoading: boolean;
  error: string | null;
  getRightsForSituation: (situation: string) => Promise<LegalRight[]>;
  getLocationSpecificRights: (state: string, city?: string) => Promise<LegalRight[]>;
  searchRights: (query: string) => LegalRight[];
}

interface LegalRight {
  id: string;
  title: string;
  description: string;
  category: 'constitutional' | 'recording' | 'police_interaction' | 'legal_procedure' | 'state_specific';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scope: 'federal' | 'state' | 'local';
  jurisdiction?: string;
  situation: string[];
  statute?: string;
  caselaw?: string;
  action?: string;
  restrictions?: string;
  examples?: string;
}

interface Location {
  state: string;
  city?: string;
  coordinates?: { lat: number; lng: number };
}

// Mock legal rights database (in production, this would come from a real database)
const LEGAL_RIGHTS_DATABASE: LegalRight[] = [
  {
    id: 'constitutional_miranda',
    title: 'Miranda Rights',
    description: 'You have the right to remain silent and the right to an attorney.',
    category: 'constitutional',
    priority: 'critical',
    scope: 'federal',
    situation: ['arrest', 'questioning', 'detention'],
    action: 'Clearly state: "I invoke my right to remain silent and want a lawyer."',
    examples: 'Any custodial interrogation requires Miranda warnings.'
  },
  {
    id: 'constitutional_search',
    title: 'Fourth Amendment Protection',
    description: 'Protection against unreasonable searches and seizures.',
    category: 'constitutional',
    priority: 'high',
    scope: 'federal',
    situation: ['search', 'traffic_stop', 'arrest'],
    action: 'State clearly: "I do not consent to any searches."',
    restrictions: 'Police may search with warrant, consent, or exigent circumstances.'
  },
  {
    id: 'recording_first_amendment',
    title: 'Right to Record Police',
    description: 'First Amendment protects the right to record police in public.',
    category: 'recording',
    priority: 'high',
    scope: 'federal',
    situation: ['traffic_stop', 'arrest', 'general'],
    action: 'You may record from a reasonable distance without interfering.',
    restrictions: 'Must not interfere with police duties or obstruct.'
  },
  {
    id: 'traffic_stop_basics',
    title: 'Traffic Stop Rights',
    description: 'Your rights during a traffic stop.',
    category: 'police_interaction',
    priority: 'high',
    scope: 'federal',
    situation: ['traffic_stop'],
    action: 'Provide license and registration when requested. You may remain silent beyond identification.',
    examples: 'Pull over safely, turn off engine, hands visible.'
  },
  {
    id: 'detention_vs_arrest',
    title: 'Detention vs. Arrest',
    description: 'Understanding the difference between detention and arrest.',
    category: 'legal_procedure',
    priority: 'medium',
    scope: 'federal',
    situation: ['questioning', 'detention', 'arrest'],
    action: 'Ask: "Am I free to leave?" If no, you are detained.',
    examples: 'Detention is temporary, arrest requires probable cause.'
  }
];

export function useLegalRights(): LegalRightsHook {
  const [rights, setRights] = useState<LegalRight[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with basic rights
  useEffect(() => {
    setRights(LEGAL_RIGHTS_DATABASE);
    console.log('[LEGAL_MODULE] Initialized with basic legal rights database');
  }, []);

  // Get rights for specific situation
  const getRightsForSituation = useCallback(async (situation: string): Promise<LegalRight[]> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[LEGAL_MODULE] Getting rights for situation: ${situation}`);

      // Filter rights by situation
      const situationRights = LEGAL_RIGHTS_DATABASE.filter(right => 
        right.situation.includes(situation) || right.situation.includes('general')
      );

      // Sort by priority
      const sortedRights = situationRights.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      setRights(sortedRights);
      
      // Emit event for analytics/logging
      eventBus.emit({
        type: 'legal.rights.loaded',
        module: '@caren/legal',
        payload: {
          situation,
          count: sortedRights.length,
          timestamp: Date.now()
        }
      });

      return sortedRights;

    } catch (error: any) {
      console.error('[LEGAL_MODULE] Error getting situation rights:', error);
      setError(`Failed to load rights: ${error.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get location-specific rights
  const getLocationSpecificRights = useCallback(async (state: string, city?: string): Promise<LegalRight[]> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[LEGAL_MODULE] Getting location-specific rights: ${state}${city ? `, ${city}` : ''}`);

      // Update current location
      setCurrentLocation({ state, city });

      // In a real application, this would query a database of state/local laws
      // For now, return mock state-specific rights
      const stateRights: LegalRight[] = [
        {
          id: `${state.toLowerCase()}_recording`,
          title: `${state} Recording Laws`,
          description: `State-specific recording laws for ${state}.`,
          category: 'state_specific',
          priority: 'medium',
          scope: 'state',
          jurisdiction: state,
          situation: ['recording', 'general'],
          action: 'Check state-specific recording consent laws.',
          statute: `${state} Penal Code § 123.45`
        },
        {
          id: `${state.toLowerCase()}_traffic`,
          title: `${state} Traffic Stop Procedures`,
          description: `State-specific traffic stop procedures for ${state}.`,
          category: 'state_specific',
          priority: 'medium',
          scope: 'state',
          jurisdiction: state,
          situation: ['traffic_stop'],
          action: 'Follow state-specific traffic stop protocols.',
          statute: `${state} Vehicle Code § 456.78`
        }
      ];

      const combinedRights = [...LEGAL_RIGHTS_DATABASE, ...stateRights];
      setRights(combinedRights);

      // Emit location update event
      eventBus.emit({
        type: 'legal.location.updated',
        module: '@caren/legal',
        payload: {
          state,
          city,
          rightsCount: stateRights.length,
          timestamp: Date.now()
        }
      });

      return stateRights;

    } catch (error: any) {
      console.error('[LEGAL_MODULE] Error getting location rights:', error);
      setError(`Failed to load location rights: ${error.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search rights by query
  const searchRights = useCallback((query: string): LegalRight[] => {
    if (!query.trim()) return rights;

    const lowercaseQuery = query.toLowerCase();
    return rights.filter(right => 
      right.title.toLowerCase().includes(lowercaseQuery) ||
      right.description.toLowerCase().includes(lowercaseQuery) ||
      right.category.includes(lowercaseQuery) ||
      right.situation.some(s => s.includes(lowercaseQuery))
    );
  }, [rights]);

  // Listen for location updates from other modules
  useEffect(() => {
    const handleLocationEvent = (event: any) => {
      console.log(`[LEGAL_MODULE] Received location event: ${event.type}`, event.payload);

      if (event.type === 'location.updated' || event.type === 'location.capture') {
        const { state, city } = event.payload;
        if (state) {
          getLocationSpecificRights(state, city);
        }
      }
    };

    eventBus.subscribe('location.updated', handleLocationEvent);
    eventBus.subscribe('location.capture', handleLocationEvent);
    
    return () => {
      eventBus.unsubscribe('location.updated', handleLocationEvent);
      eventBus.unsubscribe('location.capture', handleLocationEvent);
    };
  }, [getLocationSpecificRights]);

  // Listen for emergency situations
  useEffect(() => {
    const handleEmergencyEvent = (event: any) => {
      console.log(`[LEGAL_MODULE] Received emergency event: ${event.type}`, event.payload);

      if (event.type === 'emergency.activated') {
        // Automatically load high-priority rights for emergency situations
        getRightsForSituation('arrest'); // Default to arrest rights for emergencies
      }
    };

    eventBus.subscribe('emergency.activated', handleEmergencyEvent);
    
    return () => {
      eventBus.unsubscribe('emergency.activated', handleEmergencyEvent);
    };
  }, [getRightsForSituation]);

  // Automatically detect location on mount (if permission granted)
  useEffect(() => {
    const detectLocation = async () => {
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              maximumAge: 300000 // 5 minutes
            });
          });

          console.log('[LEGAL_MODULE] Location detected:', position.coords);

          // Emit location detection event (other modules can respond)
          eventBus.emit({
            type: 'location.detected',
            module: '@caren/legal',
            payload: {
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              },
              timestamp: Date.now()
            }
          });

        } catch (error) {
          console.log('[LEGAL_MODULE] Location detection failed:', error);
          // Don't set error - location detection is optional
        }
      }
    };

    detectLocation();
  }, []);

  return {
    rights,
    currentLocation,
    isLoading,
    error,
    getRightsForSituation,
    getLocationSpecificRights,
    searchRights
  };
}