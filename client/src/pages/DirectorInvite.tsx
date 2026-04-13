import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react";

const CONTRACT_TEXT = `REGIONAL DIRECTOR INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is entered into between C.A.R.E.N.™ ALERT ("Company") and the individual identified as Regional Director ("Director"), effective upon the date of electronic signature below.

1. INDEPENDENT CONTRACTOR STATUS
Director is an independent contractor, not an employee, agent, or partner of C.A.R.E.N.™ ALERT. Director has no authority to bind the Company to any contract, obligation, or liability.

2. SCOPE OF DUTIES
Director agrees to promote C.A.R.E.N.™ ALERT subscriptions and services within their assigned territory, recruit new subscribers using their unique Director Code, and maintain professional conduct representing the brand.

3. COMPENSATION
Director earns commission on paid subscriptions generated through their Director Code, at the rate corresponding to their Director level:
- Regional Director: 20% | Senior Director: 25% | State Director: 30% | National Director: 35%
Commissions are paid monthly for the prior month's verified subscriptions. Minimum payout threshold: $25.

4. CONFIDENTIALITY
Director agrees to keep all proprietary business information, pricing, internal systems, and subscriber data strictly confidential during and after this Agreement.

5. TERM & TERMINATION
This Agreement is at-will and may be terminated by either party with 14 days written notice. C.A.R.E.N.™ ALERT reserves the right to immediately terminate for cause, including fraud, misrepresentation, or breach of this Agreement.

6. NO GUARANTEE OF EARNINGS
Director acknowledges that commission income depends on individual effort and market conditions. No income guarantees are made or implied.

7. INTELLECTUAL PROPERTY
All C.A.R.E.N.™ ALERT branding, materials, and systems remain the sole property of the Company. Director may not create unauthorized branded materials.

8. GOVERNING LAW
This Agreement is governed by the laws of the State of Texas.

By typing your full legal name below, you confirm you have read, understood, and agree to this Agreement.`;

