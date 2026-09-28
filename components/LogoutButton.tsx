'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/context/RoleContext';

const variants = {
  /** ปุ่มเต็มในแถบด้านบน (สีแดง มีคำว่า Logout) */
  solid:
    'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all active:scale-95 disabled:opacity-60',
  /** ปุ่มเล็กสำหรับหน้า Login / Register (ไม่มีแถบเมนูรอบข้าง) */
  ghost:
    'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 text-rose-600 dark:text-rose-400 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60',
} as const;

type LogoutButtonProps = {
  variant?: keyof typeof variants;
  /** ซ่อนข้อความ เหลือแต่ไอคอน (ใช้กับแถบด้านบนบนจอเล็ก) */
  iconOnly?: boolean;
  className?: string;
};

/**
 * ปุ่มออกจากระบบ: ล้าง session ของ Supabase, รีเซ็ตบทบาท แล้วพากลับไปหน้า Login
 */
export default function LogoutButton({ variant = 'solid', iconOnly = false, className = '' }: LogoutButtonProps) {
  const { setRole } = useRole();
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      // ล้าง session ของ Supabase Auth อย่างสมบูรณ์
      await supabase.auth.signOut();
    } catch {
      // ข้ามไป เพราะระบบควบคุมหน้าจอด้วย RoleContext เป็นหลัก
    }

    // รีเซ็ตบทบาทกลับเป็นค่าเริ่มต้น
    setRole('Viewer');
    setLoggingOut(false);

    // ล้าง cache ของ Next.js เพื่อไม่ให้เห็นข้อมูลของผู้ใช้เดิมค้างอยู่
    router.replace('/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      title="ออกจากระบบ (Logout)"
      aria-label="ออกจากระบบ"
      className={`${variants[variant]} ${className}`}
    >
      {loggingOut ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      {!iconOnly && <span>Logout</span>}
    </button>
  );
}
