import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Archive, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Import existing components
import FileComplaint from "@/pages/FileComplaint";
import ComplaintArchive from "@/pages/ComplaintArchive";

export default function Complaints() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("file");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gray-900/20 animate-pulse"></div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/20 to-purple-600/20 border border-red-400/30">
              <FileText className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Officer Complaints System
              </h1>
              <p className="text-gray-300 mt-1">
                File new complaints and track existing submissions
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-700/50">
              <TabsTrigger 
                value="file" 
                className="cyber-tab-trigger flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>File Complaint</span>
              </TabsTrigger>
              <TabsTrigger 
                value="archive" 
                className="cyber-tab-trigger flex items-center space-x-2"
              >
                <Archive className="w-4 h-4" />
                <span>My Complaints</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-6 p-6">
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/30">
                <FileComplaint />
              </div>
            </TabsContent>

            <TabsContent value="archive" className="mt-6 p-6">
              <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/30">
                <ComplaintArchive />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cyber-card border-purple-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <CardTitle className="text-lg text-cyan-300">Quick Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Document incidents immediately</li>
                <li>• Include witness information</li>
                <li>• Save all evidence securely</li>
                <li>• Follow up on submissions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="cyber-card border-cyan-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <CardTitle className="text-lg text-cyan-300">Status Guide</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">Draft</Badge>
                  <span className="text-gray-400">Being prepared</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">Filed</Badge>
                  <span className="text-gray-400">Under review</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300">Resolved</Badge>
                  <span className="text-gray-400">Action taken</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cyber-card border-green-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-green-400" />
                <CardTitle className="text-lg text-cyan-300">Your Rights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Right to file complaints</li>
                <li>• Protection from retaliation</li>
                <li>• Access to investigation status</li>
                <li>• Appeal unfavorable decisions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}