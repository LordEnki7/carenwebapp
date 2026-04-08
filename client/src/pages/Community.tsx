import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Users, MessageSquare, Shield, Car, AlertTriangle, Settings,
  Search, Plus, Pin, Trophy, Clock,
  Megaphone, Gift, ChevronRight, Bell, Star, Zap, Share2,
  Download, Target, Crown, Flame, Leaf, UserCheck, ArrowRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import firstLineImg from "@assets/first_line_of_defense_1775617735223.png";
import firstRespondersImg from "@assets/first_responders_circle_1775617735224.png";
import guardianWeekImg from "@assets/guardian_of_the_week_1775617735224.png";
import referProtectImg from "@assets/refer_and_protect_1775617735225.png";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ForumCategory {
  id: number; name: string; description: string; state: string;
  icon: string; color: string; postCount: number; lastPostAt: string | null;
  isActive: boolean; createdAt: string;
}

interface Announcement {
  id: number; title: string; content: string; type: string;
  imageUrl: string | null; isActive: boolean; isPinned: boolean;
  expiresAt: string | null; createdAt: string;
}

interface GuardianWallMember {
  id: string; display_name: string; profile_image_url: string | null;
  subscription_tier: string; referral_count: number; created_at: string;
}

interface MyRank {
  referralCount: number; rank: string; rankLevel: number; rankEmoji: string;
}

// ─── Rank System ─────────────────────────────────────────────────────────────

const RANKS = [
  { level: 0, name: "New Guardian", emoji: "🌱", color: "text-gray-400", bg: "bg-gray-700", border: "border-gray-600", minRefs: 0, maxRefs: 1 },
  { level: 1, name: "Verified Guardian", emoji: "⭐", color: "text-blue-400", bg: "bg-blue-900/40", border: "border-blue-600", minRefs: 1, maxRefs: 3 },
  { level: 2, name: "Protector", emoji: "🔥", color: "text-orange-400", bg: "bg-orange-900/30", border: "border-orange-600", minRefs: 3, maxRefs: 10 },
  { level: 3, name: "Elite Protector", emoji: "💪", color: "text-purple-400", bg: "bg-purple-900/40", border: "border-purple-600", minRefs: 10, maxRefs: 25 },
  { level: 4, name: "Elite Defender", emoji: "👑", color: "text-yellow-400", bg: "bg-yellow-900/30", border: "border-yellow-500", minRefs: 25, maxRefs: 25 },
];

function getRank(level: number) {
  return RANKS[Math.min(level, 4)] || RANKS[0];
}

function getRankProgress(count: number, level: number) {
  const r = RANKS[level] || RANKS[0];
  const next = RANKS[level + 1];
  if (!next) return 100;
  const span = next.minRefs - r.minRefs;
  const done = count - r.minRefs;
  return Math.min(100, Math.round((done / span) * 100));
}

// ─── Seasonal Banner ──────────────────────────────────────────────────────────

function getSeasonalTheme() {
  const month = new Date().getMonth();
  if (month === 11 || month <= 1) return { label: "❄️ Winter Safety Drive", tagline: "Stay protected through the holidays", accent: "from-blue-900/60 to-cyan-900/40", badge: "bg-blue-800 text-blue-200" };
  if (month <= 4) return { label: "🌸 Spring Safety Season", tagline: "Fresh start. Real protection.", accent: "from-green-900/50 to-cyan-900/40", badge: "bg-green-800 text-green-200" };
  if (month <= 7) return { label: "☀️ Summer Road Safety Campaign", tagline: "Know your rights before you hit the road", accent: "from-orange-900/40 to-yellow-900/30", badge: "bg-orange-800 text-orange-200" };
  return { label: "🍂 Fall Awareness Season", tagline: "Election season. Know your rights.", accent: "from-red-900/40 to-orange-900/30", badge: "bg-red-800 text-red-200" };
}

// ─── My Rank Card ─────────────────────────────────────────────────────────────

