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
 *
 * บทบาทมาจากตาราง `profiles` เท่านั้น (ผู้ใช้เปลี่ยนเองไม่ได้)
 * - ระหว่างโหลด        -> ไอคอนหมุน ไม่ยังกล่าวโทษผู้ใช้
 * - โหลดสำเร็จ          -> แสดงบทบาทจริง (Admin / Technician / Viewer)
 * - โหลดไม่สำเร็จ       -> แจ้งว่าติดตั้งฐานข้อมูลไม่ครบ แต่ไม่โกหกว่าเป็น Viewer
 */
export default function UserBadge() {
  const { resolvedRole, profile, loading, error } = useRole();

  const displayName =
    profile?.full_name?.trim() ||
    (profile?.email ? shortenEmail(profile.email) : fallbackName);

  return (
    <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700/70">
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{displayName}</span>

        {loading ? (
          <span
            className="inline-flex items-center gap-1.5 mt-0.5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold"
            title="กำลังโหลดบทบาทจากฐานข้อมูล"
          >
            <LoaderCircle className="w-2.5 h-2.5 animate-spin" />
            กำลังโหลดสิทธิ์
          </span>
        ) : error || !resolvedRole ? (
          <span
            className="inline-flex items-center gap-1.5 mt-0.5 px-1.5 py-0.5 rounded-md border bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold"
            title={`อ่านบทบาทไม่สำเร็จ: ${error ?? 'ไม่พบข้อมูลโปรไฟล์'} — กรุณารันไฟล์ supabase/migrations/20260929000000_reconcile_rbac_schema.sql ใน Supabase SQL Editor`}
          >
            <TriangleAlert className="w-2.5 h-2.5" />
            อ่านบทบาทไม่สำเร็จ
          </span>
        ) : (
          <RolePill role={resolvedRole} />
        )}
      </div>

      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/30 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
        <HardHat className="w-4.5 h-4.5" />
      </div>
    </div>
  );
}

/** ป้ายบทบาทจริงตามที่อ่านมาจากฐานข้อมูล */
function RolePill({ role }: { role: NonNullable<ReturnType<typeof useRole>['resolvedRole']> }) {
  const meta = ROLE_META[role];

  return (
    <span
      className={`inline-flex items-center gap-1.5 mt-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${meta.badge}`}
      title={meta.description}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.title}
      <span className="font-mono opacity-70">({role})</span>
    </span>
  );
}
