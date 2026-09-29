'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, BellDot, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  buildNotifications,
  formatThaiDateTime,
  type Alarm,
  type DashboardNotification,
  type Machine,
  type MaintenanceRecord,
} from '@/lib/dashboard';
import { CONTROL } from '@/lib/designSystem';

const levelStyle: Record<DashboardNotification['level'], { ring: string; badge: string; Icon: typeof Info }> = {
  critical: {
    ring: 'border-rose-500/30 bg-rose-500/5',
    badge: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    Icon: TriangleAlert,
  },
  warning: {
    ring: 'border-amber-500/30 bg-amber-500/5',
    badge: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    Icon: TriangleAlert,
  },
  info: {
    ring: 'border-cyan-500/30 bg-cyan-500/5',
    badge: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
    Icon: Info,
  },
};

/**
 * กระดิ่งแจ้งเตือนในแถบเมนูด้านบน
 * ดึงข้อมูล "สด" จากฐานข้อมูลเมื่อผู้ใช้เปิดกล่องดู (ไม่ยิงซ้ำถ้าเปิดอยู่แล้ว)
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const [machinesRes, alarmsRes, jobsRes] = await Promise.all([
      supabase.from('machines').select('id, machine_id, machine_name, status'),
      supabase.from('alarms').select('id, machine_id, alarm_code, alarm_description, status, created_at'),
      supabase.from('maintenance_records').select('id, machine_id, maintenance_type, problem, status, created_at'),
    ]);

    setItems(
      buildNotifications(
        (machinesRes.data ?? []) as Machine[],
        (alarmsRes.data ?? []) as Alarm[],
        (jobsRes.data ?? []) as MaintenanceRecord[]
      )
    );
    setLoading(false);
  }, []);

  // ปิดกล่องเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const criticalCount = items.filter((i) => i.level === 'critical').length;

  /** เปิด/ปิดกล่อง และดึงข้อมูลใหม่ทุกครั้งที่เปิด */
  const toggle = () => {
    setOpen((v) => {
      if (!v) load();
      return !v;
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="การแจ้งเตือน"
        aria-expanded={open}
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl ${CONTROL.shape} ${CONTROL.default} hover:text-cyan-300`}
      >
        {criticalCount > 0 ? (
          <>
            <BellDot className="w-4 h-4 text-rose-500" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-navy">
              {criticalCount}
            </span>
          </>
        ) : (
          <Bell className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,26rem)] bg-white dark:bg-[#111827] border border-slate-200 dark:border-blue-900/50 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">การแจ้งเตือน</h3>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {items.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={load}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              >
                รีเฟรช
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิด"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-xs text-slate-400">กำลังโหลดข้อมูล...</p>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <CircleCheck className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2">ไม่มีการแจ้งเตือน</p>
                <p className="text-xs text-slate-400 mt-1">ระบบทำงานปกติ ไม่พบเครื่องจักรขัดข้อง</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {items.map((item) => {
                  const style = levelStyle[item.level];
                  const LevelIcon = style.Icon;

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-l-2 ${style.ring}`}
                      >
                        <span className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${style.badge}`}>
                          <LevelIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{item.title}</span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.detail}</span>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatThaiDateTime(item.time)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
