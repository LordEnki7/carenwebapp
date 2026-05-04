import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAttorneys } from "@/hooks/useLegalRights";
import { useLocationRecommendations } from "@/hooks/useLocationRecommendations";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import FloatingAttorneyButton from "@/components/FloatingAttorneyButton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Star, MessageCircle, Phone, Mail, User, Scale, Shield, Navigation, Target, Clock, Plus, Pencil, Trash2, CheckCircle, AlertCircle, X } from "lucide-react";
import { US_STATES } from "@/types";
import { t } from "@/lib/i18n";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

const specialties = [
  "Civil Rights",
  "Traffic Law",
  "Criminal Defense",
  "Constitutional Law",
  "Police Misconduct",
  "Personal Injury",
  "Immigration Law",
];

type PersonalAttorney = {
  id: number;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  firmName: string | null;
  specialty: string | null;
  notes: string | null;
  isPrimary: boolean;
  createdAt: string;
};

type CoverageResult = {
  covered: boolean;
  nearestMiles: number | null;
};

function useAttorneyCoverage() {
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/attorney-coverage-check?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          const data = await res.json();
          setCoverage(data);
        } catch {
          setCoverage({ covered: false, nearestMiles: null });
        } finally {
          setChecking(false);
        }
      },
      () => {
        setChecking(false);
        setCoverage({ covered: false, nearestMiles: null });
      },
      { timeout: 8000 }
    );
  }, []);

  return { coverage, checking };
}

const emptyForm = { name: "", phone: "", email: "", firmName: "", specialty: "", notes: "", isPrimary: false };

