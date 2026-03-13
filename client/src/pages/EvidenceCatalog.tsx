import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  FolderOpen, 
  Search, 
  Star, 
  Flag, 
  Eye, 
  Download, 
  Share, 
  Trash2, 
  Filter,
  Upload,
  BarChart3,
  Clock,
  MapPin,
  FileVideo,
  FileAudio,
  FileImage,
  FileText,
  Settings,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface EvidenceItem {
  id: string;
  fileName: string;
  originalFileName: string;
  evidenceType: string;
  category: string;
  subCategory?: string;
  fileSize: number;
  mimeType: string;
  capturedAt: string;
  location?: any;
  isStarred: boolean;
  isFlagged: boolean;
  flagReason?: string;
  processingStatus: string;
  processingProgress: number;
  legalRelevance?: string;
  admissibilityScore?: number;
  viewCount: number;
  downloadCount: number;
  tags?: string[];
  detectedText?: string;
  detectedSpeech?: string;
  detectedObjects?: string[];
  contentAnalysis?: any;
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
}

interface EvidenceAnalytics {
  totalEvidence: number;
  evidenceByType: Array<{ evidenceType: string; count: number }>;
  evidenceByCategory: Array<{ category: string; count: number }>;
  processingStatus: Array<{ status: string; count: number }>;
}

