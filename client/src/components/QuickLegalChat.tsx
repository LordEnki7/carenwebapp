import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickLegalChatProps {
  userLocation?: string;
  scenario?: 'emergency' | 'general' | 'traffic_stop' | 'recording';
  compact?: boolean;
}

export function QuickLegalChat({ userLocation, scenario = 'general', compact = false }: QuickLegalChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const quickCommands = scenario === 'emergency' 
    ? ["What are my rights?", "Can I record this?", "Do I have to consent?", "Am I being arrested?"]
    : ["Record police rights", "Traffic stop rights", "Search rights", "Miranda rights"];

  const initVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice unavailable",
        description: "Use Chrome or Edge for voice commands",
        variant: "destructive"
      });
      return false;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = async (event: any) => {
      const q = event.results[0][0].transcript;
      setQuestion(q);
      setIsListening(false);
      await getLegalResponse(q);
    };
    recognitionRef.current.onerror = () => {
      setIsListening(false);
      toast({ title: "Voice error", description: "Try again", variant: "destructive" });
    };
    recognitionRef.current.onend = () => setIsListening(false);
    
    return true;
  };

  const getLegalResponse = async (q: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/quick-legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          question: q, 
          context: { userLocation, scenario }
        })
      });

      if (!response.ok) throw new Error('Service unavailable');
      
      const result = await response.json();
      setResponse(result.answer);
      
      if (scenario === 'emergency') {
        speakResponse(result.answer);
      }
    } catch (error) {
      setResponse(`Emergency guidance: Stay calm, keep hands visible, you have the right to remain silent and an attorney.`);
    }
    setIsLoading(false);
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const startVoice = () => {
    if (initVoiceRecognition()) {
      recognitionRef.current?.start();
    }
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  if (compact && !isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Legal Help
      </Button>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-4">
        {compact && (
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-200 font-medium">Quick Legal Help</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <Button
            onClick={isListening ? stopVoice : startVoice}
            className={`${isListening ? 'bg-red-600' : 'bg-blue-600'} hover:opacity-80`}
            size="sm"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          {isSpeaking && (
            <Button onClick={stopSpeaking} variant="outline" size="sm">
              <VolumeX className="w-4 h-4" />
            </Button>
          )}
          
          {isListening && (
            <Badge variant="secondary" className="bg-red-900/20 text-red-300">
              Listening...
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {quickCommands.map((cmd, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => getLegalResponse(cmd)}
              className="text-xs text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              {cmd}
            </Button>
          ))}
        </div>

        {question && (
          <div className="mb-2 p-2 bg-gray-700/50 rounded text-sm text-gray-300">
            Q: {question}
          </div>
        )}

        {isLoading && (
          <div className="text-gray-400 text-sm">Getting legal guidance...</div>
        )}

        {response && (
          <div className="p-3 bg-blue-900/20 border border-blue-800 rounded text-sm text-gray-200">
            {response}
          </div>
        )}
      </CardContent>
    </Card>
  );
}