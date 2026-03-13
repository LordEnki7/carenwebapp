import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  TrendingUp,
  DollarSign,
  Target,
  FileText,
  Download,
  CheckCircle2,
  Globe,
  Users,
  Smartphone,
  Car,
  ArrowRight,
  Megaphone,
  Building,
  GraduationCap,
} from "lucide-react";

const PRICING_TIERS = [
  { name: "Basic Guard", price: "$1", period: "one-time", color: "text-gray-300" },
  { name: "Safety Pro", price: "$4.99/mo", period: "monthly", color: "text-cyan-400" },
  { name: "Constitutional Pro", price: "$9.99/mo", period: "monthly", color: "text-purple-400" },
  { name: "Family Protection", price: "$24.99/mo", period: "monthly", color: "text-green-400" },
  { name: "Enterprise Fleet", price: "$49.99/mo", period: "monthly", color: "text-amber-400" },
];

const TRACTION_ITEMS = [
  { text: "1,000+ early access sign-ups", done: true },
  { text: "3-state legal partner pilot underway", done: true },
  { text: "Provisional patent filed", done: true },
  { text: "Trademark pending", done: true },
  { text: "467+ legal protections across 50 states built", done: true },
  { text: "8 AI-powered features live", done: true },
  { text: "PWA + mobile app architecture complete", done: true },
  { text: "Hardware roadmap developed", done: true },
  { text: "Strong interest from rideshare drivers & civil rights orgs", done: true },
  { text: "Grant submissions to DOJ, Ford Foundation, Knight Foundation", done: true },
];

const USE_OF_FUNDS = [
  { label: "Engineering & Product", pct: "40%", desc: "Native app development, AI improvements, hardware integration" },
  { label: "Legal & IP", pct: "15%", desc: "Patent prosecution, trademark registration, legal database expansion" },
  { label: "Marketing & Growth", pct: "20%", desc: "User acquisition, partnerships, influencer outreach" },
  { label: "Operations", pct: "15%", desc: "Infrastructure, compliance, team building" },
  { label: "Reserve", pct: "10%", desc: "Working capital and contingency" },
];

const DOCS = [
  { name: "Investor Deck", icon: FileText, status: "available" as const },
  { name: "SAFE Agreement", icon: FileText, status: "available" as const },
  { name: "Equity Agreement", icon: FileText, status: "coming_soon" as const },
  { name: "Cap Table Summary", icon: FileText, status: "coming_soon" as const },
];

export default function InvestorPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (password === "CAREN2025") {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password. Contact the team for access.");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/[0.03] border-white/10 backdrop-blur-xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Lock className="w-7 h-7 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Investor Access</h1>
              <p className="text-gray-500 text-sm">
                This page contains confidential information. Enter the access code to continue.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Access code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/[0.05] border-white/10 text-white placeholder:text-gray-600 text-center text-lg tracking-widest"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10">
                Enter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">

        <div className="text-center space-y-4">
          <p className="text-gray-500 text-sm uppercase tracking-widest">Confidential</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">C.A.R.E.N.™</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Citizen Assistance for Roadside Emergencies & Navigation
          </p>
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-white">Executive Snapshot</h2>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8 space-y-5">
            <p className="text-gray-300 leading-relaxed text-lg">
              C.A.R.E.N.™ is a GPS-enabled legal protection platform that gives drivers real-time, state-specific legal rights information during police encounters, with AI-powered voice coaching, emergency documentation, and coordinated family notification — delivered through a mobile app and future hardware accessory.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Addressable</p>
                <p className="text-white font-semibold text-lg">225M+</p>
                <p className="text-gray-500 text-xs">Licensed U.S. drivers</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Daily Opportunity</p>
                <p className="text-white font-semibold text-lg">55,000+</p>
                <p className="text-gray-500 text-xs">Police stops per day (20M/yr)</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Legal Tech Market</p>
                <p className="text-white font-semibold text-lg">$3.2B</p>
                <p className="text-gray-500 text-xs">Growing 6.4% CAGR</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Current Raise</p>
                <p className="text-white font-semibold text-lg">$250K</p>
                <p className="text-gray-500 text-xs">Pre-seed round</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-white">Traction</h2>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TRACTION_ITEMS.map((item) => (
                <div key={item.text} className="flex items-start gap-3 py-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-white">Financial Snapshot</h2>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Pricing Tiers</h3>
              <div className="flex flex-wrap gap-3">
                {PRICING_TIERS.map((tier) => (
                  <div key={tier.name} className="px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className={`font-semibold ${tier.color}`}>{tier.name}</span>
                    <span className="text-gray-500 text-sm ml-2">{tier.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Year 3 Projection</p>
                <p className="text-white font-semibold text-2xl">$2.4M ARR</p>
                <p className="text-gray-500 text-xs">Based on 10K paid subscribers</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Global Potential</p>
                <p className="text-white font-semibold text-2xl">$10M+ ARR</p>
                <p className="text-gray-500 text-xs">International expansion by Year 5</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Exit Potential</p>
                <p className="text-white font-semibold text-2xl">Strategic</p>
                <p className="text-gray-500 text-xs">Acquisition by safety / insurance co.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-white">The Ask</h2>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Raising</h3>
                <p className="text-3xl font-bold text-white">$250K – $500K</p>
                <p className="text-gray-400 mt-1">Pre-seed round via SAFE / equity</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Use of Funds</h3>
                <div className="space-y-2.5">
                  {USE_OF_FUNDS.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-300 text-sm">{item.label}</span>
                        <p className="text-gray-600 text-xs">{item.desc}</p>
                      </div>
                      <span className="text-white font-semibold text-sm ml-4">{item.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-white">Go-to-Market Strategy</h2>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-white font-medium">Product Hunt Launch</h4>
                </div>
                <p className="text-gray-500 text-sm">Day-one launch campaign targeting tech-forward early adopters and safety-conscious drivers</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <h4 className="text-white font-medium">Legal Aid Partnerships</h4>
                </div>
                <p className="text-gray-500 text-sm">Civil rights organizations, legal aid groups, and ACLU chapters for distribution and credibility</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-green-400" />
                  <h4 className="text-white font-medium">Campus Pilot Programs</h4>
                </div>
                <p className="text-gray-500 text-sm">Free access for public high schools and community colleges — building lifetime users early</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-400" />
                  <h4 className="text-white font-medium">Institutional Licensing</h4>
                </div>
                <p className="text-gray-500 text-sm">Schools, unions, rideshare companies, and insurance providers as B2B channel</p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">PR Targets</p>
              <p className="text-gray-400 text-sm">TechCrunch, AfroTech, TheGrio, influencer and podcast marketing, social media virality campaign</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-white">Documents</h2>
          </div>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DOCS.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-3">
                    <doc.icon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300">{doc.name}</span>
                  </div>
                  {doc.status === "available" ? (
                    <Badge className="bg-white/10 text-gray-400 border-white/10 text-xs">
                      Upload Pending
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 border-gray-700 text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-4 text-center">
              Documents will be available for download once uploaded by the team.
            </p>
          </div>
        </section>

        <div className="text-center space-y-3 pt-8 pb-4 border-t border-white/5">
          <p className="text-gray-500 text-sm">
            For inquiries, contact the team directly.
          </p>
          <p className="text-gray-700 text-xs">
            This information is confidential and intended solely for prospective investors.
          </p>
        </div>
      </div>
    </div>
  );
}
