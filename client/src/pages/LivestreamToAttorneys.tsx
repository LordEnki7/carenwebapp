import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Send, 
  Settings, 
  Users, 
  Clock,
  Circle,
  StopCircle,
  MessageSquare,
  Shield,
  AlertTriangle,
  Eye,
  Camera,
  Volume2
} from 'lucide-react';

interface StreamSession {
  id: string;
  sessionName: string;
  status: 'pending' | 'active' | 'ended' | 'failed';
  attorneyId: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  viewerCount: number;
  emergencyLevel: 'normal' | 'urgent' | 'critical';
  streamQuality: 'auto' | '720p' | '480p' | '360p';
  audioEnabled: boolean;
  videoEnabled: boolean;
  chatEnabled: boolean;
  isRecorded: boolean;
}

interface Attorney {
  id: string;
  firmName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialties: string[];
  isOnline?: boolean;
}

interface StreamMessage {
  id: string;
  senderId: string;
  message: string;
  messageType: 'chat' | 'system' | 'emergency' | 'legal_note';
  timestamp: string;
  isPrivate: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const LivestreamToAttorneys = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const [activeTab, setActiveTab] = useState('create');
  const [currentSession, setCurrentSession] = useState<StreamSession | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<StreamMessage[]>([]);

  // Form states
  const [sessionName, setSessionName] = useState('');
  const [selectedAttorney, setSelectedAttorney] = useState('');
  const [emergencyLevel, setEmergencyLevel] = useState<'normal' | 'urgent' | 'critical'>('normal');
  const [streamQuality, setStreamQuality] = useState<'auto' | '720p' | '480p' | '360p'>('auto');

  // Get available attorneys
  const { data: attorneys, isLoading: attorneysLoading } = useQuery({
    queryKey: ['/api/attorneys/available'],
    enabled: true
  });

