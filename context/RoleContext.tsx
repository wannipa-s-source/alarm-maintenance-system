'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { can, normalizeRole, type Permission, type UserRole } from '@/lib/permissions';

export type { Permission, UserRole } from '@/lib/permissions';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
};

interface RoleContextType {
  role: UserRole;
  profile: Profile | null;
  user: SupabaseUser | null;
  /** true ระหว่างที่ยังไม่รู้บทบาท — UI ควรซ่อนปุ่มแก้ไขระหว่างนี้ */
  loading: boolean;
  /** ตรวจสอบสิทธิ์แบบทั่วไป เช่น can('editMachines') */
  can: (permission: Permission) => boolean;
  /** โหลดบทบาทใหม่จากฐานข้อมูล (ใช้หลัง logout หรือหลังบทบาทถูกเปลี่ยน) */
  refresh: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

/** ผู้ใช้ที่ยังไม่ล็อกอิน/ยังโหลดไม่เสร็จ จะถือว่าเป็นผู้ชมอย่างเดียว (ปลอดภัยที่สุด) */
const EMPTY_PROFILE: Profile = { id: '', email: null, full_name: null, role: 'viewer' };

/**
 * ที่มาของบทบาทคือตาราง `profiles` ใน Supabase (ผูกกับ auth.users ด้วย trigger)
 * ไม่มีการให้ผู้ใช้เลือกบทบาทเองได้ — ป้องกันการเลื่อนสิทธิ์เอง
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(currentUser);

    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', currentUser.id)
      .maybeSingle();

    const fullName =
      (typeof data?.full_name === 'string' && data.full_name.trim()) ||
      (typeof currentUser.user_metadata?.full_name === 'string' && currentUser.user_metadata.full_name.trim()) ||
      '';

    setProfile({
      id: currentUser.id,
      email: data?.email ?? currentUser.email ?? null,
      full_name: fullName || null,
      role: normalizeRole(data?.role),
    });
    setLoading(false);
  }, []);

  // โหลดบทบาทครั้งแรก และโหลดใหม่เมื่อมีการล็อกอิน/ออกจากระบบ
  useEffect(() => {
    void (async () => {
      await loadRole();
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void loadRole();
    });

    return () => subscription.subscription.unsubscribe();
  }, [loadRole]);

  // ฟังการเปลี่ยนแปลงบทบาทสด ๆ (เช่น admin เปลี่ยนบทบาทของเราเอง) — ต้องเปิด realtime บน profiles
  useEffect(() => {
    const channel = supabase
      .channel('profile_role_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => {
          void loadRole();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadRole]);

  const value = useMemo<RoleContextType>(() => {
    const role = profile?.role ?? EMPTY_PROFILE.role;
    const check = (permission: Permission) => !loading && can(role, permission);

    return {
      role,
      profile,
      user,
      loading,
      can: check,
      refresh: loadRole,
    };
  }, [profile, user, loading, loadRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
