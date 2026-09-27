'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [form, setForm] = useState({ machine_id: '', alarm_code: '', alarm_description: '', cause: '', status: 'Open' });
  const [errorMsg, setErrorMsg] = useState('');

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

    const { error } = await supabase.from('alarms').insert([form]);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setForm({ machine_id: '', alarm_code: '', alarm_description: '', cause: '', status: 'Open' });
      fetchData();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from('alarms').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Alarm Records</h1>

      {/* ฟอร์มบันทึก Alarm */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8 border">
        <h2 className="text-xl font-semibold mb-4">แจ้งเหตุการณ์ Alarm ใหม่</h2>
        {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select value={form.machine_id} onChange={(e) => setForm({ ...form, machine_id: e.target.value })} className="border p-2 rounded">
            <option value="">-- เลือกเครื่องจักร --</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.machine_id} - {m.machine_name}</option>
            ))}
          </select>
          <input type="text" placeholder="Alarm Code (เช่น ALM-001)" value={form.alarm_code} onChange={(e) => setForm({ ...form, alarm_code: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Alarm Description" value={form.alarm_description} onChange={(e) => setForm({ ...form, alarm_description: e.target.value })} className="border p-2 rounded col-span-2" />
          <input type="text" placeholder="Cause (สาเหตุเบื้องต้น)" value={form.cause} onChange={(e) => setForm({ ...form, cause: e.target.value })} className="border p-2 rounded col-span-2" />
        </div>
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">บันทึก Alarm</button>
      </form>

      {/* ตาราง Alarm */}
      <table className="w-full bg-white shadow-md rounded border">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-3 text-left">เวลา</th>
            <th className="p-3 text-left">Machine</th>
            <th className="p-3 text-left">Code</th>
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-left">Cause</th>
            <th className="p-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {alarms.map((a) => (
            <tr key={a.id} className="border-b hover:bg-gray-50">
              <td className="p-3 text-sm text-gray-500">{new Date(a.created_at).toLocaleString('th-TH')}</td>
              <td className="p-3 font-semibold">{a.machines?.machine_id}</td>
              <td className="p-3 text-red-600 font-bold">{a.alarm_code}</td>
              <td className="p-3">{a.alarm_description}</td>
              <td className="p-3">{a.cause || '-'}</td>
              <td className="p-3 text-center">
                <select
                  value={a.status}
                  onChange={(e) => handleStatusChange(a.id, e.target.value)}
                  className={`p-1 rounded text-xs font-bold ${
                    a.status === 'Open' ? 'bg-red-100 text-red-800' :
                    a.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}