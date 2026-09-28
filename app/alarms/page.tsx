'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/context/RoleContext';
import toast from 'react-hot-toast';

export default function AlarmsPage() {
  const { role, canEdit } = useRole();
  const [alarms, setAlarms] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  
  // State สำหรับฟอร์มแจ้ง Alarm ใหม่
  const [form, setForm] = useState({
    machine_id: '',
    alarm_code: '',
    alarm_description: '',
    cause: '',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  // 🔍 State สำหรับ Filter และ Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchAlarms();
    fetchMachines();
  }, []);

  const fetchAlarms = async () => {
    const { data, error } = await supabase
      .from('alarms')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAlarms(data);
  };

  const fetchMachines = async () => {
    const { data } = await supabase.from('machines').select('*');
    if (data) setMachines(data);
  };

  // 🛠️ ฟังก์ชันกรองข้อมูล Alarm
  const filteredAlarms = alarms.filter((item) => {
    const matchesSearch =
      item.machine_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alarm_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alarm_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cause?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์ในการบันทึกข้อมูล');
      return;
    }

    if (!form.machine_id || !form.alarm_code || !form.alarm_description) {
      toast.error('กรุณากรอกข้อมูลช่องที่มีเครื่องหมาย * ให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('alarms').insert([form]);
    
    if (error) {
      toast.error('บันทึก Alarm ไม่สำเร็จ: ' + error.message);
    } else {
      toast.success('บันทึกเหตุการณ์ Alarm สำเร็จ!');
      setForm({ machine_id: '', alarm_code: '', alarm_description: '', cause: '', status: 'Active' });
      fetchAlarms();
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!canEdit) return;
    const { error } = await supabase.from('alarms').update({ status: newStatus }).eq('id', id);
    if (!error) {
      toast.success(`อัปเดตสถานะ Alarm เป็น ${newStatus} แล้ว`);
      fetchAlarms();
    } else {
      toast.error('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-rose-900/40 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-rose-900 to-rose-600 dark:from-white dark:via-slate-200 dark:to-rose-400 bg-clip-text text-transparent">
                Alarm Records
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                ศูนย์บันทึกและติดตามประวัติเหตุการณ์ขัดข้อง (Machine Alarm Log System)
              </p>
            </div>
          </div>

          <button
            onClick={fetchAlarms}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 transition-all active:scale-95"
          >
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {/* ฟอร์มแจ้งเหตุการณ์ Alarm ใหม่ */}
        {canEdit && (
          <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-rose-900/40 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">แจ้งเหตุการณ์ Alarm ใหม่</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">เลือกเครื่องจักร *</label>
                <select
                  value={form.machine_id}
                  onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- เลือกเครื่องจักร --</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.machine_id}>
                      {m.machine_id} : {m.machine_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Alarm Code *</label>
                <input
                  type="text"
                  placeholder="เช่น ALM-001"
                  value={form.alarm_code}
                  onChange={(e) => setForm({ ...form, alarm_code: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Alarm Description *</label>
                <input
                  type="text"
                  placeholder="รายละเอียดการแจ้งเตือนขัดข้อง"
                  value={form.alarm_description}
                  onChange={(e) => setForm({ ...form, alarm_description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Cause (สาเหตุเบื้องต้น)</label>
                <input
                  type="text"
                  placeholder="ระบุสาเหตุที่คาดว่าทำให้เกิด Alarm"
                  value={form.cause}
                  onChange={(e) => setForm({ ...form, cause: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-sm transition shadow-md active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึก Alarm'}
              </button>
            </div>
          </form>
        )}

        {/* 🔍 Search and Filter Component */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-rose-900/40 shadow-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">ค้นหา Alarm</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาด้วย Machine ID, Code, รายละเอียด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">กรองตามสถานะ</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="All">สถานะทั้งหมด (All Status)</option>
                <option value="Active">Active / Pending</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>แสดงผล <strong className="text-slate-700 dark:text-slate-200">{filteredAlarms.length}</strong> จากทั้งหมด {alarms.length} รายการ</span>
            {(searchTerm || statusFilter !== 'All') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* ตารางแสดงข้อมูล Alarm */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-rose-900/40 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0d1322] border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4">เวลา</th>
                  <th className="p-4">Machine</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Cause</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm">
                {filteredAlarms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      ไม่พบประวัติเหตุการณ์ Alarm ที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredAlarms.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleString('th-TH')}
                      </td>
                      <td className="p-4 whitespace-nowrap font-mono font-bold text-rose-600 dark:text-rose-400">
                        {item.machine_id}
                      </td>
                      <td className="p-4 whitespace-nowrap font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {item.alarm_code}
                      </td>
                      <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                        {item.alarm_description}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        {item.cause || '-'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {canEdit ? (
                          <select
                            value={item.status || 'Active'}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold border focus:outline-none ${
                              item.status === 'Closed'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            <option value="Active">Active</option>
                            <option value="Closed">Closed</option>
                          </select>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-xs font-bold border">
                            {item.status || 'Active'}
                          </span>
                        )}
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