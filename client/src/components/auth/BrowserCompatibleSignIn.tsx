import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Loader2, AlertCircle } from "lucide-react";
import carenLogo from "@assets/caren-logo-full.png";
import promoImage1 from "@assets/promo-woman-kitchen.jpg";
import promoImage2 from "@assets/promo-woman-white.jpg";

// SimpleSignInForm stays eager — it is shown immediately on first render
import SimpleSignInForm from "./SimpleSignInForm";

// ── Heavy sub-components: lazy-loaded so they don't bloat the initial bundle ──
// SimpleCreateAccountForm (32KB), FacialRecognition (20KB), NewUserOnboardingModal (12KB)
// are only shown after user interaction, so safe to defer.
const SimpleCreateAccountForm = lazy(() => import("./SimpleCreateAccountForm"));
const SimpleForgotPasswordForm = lazy(() => import("./SimpleForgotPasswordForm"));
const NewUserOnboardingModal = lazy(() => import("./NewUserOnboardingModal"));

const SubFormLoader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
  </div>
);

import { Capacitor } from "@capacitor/core";

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type AuthMode = 'signin' | 'create' | 'forgot';

// Detect iOS native app (Capacitor) OR any WKWebView on iOS.
// Google OAuth must be hidden in both — it fails with "disallowed_useragent" in WKWebView.
// Safari on iPhone includes "Safari/" in the UA; WKWebView does not — that's the distinction.
const isNativeiOS = (): boolean => {
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') return true;
  } catch {}
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return /iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/Safari\//.test(ua);
};

