import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Shield, Phone, Bluetooth, MapPin, CreditCard, AlertTriangle, PlayCircle } from 'lucide-react';

// Import modular hooks (these would be imported from modules once fully integrated)
// import { useAuth } from '../../../modules/auth/frontend/hooks/useAuth';
// import { useEmergency } from '../../../modules/emergency/frontend/hooks/useEmergency';
// import { useVoiceCommands } from '../../../modules/voice/frontend/hooks/useVoiceCommands';
// import { useSubscription } from '../../../modules/subscription/frontend/hooks/useSubscription';

import { eventBus } from '../core/EventBus';

// Simulated module status for demonstration
const moduleStatus = {
  auth: { loaded: true, version: '1.0.0', status: 'active' },
  emergency: { loaded: true, version: '1.0.0', status: 'active' },
  voice: { loaded: true, version: '1.0.0', status: 'active' },
  subscription: { loaded: true, version: '1.0.0', status: 'active' },
  bluetooth: { loaded: true, version: '1.0.0', status: 'active' },
  recording: { loaded: true, version: '1.0.0', status: 'active' },
  legal: { loaded: true, version: '1.0.0', status: 'active' },
  location: { loaded: true, version: '1.0.0', status: 'active' }
};

export function ModularDemonstration() {
  const [eventLog, setEventLog] = useState<any[]>([]);
  const [activeModules, setActiveModules] = useState<string[]>([]);

  // Subscribe to all events for demonstration
  useEffect(() => {
    const handleEvent = (event: any) => {
      setEventLog(prev => [event, ...prev.slice(0, 19)]); // Keep last 20 events
      console.log('Event Bus Event:', event);
    };

    // Subscribe to all event patterns for demonstration
    const eventPatterns = [
      'auth.*',
      'emergency.*', 
      'voice.*',
      'subscription.*',
      'bluetooth.*',
      'recording.*',
      'legal.*',
      'location.*'
    ];

    eventPatterns.forEach(pattern => {
      eventBus.subscribe(pattern, handleEvent);
    });

    return () => {
      eventPatterns.forEach(pattern => {
        eventBus.unsubscribe(pattern, handleEvent);
      });
    };
  }, []);

  // Demo functions to trigger module interactions
  const demoAuthLogout = () => {
    eventBus.emit({
      type: 'auth.logout.started',
      module: '@caren/auth',
      payload: { demo: true, timestamp: Date.now() }
    });
  };

  const demoEmergencyActivation = () => {
    eventBus.emit({
      type: 'emergency.activate',
      module: '@caren/emergency',
      payload: { level: 'high', trigger: 'demo', timestamp: Date.now() }
    });
  };

  const demoVoiceCommand = () => {
    eventBus.emit({
      type: 'voice.command.recognized',
      module: '@caren/voice',
      payload: { command: 'start recording', confidence: 0.95, timestamp: Date.now() }
    });
  };

  const demoSubscriptionUpgrade = () => {
    eventBus.emit({
      type: 'subscription.plan.selected',
      module: '@caren/subscription',
      payload: { planId: 'premium', timestamp: Date.now() }
    });
  };

  const demoBluetoothConnection = () => {
    eventBus.emit({
      type: 'bluetooth.device.connected',
      module: '@caren/bluetooth',
      payload: { deviceId: 'demo-device', deviceName: 'CarPlay System', timestamp: Date.now() }
    });
  };

  const demoLocationUpdate = () => {
    eventBus.emit({
      type: 'location.coordinates.updated',
      module: '@caren/location',
      payload: { lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA', timestamp: Date.now() }
    });
  };

  const clearEventLog = () => {
    setEventLog([]);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-cyan-400" />
            C.A.R.E.N. Modular Architecture Demonstration
          </CardTitle>
          <CardDescription className="text-gray-300">
            Live demonstration of the modular system with real-time event communication between modules
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Status Panel */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Module Status
            </CardTitle>
            <CardDescription className="text-gray-300">
              Current status of all loaded modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(moduleStatus).map(([moduleName, status]) => (
              <div key={moduleName} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium capitalize">{moduleName} Module</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-gray-300 border-gray-600">
                    v{status.version}
                  </Badge>
                  <Badge className="bg-green-600 text-white">
                    {status.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Module Actions Panel */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Module Actions
            </CardTitle>
            <CardDescription className="text-gray-300">
              Trigger interactions between modules to see event communication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={demoAuthLogout}
              className="w-full bg-red-600 hover:bg-red-700 flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Trigger Auth Logout
            </Button>
            
            <Button 
              onClick={demoEmergencyActivation}
              className="w-full bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Activate Emergency
            </Button>
            
            <Button 
              onClick={demoVoiceCommand}
              className="w-full bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Voice Command
            </Button>
            
            <Button 
              onClick={demoSubscriptionUpgrade}
              className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Plan Selection
            </Button>
            
            <Button 
              onClick={demoBluetoothConnection}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Bluetooth className="w-4 h-4" />
              Bluetooth Connect
            </Button>
            
            <Button 
              onClick={demoLocationUpdate}
              className="w-full bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Location Update
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Event Log Panel */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Event Bus Communication Log</CardTitle>
            <CardDescription className="text-gray-300">
              Real-time events flowing between modules via the Event Bus
            </CardDescription>
          </div>
          <Button 
            onClick={clearEventLog}
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Clear Log
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-800/50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {eventLog.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No events yet. Trigger some module actions above to see real-time communication.
              </div>
            ) : (
              <div className="space-y-2">
                {eventLog.map((event, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-900/50 rounded border border-gray-700"
                  >
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-gray-700 text-gray-200 text-xs">
                          {event.module}
                        </Badge>
                        <span className="text-cyan-400 font-mono text-sm">
                          {event.type}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(event.payload?.timestamp || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm font-mono">
                        {JSON.stringify(event.payload, null, 2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Benefits */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Modular Architecture Benefits</CardTitle>
          <CardDescription className="text-gray-300">
            Key advantages of the new modular system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-green-400 font-semibold mb-2">Independent Development</h4>
              <p className="text-gray-300 text-sm">
                Each module can be developed, tested, and deployed independently without affecting others.
              </p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-blue-400 font-semibold mb-2">Event-Driven Communication</h4>
              <p className="text-gray-300 text-sm">
                Modules communicate via events, ensuring loose coupling and better maintainability.
              </p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-purple-400 font-semibold mb-2">Subscription-Based Loading</h4>
              <p className="text-gray-300 text-sm">
                Load only the modules users need based on their subscription plan.
              </p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-cyan-400 font-semibold mb-2">Better Testing</h4>
              <p className="text-gray-300 text-sm">
                Each module has its own test suite and can be tested in isolation.
              </p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-orange-400 font-semibold mb-2">Easier Maintenance</h4>
              <p className="text-gray-300 text-sm">
                Clear separation of concerns makes debugging and updates much easier.
              </p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-red-400 font-semibold mb-2">Scalability</h4>
              <p className="text-gray-300 text-sm">
                Add new features as independent modules without touching existing code.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}