export default function EvidenceCatalog() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's evidence
  const { data: evidenceData, isLoading: evidenceLoading } = useQuery({
    queryKey: ['/api/evidence/my-evidence', {
      searchQuery,
      evidenceType: filterType === 'all' ? undefined : filterType,
      category: filterCategory === 'all' ? undefined : filterCategory,
      processingStatus: filterStatus === 'all' ? undefined : filterStatus,
      sortBy,
      sortOrder,
      limit: 50
    }],
    refetchInterval: 30000 // Refresh every 30 seconds for processing status updates
  });

  // Get evidence analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/evidence/analytics']
  });

  // Star evidence mutation
  const starEvidenceMutation = useMutation({
    mutationFn: ({ evidenceId, isStarred }: { evidenceId: string; isStarred: boolean }) =>
      apiRequest(`/api/evidence/${evidenceId}/star`, {
        method: 'POST',
        body: JSON.stringify({ isStarred })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/evidence/my-evidence'] });
      toast({
        title: 'Success',
        description: 'Evidence updated successfully'
      });
    }
  });

  // Flag evidence mutation
  const flagEvidenceMutation = useMutation({
    mutationFn: ({ evidenceId, isFlagged, flagReason }: { evidenceId: string; isFlagged: boolean; flagReason?: string }) =>
      apiRequest(`/api/evidence/${evidenceId}/flag`, {
        method: 'POST',
        body: JSON.stringify({ isFlagged, flagReason })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/evidence/my-evidence'] });
      toast({
        title: 'Success',
        description: 'Evidence flag status updated'
      });
    }
  });

  // Delete evidence mutation
  const deleteEvidenceMutation = useMutation({
    mutationFn: (evidenceId: string) =>
      apiRequest(`/api/evidence/${evidenceId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/evidence/my-evidence'] });
      queryClient.invalidateQueries({ queryKey: ['/api/evidence/analytics'] });
      toast({
        title: 'Success',
        description: 'Evidence deleted successfully'
      });
    }
  });

  const evidence = evidenceData?.evidence || [];
  const analytics = analyticsData?.analytics as EvidenceAnalytics;

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'video': return <FileVideo className="h-5 w-5" />;
      case 'audio': return <FileAudio className="h-5 w-5" />;
      case 'photo': return <FileImage className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      default: return <FolderOpen className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRelevanceColor = (relevance?: string) => {
    switch (relevance) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="starry-btn-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-cyan-400" />
                Evidence Catalog
              </h1>
              <p className="text-gray-300 mt-1">
                Automated evidence management and analysis system
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="starry-btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="starry-btn-secondary"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Evidence
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="starry-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Evidence</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalEvidence}</p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="starry-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Processing</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {analytics.processingStatus.find(s => s.status === 'processing')?.count || 0}
                    </p>
                  </div>
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                </div>
              </CardContent>
            </Card>

            <Card className="starry-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">High Relevance</p>
                    <p className="text-2xl font-bold text-red-400">
                      {evidence.filter(e => e.legalRelevance === 'high').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="starry-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Starred</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {evidence.filter(e => e.isStarred).length}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-400 fill-current" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 starry-card">
            <TabsTrigger value="overview" className="starry-text">
              <FolderOpen className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="evidence" className="starry-text">
              <Search className="h-4 w-4 mr-2" />
              Browse Evidence
            </TabsTrigger>
            <TabsTrigger value="analytics" className="starry-text">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="starry-text">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search evidence by filename, content, or speech..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 starry-input"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 starry-input">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Added</SelectItem>
                  <SelectItem value="capturedAt">Date Captured</SelectItem>
                  <SelectItem value="fileName">File Name</SelectItem>
                  <SelectItem value="fileSize">File Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 starry-card rounded-lg">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="starry-input">
                    <SelectValue placeholder="Evidence Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="starry-input">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="traffic_stop">Traffic Stop</SelectItem>
                    <SelectItem value="police_encounter">Police Encounter</SelectItem>
                    <SelectItem value="constitutional_violation">Constitutional Violation</SelectItem>
                    <SelectItem value="misconduct">Misconduct</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="starry-input">
                    <SelectValue placeholder="Processing Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Evidence */}
              <Card className="starry-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-cyan-400" />
                    Recent Evidence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evidence.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-3">
                        {getEvidenceIcon(item.evidenceType)}
                        <div>
                          <p className="text-white font-medium text-sm truncate max-w-48">
                            {item.originalFileName}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRelevanceColor(item.legalRelevance)}>
                          {item.legalRelevance || 'unknown'}
                        </Badge>
                        {item.processingStatus !== 'completed' && (
                          <div className="w-16">
                            <Progress value={item.processingProgress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="starry-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-cyan-400" />
                    Quick Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics?.evidenceByType.map((type) => (
                    <div key={type.evidenceType} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getEvidenceIcon(type.evidenceType)}
                        <span className="text-white capitalize">{type.evidenceType}</span>
                      </div>
                      <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                        {type.count}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Evidence Tab */}
          <TabsContent value="evidence" className="space-y-6">
            {evidenceLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-400 mb-4" />
                <p className="text-gray-400">Loading evidence...</p>
              </div>
            ) : evidence.length === 0 ? (
              <Card className="starry-card">
                <CardContent className="text-center py-12">
                  <FolderOpen className="h-16 w-16 mx-auto text-gray-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Evidence Found</h3>
                  <p className="text-gray-400 mb-6">
                    {searchQuery || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'
                      ? 'No evidence matches your current filters. Try adjusting your search criteria.'
                      : 'Start building your evidence catalog by uploading files from your incidents.'}
                  </p>
                  <Button className="starry-btn-primary">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Evidence
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {evidence.map((item) => (
                  <Card key={item.id} className="starry-card group hover:border-cyan-400/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getEvidenceIcon(item.evidenceType)}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium text-sm truncate">
                              {item.originalFileName}
                            </h3>
                            <p className="text-gray-400 text-xs">
                              {formatFileSize(item.fileSize)} • {item.category}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => starEvidenceMutation.mutate({ 
                              evidenceId: item.id, 
                              isStarred: !item.isStarred 
                            })}
                            className="h-8 w-8 p-0 hover:bg-slate-700"
                          >
                            <Star className={`h-4 w-4 ${item.isStarred ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => flagEvidenceMutation.mutate({ 
                              evidenceId: item.id, 
                              isFlagged: !item.isFlagged,
                              flagReason: !item.isFlagged ? 'Quality review needed' : undefined
                            })}
                            className="h-8 w-8 p-0 hover:bg-slate-700"
                          >
                            <Flag className={`h-4 w-4 ${item.isFlagged ? 'text-red-400 fill-current' : 'text-gray-400'}`} />
                          </Button>
                        </div>
                      </div>

                      {/* Processing Status */}
                      {item.processingStatus !== 'completed' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Processing</span>
                            <span className="text-xs text-gray-400">{item.processingProgress}%</span>
                          </div>
                          <Progress value={item.processingProgress} className="h-2" />
                        </div>
                      )}

                      {/* Legal Relevance */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className={getRelevanceColor(item.legalRelevance)}>
                          {item.legalRelevance || 'unknown'} relevance
                        </Badge>
                        {item.admissibilityScore && (
                          <div className="text-xs text-gray-400">
                            Admissibility: {(item.admissibilityScore * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.capturedAt), { addSuffix: true })}
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />
                            Location recorded
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Eye className="h-3 w-3" />
                          Viewed {item.viewCount} times
                        </div>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 starry-btn-secondary">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto starry-card">
                            <DialogHeader>
                              <DialogTitle className="text-white flex items-center gap-2">
                                {getEvidenceIcon(item.evidenceType)}
                                {item.originalFileName}
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Evidence Details */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-white mb-2">File Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Size:</span>
                                      <span className="text-white">{formatFileSize(item.fileSize)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Type:</span>
                                      <span className="text-white">{item.mimeType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Category:</span>
                                      <span className="text-white">{item.category}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-white mb-2">Analysis Results</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Legal Relevance:</span>
                                      <Badge className={getRelevanceColor(item.legalRelevance)}>
                                        {item.legalRelevance || 'unknown'}
                                      </Badge>
                                    </div>
                                    {item.admissibilityScore && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Admissibility:</span>
                                        <span className="text-white">{(item.admissibilityScore * 100).toFixed(0)}%</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Processing:</span>
                                      <Badge className={`${getStatusColor(item.processingStatus)} text-white`}>
                                        {item.processingStatus}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Detected Content */}
                              {(item.detectedText || item.detectedSpeech || item.detectedObjects) && (
                                <div>
                                  <h4 className="font-medium text-white mb-2">Detected Content</h4>
                                  <div className="space-y-4">
                                    {item.detectedText && (
                                      <div>
                                        <p className="text-sm text-gray-400 mb-1">Detected Text (OCR):</p>
                                        <p className="text-sm text-white bg-slate-800/50 p-3 rounded border border-slate-700">
                                          {item.detectedText}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {item.detectedSpeech && (
                                      <div>
                                        <p className="text-sm text-gray-400 mb-1">Speech Transcription:</p>
                                        <p className="text-sm text-white bg-slate-800/50 p-3 rounded border border-slate-700">
                                          {item.detectedSpeech}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {item.detectedObjects && item.detectedObjects.length > 0 && (
                                      <div>
                                        <p className="text-sm text-gray-400 mb-1">Detected Objects:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {item.detectedObjects.map((obj, index) => (
                                            <Badge key={index} variant="outline" className="text-cyan-400 border-cyan-400">
                                              {obj}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-slate-700"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-slate-700"
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteEvidenceMutation.mutate(item.id)}
                          className="hover:bg-red-900/20 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="starry-card">
                <CardHeader>
                  <CardTitle className="text-white">Evidence by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.evidenceByType.map((type) => (
                      <div key={type.evidenceType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getEvidenceIcon(type.evidenceType)}
                          <span className="text-white capitalize">{type.evidenceType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-cyan-400 h-2 rounded-full" 
                              style={{ width: `${(type.count / analytics.totalEvidence) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-sm w-8">{type.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="starry-card">
                <CardHeader>
                  <CardTitle className="text-white">Processing Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.processingStatus.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                          <span className="text-white capitalize">{status.status}</span>
                        </div>
                        <span className="text-gray-400">{status.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="starry-card">
              <CardHeader>
                <CardTitle className="text-white">Evidence Cataloging Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-white mb-2">Automatic Analysis</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Configure which analysis tools to automatically run on new evidence.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white">Image Analysis & OCR</span>
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Audio Transcription</span>
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Legal Term Detection</span>
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Quality Assessment</span>
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-2">Storage & Retention</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Manage how long evidence is stored and when to auto-archive.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white">Auto-archive after</span>
                      <span className="text-gray-400">2 years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Cloud backup</span>
                      <span className="text-green-400">Enabled</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}