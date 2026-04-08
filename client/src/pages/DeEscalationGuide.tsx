import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MessageSquare, 
  Clock,
  Heart,
  Brain,
  ArrowLeft,
  Scale,
  FileText,
  Camera,
  Gavel,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

export default function DeEscalationGuide() {
  const [activeTab, setActiveTab] = useState("immediate");

  const renderImmediateSafety = () => (
    <div className="space-y-6">
      {/* Critical Actions */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            🚨 IMMEDIATE SAFETY ACTIONS
          </CardTitle>
          <CardDescription className="text-red-700">
            Follow these steps the moment you're pulled over or approached by police
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-red-700">Physical Position:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-red-100 rounded">
                  <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Keep hands on steering wheel</p>
                    <p className="text-sm text-red-600">10 and 2 position, clearly visible</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-100 rounded">
                  <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Turn off engine if requested</p>
                    <p className="text-sm text-red-600">Shows cooperation and reduces threat perception</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-100 rounded">
                  <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Roll down window completely</p>
                    <p className="text-sm text-red-600">Enables clear communication</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-bold text-red-700">Communication:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-red-100 rounded">
                  <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Speak slowly and clearly</p>
                    <p className="text-sm text-red-600">Calm tone reduces tension</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-100 rounded">
                  <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Announce all movements</p>
                    <p className="text-sm text-red-600">"I'm reaching for my license in my wallet"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-100 rounded">
                  <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Use respectful language</p>
                    <p className="text-sm text-red-600">"Sir," "Officer," "Yes, sir"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breathing and Calm */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Stay Calm Under Pressure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-100 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">Breathing Technique</h4>
              <p className="text-sm text-blue-700 mb-2">4-7-8 Method:</p>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Inhale for 4 counts</li>
                <li>• Hold for 7 counts</li>
                <li>• Exhale for 8 counts</li>
                <li>• Repeat 3-4 times</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">Mental Mantras</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• "I will stay calm and get home safely"</li>
                <li>• "Temporary compliance for permanent rights"</li>
                <li>• "Document everything, challenge later"</li>
                <li>• "My safety is the priority"</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">Focus Points</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Think about loved ones waiting</li>
                <li>• Remember this is temporary</li>
                <li>• Focus on controlled breathing</li>
                <li>• Keep end goal in mind: getting home</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Escalation System */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            🚨 EMERGENCY ESCALATION SYSTEM
          </CardTitle>
          <CardDescription className="text-purple-700">
            When the situation becomes aggressive or violent, C.A.R.E.N.™ can automatically contact supervisors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-purple-700">Voice Commands for Supervisor Contact:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-purple-100 rounded">
                  <Phone className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-800">"Contact supervisor"</p>
                    <p className="text-sm text-purple-600">Automatically calls police department's watch commander</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-100 rounded">
                  <Phone className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-800">"Call watch commander"</p>
                    <p className="text-sm text-purple-600">Direct connection to department supervisor line</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-100 rounded">
                  <Phone className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-800">"Get supervisor immediately"</p>
                    <p className="text-sm text-purple-600">Emergency request for immediate supervisor presence</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-bold text-purple-700">Automatic Information Sharing:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-purple-100 rounded">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-800">GPS Location Sent</p>
                    <p className="text-sm text-purple-600">Exact coordinates shared with supervisor</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-100 rounded">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-800">Officer Badge Number</p>
                    <p className="text-sm text-purple-600">If visible, automatically included in report</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-100 rounded">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-800">Incident Summary</p>
                    <p className="text-sm text-purple-600">Context and escalation details provided</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Alert className="bg-purple-100 border-purple-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-purple-800">When to Use Supervisor Contact</AlertTitle>
            <AlertDescription className="text-purple-700">
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Officer becomes verbally aggressive or threatening</li>
                <li>Physical force is used unnecessarily</li>
                <li>Constitutional rights are being violated</li>
                <li>Officer refuses to provide badge number or name</li>
                <li>You feel unsafe or the situation is escalating</li>
                <li>Officer appears intoxicated or behaving erratically</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-purple-200 p-4 rounded-lg">
            <h4 className="font-bold text-purple-800 mb-2">What Supervisors Can Do:</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Immediately respond to the scene</li>
              <li>• Review officer conduct and de-escalate situation</li>
              <li>• Ensure proper procedures are followed</li>
              <li>• Document any misconduct for investigation</li>
              <li>• Provide oversight and accountability</li>
              <li>• Ensure your safety and constitutional rights</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderVerbalDeEscalation = () => (
    <div className="space-y-6">
      {/* What to Say */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            ✅ WHAT TO SAY
          </CardTitle>
          <CardDescription className="text-green-700">
            These phrases help de-escalate tension and protect your rights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-green-700 mb-3">De-escalation Phrases:</h4>
                <div className="space-y-3">
                  {[
                    { phrase: "I understand, officer", explanation: "Shows respect and willingness to cooperate" },
                    { phrase: "I want to comply with your instructions", explanation: "Demonstrates cooperation while maintaining dignity" },
                    { phrase: "I'm not resisting, just documenting", explanation: "Clarifies recording is not confrontational" },
                    { phrase: "May I ask what I'm being stopped for?", explanation: "Polite inquiry about the reason for stop" },
                    { phrase: "I want both of us to be safe", explanation: "Shows concern for officer's well-being" }
                  ].map((item, index) => (
                    <div key={index} className="p-3 bg-green-100 rounded border-l-4 border-green-400">
                      <p className="font-medium text-green-800">"{item.phrase}"</p>
                      <p className="text-sm text-green-600 mt-1">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-green-700 mb-3">Rights Protection:</h4>
                <div className="space-y-3">
                  {[
                    { phrase: "I invoke my right to remain silent", explanation: "5th Amendment protection against self-incrimination" },
                    { phrase: "I do not consent to any searches", explanation: "4th Amendment protection against unreasonable search" },
                    { phrase: "I would like to contact my attorney", explanation: "6th Amendment right to legal counsel" },
                    { phrase: "I'm exercising my constitutional rights", explanation: "General constitutional protection statement" },
                    { phrase: "Am I free to leave?", explanation: "Determines if this is a voluntary encounter" }
                  ].map((item, index) => (
                    <div key={index} className="p-3 bg-green-100 rounded border-l-4 border-green-400">
                      <p className="font-medium text-green-800">"{item.phrase}"</p>
                      <p className="text-sm text-green-600 mt-1">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What NOT to Say */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            ❌ NEVER SAY THESE
          </CardTitle>
          <CardDescription className="text-red-700">
            These phrases escalate tension and can endanger your safety
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-red-700 mb-3">Confrontational Phrases:</h4>
              <div className="space-y-2">
                {[
                  { phrase: "You can't do this!", danger: "Challenges officer's authority directly" },
                  { phrase: "This is harassment!", danger: "Accusatory and inflammatory" },
                  { phrase: "I'm going to sue you!", danger: "Threatening language escalates situation" },
                  { phrase: "I know my rights! (aggressively)", danger: "Confrontational tone provokes defensive response" }
                ].map((item, index) => (
                  <div key={index} className="p-3 bg-red-100 rounded border-l-4 border-red-400">
                    <p className="font-medium text-red-800">"{item.phrase}"</p>
                    <p className="text-sm text-red-600 mt-1">⚠️ {item.danger}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-red-700 mb-3">Self-Incriminating Statements:</h4>
              <div className="space-y-2">
                {[
                  { phrase: "I wasn't doing anything wrong!", danger: "Implies you might have been doing something" },
                  { phrase: "I only had two drinks", danger: "Admits to drinking and driving" },
                  { phrase: "I was just speeding a little", danger: "Admits to traffic violation" },
                  { phrase: "Any profanity or insults", danger: "Highly inflammatory and legally problematic" }
                ].map((item, index) => (
                  <div key={index} className="p-3 bg-red-100 rounded border-l-4 border-red-400">
                    <p className="font-medium text-red-800">"{item.phrase}"</p>
                    <p className="text-sm text-red-600 mt-1">⚠️ {item.danger}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEscalationResponse = () => (
    <div className="space-y-6">
      {/* Warning Signs */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            ⚠️ ESCALATION WARNING SIGNS
          </CardTitle>
          <CardDescription className="text-orange-700">
            Recognize these signs and immediately switch to high-alert mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-orange-700 mb-3">Officer Behavior Changes:</h4>
              <div className="space-y-2">
                {[
                  "Officer's hand moves toward weapon",
                  "Raised voice or aggressive tone",
                  "Multiple officers arrive unexpectedly",
                  "Officer seems agitated or under influence",
                  "Refusing to explain reason for stop",
                  "Making threats or ultimatums",
                  "Backup units without explanation"
                ].map((sign, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 bg-orange-100 rounded">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                    <span className="text-sm text-orange-700">{sign}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-orange-700 mb-3">Environmental Factors:</h4>
              <div className="space-y-2">
                {[
                  "Isolated location with no witnesses",
                  "Multiple police vehicles present",
                  "Officer alone without backup",
                  "Late night or early morning hours",
                  "High-crime area stop",
                  "Officer appears to be recording aggressively",
                  "Traffic stop taking unusually long time"
                ].map((factor, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 bg-orange-100 rounded">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                    <span className="text-sm text-orange-700">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Response Protocol */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            🚨 EMERGENCY RESPONSE PROTOCOL
          </CardTitle>
          <CardDescription className="text-red-700">
            If situation escalates to dangerous levels, follow this protocol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Immediate Actions */}
            <div className="p-4 bg-red-100 rounded-lg border-2 border-red-300">
              <h4 className="font-bold text-red-800 mb-3">Immediate Emergency Actions:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-red-700 mb-2">Voice Commands (C.A.R.E.N.™):</p>
                  <ul className="space-y-1 text-sm text-red-600">
                    <li>• "Emergency recording now"</li>
                    <li>• "Alert my family emergency"</li>
                    <li>• "I need my attorney now"</li>
                    <li>• "Officer safety concern"</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-red-700 mb-2">Verbal Statements:</p>
                  <ul className="space-y-1 text-sm text-red-600">
                    <li>• "May I speak with your supervisor?"</li>
                    <li>• "I am not resisting"</li>
                    <li>• "I need medical attention"</li>
                    <li>• "I fear for my safety"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step-by-Step Response */}
            <div className="space-y-4">
              <h4 className="font-bold text-red-700">Step-by-Step Escalation Response:</h4>
              <div className="space-y-3">
                {[
                  { step: 1, action: "Increase Documentation", description: "Activate C.A.R.E.N.™ recording immediately", priority: "Critical" },
                  { step: 2, action: "Lower Your Voice Even More", description: "Speak even more quietly and slowly", priority: "High" },
                  { step: 3, action: "Emphasize Compliance", description: "Say 'Officer, I'm complying fully with your instructions'", priority: "High" },
                  { step: 4, action: "Request Supervisor", description: "Politely ask 'May I speak with your supervisor?'", priority: "Medium" },
                  { step: 5, action: "Alert Emergency Contacts", description: "Use voice command 'Alert my family emergency'", priority: "Critical" },
                  { step: 6, action: "Prepare for Worst Case", description: "Mental preparation while maintaining calm exterior", priority: "High" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 bg-red-100 rounded">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-red-800">{item.action}</p>
                        <Badge 
                          variant={item.priority === 'Critical' ? 'destructive' : item.priority === 'High' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-red-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Reminder */}
      <Alert className="border-2 border-red-300 bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <AlertTitle className="text-red-800 text-lg font-bold">
          CRITICAL SAFETY REMINDER
        </AlertTitle>
        <AlertDescription className="text-red-700 text-base mt-2">
          <strong>Your primary goal is getting home safely.</strong> Comply first, challenge later in court. 
          Document everything with C.A.R.E.N.™, but prioritize de-escalation over proving a point. 
          Every encounter is temporary - your life and safety are permanent.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderConstitutionalRights = () => (
    <div className="space-y-6">
      {/* Constitutional Rights Overview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Your Constitutional Rights
          </CardTitle>
          <CardDescription className="text-blue-700">
            These rights apply in every police encounter, but exercise them safely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 4th Amendment */}
            <div className="p-4 bg-blue-100 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">4th Amendment - Protection Against Unreasonable Search</h4>
              <div className="space-y-3">
                <p className="text-blue-700 text-sm">
                  "The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures..."
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-blue-700 mb-2">What You Can Say:</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• "I do not consent to any searches"</li>
                      <li>• "I'm exercising my 4th Amendment rights"</li>
                      <li>• "Do you have a warrant?"</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-700 mb-2">What This Protects:</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Your vehicle from warrantless search</li>
                      <li>• Your person from unreasonable searches</li>
                      <li>• Your belongings and personal effects</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 5th Amendment */}
            <div className="p-4 bg-blue-100 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">5th Amendment - Right Against Self-Incrimination</h4>
              <div className="space-y-3">
                <p className="text-blue-700 text-sm">
                  "No person... shall be compelled in any criminal case to be a witness against himself..."
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-blue-700 mb-2">What You Can Say:</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• "I invoke my right to remain silent"</li>
                      <li>• "I choose to exercise my 5th Amendment rights"</li>
                      <li>• "I will not answer questions without my attorney"</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-700 mb-2">What This Protects:</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• You from having to answer questions</li>
                      <li>• Protection against self-incrimination</li>
                      <li>• Right to stay silent during interrogation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 6th Amendment */}
            <div className="p-4 bg-blue-100 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">6th Amendment - Right to Legal Counsel</h4>
              <div className="space-y-3">
                <p className="text-blue-700 text-sm">
                  "In all criminal prosecutions, the accused shall enjoy the right... to have the assistance of counsel for his defense."
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-blue-700 mb-2">What You Can Say:</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• "I want to speak with my attorney"</li>
                      <li>• "I request legal counsel"</li>
                      <li>• "I won't answer questions without my lawyer"</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-700 mb-2">What This Protects:</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Right to have lawyer present during questioning</li>
                      <li>• Right to appointed counsel if you can't afford one</li>
                      <li>• Protection from interrogation without counsel</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 1st Amendment */}
            <div className="p-4 bg-blue-100 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">1st Amendment - Right to Record Police</h4>
              <div className="space-y-3">
                <p className="text-blue-700 text-sm">
                  "Congress shall make no law... abridging the freedom of speech, or of the press..."
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-blue-700 mb-2">What You Can Say:</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• "I'm exercising my 1st Amendment right to record"</li>
                      <li>• "I have the right to document this encounter"</li>
                      <li>• "Recording police is protected speech"</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-700 mb-2">What This Protects:</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Right to record police in public</li>
                      <li>• Protection of recording as free speech</li>
                      <li>• Right to document government actions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Limitations */}
      <Alert className="border-yellow-300 bg-yellow-50">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-800">
          Important: Rights vs. Safety
        </AlertTitle>
        <AlertDescription className="text-yellow-700 mt-2">
          While you have these constitutional rights, always prioritize your immediate safety. 
          Assert your rights calmly and respectfully. If officers violate your rights, 
          document it with C.A.R.E.N.™ and challenge it later through proper legal channels.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderRecordingRights = () => (
    <div className="space-y-6">

      {/* Top Banner */}
      <Alert className="border-cyan-400 bg-cyan-950/60">
        <Camera className="h-5 w-5 text-cyan-400" />
        <AlertTitle className="text-cyan-300 text-base font-bold">
          Your Right to Record Police is Protected by the First Amendment
        </AlertTitle>
        <AlertDescription className="text-cyan-200 mt-1">
          Seven federal appeals courts — including the 10th Circuit — have upheld this right.
          Use this script calmly and clearly. Do not raise your voice. Do not argue.
        </AlertDescription>
      </Alert>

      {/* Step 1 */}
      <Card className="bg-slate-800/80 border-cyan-500/40">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">1</div>
            Officer Says: "It's Illegal to Record Me"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-cyan-900/40 border border-cyan-500/30 rounded-lg">
            <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wide mb-2">Say This — Calmly and Clearly</p>
            <p className="text-white text-base leading-relaxed">
              "Officer, with respect — recording police officers performing their duties in a public place is protected by the First Amendment of the United States Constitution. I am not interfering with your duties and I will continue to comply with your lawful instructions."
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-medium text-sm">Stay calm and still</p>
                <p className="text-green-400/70 text-xs">Lower your voice, not raise it</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-medium text-sm">State it once — then stop</p>
                <p className="text-green-400/70 text-xs">You've made the record. Don't argue</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium text-sm">Don't debate them on the spot</p>
                <p className="text-red-400/70 text-xs">The goal is the recording, not the argument</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-medium text-sm">Don't raise your voice</p>
                <p className="text-red-400/70 text-xs">Volume escalates — calm de-escalates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 */}
      <Card className="bg-slate-800/80 border-orange-500/40">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">2</div>
            Officer Threatens Arrest for Recording (Retaliation)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-900/40 border border-orange-500/30 rounded-lg">
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-wide mb-2">Say This — Still Calm, No Arguing</p>
            <p className="text-white text-base leading-relaxed">
              "Officer, I understand your position. I want you to know that seven federal appeals courts — including the Tenth Circuit Court of Appeals in <em>Irizarry v. Yehia</em> (2022) — have ruled that retaliating against a citizen for recording police in public is a civil rights violation under the First Amendment. I am not resisting. I am documenting this encounter for both our protection."
            </p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-white/10 rounded-lg">
            <p className="text-white font-semibold mb-3 flex items-center gap-2">
              <Gavel className="w-4 h-4 text-yellow-400" />
              Federal Courts That Have Upheld This Right
            </p>
            <div className="space-y-2">
              {[
                { circuit: "1st Circuit", case: "Glik v. Cunniffe (2011)", note: "First to clearly establish the right" },
                { circuit: "3rd Circuit", case: "Fields v. City of Philadelphia (2017)", note: "Covers PA, NJ, DE" },
                { circuit: "5th Circuit", case: "Turner v. Driver (2017)", note: "Covers TX, LA, MS" },
                { circuit: "7th Circuit", case: "ACLU v. Alvarez (2012)", note: "Covers IL, IN, WI" },
                { circuit: "9th Circuit", case: "Fordyce v. City of Seattle (1995)", note: "Covers CA, WA, OR and more" },
                { circuit: "10th Circuit", case: "Irizarry v. Yehia (2022)", note: "Retaliation = civil rights violation" },
                { circuit: "11th Circuit", case: "Smith v. City of Cumming (2000)", note: "Covers FL, GA, AL" },
              ].map((court, i) => (
                <div key={i} className="flex items-start gap-3 p-2 bg-yellow-900/20 border border-yellow-500/20 rounded">
                  <ChevronRight className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-yellow-300 font-semibold text-sm">{court.circuit}:</span>
                    <span className="text-white text-sm ml-1 italic">{court.case}</span>
                    <p className="text-yellow-400/70 text-xs mt-0.5">{court.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3 */}
      <Card className="bg-slate-800/80 border-red-500/40">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
            If the Officer Places You Under Arrest
          </CardTitle>
          <CardDescription className="text-red-300">
            Say this clearly and loudly — for the camera and for the record
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-900/40 border border-red-400/40 rounded-lg">
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wide mb-2">Say Exactly This — Out Loud, For the Camera</p>
            <p className="text-white text-base leading-relaxed">
              "For the record and for the camera — I am complying with the officer's orders. I do not consent to any search or seizure of my person, my vehicle, or my belongings. I am invoking my right to remain silent and I am requesting an attorney immediately. I am not resisting."
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900/60 border border-white/10 rounded-lg text-center">
              <p className="text-cyan-400 font-bold text-sm mb-1">Comply Physically</p>
              <p className="text-gray-300 text-xs">Don't resist. Your body cooperates. Your words preserve your rights.</p>
            </div>
            <div className="p-3 bg-slate-900/60 border border-white/10 rounded-lg text-center">
              <p className="text-cyan-400 font-bold text-sm mb-1">No Consent to Search</p>
              <p className="text-gray-300 text-xs">Say it clearly. Even if they search anyway, non-consent is on record.</p>
            </div>
            <div className="p-3 bg-slate-900/60 border border-white/10 rounded-lg text-center">
              <p className="text-cyan-400 font-bold text-sm mb-1">Request Attorney</p>
              <p className="text-gray-300 text-xs">Once you say it, they must stop questioning you. Say it explicitly.</p>
            </div>
          </div>
          <Alert className="border-red-400 bg-red-950/40">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              After invoking your right to an attorney — <strong>say nothing else</strong>. No explanations, no justifications. 
              The recording is your evidence. Your attorney will handle the rest.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Step 4 */}
      <Card className="bg-slate-800/80 border-purple-500/40">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">4</div>
            Officer Claims "It's Department Policy"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-purple-900/40 border border-purple-500/30 rounded-lg">
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide mb-2">Say This — Respectful, Firm, Final</p>
            <p className="text-white text-base leading-relaxed">
              "Officer, I respect your authority and I understand that is your department's policy. With respect — department policy cannot override a constitutional right. The First Amendment right to record police in a public place, performing their official duties, has been upheld by federal courts across the country. I am not interfering with your duties."
            </p>
          </div>
          <div className="p-4 bg-slate-900/60 border border-white/10 rounded-lg">
            <p className="text-purple-300 font-semibold text-sm mb-2">Why This Works Legally</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />Department policy is internal rules — it cannot override the U.S. Constitution</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />The Supremacy Clause means federal constitutional rights supersede local policies</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />Officers can be personally liable under 42 U.S.C. § 1983 for civil rights violations</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />Getting their badge number and recording this statement protects you in any lawsuit</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Bottom reminder */}
      <Alert className="border-2 border-cyan-400/50 bg-cyan-950/40">
        <Shield className="h-5 w-5 text-cyan-400" />
        <AlertTitle className="text-cyan-300 font-bold">Remember: The Recording IS the Win</AlertTitle>
        <AlertDescription className="text-cyan-200 mt-1">
          You don't need to win the argument at the scene. You need to get home safely and get it on record. 
          C.A.R.E.N.™ is documenting everything. Your attorney will use that footage. Stay calm. Stay safe. Challenge it in court.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">De-Escalation Safety Guide</h1>
          </div>
          <p className="text-cyan-300 text-lg">
            Critical strategies to stay safe during police encounters
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-black/20 border border-cyan-500/30">
              <TabsTrigger 
                value="immediate" 
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 text-gray-400"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Immediate Safety</span>
                <span className="sm:hidden">Safety</span>
              </TabsTrigger>
              <TabsTrigger 
                value="verbal" 
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-gray-400"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">What to Say</span>
                <span className="sm:hidden">Script</span>
              </TabsTrigger>
              <TabsTrigger 
                value="escalation" 
                className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300 text-gray-400"
              >
                <Phone className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">If It Escalates</span>
                <span className="sm:hidden">Escalate</span>
              </TabsTrigger>
              <TabsTrigger 
                value="rights" 
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 text-gray-400"
              >
                <Scale className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Your Rights</span>
                <span className="sm:hidden">Rights</span>
              </TabsTrigger>
              <TabsTrigger 
                value="recording" 
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 text-gray-400"
              >
                <Camera className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Recording Rights</span>
                <span className="sm:hidden">Record</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="immediate" className="space-y-6">
              {renderImmediateSafety()}
            </TabsContent>

            <TabsContent value="verbal" className="space-y-6">
              {renderVerbalDeEscalation()}
            </TabsContent>

            <TabsContent value="escalation" className="space-y-6">
              {renderEscalationResponse()}
            </TabsContent>

            <TabsContent value="rights" className="space-y-6">
              {renderConstitutionalRights()}
            </TabsContent>

            <TabsContent value="recording" className="space-y-6">
              {renderRecordingRights()}
            </TabsContent>
          </Tabs>
        </div>

        {/* Emergency Quick Actions */}
        <Card className="mt-8 bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-300 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Emergency Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/emergency-pullover">
                <Button className="w-full h-16 bg-red-600 hover:bg-red-700 text-white">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-bold">Emergency Pullover</div>
                    <div className="text-sm opacity-90">I'm being pulled over</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/record">
                <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white">
                  <FileText className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-bold">Start Recording</div>
                    <div className="text-sm opacity-90">Document the encounter</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/emergency-contacts">
                <Button className="w-full h-16 bg-green-600 hover:bg-green-700 text-white">
                  <Phone className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-bold">Alert Contacts</div>
                    <div className="text-sm opacity-90">Notify family/attorney</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </MobileResponsiveLayout>
  );
}