import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Video, FileText, AlertTriangle, CheckCircle, ArrowLeft, Shield, Eye, Scale, Clock, Download } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AnalysisResult {
  keyMoments: { timestamp: string; event: string; significance: string; legalRelevance: string }[];
  rightsViolations: { violation: string; severity: string; evidence: string; legalReference: string }[];
  officerActions: { action: string; assessment: string; proper: boolean }[];
  userActions: { action: string; assessment: string; effective: boolean }[];
  overallAssessment: string;
  evidenceQuality: string;
  recommendedActions: string[];
  legalStrength: string;
}

async function downloadIncidentPDF(result: AnalysisResult, transcript: string, state: string, recordingType: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const margin = 14;
  let y = 20;
  const pageW = doc.internal.pageSize.getWidth();

  const addLine = (text: string, fontSize = 10, bold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines: string[] = doc.splitTextToSize(text, pageW - margin * 2);
    lines.forEach((line: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += fontSize * 0.5 + 3;
    });
  };

  const addSection = (title: string) => {
    y += 4;
    doc.setFillColor(30, 30, 60);
    doc.rect(margin, y - 5, pageW - margin * 2, 8, 'F');
    doc.setTextColor(100, 200, 255);
    addLine(title, 11, true);
    doc.setTextColor(50, 50, 50);
    y += 2;
  };

  doc.setTextColor(50, 50, 50);
  doc.setFillColor(20, 20, 50);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('C.A.R.E.N.\u2122 INCIDENT REPORT', margin, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 24);
  y = 36;
  doc.setTextColor(50, 50, 50);

  addLine(`Recording Type: ${recordingType}  |  State: ${state || 'Not specified'}`, 10);
  addSection('OVERALL ASSESSMENT');
  addLine(result.overallAssessment, 10);
  addLine(`Legal Strength: ${result.legalStrength?.toUpperCase()}  |  Evidence Quality: ${result.evidenceQuality?.toUpperCase()}`, 10, true);

  addSection(`KEY MOMENTS (${result.keyMoments.length})`);
  result.keyMoments.forEach((m, i) => {
    addLine(`${i + 1}. [${m.timestamp}] ${m.event}`, 10, true);
    addLine(`   Significance: ${m.significance}`, 9);
    addLine(`   Legal: ${m.legalRelevance}`, 9);
    y += 2;
  });

  addSection(`RIGHTS VIOLATIONS (${result.rightsViolations.length})`);
  if (result.rightsViolations.length === 0) {
    addLine('No rights violations detected.', 10);
  } else {
    result.rightsViolations.forEach((v, i) => {
      addLine(`${i + 1}. [${v.severity.toUpperCase()}] ${v.violation}`, 10, true);
      addLine(`   Evidence: ${v.evidence}`, 9);
      addLine(`   Law: ${v.legalReference}`, 9);
      y += 2;
    });
  }

  addSection('RECOMMENDED NEXT STEPS');
  result.recommendedActions.forEach((action, i) => {
    addLine(`${i + 1}. ${action}`, 10);
  });

  if (transcript) {
    addSection('TRANSCRIPT / DESCRIPTION');
    addLine(transcript.substring(0, 2000) + (transcript.length > 2000 ? '...' : ''), 9);
  }

  doc.save(`CAREN_Incident_Report_${Date.now()}.pdf`);
}

