import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import moaLogo from '@/assets/moa-logo.png';



export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! Redirecting you now…');
      navigate('/app');
    } catch (error: any) {
      toast.error('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel: Branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative flex-col justify-between p-14 overflow-hidden bg-[#0d1f14]">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#268053]/30 blur-[100px] animate-pulse" />
          <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] rounded-full bg-[#1b5e35]/25 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-32 left-1/3 w-[350px] h-[350px] rounded-full bg-emerald-900/30 blur-[90px] animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 shrink-0">
            <img src={moaLogo} alt="MoA Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">MoA Conference Center</p>
            <p className="text-emerald-400/70 text-xs font-semibold tracking-widest uppercase">Booking Management System</p>
          </div>
        </div>

        {/* Center Feature List */}
        <div className="relative z-10 space-y-6">
          <div className="mb-10">
            <h2 className="text-4xl xl:text-5xl font-serif font-extrabold text-white leading-tight mb-4">
              Your Conference,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Perfectly Managed.</span>
            </h2>
            <p className="text-slate-400 text-base font-medium leading-relaxed max-w-md">
              A unified platform for booking, coordination and administration of Ministry of Agriculture conference facilities.
            </p>
          </div>


        </div>

        {/* Bottom footer */}
        <div className="relative z-10">
          <p className="text-slate-500 text-xs font-medium">
            © {new Date().getFullYear()} Ministry of Agriculture, Federal Democratic Republic of Ethiopia. All rights reserved.
          </p>
        </div>
      </div>

      {/* ─── Right Panel: Login Form ───────────────────────────────── */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-6 sm:px-12 xl:px-16 bg-[#f9fafb] relative">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <img src={moaLogo} alt="MoA Logo" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-slate-900 font-bold text-sm leading-tight">MoA Conference Center</p>
            <p className="text-slate-400 text-xs">Booking Management System</p>
          </div>
        </div>

        <div className="max-w-sm w-full mx-auto">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 text-xs font-bold tracking-wider uppercase">Secure Portal</span>
            </div>
            <h1 className="text-3xl font-serif font-extrabold text-slate-900 leading-tight mb-2">
              Sign in to your account
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Enter your credentials to access the conference management system.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
                  placeholder="••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit  */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-[#268053] hover:bg-[#1b5e3b] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Register link */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-800">New Event Organizer?</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Create your account to start booking.</p>
            </div>
            <Link
              to="/register"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-all whitespace-nowrap"
            >
              Register <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
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
