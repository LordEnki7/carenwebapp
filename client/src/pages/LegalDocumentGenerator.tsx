import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Download, ArrowLeft, Scale, Printer, Copy, CheckCircle, AlertCircle, Clock } from 'lucide-react';
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

interface GeneratedDocument {
  document: string;
  documentType: string;
  title: string;
  instructions: string[];
  filingDeadlines: string;
  requiredAttachments: string[];
  mailingAddress: string;
  disclaimer: string;
}

const DOCUMENT_TYPES = [
  { value: 'formal_complaint', label: 'Police Misconduct Complaint', description: 'File a formal complaint against an officer' },
  { value: 'foia_request', label: 'FOIA Request', description: 'Request public records or body cam footage' },
  { value: 'witness_statement', label: 'Witness Statement', description: 'Create a formal witness statement' },
  { value: 'incident_report', label: 'Incident Report', description: 'Generate a detailed incident report' },
  { value: 'demand_letter', label: 'Demand Letter', description: 'Demand letter for rights violations' },
  { value: 'internal_affairs', label: 'Internal Affairs Complaint', description: 'File complaint with Internal Affairs' },
];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia'
];

export default function LegalDocumentGenerator() {
  const [documentType, setDocumentType] = useState('');
  const [incidentDetails, setIncidentDetails] = useState('');
  const [state, setState] = useState('');
  const [targetAgency, setTargetAgency] = useState('');
  const [userName, setUserName] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/ai/generate-document', data);
      return res.json();
    },
    onSuccess: (data: GeneratedDocument) => {
      setGeneratedDoc(data);
      toast({ title: 'Document Generated', description: 'Your legal document has been created.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Document generation unavailable.', variant: 'destructive' });
    }
  });

  const handleGenerate = () => {
    if (!documentType || !incidentDetails || !state) {
      toast({ title: 'Missing Info', description: 'Please fill in document type, incident details, and state.', variant: 'destructive' });
      return;
    }
    generateMutation.mutate({
      documentType,
      incidentDetails,
      state,
      targetAgency: targetAgency || undefined,
      userInfo: userName ? { name: userName } : undefined,
    });
  };

  const copyToClipboard = () => {
    if (generatedDoc) {
      navigator.clipboard.writeText(generatedDoc.document);
      toast({ title: 'Copied', description: 'Document copied to clipboard.' });
    }
  };

  const handlePrint = () => {
    if (generatedDoc) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>${generatedDoc.title}</title><style>body{font-family:Times New Roman,serif;padding:40px;line-height:1.6;white-space:pre-wrap;}</style></head><body>${generatedDoc.document}</body></html>`);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    if (generatedDoc) {
      const blob = new Blob([generatedDoc.document], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedDoc.title.replace(/\s+/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
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
              <Scale className="h-7 w-7 text-amber-400" />
              AI Legal Document Generator
            </h1>
            <p className="text-gray-400 text-sm">Auto-generate complaints, FOIA requests, and legal documents</p>
          </div>
        </div>

        {!generatedDoc && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DOCUMENT_TYPES.map(dt => (
                <Card key={dt.value} onClick={() => setDocumentType(dt.value)} className={`cursor-pointer transition-all ${documentType === dt.value ? 'bg-amber-500/10 border-amber-500/50' : 'bg-gray-900/80 border-gray-700 hover:border-gray-600'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className={`h-5 w-5 ${documentType === dt.value ? 'text-amber-400' : 'text-gray-400'}`} />
                      <h3 className={`font-semibold text-sm ${documentType === dt.value ? 'text-amber-400' : 'text-white'}`}>{dt.label}</h3>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{dt.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gray-900/80 border-gray-700 backdrop-blur">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Your State</label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Target Agency (optional)</label>
                    <Input value={targetAgency} onChange={(e) => setTargetAgency(e.target.value)} placeholder="e.g. City Police Dept" className="bg-gray-800 border-gray-600 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Your Name (optional)</label>
                    <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="For document header" className="bg-gray-800 border-gray-600 text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Incident Details</label>
                  <Textarea value={incidentDetails} onChange={(e) => setIncidentDetails(e.target.value)} placeholder="Describe what happened in detail. Include dates, times, locations, officer badge numbers, and any witnesses..." className="bg-gray-800 border-gray-600 text-white min-h-[150px]" />
                </div>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 text-lg">
                  {generateMutation.isPending ? 'Generating Document...' : 'Generate Legal Document'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {generatedDoc && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl font-bold text-white">{generatedDoc.title}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="border-gray-600 text-gray-300"><Copy className="h-4 w-4 mr-1" /> Copy</Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="border-gray-600 text-gray-300"><Printer className="h-4 w-4 mr-1" /> Print</Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="border-gray-600 text-gray-300"><Download className="h-4 w-4 mr-1" /> Download</Button>
                <Button variant="outline" size="sm" onClick={() => setGeneratedDoc(null)} className="border-gray-600 text-gray-300">New Document</Button>
              </div>
            </div>

            <Tabs defaultValue="document" className="space-y-4">
              <TabsList className="bg-gray-800 border border-gray-700">
                <TabsTrigger value="document">Document</TabsTrigger>
                <TabsTrigger value="instructions">Filing Instructions</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>

              <TabsContent value="document">
                <Card className="bg-white text-black border-gray-300">
                  <CardContent className="p-8">
                    <ScrollArea className="h-[500px]">
                      <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{generatedDoc.document}</pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-500/10 border-yellow-500/30 mt-3">
                  <CardContent className="p-4">
                    <p className="text-yellow-300 text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      {generatedDoc.disclaimer}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructions">
                <Card className="bg-gray-900/80 border-gray-700">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      {generatedDoc.instructions.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded bg-gray-800/50 border border-gray-700">
                          <span className="bg-amber-500/20 text-amber-400 rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0">{i + 1}</span>
                          <p className="text-gray-300">{step}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/30 mt-4">
                      <Clock className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-semibold text-sm">Filing Deadlines</p>
                        <p className="text-gray-300 text-sm">{generatedDoc.filingDeadlines}</p>
                      </div>
                    </div>
                    {generatedDoc.mailingAddress && (
                      <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
                        <p className="text-gray-400 text-sm">Mailing Address:</p>
                        <p className="text-white">{generatedDoc.mailingAddress}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments">
                <Card className="bg-gray-900/80 border-gray-700">
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      {generatedDoc.requiredAttachments.map((attachment, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded bg-gray-800/50 border border-gray-700">
                          <CheckCircle className="h-4 w-4 text-cyan-400" />
                          <p className="text-gray-300">{attachment}</p>
                        </div>
                      ))}
                      {generatedDoc.requiredAttachments.length === 0 && <p className="text-gray-500 text-center py-4">No specific attachments required</p>}
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
