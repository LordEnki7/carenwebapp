import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { 
  ArrowLeft,
  Plus,
  Pin,
  Lock,
  Eye,
  MessageCircle,
  Clock,
  Search,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

export default function CategoryPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  // Fetch category details
  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: ['/api/forum/categories', id],
    queryFn: async () => {
      const response = await fetch(`/api/forum/categories/${id}`);
      if (!response.ok) throw new Error('Failed to fetch category');
      return response.json();
    },
    enabled: !!id
  });

  // Fetch posts for this category
  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['/api/forum/posts', id, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        categoryId: id!,
        sort: sortBy
      });
      const response = await fetch(`/api/forum/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    enabled: !!id
  });

  const filteredPosts = posts.filter((post: ForumPost) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBackToForum = () => {
    setLocation('/community');
  };

  const handleCreatePost = () => {
    setLocation(`/community/create-post?categoryId=${id}`);
  };

  const handlePostClick = (postId: number) => {
    setLocation(`/community/post/${postId}`);
  };

  if (loadingCategory) {
    return (
      <MobileResponsiveLayout>
        <div className="min-h-screen bg-gray-900">
          <div className="container mx-auto px-4 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              <div className="h-32 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </MobileResponsiveLayout>
    );
  }

  if (!category) {
    return (
      <MobileResponsiveLayout>
        <div className="min-h-screen bg-gray-900">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-white mb-4">Category Not Found</h2>
              <p className="text-gray-400 mb-6">The category you're looking for doesn't exist.</p>
              <Button onClick={handleBackToForum} className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Community Forum
              </Button>
            </div>
          </div>
        </div>
      </MobileResponsiveLayout>
    );
  }

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleBackToForum}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{category.name}</h1>
              <p className="text-gray-300 mt-1">{category.description}</p>
            </div>
          </div>

          {/* Category Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Posts</p>
                    <p className="text-xl font-bold text-white">{category.postCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active Today</p>
                    <p className="text-xl font-bold text-white">{Math.floor(Math.random() * 15) + 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Last Activity</p>
                    <p className="text-sm font-medium text-white">
                      {category.lastPostAt 
                        ? formatDistanceToNow(new Date(category.lastPostAt), { addSuffix: true })
                        : 'No posts yet'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              >
                <option value="latest">Latest Posts</option>
                <option value="popular">Most Popular</option>
                <option value="oldest">Oldest First</option>
                <option value="most-replies">Most Replies</option>
              </select>
            </div>
            <Button 
              onClick={handleCreatePost}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              {searchQuery ? `Search Results (${filteredPosts.length})` : 'Recent Discussions'}
            </h2>
            
            {loadingPosts ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="w-2/3 h-4 bg-gray-700 rounded"></div>
                          <div className="w-full h-3 bg-gray-700 rounded"></div>
                          <div className="w-1/2 h-3 bg-gray-700 rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {searchQuery ? 'No matching posts' : 'No posts yet'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {searchQuery 
                      ? `No posts match your search for "${searchQuery}"`
                      : `Be the first to start a discussion in ${category.name}`
                    }
                  </p>
                  <Button 
                    onClick={handleCreatePost}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post: ForumPost) => (
                  <Card 
                    key={post.id}
                    className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer group"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {post.userId.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {post.isPinned && (
                                  <Pin className="w-4 h-4 text-green-500" />
                                )}
                                {post.isLocked && (
                                  <Lock className="w-4 h-4 text-red-500" />
                                )}
                                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                  {post.title}
                                </h3>
                              </div>
                              <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                {post.content.length > 150 
                                  ? post.content.substring(0, 150) + '...'
                                  : post.content
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{post.viewCount}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.replyCount}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div>
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              </div>
                              {post.lastReplyAt && (
                                <div className="text-xs">
                                  Last reply {formatDistanceToNow(new Date(post.lastReplyAt), { addSuffix: true })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}