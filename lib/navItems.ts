import { BellRing, Factory, House, LayoutDashboard, Users, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/context/AuthContext';

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** สีเน้น (แบ่งตามโมดูลของระบบ) */
  accent: string;
  /** ถ้าไม่ระบุ = ทุก Role เข้าถึงได้ */
  roles?: UserRole[];
};

export const navItems: NavItem[] = [
  {
    href: '/',
    label: 'หน้าแรก',
    description: 'ภาพรวมและเมนูเข้าสู่ทุกโมดูลของระบบ',
    icon: House,
    accent: 'text-slate-600 dark:text-slate-300',
  },
  {
    href: '/dashboard',
    label: 'แดชบอร์ด',
    description: 'สถิติสถานะเครื่องจักรและกราฟวิเคราะห์แบบเรียลไทม์',
    icon: LayoutDashboard,
    accent: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    href: '/machines',
    label: 'เครื่องจักร',
    description: 'ทะเบียนเครื่องจักร เพิ่ม แก้ไข และส่งออกข้อมูล CSV',
    icon: Factory,
    accent: 'text-blue-600 dark:text-blue-400',
  },
  {
    href: '/alarms',
    label: 'Alarm',
    description: 'บันทึกและติดตามประวัติเหตุการณ์ขัดข้องของเครื่องจักร',
    icon: BellRing,
    accent: 'text-rose-600 dark:text-rose-400',
  },
  {
    href: '/maintenance',
    label: 'ซ่อมบำรุง',
    description: 'บันทึกงานซ่อมบำรุง ปัญหา และผลการดำเนินงาน',
    icon: Wrench,
    accent: 'text-purple-600 dark:text-purple-400',
  },
  {
    href: '/users',
    label: 'ผู้ใช้งาน',
    description: 'จัดการสิทธิ์ (Role) ของผู้ใช้แต่ละคน',
    icon: Users,
    accent: 'text-indigo-600 dark:text-indigo-400',
    roles: ['admin'],
  },
];

/** เช็คว่าเมนูใดตรงกับหน้าที่กำลังเปิดอยู่ (รองรับ Dynamic Route เช่น /machines/[id]) */
export function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** กรองเมนูตามสิทธิ์ของผู้ใช้ที่ล็อกอินอยู่ */
export function navItemsForRole(role: UserRole | null) {
  if (!role) return navItems.filter((item) => !item.roles);
  return navItems.filter((item) => !item.roles || item.roles.includes(role));
}
