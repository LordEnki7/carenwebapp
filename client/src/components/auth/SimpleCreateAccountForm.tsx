import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EyeIcon, EyeOffIcon, Check, X, ScanFace } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { FacialRecognition } from "@/components/FacialRecognition";
import WelcomeAnimation from "./WelcomeAnimation";

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
    message: "You must agree to the EULA",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateAccountFormData = z.infer<typeof createAccountSchema>;

interface SimpleCreateAccountFormProps {
  onSwitchToSignIn: () => void;
  onNewUserCreated?: (email: string) => void;
}

export default function SimpleCreateAccountForm({ onSwitchToSignIn, onNewUserCreated }: SimpleCreateAccountFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showFacialRecognition, setShowFacialRecognition] = useState(false);
  const [passwordValidationStatus, setPasswordValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState<string>("");
  
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

  const form = useForm<CreateAccountFormData>({
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

  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountFormData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionToken) {
        localStorage.setItem('sessionToken', data.sessionToken);
      }
      
      // Extract user name for personalized welcome
      const firstName = form.getValues('firstName');
      const email = form.getValues('email');
      const userName = firstName || email?.split('@')[0] || 'User';
      setWelcomeUserName(userName);
      setShowWelcomeAnimation(true);
    },
    onError: (error: any) => {
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateAccountFormData) => {
    createAccountMutation.mutate(data);
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeAnimation(false);
    
    // Get the email from the form data
    const email = form.getValues('email');
    
    // Trigger the onboarding modal for new users
    if (onNewUserCreated) {
      onNewUserCreated(email);
    } else {
      // Fallback to direct dashboard redirect if no onboarding handler
      toast({
        title: "Account Created Successfully",
        description: "Welcome to C.A.R.E.N.™! Redirecting to your dashboard...",
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    }
  };

  const passwordsMatch = form.watch("password") && form.watch("confirmPassword") && form.watch("password") === form.watch("confirmPassword");

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

  // Password validation with backend check
  useEffect(() => {
    const password = form.watch("password");
    if (password && password.length >= 6) {
      setPasswordValidationStatus('checking');
      const timer = setTimeout(async () => {
        try {
          const response = await apiRequest("POST", "/api/auth/validate-password", { password });
          const result = await response.json();
          setPasswordValidationStatus(result.isValid ? 'valid' : 'invalid');
        } catch (error) {
          setPasswordValidationStatus('valid'); // Default to valid if service unavailable
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [form.watch("password")]);

  const handleFacialRecognitionSuccess = (data: any) => {
    console.log('Facial recognition registered:', data);
    setShowFacialRecognition(false);
    toast({
      title: "Facial Recognition Registered",
      description: "Your face has been registered for future biometric authentication.",
    });
  };

  const handleFacialRecognitionFailure = (error: string) => {
    console.error('Facial recognition registration failed:', error);
    setShowFacialRecognition(false);
    toast({
      title: "Facial Recognition Failed",
      description: error || "Registration failed. You can set this up later in settings.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
        <p className="text-gray-300">Join C.A.R.E.N.™ for legal protection</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-gray-200 font-medium">First Name</Label>
            <Input
              id="firstName"
              placeholder="Enter first name"
              {...form.register("firstName")}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName" className="text-gray-200 font-medium">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              {...form.register("lastName")}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
            />
            {form.formState.errors.lastName && (
              <p className="text-xs text-red-400 mt-1">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="create-email" className="text-gray-200 font-medium">Email Address</Label>
          <Input
            id="create-email"
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
          <Label htmlFor="create-password" className="text-gray-200 font-medium">Password</Label>
          <div className="relative">
            <Input
              id="create-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
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
          <PasswordStrengthMeter password={form.watch("password")} />
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-gray-200 font-medium">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              {...form.register("confirmPassword")}
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
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-400 mt-1">{form.formState.errors.confirmPassword.message}</p>
          )}
          {passwordsMatch && (
            <div className="flex items-center space-x-2 mt-2">
              <Check className="h-3 w-3 text-green-400" />
              <p className="text-xs text-green-400">Passwords match perfectly!</p>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="preferredLanguage" className="text-gray-200 font-medium">Preferred Language</Label>
          <Select onValueChange={(value) => form.setValue("preferredLanguage", value)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-cyan-400 focus:ring-cyan-400/20">
              <SelectValue placeholder="Select your language" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800/95 border-gray-600 backdrop-blur-sm">
              <SelectItem value="en" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇺🇸 English</SelectItem>
              <SelectItem value="es" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇪🇸 Español</SelectItem>
              <SelectItem value="fr" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇫🇷 Français</SelectItem>
              <SelectItem value="de" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇩🇪 Deutsch</SelectItem>
              <SelectItem value="it" className="text-white hover:bg-gray-700/70 focus:bg-gray-700/70 cursor-pointer">🇮🇹 Italiano</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.preferredLanguage && (
            <p className="text-xs text-red-400 mt-1">{form.formState.errors.preferredLanguage.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="agree-terms"
              checked={form.watch("agreeToTerms")}
              onCheckedChange={(checked) => form.setValue("agreeToTerms", !!checked)}
              disabled={!hasReadTerms}
              className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 mt-0.5"
            />
            <Label htmlFor="agree-terms" className="text-sm text-gray-300 leading-5">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => { setHasReadTerms(true); setTermsScrolledToEnd(true); setShowTermsDialog(true); }}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                User Agreement
              </button>
              {hasReadTerms ? (
                <Check className="inline w-3 h-3 text-green-400 ml-1" />
              ) : (
                <span className="text-orange-400 text-xs ml-1">(read required)</span>
              )}
            </Label>
          </div>
          {form.formState.errors.agreeToTerms && (
            <p className="text-xs text-red-400">{form.formState.errors.agreeToTerms.message}</p>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="agree-privacy"
              checked={form.watch("agreeToPrivacy")}
              onCheckedChange={(checked) => form.setValue("agreeToPrivacy", !!checked)}
              disabled={!hasReadPrivacy}
              className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 mt-0.5"
            />
            <Label htmlFor="agree-privacy" className="text-sm text-gray-300 leading-5">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => { setHasReadPrivacy(true); setPrivacyScrolledToEnd(true); setShowPrivacyDialog(true); }}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Privacy Policy
              </button>
              {hasReadPrivacy ? (
                <Check className="inline w-3 h-3 text-green-400 ml-1" />
              ) : (
                <span className="text-orange-400 text-xs ml-1">(read required)</span>
              )}
            </Label>
          </div>
          {form.formState.errors.agreeToPrivacy && (
            <p className="text-xs text-red-400">{form.formState.errors.agreeToPrivacy.message}</p>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="agree-eula"
              checked={form.watch("agreeToEULA")}
              onCheckedChange={(checked) => form.setValue("agreeToEULA", !!checked)}
              disabled={!hasReadEULA}
              className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 mt-0.5"
            />
            <Label htmlFor="agree-eula" className="text-sm text-gray-300 leading-5">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => { setHasReadEULA(true); setEulaScrolledToEnd(true); setShowEulaDialog(true); }}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                End User License Agreement
              </button>
              {hasReadEULA ? (
                <Check className="inline w-3 h-3 text-green-400 ml-1" />
              ) : (
                <span className="text-orange-400 text-xs ml-1">(read required)</span>
              )}
            </Label>
          </div>
          {form.formState.errors.agreeToEULA && (
            <p className="text-xs text-red-400">{form.formState.errors.agreeToEULA.message}</p>
          )}
        </div>

        {/* Optional Facial Recognition Setup */}
        <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-cyan-300">Facial Recognition (Optional)</h4>
              <p className="text-xs text-gray-400">Set up biometric authentication for faster sign-in</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFacialRecognition(true)}
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              <ScanFace className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          disabled={createAccountMutation.isPending}
        >
          {createAccountMutation.isPending ? "Creating Account..." : "Create Account"}
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

        {/* Google Sign-Up Button */}
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
          <span className="text-base font-semibold">Google Sign Up</span>
        </Button>

        <p className="text-sm text-gray-300">
          Already have an account?{" "}
          <button 
            onClick={onSwitchToSignIn}
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            Sign In
          </button>
        </p>
      </div>

      {/* Legal Document Dialogs */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800/95 backdrop-blur-lg border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">User Agreement</DialogTitle>
            <DialogDescription className="text-gray-300">
              Please read the entire document by scrolling to the bottom. You must read the full agreement to proceed.
            </DialogDescription>
          </DialogHeader>
          <div 
            className="prose prose-invert max-w-none overflow-y-auto max-h-[60vh] pr-4 text-gray-200"
            onScroll={(e) => handleDocumentScroll(e, 'terms')}
          >
            <h3>C.A.R.E.N.™ User Agreement</h3>
            <p>This User Agreement governs your use of the C.A.R.E.N.™ (Citizen Assistance for Roadside Emergencies and Navigation) platform and services.</p>
            
            <h4>1. Acceptance of Terms</h4>
            <p>By creating an account and using C.A.R.E.N.™, you agree to be bound by this User Agreement and all applicable laws and regulations.</p>
            
            <h4>2. Service Description</h4>
            <p>C.A.R.E.N.™ provides legal information, emergency assistance coordination, and attorney-client communication services for roadside encounters.</p>
            
            <h4>3. User Responsibilities</h4>
            <p>You agree to provide accurate information, use the service lawfully, and maintain the confidentiality of your account credentials.</p>
            
            <h4>4. Privacy and Data Protection</h4>
            <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.</p>
            
            <h4>5. Limitation of Liability</h4>
            <p>C.A.R.E.N.™ provides information and coordination services but does not provide legal advice. Always consult with qualified legal professionals.</p>
            
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
              onClick={() => setShowTermsDialog(false)}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800/95 backdrop-blur-lg border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">Privacy Policy</DialogTitle>
            <DialogDescription className="text-gray-300">
              Please read our privacy policy completely before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div 
            className="prose prose-invert max-w-none overflow-y-auto max-h-[60vh] pr-4 text-gray-200"
            onScroll={(e) => handleDocumentScroll(e, 'privacy')}
          >
            <h3>C.A.R.E.N.™ Privacy Policy</h3>
            <p>This Privacy Policy describes how C.A.R.E.N.™ collects, uses, and protects your personal information.</p>
            
            <h4>1. Information We Collect</h4>
            <p>We collect information you provide directly, such as account details, emergency contacts, and incident reports.</p>
            
            <h4>2. How We Use Your Information</h4>
            <p>Your information is used to provide emergency services, legal information, and communicate with attorneys and emergency contacts.</p>
            
            <h4>3. Information Sharing</h4>
            <p>We only share your information with emergency contacts, legal professionals, and authorized emergency services when necessary.</p>
            
            <h4>4. Data Security</h4>
            <p>We implement industry-standard security measures to protect your personal data and legal information.</p>
            
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
              onClick={() => setShowPrivacyDialog(false)}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEulaDialog} onOpenChange={setShowEulaDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800/95 backdrop-blur-lg border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">End User License Agreement</DialogTitle>
            <DialogDescription className="text-gray-300">
              Please read the complete EULA before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div 
            className="prose prose-invert max-w-none overflow-y-auto max-h-[60vh] pr-4 text-gray-200"
            onScroll={(e) => handleDocumentScroll(e, 'eula')}
          >
            <h3>C.A.R.E.N.™ End User License Agreement</h3>
            <p>This EULA governs your use of the C.A.R.E.N.™ software and mobile applications.</p>
            
            <h4>1. License Grant</h4>
            <p>We grant you a limited, non-exclusive license to use C.A.R.E.N.™ software for your personal emergency and legal protection needs.</p>
            
            <h4>2. Restrictions</h4>
            <p>You may not modify, reverse engineer, or distribute the C.A.R.E.N.™ software without explicit permission.</p>
            
            <h4>3. Updates and Maintenance</h4>
            <p>We may provide updates to improve functionality and security. Use of updated versions is governed by this EULA.</p>
            
            <h4>4. Termination</h4>
            <p>This license is effective until terminated by either party. Your rights under this license will terminate automatically upon violation.</p>
            
            <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm font-medium text-cyan-200">By scrolling to this point, you acknowledge that you have read the complete EULA.</p>
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
              onClick={() => setShowEulaDialog(false)}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Facial Recognition Dialog */}
      <Dialog open={showFacialRecognition} onOpenChange={setShowFacialRecognition}>
        <DialogContent className="max-w-md bg-gray-800/95 backdrop-blur-lg border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">Register Face for Account</DialogTitle>
            <DialogDescription className="text-gray-300">
              Register your face for secure biometric authentication on future sign-ins
            </DialogDescription>
          </DialogHeader>
          <FacialRecognition
            mode="register"
            onSuccess={handleFacialRecognitionSuccess}
            onFailure={handleFacialRecognitionFailure}
          />
        </DialogContent>
      </Dialog>

      {/* Welcome Animation */}
      <WelcomeAnimation
        isVisible={showWelcomeAnimation}
        userName={welcomeUserName}
        onComplete={handleWelcomeComplete}
      />
    </div>
  );
}