function MyRankCard({ user }: { user: any }) {
  const [, setLocation] = useLocation();
  const { data: rankData } = useQuery<MyRank>({
    queryKey: ['/api/community/my-rank'],
    enabled: !!user,
  });
  const { data: referralData } = useQuery<any>({
    queryKey: ['/api/referrals/my'],
    enabled: !!user,
  });

  if (!user) return (
    <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-cyan-500/30">
      <CardContent className="p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-white font-bold text-lg">Join the Guardian Movement</p>
          <p className="text-gray-400 text-sm">Sign in to earn your rank and unlock rewards</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shrink-0" onClick={() => setLocation('/signin')}>
          Get Started <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );

  const rank = getRank(rankData?.rankLevel || 0);
  const progress = getRankProgress(rankData?.referralCount || 0, rankData?.rankLevel || 0);
  const nextRank = RANKS[(rankData?.rankLevel || 0) + 1];
  const refCode = referralData?.referralCode;
  const refLink = refCode ? `${window.location.origin}/?ref=${refCode}` : null;

  return (
    <Card className={`border ${rank.border} ${rank.bg} bg-opacity-30`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{rank.emoji}</span>
              <span className={`text-lg font-bold ${rank.color}`}>{rank.name}</span>
              <Badge className="bg-gray-700 text-gray-300 text-xs">Level {rankData?.rankLevel || 0}</Badge>
            </div>
            <p className="text-gray-400 text-sm">
              {(rankData?.referralCount || 0)} referral{(rankData?.referralCount || 0) !== 1 ? "s" : ""} · {referralData?.converted || 0} converted
            </p>
          </div>
          {nextRank && (
            <div className="text-right shrink-0">
              <p className="text-gray-500 text-xs mb-1">Next rank</p>
              <p className="text-gray-300 text-sm font-medium">{nextRank.emoji} {nextRank.name}</p>
              <p className="text-gray-500 text-xs">{nextRank.minRefs - (rankData?.referralCount || 0)} more refs</p>
            </div>
          )}
        </div>

        {nextRank && (
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{rank.name}</span><span>{nextRank.name}</span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-700" />
          </div>
        )}
        {!nextRank && (
          <div className="mb-4">
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-yellow-900/30 border border-yellow-500/30">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 text-sm font-medium">You've reached the highest rank! You're a founding legend.</span>
            </div>
          </div>
        )}

        {refLink && (
          <div className="flex items-center gap-2">
            <input readOnly value={refLink} className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-300 min-w-0" />
            <Button size="sm" onClick={() => { navigator.clipboard.writeText(refLink); }} className="bg-cyan-700 hover:bg-cyan-600 text-white shrink-0 gap-1.5 text-xs">
              <Share2 className="w-3 h-3" /> Copy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Progression Path ─────────────────────────────────────────────────────────

function ProgressionPath({ currentLevel }: { currentLevel: number }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Target className="w-5 h-5 text-cyan-400" /> Guardian Progression
      </h2>
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {RANKS.map((rank, i) => (
          <div key={rank.level} className="flex items-center shrink-0">
            <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
              i <= currentLevel
                ? `${rank.border} ${rank.bg} opacity-100`
                : "border-gray-700 bg-gray-800/30 opacity-50"
            }`}>
              <span className="text-xl">{rank.emoji}</span>
              <span className={`text-xs font-semibold whitespace-nowrap ${i <= currentLevel ? rank.color : "text-gray-500"}`}>
                {rank.name}
              </span>
              <span className="text-xs text-gray-500">{rank.minRefs === 0 ? "Start" : `${rank.minRefs}+ refs`}</span>
            </div>
            {i < RANKS.length - 1 && (
              <div className={`w-6 h-0.5 shrink-0 ${i < currentLevel ? "bg-cyan-500" : "bg-gray-700"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Giveaway Card ────────────────────────────────────────────────────────────

function GiveawayCard({ item, userId }: { item: Announcement; userId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entryStatus } = useQuery({
    queryKey: ['/api/announcements', item.id, 'entry-status'],
    queryFn: async () => {
      const r = await fetch(`/api/announcements/${item.id}/entry-status`, { credentials: 'include' });
      return r.json();
    },
    enabled: !!userId,
  });

  const enterMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/announcements/${item.id}/enter`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements', item.id, 'entry-status'] });
      toast({ title: "🎉 You're entered!", description: `${data.totalEntries} guardians have entered.` });
    },
    onError: (err: any) => {
      if (err.message?.includes("already_entered")) toast({ title: "Already entered!" });
      else toast({ title: "Error", variant: "destructive" });
    },
  });

  const entered = (entryStatus as any)?.entered;
  const totalEntries = (entryStatus as any)?.totalEntries || 0;
  const spotsMax = 100;
  const fillPct = Math.min(100, Math.round((totalEntries / spotsMax) * 100));
  const spotsLeft = Math.max(0, spotsMax - totalEntries);
  const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();

  return (
    <Card className="border border-purple-500/40 bg-gradient-to-br from-purple-900/30 to-gray-800/60 hover:border-purple-400/60 transition-all">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-purple-600 rounded-xl shrink-0">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {item.isPinned && <Badge className="bg-yellow-700 text-yellow-100 text-xs px-1.5">📌 Pinned</Badge>}
              {isExpired
                ? <Badge className="bg-gray-700 text-gray-400 text-xs">Ended</Badge>
                : <Badge className="bg-purple-800 text-purple-100 text-xs">🎁 Active Giveaway</Badge>
              }
            </div>
            <h3 className="text-white font-bold text-base leading-tight">{item.title}</h3>
            <p className="text-gray-300 text-sm mt-1 leading-relaxed">{item.content}</p>
          </div>
        </div>

        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.title} className="w-full rounded-lg object-cover max-h-40" />
        )}

        {/* Entry progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> {totalEntries} guardians entered
            </span>
            {!isExpired && (
              <span className={`font-semibold ${spotsLeft < 20 ? "text-red-400" : "text-orange-300"}`}>
                {spotsLeft < 20 ? `⚡ Only ${spotsLeft} spots left!` : `${spotsLeft} spots remaining`}
              </span>
            )}
          </div>
          <Progress value={fillPct} className="h-2.5 bg-gray-700" />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-gray-500 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.expiresAt
              ? (isExpired ? "Ended" : `Ends ${formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true })}`)
              : "No expiry set"
            }
          </span>
          {!isExpired && userId && (
            <Button
              size="sm"
              onClick={() => enterMutation.mutate()}
              disabled={entered || enterMutation.isPending}
              className={entered ? "bg-green-700 text-white cursor-default" : "bg-purple-600 hover:bg-purple-700 text-white"}
            >
              {entered ? "✓ Entered!" : enterMutation.isPending ? "Entering..." : "Enter to Win"}
            </Button>
          )}
          {!isExpired && !userId && (
            <Badge className="bg-gray-700 text-gray-400 text-xs">Sign in to enter</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Spotlight Card ───────────────────────────────────────────────────────────

function SpotlightCard({ item }: { item: Announcement }) {
  return (
    <Card className="border border-cyan-500/40 bg-gradient-to-br from-cyan-900/20 to-gray-800/60 hover:border-cyan-400/60 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-cyan-700 rounded-xl shrink-0">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <Badge className="bg-cyan-900 text-cyan-300 text-xs mb-2">🌟 Guardian Spotlight</Badge>
            <h3 className="text-white font-bold text-base">{item.title}</h3>
            <p className="text-gray-300 text-sm mt-1 leading-relaxed">{item.content}</p>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.title} className="w-full rounded-lg mt-3 max-h-48 object-cover" />
            )}
            <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <Card className="border border-gray-700 bg-gray-800/50 hover:border-cyan-500/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-800 rounded-lg shrink-0">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {item.isPinned && <Badge className="bg-yellow-700 text-yellow-100 text-xs px-1.5">📌 Pinned</Badge>}
              <Badge className="bg-cyan-900 text-cyan-200 text-xs">📣 Announcement</Badge>
            </div>
            <h3 className="text-white font-semibold text-sm">{item.title}</h3>
            <p className="text-gray-400 text-sm mt-1">{item.content}</p>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.title} className="w-full rounded-lg mt-2 max-h-36 object-cover" />
            )}
            <p className="text-gray-500 text-xs mt-2">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Wall of Guardians ────────────────────────────────────────────────────────

function WallOfGuardians() {
  const { data: members = [], isLoading } = useQuery<GuardianWallMember[]>({
    queryKey: ['/api/community/wall'],
  });

  const getWallRank = (refs: number) => {
    if (refs >= 25) return RANKS[4];
    if (refs >= 10) return RANKS[3];
    if (refs >= 3) return RANKS[2];
    if (refs >= 1) return RANKS[1];
    return RANKS[0];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" /> Wall of Guardians
        </h2>
        <Badge className="bg-cyan-900/50 text-cyan-300 text-xs">{(members as GuardianWallMember[]).length} members</Badge>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-700 rounded-full mx-auto mb-2" />
              <div className="w-3/4 h-3 bg-gray-700 rounded mx-auto" />
            </div>
          ))}
        </div>
      ) : (members as GuardianWallMember[]).length === 0 ? (
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-8 text-center">
            <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Be the first on the Wall</p>
            <p className="text-gray-500 text-sm mt-1">Refer a friend to earn your spot</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(members as GuardianWallMember[]).map((m, i) => {
            const rank = getWallRank(Number(m.referral_count));
            return (
              <div key={m.id} className={`border ${rank.border} ${rank.bg} rounded-xl p-3 text-center transition-all hover:scale-105 relative`}>
                {i < 3 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-yellow-600 text-white">
                    {i + 1}
                  </div>
                )}
                <div className={`w-11 h-11 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-bold ${rank.bg} border ${rank.border}`}>
                  {m.profile_image_url
                    ? <img src={m.profile_image_url} alt={m.display_name} className="w-11 h-11 rounded-full object-cover" />
                    : <span>{rank.emoji}</span>
                  }
                </div>
                <p className="text-white text-xs font-semibold truncate">{m.display_name}</p>
                <p className={`text-xs ${rank.color}`}>{rank.name}</p>
                <p className="text-gray-500 text-xs">{m.referral_count} refs</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── How to Earn ──────────────────────────────────────────────────────────────

function HowToEarn() {
  const [, setLocation] = useLocation();
  const steps = [
    { icon: Download, label: "Download", desc: "Get the C.A.R.E.N. app", color: "bg-cyan-700", num: 1 },
    { icon: Share2, label: "Share", desc: "Refer friends with your link", color: "bg-purple-700", num: 2 },
    { icon: Zap, label: "Engage", desc: "Use features & give feedback", color: "bg-orange-700", num: 3 },
    { icon: Trophy, label: "Earn", desc: "Level up & unlock rewards", color: "bg-yellow-700", num: 4 },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-400" /> How to Earn Rewards
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map(({ icon: Icon, label, desc, color, num }) => (
          <div key={label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-center hover:border-cyan-500/40 transition-all">
            <div className="relative mx-auto w-fit mb-3">
              <div className={`p-3 ${color} rounded-xl`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-900 border border-gray-600 rounded-full flex items-center justify-center text-xs text-gray-300 font-bold">
                {num}
              </div>
            </div>
            <p className="text-white font-bold text-sm">{label}</p>
            <p className="text-gray-400 text-xs mt-1">{desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-3">
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 flex-1" onClick={() => setLocation('/referrals')}>
          <Share2 className="w-4 h-4" /> Get My Referral Link
        </Button>
        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => setLocation('/feedback')}>
          Give Feedback
        </Button>
      </div>
    </div>
  );
}

// ─── Refer & Protect Banner ───────────────────────────────────────────────────

function ReferAndProtect() {
  const [, setLocation] = useLocation();
  const milestones = [
    { refs: 3, reward: "🔥 Protector Rank + digital badge" },
    { refs: 10, reward: "💪 Elite Protector + early feature access" },
    { refs: 25, reward: "👑 Elite Defender + lifetime recognition" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-purple-500/30">
      {/* Image header */}
      <div className="relative">
        <img
          src={referProtectImg}
          alt="Refer & Protect"
          className="w-full object-cover max-h-56"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Badge className="bg-purple-800 text-purple-200 text-xs mb-1">📱 Invite & Earn</Badge>
          <h3 className="text-xl font-black text-white">Refer & Protect</h3>
          <p className="text-gray-300 text-sm">Every referral protects someone new — and levels you up</p>
        </div>
      </div>
      {/* Milestones */}
      <div className="bg-gray-800/80 p-4 space-y-2">
        {milestones.map(({ refs, reward }) => (
          <div key={refs} className="flex items-center gap-3 py-2.5 px-3 bg-gray-900/60 rounded-lg border border-gray-700">
            <div className="text-cyan-400 font-bold text-sm shrink-0 w-14">{refs} refs</div>
            <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
            <div className="text-gray-300 text-sm">{reward}</div>
          </div>
        ))}
        <Button className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white gap-2" onClick={() => setLocation('/referrals')}>
          <Share2 className="w-4 h-4" /> Get My Referral Link
        </Button>
      </div>
    </div>
  );
}

function FirstRespondersCircle() {
  const [, setLocation] = useLocation();
  return (
    <div className="overflow-hidden rounded-2xl border border-yellow-500/40">
      <div className="relative">
        <img
          src={firstRespondersImg}
          alt="First Responders Circle"
          className="w-full object-cover max-h-56"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Badge className="bg-yellow-700 text-yellow-100 text-xs mb-1">⭐ Exclusive Access</Badge>
          <h3 className="text-xl font-black text-white">First Responders Circle</h3>
          <p className="text-gray-300 text-sm">Elite status. Early privileges. Direct access.</p>
        </div>
      </div>
      <div className="bg-gray-800/80 p-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {["Exclusive Updates", "Direct Access", "Lifetime Benefits"].map(perk => (
            <div key={perk} className="text-center py-2 px-2 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
              <p className="text-yellow-300 text-xs font-semibold">{perk}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-sm mb-3 leading-relaxed">
          A limited group of founding members with a direct line to the C.A.R.E.N. team. Early access, private updates, and a lifetime discount.
        </p>
        <Button className="w-full bg-yellow-700 hover:bg-yellow-600 text-white gap-2" onClick={() => setLocation('/waitlist')}>
          <Crown className="w-4 h-4" /> Apply for Early Access
        </Button>
      </div>
    </div>
  );
}

// ─── Hub Tab ──────────────────────────────────────────────────────────────────

function GuardianHubTab({ user }: { user: any }) {
  const { data: allItems = [] } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
  });
  const { data: rankData } = useQuery<MyRank>({
    queryKey: ['/api/community/my-rank'],
    enabled: !!user,
  });

  const items = allItems as Announcement[];
  const giveaways = items.filter(i => i.type === "giveaway");
  const spotlights = items.filter(i => i.type === "spotlight");
  const season = getSeasonalTheme();

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 group cursor-pointer">
        <img
          src={firstLineImg}
          alt="Join the First Line of Defense"
          className="w-full object-cover max-h-72 md:max-h-80 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <Badge className={`${season.badge} text-xs mb-2`}>{season.label}</Badge>
          <p className="text-gray-300 text-sm">{season.tagline}</p>
        </div>
      </div>

      {/* My Rank */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" /> Your Guardian Status
        </h2>
        <MyRankCard user={user} />
      </div>

      {/* Progression Path */}
      <ProgressionPath currentLevel={rankData?.rankLevel || 0} />

      {/* Active Giveaways */}
      {giveaways.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Active Giveaways</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600 animate-pulse">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              <span className="text-white text-xs font-bold">LIVE</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {giveaways.map(item => <GiveawayCard key={item.id} item={item} userId={(user as any)?.id} />)}
          </div>
        </div>
      )}

      {/* Guardian of the Week / Spotlights */}
      <div>
        <div className="relative overflow-hidden rounded-2xl mb-4 border border-cyan-500/30">
          <img
            src={guardianWeekImg}
            alt="Guardian of the Week"
            className="w-full object-cover max-h-52"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 via-transparent to-gray-900/20" />
          <div className="absolute inset-0 flex items-end p-5">
            <div>
              <Badge className="bg-cyan-800 text-cyan-200 text-xs mb-2">🌟 Featured Guardians</Badge>
              <h2 className="text-xl font-black text-white">This Week's Heroes</h2>
              <p className="text-gray-300 text-sm">Community members making a real difference</p>
            </div>
          </div>
        </div>
        {spotlights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spotlights.slice(0, 4).map(item => <SpotlightCard key={item.id} item={item} />)}
          </div>
        ) : (
          <Card className="bg-gray-800/30 border-gray-700 border-dashed">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Spotlights drop each week — could be you next!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* How to Earn */}
      <HowToEarn />

      {/* Refer & Protect */}
      <ReferAndProtect />

      {/* First Responders Circle */}
      <FirstRespondersCircle />

      {/* Wall of Guardians */}
      <WallOfGuardians />

      {/* Empty state if nothing at all */}
      {giveaways.length === 0 && spotlights.length === 0 && (
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-8 text-center">
            <Bell className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-300 font-medium">More coming soon</p>
            <p className="text-gray-500 text-sm mt-1">Giveaways and spotlights drop regularly — check back soon!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Announcements Tab ────────────────────────────────────────────────────────

function AnnouncementsTab() {
  const { data: items = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
  });

  const news = (items as Announcement[]).filter(i => i.type === "announcement");
  const pinned = news.filter(i => i.isPinned);
  const regular = news.filter(i => !i.isPinned);

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => (
        <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
          <CardContent className="p-5 h-24" />
        </Card>
      ))}
    </div>
  );

  if (news.length === 0) return (
    <Card className="bg-gray-800/30 border-gray-700">
      <CardContent className="p-10 text-center">
        <Megaphone className="w-10 h-10 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">No announcements yet</p>
        <p className="text-gray-500 text-sm mt-1">Check back soon for updates from C.A.R.E.N.</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {pinned.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5"><Pin className="w-3.5 h-3.5" /> Pinned</h3>
          {pinned.map(item => <AnnouncementCard key={item.id} item={item} />)}
        </div>
      )}
      <div className="space-y-3">
        {pinned.length > 0 && <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent</h3>}
        {regular.map(item => <AnnouncementCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

// ─── Forum Tab ────────────────────────────────────────────────────────────────

const iconMap = { Car, Shield, AlertTriangle, Settings, MessageSquare, Users };
const colorMap = { blue: "bg-blue-500", green: "bg-green-500", orange: "bg-orange-500", purple: "bg-purple-500", gray: "bg-gray-500", red: "bg-red-500" };

function ForumStats() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['/api/forum/stats'] });
  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse"><CardContent className="p-4 h-16" /></Card>)}
    </div>
  );
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: "Members", value: (stats as any)?.totalMembers || 0, icon: Users, color: "bg-blue-600" },
        { label: "Posts", value: (stats as any)?.totalPosts || 0, icon: MessageSquare, color: "bg-green-600" },
        { label: "Categories", value: (stats as any)?.totalCategories || 0, icon: Shield, color: "bg-purple-600" },
        { label: "Replies", value: (stats as any)?.totalReplies || 0, icon: AlertTriangle, color: "bg-orange-600" },
      ].map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${color} rounded-lg`}><Icon className="w-4 h-4 text-white" /></div>
              <div><p className="text-xs text-gray-400">{label}</p><p className="text-xl font-bold text-white">{value}</p></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ForumTab() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("CA");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/forum/categories', selectedState],
    queryFn: async () => {
      const r = await fetch(`/api/forum/categories?state=${selectedState}`);
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
  });

  const filtered = (categories as ForumCategory[]).filter((c: ForumCategory) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search discussions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400" />
        </div>
        <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm">
          <option value="CA">California</option><option value="NY">New York</option><option value="TX">Texas</option>
          <option value="FL">Florida</option><option value="">All States</option>
        </select>
        <Button onClick={() => setLocation('/community/create-post')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Post
        </Button>
      </div>
      <ForumStats />
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">Discussion Categories</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse"><CardContent className="p-5 h-24" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((category: ForumCategory) => {
              const IconComponent = iconMap[category.icon as keyof typeof iconMap] || MessageSquare;
              return (
                <Card key={category.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer group" onClick={() => setLocation(`/community/category/${category.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colorMap[category.color as keyof typeof colorMap] || 'bg-gray-500'} group-hover:scale-110 transition-transform shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white group-hover:text-blue-400 transition-colors">{category.name}</CardTitle>
                        <CardDescription className="text-gray-400 text-xs mt-1">{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{category.postCount} posts</span>
                      {category.lastPostAt && <span>{formatDistanceToNow(new Date(category.lastPostAt), { addSuffix: true })}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <Card className="bg-gray-800/30 border-gray-700">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">{searchQuery ? `No results for "${searchQuery}"` : "No categories yet"}</p>
              {searchQuery && <Button variant="ghost" onClick={() => setSearchQuery("")} className="mt-2 text-gray-400">Clear search</Button>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "hub" | "announcements" | "forum";

export default function Community() {
  const [activeTab, setActiveTab] = useState<Tab>("hub");
  const { user } = useAuth();

  const tabs: { id: Tab; label: string; icon: any; badge?: string }[] = [
    { id: "hub", label: "Guardian Hub", icon: Shield },
    { id: "announcements", label: "News", icon: Megaphone },
    { id: "forum", label: "Forum", icon: MessageSquare },
  ];

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">

          {/* Page Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">C.A.R.E.N. Community</h1>
            <p className="text-gray-400 text-sm mt-1">Recognition · Belonging · Status · Purpose</p>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1.5 p-1 bg-gray-800/70 rounded-xl w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === id ? "bg-cyan-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-700/50"}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "hub" && <GuardianHubTab user={user} />}
          {activeTab === "announcements" && <AnnouncementsTab />}
          {activeTab === "forum" && <ForumTab />}

        </div>
      </div>
    </MobileResponsiveLayout>
  );
}
