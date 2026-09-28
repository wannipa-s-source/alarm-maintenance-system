// ค่าเชื่อมต่อ Supabase ใช้ร่วมกันทั้งฝั่ง Client (browser) และฝั่ง Server (proxy)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zbdfqkobiluottrvtytk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4e6rcFCsSGm29BfQR7Lx5g_wzJZDgCu';

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
