import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Shield, MapPin, User, Instagram, ChevronRight, ChevronLeft, CheckCircle, FileText, PenLine } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington D.C."
];

const CONTRACT_TEXT = `C.A.R.E.N. REGIONAL DIRECTOR INDEPENDENT CONTRACTOR AGREEMENT
Version 1.0 — 2025

This Independent Contractor Agreement ("Agreement") is entered into between C.A.R.E.N. LLC ("Company") and the undersigned applicant ("Regional Director").

1. INDEPENDENT CONTRACTOR STATUS
The Regional Director is an independent contractor, not an employee. Nothing in this Agreement creates a partnership, joint venture, employment, or agency relationship. The Regional Director is solely responsible for their own taxes, insurance, and business expenses.

2. SCOPE OF SERVICES
The Regional Director agrees to:
  a) Promote the C.A.R.E.N. platform within their assigned territory
  b) Recruit and assist with onboarding of new subscribers
  c) Build relationships with local attorneys, community organizations, and civic groups
  d) Represent C.A.R.E.N. professionally and in accordance with Company guidelines
  e) Attend virtual team meetings and training sessions as scheduled

3. COMMISSION STRUCTURE
  • Regional Director (Level 1): 20% commission on referred subscriptions
  • Senior Director (Level 2): 25% commission on referred subscriptions
  • State Director (Level 3): 30% commission on referred subscriptions
  • National Director (Level 4): 35% commission on referred subscriptions
Commissions are paid monthly for active, paying subscribers referred by the Director's unique code. Commissions are not paid for cancelled or refunded subscriptions.

4. ATTORNEY NETWORK (CLAN)
The Regional Director may assist in recruiting attorneys to the C.A.R.E.N. Legal Access Network (CLAN). C.A.R.E.N. is NOT a law firm. Directors may NOT promise legal representation, recommend specific attorneys, or engage in fee-sharing arrangements. The CLAN is a directory service only. Attorneys keep 100% of their fees.

5. CODE OF CONDUCT
The Regional Director agrees to:
  a) NOT make false or misleading claims about C.A.R.E.N.'s services
  b) NOT engage in discriminatory, harassing, or unethical conduct
  c) NOT share confidential Company information with third parties
  d) Comply with all applicable federal, state, and local laws
  e) Immediately notify the Company of any conflicts of interest

6. CONFIDENTIALITY
All proprietary information, pricing, business strategy, user data, and internal processes shared with the Regional Director are strictly confidential and may not be disclosed to any third party without prior written consent from C.A.R.E.N. LLC.

7. TERMINATION
Either party may terminate this Agreement with 14 days written notice. The Company may terminate immediately for cause, including but not limited to: fraud, misconduct, breach of this Agreement, or failure to perform duties. Upon termination, the Director's access to the portal and unique referral code will be deactivated.

8. NO GUARANTEE OF INCOME
C.A.R.E.N. makes no guarantee of income or earnings. Commission income depends entirely on the Director's effort, market conditions, and subscriber retention.

9. INTELLECTUAL PROPERTY
All C.A.R.E.N. branding, logos, marketing materials, and content remain the sole property of C.A.R.E.N. LLC. Directors may use approved materials only. Unauthorized use of Company trademarks is prohibited.

10. GOVERNING LAW
This Agreement is governed by the laws of the State of Georgia. Any disputes shall be resolved through binding arbitration in Atlanta, Georgia.

BY TYPING YOUR FULL LEGAL NAME BELOW, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THE TERMS OF THIS AGREEMENT. YOUR TYPED NAME CONSTITUTES YOUR ELECTRONIC SIGNATURE.`;

