'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, PieChart as PieIcon } from 'lucide-react';
import { alarmTrend, maintenanceRatio, type Alarm, type MaintenanceRecord } from '@/lib/dashboard';

type Props = {
  alarms: Alarm[];
  records: MaintenanceRecord[];
};

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
};

/**
 * ส่วนที่ 4 — Alarm & Maintenance Trends
 * - Alarm Frequency (รายวันย้อนหลัง 14 วัน)
 * - Maintenance Type Ratio (Donut Chart)
 */
export default function TrendCharts({ alarms, records }: Props) {
  const trend = alarmTrend(alarms, 14);
  const ratio = maintenanceRatio(records);
  const totalJobs = ratio.reduce((sum, r) => sum + r.value, 0);

  return (
    <section aria-label="แนวโน้ม Alarm และงานซ่อมบำรุง" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 4.1 Alarm Frequency Graph */}
      <div className="lg:col-span-2 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">แนวโน้มจำนวน Alarm</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Alarm Frequency — 14 วันล่าสุด</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            รวม {trend.reduce((sum, d) => sum + d.count, 0)} ครั้ง
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="alarmFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={38} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: '#f43f5e', strokeOpacity: 0.4 }}
                labelFormatter={(label) => `วันที่ ${label}`}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="จำนวน Alarm"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fill="url(#alarmFill)"
                activeDot={{ r: 5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4.2 Maintenance Type Ratio (Donut) */}
      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl p-5 md:p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <PieIcon className="w-4.5 h-4.5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">สัดส่วนประเภทงานซ่อม</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Maintenance Type Ratio</p>
          </div>
        </div>

        {totalJobs === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <PieIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">ยังไม่มีข้อมูลงานซ่อมบำรุง</p>
          </div>
        ) : (
          <>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratio}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {ratio.map((entry) => (
                      <Cell key={entry.name} fill={entry.hex} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} งาน`, 'จำนวน']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* คำอธิบายสัดส่วน */}
            <ul className="mt-3 space-y-1.5">
              {ratio.map((entry) => {
                const percent = totalJobs > 0 ? Math.round((entry.value / totalJobs) * 100) : 0;
                return (
                  <li key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.hex }} />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 flex-1 truncate">{entry.name}</span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{entry.value}</span>
                    <span className="text-[10px] text-slate-400 w-9 text-right">{percent}%</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
