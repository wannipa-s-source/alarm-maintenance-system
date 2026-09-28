'use client';

import { HardHat } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import type { UserRole } from '@/context/RoleContext';

const roleStyle: Record<UserRole, { label: string; badge: string; dot: string }> = {
  Admin: {
    label: 'Maintenance Manager',
    badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  Operator: {
    label: 'Technician',
    badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  Viewer: {
    label: 'Viewer',
    badge: 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-500',
  },
};

/** ชื่อผู้ใช้ที่แสดงบนแถบเมนู (ตอนนี้ระบบยังไม่ได้เชื่อมกับ Login จริง) */
const displayName = 'ผู้ใช้งานระบบ';

/**
 * โปรไฟล์ผู้ใช้งาน: ชื่อ + บทบาท
 * แสดงอยู่ในแถบเมนูด้านบนคู่กับปุ่มสลับบทบาท (RoleSelector)
 */
export default function UserBadge() {
  const { role } = useRole();
  const meta = roleStyle[role];

  return (
    <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700/70">
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{displayName}</span>
        <span className={`inline-flex items-center gap-1.5 mt-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${meta.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/30 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
        <HardHat className="w-4.5 h-4.5" />
      </div>
    </div>
  );
}
