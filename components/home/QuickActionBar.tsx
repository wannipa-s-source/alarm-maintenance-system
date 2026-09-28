'use client';

import Link from 'next/link';
import { ClipboardPlus, FileDown, History } from 'lucide-react';

type Props = {
  /** เรียกใช้เมื่อกดปุ่มสร้างใบแจ้งซ่อมใหม่ */
  onNewLog: () => void;
  /** เรียกใช้เมื่อกดปุ่มออกรายงาน */
  onExport: () => void;
};

const actions = [
  {
    key: 'new',
    label: 'สร้างใบแจ้งซ่อมใหม่',
    sub: 'New Maintenance Log',
    href: null,
    Icon: ClipboardPlus,
    tone: 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
  },
  {
    key: 'history',
    label: 'ประวัติเครื่องจักร',
    sub: 'Machine History',
    href: '/machines',
    Icon: History,
    tone: 'from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500',
  },
  {
    key: 'export',
    label: 'ออกรายงาน',
    sub: 'Export Report',
    href: null,
    Icon: FileDown,
    tone: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
  },
] as const;

/**
 * ส่วนที่ 5 (ปุ่มลัด) — Quick Action Floating Bar
 * แถบปุ่มลัดแบบลอยติดขอบล่างจอ สำหรับมือถือ และซ่อนเป็นแถบเต็มความกว้างบนจอใหญ่
 */
export default function QuickActionBar({ onNewLog, onExport }: Props) {
  return (
    <div className="sticky bottom-4 z-40 mt-2">
      <div className="mx-auto w-full max-w-3xl bg-white/85 dark:bg-[#111827]/90 backdrop-blur-md border border-slate-200 dark:border-blue-900/50 rounded-2xl shadow-2xl p-2">
        <div className="grid grid-cols-3 gap-2">
          {actions.map((action) => {
            const Icon = action.Icon;
            const content = (
              <>
                <span
                  className={`w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br ${action.tone} text-white flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                    {action.label}
                  </span>
                  <span className="hidden sm:block text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {action.sub}
                  </span>
                </span>
              </>
            );

            const className =
              'flex items-center gap-2 px-2.5 py-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all active:scale-[0.97]';

            if (action.href) {
              return (
                <Link key={action.key} href={action.href} className={className}>
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={action.key}
                type="button"
                onClick={action.key === 'new' ? onNewLog : onExport}
                className={className}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
