import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Users,
  Zap,
  Send,
  Loader2
} from "lucide-react";

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  notificationPreference: 'sms' | 'email' | 'both';
}

interface EmergencyShareStatus {
  contactId: number;
  contactName: string;
  method: 'sms' | 'email';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
  error?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp: string;
}

export default function EmergencyContactSharing() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatuses, setShareStatuses] = useState<EmergencyShareStatus[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [emergencyType, setEmergencyType] = useState<string>('general');
  const [customMessage, setCustomMessage] = useState<string>('');

  // Voice command event listener
  useEffect(() => {
    const handleVoiceTriggeredSharing = (event: CustomEvent) => {
      const { type, autoActivate } = event.detail;
      
      if (autoActivate) {
        setEmergencyType(type);
        // Auto-trigger emergency sharing after a short delay
        setTimeout(() => {
          handleEmergencyShare(type);
        }, 500);
      } else {
        setEmergencyType(type);
        toast({
          title: "Emergency Sharing Ready",
          description: "Voice command activated. Tap to share location.",
          variant: "destructive"
        });
      }
    };

    window.addEventListener('voiceTriggeredEmergencySharing', handleVoiceTriggeredSharing);
    
    return () => {
      window.removeEventListener('voiceTriggeredEmergencySharing', handleVoiceTriggeredSharing);
    };
  }, []);

  // Fetch emergency contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/emergency-contacts'],
    enabled: !!user
  });

  // Get current location
  const getCurrentLocation = async (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          try {
            // Reverse geocoding for address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
            );
            const data = await response.json();
            
            resolve({
              latitude,
              longitude,
              accuracy,
              address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            // Fallback without address
            resolve({
              latitude,
              longitude,
              accuracy,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              timestamp: new Date().toISOString()
            });
          }
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Emergency share mutation
  const shareMutation = useMutation({
    mutationFn: async (shareData: {
      emergencyType: string;
      location: LocationData;
      customMessage?: string;
      contactIds?: number[];
    }) => {
      return apiRequest('/api/emergency-contacts/share', {
        method: 'POST',
        body: JSON.stringify(shareData)
      });
    },
    onSuccess: (data) => {
      setShareStatuses(data.results || []);
      toast({
        title: "Emergency Contacts Notified",
        description: `Successfully shared location with ${data.results?.filter((r: any) => r.status === 'sent').length || 0} contacts`,
      });
    },
    onError: (error) => {
      toast({
        title: "Share Failed",
        description: "Failed to notify emergency contacts. Please try again.",
        variant: "destructive"
      });
    }
  });

  // One-tap emergency share
  const handleEmergencyShare = async (type: string = 'general') => {
    if (contacts.length === 0) {
      toast({
        title: "No Emergency Contacts",
        description: "Please add emergency contacts in Settings first.",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    setEmergencyType(type);
    setShareStatuses([]);

    try {
      // Get current location
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      // Share with all contacts
      await shareMutation.mutateAsync({
        emergencyType: type,
        location,
        customMessage: customMessage || undefined
      });

    } catch (error) {
      toast({
        title: "Location Error",
        description: "Unable to get your location. Please enable GPS and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Quick emergency buttons
  const emergencyTypes = [
    { 
      type: 'traffic_stop', 
      label: 'Traffic Stop', 
      icon: AlertTriangle, 
      color: 'bg-yellow-500',
      message: 'I am currently in a traffic stop situation and sharing my location for safety.'
    },
    { 
      type: 'police_encounter', 
      label: 'Police Encounter', 
      icon: AlertTriangle, 
      color: 'bg-red-500',
      message: 'I am in a police encounter and sharing my location. Please monitor my safety.'
    },
    { 
      type: 'emergency', 
      label: 'General Emergency', 
      icon: Zap, 
      color: 'bg-red-600',
      message: 'I am in an emergency situation and need assistance. Please contact me immediately.'
    },
    { 
      type: 'safety_check', 
      label: 'Safety Check-in', 
      icon: CheckCircle, 
      color: 'bg-green-500',
      message: 'Safety check-in: I am sharing my current location and status with you.'
    }
  ];

  // Calculate share progress
  const shareProgress = shareStatuses.length > 0 
    ? (shareStatuses.filter(s => s.status === 'sent' || s.status === 'delivered').length / shareStatuses.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Quick Emergency Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">One-Tap Emergency Sharing</h2>
              <p className="text-sm text-gray-600">Instantly share your location with emergency contacts</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {emergencyTypes.map((emergency) => {
              const Icon = emergency.icon;
              return (
                <Button
                  key={emergency.type}
                  onClick={() => handleEmergencyShare(emergency.type)}
                  disabled={isSharing || contactsLoading}
                  className={`h-16 justify-start text-left p-4 ${emergency.color} hover:opacity-90 text-white`}
                  variant="default"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{emergency.label}</div>
                      <div className="text-xs opacity-90 truncate">
                        Share location instantly
                      </div>
                    </div>
                    {isSharing && emergencyType === emergency.type && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Custom Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a custom message to include with your location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
              rows={2}
              maxLength={160}
            />
            <div className="text-xs text-gray-500">
              {customMessage.length}/160 characters
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts Summary */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Emergency Contacts</h3>
                  <p className="text-sm text-gray-600">{contacts.length} contacts configured</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Ready
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contacts.slice(0, 3).map((contact: EmergencyContact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{contact.relationship}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.notificationPreference.includes('sms') && (
                      <MessageSquare className="w-4 h-4 text-green-600" />
                    )}
                    {contact.notificationPreference.includes('email') && (
                      <Phone className="w-4 h-4 text-blue-600" />
                    )}
                    <Badge 
                      variant="outline" 
                      className={
                        contact.priority === 'primary' 
                          ? "text-red-600 border-red-200" 
                          : contact.priority === 'secondary'
                          ? "text-yellow-600 border-yellow-200"
                          : "text-gray-600 border-gray-200"
                      }
                    >
                      {contact.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              {contacts.length > 3 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  +{contacts.length - 3} more contacts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share Status */}
      {shareStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Send className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Sharing Status</h3>
                <p className="text-sm text-gray-600">Emergency notification progress</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Contacts Notified</span>
                <span>{Math.round(shareProgress)}%</span>
              </div>
              <Progress value={shareProgress} className="h-2" />
            </div>

            <Separator />

            {/* Individual Status */}
            <div className="space-y-3">
              {shareStatuses.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {status.status === 'sent' || status.status === 'delivered' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : status.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{status.contactName}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {status.method} • {status.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(status.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Location Display */}
      {currentLocation && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">Shared Location</h3>
                <p className="text-sm text-gray-600">Last shared location information</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-green-800 mb-1">Location Shared</div>
                  <div className="text-sm text-green-700">
                    {currentLocation.address}
                  </div>
                  <div className="text-xs text-green-600 mt-2 flex items-center gap-4">
                    <span>Lat: {currentLocation.latitude.toFixed(6)}</span>
                    <span>Lng: {currentLocation.longitude.toFixed(6)}</span>
                    {currentLocation.accuracy && (
                      <span>±{Math.round(currentLocation.accuracy)}m</span>
                    )}
                  </div>
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(currentLocation.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Contacts Warning */}
      {contacts.length === 0 && !contactsLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">No Emergency Contacts</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add emergency contacts in Settings to enable one-tap sharing
                </p>
                <Button 
                  onClick={() => window.location.href = '/settings'} 
                  variant="outline"
                >
                  Add Contacts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}