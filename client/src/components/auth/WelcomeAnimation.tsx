import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Shield, Users } from "lucide-react";

interface WelcomeAnimationProps {
  isVisible: boolean;
  userName?: string;
  onComplete: () => void;
}

export default function WelcomeAnimation({ isVisible, userName, onComplete }: WelcomeAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      icon: Check,
      title: `Welcome back, ${userName || 'User'}!`,
      subtitle: "Authentication successful",
      color: "text-green-400",
      bg: "bg-green-500/20"
    },
    {
      icon: Shield,
      title: "Legal Protection Active",
      subtitle: "Your constitutional rights are ready",
      color: "text-cyan-400",
      bg: "bg-cyan-500/20"
    },
    {
      icon: Users,
      title: "Emergency Network Ready",
      subtitle: "Connected to legal support system",
      color: "text-blue-400",
      bg: "bg-blue-500/20"
    },
    {
      icon: Sparkles,
      title: "C.A.R.E.N.™ Ready",
      subtitle: "Your protection platform is active",
      color: "text-purple-400",
      bg: "bg-purple-500/20"
    }
  ];

  useEffect(() => {
    if (!isVisible) return;

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          setTimeout(onComplete, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(stepInterval);
  }, [isVisible, onComplete, steps.length]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const Icon = currentStepData?.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gray-800/95 backdrop-blur-lg rounded-2xl border border-white/10 p-8 max-w-md w-full mx-4"
        >
          <div className="text-center space-y-6">
            {/* Icon Animation */}
            <motion.div
              key={currentStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`w-16 h-16 mx-auto rounded-full ${currentStepData?.bg} flex items-center justify-center`}
            >
              {Icon && <Icon className={`w-8 h-8 ${currentStepData?.color}`} />}
            </motion.div>

            {/* Text Animation */}
            <motion.div
              key={`text-${currentStep}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h2 className="text-xl font-bold text-white">
                {currentStepData?.title}
              </h2>
              <p className="text-gray-300 text-sm">
                {currentStepData?.subtitle}
              </p>
            </motion.div>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8 }}
                  animate={{ 
                    scale: index <= currentStep ? 1.2 : 0.8,
                    backgroundColor: index <= currentStep ? "#00d4ff" : "#374151"
                  }}
                  className="w-2 h-2 rounded-full"
                />
              ))}
            </div>

            {/* Skip Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onComplete}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Skip animation
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}