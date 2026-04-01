import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ScanFace, Mic, MicOff } from "lucide-react";
import carenLogo from "@assets/caren-logo.png";

// Import simplified form components
import SimpleSignInForm from "./SimpleSignInForm";
import SimpleCreateAccountForm from "./SimpleCreateAccountForm";
import SimpleForgotPasswordForm from "./SimpleForgotPasswordForm";
import NewUserOnboardingModal from "./NewUserOnboardingModal";

// Advanced features as separate components
import { FacialRecognition } from "@/components/FacialRecognition";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type AuthMode = 'signin' | 'create' | 'forgot';

export default function BrowserCompatibleSignIn() {
  const { toast } = useToast();
  const [currentMode, setCurrentMode] = useState<AuthMode>('signin');
  
  // Advanced features state (separated for better browser compatibility)
  const [showFacialRecognition, setShowFacialRecognition] = useState(false);
  const [facialRecognitionMode, setFacialRecognitionMode] = useState<'authenticate' | 'register'>('authenticate');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  // New user onboarding state
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState<string>('');

  // Google OAuth — needs terms agreement for new users
  const [googleNeedsTerms, setGoogleNeedsTerms] = useState(false);
  const [googleSessionToken, setGoogleSessionToken] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isAgreeingToTerms, setIsAgreeingToTerms] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_auth') === 'true' && params.get('needs_terms') === 'true') {
      const token = params.get('session_token');
      if (token) {
        localStorage.setItem('sessionToken', token);
        setGoogleSessionToken(token);
      }
      setGoogleNeedsTerms(true);
      window.history.replaceState({}, document.title, '/signin');
    }
  }, []);

  const handleAgreeToTerms = async () => {
    if (!termsAccepted) {
      toast({ title: 'Please accept the terms to continue', variant: 'destructive' });
      return;
    }
    setIsAgreeingToTerms(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (googleSessionToken) headers.Authorization = `Bearer ${googleSessionToken}`;
      const res = await fetch('/api/auth/agree-terms', {
        method: 'POST',
        credentials: 'include',
        headers,
      });
      if (!res.ok) throw new Error('Failed to save terms agreement');
      toast({ title: 'Welcome to C.A.R.E.N.™!', description: 'Redirecting to your dashboard…' });
      setTimeout(() => { window.location.href = '/'; }, 800);
    } catch (err: any) {
      toast({ title: 'Something went wrong', description: err.message, variant: 'destructive' });
      setIsAgreeingToTerms(false);
    }
  };

  // Voice recognition setup (isolated to prevent browser conflicts)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          console.log('Voice command received:', transcript);
          
          if (transcript.includes('sign in') || transcript.includes('login')) {
            setCurrentMode('signin');
            toast({
              title: "Voice Command Recognized",
              description: "Switched to Sign In form",
            });
          } else if (transcript.includes('create account') || transcript.includes('register')) {
            setCurrentMode('create');
            toast({
              title: "Voice Command Recognized", 
              description: "Switched to Create Account form",
            });
          } else if (transcript.includes('facial recognition') || transcript.includes('face scan')) {
            setShowFacialRecognition(true);
            setFacialRecognitionMode('authenticate');
            toast({
              title: "Voice Command Recognized",
              description: "Opening facial recognition",
            });
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      } catch (error) {
        console.warn('Speech recognition not available:', error);
      }
    }
  }, [toast]);

  // Demo login mutation
  const demoLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/demo-login");
      return response.json();
    },
    onSuccess: (data) => {
      console.log('[BROWSER_DEMO] Demo login response:', data);
      
      // Store session token for authentication
      if (data.sessionToken) {
        localStorage.setItem('sessionToken', data.sessionToken);
        console.log('[BROWSER_DEMO] Session token stored:', data.sessionToken);
      }
      
      // Store demo session key if provided
      if (data.demoSessionKey) {
        localStorage.setItem('demoSessionKey', data.demoSessionKey);
        localStorage.setItem('demoStartTime', Date.now().toString());
        console.log('[BROWSER_DEMO] Demo session key stored:', data.demoSessionKey);
      }
      
      // Store custom domain token if provided
      if (data.customDomainToken) {
        localStorage.setItem('customDomainToken', data.customDomainToken);
        console.log('[BROWSER_DEMO] Custom domain token stored');
      }
      
      toast({
        title: "Demo Access Granted",
        description: "Welcome to the C.A.R.E.N.™ demo!",
      });
      
      // Redirect to dashboard after brief delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Demo Login Failed",
        description: error.message || "Unable to start demo mode. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleVoiceRecognition = () => {
    if (!recognition) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Your browser doesn't support voice commands.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast({
        title: "Voice Recognition Active",
        description: "Say 'sign in', 'create account', or 'facial recognition'",
      });
    }
  };

  const handleFacialRecognitionSuccess = (data: any) => {
    console.log('Facial recognition successful:', data);
    if (data.sessionToken) {
      localStorage.setItem('sessionToken', data.sessionToken);
      window.location.href = '/dashboard';
    }
    setShowFacialRecognition(false);
    toast({
      title: "Facial Recognition Successful",
      description: "Welcome back to C.A.R.E.N.™!",
    });
  };

  const handleFacialRecognitionFailure = (error: string) => {
    console.error('Facial recognition failed:', error);
    setShowFacialRecognition(false);
    toast({
      title: "Facial Recognition Failed",
      description: error || "Please try again or use password authentication.",
      variant: "destructive",
    });
  }

  const handleNewUserCreated = (email: string) => {
    setNewUserEmail(email);
    setShowOnboardingModal(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
    toast({
      title: "Welcome to C.A.R.E.N.™!",
      description: "Your account is ready. Redirecting to dashboard...",
    });
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };;

  const startDemoLogin = () => {
    demoLoginMutation.mutate();
  };

  // ── Google new-user terms agreement screen ────────────────────────────
  if (googleNeedsTerms) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <img src={carenLogo} alt="C.A.R.E.N.™" className="w-16 h-16 rounded-full border-4 border-cyan-400/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">One Last Step</h2>
            <p className="text-gray-300 text-sm mt-1">Your Google account is ready. Please agree to our terms to complete sign-up.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-300 space-y-2 max-h-40 overflow-y-auto">
            <p>By using C.A.R.E.N.™ you agree to our <a href="/terms-of-service" className="text-cyan-400 underline" target="_blank">Terms of Service</a> and <a href="/privacy-policy" className="text-cyan-400 underline" target="_blank">Privacy Policy</a>.</p>
            <p>C.A.R.E.N.™ is a legal assistance and emergency response tool. It does not constitute legal advice. Always consult a qualified attorney for legal matters specific to your situation.</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded accent-cyan-400"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
            />
            <span className="text-gray-200 text-sm">I have read and agree to the Terms of Service and Privacy Policy</span>
          </label>
          <Button
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl"
            onClick={handleAgreeToTerms}
            disabled={!termsAccepted || isAgreeingToTerms}
          >
            {isAgreeingToTerms ? 'Saving…' : 'Continue to C.A.R.E.N.™'}
          </Button>
        </div>
      </div>
    );
  }
  // ── End terms agreement screen ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={carenLogo} 
              alt="C.A.R.E.N.™ Logo" 
              className="w-20 h-20 rounded-full border-4 border-cyan-400/30"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">C.A.R.E.N.™</h1>
          <p className="text-gray-300 text-sm">Citizen Assistance for Roadside Emergencies & Navigation</p>
        </div>

        {/* Advanced Features Bar */}
        <div className="flex justify-center space-x-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVoiceRecognition}
            className={`border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 ${isListening ? 'bg-cyan-500/20' : ''}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowFacialRecognition(true);
              setFacialRecognitionMode('authenticate');
            }}
            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
          >
            <ScanFace className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Form Container */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-2xl">
          {currentMode === 'signin' && (
            <SimpleSignInForm
              onSwitchToCreate={() => setCurrentMode('create')}
              onSwitchToForgot={() => setCurrentMode('forgot')}
              onDemoLogin={startDemoLogin}
            />
          )}
          
          {currentMode === 'create' && (
            <SimpleCreateAccountForm
              onSwitchToSignIn={() => setCurrentMode('signin')}
              onNewUserCreated={handleNewUserCreated}
            />
          )}
          
          {currentMode === 'forgot' && (
            <SimpleForgotPasswordForm
              onSwitchToSignIn={() => setCurrentMode('signin')}
            />
          )}
        </div>

        {/* About C.A.R.E.N.™ Video Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.location.href = '/onboarding'}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
            <span>Watch About C.A.R.E.N.™ Video</span>
          </button>
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

      {/* New User Onboarding Modal */}
      <NewUserOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleOnboardingComplete}
        userEmail={newUserEmail}
      />
    </div>
  );
}