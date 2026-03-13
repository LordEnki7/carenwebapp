import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Shield, Mic, MicOff, Volume2, AlertTriangle, CheckCircle, ArrowLeft, Brain, MessageCircle, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CoachingResponse {
  coaching: string;
  spokenGuidance: string;
  legalBasis: string;
  doList: string[];
  dontList: string[];
  suggestedResponses: string[];
  calmingMessage: string;
  riskLevel: string;
  nextLikelyScenario: string;
}

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia'
];

interface QuickRisk {
  riskLevel: string;
  color: string;
  briefReason: string;
}

export default function VoiceCoaching() {
  const [situation, setSituation] = useState('');
  const [officerStatement, setOfficerStatement] = useState('');
  const [userState, setUserState] = useState('');
  const [encounterType, setEncounterType] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [coachingHistory, setCoachingHistory] = useState<CoachingResponse[]>([]);
  const [liveRisk, setLiveRisk] = useState<QuickRisk | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const riskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (riskTimerRef.current) clearTimeout(riskTimerRef.current);
    if (!situation || situation.trim().length < 10) { setLiveRisk(null); return; }
    setRiskLoading(true);
    riskTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/quick-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ situation, state: userState }),
        });
        const data = await res.json();
        setLiveRisk(data);
      } catch { /* silent */ } finally {
        setRiskLoading(false);
      }
    }, 800);
    return () => { if (riskTimerRef.current) clearTimeout(riskTimerRef.current); };
  }, [situation, userState]);

  const coachingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/ai/voice-coaching', data);
      return res.json();
    },
    onSuccess: (data: CoachingResponse) => {
      setCoachingHistory(prev => [data, ...prev]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.spokenGuidance);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    },
    onError: () => {
      toast({ title: 'Error', description: 'Voice coaching unavailable. Stay calm and cooperative.', variant: 'destructive' });
    }
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'elevated': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'critical': return 'bg-red-700/30 text-red-300 border-red-700/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const handleGetCoaching = () => {
    if (!situation || !userState || !encounterType) {
      toast({ title: 'Missing Info', description: 'Please fill in the situation, state, and encounter type.', variant: 'destructive' });
      return;
    }
    coachingMutation.mutate({
      currentSituation: situation,
      officerStatement: officerStatement || undefined,
      userState,
      encounterType,
      previousCoachingContext: coachingHistory.slice(0, 3).map(c => c.spokenGuidance)
    });
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast({ title: 'Not Supported', description: 'Voice input is not supported in this browser.', variant: 'destructive' });
      return;
    }
    setIsListening(!isListening);
    if (!isListening) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSituation(prev => prev + ' ' + transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  const latestCoaching = coachingHistory[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Brain className="h-7 w-7 text-cyan-400" />
              Real-Time Voice Coaching
            </h1>
            <p className="text-gray-400 text-sm">AI-powered guidance during police encounters</p>
          </div>
        </div>

        {latestCoaching && (
          <Card className={`border-2 ${getRiskColor(latestCoaching.riskLevel)} bg-gray-900/90 backdrop-blur`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-cyan-400 animate-pulse" />
                  Live Coaching
                </CardTitle>
                <Badge className={getRiskColor(latestCoaching.riskLevel)}>
                  Risk: {latestCoaching.riskLevel?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-cyan-300 font-semibold text-lg text-center">"{latestCoaching.spokenGuidance}"</p>
              </div>
              <p className="text-gray-300">{latestCoaching.coaching}</p>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <p className="text-purple-300 text-sm italic">{latestCoaching.calmingMessage}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> DO</h4>
                  <ul className="space-y-1">{latestCoaching.doList.map((item, i) => <li key={i} className="text-gray-300 text-sm">+ {item}</li>)}</ul>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> DON'T</h4>
                  <ul className="space-y-1">{latestCoaching.dontList.map((item, i) => <li key={i} className="text-gray-300 text-sm">- {item}</li>)}</ul>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-1"><MessageCircle className="h-4 w-4 text-cyan-400" /> Say This</h4>
                <div className="space-y-2">
                  {latestCoaching.suggestedResponses.map((resp, i) => (
                    <div key={i} className="bg-cyan-500/10 border border-cyan-500/20 rounded px-3 py-2">
                      <p className="text-cyan-300 text-sm font-mono">"{resp}"</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Legal Basis: {latestCoaching.legalBasis}</span>
                <span>Next: {latestCoaching.nextLikelyScenario}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-900/80 border-gray-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              Describe Your Situation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Your State</label>
                <Select value={userState} onValueChange={setUserState}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Encounter Type</label>
                <Select value={encounterType} onValueChange={setEncounterType}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traffic_stop">Traffic Stop</SelectItem>
                    <SelectItem value="pedestrian_stop">Pedestrian Stop</SelectItem>
                    <SelectItem value="checkpoint">Checkpoint</SelectItem>
                    <SelectItem value="questioning">Questioning</SelectItem>
                    <SelectItem value="search_request">Search Request</SelectItem>
                    <SelectItem value="arrest">Arrest</SelectItem>
                    <SelectItem value="roadside_emergency">Roadside Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-gray-400 text-sm">What's happening right now?</label>
                {(liveRisk || riskLoading) && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                    riskLoading ? 'bg-gray-700/50 border-gray-600 text-gray-400' :
                    liveRisk?.riskLevel === 'low' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                    liveRisk?.riskLevel === 'medium' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                    liveRisk?.riskLevel === 'high' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
                    liveRisk?.riskLevel === 'critical' ? 'bg-red-600/30 border-red-600/50 text-red-300' :
                    'bg-gray-700/50 border-gray-600 text-gray-400'
                  }`}>
                    <Zap className="w-3 h-3" />
                    {riskLoading ? 'Assessing...' : (
                      <span>{liveRisk?.riskLevel?.toUpperCase()} — {liveRisk?.briefReason}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <Textarea value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="Describe your current situation..." className="bg-gray-800 border-gray-600 text-white min-h-[80px] pr-12" />
                <Button variant="ghost" size="icon" onClick={toggleListening} className={`absolute right-2 top-2 ${isListening ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">What did the officer say? (optional)</label>
              <Textarea value={officerStatement} onChange={(e) => setOfficerStatement(e.target.value)} placeholder="Enter what the officer said..." className="bg-gray-800 border-gray-600 text-white min-h-[60px]" />
            </div>
            <Button onClick={handleGetCoaching} disabled={coachingMutation.isPending} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 text-lg">
              {coachingMutation.isPending ? 'Getting Coaching...' : 'Get AI Coaching Now'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
