'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/context/RoleContext';
import { ROLE_META, USER_ROLES, type UserRole } from '@/lib/permissions';

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  updated_at: string | null;
};
const field =
  'w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition';

/**
 * หน้าตั้งค่าสิทธิ์ผู้ใช้ (เข้าได้เฉพาะ admin ตาม proxy.ts และ RLS)
 * บทบาทถูกบังคับใช้ซ้ำอีกครั้งที่ฝั่งฐานข้อมูล ปุ่มเปลี่ยนบทบาทจึงปรากฏเฉพาะกับ admin เท่านั้น
 */
export default function SettingsPage() {
  const { profile: me, can, loading: roleLoading } = useRole();
  const canManageUsers = can('manageUsers');
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, updated_at')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('โหลดรายชื่อผู้ใช้ไม่สำเร็จ: ' + error.message);
    } else {
      setRows((data ?? []) as ProfileRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchProfiles();
    })();
  }, [fetchProfiles]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter(
      (row) =>
        (row.email ?? '').toLowerCase().includes(keyword) ||
        (row.full_name ?? '').toLowerCase().includes(keyword)
    );
  }, [rows, search]);

  const handleChangeRole = async (id: string, nextRole: UserRole) => {
    const target = rows.find((row) => row.id === id);
    if (!target || target.role === nextRole) return;

    const previousRole = target.role;
    setSavingId(id);

    // อัปเดตทันทีเพื่อให้ UI ตอบสนองทันที แล้วค่อยย้อนกลับถ้าล้มเหลว
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, role: nextRole } : row)));

    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', id);
    setSavingId(null);

    if (error) {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, role: previousRole } : row)));
      toast.error('เปลี่ยนบทบาทไม่สำเร็จ: ' + error.message);
      return;
    }

    toast.success(
      `เปลี่ยน ${target.email ?? 'ผู้ใช้'} เป็น "${ROLE_META[nextRole].label}" เรียบร้อยแล้ว`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-600 dark:from-white dark:via-slate-200 dark:to-indigo-400 bg-clip-text text-transparent">
                  ตั้งค่าสิทธิ์ผู้ใช้งาน
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  กำหนดบทบาทของแต่ละคน: ผู้ดูแลระบบ / ช่างซ่อมบำรุง / ผู้ชม
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchProfiles()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-600 dark:text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* สิทธิ์ของแต่ละบทบาท */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {USER_ROLES.map((role) => {
            const meta = ROLE_META[role];
            return (
              <div
                key={role}
                className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-sm space-y-2"
              >
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold ${meta.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{meta.description}</p>
              </div>
            );
          })}
        </div>

        {!roleLoading && !canManageUsers && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>คุณไม่มีสิทธิ์จัดการบทบาทผู้ใช้ (ต้องเป็นผู้ดูแลระบบ)</span>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400">
          หมายเหตุ: บทบาทของตัวเองล็อกไว้เพื่อไม่ให้ผู้ดูแลระบบเลื่อนสิทธิ์ตัวเองจนติดล็อก —
          หากต้องการเปลี่ยน ให้ใช้คำสั่ง <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">UPDATE public.profiles SET role = &apos;admin&apos; WHERE email = &apos;...&apos;</code> ใน Supabase SQL Editor
        </p>

        {/* รายชื่อผู้ใช้ */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">ผู้ใช้ทั้งหมด</h2>
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อ หรืออีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={field}
            />
          </div>

          {loading ? (
            <div className="p-10 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              กำลังโหลดรายชื่อผู้ใช้...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">
              ไม่พบผู้ใช้ที่ตรงกับคำค้นหา
              <p className="text-xs text-slate-400 mt-2">
                หากผู้ใช้เพิ่งสมัครใหม่ ให้รอสักครู่ แล้วกดรีเฟรช
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filtered.map((row) => {
                const meta = ROLE_META[row.role] ?? ROLE_META.viewer;
                const isMe = row.id === me?.id;

                return (
                  <li
                    key={row.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {row.full_name || row.email || 'ไม่ทราบชื่อ'}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            คุณ
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {row.email || '-'}
                        {row.updated_at && (
                          <span className="ml-2 text-slate-400">
                            แก้ไขล่าสุด {new Date(row.updated_at).toLocaleString('th-TH')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold ${meta.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>

                      <select
                        value={row.role}
                        disabled={!canManageUsers || savingId === row.id || isMe}
                        onChange={(e) => void handleChangeRole(row.id, e.target.value as UserRole)}
                        aria-label={`บทบาทของ ${row.email ?? 'ผู้ใช้'}`}
                        title={isMe ? 'บทบาทของตัวเองต้องแก้ไขผ่าน SQL เพื่อไม่ให้ตัวเองติดล็อกออกจากระบบ' : undefined}
                        className={`${field} w-40 disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {USER_ROLES.map((option) => (
                          <option key={option} value={option}>
                            {ROLE_META[option].label}
                          </option>
                        ))}
                      </select>

                      {savingId === row.id && (
                        <LoaderCircle className="w-4 h-4 animate-spin text-cyan-500 shrink-0" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
