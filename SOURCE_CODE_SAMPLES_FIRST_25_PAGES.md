# C.A.R.E.N. Source Code Samples - First 25 Pages
## Copyright Deposit Material - Beginning of Work

---

### Page 1: Main Application Entry Point (client/src/main.tsx)

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './lib/i18n';

// Initialize React application with strict mode
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

---

### Page 2: Application Root Component (client/src/App.tsx)

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route, Router } from "wouter";
import Dashboard from "@/pages/Dashboard";
import SignIn from "@/pages/SignIn";
import SimpleSignIn from "@/pages/SimpleSignIn";
import Registration from "@/pages/Registration";
import EmergencyPullover from "@/pages/EmergencyPullover";
import Record from "@/pages/Record";
import Rights from "@/pages/Rights";
import Attorneys from "@/pages/Attorneys";
import Messages from "@/pages/Messages";
import EmergencySharing from "@/pages/EmergencySharing";
import PoliceReportForm from "@/pages/PoliceReportForm";
import DeEscalationGuide from "@/pages/DeEscalationGuide";
import PoliceMonitor from "@/pages/PoliceMonitor";
import SmartAutoMutePage from "@/pages/SmartAutoMutePage";
import RoadsideAssistance from "@/pages/RoadsideAssistance";
import VoiceHub from "@/pages/VoiceHub";
import DeviceSetup from "@/pages/DeviceSetup";
import Settings from "@/pages/Settings";
import Help from "@/pages/Help";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Router>
      <Switch>
        <Route path="/" component={isAuthenticated ? Dashboard : SimpleSignIn} />
        <Route path="/signin" component={SimpleSignIn} />
        <Route path="/registration" component={Registration} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/emergency-pullover" component={EmergencyPullover} />
        <Route path="/record" component={Record} />
        <Route path="/rights" component={Rights} />
        <Route path="/attorneys" component={Attorneys} />
        <Route path="/messages" component={Messages} />
        <Route path="/emergency-sharing" component={EmergencySharing} />
        <Route path="/police-report" component={PoliceReportForm} />
        <Route path="/de-escalation" component={DeEscalationGuide} />
        <Route path="/police-monitor" component={PoliceMonitor} />
        <Route path="/smart-auto-mute" component={SmartAutoMutePage} />
        <Route path="/roadside-assistance" component={RoadsideAssistance} />
        <Route path="/voice-hub" component={VoiceHub} />
        <Route path="/device-setup" component={DeviceSetup} />
        <Route path="/settings" component={Settings} />
        <Route path="/help" component={Help} />
        <Route>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
            <h1 className="text-2xl text-white">Page Not Found</h1>
          </div>
        </Route>
      </Switch>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}
