'use client';

import { Lock, ShieldCheck, Wrench } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { ROLE_META, type UserRole } from '@/lib/permissions';
import { ROLE_UI } from '@/lib/designSystem';

/** ไอคอนประจำบทบาท (สีพื้นหลังมาจาก ROLE_UI — โทนเดียวกับ Header และ Navigation) */
const NOTICE_STYLE: Record<UserRole, { icon: typeof Lock; bar: string }> = {
  admin: { icon: ShieldCheck, bar: ROLE_UI.admin.bar },
  technician: { icon: Wrench, bar: ROLE_UI.technician.bar },
  viewer: { icon: Lock, bar: ROLE_UI.viewer.bar },
};

/**
 * แถบแจ้งสิทธิ์ใต้ Header — แสดงข้อความของ "บทบาทจริง" ที่อ่านมาจากฐานข้อมูล
 *
 * หน้าตา: พื้นหลังเป็นสีทึบเต็มพื้นที่ตามสีประจำบทบาท (ROLE_UI) ไม่มีความโปร่งใส
 * ตัวอักษรและไอคอนเป็นสีขาวทั้งธีมสว่างและธีมมืด เพื่อให้อ่านได้ชัดบนพื้นเข้ม
 * เส้นคั่น/เงาบางมาก เพื่อให้เข้ากับแถบ Header และ Navigation Bar
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
      className={`flex items-center gap-2.5 w-full px-4 sm:px-6 py-2.5 border-b border-black/15 shadow-[0_1px_2px_rgba(2,6,23,0.35)] text-xs sm:text-sm font-medium text-white ${bar}`}
    >
      <Icon className="w-4 h-4 shrink-0 text-white" strokeWidth={2.25} />
      <span className="text-white">{notice}</span>
    </div>
  );
}
