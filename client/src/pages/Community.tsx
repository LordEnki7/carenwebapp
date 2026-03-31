import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { 
  Users, 
  MessageSquare, 
  Shield, 
  Car, 
  AlertTriangle, 
  Settings,
  Search,
  Plus,
  Pin,
  Lock,
  Eye,
  MessageCircle,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface ForumPost {
  id: number;
  categoryId: number;
  userId: string;
  title: string;
  content: string;
  viewCount: number;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  lastReplyAt: string | null;
  lastReplyUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

const iconMap = {
  Car,
  Shield,
  AlertTriangle,
  Settings,
  MessageSquare,
  Users
};

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  gray: "bg-gray-500",
  red: "bg-red-500"
};

// Forum Stats Component
function ForumStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/forum/stats'],
    queryFn: async () => {
      const response = await fetch('/api/forum/stats');
      if (!response.ok) throw new Error('Failed to fetch forum stats');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="w-20 h-3 bg-gray-700 rounded mb-2"></div>
                  <div className="w-16 h-5 bg-gray-700 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Members</p>
              <p className="text-xl font-bold text-white">{stats?.totalMembers || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Posts</p>
              <p className="text-xl font-bold text-white">{stats?.totalPosts || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Categories</p>
              <p className="text-xl font-bold text-white">{stats?.totalCategories || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Recent Replies</p>
              <p className="text-xl font-bold text-white">{stats?.totalReplies || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Community() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("CA");

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['/api/forum/categories', selectedState],
    queryFn: async () => {
      const response = await fetch(`/api/forum/categories?state=${selectedState}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const filteredCategories = categories.filter((category: ForumCategory) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (categoryId: number) => {
    setLocation(`/community/category/${categoryId}`);
  };

  const handleCreatePost = () => {
    setLocation('/community/create-post');
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || MessageSquare;
    return IconComponent;
  };

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Community Forum</h1>
              <p className="text-gray-300">
                Connect with fellow CAREN users, share experiences, and learn from each other
              </p>
            </div>
            <Button 
              onClick={handleCreatePost}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            >
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
              <option value="">All States</option>
            </select>
          </div>

          {/* Stats Overview */}
          <ForumStats />

          {/* Categories Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Discussion Categories</h2>
            
            {loadingCategories ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-lg mb-2"></div>
                      <div className="w-3/4 h-4 bg-gray-700 rounded"></div>
                      <div className="w-full h-3 bg-gray-700 rounded"></div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between text-sm">
                        <div className="w-16 h-3 bg-gray-700 rounded"></div>
                        <div className="w-20 h-3 bg-gray-700 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map((category: ForumCategory) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <Card 
                      key={category.id}
                      className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer group"
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${colorMap[category.color as keyof typeof colorMap] || 'bg-gray-500'} group-hover:scale-110 transition-transform`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">
                              {category.name}
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-sm mt-1">
                              {category.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">
                            {category.postCount} posts
                          </span>
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
          </div>

          {/* Empty State */}
          {!loadingCategories && filteredCategories.length === 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No categories found</h3>
                <p className="text-gray-400 mb-4">
                  {searchQuery 
                    ? `No categories match your search for "${searchQuery}"`
                    : `No categories available for ${selectedState}`
                  }
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}