import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, CheckCircle2, Clock, Send, BookOpen, Shield, Zap, Brain, Gift } from "lucide-react";

interface CampaignStatus {
  enrolled: boolean;
  enrolledAt?: string;
  currentStep?: number;
  emails?: {
    step: number;
    sentAt?: string;
    status: "sent" | "pending" | "upcoming";
  }[];
}

const CAMPAIGN_EMAILS = [
  { step: 1, day: 0, title: "Welcome & Getting Started", icon: Send, description: "Introduction to C.A.R.E.N.™, how to set up your profile, and a quick tour of essential features that keep you safe." },
  { step: 2, day: 2, title: "Know Your Rights - GPS Legal Protection", icon: Shield, description: "Learn how C.A.R.E.N.™ uses GPS-based legal rights to show you exactly what protections apply in your location during any encounter." },
  { step: 3, day: 5, title: "Stay Safe - Emergency Features", icon: Zap, description: "Discover emergency recording, one-tap evidence collection, and how to share your location with trusted contacts instantly." },
  { step: 4, day: 8, title: "AI-Powered Protection", icon: Brain, description: "Explore AI-driven features like voice commands, smart auto-mute, de-escalation coaching, and real-time legal guidance." },
  { step: 5, day: 13, title: "You're Protected - What's Next?", icon: Gift, description: "Advanced tips, community features, attorney matching, and how to get the most out of your C.A.R.E.N.™ subscription." },
];

export default function EmailCampaigns() {
  const [enrolling, setEnrolling] = useState(false);

  const { data: campaign, isLoading } = useQuery<CampaignStatus>({
    queryKey: ["/api/email-campaigns/status"],
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email-campaigns/enroll");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-campaigns/status"] });
      setEnrolling(false);
    },
    onError: () => {
      setEnrolling(false);
    },
  });

  const handleEnroll = () => {
    setEnrolling(true);
    enrollMutation.mutate();
  };

  const isEnrolled = campaign?.enrolled;
  const currentStep = campaign?.currentStep ?? 0;

  const getStepStatus = (step: number): "sent" | "pending" | "upcoming" => {
    if (!isEnrolled) return "upcoming";
    const emailData = campaign?.emails?.find((e) => e.step === step);
    if (emailData) return emailData.status;
    if (step < currentStep) return "sent";
    if (step === currentStep) return "pending";
    return "upcoming";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Mail className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Email Education Series</h1>
          </div>
          <p className="text-gray-400 max-w-xl mx-auto">
            A free 5-email course delivered over 13 days. Learn how to use C.A.R.E.N.™ to protect yourself, know your rights, and stay safe during any encounter.
          </p>
        </div>

        {!isEnrolled && (
          <div className="flex justify-center">
            <Button
              onClick={handleEnroll}
              disabled={enrolling || enrollMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-purple-500/20 transition-all"
            >
              <Send className="h-5 w-5 mr-2" />
              {enrolling || enrollMutation.isPending ? "Enrolling..." : "Start My Email Course"}
            </Button>
          </div>
        )}

        {isEnrolled && campaign?.enrolledAt && (
          <div className="text-center">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 inline" />
              Enrolled {new Date(campaign.enrolledAt).toLocaleDateString()}
            </Badge>
          </div>
        )}

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700" />

          <div className="space-y-6">
            {CAMPAIGN_EMAILS.map((email) => {
              const status = getStepStatus(email.step);
              const Icon = email.icon;
              const isSent = status === "sent";
              const isPending = status === "pending";

              return (
                <div key={email.step} className="relative flex gap-4 items-start">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-2 shrink-0 transition-all ${
                    isSent
                      ? "bg-green-500/20 border-green-400 shadow-lg shadow-green-500/20"
                      : isPending
                        ? "bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-500/20 animate-pulse"
                        : "bg-gray-800 border-gray-600"
                  }`}>
                    {isSent ? (
                      <CheckCircle2 className="h-7 w-7 text-green-400" />
                    ) : isPending ? (
                      <Clock className="h-7 w-7 text-purple-400" />
                    ) : (
                      <Icon className={`h-7 w-7 ${isEnrolled ? "text-gray-500" : "text-gray-600"}`} />
                    )}
                  </div>

                  <Card className={`flex-1 border backdrop-blur-xl transition-all ${
                    isSent
                      ? "bg-green-500/5 border-green-500/20"
                      : isPending
                        ? "bg-purple-500/5 border-purple-500/20"
                        : "bg-white/5 border-white/10"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500">Day {email.day}</span>
                            <Badge variant="outline" className={`text-xs ${
                              isSent
                                ? "text-green-400 border-green-500/30"
                                : isPending
                                  ? "text-purple-400 border-purple-500/30"
                                  : "text-gray-500 border-gray-600"
                            }`}>
                              {isSent ? "Sent" : isPending ? "Pending" : "Upcoming"}
                            </Badge>
                          </div>
                          <h3 className={`font-semibold ${isSent || isPending ? "text-white" : "text-gray-400"}`}>
                            Email {email.step}: {email.title}
                          </h3>
                          <p className="text-gray-500 text-sm">{email.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-400" /> What You'll Learn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Send, text: "How to set up and customize C.A.R.E.N.™ for your personal safety needs" },
              { icon: Shield, text: "Your constitutional rights during police encounters based on your GPS location" },
              { icon: Zap, text: "Emergency recording, evidence collection, and instant contact sharing" },
              { icon: Brain, text: "AI-powered voice commands, auto-mute, and real-time de-escalation coaching" },
              { icon: Gift, text: "Community features, attorney matching, and advanced protection strategies" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-white/5">
                <item.icon className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
