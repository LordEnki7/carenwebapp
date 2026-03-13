import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Languages, ArrowLeft, ArrowRightLeft, Volume2, Copy, BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  legalTermsGlossary: { term: string; translation: string; explanation: string }[];
  confidence: number;
}

const LANGUAGES = [
  { value: 'Spanish', label: 'Spanish (Espanol)' },
  { value: 'Mandarin Chinese', label: 'Chinese (Mandarin)' },
  { value: 'French', label: 'French (Francais)' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Vietnamese', label: 'Vietnamese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Tagalog', label: 'Tagalog (Filipino)' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Haitian Creole', label: 'Haitian Creole' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'German', label: 'German (Deutsch)' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Polish', label: 'Polish' },
  { value: 'Italian', label: 'Italian' },
];

const QUICK_PHRASES = [
  "I am exercising my right to remain silent.",
  "Am I being detained or am I free to go?",
  "I do not consent to a search of my person, vehicle, or belongings.",
  "I would like to speak to an attorney before answering any questions.",
  "I have the right to record this interaction.",
  "Please show me your badge number and name.",
  "I understand my rights. I choose not to answer questions without an attorney present.",
  "I need medical attention.",
  "Please call my emergency contact.",
];

export default function TranslationHub() {
  const [text, setText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const { toast } = useToast();

  const translateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/ai/translate', data);
      return res.json();
    },
    onSuccess: (data: TranslationResult) => {
      setResult(data);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Translation service unavailable.', variant: 'destructive' });
    }
  });

  const handleTranslate = () => {
    if (!text || !targetLanguage) {
      toast({ title: 'Missing Info', description: 'Please enter text and select a target language.', variant: 'destructive' });
      return;
    }
    translateMutation.mutate({ text, targetLanguage, sourceLanguage: sourceLanguage !== 'Auto-Detect' ? sourceLanguage : undefined, context: 'legal rights and police encounters' });
  };

  const swapLanguages = () => {
    if (result) {
      setText(result.translatedText);
      const temp = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(temp);
      setResult(null);
    }
  };

  const speakText = (textToSpeak: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyText = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Copied', description: 'Text copied to clipboard.' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Languages className="h-7 w-7 text-green-400" />
              Legal Translation Hub
            </h1>
            <p className="text-gray-400 text-sm">Translate legal rights and emergency phrases in 15+ languages</p>
          </div>
        </div>

        <Card className="bg-gray-900/80 border-gray-700 backdrop-blur">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-gray-400 text-sm mb-1 block">From</label>
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Auto-Detect">Auto-Detect</SelectItem>
                    {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="icon" onClick={swapLanguages} className="mt-5 text-gray-400 hover:text-white">
                <ArrowRightLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <label className="text-gray-400 text-sm mb-1 block">To</label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text to translate..." className="bg-gray-800 border-gray-600 text-white min-h-[150px]" />
                <div className="flex justify-end mt-2 gap-2">
                  <Button variant="ghost" size="sm" onClick={() => speakText(text)} className="text-gray-400"><Volume2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => copyText(text)} className="text-gray-400"><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <div className="bg-gray-800 border border-gray-600 rounded-md p-3 min-h-[150px]">
                  {translateMutation.isPending ? (
                    <div className="flex items-center justify-center h-full"><div className="animate-spin w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full" /></div>
                  ) : result ? (
                    <p className="text-green-300 text-lg">{result.translatedText}</p>
                  ) : (
                    <p className="text-gray-500">Translation will appear here...</p>
                  )}
                </div>
                {result && (
                  <div className="flex justify-between items-center mt-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500">Confidence: {Math.round((result.confidence || 0) * 100)}%</Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => speakText(result.translatedText)} className="text-gray-400"><Volume2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => copyText(result.translatedText)} className="text-gray-400"><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleTranslate} disabled={translateMutation.isPending} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 text-lg">
              {translateMutation.isPending ? 'Translating...' : 'Translate'}
            </Button>
          </CardContent>
        </Card>

        {result && result.legalTermsGlossary.length > 0 && (
          <Card className="bg-gray-900/80 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><BookOpen className="h-5 w-5 text-green-400" /> Legal Terms Glossary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.legalTermsGlossary.map((item, i) => (
                  <div key={i} className="grid grid-cols-3 gap-3 p-3 rounded bg-gray-800/50 border border-gray-700">
                    <div><p className="text-white font-medium text-sm">{item.term}</p></div>
                    <div><p className="text-green-300 text-sm">{item.translation}</p></div>
                    <div><p className="text-gray-400 text-xs">{item.explanation}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-900/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Quick Legal Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {QUICK_PHRASES.map((phrase, i) => (
                  <div key={i} onClick={() => setText(phrase)} className="flex items-center justify-between p-3 rounded bg-gray-800/50 border border-gray-700 cursor-pointer hover:border-green-500/50 transition-colors">
                    <p className="text-gray-300 text-sm">{phrase}</p>
                    <Button variant="ghost" size="sm" className="text-green-400 text-xs shrink-0">Use</Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
