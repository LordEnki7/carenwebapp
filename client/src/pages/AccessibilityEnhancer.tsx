import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Palette, Monitor, Settings, TestTube, RotateCcw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccessibilitySettings {
  contrastLevel: number;
  highContrastMode: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  focusIndicators: boolean;
  reducedMotion: boolean;
  darkMode: boolean;
  customTheme: 'default' | 'high-contrast' | 'yellow-black' | 'blue-yellow' | 'custom';
}

const defaultSettings: AccessibilitySettings = {
  contrastLevel: 100,
  highContrastMode: false,
  colorBlindMode: 'none',
  fontSize: 100,
  lineHeight: 150,
  letterSpacing: 0,
  focusIndicators: true,
  reducedMotion: false,
  darkMode: false,
  customTheme: 'default'
};

const contrastThemes = {
  'high-contrast': {
    name: 'High Contrast',
    description: 'Maximum contrast for better visibility',
    background: '#000000',
    text: '#FFFFFF',
    primary: '#FFFF00',
    secondary: '#00FFFF'
  },
  'yellow-black': {
    name: 'Yellow on Black',
    description: 'High contrast yellow text on black background',
    background: '#000000',
    text: '#FFFF00',
    primary: '#FFFFFF',
    secondary: '#00FF00'
  },
  'blue-yellow': {
    name: 'Blue & Yellow',
    description: 'Colorblind-friendly blue and yellow theme',
    background: '#003366',
    text: '#FFFF99',
    primary: '#FFCC00',
    secondary: '#6699FF'
  }
};

