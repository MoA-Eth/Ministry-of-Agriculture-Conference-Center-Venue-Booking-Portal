import { 
  ArrowLeft, ShieldCheck, Info, Database, Activity, 
  Key, Lock, Clock, UserCheck, RefreshCw, Mail 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      id: "introduction",
      icon: <Info className="text-emerald-500" size={24} />,
      title: "1. Introduction",
      content: (
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            The Ministry of Agriculture of the Federal Democratic Republic of Ethiopia ("the Ministry", "we", "our", or "us") operates the MoA Conference Center Venue Booking Portal (the "System"). This Privacy Policy explains how we collect, use, store, and protect information obtained through the System.
          </p>
          <p>
            This System is a secure platform intended exclusively for authorised Ministry of Agriculture personnel, designated stakeholders, and registered event organizers. By accessing or using the System, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
          </p>
        </div>
      )
    },
    {
      id: "information-we-collect",
      icon: <Database className="text-blue-500" size={24} />,
      title: "2. Information We Collect",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600">We collect the following categories of information when you use the System:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Account & Identity
              </h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                <li>Full name and official job title</li>
                <li>Official email address and contact numbers</li>
                <li>Assigned username and encrypted password</li>
                <li>Assigned role and organization affiliation</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Operational Data
              </h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                <li>Booking requests and event details</li>
                <li>Approval decisions for venue bookings</li>
                <li>Official request letters</li>
                <li>Edits and corrections to records</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div> Activity & Audit
              </h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                <li>Login timestamps and IP addresses</li>
                <li>Actions performed (creates, edits)</li>
                <li>System-generated activity logs</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Technical Data
              </h3>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                <li>Browser type and OS</li>
                <li>Device identifiers</li>
                <li>HTTP request logs for security</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "how-we-use",
      icon: <Activity className="text-purple-500" size={24} />,
      title: "3. How We Use Your Information",
      content: (
        <div className="space-y-6">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
            <li className="flex items-start gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div> To authenticate your identity and grant access.</li>
            <li className="flex items-start gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div> To enable creation and approval of venue bookings.</li>
            <li className="flex items-start gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div> To generate reports for strategic decision-making.</li>
            <li className="flex items-start gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div> To maintain complete activity logs for compliance.</li>
            <li className="flex items-start gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div> To investigate and prevent security incidents.</li>
            <li className="flex items-start gap-2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div> To provide technical support to users.</li>
          </ul>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="text-amber-600" size={20} />
            </div>
            <p className="text-amber-800 font-medium text-sm m-0">
              <strong>Important Guarantee:</strong> Your information will never be sold, rented, or shared with third parties for commercial purposes.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "access",
      icon: <Key className="text-amber-500" size={24} />,
      title: "4. Access to Your Information",
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 mb-6">Access is strictly role-based and governed by the principle of least privilege:</p>
          
          <div className="space-y-3">
            {[
              { role: "Event Organizers / Users", desc: "Can view and submit data for their own bookings only." },
              { role: "Venue Managers", desc: "Can view cross-department booking data and perform validations." },
              { role: "Leadership / Executives", desc: "Read-only access to executive-level dashboards and reports." },
              { role: "System Administrator", desc: "Full access to all data for administration and audit purposes only." }
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors">
                <div className="w-full sm:w-1/3 font-bold text-slate-800">{item.role}</div>
                <div className="w-full sm:w-2/3 text-sm text-slate-600">{item.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-xs font-medium text-slate-500 mt-4 px-4 border-l-2 border-slate-300">
            All access attempts and data operations are logged in the System's audit trail.
          </p>
        </div>
      )
    },
    {
      id: "security",
      icon: <Lock className="text-rose-500" size={24} />,
      title: "5. Data Security",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600">The Ministry employs robust technical and organisational safeguards:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Encrypted HTTPS connections (TLS)",
              "Industry-standard hashed passwords",
              "Time-limited authentication tokens",
              "Restricted physical & network access",
              "Regular vulnerability assessments",
              "Immutable activity logs",
              "Unique access credentials"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <Lock size={12} className="text-rose-500" />
                </div>
                <span className="text-sm text-slate-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-5 bg-slate-900 rounded-2xl text-white">
            <h4 className="font-bold mb-3 flex items-center gap-2 text-rose-400">Your Responsibilities</h4>
            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-4">
              <li>Never share your password or credentials with anyone.</li>
              <li>Always log out of the System after completing your session.</li>
              <li>Report any suspected security breach immediately to Admin.</li>
              <li>Use the System only from approved, secure devices.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "retention",
      icon: <Clock className="text-teal-500" size={24} />,
      title: "6. Data Retention",
      content: (
        <div className="space-y-4">
          <p className="text-slate-600">Data within the System is retained for the periods necessary to fulfil purposes:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
              <h4 className="font-bold text-teal-800 text-sm mb-1">Booking & Event Records</h4>
              <p className="text-teal-600/80 text-xs font-medium">Retained indefinitely for historical reporting.</p>
            </div>
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
              <h4 className="font-bold text-teal-800 text-sm mb-1">Activity & Audit Logs</h4>
              <p className="text-teal-600/80 text-xs font-medium">Retained for a minimum of 7 years for compliance.</p>
            </div>
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
              <h4 className="font-bold text-teal-800 text-sm mb-1">User Account Data</h4>
              <p className="text-teal-600/80 text-xs font-medium">Retained while active; archived for 2 years post-deactivation.</p>
            </div>
            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
              <h4 className="font-bold text-teal-800 text-sm mb-1">Uploaded Documents</h4>
              <p className="text-teal-600/80 text-xs font-medium">Retained per official document management policy.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "rights",
      icon: <UserCheck className="text-indigo-500" size={24} />,
      title: "7. Your Rights",
      content: (
        <div className="space-y-6">
          <p className="text-slate-600">As an authorised user, you have the following rights:</p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1"><span className="text-indigo-600 font-bold text-xs">1</span></div>
              <div><strong className="text-slate-800">Right of Access:</strong> <span className="text-slate-600 text-sm">Request a summary of personal data held.</span></div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1"><span className="text-indigo-600 font-bold text-xs">2</span></div>
              <div><strong className="text-slate-800">Right to Correction:</strong> <span className="text-slate-600 text-sm">Request corrections to inaccurate data.</span></div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1"><span className="text-indigo-600 font-bold text-xs">3</span></div>
              <div><strong className="text-slate-800">Right to Know:</strong> <span className="text-slate-600 text-sm">Request information about how data is used.</span></div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1"><span className="text-indigo-600 font-bold text-xs">4</span></div>
              <div><strong className="text-slate-800">Right to Report:</strong> <span className="text-slate-600 text-sm">Report concerns to the Data Protection Officer.</span></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "changes",
      icon: <RefreshCw className="text-slate-500" size={24} />,
      title: "8. Changes to This Policy",
      content: (
        <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
          <p>
            The Ministry reserves the right to update this Privacy Policy at any time to reflect changes in legal requirements, Ministry directives, or System functionality. When material changes are made, an updated version will be published within the System and users will be notified.
          </p>
          <p>
            Continued use of the System after notification of changes constitutes acceptance of the updated Privacy Policy. It is your responsibility to review this policy periodically.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-[#268053] selection:text-white pb-24">
      
      {/* Sticky Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 -ml-3 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all font-bold text-sm"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">MoA Conference Center</span>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative pt-32 pb-20 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#064e3b] z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay z-0"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-2xl">
            <ShieldCheck className="text-emerald-400 w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black text-white tracking-tight mb-6 drop-shadow-sm">
            Privacy Policy
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 font-medium max-w-2xl leading-relaxed mb-8">
            Protecting your data and ensuring transparent operations within the official Ministry of Agriculture venue booking portal.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-widest">Effective: April 24, 2026</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="flex flex-col gap-6 sm:gap-8">
          
          {sections.map((section, index) => (
            <section 
              key={section.id} 
              className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                  {section.icon}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif tracking-tight">
                  {section.title}
                </h2>
              </div>
              <div>
                {section.content}
              </div>
            </section>
          ))}

          {/* Contact Section */}
          <section className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] p-8 sm:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-emerald-100 text-center animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Mail className="text-emerald-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-emerald-950 font-serif mb-4">Questions About Privacy?</h2>
            <p className="text-emerald-800/80 mb-8 max-w-md mx-auto">
              For any privacy-related queries, requests, or concerns regarding this System, please reach out to the Ministry's designated data protection contact.
            </p>
            <a 
              href="mailto:developer@moa.gov.et" 
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-1 transition-all duration-300"
            >
              developer@moa.gov.et
            </a>
          </section>

        </div>
      </main>
      
    </div>
  );
}
