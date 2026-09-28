'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRole } from '@/context/RoleContext';
import { ROLE_META } from '@/lib/permissions';
import toast from 'react-hot-toast';

export default function MachinesPage() {
  const { role, canEdit, canDelete } = useRole();
  const [machines, setMachines] = useState<any[]>([]);
  const [form, setForm] = useState({ machine_id: '', machine_name: '', machine_type: '', location: '', status: 'Stop' });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 🔍 State สำหรับ Filter และ Search ขั้นสูง
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    const { data } = await supabase.from('machines').select('*').order('created_at', { ascending: false });
    if (data) setMachines(data);
  };

  // ดึงรายการประเภทเครื่องจักรที่ไม่ซ้ำกันเพื่อทำตัวเลือกใน Dropdown
  const uniqueTypes = Array.from(new Set(machines.map((m) => m.machine_type))).filter(Boolean);

  // 🛠️ ฟังก์ชันกรองข้อมูล (Advanced Filter Logic)
  const filteredMachines = machines.filter((m) => {
    const matchesSearch = 
      m.machine_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.machine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchesType = typeFilter === 'All' || m.machine_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // 📥 ฟังก์ชันสำหรับแปลงข้อมูลและดาวน์โหลด CSV (ใช้ข้อมูลจากที่กรองแล้ว หรือทั้งหมดตามต้องการ)
  const exportToCSV = () => {
    const dataToExport = filteredMachines.length > 0 ? filteredMachines : machines;
    if (dataToExport.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = ['Machine ID', 'Machine Name', 'Type', 'Location', 'Status'];
    const rows = dataToExport.map((m) => [
      `"${m.machine_id || ''}"`,
      `"${m.machine_name || ''}"`,
      `"${m.machine_type || ''}"`,
      `"${m.location || ''}"`,
      `"${m.status || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `machines_report_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!canEdit) {
      setErrorMsg('คุณไม่มีสิทธิ์ในการเพิ่มข้อมูล');
      return;
    }

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
      toast.error('เพิ่มเครื่องจักรไม่สำเร็จ: ' + error.message);
    } else {
      toast.success(`เพิ่มเครื่องจักร ${form.machine_id} เข้าสู่ระบบเรียบร้อยแล้ว!`);
      setForm({ machine_id: '', machine_name: '', machine_type: '', location: '', status: 'Stop' });
      fetchMachines();
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!canEdit) return;
    const { error } = await supabase.from('machines').update({ status: newStatus }).eq('id', id);
    if (!error) {
      if (newStatus === 'Alarm') {
        toast.error(`🚨 เครื่องจักรถูกเปลี่ยนสถานะเป็น ALARM!`, { duration: 4000 });
      } else if (newStatus === 'Running') {
        toast.success(`✅ เครื่องจักรกลับมาอยู่ในสถานะ Running แล้ว`, { duration: 4000 });
      } else {
        toast(`ℹ️ อัปเดตสถานะเครื่องจักรเป็น ${newStatus}`, { icon: '🔔' });
      }
      fetchMachines();
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (confirm('ยืนยันการลบเครื่องจักรนี้?')) {
      const { error } = await supabase.from('machines').delete().eq('id', id);
      if (!error) {
        toast.success('ลบข้อมูลเครื่องจักรเรียบร้อยแล้ว');
        fetchMachines();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg dark:shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600 dark:from-white dark:via-slate-200 dark:to-blue-400 bg-clip-text text-transparent">
                Machine Master
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                จัดการรายการเครื่องจักรและดูประวัติย้อนหลัง
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
            {/* ปุ่ม Export CSV */}
            <button
              onClick={exportToCSV}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all duration-200 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>

            {/* ปุ่ม Refresh */}
            <button
              onClick={fetchMachines}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 transition-all duration-200 active:scale-95"
            >
              <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* ฟอร์มเพิ่มเครื่องจักร */}
        {canEdit ? (
          <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-wide">เพิ่มเครื่องจักรใหม่เข้าสู่ระบบ</h2>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Machine ID *</label>
                <input
                  type="text"
                  placeholder="เช่น MC-001"
                  value={form.machine_id}
                  onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 sm:p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Machine Name *</label>
                <input
                  type="text"
                  placeholder="ชื่อเครื่องจักร"
                  value={form.machine_name}
                  onChange={(e) => setForm({ ...form, machine_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 sm:p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Machine Type *</label>
                <input
                  type="text"
                  placeholder="ประเภทเครื่องจักร"
                  value={form.machine_type}
                  onChange={(e) => setForm({ ...form, machine_type: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 sm:p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Location *</label>
                <input
                  type="text"
                  placeholder="ตำแหน่งติดตั้ง"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 sm:p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Initial Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl p-2.5 sm:p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                >
                  <option value="Running">Running</option>
                  <option value="Stop">Stop</option>
                  <option value="Alarm">Alarm</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-md active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลเครื่องจักร'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-700 dark:text-amber-400 text-xs sm:text-sm flex items-center gap-2">
            <span>🔒</span>
            <span>
              คุณกำลังใช้งานในโหมด <b>{ROLE_META[role].label}</b> ({ROLE_META[role].description})
            </span>
          </div>
        )}

        {/* 🔍 Advanced Filter & Search Component */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* ช่องค้นหาข้อความ */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">ค้นหาเครื่องจักร</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาด้วย ID, ชื่อ หรือสถานที่..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* กรองตาม Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">กรองตามสถานะ</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="All">สถานะทั้งหมด (All Status)</option>
                <option value="Running">Running</option>
                <option value="Stop">Stop</option>
                <option value="Alarm">Alarm</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* กรองตาม Machine Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">กรองตามประเภท</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="All">ประเภททั้งหมด (All Types)</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

          </div>

          {/* สรุปผลการกรอง */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>แสดงผลลัพธ์ <strong className="text-slate-700 dark:text-slate-200">{filteredMachines.length}</strong> จากทั้งหมด {machines.length} รายการ</span>
            {(searchTerm || statusFilter !== 'All' || typeFilter !== 'All') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('All'); setTypeFilter('All'); }}
                className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* รายการเครื่องจักร */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg overflow-hidden">
          
          {/* Mobile View */}
          <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {filteredMachines.length === 0 ? (
              <div className="p-6 text-center text-slate-500">ไม่พบรายการเครื่องจักรที่ตรงกับเงื่อนไข</div>
            ) : (
              filteredMachines.map((m) => (
                <div key={m.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/machines/${m.id}`}
                      className="font-mono font-bold text-blue-600 dark:text-cyan-400 hover:underline text-base flex items-center gap-1.5"
                    >
                      <span>{m.machine_id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                        🔍 History
                      </span>
                    </Link>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium"
                      >
                        ลบ
                      </button>
                    )}
                  </div>

                  <div className="text-sm">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{m.machine_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ประเภท: {m.machine_type} | ตำแหน่ง: {m.location}</div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">สถานะ:</span>
                    {canEdit ? (
                      <select
                        value={m.status}
                        onChange={(e) => handleStatusChange(m.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      >
                        <option value="Running">Running</option>
                        <option value="Stop">Stop</option>
                        <option value="Alarm">Alarm</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    ) : (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{m.status}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0d1322] border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4">Machine ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm">
                {filteredMachines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      ไม่พบรายการเครื่องจักรที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredMachines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <Link 
                          href={`/machines/${m.id}`}
                          className="inline-flex items-center gap-1.5 font-mono font-bold text-blue-600 dark:text-cyan-400 hover:underline group"
                        >
                          <span>{m.machine_id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400">
                            🔍 History
                          </span>
                        </Link>
                      </td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 min-w-[150px]">
                        {m.machine_name}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {m.machine_type}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {m.location}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {canEdit ? (
                          <select
                            value={m.status}
                            onChange={(e) => handleStatusChange(m.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none transition-all cursor-pointer ${
                              m.status === 'Running'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : m.status === 'Alarm'
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                                : m.status === 'Maintenance'
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <option value="Running">Running</option>
                            <option value="Stop">Stop</option>
                            <option value="Alarm">Alarm</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                            {m.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {canDelete ? (
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
                          >
                            <span>ลบ</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">-</span>
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