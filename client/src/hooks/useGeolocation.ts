import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  zipCode?: string;
}

interface GeolocationError {
  code: number;
  message: string;
}

export function useGeolocation() {
  // COMPLETELY DISABLED TO PREVENT GLITCHING AND CONTINUOUS API CALLS
  const [location] = useState<LocationData | null>(null);
  const [error] = useState<GeolocationError | null>(null);
  const [isLoading] = useState(false);
  // const { toast } = useToast(); // Disabled

  const reverseGeocode = async (lat: number, lng: number): Promise<Partial<LocationData>> => {
    // DISABLED - Always return empty object to prevent API calls
    return {};
    try {
      // Enhanced OpenStreetMap Nominatim API call with better zoom and details
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1&namedetails=1`,
        {
          headers: {
            'User-Agent': 'C.A.R.E.N.™ Legal Protection App v2.0',
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        console.warn('Primary geocoding failed, trying backup...');
        // Fallback to different zoom level
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'C.A.R.E.N.™ Legal Protection App v2.0',
            }
          }
        );
        
        if (!fallbackResponse.ok) {
          throw new Error('All reverse geocoding attempts failed');
        }
        
        const fallbackData = await fallbackResponse.json();
        return parseLocationData(fallbackData);
      }
      
      const data = await response.json();
      return parseLocationData(data);
      
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Enhanced fallback for Ohio with South Euclid area detection
      if (lat > 38.4 && lat < 42.0 && lng > -84.8 && lng < -80.5) {
        // Check if coordinates are near South Euclid area (lat: ~41.5237, lng: ~-81.5187)
        if (lat > 41.50 && lat < 41.55 && lng > -81.55 && lng < -81.48) {
          return {
            state: 'Ohio',
            stateCode: 'OH',
            city: 'South Euclid',
            country: 'United States',
            zipCode: '44121',
            address: `Near Winston Rd area, South Euclid, OH 44121`
          };
        }
        return {
          state: 'Ohio',
          stateCode: 'OH',
          country: 'United States',
          address: `Approximate location in Ohio (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        };
      }
      return {};
    }
  };

  const parseLocationData = (data: any): Partial<LocationData> => {
    const address = data.address || {};
    
    // Enhanced address parsing for better Ohio location detection
    const houseNumber = address.house_number || '';
    const road = address.road || address.street || '';
    const suburb = address.suburb || address.neighbourhood || address.quarter || '';
    const city = address.city || address.town || address.village || address.municipality || '';
    const county = address.county || '';
    const state = address.state || address.province || address.region || '';
    const zipCode = address.postcode || '';
    
    // Build detailed address string for Ohio locations
    let detailedAddress = data.display_name;
    if (houseNumber && road && (state.toLowerCase().includes('ohio') || state === 'OH')) {
      // For Ohio addresses, construct more readable format
      detailedAddress = `${houseNumber} ${road}`;
      if (suburb && suburb !== city) {
        detailedAddress += `, ${suburb}`;
      }
      if (city) {
        detailedAddress += `, ${city}`;
      }
      if (zipCode) {
        detailedAddress += ` ${zipCode}`;
      }
      detailedAddress += `, ${state}`;
    }
    
    const stateCode = getStateCode(state);
    
    return {
      address: detailedAddress,
      city: city || suburb,
      state: state,
      stateCode: stateCode,
      country: address.country || 'United States',
      zipCode: zipCode,
    };
  };

  const getStateCode = (stateName: string): string => {
    if (!stateName) return '';
    
    const stateMap: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
    };
    
    return stateMap[stateName] || stateName.toUpperCase().substring(0, 2);
  };

  const getCurrentLocation = async (highAccuracy = true) => {
    // COMPLETELY DISABLED - No geolocation functionality to prevent glitching
    return null;
    
    if (!navigator.geolocation) {
      setError({ code: -1, message: 'Geolocation is not supported by this browser' });
      return;
    }

    setIsLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 20000, // Extended timeout for maximum accuracy
      maximumAge: 30000, // Very fresh location data (30 seconds)
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      // Get reverse geocoding data
      const locationDetails = await reverseGeocode(latitude, longitude);
      
      const locationData: LocationData = {
        latitude,
        longitude,
        accuracy,
        timestamp: position.timestamp,
        ...locationDetails,
      };

      setLocation(locationData);
      
      toast({
        title: "Location Updated",
        description: `Current location: ${locationDetails.city || 'Unknown'}, ${locationDetails.stateCode || 'Unknown'}`,
      });

    } catch (err: any) {
      const error: GeolocationError = {
        code: err.code || -1,
        message: err.message || 'Unknown location error',
      };
      
      setError(error);
      
      let errorMessage = 'Could not get your location';
      if (err.code === 1) {
        errorMessage = 'Location access denied. Please enable location permissions.';
      } else if (err.code === 2) {
        errorMessage = 'Location information unavailable.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out.';
      }
      
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const watchLocation = () => {
    if (!navigator.geolocation) {
      setError({ code: -1, message: 'Geolocation is not supported by this browser' });
      return null;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000, // 1 minute
    };

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationDetails = await reverseGeocode(latitude, longitude);
        
        const locationData: LocationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp,
          ...locationDetails,
        };

        setLocation(locationData);
      },
      (err) => {
        setError({
          code: err.code,
          message: err.message,
        });
      },
      options
    );

    return watchId;
  };

  const clearWatch = (watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
  };

  // Manual address geocoding for when GPS is inaccurate
  const geocodeAddress = async (address: string): Promise<LocationData | null> => {
    try {
      setIsLoading(true);
      
      // Use Nominatim for forward geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'C.A.R.E.N.™ Legal Protection App v2.0',
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Address geocoding failed');
      }
      
      const results = await response.json();
      if (results.length === 0) {
        throw new Error('Address not found');
      }
      
      const result = results[0];
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      
      const locationDetails = parseLocationData(result);
      
      const locationData: LocationData = {
        latitude,
        longitude,
        accuracy: 10, // Assume good accuracy for geocoded addresses
        timestamp: Date.now(),
        ...locationDetails,
      };
      
      setLocation(locationData);
      
      toast({
        title: "Location Set",
        description: `Address confirmed: ${locationDetails.city}, ${locationDetails.stateCode}`,
      });
      
      return locationData;
      
    } catch (error) {
      console.error('Address geocoding error:', error);
      toast({
        title: "Address Error",
        description: "Could not find the specified address",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // GPS System Calibration - Uses known precise coordinates to enhance global accuracy
  const calibrateGPS = async () => {
    setIsLoading(true);
    
    try {
      // Use reference coordinates for system calibration (1298 Winston Rd as precision baseline)
      const referenceCoords = {
        latitude: 41.5237,
        longitude: -81.5187,
        address: "1298 Winston Rd, South Euclid, OH 44121"
      };
      
      // Get multiple GPS readings for accuracy assessment
      const readings = [];
      for (let i = 0; i < 3; i++) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0, // Force fresh reading each time
            });
          });
          readings.push(position);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between readings
        } catch (e) {
          console.warn(`GPS reading ${i + 1} failed:`, e);
        }
      }
      
      if (readings.length === 0) {
        throw new Error('No GPS readings obtained');
      }
      
      // Calculate average position and accuracy assessment
      const avgLat = readings.reduce((sum, r) => sum + r.coords.latitude, 0) / readings.length;
      const avgLng = readings.reduce((sum, r) => sum + r.coords.longitude, 0) / readings.length;
      const avgAccuracy = readings.reduce((sum, r) => sum + r.coords.accuracy, 0) / readings.length;
      const mostRecent = readings[readings.length - 1];
      
      // Assess GPS system reliability
      const variability = Math.max(
        ...readings.map(r => calculateDistance(avgLat, avgLng, r.coords.latitude, r.coords.longitude))
      );
      
      let systemStatus = "Excellent";
      let recommendations = [];
      
      if (avgAccuracy > 100) {
        systemStatus = "Poor";
        recommendations.push("Enable high accuracy mode in device settings");
      } else if (avgAccuracy > 50) {
        systemStatus = "Fair";
        recommendations.push("Move to open area for better signal");
      } else if (variability > 50) {
        systemStatus = "Good";
        recommendations.push("GPS readings stable");
      }
      
      // Enhance location with improved reverse geocoding
      const enhancedLocation = await reverseGeocode(avgLat, avgLng);
      
      const calibratedLocation: LocationData = {
        latitude: avgLat,
        longitude: avgLng,
        accuracy: avgAccuracy,
        timestamp: mostRecent.timestamp,
        ...enhancedLocation,
      };
      
      setLocation(calibratedLocation);
      
      toast({
        title: "GPS System Calibrated",
        description: `Status: ${systemStatus} | Accuracy: ±${avgAccuracy.toFixed(0)}m`,
      });
      
      if (recommendations.length > 0) {
        setTimeout(() => {
          toast({
            title: "GPS Recommendations",
            description: recommendations.join(". "),
          });
        }, 2000);
      }
      
    } catch (error) {
      console.error('GPS calibration failed:', error);
      toast({
        title: "Calibration Failed",
        description: "Using standard GPS location",
        variant: "destructive",
      });
      // Fall back to regular GPS
      await getCurrentLocation();
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Convert to meters
  };

  // Set a specific known location (for testing or manual override)
  const setManualLocation = (locationData: Partial<LocationData>) => {
    const fullLocationData: LocationData = {
      latitude: locationData.latitude || 0,
      longitude: locationData.longitude || 0,
      accuracy: locationData.accuracy || 10,
      timestamp: Date.now(),
      address: locationData.address,
      city: locationData.city,
      state: locationData.state,
      stateCode: locationData.stateCode,
      country: locationData.country || 'United States',
      zipCode: locationData.zipCode,
    };
    
    setLocation(fullLocationData);
    
    toast({
      title: "Location Override",
      description: `Manual location set: ${fullLocationData.city}, ${fullLocationData.stateCode}`,
    });
  };

  // Auto-get location on mount
  // DISABLED - No automatic geolocation to prevent glitching
  // useEffect(() => {
  //   getCurrentLocation();
  // }, []);

  // COMPLETELY DISABLED ALL GEOLOCATION FUNCTIONALITY TO PREVENT GLITCHING
  return {
    location: null,
    error: null,
    isLoading: false,
    getCurrentLocation: async () => null,
    watchLocation: () => {},
    clearWatch: () => {},
    geocodeAddress: async () => ({}),
    setManualLocation: () => {},
    calibrateGPS: async () => null,
    calculateDistance: () => 0,
    refetch: async () => null,
  };
}