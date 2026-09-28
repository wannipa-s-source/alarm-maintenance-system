import type { LucideIcon } from 'lucide-react';
import {
  CircleCheck,
  Hourglass,
  PackageSearch,
  Play,
  TriangleAlert,
  Wrench,
} from 'lucide-react';

/* ============================================================
   1) โมเดลข้อมูล
   หมายเหตุ: ฟิลด์ที่ทำเครื่องหมาย `?` เป็นฟิลด์เสริมที่อาจยังไม่มีในตาราง
   โค้ดจะอ่านค่าเหล่านี้แบบ "มีก็ใช้ ไม่มีก็แสดง -" เพื่อไม่ให้หน้าเว็บพัง
   ============================================================ */

export type MachineStatus = 'Running' | 'Stop' | 'Alarm' | 'Maintenance';
export type AlarmStatus = 'Open' | 'In Progress' | 'Closed';
export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Waiting Part' | 'Completed';

export type Machine = {
  id: string;
  machine_id: string;
  machine_name: string;
  machine_type: string | null;
  location: string | null;
  line?: string | null;
  status: MachineStatus;
  created_at?: string | null;
};

export type Alarm = {
  id: string;
  machine_id: string;
  alarm_code?: string | null;
  alarm_description?: string | null;
  cause?: string | null;
  status: AlarmStatus;
  created_at?: string | null;
};

export type MaintenanceRecord = {
  id: string;
  machine_id: string;
  maintenance_type: string;
  problem?: string | null;
  action_taken?: string | null;
  status: MaintenanceStatus;
  created_at?: string | null;
  technician?: string | null;
  duration_minutes?: number | null;
  completed_at?: string | null;
};

export type FilteredRecord = MaintenanceRecord & {
  machine_code: string;
  machine_name: string;
};

/* ============================================================
   2) Metadata ของสถานะต่าง ๆ (สีป้าย / สีจุด / ไอคอน / ป้ายกำกับ)
   ============================================================ */

export type StatusMeta = {
  label: string;
  labelEn: string;
  /** สีแบบ hex สำหรับกราฟ */
  hex: string;
  /** คลาสสำหรับ badge */
  badge: string;
  /** คลาสสำหรับจุดสถานะกะพริบ */
  dot: string;
  /** คลาสขอบการ์ด */
  ring: string;
  icon: LucideIcon;
};

export const machineStatusMeta: Record<MachineStatus, StatusMeta> = {
  Running: {
    label: 'กำลังทำงาน',
    labelEn: 'Running',
    hex: '#10b981',
    badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    ring: 'border-emerald-500/40 hover:border-emerald-500/70 hover:shadow-emerald-500/10',
    icon: Play,
  },
  Stop: {
    label: 'หยุด / จอดรอ',
    labelEn: 'Idle',
    hex: '#f59e0b',
    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    ring: 'border-amber-500/40 hover:border-amber-500/70 hover:shadow-amber-500/10',
    icon: Hourglass,
  },
  Alarm: {
    label: 'หยุดทำงาน / Alarm',
    labelEn: 'Down',
    hex: '#f43f5e',
    badge: 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    ring: 'border-rose-500/50 hover:border-rose-500/80 hover:shadow-rose-500/10',
    icon: TriangleAlert,
  },
  Maintenance: {
    label: 'กำลังซ่อมบำรุง',
    labelEn: 'Maintenance',
    hex: '#8b5cf6',
    badge: 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400',
    dot: 'bg-violet-500',
    ring: 'border-violet-500/40 hover:border-violet-500/70 hover:shadow-violet-500/10',
    icon: Wrench,
  },
};

