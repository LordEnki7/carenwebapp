import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Globe,
  Calendar,
  MapPin,
  Smartphone,
  Mail,
  Download,
  Image,
  ExternalLink,
  Target,
  Users,
  Scale,
  TrendingUp,
} from "lucide-react";

const KEY_FACTS = [
  { label: "Founded", value: "2025" },
  { label: "HQ", value: "South Euclid, OH" },
  { label: "Product", value: "Safety + roadside documentation tech" },
  { label: "Model", value: "Subscription + hardware" },
  { label: "Legal Coverage", value: "50 states + DC, 467+ protections" },
  { label: "AI Features", value: "8 AI-powered tools" },
];

const ASSETS = [
  { name: "App Icon", desc: "1024x1024 PNG", available: true },
  { name: "Feature Graphic", desc: "1024x500 PNG", available: false },
  { name: "Activation Scene", desc: "In-app screenshot", available: false },
  { name: "Hardware Render", desc: "Product concept", available: false },
];

export default function PressKit() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">

        <div className="text-center space-y-4">
          <Badge className="bg-white/10 text-gray-300 border-white/10 text-xs uppercase tracking-widest">
            Press Kit
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">C.A.R.E.N.™</h1>
          <p className="text-gray-400 text-lg">
            Citizen Assistance for Roadside Emergencies & Navigation
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            Company Overview
          </h2>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <p className="text-gray-300 leading-relaxed text-lg">
              C.A.R.E.N.™ (Citizen Assistance for Roadside Emergencies and Navigation) is a mobile and web app designed to protect drivers during police stops by educating them on their legal rights in real-time, reducing unlawful searches, and de-escalating encounters through accessible legal support tools.
            </p>
            <p className="text-gray-400 leading-relaxed mt-4">
              The platform combines state-specific legal guidance, AI-powered voice coaching, audio/video recording, one-tap emergency alerts, and instant attorney connection into a unified mobile experience. We aim to bridge the gap between the law and the street — particularly for underserved communities disproportionately affected by traffic stops.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Founder
          </h2>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Shield className="w-8 h-8 text-gray-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Shawn Williams</h3>
                <p className="text-gray-500 text-sm">Founder & CEO</p>
                <p className="text-gray-400 leading-relaxed">
                  Mission-driven safety technology founder building tools that protect constitutional rights and save lives during critical roadside encounters. Combining deep understanding of civil rights challenges with modern technology to create an accessible protection platform for every driver.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-gray-400" />
            The Challenge
          </h2>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                <p className="text-white font-bold text-2xl">20M+</p>
                <p className="text-gray-500 text-sm">Americans stopped by police annually</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                <p className="text-white font-bold text-2xl">55,000+</p>
                <p className="text-gray-500 text-sm">Traffic stops every single day</p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                <p className="text-white font-bold text-2xl">0</p>
                <p className="text-gray-500 text-sm">Real-time legal tools available until now</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Black and Brown drivers are disproportionately stopped, searched, and arrested during traffic stops. Most drivers don't know their state-specific rights, what to say without escalating, or how to secure legal help instantly. C.A.R.E.N.™ fills that gap.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Who We Serve
          </h2>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="flex flex-wrap gap-2">
              {["BIPOC Drivers", "Rideshare & Gig Workers", "College Students", "Low-Income Communities", "Over-Policed Neighborhoods", "Activist Communities", "Veterans", "All 225M+ U.S. Licensed Drivers"].map((community) => (
                <span key={community} className="px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 text-gray-300 text-sm">
                  {community}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-400" />
            Impact Goals (First 12 Months)
          </h2>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Protect 1M+ drivers across 50 states",
                "Partner with 100+ legal aid groups",
                "Reduce unnecessary police escalations and arrests",
                "Provide free access for all public high schools and community colleges",
              ].map((goal) => (
                <div key={goal} className="flex items-start gap-3 py-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                  <span className="text-gray-300 text-sm">{goal}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-400" />
            Key Facts
          </h2>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {KEY_FACTS.map((fact) => (
                <div key={fact.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-gray-500 text-sm">{fact.label}</span>
                  <span className="text-white font-medium text-sm">{fact.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Image className="w-5 h-5 text-gray-400" />
            Brand Assets
          </h2>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ASSETS.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/5">
                  <div>
                    <p className="text-gray-300 font-medium">{asset.name}</p>
                    <p className="text-gray-600 text-xs">{asset.desc}</p>
                  </div>
                  {asset.available ? (
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 border-gray-700 text-xs">
                      Placeholder
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-4 text-center">
              High-resolution assets will be added as they become available.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-400" />
            Media Contact
          </h2>
          <div className="border border-white/10 rounded-xl bg-white/[0.02] p-6 md:p-8">
            <div className="text-center space-y-3">
              <p className="text-gray-300">For press inquiries, interviews, and media requests:</p>
              <a
                href="mailto:Press@carenapp.com"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-lg font-medium"
              >
                <Mail className="w-5 h-5" />
                Press@carenapp.com
              </a>
              <p className="text-gray-600 text-sm">
                We typically respond within 24 hours.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center pb-4">
          <p className="text-gray-700 text-xs">
            &copy; {new Date().getFullYear()} C.A.R.E.N.™ &mdash; All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
