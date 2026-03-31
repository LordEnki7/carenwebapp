import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle, Circle, Bug, Star, Trophy, Zap, Shield, Target,
  ChevronRight, Lock, Send, Camera, MapPin, Phone, Volume2,
  Timer, AlertTriangle, Gift, Clock, Users
} from "lucide-react";

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    "Emergency": "text-red-400", "Core Feature": "text-cyan-400",
    "AI Features": "text-purple-400", "Recording": "text-yellow-400",
    "Legal": "text-blue-400", "Feedback": "text-green-400",
    "Security": "text-orange-400", "Voice": "text-pink-400",
    "Onboarding": "text-cyan-400", "Permissions": "text-orange-400",
    "Safety Network": "text-blue-400", "Notifications": "text-yellow-400"
  };
  return colors[category] || "text-cyan-400";
}

// ─── Landing Page ──────────────────────────────────────────────────────────────
function LandingPage({ onApply }: { onApply: () => void }) {
  const scenarios = [
    { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, label: "Simulate a traffic stop", desc: "Open the app during a real or practice stop" },
    { icon: <Camera className="w-5 h-5 text-yellow-400" />, label: "Start recording", desc: "Test multi-angle video and audio capture" },
    { icon: <MapPin className="w-5 h-5 text-cyan-400" />, label: "Check GPS tracking", desc: "Verify your state + location auto-detects" },
    { icon: <Phone className="w-5 h-5 text-green-400" />, label: "Trigger emergency alert", desc: "See how fast family gets notified" },
    { icon: <Volume2 className="w-5 h-5 text-purple-400" />, label: "Test audio clarity", desc: "Confirm recordings are clean and usable" },
    { icon: <Timer className="w-5 h-5 text-orange-400" />, label: "Time the app's reaction", desc: "How fast does it respond when it matters?" },
  ];

  const perks = [
    { icon: "✅", text: "Free lifetime premium access (no future subscription)" },
    { icon: "🏅", text: "Early adopter badge — founding member status" },
    { icon: "⚡", text: "Priority access to every new feature" },
    { icon: "🎁", text: "Entry into our tester reward pool" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-cyan-950/20 pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 pt-16 pb-10 text-center relative">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-bold tracking-wider uppercase">Only 25 early access spots available</span>
          </div>

          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Welcome to the<br />
            <span className="text-cyan-400">C.A.R.E.N.</span> Early Access<br />
            Program
          </h1>

          <p className="text-gray-300 text-xl leading-relaxed mb-2">
            We're selecting a <strong className="text-white">limited group of drivers</strong> for early access to a safety app designed to <strong className="text-cyan-400">protect you during traffic stops</strong>.
          </p>
          <p className="text-gray-500 text-base mb-8">
            You're not testing an app. You're joining a community that's building something to save lives.
          </p>

          <Button onClick={onApply}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-lg px-10 py-6 rounded-xl shadow-lg shadow-cyan-500/20">
            Apply for Early Access →
          </Button>

          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> 18 spots filled</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 7 spots remaining</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-10">

        {/* What you get */}
        <div className="bg-gradient-to-br from-cyan-950/30 to-purple-950/20 border border-cyan-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-bold text-lg">What You Get as a Tester</h2>
          </div>
          <div className="space-y-3">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <span className="text-gray-200 text-sm">{p.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500">Top contributors will receive additional recognition at launch.</p>
          </div>
        </div>

        {/* 14-day commitment */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            What We Ask of You
          </h2>
          <div className="space-y-2.5">
            {[
              "Download and install the app on your device",
              "Use it during real or simulated driving situations",
              "Test key features: recording, alerts, GPS location",
              "Keep the app installed for 14 days",
              "Submit honest feedback after each mission",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-cyan-400 text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-gray-300 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test Scenarios */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4">
            🧪 Your Test Missions
          </h2>
          <p className="text-gray-400 text-sm mb-4">We won't just ask you to "try the app." You'll have specific scenarios to run through:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenarios.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                <div className="mt-0.5">{s.icon}</div>
                <div>
                  <p className="text-white text-sm font-semibold">{s.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback preview */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <Send className="w-5 h-5 text-green-400" />
            We'll Ask You These Questions
          </h2>
          <div className="space-y-2">
            {[
              "What was your first impression?",
              "Did you feel safer using the app?",
              "What confused you?",
              "Would you recommend this app? (1–10)",
              "What feature stood out most?",
            ].map((q, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-cyan-500">›</span> {q}
              </div>
            ))}
          </div>
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">Gold Question</p>
            <p className="text-white font-semibold text-sm">"Would you trust this app in a real police stop?"</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-4">
          <p className="text-gray-400 text-sm mb-4">Let's build something that actually protects people.</p>
          <Button onClick={onApply}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-base px-8 py-5 rounded-xl shadow-lg shadow-cyan-500/20">
            Join the Community →
          </Button>
          <p className="text-gray-600 text-xs mt-3">Applications reviewed within 24 hours · Limited to 25 founding members</p>
        </div>
      </div>
    </div>
  );
}

// ─── Apply Form ───────────────────────────────────────────────────────────────
function ApplyForm({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", deviceType: "both", whyJoin: "",
    drivesRegularly: "", willingFor14Days: "", wantsRewardEntry: ""
  });

  const applyMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/early-access/apply", data),
    onSuccess: () => {
      toast({ title: "Application Submitted!", description: "We'll review it and email you within 24 hours." });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to submit application", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="text-gray-500 text-sm mb-6 flex items-center gap-1 hover:text-gray-300">
          ← Back
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-4">
            <span className="text-cyan-400 text-xs font-semibold tracking-wider uppercase">C.A.R.E.N. Early Access Application</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Apply for Early Access</h1>
          <p className="text-gray-400 text-sm">Only accepting a limited number of testers. Spots go fast.</p>
        </div>

        <Card className="bg-white/5 border border-white/10">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Full Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your name" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Email *</label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  type="email" placeholder="you@example.com" className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Phone (optional)</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(555) 000-0000" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Device Type</label>
                <Select value={form.deviceType} onValueChange={v => setForm(f => ({ ...f, deviceType: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ios">iPhone (iOS)</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Do you drive regularly?</label>
              <Select value={form.drivesRegularly} onValueChange={v => setForm(f => ({ ...f, drivesRegularly: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select one..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">A few times a week</SelectItem>
                  <SelectItem value="rarely">Rarely</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Are you willing to keep the app installed for 14 days?</label>
              <Select value={form.willingFor14Days} onValueChange={v => setForm(f => ({ ...f, willingFor14Days: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select one..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — I'm committed</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Enter you into our tester reward pool?</label>
              <Select value={form.wantsRewardEntry} onValueChange={v => setForm(f => ({ ...f, wantsRewardEntry: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select one..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes please</SelectItem>
                  <SelectItem value="no">No thanks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Why do you want to join? (optional)</label>
              <Textarea value={form.whyJoin} onChange={e => setForm(f => ({ ...f, whyJoin: e.target.value }))}
                placeholder="Tell us why you'd make a great founding member..." className="bg-white/5 border-white/10 text-white h-20 resize-none" />
            </div>

            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 text-xs text-gray-400">
              By applying you agree to: install the app, use it during driving scenarios, keep it installed for 14 days, and provide honest feedback.
            </div>

            <Button onClick={() => applyMutation.mutate(form)}
              disabled={applyMutation.isPending || !form.name || !form.email}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black h-12 text-base">
              {applyMutation.isPending ? "Submitting..." : "Submit Application →"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-600 mt-4">Applications reviewed within 24 hours · Limited spots available</p>
      </div>
    </div>
  );
}

// ─── Mission Card ─────────────────────────────────────────────────────────────
function MissionCard({ mission, accessCode, onComplete }: { mission: any; accessCode: string; onComplete: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [bugDesc, setBugDesc] = useState("");
  const [goldAnswer, setGoldAnswer] = useState("");
  const [testimonialOk, setTestimonialOk] = useState(false);
  const [publicFeedbackOk, setPublicFeedbackOk] = useState(false);

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/early-access/complete-mission", {
      accessCode, missionId: mission.id, feedback: `${feedback}${goldAnswer ? ` | GOLD: ${goldAnswer}` : ""}${testimonialOk ? " | TESTIMONIAL_OK" : ""}${publicFeedbackOk ? " | PUBLIC_OK" : ""}`, rating, bugDescription: bugDesc
    }),
    onSuccess: (data: any) => {
      toast({ title: `Mission Complete! +${data.pointsEarned} pts`, description: mission.title });
      setOpen(false);
      onComplete();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
  });

  return (
    <>
      <Card onClick={() => !mission.completed && setOpen(true)}
        className={`border transition-all ${mission.completed
          ? "bg-green-500/5 border-green-500/20 opacity-70"
          : "bg-white/5 border-white/10 hover:border-cyan-500/40 cursor-pointer hover:bg-white/8"
        }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${mission.completed ? "text-green-400" : "text-gray-500"}`}>
              {mission.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`text-xs border-0 px-1.5 py-0 ${getCategoryColor(mission.category)} bg-transparent`}>
                  {mission.category}
                </Badge>
                <span className="text-xs text-yellow-400 ml-auto">+{mission.pointValue} pts</span>
              </div>
              <p className={`font-semibold text-sm ${mission.completed ? "text-gray-400 line-through" : "text-white"}`}>{mission.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{mission.description}</p>
              {mission.completed && mission.completion?.rating && (
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: mission.completion.rating }).map((_: any, i: number) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              )}
            </div>
            {!mission.completed && <ChevronRight className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0a0a0f] border border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{mission.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Instructions</p>
              <p className="text-sm text-gray-200">{mission.instructions || mission.description}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Rate your experience</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star className={`w-7 h-7 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Your feedback</label>
              <Textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="What worked? What was confusing? Did you feel safer?" className="bg-white/5 border-white/10 text-white h-20 resize-none text-sm" />
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">Gold Question</p>
              <p className="text-white text-sm font-semibold mb-2">"Would you trust this app in a real police stop?"</p>
              <Textarea value={goldAnswer} onChange={e => setGoldAnswer(e.target.value)}
                placeholder="Your honest answer..." className="bg-black/30 border-yellow-500/20 text-white h-16 resize-none text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Bug or issue? Describe it here (optional +20 pts)</label>
              <Textarea value={bugDesc} onChange={e => setBugDesc(e.target.value)}
                placeholder="Describe any bug or issue..." className="bg-white/5 border-white/10 text-white h-16 resize-none text-sm" />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={testimonialOk} onChange={e => setTestimonialOk(e.target.checked)} className="w-4 h-4 accent-cyan-500" />
                <span className="text-sm text-gray-300">I'm open to providing a short testimonial</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={publicFeedbackOk} onChange={e => setPublicFeedbackOk(e.target.checked)} className="w-4 h-4 accent-cyan-500" />
                <span className="text-sm text-gray-300">You can use my feedback publicly (ads, App Store, website)</span>
              </label>
            </div>
            <Button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
              {completeMutation.isPending ? "Saving..." : "Mark Mission Complete ✓"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Bug Report Form ──────────────────────────────────────────────────────────
function BugReportForm({ accessCode }: { accessCode: string }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", description: "", severity: "medium", deviceInfo: "" });
  const [submitted, setSubmitted] = useState(false);

  const bugMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/early-access/bug-report", { ...form, accessCode }),
    onSuccess: () => {
      toast({ title: "Bug Reported! +20 pts", description: "Thank you — this helps us ship a better app." });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm({ title: "", description: "", severity: "medium", deviceInfo: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
  });

  return (
    <Card className="bg-white/5 border border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Bug className="w-4 h-4 text-red-400" />
          Report a Bug
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs ml-1">+20 pts</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Bug title (e.g. Recording stops after 10 seconds)" className="bg-white/5 border-white/10 text-white text-sm" />
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe what happened and how to reproduce it..." className="bg-white/5 border-white/10 text-white h-24 resize-none text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low — Minor issue</SelectItem>
              <SelectItem value="medium">Medium — Broken feature</SelectItem>
              <SelectItem value="high">High — Major problem</SelectItem>
              <SelectItem value="critical">Critical — App crash</SelectItem>
            </SelectContent>
          </Select>
          <Input value={form.deviceInfo} onChange={e => setForm(f => ({ ...f, deviceInfo: e.target.value }))}
            placeholder="Device (e.g. iPhone 15)" className="bg-white/5 border-white/10 text-white text-sm" />
        </div>
        <Button onClick={() => bugMutation.mutate()} disabled={bugMutation.isPending || !form.title || !form.description}
          className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-semibold text-sm">
          {submitted ? "Reported! ✓" : bugMutation.isPending ? "Submitting..." : "Submit Bug Report"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Tester Dashboard ─────────────────────────────────────────────────────────
function TesterDashboard({ code }: { code: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/early-access/dashboard", code],
    queryFn: () => fetch(`/api/early-access/dashboard/${code}`).then(r => r.json()),
    refetchInterval: 30000
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading your missions...</p>
      </div>
    </div>
  );

  if (!data || data.error) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-white text-xl font-bold mb-2">Access Denied</p>
        <p className="text-gray-400">{data?.error || "Invalid access code"}</p>
      </div>
    </div>
  );

  const { tester, missions, daysActive, totalMissions, completedCount } = data;
  const progress = totalMissions > 0 ? Math.round((completedCount / totalMissions) * 100) : 0;
  const groupedMissions: Record<number, any[]> = {};
  missions.forEach((m: any) => {
    if (!groupedMissions[m.dayNumber]) groupedMissions[m.dayNumber] = [];
    groupedMissions[m.dayNumber].push(m);
  });

  const daysLeft = Math.max(0, 14 - daysActive);

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-cyan-950/40 to-transparent border-b border-white/5 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-bold tracking-wider uppercase">C.A.R.E.N. Early Access Program</span>
          </div>
          <h1 className="text-2xl font-black text-white">Welcome, {tester.name.split(" ")[0]} 👋</h1>
          <p className="text-gray-400 text-sm mt-1">
            Day <strong className="text-white">{daysActive}</strong> of 14 · <strong className="text-cyan-400">{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</strong>
          </p>

          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { label: "Score", value: tester.score || 0, color: "text-yellow-400" },
              { label: "Missions", value: completedCount, color: "text-green-400" },
              { label: "Bugs", value: tester.bugsReported || 0, color: "text-red-400" },
              { label: "Day", value: daysActive, color: "text-cyan-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Overall Progress</span>
              <span>{completedCount}/{totalMissions} missions · {progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/10" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-8">
        {/* Perks reminder */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-4">
          <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">Your Founding Member Perks</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-300">
            <span>✅ Free lifetime premium access</span>
            <span>🏅 Early adopter badge</span>
            <span>⚡ Priority feature access</span>
            <span>🎁 Tester reward pool entry</span>
          </div>
        </div>

        {/* Missions by day */}
        {Object.entries(groupedMissions).map(([day, dayMissions]) => (
          <div key={day}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <span className="text-cyan-400 text-xs font-bold">{day}</span>
              </div>
              <h3 className="text-white font-semibold text-sm">Day {day} Missions</h3>
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs text-gray-500">{dayMissions.filter((m: any) => m.completed).length}/{dayMissions.length} done</span>
            </div>
            <div className="space-y-2">
              {dayMissions.map((mission: any) => (
                <MissionCard key={mission.id} mission={mission} accessCode={code}
                  onComplete={() => queryClient.invalidateQueries({ queryKey: ["/api/early-access/dashboard", code] })} />
              ))}
            </div>
          </div>
        ))}

        <BugReportForm accessCode={code} />

        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-5 text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-white font-bold text-base">Top contributors get featured at launch</p>
          <p className="text-gray-400 text-sm mt-1">Complete all missions to be recognized as a founding member on carenalert.com and in the app</p>
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation Screen ───────────────────────────────────────────────────────
function ConfirmationScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Application Received!</h2>
        <p className="text-gray-400 text-lg mb-6">
          We'll review your application and reach out within 24 hours. Keep an eye on your inbox.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">What happens next</p>
          {[
            "We review your application",
            "You receive an email with your personal access link",
            "Click the link to enter the Early Access Program",
            "Complete missions over 14 days and shape the app",
            "Top contributors earn rewards + recognition at launch",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-gray-300 text-sm">{step}</p>
            </div>
          ))}
        </div>
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
          <p className="text-cyan-400 text-sm font-semibold">We're building something that could actually protect people — and you're part of that mission.</p>
        </div>
        <p className="text-gray-600 text-xs mt-4">C.A.R.E.N. Early Access Program · carenalert.com</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EarlyAccessLab() {
  const [code, setCode] = useState<string | null>(null);
  const [view, setView] = useState<"landing" | "apply" | "confirmed">("landing");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code");
    if (c) {
      setCode(c);
      apiRequest("POST", "/api/early-access/activate", { code: c }).catch(() => {});
    }
  }, []);

  if (code) return <TesterDashboard code={code} />;
  if (view === "confirmed") return <ConfirmationScreen />;
  if (view === "apply") return <ApplyForm onSuccess={() => setView("confirmed")} onBack={() => setView("landing")} />;
  return <LandingPage onApply={() => setView("apply")} />;
}
