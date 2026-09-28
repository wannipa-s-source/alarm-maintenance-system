import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { RoleProvider } from "@/context/RoleContext";
import RoleSelector from "@/components/RoleSelector";
import { Toaster } from "react-hot-toast";
import NotificationListener from "@/components/NotificationListener";
import { Providers } from "./providers"; // Import ตัวคลุมธีมเข้ามา
import ThemeToggle from "@/components/ThemeToggle"; // 1. Import ปุ่มสลับธีมเข้ามา
import Navbar from "@/components/Navbar"; // 2. Import แถบเมนูนำทาง (แสดงทุกหน้า)
import NotificationBell from "@/components/NotificationBell"; // 3. กระดิ่งแจ้งเตือน
import UserBadge from "@/components/UserBadge"; // 4. โปรไฟล์ผู้ใช้ + บทบาท

export const metadata: Metadata = {
  title: "Smart Factory Maintenance System",
  description: "ระบบจัดการ Alarm และงานซ่อมบำรุงเครื่องจักรในโรงงานอัตโนมัติ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 min-h-screen font-sans transition-colors duration-300">
        <Providers>
          <RoleProvider>
            {/* ระบบแจ้งเตือน Pop-up (Toast Notifications) */}
            <Toaster position="top-right" reverseOrder={false} />

            {/* ตัวดักฟังการเปลี่ยนแปลงข้อมูลแบบ Real-time จาก Supabase */}
            <NotificationListener />

            {/* Header + เมนูนำทาง ด้านบนของระบบ (Sticky ทั้งหมด) */}
            <div className="sticky top-0 z-50">
              <header className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b border-slate-200 dark:border-blue-900/40 px-4 sm:px-6 py-3 flex justify-between items-center gap-3 shadow-md dark:shadow-lg dark:shadow-blue-950/20">
                <Link href="/" className="flex items-center gap-3 group shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm sm:text-base md:text-lg font-extrabold bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-600 dark:from-cyan-400 dark:via-cyan-400 dark:to-indigo-300 bg-clip-text text-transparent">
                      Smart Factory
                    </span>
                    <span className="hidden sm:block text-[10px] md:text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                      Maintenance System
                    </span>
                  </div>
                </Link>

                {/* ด้านขวา: การแจ้งเตือน + สลับธีม + โปรไฟล์ผู้ใช้ + สลับบทบาท */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <NotificationBell />
                  <ThemeToggle />
                  <UserBadge />
                  <RoleSelector />
                </div>
              </header>

              {/* แถบเมนูนำทาง: เชื่อมต่อทุกหน้าของระบบเข้าด้วยกัน */}
              <Navbar />
            </div>

            {/* เนื้อหาหน้าเว็บแต่ละหน้า */}
            <main>{children}</main>
          </RoleProvider>
        </Providers>
      </body>
    </html>
  );
}
