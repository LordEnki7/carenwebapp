import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Plus, Clock, AlertCircle, Shield, User, ArrowLeft, Lock, Mic, MicOff } from "lucide-react";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/Sidebar";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

interface Conversation {
  id: string;
  userId: string;
  attorneyId: number;
  incidentId?: number;
  subject: string;
  status: string;
  priority: string;
  isEmergency: boolean;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string;
  messageType: string;
  isRead: boolean;
  readAt?: string;
  isSystemMessage: boolean;
  systemMessageType?: string;
  createdAt: string;
}

interface Attorney {
  id: number;
  firmName: string;
  contactEmail: string;
  specialties: string[];
  rating: number;
  isVerified: boolean;
  bio?: string;
}

export default function Messages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [selectedAttorneyId, setSelectedAttorneyId] = useState<string>("");
  const [newConversationSubject, setNewConversationSubject] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    retry: false,
  });

  // Handle authentication errors
  useEffect(() => {
    if (conversationsError && isUnauthorizedError(conversationsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [conversationsError, toast]);

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"] as const,
    enabled: !!selectedConversation,
    refetchInterval: 5000,
    retry: false,
  });

  // Fetch available attorneys
  const { data: attorneys = [], isLoading: attorneysLoading } = useQuery<Attorney[]>({
    queryKey: ["/api/attorneys/available"],
    enabled: isNewConversationOpen,
    retry: false,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { attorneyId: string; subject: string; initialMessage: string }) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversation(conversation.id);
      setIsNewConversationOpen(false);
      setSelectedAttorneyId("");
      setNewConversationSubject("");
      toast({
        title: "Success",
        description: "Conversation started successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      return await apiRequest("POST", `/api/conversations/${selectedConversation}/messages`, {
        content,
        messageType: "text",
        senderType: "user",
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartConversation = () => {
    if (!selectedAttorneyId || !newConversationSubject.trim()) {
      toast({
        title: "Error",
        description: "Please select an attorney and enter a subject",
        variant: "destructive",
      });
      return;
    }

    createConversationMutation.mutate({
      attorneyId: selectedAttorneyId,
      subject: newConversationSubject.trim(),
      initialMessage: `Hello, I would like to discuss: ${newConversationSubject.trim()}`,
    });
  };

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
          
        // Handle voice commands
        const command = transcript.toLowerCase().trim();
        
        if (command.includes('send message')) {
          if (newMessage.trim()) {
            sendMessageMutation.mutate({
              conversationId: selectedConversation!,
              content: newMessage,
              messageType: 'text',
            });
          }
        } else if (command.includes('new conversation')) {
          setIsNewConversationOpen(true);
        } else if (command.includes('call my attorney') || command.includes('call attorney') || command.includes('contact attorney') || command.includes('emergency attorney')) {
          handleEmergencyAttorneyCall();
        } else if (command.includes('call ') || command.includes('contact ') || command.includes('speak to ')) {
          // Check if user is requesting a specific attorney by name
          handleSpecificAttorneyRequest(command);
        } else if (command.includes('dictate message') || command.includes('type message')) {
          // Extract the message content after "dictate message" or "type message"
          const messageStart = Math.max(
            command.indexOf('dictate message') + 'dictate message'.length,
            command.indexOf('type message') + 'type message'.length
          );
          const messageContent = transcript.substring(messageStart).trim();
          if (messageContent) {
            setNewMessage(messageContent);
          }
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognition);
    }
  }, [newMessage, selectedConversation]);

  const handleSpecificAttorneyRequest = async (command: string) => {
    try {
      // Extract attorney name from voice command
      const attorneyName = extractAttorneyName(command);
      
      if (!attorneyName) {
        toast({
          title: "Attorney Name Not Clear",
          description: "Please specify which attorney you'd like to contact",
          variant: "destructive",
        });
        return;
      }

      // Search for attorney by name
      console.log(`Searching for attorney: "${attorneyName}"`);
      const response = await fetch(`/api/attorneys/search-by-name?name=${encodeURIComponent(attorneyName)}`);
      
      console.log(`Search response status: ${response.status}`);
      
      if (response.ok) {
        const foundAttorney = await response.json();
        console.log(`Found attorney:`, foundAttorney);
        
        if (foundAttorney) {
          // Create conversation with specific attorney
          const conversationResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attorneyId: foundAttorney.id,
              subject: `Voice Request for ${foundAttorney.firmName}`,
              initialMessage: `User requested to speak with ${foundAttorney.firmName} via voice command.`,
              isEmergency: false,
              priority: 'normal'
            }),
          });

          if (conversationResponse.ok) {
            const conversation = await conversationResponse.json();
            setSelectedConversation(conversation.id);
            
            // If attorney has phone number, offer to call
            if (foundAttorney.contactInfo?.phone) {
              toast({
                title: `Found ${foundAttorney.firmName}`,
                description: `Would you like to call ${foundAttorney.contactInfo.phone}?`,
                action: {
                  label: "Call Now",
                  onClick: () => window.location.href = `tel:${foundAttorney.contactInfo.phone}`
                }
              });
            } else {
              toast({
                title: `Connected to ${foundAttorney.firmName}`,
                description: "Conversation started. You can now send messages.",
              });
            }
          }
        } else {
          toast({
            title: "Attorney Not Found",
            description: `No attorney found matching "${attorneyName}". Try calling your attorney instead.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to search for attorney. Please try again.",
        variant: "destructive",
      });
    }
  };

  const extractAttorneyName = (command: string): string | null => {
    // Remove common voice command prefixes
    let cleanCommand = command
      .replace(/^(call|contact|speak to|talk to|find|get me)\s+/i, '')
      .replace(/\s+(attorney|lawyer|law firm|legal|firm)$/i, '')
      .trim();

    // Look for specific attorney firm names in our database
    const knownFirms = [
      'civil rights law group',
      'rodriguez',
      'rodriques', // Common misspelling
      'rodriguez & associates', 
      'metropolitan legal defense',
      'sunshine state legal',
      'pacific coast advocates',
      'lone star justice'
    ];

    // Check if command contains any known firm names
    for (const firm of knownFirms) {
      if (cleanCommand.toLowerCase().includes(firm)) {
        return firm;
      }
    }

    // If no known firm, return the cleaned command for fuzzy matching
    return cleanCommand.length > 0 ? cleanCommand : null;
  };

  const handleEmergencyAttorneyCall = async () => {
    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;

      // Check if user has saved attorneys first
      const response = await fetch('/api/attorneys/user-attorneys');
      const userAttorneys = await response.json();

      let selectedAttorney = null;

      if (userAttorneys.length > 0) {
        // Use the first saved attorney (or most recent)
        selectedAttorney = userAttorneys[0];
        toast({
          title: "Calling Your Attorney",
          description: `Connecting to ${selectedAttorney.firmName}...`,
        });
      } else {
        // Find closest participating attorney
        const emergencyResponse = await fetch('/api/attorneys/emergency-nearest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude }),
        });
        
        if (emergencyResponse.ok) {
          selectedAttorney = await emergencyResponse.json();
          toast({
            title: "Emergency Attorney Found",
            description: `Connecting to nearest attorney: ${selectedAttorney.firmName}`,
          });
        }
      }

      if (selectedAttorney) {
        // Create emergency conversation and initiate call
        const emergencyConversation = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attorneyId: selectedAttorney.id,
            subject: "EMERGENCY VOICE CALL REQUEST",
            initialMessage: `EMERGENCY: User requested voice call via hands-free command. Location: ${latitude}, ${longitude}. Please call immediately.`,
            isEmergency: true,
            priority: 'urgent'
          }),
        });

        if (emergencyConversation.ok) {
          const conversation = await emergencyConversation.json();
          setSelectedConversation(conversation.id);
          
          // If attorney has phone number, attempt to initiate call
          if (selectedAttorney.contactInfo?.phone) {
            const phoneNumber = selectedAttorney.contactInfo.phone;
            window.location.href = `tel:${phoneNumber}`;
            
            toast({
              title: "Emergency Call Initiated",
              description: `Calling ${selectedAttorney.firmName} at ${phoneNumber}`,
            });
          } else {
            toast({
              title: "No Phone Number",
              description: `${selectedAttorney.firmName} contact info created. Please call manually.`,
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "No Attorney Available",
          description: "Please add an attorney or check your location services",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Emergency Call Failed",
        description: "Unable to connect to attorney. Please try manually.",
        variant: "destructive",
      });
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast({
        title: "Voice Commands Active",
        description: "Say 'call my attorney', 'dictate message [your message]', 'send message', or 'new conversation'",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate(newMessage);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header with Back Button and Voice Control */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button size="sm" className="bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold text-white">Attorney Messages</h1>
              </div>
              <Button
                onClick={toggleListening}
                size="sm"
                className={`flex items-center gap-2 ${isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening ? "Stop Voice" : "Voice Commands"}
              </Button>
            </div>
            {isListening && (
              <div className="mt-2 p-2 bg-cyan-500/20 border border-cyan-400/30 rounded-md">
                <p className="text-sm text-cyan-300">
                  🎤 Voice commands: "call my attorney" • "call [attorney name]" • "dictate message [your message]" • "send message" • "new conversation"
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="w-1/3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversations
                </h2>
                <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold text-white">Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-gray-300">Select Attorney</label>
                        <Select value={selectedAttorneyId} onValueChange={setSelectedAttorneyId}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Choose an available attorney" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {attorneysLoading ? (
                              <SelectItem value="loading" disabled className="text-gray-400">Loading attorneys...</SelectItem>
                            ) : attorneys.length === 0 ? (
                              <SelectItem value="none" disabled className="text-gray-400">No attorneys available</SelectItem>
                            ) : (
                              attorneys.map((attorney) => (
                                <SelectItem key={attorney.id} value={attorney.id.toString()} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                                  <div className="flex items-center gap-2">
                                    <span>{attorney.firmName}</span>
                                    {attorney.isVerified && (
                                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-300 border-green-400/30">Verified</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block text-gray-300">Subject</label>
                        <Input
                          value={newConversationSubject}
                          onChange={(e) => setNewConversationSubject(e.target.value)}
                          placeholder="What would you like to discuss?"
                          className="bg-gray-700 border-gray-600 text-white w-full"
                        />
                      </div>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full" 
                        onClick={handleStartConversation}
                        disabled={createConversationMutation.isPending || !selectedAttorneyId || !newConversationSubject.trim()}
                      >
                        {createConversationMutation.isPending ? "Starting..." : "Start Conversation"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-80px)]">
              {conversationsLoading ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-cyan-500/20 rounded border border-cyan-400/30"></div>
                    ))}
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-cyan-400">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-cyan-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a conversation with an attorney</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conversation: Conversation) => (
                    <Card
                      key={conversation.id}
                      className={`cursor-pointer transition-colors bg-gray-700/50 border-gray-600 hover:bg-gray-700 ${
                        selectedConversation === conversation.id ? 'bg-blue-600/20 border-blue-400' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm text-white">{conversation.subject}</h3>
                              {conversation.isEmergency && (
                                <Badge variant="destructive" className="text-xs bg-red-500/20 text-red-300 border-red-400/30">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Emergency
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getPriorityColor(conversation.priority)} text-white`}
                              >
                                {conversation.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-purple-300 border-purple-400/30">
                                {conversation.status}
                              </Badge>
                            </div>
                            {conversation.lastMessageAt && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(conversation.lastMessageAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg">
            {selectedConversation ? (
              <>
                {/* Messages Header */}
                <div className="p-4 border-b border-gray-600 bg-gray-800/60 rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="border border-gray-600">
                      <AvatarFallback className="bg-gray-700 text-white">
                        <Shield className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">Attorney Consultation</h3>
                      <p className="text-sm text-gray-300">Secure legal communication</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 pr-6">
                  {messagesLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.senderType === 'user' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {message.senderType === 'user' ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex-1 max-w-xs lg:max-w-md ${
                              message.senderType === 'user' ? 'text-right' : ''
                            }`}
                          >
                            <div
                              className={`rounded-lg p-3 ${
                                message.senderType === 'user'
                                  ? 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 ml-auto'
                                  : 'bg-purple-500/20 border border-purple-400/30 text-purple-300'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimestamp(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t border-gray-600 p-4 bg-gray-800/60 rounded-b-lg">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your secure message..."
                      disabled={sendMessageMutation.isPending}
                      className="bg-gray-700 border-gray-600 text-white flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {sendMessageMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                  
                  {/* Security indicator */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-300">
                    <Lock className="h-3 w-3 text-green-400" />
                    <span>End-to-end encrypted • Attorney-client privilege protected</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-white mb-2">Select a conversation</h3>
                  <p className="text-gray-300">Choose a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </MobileResponsiveLayout>
  );
}