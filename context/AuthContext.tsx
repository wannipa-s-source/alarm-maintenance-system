'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'technician';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  /** กำลังตรวจสอบสถานะการล็อกอินอยู่หรือไม่ */
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  /** จัดการข้อมูลหลักของระบบ (เพิ่ม/แก้ไข/ลบเครื่องจักร, สร้าง/ลบ Alarm) */
  canManageMachines: boolean;
  /** บันทึกและแก้ไขงาน Maintenance */
  canEditMaintenance: boolean;
  /** เปลี่ยนสถานะของ Alarm */
  canChangeAlarmStatus: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      return;
    }

    // ยังไม่มีโปรไฟล์ (เช่น ผู้ใช้ที่สมัครก่อนรัน migration) -> ถือว่าเป็น technician
    // หมายเหตุ: client ถูก RLS บล็อกไม่ให้ insert ตาราง profiles อยู่แล้ว
    // การ backfill ต้องทำที่ฝั่ง DB (ดูส่วน 3.1 ของไฟล์ migration)
    const { data: userData } = await supabase.auth.getUser();
    setProfile({
      id: userId,
      email: userData.user?.email ?? '',
      full_name: null,
      role: 'technician',
      created_at: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    let active = true;

    // ดึง session ปัจจุบันตอนเปิดหน้า
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadProfile(data.session.user.id);
      if (active) setLoading(false);
    });

    // ฟังการเปลี่ยนแปลงของ session (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user && event !== 'TOKEN_REFRESHED') {
        // ต้องไม่ await ภายใน callback ของ onAuthStateChange (อาจทำให้ deadlock)
        setTimeout(() => {
          loadProfile(nextSession.user!.id).finally(() => setLoading(false));
        }, 0);
      } else if (!nextSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const role = profile?.role ?? null;
  const isAdmin = role === 'admin';

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      loading,
      role,
      isAdmin,
      canManageMachines: isAdmin,
      canEditMaintenance: role === 'admin' || role === 'technician',
      canChangeAlarmStatus: role === 'admin' || role === 'technician',
      signOut,
      refreshProfile,
    }),
    [user, session, profile, loading, role, isAdmin, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
