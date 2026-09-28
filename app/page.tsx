import ModuleGrid from '@/components/ModuleGrid';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 p-6 md:p-10 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md p-8 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg dark:shadow-xl dark:shadow-blue-950/20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
            Industrial Monitoring Center
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-700 to-cyan-600 dark:from-white dark:via-slate-200 dark:to-cyan-400 bg-clip-text text-transparent">
            Alarm &amp; Maintenance System
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-3 max-w-2xl mx-auto">
            ระบบจัดการสัญญาณเตือนและงานซ่อมบำรุงเครื่องจักรอุตสาหกรรม
            เลือกโมดูลด้านล่างเพื่อเข้าสู่หน้าที่ต้องการ
          </p>
        </div>

        {/* ปุ่มเชื่อมต่อไปยังทุกหน้าของระบบ (กรองตามสิทธิ์ของผู้ใช้) */}
        <ModuleGrid />
      </div>
    </div>
  );
}
