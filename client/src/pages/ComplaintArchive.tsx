import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Badge as BadgeIcon, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';

interface OfficerComplaint {
  id: string;
  userId: string;
  incidentDate: Date;
  complaintType: string;
  description: string;
  status: string;
  jurisdiction: string;
  officerName?: string;
  officerBadgeNumber?: string;
  officerDepartment?: string;
  location?: any;
  evidenceAttached: boolean;
  submittedToAgency?: string;
  filedAt?: Date;
  lastUpdated?: Date;
  responseDeadline?: Date;
  currentStep: string;
  createdAt: Date;
}

interface ComplaintUpdate {
  id: string;
  complaintId: string;
  updateType: string;
  title: string;
  description: string;
  createdAt: Date;
}

export default function ComplaintArchive() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<OfficerComplaint | null>(null);

  // Fetch user's complaints
  const { data: complaints = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/complaints/my-complaints'],
    enabled: true
  });

  // Fetch updates for selected complaint
  const { data: complaintUpdates = [] } = useQuery({
    queryKey: ['/api/complaints', selectedComplaint?.id, 'updates'],
    enabled: !!selectedComplaint?.id
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in_review':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'investigation':
        return <AlertCircle className="h-4 w-4 text-orange-400" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_review':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'investigation':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'closed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const filteredComplaints = complaints.filter((complaint: OfficerComplaint) => {
    const matchesSearch = searchTerm === '' || 
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.officerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Sidebar />
        <div className="ml-64 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading complaints...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Complaint Archive
            </h1>
            <p className="text-gray-300 text-lg">
              Track your submitted complaints and their investigation status
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-cyan-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-cyan-400" />
                  <div>
                    <p className="text-2xl font-bold text-cyan-300">{complaints.length}</p>
                    <p className="text-gray-400 text-sm">Total Complaints</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-green-300">
                      {complaints.filter((c: OfficerComplaint) => c.status === 'filed').length}
                    </p>
                    <p className="text-gray-400 text-sm">Filed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-300">
                      {complaints.filter((c: OfficerComplaint) => c.status === 'in_review').length}
                    </p>
                    <p className="text-gray-400 text-sm">Under Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-8 w-8 text-orange-400" />
                  <div>
                    <p className="text-2xl font-bold text-orange-300">
                      {complaints.filter((c: OfficerComplaint) => c.status === 'investigation').length}
                    </p>
                    <p className="text-gray-400 text-sm">Active Investigations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="bg-slate-800/50 border-cyan-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search complaints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-cyan-500/30 text-cyan-300"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-900/50 border border-cyan-500/30 rounded-md text-cyan-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="filed">Filed</option>
                  <option value="in_review">Under Review</option>
                  <option value="investigation">Investigation</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Complaints List */}
          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
              <Card className="bg-slate-800/50 border-cyan-500/20">
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Complaints Found</h3>
                  <p className="text-gray-400 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No complaints match your search criteria.'
                      : 'You haven\'t submitted any complaints yet.'
                    }
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/file-complaint'}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                  >
                    File Your First Complaint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredComplaints.map((complaint: OfficerComplaint) => (
                <Card key={complaint.id} className="bg-slate-800/50 border-cyan-500/20 hover:border-cyan-400/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(complaint.status)}
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-gray-400 text-sm">
                            Filed {formatDate(complaint.filedAt || complaint.createdAt)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-cyan-300">
                          {complaint.complaintType.replace('_', ' ').toUpperCase()} Complaint
                        </h3>
                        
                        <p className="text-gray-300 line-clamp-2">
                          {complaint.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          {complaint.officerName && (
                            <div className="flex items-center space-x-1">
                              <BadgeIcon className="h-4 w-4" />
                              <span>Officer: {complaint.officerName}</span>
                              {complaint.officerBadgeNumber && (
                                <span>(#{complaint.officerBadgeNumber})</span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{complaint.jurisdiction}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(complaint.incidentDate)}</span>
                          </div>
                          
                          {complaint.evidenceAttached && (
                            <Badge variant="outline" className="text-green-300 border-green-500/30">
                              Evidence Attached
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedComplaint(complaint)}
                            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-800 border-cyan-500/30">
                          <DialogHeader>
                            <DialogTitle className="text-cyan-300">Complaint Details</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Complaint ID: {selectedComplaint?.id}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedComplaint && (
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
                                <TabsTrigger value="details" className="text-cyan-300">Details</TabsTrigger>
                                <TabsTrigger value="timeline" className="text-cyan-300">Timeline</TabsTrigger>
                                <TabsTrigger value="actions" className="text-cyan-300">Actions</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="details" className="space-y-4 mt-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-400">Status</label>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {getStatusIcon(selectedComplaint.status)}
                                      <Badge className={getStatusColor(selectedComplaint.status)}>
                                        {selectedComplaint.status.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-400">Type</label>
                                    <p className="text-cyan-300 mt-1">
                                      {selectedComplaint.complaintType.replace('_', ' ').toUpperCase()}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-400">Incident Date</label>
                                    <p className="text-cyan-300 mt-1">
                                      {formatDate(selectedComplaint.incidentDate)}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-400">Filed Date</label>
                                    <p className="text-cyan-300 mt-1">
                                      {formatDate(selectedComplaint.filedAt || selectedComplaint.createdAt)}
                                    </p>
                                  </div>
                                  
                                  {selectedComplaint.officerName && (
                                    <>
                                      <div>
                                        <label className="text-sm font-medium text-gray-400">Officer Name</label>
                                        <p className="text-cyan-300 mt-1">{selectedComplaint.officerName}</p>
                                      </div>
                                      
                                      <div>
                                        <label className="text-sm font-medium text-gray-400">Badge Number</label>
                                        <p className="text-cyan-300 mt-1">{selectedComplaint.officerBadgeNumber || 'Not provided'}</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-gray-400">Description</label>
                                  <p className="text-gray-300 mt-1 whitespace-pre-wrap">
                                    {selectedComplaint.description}
                                  </p>
                                </div>
                                
                                {selectedComplaint.location && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-400">Location</label>
                                    <p className="text-cyan-300 mt-1">
                                      {typeof selectedComplaint.location === 'string' 
                                        ? selectedComplaint.location
                                        : selectedComplaint.location.address || 
                                          `${selectedComplaint.location.city}, ${selectedComplaint.location.state}`
                                      }
                                    </p>
                                  </div>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="timeline" className="space-y-4 mt-6">
                                <div className="space-y-4">
                                  {complaintUpdates.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No updates available yet.</p>
                                  ) : (
                                    complaintUpdates.map((update: ComplaintUpdate) => (
                                      <div key={update.id} className="flex space-x-4">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                          <h4 className="font-medium text-cyan-300">{update.title}</h4>
                                          <p className="text-gray-300 text-sm mt-1">{update.description}</p>
                                          <p className="text-gray-400 text-xs mt-2">
                                            {formatDate(update.createdAt)}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="actions" className="space-y-4 mt-6">
                                <div className="space-y-3">
                                  <Button 
                                    variant="outline" 
                                    className="w-full justify-start border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Complaint Copy
                                  </Button>
                                  
                                  {selectedComplaint.submittedToAgency && (
                                    <Button 
                                      variant="outline" 
                                      className="w-full justify-start border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      View on Agency Website
                                    </Button>
                                  )}
                                  
                                  <Button 
                                    variant="outline" 
                                    className="w-full justify-start border-green-500/30 text-green-300 hover:bg-green-500/10"
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Request Status Update
                                  </Button>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}