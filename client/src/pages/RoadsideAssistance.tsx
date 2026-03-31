import { useState, useEffect } from "react";
import { Car, Phone, MapPin, Clock, Shield, Wrench, Truck, Battery, Fuel, Key } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RoadsideProvider {
  id: string;
  name: string;
  phone: string;
  type: 'aaa' | 'insurance' | 'manufacturer' | 'independent';
  services: string[];
  coverage: string;
  estimatedTime: string;
  cost: string;
  available24_7: boolean;
  userMember?: boolean;
}

const ROADSIDE_PROVIDERS: RoadsideProvider[] = [
  {
    id: 'aaa',
    name: 'AAA Roadside Assistance',
    phone: '1-800-AAA-HELP',
    type: 'aaa',
    services: ['Towing', 'Jump Start', 'Flat Tire', 'Lockout', 'Fuel Delivery', 'Winching'],
    coverage: 'Nationwide Coverage',
    estimatedTime: '30-45 minutes',
    cost: 'Free for members',
    available24_7: true,
    userMember: true
  },
  {
    id: 'geico',
    name: 'GEICO Emergency Road Service',
    phone: '1-800-424-3426',
    type: 'insurance',
    services: ['Towing', 'Jump Start', 'Flat Tire', 'Lockout'],
    coverage: 'GEICO Policyholders',
    estimatedTime: '45-60 minutes',
    cost: '$19.95/year add-on',
    available24_7: true
  },
  {
    id: 'state-farm',
    name: 'State Farm Roadside Assistance',
    phone: '1-877-SF-CLAIM',
    type: 'insurance',
    services: ['Towing', 'Jump Start', 'Flat Tire', 'Lockout', 'Fuel Delivery'],
    coverage: 'State Farm Customers',
    estimatedTime: '30-60 minutes',
    cost: '$25/year add-on',
    available24_7: true
  },
  {
    id: 'agero',
    name: 'Agero Roadside Assistance',
    phone: '1-800-442-4376',
    type: 'independent',
    services: ['Towing', 'Jump Start', 'Flat Tire', 'Lockout', 'Fuel Delivery', 'Winching'],
    coverage: 'Nationwide Network',
    estimatedTime: '45-75 minutes',
    cost: 'Pay per service',
    available24_7: true
  }
];

const EMERGENCY_SERVICES = [
  {
    name: 'Towing Service',
    description: 'Vehicle transport to repair facility',
    icon: Truck,
    urgency: 'high'
  },
  {
    name: 'Jump Start',
    description: 'Dead battery assistance',
    icon: Battery,
    urgency: 'medium'
  },
  {
    name: 'Flat Tire Change',
    description: 'Tire replacement or repair',
    icon: Wrench,
    urgency: 'medium'
  },
  {
    name: 'Lockout Service',
    description: 'Unlock vehicle doors',
    icon: Key,
    urgency: 'low'
  },
  {
    name: 'Fuel Delivery',
    description: 'Emergency gas delivery',
    icon: Fuel,
    urgency: 'medium'
  }
];

export default function RoadsideAssistance() {
  const { user } = useAuth();
  const { location } = useGeolocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'aaa':
        return Shield;
      case 'insurance':
        return Car;
      case 'manufacturer':
        return Wrench;
      default:
        return Phone;
    }
  };

  const getProviderBadgeColor = (type: string) => {
    switch (type) {
      case 'aaa':
        return 'bg-blue-600';
      case 'insurance':
        return 'bg-green-600';
      case 'manufacturer':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName);
    toast({
      title: "Service Selected",
      description: `Selected ${serviceName} - Choose a provider below`,
    });
  };

  const handleProviderCall = (provider: RoadsideProvider) => {
    setSelectedProvider(provider.id);
    
    const locationInfo = location ? `${location.latitude}, ${location.longitude}` : 'Location unknown';
    
    toast({
      title: "Connecting to Provider",
      description: `Calling ${provider.name} at ${provider.phone}`,
    });

    // In a real app, this would initiate the phone call
    console.log(`Calling ${provider.name} at ${provider.phone} for ${selectedService || 'general assistance'} at location: ${locationInfo}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full" />
      <p className="ml-4 text-cyan-300 text-lg">Acquiring your location...</p>
    </div>
  );

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gray-900">
      
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="cyber-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Roadside Assistance</h1>
                <p className="text-gray-300">Get help when you need it most - AAA and other trusted providers</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Getting location...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Services Selector */}
          <div className="cyber-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">What do you need help with?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {EMERGENCY_SERVICES.map((service) => {
                const IconComponent = service.icon;
                return (
                  <Card 
                    key={service.name}
                    className={`cursor-pointer transition-all duration-200 bg-gray-800/50 border-gray-600 hover:border-cyan-500 ${
                      selectedService === service.name ? 'border-cyan-500 bg-cyan-500/10' : ''
                    }`}
                    onClick={() => handleServiceSelect(service.name)}
                  >
                    <CardContent className="p-4 text-center">
                      <IconComponent className="w-8 h-8 mx-auto mb-3 text-cyan-400" />
                      <div className="text-sm font-medium text-white">{service.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{service.description}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Roadside Providers */}
          <div className="cyber-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Available Providers</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ROADSIDE_PROVIDERS.map((provider) => {
                const IconComponent = getProviderIcon(provider.type);
                return (
                  <Card key={provider.id} className="cyber-card">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getProviderBadgeColor(provider.type)}`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">{provider.name}</CardTitle>
                            <CardDescription className="text-gray-300">{provider.coverage}</CardDescription>
                          </div>
                        </div>
                        {provider.userMember && (
                          <Badge className="bg-green-500 text-white">Member</Badge>
                        )}
                        {provider.available24_7 && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            24/7
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{provider.estimatedTime}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-gray-300">{provider.phone}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-300 mb-2">Services Available:</div>
                        <div className="flex flex-wrap gap-1">
                          {provider.services.map((service) => (
                            <Badge key={service} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Separator className="bg-gray-600" />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-300">Cost:</div>
                          <div className="text-sm text-gray-400">{provider.cost}</div>
                        </div>
                        <Button 
                          onClick={() => handleProviderCall(provider)}
                          className={`bg-blue-600 hover:bg-blue-700 text-white border-0 ${
                            selectedProvider === provider.id ? 'ring-2 ring-cyan-500' : ''
                          }`}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* AAA Membership Information */}
          <div className="cyber-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">AAA Membership Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-2">Basic Membership</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 4 service calls per year</li>
                    <li>• 3-mile towing range</li>
                    <li>• Battery jump-start</li>
                    <li>• Flat tire change</li>
                    <li>• Lockout service</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-600">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-2">Plus Membership</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 4 service calls per year</li>
                    <li>• 100-mile towing range</li>
                    <li>• Free fuel delivery</li>
                    <li>• Winching service</li>
                    <li>• Bicycle roadside assistance</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-600">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-2">Premier Membership</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 6 service calls per year</li>
                    <li>• 200-mile towing range</li>
                    <li>• One-day car rental</li>
                    <li>• Motorcycle coverage</li>
                    <li>• Home lockout service</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
    </MobileResponsiveLayout>
  );
}