export default function BrowserCompatibleSignIn() {
  const { toast } = useToast();
  const [currentMode, setCurrentMode] = useState<AuthMode>('signin');
  // Advanced features state (separated for better browser compatibility)
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoState, setVideoState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');

  const handleVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoState('loading');

    if (!video.paused) video.pause();

    // On Capacitor native (iOS/Android) the app points to carenalert.com,
    // so we use the full production URL to avoid any path resolution issues.
    const isNative = (() => { try { return Capacitor.isNativePlatform(); } catch { return false; } })();
    video.src = isNative ? 'https://carenalert.com/caren-hero.mp4' : '/caren-hero.mp4';
    video.muted = false;

    const doPlay = () => {
      video.play()
        .then(() => setVideoState('playing'))
        .catch((err) => {
          if (err?.name === 'AbortError') {
            setVideoState('idle');
          } else {
            // iOS blocks unmuted play — retry muted as fallback
            video.muted = true;
            video.play()
              .then(() => setVideoState('playing'))
              .catch(() => setVideoState('error'));
          }
        });
    };

    // Wait for canplay before calling play() — avoids AbortError
    // when play() is called before the browser has buffered enough data.
    if (video.readyState >= 3) {
      doPlay();
    } else {
      video.addEventListener('canplay', doPlay, { once: true });
      video.addEventListener('error', () => setVideoState('error'), { once: true });
      video.load();
    }
  }, []);

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
      toast({ title: 'Welcome to C.A.R.E.N.™ Alert!', description: 'Redirecting to your dashboard…' });
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
        description: "Welcome to the C.A.R.E.N.™ Alert demo!",
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
        description: "Say 'sign in' or 'create account'",
      });
    }
  };

  const handleNewUserCreated = (email: string) => {
    setNewUserEmail(email);
    setShowOnboardingModal(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
    toast({
      title: "Welcome to C.A.R.E.N.™ Alert!",
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
            <img src={carenLogo} alt="C.A.R.E.N.™ Alert" className="w-40 h-auto object-contain mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">One Last Step</h2>
            <p className="text-gray-300 text-sm mt-1">Your Google account is ready. Please agree to our terms to complete sign-up.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-300 space-y-2 max-h-40 overflow-y-auto">
            <p>By using C.A.R.E.N.™ Alert you agree to our <a href="/terms-of-service" className="text-cyan-400 underline" target="_blank">Terms of Service</a> and <a href="/privacy-policy" className="text-cyan-400 underline" target="_blank">Privacy Policy</a>.</p>
            <p>C.A.R.E.N.™ Alert is a legal assistance and emergency response tool. It does not constitute legal advice. Always consult a qualified attorney for legal matters specific to your situation.</p>
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
            {isAgreeingToTerms ? 'Saving…' : 'Continue to C.A.R.E.N.™ Alert'}
          </Button>
        </div>
      </div>
    );
  }
  // ── End terms agreement screen ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900">

      {/* ── Two-column hero layout ── */}
      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* ── LEFT: Video hero ── */}
        <div className="flex flex-col justify-center items-center lg:items-start px-6 pt-10 pb-6 lg:px-14 lg:py-16 lg:flex-1 gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src={carenLogo} alt="C.A.R.E.N.™ Alert" className="w-28 h-auto object-contain" />
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">C.A.R.E.N.™ Alert</h1>
              <p className="text-cyan-400 text-xs font-medium">Your Roadside Guardian</p>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center lg:text-left max-w-lg">
            <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
              Protection You Can Count On<br />
              <span className="text-cyan-400">When It Matters Most</span>
            </h2>
            <p className="text-gray-400 text-sm lg:text-base leading-relaxed">
              GPS-powered legal rights, real-time recording, attorney access, and emergency response — all in one app.
            </p>
          </div>

          {/* Video player — React-controlled load/play to ensure playback works */}
          <div className="w-full max-w-xl">
            <div
              data-testid="video-player"
              className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black aspect-video"
              style={{ background: "linear-gradient(135deg,#0a0f1a,#1e293b)" }}
            >
              {/* Native video element — src set via JS on play click, not via <source> */}
              <video
                ref={videoRef}
                controls={videoState === 'playing'}
                preload="none"
                playsInline
                data-testid="hero-video"
                className="w-full h-full object-cover"
                onPlaying={() => setVideoState('playing')}
                onWaiting={() => { if (videoState === 'playing') setVideoState('loading'); }}
                onError={() => setVideoState('error')}
                onEnded={() => setVideoState('idle')}
              />

              {/* Idle overlay — custom play button */}
              {videoState === 'idle' && (
                <button
                  data-testid="video-play-btn"
                  onClick={handleVideoPlay}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 group cursor-pointer bg-black/40 hover:bg-black/20 transition-colors"
                  aria-label="Play C.A.R.E.N.™ Alert demo video"
                >
                  <div className="w-16 h-16 rounded-full bg-cyan-500/90 flex items-center justify-center shadow-lg shadow-cyan-500/40 group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-black ml-1" fill="black" />
                  </div>
                  <span className="text-white/80 text-sm font-medium">Watch the Demo</span>
                </button>
              )}

              {/* Loading overlay */}
              {videoState === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                  <p className="text-white text-sm font-medium">Loading video…</p>
                </div>
              )}

              {/* Error overlay */}
              {videoState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="text-white font-semibold">Video unavailable</p>
                  <p className="text-gray-400 text-sm">GPS-Powered Legal Protection for Every Traffic Stop</p>
                  <button
                    onClick={() => setVideoState('idle')}
                    className="text-cyan-400 text-xs underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-500 text-xs text-center mt-2">Meet C.A.R.E.N.™ Alert — Your Roadside Guardian</p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 text-xs">
            {["GPS-Enabled Legal Rights", "50 States + DC", "Real-Time Recording", "Attorney Network", "Emergency SOS"].map((b) => (
              <span key={b} className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-3 py-1 rounded-full font-medium">
                {b}
              </span>
            ))}
          </div>

          {/* Promo photo */}
          <div className="w-full max-w-xl">
            <p className="text-gray-500 text-xs text-center mb-3 uppercase tracking-widest font-semibold">Trusted by families everywhere</p>
            <div className="relative rounded-xl overflow-hidden shadow-lg group">
              <img
                src={promoImage2}
                alt="C.A.R.E.N. Alert user"
                className="w-full object-cover object-center aspect-[3/4] group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-sm font-semibold leading-snug">"Knowing my rights has never been this easy."</p>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-xs">★</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Sign-in form ── */}
        <div className="flex flex-col justify-center items-center px-6 pb-10 lg:py-16 lg:px-10 lg:w-[420px] lg:border-l lg:border-white/5">

          {/* Voice toggle */}
          <div className="flex justify-end w-full max-w-sm mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceRecognition}
              className={`border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 ${isListening ? 'bg-cyan-500/20' : ''}`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>

          {/* Form card */}
          <div className="w-full max-w-sm bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-2xl">
            {currentMode === 'signin' && (
              <SimpleSignInForm
                onSwitchToCreate={() => setCurrentMode('create')}
                onSwitchToForgot={() => setCurrentMode('forgot')}
                onDemoLogin={startDemoLogin}
              />
            )}
            {currentMode === 'create' && (
              <Suspense fallback={<SubFormLoader />}>
                <SimpleCreateAccountForm
                  onSwitchToSignIn={() => setCurrentMode('signin')}
                  onNewUserCreated={handleNewUserCreated}
                />
              </Suspense>
            )}
            {currentMode === 'forgot' && (
              <Suspense fallback={<SubFormLoader />}>
                <SimpleForgotPasswordForm
                  onSwitchToSignIn={() => setCurrentMode('signin')}
                />
              </Suspense>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            © 2025 C.A.R.E.N.™ Alert. All rights reserved.<br />
            Your safety and legal protection platform.
          </p>
        </div>
      </div>{/* end two-column flex */}

      {/* ── Full-width short clip banner ── */}
      <div className="relative w-full overflow-hidden bg-black" style={{ maxHeight: "340px" }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full object-cover"
          style={{ maxHeight: "340px" }}
          onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
        >
          <source src="/caren-short.mp4" type="video/mp4" />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-black/40 to-transparent flex flex-col items-center justify-end pb-8 px-4 text-center">
          <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">One Tap Could Save a Life</p>
          <h3 className="text-white text-2xl lg:text-3xl font-black mb-1 drop-shadow-lg">Be Ready Before You Need It</h3>
          <p className="text-gray-300 text-sm max-w-md">C.A.R.E.N.™ Alert activates in seconds — recording, legal rights, and emergency alerts all at once.</p>
        </div>
      </div>

      {/* New User Onboarding Modal */}
      {showOnboardingModal && (
        <Suspense fallback={null}>
          <NewUserOnboardingModal
            isOpen={showOnboardingModal}
            onClose={() => setShowOnboardingModal(false)}
            onComplete={handleOnboardingComplete}
            userEmail={newUserEmail}
          />
        </Suspense>
      )}
    </div>
  );
}