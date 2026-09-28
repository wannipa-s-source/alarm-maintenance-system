'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, running: 0, stop: 0, alarm: 0, maintenance: 0 });
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { data } = await supabase.from('machines').select('*');
    if (data) {
      setMachines(data);
      setStats({
        total: data.length,
        running: data.filter((m) => m.status === 'Running').length,
        stop: data.filter((m) => m.status === 'Stop').length,
        alarm: data.filter((m) => m.status === 'Alarm').length,
        maintenance: data.filter((m) => m.status === 'Maintenance').length,
      });
    }
    setLoading(false);
  };

  const runningPercentage = stats.total > 0 ? Math.round((stats.running / stats.total) * 100) : 0;

  // ข้อมูลสำหรับนำไปแสดงในกราฟ Recharts
  const chartData = [
    { name: 'Running', count: stats.running, color: '#10b981' },
    { name: 'Stop', count: stats.stop, color: '#64748b' },
    { name: 'Alarm', count: stats.alarm, color: '#f43f5e' },
    { name: 'Maintenance', count: stats.maintenance, color: '#8b5cf6' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg dark:shadow-xl dark:shadow-blue-950/20">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-blue-600 dark:from-white dark:via-slate-200 dark:to-blue-400 bg-clip-text text-transparent">
                Alarm & Maintenance Dashboard
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-6">
              ระบบศูนย์ควบคุมและติดตามสถานะเครื่องจักร (Industrial Monitoring Center)
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'SYNCING...' : 'REFRESH'}</span>
          </button>
        </div>

        {/* Overview Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          
          {/* Total Machines */}
          <div className="bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-6 rounded-2xl border border-blue-500/20 shadow-lg hover:border-blue-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Machines</span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">เครื่องจักรในระบบ</p>
            </div>
          </div>

          {/* Running Status */}
          <div className="bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20 shadow-lg hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Running</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.running}</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-1">กำลังทำงานปกติ</p>
            </div>
          </div>

          {/* Stop Status */}
          <div className="bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-6 rounded-2xl border border-slate-300 dark:border-slate-700/50 shadow-lg hover:border-slate-500 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Standby / Stop</span>
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-600 dark:text-slate-300">{stats.stop}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">หยุดทำงานสแตนด์บาย</p>
            </div>
          </div>

          {/* Alarm Status */}
          <div className="bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-6 rounded-2xl border border-rose-500/30 shadow-lg hover:border-rose-500/60 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Alarm</span>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse">
                <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-500">{stats.alarm}</div>
              <p className="text-xs text-rose-600 dark:text-rose-400/80 mt-1">แจ้งเตือนขัดข้อง</p>
            </div>
          </div>

          {/* Maintenance Status */}
          <div className="bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md p-6 rounded-2xl border border-purple-500/30 shadow-lg hover:border-purple-500/60 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Maintenance</span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{stats.maintenance}</div>
              <p className="text-xs text-purple-600 dark:text-purple-300/80 mt-1">อยู่ระหว่างซ่อมบำรุง</p>
            </div>
          </div>

        </div>

        {/* กราฟวิเคราะห์สถานะและ Alarm (Analytics Charts Section) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* กราฟแท่ง (Bar Chart) */}
          <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-wide">
              📊 สถิติจำนวนเครื่องจักรแยกตามสถานะ (Bar Chart)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} 
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* กราฟวงกลมสัดส่วน (Pie Chart) */}
          <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-wide">
              🍩 สัดส่วนเปอร์เซ็นต์สถานะเครื่องจักร (Distribution)
            </h3>
            <div className="h-72 w-full flex items-center justify-center">
              {stats.total === 0 ? (
                <p className="text-sm text-slate-400">ยังไม่มีข้อมูลในระบบ</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} 
                    />
                    <Pie
                      data={chartData.filter(d => d.count > 0)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={5}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* Machine Running Efficiency Bar Card */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wide">SYSTEM OPERATIONAL EFFICIENCY</h3>
            </div>
            <span className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400 shadow-cyan-500/50">{runningPercentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-blue-900/50">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_12px_#06b6d4]"
              style={{ width: `${runningPercentage}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}