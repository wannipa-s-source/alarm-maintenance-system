'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function NotificationListener() {
  useEffect(() => {
    // ดักฟังเหตุการณ์เมื่อมีการเพิ่ม Alarm ใหม่ในตาราง 'alarms'
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alarms' },
        (payload) => {
          const newAlarm = payload.new;

          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-[#111827] border border-rose-500/50 shadow-2xl rounded-2xl pointer-events-auto flex p-4 gap-3 text-slate-100`}
            >
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl h-fit">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  ⚠️ แจ้งเตือน ALARM ใหม่!
                </p>
                <p className="text-sm font-semibold text-slate-100 mt-0.5">
                  เครื่องจักร: <span className="text-cyan-400">{newAlarm.machine_id || 'N/A'}</span>
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  รายละเอียด: {newAlarm.alarm_name || newAlarm.message || 'ตรวจพบความผิดปกติในระบบ'}
                </p>
              </div>
            </div>
          ), { duration: 5000 });
        }
      )
      // ดักฟังการเปลี่ยนสถานะเครื่องจักรในตาราง 'machines'
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'machines' },
        (payload) => {
          const updatedMachine = payload.new;

          if (updatedMachine.status === 'Alarm') {
            toast.error(`🚨 เครื่องจักร ${updatedMachine.machine_id} เปลี่ยนสถานะเป็น ALARM!`, {
              style: {
                background: '#111827',
                color: '#f87171',
                border: '1px solid rgba(248, 113, 113, 0.3)',
              },
            });
          } else if (updatedMachine.status === 'Running') {
            toast.success(`✅ เครื่องจักร ${updatedMachine.machine_id} กลับมาทำงานปกติแล้ว (Running)`, {
              style: {
                background: '#111827',
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.3)',
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}