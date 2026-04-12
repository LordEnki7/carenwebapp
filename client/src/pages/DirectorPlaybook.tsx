import { Printer } from "lucide-react";

export default function DirectorPlaybook() {
  return (
    <div className="min-h-screen bg-white text-black">

      {/* Print Button — hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg text-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          Save as PDF / Print
        </button>
      </div>

      <div className="max-w-[800px] mx-auto px-8 py-12 print:px-12 print:py-10">

        {/* Cover */}
        <div className="text-center mb-14 pb-10 border-b-2 border-gray-200">
          <p className="text-cyan-600 font-bold text-sm uppercase tracking-widest mb-3">Confidential — For Regional Directors Only</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2 leading-tight">
            C.A.R.E.N.<span className="text-cyan-600">™</span>
          </h1>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Regional Director Playbook</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Citizen Assistance for Roadside Emergencies and Navigation
          </p>
          <div className="mt-6 inline-block bg-cyan-50 border border-cyan-200 rounded-xl px-8 py-4">
            <p className="text-cyan-800 font-semibold text-base italic">
              "Your job is not to pressure people. Your job is to open doors, introduce the mission, build trust, and create local momentum for C.A.R.E.N."
            </p>
            <p className="text-cyan-600 text-sm mt-2">— Shawn Williams, Founder</p>
          </div>

          {/* QR Code on cover */}
          <div className="mt-10 flex flex-col items-center gap-2">
            <img
              src="/caren-qr-code.png"
              alt="C.A.R.E.N. QR Code — Scan to Download"
              className="w-40 h-40 object-contain rounded-xl border-2 border-cyan-200 shadow"
            />
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Scan to Download the App</p>
            <p className="text-gray-400 text-xs">carenalert.com</p>
          </div>
        </div>

        {/* Section 1 */}
        <Section number="1" title="Your Identity as a Director">
          <p className="text-gray-700 leading-relaxed mb-4">
            Before any script, every director needs one simple introduction:
          </p>
          <blockquote className="border-l-4 border-cyan-500 bg-cyan-50 pl-5 py-3 pr-4 rounded-r-lg text-gray-800 font-medium italic mb-5">
            "I represent C.A.R.E.N. in this region. C.A.R.E.N. is a driver safety and incident-documentation platform built to help people be more prepared when roadside situations escalate. My role is to help build local awareness, connect with attorneys and businesses, and grow the platform in this city."
          </blockquote>
          <TwoCol
            left={<><strong className="text-red-600">You are NOT:</strong><List items={["A lawyer", "A police expert", "A legal advisor", "Someone who can promise outcomes"]} style="neg" /></>}
            right={<><strong className="text-green-700">You ARE:</strong><List items={["A local growth representative", "A community ambassador", "A platform educator", "A partnership builder"]} style="pos" /></>}
          />
        </Section>

        {/* Section 2 */}
        <Section number="2" title="Lawyer Outreach Scripts">
          <Script title="In Person / Phone — Full Version">
            Hi, my name is [Name], and I'm a Regional Director with C.A.R.E.N. in [City].{"\n\n"}We're building a platform that helps drivers document roadside incidents in real time and connect with attorneys when situations escalate.{"\n\n"}We're expanding our attorney network in this area and looking to connect with firms that handle traffic, civil rights, accident, or related cases.{"\n\n"}I'd love to share a little more and see if your firm might be a fit.
          </Script>
          <Script title="Short Version">
            Hi, I'm with C.A.R.E.N. in [City]. We help drivers protect themselves during roadside incidents and connect with legal support when needed. We're building our local attorney network and wanted to connect.
          </Script>
          <Script title="Email / DM">
            Subject: Quick question about your practice{"\n\n"}Hi [Attorney Name],{"\n\n"}My name is [Name], and I serve as a Regional Director for C.A.R.E.N. in [City/Region].{"\n\n"}C.A.R.E.N. is a driver safety and incident-documentation platform designed to help users capture important roadside events and connect with attorneys when situations escalate.{"\n\n"}We are identifying attorneys in [City/State] whose practice areas align with traffic defense, civil rights, accident-related matters, and related legal support.{"\n\n"}I thought your firm may be a strong fit for what we are building locally. Would you be open to a brief conversation or receiving more information?{"\n\n"}Respectfully,{"\n"}[Name]{"\n"}Regional Director, C.A.R.E.N.{"\n"}[Phone] | [Email]
          </Script>
          <Script title="Follow-Up">
            Hi [Name], just following up on my earlier note. We're continuing to build out the C.A.R.E.N. attorney network in [City], and I wanted to make sure my message didn't get buried.{"\n\n"}If your firm has any interest in learning more, I'd be glad to connect briefly.
          </Script>
          <Script title="Social Media DM">
            Hi [Name], I came across your work and wanted to introduce myself. I'm a Regional Director for C.A.R.E.N. in [City], and we're building a local attorney network tied to driver safety and roadside incident documentation. I'd love to connect if you're open.
          </Script>
          <QBox title="Questions to Ask Lawyers">
            <List items={[
              "What areas of law does your firm focus on?",
              "Do you handle traffic-stop, accident, civil rights, or related matters?",
              "What counties or cities do you serve?",
              "Are you open to being listed or connected through a platform like this?",
              "Who is the best contact for future communication?",
            ]} />
          </QBox>
          <WarningBox title="Never Say to Lawyers">
            <List items={[
              "\"We'll send you guaranteed clients.\"",
              "\"You'll definitely make money with us.\"",
              "\"We recommend the best lawyers.\"",
              "\"We can promise cases.\"",
              "\"This will replace your intake.\"",
            ]} style="neg" />
          </WarningBox>
        </Section>

        {/* Section 3 */}
        <Section number="3" title="Business & Partnership Scripts">
          <p className="text-gray-600 text-sm mb-4">Target: towing companies, car washes, mechanics, dealerships, tire shops, driving schools, rideshare communities, gas stations, insurance-adjacent businesses.</p>
          <p className="text-gray-700 font-semibold mb-3">Goal: flyer placement · referral partnerships · QR code placement · event support · awareness</p>
          <Script title="In Person — Full Version">
            Hi, my name is [Name], and I'm a Regional Director for C.A.R.E.N. here in [City].{"\n\n"}We're growing a platform that helps drivers protect themselves during roadside incidents by documenting what happens and connecting them to support if needed.{"\n\n"}I'm reaching out because your business serves drivers directly, and I'd love to explore a simple partnership that helps bring more awareness to your customers.
          </Script>
          <Script title="Short Version">
            Hi, I'm with C.A.R.E.N. in [City]. We help drivers stay protected during roadside incidents, and I'm reaching out to local driver-focused businesses to see who might want to partner with us locally.
          </Script>
          <Script title="Email">
            Subject: Local partnership opportunity for driver safety awareness{"\n\n"}Hi [Business Name / Owner Name],{"\n\n"}My name is [Name], and I serve as a Regional Director for C.A.R.E.N. in [City].{"\n\n"}C.A.R.E.N. is a platform designed to help drivers document roadside incidents and access support when situations escalate.{"\n\n"}Because your business serves drivers in the local community, I wanted to reach out about a possible awareness partnership. This could be as simple as sharing a QR code, flyer, or information card with customers.{"\n\n"}We're currently building local relationships with businesses that want to support driver awareness and protection.{"\n\n"}If this sounds worth discussing, I'd be happy to connect briefly.{"\n\n"}Thank you,{"\n"}[Name]{"\n"}Regional Director, C.A.R.E.N.
          </Script>
          <Script title="Social Media DM">
            Hi [Business Name], I'm with C.A.R.E.N. in [City]. We're connecting with local driver-focused businesses to build awareness around roadside safety and documentation. I'd love to share a simple partnership idea if you're open.
          </Script>
          <Script title="Partnership Ask">
            We're looking for a few good local businesses to help us spread awareness by displaying a flyer, QR code, or referral card — and potentially becoming a community partner for drivers in this area.
          </Script>
          <QBox title="Questions to Ask Businesses">
            <List items={[
              "Do you serve a lot of local drivers?",
              "Who handles partnerships or promotional materials?",
              "Would you be open to displaying a QR card or flyer?",
              "Do you support community safety efforts?",
              "Would you be interested in a co-branded awareness effort?",
            ]} />
          </QBox>
        </Section>

        {/* Section 4 */}
        <Section number="4" title="User & Community Scripts">
          <p className="text-gray-600 text-sm mb-4">Use in: direct conversations, events, Facebook groups, street teams, community meetups, car groups, local networking.</p>
          <p className="text-gray-700 font-semibold mb-3">Goal: downloads · signups · trust · feedback</p>
          <Script title="Quick Intro">
            Have you heard of C.A.R.E.N.?{"\n\n"}It's a driver protection app designed to help document roadside incidents and keep important information in one place when things go left fast.
          </Script>
          <Script title="Natural Conversation Version">
            Most people don't think about this stuff until something happens on the road. C.A.R.E.N. was built to help drivers document what's going on and get support faster when situations escalate.
          </Script>
          <Script title="Event / Tabling Version">
            Hey, I'm with C.A.R.E.N. We're helping spread awareness about driver protection and roadside documentation.{"\n\n"}The app is designed to help people be more prepared if something happens on the road — whether it's a traffic stop, accident, or another high-pressure situation.{"\n\n"}I can show you where to download it and give you a quick overview of how it works.
          </Script>
          <Script title="Text / DM">
            Hey [Name], I wanted to share something useful with you.{"\n\n"}I'm helping grow C.A.R.E.N. in [City], and it's a driver protection app built to help document incidents and make people more prepared when situations happen on the road.{"\n\n"}Here's the link: [Insert Link]{"\n\n"}If you know anybody who drives a lot, has family on the road, or just likes being prepared — send it to them too.
          </Script>
          <Script title="Follow-Up">
            Just checking in — were you able to download C.A.R.E.N.?{"\n\n"}If you did, I'd love to hear what you think. We're growing city by city and feedback matters.
          </Script>
          <Script title="Community Post">
            If something went wrong on the road today, would you be ready?{"\n\n"}C.A.R.E.N. is built to help drivers document incidents and be more prepared when things escalate.{"\n\n"}[Link to carenalert.com]
          </Script>
        </Section>

        {/* Section 5 */}
        <Section number="5" title="Follow-Up System">
          <p className="text-gray-700 mb-4">Most people fail here. First contact is easy. Follow-up is where the real work is.</p>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { day: "Day 1", label: "Initial Contact" },
              { day: "Day 3", label: "Short Follow-Up" },
              { day: "Day 7", label: "Second Follow-Up + Added Value" },
              { day: "Day 14", label: "Final Polite Check-In" },
            ].map((d, i) => (
              <div key={i} className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-center">
                <p className="text-cyan-700 font-black text-sm">{d.day}</p>
                <p className="text-gray-700 text-xs mt-1">{d.label}</p>
              </div>
            ))}
          </div>
          <Script title="Follow-Up for Lawyers">
            Just wanted to follow up and reintroduce C.A.R.E.N. as we continue building the network in [City]. If it makes sense, I'd be glad to send over a short overview.
          </Script>
          <Script title="Follow-Up for Businesses">
            Following up on my note about a possible local awareness partnership with C.A.R.E.N. We're continuing to connect with driver-facing businesses in [City] and would love to keep the conversation open.
          </Script>
        </Section>

        {/* Section 6 */}
        <Section number="6" title="Weekly Goals">
          <div className="grid grid-cols-5 gap-3">
            {[
              { icon: "⚖️", label: "Lawyers Contacted", target: "10" },
              { icon: "🏪", label: "Businesses Approached", target: "10" },
              { icon: "👥", label: "User Conversations", target: "25" },
              { icon: "📲", label: "Follow-Ups Completed", target: "3" },
              { icon: "🤝", label: "Partnership Attempts Logged", target: "1" },
            ].map((g, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-2xl mb-1">{g.icon}</p>
                <p className="text-gray-900 font-black text-xl">{g.target}</p>
                <p className="text-gray-500 text-xs leading-tight mt-1">{g.label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 7 */}
        <Section number="7" title="Do's and Don'ts">
          <TwoCol
            left={
              <>
                <strong className="text-green-700">✅ Do</strong>
                <List items={["Be respectful", "Be brief", "Sound confident", "Log every contact", "Follow up consistently", "Ask for the right decision-maker", "Use approved language only"]} style="pos" />
              </>
            }
            right={
              <>
                <strong className="text-red-600">❌ Don't</strong>
                <List items={["Promise legal help yourself", "Promise results of any kind", "Make up features", "Act like a lawyer", "Argue with people", "Oversell or exaggerate", "Make unauthorized pricing claims"]} style="neg" />
              </>
            }
          />
        </Section>

        {/* Section 8 */}
        <Section number="8" title="Fast Cheat Sheet">
          <div className="space-y-3">
            {[
              { q: "What is C.A.R.E.N.?", a: "A driver safety and incident-documentation platform designed to help people be more prepared when roadside situations escalate." },
              { q: "Why does it matter?", a: "Because things can happen fast on the road, and people need better tools to document what happened and connect with support." },
              { q: "Why talk to lawyers?", a: "Because legal support can matter after certain roadside incidents, and we want a strong network in each region." },
              { q: "Why talk to businesses?", a: "Because local businesses that serve drivers can help spread awareness and become trusted community partners." },
              { q: "Why talk to users?", a: "Because every city grows through real people using the platform and telling others." },
            ].map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2">
                  <p className="font-bold text-gray-800 text-sm">{item.q}</p>
                </div>
                <div className="px-4 py-2">
                  <p className="text-gray-700 text-sm">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 9 */}
        <Section number="9" title="Field Checklist — Before You Go Out">
          <div className="grid grid-cols-2 gap-2">
            {[
              "Phone charged",
              "App download link ready",
              "QR code ready to show",
              "Script sheet reviewed",
              "Contact tracker open",
              "Clean intro memorized",
              "Follow-up plan set",
              "Business cards or flyers if applicable",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <div className="w-4 h-4 border-2 border-gray-400 rounded flex-shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* QR Code Share Block */}
        <div className="my-10 border-2 border-cyan-200 rounded-2xl p-8 bg-cyan-50 flex flex-col items-center text-center print:break-inside-avoid">
          <p className="text-cyan-700 font-bold text-xs uppercase tracking-widest mb-4">Share This with Anyone You Meet</p>
          <img
            src="/caren-qr-code.png"
            alt="C.A.R.E.N. QR Code"
            className="w-56 h-56 object-contain mb-4 rounded-xl border border-cyan-200 shadow-md"
          />
          <p className="text-gray-800 font-bold text-lg mb-1">Scan to Download C.A.R.E.N.</p>
          <p className="text-gray-500 text-sm">carenalert.com — Available on iOS &amp; Android</p>
          <p className="text-gray-400 text-xs mt-3 italic">Show this on your phone, print it on a card, or display it at a business you've partnered with.</p>
        </div>

        {/* Section 10 */}
        <Section number="10" title="Contact Tracker Fields">
          <p className="text-gray-600 text-sm mb-4">Use this in a spreadsheet, Notion, Airtable, or any notes app to track every outreach.</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              "Contact Name", "Type (Lawyer / Business / User)", "Firm or Business Name",
              "City", "Phone", "Email",
              "Social Profile Link", "First Contact Date", "Follow-Up Date",
              "Status", "Notes",
            ].map((field, i) => (
              <div key={i} className="bg-cyan-50 border border-cyan-200 rounded px-3 py-2 text-sm text-cyan-800 font-medium">
                {field}
              </div>
            ))}
          </div>
        </Section>

        {/* Final Statement */}
        <div className="mt-14 border-t-2 border-gray-200 pt-10 text-center">
          <div className="bg-gray-900 text-white rounded-2xl px-8 py-8 max-w-2xl mx-auto">
            <p className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-3">Your Mission as a Director</p>
            <p className="text-xl font-bold leading-relaxed">
              "Your job is not to pressure people. Your job is to open doors, introduce the mission, build trust, and create local momentum for C.A.R.E.N."
            </p>
            <p className="text-gray-400 text-sm mt-4">— Shawn Williams, Founder, C.A.R.E.N.™</p>
          </div>
          <p className="text-gray-400 text-xs mt-6">C.A.R.E.N.™ · carenalert.com · Regional Director Program · Confidential</p>
        </div>

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          @page { margin: 0.75in; size: letter; }
        }
      `}</style>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12 print:break-inside-avoid-page">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
          {number}
        </div>
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
      </div>
      <div className="ml-11">{children}</div>
    </div>
  );
}

function Script({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-gray-600 font-bold text-xs uppercase tracking-wide mb-1">{title}</p>
      <pre className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

function QBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <p className="text-blue-800 font-bold text-sm mb-2">{title}</p>
      {children}
    </div>
  );
}

function WarningBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <p className="text-red-700 font-bold text-sm mb-2">{title}</p>
      {children}
    </div>
  );
}

function List({ items, style }: { items: string[]; style?: "pos" | "neg" }) {
  return (
    <ul className="mt-2 space-y-1">
      {items.map((item, i) => (
        <li key={i} className={`flex items-start gap-2 text-sm ${style === "neg" ? "text-red-700" : style === "pos" ? "text-green-800" : "text-gray-700"}`}>
          <span className="mt-0.5 flex-shrink-0">{style === "neg" ? "✗" : "✓"}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">{left}</div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">{right}</div>
    </div>
  );
}
