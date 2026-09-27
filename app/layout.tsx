import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/context/RoleContext";
import RoleSelector from "@/components/RoleSelector";

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
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <RoleProvider>
          {/* Header Bar ด้านบนระบบ */}
          <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Alarm & Maintenance System
              </span>
            </div>

            {/* ปุ่มสำหรับสลับ Role เพื่อทดสอบส่งงาน */}
            <RoleSelector />
          </header>

          {/* เนื้อหาหลักของแต่ละหน้า */}
          <main>{children}</main>
        </RoleProvider>
      </body>
    </html>
  );
}