'use client';

import { useRole } from '@/context/RoleContext';

export default function MachinesPage() {
  // ดึงค่าสิทธิ์การใช้งานมาจาก RoleContext
  const { role, canEdit, canDelete } = useRole();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* ส่วนหัวของหน้า */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการข้อมูลเครื่องจักร (Machine Master)</h1>
          <p className="text-sm text-slate-500 mt-1">
            สถานะสิทธิ์ปัจจุบันของคุณ: <span className="font-semibold text-indigo-600">{role}</span>
          </p>
        </div>

        {/* ตรวจสอบสิทธิ์: ถ้าเป็น Viewer จะไม่เห็นปุ่มเพิ่มข้อมูล */}
        {canEdit ? (
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
            + เพิ่มเครื่องจักรใหม่
          </button>
        ) : (
          <div className="bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <span>🔒</span>
            <span>คุณอยู่ในโหมด <b>Viewer</b> (ดูได้อย่างเดียว ไม่สามารถเพิ่ม/แก้ไขข้อมูลได้)</span>
          </div>
        )}
      </div>

      {/* ตารางแสดงรายการเครื่องจักร */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <th className="p-4">รหัสเครื่อง</th>
              <th className="p-4">ชื่อเครื่องจักร</th>
              <th className="p-4">โซน / สถานะ</th>
              <th className="p-4 text-right">การจัดการ (Actions)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            <tr className="hover:bg-slate-50/50">
              <td className="p-4 font-mono text-indigo-600 font-medium">MC-001</td>
              <td className="p-4 font-medium text-slate-900">CNC Milling Machine A</td>
              <td className="p-4">
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">
                  กำลังทำงาน
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                {/* ปุ่มดูรายละเอียด - ทุก Role กดได้ */}
                <button className="text-slate-600 hover:text-indigo-600 text-xs font-medium px-2 py-1 rounded border border-slate-200 hover:border-indigo-300 transition">
                  ดูรายละเอียด
                </button>

                {/* ปุ่มแก้ไข - เฉพาะ Admin และ Operator */}
                {canEdit && (
                  <button className="text-amber-600 hover:text-amber-700 text-xs font-medium px-2 py-1 rounded border border-amber-200 hover:bg-amber-50 transition">
                    แก้ไข
                  </button>
                )}

                {/* ปุ่มลบ - เฉพาะ Admin เท่านั้น */}
                {canDelete && (
                  <button className="text-rose-600 hover:text-rose-700 text-xs font-medium px-2 py-1 rounded border border-rose-200 hover:bg-rose-50 transition">
                    ลบ
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}