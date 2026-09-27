'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MachinesPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [form, setForm] = useState({ machine_id: '', machine_name: '', machine_type: '', location: '', status: 'Stop' });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    const { data } = await supabase.from('machines').select('*').order('created_at', { ascending: false });
    if (data) setMachines(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.machine_id || !form.machine_name || !form.machine_type || !form.location) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    setSubmitting(true);

    const { data: existing } = await supabase.from('machines').select('id').eq('machine_id', form.machine_id);
    if (existing && existing.length > 0) {
      setErrorMsg('Machine ID นี้มีอยู่ในระบบแล้ว');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('machines').insert([form]);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setForm({ machine_id: '', machine_name: '', machine_type: '', location: '', status: 'Stop' });
      fetchMachines();
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('machines').update({ status: newStatus }).eq('id', id);
    fetchMachines();
  };

  const handleDelete = async (id: string) => {
    if (confirm('ยืนยันการลบเครื่องจักรนี้?')) {
      await supabase.from('machines').delete().eq('id', id);
      fetchMachines();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-blue-900/40 shadow-xl shadow-blue-950/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                Machine Master
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                คลิกที่รหัสเครื่องจักรเพื่อเข้าดูประวัติการซ่อมและ Alarm ย้อนหลัง (Machine History)
              </p>
            </div>
          </div>
          <button
            onClick={fetchMachines}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700 transition-all duration-200 active:scale-95"
          >
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {/* ฟอร์มเพิ่มเครื่องจักร */}
        <form onSubmit={handleSubmit} className="bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-blue-900/40 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">เพิ่มเครื่องจักรใหม่เข้าสู่ระบบ</h2>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Machine ID *</label>
              <input
                type="text"
                placeholder="เช่น MC-001"
                value={form.machine_id}
                onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
                className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Machine Name *</label>
              <input
                type="text"
                placeholder="ชื่อเครื่องจักร"
                value={form.machine_name}
                onChange={(e) => setForm({ ...form, machine_name: e.target.value })}
                className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Machine Type *</label>
              <input
                type="text"
                placeholder="ประเภทเครื่องจักร"
                value={form.machine_type}
                onChange={(e) => setForm({ ...form, machine_type: e.target.value })}
                className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Location *</label>
              <input
                type="text"
                placeholder="ตำแหน่งติดตั้ง"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Initial Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              >
                <option value="Running" className="bg-[#0d1322] text-emerald-400">Running</option>
                <option value="Stop" className="bg-[#0d1322] text-slate-300">Stop</option>
                <option value="Alarm" className="bg-[#0d1322] text-rose-400">Alarm</option>
                <option value="Maintenance" className="bg-[#0d1322] text-purple-400">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลเครื่องจักร'}</span>
            </button>
          </div>
        </form>

        {/* ตารางแสดงรายการเครื่องจักร */}
        <div className="bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d1322] border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Machine ID (คลิกเพื่อดูประวัติ)</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {machines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      ไม่พบรายการเครื่องจักรในระบบ
                    </td>
                  </tr>
                ) : (
                  machines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <Link 
                          href={`/machines/${m.id}`}
                          className="inline-flex items-center gap-1.5 font-mono font-bold text-cyan-400 hover:text-cyan-300 hover:underline group"
                        >
                          <span>{m.machine_id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-500/20">
                            🔍 History
                          </span>
                        </Link>
                      </td>
                      <td className="p-4 font-semibold text-slate-200 min-w-[150px]">
                        {m.machine_name}
                      </td>
                      <td className="p-4 text-slate-300 whitespace-nowrap">
                        {m.machine_type}
                      </td>
                      <td className="p-4 text-slate-400 whitespace-nowrap">
                        {m.location}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <select
                          value={m.status}
                          onChange={(e) => handleStatusChange(m.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none transition-all cursor-pointer ${
                            m.status === 'Running'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : m.status === 'Alarm'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                              : m.status === 'Maintenance'
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <option value="Running" className="bg-[#0d1322] text-emerald-400">Running</option>
                          <option value="Stop" className="bg-[#0d1322] text-slate-300">Stop</option>
                          <option value="Alarm" className="bg-[#0d1322] text-rose-400">Alarm</option>
                          <option value="Maintenance" className="bg-[#0d1322] text-purple-400">Maintenance</option>
                        </select>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>ลบ</span>
                        </button>
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