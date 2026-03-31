import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Send, X, Bot, User, Lightbulb, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
  relatedRights?: string[];
}

interface ContextualHelpProps {
  page?: string;
  context?: {
    userState?: string;
    currentAction?: string;
    formData?: any;
  };
}

export function ContextualHelpBubble({ page, context }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickHelp, setShowQuickHelp] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context-aware quick help suggestions based on current page
  const getQuickHelpSuggestions = () => {
    const currentPage = page || location;
    
    switch (currentPage) {
      case '/dashboard':
        return [
          "How do I start recording an incident?",
          "What are my constitutional rights?",
          "How do I contact emergency services?",
          "What should I do during a traffic stop?"
        ];
      case '/record':
        return [
          "What should I record during a police encounter?",
          "Is it legal to record police officers?",
          "How do I ensure my recording is admissible?",
          "What if the officer asks me to stop recording?"
        ];
      case '/legal-rights':
        return [
          "What are my Fourth Amendment rights?",
          "When can police search my vehicle?",
          "Do I have to answer police questions?",
          "What is probable cause?"
        ];
      case '/attorney-messages':
        return [
          "How do I find a qualified attorney?",
          "What information should I share with my attorney?",
          "How is attorney-client privilege protected?",
          "When should I contact an attorney?"
        ];
      case '/emergency-pullover':
        return [
          "What should I do immediately when pulled over?",
          "How do I safely pull over?",
          "What documents should I have ready?",
          "How do I de-escalate the situation?"
        ];
      case '/file-complaint':
        return [
          "How do I file a police complaint?",
          "What evidence do I need for a complaint?",
          "Where should I file my complaint?",
          "What happens after I file a complaint?"
        ];
      default:
        return [
          "What are my constitutional rights?",
          "How do I use C.A.R.E.N.™ effectively?",
          "What should I do in an emergency?",
          "How do I contact an attorney?"
        ];
    }
  };

  // Initialize with welcome message and context-aware help
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: AIMessage = {
        id: 'welcome-' + Date.now(),
        type: 'ai',
        content: `Hello! I'm your AI legal assistant. I can help you understand your rights, navigate legal situations, and use C.A.R.E.N.™ effectively. I have access to comprehensive legal information and can provide guidance based on your current location and situation.

How can I assist you today?`,
        timestamp: new Date(),
        confidence: 1.0
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to AI assistant
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: 'user-' + Date.now(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setShowQuickHelp(false);

    try {
      // Prepare context for AI
      const aiContext = {
        state: context?.userState,
        location: context?.currentAction,
        page: page || location,
        formData: context?.formData
      };

      const response = await apiRequest("POST", "/api/ai/ask", {
        question: messageText.trim(),
        context: aiContext
      });

      if (response.ok) {
        const aiResponse = await response.json();
        
        const aiMessage: AIMessage = {
          id: 'ai-' + Date.now(),
          type: 'ai',
          content: aiResponse.answer,
          timestamp: new Date(),
          confidence: aiResponse.confidence,
          suggestions: aiResponse.suggestions,
          relatedRights: aiResponse.relatedRights
        };

        setMessages(prev => [...prev, aiMessage]);

        // Show confidence indicator if low
        if (aiResponse.confidence < 0.7) {
          toast({
            title: "AI Confidence Notice",
            description: "I'm not completely certain about this answer. Consider consulting with an attorney for verification.",
            variant: "default"
          });
        }
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      const errorMessage: AIMessage = {
        id: 'error-' + Date.now(),
        type: 'ai',
        content: "I apologize, but I'm unable to process your question right now. Please try again in a moment, or consider contacting an attorney directly for immediate legal assistance.",
        timestamp: new Date(),
        confidence: 0
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Unable to reach AI assistant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick suggestion clicks
  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Handle Enter key in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-40">
      {/* Help Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          variant="outline"
          className="rounded-full bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 shadow-lg transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="sr-only">AI Help</span>
        </Button>
      )}

      {/* Help Bubble */}
      {isOpen && (
        <Card className="w-96 h-[500px] shadow-2xl border-2 border-blue-200 bg-white mt-2">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Bot className="w-5 h-5 mr-2" />
                AI Legal Assistant
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-blue-100 text-sm">
              Context-aware legal guidance and platform help
            </p>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[420px]">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'ai' && <Bot className="w-4 h-4 mt-0.5 text-blue-600" />}
                        {message.type === 'user' && <User className="w-4 h-4 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {/* AI Confidence Badge */}
                          {message.type === 'ai' && message.confidence !== undefined && (
                            <div className="mt-2 flex items-center space-x-2">
                              <Badge 
                                variant={message.confidence >= 0.8 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {message.confidence >= 0.8 ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                {Math.round(message.confidence * 100)}% confident
                              </Badge>
                            </div>
                          )}

                          {/* AI Suggestions */}
                          {message.type === 'ai' && message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs text-gray-600 flex items-center">
                                <Lightbulb className="w-3 h-3 mr-1" />
                                Related suggestions:
                              </p>
                              {message.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleQuickSuggestion(suggestion)}
                                  className="block w-full text-left text-xs bg-blue-50 hover:bg-blue-100 rounded p-2 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                )}

                {/* Quick Help Suggestions */}
                {showQuickHelp && messages.length <= 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 flex items-center">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Quick help for this page:
                    </p>
                    {getQuickHelpSuggestions().map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickSuggestion(suggestion)}
                        className="block w-full text-left text-sm bg-blue-50 hover:bg-blue-100 rounded p-2 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-3">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your rights or using C.A.R.E.N.™.."
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage(inputMessage)}
                  disabled={isLoading || !inputMessage.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to send • AI powered by advanced legal knowledge
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}