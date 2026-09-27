'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MaintenancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [form, setForm] = useState({ machine_id: '', maintenance_type: 'Corrective', problem: '', action_taken: '', status: 'Pending' });
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.machine_id || !form.problem) {
      setErrorMsg('กรุณาเลือกเครื่องจักรและระบุปัญหา (Problem)');
      return;
    }

    const { error } = await supabase.from('maintenance_records').insert([form]);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setForm({ machine_id: '', maintenance_type: 'Corrective', problem: '', action_taken: '', status: 'Pending' });
      fetchData();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('maintenance_records').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Maintenance Records</h1>

      {/* ฟอร์มบันทึก Maintenance */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8 border">
        <h2 className="text-xl font-semibold mb-4">บันทึกการบำรุงรักษา / ซ่อมแซม</h2>
        {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select value={form.machine_id} onChange={(e) => setForm({ ...form, machine_id: e.target.value })} className="border p-2 rounded">
            <option value="">-- เลือกเครื่องจักร --</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.machine_id} - {m.machine_name}</option>
            ))}
          </select>
          <select value={form.maintenance_type} onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })} className="border p-2 rounded">
            <option value="Preventive">Preventive (PM)</option>
            <option value="Corrective">Corrective (CM)</option>
            <option value="Breakdown">Breakdown</option>
          </select>
          <input type="text" placeholder="Problem (อาการ/ปัญหา)" value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} className="border p-2 rounded col-span-2" />
          <input type="text" placeholder="Action Taken (การแก้ไข)" value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })} className="border p-2 rounded col-span-2" />
        </div>
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">บันทึกงาน Maintenance</button>
      </form>

      {/* ตารางแสดงรายการ Maintenance */}
      <table className="w-full bg-white shadow-md rounded border">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-3 text-left">วันที่</th>
            <th className="p-3 text-left">Machine</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Problem</th>
            <th className="p-3 text-left">Action Taken</th>
            <th className="p-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="p-3 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString('th-TH')}</td>
              <td className="p-3 font-semibold">{r.machines?.machine_id}</td>
              <td className="p-3">{r.maintenance_type}</td>
              <td className="p-3">{r.problem}</td>
              <td className="p-3">{r.action_taken || '-'}</td>
              <td className="p-3 text-center">
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  className={`p-1 rounded text-xs font-bold ${
                    r.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                    r.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}