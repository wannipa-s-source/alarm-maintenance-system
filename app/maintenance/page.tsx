'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

type MaintenanceRecord = {
  id: string;
  machine_id: string;
  maintenance_type: string;
  problem: string | null;
  action_taken: string | null;
  status: string;
};

export default function MaintenancePage() {
  const { isAdmin, canEditMaintenance } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [form, setForm] = useState({ machine_id: '', maintenance_type: 'Corrective', problem: '', action_taken: '', status: 'Pending' });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // รหัสรายการที่กำลังแก้ไข (null = เพิ่มรายการใหม่)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: machinesData } = await supabase.from('machines').select('id, machine_id, machine_name');
    if (machinesData) setMachines(machinesData);

    const { data: maintenanceData } = await supabase
      .from('maintenance_records')
      .select('*, machines(machine_id, machine_name)')
      .order('created_at', { ascending: false });
    if (maintenanceData) setRecords(maintenanceData);
  };

  const resetForm = () => {
    setForm({ machine_id: '', maintenance_type: 'Corrective', problem: '', action_taken: '', status: 'Pending' });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!canEditMaintenance) {
      setErrorMsg('คุณไม่มีสิทธิ์ในการบันทึกหรือแก้ไขข้อมูล Maintenance');
      return;
    }

    if (!form.machine_id || !form.problem) {
      setErrorMsg('กรุณาเลือกเครื่องจักรและระบุปัญหา (Problem)');
      return;
    }

    setSubmitting(true);

    const { error } = editingId
      ? await supabase.from('maintenance_records').update(form).eq('id', editingId)
      : await supabase.from('maintenance_records').insert([form]);

    if (error) {
      setErrorMsg(error.message);
      toast.error('บันทึกข้อมูลไม่สำเร็จ: ' + error.message);
    } else {
      toast.success(editingId ? 'แก้ไขข้อมูล Maintenance เรียบร้อยแล้ว' : 'บันทึกงาน Maintenance เรียบร้อยแล้ว');
      resetForm();
      fetchData();
    }
    setSubmitting(false);
  };

  // เข้าสู่โหมดแก้ไข: นำข้อมูลเดิมมาใส่ฟอร์ม
  const handleEdit = (record: MaintenanceRecord) => {
    setEditingId(record.id);
    setErrorMsg('');
    setForm({
      machine_id: record.machine_id,
      maintenance_type: record.maintenance_type,
      problem: record.problem ?? '',
      action_taken: record.action_taken ?? '',
      status: record.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('ยืนยันการลบรายการ Maintenance นี้?')) return;

    const { error } = await supabase.from('maintenance_records').delete().eq('id', id);
    if (error) {
      toast.error('ลบข้อมูลไม่สำเร็จ: ' + error.message);
    } else {
      toast.success('ลบรายการ Maintenance เรียบร้อยแล้ว');
      if (editingId === id) resetForm();
      fetchData();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!canEditMaintenance) return;
    const { error } = await supabase.from('maintenance_records').update({ status: newStatus }).eq('id', id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    fetchData();
  };

  // ฟังก์ชันรีเซ็ตตัวกรองทั้งหมด
  const handleResetFilter = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setStatusFilter('All');
  };

  // กรองข้อมูล Records ตามคำค้นหา, ประเภทงานซ่อม และสถานะ
  const filteredRecords = records.filter((r) => {
    const machineIdStr = r.machines?.machine_id?.toLowerCase() || '';
    const machineNameStr = r.machines?.machine_name?.toLowerCase() || '';
    const problemStr = r.problem?.toLowerCase() || '';
    const actionStr = r.action_taken?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = 
      machineIdStr.includes(search) || 
      machineNameStr.includes(search) || 
      problemStr.includes(search) || 
      actionStr.includes(search);

    const matchesType = typeFilter === 'All' || r.maintenance_type === typeFilter;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg dark:shadow-xl dark:shadow-blue-950/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-purple-600 dark:from-white dark:via-slate-200 dark:to-purple-400 bg-clip-text text-transparent">
                Maintenance Records
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                ศูนย์บันทึกและติดตามการบำรุงรักษาเครื่องจักร (Machine Maintenance Log)
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 transition-all duration-200 active:scale-95"
          >
            <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {/* ฟอร์มบันทึก Maintenance (Admin + Technician) */}
        <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-wide">
                {editingId ? 'แก้ไขข้อมูลการบำรุงรักษา' : 'บันทึกการบำรุงรักษา / ซ่อมแซม'}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all"
              >
                ยกเลิกการแก้ไข
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">เลือกเครื่องจักร *</label>
              <select
                value={form.machine_id}
                onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
                className="w-full bg-slate-100 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              >
                <option value="" className="bg-slate-100 dark:bg-[#0d1322] text-slate-500 dark:text-slate-400">-- เลือกเครื่องจักร --</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-100 dark:bg-[#0d1322]">
                    {m.machine_id} - {m.machine_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">ประเภทงานบำรุงรักษา (Type) *</label>
              <select
                value={form.maintenance_type}
                onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
                className="w-full bg-slate-100 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              >
                <option value="Preventive" className="bg-slate-100 dark:bg-[#0d1322]">Preventive (PM)</option>
                <option value="Corrective" className="bg-slate-100 dark:bg-[#0d1322]">Corrective (CM)</option>
                <option value="Breakdown" className="bg-slate-100 dark:bg-[#0d1322]">Breakdown</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Problem (อาการ/ปัญหา) *</label>
              <input
                type="text"
                placeholder="ระบุอาการหรือปัญหาที่พบ"
                value={form.problem}
                onChange={(e) => setForm({ ...form, problem: e.target.value })}
                className="w-full bg-slate-100 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Action Taken (การแก้ไข)</label>
              <input
                type="text"
                placeholder="ระบุรายละเอียดการแก้ไขหรือซ่อมแซม"
                value={form.action_taken}
                onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
                className="w-full bg-slate-100 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-[0_0_20px_rgba(147,51,234,0.3)] active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{submitting ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'บันทึกงาน Maintenance'}</span>
            </button>
          </div>
        </form>

        {/* ส่วนค้นหา และ ตัวกรอง (Search & Filters Section) */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* ช่องค้นหา */}
          <div className="w-full md:flex-1 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหาจากอาการปัญหา (Problem), วิธีการแก้ไข (Action Taken) หรือรหัสเครื่องจักร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* ตัวกรองและปุ่มรีเซ็ต */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            {/* กรองประเภทงานซ่อม */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-44 bg-slate-100 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition cursor-pointer"
            >
              <option value="All">ทุกประเภท (All Types)</option>
              <option value="Preventive">Preventive (PM)</option>
              <option value="Corrective">Corrective (CM)</option>
              <option value="Breakdown">Breakdown</option>
            </select>

            {/* กรองสถานะ */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 bg-slate-100 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition cursor-pointer"
            >
              <option value="All">ทุกสถานะ (All Status)</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            {/* ปุ่มรีเซ็ต */}
            <button
              onClick={handleResetFilter}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 transition-all duration-200 active:scale-95 whitespace-nowrap"
              title="ล้างตัวกรอง"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>รีเซ็ต</span>
            </button>
          </div>
        </div>

        {/* ตารางแสดงรายการ Maintenance */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0d1322] border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4">วันที่</th>
                  <th className="p-4">Machine</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Problem</th>
                  <th className="p-4">Action Taken</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      ไม่พบประวัติการทำ Maintenance ที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {r.machines?.machine_id || '-'}
                      </td>
                      <td className="p-4 font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
                          {r.maintenance_type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 min-w-[200px]">
                        {r.problem}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 min-w-[200px]">
                        {r.action_taken || '-'}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {canEditMaintenance ? (
                          <select
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none transition-all cursor-pointer ${
                              r.status === 'Pending'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                : r.status === 'In Progress'
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            <option value="Pending" className="bg-slate-100 dark:bg-[#0d1322] text-amber-600 dark:text-amber-400">Pending</option>
                            <option value="In Progress" className="bg-slate-100 dark:bg-[#0d1322] text-cyan-600 dark:text-cyan-400">In Progress</option>
                            <option value="Completed" className="bg-slate-100 dark:bg-[#0d1322] text-emerald-600 dark:text-emerald-400">Completed</option>
                          </select>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                            {r.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {canEditMaintenance && (
                            <button
                              type="button"
                              onClick={() => handleEdit(r)}
                              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
                            >
                              แก้ไข
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
                            >
                              ลบ
                            </button>
                          )}
                        </div>
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