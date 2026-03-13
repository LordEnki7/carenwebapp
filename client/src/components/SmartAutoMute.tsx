import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSmartAutoMute } from '@/hooks/useSmartAutoMute';
import {
  Mic,
  MicOff,
  Shield,
  Volume2,
  VolumeX,
  Brain,
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle,
  Timer,
  Zap,
  ShieldAlert
} from 'lucide-react';

interface SmartAutoMuteProps {
  mediaStream?: MediaStream | null;
  onMuteChange?: (isMuted: boolean) => void;
}

export function SmartAutoMute({ mediaStream, onMuteChange }: SmartAutoMuteProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  
  const {
    settings,
    muteState,
    initializeAudioAnalysis,
    toggleMute,
    emergencyUnmute,
    updateSettings,
    isInitialized,
    audioQuality,
    currentAnalysis
  } = useSmartAutoMute();

  // Initialize when media stream becomes available
  useEffect(() => {
    if (mediaStream && !isInitialized) {
      initializeAudioAnalysis(mediaStream);
      setIsRecording(true);
    }
  }, [mediaStream, isInitialized, initializeAudioAnalysis]);

  // Notify parent component of mute changes
  useEffect(() => {
    if (onMuteChange) {
      onMuteChange(muteState.isMuted);
    }
  }, [muteState.isMuted, onMuteChange]);

  const handleSensitivityChange = (value: number[]) => {
    const sensitivity = value[0] <= 0.3 ? 'low' : value[0] <= 0.7 ? 'medium' : 'high';
    updateSettings({ sensitivity, autoMuteThreshold: value[0] });
  };

  const handleBackgroundNoiseThresholdChange = (value: number[]) => {
    updateSettings({ backgroundNoiseThreshold: value[0] });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getVolumeIcon = () => {
    if (!currentAnalysis) return <Volume2 className="w-5 h-5" />;
    if (currentAnalysis.volume > 0.7) return <Volume2 className="w-5 h-5 text-green-500" />;
    if (currentAnalysis.volume > 0.3) return <Volume2 className="w-5 h-5 text-yellow-500" />;
    return <VolumeX className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className={`border-2 ${muteState.isMuted ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-green-500 bg-green-50 dark:bg-green-950'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Smart Auto-Mute
              {isInitialized && (
                <Badge variant={muteState.isMuted ? 'destructive' : 'default'}>
                  {muteState.isMuted ? 'Muted' : 'Active'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {muteState.isMuted ? (
                <MicOff className="w-6 h-6 text-red-500 animate-pulse" />
              ) : (
                <Mic className="w-6 h-6 text-green-500" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          {muteState.isMuted && muteState.muteReason && (
            <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
              <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium text-red-700 dark:text-red-300">
                  Audio Muted
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {muteState.muteReason}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {Math.round(muteState.confidenceLevel * 100)}%
                </div>
              </div>
            </div>
          )}

          {/* Audio Analysis */}
          {isInitialized && currentAnalysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                {getVolumeIcon()}
                <div>
                  <div className="text-xs text-gray-500">Volume</div>
                  <div className="text-sm font-mono">
                    {Math.round(currentAnalysis.volume * 100)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Activity className="w-4 h-4" />
                <div>
                  <div className="text-xs text-gray-500">Quality</div>
                  <div className={`text-sm font-medium ${getQualityColor(audioQuality)}`}>
                    {audioQuality}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Shield className="w-4 h-4" />
                <div>
                  <div className="text-xs text-gray-500">Voice</div>
                  <div className="text-sm">
                    {currentAnalysis.voiceDetected ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-300" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Timer className="w-4 h-4" />
                <div>
                  <div className="text-xs text-gray-500">Mute Time</div>
                  <div className="text-sm font-mono">
                    {formatTime(muteState.totalMuteTime)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={toggleMute}
              variant={muteState.isMuted ? "destructive" : "outline"}
              className="flex-1"
            >
              {muteState.isMuted ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Unmute Audio
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Manual Mute
                </>
              )}
            </Button>

            {muteState.isMuted && (
              <Button
                onClick={emergencyUnmute}
                variant="default"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Emergency Override
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Settings */}
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Auto-Mute Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master Enable */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable Smart Auto-Mute</div>
                  <div className="text-sm text-gray-500">
                    Automatically mute when threats are detected
                  </div>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                />
              </div>

              {/* Sensitivity */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-medium">Detection Sensitivity</label>
                  <Badge variant="outline">{settings.sensitivity}</Badge>
                </div>
                <Slider
                  value={[settings.autoMuteThreshold]}
                  onValueChange={handleSensitivityChange}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">
                  Higher sensitivity = more aggressive muting
                </div>
              </div>

              {/* Background Noise Threshold */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-medium">Background Noise Threshold</label>
                  <span className="text-sm">{Math.round(settings.backgroundNoiseThreshold * 100)}%</span>
                </div>
                <Slider
                  value={[settings.backgroundNoiseThreshold]}
                  onValueChange={handleBackgroundNoiseThresholdChange}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Feature Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Voice Detection</div>
                    <div className="text-sm text-gray-500">
                      Detect and analyze voice patterns
                    </div>
                  </div>
                  <Switch
                    checked={settings.voiceDetectionEnabled}
                    onCheckedChange={(checked) => updateSettings({ voiceDetectionEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Police Voice Detection</div>
                    <div className="text-sm text-gray-500">
                      Automatically mute when police voice detected
                    </div>
                  </div>
                  <Switch
                    checked={settings.policeVoiceDetection}
                    onCheckedChange={(checked) => updateSettings({ policeVoiceDetection: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Suspicious Audio Detection</div>
                    <div className="text-sm text-gray-500">
                      Mute on sudden loud noises or threats
                    </div>
                  </div>
                  <Switch
                    checked={settings.suspiciousAudioDetection}
                    onCheckedChange={(checked) => updateSettings({ suspiciousAudioDetection: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Emergency Override</div>
                    <div className="text-sm text-gray-500">
                      Prevent auto-unmute during emergencies
                    </div>
                  </div>
                  <Switch
                    checked={settings.emergencyOverride}
                    onCheckedChange={(checked) => updateSettings({ emergencyOverride: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Real-Time Audio Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInitialized && currentAnalysis ? (
                <>
                  {/* Volume Analysis */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Audio Volume</span>
                      <span className="text-sm">{Math.round(currentAnalysis.volume * 100)}%</span>
                    </div>
                    <Progress value={currentAnalysis.volume * 100} className="h-2" />
                  </div>

                  {/* Background Noise */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Background Noise</span>
                      <span className="text-sm">{Math.round(currentAnalysis.backgroundNoise * 100)}%</span>
                    </div>
                    <Progress 
                      value={currentAnalysis.backgroundNoise * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Detection Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded-lg border ${currentAnalysis.voiceDetected ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${currentAnalysis.voiceDetected ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">Voice Detected</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg border ${currentAnalysis.isPoliceVoice ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${currentAnalysis.isPoliceVoice ? 'text-orange-500' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">Authority Voice</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg border ${currentAnalysis.isSuspiciousSound ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${currentAnalysis.isSuspiciousSound ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">Suspicious Audio</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg border ${getQualityColor(audioQuality)}`}>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm font-medium">Quality: {audioQuality}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Audio analysis will begin when recording starts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Mute Trigger Phrases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  These phrases will automatically trigger muting when detected:
                </div>
                <div className="grid gap-2">
                  {settings.muteTriggerPhrases.map((phrase, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm font-mono">"{phrase}"</span>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  Phrase detection requires microphone permissions and speech recognition support.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}