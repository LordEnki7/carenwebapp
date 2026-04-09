import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Shield, MapPin, User, Instagram, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
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

const steps = ["Your Info", "Your Region", "Your Story"];

export default function DirectorApply() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      const res = await fetch("/api/director/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
          <h1 className="text-3xl font-bold text-white">Application Received</h1>
          <p className="text-gray-300 leading-relaxed">
            Welcome to the movement. We review every application personally. 
            Shawn will reach out to you directly within 48–72 hours with next steps.
          </p>
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
        <div className="flex items-center justify-center gap-3">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? "bg-cyan-500 text-black" :
                i === step ? "bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400" :
                "bg-white/10 text-gray-500"
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i === step ? "text-cyan-400" : "text-gray-500"}`}>{label}</span>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? "bg-cyan-500" : "bg-white/10"}`} />}
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
                      <FormLabel className="text-gray-300">Full Name</FormLabel>
                      <FormControl><Input {...field} placeholder="Shawn Williams" className="bg-white/5 border-white/20 text-white placeholder:text-gray-500" /></FormControl>
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
                      <FormControl><Input {...field} placeholder="Atlanta" className="bg-white/5 border-white/20 text-white placeholder:text-gray-500" /></FormControl>
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
                    {loading ? "Submitting…" : "Submit Application"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-500 text-xs pb-8">
          Applications are reviewed personally by the C.A.R.E.N. founding team. 
          By applying you agree to act as an independent contractor under the C.A.R.E.N. Regional Director Agreement.
        </p>
      </div>
    </div>
  );
}
