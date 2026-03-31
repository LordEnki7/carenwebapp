import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface LocationRecommendationsParams {
  specialties?: string[];
  maxDistance?: number;
  autoFetch?: boolean;
}

interface AttorneyRecommendation {
  id: number;
  firmName: string;
  specialties: string[];
  rating: number;
  verified: boolean;
  contactInfo: {
    email: string;
    phone?: string;
  };
  distance: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  relevanceScore: number;
  matchReasons: string[];
}

interface LocationRecommendationsResponse {
  userLocation: {
    state: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  recommendations: AttorneyRecommendation[];
  totalFound: number;
}

export function useLocationRecommendations(params: LocationRecommendationsParams = {}) {
  const { specialties, maxDistance = 50, autoFetch = true } = params;
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user's current location
  useEffect(() => {
    if (!autoFetch) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setLocationError(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, [autoFetch]);

  // Fetch attorney recommendations based on location
  const {
    data: recommendations,
    isLoading,
    error,
    refetch,
  } = useQuery<LocationRecommendationsResponse>({
    queryKey: ['/api/attorneys/recommendations', location, specialties, maxDistance],
    queryFn: async () => {
      if (!location) {
        throw new Error('Location not available');
      }

      const response = await fetch('/api/attorneys/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          specialties,
          maxDistance,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!location && autoFetch,
  });

  const manualFetch = async (coords?: { latitude: number; longitude: number }) => {
    const targetLocation = coords || location;
    if (!targetLocation) {
      throw new Error('Location coordinates required');
    }

    setLocation(targetLocation);
    return refetch();
  };

  return {
    recommendations: recommendations?.recommendations || [],
    userLocation: recommendations?.userLocation,
    totalFound: recommendations?.totalFound || 0,
    location,
    locationError,
    isLoading: isLoading || (!location && !locationError),
    error: error?.message || locationError,
    refetch: manualFetch,
  };
}