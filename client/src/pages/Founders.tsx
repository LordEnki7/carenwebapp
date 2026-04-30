import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Shield, Video, MapPin, Bell, Smartphone, Star, Award, Users, CheckCircle2, Lock, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FoundersStatus {
  claimed: number;
  remaining: number;
  isFull: boolean;
  limit: number;
}

interface MyFoundersStatus {
  isFoundingMember: boolean;
  claimed: boolean;
  claimedAt?: string;
  expiresAt?: string;
  spotNumber?: number;
}

export default function Founders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status } = useQuery<FoundersStatus>({
    queryKey: ["/api/founders/status"],
    refetchInterval: 30000,
  });

  const { data: myStatus } = useQuery<MyFoundersStatus>({
    queryKey: ["/api/founders/my-status"],
  });

  const { data: authUser } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const claimMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/founders/claim"),
    onSuccess: async (res: any) => {
      const data = await res.json();
      toast({
        title: "Welcome, Founding Member! 🎉",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/founders/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founders/my-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: async (err: any) => {
      let msg = "Something went wrong. Please try again.";
      try { const d = await err.json?.(); msg = d?.message ?? msg; } catch {}
      toast({ title: "Could not claim", description: msg, variant: "destructive" });
    },
  });

  const percentClaimed = status ? Math.round((status.claimed / status.limit) * 100) : 0;
  const isLoggedIn = !!authUser?.id;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md border-b border-white/10">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          <span className="font-bold text-white tracking-wide text-sm">C.A.R.E.N.™ Alert</span>
        </button>
        {isLoggedIn ? (
          <Button size="sm" variant="outline" onClick={() => setLocation("/dashboard")} className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs">
            Dashboard
          </Button>
        ) : (
          <Button size="sm" onClick={() => setLocation("/signin")} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs">
            Sign In
          </Button>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-black to-black pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs px-3 py-1">
            🔒 Founders Access — First 100 Only
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight">
            When the road gets unpredictable…
            <span className="block text-cyan-400 mt-2">clarity matters.</span>
          </h1>

          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            C.A.R.E.N.™ Alert helps you document situations, stay connected, and respond when it counts.
          </p>

          <p className="text-gray-500 text-sm italic">
            Out on the road… when things get turnt up and unpredictable… let C.A.R.E.N. help bring clarity.
          </p>

          {/* Counter */}
          <div className="inline-block bg-white/5 border border-white/10 rounded-2xl px-8 py-5 space-y-3">
            <div className="flex items-center justify-between gap-8">
              <div className="text-center">
                <p className="text-3xl font-black text-cyan-400">{status?.claimed ?? "—"}</p>
                <p className="text-gray-400 text-xs mt-1">Spots Claimed</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-white">{status?.remaining ?? "—"}</p>
                <p className="text-gray-400 text-xs mt-1">Remaining</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-black text-purple-400">{status?.limit ?? 100}</p>
                <p className="text-gray-400 text-xs mt-1">Total Spots</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${percentClaimed}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs text-center">{percentClaimed}% claimed</p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {myStatus?.isFoundingMember ? (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-4">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-green-300 font-bold text-sm">You're a Founding Member!</p>
                  <p className="text-green-200/60 text-xs">Premium access active until {myStatus.expiresAt ? new Date(myStatus.expiresAt).toLocaleDateString() : "—"}</p>
                </div>
              </div>
            ) : status?.isFull ? (
              <div className="bg-gray-800 border border-white/10 rounded-xl px-6 py-4 text-center">
                <p className="text-gray-400 font-semibold text-sm">All 100 spots have been claimed.</p>
                <p className="text-gray-500 text-xs mt-1">Stay tuned — more offers coming soon.</p>
              </div>
            ) : !isLoggedIn ? (
              <>
                <Button
                  size="lg"
                  onClick={() => setLocation("/signup")}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 shadow-lg shadow-cyan-500/20"
                >
                  Get Early Access <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/signin")}
                  className="border-white/20 text-white hover:bg-white/5 font-bold px-8"
                >
                  Stay Ready
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={() => claimMutation.mutate()}
                disabled={claimMutation.isPending}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold px-10 shadow-lg shadow-cyan-500/20 text-base"
              >
                {claimMutation.isPending ? "Claiming…" : "Claim Your Spot Now"}
                {!claimMutation.isPending && <Zap className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── THE REALITY ── */}
      <section className="py-16 px-6 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <p className="text-2xl sm:text-3xl font-bold text-white leading-snug">
            Most drives are routine… <span className="text-gray-400">until they're not.</span>
          </p>
          <p className="text-gray-400 text-lg leading-relaxed">
            Things can change fast on the road — and in those moments, being prepared makes all the difference.
          </p>
        </div>
      </section>

      {/* ── WHAT C.A.R.E.N. DOES ── */}
      <section className="py-20 px-6 bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12">
            Built for <span className="text-cyan-400">real moments.</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { Icon: Video,      color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20",   title: "Record Instantly",   desc: "Video and audio at the tap of a button." },
              { Icon: MapPin,     color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20", title: "Share Your Location", desc: "Real-time GPS shared with trusted contacts." },
              { Icon: Bell,       color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", title: "Alert Your Circle",  desc: "Notify trusted contacts quickly when it counts." },
              { Icon: Smartphone, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", title: "Stay Connected",    desc: "Stay aware and ready through the app." },
            ].map(({ Icon, color, bg, title, desc }) => (
              <div key={title} className={`flex items-start gap-4 p-5 rounded-2xl border ${bg}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{title}</p>
                  <p className="text-gray-400 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LAUNCH INCENTIVES ── */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs mb-4">Limited Time Offer</Badge>
            <h2 className="text-3xl sm:text-4xl font-black">Join early. <span className="text-purple-400">Get rewarded.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: "🎁",
                title: "Founders Access",
                subtitle: "First 100 Users",
                points: [
                  "3 months premium — free",
                  "Early feature drops",
                  "Priority support",
                  '"Founding Member" badge',
                ],
                color: "border-cyan-500/30 bg-cyan-500/5",
                badge: "Most Exclusive",
                badgeColor: "bg-cyan-500/20 text-cyan-300",
              },
              {
                icon: "🔗",
                title: "Refer & Earn",
                subtitle: "Built for Growth",
                points: [
                  "1 referral = 1 week premium",
                  "3 referrals = 1 month premium",
                  "10 referrals = exclusive perks",
                  "Unique referral link",
                ],
                color: "border-purple-500/30 bg-purple-500/5",
                badge: "Scales Fast",
                badgeColor: "bg-purple-500/20 text-purple-300",
              },
              {
                icon: "🎥",
                title: "Share Your Story",
                subtitle: "Real Experience Rewards",
                points: [
                  "Share your C.A.R.E.N. experience",
                  "Get featured on social",
                  "Win free premium months",
                  "Monthly spotlight winner",
                ],
                color: "border-green-500/30 bg-green-500/5",
                badge: "Builds Trust",
                badgeColor: "bg-green-500/20 text-green-300",
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-6 space-y-4 ${item.color}`}>
                <div className="text-3xl">{item.icon}</div>
                <div>
                  <Badge className={`text-xs mb-2 ${item.badgeColor}`}>{item.badge}</Badge>
                  <h3 className="text-white font-bold text-lg">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.subtitle}</p>
                </div>
                <ul className="space-y-2">
                  {item.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA repeat */}
          <div className="mt-12 text-center">
            {myStatus?.isFoundingMember ? (
              <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-8 py-4">
                <Award className="w-6 h-6 text-green-400" />
                <div className="text-left">
                  <p className="text-green-300 font-bold">You're a Founding Member!</p>
                  <p className="text-green-200/60 text-sm">Premium expires {myStatus.expiresAt ? new Date(myStatus.expiresAt).toLocaleDateString() : "—"}</p>
                </div>
              </div>
            ) : !status?.isFull ? (
              isLoggedIn ? (
                <Button
                  size="lg"
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold px-10 text-base shadow-lg shadow-cyan-500/20"
                >
                  {claimMutation.isPending ? "Claiming…" : "Claim Your Spot Now"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setLocation("/signup")}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold px-10 text-base shadow-lg shadow-cyan-500/20"
                >
                  Claim Your Spot Now <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )
            ) : null}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-16 px-6 bg-gray-950">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            Early users are already helping shape the future of C.A.R.E.N.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Be part of something built for real-world situations.
          </p>
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="text-center">
              <p className="text-2xl font-black text-cyan-400">467+</p>
              <p className="text-gray-500 text-xs">Legal Protections</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-purple-400">50</p>
              <p className="text-gray-500 text-xs">States + DC</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-green-400">24/7</p>
              <p className="text-gray-500 text-xs">Always Ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="py-12 px-6 bg-black border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <Lock className="w-6 h-6 text-gray-600 mx-auto" />
          <p className="text-gray-500 text-sm leading-relaxed">
            C.A.R.E.N. Alert is designed to help you stay aware, document situations, and stay connected.
            It does not guarantee outcomes — but it helps you stay prepared.
          </p>
        </div>
      </section>

      {/* ── FINAL CLOSE ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-gray-950 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-3xl sm:text-4xl font-black text-white leading-snug">
            We hope you never need it…
          </p>
          <p className="text-xl text-gray-400">
            But if you do, it helps to have <span className="text-cyan-400 font-bold">C.A.R.E.N. Alert.</span>
          </p>

          {!myStatus?.isFoundingMember && !status?.isFull && (
            <div className="pt-4">
              {isLoggedIn ? (
                <Button
                  size="lg"
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold px-10 text-base shadow-lg shadow-cyan-500/20"
                >
                  {claimMutation.isPending ? "Claiming…" : "Download Now"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setLocation("/signup")}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold px-10 text-base shadow-lg shadow-cyan-500/20"
                >
                  Download Now <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          <p className="text-gray-600 text-xs">
            {status?.remaining ?? "—"} of {status?.limit ?? 100} Founding Member spots remaining
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t border-white/5 bg-black">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-500 text-xs">C.A.R.E.N.™ Alert — carenalert.com</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-600">
            <button onClick={() => setLocation("/privacy")} className="hover:text-gray-400">Privacy</button>
            <button onClick={() => setLocation("/terms")} className="hover:text-gray-400">Terms</button>
            <button onClick={() => setLocation("/")} className="hover:text-gray-400">Home</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
