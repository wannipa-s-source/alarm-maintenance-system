'use client';

import { Search, CalendarRange, Factory, RotateCcw, SlidersHorizontal, Wrench } from 'lucide-react';
import {
  ALL,
  jobFilterOptions,
  machineFilterOptions,
  type MachineStatus,
  type MaintenanceStatus,
} from '@/lib/dashboard';

export type DashboardFilters = {
  search: string;
  startDate: string;
  endDate: string;
  line: string;
  machineStatus: MachineStatus | typeof ALL;
  jobStatus: MaintenanceStatus | typeof ALL;
};

type Props = {
  filters: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
  lines: string[];
  resultCount: number;
};

/** ตัวช่วยสร้าง select ที่มีลุกษณะเหมือนกันทุกตัว */
function selectClass(extra = '') {
  return `px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer ${extra}`;
}

/**
 * ส่วนที่ 6 — Quick Filter & Search Bar
 * ค้นหาด้วย Machine ID / อาการเสีย / ชื่อช่าง, ช่วงวันที่, สถานะ และสายการผลิต
 */
export default function FilterBar({ filters, onChange, lines, resultCount }: Props) {
  const set = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilter =
    filters.search !== '' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.line !== ALL ||
    filters.machineStatus !== ALL ||
    filters.jobStatus !== ALL;

  const reset = () => {
    onChange({
      search: '',
      startDate: '',
      endDate: '',
      line: ALL,
      machineStatus: ALL,
      jobStatus: ALL,
    });
  };

  // สีของ select สถานะเครื่องจักร ตอบแทนสีสถานะที่เลือก
  const machineAccent =
    machineFilterOptions.find((o) => o.value === filters.machineStatus)?.hex ?? '#64748b';

  return (
    <section
      aria-label="ค้นหาและกรองข้อมูล"
      className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl p-4 md:p-5 space-y-3"
    >
      {/* แถวบน: ช่องค้นหา + ตัวกรองหลัก */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="ค้นหา Machine ID, อาการเสีย, หรือชื่อช่าง..."
            aria-label="ค้นหาข้อมูล"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm bg-white dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Plant / Line Filter */}
        <div className="relative shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Factory className="w-3.5 h-3.5" />
          </span>
          <select
            value={filters.line}
            onChange={(e) => set('line', e.target.value)}
            aria-label="กรองตามสายการผลิต"
            className={selectClass('pl-8.5 min-w-[11rem]')}
          >
            <option value={ALL}>ทุกสายการผลิต</option>
            {lines.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter (เครื่องจักร) */}
        <div className="relative shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </span>
          <select
            value={filters.machineStatus}
            onChange={(e) => set('machineStatus', e.target.value as MachineStatus | typeof ALL)}
            aria-label="กรองตามสถานะเครื่องจักร"
            className={selectClass('pl-8.5 min-w-[10.5rem]')}
            style={{ borderColor: `${machineAccent}66` }}
          >
            {machineFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter (งานซ่อม) */}
        <div className="relative shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Wrench className="w-3.5 h-3.5" />
          </span>
          <select
            value={filters.jobStatus}
            onChange={(e) => set('jobStatus', e.target.value as MaintenanceStatus | typeof ALL)}
            aria-label="กรองตามสถานะงานซ่อม"
            className={selectClass('pl-8.5 min-w-[11rem]')}
          >
            {jobFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* แถวล่าง: ช่วงวันที่ + ปุ่มล้างตัวกรอง + จำนวนผลลัพธ์ */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/70">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <CalendarRange className="w-3.5 h-3.5" />
            ช่วงวันที่
          </span>
          <input
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(e) => set('startDate', e.target.value)}
            aria-label="วันที่เริ่มต้น"
            className={selectClass('text-[11px]')}
          />
          <span className="text-slate-400 text-xs">–</span>
          <input
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) => set('endDate', e.target.value)}
            aria-label="วันที่สิ้นสุด"
            className={selectClass('text-[11px]')}
          />
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            พบ <b className="text-slate-700 dark:text-slate-200">{resultCount}</b> รายการ
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
