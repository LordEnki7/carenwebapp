import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Shield, Loader2, ArrowRight, Lock } from "lucide-react";

const PLAN_DISPLAY: Record<string, { name: string; price: string; period: string }> = {
  community_guardian: { name: "Community Guardian", price: "$0.99", period: "one-time" },
  standard_plan:      { name: "Standard Plan",      price: "$4.99",  period: "/month" },
  legal_shield:       { name: "Legal Shield",       price: "$9.99",  period: "/month" },
  family_plan:        { name: "Family Plan",         price: "$29.99", period: "/month" },
  fleet_enterprise:   { name: "Fleet & Enterprise", price: "$49.99", period: "/month" },
};

type Stage = "verifying" | "needs-account" | "activating" | "success" | "error";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") || "";
  const planId = params.get("plan") || "";
  const planInfo = PLAN_DISPLAY[planId] || { name: "Your Plan", price: "", period: "" };

  const [stage, setStage] = useState<Stage>("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  // Registration form state
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: verify the Stripe session is actually paid
  useEffect(() => {
    if (!sessionId) {
      setStage("error");
      setErrorMsg("No payment session found. If you completed a purchase, please contact support.");
      return;
    }

    fetch(`/api/subscription/session-status?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.paid) {
          setStage("error");
          setErrorMsg("Your payment is not yet confirmed. Please wait a moment and refresh, or contact support.");
          return;
        }

        // Pre-fill email from Stripe customer details
        if (data.customerEmail) setEmail(data.customerEmail);

        if (isAuthenticated) {
          activateForLoggedInUser();
        } else {
          setStage("needs-account");
        }
      })
      .catch(() => {
        setStage("error");
        setErrorMsg("Could not verify your payment. Please contact support with your receipt.");
      });
  }, [sessionId, isAuthenticated]);

  const activateForLoggedInUser = async () => {
    setStage("activating");
    try {
      const res = await apiRequest("POST", "/api/subscription/activate", { sessionId });
      if (res.ok) {
        setStage("success");
      } else {
        const data = await res.json();
        setStage("error");
        setErrorMsg(data.message || "Could not activate your subscription. Please contact support.");
      }
    } catch {
      setStage("error");
      setErrorMsg("An error occurred activating your subscription. Please contact support.");
    }
  };

  const handleCreateAccount = async () => {
    if (!firstName.trim() || !email.trim() || !password.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "Agreement required", description: "Please agree to the Terms, Privacy Policy, and EULA.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const regRes = await apiRequest("POST", "/api/auth/register", {
        firstName,
        email,
        password,
        agreeToTerms: true,
        agreeToPrivacy: true,
        agreeToEULA: true,
      });

      if (!regRes.ok) {
        const data = await regRes.json();
        toast({ title: "Account creation failed", description: data.message || "Please try again.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Account created — now activate the subscription
      setStage("activating");
      await activateForLoggedInUser();
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      setSubmitting(false);
    }
  };

  // ── Rendering ──

  if (stage === "verifying" || stage === "activating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="bg-gray-800/50 border-cyan-500/30 max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
            <p className="text-white text-lg font-medium">
              {stage === "verifying" ? "Verifying your payment..." : "Activating your subscription..."}
            </p>
            <p className="text-gray-400 text-sm">This only takes a moment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="bg-gray-800/50 border-red-500/30 max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <Shield className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-white text-xl font-bold">Something went wrong</h2>
            <p className="text-gray-300 text-sm">{errorMsg}</p>
            <p className="text-gray-400 text-xs">
              Email us at{" "}
              <a href="mailto:support@carenalert.com" className="text-cyan-400 underline">
                support@carenalert.com
              </a>{" "}
              with your order confirmation and we'll activate your account manually.
            </p>
            <Button onClick={() => setLocation("/plans")} variant="outline" className="border-cyan-500/30 text-cyan-400">
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="bg-gray-800/50 border-green-500/30 max-w-md w-full text-center">
          <CardContent className="p-8 space-y-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            <div>
              <h2 className="text-white text-2xl font-bold mb-1">Payment Successful!</h2>
              <p className="text-gray-300">
                Your <span className="text-cyan-400 font-semibold">{planInfo.name}</span> plan is now active.
              </p>
            </div>
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Plan</span>
                <span className="text-white font-medium">{planInfo.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price</span>
                <span className="text-white font-medium">{planInfo.price}{planInfo.period}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              A receipt has been sent to your email address. You now have full access to all {planInfo.name} features.
            </p>
            <Button
              onClick={() => setLocation("/dashboard")}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // stage === "needs-account"
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4">
        {/* Payment confirmed banner */}
        <Card className="bg-green-900/30 border-green-500/40">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-300 font-semibold text-sm">Payment confirmed!</p>
              <p className="text-green-400/80 text-xs">
                Your <span className="font-medium">{planInfo.name}</span> ({planInfo.price}{planInfo.period}) is paid.
                Create your account below to activate it.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account creation form */}
        <Card className="bg-gray-800/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Create Your Account
            </CardTitle>
            <CardDescription className="text-gray-400">
              Set up your account to activate your {planInfo.name} subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">First Name</Label>
              <Input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-500"
              />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-1 accent-cyan-500"
              />
              <span className="text-gray-400 text-xs leading-relaxed">
                I agree to the{" "}
                <a href="/terms" target="_blank" className="text-cyan-400 underline">Terms of Service</a>,{" "}
                <a href="/privacy" target="_blank" className="text-cyan-400 underline">Privacy Policy</a>, and{" "}
                <a href="/eula" target="_blank" className="text-cyan-400 underline">EULA</a>.
              </span>
            </label>

            <Button
              onClick={handleCreateAccount}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Activate My {planInfo.name}</>
              )}
            </Button>

            <div className="text-center pt-2 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Already have an account?{" "}
                <a
                  href={`/signin?redirect=/payment-success?session_id=${encodeURIComponent(sessionId)}&plan=${planId}`}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Sign in to activate
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
