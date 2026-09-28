import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/context/RoleContext";
import { Toaster } from "react-hot-toast";
import NotificationListener from "@/components/NotificationListener";
import { Providers } from "./providers";
import AppHeader from "@/components/AppHeader"; // Header + เมนู (ซ่อนอัตโนมัติบนหน้า Login)

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

            {/* Header + เมนูนำทาง ด้านบนของระบบ (แสดงเฉพาะหน้าที่ใช้งานทั่วไป) */}
            <AppHeader />

            {/* เนื้อหาหน้าเว็บแต่ละหน้า */}
            <main>{children}</main>
          </RoleProvider>
        </Providers>
      </body>
    </html>
  );
}