export const maintenanceStatusMeta: Record<MaintenanceStatus, StatusMeta> = {
  Pending: {
    label: 'รอซ่อม',
    labelEn: 'Pending',
    hex: '#f59e0b',
    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    ring: '',
    icon: Hourglass,
  },
  'In Progress': {
    label: 'กำลังซ่อม',
    labelEn: 'In Progress',
    hex: '#06b6d4',
    badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400',
    dot: 'bg-cyan-500',
    ring: '',
    icon: Wrench,
  },
  'Waiting Part': {
    label: 'รออะไหล่',
    labelEn: 'Waiting Part',
    hex: '#fb923c',
    badge: 'bg-orange-500/10 border-orange-500/40 text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    ring: '',
    icon: PackageSearch,
  },
  Completed: {
    label: 'ซ่อมเสร็จแล้ว',
    labelEn: 'Completed',
    hex: '#10b981',
    badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    ring: '',
    icon: CircleCheck,
  },
};

/** ฟังก์ชันดึง metadata แบบกัน null ไว้ล่วงหน้า (ข้อมูลเก่าอาจมีสถานะเพิ่มใหม่) */
export function getMachineStatusMeta(status: string): StatusMeta {
  return machineStatusMeta[status as MachineStatus] ?? machineStatusMeta.Stop;
}

export function getMaintenanceStatusMeta(status: string): StatusMeta {
  return maintenanceStatusMeta[status as MaintenanceStatus] ?? maintenanceStatusMeta.Pending;
}

/* ============================================================
   3) ตัวเลือกสำหรับช่องกรอง (Filter Options)
   ============================================================ */

export const ALL = 'all' as const;

/** ตัวเลือกสถานะเครื่องจักร */
export const machineFilterOptions: { value: MachineStatus | typeof ALL; label: string; hex: string }[] = [
  { value: ALL, label: 'ทุกสถานะ', hex: '#64748b' },
  { value: 'Running', label: 'Running', hex: machineStatusMeta.Running.hex },
  { value: 'Stop', label: 'Idle / จอดรอ', hex: machineStatusMeta.Stop.hex },
  { value: 'Alarm', label: 'Down / Alarm', hex: machineStatusMeta.Alarm.hex },
  { value: 'Maintenance', label: 'Maintenance', hex: machineStatusMeta.Maintenance.hex },
];

/** ตัวเลือกสถานะงานซ่อม */
export const jobFilterOptions: { value: MaintenanceStatus | typeof ALL; label: string; hex: string }[] = [
  { value: ALL, label: 'ทุกสถานะงาน', hex: '#64748b' },
  { value: 'Pending', label: 'Pending', hex: maintenanceStatusMeta.Pending.hex },
  { value: 'In Progress', label: 'In Progress', hex: maintenanceStatusMeta['In Progress'].hex },
  { value: 'Waiting Part', label: 'Waiting Part', hex: maintenanceStatusMeta['Waiting Part'].hex },
  { value: 'Completed', label: 'Completed', hex: maintenanceStatusMeta.Completed.hex },
];

export const maintenanceTypeOptions = [
  { value: 'Preventive', label: 'Preventive (PM)', hex: '#06b6d4' },
  { value: 'Corrective', label: 'Corrective (CM)', hex: '#f59e0b' },
  { value: 'Breakdown', label: 'Breakdown', hex: '#f43f5e' },
] as const;

/* ============================================================
   4) ตัวช่วยจัดการวันที่
   ============================================================ */

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** คืนค่า true ถ้า record อยู่ในช่วงวันที่ที่เลือก (ไม่เลือกวัน = ผ่านหมด) */
export function isWithinRange(value: string | null | undefined, start: string, end: string): boolean {
  if (!value) return false;
  if (!start && !end) return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;

  if (start) {
    const from = new Date(`${start}T00:00:00`);
    if (date < from) return false;
  }
  if (end) {
    const to = new Date(`${end}T23:59:59.999`);
    if (date > to) return false;
  }
  return true;
}

export function formatThaiDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  }).format(date);
}

export function formatThaiDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/* ============================================================
   5) ตัวช่วยคำนวณ (KPIs)
   ============================================================ */

