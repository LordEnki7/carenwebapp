import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Users, MessageSquare, Shield, Car, AlertTriangle, Settings,
  Search, Plus, Pin, Lock, Eye, MessageCircle, Clock,
  Megaphone, Gift, Trophy, ChevronRight, Bell
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface ForumCategory {
  id: number;
  name: string;
  description: string;
  state: string;
  icon: string;
  color: string;
  postCount: number;
  lastPostAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  imageUrl: string | null;
  isActive: boolean;
  isPinned: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const iconMap = { Car, Shield, AlertTriangle, Settings, MessageSquare, Users };
const colorMap = {
  blue: "bg-blue-500", green: "bg-green-500", orange: "bg-orange-500",
  purple: "bg-purple-500", gray: "bg-gray-500", red: "bg-red-500"
};

function ForumStats() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['/api/forum/stats'] });
  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
          <CardContent className="p-4"><div className="w-full h-10 bg-gray-700 rounded" /></CardContent>
        </Card>
      ))}
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
              <div className={`p-2 ${color} rounded-lg`}><Icon className="w-5 h-5 text-white" /></div>
              <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnnouncementCard({ item, userId }: { item: Announcement; userId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isGiveaway = item.type === "giveaway";

  const { data: entryStatus } = useQuery({
    queryKey: ['/api/announcements', item.id, 'entry-status'],
    queryFn: async () => {
      const r = await fetch(`/api/announcements/${item.id}/entry-status`, { credentials: 'include' });
      return r.json();
    },
    enabled: isGiveaway && !!userId,
  });

  const enterMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/announcements/${item.id}/enter`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements', item.id, 'entry-status'] });
      toast({ title: "You're entered!", description: `${data.totalEntries} people have entered this giveaway.` });
    },
    onError: (err: any) => {
      if (err.message?.includes("already_entered")) {
        toast({ title: "Already entered", description: "You're already in this giveaway!" });
      } else {
        toast({ title: "Error", description: "Could not enter giveaway. Please try again.", variant: "destructive" });
      }
    },
  });

  const alreadyEntered = (entryStatus as any)?.entered;
  const totalEntries = (entryStatus as any)?.totalEntries || 0;

  return (
    <Card className={`border transition-all ${isGiveaway ? "bg-gradient-to-br from-purple-900/40 to-gray-800/60 border-purple-500/40 hover:border-purple-400/60" : "bg-gray-800/50 border-gray-700 hover:border-cyan-500/40"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg flex-shrink-0 ${isGiveaway ? "bg-purple-600" : "bg-cyan-600"}`}>
              {isGiveaway ? <Gift className="w-5 h-5 text-white" /> : <Megaphone className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {item.isPinned && <Badge className="bg-yellow-600 text-white text-xs px-2 py-0">📌 Pinned</Badge>}
                <Badge className={`text-xs px-2 py-0 ${isGiveaway ? "bg-purple-700 text-purple-100" : "bg-cyan-800 text-cyan-100"}`}>
                  {isGiveaway ? "🎁 Giveaway" : "📣 Announcement"}
                </Badge>
              </div>
              <CardTitle className="text-white text-lg leading-tight">{item.title}</CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.title} className="w-full rounded-lg object-cover max-h-48" />
        )}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            {item.expiresAt && (
              <span className="text-orange-400 ml-2">
                · Ends {formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true })}
              </span>
            )}
          </div>
          {isGiveaway && userId && (
            <div className="flex items-center gap-3">
              {totalEntries > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-400" /> {totalEntries} entries
                </span>
              )}
              <Button
                size="sm"
                onClick={() => enterMutation.mutate()}
                disabled={alreadyEntered || enterMutation.isPending}
                className={alreadyEntered ? "bg-green-700 text-white cursor-default" : "bg-purple-600 hover:bg-purple-700 text-white"}
              >
                {alreadyEntered ? "✓ Entered" : enterMutation.isPending ? "Entering..." : "Enter Giveaway"}
              </Button>
            </div>
          )}
          {isGiveaway && !userId && (
            <Badge className="bg-gray-700 text-gray-300 text-xs">Sign in to enter</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementsTab() {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
  });

  const pinned = (items as Announcement[]).filter(i => i.isPinned);
  const regular = (items as Announcement[]).filter(i => !i.isPinned);

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => (
        <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
          <CardContent className="p-6"><div className="space-y-3">
            <div className="w-3/4 h-5 bg-gray-700 rounded" />
            <div className="w-full h-3 bg-gray-700 rounded" />
            <div className="w-2/3 h-3 bg-gray-700 rounded" />
          </div></CardContent>
        </Card>
      ))}
    </div>
  );

  if ((items as Announcement[]).length === 0) return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-10 text-center">
        <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Nothing yet</h3>
        <p className="text-gray-400">Check back soon for C.A.R.E.N. news and giveaways!</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {pinned.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
            <Pin className="w-4 h-4" /> Pinned
          </h3>
          {pinned.map(item => <AnnouncementCard key={item.id} item={item} userId={(user as any)?.id} />)}
        </div>
      )}
      {regular.length > 0 && (
        <div className="space-y-4">
          {pinned.length > 0 && <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent</h3>}
          {regular.map(item => <AnnouncementCard key={item.id} item={item} userId={(user as any)?.id} />)}
        </div>
      )}
    </div>
  );
}

export default function Community() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"forum" | "announcements">("announcements");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("CA");

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['/api/forum/categories', selectedState],
    queryFn: async () => {
      const r = await fetch(`/api/forum/categories?state=${selectedState}`);
      if (!r.ok) throw new Error('Failed to fetch categories');
      return r.json();
    },
    enabled: activeTab === "forum",
  });

  const filteredCategories = (categories as ForumCategory[]).filter((c: ForumCategory) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-6 space-y-6">

          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
              <p className="text-gray-300">News, giveaways, and discussions from the C.A.R.E.N. family</p>
            </div>
            {activeTab === "forum" && (
              <Button onClick={() => setLocation('/community/create-post')} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />Create Post
              </Button>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 p-1 bg-gray-800/60 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "announcements" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
            >
              <Megaphone className="w-4 h-4" /> News & Giveaways
            </button>
            <button
              onClick={() => setActiveTab("forum")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "forum" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
            >
              <MessageSquare className="w-4 h-4" /> Forum
            </button>
          </div>

          {/* Announcements Tab */}
          {activeTab === "announcements" && <AnnouncementsTab />}

          {/* Forum Tab */}
          {activeTab === "forum" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
                <select
                  value={selectedState}
                  onChange={e => setSelectedState(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                >
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                  <option value="">All States</option>
                </select>
              </div>

              <ForumStats />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Discussion Categories</h2>
                {loadingCategories ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => (
                      <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                        <CardHeader className="pb-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-lg mb-2" />
                          <div className="w-3/4 h-4 bg-gray-700 rounded" />
                          <div className="w-full h-3 bg-gray-700 rounded" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map((category: ForumCategory) => {
                      const IconComponent = iconMap[category.icon as keyof typeof iconMap] || MessageSquare;
                      return (
                        <Card
                          key={category.id}
                          className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer group"
                          onClick={() => setLocation(`/community/category/${category.id}`)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${colorMap[category.color as keyof typeof colorMap] || 'bg-gray-500'} group-hover:scale-110 transition-transform`}>
                                <IconComponent className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">{category.name}</CardTitle>
                                <CardDescription className="text-gray-400 text-sm mt-1">{category.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">{category.postCount} posts</span>
                              {category.lastPostAt && (
                                <span className="text-gray-500">
                                  {formatDistanceToNow(new Date(category.lastPostAt), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {!loadingCategories && filteredCategories.length === 0 && (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No categories found</h3>
                      <p className="text-gray-400 mb-4">
                        {searchQuery ? `No categories match "${searchQuery}"` : `No categories for ${selectedState}`}
                      </p>
                      {searchQuery && (
                        <Button variant="outline" onClick={() => setSearchQuery("")} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Clear Search
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </MobileResponsiveLayout>
  );
}
