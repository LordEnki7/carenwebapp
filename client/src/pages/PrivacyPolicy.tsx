import { Link } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "February 17, 2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 text-sm mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
          </div>
          <p className="text-gray-400 text-sm">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>C.A.R.E.N.™ (Citizen Assistance for Roadside Emergencies and Navigation) ("we," "our," or "the App") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web platform. Please read this policy carefully. By using C.A.R.E.N.™, you consent to the practices described in this Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">2.1 Personal Information</h3>
            <p className="mb-2">When you create an account or use our services, we may collect:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Name and email address</li>
              <li>Account credentials (managed through secure third-party authentication)</li>
              <li>Subscription and payment information (processed securely through Stripe)</li>
              <li>Emergency contact details you provide</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">2.2 Location Data</h3>
            <p>C.A.R.E.N.™ uses GPS and location services to provide state-specific legal rights information and emergency response features. Location data is used to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Determine your current state/jurisdiction for accurate legal rights display</li>
              <li>Embed GPS coordinates in incident documentation</li>
              <li>Share your location with emergency contacts during an emergency</li>
              <li>Provide location-aware roadside assistance</li>
            </ul>
            <p className="mt-2">Location data is collected only when the app is in active use and you have granted location permissions. You can revoke location access at any time through your device settings.</p>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">2.3 Audio and Video Recordings</h3>
            <p>When you use our recording features, we may collect:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Audio recordings during police encounters or emergencies</li>
              <li>Video recordings for evidence documentation</li>
              <li>Associated metadata (timestamps, GPS coordinates, duration)</li>
            </ul>
            <p className="mt-2">Recordings are initiated only by you and are stored locally on your device by default. If you enable cloud sync, recordings are encrypted end-to-end using AES-256-GCM encryption before transmission.</p>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">2.4 Biometric Data</h3>
            <p>If you enable biometric authentication (fingerprint or facial recognition) for accessing sensitive features like attorney messaging, biometric data is processed locally on your device through your operating system's built-in biometric framework. We do not store, transmit, or have access to your biometric data.</p>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">2.5 Usage and Analytics Data</h3>
            <p>We collect anonymized usage data to improve the app, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Features used and frequency of use</li>
              <li>App performance metrics</li>
              <li>Error reports and crash logs</li>
              <li>Device type and operating system version</li>
            </ul>

            <h3 className="text-lg font-medium text-cyan-300 mt-4 mb-2">2.6 Voice Command Data</h3>
            <p>Voice commands are processed to enable hands-free operation. Voice data is used in real-time for command recognition and is not stored permanently unless you are actively recording an incident.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide GPS-enabled, state-specific legal rights information</li>
              <li>Facilitate emergency response and notification services</li>
              <li>Enable incident recording and evidence documentation</li>
              <li>Connect you with attorneys through our secure messaging system</li>
              <li>Process subscription payments and manage your account</li>
              <li>Send emergency notifications to your designated contacts via SMS and email</li>
              <li>Provide AI-powered legal assistance, incident analysis, and voice coaching</li>
              <li>Deliver educational email content (if you opt in to our email course)</li>
              <li>Improve app performance, features, and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing and Disclosure</h2>
            <p className="mb-2">We do not sell your personal information. We may share your data only in these circumstances:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-white">Emergency Contacts:</strong> Your location and emergency status are shared with contacts you designate, only when you activate an emergency</li>
              <li><strong className="text-white">Attorneys:</strong> Information you choose to share through our secure attorney messaging system</li>
              <li><strong className="text-white">Payment Processing:</strong> Payment information is handled directly by Stripe and is never stored on our servers</li>
              <li><strong className="text-white">Email Services:</strong> Your email address is shared with our email service provider (SendGrid) solely to deliver account-related and educational emails</li>
              <li><strong className="text-white">AI Services:</strong> Anonymized query data is processed through AI services to provide legal assistance and incident analysis. No personally identifiable information is included in AI requests</li>
              <li><strong className="text-white">Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
            <p>We implement robust security measures to protect your data:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>End-to-end AES-256-GCM encryption for cloud-synced recordings and attorney communications</li>
              <li>Secure HTTPS connections for all data transmission</li>
              <li>HttpOnly, secure cookies for session management</li>
              <li>Content Security Policy (CSP) headers in production</li>
              <li>Rate limiting to prevent abuse</li>
              <li>Regular security audits and session cleanup</li>
              <li>Password hashing using bcrypt for any locally stored credentials</li>
            </ul>
            <p className="mt-2">While we strive to protect your information, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p>We retain your data as follows:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-white">Account Data:</strong> Retained while your account is active. You may request deletion at any time</li>
              <li><strong className="text-white">Recordings:</strong> Stored locally on your device unless you enable cloud sync. Cloud-synced recordings are retained until you delete them</li>
              <li><strong className="text-white">Location Data:</strong> Used in real-time and embedded in incident reports only. Not stored independently</li>
              <li><strong className="text-white">Analytics Data:</strong> Anonymized usage data is retained for up to 12 months</li>
              <li><strong className="text-white">Session Data:</strong> Expired sessions are automatically cleaned up</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-white">Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong className="text-white">Correction:</strong> Request correction of inaccurate personal data</li>
              <li><strong className="text-white">Deletion:</strong> Request deletion of your personal data and account</li>
              <li><strong className="text-white">Portability:</strong> Request your data in a portable format</li>
              <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing emails at any time</li>
              <li><strong className="text-white">Withdraw Consent:</strong> Revoke permissions (location, camera, microphone) through your device settings</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, please contact us at the email address listed below.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Children's Privacy</h2>
            <p>C.A.R.E.N.™ is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we learn we have collected data from a child under 13, we will promptly delete it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Third-Party Services</h2>
            <p className="mb-2">Our app integrates with the following third-party services, each governed by their own privacy policies:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong className="text-white">Stripe</strong> — Payment processing</li>
              <li><strong className="text-white">SendGrid</strong> — Email delivery</li>
              <li><strong className="text-white">OpenStreetMap Nominatim</strong> — Reverse geocoding (no personal data shared)</li>
              <li><strong className="text-white">OpenAI</strong> — AI-powered legal assistance (anonymized queries only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy within the app and updating the "Last Updated" date. Your continued use of C.A.R.E.N.™ after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at:</p>
            <p className="mt-2 text-cyan-400">support@carenalert.com</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm space-y-2">
          <p>&copy; {new Date().getFullYear()} C.A.R.E.N.™ All rights reserved.</p>
          <div className="flex justify-center gap-4">
            <Link href="/terms" className="text-cyan-400 hover:text-cyan-300">Terms of Service</Link>
            <span>|</span>
            <Link href="/" className="text-cyan-400 hover:text-cyan-300">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