export type Kpi = {
  totalMachines: number;
  running: number;
  downMachines: number;
  idleMachines: number;
  maintenanceMachines: number;
  openAlarms: number;
  activeJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  waitingPart: number;
  completedJobs: number;
  /** ค่าเฉลี่ยเวลาซ่อม (ชั่วโมง) — null เมื่อยังไม่มีข้อมูลพอคำนวณ */
  mttrHours: number | null;
  /** ค่าเฉลี่ยเวลาทำงานต่อเนื่อง (ชั่วโมง) — null เมื่อยังไม่มีข้อมูลพอคำนวณ */
  mtbfHours: number | null;
  /** สัดส่วนเครื่องที่ยังทำงานอยู่ (%) */
  availability: number;
};

/**
 * MTTR (Mean Time To Repair) = ค่าเฉลี่ยเวลาที่ใช้ซ่อม
 * คำนวณจากคอลัมน์ duration_minutes ของงานที่ปิดเสร็จแล้วเท่านั้น
 * (ถ้ายังไม่มีคอลัมน์นี้ในฐานข้อมูล จะคืน null และหน้าจอจะแสดง "-")
 */
function calculateMttr(records: MaintenanceRecord[]): number | null {
  const durations = records
    .filter((r) => r.status === 'Completed')
    .map((r) => r.duration_minutes)
    .filter((d): d is number => typeof d === 'number' && Number.isFinite(d) && d > 0);

  if (durations.length === 0) return null;
  return durations.reduce((sum, d) => sum + d, 0) / durations.length / 60;
}

/**
 * MTBF (Mean Time Between Failures) = ค่าเฉลี่ยช่วงเวลาระหว่างงานซ่อมแต่ละครั้ง
 * คำนวณเป็นค่าเฉลี่ยของระยะห่างเวลา (ชั่วโมง) ระหว่างงานที่ปิดเสร็จสองงานติดกัน
 * ของเครื่องจักรแต่ละเครื่อง แล้วนำมาเฉลี่ยอีกที
 */
function calculateMtbf(records: MaintenanceRecord[]): number | null {
  const byMachine = new Map<string, number[]>();

  records
    .filter((r) => r.status === 'Completed' && r.created_at)
    .forEach((r) => {
      const time = new Date(r.created_at!).getTime();
      const list = byMachine.get(r.machine_id) ?? [];
      list.push(time);
      byMachine.set(r.machine_id, list);
    });

  const gaps: number[] = [];

  byMachine.forEach((times) => {
    if (times.length < 2) return;
    times.sort((a, b) => a - b);
    for (let i = 1; i < times.length; i += 1) {
      const gapHours = (times[i] - times[i - 1]) / 3_600_000;
      if (gapHours > 0) gaps.push(gapHours);
    }
  });

  if (gaps.length === 0) return null;
  return gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
}

export function buildKpis(machines: Machine[], alarms: Alarm[], records: MaintenanceRecord[]): Kpi {
  const totalMachines = machines.length;
  const running = machines.filter((m) => m.status === 'Running').length;
  const downMachines = machines.filter((m) => m.status === 'Alarm').length;
  const idleMachines = machines.filter((m) => m.status === 'Stop').length;
  const maintenanceMachines = machines.filter((m) => m.status === 'Maintenance').length;

  const openAlarms = alarms.filter((a) => a.status !== 'Closed').length;
  const pendingJobs = records.filter((r) => r.status === 'Pending').length;
  const inProgressJobs = records.filter((r) => r.status === 'In Progress').length;
  const activeJobs = pendingJobs + inProgressJobs;
  const waitingPart = records.filter((r) => r.status === 'Waiting Part').length;
  const completedJobs = records.filter((r) => r.status === 'Completed').length;

  return {
    totalMachines,
    running,
    downMachines,
    idleMachines,
    maintenanceMachines,
    openAlarms,
    activeJobs,
    pendingJobs,
    inProgressJobs,
    waitingPart,
    completedJobs,
    mttrHours: calculateMttr(records),
    mtbfHours: calculateMtbf(records),
    availability: totalMachines > 0 ? Math.round((running / totalMachines) * 100) : 0,
  };
}

