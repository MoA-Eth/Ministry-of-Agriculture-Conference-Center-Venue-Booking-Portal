import { useState, useEffect, useCallback } from 'react';
import { useApp, API_BASE } from '@/lib/app-context';
import { SystemUser, UserRole } from '@/lib/types';
import { toast } from 'sonner';
import {
  Users, Trash2, Shield, Mail, UserPlus, RefreshCw,
  Search, ChevronDown, X, Check, AlertTriangle, Crown, Eye, EyeOff, Edit2, Save
} from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; color: string; bg: string; border: string; icon: string }> = {
  organizer:        { label: 'Event Organizer',      color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   icon: '📋' },
  event_management: { label: 'Event Management',     color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200', icon: '🗂️' },
  ict_admin:        { label: 'ICT / Sys Admin',      color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-cyan-200',   icon: '🖥️' },
  catering_support: { label: 'Catering & Support',   color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200', icon: '🍽️' },
  admin_finance:    { label: 'Admin & Finance',      color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  icon: '💰' },
  leadership:       { label: 'Ministry Leadership',  color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',   icon: '👑' },
  system_admin:     { label: 'System Administrator', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',icon: '🔐' },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = roleConfig[role] || { label: role, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: '👤' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function DeleteConfirmModal({ user, onConfirm, onCancel }: { user: SystemUser; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Remove User Account</h3>
        <p className="text-slate-500 text-sm text-center font-medium mb-1">
          You are about to permanently remove:
        </p>
        <p className="text-slate-900 font-bold text-center mb-1">{user.name}</p>
        <p className="text-slate-500 text-xs text-center mb-6">{user.email}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Yes, Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const { token } = useApp();

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);

  // Form state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('organizer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authHeaders = useCallback(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Token ${token}`;
    return h;
  }, [token]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/`, { headers: authHeaders() });
      const data = await res.json();
      setUsers(data.results || data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const resetForm = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('organizer');
    setShowPassword(false);
  };

  const handleEditClick = (u: SystemUser) => {
    setEditingUserId(u.id);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setPassword(''); // Don't show hashed password, allow clearing it
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and Email are required');
      return;
    }
    
    // Only require password for NEW users
    if (!editingUserId && !password.trim()) {
      toast.error('Password is required for new accounts');
      return;
    }

    if (password && password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingUserId ? `${API_BASE}/users/${editingUserId}/` : `${API_BASE}/users/`;
      const method = editingUserId ? 'PATCH' : 'POST';
      
      const body: any = { name, email, role };
      if (password.trim()) body.password = password;

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        let errMsg = `Failed to ${editingUserId ? 'update' : 'create'} user`;
        if (data?.detail) errMsg = data.detail;
        else if (data?.error) errMsg = data.error;
        else if (data?.email) errMsg = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
        else if (data?.non_field_errors) errMsg = data.non_field_errors[0];
        throw new Error(errMsg);
      }

      toast.success(editingUserId ? `✓ Account for ${name} updated` : `✓ ${name} added as ${roleConfig[role]?.label || role}`);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    try {
      await fetch(`${API_BASE}/users/${user.id}/`, { method: 'DELETE', headers: authHeaders() });
      toast.success(`${user.name} has been removed`);
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error('Failed to remove user');
    }
  };

  // Filtered list
  const filtered = users.filter(u => {
    const matchesSearch = !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Stats
  const stats = Object.entries(roleConfig)
    .filter(([key]) => key !== 'system_admin')
    .map(([key, cfg]) => ({
      role: key as UserRole,
      label: cfg.label,
      count: users.filter(u => u.role === key).length,
      icon: cfg.icon,
      color: cfg.color,
    })).filter(s => s.count > 0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedUsers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterRole]);

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div className="mb-8 bg-gradient-to-br from-[#0d1f14] to-[#1b4332] p-8 rounded-2xl text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Users className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-extrabold text-white">User Management</h1>
              <p className="text-emerald-200/70 text-sm font-medium mt-0.5">
                {users.length} total account{users.length !== 1 ? 's' : ''} across {stats.length} role{stats.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-bold transition-all"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats row */}
        {stats.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-3 mt-6">
            {stats.map(s => (
              <button
                key={s.role}
                onClick={() => setFilterRole(filterRole === s.role ? 'all' : s.role)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  filterRole === s.role
                    ? 'bg-white text-slate-900 border-white'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${filterRole === s.role ? 'bg-slate-900 text-white' : 'bg-white/20 text-white'}`}>
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid xl:grid-cols-3 gap-8">
        {/* ─── Create/Edit User Form ─────────────────────────────── */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
            {/* Form header */}
            <div className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between ${editingUserId ? 'bg-emerald-50/50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${editingUserId ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600'}`}>
                  {editingUserId ? <Edit2 size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{editingUserId ? 'Update Account' : 'Add New User'}</h3>
                  <p className="text-slate-400 text-xs font-medium">{editingUserId ? 'Modify existing permissions' : 'Create a system account'}</p>
                </div>
              </div>
              {editingUserId && (
                <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Cancel editing">
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                  placeholder="Abebe Kebede"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                  placeholder="user@moa.gov.et"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  {editingUserId ? 'New Password (Optional)' : 'Initial Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                    placeholder={editingUserId ? 'Leave blank to keep current' : 'Min. 8 characters'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">System Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white appearance-none cursor-pointer"
                  >
                    {Object.entries(roleConfig).filter(([v]) => v !== 'system_admin').map(([val, cfg]) => (
                      <option key={val} value={val}>{cfg.icon} {cfg.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {/* Role preview badge */}
                <div className="mt-2">
                  <RoleBadge role={role} />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 py-3 ${editingUserId ? 'bg-slate-900 shadow-slate-900/10' : 'bg-[#268053] shadow-emerald-900/15'} hover:brightness-110 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-60`}
                >
                  {isSubmitting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> {editingUserId ? 'Updating…' : 'Creating…'}</>
                  ) : (
                    editingUserId ? <><Save className="w-4 h-4" /> Save User Changes</> : <><UserPlus className="w-4 h-4" /> Create User Account</>
                  )}
                </button>
                {editingUserId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full py-2.5 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-700 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ─── User List ────────────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-5">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value as UserRole | 'all')}
                className="pl-4 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                {Object.entries(roleConfig).filter(([v]) => v !== 'system_admin').map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Count row */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filtered.length}</span> of <span className="font-bold text-slate-900">{users.length}</span> users
            </p>
            {(searchQuery || filterRole !== 'all') && (
              <button onClick={() => { setSearchQuery(''); setFilterRole('all'); }} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-20 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-slate-500 font-bold text-sm">Loading user accounts…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-700 mb-1">
                {searchQuery || filterRole !== 'all' ? 'No matching users' : 'No users yet'}
              </h3>
              <p className="text-slate-400 text-sm font-medium">
                {searchQuery || filterRole !== 'all' ? 'Try adjusting your filters.' : 'Use the form to create the first user account.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedUsers.map((u, idx) => (
                <div
                  key={u.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex items-center gap-5 group shadow-sm hover:shadow-md ${editingUserId === u.id ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${roleConfig[u.role]?.bg || 'bg-slate-100'} ${roleConfig[u.role]?.color || 'text-slate-600'} border ${roleConfig[u.role]?.border || 'border-slate-200'}`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-base">{u.name}</h4>
                      {u.role === 'system_admin' && (
                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mt-0.5">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                  </div>

                  {/* Role badge - hidden on mobile */}
                  <div className="hidden sm:block shrink-0">
                    <RoleBadge role={u.role} />
                  </div>

                  {/* Joined date */}
                  <div className="hidden md:flex flex-col items-end shrink-0 text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered</p>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all ml-4">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm bg-white border border-slate-100"
                      title="Edit user details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm bg-white border border-slate-100"
                      title="Remove user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm mt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-600"
                >
                  <ChevronDown className="w-5 h-5 rotate-90" />
                </button>
                <div className="flex items-center gap-1.5 px-3">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                        currentPage === (i + 1)
                          ? 'bg-[#268053] text-white shadow-lg shadow-emerald-900/20'
                          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-600"
                >
                  <ChevronDown className="w-5 h-5 -rotate-90" />
                </button>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Delete Confirm Modal ──────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onConfirm={() => handleDeleteUser(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
