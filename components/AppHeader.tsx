'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import UserBadge from '@/components/UserBadge';
import LogoutButton from '@/components/LogoutButton';
import RoleNotice from '@/components/RoleNotice';
import { BAR, BRANDMARK } from '@/lib/designSystem';

/** หน้าที่ไม่ต้องแสดงแถบเมนูด้านบน (หน้า Login) */
const BARE_ROUTES = ['/login'];

function isBareRoute(pathname: string): boolean {
  return BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * แถบด้านบนของระบบ (โลโก้ + การแจ้งเตือน + สลับธีม + โปรไฟล์ผู้ใช้) และแถบเมนูนำทาง
 * จะไม่แสดงบนหน้า Login เพื่อให้หน้าเหล่านั้นแสดงเฉพาะฟอร์มเข้าสู่ระบบ
 */
export default function AppHeader() {
  const pathname = usePathname();

  if (isBareRoute(pathname)) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50">
      <header className={`w-full ${BAR.surface} ${BAR.line} ${BAR.shadow} px-4 sm:px-6 py-3 flex justify-between items-center gap-3`}>
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className={`${BRANDMARK.box} group-hover:scale-110 transition-transform`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className={BRANDMARK.title}>
              Smart Factory
            </span>
            <span className={BRANDMARK.subtitle}>
              Maintenance System
            </span>
          </div>
        </Link>

        {/* ด้านขวา: การแจ้งเตือน + สลับธีม + โปรไฟล์ผู้ใช้ (แสดงบทบาทจริงจากฐานข้อมูล) + ออกจากระบบ */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <ThemeToggle />
          <UserBadge />
          <LogoutButton iconOnly />
        </div>
      </header>

      {/* แถบแจ้งสิทธิ์: แสดงข้อความตามบทบาทจริง (Admin / Technician / Viewer) */}
      <RoleNotice />

      {/* แถบเมนูนำทาง: เชื่อมต่อทุกหน้าของระบบเข้าด้วยกัน */}
      <Navbar />
    </div>
  );
}
