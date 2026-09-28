'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle, Shield, ShieldCheck, Users, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/context/AuthContext';

const roleMeta = {
  admin: { label: 'Admin', icon: Shield, badge: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300' },
  technician: { label: 'Technician', icon: Wrench, badge: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-300' },
} as const;

type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string | null;
};

export default function UsersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // โหลดรายชื่อผู้ใช้เฉพาะเมื่อเป็น Admin เท่านั้น
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: true });

      if (cancelled) return;
      setProfiles((data as UserProfile[]) ?? []);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, authLoading]);

  const loading = authLoading || (isAdmin && !loaded);

  const handleRoleChange = async (id: string, newRole: UserRole) => {
    if (id === user?.id) {
      toast.error('ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้');
      return;
    }

    setSavingId(id);
    // ใช้ RPC ฝั่ง DB เพราะ client ไม่มีสิทธิ์ update คอลัมน์ role โดยตรง
    // (ฟังก์ชันจะตรวจสอบอีกชั้นว่าเป็น Admin และไม่แก้ role ตัวเอง)
    const { error } = await supabase.rpc('set_user_role', {
      target_id: id,
      new_role: newRole,
    });
    setSavingId(null);

    if (error) {
      toast.error('อัปเดตสิทธิ์ไม่สำเร็จ: ' + error.message);
    } else {
      toast.success(`อัปเดตสิทธิ์เป็น ${newRole} เรียบร้อยแล้ว`);
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: true });
      setProfiles((data as UserProfile[]) ?? []);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1d]">
        <LoaderCircle className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-6">
        <div className="max-w-md text-center bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-8 rounded-2xl border border-rose-500/30 shadow-xl">
          <Shield className="w-12 h-12 mx-auto text-rose-500" />
          <h1 className="text-xl font-bold mt-4">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            หน้านี้สงวนสิทธิ์สำหรับผู้ดูแลระบบ (Admin) เท่านั้น
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-600 dark:from-white dark:via-slate-200 dark:to-indigo-400 bg-clip-text text-transparent">
                จัดการผู้ใช้งาน
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                กำหนดสิทธิ์ (Role) ของผู้ใช้แต่ละคน — Admin เท่านั้นที่เข้าถึงหน้านี้ได้
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">ผู้ใช้ทั้งหมด</span>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-bold text-sm">
              {profiles.length}
            </span>
          </div>
        </div>

        {/* ตารางผู้ใช้ */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0d1322] border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4">Email</th>
                  <th className="p-4">ชื่อ-นามสกุล</th>
                  <th className="p-4">สิทธิ์ปัจจุบัน</th>
                  <th className="p-4">วันที่สมัคร</th>
                  <th className="p-4 text-center">ปรับสิทธิ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <LoaderCircle className="w-6 h-6 mx-auto text-cyan-500 animate-spin" />
                    </td>
                  </tr>
                ) : profiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      ยังไม่มีข้อมูลผู้ใช้งานในระบบ
                    </td>
                  </tr>
                ) : (
                  profiles.map((p) => {
                    const meta = roleMeta[p.role] ?? roleMeta.technician;
                    const RoleIcon = meta.icon;
                    const isSelf = p.id === user?.id;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {p.email}
                          {isSelf && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold">
                              คุณ
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          {p.full_name || '-'}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${meta.badge}`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('th-TH') : '-'}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          {isSelf ? (
                            <span className="text-xs text-slate-400 italic">ไม่สามารถแก้ไขตัวเอง</span>
                          ) : savingId === p.id ? (
                            <LoaderCircle className="w-4 h-4 mx-auto text-cyan-500 animate-spin" />
                          ) : (
                            <select
                              value={p.role}
                              onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-slate-50 dark:bg-[#0d1322] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                            >
                              <option value="admin">Admin</option>
                              <option value="technician">Technician</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* อธิบายสิทธิ์ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-6 rounded-2xl border border-indigo-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-100">สิทธิ์ของ Admin</h2>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
              <li>จัดการข้อมูลหลักเครื่องจักร (เพิ่ม / แก้ไข / ลบ)</li>
              <li>สร้างและลบรายการ Alarm</li>
              <li>บันทึกและแก้ไขงาน Maintenance</li>
              <li>เปลี่ยนสถานะเครื่องจักรและ Alarm</li>
              <li>จัดการสิทธิ์ผู้ใช้งานในระบบ</li>
            </ul>
          </div>

          <div className="bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/20 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-cyan-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-100">สิทธิ์ของ Technician</h2>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
              <li>ดูข้อมูลเครื่องจักรและประวัติของเครื่องจักร</li>
              <li>ดู Dashboard และสถิติต่าง ๆ</li>
              <li>บันทึกและแก้ไขงาน Maintenance</li>
              <li>เปลี่ยนสถานะของ Alarm (Open / In Progress / Closed)</li>
              <li className="text-slate-400">ไม่สามารถเพิ่ม แก้ไข หรือลบเครื่องจักรได้</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
