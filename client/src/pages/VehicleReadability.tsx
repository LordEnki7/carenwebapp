import { useState, useEffect } from 'react';
import { useVehicleReadability } from '@/hooks/useVehicleReadability';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import { 
  Sun, 
  Moon, 
  Zap, 
  Eye, 
  Settings, 
  Monitor, 
  Car,
  Shield,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  TestTube
} from 'lucide-react';

export default function VehicleReadability() {
  const { toast } = useToast();
  const {
    settings,
    ambientLight,
    isActive,
    sensorSupported,
    updateSettings,
    activateEmergencyMode,
    deactivateEmergencyMode,
    getReadabilityScore,
    resetToDefaults
  } = useVehicleReadability();

  const [isTestingReadability, setIsTestingReadability] = useState(false);

  const handleModeChange = (mode: 'auto' | 'high-contrast' | 'night' | 'normal') => {
    updateSettings({ mode });
    toast({
      title: "Readability Mode Changed",
      description: `Switched to ${mode.replace('-', ' ')} mode`,
    });
  };

  const testReadabilityMode = async (mode: 'high-contrast' | 'night') => {
    setIsTestingReadability(true);
    const originalMode = settings.mode;
    
    updateSettings({ mode });
    
    setTimeout(() => {
      updateSettings({ mode: originalMode });
      setIsTestingReadability(false);
      toast({
        title: "Test Complete",
        description: `${mode.replace('-', ' ')} mode test finished`,
      });
    }, 5000);
  };

  const handleEmergencyToggle = () => {
    if (settings.emergencyOverride) {
      deactivateEmergencyMode();
      toast({
        title: "Emergency Mode Deactivated",
        description: "Returned to normal readability settings",
      });
    } else {
      activateEmergencyMode();
      toast({
        title: "Emergency Mode Activated",
        description: "Maximum contrast and brightness enabled",
        variant: "destructive",
      });
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'high-contrast': return <Sun className="w-4 h-4" />;
      case 'night': return <Moon className="w-4 h-4" />;
      case 'auto': return <Zap className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'high-contrast': return 'bg-yellow-500';
      case 'night': return 'bg-purple-500';
      case 'auto': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const readabilityScore = getReadabilityScore();

  return (
    <div className="min-h-screen cyber-background">
      <Sidebar />
      
      <div className="pl-72" style={{position: 'relative', zIndex: 1}}>
        <div className="p-6 max-w-7xl mx-auto space-y-6" style={{position: 'relative', zIndex: 2}}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold cyber-text-primary mb-2">
              Vehicle Screen Readability
            </h1>
            <p className="cyber-text-secondary">
              Optimize screen visibility for bright sunlight and low-light driving conditions
            </p>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="cyber-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Mode</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getModeIcon(settings.mode)}
                      <span className="font-semibold capitalize">
                        {settings.mode.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <Badge className={getModeColor(settings.mode)}>
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Readability Score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Target className="w-4 h-4" />
                      <span className="font-semibold">{readabilityScore}%</span>
                    </div>
                  </div>
                  <Progress value={readabilityScore} className="w-12 h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Light Level</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Lightbulb className="w-4 h-4" />
                      <span className="font-semibold">{Math.round(ambientLight.lightLevel)} lx</span>
                    </div>
                  </div>
                  <Badge variant={ambientLight.isOutdoor ? "destructive" : "secondary"}>
                    {ambientLight.isOutdoor ? "Outdoor" : "Indoor"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="cyber-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sensor Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Eye className="w-4 h-4" />
                      <span className="font-semibold">
                        {sensorSupported ? "Hardware" : "Fallback"}
                      </span>
                    </div>
                  </div>
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="modes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-black/50 border border-cyan-500/20">
              <TabsTrigger 
                value="modes" 
                className="tabs-trigger-visible font-semibold transition-all duration-200 hover:bg-cyan-900/20 border-r border-cyan-500/10"
                style={{
                  color: '#22d3ee',
                  borderRadius: '0.375rem'
                }}
              >
                <Monitor className="w-4 h-4 mr-2" style={{ color: '#22d3ee' }} />
                Display Modes
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="tabs-trigger-visible font-semibold transition-all duration-200 hover:bg-purple-900/20 border-r border-purple-500/10"
                style={{
                  color: '#a855f7',
                  borderRadius: '0.375rem'
                }}
              >
                <Settings className="w-4 h-4 mr-2" style={{ color: '#a855f7' }} />
                Fine Tuning
              </TabsTrigger>
              <TabsTrigger 
                value="testing" 
                className="tabs-trigger-visible font-semibold transition-all duration-200 hover:bg-green-900/20 border-r border-green-500/10"
                style={{
                  color: '#4ade80',
                  borderRadius: '0.375rem'
                }}
              >
                <TestTube className="w-4 h-4 mr-2" style={{ color: '#4ade80' }} />
                Live Testing
              </TabsTrigger>
              <TabsTrigger 
                value="emergency" 
                className="tabs-trigger-visible font-semibold transition-all duration-200 hover:bg-red-900/20"
                style={{
                  color: '#f87171',
                  borderRadius: '0.375rem'
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" style={{ color: '#f87171' }} />
                Emergency Override
              </TabsTrigger>
            </TabsList>

            {/* Display Modes Tab */}
            <TabsContent value="modes" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-yellow-500" />
                      High Contrast Mode
                    </CardTitle>
                    <CardDescription>
                      Maximum visibility for bright sunlight conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => handleModeChange('high-contrast')}
                          variant={settings.mode === 'high-contrast' ? "default" : "outline"}
                          className={`flex-1 ${settings.mode === 'high-contrast' ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'}`}
                        >
                          {settings.mode === 'high-contrast' ? 'Active' : 'Activate'}
                        </Button>
                        <Button
                          onClick={() => testReadabilityMode('high-contrast')}
                          variant="outline"
                          size="sm"
                          disabled={isTestingReadability}
                          className="border-cyan-500 text-cyan-400 hover:bg-cyan-900/20"
                        >
                          Test 5s
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Black text on white background</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Enhanced contrast and brightness</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Bold fonts for better readability</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-purple-500" />
                      Night Mode
                    </CardTitle>
                    <CardDescription>
                      Red-tinted low-light interface for nighttime driving
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => handleModeChange('night')}
                          variant={settings.mode === 'night' ? "default" : "outline"}
                          className={`flex-1 ${settings.mode === 'night' ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'}`}
                        >
                          {settings.mode === 'night' ? 'Active' : 'Activate'}
                        </Button>
                        <Button
                          onClick={() => testReadabilityMode('night')}
                          variant="outline"
                          size="sm"
                          disabled={isTestingReadability}
                          className="border-purple-500 text-purple-400 hover:bg-purple-900/20"
                        >
                          Test 5s
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Red-tinted UI preserves night vision</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Reduced brightness levels</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Minimal glare and eye strain</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-500" />
                      Auto Mode
                    </CardTitle>
                    <CardDescription>
                      Automatically adjusts based on ambient light conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button
                        onClick={() => handleModeChange('auto')}
                        variant={settings.mode === 'auto' ? "default" : "outline"}
                        className={`w-full ${settings.mode === 'auto' ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'}`}
                      >
                        {settings.mode === 'auto' ? 'Active' : 'Activate'}
                      </Button>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Automatic light sensor detection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Seamless mode switching</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Time-based fallback system</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-gray-500" />
                      Normal Mode
                    </CardTitle>
                    <CardDescription>
                      Standard interface for indoor and moderate lighting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button
                        onClick={() => handleModeChange('normal')}
                        variant={settings.mode === 'normal' ? "default" : "outline"}
                        className={`w-full ${settings.mode === 'normal' ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' : 'border-blue-500 text-blue-400 hover:bg-blue-900/20'}`}
                      >
                        {settings.mode === 'normal' ? 'Active' : 'Activate'}
                      </Button>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Standard cyber theme styling</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Optimal for indoor use</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Balanced visibility and aesthetics</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Fine Tuning Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle>Display Adjustments</CardTitle>
                    <CardDescription>
                      Fine-tune display properties for optimal readability
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Brightness: {settings.brightness}%
                      </label>
                      <Slider
                        value={[settings.brightness]}
                        onValueChange={([value]) => updateSettings({ brightness: value })}
                        max={200}
                        min={50}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Contrast: {settings.contrast}%
                      </label>
                      <Slider
                        value={[settings.contrast]}
                        onValueChange={([value]) => updateSettings({ contrast: value })}
                        max={300}
                        min={50}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Text Size: {settings.textSize}%
                      </label>
                      <Slider
                        value={[settings.textSize]}
                        onValueChange={([value]) => updateSettings({ textSize: value })}
                        max={150}
                        min={75}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Night Mode Intensity: {settings.nightModeIntensity}%
                      </label>
                      <Slider
                        value={[settings.nightModeIntensity]}
                        onValueChange={([value]) => updateSettings({ nightModeIntensity: value })}
                        max={100}
                        min={50}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>
                      Configure automatic detection and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Auto Detection</label>
                        <p className="text-xs text-muted-foreground">
                          Automatically switch modes based on lighting
                        </p>
                      </div>
                      <Switch
                        checked={settings.autoDetection}
                        onCheckedChange={(checked) => updateSettings({ autoDetection: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Current Conditions</h4>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>Time of Day: {ambientLight.timeOfDay}</div>
                        <div>Sunlight Intensity: {Math.round(ambientLight.sunlightIntensity)}%</div>
                        <div>Environment: {ambientLight.isOutdoor ? 'Outdoor' : 'Indoor'}</div>
                      </div>
                    </div>

                    <Button
                      onClick={resetToDefaults}
                      variant="outline"
                      className="w-full border-blue-500 text-blue-400 hover:bg-blue-900/20"
                    >
                      Reset to Defaults
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Live Testing Tab */}
            <TabsContent value="testing" className="space-y-6">
              <Card className="cyber-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Vehicle Readability Testing
                  </CardTitle>
                  <CardDescription>
                    Test different readability modes in real driving conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="p-8 bg-muted rounded-lg">
                      <h3 className="text-2xl font-bold mb-2">Sample Dashboard Text</h3>
                      <p className="text-lg mb-4">This is how text appears in the current mode</p>
                      <div className="flex justify-center gap-4">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Emergency Button</Button>
                        <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-900/20">Secondary Action</Button>
                        <Button variant="destructive">Critical Alert</Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use the mode buttons above to compare visibility in different lighting conditions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Emergency Override Tab */}
            <TabsContent value="emergency" className="space-y-6">
              <Card className="cyber-card border-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Shield className="w-5 h-5" />
                    Emergency Override Mode
                  </CardTitle>
                  <CardDescription>
                    Maximum visibility settings for critical situations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">Emergency Override</p>
                        <p className="text-sm text-red-600">
                          {settings.emergencyOverride ? 'Currently Active' : 'Currently Inactive'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleEmergencyToggle}
                      variant={settings.emergencyOverride ? "destructive" : "default"}
                    >
                      {settings.emergencyOverride ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Emergency Mode Features:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Maximum brightness (150%) and contrast (200%)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Enlarged text size (120%) for critical information
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Pulsing visual indicators for emergency status
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Overrides all other display settings
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Emergency override should only be used during traffic stops 
                      or critical situations requiring maximum screen visibility.
                    </p>
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