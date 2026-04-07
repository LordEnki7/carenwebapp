import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Shield, CheckCircle, ChevronRight, ChevronLeft, Globe, Clock, Phone, Mail, FileText, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia",
];

const PRACTICE_AREAS = [
  "Traffic / Criminal Defense",
  "Civil Rights / Police Misconduct",
  "Personal Injury",
  "Motor Vehicle Defense",
  "Insurance Disputes",
  "Constitutional Law",
  "DUI Defense",
  "Consumer Protection",
  "Immigration Law",
];

const LANGUAGES = ["English","Spanish","French","Mandarin","Portuguese","Arabic","Korean","Vietnamese","Tagalog","Russian"];

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  firmName: z.string().min(1, "Required"),
  firmWebsite: z.string().optional(),
  barNumber: z.string().min(1, "Bar number required"),
  statesLicensed: z.array(z.string()).min(1, "Select at least one state"),
  practiceAreas: z.array(z.string()).min(1, "Select at least one practice area"),
  countiesServed: z.array(z.string()).optional(),
  languages: z.array(z.string()).default(["English"]),
  emergencyAvailable: z.boolean().default(false),
  availability24_7: z.boolean().default(false),
  consultationType: z.enum(["free", "paid"]).default("paid"),
  malpracticeInsurance: z.boolean().default(false),
  yearsExperience: z.number().min(0).optional(),
  preferredContact: z.enum(["email", "phone", "app"]).default("email"),
  bio: z.string().optional(),
  agreementSigned: z.boolean().refine((v) => v === true, "You must agree to the participation terms"),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { title: "Basic Info", icon: FileText },
  { title: "Licensing", icon: Scale },
  { title: "Practice", icon: Shield },
  { title: "Availability", icon: Clock },
  { title: "Agreement", icon: CheckCircle },
];

