'use client';

import { useState } from 'react';
import { LoaderCircle, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { maintenanceTypeOptions, type Machine } from '@/lib/dashboard';
import { useRole } from '@/context/RoleContext';

type Props = {
  open: boolean;
  onClose: () => void;
  machines: Machine[];
  /** เครื่องจักรที่ถูกเลือกมาก่อนหน้า (ถ้ามี) */
  initialMachineId?: string;
  onCreated: () => void;
};

const emptyForm = {
  machine_id: '',
  maintenance_type: 'Corrective',
  problem: '',
  action_taken: '',
};

/**
 * Modal สำหรับ "แจ้งซ่อมด่วน" (Quick Maintenance Request)
 * ใช้ได้ทั้งจากปุ่มแจ้งซ่อมบนการ์ดเครื่องจักร และจากปุ่มลัดด้านล่าง
 */
export default function MaintenanceRequestModal({
  open,
  onClose,
  machines,
  initialMachineId,
  onCreated,
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { canEdit } = useRole();

  // ผู้ชมไม่มีสิทธิ์สร้างใบแจ้งซ่อม (ปุ่มถูกซ่อนไปแล้วที่หน้าที่เรียกใช้)
  if (!open || !canEdit) return null;

  const field =
    'w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition-colors';

  const selectedMachineId = form.machine_id || initialMachineId || '';

  const close = () => {
    setForm(emptyForm);
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!canEdit) {
      setErrorMsg('คุณไม่มีสิทธิ์ในการเพิ่มข้อมูล');
      return;
    }

    if (!selectedMachineId) {
      setErrorMsg('กรุณาเลือกเครื่องจักรที่ต้องการแจ้งซ่อม');
      return;
    }
    if (!form.problem.trim()) {
      setErrorMsg('กรุณาระบุอาการปัญหา (Problem)');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('maintenance_records').insert([
      {
        machine_id: selectedMachineId,
        maintenance_type: form.maintenance_type,
        problem: form.problem.trim(),
        action_taken: form.action_taken.trim(),
        status: 'Pending',
      },
    ]);
    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      toast.error('บันทึกใบแจ้งซ่อมไม่สำเร็จ: ' + error.message);
      return;
    }

    const machine = machines.find((m) => m.id === selectedMachineId);
    toast.success(`สร้างใบแจ้งซ่อม${machine ? ` สำหรับ ${machine.machine_id}` : ''} เรียบร้อยแล้ว`);
    setForm(emptyForm);
    onCreated();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="สร้างใบแจ้งซ่อมใหม่"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={close}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-blue-900/50 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* หัวข้อ Modal */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">แจ้งซ่อมด่วน</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">New Maintenance Log</p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="ปิด"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ฟอร์ม */}
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="qr-machine" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              เครื่องจักร <span className="text-rose-500">*</span>
            </label>
            <select
              id="qr-machine"
              value={selectedMachineId}
              onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
              className={field}
            >
              <option value="">— เลือกเครื่องจักร —</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.machine_id} · {m.machine_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="qr-type" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              ประเภทงาน
            </label>
            <select
              id="qr-type"
              value={form.maintenance_type}
              onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
              className={field}
            >
              {maintenanceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="qr-problem" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              อาการปัญหา (Problem) <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="qr-problem"
              rows={3}
              value={form.problem}
              onChange={(e) => setForm({ ...form, problem: e.target.value })}
              placeholder="เช่น เสียงผิดปกติระหว่างหมุนแกนหลัก, แกนไม่หมุน..."
              className={`${field} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="qr-action" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              หมายเหตุ / การดำเนินการ (ไม่บังคับ)
            </label>
            <textarea
              id="qr-action"
              rows={2}
              value={form.action_taken}
              onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
              placeholder="เช่น ส่งช่างเข้าตรวจสอบแล้ว..."
              className={`${field} resize-none`}
            />
          </div>

          {errorMsg && (
            <p className="px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {errorMsg}
            </p>
          )}
        </div>

        {/* ปุ่มดำเนินการ */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            {submitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'กำลังส่ง...' : 'ส่งใบแจ้งซ่อม'}
          </button>
        </div>
      </form>
    </div>
  );
}
