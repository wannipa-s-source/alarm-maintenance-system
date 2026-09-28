'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, LogOut, Shield, UserCog, Wrench } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const roleMeta = {
  admin: {
    label: 'Admin',
    icon: Shield,
    badge: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300',
  },
  technician: {
    label: 'Technician',
    icon: Wrench,
    badge: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-300',
  },
} as const;

export default function UserMenu() {
  const { user, profile, role, isAdmin, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        <LoaderCircle className="w-4 h-4 animate-spin" />
        <span className="hidden sm:inline">กำลังตรวจสอบสิทธิ์...</span>
      </div>
    );
  }

  if (!user) return null;

  const meta = role ? roleMeta[role] : null;
  const RoleIcon = meta?.icon ?? UserCog;
  const displayName = profile?.full_name || user.email || 'ผู้ใช้งาน';

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* ชื่อผู้ใช้ + Role (ซ่อนชื่อผู้ใช้บนจอเล็ก) */}
      <div className="hidden lg:flex flex-col items-end leading-tight">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[180px] truncate">
          {displayName}
        </span>
        {meta && (
          <span
            className={`mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}
          >
            <RoleIcon className="w-3 h-3" />
            {meta.label}
          </span>
        )}
      </div>

      {/* Role badge (จอเล็ก) */}
      {meta && (
        <span
          className={`lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${meta.badge}`}
          title={isAdmin ? 'สิทธิ์ผู้ดูแลระบบ' : 'สิทธิ์ช่างเทคนิค'}
        >
          <RoleIcon className="w-4 h-4" />
        </span>
      )}

      {/* ปุ่ม Logout */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-95 disabled:opacity-60"
        title="ออกจากระบบ"
      >
        {signingOut ? (
          <LoaderCircle className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">ออกจากระบบ</span>
      </button>
    </div>
  );
}
