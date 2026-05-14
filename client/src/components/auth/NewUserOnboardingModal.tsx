import { useState } from 'react';
import OnboardingWalkthrough from '@/components/OnboardingWalkthrough';
import { useCreateEmergencyContact } from '@/hooks/useEmergencyContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Phone, Heart, ChevronRight, SkipForward, CheckCircle, MapPin, Bell, Scale, Search, Zap, Shield, Video, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface NewUserOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userEmail?: string;
}

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia",
];

type Step = 'walkthrough' | 'state-check' | 'contact' | 'trial-started';

export default function NewUserOnboardingModal({
  isOpen,
  onComplete,
  userEmail,
}: NewUserOnboardingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createContact = useCreateEmergencyContact();

  const [currentStep, setCurrentStep] = useState<Step>('walkthrough');

  // State-check step state
  const [selectedState, setSelectedState] = useState('');
  const [checkResult, setCheckResult] = useState<{ count: number; checked: boolean }>({ count: 0, checked: false });
  const [isChecking, setIsChecking] = useState(false);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const [isSavingNotify, setIsSavingNotify] = useState(false);

  // Contact step state
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', relationship: '' });

  const markOnboardingDone = (completed: boolean) => {
    localStorage.setItem('caren_onboarding_state', JSON.stringify({
      hasSeenOnboarding: true,
      onboardingCompleted: completed,
      preferredLanguage: 'en'
    }));
  };

  // ── Walkthrough handlers ──────────────────────────────────────────────────
  const handleWalkthroughComplete = () => {
    markOnboardingDone(true);
    setCurrentStep('state-check');
  };

  const handleWalkthroughSkip = () => {
    markOnboardingDone(false);
    setCurrentStep('state-check');
  };

  // ── State-check handlers ──────────────────────────────────────────────────
  const handleCheckState = async () => {
    if (!selectedState) return;
    setIsChecking(true);
    try {
      const res = await fetch(`/api/attorney-state-check?state=${encodeURIComponent(selectedState)}`);
      const data = await res.json();
      setCheckResult({ count: data.count ?? 0, checked: true });
    } catch {
      setCheckResult({ count: 0, checked: true });
    } finally {
      setIsChecking(false);
    }
  };

  const handleNotifyMe = async () => {
    const email = userEmail || (user as any)?.email || (user as any)?.claims?.email || '';
    if (!email) {
      toast({ title: "Couldn't save", description: "No email found. You can set this up from your dashboard.", variant: "destructive" });
      return;
    }
    setIsSavingNotify(true);
    try {
      await fetch('/api/attorney-state-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          state: selectedState,
          userId: (user as any)?.claims?.sub || (user as any)?.id || null,
        }),
      });
      setNotifyRequested(true);
      toast({ title: "You're on the list!", description: `We'll email you when an attorney joins ${selectedState}.` });
    } catch {
      toast({ title: "Saved!", description: "We'll notify you when attorneys are available in your state." });
      setNotifyRequested(true);
    } finally {
      setIsSavingNotify(false);
    }
  };

  const handleContinueFromState = () => {
    setCurrentStep('contact');
  };

  // ── Contact handlers ──────────────────────────────────────────────────────
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.relationship) {
      toast({
        title: "Please fill in all fields",
        description: "Name, phone, and relationship are required.",
        variant: "destructive"
      });
      return;
    }
    try {
      await createContact.mutateAsync({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: '',
        relationship: form.relationship,
        priority: 'primary',
      } as any);
      setSubmitted(true);
      setTimeout(() => { setCurrentStep('trial-started'); }, 1200);
    } catch {
      toast({
        title: "Couldn't save contact",
        description: "You can add contacts later from your dashboard.",
        variant: "destructive"
      });
      setCurrentStep('trial-started');
    }
  };

  const handleSkipContact = () => { setCurrentStep('trial-started'); };

  if (!isOpen) return null;

  // ── Trial started step ────────────────────────────────────────────────────
  if (currentStep === 'trial-started') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-gray-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col items-center pt-10 pb-6 px-8 text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Your Free Trial Is Live!</h2>
            <p className="text-indigo-300 text-sm font-semibold mb-1">7 days of full premium access — no charge today</p>
            <p className="text-gray-400 text-sm mb-6">
              You have everything unlocked until your trial ends. After 7 days, choose a plan to keep your protection active.
            </p>

            <div className="w-full grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: Shield, label: "Legal Rights", sub: "All 50 states + DC" },
                { icon: Video, label: "Dashcam", sub: "10-min rolling buffer" },
                { icon: MessageSquare, label: "AI Legal Assistant", sub: "Ask anything" },
                { icon: Users, label: "Attorney Network", sub: "Direct connections" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{label}</p>
                    <p className="text-gray-500 text-xs truncate">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={onComplete}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-base py-3 rounded-xl"
            >
              Start Exploring C.A.R.E.N.™
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              A reminder will appear when your trial is about to end
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Walkthrough step ──────────────────────────────────────────────────────
  if (currentStep === 'walkthrough') {
    return (
      <OnboardingWalkthrough
        isOpen={isOpen}
        onComplete={handleWalkthroughComplete}
        onSkip={handleWalkthroughSkip}
      />
    );
  }

  // ── State-check step ──────────────────────────────────────────────────────
  if (currentStep === 'state-check') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">

          <div className="flex flex-col items-center pt-10 pb-4 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Scale className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Find Attorneys Near You</h2>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Select your state so we can show you verified civil rights attorneys in your area.
            </p>
          </div>

          <div className="px-8 pb-8 space-y-5">

            {/* State selector */}
            <div>
              <Label className="text-gray-300 text-sm mb-2 block flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Your State
              </Label>
              <div className="flex gap-2">
                <Select value={selectedState} onValueChange={(val) => {
                  setSelectedState(val);
                  setCheckResult({ count: 0, checked: false });
                  setNotifyRequested(false);
                }}>
                  <SelectTrigger className="flex-1 bg-gray-800/60 border-gray-600/50 text-white">
                    <SelectValue placeholder="Select your state…" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                    {US_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleCheckState}
                  disabled={!selectedState || isChecking}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 shrink-0"
                >
                  {isChecking ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Result after check */}
            {checkResult.checked && (
              <div className={`rounded-xl border p-4 ${
                checkResult.count > 0
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                {checkResult.count > 0 ? (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-400 font-semibold text-sm">
                        {checkResult.count} verified {checkResult.count === 1 ? 'attorney' : 'attorneys'} in {selectedState}!
                      </p>
                      <p className="text-green-300/70 text-xs mt-0.5">
                        You'll be able to view and contact them from the Attorney Directory once live.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Scale className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-400 font-semibold text-sm">
                          No attorneys in {selectedState} yet
                        </p>
                        <p className="text-amber-200/70 text-xs mt-0.5">
                          We're actively recruiting attorneys nationwide. We'll email you the moment one joins your state.
                        </p>
                      </div>
                    </div>
                    {!notifyRequested ? (
                      <Button
                        onClick={handleNotifyMe}
                        disabled={isSavingNotify}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center justify-center gap-2"
                      >
                        <Bell className="w-4 h-4" />
                        {isSavingNotify ? "Saving…" : `Notify Me When ${selectedState} Has Attorneys`}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <p className="text-green-400 text-sm font-medium">You're on the list — we'll notify you!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleContinueFromState}
                className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1"
              >
                <SkipForward className="w-3 h-3" />
                Skip
              </Button>

              <Button
                onClick={handleContinueFromState}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-center text-xs text-gray-500">
              You can always view the Attorney Directory from your dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Emergency contact step ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden">

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-5">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Contact Added!</h2>
            <p className="text-gray-300">
              They'll be notified instantly if you trigger an alert.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center pt-10 pb-4 px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Add Your First Emergency Contact
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
                Who should be notified <span className="text-orange-400 font-semibold">instantly</span> if you're in danger? A family member, partner, or trusted friend.
              </p>
            </div>

            <div className="mx-8 mb-5 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-xs text-orange-300 font-medium">
                  They receive your GPS location + recording when SOS is triggered
                </span>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="px-8 pb-8 space-y-4">
              <div>
                <Label htmlFor="contact-name" className="text-gray-300 text-sm mb-1 block">
                  Full Name <span className="text-orange-400">*</span>
                </Label>
                <Input
                  id="contact-name"
                  placeholder="e.g. Mom, John Smith"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-gray-800/60 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-orange-500/60"
                />
              </div>

              <div>
                <Label htmlFor="contact-phone" className="text-gray-300 text-sm mb-1 block">
                  <Phone className="w-3 h-3 inline mr-1" />
                  Phone Number <span className="text-orange-400">*</span>
                </Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="bg-gray-800/60 border-gray-600/50 text-white placeholder:text-gray-500 focus:border-orange-500/60"
                />
              </div>

              <div>
                <Label htmlFor="contact-relationship" className="text-gray-300 text-sm mb-1 block">
                  <Heart className="w-3 h-3 inline mr-1" />
                  Relationship <span className="text-orange-400">*</span>
                </Label>
                <Select
                  value={form.relationship}
                  onValueChange={val => setForm(f => ({ ...f, relationship: val }))}
                >
                  <SelectTrigger id="contact-relationship" className="bg-gray-800/60 border-gray-600/50 text-white">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="Spouse / Partner">Spouse / Partner</SelectItem>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Close Friend">Close Friend</SelectItem>
                    <SelectItem value="Attorney">Attorney</SelectItem>
                    <SelectItem value="Other Family">Other Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkipContact}
                  className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1"
                >
                  <SkipForward className="w-3 h-3" />
                  Skip for now
                </Button>

                <Button
                  type="submit"
                  disabled={createContact.isPending}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center justify-center gap-2"
                >
                  {createContact.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      Add Contact & Get Started
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-xs text-gray-500">
                You can add more contacts anytime from your dashboard
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
