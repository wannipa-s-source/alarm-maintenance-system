'use client';

import Link from 'next/link';
import { History, MapPin, PlusCircle, SlidersHorizontal } from 'lucide-react';
import { getMachineStatusMeta, type Machine } from '@/lib/dashboard';

type Props = {
  machines: Machine[];
  /** จำนวนเครื่องที่แสดงทั้งหมด (เพื่อบอกว่ากำลังกรองอยู่หรือไม่) */
  totalCount: number;
  onQuickRequest: (machine: Machine) => void;
  /** สิทธิ์สร้างใบแจ้งซ่อม (admin / technician) — ผู้ชมจะไม่เห็นปุ่มนี้ */
  canRequest?: boolean;
};

/**
 * ส่วนที่ 3 — Machine Overview / Status Grid
 * การ์ดของเครื่องจักรแต่ละเครื่อง พร้อมสถานะแบบ Real-time และปุ่มลัด
 */
export default function MachineStatusGrid({ machines, totalCount, onQuickRequest, canRequest = false }: Props) {
  return (
    <section aria-label="ภาพรวมสถานะเครื่องจักร" className="space-y-4">
      {/* หัวข้อส่วน */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500" />
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">ภาพรวมสถานะเครื่องจักร</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Machine Overview / Status Grid (Real-time)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            แสดง {machines.length} / {totalCount} เครื่อง
          </span>
          <Link
            href="/machines"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-500/20 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            จัดการเครื่องจักร
          </Link>
        </div>
      </div>

      {/* กริดการ์ดเครื่องจักร */}
      {machines.length === 0 ? (
        <div className="bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-lg p-12 text-center">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">ไม่พบเครื่องจักรที่ตรงกับตัวกรอง</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา สายการผลิต หรือสถานะ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {machines.map((machine) => {
            const meta = getMachineStatusMeta(machine.status);
            const StatusIcon = meta.icon;
            const isDown = machine.status === 'Alarm';

            return (
              <article
                key={machine.id}
                className={`group relative bg-white/80 dark:bg-[#111827]/70 backdrop-blur-md rounded-2xl border shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${meta.ring} ${
                  isDown ? 'bg-rose-500/[0.04]' : ''
                }`}
              >
                {/* แถบสีสถานะด้านบน */}
                <span
                  className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                  style={{ backgroundColor: meta.hex }}
                  aria-hidden
                />

                <div className="p-5 pt-6">
                  {/* Machine ID & Name */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate tracking-tight">
                        {machine.machine_id}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {machine.machine_name || 'ไม่ระบุชื่อเครื่องจักร'}
                      </p>
                    </div>
                    <span
                      className={`w-8 h-8 shrink-0 rounded-xl border flex items-center justify-center ${
                        isDown ? 'animate-pulse' : ''
                      }`}
                      style={{
                        backgroundColor: `${meta.hex}1f`,
                        borderColor: `${meta.hex}55`,
                        color: meta.hex,
                      }}
                    >
                      <StatusIcon className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wide ${meta.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${isDown ? 'animate-ping' : ''}`} />
                      {meta.labelEn}
                    </span>
                    {machine.machine_type && (
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[9rem]">
                        {machine.machine_type}
                      </span>
                    )}
                  </div>

                  {/* ตำแหน่ง / สายการผลิต */}
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{machine.line || machine.location || 'ไม่ระบุตำแหน่ง'}</span>
                  </p>

                  {/* Quick Action Buttons */}
                  <div
                    className={`mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/70 grid gap-2 ${
                      canRequest ? 'grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    <Link
                      href={`/machines/${machine.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-500/10 hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95"
                    >
                      <History className="w-3.5 h-3.5" />
                      ประวัติ
                    </Link>
                    {canRequest && (
                      <button
                        type="button"
                        onClick={() => onQuickRequest(machine)}
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all active:scale-95"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        แจ้งซ่อม
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
