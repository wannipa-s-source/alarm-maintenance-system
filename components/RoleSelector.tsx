'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole, UserRole } from '@/context/RoleContext';
import { Eye, LoaderCircle, LogOut, Shield, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RoleSelector() {
  const { role, setRole } = useRole();
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  /** ออกจากระบบ แล้วพาผู้ใช้กลับไปหน้า Login เพื่อเข้าสู่ระบบใหม่ */
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
    <div className="flex items-center gap-2">
      {/* ตัวเลือกบทบาทผู้ใช้งาน */}
      <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">Role:</span>
        {(['Admin', 'Operator', 'Viewer'] as UserRole[]).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            aria-pressed={role === r}
            className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1 ${
              role === r
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {r === 'Admin' && <Shield className="w-3 h-3" />}
            {r === 'Operator' && <Wrench className="w-3 h-3" />}
            {r === 'Viewer' && <Eye className="w-3 h-3" />}
            {r}
          </button>
        ))}
      </div>

      {/* ปุ่มออกจากระบบ */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        title="ออกจากระบบ (Logout)"
        aria-label="ออกจากระบบ"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
      >
        {loggingOut ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
