import { useState, useEffect } from "react";
import { useLegalRights } from "@/hooks/useLegalRights";
// import { useGeolocation } from "@/hooks/useGeolocation"; // Disabled to prevent glitching
import TopBar from "@/components/TopBar";
// import LocationAwareLegalRights from "@/components/LocationAwareLegalRights"; // Disabled to prevent glitching
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Scale, Video, Info, Shield, Eye, FileText, MapPin, Navigation, Star, AlertTriangle, BookOpen, Gavel } from "lucide-react";
import { US_STATES } from "@/types";
import { t } from "@/lib/i18n";

const categoryIcons = {
  silence: Info,
  recording: Video,
  search: Search,
  rights: Scale,
  protection: Shield,
  default: FileText,
};

const categoryColors = {
  silence: "from-blue-500 to-blue-600",
  recording: "from-red-500 to-red-600",
  search: "from-yellow-500 to-yellow-600",
  rights: "from-green-500 to-green-600",
  protection: "from-purple-500 to-purple-600",
  default: "from-gray-500 to-gray-600",
};

const categoryBorders = {
  silence: "border-blue-400/50",
  recording: "border-red-400/50",
  search: "border-yellow-400/50",
  rights: "border-green-400/50",
  protection: "border-purple-400/50",
  default: "border-gray-400/50",
};

