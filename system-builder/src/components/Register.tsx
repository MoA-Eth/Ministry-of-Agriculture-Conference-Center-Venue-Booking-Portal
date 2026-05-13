import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { toast } from 'sonner';
import { Lock, Mail, User, ArrowRight, Eye, EyeOff, Building2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import moaLogo from '@/assets/moa-logo.png';

const benefits = [
  'Browse and book all available conference venues',
  'Track your booking requests and approvals in real time',
  'Attach event letters and supporting documents',
  'Receive notifications on booking status updates',
];

export default function Register() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = (() => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { level: score, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { level: score, label: 'Good', color: 'bg-emerald-400' };
    return { level: score, label: 'Strong', color: 'bg-emerald-600' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created! Welcome to MoA Conference Portal.');
      navigate('/app');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. That email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel: Branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative flex-col justify-between p-14 overflow-hidden bg-[#0d1f14]">
        {/* Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[450px] h-[450px] rounded-full bg-[#268053]/25 blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 -left-20 w-[380px] h-[380px] rounded-full bg-teal-900/30 blur-[90px] animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 shrink-0">
            <img src={moaLogo} alt="MoA Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">MoA Conference Center</p>
            <p className="text-emerald-400/70 text-xs font-semibold tracking-widest uppercase">Booking Management System</p>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="mb-10">
            <h2 className="text-4xl xl:text-5xl font-serif font-extrabold text-white leading-tight mb-4">
              Start Booking<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Smarter Today.</span>
            </h2>
            <p className="text-slate-400 text-base font-medium leading-relaxed">
              Create a free Event Organizer account and get instant access to all conference facilities.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-slate-300 text-sm font-medium leading-snug">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              <span className="text-emerald-400 font-bold">Note:</span> Only Event Organizer accounts can self-register. Other roles (ICT Admin, Event Management, etc.) are assigned by the System Administrator.
            </p>
          </div>
        </div>

        <p className="relative z-10 text-slate-500 text-xs font-medium">
          © {new Date().getFullYear()} Ministry of Agriculture of Ethiopia.
        </p>
      </div>

      {/* ─── Right Panel: Register Form ───────────────────────────── */}
      <div className="w-full lg:w-[55%] xl:w-[60%] flex flex-col justify-center px-6 sm:px-12 xl:px-20 bg-[#f9fafb] overflow-y-auto py-10">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <img src={moaLogo} alt="MoA Logo" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-slate-900 font-bold text-sm leading-tight">MoA Conference Center</p>
            <p className="text-slate-400 text-xs">Booking Management System</p>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 text-xs font-bold tracking-wider uppercase">Free Account</span>
            </div>
            <h1 className="text-3xl font-serif font-extrabold text-slate-900 leading-tight mb-2">
              Create your Organizer account
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Fill in the information below to get access to the conference booking portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
                  placeholder="e.g. Abebe Kebede"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
                  placeholder="you@organization.gov.et"
                />
              </div>
            </div>

            {/* 2-column passwords  */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
                    placeholder="Min. 8 chars"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-10 py-3.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-sm ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:border-emerald-500'
                    }`}
                    placeholder="Re-enter"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password strength meter */}
            {password && (
              <div>
                <div className="flex gap-1.5 mb-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.level ? passwordStrength.color : 'bg-slate-200'}`} />
                  ))}
                </div>
                <p className={`text-xs font-bold ${passwordStrength.level <= 1 ? 'text-red-500' : passwordStrength.level === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                  Password strength: {passwordStrength.label}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-[#268053] hover:bg-[#1b5e3b] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating your account…
                </>
              ) : (
                <>
                  Create Organizer Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Already registered?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 font-bold text-sm rounded-xl transition-all duration-200"
          >
            Sign in to existing account
          </Link>

          <div className="text-center mt-5">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
              <Building2 className="w-3.5 h-3.5" />
              Back to Conference Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
