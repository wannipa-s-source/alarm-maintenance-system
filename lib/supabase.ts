import { createClient } from '@supabase/supabase-js';

// ใส่ Supabase URL และ Anon Key ที่ถูกต้องจาก Dashboard ของ Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zbdfqkobiluottrvtytk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4e6rcFCsSGm29BfQR7Lx5g_wzJZDgCu';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);