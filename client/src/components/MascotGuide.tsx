import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MessageCircle, Shield, MapPin, Phone, Video, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatButton from '@/components/ChatButton';

interface MascotPersonality {
  name: string;
  role: string;
  avatar: string;
  greeting: string;
  helpMessages: string[];
  emergencyMessage: string;
  celebrationMessage: string;
}

interface MascotGuideProps {
  currentPage?: string;
  userProgress?: number;
  isEmergency?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const MASCOT_PERSONALITIES: Record<string, MascotPersonality> = {
  guardian: {
    name: "Alex Guardian",
    role: "Legal Rights Protector",
    avatar: "🛡️",
    greeting: "Hi! I'm Alex, your personal legal rights guardian. I'm here to help you stay safe and know your rights.",
    helpMessages: [
      "Did you know you have the right to remain silent during any police interaction?",
      "I can help you find the legal protections specific to your current location.",
      "Remember, recording police interactions is your constitutional right in most states.",
      "Your emergency contacts can be notified instantly if you need help."
    ],
    emergencyMessage: "I'm activating emergency protocols now. Stay calm, I've got your back.",
    celebrationMessage: "Great job staying informed about your rights! Knowledge is your best protection."
  },
  navigator: {
    name: "Riley Navigator",
    role: "GPS & Location Expert",
    avatar: "🧭",
    greeting: "Hello! I'm Riley, your navigation and location specialist. I'll keep you informed about local laws wherever you go.",
    helpMessages: [
      "I'm tracking your location to provide state-specific legal information.",
      "Different states have different laws - I'll keep you updated as you travel.",
      "Your GPS coordinates are automatically included in incident reports for accuracy.",
      "I can help you find the nearest legal aid if you need assistance."
    ],
    emergencyMessage: "I'm sharing your exact location with emergency contacts and documenting everything.",
    celebrationMessage: "You're well-protected with location-aware legal guidance!"
  },
  family: {
    name: "Sam Family",
    role: "Family Coordinator",
    avatar: "👨‍👩‍👧‍👦",
    greeting: "Hi there! I'm Sam, your family protection coordinator. I help keep your whole family safe and connected.",
    helpMessages: [
      "Your family members can all stay connected through the Family Protection plan.",
      "Teen drivers get special protection features and monitoring.",
      "Family emergency alerts reach everyone instantly when needed.",
      "All family incidents are coordinated through a shared dashboard."
    ],
    emergencyMessage: "I'm alerting your entire family network and coordinating their response.",
    celebrationMessage: "Your family is stronger when everyone knows their rights and stays connected!"
  }
};

export default function MascotGuide({ 
  currentPage = 'dashboard', 
  userProgress = 0, 
  isEmergency = false, 
  onDismiss,
  className = '' 
}: MascotGuideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMascot, setCurrentMascot] = useState<MascotPersonality>(MASCOT_PERSONALITIES.guardian);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Select appropriate mascot based on current page and context
  useEffect(() => {
    let mascotKey = 'guardian';
    
    if (currentPage.includes('family') || currentPage.includes('subscription')) {
      mascotKey = 'family';
    } else if (currentPage.includes('gps') || currentPage.includes('location') || currentPage.includes('rights')) {
      mascotKey = 'navigator';
    }
    
    setCurrentMascot(MASCOT_PERSONALITIES[mascotKey]);
  }, [currentPage]);

  // Handle emergency state
  useEffect(() => {
    if (isEmergency) {
      setCurrentMessage(currentMascot.emergencyMessage);
      setIsVisible(true);
      setIsAnimating(true);
    }
  }, [isEmergency, currentMascot]);

  // Cycle through help messages
  useEffect(() => {
    if (!isEmergency && isVisible) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setMessageIndex((prev) => (prev + 1) % currentMascot.helpMessages.length);
          setCurrentMessage(currentMascot.helpMessages[messageIndex]);
          setIsAnimating(false);
        }, 300);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [isVisible, isEmergency, currentMascot, messageIndex]);

  // Initialize with greeting
  useEffect(() => {
    setCurrentMessage(currentMascot.greeting);
    setTimeout(() => setIsVisible(true), 1000);
  }, [currentMascot]);

  const handleInteraction = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const responses = [
        "I'm here to help! What would you like to know about your legal rights?",
        "Feel free to explore the app - I'll provide guidance along the way.",
        "Remember, staying informed is your best protection.",
        "Don't hesitate to ask if you need help with any features."
      ];
      setCurrentMessage(responses[Math.floor(Math.random() * responses.length)]);
      setIsAnimating(false);
    }, 300);
  };

  const getPageIcon = () => {
    switch (currentPage) {
      case 'incidents': return <Video className="w-4 h-4" />;
      case 'emergency': return <Phone className="w-4 h-4" />;
      case 'family': return <Users className="w-4 h-4" />;
      case 'rights': return <Shield className="w-4 h-4" />;
      case 'gps': return <MapPin className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}
      >
        <Card className={`shadow-lg border-2 ${isEmergency ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Mascot Avatar */}
              <motion.div
                animate={{ rotate: isAnimating ? [0, -10, 10, 0] : 0 }}
                transition={{ duration: 0.6 }}
                className="text-2xl flex-shrink-0 bg-white rounded-full p-2 shadow-sm"
              >
                {currentMascot.avatar}
              </motion.div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">{currentMascot.name}</h4>
                    <div className="flex items-center gap-1">
                      {getPageIcon()}
                      <span className="text-xs text-gray-600">{currentMascot.role}</span>
                    </div>
                  </div>
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsVisible(false);
                        onDismiss();
                      }}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Message */}
                <motion.div
                  animate={{ opacity: isAnimating ? 0.5 : 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-gray-700 leading-relaxed"
                >
                  {currentMessage}
                </motion.div>

                {/* Progress indicator */}
                {userProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Your Progress</span>
                      <span>{userProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${userProgress}%` }}
                        transition={{ duration: 1 }}
                        className="bg-blue-600 h-1.5 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <ChatButton
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                  />
                  
                  {isEmergency && (
                    <Badge variant="destructive" className="text-xs">
                      Emergency Active
                    </Badge>
                  )}
                  
                  {!isEmergency && userProgress >= 80 && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      Well Protected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}