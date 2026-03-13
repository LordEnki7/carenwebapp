import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { ForumCategory } from "@shared/schema";

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Get URL parameters to see if we have a specific category
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('categoryId');

  // Fetch forum categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery<ForumCategory[]>({
    queryKey: ["/api/forum/categories"],
  });

  // Set initial category if provided in URL
  useState(() => {
    if (categoryId && !selectedCategoryId) {
      setSelectedCategoryId(categoryId);
    }
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; categoryId: number }) => {
      return await apiRequest("POST", "/api/forum/posts", data);
    },
    onSuccess: (newPost) => {
      toast({
        title: "Post Created!",
        description: "Your post has been published successfully.",
      });
      
      // Invalidate forum queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/forum/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/stats"] });
      queryClient.invalidateQueries({ queryKey: [`/api/forum/categories/${selectedCategoryId}/posts`] });
      
      // Navigate back to the category page
      setLocation(`/community/category/${selectedCategoryId}`);
    },
    onError: (error) => {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !selectedCategoryId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields including selecting a category.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to create posts.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      categoryId: parseInt(selectedCategoryId),
    });
  };

  const selectedCategory = categories.find(cat => cat.id.toString() === selectedCategoryId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/community')}
            className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
          <h1 className="text-3xl font-bold text-white">Create New Post</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                Share with the Community
              </CardTitle>
              <p className="text-gray-300">
                Share your experiences, ask questions, or start discussions about legal rights and protection.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {loadingCategories ? (
                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id.toString()}
                            className="text-white hover:bg-gray-700"
                          >
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <p className="text-sm text-gray-400 mt-1">
                      {selectedCategory.description}
                    </p>
                  )}
                </div>

                {/* Post Title */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Post Title <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a clear, descriptive title..."
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    maxLength={200}
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    {title.length}/200 characters
                  </p>
                </div>

                {/* Post Content */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    Post Content <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts, experiences, or questions with the community..."
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-[200px]"
                    maxLength={5000}
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    {content.length}/5000 characters
                  </p>
                </div>

                {/* Community Guidelines Reminder */}
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-blue-400 font-medium">Community Guidelines</h4>
                      <ul className="text-sm text-gray-300 mt-2 space-y-1">
                        <li>• Keep discussions focused on legal rights and protection</li>
                        <li>• Be respectful and constructive in all interactions</li>
                        <li>• Avoid sharing personal identifying information</li>
                        <li>• Do not provide specific legal advice</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/community')}
                    className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending || !title.trim() || !content.trim() || !selectedCategoryId}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating Post...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Create Post
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}