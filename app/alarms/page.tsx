'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [form, setForm] = useState({ machine_id: '', alarm_code: '', alarm_description: '', cause: '', status: 'Open' });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: machinesData } = await supabase.from('machines').select('id, machine_id, machine_name');
    if (machinesData) setMachines(machinesData);

    const { data: alarmsData } = await supabase
      .from('alarms')
      .select('*, machines(machine_id, machine_name)')
      .order('created_at', { ascending: false });
    if (alarmsData) setAlarms(alarmsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.machine_id || !form.alarm_code || !form.alarm_description) {
      setErrorMsg('กรุณากรอกข้อมูล Machine, Alarm Code และ Description ให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('alarms').insert([form]);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setForm({ machine_id: '', alarm_code: '', alarm_description: '', cause: '', status: 'Open' });
      fetchData();
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('alarms').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-blue-900/40 shadow-xl shadow-blue-950/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                Alarm Records
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                ศูนย์บันทึกและติดตามประวัติเหตุการณ์ขัดข้อง (Machine Alarm Log System)
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700 transition-all duration-200 active:scale-95"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {/* ฟอร์มบันทึก Alarm */}
        <form onSubmit={handleSubmit} className="bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-blue-900/40 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">แจ้งเหตุการณ์ Alarm ใหม่</h2>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">เลือกเครื่องจักร *</label>
              <select
                value={form.machine_id}
                onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
                className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              >
                <option value="" className="bg-[#0d1322] text-slate-400">-- เลือกเครื่องจักร --</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0d1322]">
                    {m.machine_id} - {m.machine_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Alarm Code *</label>
              <input
                type="text"
                placeholder="เช่น ALM-001"
                value={form.alarm_code}
                onChange={(e) => setForm({ ...form, alarm_code: e.target.value })}
                className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Alarm Description *</label>
              <input
                type="text"
                placeholder="รายละเอียดการแจ้งเตือนขัดข้อง"
                value={form.alarm_description}
                onChange={(e) => setForm({ ...form, alarm_description: e.target.value })}
                className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Cause (สาเหตุเบื้องต้น)</label>
              <input
                type="text"
                placeholder="ระบุสาเหตุที่คาดว่าทำให้เกิด Alarm"
                value={form.cause}
                onChange={(e) => setForm({ ...form, cause: e.target.value })}
                className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-[0_0_20px_rgba(225,29,72,0.3)] active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{submitting ? 'กำลังบันทึก...' : 'บันทึก Alarm'}</span>
            </button>
          </div>
        </form>

        {/* ตาราง Alarm */}
        <div className="bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d1322] border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">เวลา</th>
                  <th className="p-4">Machine</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Cause</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {alarms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      ไม่พบประวัติการเกิด Alarm ในระบบ
                    </td>
                  </tr>
                ) : (
                  alarms.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(a.created_at).toLocaleString('th-TH')}
                      </td>
                      <td className="p-4 font-bold text-slate-200 whitespace-nowrap">
                        {a.machines?.machine_id || '-'}
                      </td>
                      <td className="p-4 font-mono font-bold text-rose-400 whitespace-nowrap">
                        {a.alarm_code}
                      </td>
                      <td className="p-4 text-slate-300 min-w-[200px]">
                        {a.alarm_description}
                      </td>
                      <td className="p-4 text-slate-400 min-w-[180px]">
                        {a.cause || '-'}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <select
                          value={a.status}
                          onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none transition-all cursor-pointer ${
                            a.status === 'Open'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                              : a.status === 'In Progress'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          <option value="Open" className="bg-[#0d1322] text-rose-400">Open</option>
                          <option value="In Progress" className="bg-[#0d1322] text-amber-400">In Progress</option>
                          <option value="Closed" className="bg-[#0d1322] text-emerald-400">Closed</option>
                        </select>
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