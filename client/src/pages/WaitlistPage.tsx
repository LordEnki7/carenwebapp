import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield,
  MapPin,
  AlertTriangle,
  Mic,
  Sparkles,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Lock,
  Globe,
  Gift,
  Copy,
  Share2,
} from "lucide-react";

const TIERS = [
  { value: "basic_guard", label: "Basic Guard" },
  { value: "safety_pro", label: "Safety Pro" },
  { value: "constitutional_pro", label: "Constitutional Pro" },
  { value: "family_protection", label: "Family Protection" },
  { value: "enterprise_fleet", label: "Enterprise Fleet" },
];

const REFERRAL_SOURCES = [
  { value: "social_media", label: "Social Media" },
  { value: "friend", label: "Friend / Referral" },
  { value: "search_engine", label: "Search Engine" },
  { value: "news", label: "News Article" },
  { value: "other", label: "Other" },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "GPS Legal Rights",
    description: "Know your exact rights based on your location. State-specific legal guidance delivered in real-time during any encounter.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Shield,
    title: "AI Protection",
    description: "Advanced AI monitors your interactions and provides instant legal coaching, de-escalation tips, and evidence preservation.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: AlertTriangle,
    title: "Emergency SOS",
    description: "One-tap emergency activation that records, notifies contacts, and streams live to your attorney network.",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    icon: Mic,
    title: "Voice Commands",
    description: "Hands-free operation during critical moments. Activate recording, call for help, or access rights — all by voice.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
];

const REFERRAL_TIERS = [
  { count: 1, reward: "Early access to the app", icon: Zap, color: "text-cyan-400" },
  { count: 5, reward: "3 months free subscription", icon: Gift, color: "text-purple-400" },
  { count: 25, reward: "Founding Member badge", icon: Shield, color: "text-amber-400" },
  { count: 100, reward: "Free hardware unit", icon: Sparkles, color: "text-green-400" },
];