export default function DirectorInvite() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [contractAgreed, setContractAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [done, setDone] = useState(false);

  const { data: invite, isLoading, error } = useQuery<{ name: string; email: string; directorCode: string; territory: string }>({
    queryKey: ["/api/director/invite", token],
    queryFn: async () => {
      const res = await fetch(`/api/director/invite/${token}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Invalid link"); }
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) throw new Error("PIN must be exactly 6 digits");
      if (pin !== pinConfirm) throw new Error("PINs do not match");
      if (!contractAgreed) throw new Error("You must agree to the contract");
      if (!signature.trim()) throw new Error("Please type your full legal name to sign");

      const res = await fetch(`/api/director/invite/${token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, phone, bio, experience, referralSource, linkedinUrl, contractSignature: signature.trim() }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to complete registration"); }
      return res.json();
    },
    onSuccess: () => setDone(true),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );

  if (error || !invite) return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/5 border-red-500/30">
        <CardContent className="p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-white font-bold text-xl">Invalid or Expired Link</h2>
          <p className="text-gray-400 text-sm">{(error as any)?.message || "This invite link is invalid or has expired. Please contact your C.A.R.E.N.™ administrator to request a new invite."}</p>
        </CardContent>
      </Card>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-to-br from-green-900/30 to-cyan-900/20 border-green-500/40">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
          <h2 className="text-white font-bold text-2xl">You're All Set!</h2>
          <p className="text-gray-300 text-sm">Welcome to the C.A.R.E.N.™ Regional Director Network, {invite.name}!</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-1">
            <p className="text-gray-500 text-xs">Your Director Code</p>
            <p className="text-cyan-400 font-bold text-xl tracking-widest">{invite.directorCode}</p>
          </div>
          <p className="text-gray-400 text-sm">Log in to your Director Portal using your email and the PIN you just set.</p>
          <Button onClick={() => navigate("/director-portal")}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
            Go to My Portal →
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-start p-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-7 h-7 text-cyan-400" />
          <h1 className="text-2xl font-black text-white tracking-tight">C.A.R.E.N.™ ALERT</h1>
        </div>
        <p className="text-cyan-400 text-sm font-semibold">Regional Director Onboarding</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
              s < step ? "bg-cyan-500 border-cyan-500 text-black" :
              s === step ? "bg-transparent border-cyan-400 text-cyan-400" :
              "bg-transparent border-white/20 text-gray-600"
            }`}>
              {s < step ? "✓" : s}
            </div>
            {s < 3 && <div className={`w-10 h-0.5 ${s < step ? "bg-cyan-500" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <Card className="w-full max-w-lg bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">
            {step === 1 && `Welcome, ${invite.name}!`}
            {step === 2 && "Review & Sign Contract"}
            {step === 3 && "Set Your Portal PIN"}
          </CardTitle>
          <p className="text-gray-500 text-xs">
            {step === 1 && "Confirm your details and tell us a little about yourself."}
            {step === 2 && "Please read the Director Agreement carefully before signing."}
            {step === 3 && "Create a 6-digit PIN to log into your Director Portal."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">

          {/* STEP 1: Profile info */}
          {step === 1 && (
            <>
              <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Invited as</p>
                <p className="text-white font-semibold">{invite.name}</p>
                <p className="text-gray-400 text-xs">{invite.email}</p>
                {invite.territory && <p className="text-cyan-400 text-xs mt-1">Territory: {invite.territory}</p>}
                <p className="text-cyan-400 text-xs font-bold mt-1">Director Code: {invite.directorCode}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Phone Number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-600" />
              </div>

              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">How did you hear about us?</Label>
                <Input value={referralSource} onChange={e => setReferralSource(e.target.value)} placeholder="Friend, social media, event..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-600" />
              </div>

              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Sales / Network Marketing Experience (optional)</Label>
                <Textarea value={experience} onChange={e => setExperience(e.target.value)} placeholder="Brief background in sales or community outreach..."
                  rows={2} className="bg-white/5 border-white/20 text-white placeholder:text-gray-600 resize-none" />
              </div>

              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">LinkedIn URL (optional)</Label>
                <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-600" />
              </div>

              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Short Bio (optional)</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="A few sentences about yourself..."
                  rows={2} className="bg-white/5 border-white/20 text-white placeholder:text-gray-600 resize-none" />
              </div>

              <Button onClick={() => setStep(2)} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                Next: Review Contract →
              </Button>
            </>
          )}

          {/* STEP 2: Contract */}
          {step === 2 && (
            <>
              <div className="h-64 overflow-y-auto bg-black/30 border border-white/10 rounded-lg p-4 text-xs text-gray-400 whitespace-pre-wrap leading-relaxed font-mono">
                {CONTRACT_TEXT}
              </div>

              <div className="flex items-start gap-3 pt-1">
                <Checkbox id="agree" checked={contractAgreed} onCheckedChange={v => setContractAgreed(!!v)}
                  className="mt-0.5 border-cyan-500/40 data-[state=checked]:bg-cyan-500" />
                <label htmlFor="agree" className="text-gray-300 text-xs leading-relaxed cursor-pointer">
                  I have read and agree to the Regional Director Independent Contractor Agreement in its entirety.
                </label>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Electronic Signature — type your full legal name</Label>
                <Input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Your Full Legal Name"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-600 font-serif italic text-base" />
                <p className="text-gray-600 text-xs">By typing your name, you are signing this agreement electronically.</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}
                  className="flex-1 border-white/20 text-gray-400 hover:bg-white/5">← Back</Button>
                <Button onClick={() => {
                  if (!contractAgreed) { toast({ title: "Please check the agreement box", variant: "destructive" }); return; }
                  if (!signature.trim()) { toast({ title: "Please type your full legal name", variant: "destructive" }); return; }
                  setStep(3);
                }} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                  Next: Set PIN →
                </Button>
              </div>
            </>
          )}

          {/* STEP 3: PIN */}
          {step === 3 && (
            <>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Create a 6-digit PIN</Label>
                <Input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••" maxLength={6}
                  className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-widest letter-spacing-4 placeholder:text-gray-600" />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400 text-xs">Confirm PIN</Label>
                <Input type="password" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••" maxLength={6}
                  className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-widest placeholder:text-gray-600" />
              </div>
              {pin && pinConfirm && pin !== pinConfirm && (
                <p className="text-red-400 text-xs">PINs do not match</p>
              )}
              <p className="text-gray-500 text-xs">Remember this PIN — you'll use it every time you log into your Director Portal.</p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}
                  className="flex-1 border-white/20 text-gray-400 hover:bg-white/5">← Back</Button>
                <Button
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending || pin.length !== 6 || pin !== pinConfirm}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold">
                  {completeMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Complete Setup ✓"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
