'use client';

import { useEffect, useState } from 'react';
import { HardHat } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import type { UserRole } from '@/context/RoleContext';
import { supabase } from '@/lib/supabase';

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

/** ชื่อสำรองกรณียังไม่ได้โหลดข้อมูลผู้ใช้ */
const fallbackName = 'ผู้ใช้งานระบบ';

/** ตัดชื่อให้สั้นลง เช่น somchai@factory.com => somchai@factory... */
function shortenEmail(email: string): string {
  if (email.length <= 22) return email;
  return `${email.slice(0, 20)}...`;
}

/**
 * โปรไฟล์ผู้ใช้งาน: ชื่อ + บทบาท
 * แสดงอยู่ในแถบเมนูด้านบนคู่กับปุ่มสลับบทบาท (RoleSelector)
 */
export default function UserBadge() {
  const { role } = useRole();
  const meta = roleStyle[role];
  const [displayName, setDisplayName] = useState(fallbackName);

  // ดึงชื่อจริงจาก session ที่ล็อกอินไว้
  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const user = data.user;
      if (!user) return;

      const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
      setDisplayName(fullName || shortenEmail(user.email ?? fallbackName));
    });

    return () => {
      active = false;
    };
  }, []);

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
