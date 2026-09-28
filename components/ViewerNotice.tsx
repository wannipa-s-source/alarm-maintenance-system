'use client';

import { Lock } from 'lucide-react';
import { useRole } from '@/context/RoleContext';

/**
 * แถบแจ้งเตือนสีส้มสำหรับผู้ใช้สิทธิ์ Viewer
 * แสดงตัวเฉพาะเมื่อ (1) ล็อกอินแล้ว (2) โหลดบทบาทเสร็จแล้ว (3) บทบาทคือ viewer
 * เพื่อไม่ให้กระพริบขึ้นมาตอนยังโหลดข้อมูลหรือตอนยังไม่ได้ล็อกอิน
 */
export default function ViewerNotice() {
  const { role, user, loading } = useRole();

  if (loading || !user || role !== 'viewer') return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2.5 px-4 sm:px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs sm:text-sm"
    >
      <Lock className="w-4 h-4 shrink-0" />
      <span>
        🔒 คุณอยู่ในสิทธิ์ <b>Viewer</b> (อ่านได้อย่างเดียว) — ระบบจะปิดปุ่มเพิ่ม แก้ไข และลบข้อมูลให้
      </span>
    </div>
  );
}