export default function Rights() {
  // Rights page is publicly accessible - no authentication required
  // Disable geolocation to prevent constant re-rendering and glitching
  const location = null;
  const [selectedState, setSelectedState] = useState("CA");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Auto-update selected state when GPS location changes (disabled to prevent glitching)
  useEffect(() => {
    // Geolocation disabled - user can manually select state
  }, []);

  const { data: legalRights, isLoading, error } = useLegalRights(selectedState);

  // Handle API errors (but allow unauthenticated access to legal rights)
  useEffect(() => {
    if (error) {
      // Legal rights should be accessible to all users, so we don't redirect on auth errors
      console.warn("Error accessing legal rights, but continuing to show public legal information");
    }
  }, [error]);

  // Filter and categorize rights
  const categories = Array.from(new Set(legalRights?.map(right => right.category) || []));
  
  const filteredRights = legalRights?.filter(right => {
    const matchesSearch = right.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         right.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || right.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Group rights by category
  const rightsByCategory = filteredRights.reduce((acc, right) => {
    if (!acc[right.category]) acc[right.category] = [];
    acc[right.category].push(right);
    return acc;
  }, {} as Record<string, typeof filteredRights>);

  const getIcon = (category: string) => {
    const IconComponent = categoryIcons[category.toLowerCase() as keyof typeof categoryIcons] || categoryIcons.default;
    return IconComponent;
  };

  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
  };

  // No loading state needed - rights are always accessible

  return (
    <MobileResponsiveLayout disableTransitions={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900" style={{ transform: 'translateX(0px)', transition: 'none' }}>
        <TopBar 
          title="Know Your Rights"
          description="Essential legal rights and constitutional protections for police encounters"
        />
        
        <main className="p-6" style={{ transform: 'none', transition: 'none', animation: 'none' }}>
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="gps-rights" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="gps-rights" className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  GPS-Based Rights
                </TabsTrigger>
                <TabsTrigger value="browse-rights" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Browse All Rights
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="gps-rights">
                <Card className="border-cyan-400/50 bg-gray-800/30 backdrop-blur-sm">
                  <CardHeader>
                    <h3 className="text-xl font-semibold text-cyan-400">GPS-Based Legal Rights</h3>
                    <p className="text-gray-300">GPS functionality temporarily disabled for stability. Please use the "Browse All Rights" tab to select your state manually.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-400 py-8">
                      <Navigation className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Location services disabled to improve page performance.</p>
                      <p className="text-sm mt-2">Select your state in the "Browse All Rights" tab above.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="browse-rights">
                <div className="space-y-8">
                  {/* Enhanced Header Section */}
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30 animate-pulse">
                        <Gavel className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      🛡️ Constitutional Rights & Legal Protections 
                    </h2>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      ⭐ Enhanced Visual Design Active ⭐ Beautiful modern interface showing your constitutional rights during police encounters.
                    </p>
                    <div className="flex justify-center mt-4">
                      <Badge className="bg-green-500/20 text-green-300 border-green-400/30 animate-bounce">
                        🎨 New Modern Card Design
                      </Badge>
                    </div>
                  </div>

                  {/* Enhanced Filters Section */}
                  <Card className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-gray-600/50 backdrop-blur-sm shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Search Rights</label>
                          <div className="relative">
                            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                            <Input
                              placeholder="Search constitutional rights, recording laws, search protections..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-12 h-12 bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                            <Select value={selectedState} onValueChange={setSelectedState}>
                              <SelectTrigger className="h-12 bg-gray-700/50 border-gray-600 text-gray-200 focus:border-blue-400">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                {US_STATES.map((state) => (
                                  <SelectItem key={state.code} value={state.code} className="text-gray-200 hover:bg-gray-700">
                                    {state.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="min-w-[180px]">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="h-12 bg-gray-700/50 border-gray-600 text-gray-200 focus:border-blue-400">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-gray-400" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                <SelectItem value="all" className="text-gray-200 hover:bg-gray-700">All Categories</SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category} className="text-gray-200 hover:bg-gray-700">
                                    {formatCategoryName(category)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Results Summary */}
                  {filteredRights.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                          {filteredRights.length} rights found
                        </Badge>
                        <Badge variant="outline" className="text-gray-300 border-gray-600">
                          {selectedState} State Laws
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        Last updated: Constitutional protections
                      </div>
                    </div>
                  )}

                  {/* Enhanced Rights Display */}
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="bg-gray-800/50 border-gray-700 animate-pulse">
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                              <div className="h-20 bg-gray-700 rounded"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredRights.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredRights.map((right, index) => {
                        const IconComponent = getIcon(right.category);
                        const categoryColor = categoryColors[right.category?.toLowerCase() as keyof typeof categoryColors] || categoryColors.default;
                        const categoryBorder = categoryBorders[right.category?.toLowerCase() as keyof typeof categoryBorders] || categoryBorders.default;
                        const isHighPriority = right.title.toLowerCase().includes('constitutional') || 
                                             right.title.toLowerCase().includes('amendment') ||
                                             right.title.toLowerCase().includes('miranda');
                        
                        return (
                          <Card 
                            key={right.id} 
                            className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${categoryBorder} bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border-2 hover:border-opacity-100`}
                          >
                            {/* Priority indicator */}
                            {isHighPriority && (
                              <div className="absolute top-3 right-3">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                              </div>
                            )}
                            
                            {/* Category gradient header */}
                            <div className={`h-2 bg-gradient-to-r ${categoryColor} opacity-80`} />
                            
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                {/* Icon and Category */}
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-gradient-to-r ${categoryColor} bg-opacity-20`}>
                                    <IconComponent className="w-5 h-5 text-gray-200" />
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs font-medium ${categoryBorder} text-gray-300`}
                                  >
                                    {formatCategoryName(right.category)}
                                  </Badge>
                                </div>
                                
                                {/* Title */}
                                <CardTitle className="text-lg font-bold text-gray-100 leading-tight group-hover:text-blue-300 transition-colors">
                                  {right.title}
                                </CardTitle>
                                
                                {/* Description */}
                                <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                                  {right.description}
                                </p>
                                
                                {/* Details expansion */}
                                {right.details && (
                                  <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                      {right.details.substring(0, 120)}...
                                    </p>
                                  </div>
                                )}
                                
                                {/* Footer with state and importance */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-gray-500" />
                                    <span className="text-xs text-gray-500 font-medium">{right.state}</span>
                                  </div>
                                  {isHighPriority && (
                                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs">
                                      High Priority
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardContent className="p-12 text-center">
                        <div className="space-y-4">
                          <BookOpen className="w-16 h-16 text-gray-500 mx-auto opacity-50" />
                          <h3 className="text-xl font-semibold text-gray-300">No Rights Found</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            No legal rights match your current search criteria. Try adjusting your search terms or selecting a different state.
                          </p>
                          <Button 
                            onClick={() => {
                              setSearchTerm("");
                              setSelectedCategory("all");
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-gray-100"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Legal Disclaimer */}
                  <Card className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-400/30">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                        <div className="space-y-2">
                          <h4 className="text-amber-300 font-semibold">Important Legal Notice</h4>
                          <p className="text-amber-200/80 text-sm leading-relaxed">
                            This information is provided for educational purposes only and does not constitute legal advice. 
                            Laws vary by jurisdiction and change frequently. Always consult with a qualified attorney for 
                            specific legal guidance regarding your situation.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </MobileResponsiveLayout>
  );
}