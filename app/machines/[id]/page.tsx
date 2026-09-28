'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MachineHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  // แกะรับค่า id จาก Dynamic Route URL
  const resolvedParams = use(params);
  const machineDbId = resolvedParams.id;

  const [machine, setMachine] = useState<any>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [alarmHistory, setAlarmHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachineAndHistory();
  }, [machineDbId]);

  const fetchMachineAndHistory = async () => {
    setLoading(true);

    // 1. ดึงข้อมูลรายละเอียดของเครื่องจักรนี้
    const { data: machineData, error: machineError } = await supabase
      .from('machines')
      .select('*')
      .eq('id', machineDbId)
      .single();

    if (machineData) {
      setMachine(machineData);

      // 2. ดึงประวัติการซ่อมบำรุง (Maintenance Records)
      const { data: mData } = await supabase
        .from('maintenance_records')
        .select('*')
        .or(`machine_id.eq.${machineData.id},machine_id.eq.${machineData.machine_id}`)
        .order('created_at', { ascending: false });

      if (mData) setMaintenanceHistory(mData);

      // 3. ดึงประวัติสัญญาณเตือน (Alarms)
      const { data: aData } = await supabase
        .from('alarms')
        .select('*')
        .or(`machine_id.eq.${machineData.id},machine_id.eq.${machineData.machine_id}`)
        .order('created_at', { ascending: false });

      if (aData) setAlarmHistory(aData);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-10 flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-cyan-600 dark:text-cyan-400 font-mono text-sm animate-pulse">กำลังโหลดข้อมูลประวัติเครื่องจักร...</p>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-10 flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
        <p className="text-rose-600 dark:text-rose-400 font-semibold text-lg">ไม่พบข้อมูลเครื่องจักรรายการนี้</p>
        <Link href="/machines" className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 text-sm transition">
          &larr; กลับไปยังหน้า Machine Master
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Top Navigation & Header */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl space-y-4">
          <Link href="/machines" className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>ย้อนกลับไปหน้า Machine Master</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-cyan-600 dark:text-cyan-400 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  {machine.machine_id}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {machine.machine_name}
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                ประเภท: <span className="text-slate-800 dark:text-slate-200">{machine.machine_type}</span> | ตำแหน่งติดตั้ง: <span className="text-slate-800 dark:text-slate-200">{machine.location}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">สถานะปัจจุบัน:</span>
              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                machine.status === 'Running' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                machine.status === 'Alarm' ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' :
                machine.status === 'Maintenance' ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400' :
                'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                ● {machine.status}
              </span>
            </div>
          </div>
        </div>

        {/* 1. ประวัติการซ่อมบำรุง (Maintenance History) */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">ประวัติการซ่อมบำรุง (Maintenance Records)</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">ทั้งหมด {maintenanceHistory.length} รายการ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0d1322] border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-3.5">วันที่บันทึก</th>
                  <th className="p-3.5">ประเภทการซ่อม</th>
                  <th className="p-3.5">ปัญหาที่พบ (Problem)</th>
                  <th className="p-3.5">การแก้ไข (Action Taken)</th>
                  <th className="p-3.5">ผู้รับผิดชอบ</th>
                  <th className="p-3.5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm">
                {maintenanceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      ไม่พบประวัติการซ่อมบำรุงสำหรับเครื่องจักรนี้
                    </td>
                  </tr>
                ) : (
                  maintenanceHistory.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString('th-TH')}
                      </td>
                      <td className="p-3.5 text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap">
                        {m.maintenance_type || m.type || 'Corrective'}
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {m.problem || m.description || '-'}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {m.action_taken || m.solution || '-'}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                        {m.technician || m.created_by || 'Technician'}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs rounded-lg font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                          {m.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. ประวัติการแจ้งเตือน (Alarm History) */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">ประวัติสัญญาณเตือน (Alarm Records)</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">ทั้งหมด {alarmHistory.length} รายการ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0d1322] border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-3.5">เวลาที่เกิด</th>
                  <th className="p-3.5">Alarm Code</th>
                  <th className="p-3.5">ข้อความแจ้งเตือน</th>
                  <th className="p-3.5">ระดับความรุนแรง</th>
                  <th className="p-3.5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm">
                {alarmHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      ไม่พบประวัติสัญญาณเตือนสำหรับเครื่องจักรนี้
                    </td>
                  </tr>
                ) : (
                  alarmHistory.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                        {new Date(a.created_at).toLocaleString('th-TH')}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {a.alarm_code || a.code || 'ALM-001'}
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200">
                        {a.message || a.description || '-'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          a.severity === 'Critical' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40' :
                          a.severity === 'Warning' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40' :
                          'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {a.severity || 'High'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs rounded-lg font-bold ${
                          a.status === 'Resolved' || a.status === 'Cleared'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {a.status || 'Active'}
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