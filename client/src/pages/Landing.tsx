import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, Video, Scale, UserCheck, Globe, Cloud, Mic, Camera, FileAudio, FileVideo, CheckCircle2, Loader2 } from "lucide-react";
import carenLogo from "@assets/caren_webapp_logo_1750345968202.png";
import LegalAgreementModal from "@/components/LegalAgreementModal";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import ChatAgent from "@/components/ChatAgent";
import { useMutation } from "@tanstack/react-query";

export default function Landing() {
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const leadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: leadEmail, firstName: leadName, source: "landing_page" }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 409) throw new Error(data.error || "Failed");
      return data;
    },
    onSuccess: () => setLeadSubmitted(true),
    onError: () => setLeadSubmitted(true),
  });

  const handleSignIn = () => {
    setShowLegalModal(true);
  };

  const handleLegalAccept = () => {
    setShowLegalModal(false);
    window.location.href = "/api/login";
  };

  const handleLegalDecline = () => {
    setShowLegalModal(false);
  };
  return (
    <MobileResponsiveLayout>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <img 
              src={carenLogo} 
              alt="C.A.R.E.N.™ - Citizen Assistance for Roadside Emergencies and Navigation" 
              className="w-32 h-32 caren-logo"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            C.A.R.E.N.™
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Citizen Assistance for Roadside Emergencies and Navigation
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
            Your comprehensive web dashboard for incident management, legal resources, 
            and attorney connections. Monitor your roadside encounters and access 
            legal protection tools.
          </p>
          <Button 
            size="lg" 
            onClick={handleSignIn}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Sign In to Dashboard
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Incident Management
              </h3>
              <p className="text-gray-600">
                View, manage, and export your recorded incidents with comprehensive 
                reporting tools and cloud backup.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Legal Rights Library
              </h3>
              <p className="text-gray-600">
                Access state-specific legal information and know your rights 
                during traffic stops and police encounters.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Attorney Network
              </h3>
              <p className="text-gray-600">
                Connect with verified attorneys specializing in civil rights 
                and traffic-related legal matters.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cloud Sync
              </h3>
              <p className="text-gray-600">
                Seamlessly sync with your mobile app data and access recordings 
                from any device with secure cloud storage.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Emergency Features
              </h3>
              <p className="text-gray-600">
                Emergency recording capabilities with automatic contact notifications 
                and priority case handling.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Multi-Language
              </h3>
              <p className="text-gray-600">
                Support for multiple languages including Spanish, French, and 
                Portuguese for diverse communities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lead Capture Section */}
        <div className="mb-12">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                  <Shield className="w-4 h-4" /> Free to join — no credit card needed
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  Get Protected Today
                </h2>
                <p className="text-slate-400 mb-8 text-lg">
                  Join the C.A.R.E.N.™ community and receive a free guide to your legal rights during police encounters.
                </p>

                {leadSubmitted ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <CheckCircle2 className="w-14 h-14 text-green-400" />
                    <p className="text-xl font-semibold text-white">You're in! Check your inbox.</p>
                    <p className="text-slate-400 text-sm">We sent your welcome email with everything you need to get started.</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Your first name"
                      value={leadName}
                      onChange={e => setLeadName(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 flex-1"
                    />
                    <Input
                      type="email"
                      placeholder="Your email address"
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 flex-1"
                      onKeyDown={e => e.key === "Enter" && leadEmail && leadMutation.mutate()}
                    />
                    <Button
                      onClick={() => leadMutation.mutate()}
                      disabled={!leadEmail || leadMutation.isPending}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold shrink-0 px-6"
                    >
                      {leadMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Get Access →"
                      )}
                    </Button>
                  </div>
                )}

                {!leadSubmitted && (
                  <p className="text-slate-500 text-xs mt-4">
                    By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-blue-600 border-0 text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Protect Your Rights?
              </h2>
              <p className="text-blue-100 mb-6 text-lg">
                Join thousands of users who trust C.A.R.E.N.™ for their legal protection needs.
              </p>
              <Button 
                size="lg"
                variant="secondary"
                onClick={handleSignIn}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
              >
                Get Started Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Legal Notice */}
        <div className="text-center mt-8 pb-8">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our legal terms including User Agreement, EULA, Disclaimer, and Cookies Policy.
          </p>
        </div>
      </div>

      {/* Legal Agreement Modal */}
      <LegalAgreementModal
        isOpen={showLegalModal}
        onAccept={handleLegalAccept}
        onDecline={handleLegalDecline}
      />
      <ChatAgent />
    </MobileResponsiveLayout>
  );
}
