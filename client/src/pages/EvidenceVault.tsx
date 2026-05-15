import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Shield, Lock, Upload, FileText, Share2, Trash2, ChevronLeft,
  Eye, AlertTriangle, Car, User, Zap, MapPin, Users, CheckCircle2,
  Clock, Download, X, Plus, Camera, Loader2, ShieldCheck
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface EvidenceFinding {
  id: number;
  packageId: number;
  imageUrl?: string;
  frameLabel?: string;
  category: string;
  description: string;
  confidence: string;
  details: Record<string, string>;
  createdAt: string;
}

interface EvidencePackage {
  id: number;
  userId: string;
  incidentId?: string;
  title: string;
  status: "pending" | "analyzing" | "sealed";
  sourceType: string;
  fileHash?: string;
  summary?: string;
  findingsCount: number;
  sharedWithAttorneyId?: number;
  sharedAt?: string;
  sealedAt?: string;
  createdAt: string;
  findings?: EvidenceFinding[];
}

interface Attorney { id: number; userId: string; firstName?: string; lastName?: string; barState?: string; specialties?: string[]; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  officer_id:    { label: "Officer ID",       icon: User,         color: "text-blue-300",   bg: "bg-blue-900/40 border-blue-700/50" },
  vehicle:       { label: "Vehicle / Plate",  icon: Car,          color: "text-cyan-300",   bg: "bg-cyan-900/40 border-cyan-700/50" },
  use_of_force:  { label: "Use of Force",     icon: AlertTriangle,color: "text-red-300",    bg: "bg-red-900/40 border-red-700/50" },
  weapon:        { label: "Weapon",           icon: Zap,          color: "text-orange-300", bg: "bg-orange-900/40 border-orange-700/50" },
  bystander:     { label: "Witness",          icon: Users,        color: "text-purple-300", bg: "bg-purple-900/40 border-purple-700/50" },
  environmental: { label: "Environment",      icon: MapPin,       color: "text-green-300",  bg: "bg-green-900/40 border-green-700/50" },
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-green-400 border-green-600/50 bg-green-900/30",
  medium: "text-yellow-400 border-yellow-600/50 bg-yellow-900/30",
  low: "text-gray-400 border-gray-600/50 bg-gray-800/30",
};

const TIER_LOCKED = ["basic_guard", "safety_pro", "free"];

