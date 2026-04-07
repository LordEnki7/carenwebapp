import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import WelcomeAnimation from "./WelcomeAnimation";
import AppleSignInButton from "./AppleSignInButton";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { signInWithApple } from "@/lib/appleSignIn";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SimpleSignInFormProps {
  onSwitchToCreate: () => void;
  onSwitchToForgot: () => void;
  onDemoLogin: () => void;
}

import { Capacitor } from "@capacitor/core";

// Detect iOS native app (Capacitor) OR any WKWebView on iOS.
// Google OAuth must be hidden in both — it fails with "disallowed_useragent" in WKWebView.
// Safari on iPhone includes "Safari/" in the UA; WKWebView does not — that's the distinction.
const isNativeiOS = (): boolean => {
  // Primary: Capacitor native bridge
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') return true;
  } catch {}
  // Fallback: WKWebView UA fingerprint (no "Safari/" token, but has "AppleWebKit" + iPhone/iPad)
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return /iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/Safari\//.test(ua);
};

export default function SimpleSignInForm({ onSwitchToCreate, onSwitchToForgot, onDemoLogin }: SimpleSignInFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [oniOS] = useState(() => isNativeiOS());
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState<string>("");

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (data: SignInFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('[SIGNIN] Login response:', data);
      
      // Store session token for authentication
      if (data.sessionToken) {
        localStorage.setItem('sessionToken', data.sessionToken);
        console.log('[SIGNIN] Session token stored:', data.sessionToken);
      }
      
      // Store demo session key if provided
      if (data.demoSessionKey) {
        localStorage.setItem('demoSessionKey', data.demoSessionKey);
        console.log('[SIGNIN] Demo session key stored:', data.demoSessionKey);
      }
      
      // Extract user name for personalized welcome
      const userName = data.user?.firstName || data.user?.email?.split('@')[0] || 'User';
      setWelcomeUserName(userName);
      setShowWelcomeAnimation(true);
    },
    onError: (error: any) => {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignInFormData) => {
    signInMutation.mutate(data);
  };

  const handleAppleSignInSuccess = async () => {
    try {
      const appleResult = await signInWithApple();
      const response = await apiRequest("POST", "/api/auth/apple", {
        identityToken: appleResult.identityToken,
        authorizationCode: appleResult.authorizationCode,
        email: appleResult.email,
        givenName: appleResult.givenName,
        familyName: appleResult.familyName,
        appleUserId: appleResult.user,
      });
      const data = await response.json();
      if (data.sessionToken) {
        localStorage.setItem('sessionToken', data.sessionToken);
      }

      // Accept terms automatically — Apple Sign In already requires
      // the user to authenticate through Apple's own consent flow.
      // This ensures agreedToTerms=true is set in the database so
      // useAuth recognises the user as fully authenticated.
      if (data.user && !data.user.agreedToTerms) {
        try {
          await apiRequest("POST", "/api/auth/accept-terms");
        } catch (termsErr) {
          console.warn('[APPLE_SIGNIN] accept-terms call failed (non-fatal):', termsErr);
        }
      }

      const userName = data.user?.firstName || data.user?.email?.split('@')[0] || 'User';
      setWelcomeUserName(userName);
      setShowWelcomeAnimation(true);
    } catch (err: any) {
      if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) return;
      toast({
        title: "Apple Sign In Failed",
        description: err.message || "Could not sign in with Apple. Please try another method.",
        variant: "destructive",
      });
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeAnimation(false);
    toast({
      title: "Welcome back!",
      description: "Redirecting to your dashboard...",
    });
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
        <p className="text-gray-300">Sign in to your C.A.R.E.N.™ account</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="signin-email" className="text-gray-200 font-medium">Email Address</Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="Enter your email"
            {...form.register("email")}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-400 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="signin-password" className="text-gray-200 font-medium">Password</Label>
          <div className="relative">
            <Input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...form.register("password")}
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
          {form.formState.errors.password && (
            <p className="text-xs text-red-400 mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember-me"
              {...form.register("rememberMe")}
              className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
            />
            <Label htmlFor="remember-me" className="text-sm text-gray-300">Remember me</Label>
          </div>
          <button
            type="button"
            onClick={onSwitchToForgot}
            className="text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            Forgot Password?
          </button>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          disabled={signInMutation.isPending}
        >
          {signInMutation.isPending ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">Or</span>
          </div>
        </div>

        {/* Sign in with Apple — required for iOS App Store (Guideline 4.8) */}
        <AppleSignInButton onSuccess={handleAppleSignInSuccess} />

        {/* Google Sign-In — hidden on iOS native (OAuth redirect doesn't work in WKWebView) */}
        {!oniOS && (
          <Button
            type="button"
            onClick={() => window.location.href = '/api/auth/google'}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold border border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-3 py-3 rounded-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-base font-semibold">Continue with Google</span>
          </Button>
        )}

        <Button
          type="button"
          onClick={onDemoLogin}
          variant="outline"
          className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400"
        >
          Try Demo Mode
        </Button>

        <p className="text-sm text-gray-300">
          Don't have an account?{" "}
          <button 
            onClick={onSwitchToCreate}
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            Create Account
          </button>
        </p>
      </div>

      {/* Welcome Animation */}
      <WelcomeAnimation
        isVisible={showWelcomeAnimation}
        userName={welcomeUserName}
        onComplete={handleWelcomeComplete}
      />
    </div>
  );
}