  // Get user's streaming sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/livestream/sessions'],
    enabled: true
  });

  // Create new streaming session
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await fetch('/api/livestream/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setActiveTab('stream');
      queryClient.invalidateQueries({ queryKey: ['/api/livestream/sessions'] });
      toast({
        title: "Session Created",
        description: "Your livestream session has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create livestream session.",
        variant: "destructive",
      });
    }
  });

  // Start streaming
  const startStreamMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/livestream/${sessionId}/start`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to start stream');
      return response.json();
    },
    onSuccess: () => {
      setIsStreaming(true);
      if (currentSession) {
        setCurrentSession({ ...currentSession, status: 'active', startTime: new Date().toISOString() });
      }
      toast({
        title: "Stream Started",
        description: "Your live stream to attorney is now active.",
      });
    }
  });

  // End streaming
  const endStreamMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/livestream/${sessionId}/end`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to end stream');
      return response.json();
    },
    onSuccess: () => {
      setIsStreaming(false);
      if (currentSession) {
        setCurrentSession({ ...currentSession, status: 'ended', endTime: new Date().toISOString() });
      }
      stopMediaStream();
      toast({
        title: "Stream Ended",
        description: "Your live stream has been ended successfully.",
      });
    }
  });

  // Send chat message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch(`/api/livestream/${currentSession?.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
    }
  });

  // Initialize media stream
  const initializeMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Media Access Error",
        description: "Unable to access camera/microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop media stream
  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Toggle video
  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
      }
    }
  };

  // Handle create session
  const handleCreateSession = () => {
    if (!sessionName || !selectedAttorney) {
      toast({
        title: "Validation Error",
        description: "Please provide session name and select an attorney.",
        variant: "destructive",
      });
      return;
    }

    createSessionMutation.mutate({
      sessionName,
      attorneyId: selectedAttorney,
      emergencyLevel,
      streamQuality,
      audioEnabled,
      videoEnabled,
      chatEnabled: true,
      isRecorded: true
    });
  };

  // Handle start streaming
  const handleStartStream = async () => {
    if (!currentSession) return;
    
    await initializeMediaStream();
    startStreamMutation.mutate(currentSession.id);
  };

  // Handle end streaming
  const handleEndStream = () => {
    if (!currentSession) return;
    endStreamMutation.mutate(currentSession.id);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentSession) return;

    sendMessageMutation.mutate({
      message: newMessage,
      messageType: 'chat',
      priority: 'normal'
    });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` 
                   : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get emergency level color
  const getEmergencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'urgent': return 'default';
      case 'normal': return 'secondary';
      default: return 'secondary';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaStream();
    };
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Live Stream to Attorneys</h1>
        <p className="text-muted-foreground">Connect with your attorney in real-time during legal encounters</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Session</TabsTrigger>
          <TabsTrigger value="stream">Live Stream</TabsTrigger>
          <TabsTrigger value="sessions">My Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Streaming Session</CardTitle>
              <CardDescription>
                Set up a live video stream to connect with your attorney during encounters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionName">Session Name</Label>
                  <Input
                    id="sessionName"
                    placeholder="e.g., Traffic Stop - Main St"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="attorney">Select Attorney</Label>
                  <Select value={selectedAttorney} onValueChange={setSelectedAttorney}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose attorney" />
                    </SelectTrigger>
                    <SelectContent>
                      {attorneys?.attorneys?.map((attorney: Attorney) => (
                        <SelectItem key={attorney.id} value={attorney.id}>
                          <div className="flex items-center gap-2">
                            <span>{attorney.firstName} {attorney.lastName}</span>
                            <span className="text-sm text-muted-foreground">- {attorney.firmName}</span>
                            {attorney.isOnline && (
                              <Badge variant="secondary" className="text-xs">Online</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="emergencyLevel">Emergency Level</Label>
                  <Select value={emergencyLevel} onValueChange={(value: any) => setEmergencyLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quality">Stream Quality</Label>
                  <Select value={streamQuality} onValueChange={(value: any) => setStreamQuality(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Recommended)</SelectItem>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="480p">480p</SelectItem>
                      <SelectItem value="360p">360p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleCreateSession}
                  disabled={createSessionMutation.isPending || !sessionName || !selectedAttorney}
                  className="flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  Create Session
                </Button>
                
                {emergencyLevel === 'critical' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Critical emergency sessions are given highest priority and immediate attorney notification.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stream" className="space-y-6">
          {currentSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Stream */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge variant={getEmergencyColor(currentSession.emergencyLevel)}>
                            {currentSession.emergencyLevel.toUpperCase()}
                          </Badge>
                          {currentSession.sessionName}
                        </CardTitle>
                        <CardDescription>
                          Status: {currentSession.status} • Quality: {currentSession.streamQuality}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">{currentSession.viewerCount} viewing</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full h-full object-cover"
                      />
                      
                      {!videoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                          <VideoOff className="h-12 w-12 text-gray-400" />
                        </div>
                      )}

                      {/* Stream Controls Overlay */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={audioEnabled ? "default" : "destructive"}
                          onClick={toggleAudio}
                        >
                          {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={videoEnabled ? "default" : "destructive"}
                          onClick={toggleVideo}
                        >
                          {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>

                        {!isStreaming ? (
                          <Button size="sm" onClick={handleStartStream} className="bg-green-600 hover:bg-green-700">
                            <Phone className="h-4 w-4" />
                            Start Stream
                          </Button>
                        ) : (
                          <Button size="sm" onClick={handleEndStream} variant="destructive">
                            <PhoneOff className="h-4 w-4" />
                            End Stream
                          </Button>
                        )}

                        {isStreaming && currentSession.isRecorded && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Circle className="h-3 w-3 fill-current" />
                            REC
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chat and Session Info */}
              <div className="space-y-4">
                {/* Session Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Session Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{currentSession.duration ? formatDuration(currentSession.duration) : '00:00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Viewers:</span>
                      <span>{currentSession.viewerCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span>{currentSession.streamQuality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recording:</span>
                      <span>{currentSession.isRecorded ? 'Yes' : 'No'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Chat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chat with Attorney
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-64 p-4">
                      <div className="space-y-2">
                        {messages.map((msg) => (
                          <div key={msg.id} className="p-2 rounded border text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={msg.messageType === 'emergency' ? 'destructive' : 'secondary'} className="text-xs">
                                {msg.messageType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p>{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <Separator />
                    
                    <div className="p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
                <p className="text-muted-foreground mb-4">Create a new streaming session to get started</p>
                <Button onClick={() => setActiveTab('create')}>
                  Create New Session
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Streaming Sessions</CardTitle>
              <CardDescription>View and manage your streaming session history</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-center py-8">Loading sessions...</div>
              ) : sessions?.sessions?.length ? (
                <div className="space-y-4">
                  {sessions.sessions.map((session: StreamSession) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{session.sessionName}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Status: {session.status}</span>
                            <span>Emergency: {session.emergencyLevel}</span>
                            {session.duration && <span>Duration: {formatDuration(session.duration)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getEmergencyColor(session.emergencyLevel)}>
                            {session.emergencyLevel}
                          </Badge>
                          <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No streaming sessions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Streaming Settings</CardTitle>
              <CardDescription>Configure your live streaming preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Default Stream Quality</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Recommended)</SelectItem>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="480p">480p</SelectItem>
                      <SelectItem value="360p">360p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Auto-Record Sessions</Label>
                  <Select defaultValue="enabled">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Emergency Protocols</h4>
                <p className="text-sm text-muted-foreground">
                  Configure automatic streaming behavior during emergency situations
                </p>
              </div>

              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LivestreamToAttorneys;