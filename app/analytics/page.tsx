'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AlarmAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMachines: 0,
    runningCount: 0,
    stopCount: 0,
    alarmCount: 0,
    maintenanceCount: 0,
  });

  const [alarms, setAlarms] = useState<any[]>([]);
  const [alarmByCode, setAlarmByCode] = useState<{ [key: string]: number }>({});
  const [alarmBySeverity, setAlarmBySeverity] = useState<{ Critical: number; Warning: number; Info: number }>({
    Critical: 0,
    Warning: 0,
    Info: 0,
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);

    // 1. ดึงข้อมูลสถานะเครื่องจักรทั้งหมด
    const { data: machineData } = await supabase.from('machines').select('status');
    if (machineData) {
      setStats({
        totalMachines: machineData.length,
        runningCount: machineData.filter((m) => m.status === 'Running').length,
        stopCount: machineData.filter((m) => m.status === 'Stop').length,
        alarmCount: machineData.filter((m) => m.status === 'Alarm').length,
        maintenanceCount: machineData.filter((m) => m.status === 'Maintenance').length,
      });
    }

    // 2. ดึงประวัติ Alarm ทั้งหมดมาวิเคราะห์
    const { data: alarmData } = await supabase
      .from('alarms')
      .select('*')
      .order('created_at', { ascending: false });

    if (alarmData) {
      setAlarms(alarmData);

      // นับจำนวน Alarm แบ่งตาม Code
      const codeCounts: { [key: string]: number } = {};
      const severityCounts = { Critical: 0, Warning: 0, Info: 0 };

      alarmData.forEach((item) => {
        const code = item.alarm_code || item.code || 'UNKNOWN';
        codeCounts[code] = (codeCounts[code] || 0) + 1;

        const sev = item.severity || 'Critical';
        if (sev === 'Critical') severityCounts.Critical += 1;
        else if (sev === 'Warning') severityCounts.Warning += 1;
        else severityCounts.Info += 1;
      });

      setAlarmByCode(codeCounts);
      setAlarmBySeverity(severityCounts);
    }

    setLoading(false);
  };

  const maxAlarmCodeCount = Math.max(...Object.values(alarmByCode), 1);
  const totalAlarmsCount = alarms.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 p-10 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-cyan-400 font-mono text-sm animate-pulse">กำลังประมวลผลสถิติและกราฟวิเคราะห์...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans">
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-blue-900/40 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                BONUS FEATURE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              Alarm & Maintenance Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              วิเคราะห์สถิติสัญญาณเตือน ความถี่ของ Alarm และภาพรวมสถานะเครื่องจักร
            </p>
          </div>

          <button
            onClick={fetchAnalyticsData}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>อัปเดตสถิติ</span>
          </button>
        </div>

        {/* 1. Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#111827]/80 border border-blue-900/40 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-slate-400 font-semibold uppercase">เครื่องจักรทั้งหมด</p>
            <p className="text-3xl font-black text-white mt-2 font-mono">{stats.totalMachines}</p>
            <p className="text-[11px] text-slate-500 mt-1">เครื่องในระบบ</p>
          </div>

          <div className="bg-[#111827]/80 border border-emerald-900/40 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-emerald-400 font-semibold uppercase">● Running</p>
            <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{stats.runningCount}</p>
            <p className="text-[11px] text-emerald-500/80 mt-1">
              {stats.totalMachines > 0 ? ((stats.runningCount / stats.totalMachines) * 100).toFixed(0) : 0}% ของทั้งหมด
            </p>
          </div>

          <div className="bg-[#111827]/80 border border-slate-700/50 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-slate-400 font-semibold uppercase">● Stop</p>
            <p className="text-3xl font-black text-slate-300 mt-2 font-mono">{stats.stopCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">หยุดทำงานปกติ</p>
          </div>

          <div className="bg-[#111827]/80 border border-rose-900/40 p-5 rounded-2xl shadow-lg">
            <p className="text-xs text-rose-400 font-semibold uppercase">● Alarm</p>
            <p className="text-3xl font-black text-rose-400 mt-2 font-mono">{stats.alarmCount}</p>
            <p className="text-[11px] text-rose-500/80 mt-1">กำลังเกิดการเตือน</p>
          </div>

          <div className="bg-[#111827]/80 border border-purple-900/40 p-5 rounded-2xl shadow-lg col-span-2 lg:col-span-1">
            <p className="text-xs text-purple-400 font-semibold uppercase">● Maintenance</p>
            <p className="text-3xl font-black text-purple-400 mt-2 font-mono">{stats.maintenanceCount}</p>
            <p className="text-[11px] text-purple-500/80 mt-1">กำลังซ่อมบำรุง</p>
          </div>
        </div>

        {/* 2. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* กราฟแท่ง: ความถี่ของ Alarm แต่ละ Code */}
          <div className="lg:col-span-2 bg-[#111827]/80 border border-blue-900/40 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                สถิติความถี่ตาม Alarm Code (Frequency by Alarm Code)
              </h2>
              <span className="text-xs text-slate-400 font-mono">รวม {totalAlarmsCount} รายการ</span>
            </div>

            {Object.keys(alarmByCode).length === 0 ? (
              <p className="text-center text-slate-500 py-10 text-sm">ยังไม่มีข้อมูลประวัติ Alarm ในระบบ</p>
            ) : (
              <div className="space-y-3 pt-2">
                {Object.entries(alarmByCode).map(([code, count]) => {
                  const percentage = ((count / maxAlarmCodeCount) * 100).toFixed(0);
                  return (
                    <div key={code} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono font-bold text-cyan-400">{code}</span>
                        <span className="text-slate-400 font-mono">{count} ครั้ง</span>
                      </div>
                      <div className="w-full bg-[#0d1322] h-3 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* สถิติตามระดับความรุนแรง (Severity Breakdown) */}
          <div className="bg-[#111827]/80 border border-blue-900/40 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                ระดับความรุนแรง (Severity Breakdown)
              </h2>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-400 font-semibold">Critical (รุนแรงมาก)</span>
                  <span className="font-mono text-slate-300">{alarmBySeverity.Critical}</span>
                </div>
                <div className="w-full bg-[#0d1322] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{
                      width: `${totalAlarmsCount > 0 ? (alarmBySeverity.Critical / totalAlarmsCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-semibold">Warning (เตือนภัย)</span>
                  <span className="font-mono text-slate-300">{alarmBySeverity.Warning}</span>
                </div>
                <div className="w-full bg-[#0d1322] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{
                      width: `${totalAlarmsCount > 0 ? (alarmBySeverity.Warning / totalAlarmsCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-400 font-semibold">Info (แจ้งเพื่อทราบ)</span>
                  <span className="font-mono text-slate-300">{alarmBySeverity.Info}</span>
                </div>
                <div className="w-full bg-[#0d1322] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{
                      width: `${totalAlarmsCount > 0 ? (alarmBySeverity.Info / totalAlarmsCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#0d1322] rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 mt-4">
              <p className="text-slate-200 font-semibold">💡 ข้อสังเกต:</p>
              <p>สัญญาณเตือนระดับ Critical ควรได้รับความช่วยเหลือจากช่างซ่อมบำรุงทันที เพื่อลดเวลา Machine Downtime</p>
            </div>
          </div>

        </div>

        {/* 3. ตารางรายการ Alarm ล่าสุด */}
        <div className="bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 shadow-xl overflow-hidden p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-100">รายการ Alarm ล่าสุดทั้งหมด (Recent Alarms)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d1322] border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-3.5">วัน-เวลา</th>
                  <th className="p-3.5">Machine ID</th>
                  <th className="p-3.5">Alarm Code</th>
                  <th className="p-3.5">ข้อความเตือน</th>
                  <th className="p-3.5">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {alarms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      ไม่พบรายการ Alarm
                    </td>
                  </tr>
                ) : (
                  alarms.slice(0, 10).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {new Date(a.created_at).toLocaleString('th-TH')}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        <Link href={`/machines/${a.machine_id}`} className="hover:underline">
                          {a.machine_id}
                        </Link>
                      </td>
                      <td className="p-3.5 font-mono text-rose-400 whitespace-nowrap">
                        {a.alarm_code || a.code || 'ALM-001'}
                      </td>
                      <td className="p-3.5 text-slate-200">{a.message || a.description || '-'}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          {a.severity || 'Critical'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}