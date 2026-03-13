import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Phone, 
  Camera, 
  Mic, 
  MapPin, 
  FileText, 
  MessageSquare, 
  Settings, 
  CreditCard,
  Users,
  Bluetooth,
  Smartphone,
  Car,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Search,
  Book,
  Play,
  HelpCircle,
  ExternalLink,
  Download,
  Share
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("getting-started");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "support", text: "Hello! I'm your CAREN support assistant. How can I help you today?", timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "",
    description: "",
    email: ""
  });

  const { toast } = useToast();

  const appFlow = [
    {
      step: 1,
      title: "Create Account & Accept Terms",
      description: "Sign up and review legal agreements",
      icon: Shield,
      details: "Start by creating your CAREN account and accepting the terms of service and privacy policy.",
      actions: ["Sign up with email", "Review legal terms", "Accept agreements"]
    },
    {
      step: 2,
      title: "Complete Onboarding",
      description: "Set up your profile and emergency contacts",
      icon: Users,
      details: "Configure your profile, add emergency contacts, and complete the gamified onboarding process.",
      actions: ["Add emergency contacts", "Set up profile", "Complete achievements"]
    },
    {
      step: 3,
      title: "Know Your Rights",
      description: "Learn your state-specific legal protections",
      icon: FileText,
      details: "Browse the 50-state legal database to understand your rights during traffic stops and police encounters.",
      actions: ["View your state's rights", "Read legal protections", "Bookmark important rights"]
    },
    {
      step: 4,
      title: "Practice Voice Commands",
      description: "Learn hands-free emergency activation",
      icon: Mic,
      details: "Practice voice commands for emergency recording, attorney contact, and rights invocation.",
      actions: ["Test voice commands", "Learn emergency phrases", "Practice constitutional rights"]
    },
    {
      step: 5,
      title: "Record Incidents",
      description: "Document encounters with audio/video",
      icon: Camera,
      details: "Use the recording system to capture incidents with GPS coordinates and automatic legal documentation.",
      actions: ["Start recording", "Add incident details", "Generate legal documents"]
    },
    {
      step: 6,
      title: "Emergency Response",
      description: "Activate emergency protocols when needed",
      icon: AlertTriangle,
      details: "Use emergency features to alert contacts, record incidents, and contact legal assistance.",
      actions: ["Alert emergency contacts", "Request legal help", "Access roadside assistance"]
    }
  ];

  const featureGuides = [
    {
      category: "Core Features",
      items: [
        {
          title: "Legal Rights Database",
          description: "Access 50-state legal protections and constitutional rights",
          icon: Shield,
          path: "/rights",
          features: ["State-specific rights", "Traffic stop protections", "Search & seizure laws", "Police accountability"]
        },
        {
          title: "Incident Recording",
          description: "Document encounters with GPS-enabled audio/video recording",
          icon: Camera,
          path: "/record",
          features: ["Audio/video recording", "GPS coordinate tracking", "Automatic transcription", "Evidence management"]
        },
        {
          title: "Emergency System",
          description: "Voice-activated emergency alerts and contact notification",
          icon: Phone,
          path: "/incidents",
          features: ["Voice-activated alerts", "Emergency contact notification", "GPS location sharing", "Real-time status updates"]
        },
        {
          title: "Attorney Network",
          description: "Secure communication with legal professionals",
          icon: MessageSquare,
          path: "/attorneys",
          features: ["Secure messaging", "File sharing", "Attorney matching", "Legal consultation"]
        }
      ]
    },
    {
      category: "Advanced Features",
      items: [
        {
          title: "AI Legal Assistant",
          description: "Get instant answers to legal questions",
          icon: HelpCircle,
          path: "/ai-assistant",
          features: ["Legal Q&A", "Case analysis", "Document review", "Research assistance"]
        },
        {
          title: "Document Generation",
          description: "Create legal documents automatically from incidents",
          icon: FileText,
          path: "/documents",
          features: ["Automated templates", "Incident-based generation", "Legal formatting", "Download & sharing"]
        },
        {
          title: "Roadside Assistance",
          description: "Emergency roadside help and AAA integration",
          icon: Car,
          path: "/roadside",
          features: ["AAA membership management", "Alternative providers", "Emergency calls", "Service tracking"]
        },
        {
          title: "Bluetooth Integration",
          description: "Connect external devices for enhanced recording",
          icon: Bluetooth,
          path: "/settings",
          features: ["Dashcam integration", "Body camera support", "Multi-device recording", "Device synchronization"]
        }
      ]
    }
  ];

  const faqCategories = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create my first incident recording?",
          a: "Go to the Record page, grant camera/microphone permissions, and tap 'Start Recording'. Your GPS location will be automatically captured. You can also use voice commands like 'CAREN start recording' for hands-free activation."
        },
        {
          q: "What voice commands can I use?",
          a: "Key commands include: 'CAREN start recording', 'I invoke my fourth amendment rights', 'Call my attorney', 'Emergency alert', and 'Stop recording'. Practice these in the Voice Commands section."
        },
        {
          q: "How do I add emergency contacts?",
          a: "Go to Settings → Emergency Contacts. Add names, phone numbers, and email addresses. These contacts will be notified during emergency situations with your GPS location."
        },
        {
          q: "Where can I see my legal rights?",
          a: "Visit the Rights page to see your state-specific legal protections. The system uses your GPS location to automatically display relevant laws for your current state."
        }
      ]
    },
    {
      category: "Recording & Evidence",
      questions: [
        {
          q: "How long can I record for?",
          a: "Recording length depends on your subscription tier. Essential (Free) allows 15-minute recordings, while higher tiers offer unlimited recording time with extended cloud storage."
        },
        {
          q: "Is my recording data secure?",
          a: "Yes, all recordings are encrypted during transmission and storage. Only you and authorized legal counsel have access to your evidence files."
        },
        {
          q: "Can I record in multiple states?",
          a: "Yes, CAREN works in all 50 states and automatically adjusts legal information based on your current GPS location."
        },
        {
          q: "What happens if my phone dies during recording?",
          a: "Recordings are saved periodically during capture. Any recorded content up to the point of power loss will be preserved and accessible when you restart the app."
        }
      ]
    },
    {
      category: "Legal & Attorney Features",
      questions: [
        {
          q: "How do I contact an attorney through CAREN?",
          a: "Go to the Attorneys page to browse available legal professionals. You can send secure messages, share incident recordings, and schedule consultations directly through the platform."
        },
        {
          q: "Are attorney communications confidential?",
          a: "Yes, all attorney-client communications through CAREN are protected by attorney-client privilege and encrypted end-to-end for maximum security."
        },
        {
          q: "Can I generate legal documents from my incidents?",
          a: "Yes, visit the Documents page to automatically generate legal forms based on your recorded incidents. Templates include complaints, evidence summaries, and witness statements."
        },
        {
          q: "What legal rights does CAREN cover?",
          a: "CAREN covers 400+ legal protections across all 50 states, including traffic stop rights, recording laws, search and seizure protections, and police accountability measures."
        }
      ]
    },
    {
      category: "Subscription & Billing",
      questions: [
        {
          q: "What's included in the free version?",
          a: "Essential Protection includes the complete legal database, basic voice commands, single-device recording, 3 emergency contacts, GPS tracking, and 7-day cloud storage."
        },
        {
          q: "How does family protection work?",
          a: "Family Protection ($19.99/month) supports up to 6 family members with shared emergency contacts, family dashboard monitoring, and coordinated emergency response."
        },
        {
          q: "Can I upgrade or downgrade my subscription?",
          a: "Yes, you can change your subscription tier at any time from the Pricing page. Changes take effect at your next billing cycle."
        },
        {
          q: "Do you offer refunds?",
          a: "Please contact CAREN support for refund requests. We'll review your case and process eligible refunds according to our terms of service."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "Why aren't my voice commands working?",
          a: "Ensure microphone permissions are granted and you're in a quiet environment. Voice commands require clear pronunciation and must match exact patterns. Check the Voice Commands page for proper phrasing."
        },
        {
          q: "How do I connect Bluetooth devices?",
          a: "Go to Settings → Bluetooth Integration. Pair your dashcam, body camera, or other recording devices. Higher subscription tiers support unlimited device connections."
        },
        {
          q: "Can I use CAREN offline?",
          a: "Basic recording functions work offline, but GPS location services, attorney messaging, and cloud sync require internet connectivity. Legal rights data is cached for offline access."
        },
        {
          q: "How do I backup my data?",
          a: "All incident recordings and documents are automatically backed up to secure cloud storage. You can export your data anytime from Settings → Data Management."
        }
      ]
    }
  ];

  const emergencyGuide = [
    {
      situation: "Traffic Stop",
      steps: [
        "Say 'CAREN start recording' to begin audio/video capture",
        "Keep hands visible and follow officer instructions",
        "Use voice command 'I invoke my fourth amendment rights' if needed",
        "Say 'Emergency alert' if situation escalates",
        "Recording automatically includes GPS coordinates and timestamp"
      ],
      voiceCommands: ["CAREN start recording", "I invoke my fourth amendment rights", "Emergency alert", "Call my attorney"]
    },
    {
      situation: "Police Encounter",
      steps: [
        "Activate recording immediately with voice command",
        "Remain calm and clearly state your constitutional rights",
        "Do not resist, even if you believe the stop is unlawful",
        "Use 'Call my attorney' command if arrested",
        "Emergency contacts are automatically notified if system detects escalation"
      ],
      voiceCommands: ["CAREN start recording", "I invoke my fifth amendment rights", "I want my attorney", "Emergency alert"]
    },
    {
      situation: "Emergency Situation",
      steps: [
        "Say 'Emergency alert' for immediate help",
        "Your location is shared with emergency contacts",
        "Use 'Call 911' for medical/fire emergencies",
        "Recording captures all audio evidence",
        "Legal documents are generated automatically"
      ],
      voiceCommands: ["Emergency alert", "Call 911", "CAREN start recording", "Call my attorney"]
    }
  ];

  const filteredFAQ = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(item =>
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  // Live Chat Functionality
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessage = {
      id: chatMessages.length + 1,
      sender: "user",
      text: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput("");
    
    // Simulate support response
    setTimeout(() => {
      const responses = [
        "Thank you for your message. A support agent will assist you shortly.",
        "I understand your concern. Let me help you with that right away.",
        "For immediate legal emergencies, please call our emergency line at 1-800-CAREN-911.",
        "I've noted your issue and will connect you with a specialist.",
        "Would you like me to schedule a callback with our technical team?"
      ];
      
      const supportResponse = {
        id: chatMessages.length + 2,
        sender: "support",
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, supportResponse]);
    }, 1500);
  };

  // Support Ticket Submission
  const submitTicket = useMutation({
    mutationFn: async (ticketData: typeof ticketForm) => {
      return await apiRequest('/api/support/tickets', {
        method: 'POST',
        body: ticketData
      });
    },
    onSuccess: () => {
      toast({
        title: "Support Ticket Submitted",
        description: "Your ticket has been created successfully. You'll receive a confirmation email shortly.",
      });
      setTicketOpen(false);
      setTicketForm({
        subject: "",
        category: "",
        priority: "",
        description: "",
        email: ""
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit your ticket. Please try again or contact us directly.",
        variant: "destructive"
      });
    }
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketForm.subject || !ticketForm.category || !ticketForm.description || !ticketForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    submitTicket.mutate(ticketForm);
  };

  return (
    <div className="flex h-screen cyber-page-background">
      <Sidebar />
      <div className="flex-1 overflow-auto ml-72">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="cyber-title text-3xl mb-2">Help & Support Center</h1>
              <p className="text-cyan-400">Complete guide to using CAREN's legal protection platform</p>
            </div>

            {/* Search Bar */}
            <Card className="mb-6 cyber-card">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 h-4 w-4" />
                  <Input
                    placeholder="Search help topics, features, or questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="getting-started" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 border border-gray-700/50">
                <TabsTrigger value="getting-started" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Getting Started</TabsTrigger>
                <TabsTrigger value="features" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Features</TabsTrigger>
                <TabsTrigger value="emergency" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Emergency Guide</TabsTrigger>
                <TabsTrigger value="faq" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">FAQ</TabsTrigger>
                <TabsTrigger value="contact" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Contact</TabsTrigger>
              </TabsList>

              {/* Getting Started Tab */}
              <TabsContent value="getting-started" className="space-y-6">
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 cyber-text-primary">
                      <Play className="h-5 w-5 text-cyan-400" />
                      App Flow & Setup Guide
                    </CardTitle>
                    <CardDescription className="cyber-text-secondary">
                      Follow these steps to get the most out of CAREN's protection features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {appFlow.map((step) => {
                        const Icon = step.icon;
                        return (
                          <div key={step.step} className="flex gap-4 p-4 border border-gray-700/50 bg-gray-800/30 rounded-lg">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <Icon className="h-5 w-5 text-blue-400" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">Step {step.step}</Badge>
                                <h3 className="font-semibold cyber-text-primary">{step.title}</h3>
                              </div>
                              <p className="cyber-text-secondary mb-3">{step.details}</p>
                              <div className="flex flex-wrap gap-2">
                                {step.actions.map((action, index) => (
                                  <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300 bg-gray-800/50">
                                    {action}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {step.step < appFlow.length && (
                              <ArrowRight className="h-5 w-5 text-gray-400 mt-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Start Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <a href="/rights">
                    <Card className="cursor-pointer cyber-card hover:border-cyan-400/50 transition-all duration-300">
                      <CardContent className="p-4 text-center">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                        <h3 className="font-semibold mb-1 cyber-text-primary">View Legal Rights</h3>
                        <p className="text-sm cyber-text-secondary">Know your protections</p>
                      </CardContent>
                    </Card>
                  </a>
                  <a href="/record">
                    <Card className="cursor-pointer cyber-card hover:border-cyan-400/50 transition-all duration-300">
                      <CardContent className="p-4 text-center">
                        <Camera className="h-8 w-8 mx-auto mb-2 text-green-400" />
                        <h3 className="font-semibold mb-1 cyber-text-primary">Start Recording</h3>
                        <p className="text-sm cyber-text-secondary">Document incidents</p>
                      </CardContent>
                    </Card>
                  </a>
                  <a href="/settings">
                    <Card className="cursor-pointer cyber-card hover:border-cyan-400/50 transition-all duration-300">
                      <CardContent className="p-4 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                        <h3 className="font-semibold mb-1 cyber-text-primary">Add Contacts</h3>
                        <p className="text-sm cyber-text-secondary">Set emergency contacts</p>
                      </CardContent>
                    </Card>
                  </a>
                  <a href="/settings">
                    <Card className="cursor-pointer cyber-card hover:border-cyan-400/50 transition-all duration-300">
                      <CardContent className="p-4 text-center">
                        <Mic className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                        <h3 className="font-semibold mb-1 cyber-text-primary">Voice Commands</h3>
                        <p className="text-sm cyber-text-secondary">Practice hands-free control</p>
                      </CardContent>
                    </Card>
                  </a>
                </div>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="space-y-6">
                {featureGuides.map((category) => (
                  <Card key={category.category} className="cyber-card">
                    <CardHeader>
                      <CardTitle className="cyber-text-primary">{category.category}</CardTitle>
                      <CardDescription className="cyber-text-secondary">
                        Comprehensive guide to CAREN's {category.category.toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.title} className="p-4 border border-gray-700/50 bg-gray-800/30 rounded-lg">
                              <div className="flex items-start gap-3">
                                <Icon className="h-6 w-6 text-blue-400 mt-1" />
                                <div className="flex-1">
                                  <h3 className="font-semibold mb-1 cyber-text-primary">{item.title}</h3>
                                  <p className="text-sm cyber-text-secondary mb-3">{item.description}</p>
                                  <div className="space-y-1">
                                    {item.features.map((feature, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="h-3 w-3 text-green-400" />
                                        <span className="cyber-text-secondary">{feature}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <a href={item.path}>
                                    <Button variant="outline" size="sm" className="mt-3 border-gray-600 text-white hover:bg-gray-700/50">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Go to {item.title}
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Emergency Guide Tab */}
              <TabsContent value="emergency" className="space-y-6">
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                      Emergency Situations Guide
                    </CardTitle>
                    <CardDescription className="cyber-text-secondary">
                      How to use CAREN during critical encounters and emergencies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {emergencyGuide.map((guide) => (
                        <div key={guide.situation} className="p-4 border-l-4 border-red-500 bg-red-500/10">
                          <h3 className="font-semibold text-red-400 mb-3">{guide.situation}</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2 cyber-text-primary">Steps to Take:</h4>
                              <ol className="space-y-1">
                                {guide.steps.map((step, index) => (
                                  <li key={index} className="flex gap-2 text-sm">
                                    <span className="bg-red-500/20 text-red-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                      {index + 1}
                                    </span>
                                    <span className="cyber-text-secondary">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2 cyber-text-primary">Voice Commands:</h4>
                              <div className="space-y-1">
                                {guide.voiceCommands.map((command, index) => (
                                  <Badge key={index} variant="outline" className="mr-2 mb-1 text-xs border-cyan-500/30 text-cyan-300">
                                    "{command}"
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FAQ Tab */}
              <TabsContent value="faq" className="space-y-6">
                <Card className="cyber-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 cyber-text-primary">
                      <HelpCircle className="h-5 w-5 text-cyan-400" />
                      Frequently Asked Questions
                    </CardTitle>
                    <CardDescription className="cyber-text-secondary">
                      Find answers to common questions about CAREN's features and functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(searchTerm ? filteredFAQ : faqCategories).map((category) => (
                      <div key={category.category} className="mb-6">
                        <h3 className="font-semibold text-lg mb-3 cyber-text-primary">{category.category}</h3>
                        <Accordion type="single" collapsible className="space-y-2">
                          {category.questions.map((item, index) => (
                            <AccordionItem key={index} value={`${category.category}-${index}`} className="border border-gray-700/50 bg-gray-800/30 rounded-lg px-4">
                              <AccordionTrigger className="text-left font-medium cyber-text-primary">
                                {item.q}
                              </AccordionTrigger>
                              <AccordionContent className="cyber-text-secondary pb-4">
                                {item.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="cyber-card">
                    <CardHeader>
                      <CardTitle className="cyber-text-primary">Get Support</CardTitle>
                      <CardDescription className="cyber-text-secondary">
                        Multiple ways to get help with CAREN
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                        <DialogTrigger asChild>
                          <div className="flex items-center gap-3 p-3 border border-gray-700/50 bg-gray-800/30 rounded-lg cursor-pointer hover:bg-gray-700/30 transition-colors">
                            <MessageSquare className="h-5 w-5 text-blue-400" />
                            <div className="flex-1">
                              <h4 className="font-medium cyber-text-primary">Live Chat Support</h4>
                              <p className="text-sm cyber-text-secondary">Available 24/7 for premium users</p>
                            </div>
                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                              Start Chat
                            </Button>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
                          <DialogHeader>
                            <DialogTitle className="cyber-text-primary flex items-center gap-2">
                              <MessageSquare className="h-5 w-5 text-blue-400" />
                              Live Support Chat
                            </DialogTitle>
                            <DialogDescription className="cyber-text-secondary">
                              Chat with our support team in real-time
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Chat Messages */}
                            <div className="h-64 overflow-y-auto border border-gray-700 rounded-lg p-3 space-y-2 bg-gray-800/50">
                              {chatMessages.map((message) => (
                                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                                    message.sender === 'user' 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-700 text-gray-200'
                                  }`}>
                                    <p>{message.text}</p>
                                    <span className="text-xs opacity-60">
                                      {message.timestamp.toLocaleTimeString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Chat Input */}
                            <div className="flex gap-2">
                              <Input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type your message..."
                                className="bg-gray-800 border-gray-600 text-white"
                                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                              />
                              <Button 
                                onClick={sendChatMessage}
                                disabled={!chatInput.trim()}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                Send
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="flex items-center gap-3 p-3 border border-gray-700/50 bg-gray-800/30 rounded-lg">
                        <Phone className="h-5 w-5 text-green-400" />
                        <div className="flex-1">
                          <h4 className="font-medium cyber-text-primary">Emergency Legal Line</h4>
                          <p className="text-sm cyber-text-secondary">1-800-CAREN-911 (Legal Shield Pro+)</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-green-400 text-green-400 hover:bg-green-400/10">
                          Call Now
                        </Button>
                      </div>

                      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
                        <DialogTrigger asChild>
                          <div className="flex items-center gap-3 p-3 border border-gray-700/50 bg-gray-800/30 rounded-lg cursor-pointer hover:bg-gray-700/30 transition-colors">
                            <FileText className="h-5 w-5 text-purple-400" />
                            <div className="flex-1">
                              <h4 className="font-medium cyber-text-primary">Submit Support Ticket</h4>
                              <p className="text-sm cyber-text-secondary">Detailed support for complex issues</p>
                            </div>
                            <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                              Create Ticket
                            </Button>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="cyber-text-primary flex items-center gap-2">
                              <FileText className="h-5 w-5 text-purple-400" />
                              Create Support Ticket
                            </DialogTitle>
                            <DialogDescription className="cyber-text-secondary">
                              Submit a detailed support request for technical assistance
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleTicketSubmit} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium cyber-text-primary mb-1">
                                Email Address *
                              </label>
                              <Input
                                type="email"
                                required
                                value={ticketForm.email}
                                onChange={(e) => setTicketForm(prev => ({ ...prev, email: e.target.value }))}
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="your@email.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium cyber-text-primary mb-1">
                                Subject *
                              </label>
                              <Input
                                required
                                value={ticketForm.subject}
                                onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="Brief description of your issue"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium cyber-text-primary mb-1">
                                  Category *
                                </label>
                                <Select value={ticketForm.category} onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}>
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-600">
                                    <SelectItem value="technical">Technical Issue</SelectItem>
                                    <SelectItem value="account">Account & Billing</SelectItem>
                                    <SelectItem value="legal">Legal Questions</SelectItem>
                                    <SelectItem value="recording">Recording Problems</SelectItem>
                                    <SelectItem value="emergency">Emergency Features</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium cyber-text-primary mb-1">
                                  Priority
                                </label>
                                <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}>
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-600">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium cyber-text-primary mb-1">
                                Description *
                              </label>
                              <Textarea
                                required
                                value={ticketForm.description}
                                onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                                placeholder="Please provide a detailed description of your issue, including any error messages and steps you've taken..."
                              />
                            </div>
                            <div className="flex gap-2 pt-4">
                              <Button 
                                type="submit" 
                                disabled={submitTicket.isPending}
                                className="bg-purple-500 hover:bg-purple-600 flex-1"
                              >
                                {submitTicket.isPending ? "Submitting..." : "Submit Ticket"}
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setTicketOpen(false)}
                                className="border-gray-600"
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>

                  <Card className="cyber-card">
                    <CardHeader>
                      <CardTitle className="cyber-text-primary">Resources</CardTitle>
                      <CardDescription className="cyber-text-secondary">
                        Additional help and learning materials
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-gray-600 text-white hover:bg-gray-700/50"
                        onClick={() => {
                          toast({
                            title: "Download Started",
                            description: "User manual PDF is downloading...",
                          });
                          // Simulate download
                          const link = document.createElement('a');
                          link.href = '/api/downloads/user-manual.pdf';
                          link.download = 'CAREN-User-Manual.pdf';
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download User Manual (PDF)
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-gray-600 text-white hover:bg-gray-700/50"
                        onClick={() => window.open('https://www.youtube.com/playlist?list=CAREN_TUTORIALS', '_blank')}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Video Tutorials
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-gray-600 text-white hover:bg-gray-700/50"
                        onClick={() => window.location.href = '/rights'}
                      >
                        <Book className="h-4 w-4 mr-2" />
                        Legal Rights Guide
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-gray-600 text-white hover:bg-gray-700/50"
                        onClick={() => window.open('https://community.carenalert.com', '_blank')}
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Community Forum
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Quick Contact Form */}
                  <Card className="cyber-card md:col-span-2">
                    <CardHeader>
                      <CardTitle className="cyber-text-primary">Quick Contact Form</CardTitle>
                      <CardDescription className="cyber-text-secondary">
                        Send us a quick message and we'll get back to you within 24 hours
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4" onSubmit={(e) => {
                        e.preventDefault();
                        toast({
                          title: "Message Sent",
                          description: "Thank you for contacting us. We'll respond within 24 hours.",
                        });
                      }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium cyber-text-primary mb-1">
                              Name
                            </label>
                            <Input
                              required
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium cyber-text-primary mb-1">
                              Email
                            </label>
                            <Input
                              type="email"
                              required
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="your@email.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium cyber-text-primary mb-1">
                            Subject
                          </label>
                          <Input
                            required
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="What can we help you with?"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium cyber-text-primary mb-1">
                            Message
                          </label>
                          <Textarea
                            required
                            className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                            placeholder="Please describe how we can assist you..."
                          />
                        </div>
                        <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600">
                          Send Message
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}