const schema = z.object({
  name: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone number required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  background: z.string().min(20, "Please tell us more about yourself (20+ characters)"),
  socialLinks: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const steps = ["Your Info", "Your Region", "Your Story", "Sign Agreement"];

export default function DirectorApply() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contractAgreed, setContractAgreed] = useState(false);
  const [contractSignature, setContractSignature] = useState("");
  const [signatureError, setSignatureError] = useState("");
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", city: "", state: "", background: "", socialLinks: "" },
  });

  const nextStep = async () => {
    const fields: (keyof FormData)[][] = [
      ["name", "email", "phone"],
      ["city", "state"],
      ["background"],
    ];
    const valid = await form.trigger(fields[step]);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    setSignatureError("");
    if (!contractAgreed) {
      setSignatureError("You must check the agreement box before signing.");
      return;
    }
    if (!contractSignature.trim() || contractSignature.trim().length < 2) {
      setSignatureError("Please type your full legal name as your electronic signature.");
      return;
    }
    if (contractSignature.trim().toLowerCase() !== data.name.trim().toLowerCase()) {
      setSignatureError("Your signature must match the full name you entered on Step 1.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/director/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, contractSignature: contractSignature.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-cyan-500/20 border-2 border-cyan-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Application & Agreement Received</h1>
          <p className="text-gray-300 leading-relaxed">
            Your application and signed agreement are on file. We review every application personally.
            Shawn will reach out to you directly within 48–72 hours with next steps and your Director Portal credentials.
          </p>
          <div className="bg-white/5 border border-cyan-500/30 rounded-xl p-4 text-left space-y-1">
            <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide mb-2">What happens next:</p>
            <p className="text-gray-300 text-sm">✅ Application received & stored</p>
            <p className="text-gray-300 text-sm">✅ Contract signed electronically</p>
            <p className="text-gray-300 text-sm">⏳ Admin review (48–72 hrs)</p>
            <p className="text-gray-300 text-sm">📧 You'll receive your Director PIN via email</p>
            <p className="text-gray-300 text-sm">🚀 Access your Director Portal to start earning</p>
          </div>
          <p className="text-cyan-400 font-semibold text-sm">— Shawn Williams, Founder, C.A.R.E.N.</p>
          <Link href="/">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
              Return to App
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 p-6">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3 pt-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-400/50 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Become a Regional Director</h1>
          <p className="text-gray-400">
            You're not just promoting an app — you're building the first line of defense in your city.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? "bg-cyan-500 text-black" :
                i === step ? "bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400" :
                "bg-white/10 text-gray-500"
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? "text-cyan-400" : "text-gray-500"}`}>{label}</span>
              {i < steps.length - 1 && <div className={`w-6 h-0.5 ${i < step ? "bg-cyan-500" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* Step 0: Personal Info */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" /> Personal Information
                  </h2>
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Full Legal Name</FormLabel>
                      <FormControl><Input {...field} placeholder="First Last" className="bg-white/5 border-white/20 text-white placeholder:text-gray-500" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email Address</FormLabel>
                      <FormControl><Input {...field} type="email" placeholder="you@example.com" className="bg-white/5 border-white/20 text-white placeholder:text-gray-500" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Phone Number</FormLabel>
                      <FormControl><Input {...field} type="tel" placeholder="+1 (555) 000-0000" className="bg-white/5 border-white/20 text-white placeholder:text-gray-500" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* Step 1: Region */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" /> Your Territory
                  </h2>
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">City</FormLabel>
                      <FormControl><Input {...field} placeholder="Los Angeles" className="bg-white/5 border-white/20 text-white placeholder:text-gray-500" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">State</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800 border-white/20 text-white">
                            <SelectValue placeholder="Select your state…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-800 border-white/20 max-h-60">
                          {US_STATES.map(s => (
                            <SelectItem key={s} value={s} className="text-white focus:bg-cyan-500/20">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* Step 2: Background */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-cyan-400" /> Your Story
                  </h2>
                  <FormField control={form.control} name="background" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Why do you want to represent C.A.R.E.N. in your city?</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={5} placeholder="Tell us about yourself, your community connections, and why this mission matters to you…"
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="socialLinks" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Social Media Links <span className="text-gray-500 font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} placeholder="Instagram: @yourhandle&#10;LinkedIn: linkedin.com/in/you"
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* Step 3: Sign Agreement */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" /> Regional Director Agreement
                  </h2>
                  <p className="text-gray-400 text-sm">Please read the full agreement below before signing. This is a legally binding document.</p>

                  {/* Contract Text */}
                  <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 h-72 overflow-y-auto">
                    <pre className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {CONTRACT_TEXT}
                    </pre>
                  </div>

                  {/* Agreement Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                      onClick={() => setContractAgreed(v => !v)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        contractAgreed ? "bg-cyan-500 border-cyan-500" : "border-white/30 bg-white/5 group-hover:border-cyan-400"
                      }`}
                    >
                      {contractAgreed && <CheckCircle className="w-3 h-3 text-black" />}
                    </div>
                    <span className="text-gray-300 text-sm leading-snug">
                      I have read, understood, and agree to the C.A.R.E.N. Regional Director Independent Contractor Agreement (v1.0-2025). I understand I am an independent contractor and not an employee.
                    </span>
                  </label>

                  {/* Signature Field */}
                  <div>
                    <label className="text-gray-300 text-sm font-medium block mb-1.5 flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-cyan-400" />
                      Electronic Signature — Type your full legal name exactly as entered on Step 1
                    </label>
                    <Input
                      value={contractSignature}
                      onChange={e => { setContractSignature(e.target.value); setSignatureError(""); }}
                      placeholder={form.getValues("name") || "Your Full Legal Name"}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 font-serif text-lg italic"
                    />
                    {signatureError && (
                      <p className="text-red-400 text-xs mt-1.5">{signatureError}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1.5">
                      Signed on: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Contract Version: v1.0-2025
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                {step > 0 ? (
                  <Button type="button" variant="ghost" onClick={() => setStep(s => s - 1)} className="text-gray-400 hover:text-white">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                ) : (
                  <Link href="/"><Button type="button" variant="ghost" className="text-gray-400 hover:text-white text-sm">← App</Button></Link>
                )}

                {step < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8">
                    {loading ? "Submitting…" : "Submit & Sign Agreement"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>

        <p className="text-center text-gray-600 text-xs pb-8">
          Your application and electronic signature are stored securely. C.A.R.E.N. LLC · Atlanta, GA
        </p>
      </div>
    </div>
  );
}