export default function RecordingAnalysis() {
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState('');
  const [recordingType, setRecordingType] = useState('audio');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/ai/analyze-recording', data);
      return res.json();
    },
    onSuccess: (data: AnalysisResult) => {
      setResult(data);
      toast({ title: 'Analysis Complete', description: 'Recording has been analyzed successfully.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Analysis service unavailable.', variant: 'destructive' });
    }
  });

  const handleAnalyze = () => {
    if (!transcript || !duration) {
      toast({ title: 'Missing Info', description: 'Please provide a transcript and duration.', variant: 'destructive' });
      return;
    }
    analysisMutation.mutate({ transcript, duration: parseInt(duration) * 60, recordingType, location, state });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'major': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'minor': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'weak': return 'text-red-400';
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
              <Video className="h-7 w-7 text-purple-400" />
              AI Recording Analysis
            </h1>
            <p className="text-gray-400 text-sm">Analyze recordings for key moments and rights violations</p>
          </div>
        </div>

        {!result && (
          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                Submit Recording for Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Recording Type</label>
                  <Select value={recordingType} onValueChange={setRecordingType}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audio">Audio Recording</SelectItem>
                      <SelectItem value="video">Video Recording</SelectItem>
                      <SelectItem value="bodycam">Body Camera</SelectItem>
                      <SelectItem value="dashcam">Dashcam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Duration (minutes)</label>
                  <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 15" className="bg-gray-800 border-gray-600 text-white" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">State</label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. California" className="bg-gray-800 border-gray-600 text-white" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Location (optional)</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Interstate 95, Exit 42" className="bg-gray-800 border-gray-600 text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Transcript / Description of Recording</label>
                <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste the transcript or describe what happened in the recording in detail..." className="bg-gray-800 border-gray-600 text-white min-h-[200px]" />
              </div>
              <Button onClick={handleAnalyze} disabled={analysisMutation.isPending} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 text-lg">
                {analysisMutation.isPending ? 'Analyzing Recording...' : 'Analyze Recording with AI'}
              </Button>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={`${getStrengthColor(result.legalStrength)} bg-gray-800 border`}>
                  Legal Strength: {result.legalStrength?.toUpperCase()}
                </Badge>
                <Badge className="bg-gray-800 border border-gray-600 text-gray-300">
                  Evidence: {result.evidenceQuality?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadIncidentPDF(result, transcript, state, recordingType)}
                  className="border-purple-600 text-purple-300 hover:bg-purple-900/30"
                >
                  <Download className="h-4 w-4 mr-1.5" /> Download PDF
                </Button>
                <Button variant="outline" onClick={() => setResult(null)} className="border-gray-600 text-gray-300">New Analysis</Button>
              </div>
            </div>

            <Card className="bg-gray-900/80 border-gray-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Scale className="h-5 w-5 text-cyan-400" /> Overall Assessment</CardTitle></CardHeader>
              <CardContent><p className="text-gray-300">{result.overallAssessment}</p></CardContent>
            </Card>

            <Tabs defaultValue="moments" className="space-y-4">
              <TabsList className="bg-gray-800 border border-gray-700">
                <TabsTrigger value="moments">Key Moments ({result.keyMoments.length})</TabsTrigger>
                <TabsTrigger value="violations">Violations ({result.rightsViolations.length})</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="next">Next Steps</TabsTrigger>
              </TabsList>

              <TabsContent value="moments">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {result.keyMoments.map((moment, i) => (
                      <Card key={i} className="bg-gray-800/50 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500 shrink-0"><Clock className="h-3 w-3 mr-1" />{moment.timestamp}</Badge>
                            <div>
                              <p className="text-white font-medium">{moment.event}</p>
                              <p className="text-gray-400 text-sm mt-1">Significance: {moment.significance} | {moment.legalRelevance}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {result.keyMoments.length === 0 && <p className="text-gray-500 text-center py-8">No key moments identified</p>}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="violations">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {result.rightsViolations.map((violation, i) => (
                      <Card key={i} className={`border ${getSeverityColor(violation.severity)}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-1" />
                            <div>
                              <p className="text-white font-medium">{violation.violation}</p>
                              <p className="text-gray-400 text-sm mt-1">Evidence: {violation.evidence}</p>
                              <p className="text-cyan-400 text-xs mt-1">Legal Reference: {violation.legalReference}</p>
                            </div>
                            <Badge className={getSeverityColor(violation.severity)}>{violation.severity}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {result.rightsViolations.length === 0 && <p className="text-gray-500 text-center py-8">No rights violations detected</p>}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="actions">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-blue-400" /> Officer Actions</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.officerActions.map((action, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-900/50">
                            {action.proper ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                            <div>
                              <p className="text-white text-sm">{action.action}</p>
                              <p className="text-gray-400 text-xs">{action.assessment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-green-400" /> Your Actions</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.userActions.map((action, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-900/50">
                            {action.effective ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />}
                            <div>
                              <p className="text-white text-sm">{action.action}</p>
                              <p className="text-gray-400 text-xs">{action.assessment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="next">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {result.recommendedActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded bg-gray-900/50 border border-gray-700">
                          <span className="bg-purple-500/20 text-purple-400 rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0">{i + 1}</span>
                          <p className="text-gray-300">{action}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
