import { useState } from 'react';
import { useApp, API_BASE } from '@/lib/app-context';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types';
import {
  User,
  Mail,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Pencil,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const roleLabels: Record<UserRole, string> = {
  organizer: 'Event Organizer',
  event_management: 'Event Management',
  ict_admin: 'ICT / Sys Admin',
  catering_support: 'Catering & Support',
  admin_finance: 'Admin & Finance',
  leadership: 'Ministry Leadership',
  system_admin: 'System Administrator',
};

export default function ProfileSettings() {
  const { user, token, refreshData } = useApp();

  // Profile editing state
  const [editName, setEditName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    if (editName.trim() === user?.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update profile.');
      }
      // Update local storage with new name
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = editName.trim();
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      toast.success('Profile updated successfully!');
      setIsEditingName(false);
      refreshData();
      // Force a page reload to update user context from localStorage
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);

    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('New password must be different from the current password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }

      // Update token in localStorage if returned
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      toast.success('Password changed successfully! You may need to log in again.');

      // If token was rotated, reload to pick up the new one
      if (data.token) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user || !token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
            Please log in to access profile settings.
          </p>
        </div>
      </div>
    );
  }

  const inputClass = `w-full text-sm border-2 rounded-xl px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all focus:ring-4 focus:ring-[#268053]/10 outline-none border-slate-100 focus:border-[#268053]`;
  const passwordStrength = newPassword.length === 0 ? 0 : newPassword.length < 8 ? 1 : newPassword.length < 12 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#268053] to-[#1b5e3a] flex items-center justify-center text-white font-black text-xl uppercase shadow-lg shadow-emerald-900/20">
          {user.name?.charAt(0) || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Profile Settings</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your account information and security</p>
        </div>
      </div>

      {/* ─── Section 1: Profile Information ─────────────────────────── */}
      <div className="bg-white rounded-[1.5rem] shadow-xl border border-slate-100/50 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Account Information</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Your personal and role details</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Name Field */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <User size={12} /> Full Name
            </label>
            {isEditingName ? (
              <div className="flex gap-3 items-start">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your full name"
                  autoFocus
                />
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={handleSaveName}
                    disabled={isSavingProfile}
                    className="h-12 px-5 bg-gradient-to-r from-[#1b5e3a] to-[#268053] hover:from-[#15472c] hover:to-[#1b5e3a] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    {isSavingProfile ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Save size={14} className="mr-1.5" /> Save</>
                    )}
                  </Button>
                  <button
                    onClick={() => { setEditName(user.name || ''); setIsEditingName(false); }}
                    className="h-12 px-4 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-slate-50/80 border-2 border-slate-100 rounded-xl group hover:border-emerald-200 transition-all">
                <span className="text-sm font-bold text-slate-800">{user.name}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#268053] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Pencil size={12} /> Edit
                </button>
              </div>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <Mail size={12} /> Email Address
            </label>
            <div className="flex items-center justify-between p-4 bg-slate-50/80 border-2 border-slate-100 rounded-xl">
              <span className="text-sm font-bold text-slate-800">{user.email}</span>
              <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">
                <Lock size={10} /> Read Only
              </span>
            </div>
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <Shield size={12} /> System Role
            </label>
            <div className="flex items-center justify-between p-4 bg-slate-50/80 border-2 border-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#268053] shadow-sm">
                  <Shield size={14} />
                </div>
                <span className="text-sm font-bold text-slate-800">
                  {roleLabels[user.role as UserRole] || user.role}
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                <CheckCircle2 size={10} /> Assigned
              </span>
            </div>
          </div>

          {/* Account Created */}
          {(user.createdAt || user.created_at) && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                <Calendar size={12} /> Account Created
              </label>
              <div className="p-4 bg-slate-50/80 border-2 border-slate-100 rounded-xl">
                <span className="text-sm font-bold text-slate-800">
                  {new Date(user.createdAt || user.created_at || '').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Section 2: Change Password ─────────────────────────────── */}
      <div className="bg-white rounded-[1.5rem] shadow-xl border border-slate-100/50 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
              <KeyRound size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Security</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Update your password to keep your account secure</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-8 space-y-6">
          {passwordSuccess && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                Password changed successfully!
              </p>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <Lock size={12} /> Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${inputClass} pl-11 pr-12`}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* New Password */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <KeyRound size={12} /> New Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} pl-11 pr-12`}
                placeholder="Enter a new password (min. 8 characters)"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password strength indicator */}
            {newPassword.length > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-slate-100'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  passwordStrength === 1 ? 'text-red-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-emerald-600'
                }`}>
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <Lock size={12} /> Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputClass} pl-11 pr-12 ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-300 focus:border-red-400 bg-red-50/20'
                    : confirmPassword && confirmPassword === newPassword
                    ? 'border-emerald-300 focus:border-emerald-400 bg-emerald-50/20'
                    : ''
                }`}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <div className="flex items-center gap-1.5 mt-2 animate-in fade-in">
                <AlertTriangle size={12} className="text-red-500" />
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Passwords do not match</span>
              </div>
            )}
            {confirmPassword && confirmPassword === newPassword && newPassword.length >= 8 && (
              <div className="flex items-center gap-1.5 mt-2 animate-in fade-in">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Passwords match</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
              className="w-full h-14 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isChangingPassword ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating Password…
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <KeyRound size={16} />
                  Change Password
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50/50 border-2 border-amber-100 rounded-2xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Security Notice</p>
          <p className="text-xs text-amber-700 font-medium leading-relaxed">
            Changing your password will end all other active sessions. You will need to log in again with your new password.
            If you need to change your email or role, please contact a System Administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
