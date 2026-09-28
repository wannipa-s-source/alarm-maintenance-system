import type { Alarm, FilteredRecord, Machine } from '@/lib/dashboard';
import { formatThaiDate, getMachineStatusMeta, getMaintenanceStatusMeta } from '@/lib/dashboard';

/** ครอบค่าที่มีเครื่องหมายคอมมา/เครื่องหมาย quote ไว้ เพื่อไม่ให้ CSV แตก */
function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function download(filename: string, content: string) {
  // ใส่ BOM เพื่อให้ Excel บน Windows อ่านภาษาไทยได้ถูกต้อง
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function timestamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(
    now.getMinutes()
  )}`;
}

/** สร้างรายงานสรุปสถานะเครื่องจักรเป็นไฟล์ CSV */
export function exportMachineReport(machines: Machine[]) {
  const header = [
    'Machine ID',
    'Machine Name',
    'Type',
    'Line / Location',
    'Status',
    'Created At',
  ];

  const rows = machines.map((m) => [
    m.machine_id,
    m.machine_name,
    m.machine_type ?? '',
    m.line || m.location || '',
    getMachineStatusMeta(m.status).labelEn,
    formatThaiDate(m.created_at),
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  download(`machine_status_${timestamp()}.csv`, csv);
}

/** สร้างรายงานประวัติ Alarm เป็นไฟล์ CSV */
export function exportAlarmReport(alarms: Alarm[]) {
  const header = ['Date', 'Machine ID', 'Alarm Code', 'Description', 'Cause', 'Status'];

  const rows = alarms.map((a) => [
    formatThaiDate(a.created_at),
    a.machine_id,
    a.alarm_code ?? '',
    a.alarm_description ?? '',
    a.cause ?? '',
    a.status,
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  download(`alarm_log_${timestamp()}.csv`, csv);
}

/** สร้างรายงานงานซ่อมบำรุงเป็นไฟล์ CSV */
export function exportMaintenanceReport(records: FilteredRecord[]) {
  const header = [
    'Date',
    'Machine ID',
    'Machine Name',
    'Type',
    'Problem',
    'Action Taken',
    'Technician',
    'Duration (min)',
    'Status',
  ];

  const rows = records.map((r) => [
    formatThaiDate(r.created_at),
    r.machine_code,
    r.machine_name,
    r.maintenance_type,
    r.problem ?? '',
    r.action_taken ?? '',
    r.technician ?? '',
    r.duration_minutes ?? '',
    getMaintenanceStatusMeta(r.status).labelEn,
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  download(`maintenance_log_${timestamp()}.csv`, csv);
}
