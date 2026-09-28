'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, Gauge, LayoutGrid, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  ALL,
  buildKpis,
  isWithinRange,
  toDateInputValue,
  type Alarm,
  type FilteredRecord,
  type Machine,
  type MaintenanceRecord,
} from '@/lib/dashboard';
import { exportMaintenanceReport } from '@/lib/reportExport';
import FilterBar, { type DashboardFilters } from '@/components/home/FilterBar';
import KpiCards from '@/components/home/KpiCards';
import MachineStatusGrid from '@/components/home/MachineStatusGrid';
import TrendCharts from '@/components/home/TrendCharts';
import RecentActivityTable from '@/components/home/RecentActivityTable';
import QuickActionBar from '@/components/home/QuickActionBar';
import MaintenanceRequestModal from '@/components/home/MaintenanceRequestModal';

const initialFilters: DashboardFilters = {
  search: '',
  startDate: '',
  endDate: '',
  line: ALL,
  machineStatus: ALL,
  jobStatus: ALL,
};

/** หน้าแรก (Home / Dashboard) — ศูนย์ควบคุมสถานะเครื่องจักรทั้งระบบ */
export default function HomePage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestMachineId, setRequestMachineId] = useState<string | undefined>(undefined);

  /** คำขอข้อมูลทั้ง 3 ตาราง (ใช้ร่วมกันทั้งตอนเปิดหน้าและตอนรีเฟรช) */
  const fetchAll = useCallback(async () => {
    const [machinesRes, alarmsRes, recordsRes] = await Promise.all([
      supabase.from('machines').select('*').order('machine_id', { ascending: true }),
      supabase.from('alarms').select('*').order('created_at', { ascending: false }),
      supabase.from('maintenance_records').select('*').order('created_at', { ascending: false }),
    ]);

    return {
      machines: (machinesRes.data ?? []) as Machine[],
      alarms: (alarmsRes.data ?? []) as Alarm[],
      records: (recordsRes.data ?? []) as MaintenanceRecord[],
    };
  }, []);

  /** ดึงข้อมูลแล้วนำไปลง state (ใช้ตอนรีเฟรช / หลังสร้างใบงานใหม่) */
  const loadData = useCallback(async () => {
    const data = await fetchAll();
    setMachines(data.machines);
    setAlarms(data.alarms);
    setRecords(data.records);
    setLoading(false);
  }, [fetchAll]);

  /** รีเฟรชแบบมีสถานะ "กำลังโหลด" ให้ผู้ใช้เห็น (เรียกจากปุ่มในหน้า) */
  const refresh = useCallback(async () => {
    setLoading(true);
    await loadData();
  }, [loadData]);

  // โหลดข้อมูลครั้งแรกเมื่อเปิดหน้า
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const data = await fetchAll();
      if (cancelled) return;
      setMachines(data.machines);
      setAlarms(data.alarms);
      setRecords(data.records);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  /* ------------------------------------------------------------
     ข้อมูลประกอบ: แผนที่ machine_id -> ชื่อเครื่อง สำหรับตารางงานซ่อม
     ------------------------------------------------------------ */
  const machineByUuid = useMemo(() => {
    const map = new Map<string, Machine>();
    machines.forEach((m) => map.set(m.id, m));
    return map;
  }, [machines]);

  /** รายการสายการผลิตทั้งหมดที่มีในระบบ (ใช้ทำตัวเลือกใน Plant / Line Filter) */
  const lines = useMemo(() => {
    const set = new Set<string>();
    machines.forEach((m) => {
      const value = (m.line || m.location || '').trim();
      if (value) set.add(value);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [machines]);

  /* ------------------------------------------------------------
     ตัวกรอง: เครื่องจักร
     ------------------------------------------------------------ */
  const filteredMachines = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();

    return machines.filter((machine) => {
      if (filters.machineStatus !== ALL && machine.status !== filters.machineStatus) return false;

      if (filters.line !== ALL) {
        if ((machine.line || machine.location || '') !== filters.line) return false;
      }

      if (keyword) {
        const haystack = [machine.machine_id, machine.machine_name, machine.machine_type, machine.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });
  }, [machines, filters.machineStatus, filters.line, filters.search]);

  /* ------------------------------------------------------------
     ตัวกรอง: งานซ่อมบำรุง (รวมข้อมูลเครื่องจักรเข้ามาด้วย)
     ------------------------------------------------------------ */
  const filteredRecords = useMemo<FilteredRecord[]>(() => {
    const keyword = filters.search.trim().toLowerCase();

    return records
      .map((record) => {
        const machine = machineByUuid.get(record.machine_id);
        return {
          ...record,
          machine_code: machine?.machine_id ?? '-',
          machine_name: machine?.machine_name ?? '-',
        };
      })
      .filter((record) => {
        if (filters.jobStatus !== ALL && record.status !== filters.jobStatus) return false;
        if (!isWithinRange(record.created_at, filters.startDate, filters.endDate)) return false;

        if (filters.line !== ALL) {
          const machine = machineByUuid.get(record.machine_id);
          if ((machine?.line || machine?.location || '') !== filters.line) return false;
        }

        if (keyword) {
          const haystack = [record.machine_code, record.machine_name, record.problem, record.technician]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(keyword)) return false;
        }

        return true;
      });
  }, [records, machineByUuid, filters]);

  /** Alarm ที่ผ่านการกรองช่วงวันที่ + สายการผลิต (ใช้ทำกราฟแนวโน้ม) */
  const filteredAlarms = useMemo(() => {
    return alarms.filter((alarm) => {
      if (!isWithinRange(alarm.created_at, filters.startDate, filters.endDate)) return false;

      if (filters.line !== ALL) {
        const machine = machineByUuid.get(alarm.machine_id);
        if ((machine?.line || machine?.location || '') !== filters.line) return false;
      }

      return true;
    });
  }, [alarms, machineByUuid, filters.line, filters.startDate, filters.endDate]);

  /* ------------------------------------------------------------
     สรุป KPI — คำนวณจากข้อมูลที่ผ่านตัวกรองช่วงวันที่และสายการผลิต
     (ไม่กรองด้วยคำค้นหา เพื่อให้ตัวเลขสรุปยังคงสะท้อนภาพรวมโรงงาน)
     ------------------------------------------------------------ */
  const scopedRecords = useMemo(() => {
    return records.filter((record) => {
      if (!isWithinRange(record.created_at, filters.startDate, filters.endDate)) return false;
      if (filters.line === ALL) return true;
      const machine = machineByUuid.get(record.machine_id);
      return (machine?.line || machine?.location || '') === filters.line;
    });
  }, [records, machineByUuid, filters.line, filters.startDate, filters.endDate]);

  const scopedMachines = useMemo(() => {
    if (filters.line === ALL) return machines;
    return machines.filter((m) => (m.line || m.location || '') === filters.line);
  }, [machines, filters.line]);

  const kpi = useMemo(
    () => buildKpis(scopedMachines, filteredAlarms, scopedRecords),
    [scopedMachines, filteredAlarms, scopedRecords]
  );

  /* ------------------------------------------------------------
     การกระทำ
     ------------------------------------------------------------ */
  const openRequestModal = (machineId?: string) => {
    setRequestMachineId(machineId);
    setRequestOpen(true);
  };

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      setFilters((prev) => ({ ...prev, jobStatus: ALL }));
      return;
    }
    exportMaintenanceReport(filteredRecords);
  };

  const today = toDateInputValue(new Date());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-4 md:p-8 relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* แสงเบื้องหลัง */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* ========== หัวเรื่องหน้า + สถานะระบบ ========== */}
        <header className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/30 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
                <LayoutGrid className="w-5.5 h-5.5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    System Online
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-600 dark:from-white dark:via-slate-200 dark:to-cyan-400 bg-clip-text text-transparent mt-1">
                  Smart Factory Maintenance System
                </h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  ศูนย์ควบคุมและติดตามสถานะเครื่องจักรทั้งโรงงานแบบเรียลไทม์
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Availability */}
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div className="leading-tight">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Availability</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {kpi.availability}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Activity className="w-4 h-4 text-cyan-500" />
                <div className="leading-tight">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">ข้อมูล ณ วันที่</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 leading-none">
                    {new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short' }).format(new Date(today))}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
              </button>
            </div>
          </div>
        </header>

        {/* ========== ส่วนที่ 6: Quick Filter & Search Bar ========== */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          lines={lines}
          resultCount={filteredRecords.length}
        />

        {/* ========== ส่วนที่ 2: Summary KPI Cards ========== */}
        {loading && machines.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[168px] rounded-2xl bg-white/60 dark:bg-[#111827]/50 border border-slate-200 dark:border-blue-900/30 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <KpiCards kpi={kpi} />
        )}

        {/* ========== ส่วนที่ 3: Machine Overview / Status Grid ========== */}
        <MachineStatusGrid
          machines={filteredMachines}
          totalCount={machines.length}
          onQuickRequest={(machine) => openRequestModal(machine.id)}
        />

        {/* ========== ส่วนที่ 4: Alarm & Maintenance Trends ========== */}
        <TrendCharts alarms={filteredAlarms} records={scopedRecords} />

        {/* ========== ส่วนที่ 5: Recent Maintenance Logs ========== */}
        <RecentActivityTable records={filteredRecords} totalCount={records.length} />

        {/* ========== ส่วนที่ 5: Quick Action Floating Bar ========== */}
        <QuickActionBar onNewLog={() => openRequestModal()} onExport={handleExport} />

        {/* ลิงก์เข้าสู่หน้าย่อยของระบบ */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {[
            { href: '/dashboard', label: 'แดชบอร์ดเชิงลึก' },
            { href: '/machines', label: 'เครื่องจักร' },
            { href: '/alarms', label: 'Alarm' },
            { href: '/maintenance', label: 'ซ่อมบำรุง' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 rounded-xl bg-white/70 dark:bg-[#111827]/60 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-cyan-500/40 transition-all active:scale-95"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Modal แจ้งซ่อมด่วน */}
      <MaintenanceRequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        machines={machines}
        initialMachineId={requestMachineId}
        onCreated={loadData}
      />
    </div>
  );
}
