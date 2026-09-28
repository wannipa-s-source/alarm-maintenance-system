/**
 * นิยามบทบาทและสิทธิ์ของระบบ (ใช้ร่วมกันทั้งฝั่ง client และ proxy.ts)
 *
 * - admin      : จัดการได้ทุกอย่าง รวมถึงทะเบียนเครื่องจักร การลบ Alarm และการจัดการสิทธิ์ผู้ใช้
 * - technician : ดู/เพิ่ม/แก้ไข/ลบงานซ่อมบำรุง และจัดการเครื่องจักรกับ Alarm ได้
 *                แต่ลบทะเบียนเครื่องจักร/Alarm และจัดการสิทธิ์ผู้ใช้ไม่ได้
 * - viewer     : ดูอย่างเดียว
 *
 * ไฟล์นี้ต้องไม่ import อะไรจาก react / lucide เพื่อให้ proxy.ts ใช้ได้ใน Edge runtime
 */

export type UserRole = 'admin' | 'technician' | 'viewer';

export const USER_ROLES: readonly UserRole[] = ['admin', 'technician', 'viewer'];

/**
 * สิทธิ์แยกตามทรัพยากร เพราะสิทธิ์ "ลบ" ของแต่ละตารางไม่เหมือนกัน
 * (ช่างซ่อมบำรุงลบงานซ่อมได้ แต่ลบทะเบียนเครื่องจักรไม่ได้)
 */
export type Permission =
  /** ดูข้อมูลทุกโมดูล */
  | 'view'
  /** เพิ่ม/แก้ไข/เปลี่ยนสถานะเครื่องจักร */
  | 'editMachines'
  /** ลบทะเบียนเครื่องจักร */
  | 'deleteMachines'
  /** บันทึก Alarm ใหม่ / เปลี่ยนสถานะ Alarm */
  | 'editAlarms'
  /** ลบประวัติ Alarm */
  | 'deleteAlarms'
  /** บันทึก/แก้ไข/เปลี่ยนสถานะงานซ่อมบำรุง */
  | 'editMaintenance'
  /** ลบงานซ่อมบำรุง */
  | 'deleteMaintenance'
  /** จัดการบทบาทของผู้ใช้ในระบบ */
  | 'manageUsers';

const MATRIX: Record<UserRole, readonly Permission[]> = {
  admin: [
    'view',
    'editMachines',
    'deleteMachines',
    'editAlarms',
    'deleteAlarms',
    'editMaintenance',
    'deleteMaintenance',
    'manageUsers',
  ],
  technician: ['view', 'editMachines', 'editAlarms', 'editMaintenance', 'deleteMaintenance'],
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
    description: 'ดูข้อมูลเครื่องจักร เพิ่มและแก้ไขเครื่องจักร/Alarm/งานซ่อมบำรุง รวมถึงลบงานซ่อมบำรุงได้ (จัดการสิทธิ์ผู้ใช้และลบทะเบียนหลักไม่ได้)',
    badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  viewer: {
    label: 'ผู้ชม',
    description: 'เข้าชมและดูข้อมูลอย่างเดียว แก้ไขข้อมูลไม่ได้',
    badge: 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-500',
  },
};

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
