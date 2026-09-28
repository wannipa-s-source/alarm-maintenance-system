import { createBrowserClient } from '@supabase/ssr';

// ใส่ Supabase URL และ Anon Key ที่ถูกต้องจาก Dashboard ของ Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zbdfqkobiluottrvtytk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4e6rcFCsSGm29BfQR7Lx5g_wzJZDgCu';

// ใช้ createBrowserClient เพื่อเก็บ session ใน cookie ให้ proxy.ts (ฝั่ง server) อ่านได้
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