export default function AttorneyApply() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [stateInput, setStateInput] = useState("");
  const [countyInput, setCountyInput] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      statesLicensed: [],
      practiceAreas: [],
      countiesServed: [],
      languages: ["English"],
      emergencyAvailable: false,
      availability24_7: false,
      consultationType: "paid",
      malpracticeInsurance: false,
      preferredContact: "email",
      agreementSigned: false,
    },
  });

  const { watch, setValue, getValues } = form;
  const values = watch();

  const submit = useMutation({
    mutationFn: (data: FormData) =>
      apiRequest("POST", "/api/attorney-network/apply", data),
    onSuccess: () => setSubmitted(true),
    onError: (err: any) => {
      toast({ title: "Submission failed", description: err.message || "Please try again.", variant: "destructive" });
    },
  });

  const toggleArray = (field: keyof FormData, val: string) => {
    const arr = (values[field] as string[]) || [];
    setValue(field as any, arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val], { shouldValidate: true });
  };

  const addCounty = () => {
    const v = countyInput.trim();
    if (!v) return;
    const arr = values.countiesServed || [];
    if (!arr.includes(v)) setValue("countiesServed", [...arr, v]);
    setCountyInput("");
  };

  const nextStep = async () => {
    const fields: Record<number, (keyof FormData)[]> = {
      0: ["firstName", "lastName", "email", "firmName"],
      1: ["barNumber", "statesLicensed"],
      2: ["practiceAreas"],
      3: [],
      4: ["agreementSigned"],
    };
    const valid = await form.trigger(fields[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = form.handleSubmit((data) => submit.mutate(data));

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Application Submitted!</h1>
          <p className="text-gray-400 mb-6">
            Thank you for applying to the C.A.R.E.N. Legal Access Network. Our team will review your application and contact you within 3 business days.
          </p>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-left space-y-2 mb-8">
            <p className="text-sm text-gray-300"><span className="text-cyan-400">✓</span> Application received</p>
            <p className="text-sm text-gray-300"><span className="text-cyan-400">✓</span> AI review in progress</p>
            <p className="text-sm text-gray-300"><span className="text-gray-500">○</span> Admin verification (1–3 days)</p>
            <p className="text-sm text-gray-300"><span className="text-gray-500">○</span> Profile activation</p>
          </div>
          <a href="/" className="text-cyan-400 hover:text-cyan-300 text-sm">← Return to C.A.R.E.N.</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">C.A.R.E.N. Legal Access Network</h1>
              <p className="text-xs text-gray-400">Attorney Network Application</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="bg-gray-800 border border-gray-600 text-gray-100 hover:bg-gray-700 hover:text-white gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-3">
            Join the Attorney Network
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Be part of a new standard in roadside incident protection and legal access. Verified directory listing. Full independence. No fee sharing.
          </p>
        </div>

        {/* Benefits row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Shield, label: "Verified Directory", desc: "Trusted listing with incident-context users" },
            { icon: Globe, label: "State Coverage", desc: "Reach users across your licensed states" },
            { icon: CheckCircle, label: "No Fee Sharing", desc: "You keep 100% of your legal fees" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 text-center">
              <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-white text-xs font-semibold mb-1">{label}</p>
              <p className="text-gray-500 text-xs">{desc}</p>
            </div>
          ))}
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? "text-cyan-400" : "text-gray-600"}`}>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-cyan-500 border-cyan-500 text-black" : i === step ? "border-cyan-400 text-cyan-400" : "border-gray-700 text-gray-600"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="text-xs hidden sm:block">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 sm:w-16 mx-2 ${i < step ? "bg-cyan-500" : "bg-gray-700"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <Card className="bg-gray-900/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-cyan-400" />; })()}
              {STEPS[step].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* STEP 0 — Basic Info */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">First Name *</Label>
                    <Input {...form.register("firstName")} className="bg-gray-800 border-gray-600 text-white mt-1" placeholder="Jane" />
                    {form.formState.errors.firstName && <p className="text-red-400 text-xs mt-1">{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <Label className="text-gray-300">Last Name *</Label>
                    <Input {...form.register("lastName")} className="bg-gray-800 border-gray-600 text-white mt-1" placeholder="Smith" />
                    {form.formState.errors.lastName && <p className="text-red-400 text-xs mt-1">{form.formState.errors.lastName.message}</p>}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Email Address *</Label>
                  <Input {...form.register("email")} type="email" className="bg-gray-800 border-gray-600 text-white mt-1" placeholder="jane@smithlaw.com" />
                  {form.formState.errors.email && <p className="text-red-400 text-xs mt-1">{form.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Label className="text-gray-300">Phone Number</Label>
                  <Input {...form.register("phone")} className="bg-gray-800 border-gray-600 text-white mt-1" placeholder="(555) 000-0000" />
                </div>
                <div>
                  <Label className="text-gray-300">Law Firm Name *</Label>
                  <Input {...form.register("firmName")} className="bg-gray-800 border-gray-600 text-white mt-1" placeholder="Smith Defense Group" />
                  {form.formState.errors.firmName && <p className="text-red-400 text-xs mt-1">{form.formState.errors.firmName.message}</p>}
                </div>
                <div>
                  <Label className="text-gray-300">Firm Website</Label>
                  <Input {...form.register("firmWebsite")} className="bg-gray-800 border-gray-600 text-white mt-1" placeholder="https://smithlaw.com" />
                </div>
                <div>
                  <Label className="text-gray-300">Years of Experience</Label>
                  <Input {...form.register("yearsExperience", { valueAsNumber: true })} type="number" className="bg-gray-800 border-gray-600 text-white mt-1" placeholder="5" />
                </div>
                <div>
                  <Label className="text-gray-300">Preferred Contact Method</Label>
                  <Select value={values.preferredContact} onValueChange={(v) => setValue("preferredContact", v as any)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="app">App Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* STEP 1 — Licensing */}
            {step === 1 && (
              <>
                <div>
                  <Label className="text-gray-300">Bar Number *</Label>
                  <Input {...form.register("barNumber")} className="bg-gray-800 border-gray-600 text-white mt-1" placeholder="BAR123456" />
                  {form.formState.errors.barNumber && <p className="text-red-400 text-xs mt-1">{form.formState.errors.barNumber.message}</p>}
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block">States Licensed * <span className="text-gray-500 text-xs">(select all that apply)</span></Label>
                  {form.formState.errors.statesLicensed && <p className="text-red-400 text-xs mb-2">{form.formState.errors.statesLicensed.message}</p>}
                  <div className="flex gap-2 mb-3">
                    <Select value={stateInput} onValueChange={setStateInput}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white flex-1">
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                        {US_STATES.filter((s) => !(values.statesLicensed || []).includes(s)).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-cyan-500 text-cyan-400"
                      onClick={() => {
                        if (stateInput) {
                          toggleArray("statesLicensed", stateInput);
                          setStateInput("");
                        }
                      }}
                    >Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(values.statesLicensed || []).map((s) => (
                      <Badge key={s} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 cursor-pointer" onClick={() => toggleArray("statesLicensed", s)}>
                        {s} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block">Counties / Cities Served <span className="text-gray-500 text-xs">(optional — add key service areas)</span></Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={countyInput}
                      onChange={(e) => setCountyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCounty())}
                      className="bg-gray-800 border-gray-600 text-white flex-1"
                      placeholder="e.g. Cuyahoga County, Columbus"
                    />
                    <Button type="button" variant="outline" className="border-purple-500 text-purple-400" onClick={addCounty}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(values.countiesServed || []).map((c) => (
                      <Badge key={c} className="bg-purple-500/20 text-purple-300 border-purple-500/40 cursor-pointer" onClick={() => setValue("countiesServed", (values.countiesServed || []).filter((x) => x !== c))}>
                        {c} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* STEP 2 — Practice Areas */}
            {step === 2 && (
              <>
                <div>
                  <Label className="text-gray-300 mb-2 block">Practice Areas * <span className="text-gray-500 text-xs">(select all that apply)</span></Label>
                  {form.formState.errors.practiceAreas && <p className="text-red-400 text-xs mb-2">{form.formState.errors.practiceAreas.message}</p>}
                  <div className="grid grid-cols-1 gap-2">
                    {PRACTICE_AREAS.map((area) => (
                      <label key={area} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${(values.practiceAreas || []).includes(area) ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700 hover:border-gray-600"}`}>
                        <Checkbox
                          checked={(values.practiceAreas || []).includes(area)}
                          onCheckedChange={() => toggleArray("practiceAreas", area)}
                          className="border-gray-500"
                        />
                        <span className="text-gray-200 text-sm">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 block">Languages Spoken</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <Badge
                        key={lang}
                        onClick={() => toggleArray("languages", lang)}
                        className={`cursor-pointer transition-all ${(values.languages || []).includes(lang) ? "bg-green-500/20 text-green-300 border-green-500/40" : "bg-gray-800 text-gray-400 border-gray-600"}`}
                      >
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Short Bio <span className="text-gray-500 text-xs">(optional — shown on your profile)</span></Label>
                  <Textarea {...form.register("bio")} className="bg-gray-800 border-gray-600 text-white mt-1" rows={4} placeholder="Briefly describe your practice focus and what you offer clients..." />
                </div>
              </>
            )}

            {/* STEP 3 — Availability */}
            {step === 3 && (
              <>
                <div>
                  <Label className="text-gray-300 mb-2 block">Consultation Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ val: "free", label: "Free Consultation", desc: "No charge for initial consult" }, { val: "paid", label: "Paid Consultation", desc: "Fee applies for initial consult" }].map(({ val, label, desc }) => (
                      <label key={val} className={`p-4 rounded-xl border cursor-pointer transition-all ${values.consultationType === val ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700 hover:border-gray-600"}`}>
                        <input type="radio" className="hidden" checked={values.consultationType === val} onChange={() => setValue("consultationType", val as any)} />
                        <p className="text-white text-sm font-semibold">{label}</p>
                        <p className="text-gray-400 text-xs mt-1">{desc}</p>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-700 cursor-pointer hover:border-gray-600">
                    <Checkbox
                      checked={values.emergencyAvailable}
                      onCheckedChange={(v) => setValue("emergencyAvailable", !!v)}
                      className="border-gray-500"
                    />
                    <div>
                      <p className="text-white text-sm font-semibold">Available for Urgent Situations</p>
                      <p className="text-gray-400 text-xs">Users in crisis can see you as a priority contact</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-700 cursor-pointer hover:border-gray-600">
                    <Checkbox
                      checked={values.availability24_7}
                      onCheckedChange={(v) => setValue("availability24_7", !!v)}
                      className="border-gray-500"
                    />
                    <div>
                      <p className="text-white text-sm font-semibold">24/7 Availability</p>
                      <p className="text-gray-400 text-xs">Listed as available around the clock</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-700 cursor-pointer hover:border-gray-600">
                    <Checkbox
                      checked={values.malpracticeInsurance}
                      onCheckedChange={(v) => setValue("malpracticeInsurance", !!v)}
                      className="border-gray-500"
                    />
                    <div>
                      <p className="text-white text-sm font-semibold">Malpractice Insurance</p>
                      <p className="text-gray-400 text-xs">I carry active malpractice insurance</p>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* STEP 4 — Agreement */}
            {step === 4 && (
              <>
                <div className="bg-gray-800/60 border border-gray-600 rounded-xl p-5 max-h-72 overflow-y-auto text-sm text-gray-300 space-y-3">
                  <h3 className="text-white font-bold text-base">C.A.R.E.N. Attorney Participation Agreement</h3>
                  <p><strong className="text-white">1. Relationship:</strong> Attorney is an independent legal professional. C.A.R.E.N. is NOT a law firm and does NOT provide legal advice.</p>
                  <p><strong className="text-white">2. Platform Role:</strong> C.A.R.E.N. provides a directory listing, user connection tools, and incident documentation support. C.A.R.E.N. does NOT recommend attorneys, guarantee clients, or interfere in legal representation.</p>
                  <p><strong className="text-white">3. No Fee Sharing:</strong> Attorney retains 100% of legal fees. C.A.R.E.N. does NOT receive any portion of settlements or legal fees.</p>
                  <p><strong className="text-white">4. Compliance:</strong> Attorney agrees to follow all state bar rules, maintain licensing in good standing, and handle all client relationships independently.</p>
                  <p><strong className="text-white">5. Communication:</strong> Attorney agrees to respond to inquiries within a reasonable timeframe and maintain professionalism with users.</p>
                  <p><strong className="text-white">6. Listing & Visibility:</strong> C.A.R.E.N. may display attorney profile, practice areas, and contact details.</p>
                  <p><strong className="text-white">7. Termination:</strong> Either party may terminate at any time with no penalty.</p>
                  <p><strong className="text-white">8. Liability:</strong> C.A.R.E.N. is not responsible for legal outcomes or attorney-client disputes.</p>
                  <p><strong className="text-white">9. Disclaimer:</strong> Contacting an attorney through the platform does not itself create an attorney-client relationship unless confirmed by the attorney.</p>
                </div>

                {form.formState.errors.agreementSigned && (
                  <p className="text-red-400 text-xs">{form.formState.errors.agreementSigned.message}</p>
                )}

                <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-700 cursor-pointer hover:border-cyan-700 transition-all">
                  <Checkbox
                    checked={values.agreementSigned}
                    onCheckedChange={(v) => setValue("agreementSigned", !!v, { shouldValidate: true })}
                    className="border-gray-500 mt-0.5"
                  />
                  <div>
                    <p className="text-white text-sm font-semibold">I agree to the C.A.R.E.N. Attorney Participation Agreement</p>
                    <p className="text-gray-400 text-xs mt-1">
                      I confirm that I am a licensed attorney in good standing and agree to all terms above.
                      I understand that C.A.R.E.N. is a directory platform, not a law firm, and does not share in legal fees.
                    </p>
                  </div>
                </label>

                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 space-y-1">
                  <p className="text-xs text-gray-400 font-semibold mb-2">Application Summary</p>
                  <p className="text-xs text-gray-300"><span className="text-gray-500">Name:</span> {values.firstName} {values.lastName}</p>
                  <p className="text-xs text-gray-300"><span className="text-gray-500">Firm:</span> {values.firmName}</p>
                  <p className="text-xs text-gray-300"><span className="text-gray-500">Bar Number:</span> {values.barNumber}</p>
                  <p className="text-xs text-gray-300"><span className="text-gray-500">States:</span> {(values.statesLicensed || []).join(", ")}</p>
                  <p className="text-xs text-gray-300"><span className="text-gray-500">Practice:</span> {(values.practiceAreas || []).join(", ")}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={nextStep}>
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white"
              onClick={onSubmit}
              disabled={submit.isPending}
            >
              {submit.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-8">
          Questions? Contact us at{" "}
          <a href="mailto:info@carenalert.com" className="text-cyan-500 hover:text-cyan-400">info@carenalert.com</a>
        </p>
      </div>
    </div>
  );
}
