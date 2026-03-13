import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Mic, Volume2, Brain, Settings, Zap } from "lucide-react";

export default function UnifiedVoiceHub() {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    sensitivity: [75],
    learningMode: true,
    optimization: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Voice Command Hub
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Emergency voice command system for legal assistance with basic learning and optimization
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600">Overview</TabsTrigger>
            <TabsTrigger value="learning" className="data-[state=active]:bg-cyan-600">AI Learning</TabsTrigger>
            <TabsTrigger value="optimization" className="data-[state=active]:bg-cyan-600">Optimization</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800/50 border-cyan-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Mic className="h-5 w-5" />
                    Voice Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">Active</div>
                  <p className="text-gray-400">200+ command patterns</p>
                  <Badge variant="outline" className="mt-2 border-green-500 text-green-400">Optimized</Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Volume2 className="h-5 w-5" />
                    Emergency Commands
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">Ready</div>
                  <p className="text-gray-400">Emergency voice commands</p>
                  <Badge variant="outline" className="mt-2 border-blue-500 text-blue-400">Active</Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Brain className="h-5 w-5" />
                    AI Learning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">Learning</div>
                  <p className="text-gray-400">Adaptive pattern recognition</p>
                  <Badge variant="outline" className="mt-2 border-purple-500 text-purple-400">Enhanced</Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-cyan-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <Zap className="h-5 w-5" />
                    Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {voiceSettings.optimization ? "Active" : "Inactive"}
                  </div>
                  <p className="text-gray-400">Performance optimization</p>
                  <Badge variant="outline" className="mt-2 border-orange-500 text-orange-400">Enhanced</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Quick Settings */}
            <Card className="bg-gray-800/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Settings className="h-5 w-5" />
                  Quick Voice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Voice Sensitivity</label>
                    <Slider
                      value={voiceSettings.sensitivity}
                      onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, sensitivity: value }))}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400">Current: {voiceSettings.sensitivity[0]}%</div>
                  </div>

                  <div className="space-y-4">


                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">AI Learning</label>
                      <Switch
                        checked={voiceSettings.learningMode}
                        onCheckedChange={(checked) => setVoiceSettings(prev => ({ ...prev, learningMode: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">Optimization</label>
                      <Switch
                        checked={voiceSettings.optimization}
                        onCheckedChange={(checked) => setVoiceSettings(prev => ({ ...prev, optimization: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* AI Learning Tab */}
          <TabsContent value="learning" className="space-y-6">
            <Card className="bg-gray-800/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-400">Voice AI Learning</CardTitle>
                <CardDescription>How C.A.R.E.N.™ learns from your voice patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-400">200+</div>
                    <div className="text-sm text-gray-400">Voice Patterns</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">95%</div>
                    <div className="text-sm text-gray-400">Recognition Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">Learning</div>
                    <div className="text-sm text-gray-400">Continuously</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-white">Learning Features:</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Adapts to your speaking patterns and accent</li>
                    <li>• Learns emergency command preferences</li>
                    <li>• Improves recognition accuracy over time</li>
                    <li>• Personalizes voice shortcuts and commands</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multi-Speaker Tab */}


          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            <Card className="bg-gray-800/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Zap className="h-5 w-5" />
                  Voice Command Optimization
                </CardTitle>
                <CardDescription>Performance analytics and improvements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-white">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Recognition Speed</span>
                        <span className="text-green-400">Fast (120ms)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Accuracy Rate</span>
                        <span className="text-green-400">95.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Emergency Response</span>
                        <span className="text-green-400">Instant</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-white">Optimization Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Background Processing</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Emergency Priority</span>
                        <Switch checked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Noise Reduction</span>
                        <Switch checked={voiceSettings.optimization} />
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                  Run Performance Test
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}