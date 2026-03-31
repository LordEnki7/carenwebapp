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
  FileText
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
            <TabsList className="grid w-full grid-cols-4 bg-black/20 border border-cyan-500/30">
              <TabsTrigger 
                value="immediate" 
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 text-gray-400"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Immediate Safety
              </TabsTrigger>
              <TabsTrigger 
                value="verbal" 
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-gray-400"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                What to Say
              </TabsTrigger>
              <TabsTrigger 
                value="escalation" 
                className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300 text-gray-400"
              >
                <Phone className="w-4 h-4 mr-2" />
                If It Escalates
              </TabsTrigger>
              <TabsTrigger 
                value="rights" 
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 text-gray-400"
              >
                <Scale className="w-4 h-4 mr-2" />
                Your Rights
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