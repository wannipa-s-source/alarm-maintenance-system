'use client';

import { useRole, UserRole } from '@/context/RoleContext';
import { Shield, Eye, Wrench } from 'lucide-react';

export default function RoleSelector() {
  const { role, setRole } = useRole();

  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
      <span className="text-xs font-semibold text-slate-500 pl-2">Role:</span>
      {(['Admin', 'Operator', 'Viewer'] as UserRole[]).map((r) => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1 ${
            role === r
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          {r === 'Admin' && <Shield className="w-3 h-3" />}
          {r === 'Operator' && <Wrench className="w-3 h-3" />}
          {r === 'Viewer' && <Eye className="w-3 h-3" />}
          {r}
        </button>
      ))}
    </div>
  );
}