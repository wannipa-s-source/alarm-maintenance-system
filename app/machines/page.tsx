'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MachinesPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [form, setForm] = useState({ machine_id: '', machine_name: '', machine_type: '', location: '', status: 'Stop' });
  const [errorMsg, setErrorMsg] = useState('');

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

    // Input Validation: ห้ามว่าง
    if (!form.machine_id || !form.machine_name || !form.machine_type || !form.location) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    // เช็ค Machine ID ซ้ำ
    const { data: existing } = await supabase.from('machines').select('id').eq('machine_id', form.machine_id);
    if (existing && existing.length > 0) {
      setErrorMsg('Machine ID นี้มีอยู่ในระบบแล้ว');
      return;
    }

    const { error } = await supabase.from('machines').insert([form]);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setForm({ machine_id: '', machine_name: '', machine_type: '', location: '', status: 'Stop' });
      fetchMachines();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('ยืนยันการลบเครื่องจักรนี้?')) {
      await supabase.from('machines').delete().eq('id', id);
      fetchMachines();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Machine Master</h1>

      {/* ฟอร์มเพิ่มเครื่องจักร */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8 border">
        <h2 className="text-xl font-semibold mb-4">เพิ่มเครื่องจักรใหม่</h2>
        {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <input type="text" placeholder="Machine ID (ห้ามซ้ำ)" value={form.machine_id} onChange={(e) => setForm({ ...form, machine_id: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Machine Name" value={form.machine_name} onChange={(e) => setForm({ ...form, machine_name: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Machine Type" value={form.machine_type} onChange={(e) => setForm({ ...form, machine_type: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border p-2 rounded" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border p-2 rounded">
            <option value="Running">Running</option>
            <option value="Stop">Stop</option>
            <option value="Alarm">Alarm</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">บันทึกข้อมูล</button>
      </form>

      {/* ตารางแสดงรายการ */}
      <table className="w-full bg-white shadow-md rounded border">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-3 text-left">Machine ID</th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Location</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-center">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((m) => (
            <tr key={m.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-semibold">{m.machine_id}</td>
              <td className="p-3">{m.machine_name}</td>
              <td className="p-3">{m.machine_type}</td>
              <td className="p-3">{m.location}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  m.status === 'Running' ? 'bg-green-100 text-green-800' :
                  m.status === 'Alarm' ? 'bg-red-100 text-red-800' :
                  m.status === 'Maintenance' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {m.status}
                </span>
              </td>
              <td className="p-3 text-center">
                <button onClick={() => handleDelete(m.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}