function canAccess(tier: string, role: string) {
  if (role === "attorney" || role === "admin") return true;
  return !TIER_LOCKED.includes(tier);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generatePDF(pkg: EvidencePackage, findings: EvidenceFinding[]) {
  const lines: string[] = [];
  lines.push("C.A.R.E.N. EVIDENCE VAULT™");
  lines.push("Powered by Evidence AI™");
  lines.push("═══════════════════════════════════════════════════");
  lines.push("");
  lines.push(`EVIDENCE PACKAGE: ${pkg.title}`);
  lines.push(`Package ID: EVP-${String(pkg.id).padStart(6, "0")}`);
  lines.push(`Status: SEALED & TIMESTAMPED`);
  lines.push(`Sealed: ${pkg.sealedAt ? new Date(pkg.sealedAt).toLocaleString() : "N/A"}`);
  lines.push(`Created: ${new Date(pkg.createdAt).toLocaleString()}`);
  lines.push(`Total Findings: ${findings.length}`);
  lines.push("");
  lines.push("CHAIN OF CUSTODY");
  lines.push("───────────────────────────────────────────────────");
  lines.push(`SHA-256 Hash: ${pkg.fileHash || "N/A"}`);
  lines.push(`This hash proves the evidence has not been tampered`);
  lines.push(`with since the time of sealing.`);
  lines.push("");
  if (pkg.summary) {
    lines.push("AI SUMMARY");
    lines.push("───────────────────────────────────────────────────");
    lines.push(pkg.summary);
    lines.push("");
  }
  lines.push("FINDINGS");
  lines.push("───────────────────────────────────────────────────");
  findings.forEach((f, i) => {
    lines.push("");
    lines.push(`Finding #${i + 1} — ${CATEGORY_META[f.category]?.label || f.category}`);
    lines.push(`Source: ${f.frameLabel || "Image"}`);
    lines.push(`Confidence: ${f.confidence.toUpperCase()}`);
    lines.push(`Description: ${f.description}`);
    if (Object.keys(f.details || {}).length > 0) {
      lines.push("Details:");
      Object.entries(f.details).forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
    }
  });
  lines.push("");
  lines.push("═══════════════════════════════════════════════════");
  lines.push("Generated by C.A.R.E.N. Evidence Vault™");
  lines.push("Court-ready protection for every encounter.");
  lines.push("carenalert.com");

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evidence-vault-${pkg.id}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EvidenceVault() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const qc = useQueryClient();

  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selectedPkg, setSelectedPkg] = useState<EvidencePackage | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveFindings, setLiveFindings] = useState<EvidenceFinding[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTargetPkg, setShareTargetPkg] = useState<EvidencePackage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tier = user?.subscriptionTier || "basic_guard";
  const role = user?.role || "user";
  const hasAccess = canAccess(tier, role);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: packages = [], isLoading } = useQuery<EvidencePackage[]>({
    queryKey: ["/api/evidence/packages"],
    enabled: hasAccess,
  });

  const { data: pkgDetail } = useQuery<EvidencePackage>({
    queryKey: ["/api/evidence/packages", selectedPkg?.id],
    queryFn: () => fetch(`/api/evidence/packages/${selectedPkg!.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("sessionToken")}` }
    }).then(r => r.json()),
    enabled: !!selectedPkg?.id && view === "detail",
  });

  const { data: attorneys = [] } = useQuery<Attorney[]>({
    queryKey: ["/api/attorneys"],
    enabled: shareModalOpen,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: { title: string }) =>
      apiRequest("POST", "/api/evidence/packages", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/evidence/packages"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/evidence/packages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/evidence/packages"] });
      setView("list");
      setSelectedPkg(null);
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ pkgId, attorneyId }: { pkgId: number; attorneyId: number }) =>
      apiRequest("POST", `/api/evidence/packages/${pkgId}/share`, { attorneyId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/evidence/packages"] });
      setShareModalOpen(false);
      toast({ title: "Package shared", description: "Your attorney has been notified." });
    },
  });

  const unshareMutation = useMutation({
    mutationFn: (pkgId: number) => apiRequest("DELETE", `/api/evidence/packages/${pkgId}/share`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/evidence/packages"] }),
  });

  // ── File handling ────────────────────────────────────────────────────────
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSelectedFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }, []);

  const removeFile = (i: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Analyze ──────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!newTitle.trim()) return toast({ title: "Title required", variant: "destructive" });
    if (!selectedFiles.length) return toast({ title: "Add at least one image", variant: "destructive" });

    setIsAnalyzing(true);
    setLiveFindings([]);
    try {
      const pkg = await createMutation.mutateAsync({ title: newTitle });
      const pkgData = await pkg.json() as EvidencePackage;

      const images = await Promise.all(
        selectedFiles.map(async (f, i) => ({
          base64: await fileToBase64(f),
          label: `Image ${i + 1} — ${f.name}`,
        }))
      );

      const res = await fetch(`/api/evidence/packages/${pkgData.id}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
        body: JSON.stringify({ images }),
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json() as { package: EvidencePackage; findings: EvidenceFinding[] };

      setLiveFindings(result.findings);
      await qc.invalidateQueries({ queryKey: ["/api/evidence/packages"] });

      setTimeout(() => {
        setSelectedPkg(result.package);
        setView("detail");
        setIsAnalyzing(false);
        setNewTitle("");
        setSelectedFiles([]);
        setPreviews([]);
        toast({ title: `${result.findings.length} findings sealed`, description: "Evidence package is court-ready." });
      }, 1200);
    } catch (err: any) {
      setIsAnalyzing(false);
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
  };

  // ── Paywall ──────────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Evidence Vault™</h1>
          <p className="text-amber-400 text-sm font-medium mb-4">Powered by Evidence AI™</p>
          <p className="text-gray-400 mb-6">
            C.A.R.E.N. Evidence Vault™ transforms raw encounter footage into organized, court-ready evidence powered by AI. Available on Constitutional Pro and above.
          </p>
          <Button
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold"
            onClick={() => window.location.href = "/plans"}
          >
            Upgrade to Constitutional Pro
          </Button>
        </div>
      </div>
    );
  }

  // ── Analyzing overlay ────────────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Shield size={36} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Evidence AI™ Scanning</h2>
          <p className="text-gray-400 text-sm mb-8">Analyzing {selectedFiles.length} image{selectedFiles.length !== 1 ? "s" : ""} for court-ready evidence…</p>
          <div className="flex justify-center mb-8">
            <Loader2 size={28} className="text-amber-400 animate-spin" />
          </div>
          {liveFindings.length > 0 && (
            <div className="space-y-2 text-left max-h-64 overflow-y-auto">
              {liveFindings.map((f, i) => {
                const meta = CATEGORY_META[f.category];
                const Icon = meta?.icon || Eye;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${meta?.bg || "bg-gray-800 border-gray-700"} animate-fade-in`}>
                    <Icon size={16} className={`${meta?.color || "text-gray-300"} mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className={`text-xs font-semibold ${meta?.color || "text-gray-300"}`}>{meta?.label || f.category}</p>
                      <p className="text-xs text-gray-300 mt-0.5 line-clamp-2">{f.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (view === "detail" && selectedPkg) {
    const detail = pkgDetail || selectedPkg;
    const findings: EvidenceFinding[] = (detail as any).findings || [];

    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">

          {/* Header */}
          <button onClick={() => { setView("list"); setSelectedPkg(null); }}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <ChevronLeft size={18} /> Back to Vault
          </button>

          {/* Package card */}
          <div className="bg-gray-900 border border-amber-600/30 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={18} className="text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Evidence Vault™</span>
                </div>
                <h1 className="text-xl font-bold text-white">{detail.title}</h1>
                <p className="text-gray-500 text-xs mt-1">
                  EVP-{String(detail.id).padStart(6, "0")} · Created {new Date(detail.createdAt).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={detail.status} />
            </div>

            {/* Sealed stamp */}
            {detail.status === "sealed" && (
              <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 border-2 border-amber-500/60 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock size={18} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-300 font-bold text-sm">SEALED & TIMESTAMPED</p>
                    <p className="text-amber-400/70 text-xs">{detail.sealedAt ? new Date(detail.sealedAt).toLocaleString() : ""}</p>
                  </div>
                </div>
                {detail.fileHash && (
                  <div className="mt-3 bg-black/40 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1 font-medium">SHA-256 CHAIN OF CUSTODY</p>
                    <p className="text-green-400 text-xs font-mono break-all leading-relaxed">{detail.fileHash}</p>
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {detail.summary && (
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">{detail.summary}</p>
            )}

            {/* Shared badge */}
            {detail.sharedWithAttorneyId && (
              <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-700/40 rounded-lg px-3 py-2 mb-4">
                <Share2 size={14} className="text-purple-400" />
                <span className="text-purple-300 text-xs font-medium">Shared with your attorney</span>
                <button onClick={() => unshareMutation.mutate(detail.id)}
                  className="ml-auto text-purple-400 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => generatePDF(detail, findings)}
                className="bg-amber-600 hover:bg-amber-500 text-black font-semibold gap-1.5">
                <Download size={14} /> Export Report
              </Button>
              {!detail.sharedWithAttorneyId && (
                <Button size="sm" variant="outline"
                  className="border-purple-600/50 text-purple-300 hover:bg-purple-900/30 gap-1.5"
                  onClick={() => { setShareTargetPkg(detail); setShareModalOpen(true); }}>
                  <Share2 size={14} /> Share with Attorney
                </Button>
              )}
              <Button size="sm" variant="outline"
                className="border-red-700/40 text-red-400 hover:bg-red-900/20 gap-1.5"
                onClick={() => deleteMutation.mutate(detail.id)}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>

          {/* Findings */}
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            {findings.length} Finding{findings.length !== 1 ? "s" : ""} Identified
          </h2>
          {findings.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <Eye size={28} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No findings were identified in the analyzed images.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((f, i) => {
                const meta = CATEGORY_META[f.category];
                const Icon = meta?.icon || Eye;
                return (
                  <div key={f.id} className={`border rounded-xl p-4 ${meta?.bg || "bg-gray-800 border-gray-700"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={meta?.color || "text-gray-300"} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${meta?.color || "text-gray-300"}`}>
                          {meta?.label || f.category}
                        </span>
                        {f.frameLabel && (
                          <span className="text-gray-500 text-xs">· {f.frameLabel}</span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CONFIDENCE_COLOR[f.confidence] || CONFIDENCE_COLOR.low}`}>
                        {f.confidence}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{f.description}</p>
                    {Object.keys(f.details || {}).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(f.details).map(([k, v]) => (
                          <span key={k} className="text-xs bg-black/30 text-gray-300 px-2 py-0.5 rounded-md border border-white/10">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          pkg={shareTargetPkg}
          attorneys={attorneys}
          onShare={(attyId) => shareTargetPkg && shareMutation.mutate({ pkgId: shareTargetPkg.id, attorneyId: attyId })}
          isPending={shareMutation.isPending}
        />
      </div>
    );
  }

  // ── Create view ──────────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
          <button onClick={() => { setView("list"); setSelectedFiles([]); setPreviews([]); setNewTitle(""); }}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <ChevronLeft size={18} /> Back to Vault
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">New Evidence Package</h1>
              <p className="text-amber-400 text-xs font-medium">Powered by Evidence AI™</p>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Package Title</label>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Traffic stop — May 14, 2026"
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 focus:border-amber-500"
            />
          </div>

          {/* Upload zone */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Photos / Screenshots ({selectedFiles.length} selected)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 hover:border-amber-600/60 rounded-xl p-8 text-center cursor-pointer transition-colors group"
            >
              <Camera size={32} className="text-gray-600 group-hover:text-amber-500 mx-auto mb-3 transition-colors" />
              <p className="text-gray-400 text-sm font-medium group-hover:text-gray-300">Tap to add photos</p>
              <p className="text-gray-600 text-xs mt-1">Encounter photos, screenshots, screenshots from video</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={!newTitle.trim() || !selectedFiles.length}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 gap-2 disabled:opacity-40"
          >
            <Shield size={18} />
            Analyze with Evidence AI™
          </Button>
          <p className="text-center text-gray-600 text-xs mt-3">
            Images are analyzed and the package is permanently sealed with a tamper-evident hash.
          </p>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center">
              <Lock size={24} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Evidence Vault™</h1>
              <p className="text-amber-400 text-xs font-medium">Powered by Evidence AI™</p>
            </div>
          </div>
          <Button
            onClick={() => setView("create")}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-1.5"
            size="sm"
          >
            <Plus size={16} /> New Package
          </Button>
        </div>

        {/* Tagline */}
        <div className="bg-gradient-to-r from-amber-950/60 to-gray-900 border border-amber-700/30 rounded-xl p-4 mb-6">
          <p className="text-amber-100 text-sm font-medium leading-relaxed">
            Court-ready protection for every encounter. Evidence AI™ analyzes your footage, categorizes findings, and seals packages with a tamper-evident chain of custody.
          </p>
        </div>

        {/* Package list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="text-amber-400 animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-gray-700" />
            </div>
            <p className="text-gray-400 font-medium mb-1">No sealed packages yet</p>
            <p className="text-gray-600 text-sm mb-6">Create a package from your incident photos to get started.</p>
            <Button onClick={() => setView("create")}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2">
              <Plus size={16} /> Create First Package
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => { setSelectedPkg(pkg); setView("detail"); }}
                className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-amber-700/40 rounded-xl p-4 text-left transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white truncate">{pkg.title}</p>
                      {pkg.sharedWithAttorneyId && (
                        <Share2 size={13} className="text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">
                      EVP-{String(pkg.id).padStart(6, "0")} · {new Date(pkg.createdAt).toLocaleDateString()}
                    </p>
                    {pkg.summary && (
                      <p className="text-gray-400 text-xs mt-1 line-clamp-1">{pkg.summary}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3">
                    <StatusBadge status={pkg.status} />
                    {pkg.status === "sealed" && (
                      <span className="text-xs text-amber-400/70 font-medium">{pkg.findingsCount} finding{pkg.findingsCount !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "sealed") return (
    <Badge className="bg-green-900/40 text-green-300 border-green-700/50 gap-1 text-xs">
      <Lock size={10} /> Sealed
    </Badge>
  );
  if (status === "analyzing") return (
    <Badge className="bg-amber-900/40 text-amber-300 border-amber-700/50 gap-1 text-xs">
      <Loader2 size={10} className="animate-spin" /> Analyzing
    </Badge>
  );
  return (
    <Badge className="bg-gray-800 text-gray-400 border-gray-700 gap-1 text-xs">
      <Clock size={10} /> Pending
    </Badge>
  );
}

function ShareModal({ open, onClose, pkg, attorneys, onShare, isPending }: {
  open: boolean; onClose: () => void; pkg: EvidencePackage | null;
  attorneys: Attorney[]; onShare: (id: number) => void; isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-purple-700/40 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Share2 size={18} className="text-purple-400" />
            Share with Attorney
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            Choose an attorney to share <span className="text-white font-medium">"{pkg?.title}"</span> with. They will be able to view and export this evidence package from their portal.
          </p>
          <div className="bg-amber-950/30 border border-amber-700/30 rounded-lg p-3">
            <p className="text-amber-300 text-xs font-medium flex items-center gap-2">
              <Lock size={12} /> You remain in control — you can revoke access at any time.
            </p>
          </div>
          {attorneys.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No connected attorneys found.</p>
              <Button size="sm" variant="link" className="text-purple-400 mt-1" onClick={() => window.location.href = "/attorneys"}>
                Find an Attorney
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {attorneys.map((a: any) => (
                <button
                  key={a.id}
                  disabled={isPending}
                  onClick={() => onShare(a.id)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-purple-900/30 border border-gray-700 hover:border-purple-600/50 rounded-lg transition-all text-left disabled:opacity-50"
                >
                  <div className="w-9 h-9 bg-purple-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{a.firstName} {a.lastName}</p>
                    <p className="text-gray-500 text-xs">{a.barState} · {a.specialties?.[0] || "Attorney"}</p>
                  </div>
                  {isPending ? <Loader2 size={14} className="ml-auto text-purple-400 animate-spin" /> : <Share2 size={14} className="ml-auto text-gray-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
