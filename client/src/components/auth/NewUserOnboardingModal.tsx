import { useState } from 'react';
import OnboardingWalkthrough from '@/components/OnboardingWalkthrough';
import { useCreateEmergencyContact } from '@/hooks/useEmergencyContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Phone, Heart, ChevronRight, SkipForward, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewUserOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userEmail?: string;
}

export default function NewUserOnboardingModal({
  isOpen,
  onComplete,
}: NewUserOnboardingModalProps) {
  const { toast } = useToast();
  const createContact = useCreateEmergencyContact();

  const [showContactStep, setShowContactStep] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  const markOnboardingDone = (completed: boolean) => {
    localStorage.setItem('caren_onboarding_state', JSON.stringify({
      hasSeenOnboarding: true,
      onboardingCompleted: completed,
      preferredLanguage: 'en'
    }));
  };

  const handleWalkthroughComplete = () => {
    markOnboardingDone(true);
    setShowContactStep(true);
  };

  const handleWalkthroughSkip = () => {
    markOnboardingDone(false);
    setShowContactStep(true);
  };

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
        notifyBySms: true,
        notifyByEmail: false,
      });
      setSubmitted(true);
      setTimeout(() => {
        onComplete();
      }, 1800);
    } catch {
      toast({
        title: "Couldn't save contact",
        description: "You can add contacts later from your dashboard.",
        variant: "destructive"
      });
      onComplete();
    }
  };

  const handleSkipContact = () => {
    onComplete();
  };

  if (!isOpen) return null;

  if (!showContactStep) {
    return (
      <OnboardingWalkthrough
        isOpen={isOpen}
        onComplete={handleWalkthroughComplete}
        onSkip={handleWalkthroughSkip}
      />
    );
  }

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
