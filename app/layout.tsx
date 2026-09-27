import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/context/RoleContext";
import RoleSelector from "@/components/RoleSelector";
import { Toaster } from "react-hot-toast";
import NotificationListener from "@/components/NotificationListener";

export const metadata: Metadata = {
  title: "Alarm & Maintenance System",
  description: "ระบบจัดการ Alarm และงานซ่อมบำรุง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased bg-[#0a0f1d] text-slate-100 min-h-screen font-sans">
        <RoleProvider>
          {/* ระบบแจ้งเตือน Pop-up (Toast Notifications) */}
          <Toaster position="top-right" reverseOrder={false} />
          
          {/* ตัวดักฟังการเปลี่ยนแปลงข้อมูลแบบ Real-time จาก Supabase */}
          <NotificationListener />

          {/* Header Bar ด้านบนของระบบ */}
          <header className="sticky top-0 z-50 bg-[#111827]/80 backdrop-blur-md border-b border-blue-900/40 px-6 py-3 flex justify-between items-center shadow-lg shadow-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-cyan-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                Alarm & Maintenance System
              </span>
            </div>

            {/* ส่วนสลับบทบาทผู้ใช้งาน (Role Switcher) */}
            <RoleSelector />
          </header>

          {/* เนื้อหาหน้าเว็บแต่ละหน้า */}
          <main>{children}</main>
        </RoleProvider>
      </body>
    </html>
  );
}