export default function Attorneys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedState, setSelectedState] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAttorney, setSelectedAttorney] = useState<any>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTab, setCurrentTab] = useState("network");
  const [savedAttorneys, setSavedAttorneys] = useState<any[]>([]);
  const { coverage, checking: coverageChecking } = useAttorneyCoverage();

  // My Attorney state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: attorneys = [], isLoading, refetch } = useAttorneys();
  const { recommendations: recommendedAttorneys = [] } = useLocationRecommendations();

  const { data: myAttorneys = [], isLoading: myLoading } = useQuery<PersonalAttorney[]>({
    queryKey: ["/api/my-attorneys"],
    enabled: isAuthenticated && !authLoading,
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/my-attorneys", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-attorneys"] });
      setShowAddForm(false);
      setForm({ ...emptyForm });
      toast({ title: "Attorney added", description: "Your personal attorney has been saved." });
    },
    onError: () => toast({ title: "Error", description: "Failed to add attorney.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof form> }) =>
      apiRequest("PATCH", `/api/my-attorneys/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-attorneys"] });
      setEditingId(null);
      setForm({ ...emptyForm });
      toast({ title: "Updated", description: "Attorney details saved." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/my-attorneys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-attorneys"] });
      setDeletingId(null);
      toast({ title: "Removed", description: "Attorney removed from your list." });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove.", variant: "destructive" }),
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      refetch();
      fetchSavedAttorneys();
    }
  }, [isAuthenticated, authLoading, refetch]);

  const fetchSavedAttorneys = async () => {
    try {
      const response = await apiRequest("GET", "/api/attorneys/user-attorneys", { credentials: "include" });
      if (response.ok) setSavedAttorneys(await response.json());
    } catch {}
  };

  const filteredAttorneys = attorneys.filter((attorney: any) => {
    const matchesSearch =
      !searchTerm ||
      attorney.firmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attorney.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState =
      !selectedState || selectedState === "all-states" || attorney.states?.includes(selectedState);
    const matchesSpecialty =
      !selectedSpecialty || selectedSpecialty === "all-specialties" || attorney.specialty === selectedSpecialty;
    return matchesSearch && matchesState && matchesSpecialty;
  });

  const connectWithAttorney = async () => {
    if (!selectedAttorney || !connectionMessage.trim()) return;
    setIsConnecting(true);
    try {
      const response = await apiRequest("POST", "/api/attorneys/connect", {
        attorneyId: selectedAttorney.id,
        message: connectionMessage,
        credentials: "include",
      });
      if (response.ok) {
        toast({ title: "Connection Request Sent", description: `Your message has been sent to ${selectedAttorney.firmName}. They will contact you shortly.` });
        setSelectedAttorney(null);
        setConnectionMessage("");
      } else throw new Error();
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Connection Failed", description: "Failed to send your message. Please try again.", variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  const clearFilters = () => { setSearchTerm(""); setSelectedState(""); setSelectedSpecialty(""); };
  const hasActiveFilters = searchTerm || (selectedState && selectedState !== "all-states") || (selectedSpecialty && selectedSpecialty !== "all-specialties");

  const startEdit = (a: PersonalAttorney) => {
    setEditingId(a.id);
    setForm({ name: a.name, phone: a.phone || "", email: a.email || "", firmName: a.firmName || "", specialty: a.specialty || "", notes: a.notes || "", isPrimary: a.isPrimary });
    setShowAddForm(false);
  };

  const handleFormSubmit = () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Please enter the attorney's name.", variant: "destructive" });
      return;
    }
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      addMutation.mutate(form);
    }
  };

  const covered = coverage?.covered ?? false;

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen cyber-background">
        <div className="p-6">
          <TopBar
            title={t("attorneys")}
            description="Connect with verified attorneys specializing in civil rights and traffic law"
          />

          <main className="p-6">
            <div className="max-w-6xl mx-auto">

              {/* Coverage status banner */}
              {!coverageChecking && coverage && (
                covered ? (
                  <div className="bg-green-500/15 border border-green-500/40 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-green-400 font-bold text-sm">Attorney Network Active in Your Area</p>
                      <p className="text-green-200/70 text-xs mt-0.5">
                        Verified attorneys are available within 50 miles of your location. Live connections are coming very soon.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <span className="text-2xl">⚖️</span>
                    <div>
                      <p className="text-amber-400 font-bold text-sm">Attorney Network — Coming Soon
                        {coverage.nearestMiles !== null && (
                          <span className="text-amber-300/70 font-normal ml-2">
                            · Nearest attorney: {coverage.nearestMiles} miles away
                          </span>
                        )}
                      </p>
                      <p className="text-amber-200/70 text-xs mt-0.5">
                        We're actively onboarding verified civil rights attorneys. Live connections and consultations will be available very soon.
                      </p>
                    </div>
                  </div>
                )
              )}
              {coverageChecking && (
                <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm">Checking attorney coverage in your area...</p>
                </div>
              )}
              {!coverageChecking && !coverage && (
                <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <span className="text-2xl">⚖️</span>
                  <div>
                    <p className="text-amber-400 font-bold text-sm">Attorney Network — Coming Soon</p>
                    <p className="text-amber-200/70 text-xs mt-0.5">
                      We're actively onboarding verified civil rights attorneys. Live connections will be available very soon.
                    </p>
                  </div>
                </div>
              )}

              {/* Attorney Recruitment Banner */}
              <div className="cyber-card p-6 mb-6 animate-fade-in-up bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Are You a Civil Rights Attorney?</h2>
                    <p className="text-blue-100">
                      Join our network and help protect citizens' constitutional rights during police encounters.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.location.href = "/attorney-apply"}
                    className="bg-gray-900 text-white border border-white/30 hover:bg-gray-800 font-semibold shrink-0"
                  >
                    <Scale className="w-4 h-4 mr-2" />
                    Apply to Join
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
                <TabsList className="bg-gray-800/50 border border-gray-700">
                  <TabsTrigger value="network" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-gray-400">
                    <Scale className="w-4 h-4 mr-2" />
                    Network
                  </TabsTrigger>
                  <TabsTrigger value="my-attorney" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-gray-400">
                    <User className="w-4 h-4 mr-2" />
                    My Attorney
                    {myAttorneys.length > 0 && (
                      <Badge className="ml-2 bg-cyan-500/30 text-cyan-300 text-xs">{myAttorneys.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── NETWORK TAB ─────────────────────────────────────────── */}
                <TabsContent value="network" className="mt-6">
                  {/* How It Works */}
                  <div className="cyber-card p-6 mb-6 animate-fade-in-up">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-cyan-400" />
                      How Legal Protection Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { icon: <Navigation className="w-6 h-6 text-cyan-400" />, step: "1. Find Attorney", desc: "Search and connect with verified civil rights attorneys in your area" },
                        { icon: <Shield className="w-6 h-6 text-cyan-400" />, step: "2. Document Incident", desc: "Use C.A.R.E.N.™ Alert to record and document any legal encounters" },
                        { icon: <Target className="w-6 h-6 text-cyan-400" />, step: "3. Get Legal Help", desc: "Your attorney receives evidence and can provide immediate guidance" },
                      ].map(({ icon, step, desc }) => (
                        <div key={step} className="text-center">
                          <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">{icon}</div>
                          <h3 className="font-semibold text-white mb-2">{step}</h3>
                          <p className="text-gray-300 text-sm">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="cyber-card p-6 mb-6 animate-fade-in-up">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                        <Input
                          placeholder="Search attorneys by name or specialization..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500"
                        />
                      </div>
                      <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger className="w-full lg:w-48 bg-gray-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="all-states" className="text-white hover:bg-gray-700">All States</SelectItem>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.code} value={state.code} className="text-white hover:bg-gray-700">{state.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                        <SelectTrigger className="w-full lg:w-52 bg-gray-800/50 border-gray-600 text-white">
                          <SelectValue placeholder="Specialization" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="all-specialties" className="text-white hover:bg-gray-700">All Specialties</SelectItem>
                          {specialties.map((s) => (
                            <SelectItem key={s} value={s} className="text-white hover:bg-gray-700">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap bg-gray-800/50 border-gray-600 text-cyan-400 hover:bg-gray-700">
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Attorneys Grid */}
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="cyber-card p-6 animate-fade-in-up">
                          <div className="animate-pulse space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-700 rounded-full" />
                              <div className="space-y-2 flex-1">
                                <div className="h-4 bg-gray-700 rounded w-3/4" />
                                <div className="h-3 bg-gray-700 rounded w-1/2" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredAttorneys.length === 0 ? (
                    <div className="cyber-card p-12 text-center animate-fade-in-up">
                      <div className="text-gray-400 mb-4"><User className="w-12 h-12 mx-auto" /></div>
                      <h3 className="text-lg font-semibold text-white mb-2">No attorneys found</h3>
                      <p className="text-gray-400 mb-4">
                        {searchTerm || selectedState || selectedSpecialty
                          ? "Try adjusting your search criteria or filters"
                          : "No attorneys are currently available in our network."}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} className="bg-gray-800/50 border-gray-600 text-cyan-400 hover:bg-gray-700">
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredAttorneys.map((attorney: any) => (
                        <Card key={attorney.id} className="cyber-card hover:border-cyan-500/50 transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={attorney.profileImage} />
                                <AvatarFallback className="bg-cyan-500 text-white">
                                  {attorney.firmName?.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold text-white">{attorney.firmName}</h3>
                                <p className="text-sm text-gray-400">{attorney.specialty}</p>
                                {attorney.rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm text-gray-300">{attorney.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {attorney.states && (
                              <div className="mb-4">
                                <div className="flex items-center gap-1 text-sm text-gray-400">
                                  <MapPin className="w-4 h-4" />
                                  Licensed in {(() => {
                                    try {
                                      const states = Array.isArray(attorney.states) ? attorney.states : attorney.states.split(",").map((s: string) => s.trim());
                                      return states.join(", ");
                                    } catch { return attorney.states.toString(); }
                                  })()}
                                </div>
                              </div>
                            )}
                            {attorney.bio && <p className="text-sm text-gray-300 mb-4 line-clamp-3">{attorney.bio}</p>}
                            <div className="flex gap-2">
                              <Button disabled className="flex-1 bg-gray-700/50 text-amber-400 border border-amber-500/30 cursor-not-allowed opacity-80">
                                <Clock className="w-4 h-4 mr-2" />
                                Coming Soon
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ── MY ATTORNEY TAB ─────────────────────────────────────── */}
                <TabsContent value="my-attorney" className="mt-6">
                  <div className="cyber-card p-6 mb-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <User className="w-5 h-5 text-cyan-400" />
                          My Personal Attorney
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                          Already have an attorney you trust? Add them here and they'll be your first contact during any incident.
                        </p>
                      </div>
                      {!showAddForm && editingId === null && (
                        <Button
                          onClick={() => { setShowAddForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white shrink-0"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Attorney
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Add / Edit Form */}
                  {(showAddForm || editingId !== null) && (
                    <div className="cyber-card p-6 mb-6 border border-cyan-500/30 animate-fade-in-up">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">{editingId !== null ? "Edit Attorney" : "Add Your Attorney"}</h3>
                        <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setEditingId(null); setForm({ ...emptyForm }); }}>
                          <X className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300 text-sm mb-1 block">Full Name *</Label>
                          <Input
                            placeholder="e.g. Jane Smith"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm mb-1 block">Phone</Label>
                          <Input
                            placeholder="e.g. (555) 123-4567"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm mb-1 block">Email</Label>
                          <Input
                            placeholder="attorney@lawfirm.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm mb-1 block">Law Firm</Label>
                          <Input
                            placeholder="e.g. Smith & Associates"
                            value={form.firmName}
                            onChange={(e) => setForm({ ...form, firmName: e.target.value })}
                            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm mb-1 block">Specialty</Label>
                          <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                            <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                              <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {specialties.map((s) => (
                                <SelectItem key={s} value={s} className="text-white hover:bg-gray-700">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <input
                            type="checkbox"
                            id="isPrimary"
                            checked={form.isPrimary}
                            onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                            className="w-4 h-4 accent-cyan-500"
                          />
                          <Label htmlFor="isPrimary" className="text-gray-300 text-sm cursor-pointer">
                            Set as primary attorney (notified first during incidents)
                          </Label>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-gray-300 text-sm mb-1 block">Notes</Label>
                          <Textarea
                            placeholder="Any notes about this attorney, their availability, case type, etc."
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-500 resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Button
                          onClick={handleFormSubmit}
                          disabled={addMutation.isPending || updateMutation.isPending}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          {(addMutation.isPending || updateMutation.isPending) ? "Saving..." : editingId !== null ? "Save Changes" : "Add Attorney"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { setShowAddForm(false); setEditingId(null); setForm({ ...emptyForm }); }}
                          className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* My Attorneys List */}
                  {myLoading ? (
                    <div className="cyber-card p-6 animate-pulse">
                      <div className="h-16 bg-gray-700 rounded" />
                    </div>
                  ) : myAttorneys.length === 0 ? (
                    <div className="cyber-card p-12 text-center">
                      <User className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No personal attorneys added</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Add an attorney you already know and trust. They'll be available for quick contact during any incident.
                      </p>
                      <Button
                        onClick={() => { setShowAddForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your Attorney
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myAttorneys.map((a) => (
                        <Card key={a.id} className={`cyber-card transition-all duration-200 ${a.isPrimary ? "border-cyan-500/50" : ""}`}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <Avatar className="w-12 h-12 shrink-0">
                                  <AvatarFallback className="bg-cyan-800 text-white font-bold">
                                    {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-white">{a.name}</h3>
                                    {a.isPrimary && (
                                      <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Primary
                                      </Badge>
                                    )}
                                    {a.specialty && (
                                      <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">{a.specialty}</Badge>
                                    )}
                                  </div>
                                  {a.firmName && <p className="text-gray-400 text-sm mt-0.5">{a.firmName}</p>}
                                  <div className="flex flex-wrap gap-3 mt-2">
                                    {a.phone && (
                                      <a href={`tel:${a.phone}`} className="flex items-center gap-1 text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                                        <Phone className="w-3.5 h-3.5" />
                                        {a.phone}
                                      </a>
                                    )}
                                    {a.email && (
                                      <a href={`mailto:${a.email}`} className="flex items-center gap-1 text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                                        <Mail className="w-3.5 h-3.5" />
                                        {a.email}
                                      </a>
                                    )}
                                  </div>
                                  {a.notes && <p className="text-gray-400 text-xs mt-2 italic line-clamp-2">{a.notes}</p>}
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEdit(a)}
                                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeletingId(a.id)}
                                  className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Invite to network CTA */}
                  {myAttorneys.length > 0 && (
                    <div className="cyber-card p-5 mt-4 border border-blue-500/20 bg-blue-500/5">
                      <p className="text-blue-300 text-sm font-medium mb-1">Know a great civil rights attorney?</p>
                      <p className="text-gray-400 text-xs mb-3">Invite your personal attorney to join the C.A.R.E.N.™ network and help protect more people in your community.</p>
                      <Button
                        size="sm"
                        onClick={() => window.location.href = "/attorney-apply"}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        Send Them the Apply Link
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Legal Disclaimer */}
              <Card className="cyber-card mt-8 animate-fade-in-up">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Legal Disclaimer
                  </h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>C.A.R.E.N.™ Alert provides technology to connect users with independent attorneys. We do not provide legal advice.</p>
                    <p>All attorneys in our network are independently licensed professionals. Communication through our platform does not establish an attorney-client relationship until formally agreed upon by both parties.</p>
                    <p>Emergency situations requiring immediate legal assistance should contact emergency services or your local public defender's office directly.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Remove attorney?</DialogTitle>
              <DialogDescription className="text-gray-400">
                This will remove this attorney from your personal list. You can always add them back.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingId(null)} className="bg-gray-800 border-gray-600 text-gray-300">Cancel</Button>
              <Button
                onClick={() => { if (deletingId !== null) deleteMutation.mutate(deletingId); }}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending ? "Removing..." : "Remove"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <FloatingAttorneyButton />
      </div>
    </MobileResponsiveLayout>
  );
}