export default function AccessibilityEnhancer() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState(false);
  const [contrastRatio, setContrastRatio] = useState(4.5);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('caren-accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Apply accessibility settings to the document
    applyAccessibilitySettings(settings);
  }, [settings]);

  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Apply contrast adjustments
    root.style.setProperty('--accessibility-contrast', `${newSettings.contrastLevel}%`);
    
    // Apply font size adjustments
    root.style.setProperty('--accessibility-font-size', `${newSettings.fontSize}%`);
    root.style.setProperty('--accessibility-line-height', `${newSettings.lineHeight}%`);
    root.style.setProperty('--accessibility-letter-spacing', `${newSettings.letterSpacing}px`);
    
    // Apply high contrast mode
    if (newSettings.highContrastMode) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
    
    // Apply color blind mode
    document.body.className = document.body.className.replace(/colorblind-\w+/g, '');
    if (newSettings.colorBlindMode !== 'none') {
      document.body.classList.add(`colorblind-${newSettings.colorBlindMode}`);
    }
    
    // Apply custom theme
    if (newSettings.customTheme !== 'default' && contrastThemes[newSettings.customTheme as keyof typeof contrastThemes]) {
      const theme = contrastThemes[newSettings.customTheme as keyof typeof contrastThemes];
      root.style.setProperty('--accessibility-bg', theme.background);
      root.style.setProperty('--accessibility-text', theme.text);
      root.style.setProperty('--accessibility-primary', theme.primary);
      root.style.setProperty('--accessibility-secondary', theme.secondary);
      document.body.classList.add('accessibility-custom-theme');
    } else {
      document.body.classList.remove('accessibility-custom-theme');
    }
    
    // Apply reduced motion
    if (newSettings.reducedMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
    
    // Apply enhanced focus indicators
    if (newSettings.focusIndicators) {
      document.body.classList.add('enhanced-focus');
    } else {
      document.body.classList.remove('enhanced-focus');
    }
  };

  const calculateContrastRatio = (bg: string, text: string): number => {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd use a proper color contrast library
    const bgLuminance = getLuminance(bg);
    const textLuminance = getLuminance(text);
    const ratio = (Math.max(bgLuminance, textLuminance) + 0.05) / (Math.min(bgLuminance, textLuminance) + 0.05);
    return Math.round(ratio * 10) / 10;
  };

  const getLuminance = (color: string): number => {
    // Simplified luminance calculation
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Update contrast ratio if theme changed
    if (key === 'customTheme' && value !== 'default') {
      const theme = contrastThemes[value as keyof typeof contrastThemes];
      if (theme) {
        const ratio = calculateContrastRatio(theme.background, theme.text);
        setContrastRatio(ratio);
      }
    }
  };

  const saveSettings = () => {
    localStorage.setItem('caren-accessibility-settings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Your accessibility preferences have been saved and will be applied to future sessions.",
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('caren-accessibility-settings');
    toast({
      title: "Settings Reset",
      description: "All accessibility settings have been reset to default values.",
    });
  };

  const testColorContrast = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      document.body.classList.add('contrast-test-mode');
      toast({
        title: "Contrast Test Mode",
        description: "Test mode enabled. All elements will show contrast ratios.",
      });
    } else {
      document.body.classList.remove('contrast-test-mode');
      toast({
        title: "Contrast Test Disabled",
        description: "Test mode disabled. Normal appearance restored.",
      });
    }
  };

  const getContrastRating = (ratio: number): { rating: string; color: string } => {
    if (ratio >= 7) return { rating: 'AAA', color: 'bg-green-500' };
    if (ratio >= 4.5) return { rating: 'AA', color: 'bg-yellow-500' };
    if (ratio >= 3) return { rating: 'AA Large', color: 'bg-orange-500' };
    return { rating: 'Fail', color: 'bg-red-500' };
  };

  const contrastRating = getContrastRating(contrastRatio);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Eye className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Accessibility Color Contrast Enhancer</h1>
            <p className="text-gray-300">Customize visual accessibility settings for better readability and usability</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={saveSettings}
            className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
          <Button
            onClick={resetSettings}
            variant="outline"
            className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button
            onClick={testColorContrast}
            variant="outline"
            className={`${previewMode ? 'bg-cyan-500/30 text-cyan-300' : 'bg-cyan-500/20 text-cyan-400'} border-cyan-500/30 hover:bg-cyan-500/30`}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {previewMode ? 'Disable' : 'Enable'} Test Mode
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contrast" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contrast" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Contrast</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>Typography</span>
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Themes</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* Contrast Settings */}
        <TabsContent value="contrast">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Contrast Controls</span>
                </CardTitle>
                <CardDescription>Adjust color contrast for better visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-200">Contrast Level: {settings.contrastLevel}%</Label>
                  <Slider
                    value={[settings.contrastLevel]}
                    onValueChange={(value) => updateSetting('contrastLevel', value[0])}
                    max={200}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Low (50%)</span>
                    <span>Normal (100%)</span>
                    <span>High (200%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-200">High Contrast Mode</Label>
                    <p className="text-sm text-gray-400">Maximum contrast for improved visibility</p>
                  </div>
                  <Switch
                    checked={settings.highContrastMode}
                    onCheckedChange={(checked) => updateSetting('highContrastMode', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Color Blind Support</Label>
                  <Select value={settings.colorBlindMode} onValueChange={(value) => updateSetting('colorBlindMode', value as AccessibilitySettings['colorBlindMode'])}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="protanopia">Protanopia (Red-blind)</SelectItem>
                      <SelectItem value="deuteranopia">Deuteranopia (Green-blind)</SelectItem>
                      <SelectItem value="tritanopia">Tritanopia (Blue-blind)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Contrast Analysis</CardTitle>
                <CardDescription>Current contrast ratio and accessibility compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-200">Contrast Ratio</span>
                    <Badge className={`${contrastRating.color} text-white`}>
                      {contrastRating.rating}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-white">{contrastRatio}:1</div>
                  <div className="text-sm text-gray-400 mt-2">
                    {contrastRatio >= 7 && "Excellent! Exceeds AAA standards."}
                    {contrastRatio >= 4.5 && contrastRatio < 7 && "Good! Meets AA standards."}
                    {contrastRatio >= 3 && contrastRatio < 4.5 && "Fair for large text only."}
                    {contrastRatio < 3 && "Poor contrast. Consider adjusting."}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-white">WCAG Compliance</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Normal text (AA)</span>
                      <span className={contrastRatio >= 4.5 ? "text-green-400" : "text-red-400"}>
                        {contrastRatio >= 4.5 ? "✓ Pass" : "✗ Fail"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Large text (AA)</span>
                      <span className={contrastRatio >= 3 ? "text-green-400" : "text-red-400"}>
                        {contrastRatio >= 3 ? "✓ Pass" : "✗ Fail"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Enhanced (AAA)</span>
                      <span className={contrastRatio >= 7 ? "text-green-400" : "text-red-400"}>
                        {contrastRatio >= 7 ? "✓ Pass" : "✗ Fail"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Typography Settings */}
        <TabsContent value="typography">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Typography Controls</CardTitle>
              <CardDescription>Adjust text size, spacing, and readability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-200">Font Size: {settings.fontSize}%</Label>
                  <Slider
                    value={[settings.fontSize]}
                    onValueChange={(value) => updateSetting('fontSize', value[0])}
                    max={200}
                    min={75}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Small (75%)</span>
                    <span>Normal (100%)</span>
                    <span>Large (200%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Line Height: {settings.lineHeight}%</Label>
                  <Slider
                    value={[settings.lineHeight]}
                    onValueChange={(value) => updateSetting('lineHeight', value[0])}
                    max={250}
                    min={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Tight (100%)</span>
                    <span>Normal (150%)</span>
                    <span>Loose (250%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Letter Spacing: {settings.letterSpacing}px</Label>
                  <Slider
                    value={[settings.letterSpacing]}
                    onValueChange={(value) => updateSetting('letterSpacing', value[0])}
                    max={5}
                    min={-1}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Tight (-1px)</span>
                    <span>Normal (0px)</span>
                    <span>Wide (5px)</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="p-4 bg-gray-700/30 rounded-lg">
                <h4 className="font-medium text-white mb-2">Preview Text</h4>
                <div 
                  className="text-gray-200 p-4 bg-gray-800 rounded border"
                  style={{
                    fontSize: `${settings.fontSize}%`,
                    lineHeight: `${settings.lineHeight}%`,
                    letterSpacing: `${settings.letterSpacing}px`
                  }}
                >
                  <p className="mb-2">C.A.R.E.N.™ (Citizen Assistance for Roadside Emergencies and Navigation)</p>
                  <p className="text-sm">This is sample text showing how your typography settings affect readability. The quick brown fox jumps over the lazy dog.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings */}
        <TabsContent value="themes">
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">High Contrast Themes</CardTitle>
                <CardDescription>Pre-configured themes optimized for accessibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card 
                    className={`cursor-pointer transition-all border-2 ${settings.customTheme === 'default' ? 'border-cyan-400' : 'border-gray-600 hover:border-gray-500'}`}
                    onClick={() => updateSetting('customTheme', 'default')}
                  >
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <div className="h-12 w-full bg-gradient-to-r from-gray-800 to-gray-600 rounded border"></div>
                        <h3 className="font-medium text-white">Default Theme</h3>
                        <p className="text-xs text-gray-400">Standard C.A.R.E.N.™ appearance</p>
                      </div>
                    </CardContent>
                  </Card>

                  {Object.entries(contrastThemes).map(([key, theme]) => (
                    <Card 
                      key={key}
                      className={`cursor-pointer transition-all border-2 ${settings.customTheme === key ? 'border-cyan-400' : 'border-gray-600 hover:border-gray-500'}`}
                      onClick={() => updateSetting('customTheme', key as AccessibilitySettings['customTheme'])}
                    >
                      <CardContent className="p-4">
                        <div className="text-center space-y-2">
                          <div 
                            className="h-12 w-full rounded border flex items-center justify-center text-xs font-medium"
                            style={{ 
                              backgroundColor: theme.background, 
                              color: theme.text,
                              border: `1px solid ${theme.primary}`
                            }}
                          >
                            Sample Text
                          </div>
                          <h3 className="font-medium text-white">{theme.name}</h3>
                          <p className="text-xs text-gray-400">{theme.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Advanced Accessibility Options</CardTitle>
              <CardDescription>Additional settings for enhanced user experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-200">Enhanced Focus Indicators</Label>
                    <p className="text-sm text-gray-400">High-visibility focus outlines for keyboard navigation</p>
                  </div>
                  <Switch
                    checked={settings.focusIndicators}
                    onCheckedChange={(checked) => updateSetting('focusIndicators', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-200">Reduced Motion</Label>
                    <p className="text-sm text-gray-400">Minimize animations and transitions</p>
                  </div>
                  <Switch
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-200">Dark Mode Override</Label>
                    <p className="text-sm text-gray-400">Force dark mode for better contrast</p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                  />
                </div>
              </div>

              <Separator className="bg-gray-600" />

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-medium text-blue-300 mb-2">Accessibility Information</h4>
                <div className="text-sm text-blue-200 space-y-1">
                  <p>• These settings are saved locally and apply only to your device</p>
                  <p>• Contrast ratios follow WCAG 2.1 guidelines for accessibility</p>
                  <p>• Use test mode to check contrast ratios on different page elements</p>
                  <p>• Settings can be reset to default at any time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}