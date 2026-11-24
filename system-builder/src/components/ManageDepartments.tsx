import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { Department } from '@/lib/types';
import { 
  Landmark, FolderKanban, Plus, Trash2, Search, 
  X, CheckCircle2, Sparkles, Building2, Layers, Pencil
} from 'lucide-react';
import { Button } from './ui/button';

export default function ManageDepartments() {
  const { departments, addDepartment, updateDepartment, removeDepartment } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'executive_office' | 'project'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCategory, setNewDeptCategory] = useState<'executive_office' | 'project'>('executive_office');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Edit Modal State
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCategory, setEditDeptCategory] = useState<'executive_office' | 'project'>('executive_office');
  const [isUpdating, setIsUpdating] = useState(false);

  // Group counts
  const executiveOffices = useMemo(() => {
    return (departments || []).filter(d => !d.category || d.category === 'executive_office' || d.category === 'department');
  }, [departments]);

  const projects = useMemo(() => {
    return (departments || []).filter(d => d.category === 'project');
  }, [departments]);

  // Filtered list
  const filteredList = useMemo(() => {
    return (departments || []).filter(item => {
      const isProj = item.category === 'project';
      const isOffice = !item.category || item.category === 'executive_office' || item.category === 'department';

      if (categoryFilter === 'executive_office' && !isOffice) return false;
      if (categoryFilter === 'project' && !isProj) return false;

      if (searchQuery.trim()) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [departments, categoryFilter, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setIsSubmitting(true);
    try {
      await addDepartment(newDeptName.trim(), newDeptCategory);
      setNewDeptName('');
      setIsAddModalOpen(false);
    } catch {
      // toast handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (dept: Department) => {
    setEditingDept(dept);
    setEditDeptName(dept.name);
    setEditDeptCategory(dept.category === 'project' ? 'project' : 'executive_office');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editDeptName.trim()) return;

    setIsUpdating(true);
    try {
      await updateDepartment(editingDept.id, editDeptName.trim(), editDeptCategory);
      setEditingDept(null);
      setEditDeptName('');
    } catch {
      // toast handled in context
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the directory?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await removeDepartment(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* ─── HEADER BANNER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-emerald-400 shadow-2xl shrink-0">
            <Landmark className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                Offices & Projects Directory
              </h1>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-[#1b5e3a] border border-emerald-200">
                MoA Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Configure and manage official Ministry Executive Offices and National Projects for booking attributions.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#268053] hover:bg-[#1b5e3a] text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg flex items-center gap-2 px-6 py-3 h-auto self-start md:self-auto shrink-0 transition-transform active:scale-95"
        >
          <Plus size={18} />
          <span>Add Office / Project</span>
        </Button>
      </div>

      {/* ─── SUMMARY STATS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Directory Records</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{departments.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Active in booking system</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Executive Offices</p>
            <p className="text-3xl font-black text-[#268053] mt-1">{executiveOffices.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Ministerial & Executive</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#268053] flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">National Projects</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{projects.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Programs & Initiatives</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── DIRECTORY TABLE & CONTROLS ─── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({departments.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('executive_office')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
                categoryFilter === 'executive_office'
                  ? 'bg-[#268053] text-white shadow-md'
                  : 'bg-emerald-50 text-[#268053] hover:bg-emerald-100 border border-emerald-200/50'
              }`}
            >
              <Landmark size={14} />
              <span>Executive Offices ({executiveOffices.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('project')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
                categoryFilter === 'project'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50'
              }`}
            >
              <FolderKanban size={14} />
              <span>Projects ({projects.length})</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        {filteredList.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-8">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery
                ? 'No matching offices or projects found'
                : (departments.length === 0
                    ? 'No Ministry Executive Offices or Projects uploaded yet'
                    : 'No records found in this category')}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
              {departments.length === 0
                ? 'Your directory is currently empty. Click "+ Add Office / Project" above to register offices or projects. Only live entries created here appear in booking dropdowns.'
                : 'Try adjusting your search criteria or switching filter tabs.'}
            </p>
            {departments.length === 0 && (
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-5 bg-[#268053] hover:bg-[#1b5e3a] text-white rounded-2xl text-xs font-bold px-6 py-2.5"
              >
                <Plus size={16} className="mr-1.5" />
                Add First Office / Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map(item => {
              const isProj = item.category === 'project';
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#268053]/40 hover:shadow-lg transition-all flex items-start justify-between gap-3 group relative overflow-hidden"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isProj ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-[#268053]'
                      }`}
                    >
                      {isProj ? <FolderKanban size={20} /> : <Landmark size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 leading-snug break-words">
                        {item.name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isProj
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-emerald-50 text-[#1b5e3a] border border-emerald-200/60'
                          }`}
                        >
                          {isProj ? 'Project' : 'Executive Office'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Active in forms
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      title="Edit record"
                      className="p-2 rounded-xl text-slate-400 hover:text-[#268053] hover:bg-emerald-50 transition-all"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={deletingId === item.id}
                      title="Remove record"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ADD OFFICE / PROJECT MODAL ─── */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#268053] flex items-center justify-center">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Office or Project</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Adds to the MoA portal directory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                  Office or Project Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                  placeholder="e.g. Office of the Minister or Agricultural Growth Program"
                  className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                  Category *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewDeptCategory('executive_office')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      newDeptCategory === 'executive_office'
                        ? 'border-[#268053] bg-emerald-50/70 ring-2 ring-[#268053]/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#268053]">
                      <Landmark size={15} />
                      <span>Executive Office</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Executive Offices & Directorates
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDeptCategory('project')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      newDeptCategory === 'project'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-blue-600">
                      <FolderKanban size={15} />
                      <span>Project</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Flagship Projects & Programs
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-emerald-800">
                <CheckCircle2 size={16} className="text-[#268053] shrink-0 mt-0.5" />
                <span>Saved directly to the database and immediately available on all booking forms.</span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl text-xs font-bold px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !newDeptName.trim()}
                  className="bg-[#268053] hover:bg-[#1b5e3a] text-white rounded-xl text-xs font-bold px-5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Plus size={15} />
                      <span>Save Record</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT OFFICE / PROJECT MODAL ─── */}
      {editingDept && (
        <div
          className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEditingDept(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#268053] flex items-center justify-center">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Office or Project</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Update directory record details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                  Office or Project Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editDeptName}
                  onChange={e => setEditDeptName(e.target.value)}
                  placeholder="e.g. Office of the Minister or Agricultural Growth Program"
                  className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                  Category *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditDeptCategory('executive_office')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      editDeptCategory === 'executive_office'
                        ? 'border-[#268053] bg-emerald-50/70 ring-2 ring-[#268053]/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#268053]">
                      <Landmark size={15} />
                      <span>Executive Office</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Executive Offices & Directorates
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditDeptCategory('project')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      editDeptCategory === 'project'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-blue-600">
                      <FolderKanban size={15} />
                      <span>Project</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Flagship Projects & Programs
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-emerald-800">
                <CheckCircle2 size={16} className="text-[#268053] shrink-0 mt-0.5" />
                <span>Changes will immediately update across all forms and existing directory references.</span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => setEditingDept(null)}
                  className="rounded-xl text-xs font-bold px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || !editDeptName.trim()}
                  className="bg-[#268053] hover:bg-[#1b5e3a] text-white rounded-xl text-xs font-bold px-5"
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={15} />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
