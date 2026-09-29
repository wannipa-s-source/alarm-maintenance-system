'use client';

import { Lock, ShieldCheck, Wrench } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { ROLE_META, type UserRole } from '@/lib/permissions';

/**
 * ไอคอนและสีประจำบทบาท
 * - พื้นหลังเป็น "สีทึบ" (solid) เต็มพื้นที่แถบ ไม่ใช้ความโปร่งใส / opacity ต่ำ
 * - ตัวอักษรและไอคอนเป็นสีขาวทั้งธีมสว่างและธีมมืด เพื่อให้อ่านได้ชัดบนพื้นเข้ม
 * - เส้นขอบ/เงามีเพียงเล็กน้อยเพื่อแยกแถบออกจากส่วนอื่น
 */
const NOTICE_STYLE: Record<UserRole, { icon: typeof Lock; bar: string }> = {
  admin: {
    icon: ShieldCheck,
    bar: 'bg-[#4F46E5] text-white border-b border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.18)]',
  },
  technician: {
    icon: Wrench,
    bar: 'bg-[#0284C7] text-white border-b border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.18)]',
  },
  viewer: {
    icon: Lock,
    bar: 'bg-[#EA580C] text-white border-b border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.18)]',
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
      className={`flex items-center gap-2.5 w-full px-4 sm:px-6 py-2.5 border-b text-xs sm:text-sm font-medium ${bar}`}
    >
      <Icon className="w-4 h-4 shrink-0 text-white" strokeWidth={2.25} />
      <span className="text-white">{notice}</span>
    </div>
  );
}
