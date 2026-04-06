import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAttorneys } from "@/hooks/useLegalRights";
import { useLocationRecommendations } from "@/hooks/useLocationRecommendations";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import FloatingAttorneyButton from "@/components/FloatingAttorneyButton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Star, MessageCircle, Phone, Mail, User, Scale, Shield, Navigation, Target, Clock } from "lucide-react";
import { US_STATES } from "@/types";
import { t } from "@/lib/i18n";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

const specialties = [
  "Civil Rights",
  "Traffic Law", 
  "Criminal Defense",
  "Constitutional Law",
  "Police Misconduct",
  "Personal Injury",
  "Immigration Law",
];

export default function Attorneys() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedState, setSelectedState] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAttorney, setSelectedAttorney] = useState<any>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTab, setCurrentTab] = useState("available");
  const [savedAttorneys, setSavedAttorneys] = useState<any[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);

  const { data: attorneys = [], isLoading, refetch } = useAttorneys();
  const { recommendations: recommendedAttorneys = [] } = useLocationRecommendations();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      refetch();
      fetchSavedAttorneys();
    }
  }, [isAuthenticated, authLoading, refetch]);

  const fetchSavedAttorneys = async () => {
    try {
      const response = await apiRequest('GET', '/api/attorneys/user-attorneys', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSavedAttorneys(data);
      }
    } catch (error) {
      console.error('Error fetching saved attorneys:', error);
    }
  };

  const filteredAttorneys = attorneys.filter((attorney: any) => {
    const matchesSearch = !searchTerm || 
      attorney.firmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attorney.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = !selectedState || selectedState === "all-states" || attorney.states?.includes(selectedState);
    const matchesSpecialty = !selectedSpecialty || selectedSpecialty === "all-specialties" || attorney.specialty === selectedSpecialty;
    
    return matchesSearch && matchesState && matchesSpecialty;
  });

  const connectWithAttorney = async () => {
    if (!selectedAttorney || !connectionMessage.trim()) return;
    
    setIsConnecting(true);
    
    try {
      const response = await apiRequest('POST', '/api/attorneys/connect', {
        attorneyId: selectedAttorney.id,
        message: connectionMessage,
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Connection Request Sent",
          description: `Your message has been sent to ${selectedAttorney.firmName}. They will contact you shortly.`,
        });
        setSelectedAttorney(null);
        setConnectionMessage("");
      } else {
        throw new Error('Failed to send connection request');
      }
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Connection Failed",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedState("");
    setSelectedSpecialty("");
  };

  const hasActiveFilters = searchTerm || (selectedState && selectedState !== "all-states") || (selectedSpecialty && selectedSpecialty !== "all-specialties");

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen cyber-background">
      
      <div className="p-6">
        <TopBar 
          title={t("attorneys")}
          description="Connect with verified attorneys specializing in civil rights and traffic law"
        />
        
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Attorney Recruitment Banner */}
            <div className="cyber-card p-6 mb-6 animate-fade-in-up bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Are You a Civil Rights Attorney?</h2>
                  <p className="text-blue-100 mb-4">
                    Join our network and help protect citizens' constitutional rights during police encounters.
                  </p>
                </div>
                <Button 
                  variant="secondary"
                  onClick={() => window.location.href = '/attorney-apply'}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold"
                >
                  <Scale className="w-4 h-4 mr-2" />
                  Apply to Join
                </Button>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="cyber-card p-6 mb-8 animate-fade-in-up">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                How Legal Protection Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Navigation className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">1. Find Attorney</h3>
                  <p className="text-gray-300 text-sm">Search and connect with verified civil rights attorneys in your area</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">2. Document Incident</h3>
                  <p className="text-gray-300 text-sm">Use C.A.R.E.N.™ to record and document any legal encounters</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">3. Get Legal Help</h3>
                  <p className="text-gray-300 text-sm">Your attorney receives evidence and can provide immediate guidance</p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="cyber-card p-6 mb-6 animate-fade-in-up">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                  <Input
                    placeholder="Search attorneys by name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
                  />
                </div>
                
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-full lg:w-48 bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all-states" className="text-white hover:bg-gray-700">All States</SelectItem>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.code} className="text-white hover:bg-gray-700">
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="w-full lg:w-52 bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all-specialties" className="text-white hover:bg-gray-700">All Specialties</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty} className="text-white hover:bg-gray-700">
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="whitespace-nowrap bg-gray-800/50 border-gray-600 text-cyan-400 hover:bg-gray-700"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Attorneys Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="cyber-card p-6 animate-fade-in-up">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAttorneys.length === 0 ? (
              <div className="cyber-card p-12 text-center animate-fade-in-up">
                <div className="text-gray-400 mb-4">
                  <User className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No attorneys found
                </h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm || selectedState || selectedSpecialty 
                    ? "Try adjusting your search criteria or filters"
                    : "No attorneys are currently available in our network."
                  }
                </p>
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="bg-gray-800/50 border-gray-600 text-cyan-400 hover:bg-gray-700"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAttorneys.map((attorney: any) => (
                  <Card key={attorney.id} className="cyber-card hover:border-cyan-500/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={attorney.profileImage} />
                          <AvatarFallback className="bg-cyan-500 text-white">
                            {attorney.firmName?.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{attorney.firmName}</h3>
                          <p className="text-sm text-gray-400">{attorney.specialty}</p>
                          {attorney.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-300">{attorney.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {attorney.states && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <MapPin className="w-4 h-4" />
                            Licensed in {(() => {
                              try {
                                const states = Array.isArray(attorney.states) 
                                  ? attorney.states 
                                  : attorney.states.split(',').map((s: string) => s.trim());
                                return states.join(", ");
                              } catch (e) {
                                return attorney.states.toString();
                              }
                            })()}
                          </div>
                        </div>
                      )}

                      {attorney.bio && (
                        <p className="text-sm text-gray-300 mb-4 line-clamp-3">
                          {attorney.bio}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Dialog open={selectedAttorney?.id === attorney.id} onOpenChange={(open) => {
                          if (!open) {
                            setSelectedAttorney(null);
                            setConnectionMessage("");
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setSelectedAttorney(attorney)}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Connect
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Connect with {attorney.firmName}</DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Send a message to request legal consultation or representation.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="message" className="text-white">Your Message</Label>
                                <Textarea
                                  id="message"
                                  placeholder="Describe your legal situation or request..."
                                  value={connectionMessage}
                                  onChange={(e) => setConnectionMessage(e.target.value)}
                                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedAttorney(null)} className="bg-gray-800 border-gray-600 text-white">
                                Cancel
                              </Button>
                              <Button 
                                onClick={connectWithAttorney}
                                disabled={isConnecting || !connectionMessage.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {isConnecting ? "Sending..." : "Send Message"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {attorney.contactInfo && (
                          <Button variant="outline" size="sm" className="bg-gray-800/50 border-gray-600 text-cyan-400 hover:bg-gray-700">
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Legal Disclaimer */}
            <Card className="cyber-card mt-8 animate-fade-in-up">
              <CardContent className="p-6">
                <h3 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Legal Disclaimer
                </h3>
                <div className="text-sm text-gray-300 space-y-2">
                  <p>
                    C.A.R.E.N.™ provides technology to connect users with independent attorneys. We do not provide legal advice.
                  </p>
                  <p>
                    All attorneys in our network are independently licensed professionals. Communication through our platform 
                    does not establish an attorney-client relationship until formally agreed upon by both parties.
                  </p>
                  <p>
                    Emergency situations requiring immediate legal assistance should contact emergency services or your local 
                    public defender's office directly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Floating Attorney Recruitment Button */}
      <FloatingAttorneyButton />
    </div>
    </MobileResponsiveLayout>
  );
}