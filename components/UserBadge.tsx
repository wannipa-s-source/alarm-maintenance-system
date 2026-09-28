'use client';

import { HardHat, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { ROLE_META } from '@/lib/permissions';

/** ชื่อสำรองกรณียังไม่ได้โหลดข้อมูลผู้ใช้ */
const fallbackName = 'ผู้ใช้งานระบบ';

/** ตัดชื่อให้สั้นลง เช่น somchai@factory.com => somchai@factory... */
function shortenEmail(email: string): string {
  if (email.length <= 22) return email;
  return `${email.slice(0, 20)}...`;
}

/**
 * โปรไฟล์ผู้ใช้งาน: ชื่อ + บทบาท
 * บทบาทมาจากตาราง `profiles` เท่านั้น (ผู้ใช้เปลี่ยนเองไม่ได้)
 */
export default function UserBadge() {
  const { role, profile, loading, error } = useRole();
  const meta = ROLE_META[role];

  const displayName =
    profile?.full_name?.trim() ||
    (profile?.email ? shortenEmail(profile.email) : fallbackName);

  return (
    <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700/70">
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{displayName}</span>
        {error ? (
          <span
            className="inline-flex items-center gap-1.5 mt-0.5 px-1.5 py-0.5 rounded-md border bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold"
            title={`โหลดบทบาทไม่สำเร็จ: ${error} — กรุณารันไฟล์ supabase/migrations/20260928000000_add_profiles_and_rls.sql ใน Supabase SQL Editor`}
          >
            <TriangleAlert className="w-2.5 h-2.5" />
            ยังไม่ได้ติดตั้ง RBAC
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 mt-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${meta.badge}`}
            title={meta.description}
          >
            {loading ? (
              <LoaderCircle className="w-2.5 h-2.5 animate-spin" />
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            )}
            {meta.label}
          </span>
        )}
      </div>

      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/30 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
        <HardHat className="w-4.5 h-4.5" />
      </div>
    </div>
  );
}
