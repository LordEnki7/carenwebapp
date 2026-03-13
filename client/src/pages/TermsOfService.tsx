import { Link } from "wouter";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  const lastUpdated = "February 17, 2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 text-sm mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Terms of Service</h1>
          </div>
          <p className="text-gray-400 text-sm">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By downloading, installing, or using C.A.R.E.N.™ (Citizen Assistance for Roadside Emergencies and Navigation) ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>C.A.R.E.N.™ is a personal safety and legal awareness platform that provides:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>GPS-enabled, state-specific legal rights information</li>
              <li>Audio and video incident recording</li>
              <li>Emergency contact notification</li>
              <li>Voice-activated commands for hands-free operation</li>
              <li>Secure attorney communication</li>
              <li>AI-powered legal assistance and incident analysis</li>
              <li>Roadside assistance coordination</li>
              <li>Multi-device Bluetooth integration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Important Disclaimers</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 font-semibold mb-2">Critical Notice</p>
              <p className="text-yellow-200">C.A.R.E.N.™ is an informational and documentation tool. It is NOT a substitute for professional legal counsel, emergency services (911), or law enforcement.</p>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Not Legal Advice:</strong> The legal information provided by C.A.R.E.N.™, including AI-powered responses, is for general informational purposes only and does not constitute legal advice. Laws vary by jurisdiction and change over time. Always consult a licensed attorney for legal guidance specific to your situation.</li>
              <li><strong className="text-white">Not Emergency Services:</strong> C.A.R.E.N.™ is not a replacement for 911 or other emergency services. In any life-threatening emergency, call 911 first. Our emergency notification features are supplementary tools only.</li>
              <li><strong className="text-white">No Guarantee of Accuracy:</strong> While we strive to maintain accurate and up-to-date legal information across all 50 states and Washington D.C., we cannot guarantee the completeness or accuracy of all legal data at all times.</li>
              <li><strong className="text-white">AI Limitations:</strong> AI-powered features (legal assistant, incident analysis, voice coaching, attorney matching) provide automated suggestions based on general patterns. AI responses may contain errors and should not be relied upon as definitive legal guidance.</li>
              <li><strong className="text-white">Recording Laws:</strong> Recording laws vary by state. Some states require all-party consent for recording. It is your responsibility to understand and comply with recording laws in your jurisdiction. C.A.R.E.N.™ displays relevant recording laws but cannot guarantee compliance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. User Accounts</h2>
            <p className="mb-2">To use certain features, you must create an account. You agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activity under your account</li>
            </ul>
            <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Subscriptions and Payments</h2>
            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">5.1 Subscription Tiers</h3>
            <p>C.A.R.E.N.™ offers multiple subscription tiers with varying levels of access. Features available to you depend on your subscription level. Free features may be limited compared to paid tiers.</p>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">5.2 Billing</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Payments are processed securely through Stripe</li>
              <li>Subscription fees are billed according to the billing cycle you select (monthly or one-time)</li>
              <li>Prices are listed in U.S. dollars and are subject to change with notice</li>
            </ul>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">5.3 Cancellations and Refunds</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Cancellation takes effect at the end of your current billing period</li>
              <li>Refund requests are evaluated on a case-by-case basis. Contact support for refund inquiries</li>
              <li>One-time purchase tiers are non-refundable after 14 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. User Content and Recordings</h2>
            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">6.1 Ownership</h3>
            <p>You retain ownership of all content you create using C.A.R.E.N.™, including audio and video recordings, incident reports, and submitted feedback.</p>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">6.2 License</h3>
            <p>By using our cloud sync features, you grant us a limited, non-exclusive license to store and process your encrypted content solely for the purpose of providing the service to you.</p>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">6.3 Responsibility</h3>
            <p>You are solely responsible for the content you record and how you use it. You must comply with all applicable local, state, and federal laws regarding recording, including consent requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Acceptable Use</h2>
            <p className="mb-2">You agree not to use C.A.R.E.N.™ to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Violate any laws or regulations</li>
              <li>Record individuals without proper consent where required by law</li>
              <li>Harass, threaten, or intimidate any person</li>
              <li>Submit false emergency alerts or misuse emergency features</li>
              <li>Interfere with the operation of the App or its infrastructure</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data</li>
              <li>Use the App for any commercial purpose not authorized by us</li>
              <li>Reverse-engineer, decompile, or disassemble the App</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Attorney Communication</h2>
            <p>C.A.R.E.N.™ facilitates communication between users and attorneys through our platform. We are not a law firm and do not provide legal services. Communications with attorneys through our platform may be subject to attorney-client privilege, but we make no guarantees regarding the establishment of such privilege. The selection of an attorney is your decision and responsibility.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Emergency Features</h2>
            <p>C.A.R.E.N.™'s emergency notification features (SMS alerts, email notifications, location sharing) depend on network connectivity, device functionality, and third-party service availability. We do not guarantee that emergency notifications will be delivered successfully in all circumstances. These features supplement, but do not replace, calling 911 or contacting local emergency services directly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, C.A.R.E.N.™ AND ITS DEVELOPERS, OFFICERS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Loss of data or recordings</li>
              <li>Failure of emergency notifications to be delivered</li>
              <li>Inaccuracies in legal information</li>
              <li>Actions taken based on AI-generated advice</li>
              <li>Interruption or unavailability of the service</li>
              <li>Legal consequences arising from recording in jurisdictions with consent requirements</li>
            </ul>
            <p className="mt-2">Our total liability shall not exceed the amount you paid for the service in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Indemnification</h2>
            <p>You agree to indemnify and hold harmless C.A.R.E.N.™ and its affiliates from any claims, damages, or expenses arising from your use of the App, violation of these Terms, or violation of any law or rights of a third party.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Intellectual Property</h2>
            <p>All content, features, and functionality of C.A.R.E.N.™ — including but not limited to text, graphics, logos, icons, software, the legal database, and AI models — are owned by C.A.R.E.N.™ and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Modifications to Service and Terms</h2>
            <p>We reserve the right to modify, suspend, or discontinue any part of C.A.R.E.N.™ at any time. We may update these Terms periodically. Material changes will be communicated through the App or by email. Continued use after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Governing Law</h2>
            <p>These Terms are governed by the laws of the United States. Any disputes arising from these Terms or your use of C.A.R.E.N.™ shall be resolved in the appropriate courts within the United States.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">15. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full effect.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">16. Contact</h2>
            <p>For questions about these Terms of Service, please contact us at:</p>
            <p className="mt-2 text-cyan-400">support@carenalert.com</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm space-y-2">
          <p>&copy; {new Date().getFullYear()} C.A.R.E.N.™ All rights reserved.</p>
          <div className="flex justify-center gap-4">
            <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</Link>
            <span>|</span>
            <Link href="/" className="text-cyan-400 hover:text-cyan-300">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
