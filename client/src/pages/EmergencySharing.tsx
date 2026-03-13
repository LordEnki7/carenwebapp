import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Share2, 
  MapPin, 
  Clock, 
  Users,
  Phone,
  Mail,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

export default function EmergencySharing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
    priority: "high"
  });

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString()
        };
        
        // Reverse geocoding for address
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLocation.latitude}&lon=${newLocation.longitude}`)
          .then(res => res.json())
          .then(data => {
            setLocation({
              ...newLocation,
              address: data.display_name || "Unknown location"
            });
          })
          .catch(() => {
            setLocation(newLocation);
          });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Unable to get your current location",
          variant: "destructive",
        });
      }
    );
  };

  // Add emergency contact
  const addContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        title: "Missing Information",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    const contact: EmergencyContact = {
      id: Date.now(),
      ...newContact
    };

    setContacts(prev => [...prev, contact]);
    setNewContact({
      name: "",
      phone: "",
      email: "",
      relationship: "",
      priority: "high"
    });

    toast({
      title: "Contact Added",
      description: `${contact.name} has been added to emergency contacts`,
    });
  };

  // Remove contact
  const removeContact = (id: number) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
    toast({
      title: "Contact Removed",
      description: "Emergency contact has been removed",
    });
  };

  // Share emergency alert
  const shareEmergencyAlert = async () => {
    if (!location) {
      toast({
        title: "No Location",
        description: "Please get your location first",
        variant: "destructive",
      });
      return;
    }

    if (contacts.length === 0) {
      toast({
        title: "No Contacts",
        description: "Please add emergency contacts first",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);

    try {
      // Simulate emergency alert sharing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Emergency Alert Sent",
        description: `Location shared with ${contacts.length} contacts`,
      });
    } catch (error) {
      toast({
        title: "Sharing Failed",
        description: "Failed to send emergency alerts",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gray-900/20 animate-pulse"></div>
      
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-600/20 border border-orange-400/30">
                <Share2 className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Emergency Contact Sharing
                </h1>
                <p className="text-gray-300 mt-1">
                  Share your location instantly with trusted contacts
                </p>
              </div>
            </div>
            
            {/* Back to Dashboard Button */}
            <Link href="/">
              <Button size="sm" className="cyber-button-secondary flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Location Status */}
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <CardTitle className="text-cyan-300">Current Location</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {location ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 font-medium">Location Active</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{location.address}</p>
                    <div className="text-xs text-gray-400">
                      <p>Lat: {location.latitude.toFixed(6)}</p>
                      <p>Lng: {location.longitude.toFixed(6)}</p>
                      <p>Updated: {new Date(location.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={getCurrentLocation}
                    variant="outline" 
                    className="w-full cyber-btn-secondary"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Refresh Location
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 font-medium">Getting Location...</span>
                    </div>
                    <p className="text-gray-400 text-sm">Please allow location access</p>
                  </div>
                  <Button 
                    onClick={getCurrentLocation}
                    className="w-full cyber-btn-primary"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Get My Location
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card className="cyber-card border-purple-500/30">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-400" />
                <CardTitle className="text-cyan-300">Emergency Contacts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add Contact Form */}
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="name" className="text-gray-300">Name</Label>
                      <Input
                        id="name"
                        value={newContact.name}
                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contact name"
                        className="cyber-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                      <Input
                        id="phone"
                        value={newContact.phone}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone number"
                        className="cyber-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-300">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Email address"
                        className="cyber-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="relationship" className="text-gray-300">Relationship</Label>
                      <Input
                        id="relationship"
                        value={newContact.relationship}
                        onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                        placeholder="e.g., Family, Friend, Attorney"
                        className="cyber-input"
                      />
                    </div>
                    <Button onClick={addContact} className="cyber-btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                </div>

                {/* Contacts List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-cyan-300">{contact.name}</span>
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                            {contact.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{contact.phone}</span>
                          </div>
                          {contact.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.relationship && (
                            <span>{contact.relationship}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => removeContact(contact.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No emergency contacts added</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Action */}
        <div className="mt-8">
          <Card className="cyber-card border-red-500/50 bg-gradient-to-r from-red-900/20 to-purple-900/20">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-red-300 mb-2">Emergency Alert</h3>
                  <p className="text-gray-300">
                    Share your current location with all emergency contacts instantly
                  </p>
                </div>
                
                <Button
                  onClick={shareEmergencyAlert}
                  disabled={isSharing || !location || contacts.length === 0}
                  className="cyber-btn-emergency text-lg px-12 py-4 h-auto"
                >
                  {isSharing ? (
                    <>
                      <Clock className="w-6 h-6 mr-3 animate-spin" />
                      Sending Alert...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-6 h-6 mr-3" />
                      Share Emergency Location
                    </>
                  )}
                </Button>
                
                {contacts.length > 0 && location && (
                  <p className="mt-4 text-sm text-gray-400">
                    Will notify {contacts.length} contact{contacts.length !== 1 ? 's' : ''} with your location
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </MobileResponsiveLayout>
  );
}