import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, Suspense, lazy, Component, ReactNode, useState } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
          <div className="text-4xl mb-4">🛡️</div>
          <h1 className="text-xl font-bold mb-2">C.A.R.E.N. ALERT</h1>
          <p className="text-slate-400 mb-6">Something went wrong. Please restart the app.</p>
          <button onClick={() => window.location.reload()} className="bg-cyan-500 text-white px-6 py-3 rounded-lg font-semibold">Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

import NotFound from "@/pages/not-found";

// ── RULE: All pages must be lazy-loaded to prevent 37% iOS loading hang ──
// Eagerly-loading large pages (Dashboard 42KB, Record 52KB, etc.) bloats the
// initial JS bundle and causes WKWebView to freeze at 37% on iOS.
// BrowserCompatibleSignIn must remain eager — it IS the initial loading screen.
import BrowserCompatibleSignIn from "@/components/auth/BrowserCompatibleSignIn";

const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const Record = lazy(() => import("@/pages/Record"));
const Rights = lazy(() => import("@/pages/Rights"));

const LazyLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900">
    <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
  </div>
);

const Attorneys = lazy(() => import("@/pages/Attorneys"));
const Messages = lazy(() => import("@/pages/Messages"));
const Settings = lazy(() => import("@/pages/Settings"));
const AccountSecurity = lazy(() => import("@/pages/AccountSecurity"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Payment = lazy(() => import("@/pages/Payment"));
const Help = lazy(() => import("@/pages/Help"));
const InteractiveTutorial = lazy(() => import("@/pages/InteractiveTutorial"));
const PoliceMonitor = lazy(() => import("@/pages/PoliceMonitor"));
const EmergencyPullover = lazy(() => import("@/pages/EmergencyPullover"));
const PoliceReportForm = lazy(() => import("@/pages/PoliceReportForm"));
const DeEscalationGuide = lazy(() => import("@/pages/DeEscalationGuide"));
const CloudSync = lazy(() => import("@/pages/CloudSync"));
const AILearningDashboard = lazy(() => import("@/pages/AILearningDashboard"));
const LegalRightsMap = lazy(() => import("@/pages/LegalRightsMap"));
const VoicePrintAuth = lazy(() => import("@/pages/VoicePrintAuth"));
const BluetoothEarpiece = lazy(() => import("@/pages/BluetoothEarpiece"));
const MediaTest = lazy(() => import("@/pages/MediaTest"));
const LivestreamToAttorneys = lazy(() => import("@/pages/LivestreamToAttorneys"));
const RoadsideAssistance = lazy(() => import("@/pages/RoadsideAssistance"));
const Complaints = lazy(() => import("@/pages/Complaints"));
const EmergencySharing = lazy(() => import("@/pages/EmergencySharing"));
const EvidenceCatalog = lazy(() => import("@/pages/EvidenceCatalog"));
const AccessibilityEnhancer = lazy(() => import("@/pages/AccessibilityEnhancer"));
const UnifiedVoiceHub = lazy(() => import("@/pages/UnifiedVoiceHub"));
const UnifiedDeviceSetup = lazy(() => import("@/pages/UnifiedDeviceSetup"));
const SimpleAdminDashboard = lazy(() => import("@/pages/SimpleAdminDashboard"));
const LoadTestDashboard = lazy(() => import("@/pages/LoadTestDashboard"));
const N8NTestDashboard = lazy(() => import("@/pages/N8NTestDashboard"));
const VoiceCommandOptimizationDashboard = lazy(() => import("@/components/VoiceCommandOptimizationDashboard"));
const AdaptiveLearningDashboard = lazy(() => import("@/components/AdaptiveLearningDashboard"));
const MobilePerformance = lazy(() => import("@/pages/MobilePerformance"));
const NativeMobileFeatures = lazy(() => import("@/pages/NativeMobileFeatures"));
const SmartAutoMutePage = lazy(() => import("@/pages/SmartAutoMutePage"));
const VehicleReadability = lazy(() => import("@/pages/VehicleReadability"));
const AudioFeedbackSettings = lazy(() => import("@/pages/AudioFeedbackSettings"));
const BluetoothDevices = lazy(() => import("@/pages/BluetoothDevices"));
const VoiceCommands = lazy(() => import("@/pages/VoiceCommands"));
const Community = lazy(() => import("@/pages/Community"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const CreatePost = lazy(() => import("@/pages/CreatePost"));
const VoiceCoaching = lazy(() => import("@/pages/VoiceCoaching"));
const RecordingAnalysis = lazy(() => import("@/pages/RecordingAnalysis"));
const LegalDocumentGenerator = lazy(() => import("@/pages/LegalDocumentGenerator"));
const TranslationHub = lazy(() => import("@/pages/TranslationHub"));
const AttorneyMatching = lazy(() => import("@/pages/AttorneyMatching"));
const WaitlistPage = lazy(() => import("@/pages/WaitlistPage"));
const InvestorPage = lazy(() => import("@/pages/InvestorPage"));
const PressKit = lazy(() => import("@/pages/PressKit"));
const FeaturePicker = lazy(() => import("@/pages/FeaturePicker"));
const AnalyticsDashboard = lazy(() => import("@/pages/AnalyticsDashboard"));
const EmailCampaigns = lazy(() => import("@/pages/EmailCampaigns"));
const FeedbackBoard = lazy(() => import("@/pages/FeedbackBoard"));
const EarlyAccessLab = lazy(() => import("@/pages/EarlyAccessLab"));
const AgentDashboard = lazy(() => import("@/pages/AgentDashboard"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Plans = lazy(() => import("@/pages/Plans"));

function Router() {
  // ── Google OAuth redirect handler ──────────────────────────────────────
  // Must run synchronously before useAuth so the token is in localStorage
  // when the auth query fires for the first time.
  const _urlParams = new URLSearchParams(window.location.search);
  const _googleAuth = _urlParams.get('google_auth');
  const _sessionTokenFromUrl = _urlParams.get('session_token');
  if (_googleAuth && _sessionTokenFromUrl) {
    localStorage.setItem('sessionToken', _sessionTokenFromUrl);
    // Remove the params from the URL bar without reloading
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log('[GOOGLE_AUTH] Session token captured from URL and saved to localStorage');
  }
  // ── End Google OAuth handler ───────────────────────────────────────────

  const { isAuthenticated, isLoading } = useAuth();

  // Check if user is new and needs onboarding
  const hasSeenOnboarding = localStorage.getItem('caren_onboarding_state') ? 
    JSON.parse(localStorage.getItem('caren_onboarding_state') || '{}').hasSeenOnboarding : false;

  // Prefetch the most critical pages as soon as auth resolves so they feel instant
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      // User is logged in — preload the pages they'll visit first
      import("@/pages/Dashboard");
      import("@/pages/Record");
      import("@/pages/Rights");
    } else {
      // User is on sign-in screen — preload the create-account and forgot-password forms
      import("@/components/auth/SimpleCreateAccountForm");
      import("@/components/auth/SimpleForgotPasswordForm");
    }
  }, [isLoading, isAuthenticated]);

  // Clean up old session tokens on app startup to prevent authentication issues
  useEffect(() => {
    // Add global error handler to prevent unhandled promise rejections from causing alerts
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('[GLOBAL] Handled unhandled promise rejection:', event.reason);
      // Prevent the default browser behavior (alert popup)
      event.preventDefault();
    };

    // Add the global error handler
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    const cleanupOldTokens = () => {
      const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
      
      if (isProduction) {
        const demoTokens = [
          'demoSessionKey',
          'demo_token',
          'test_session',
          'dev_token'
        ];
        
        demoTokens.forEach(token => {
          if (localStorage.getItem(token)) {
            localStorage.removeItem(token);
            console.log(`[SECURITY] Removed demo token: ${token}`);
          }
        });
      }
      
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      if (sessionExpiry && new Date(sessionExpiry) < new Date()) {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('sessionExpiry');
        localStorage.removeItem('customDomainToken');
        console.log('[SECURITY] Removed expired session tokens');
      }
    };
    
    cleanupOldTokens();
    
    // Cleanup function to remove the global error handler
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <>
      {/* Global voice commands work across all pages - DISABLED for testing */}
      {/* {isAuthenticated && <GlobalVoiceCommands />} */}
      
      {isLoading ? (
        /* Show spinner on ALL paths during auth check — not just "/" */
        <Route path="/:rest*" component={() => <div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" /></div>} />
      ) : !isAuthenticated ? (
        <Suspense fallback={<LazyLoader />}>
          <Switch>
            {/* Always start at signin page for unauthenticated users */}
            <Route path="/" component={BrowserCompatibleSignIn} />
            <Route path="/onboarding" component={OnboardingPage} />
            <Route path="/signin" component={BrowserCompatibleSignIn} />
            <Route path="/terms" component={TermsOfService} />
            <Route path="/privacy" component={PrivacyPolicy} />
            <Route path="/about" component={Landing} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/help" component={Help} />
            <Route path="/rights" component={() => <Rights />} />
            <Route path="/admin" component={SimpleAdminDashboard} />
            <Route path="/load-test" component={LoadTestDashboard} />
            <Route path="/waitlist" component={WaitlistPage} />
            <Route path="/investors" component={InvestorPage} />
            <Route path="/press" component={PressKit} />

            {/* Catch-all route - redirect all other routes to sign in for unauthenticated users */}
            <Route path="*" component={() => {
              const currentPath = window.location.pathname;
              const allowedRedirects = ['/help', '/rights', '/attorneys', '/messages', '/settings'];
              if (allowedRedirects.includes(currentPath)) {
                sessionStorage.setItem('redirectAfterAuth', currentPath);
              }
              return <BrowserCompatibleSignIn />;
            }} />
          </Switch>
        </Suspense>
      ) : (
        <Suspense fallback={<LazyLoader />}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/record" component={Record} />
            <Route path="/emergency-pullover" component={EmergencyPullover} />
            <Route path="/police-monitor" component={PoliceMonitor} />
            <Route path="/file-complaint" component={Complaints} />
            <Route path="/complaints" component={Complaints} />
            <Route path="/emergency-sharing" component={EmergencySharing} />
            <Route path="/police-report" component={PoliceReportForm} />
            <Route path="/de-escalation-guide" component={DeEscalationGuide} />
            <Route path="/rights-test" component={Rights} />
            <Route path="/legal-rights-map" component={LegalRightsMap} />
            <Route path="/roadside-assistance" component={RoadsideAssistance} />
            <Route path="/attorneys" component={Attorneys} />
            <Route path="/messages" component={Messages} />
            <Route path="/community" component={Community} />
            <Route path="/community/category/:id" component={CategoryPage} />
            <Route path="/community/create-post" component={CreatePost} />
            <Route path="/cloud-sync" component={CloudSync} />
            <Route path="/voice-hub" component={UnifiedVoiceHub} />
            <Route path="/voice-commands" component={VoiceCommands} />
            <Route path="/voice-optimization" component={VoiceCommandOptimizationDashboard} />
            <Route path="/adaptive-learning" component={AdaptiveLearningDashboard} />
            <Route path="/mobile-performance" component={MobilePerformance} />
            <Route path="/native-mobile-features" component={NativeMobileFeatures} />
            <Route path="/smart-auto-mute" component={SmartAutoMutePage} />
            <Route path="/vehicle-readability" component={VehicleReadability} />
            <Route path="/audio-feedback" component={AudioFeedbackSettings} />
            <Route path="/bluetooth-devices" component={BluetoothDevices} />
            <Route path="/device-setup" component={UnifiedDeviceSetup} />
            <Route path="/voice-auth" component={VoicePrintAuth} />
            <Route path="/bluetooth-earpiece" component={BluetoothEarpiece} />
            <Route path="/media-test" component={MediaTest} />
            <Route path="/livestream-attorneys" component={LivestreamToAttorneys} />
            <Route path="/ai-learning" component={AILearningDashboard} />
            <Route path="/voice-coaching" component={VoiceCoaching} />
            <Route path="/recording-analysis" component={RecordingAnalysis} />
            <Route path="/legal-documents" component={LegalDocumentGenerator} />
            <Route path="/translation" component={TranslationHub} />
            <Route path="/attorney-matching" component={AttorneyMatching} />
            <Route path="/evidence-catalog" component={EvidenceCatalog} />
            <Route path="/accessibility" component={AccessibilityEnhancer} />
            <Route path="/payment" component={Payment} />
            <Route path="/plans" component={Plans} />
            <Route path="/admin" component={SimpleAdminDashboard} />
            <Route path="/load-test" component={LoadTestDashboard} />
            <Route path="/n8n-test" component={N8NTestDashboard} />
            <Route path="/waitlist" component={WaitlistPage} />
            <Route path="/investors" component={InvestorPage} />
            <Route path="/press" component={PressKit} />
            <Route path="/feature-picker" component={FeaturePicker} />
            <Route path="/analytics" component={AnalyticsDashboard} />
            <Route path="/email-campaigns" component={EmailCampaigns} />
            <Route path="/feedback" component={FeedbackBoard} />
            <Route path="/early-access" component={EarlyAccessLab} />
            <Route path="/agent-dashboard" component={AgentDashboard} />
            <Route path="/settings" component={Settings} />
            <Route path="/account-security" component={AccountSecurity} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/help" component={Help} />
            <Route path="/privacy" component={PrivacyPolicy} />
            <Route path="/terms" component={TermsOfService} />
            <Route path="/tutorial" component={InteractiveTutorial} />
            <Route path="/rights" component={() => {
              console.log('🔥 RIGHTS ROUTE MATCHED! - AUTHENTICATED ACCESS');
              return <Rights />;
            }} />
            
            {/* IMPORTANT: Catch-all route MUST be last - it captures all unmatched routes */}
            <Route path="*" component={() => {
              console.log('CATCH-ALL route matched for path:', window.location.pathname);
              return <NotFound />;
            }} />
          </Switch>
        </Suspense>
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