const FAQS = [
  {
    q: "When will C.A.R.E.N.™ be available?",
    a: "We're targeting a launch on both iOS and Android app stores in early 2026. Waitlist members will get early access before the public launch.",
  },
  {
    q: "Is the waitlist free to join?",
    a: "Absolutely! Joining the waitlist is completely free and doesn't obligate you to purchase anything. You'll simply be the first to know when we launch.",
  },
  {
    q: "What does C.A.R.E.N.™ stand for?",
    a: "C.A.R.E.N.™ stands for Citizen Assistance for Roadside Emergencies and Navigation — your AI-powered legal protection companion.",
  },
  {
    q: "Will my data be secure?",
    a: "Security is our top priority. All data is encrypted end-to-end, recordings are stored in secure cloud vaults, and we never share your information with third parties.",
  },
  {
    q: "How does the referral program work?",
    a: "After joining, you'll get a unique referral link. Share it with friends — the more people who join through your link, the better rewards you unlock, from early access all the way to a free hardware unit.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl bg-white/[0.03] backdrop-blur-sm overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-white font-medium pr-4">{q}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-cyan-400 shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-gray-400 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get("ref");

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/waitlist/count"],
  });

  const signupMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
      email: string;
      phone?: string;
      interestedTier?: string;
      referralSource?: string;
      referredBy?: string;
    }) => {
      const res = await apiRequest("POST", "/api/waitlist", data);
      return res.json();
    },
    onSuccess: (data: { position?: number; referralCode?: string }) => {
      setSubmitted(true);
      if (data.position) setPosition(data.position);
      if (data.referralCode) setMyReferralCode(data.referralCode);
    },
  });

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!email) return;
    signupMutation.mutate({
      email,
      name: name || undefined,
      phone: phone || undefined,
      interestedTier: tier || undefined,
      referralSource: referralSource || undefined,
      referredBy: refCode || undefined,
    });
  };

  const referralLink = myReferralCode
    ? `${window.location.origin}/waitlist?ref=${myReferralCode}`
    : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-20 space-y-20">

          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">Coming Soon to iOS &amp; Android</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                Drive Protected.
              </span>
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-white">
              Launching Soon.
            </p>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              20 million Americans are stopped by police every year. Most don't know their rights. C.A.R.E.N.™ gives you voice-activated, AI-powered legal protection — right when you need it most.
            </p>

            {countData && countData.count > 0 && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-purple-300 font-semibold">
                  {countData.count.toLocaleString()} {countData.count === 1 ? "person has" : "people have"} joined
                </span>
              </div>
            )}
          </div>

          <div className="max-w-lg mx-auto">
            {submitted ? (
              <Card className="bg-white/[0.05] border-green-500/30 backdrop-blur-xl shadow-2xl shadow-green-500/10">
                <CardContent className="p-8 space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white text-center">You're on the list!</h3>
                  {position && (
                    <div className="space-y-1 text-center">
                      <p className="text-gray-400">Your position</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        #{position}
                      </p>
                    </div>
                  )}

                  {myReferralCode && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="text-center space-y-2">
                        <h4 className="text-lg font-semibold text-white flex items-center justify-center gap-2">
                          <Share2 className="w-5 h-5 text-cyan-400" />
                          Share & Unlock Rewards
                        </h4>
                        <p className="text-gray-400 text-sm">Share your unique link to move up and earn perks</p>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={referralLink}
                          readOnly
                          className="bg-white/[0.05] border-white/10 text-gray-300 text-sm"
                        />
                        <Button
                          onClick={copyLink}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-white/10 shrink-0"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {REFERRAL_TIERS.map((rt) => (
                          <div key={rt.count} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                            <rt.icon className={`w-5 h-5 mx-auto mb-1 ${rt.color}`} />
                            <p className="text-white text-xs font-semibold">{rt.count}+ referrals</p>
                            <p className="text-gray-500 text-xs">{rt.reward}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-gray-400 text-center text-sm">
                    We'll notify you as soon as C.A.R.E.N.™ is ready for download.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/[0.05] border-white/10 backdrop-blur-xl shadow-2xl shadow-cyan-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-white text-center">
                    Get Protected First
                  </CardTitle>
                  <p className="text-gray-500 text-sm text-center">Join the early access list</p>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Name <span className="text-gray-600">(optional)</span></label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="bg-white/[0.05] border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Email <span className="text-red-400">*</span></label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="bg-white/[0.05] border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Phone <span className="text-gray-600">(optional)</span></label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="bg-white/[0.05] border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Interested Tier</label>
                      <Select value={tier} onValueChange={setTier}>
                        <SelectTrigger className="bg-white/[0.05] border-white/10 text-white">
                          <SelectValue placeholder="Select a tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIERS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">How did you hear about us?</label>
                      <Select value={referralSource} onValueChange={setReferralSource}>
                        <SelectTrigger className="bg-white/[0.05] border-white/10 text-white">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {REFERRAL_SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {refCode && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <Gift className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-cyan-300 text-sm">Referred by a friend — you both earn rewards!</span>
                      </div>
                    )}

                    {signupMutation.isError && (
                      <p className="text-red-400 text-sm text-center">
                        {(signupMutation.error as Error)?.message?.includes("409")
                          ? "This email is already on the waitlist!"
                          : "Something went wrong. Please try again."}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={signupMutation.isPending || !email}
                      className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 text-white shadow-lg shadow-cyan-500/20 transition-all"
                    >
                      {signupMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                          Joining...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Get Protected First
                        </span>
                      )}
                    </Button>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span>Early access before public launch</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span>Founding member pricing</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span>Hardware priority access</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 text-center">
                      <Lock className="inline h-3 w-3 mr-1" />
                      We respect your privacy. No spam, ever.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">Refer Friends, Earn Rewards</h3>
              <p className="text-gray-400 max-w-xl mx-auto">
                Join the waitlist and get your unique link. The more friends you invite, the bigger your rewards.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {REFERRAL_TIERS.map((rt) => (
                <Card key={rt.count} className="bg-white/[0.03] border-white/10 backdrop-blur-sm text-center">
                  <CardContent className="p-5 space-y-2">
                    <rt.icon className={`w-8 h-8 mx-auto ${rt.color}`} />
                    <p className="text-white font-bold text-lg">{rt.count}+</p>
                    <p className="text-gray-500 text-xs">referrals</p>
                    <p className="text-gray-300 text-sm font-medium">{rt.reward}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-bold text-white">Why C.A.R.E.N.™?</h3>
              <p className="text-gray-400 max-w-xl mx-auto">
                Powerful features designed to protect your rights and keep you safe.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.title}
                  className={`${feature.bg} border backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200`}
                >
                  <CardContent className="p-6 space-y-3">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-semibold text-white">{feature.title}</h4>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-bold text-white">Frequently Asked Questions</h3>
              <p className="text-gray-400">Everything you need to know about C.A.R.E.N.™</p>
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>

          <div className="text-center pb-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Globe className="h-4 w-4" />
              <span className="text-sm">Available worldwide at launch</span>
            </div>
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} C.A.R.E.N.™ — Citizen Assistance for Roadside Emergencies &amp; Navigation. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
