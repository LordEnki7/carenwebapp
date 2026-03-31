import { useState, useCallback } from 'react';
import { Shield, MapPin, Video, AlertTriangle, Brain, Rocket, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingWalkthroughProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    icon: Shield,
    title: "Welcome to C.A.R.E.N.™",
    description: "Your personal legal protection and emergency response companion.",
    color: "from-cyan-500 to-blue-600",
    accent: "cyan",
    bgGlow: "bg-cyan-500/20",
  },
  {
    icon: MapPin,
    title: "GPS-Powered Legal Rights",
    description: "Automatically shows your legal rights based on your location. Covers all 50 states with 467+ legal protections.",
    color: "from-purple-500 to-indigo-600",
    accent: "purple",
    bgGlow: "bg-purple-500/20",
  },
  {
    icon: Video,
    title: "Incident Recording",
    description: "Record audio and video during encounters. Your recordings are encrypted and stored securely as evidence.",
    color: "from-green-500 to-emerald-600",
    accent: "green",
    bgGlow: "bg-green-500/20",
  },
  {
    icon: AlertTriangle,
    title: "One-Tap Emergency",
    description: "Alert your emergency contacts instantly with your GPS location. Notify family and attorneys in seconds.",
    color: "from-red-500 to-orange-600",
    accent: "red",
    bgGlow: "bg-red-500/20",
  },
  {
    icon: Brain,
    title: "AI-Powered Protection",
    description: "Get instant legal answers, real-time voice coaching, and smart incident analysis — all powered by AI.",
    color: "from-violet-500 to-purple-600",
    accent: "violet",
    bgGlow: "bg-violet-500/20",
  },
  {
    icon: Rocket,
    title: "You're All Set!",
    description: "Explore the dashboard and customize your experience. Your protection starts now.",
    color: "from-cyan-500 to-green-500",
    accent: "cyan",
    bgGlow: "bg-cyan-500/20",
  },
];

const accentColors: Record<string, { border: string; text: string; dot: string; btn: string }> = {
  cyan: { border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-400", btn: "bg-cyan-600 hover:bg-cyan-700" },
  purple: { border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-400", btn: "bg-purple-600 hover:bg-purple-700" },
  green: { border: "border-green-500/30", text: "text-green-400", dot: "bg-green-400", btn: "bg-green-600 hover:bg-green-700" },
  red: { border: "border-red-500/30", text: "text-red-400", dot: "bg-red-400", btn: "bg-red-600 hover:bg-red-700" },
  violet: { border: "border-violet-500/30", text: "text-violet-400", dot: "bg-violet-400", btn: "bg-violet-600 hover:bg-violet-700" },
};

export default function OnboardingWalkthrough({ isOpen, onComplete, onSkip }: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];
  const colors = accentColors[step.accent] || accentColors.cyan;
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  const animateTransition = useCallback((newStep: number, dir: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setTimeout(() => {
      setCurrentStep(newStep);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
      return;
    }
    animateTransition(currentStep + 1, 'next');
  }, [currentStep, isLastStep, onComplete, animateTransition]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      animateTransition(currentStep - 1, 'prev');
    }
  }, [currentStep, animateTransition]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          type="button"
        >
          <X className="w-4 h-4" />
        </Button>

        <div
          className={`transition-all duration-200 ease-in-out ${
            isAnimating
              ? direction === 'next'
                ? 'opacity-0 translate-x-4'
                : 'opacity-0 -translate-x-4'
              : 'opacity-100 translate-x-0'
          }`}
        >
          <div className="flex flex-col items-center pt-12 pb-6 px-6 sm:px-10">
            <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full ${step.bgGlow} flex items-center justify-center mb-6`}>
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-20 blur-xl`} />
              <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3">
              {step.title}
            </h2>
            <p className="text-gray-300 text-center text-sm sm:text-base leading-relaxed max-w-sm">
              {step.description}
            </p>
          </div>

          <div className={`mx-6 sm:mx-10 mb-6 rounded-xl border ${colors.border} bg-gray-800/40 p-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
              <span className={`text-xs sm:text-sm ${colors.text} font-medium`}>
                {currentStep === 0 && "Protecting communities nationwide"}
                {currentStep === 1 && "467+ legal protections across 50 states"}
                {currentStep === 2 && "End-to-end encrypted evidence storage"}
                {currentStep === 3 && "Average alert time: under 3 seconds"}
                {currentStep === 4 && "24/7 AI legal assistant at your fingertips"}
                {currentStep === 5 && "Join thousands of protected users"}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-10 pb-8">
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i !== currentStep) {
                    animateTransition(i, i > currentStep ? 'next' : 'prev');
                  }
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? `w-6 ${colors.dot}`
                    : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-gray-400 hover:text-white disabled:opacity-0"
              type="button"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-300 text-sm"
              type="button"
            >
              Skip
            </Button>

            <Button
              onClick={handleNext}
              className={`${colors.btn} text-white min-w-[100px]`}
              type="button"
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}