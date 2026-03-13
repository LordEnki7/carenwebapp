import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  AlertCircle, 
  CheckCircle, 
  Mic, 
  MicOff, 
  Play, 
  Shield, 
  Volume2, 
  Settings, 
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface VoiceAuthStatus {
  isRegistered: boolean;
  isEnabled: boolean;
  isLockedOut: boolean;
  lockoutUntil?: string;
  failedAttempts: number;
  maxAttempts: number;
  lastAuthSuccess?: string;
  requiresPassphrase: boolean;
}

interface VoiceAuthSettings {
  isEnabled: boolean;
  requirePassphrase: boolean;
  customPassphrase: string;
  confidenceThreshold: number;
  maxAuthAttempts: number;
  lockoutDuration: number;
  adaptiveThreshold: boolean;
  emergencyBypass: boolean;
  biometricFallback: boolean;
}

export default function VoicePrintAuth() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioSamples, setAudioSamples] = useState<string[]>([]);
  const [currentSample, setCurrentSample] = useState(0);
  const [passphrase, setPassphrase] = useState('');
  const [customPassphrase, setCustomPassphrase] = useState('');
  const [authAudio, setAuthAudio] = useState<string>('');
  const [authPassphrase, setAuthPassphrase] = useState('');
  const [settings, setSettings] = useState<Partial<VoiceAuthSettings>>({
    isEnabled: true,
    requirePassphrase: false,
    confidenceThreshold: 0.85,
    maxAuthAttempts: 3,
    lockoutDuration: 15,
    adaptiveThreshold: true,
    emergencyBypass: true,
    biometricFallback: true,
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const queryClient = useQueryClient();

  // Get voice authentication status
  const { data: authStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['/api/voice-auth/status'],
    queryFn: () => apiRequest('/api/voice-auth/status'),
  });

  const status: VoiceAuthStatus = authStatus?.status || {
    isRegistered: false,
    isEnabled: false,
    isLockedOut: false,
    failedAttempts: 0,
    maxAttempts: 3,
    requiresPassphrase: false
  };

  // Register voice print mutation
  const registerVoicePrint = useMutation({
    mutationFn: async (data: { audioSamples: string[]; passphrase?: string; environmentalFactors?: any }) => {
      return apiRequest('/api/voice-auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-auth/status'] });
      setAudioSamples([]);
      setCurrentSample(0);
      setPassphrase('');
      toast({
        title: "Voice Print Registered",
        description: "Your voice authentication has been successfully set up.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register voice authentication.",
        variant: "destructive",
      });
    }
  });

  // Authenticate with voice print mutation
  const authenticateVoice = useMutation({
    mutationFn: async (data: { audioData: string; passphrase?: string }) => {
      return apiRequest('/api/voice-auth/authenticate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Authentication Successful",
        description: `Authenticated with ${(data.confidence * 100).toFixed(1)}% confidence.`,
      });
      setAuthAudio('');
      setAuthPassphrase('');
    },
    onError: (error: any) => {
      toast({
        title: "Authentication Failed",
        description: error.message || "Voice authentication failed.",
        variant: "destructive",
      });
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VoiceAuthSettings>) => {
      return apiRequest('/api/voice-auth/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-auth/status'] });
      toast({
        title: "Settings Updated",
        description: "Voice authentication settings have been saved.",
      });
    }
  });

  // Reset lockout mutation
  const resetLockout = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/voice-auth/reset-lockout', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-auth/status'] });
      toast({
        title: "Lockout Reset",
        description: "Account lockout has been reset.",
      });
    }
  });

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          if (currentSample < 3) {
            // Registration mode - collect multiple samples
            setAudioSamples(prev => [...prev, base64Audio]);
            setCurrentSample(prev => prev + 1);
          } else {
            // Authentication mode
            setAuthAudio(base64Audio);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 5000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRegister = () => {
    if (audioSamples.length < 3) {
      toast({
        title: "Insufficient Samples",
        description: "Please record at least 3 voice samples for registration.",
        variant: "destructive",
      });
      return;
    }

    registerVoicePrint.mutate({
      audioSamples,
      passphrase: settings.requirePassphrase ? passphrase : undefined,
      environmentalFactors: {
        noiseLevel: 'moderate',
        deviceType: 'web_browser',
        microphoneQuality: 'medium'
      }
    });
  };

  const handleAuthenticate = () => {
    if (!authAudio) {
      toast({
        title: "No Audio",
        description: "Please record your voice for authentication.",
        variant: "destructive",
      });
      return;
    }

    authenticateVoice.mutate({
      audioData: authAudio,
      passphrase: status.requiresPassphrase ? authPassphrase : undefined
    });
  };

  const handleUpdateSettings = () => {
    updateSettings.mutate(settings);
  };

  const getStatusColor = (status: VoiceAuthStatus) => {
    if (status.isLockedOut) return 'bg-red-500';
    if (!status.isRegistered) return 'bg-gray-500';
    if (!status.isEnabled) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (status: VoiceAuthStatus) => {
    if (status.isLockedOut) return 'Locked Out';
    if (!status.isRegistered) return 'Not Registered';
    if (!status.isEnabled) return 'Disabled';
    return 'Active';
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
            className="bg-gray-800/50 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Voice Print Authentication
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Secure biometric authentication using your unique voice characteristics. 
            Set up voice login for enhanced security and hands-free access.
          </p>
        </div>

        {/* Status Card */}
        <Card className="bg-gray-800/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`}></div>
                <div>
                  <p className="text-white font-medium">{getStatusText(status)}</p>
                  <p className="text-gray-400 text-sm">
                    Failed attempts: {status.failedAttempts}/{status.maxAttempts}
                  </p>
                </div>
              </div>
              
              {status.isRegistered && (
                <div className="text-right">
                  {status.lastAuthSuccess && (
                    <p className="text-gray-400 text-sm">
                      Last success: {new Date(status.lastAuthSuccess).toLocaleDateString()}
                    </p>
                  )}
                  {status.isLockedOut && status.lockoutUntil && (
                    <p className="text-red-400 text-sm">
                      Locked until: {new Date(status.lockoutUntil).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {status.isLockedOut && (
              <div className="mt-4">
                <Alert className="border-red-500/30 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-red-400">Account Locked</AlertTitle>
                  <AlertDescription className="text-red-300">
                    Too many failed authentication attempts. Please wait for the lockout period to expire or reset the lockout.
                  </AlertDescription>
                </Alert>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => resetLockout.mutate()}
                  disabled={resetLockout.isPending}
                  className="mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Lockout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue={status.isRegistered ? "authenticate" : "register"} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="register" disabled={status.isRegistered}>
              Register Voice
            </TabsTrigger>
            <TabsTrigger value="authenticate" disabled={!status.isRegistered || status.isLockedOut}>
              Authenticate
            </TabsTrigger>
            <TabsTrigger value="settings">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Registration Tab */}
          <TabsContent value="register" className="space-y-6">
            <Card className="bg-gray-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Voice Print Registration</CardTitle>
                <CardDescription>
                  Record 3 voice samples to create your voice authentication profile. 
                  Speak clearly and naturally for 3-5 seconds each time.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Voice Samples</span>
                    <span>{audioSamples.length}/3</span>
                  </div>
                  <Progress 
                    value={(audioSamples.length / 3) * 100} 
                    className="h-2" 
                  />
                </div>

                {/* Recording */}
                <div className="text-center space-y-4">
                  <Button
                    size="lg"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={audioSamples.length >= 3 || registerVoicePrint.isPending}
                    className={`w-32 h-32 rounded-full ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-cyan-500 hover:bg-cyan-600'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </Button>
                  
                  <p className="text-gray-300">
                    {isRecording 
                      ? `Recording sample ${currentSample + 1}...`
                      : audioSamples.length < 3
                        ? `Click to record sample ${audioSamples.length + 1}`
                        : 'All samples recorded!'
                    }
                  </p>
                </div>

                {/* Recorded Samples */}
                {audioSamples.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Recorded Samples:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {audioSamples.map((_, index) => (
                        <div key={index} className="p-3 bg-gray-700/50 rounded-lg text-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                          <span className="text-sm text-gray-300">Sample {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passphrase Setup */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.requirePassphrase}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, requirePassphrase: checked }))
                      }
                    />
                    <Label className="text-gray-300">Require passphrase</Label>
                  </div>
                  
                  {settings.requirePassphrase && (
                    <div>
                      <Label htmlFor="passphrase" className="text-gray-300">
                        Custom Passphrase
                      </Label>
                      <Input
                        id="passphrase"
                        type="password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="Enter a secure passphrase"
                        className="bg-gray-700/50 border-gray-600 text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Register Button */}
                <Button
                  onClick={handleRegister}
                  disabled={audioSamples.length < 3 || registerVoicePrint.isPending}
                  className="w-full"
                >
                  {registerVoicePrint.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Register Voice Print
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authentication Tab */}
          <TabsContent value="authenticate" className="space-y-6">
            <Card className="bg-gray-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Voice Authentication</CardTitle>
                <CardDescription>
                  Speak naturally for 3-5 seconds to authenticate with your voice print.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recording */}
                <div className="text-center space-y-4">
                  <Button
                    size="lg"
                    onClick={isRecording ? stopRecording : () => {
                      setCurrentSample(3); // Set to auth mode
                      startRecording();
                    }}
                    disabled={authenticateVoice.isPending}
                    className={`w-32 h-32 rounded-full ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </Button>
                  
                  <p className="text-gray-300">
                    {isRecording 
                      ? 'Recording for authentication...'
                      : authAudio
                        ? 'Voice sample captured!'
                        : 'Click to record your voice'
                    }
                  </p>
                </div>

                {/* Audio Status */}
                {authAudio && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <span className="text-green-400">Audio sample ready for authentication</span>
                  </div>
                )}

                {/* Passphrase Input */}
                {status.requiresPassphrase && (
                  <div>
                    <Label htmlFor="auth-passphrase" className="text-gray-300">
                      Passphrase
                    </Label>
                    <Input
                      id="auth-passphrase"
                      type="password"
                      value={authPassphrase}
                      onChange={(e) => setAuthPassphrase(e.target.value)}
                      placeholder="Enter your passphrase"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                )}

                {/* Authenticate Button */}
                <Button
                  onClick={handleAuthenticate}
                  disabled={!authAudio || authenticateVoice.isPending || 
                           (status.requiresPassphrase && !authPassphrase)}
                  className="w-full"
                >
                  {authenticateVoice.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Authenticate with Voice
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Authentication Settings</CardTitle>
                <CardDescription>
                  Configure voice authentication security and behavior settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Enable Voice Authentication</Label>
                    <p className="text-sm text-gray-400">
                      Allow login using voice biometrics
                    </p>
                  </div>
                  <Switch
                    checked={settings.isEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, isEnabled: checked }))
                    }
                  />
                </div>

                {/* Confidence Threshold */}
                <div>
                  <Label className="text-gray-300">
                    Confidence Threshold: {Math.round((settings.confidenceThreshold || 0.85) * 100)}%
                  </Label>
                  <p className="text-sm text-gray-400 mb-2">
                    Minimum similarity required for authentication
                  </p>
                  <Slider
                    value={[settings.confidenceThreshold || 0.85]}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, confidenceThreshold: value[0] }))
                    }
                    min={0.5}
                    max={0.95}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                {/* Max Attempts */}
                <div>
                  <Label className="text-gray-300">
                    Maximum Failed Attempts: {settings.maxAuthAttempts}
                  </Label>
                  <p className="text-sm text-gray-400 mb-2">
                    Number of failed attempts before lockout
                  </p>
                  <Slider
                    value={[settings.maxAuthAttempts || 3]}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, maxAuthAttempts: value[0] }))
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Lockout Duration */}
                <div>
                  <Label className="text-gray-300">
                    Lockout Duration: {settings.lockoutDuration} minutes
                  </Label>
                  <p className="text-sm text-gray-400 mb-2">
                    How long to lock account after max failed attempts
                  </p>
                  <Slider
                    value={[settings.lockoutDuration || 15]}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, lockoutDuration: value[0] }))
                    }
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Additional Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Adaptive Threshold</Label>
                      <p className="text-sm text-gray-400">
                        Adjust confidence based on environment
                      </p>
                    </div>
                    <Switch
                      checked={settings.adaptiveThreshold}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, adaptiveThreshold: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Emergency Bypass</Label>
                      <p className="text-sm text-gray-400">
                        Allow emergency access with other methods
                      </p>
                    </div>
                    <Switch
                      checked={settings.emergencyBypass}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, emergencyBypass: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Biometric Fallback</Label>
                      <p className="text-sm text-gray-400">
                        Fall back to facial recognition if voice fails
                      </p>
                    </div>
                    <Switch
                      checked={settings.biometricFallback}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, biometricFallback: checked }))
                      }
                    />
                  </div>
                </div>

                {/* Save Settings */}
                <Button
                  onClick={handleUpdateSettings}
                  disabled={updateSettings.isPending}
                  className="w-full"
                >
                  {updateSettings.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}