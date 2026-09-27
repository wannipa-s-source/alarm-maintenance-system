'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, running: 0, stop: 0, alarm: 0, maintenance: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data } = await supabase.from('machines').select('status');
    if (data) {
      setStats({
        total: data.length,
        running: data.filter((m) => m.status === 'Running').length,
        stop: data.filter((m) => m.status === 'Stop').length,
        alarm: data.filter((m) => m.status === 'Alarm').length,
        maintenance: data.filter((m) => m.status === 'Maintenance').length,
      });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Alarm & Maintenance Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="p-6 bg-blue-50 border-l-4 border-blue-500 rounded shadow">
          <p className="text-sm text-gray-600">เครื่องจักรทั้งหมด</p>
          <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
        </div>
        <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded shadow">
          <p className="text-sm text-gray-600">Running</p>
          <p className="text-3xl font-bold text-green-700">{stats.running}</p>
        </div>
        <div className="p-6 bg-gray-50 border-l-4 border-gray-500 rounded shadow">
          <p className="text-sm text-gray-600">Stop</p>
          <p className="text-3xl font-bold text-gray-700">{stats.stop}</p>
        </div>
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded shadow">
          <p className="text-sm text-gray-600">Alarm</p>
          <p className="text-3xl font-bold text-red-700">{stats.alarm}</p>
        </div>
        <div className="p-6 bg-purple-50 border-l-4 border-purple-500 rounded shadow">
          <p className="text-sm text-gray-600">Maintenance</p>
          <p className="text-3xl font-bold text-purple-700">{stats.maintenance}</p>
        </div>
      </div>
    </div>
  );
}