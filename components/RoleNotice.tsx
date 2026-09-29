'use client';

import { Lock, ShieldCheck, Wrench } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { ROLE_META, type UserRole } from '@/lib/permissions';

/** ไอคอนและสีประจำบทบาท */
const NOTICE_STYLE: Record<UserRole, { icon: typeof Lock; bar: string }> = {
  admin: {
    icon: ShieldCheck,
    bar: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-800 dark:text-indigo-300',
  },
  technician: {
    icon: Wrench,
    bar: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-800 dark:text-cyan-300',
  },
  viewer: {
    icon: Lock,
    bar: 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300',
  },
};

/**
 * แถบแจ้งสิทธิ์ใต้ Header — แสดงข้อความของ "บทบาทจริง" ที่อ่านมาจากฐานข้อมูล
 *
 * แสดงเฉพาะเมื่อ (1) ล็อกอินแล้ว (2) โหลดบทบาทสำเร็จ (3) ทราบบทบาทแล้ว
 * เพื่อไม่ให้กระพริบขึ้นมาตอนยังโหลดข้อมูล หรือกรณีอ่านบทบาทไม่สำเร็จ
 * (กรณีอ่านไม่สำเร็จจะไม่โกหกผู้ใช้ว่า "คุณเป็น Viewer")
 */
export default function RoleNotice() {
  const { resolvedRole, user, loading, error } = useRole();

  if (loading || !user || error || !resolvedRole) return null;

  const { icon: Icon, bar } = NOTICE_STYLE[resolvedRole];
  const notice = ROLE_META[resolvedRole].notice;

  return (
    <div
      role="status"
      className={`flex items-center gap-2.5 px-4 sm:px-6 py-2.5 border-b text-xs sm:text-sm ${bar}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{notice}</span>
    </div>
  );
}
