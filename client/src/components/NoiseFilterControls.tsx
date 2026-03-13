import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Settings, 
  Zap, 
  Shield,
  Activity,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  AdvancedAudioProcessor, 
  NoiseFilterConfig, 
  NOISE_FILTER_PRESETS 
} from "@/lib/audioProcessing";

interface NoiseFilterControlsProps {
  isActive: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigChange: (config: NoiseFilterConfig) => void;
  audioProcessor?: AdvancedAudioProcessor;
  className?: string;
}

export default function NoiseFilterControls({
  isActive,
  onToggle,
  onConfigChange,
  audioProcessor,
  className
}: NoiseFilterControlsProps) {
  const [config, setConfig] = useState<NoiseFilterConfig>(NOISE_FILTER_PRESETS.indoor);
  const [audioLevels, setAudioLevels] = useState({ volume: 0, quality: 0 });
  const [selectedPreset, setSelectedPreset] = useState<string>('indoor');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update audio levels in real-time
  useEffect(() => {
    if (!audioProcessor || !isActive) return;

    const updateLevels = () => {
      const levels = audioProcessor.getAudioLevels();
      setAudioLevels(levels);
    };

    const interval = setInterval(updateLevels, 100);
    return () => clearInterval(interval);
  }, [audioProcessor, isActive]);

  const handleConfigUpdate = (newConfig: Partial<NoiseFilterConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const presetConfig = NOISE_FILTER_PRESETS[preset];
    setConfig(presetConfig);
    onConfigChange(presetConfig);
  };

  const handleAggressivenessChange = (value: number[]) => {
    const levels = ['low', 'medium', 'high', 'maximum'] as const;
    const aggressiveness = levels[value[0]] || 'medium';
    handleConfigUpdate({ aggressiveness });
    
    // Update noise reduction in real-time
    if (audioProcessor) {
      audioProcessor.adjustNoiseReduction(value[0] * 33.33);
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality > 0.8) return "text-green-500";
    if (quality > 0.6) return "text-yellow-500";
    if (quality > 0.4) return "text-orange-500";
    return "text-red-500";
  };

  const getQualityLabel = (quality: number) => {
    if (quality > 0.8) return "Excellent";
    if (quality > 0.6) return "Good";
    if (quality > 0.4) return "Fair";
    return "Poor";
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Background Noise Filtering
            </CardTitle>
            <CardDescription>
              Advanced audio processing for clear voice capture
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            <Switch
              checked={isActive}
              onCheckedChange={onToggle}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Audio Level Indicators */}
        {isActive && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <Label className="text-sm">Audio Level</Label>
              </div>
              <Progress value={audioLevels.volume * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(audioLevels.volume * 100)}%
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <Label className="text-sm">Signal Quality</Label>
              </div>
              <Progress 
                value={audioLevels.quality * 100} 
                className="h-2"
              />
              <div className={cn("text-xs font-medium", getQualityColor(audioLevels.quality))}>
                {getQualityLabel(audioLevels.quality)}
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Quick Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-4">
            {/* Preset Selection */}
            <div className="space-y-2">
              <Label>Environment Preset</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Traffic/Outdoor - Maximum filtering
                    </div>
                  </SelectItem>
                  <SelectItem value="indoor">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Indoor/Office - Balanced filtering
                    </div>
                  </SelectItem>
                  <SelectItem value="quiet">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Quiet Environment - Light filtering
                    </div>
                  </SelectItem>
                  <SelectItem value="maximum">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Maximum Protection - Aggressive filtering
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aggressiveness Slider */}
            <div className="space-y-2">
              <Label>Filter Strength</Label>
              <div className="px-2">
                <Slider
                  value={[
                    config.aggressiveness === 'low' ? 0 :
                    config.aggressiveness === 'medium' ? 1 :
                    config.aggressiveness === 'high' ? 2 : 3
                  ]}
                  onValueChange={handleAggressivenessChange}
                  max={3}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Maximum</span>
                </div>
              </div>
            </div>

            {/* Preset Description */}
            <div className="p-3 bg-muted/30 rounded-lg text-sm">
              {selectedPreset === 'traffic' && (
                <div>
                  <strong>Traffic/Outdoor:</strong> Maximum noise filtering for high-noise environments like traffic stops. 
                  Aggressive frequency filtering and spectral subtraction.
                </div>
              )}
              {selectedPreset === 'indoor' && (
                <div>
                  <strong>Indoor/Office:</strong> Balanced filtering for moderate noise environments. 
                  Good for office buildings and indoor encounters.
                </div>
              )}
              {selectedPreset === 'quiet' && (
                <div>
                  <strong>Quiet Environment:</strong> Light filtering to preserve natural voice quality. 
                  Best for low-noise environments.
                </div>
              )}
              {selectedPreset === 'maximum' && (
                <div>
                  <strong>Maximum Protection:</strong> Most aggressive filtering with all features enabled. 
                  Use when audio clarity is critical despite some quality trade-offs.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Advanced Controls */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Spectral Subtraction</Label>
                  <div className="text-xs text-muted-foreground">
                    Advanced frequency-domain noise removal
                  </div>
                </div>
                <Switch
                  checked={config.spectralSubtraction}
                  onCheckedChange={(checked) => handleConfigUpdate({ spectralSubtraction: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Adaptive Filtering</Label>
                  <div className="text-xs text-muted-foreground">
                    Dynamically adjusts to changing noise conditions
                  </div>
                </div>
                <Switch
                  checked={config.adaptiveFiltering}
                  onCheckedChange={(checked) => handleConfigUpdate({ adaptiveFiltering: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Voice Activity Detection</Label>
                  <div className="text-xs text-muted-foreground">
                    Optimizes processing when voice is detected
                  </div>
                </div>
                <Switch
                  checked={config.voiceActivityDetection}
                  onCheckedChange={(checked) => handleConfigUpdate({ voiceActivityDetection: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Frequency Gating</Label>
                  <div className="text-xs text-muted-foreground">
                    Filters specific frequency ranges
                  </div>
                </div>
                <Switch
                  checked={config.frequencyGating}
                  onCheckedChange={(checked) => handleConfigUpdate({ frequencyGating: checked })}
                />
              </div>
            </div>

            {/* Performance Warning */}
            <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg text-sm">
              <strong>Note:</strong> Advanced features may increase CPU usage. 
              Disable if experiencing performance issues on older devices.
            </div>
          </TabsContent>
        </Tabs>

        {/* Control Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePresetChange('traffic')}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-1" />
            Emergency Mode
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfig(NOISE_FILTER_PRESETS.indoor)}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}