/**
 * นิยามบทบาทและสิทธิ์ของระบบ (ใช้ร่วมกันทั้งฝั่ง client และ proxy.ts)
 *
 * - admin      : CRUD ได้ทุกหน้า (Machine, Alarm, Maintenance, Dashboard) + จัดการสิทธิ์ผู้ใช้
 * - technician : ดูเครื่องจักร/Dashboard, บันทึก-แก้ไข-เปลี่ยนสถานะงานซ่อมบำรุง,
 *                และเปลี่ยนสถานะ Alarm ได้ — ลบข้อมูลไม่ได้ และจัดการสิทธิ์ผู้ใช้ไม่ได้
 * - viewer     : อ่านอย่างเดียว
 *
 * ไฟล์นี้ต้องไม่ import อะไรจาก react / lucide เพื่อให้ proxy.ts ใช้ได้ใน Edge runtime
 */

export type UserRole = 'admin' | 'technician' | 'viewer';

export const USER_ROLES: readonly UserRole[] = ['admin', 'technician', 'viewer'];

/**
 * สิทธิ์แยกตามทรัพยากรและแยกตามชนิด เพราะ "ช่างซ่อมบำรุง" ทำได้ไม่เหมือนกันทุกตาราง
 * เช่น เปลี่ยนสถานะ Alarm ได้ แต่สร้าง Alarm ใหม่หรือลบไม่ได้
 */
export type Permission =
  /** ดูข้อมูลทุกโมดูล */
  | 'view'
  /** เพิ่ม/แก้ไข/เปลี่ยนสถานะเครื่องจักร (admin) */
  | 'editMachines'
  /** ลบเครื่องจักร (admin) */
  | 'deleteMachines'
  /** สร้าง Alarm ใหม่ (admin) */
  | 'createAlarms'
  /** เปลี่ยนสถานะ Alarm (admin + technician) */
  | 'updateAlarmStatus'
  /** ลบ Alarm (admin) */
  | 'deleteAlarms'
  /** บันทึก/แก้ไข/เปลี่ยนสถานะงานซ่อมบำรุง (admin + technician) */
  | 'editMaintenance'
  /** ลบงานซ่อมบำรุง (admin) */
  | 'deleteMaintenance'
  /** จัดการบทบาทของผู้ใช้ในระบบ (admin) */
  | 'manageUsers';

const MATRIX: Record<UserRole, readonly Permission[]> = {
  admin: [
    'view',
    'editMachines',
    'deleteMachines',
    'createAlarms',
    'updateAlarmStatus',
    'deleteAlarms',
    'editMaintenance',
    'deleteMaintenance',
    'manageUsers',
  ],
  technician: ['view', 'updateAlarmStatus', 'editMaintenance'],
  viewer: ['view'],
};

/** ตรวจสอบว่าบทบาทนี้มีสิทธิ์ตามที่ระบุหรือไม่ */
export function can(role: UserRole, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

/** แปลงค่าที่อ่านมาจากฐานข้อมูลให้เป็น UserRole เสมอ (กันค่าแปลกปลอม/ค่าว่าง) */
export function normalizeRole(value: unknown): UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)
    ? (value as UserRole)
    : 'viewer';
}

export type RoleMeta = {
  /** ชื่อบทบาทที่แสดงผล (ภาษาไทย) */
  label: string;
  /** คำอธิบายสิทธิ์สั้น ๆ */
  description: string;
  /** สีของป้ายบทบาท */
  badge: string;
  /** สีจุดกลมบนป้าย */
  dot: string;
};

export const ROLE_META: Record<UserRole, RoleMeta> = {
  admin: {
    label: 'ผู้ดูแลระบบ',
    description: 'แก้ไขและลบข้อมูลได้ทั้งหมด รวมถึงจัดการสิทธิ์ผู้ใช้',
    badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  technician: {
    label: 'ช่างซ่อมบำรุง',
    description: 'ดูเครื่องจักรและ Dashboard, บันทึก/แก้ไข/เปลี่ยนสถานะงานซ่อมบำรุง และเปลี่ยนสถานะ Alarm ได้ (ลบข้อมูลไม่ได้)',
    badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  viewer: {
    label: 'ผู้ชม',
    description: 'อ่านข้อมูลอย่างเดียว แก้ไขหรือลบข้อมูลไม่ได้',
    badge: 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-500',
  },
};

/** true เมื่อบทบาทนี้อ่านอย่างเดียว (ใช้แสดงแถบแจ้งเตือนและ disable form control) */
export function isReadOnly(role: UserRole): boolean {
  return !can(role, 'editMaintenance') && !can(role, 'updateAlarmStatus');
}

/* ------------------------------------------------------------
   สิทธิ์ระดับหน้า (route) — ใช้ร่วมกันระหว่าง Navbar (ซ่อนเมนู) กับ proxy.ts (บล็อกการเข้าถึง)
   ------------------------------------------------------------ */
const ROUTE_ROLES: Record<string, readonly UserRole[]> = {
  '/settings': ['admin'],
};

/** หน้านี้ใช้ได้เฉพาะบทบาทในรายการที่กำหนด (ถ้าไม่ระบุ = ทุกบทบาทที่ล็อกอินได้เข้าได้) */
export function canAccessRoute(pathname: string, role: UserRole): boolean {
  const entry = Object.entries(ROUTE_ROLES).find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!entry) return true;
  return entry[1].includes(role);
}
