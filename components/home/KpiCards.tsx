'use client';

import type { LucideIcon } from 'lucide-react';
import { AlarmClock, Factory, Gauge, PackageSearch, TriangleAlert, Wrench } from 'lucide-react';
import { formatHours, type Kpi } from '@/lib/dashboard';

type CardTone = 'blue' | 'red' | 'amber' | 'orange' | 'indigo';

type CardShellProps = {
  tone: CardTone;
  title: string;
  titleEn: string;
  Icon: LucideIcon;
  value: string | number;
  unit?: string;
  children?: React.ReactNode;
  pulse?: boolean;
};

const toneStyles: Record<CardTone, { border: string; bar: string; iconBg: string; iconText: string; value: string }> = {
  blue: {
    border: 'border-blue-500/25 hover:border-blue-500/60 hover:shadow-blue-500/10',
    bar: 'bg-blue-500',
    iconBg: 'bg-blue-500/10 border-blue-500/30',
    iconText: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-400',
  },
  red: {
    border: 'border-rose-500/35 hover:border-rose-500/70 hover:shadow-rose-500/10',
    bar: 'bg-rose-500',
    iconBg: 'bg-rose-500/10 border-rose-500/40',
    iconText: 'text-rose-600 dark:text-rose-400',
    value: 'text-rose-600 dark:text-rose-400',
  },
  amber: {
    border: 'border-amber-500/30 hover:border-amber-500/70 hover:shadow-amber-500/10',
    bar: 'bg-amber-500',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    iconText: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
  },
  orange: {
    border: 'border-orange-500/35 hover:border-orange-500/70 hover:shadow-orange-500/10',
    bar: 'bg-orange-500',
    iconBg: 'bg-orange-500/10 border-orange-500/40',
    iconText: 'text-orange-600 dark:text-orange-400',
    value: 'text-orange-600 dark:text-orange-400',
  },
  indigo: {
    border: 'border-indigo-500/30 hover:border-indigo-500/70 hover:shadow-indigo-500/10',
    bar: 'bg-indigo-500',
    iconBg: 'bg-indigo-500/10 border-indigo-500/30',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    value: 'text-indigo-700 dark:text-indigo-400',
  },
};

function CardShell({ tone, title, titleEn, Icon, value, unit, children, pulse }: CardShellProps) {
  const style = toneStyles[tone];

  return (
    <div
      className={`group relative bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-5 pl-6 rounded-2xl border shadow-lg transition-all duration-300 ${style.border}`}
    >
      {/* แถบสีเน้นด้านซ้าย ให้การ์ดจับตาได้เร็ว */}
      <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${style.bar}`} aria-hidden />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {titleEn}
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 truncate">{title}</p>
        </div>
        <div
          className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${
            style.iconBg
          } ${style.iconText} ${pulse ? 'animate-pulse' : ''}`}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1.5">
        <span className={`text-3xl md:text-4xl font-black leading-none tracking-tight ${style.value}`}>{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pb-1">{unit}</span>}
      </div>

      {children}
    </div>
  );
}

function MiniStat({ label, value, hex }: { label: string; value: number | string; hex: string }) {
  return (
    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/70 flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hex }} />
        {label}
      </span>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  );
}

/**
 * ส่วนที่ 2 — Summary KPI Cards
 * การ์ดสรุปสถานะรวมที่ผู้บริหารและทีมช่างต้องเห็นทันทีเมื่อเข้าหน้าแรก
 */
export default function KpiCards({ kpi }: { kpi: Kpi }) {
  return (
    <section aria-label="สรุปสถานะรวม" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {/* 1. Total Machines */}
      <CardShell tone="blue" title="เครื่องจักรทั้งหมด" titleEn="Total Machines" Icon={Factory} value={kpi.totalMachines} unit="เครื่อง">
        <MiniStat label="Running" value={kpi.running} hex="#10b981" />
        <MiniStat label="Idle" value={kpi.idleMachines} hex="#f59e0b" />
      </CardShell>

      {/* 2. Active Alarms / Machine Downtime (เน้นสีแดง) */}
      <CardShell
        tone="red"
        title="เครื่องขัดข้อง / Alarm"
        titleEn="Down & Active Alarms"
        Icon={TriangleAlert}
        value={kpi.downMachines}
        unit="เครื่อง"
        pulse={kpi.downMachines > 0}
      >
        <MiniStat label="Alarm ที่ยังไม่ปิด" value={kpi.openAlarms} hex="#f43f5e" />
        <MiniStat label="Availability" value={`${kpi.availability}%`} hex="#10b981" />
      </CardShell>

      {/* 3. Pending & In Progress Jobs */}
      <CardShell
        tone="amber"
        title="งานที่กำลังดำเนินการ"
        titleEn="Pending & In Progress"
        Icon={Wrench}
        value={kpi.activeJobs}
        unit="งาน"
      >
        <MiniStat label="รอซ่อม (Pending)" value={kpi.pendingJobs} hex="#f59e0b" />
        <MiniStat label="กำลังซ่อม (In Progress)" value={kpi.inProgressJobs} hex="#06b6d4" />
      </CardShell>

      {/* 4. Waiting Part (เน้นสีส้ม) */}
      <CardShell
        tone="orange"
        title="งานรออะไหล่"
        titleEn="Waiting Part"
        Icon={PackageSearch}
        value={kpi.waitingPart}
        unit="งาน"
        pulse={kpi.waitingPart > 0}
      >
        <p className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/70 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {kpi.waitingPart > 0 ? 'มีงานติดขัดรออะไหล่ กรุณาติดตามฝ่ายจัดซื้อ' : 'ไม่มีงานติดขัดรออะไหล่'}
        </p>
      </CardShell>

      {/* 5. MTTR / MTBF */}
      <div className="group relative bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-5 rounded-2xl border border-indigo-500/30 shadow-lg hover:border-indigo-500/70 hover:shadow-indigo-500/10 transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              MTTR / MTBF
            </p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 truncate">
              เวลาซ่อมเฉลี่ย / ทำงานต่อเนื่อง
            </p>
          </div>
          <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlarmClock className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <AlarmClock className="w-3 h-3" /> MTTR
            </span>
            <span className="text-base font-black text-rose-600 dark:text-rose-400">{formatHours(kpi.mttrHours)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Gauge className="w-3 h-3" /> MTBF
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatHours(kpi.mtbfHours)}</span>
          </div>
        </div>

        <p className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/70 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          คำนวณจากใบงานที่ปิดเสร็จแล้ว ({kpi.completedJobs} งาน)
        </p>
      </div>
    </section>
  );
}
