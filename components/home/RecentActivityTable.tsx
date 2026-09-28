'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import {
  formatDuration,
  formatThaiDate,
  getMaintenanceStatusMeta,
  type FilteredRecord,
} from '@/lib/dashboard';

type Props = {
  records: FilteredRecord[];
  totalCount: number;
};

/**
 * ส่วนที่ 5 (ตาราง) — Recent Maintenance Logs
 * ตารางงานซ่อมล่าสุด: วันที่ / รหัสเครื่องจักร / อาการปัญหา / ช่าง / สถานะ
 */
export default function RecentActivityTable({ records, totalCount }: Props) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_ROWS = 5;
  const visible = expanded ? records : records.slice(0, COLLAPSED_ROWS);

  return (
    <section
      aria-label="ตารางงานซ่อมล่าสุด"
      className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl overflow-hidden"
    >
      {/* หัวข้อส่วน */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <ClipboardList className="w-4.5 h-4.5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">งานซ่อมล่าสุด</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Recent Activity Log</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
          {records.length} / {totalCount} รายการ
        </span>
      </div>

      {records.length === 0 ? (
        <p className="p-10 text-center text-sm text-slate-400">ไม่พบรายการงานซ่อมที่ตรงกับตัวกรอง</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0d1322] border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-3.5 md:px-5">วันที่</th>
                <th className="p-3.5 md:px-5">เครื่องจักร</th>
                <th className="p-3.5 md:px-5">อาการปัญหา (Problem)</th>
                <th className="p-3.5 md:px-5">ช่างผู้รับผิดชอบ</th>
                <th className="p-3.5 md:px-5 text-right">ใช้เวลา</th>
                <th className="p-3.5 md:px-5 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {visible.map((record) => {
                const meta = getMaintenanceStatusMeta(record.status);

                return (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 md:px-5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatThaiDate(record.created_at)}
                    </td>
                    <td className="p-3.5 md:px-5 whitespace-nowrap">
                      <span className="block text-xs font-black text-slate-800 dark:text-slate-100">
                        {record.machine_code}
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[10rem]">
                        {record.machine_name || '-'}
                      </span>
                    </td>
                    <td className="p-3.5 md:px-5">
                      <span className="block text-xs text-slate-700 dark:text-slate-300 max-w-[18rem]">
                        {record.problem || '-'}
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {record.maintenance_type}
                      </span>
                    </td>
                    <td className="p-3.5 md:px-5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {record.technician || '-'}
                    </td>
                    <td className="p-3.5 md:px-5 text-xs text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                      {formatDuration(record.duration_minutes)}
                    </td>
                    <td className="p-3.5 md:px-5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${meta.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ปุ่มดูรายการเพิ่มเติม */}
      {records.length > COLLAPSED_ROWS && (
        <div className="px-5 md:px-6 py-3 border-t border-slate-200 dark:border-slate-800/70">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                ย่อรายการ
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                ดูทั้งหมด ({records.length} รายการ)
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
