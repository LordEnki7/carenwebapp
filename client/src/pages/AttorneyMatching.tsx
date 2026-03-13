import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Gavel, ArrowLeft, Search, AlertCircle, CheckCircle, DollarSign, Clock, HelpCircle, ShieldAlert, Users } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MatchResult {
  recommendedSpecializations: string[];
  searchCriteria: { specialization: string; importance: string; reason: string }[];
  urgencyLevel: string;
  estimatedCaseComplexity: string;
  questionsToAsk: string[];
  redFlags: string[];
  estimatedCostRange: string;
  recommendation: string;
}

const INCIDENT_TYPES = [
  { value: 'traffic_stop_violation', label: 'Traffic Stop Rights Violation' },
  { value: 'excessive_force', label: 'Excessive Force' },
  { value: 'unlawful_search', label: 'Unlawful Search & Seizure' },
  { value: 'false_arrest', label: 'False Arrest' },
  { value: 'racial_profiling', label: 'Racial Profiling' },
  { value: 'recording_rights', label: 'Recording Rights Violation' },
  { value: 'property_damage', label: 'Property Damage by Police' },
  { value: 'wrongful_detention', label: 'Wrongful Detention' },
  { value: 'miranda_violation', label: 'Miranda Rights Violation' },
  { value: 'vehicle_accident', label: 'Vehicle Accident' },
  { value: 'dui_defense', label: 'DUI Defense' },
  { value: 'other', label: 'Other Legal Issue' },
];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia'
];

export default function AttorneyMatching() {
  const [incidentType, setIncidentType] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const { toast } = useToast();

  const matchMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/ai/match-attorney', data);
      return res.json();
    },
    onSuccess: (data: MatchResult) => {
      setResult(data);
      toast({ title: 'Match Found', description: 'Attorney recommendations are ready.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Attorney matching unavailable.', variant: 'destructive' });
    }
  });

  const handleMatch = () => {
    if (!incidentType || !state || !description) {
      toast({ title: 'Missing Info', description: 'Please fill in incident type, state, and description.', variant: 'destructive' });
      return;
    }
    matchMutation.mutate({ incidentType, state, city, severity, description });
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'immediate': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'urgent': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'standard': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
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
              <Gavel className="h-7 w-7 text-blue-400" />
              AI Attorney Matching
            </h1>
            <p className="text-gray-400 text-sm">Find the right attorney for your specific situation</p>
          </div>
        </div>

        {!result && (
          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-400" />
                Describe Your Legal Situation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Incident Type</label>
                  <Select value={incidentType} onValueChange={setIncidentType}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{INCIDENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Severity</label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">State</label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">City (optional)</label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Los Angeles" className="bg-gray-800 border-gray-600 text-white" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Describe What Happened</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details about your incident including what happened, when, and any relevant circumstances..." className="bg-gray-800 border-gray-600 text-white min-h-[120px]" />
              </div>
              <Button onClick={handleMatch} disabled={matchMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 text-lg">
                {matchMutation.isPending ? 'Finding Attorneys...' : 'Find My Attorney Match'}
              </Button>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                <Badge className={getUrgencyColor(result.urgencyLevel)}>Urgency: {result.urgencyLevel?.toUpperCase()}</Badge>
                <Badge className="bg-gray-800 border border-gray-600 text-gray-300">Complexity: {result.estimatedCaseComplexity}</Badge>
              </div>
              <Button variant="outline" onClick={() => setResult(null)} className="border-gray-600 text-gray-300">New Search</Button>
            </div>

            <Card className="bg-gray-900/80 border-gray-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Users className="h-5 w-5 text-blue-400" /> AI Recommendation</CardTitle></CardHeader>
              <CardContent><p className="text-gray-300">{result.recommendation}</p></CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-900/80 border-gray-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Gavel className="h-5 w-5 text-blue-400" /> Recommended Specializations</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendedSpecializations.map((spec, i) => (
                      <Badge key={i} className="bg-blue-500/20 text-blue-400 border-blue-500">{spec}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {result.searchCriteria.map((criteria, i) => (
                      <div key={i} className="p-2 rounded bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center justify-between">
                          <p className="text-white text-sm font-medium">{criteria.specialization}</p>
                          <span className={`text-xs font-semibold ${getImportanceColor(criteria.importance)}`}>{criteria.importance}</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{criteria.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/80 border-gray-700">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-400" /> Cost Estimate</CardTitle></CardHeader>
                <CardContent>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                    <p className="text-green-300 text-lg font-semibold">{result.estimatedCostRange}</p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold flex items-center gap-2"><HelpCircle className="h-4 w-4 text-cyan-400" /> Questions to Ask</h4>
                    <ScrollArea className="h-[150px]">
                      {result.questionsToAsk.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-800/50 mb-1">
                          <span className="text-cyan-400 text-sm shrink-0">{i + 1}.</span>
                          <p className="text-gray-300 text-sm">{q}</p>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.redFlags.length > 0 && (
              <Card className="bg-red-500/5 border-red-500/30">
                <CardHeader><CardTitle className="text-red-400 text-lg flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Red Flags to Watch For</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.redFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-gray-300 text-sm">{flag}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
