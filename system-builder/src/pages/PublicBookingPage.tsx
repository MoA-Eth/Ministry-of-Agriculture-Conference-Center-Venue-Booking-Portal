import NewBookingForm from "@/components/NewBookingForm";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import moaLogo from '@/assets/moa-logo.png';

export default function PublicBookingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Notice Banner */}
      <div className="bg-emerald-600 text-white px-4 py-3 text-center shadow-md relative z-50">
        <p className="text-sm font-medium">
          <span className="font-bold uppercase tracking-wider text-emerald-200 mr-2">Notice:</span> 
          You are booking as a guest. <Link to="/register" className="font-bold underline hover:text-emerald-200 transition-colors">Register</Link> or <Link to="/login" className="font-bold underline hover:text-emerald-200 transition-colors">Log in</Link> to access your dashboard and manage all your bookings seamlessly!
        </p>
      </div>

      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm relative z-40">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img src={moaLogo} alt="MoA Logo" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-slate-800 tracking-tight hidden sm:block">MoA Conference Center</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link to="/" className="text-[10px] sm:text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 uppercase tracking-widest transition-colors" title="Back to Home">
            <ArrowLeft size={14} /> <span className="hidden xs:inline sm:inline">Home</span>
          </Link>
          <Link to="/track" className="text-[10px] sm:text-xs font-black text-emerald-600 bg-emerald-50 px-3 sm:px-5 py-2 rounded-full border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all uppercase tracking-widest">
            Track Booking
          </Link>
        </div>
      </nav>

      {/* The Form */}
      <div className="flex-1 relative z-10">
        <NewBookingForm onComplete={() => navigate('/track')} />
      </div>
    </div>
  );
}