/* ============================================================
   6) ตัวช่วยสำหรับกราฟ
   ============================================================ */

/** จำนวน Alarm รายวันย้อนหลัง `days` วัน (รวมวันที่ยังไม่มีข้อมูล = 0) */
export function alarmTrend(alarms: Alarm[], days = 14) {
  const buckets: { key: string; label: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);

    const key = toDateInputValue(day);
    buckets.push({
      key,
      label: new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short' }).format(day),
      count: 0,
    });
  }

  const index = new Map(buckets.map((b, i) => [b.key, i]));

  alarms.forEach((alarm) => {
    if (!alarm.created_at) return;
    const key = toDateInputValue(new Date(alarm.created_at));
    const i = index.get(key);
    if (i !== undefined) buckets[i].count += 1;
  });

  return buckets;
}

/** สัดส่วนประเภทงานซ่อม (สำหรับ Donut Chart) */
export function maintenanceRatio(records: MaintenanceRecord[]) {
  const counts = new Map<string, number>();
  records.forEach((r) => {
    const key = r.maintenance_type || 'Other';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const palette = ['#06b6d4', '#f59e0b', '#f43f5e', '#8b5cf6', '#10b981', '#64748b'];

  return Array.from(counts.entries())
    .map(([name, value], i) => ({ name, value, hex: palette[i % palette.length] }))
    .sort((a, b) => b.value - a.value);
}

/* ============================================================
   7) การแจ้งเตือน (Notification Center)
   ============================================================ */

export type DashboardNotification = {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  time: string | null;
  href: string;
};

/** สร้างรายการแจ้งเตือนจากสถานะปัจจุบันของเครื่องจักร / Alarm / งานซ่อม */
export function buildNotifications(
  machines: Machine[],
  alarms: Alarm[],
  records: MaintenanceRecord[]
): DashboardNotification[] {
  const items: DashboardNotification[] = [];

  machines
    .filter((m) => m.status === 'Alarm')
    .forEach((m) => {
      items.push({
        id: `machine-down-${m.id}`,
        level: 'critical',
        title: `${m.machine_id} หยุดทำงาน (Down)`,
        detail: m.machine_name || 'ไม่ระบุชื่อเครื่องจักร',
        time: null,
        href: `/machines/${m.id}`,
      });
    });

  alarms
    .filter((a) => a.status === 'Open')
    .forEach((a) => {
      items.push({
        id: `alarm-open-${a.id}`,
        level: 'warning',
        title: `Alarm ใหม่: ${a.alarm_code || a.alarm_description || 'ไม่ระบุรหัส'}`,
        detail: a.alarm_description || 'ตรวจพบความผิดปกติในระบบ',
        time: a.created_at ?? null,
        href: '/alarms',
      });
    });

  records
    .filter((r) => r.status === 'Pending')
    .forEach((r) => {
      items.push({
        id: `job-pending-${r.id}`,
        level: 'info',
        title: 'มีใบแจ้งซ่อมรอดำเนินการ',
        detail: r.problem || 'รายละเอียดงานซ่อมบำรุง',
        time: r.created_at ?? null,
        href: '/maintenance',
      });
    });

  return items;
}

/* ============================================================
   8) ตัวช่วยรูปแบบตัวเลข / เวลา
   ============================================================ */

export function formatHours(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return '-';
  if (hours < 1) return `${Math.round(hours * 60)} นาที`;
  return `${hours.toFixed(1)} ชม.`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return '-';
  if (minutes < 60) return `${Math.round(minutes)} นาที`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h} ชม.` : `${h} ชม. ${m} น.`;
}
