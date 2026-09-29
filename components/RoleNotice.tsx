'use client';

import { Lock, ShieldCheck, Wrench } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { ROLE_META, type UserRole } from '@/lib/permissions';
import { ROLE_COLOR } from '@/lib/designSystem';

/** ไอคอนประจำบทบาท (สีพื้นหลังของแถบใช้สีเดียวกันทุก Role — ดู ROLE_COLOR) */
const NOTICE_ICON: Record<UserRole, typeof Lock> = {
  admin: ShieldCheck,
  technician: Wrench,
  viewer: Lock,
};

/**
 * แถบแจ้งสิทธิ์ใต้ Header — แสดงข้อความของ "บทบาทจริง" ที่อ่านมาจากฐานข้อมูล
 *
 * หน้าตา: พื้นหลังเป็นสีทึบเต็มพื้นที่แถบ สีเดียวกันทุกบทบาท (ROLE_COLOR = #0D7F86)
 * ไม่มีความโปร่งใส ไม่มี gradient ไม่มี opacity
 * ตัวอักษรและไอคอนเป็นสีขาวทั้งธีมสว่างและธีมมืด
 * เส้นคั่น/เงาเป็นสีทึบที่เปลี่ยนตามโหมด (var(--role-line) / var(--role-shadow))
 *
 * แสดงเฉพาะเมื่อ (1) ล็อกอินแล้ว (2) โหลดบทบาทสำเร็จ (3) ทราบบทบาทแล้ว
 * เพื่อไม่ให้กระพริบขึ้นมาตอนยังโหลดข้อมูล หรือกรณีอ่านบทบาทไม่สำเร็จ
 * (กรณีอ่านไม่สำเร็จจะไม่โกหกผู้ใช้ว่า "คุณเป็น Viewer")
 */
export default function RoleNotice() {
  const { resolvedRole, user, loading, error } = useRole();

  if (loading || !user || error || !resolvedRole) return null;

  const Icon = NOTICE_ICON[resolvedRole];
  const notice = ROLE_META[resolvedRole].notice;

  return (
    <div
      role="status"
      className={`flex items-center gap-2.5 w-full px-4 sm:px-6 py-2.5 border-b border-role-line shadow-[var(--role-shadow)] text-xs sm:text-sm font-medium ${ROLE_COLOR.surface} ${ROLE_COLOR.on}`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${ROLE_COLOR.on}`} strokeWidth={2.25} />
      <span className={ROLE_COLOR.on}>{notice}</span>
    </div>
  );
}