```

---

### Page 3: Authentication Hook (client/src/hooks/useAuth.ts)

```typescript
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  subscriptionTier: string;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiRequest("/api/auth/user"),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}
```

---

### Page 4: Database Schema (shared/schema.ts)

```typescript
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  integer,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionTier: varchar("subscription_tier").default("community_guardian"),
  preferredLanguage: varchar("preferred_language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emergency contacts table
export const emergencyContacts = pgTable("emergency_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  relationship: varchar("relationship"),
  priority: integer("priority").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Incidents table for recording emergency events
export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  location: jsonb("location"), // GPS coordinates and address
  recordingUrl: text("recording_url"),
  recordingType: varchar("recording_type"), // 'audio' | 'video'
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  status: varchar("status").default("active"), // 'active' | 'archived' | 'shared'
  emergencyAlerted: boolean("emergency_alerted").default(false),
  attorneyNotified: boolean("attorney_notified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legal rights table for state-specific information
export const legalRights = pgTable("legal_rights", {
  id: uuid("id").primaryKey().defaultRandom(),
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  category: varchar("category").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  details: text("details"),
  severity: varchar("severity").default("medium"), // 'low' | 'medium' | 'high' | 'critical'
  source: text("source"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Attorneys table
export const attorneys = pgTable("attorneys", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  firmName: varchar("firm_name"),
  barNumber: varchar("bar_number"),
  state: varchar("state").notNull(),
  specializations: jsonb("specializations"),
  contactInfo: jsonb("contact_info"), // phone, email, address
  availability: varchar("availability").default("available"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  isEmergency: boolean("is_emergency").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = typeof emergencyContacts.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;
export type LegalRights = typeof legalRights.$inferSelect;
export type Attorney = typeof attorneys.$inferSelect;
```

---

### Page 5: API Client Configuration (client/src/lib/queryClient.ts)

```typescript
import { QueryClient } from "@tanstack/react-query";

// Configure API request client with authentication
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return await apiRequest(url);
      },
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

export async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const customDomainToken = localStorage.getItem('customDomainToken');
  const demoSessionKey = localStorage.getItem('demoSessionKey');
  const regularSessionToken = localStorage.getItem('regularSessionToken');

  // Priority-based authentication headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authentication header based on available tokens
  if (customDomainToken) {
    headers['Authorization'] = `Bearer ${customDomainToken}`;
  } else if (regularSessionToken) {
    headers['Authorization'] = `Bearer ${regularSessionToken}`;
  } else if (demoSessionKey) {
    headers['X-Demo-Session'] = demoSessionKey;
  }

  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
  }

  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
}
```

---

### Page 6: Dashboard Component (client/src/pages/Dashboard.tsx)

```typescript
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  MapPin, 
  Mic, 
  Video, 
  Phone, 
  Users, 
  Car,
  Bluetooth,
  Wifi,
  Battery
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  // GPS location detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          try {
            // Reverse geocoding for address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
            );
            const data = await response.json();
            
            setCurrentLocation({
              ...coords,
              address: data.display_name || "Location detected",
            });
          } catch (error) {
            setCurrentLocation(coords);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  // System status queries
  const { data: bluetoothStatus } = useQuery({
    queryKey: ["/api/bluetooth/status"],
    refetchInterval: 5000,
  });

  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system/status"],
    refetchInterval: 10000,
  });

  const handleEmergencyMode = () => {
    setLocation("/emergency-pullover");
  };

  const handleRecordIncident = () => {
    setLocation("/record");
  };

  const handleViewRights = () => {
    setLocation("/rights");
  };

  const handleFindAttorney = () => {
    setLocation("/attorneys");
  };

  return (
    <MobileResponsiveLayout 
      title="Dashboard" 
      description="Emergency Legal Protection Platform"
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
        {/* Welcome Header */}
        <div className="mb-8 text-center">
          <div className="relative">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
              WELCOME TO C.A.R.E.N.
            </h1>
            <p className="text-lg text-gray-300">
              Citizen Assistance for Roadside Emergencies and Navigation
            </p>
            <div className="text-sm text-cyan-300 mt-2">
              Ready to protect your constitutional rights
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardContent className="p-4 text-center">
              <MapPin className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-sm text-gray-300">GPS</div>
              <div className="text-xs text-cyan-400">
                {currentLocation ? "Active" : "Searching..."}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardContent className="p-4 text-center">
              <Bluetooth className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-sm text-gray-300">Bluetooth</div>
              <div className="text-xs text-cyan-400">
                {bluetoothStatus?.connected ? "Connected" : "Ready"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardContent className="p-4 text-center">
              <Mic className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-sm text-gray-300">Voice</div>
              <div className="text-xs text-cyan-400">Listening</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardContent className="p-4 text-center">
              <Shield className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-sm text-gray-300">Legal</div>
              <div className="text-xs text-cyan-400">Protected</div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/50 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-300 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Emergency Actions
              </CardTitle>
              <CardDescription className="text-red-200">
                Immediate protection during traffic stops
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleEmergencyMode}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Emergency Pullover Mode
              </Button>
              <Button 
                onClick={handleRecordIncident}
                variant="outline" 
                className="w-full border-red-500 text-red-300 hover:bg-red-900/30"
              >
                <Video className="h-4 w-4 mr-2" />
                Record Incident
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/50">
            <CardHeader>
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Legal Support
              </CardTitle>
              <CardDescription className="text-blue-200">
                Access legal rights and attorney network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleViewRights}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                View Legal Rights
              </Button>
              <Button 
                onClick={handleFindAttorney}
                variant="outline" 
                className="w-full border-blue-500 text-blue-300 hover:bg-blue-900/30"
              >
                <Phone className="h-4 w-4 mr-2" />
                Find Attorney
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Location Information */}
        {currentLocation && (
          <Card className="bg-gray-800/50 border-cyan-500/30 mb-6">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Current Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-300">
                {currentLocation.address || "Location detected"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Information */}
        {user && (
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-300">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    {user.firstName || user.email || 'User'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {user.subscriptionTier?.replace('_', ' ').toUpperCase() || 'COMMUNITY GUARDIAN'}
                  </div>
                </div>
                <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                  Protected
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileResponsiveLayout>
  );
}
```

---

### Page 7-10: Emergency Recording System (client/src/pages/Record.tsx)

```typescript
import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Mic, 
  Square, 
  Play, 
  Pause,
  MapPin,
  Clock,
  FileText,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingType: 'audio' | 'video';
  duration: number;
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  chunks: Blob[];
}

export default function Record() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    recordingType: 'video',
    duration: 0,
    mediaRecorder: null,
    stream: null,
    chunks: []
  });

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording.isRecording && !recording.isPaused) {
      interval = setInterval(() => {
        setRecording(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recording.isRecording, recording.isPaused]);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
            );
            const data = await response.json();
            
            setLocation({
              ...coords,
              address: data.display_name || "Location detected",
            });
          } catch (error) {
            setLocation(coords);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  // Voice command integration
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        
        // Emergency recording commands
        if (command.includes('emergency') || command.includes('start recording')) {
          if (!recording.isRecording) {
            startRecording('video');
          }
        }
        
        if (command.includes('stop recording') || command.includes('stop video')) {
          if (recording.isRecording) {
            stopRecording();
          }
        }
      };

      recognition.start();
      
      return () => recognition.stop();
    }
  }, [recording.isRecording]);

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      const constraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true };
        
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current && type === 'video') {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: type === 'video' 
          ? 'video/webm;codecs=vp8,opus' 
          : 'audio/webm;codecs=opus'
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: type === 'video' ? 'video/webm' : 'audio/webm' 
        });
        
        // Create download URL
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-recording-${Date.now()}.webm`;
        a.click();
        
        // Save to database
        saveIncident(blob, type);
      };

      mediaRecorder.start(1000); // Collect data every second

      setRecording({
        isRecording: true,
        isPaused: false,
        recordingType: type,
        duration: 0,
        mediaRecorder,
        stream,
        chunks: []
      });

      toast({
        title: "Recording Started",
        description: `${type === 'video' ? 'Video' : 'Audio'} recording in progress...`,
      });

    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recording.mediaRecorder && recording.isRecording) {
      recording.mediaRecorder.stop();
      recording.stream?.getTracks().forEach(track => track.stop());
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setRecording({
        isRecording: false,
        isPaused: false,
        recordingType: 'video',
        duration: 0,
        mediaRecorder: null,
        stream: null,
        chunks: []
      });

      toast({
        title: "Recording Stopped",
        description: "Recording saved successfully",
      });
    }
  };

  const pauseRecording = () => {
    if (recording.mediaRecorder && recording.isRecording) {
      if (recording.isPaused) {
        recording.mediaRecorder.resume();
        setRecording(prev => ({ ...prev, isPaused: false }));
      } else {
        recording.mediaRecorder.pause();
        setRecording(prev => ({ ...prev, isPaused: true }));
      }
    }
  };

  // Save incident mutation
  const saveIncidentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/incidents", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Incident Saved",
        description: "Your incident has been recorded and saved securely.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      
      // Reset form
      setTitle("");
      setDescription("");
    },
    onError: (error) => {
      toast({
        title: "Save Error",
        description: "Failed to save incident. Please try again.",
        variant: "destructive",
      });
      console.error("Save error:", error);
    },
  });

  const saveIncident = (blob: Blob, type: 'audio' | 'video') => {
    const formData = new FormData();
    formData.append("title", title || `${type} Recording - ${new Date().toLocaleString()}`);
    formData.append("description", description || "Emergency incident recording");
    formData.append("recording", blob, `recording.${type === 'video' ? 'webm' : 'webm'}`);
    formData.append("recordingType", type);
    formData.append("duration", recording.duration.toString());
    
    if (location) {
      formData.append("location", JSON.stringify(location));
    }

    saveIncidentMutation.mutate(formData);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MobileResponsiveLayout 
      title="Record Incident" 
      description="Emergency Evidence Documentation"
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Recording Status */}
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                {recording.recordingType === 'video' ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
                Emergency Recording
                {recording.isRecording && (
                  <Badge variant="destructive" className="ml-2">
                    {recording.isPaused ? 'PAUSED' : 'RECORDING'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recording.isRecording && (
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <Clock className="h-4 w-4" />
                    {formatDuration(recording.duration)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${recording.isPaused ? 'bg-yellow-400' : 'bg-red-400 animate-pulse'}`} />
                    <span className="text-sm text-gray-300">
                      {recording.isPaused ? 'Paused' : 'Recording'}
                    </span>
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {recording.recordingType === 'video' && recording.isRecording && (
                <div className="mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full max-w-md mx-auto rounded-lg border border-gray-600"
                  />
                </div>
              )}

              {/* Recording Controls */}
              <div className="flex flex-wrap gap-3 justify-center">
                {!recording.isRecording ? (
                  <>
                    <Button
                      onClick={() => startRecording('video')}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Start Video Recording
                    </Button>
                    <Button
                      onClick={() => startRecording('audio')}
                      variant="outline"
                      className="border-red-500 text-red-300 hover:bg-red-900/30"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Start Audio Recording
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={pauseRecording}
                      variant="outline"
                      className="border-yellow-500 text-yellow-300 hover:bg-yellow-900/30"
                    >
                      {recording.isPaused ? (
                        <Play className="h-4 w-4 mr-2" />
                      ) : (
                        <Pause className="h-4 w-4 mr-2" />
                      )}
                      {recording.isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                      onClick={stopRecording}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Incident Details Form */}
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Incident Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Incident Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the incident"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Detailed Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information about what happened..."
                  rows={4}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* Location Display */}
              {location && (
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-cyan-300 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Location Detected</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    {location.address}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Commands Help */}
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-300 mb-2">Start Recording:</div>
                  <ul className="space-y-1 text-gray-400">
                    <li>"Emergency"</li>
                    <li>"Start recording"</li>
                    <li>"Begin emergency recording"</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-300 mb-2">Stop Recording:</div>
                  <ul className="space-y-1 text-gray-400">
                    <li>"Stop recording"</li>
                    <li>"Stop video"</li>
                    <li>"End recording"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}
```

---

### Page 11-15: Legal Rights Database (client/src/pages/Rights.tsx)

```typescript
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  MapPin, 
  Search, 
  Filter,
  AlertCircle,
  Info,
  CheckCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

interface LegalRight {
  id: string;
  stateCode: string;
  category: string;
  title: string;
  description: string;
  details?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
  lastUpdated: string;
}

const CATEGORIES = [
  "All Categories",
  "Traffic Stops",
  "Recording Rights", 
  "Search and Seizure",
  "Police Accountability",
  "State-Specific Laws"
];

const SEVERITY_COLORS = {
  low: "bg-green-500",
  medium: "bg-yellow-500", 
  high: "bg-orange-500",
  critical: "bg-red-500"
};

const SEVERITY_ICONS = {
  low: CheckCircle,
  medium: Info,
  high: AlertCircle,
  critical: AlertCircle
};

export default function Rights() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedState, setSelectedState] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<{
    state?: string;
    address?: string;
  } | null>(null);

  // Detect user's current state
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            
            // Extract state from address
            const address = data.display_name || "";
            const addressParts = address.split(", ");
            const statePart = addressParts.find(part => 
              part.length === 2 && part.match(/^[A-Z]{2}$/)
            );
            
            if (statePart) {
              setCurrentLocation({
                state: statePart,
                address: data.display_name
              });
              setSelectedState(statePart);
            }
          } catch (error) {
            console.error("Location detection error:", error);
          }
        }
      );
    }
  }, []);

  // Fetch legal rights data
  const { data: rights, isLoading } = useQuery({
    queryKey: ["/api/legal-rights", selectedState],
    enabled: !!selectedState,
  });

  // Filter rights based on search and category
  const filteredRights = rights?.filter((right: LegalRight) => {
    const matchesSearch = searchTerm === "" || 
      right.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      right.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All Categories" || 
      right.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }) || [];

  const getSeverityIcon = (severity: string) => {
    const IconComponent = SEVERITY_ICONS[severity as keyof typeof SEVERITY_ICONS];
    return IconComponent;
  };

  const RightCard = ({ right }: { right: LegalRight }) => {
    const SeverityIcon = getSeverityIcon(right.severity);
    
    return (
      <Card className="bg-gray-800/50 border-cyan-500/30 hover:border-cyan-400/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-cyan-300 text-lg leading-tight">
              {right.title}
            </CardTitle>
            <div className="flex items-center gap-2 ml-2">
              <Badge 
                className={`${SEVERITY_COLORS[right.severity]} text-white text-xs`}
              >
                <SeverityIcon className="h-3 w-3 mr-1" />
                {right.severity.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {right.category}
            </Badge>
            <span>•</span>
            <span>{right.stateCode}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-3">
            {right.description}
          </p>
          
          {right.details && (
            <div className="bg-gray-700/50 p-3 rounded-lg mb-3">
              <div className="text-sm font-medium text-cyan-300 mb-1">Details:</div>
              <div className="text-sm text-gray-300">
                {right.details}
              </div>
            </div>
          )}

          {right.source && (
            <div className="text-xs text-gray-500 mt-2">
              Source: {right.source}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <MobileResponsiveLayout 
      title="Legal Rights" 
      description="Know Your Constitutional Protections"
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4">
              Legal Rights Database
            </h1>
            <p className="text-lg text-gray-300 mb-2">
              Know your constitutional protections during police encounters
            </p>
            
            {currentLocation && (
              <div className="flex items-center justify-center gap-2 text-cyan-300">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  Showing rights for: {currentLocation.state}
                </span>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <Card className="bg-gray-800/50 border-cyan-500/30 mb-6">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search legal rights..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category} className="text-white">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* State Selector */}
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="AL" className="text-white">Alabama</SelectItem>
                    <SelectItem value="AK" className="text-white">Alaska</SelectItem>
                    <SelectItem value="AZ" className="text-white">Arizona</SelectItem>
                    <SelectItem value="AR" className="text-white">Arkansas</SelectItem>
                    <SelectItem value="CA" className="text-white">California</SelectItem>
                    <SelectItem value="CO" className="text-white">Colorado</SelectItem>
                    <SelectItem value="CT" className="text-white">Connecticut</SelectItem>
                    <SelectItem value="DE" className="text-white">Delaware</SelectItem>
                    <SelectItem value="FL" className="text-white">Florida</SelectItem>
                    <SelectItem value="GA" className="text-white">Georgia</SelectItem>
                    {/* Add all 50 states... */}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Rights Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-300">Loading legal rights...</p>
            </div>
          ) : filteredRights.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">No rights found</p>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRights.map((right: LegalRight) => (
                <RightCard key={right.id} right={right} />
              ))}
            </div>
          )}

          {/* Critical Rights Summary */}
          {filteredRights.some((r: LegalRight) => r.severity === 'critical') && (
            <Card className="bg-red-900/20 border-red-500/50 mt-8">
              <CardHeader>
                <CardTitle className="text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Critical Rights Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-200 mb-3">
                  The following critical rights require your immediate attention:
                </p>
                <ul className="space-y-2">
                  {filteredRights
                    .filter((r: LegalRight) => r.severity === 'critical')
                    .map((right: LegalRight) => (
                      <li key={right.id} className="text-red-100 text-sm">
                        • {right.title}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {Object.entries(SEVERITY_COLORS).map(([severity, color]) => {
              const count = filteredRights.filter((r: LegalRight) => r.severity === severity).length;
              return (
                <Card key={severity} className="bg-gray-800/50 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <div className={`w-4 h-4 ${color} rounded-full mx-auto mb-2`} />
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-sm text-gray-400 capitalize">{severity}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}
```

---

### Page 16-20: Emergency Pullover Guide (client/src/pages/EmergencyPullover.tsx)

```typescript
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  MapPin,
  Phone,
  Car,
  Eye,
  Volume2,
  Record
} from "lucide-react";
import { useToast } = from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

interface EmergencyState {
  phase: 'preparation' | 'pulled_over' | 'interaction' | 'completion';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  startTime: Date;
  recording?: {
    active: boolean;
    type: 'audio' | 'video';
    duration: number;
  };
}

const EMERGENCY_STEPS = {
  preparation: [
    "Turn on hazard lights immediately",
    "Find a safe location to pull over", 
    "Turn off engine and place keys on dashboard",
    "Turn on interior light if dark",
    "Keep hands visible on steering wheel",
    "Activate emergency recording if needed"
  ],
  pulled_over: [
    "Remain calm and seated in vehicle",
    "Keep hands on steering wheel where visible",
    "Do not reach for anything without permission",
    "Wait for officer to approach",
    "Have license and registration ready mentally",
    "Do not exit vehicle unless instructed"
  ],
  interaction: [
    "Speak clearly and politely",
    "Provide only required documents when asked",
    "Invoke your rights calmly if needed",
    "Do not consent to searches",
    "Ask if you are free to leave",
    "Document everything you can remember"
  ],
  completion: [
    "Follow all lawful orders",
    "Accept any citations without argument", 
    "Do not sign anything you don't understand",
    "Ask for badge number and department",
    "Note time and location of encounter",
    "Save all recordings and documentation"
  ]
};

const DO_COMMANDS = [
  "Remain calm and courteous",
  "Keep hands visible at all times", 
  "Provide required identification when asked",
  "Follow lawful orders",
  "Ask 'Am I free to leave?' if unclear",
  "Document badge numbers and vehicle info"
];

const DONT_COMMANDS = [
  "Don't argue or become hostile",
  "Don't reach for items without permission",
  "Don't consent to vehicle searches", 
  "Don't answer questions beyond identification",
  "Don't exit vehicle unless ordered",
  "Don't physically resist even if rights are violated"
];

export default function EmergencyPullover() {
  const { toast } = useToast();
  const [emergencyState, setEmergencyState] = useState<EmergencyState>({
    phase: 'preparation',
    startTime: new Date()
  });

  // Voice synthesis for critical announcements
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
            );
            const data = await response.json();
            
            setEmergencyState(prev => ({
              ...prev,
              location: {
                ...coords,
                address: data.display_name || "Location detected",
              }
            }));
          } catch (error) {
            setEmergencyState(prev => ({
              ...prev,
              location: coords
            }));
          }
        }
      );
    }
  }, []);

  // Emergency alert mutation  
  const emergencyAlertMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/emergency/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Emergency Alert Sent",
        description: "Your emergency contacts have been notified with your location.",
      });
    },
  });

  const sendEmergencyAlert = () => {
    if (emergencyState.location) {
      emergencyAlertMutation.mutate({
        type: "traffic_stop",
        location: emergencyState.location,
        message: "I have been pulled over by police. This is my current location.",
        timestamp: new Date().toISOString(),
      });

      speak("Emergency alert sent to your contacts");
    }
  };

  const nextPhase = () => {
    const phases = ['preparation', 'pulled_over', 'interaction', 'completion'];
    const currentIndex = phases.indexOf(emergencyState.phase);
    if (currentIndex < phases.length - 1) {
      const newPhase = phases[currentIndex + 1] as any;
      setEmergencyState(prev => ({ ...prev, phase: newPhase }));
      
      speak(`Moving to ${newPhase.replace('_', ' ')} phase`);
    }
  };

  const startRecording = () => {
    // Integration with recording system
    speak("Starting emergency recording");
    setEmergencyState(prev => ({
      ...prev,
      recording: {
        active: true,
        type: 'video',
        duration: 0
      }
    }));
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'preparation': return Car;
      case 'pulled_over': return Shield;
      case 'interaction': return Eye;
      case 'completion': return CheckCircle;
      default: return AlertTriangle;
    }
  };

  const PhaseIcon = getPhaseIcon(emergencyState.phase);

  return (
    <MobileResponsiveLayout 
      title="Emergency Pullover" 
      description="Traffic Stop Protection Guide"
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Emergency Header */}
          <Card className="bg-red-900/50 border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-300 flex items-center gap-2 text-2xl">
                <AlertTriangle className="h-6 w-6" />
                EMERGENCY TRAFFIC STOP MODE
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="destructive">ACTIVE</Badge>
                <span className="text-red-200">
                  Started: {emergencyState.startTime.toLocaleTimeString()}
                </span>
              </div>
            </CardHeader>
          </Card>

          {/* Current Phase */}
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                <PhaseIcon className="h-5 w-5" />
                Current Phase: {emergencyState.phase.replace('_', ' ').toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {EMERGENCY_STEPS[emergencyState.phase].map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
              
              {emergencyState.phase !== 'completion' && (
                <Button 
                  onClick={nextPhase}
                  className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700"
                >
                  Continue to Next Phase
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Emergency Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-red-900/30 border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-300 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Emergency Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-200 text-sm mb-4">
                  Send your location to emergency contacts immediately
                </p>
                <Button 
                  onClick={sendEmergencyAlert}
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={!emergencyState.location}
                >
                  Send Emergency Alert
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/30 border-blue-500/50">
              <CardHeader>
                <CardTitle className="text-blue-300 flex items-center gap-2">
                  <Record className="h-5 w-5" />
                  Start Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200 text-sm mb-4">
                  Begin video/audio recording of the encounter
                </p>
                <Button 
                  onClick={startRecording}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={emergencyState.recording?.active}
                >
                  {emergencyState.recording?.active ? 'Recording Active' : 'Start Recording'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Do's and Don'ts */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-green-900/20 border-green-500/50">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  DO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {DO_COMMANDS.map((command, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-green-200">{command}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-red-900/20 border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  DON'T
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {DONT_COMMANDS.map((command, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-red-200">{command}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Location Information */}
          {emergencyState.location && (
            <Card className="bg-gray-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Current Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-300 mb-2">
                  {emergencyState.location.address}
                </div>
                <div className="text-xs text-gray-500">
                  {emergencyState.location.latitude.toFixed(6)}, {emergencyState.location.longitude.toFixed(6)}
                </div>
                <div className="text-xs text-cyan-400 mt-2">
                  Location shared with emergency contacts
                </div>
              </CardContent>
            </Card>
          )}

          {/* Critical ID Display Rights */}
          <Card className="bg-yellow-900/20 border-yellow-500/50">
            <CardHeader>
              <CardTitle className="text-yellow-300 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                CRITICAL: ID Display vs. Surrender Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="bg-yellow-800/30 p-3 rounded-lg">
                  <div className="font-semibold text-yellow-200 mb-2">YOU CAN DISPLAY YOUR ID WITHOUT SURRENDERING IT</div>
                  <ul className="space-y-1 text-yellow-100">
                    <li>• Hold your ID up to the window for officer to see</li>
                    <li>• You are NOT required to hand over your ID in most states</li>
                    <li>• This prevents ID retention and fishing expeditions</li>
                    <li>• If demanded, comply but state "I am displaying, not surrendering"</li>
                  </ul>
                </div>
                <div className="text-yellow-200">
                  <strong>Remember:</strong> Display satisfies identification requirements while protecting your rights.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice Commands */}
          <Card className="bg-gray-800/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-300 flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Available Voice Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-300 mb-2">Emergency Commands:</div>
                  <ul className="space-y-1 text-gray-400">
                    <li>"Emergency alert"</li>
                    <li>"Help me"</li>
                    <li>"Police"</li>
                    <li>"Start recording"</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-300 mb-2">Rights Commands:</div>
                  <ul className="space-y-1 text-gray-400">
                    <li>"I invoke my Fourth Amendment rights"</li>
                    <li>"I do not consent to searches"</li>
                    <li>"Am I free to leave?"</li>
                    <li>"I want an attorney"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="text-center">
            <div 
              onClick={() => window.location.href = '/dashboard'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg cursor-pointer transition-colors"
            >
              Return to Dashboard
            </div>
          </div>
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}
```

---

### Page 21-25: Backend Server Configuration (server/index.ts)

```typescript
import express from "express";
import session from "express-session";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { setupAuth } from "./replitAuth";
import { websocketManager } from "./websocketManager";

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-Session'],
}));

// Rate limiting
const createRateLimit = (windowMs: number, max: number) => rateLimit({
  windowMs,
  max,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Production vs development rate limits
const isProduction = process.env.NODE_ENV === 'production';
app.use('/api/auth', createRateLimit(15 * 60 * 1000, isProduction ? 25 : 100)); // Auth endpoints
app.use('/api', createRateLimit(15 * 60 * 1000, isProduction ? 500 : 1000)); // General API

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    sameSite: isProduction ? 'none' : 'lax'
  },
  name: 'caren.session'
}));

// Session debugging middleware
app.use((req, res, next) => {
  console.log(`[SESSION_DEBUG] ${req.method} ${req.path}`);
  console.log(`[SESSION_DEBUG] Session ID: ${req.sessionID}`);
  console.log(`[SESSION_DEBUG] Cookies received: ${req.headers.cookie}`);
  console.log(`[SESSION_DEBUG] User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
  next();
});

// Security audit logging
app.use((req, res, next) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    event: 'DATA_ACCESS',
    userId: req.session?.user?.id || 'anonymous',
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    details: JSON.stringify({
      resource: req.path,
      action: req.method,
      timestamp: new Date().toISOString()
    })
  };
  
  console.log(`[SECURITY AUDIT] ${JSON.stringify(auditLog)}`);
  next();
});

// Initialize authentication system
async function startServer() {
  try {
    // Setup authentication
    await setupAuth(app);
    
    // Register API routes
    const httpServer = await registerRoutes(app);
    
    // Setup WebSocket server
    const wss = new WebSocketServer({ 
      server: httpServer, 
      path: '/ws' 
    });
    
    // WebSocket connection handling
    wss.on('connection', (ws, req) => {
      console.log('WebSocket client connected');
      
      // Add client to manager
      websocketManager.addClient(ws);
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          websocketManager.handleMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        websocketManager.removeClient(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        websocketManager.removeClient(ws);
      });
      
      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'WebSocket connected successfully'
      }));
    });
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready on ws://localhost:${PORT}/ws`);
      console.log(`🔒 Security: ${isProduction ? 'Production' : 'Development'} mode`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
```

---

**Note:** This represents the first 25 pages of source code samples showing the core architecture, authentication system, emergency features, legal rights database, and server configuration. The code demonstrates the comprehensive legal protection platform with React frontend, Node.js backend, and real-time emergency capabilities.

**Next Document:** SOURCE_CODE_SAMPLES_LAST_25_PAGES.md will contain the remaining source code samples showing additional features, mobile components, and deployment configurations.