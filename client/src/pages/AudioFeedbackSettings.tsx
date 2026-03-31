import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";
import { Volume2, VolumeX, Play, RotateCcw, CheckCircle, AlertTriangle, Mic, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AudioFeedbackSettings() {
  const {
    settings,
    isPlaying,
    supportedVoices,
    selectedVoice,
    updateSettings,
    testAudioFeedback,
    setSelectedVoice,
    resetToDefaults,
    playConfirmation,
    playEmergencyAlert,
    playNavigationFeedback,
    playLegalFeedback
  } = useAudioFeedback();

  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Audio Settings Saved",
      description: "Your voice feedback preferences have been updated",
    });
    if (settings.enabled) {
      playConfirmation("Audio feedback settings");
    }
  };

  const handleTestAction = (type: string) => {
    switch (type) {
      case 'confirmation':
        playConfirmation("Test action");
        break;
      case 'emergency':
        playEmergencyAlert("Emergency test alert - this is only a test");
        break;
      case 'navigation':
        playNavigationFeedback("test page");
        break;
      case 'legal':
        playLegalFeedback("Test legal information - fourth amendment rights activated");
        break;
      default:
        testAudioFeedback();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Cyber Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,212,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(138,43,226,0.1),transparent_50%)]"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Audio Feedback Settings
            </h1>
            <p className="text-gray-300 text-lg">
              Configure voice confirmations and audio feedback for all C.A.R.E.N.™ actions
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-black/20 border border-cyan-500/30">
              <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Volume2 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="voice" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Mic className="w-4 h-4 mr-2" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="test" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Play className="w-4 h-4 mr-2" />
                Test
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="bg-black/30 border border-cyan-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Audio Feedback Status
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Voice confirmations provide audio feedback for all your actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Enable/Disable Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-3">
                      {settings.enabled ? (
                        <Volume2 className="w-6 h-6 text-cyan-400" />
                      ) : (
                        <VolumeX className="w-6 h-6 text-gray-400" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">Audio Feedback</h3>
                        <p className="text-gray-300 text-sm">
                          {settings.enabled ? "Voice confirmations enabled" : "Voice confirmations disabled"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(enabled) => updateSettings({ enabled })}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                  </div>

                  {/* Current Settings Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-black/20 border border-cyan-500/20">
                      <div className="text-2xl font-bold text-cyan-400">{Math.round(settings.volume * 100)}%</div>
                      <div className="text-gray-300 text-sm">Volume Level</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-black/20 border border-cyan-500/20">
                      <div className="text-2xl font-bold text-cyan-400">{settings.voiceSpeed}x</div>
                      <div className="text-gray-300 text-sm">Speech Speed</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-black/20 border border-cyan-500/20">
                      <div className="text-2xl font-bold text-cyan-400 capitalize">{settings.confirmationStyle}</div>
                      <div className="text-gray-300 text-sm">Confirmation Style</div>
                    </div>
                  </div>

                  {/* Emergency Override Notice */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <div>
                      <h4 className="text-red-400 font-semibold">Emergency Override</h4>
                      <p className="text-gray-300 text-sm">
                        Emergency alerts will always play audio, even when feedback is disabled
                      </p>
                    </div>
                    <Badge variant="outline" className="border-red-500/30 text-red-400">
                      {settings.emergencyOverride ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="space-y-6">
              <Card className="bg-black/30 border border-cyan-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Voice Selection
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Choose your preferred voice for audio feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Voice Selection */}
                  <div className="space-y-3">
                    <Label className="text-white">Voice:</Label>
                    <Select value={selectedVoice || ""} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="bg-black/20 border-cyan-500/30 text-white">
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/80 border-cyan-500/30">
                        {supportedVoices.map((voice) => (
                          <SelectItem key={voice.name} value={voice.name} className="text-white hover:bg-cyan-500/20">
                            {voice.name} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice Speed */}
                  <div className="space-y-3">
                    <Label className="text-white">Speech Speed: {settings.voiceSpeed}x</Label>
                    <Slider
                      value={[settings.voiceSpeed]}
                      onValueChange={([value]) => updateSettings({ voiceSpeed: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Slow (0.5x)</span>
                      <span>Normal (1.0x)</span>
                      <span>Fast (2.0x)</span>
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div className="space-y-3">
                    <Label className="text-white">Volume: {Math.round(settings.volume * 100)}%</Label>
                    <Slider
                      value={[settings.volume]}
                      onValueChange={([value]) => updateSettings({ volume: value })}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Quiet (10%)</span>
                      <span>Medium (50%)</span>
                      <span>Loud (100%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-black/30 border border-cyan-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Configure detailed audio feedback preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Confirmation Style */}
                  <div className="space-y-3">
                    <Label className="text-white">Confirmation Style:</Label>
                    <Select 
                      value={settings.confirmationStyle} 
                      onValueChange={(value: 'brief' | 'detailed' | 'silent') => 
                        updateSettings({ confirmationStyle: value })
                      }
                    >
                      <SelectTrigger className="bg-black/20 border-cyan-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/80 border-cyan-500/30">
                        <SelectItem value="brief" className="text-white hover:bg-cyan-500/20">
                          Brief - Short confirmations
                        </SelectItem>
                        <SelectItem value="detailed" className="text-white hover:bg-cyan-500/20">
                          Detailed - Full descriptions
                        </SelectItem>
                        <SelectItem value="silent" className="text-white hover:bg-cyan-500/20">
                          Silent - No confirmations (emergency only)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emergency Override */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div>
                      <h4 className="text-white font-semibold">Emergency Override</h4>
                      <p className="text-gray-300 text-sm">Always play emergency alerts regardless of settings</p>
                    </div>
                    <Switch
                      checked={settings.emergencyOverride}
                      onCheckedChange={(emergencyOverride) => updateSettings({ emergencyOverride })}
                      className="data-[state=checked]:bg-red-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button 
                      onClick={handleSaveSettings}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Save Settings
                    </Button>
                    <Button 
                      onClick={resetToDefaults}
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Test Tab */}
            <TabsContent value="test" className="space-y-6">
              <Card className="bg-black/30 border border-cyan-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Test Audio Feedback
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Test different types of voice confirmations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Test Buttons Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleTestAction('general')}
                      disabled={isPlaying}
                      className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 h-16 flex items-center gap-3"
                    >
                      <Play className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">General Test</div>
                        <div className="text-xs opacity-80">Basic audio feedback test</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => handleTestAction('confirmation')}
                      disabled={isPlaying}
                      className="bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 h-16 flex items-center gap-3"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">Action Confirmation</div>
                        <div className="text-xs opacity-80">Test action confirmations</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => handleTestAction('emergency')}
                      disabled={isPlaying}
                      className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 h-16 flex items-center gap-3"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">Emergency Alert</div>
                        <div className="text-xs opacity-80">Test emergency notifications</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => handleTestAction('navigation')}
                      disabled={isPlaying}
                      className="bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 h-16 flex items-center gap-3"
                    >
                      <Volume2 className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">Navigation</div>
                        <div className="text-xs opacity-80">Test navigation feedback</div>
                      </div>
                    </Button>
                  </div>

                  {/* Status Display */}
                  {isPlaying && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                      <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse"></div>
                      <span className="text-cyan-400 font-semibold">Playing audio feedback...</span>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <h4 className="text-purple-400 font-semibold mb-2">Testing Instructions</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Ensure your device volume is audible</li>
                      <li>• Test different confirmation types to find your preference</li>
                      <li>• Emergency alerts will play even if audio feedback is disabled</li>
                      <li>• Voice settings affect all test types</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}