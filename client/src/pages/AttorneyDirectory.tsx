import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Phone, Globe, Star, Zap, Search, MapPin, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const AVAILABILITY_COLORS: Record<string, string> = {
  available: "bg-green-500/20 text-green-400 border-green-500/30",
  busy: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  offline: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  emergency_only: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AttorneyDirectory() {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams();
  if (selectedState) params.set("state", selectedState);
  if (search) params.set("search", search);

  const { data: attorneys = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/attorneys/directory", selectedState, search],
    queryFn: async () => {
      const res = await fetch(`/api/attorneys/directory?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load attorneys");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 md:p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-7 h-7 text-cyan-400" />
            <h1 className="text-2xl md:text-3xl font-black text-white">C.A.R.E.N. Legal Network</h1>
          </div>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Verified attorneys across the country ready to assist C.A.R.E.N. members. Filter by state or search by name or firm.
          </p>
        </div>

        {/* Search + Filter Bar */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, firm, or state…"
                className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-white/20 text-white hover:bg-white/10 gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          {showFilters && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-2 block">Filter by State</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedState("")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${!selectedState ? "bg-cyan-500 text-black border-cyan-500" : "border-white/20 text-gray-400 hover:border-white/40"}`}
                  >
                    All States
                  </button>
                  {US_STATES.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedState(selectedState === s ? "" : s)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${selectedState === s ? "bg-cyan-500 text-black border-cyan-500" : "border-white/20 text-gray-400 hover:border-white/40"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            {isLoading ? "Loading…" : `${attorneys.length} attorney${attorneys.length !== 1 ? "s" : ""} found${selectedState ? ` in ${selectedState}` : ""}`}
          </p>
          {(search || selectedState) && (
            <button onClick={() => { setSearch(""); setSelectedState(""); }} className="text-cyan-400 text-xs hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {/* Attorney Cards */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse border border-white/10" />
            ))}
          </div>
        ) : attorneys.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center space-y-3">
              <Shield className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-white font-semibold">No attorneys found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or removing filters. More attorneys are joining the network daily.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {attorneys.map((attorney: any) => {
              const specialties = Array.isArray(attorney.specialties) ? attorney.specialties : [];
              const languages = Array.isArray(attorney.languages) ? attorney.languages : ["English"];
              return (
                <Card key={attorney.id} className="bg-white/5 border-white/10 hover:border-cyan-500/40 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-white font-bold text-base">
                            {attorney.firstName} {attorney.lastName}
                          </h3>
                          {attorney.emergencyAvailable && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-xs gap-1">
                              <Zap className="w-2.5 h-2.5" /> Emergency
                            </Badge>
                          )}
                          <Badge className={`border text-xs ${AVAILABILITY_COLORS[attorney.availabilityStatus] || AVAILABILITY_COLORS.offline}`}>
                            {attorney.availabilityStatus?.replace("_", " ") || "Offline"}
                          </Badge>
                        </div>
                        <p className="text-cyan-400 text-sm font-medium mb-1">{attorney.firmName}</p>
                        <div className="flex items-center gap-3 text-gray-400 text-xs mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {attorney.barState}
                          </span>
                          {attorney.yearsExperience && (
                            <span>{attorney.yearsExperience}+ yrs experience</span>
                          )}
                          {attorney.consultationType && (
                            <span className={attorney.consultationType === "free" ? "text-green-400 font-semibold" : ""}>
                              {attorney.consultationType === "free" ? "Free Consultation" : "Paid Consultation"}
                            </span>
                          )}
                        </div>

                        {specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {specialties.slice(0, 4).map((s: string, i: number) => (
                              <span key={i} className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                                {s}
                              </span>
                            ))}
                            {specialties.length > 4 && (
                              <span className="text-xs text-gray-500">+{specialties.length - 4} more</span>
                            )}
                          </div>
                        )}

                        {attorney.bio && (
                          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">{attorney.bio}</p>
                        )}

                        <div className="flex items-center gap-3 flex-wrap">
                          {attorney.phone && (
                            <a href={`tel:${attorney.phone}`} className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-medium">
                              <Phone className="w-3 h-3" /> {attorney.phone}
                            </a>
                          )}
                          {attorney.firmWebsite && (
                            <a href={attorney.firmWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-medium">
                              <Globe className="w-3 h-3" /> Website
                            </a>
                          )}
                          {languages.length > 1 && (
                            <span className="text-gray-500 text-xs">🌐 {languages.join(", ")}</span>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      {parseFloat(attorney.rating || "0") > 0 && (
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-white font-bold text-sm">{parseFloat(attorney.rating).toFixed(1)}</span>
                          </div>
                          <span className="text-gray-500 text-xs">{attorney.reviewCount} reviews</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Are you an attorney? */}
        <Card className="bg-cyan-900/20 border-cyan-500/30">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Are you an attorney?</p>
              <p className="text-gray-400 text-sm">Join the C.A.R.E.N. Legal Network and connect with drivers who need your help.</p>
            </div>
            <Link href="/attorney-application">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex-shrink-0">
                Apply Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Link href="/">
          <Button variant="ghost" className="text-gray-400 hover:text-white w-full">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
