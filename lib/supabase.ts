import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabaseConfig';

/**
 * Supabase client ฝั่ง Browser
 * - ใช้ cookie เก็บ session (ไม่ใช่ localStorage) เพื่อให้ proxy.ts บน server อ่านสถานะการล็อกอินได้
 */
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
