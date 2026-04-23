import { ArrowLeft, Shield, MapPin, Phone, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function EULA() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">End User License Agreement</h1>
            <p className="text-gray-400 text-sm">C.A.R.E.N.™ Alert — Last updated April 2026</p>
          </div>
        </div>

        {/* Emergency Services Disclaimer — prominent, at top per Apple 5.1.5 */}
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-red-300 mb-2">Emergency Services Disclaimer</h2>
              <p className="text-red-200 text-sm leading-relaxed mb-3">
                <strong>C.A.R.E.N.™ Alert is NOT a substitute for calling 911 or official emergency services.</strong>{" "}
                In any life-threatening emergency, always call 911 first.
              </p>
              <p className="text-red-200 text-sm leading-relaxed mb-3">
                This application uses GPS location services to identify your geographic location and applicable
                state-specific legal rights. When you activate the SOS or emergency-sharing features, your
                GPS coordinates are transmitted to your pre-designated emergency contacts via SMS and/or email.
                Your location is <strong>not</strong> automatically transmitted to 911 or any government
                emergency dispatch center.
              </p>
              <p className="text-red-200 text-sm leading-relaxed">
                Emergency contacts you designate will receive your GPS coordinates in a format compatible with
                standard map applications (Google Maps, Apple Maps). It is the responsibility of those contacts
                to relay your location to official emergency services if needed. GPS accuracy depends on device
                hardware, network availability, and environmental conditions; accuracy cannot be guaranteed.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-gray-300">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> 1. Agreement to Terms
            </h2>
            <p>
              This End User License Agreement ("EULA") is a legal agreement between you ("User") and
              C.A.R.E.N. Alert, LLC ("Company," "we," "us," or "our") governing your use of the
              C.A.R.E.N.™ Alert mobile application and related services ("App"). By downloading,
              installing, or using the App, you agree to be bound by this EULA. If you do not agree,
              do not install or use the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" /> 2. Location Services
            </h2>
            <p className="mb-3">
              The App requests access to your device's precise location (GPS) for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Identifying your current U.S. state to display applicable legal rights and protections</li>
              <li>Embedding GPS coordinates in incident recordings as metadata evidence</li>
              <li>Transmitting your location to pre-designated emergency contacts when you activate SOS</li>
              <li>Displaying your location on in-app maps for situational awareness</li>
            </ul>
            <p className="mt-3">
              Location data is processed on-device and transmitted only when you explicitly initiate an
              emergency action or when required to identify state-specific legal information. We do not
              sell, share, or monetize your location data. Location access can be revoked at any time in
              your device Settings; however, this will disable state-detection and emergency-sharing features.
            </p>

            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mt-4">
              <h3 className="text-yellow-300 font-semibold mb-2">Emergency Location Sharing — How It Works</h3>
              <p className="text-yellow-200 text-xs leading-relaxed">
                When you activate the SOS feature, the App captures your current GPS coordinates and
                includes them in alert messages sent to your emergency contacts. These messages include
                a direct link to your location on Google Maps and Apple Maps. Your emergency contacts
                can share this link with 911 or other official emergency responders to convey your
                precise location. The accuracy of the transmitted location depends on your device's
                GPS hardware and whether a signal lock is currently active.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-cyan-400" /> 3. Emergency Services — Limitations
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>The App does not place calls to 911 or any public safety answering point (PSAP)</li>
              <li>The App does not guarantee that emergency contacts will receive or act upon alerts</li>
              <li>The App does not guarantee location accuracy; GPS signals can be obstructed or unavailable</li>
              <li>The App is not a certified emergency dispatch system and has not been tested or approved by any government emergency management agency</li>
              <li>Network outages, dead zones, or device failure may prevent alert transmission</li>
            </ul>
            <p className="mt-3 font-medium text-white">
              Always call 911 directly in a life-threatening emergency. Do not rely solely on this App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. License Grant</h2>
            <p>
              Subject to your compliance with this EULA, we grant you a limited, non-exclusive,
              non-transferable, revocable license to download, install, and use the App on devices
              that you own or control, solely for your personal, non-commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. In-App Purchases & Subscriptions</h2>
            <p className="mb-3">
              The App offers subscription plans and one-time purchases processed through Apple's App Store.
              All purchases are governed by Apple's Terms and Conditions. Subscription plans automatically
              renew unless cancelled at least 24 hours before the end of the current subscription period.
              You can manage and cancel subscriptions in your Apple ID account settings.
            </p>
            <p>
              Prices are in U.S. dollars unless otherwise stated and are subject to change with notice.
              Refunds are handled by Apple per their standard refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Legal Information Disclaimer</h2>
            <p>
              The legal rights information provided in this App is for general informational purposes only
              and does not constitute legal advice. Laws vary by jurisdiction and change over time. The App
              is not a substitute for consulting a licensed attorney. Always verify current laws in your
              specific location. Nothing in the App creates an attorney-client relationship.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Recording Features</h2>
            <p>
              The App includes audio and video recording capabilities. You are solely responsible for
              complying with all applicable federal, state, and local laws governing the recording of
              conversations and interactions, including consent requirements. Recording laws vary
              significantly by state. The App displays general recording rights information but this
              does not constitute legal advice for your specific situation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Privacy</h2>
            <p>
              Your use of the App is also governed by our Privacy Policy, available at{" "}
              <a
                href="https://carenalert.com/privacy"
                className="text-cyan-400 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                carenalert.com/privacy
              </a>
              . By using the App, you consent to the collection and use of information as described
              in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, the Company shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including but not limited to
              personal injury, property damage, or failure of emergency notification delivery, arising
              from your use or inability to use the App. Our total liability shall not exceed the amount
              paid by you for the App in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Termination</h2>
            <p>
              This EULA is effective until terminated. Your rights under this EULA will terminate
              automatically without notice if you fail to comply with any of its terms. Upon termination,
              you must cease all use of the App and delete all copies from your devices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Governing Law</h2>
            <p>
              This EULA is governed by the laws of the State of Texas, without regard to its conflict
              of law principles. Any disputes shall be resolved in the courts of Texas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Contact</h2>
            <p>
              For questions about this EULA, contact us at:{" "}
              <a href="mailto:legal@carenalert.com" className="text-cyan-400 underline">
                legal@carenalert.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-500 text-xs">
          © 2026 C.A.R.E.N. Alert, LLC. All rights reserved.
        </div>
      </div>
    </div>
  );
}
