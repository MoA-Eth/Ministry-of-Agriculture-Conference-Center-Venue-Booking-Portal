import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Building2, Plus, Globe, Check, X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface DepartmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputClass?: string;
  label?: string;
  required?: boolean;
}

export const OTHER_OPTION_VALUE = '__OTHER__';

export default function DepartmentSelect({
  value,
  onChange,
  error,
  inputClass = '',
  label = 'Department / Organization',
  required = true,
}: DepartmentSelectProps) {
  const { departments, role, addDepartment } = useApp();

  const isPrivilegedUser = ['event_management', 'system_admin'].includes(role || '');

  // Detect whether current value is one of the known departments or "Other"
  const isKnownDepartment = departments.some(d => d.name === value);
  const [selectedDropdown, setSelectedDropdown] = useState<string>(() => {
    if (!value) return '';
    if (isKnownDepartment) return value;
    return OTHER_OPTION_VALUE;
  });

  const [customOrgName, setCustomOrgName] = useState<string>(() => {
    if (!value || isKnownDepartment) return '';
    return value;
  });

  // Dialog state for adding a new department
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCategory, setNewDeptCategory] = useState<'executive_office' | 'project' | 'other'>('executive_office');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Sync when prop value changes externally
  useEffect(() => {
    if (!value) {
      setSelectedDropdown('');
      setCustomOrgName('');
    } else if (departments.some(d => d.name === value)) {
      setSelectedDropdown(value);
      setCustomOrgName('');
    } else {
      setSelectedDropdown(OTHER_OPTION_VALUE);
      setCustomOrgName(value);
    }
  }, [value, departments]);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDropdown(val);

    if (val === OTHER_OPTION_VALUE) {
      onChange(customOrgName.trim());
    } else if (val === '') {
      onChange('');
    } else {
      onChange(val);
    }
  };

  const handleCustomOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomOrgName(val);
    onChange(val);
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setIsSubmittingNew(true);
    try {
      await addDepartment(newDeptName.trim(), newDeptCategory);
      const createdName = newDeptName.trim();
      setSelectedDropdown(createdName);
      setCustomOrgName('');
      onChange(createdName);
      setIsAddingNew(false);
      setNewDeptName('');
    } catch {
      // toast shown in context
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Group departments by category
  const executiveOffices = departments.filter(d => !d.category || d.category === 'executive_office' || d.category === 'department');
  const projects = departments.filter(d => d.category === 'project');
  const others = departments.filter(d => d.category === 'agency' || d.category === 'other');

  return (
    <div className="space-y-2">
      {/* Label and Quick Add button */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-black uppercase tracking-widest flex items-center gap-1.5">
          <Building2 size={13} className="text-[#268053]" />
          <span>{label} {required && '*'}</span>
        </label>

        {isPrivilegedUser && (
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#268053] hover:text-[#1b5e3a] hover:underline transition-all"
            title="Add a new Ministry Executive Office or Project"
          >
            <Plus size={13} />
            <span>Add Office / Project</span>
          </button>
        )}
      </div>

      {/* Main Department Dropdown */}
      <div className="relative">
        <select
          value={selectedDropdown}
          onChange={handleDropdownChange}
          className={`w-full bg-white border rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] transition-all cursor-pointer ${
            error ? 'border-red-400' : 'border-slate-200'
          } ${inputClass}`}
        >
          <option value="">-- Select Ministry Executive Office or Project --</option>

          {departments.length === 0 && (
            <option value="" disabled>
              (No offices or projects uploaded yet — select "Other" or add from Dashboard)
            </option>
          )}

          {executiveOffices.length > 0 && (
            <optgroup label="🏛️ Ministry Executive Offices">
              {executiveOffices.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </optgroup>
          )}

          {projects.length > 0 && (
            <optgroup label="🚀 Projects">
              {projects.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </optgroup>
          )}

          {others.length > 0 && (
            <optgroup label="🏢 Other Units">
              {others.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="🌐 External Stakeholders / Partners">
            <option value={OTHER_OPTION_VALUE}>
              Other (External Stakeholder / Partner Organization)
            </option>
          </optgroup>
        </select>
      </div>

      {/* Open Text Field for External Stakeholder "Other" */}
      {selectedDropdown === OTHER_OPTION_VALUE && (
        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
            <Globe size={13} className="text-blue-600" />
            <span>Organization Name (External Stakeholder / Partner) *</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={customOrgName}
            onChange={handleCustomOrgChange}
            placeholder="e.g. World Bank, FAO, GIZ, Ethio Telecom, Private Enterprise..."
            className={`w-full bg-slate-50/70 border rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all ${
              error && !customOrgName.trim() ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Specify the official organization or partner institution you represent.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1 font-bold">{error}</p>}

      {/* Quick Add Department Modal (for Event Management & System Admin) */}
      {isAddingNew && (
        <div 
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddingNew(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#268053] flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Executive Office / Project</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Adds to the official MoA system directory</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddingNew(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Office / Project Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                  placeholder="e.g. Office of the Minister or Agricultural Growth Program"
                  className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Category *
                </label>
                <select
                  value={newDeptCategory}
                  onChange={e => setNewDeptCategory(e.target.value as any)}
                  className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] cursor-pointer"
                >
                  <option value="executive_office">🏛️ Ministry Executive Office</option>
                  <option value="project">🚀 Project</option>
                  <option value="other">🏢 Other Organization / Unit</option>
                </select>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-start gap-2 text-[11px] text-emerald-800">
                <Sparkles size={14} className="text-[#268053] shrink-0 mt-0.5" />
                <span>This entry will immediately be stored and available across all booking forms.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmittingNew}
                  onClick={() => setIsAddingNew(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingNew || !newDeptName.trim()}
                  className="bg-[#268053] hover:bg-[#1b5e3a] text-white rounded-xl text-xs font-bold px-4"
                >
                  {isSubmittingNew ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Check size={14} />
                      <span>Save Department</span>
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
