import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon, UserPlusIcon, ScanFace, Mic, MicOff, Globe, Zap, Cpu, Shield, Wifi, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { Checkbox } from "@/components/ui/checkbox";
import { FacialRecognition } from "@/components/FacialRecognition";
import carenLogo from "@assets/caren-logo.png";

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const createAccountSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  preferredLanguage: z.string().min(1, "Please select your preferred language"),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the User Agreement",
  }),
  agreeToPrivacy: z.boolean().refine(val => val === true, {
    message: "You must agree to the Privacy Policy",
  }),
  agreeToEULA: z.boolean().refine(val => val === true, {
    message: "You must agree to the End User License Agreement",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignIn() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showFacialRecognition, setShowFacialRecognition] = useState(false);
  const [facialRecognitionMode, setFacialRecognitionMode] = useState<'authenticate' | 'register'>('authenticate');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [passwordValidationStatus, setPasswordValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  // Legal Document Reading System State
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showEulaDialog, setShowEulaDialog] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [hasReadEULA, setHasReadEULA] = useState(false);
  const [termsScrolledToEnd, setTermsScrolledToEnd] = useState(false);
  const [privacyScrolledToEnd, setPrivacyScrolledToEnd] = useState(false);
  const [eulaScrolledToEnd, setEulaScrolledToEnd] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [agreeToEULA, setAgreeToEULA] = useState(false);

  // Form setup
  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const createAccountForm = useForm({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      preferredLanguage: "",
      agreeToTerms: false,
      agreeToPrivacy: false,
      agreeToEULA: false,
    },
  });

  // Document scroll tracking
  const handleDocumentScroll = (e: React.UIEvent<HTMLDivElement>, docType: 'terms' | 'privacy' | 'eula') => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Check if scrolled to 90% of the document
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage >= 0.9) {
      if (docType === 'terms') {
        setTermsScrolledToEnd(true);
        setHasReadTerms(true);
      } else if (docType === 'privacy') {
        setPrivacyScrolledToEnd(true);
        setHasReadPrivacy(true);
      } else if (docType === 'eula') {
        setEulaScrolledToEnd(true);
        setHasReadEULA(true);
      }
    }
  };

  const markDocumentAsRead = (docType: 'terms' | 'privacy' | 'eula') => {
    if (docType === 'terms') {
      setTermsScrolledToEnd(true);
      setHasReadTerms(true);
    } else if (docType === 'privacy') {
      setPrivacyScrolledToEnd(true);
      setHasReadPrivacy(true);
    } else if (docType === 'eula') {
      setEulaScrolledToEnd(true);
      setHasReadEULA(true);
    }
  };

  // Mutations for API calls
  const signInMutation = useMutation({
    mutationFn: async (data: z.infer<typeof signInSchema>) => {
      setPasswordValidationStatus('checking');
      try {
        const response = await apiRequest("POST", "/api/auth/login", data);
        const responseData = await response.json();
        setPasswordValidationStatus('valid');
        return responseData;
      } catch (error: any) {
        // Check if it's a password-specific error
        if (error.message?.toLowerCase().includes('password') || 
            error.message?.toLowerCase().includes('credential') ||
            error.message?.toLowerCase().includes('invalid')) {
          setPasswordValidationStatus('invalid');
        }
        throw error;
      }
    },
    onSuccess: async (data) => {
      setPasswordValidationStatus('valid');
      console.log('[LOGIN] Login successful, refreshing auth state');
      console.log('[LOGIN] Login response data:', data);
      
      // Store session token for fallback authentication if provided
      if (data.sessionToken) {
        localStorage.setItem('regularSessionToken', data.sessionToken);
        console.log('[LOGIN] Session token stored for fallback auth:', data.sessionToken);
      }
      
      // Session token authentication is working - show success and redirect
      console.log('[LOGIN] Session token stored successfully, redirecting to dashboard');
      
      toast({
        title: "✅ Welcome back!",
        description: `Login successful! Welcome ${data.user.firstName || data.user.email}`,
        className: "border-green-500/50 bg-green-500/10 text-green-100",
      });
      
      // Redirect to dashboard after short delay to show success message
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    },
    onError: (error: any) => {
      setPasswordValidationStatus('invalid');
      const isPasswordError = error.message?.toLowerCase().includes('password') || 
                             error.message?.toLowerCase().includes('credential') ||
                             error.message?.toLowerCase().includes('invalid');
      
      toast({
        title: isPasswordError ? "❌ Incorrect Password" : "🚫 Sign In Failed",
        description: isPasswordError ? 
          "The password you entered is incorrect. Please check your password and try again." :
          error.message || "Please check your credentials and try again.",
        variant: "destructive",
        className: "border-red-500/50 bg-red-500/10 text-red-100",
      });
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createAccountSchema>) => {
      console.log('[REGISTRATION] Attempting registration for:', data.email);
      const response = await apiRequest("POST", "/api/auth/register", data);
      console.log('[REGISTRATION] Success response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('[REGISTRATION] Registration successful, refreshing auth state');
      console.log('[REGISTRATION] Registration response data:', data);
      
      // Store session token for authentication if provided
      if (data.sessionToken) {
        localStorage.setItem('regularSessionToken', data.sessionToken);
        console.log('[REGISTRATION] Session token stored for authentication:', data.sessionToken);
      }
      
      // Clear any cached queries and force refresh
      queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: "✅ Account Created Successfully!",
        description: `Welcome to C.A.R.E.N.™, ${data.user.firstName || data.user.email}! Your legal protection platform is ready.`,
        className: "border-green-500/50 bg-green-500/10 text-green-100",
      });
      
      // Force redirect after short delay to allow auth state to update
      setTimeout(() => {
        console.log('[REGISTRATION] Forcing redirect to dashboard');
        window.location.replace('/');
      }, 1000);
    },
    onError: (error: any) => {
      console.error('[REGISTRATION] Registration failed:', error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof forgotPasswordSchema>) => {
      return apiRequest("POST", "/api/auth/forgot-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  // Clear expired authentication data
  const clearAuthData = () => {
    localStorage.removeItem('demoSessionKey');
    sessionStorage.clear();
    // Clear all cookies for this domain
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('[AUTH_CLEAR] Cleared all authentication data including cookies');
  };

  // Demo login handler
  const handleDemoLogin = async () => {
    try {
      console.log('[DEMO_LOGIN] Attempting demo login...');
      
      // Clear any existing authentication data first
      clearAuthData();
      
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      console.log('[DEMO_LOGIN] Response data:', data);
      console.log('[DEMO_LOGIN] Backend session ID:', data.debug?.sessionId);
      
      if (data.success && response.ok) {
        console.log('[DEMO_LOGIN] Success, invalidating auth cache and redirecting');
        
        // Store demo session key for authorization header
        if (data.demoSessionKey) {
          localStorage.setItem('demoSessionKey', data.demoSessionKey);
          console.log('[DEMO_LOGIN] Stored demo session key:', data.demoSessionKey);
        }
        
        // Store custom domain token for cross-domain authentication
        if (data.customDomainToken) {
          localStorage.setItem('customDomainToken', data.customDomainToken);
          console.log('[DEMO_LOGIN] Stored custom domain token for cross-domain compatibility');
        }
        
        // Clear all query cache and force complete refresh
        queryClient.clear();
        await queryClient.invalidateQueries();
        
        toast({
          title: "Demo Access Granted",
          description: "Welcome to the C.A.R.E.N.™ demo!",
        });
        
        // Use window.location.replace to ensure proper session handling
        setTimeout(() => {
          window.location.replace('/');
        }, 500);
      } else {
        console.error('[DEMO_LOGIN] Failed:', data);
        throw new Error(data.message || 'Demo login failed');
      }
    } catch (error: any) {
      console.error('[DEMO_LOGIN] Error:', error);
      toast({
        title: "Demo Access Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
      };

      recognitionInstance.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log('Voice command received:', transcript);
        handleVoiceCommand(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Please check your microphone permissions and try again.",
          variant: "destructive",
        });
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleVoiceCommand = (command: string) => {
    const signInPatterns = [
      'sign in', 'sign me in', 'authenticate me', 'facial recognition',
      'use my face', 'face login', 'biometric login', 'authenticate',
      'face authentication', 'login with face', 'facial login'
    ];

    if (signInPatterns.some(pattern => command.includes(pattern))) {
      setFacialRecognitionMode('authenticate');
      setShowFacialRecognition(true);
      toast({
        title: "Voice Command Recognized",
        description: "Opening facial recognition for sign-in",
      });
    }
  };

  const toggleVoiceRecognition = () => {
    if (!recognition) {
      toast({
        title: "Voice Recognition Not Available",
        description: "Your browser doesn't support voice recognition or microphone access is denied.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleFacialRecognitionSuccess = (data: any) => {
    setShowFacialRecognition(false);
    toast({
      title: "Facial Recognition Successful",
      description: "You have been authenticated successfully.",
    });
  };

  const handleFacialRecognitionFailure = (error: string) => {
    toast({
      title: "Facial Recognition Failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="moving-particles"></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <img src={carenLogo} alt="C.A.R.E.N.™ Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
            C.A.R.E.N.™
          </h1>
          <p className="text-cyan-200 text-lg font-medium mb-1">
            Citizen Assistance for Roadside Emergencies and Navigation
          </p>
          <p className="text-blue-200 text-sm">
            Your Advanced Legal Protection Platform
          </p>
        </div>



        {/* Demo Login Link - Prominent */}
        <div className="mb-6 text-center">
          <button
            onClick={handleDemoLogin}
            className="inline-block px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl rounded-lg shadow-lg transition-colors"
          >
            🚀 INSTANT DEMO ACCESS
          </button>
          <p className="text-white mt-2">Click above for immediate access to C.A.R.E.N.™</p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl shadow-black/20 p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/5 border border-white/10">
              <TabsTrigger 
                value="signin" 
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100 text-gray-300 hover:text-white transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="create" 
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100 text-gray-300 hover:text-white transition-all"
              >
                Create Account
              </TabsTrigger>
              <TabsTrigger 
                value="forgot" 
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-100 text-gray-300 hover:text-white transition-all"
              >
                Forgot Password
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">


              <form onSubmit={signInForm.handleSubmit((data) => signInMutation.mutate(data))} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="text-gray-200 font-medium">Email Address</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      {...signInForm.register("email")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-xs text-red-400 mt-1">{signInForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="signin-password" className="text-gray-200 font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...signInForm.register("password", {
                          onChange: (e) => {
                            const password = e.target.value;
                            if (password.length > 0) {
                              setPasswordValidationStatus('checking');
                              // Simulate real-time validation check
                              setTimeout(() => {
                                if (password.length >= 6) {
                                  setPasswordValidationStatus('valid');
                                } else {
                                  setPasswordValidationStatus('invalid');
                                }
                              }, 300);
                            } else {
                              setPasswordValidationStatus('idle');
                            }
                          }
                        })}
                        className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 pr-20 ${
                          passwordValidationStatus === 'valid' ? 'border-green-500/50 ring-green-500/20' :
                          passwordValidationStatus === 'invalid' ? 'border-red-500/50 ring-red-500/20' : ''
                        }`}
                      />
                      
                      {/* Password Status Indicator */}
                      <div className="absolute right-10 top-0 h-full flex items-center">
                        {passwordValidationStatus === 'checking' && (
                          <div className="h-4 w-4 border-2 border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
                        )}
                        {passwordValidationStatus === 'valid' && (
                          <Check className="h-4 w-4 text-green-400" />
                        )}
                        {passwordValidationStatus === 'invalid' && (
                          <X className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {/* Password Validation Feedback */}
                    {passwordValidationStatus === 'valid' && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Check className="h-3 w-3 text-green-400" />
                        <p className="text-xs text-green-400">Password meets requirements</p>
                      </div>
                    )}
                    {passwordValidationStatus === 'invalid' && (
                      <div className="flex items-center space-x-2 mt-2">
                        <X className="h-3 w-3 text-red-400" />
                        <p className="text-xs text-red-400">Password must be at least 6 characters</p>
                      </div>
                    )}
                    {passwordValidationStatus === 'checking' && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="h-3 w-3 border border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
                        <p className="text-xs text-cyan-400">Validating password...</p>
                      </div>
                    )}
                    
                    {signInForm.formState.errors.password && (
                      <p className="text-xs text-red-400 mt-1">{signInForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      {...signInForm.register("rememberMe")}
                      className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                    <Label htmlFor="remember-me" className="text-sm text-gray-300 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-cyan-500/25 transition-all"
                  disabled={signInMutation.isPending}
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  {signInMutation.isPending ? "Signing In..." : "Sign In to C.A.R.E.N.™"}
                </Button>
              </form>



              {/* Voice Commands */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">Voice Commands Available</span>
                    <p className="text-xs text-gray-400">Say "sign in" or "facial recognition"</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleVoiceRecognition}
                    className={`border-white/20 ${isListening ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                  >
                    {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    {isListening ? 'Listening...' : 'Enable Voice Commands'}
                  </Button>
                </div>
              </div>

              {/* Facial Recognition Option */}
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    setFacialRecognitionMode('authenticate');
                    setShowFacialRecognition(true);
                  }}
                >
                  <ScanFace className="mr-2 h-4 w-4" />
                  Use Facial Recognition
                </Button>
              </div>
            </TabsContent>

            {/* Create Account Tab */}
            <TabsContent value="create">

              <form onSubmit={createAccountForm.handleSubmit((data) => createAccountMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-200 font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      {...createAccountForm.register("firstName")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    />
                    {createAccountForm.formState.errors.firstName && (
                      <p className="text-xs text-red-400 mt-1">{createAccountForm.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName" className="text-gray-200 font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last name"
                      {...createAccountForm.register("lastName")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    />
                    {createAccountForm.formState.errors.lastName && (
                      <p className="text-xs text-red-400 mt-1">{createAccountForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="create-email" className="text-gray-200 font-medium">Email Address</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="Enter your email"
                    {...createAccountForm.register("email")}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                  />
                  {createAccountForm.formState.errors.email && (
                    <p className="text-xs text-red-400 mt-1">{createAccountForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="create-password" className="text-gray-200 font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="create-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      {...createAccountForm.register("password")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  {createAccountForm.formState.errors.password && (
                    <p className="text-xs text-red-400 mt-1">{createAccountForm.formState.errors.password.message}</p>
                  )}
                  <PasswordStrengthMeter password={createAccountForm.watch("password")} />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-200 font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      {...createAccountForm.register("confirmPassword")}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                  {createAccountForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">{createAccountForm.formState.errors.confirmPassword.message}</p>
                  )}
                  {/* Positive feedback when passwords match */}
                  {!createAccountForm.formState.errors.confirmPassword && 
                   createAccountForm.watch("password") && 
                   createAccountForm.watch("confirmPassword") && 
                   createAccountForm.watch("password") === createAccountForm.watch("confirmPassword") && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Check className="h-3 w-3 text-green-400" />
                      <p className="text-xs text-green-400">Passwords match perfectly!</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="preferredLanguage" className="text-gray-200 font-medium">Preferred Language</Label>
                  <Select onValueChange={(value) => createAccountForm.setValue("preferredLanguage", value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-cyan-400 focus:ring-cyan-400/20">
                      <SelectValue placeholder="Select your language" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800/95 border-gray-600 backdrop-blur-sm">
                      <SelectItem value="en" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇺🇸 English</SelectItem>
                      <SelectItem value="es" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇪🇸 Español</SelectItem>
                      <SelectItem value="fr" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇫🇷 Français</SelectItem>
                      <SelectItem value="de" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇩🇪 Deutsch</SelectItem>
                      <SelectItem value="it" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇮🇹 Italiano</SelectItem>
                      <SelectItem value="pt" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇵🇹 Português</SelectItem>
                      <SelectItem value="zh" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇨🇳 中文</SelectItem>
                      <SelectItem value="ja" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇯🇵 日本語</SelectItem>
                      <SelectItem value="ko" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇰🇷 한국어</SelectItem>
                      <SelectItem value="ar" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇸🇦 العربية</SelectItem>
                    </SelectContent>
                  </Select>
                  {createAccountForm.formState.errors.preferredLanguage && (
                    <p className="text-xs text-red-400 mt-1">{createAccountForm.formState.errors.preferredLanguage.message}</p>
                  )}
                </div>

                {/* Interactive Legal Document Reading System */}
                <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">📋 Legal Documents - Required Reading</h3>
                    <p className="text-sm text-gray-300">
                      You must read each document completely by scrolling to the bottom before you can agree to it.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {/* User Agreement */}
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToTerms"
                        checked={agreeToTerms}
                        disabled={!hasReadTerms}
                        onCheckedChange={(checked) => {
                          if (hasReadTerms) {
                            setAgreeToTerms(checked === true);
                            createAccountForm.setValue("agreeToTerms", checked === true);
                          }
                        }}
                        className="mt-1 border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                      <div className="text-sm">
                        <Label htmlFor="agreeToTerms" className={`cursor-pointer ${!hasReadTerms ? 'text-gray-400' : 'text-gray-200'}`}>
                          I agree to the{" "}
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="ml-1 text-cyan-400 hover:text-cyan-300 border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20"
                            onClick={(e) => {
                              e.preventDefault();
                              console.log('User Agreement button clicked - opening dialog');
                              setShowTermsDialog(true);
                              markDocumentAsRead('terms');
                            }}
                          >
                            📄 User Agreement (Click to Read)
                          </Button>
                          {!hasReadTerms && (
                            <span className="text-red-400 text-xs ml-1">(Must read document first)</span>
                          )}
                        </Label>
                        {createAccountForm.formState.errors.agreeToTerms && (
                          <p className="text-xs text-red-400 mt-1">
                            {createAccountForm.formState.errors.agreeToTerms.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Privacy Policy */}
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToPrivacy"
                        checked={agreeToPrivacy}
                        disabled={!hasReadPrivacy}
                        onCheckedChange={(checked) => {
                          if (hasReadPrivacy) {
                            setAgreeToPrivacy(checked === true);
                            createAccountForm.setValue("agreeToPrivacy", checked === true);
                          }
                        }}
                        className="mt-1 border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                      <div className="text-sm">
                        <Label htmlFor="agreeToPrivacy" className={`cursor-pointer ${!hasReadPrivacy ? 'text-gray-400' : 'text-gray-200'}`}>
                          I agree to the{" "}
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="ml-1 text-cyan-400 hover:text-cyan-300 border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20"
                            onClick={(e) => {
                              e.preventDefault();
                              console.log('Privacy Policy button clicked - opening dialog');
                              setShowPrivacyDialog(true);
                              markDocumentAsRead('privacy');
                            }}
                          >
                            🔒 Privacy Policy (Click to Read)
                          </Button>
                          {!hasReadPrivacy && (
                            <span className="text-red-400 text-xs ml-1">(Must read document first)</span>
                          )}
                        </Label>
                        {createAccountForm.formState.errors.agreeToPrivacy && (
                          <p className="text-xs text-red-400 mt-1">
                            {createAccountForm.formState.errors.agreeToPrivacy.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* EULA */}
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToEULA"
                        checked={agreeToEULA}
                        disabled={!hasReadEULA}
                        onCheckedChange={(checked) => {
                          if (hasReadEULA) {
                            setAgreeToEULA(checked === true);
                            createAccountForm.setValue("agreeToEULA", checked === true);
                          }
                        }}
                        className="mt-1 border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                      <div className="text-sm">
                        <Label htmlFor="agreeToEULA" className={`cursor-pointer ${!hasReadEULA ? 'text-gray-400' : 'text-gray-200'}`}>
                          I agree to the{" "}
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="ml-1 text-cyan-400 hover:text-cyan-300 border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20"
                            onClick={(e) => {
                              e.preventDefault();
                              console.log('EULA button clicked - opening dialog');
                              setShowEulaDialog(true);
                              markDocumentAsRead('eula');
                            }}
                          >
                            ⚖️ End User License Agreement (Click to Read)
                          </Button>
                          {!hasReadEULA && (
                            <span className="text-red-400 text-xs ml-1">(Must read document first)</span>
                          )}
                        </Label>
                        {createAccountForm.formState.errors.agreeToEULA && (
                          <p className="text-xs text-red-400 mt-1">
                            {createAccountForm.formState.errors.agreeToEULA.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Create Account Button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-500/25 transition-all"
                  disabled={createAccountMutation.isPending}
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  {createAccountMutation.isPending ? "Creating Free Account..." : "Create Free Account"}
                </Button>
              </form>

              {/* Face Registration Option */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="text-center text-sm text-gray-300 mb-3">
                  <span className="font-medium">Optional Security Enhancement</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-white/20 text-gray-300 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    toast({
                      title: "Create Account First",
                      description: "Please create your account first, then you can set up facial recognition from your dashboard.",
                      variant: "default",
                    });
                  }}
                >
                  <ScanFace className="mr-2 h-4 w-4" />
                  Setup Face Registration (After Account Creation)
                </Button>
              </div>
            </TabsContent>

            {/* Forgot Password Tab */}
            <TabsContent value="forgot">
              <form onSubmit={forgotPasswordForm.handleSubmit((data) => forgotPasswordMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email" className="text-gray-200 font-medium">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email address"
                    {...forgotPasswordForm.register("email")}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                  />
                  {forgotPasswordForm.formState.errors.email && (
                    <p className="text-xs text-red-400 mt-1">{forgotPasswordForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium shadow-lg shadow-purple-500/25 transition-all"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? "Sending Reset Email..." : "Send Password Reset Email"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-300">
                  Remember your password?{" "}
                  <button 
                    onClick={() => setActiveTab("signin")}
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-6">
          <p>© 2025 C.A.R.E.N.™ All rights reserved.</p>
          <p>Your safety and legal protection platform</p>
        </div>
      </div>

      {/* Facial Recognition Dialog */}
      <Dialog open={showFacialRecognition} onOpenChange={setShowFacialRecognition}>
        <DialogContent className="max-w-md bg-gray-800/95 backdrop-blur-lg border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">
              {facialRecognitionMode === 'register' ? 'Register Face' : 'Facial Recognition Sign-In'}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {facialRecognitionMode === 'register'
                ? 'Register your face for secure biometric authentication'
                : 'Use your face to sign in securely'
              }
            </DialogDescription>
          </DialogHeader>
          <FacialRecognition
            mode={facialRecognitionMode}
            onSuccess={handleFacialRecognitionSuccess}
            onFailure={handleFacialRecognitionFailure}
          />
        </DialogContent>
      </Dialog>

      {/* Legal Document Dialogs */}
      <Dialog open={showTermsDialog} onOpenChange={(open) => { if (!open) { setTermsScrolledToEnd(true); setHasReadTerms(true); } setShowTermsDialog(open); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800/95 backdrop-blur-lg border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">User Agreement</DialogTitle>
            <DialogDescription className="text-gray-300">
              Please read the entire document by scrolling to the bottom. You must read the full agreement to proceed.
            </DialogDescription>
          </DialogHeader>
          <div 
            className="prose prose-invert max-w-none overflow-y-auto max-h-[60vh] pr-4 text-gray-200"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            onScroll={(e) => handleDocumentScroll(e, 'terms')}
          >
            <h3>C.A.R.E.N.™ User Agreement</h3>
            <p>This User Agreement governs your use of the C.A.R.E.N.™ (Citizen Assistance for Roadside Emergencies and Navigation) platform and services.</p>
            
            <h4>1. Acceptance of Terms</h4>
            <p>By creating an account and using C.A.R.E.N.™, you agree to be bound by this User Agreement and all applicable laws and regulations. This agreement establishes the legal relationship between you and C.A.R.E.N.™ regarding your use of our services.</p>
            
            <h4>2. Service Description</h4>
            <p>C.A.R.E.N.™ provides legal information, emergency assistance coordination, and attorney-client communication services for roadside encounters and traffic-related legal matters. Our services include GPS-enabled legal rights information, incident recording capabilities, emergency contact notifications, and secure communication with legal professionals.</p>
            
            <h4>3. User Responsibilities</h4>
            <p>You agree to provide accurate information, use the service lawfully, and maintain the confidentiality of your account credentials. You are responsible for all activities that occur under your account and must notify us immediately of any unauthorized use.</p>
            
            <h4>4. Privacy and Data Protection</h4>
            <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. We implement industry-standard security measures to protect your personal data and legal information.</p>
            
            <h4>5. Limitation of Liability</h4>
            <p>C.A.R.E.N.™ provides information and coordination services but does not provide legal advice. Always consult with qualified legal professionals for specific legal matters. We are not responsible for the outcome of legal proceedings or decisions made based on information provided through our platform.</p>
            
            <h4>6. Service Availability</h4>
            <p>While we strive to maintain continuous service availability, C.A.R.E.N.™ cannot guarantee uninterrupted access to our services. We may perform maintenance, updates, or experience technical difficulties that temporarily affect service availability.</p>
            
            <h4>7. Modification of Terms</h4>
            <p>We reserve the right to modify this User Agreement at any time. Changes will be effective immediately upon posting. Your continued use of the service after changes are posted constitutes acceptance of the modified terms.</p>
            
            <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm font-medium text-cyan-200">By scrolling to this point, you acknowledge that you have read the complete User Agreement.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {termsScrolledToEnd ? (
                <div className="flex items-center space-x-2 text-green-400">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Document read completely</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-orange-400">
                  <div className="h-4 w-4 border-2 border-orange-400 rounded-full border-t-transparent animate-spin" />
                  <span className="text-sm">Please scroll to read the full document</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => { setTermsScrolledToEnd(true); setHasReadTerms(true); setShowTermsDialog(false); }}
              className="bg-blue-500 border-blue-600 text-white hover:bg-blue-600 hover:border-blue-700 font-medium"
            >
              <Check className="h-4 w-4 mr-2" />
              I've Read This — Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrivacyDialog} onOpenChange={(open) => { if (!open) { setPrivacyScrolledToEnd(true); setHasReadPrivacy(true); } setShowPrivacyDialog(open); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800/95 backdrop-blur-lg border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">Privacy Policy</DialogTitle>
            <DialogDescription className="text-gray-300">
              Please read the entire document by scrolling to the bottom. You must read the full privacy policy to proceed.
            </DialogDescription>
          </DialogHeader>
          <div 
            className="prose prose-invert max-w-none overflow-y-auto max-h-[60vh] pr-4 text-gray-200"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            onScroll={(e) => handleDocumentScroll(e, 'privacy')}
          >
            <h3>C.A.R.E.N.™ Privacy Policy</h3>
            <p>This Privacy Policy describes how C.A.R.E.N.™ collects, uses, and protects your personal information when you use our legal protection platform.</p>
            
            <h4>Information We Collect</h4>
            <p>We collect information you provide directly, such as account details, incident reports, and emergency contact information. We also collect location data when you use our emergency services, audio/video recordings for incident documentation, and device information for security purposes.</p>
            
            <h4>How We Use Your Information</h4>
            <p>We use your information to provide legal assistance, coordinate emergency services, facilitate attorney-client communications, and improve our platform. Your incident recordings and reports are used exclusively for legal documentation and protection purposes.</p>
            
            <h4>Information Sharing</h4>
            <p>We only share your information with authorized attorneys, emergency services when necessary, and third-party service providers under strict confidentiality agreements. We never sell your personal information or share it for marketing purposes.</p>
            
            <h4>Data Security</h4>
            <p>We implement industry-standard security measures including end-to-end encryption, secure cloud storage, and multi-factor authentication to protect your personal information and maintain strict confidentiality protocols.</p>
            
            <h4>Your Rights</h4>
            <p>You have the right to access, update, or delete your personal information. You can export your data, request account deletion, and control how your information is used. Contact us for any privacy-related requests.</p>
            
            <h4>Data Retention</h4>
            <p>We retain your data only as long as necessary to provide our services and comply with legal obligations. Incident recordings and legal documents are preserved according to applicable legal requirements and attorney-client privilege protections.</p>
            
            <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm font-medium text-cyan-200">By scrolling to this point, you acknowledge that you have read the complete Privacy Policy.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {privacyScrolledToEnd ? (
                <div className="flex items-center space-x-2 text-green-400">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Document read completely</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-orange-400">
                  <div className="h-4 w-4 border-2 border-orange-400 rounded-full border-t-transparent animate-spin" />
                  <span className="text-sm">Please scroll to read the full document</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => { setPrivacyScrolledToEnd(true); setHasReadPrivacy(true); setShowPrivacyDialog(false); }}
              className="bg-blue-500 border-blue-600 text-white hover:bg-blue-600 hover:border-blue-700 font-medium"
            >
              <Check className="h-4 w-4 mr-2" />
              I've Read This — Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEulaDialog} onOpenChange={(open) => { if (!open) { setEulaScrolledToEnd(true); setHasReadEULA(true); } setShowEulaDialog(open); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800/95 backdrop-blur-lg border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">End User License Agreement (EULA)</DialogTitle>
            <DialogDescription className="text-gray-300">
              Please read the entire document by scrolling to the bottom. You must read the full EULA to proceed.
            </DialogDescription>
          </DialogHeader>
          <div 
            className="prose prose-invert max-w-none overflow-y-auto max-h-[60vh] pr-4 text-gray-200"
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            onScroll={(e) => handleDocumentScroll(e, 'eula')}
          >
            <h3>C.A.R.E.N.™ End User License Agreement</h3>
            <p>This End User License Agreement (EULA) governs your use of the C.A.R.E.N.™ software application and related services when you download, install, or use our legal protection platform.</p>
            
            <h4>1. License Grant</h4>
            <p>C.A.R.E.N.™ grants you a limited, non-exclusive, non-transferable license to use the application for personal use in accordance with this agreement. This license includes access to all features within your subscription tier and the right to receive updates and support.</p>
            
            <h4>2. Restrictions</h4>
            <p>You may not modify, distribute, reverse engineer, decompile, or create derivative works based on the C.A.R.E.N.™ application. Commercial use, resale, or redistribution requires separate licensing agreements. You may not use the application for illegal activities or in violation of applicable laws.</p>
            
            <h4>3. Intellectual Property</h4>
            <p>All content, features, functionality, trademarks, copyrights, and other intellectual property of C.A.R.E.N.™ are owned by the company and protected by intellectual property laws. This includes but is not limited to software code, legal databases, user interfaces, and proprietary algorithms.</p>
            
            <h4>4. Updates and Modifications</h4>
            <p>We may update the application and this EULA from time to time to improve functionality, add features, or address security concerns. Continued use constitutes acceptance of updated terms. Critical security updates may be applied automatically.</p>
            
            <h4>5. Termination</h4>
            <p>This license remains in effect until terminated by either party. We may terminate your access for violations of this agreement, illegal use, or non-payment of subscription fees. Upon termination, you must cease all use and delete the application.</p>
            
            <h4>6. Disclaimer and Limitation of Liability</h4>
            <p>The software is provided "as is" without warranties of any kind. While we strive for accuracy, C.A.R.E.N.™ does not guarantee the completeness or accuracy of legal information. Use at your own discretion for emergency and legal situations, and always consult qualified legal professionals.</p>
            
            <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm font-medium text-cyan-200">By scrolling to this point, you acknowledge that you have read the complete End User License Agreement.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {eulaScrolledToEnd ? (
                <div className="flex items-center space-x-2 text-green-400">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Document read completely</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-orange-400">
                  <div className="h-4 w-4 border-2 border-orange-400 rounded-full border-t-transparent animate-spin" />
                  <span className="text-sm">Please scroll to read the full document</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => { setEulaScrolledToEnd(true); setHasReadEULA(true); setShowEulaDialog(false); }}
              className="bg-blue-500 border-blue-600 text-white hover:bg-blue-600 hover:border-blue-700 font-medium"
            >
              <Check className="h-4 w-4 mr-2" />
              I've Read This — Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}