-- =============================================================================
-- เพิ่มระบบบทบาทผู้ใช้: admin / technician / viewer
--
-- วิธีใช้: เปิด Supabase Dashboard > SQL Editor > วางไฟล์นี้ทั้งไฟล์ > Run
-- รันซ้ำได้ (idempotent) ไม่ทำให้ข้อมูลเดิมหาย
-- =============================================================================

-- 1) ประเภทบทบาท ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'technician', 'viewer');
  end if;
end$$;

-- 2) ตารางโปรไฟล์ผู้ใช้ ------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       public.user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'โปรไฟล์ผู้ใช้งานระบบ ใช้เก็บบทบาท (admin/technician/viewer) แบบผูกกับ auth.users';

-- 3) ดัชนีช่วยให้หน้า "จัดการผู้ใช้" เรียง/ค้นหาได้เร็ว
create index if not exists profiles_role_idx on public.profiles (role);
create unique index if not exists profiles_email_idx on public.profiles (lower(email))
  where email is not null;

-- 4) อัปเดต updated_at อัตโนมัติ --------------------------------------------
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- 5) สร้างโปรไฟล์อัตโนมัติเมื่อมีผู้ใช้สมัครใหม่ ---------------------------------
--    หมายเหตุ: บทบาทเริ่มต้นเป็น 'viewer' เสมอ เพื่อไม่ให้ผู้ใช้เลือกบทบาทเองตอนสมัคร
--    (ค่า role ที่ส่งมาตอนสมัครจะถูกเมินไป ไม่นำมาใช้)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) ดึงบทบาทของผู้ใช้ที่กำลังเข้าสู่ระบบ ---------------------------------------
--    SECURITY DEFINER เพื่ออ่านตาราง profiles ได้โดยไม่วนซ้ำกับ RLS ของตารางตัวเอง
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'viewer'::public.user_role
  );
$$;

-- 7) เปิด Row Level Security --------------------------------------------------
alter table public.profiles enable row level security;
alter table public.machines enable row level security;
alter table public.alarms enable row level security;
alter table public.maintenance_records enable row level security;

-- 8) สิทธิ์ระดับคอลัมน์/ตารางของบทบาท ----------------------------------------
revoke all on table public.profiles from anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.machines to authenticated;
grant select, insert, update, delete on table public.alarms to authenticated;
grant select, insert, update, delete on table public.maintenance_records to authenticated;

-- 9) นิยามตัวช่วยตรวจสอบสิทธิ์ -------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'admin'::public.user_role;
$$;

create or replace function public.can_write()
returns boolean
language sql
stable
as $$
  select public.current_user_role() in ('admin'::public.user_role, 'technician'::public.user_role);
$$;

-- 10) Policies: profiles ------------------------------------------------------
--     ผู้ใช้อ่านโปรไฟล์ตัวเองได้, admin อ่าน/แก้ไขได้ทั้งหมด
--     ผู้ใช้แก้ไขโปรไฟล์ตัวเองได้เฉพาะชื่อ (ห้ามเลื่อนบทบาทตัวเอง)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and role = public.current_user_role())
  );

-- 11) Policies: machines ------------------------------------------------------
--     ดูได้ทุกบทบาท / เพิ่ม-แก้ไขได้ admin+technician / ลบได้ admin เท่านั้น
drop policy if exists machines_select on public.machines;
create policy machines_select on public.machines
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists machines_insert on public.machines;
create policy machines_insert on public.machines
  for insert to authenticated
  with check (public.can_write());

drop policy if exists machines_update on public.machines;
create policy machines_update on public.machines
  for update to authenticated
  using (public.can_write())
  with check (public.can_write());

drop policy if exists machines_delete on public.machines;
create policy machines_delete on public.machines
  for delete to authenticated
  using (public.is_admin());

-- 12) Policies: alarms --------------------------------------------------------
drop policy if exists alarms_select on public.alarms;
create policy alarms_select on public.alarms
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists alarms_insert on public.alarms;
create policy alarms_insert on public.alarms
  for insert to authenticated
  with check (public.can_write());

drop policy if exists alarms_update on public.alarms;
create policy alarms_update on public.alarms
  for update to authenticated
  using (public.can_write())
  with check (public.can_write());

drop policy if exists alarms_delete on public.alarms;
create policy alarms_delete on public.alarms
  for delete to authenticated
  using (public.is_admin());

-- 13) Policies: maintenance_records ------------------------------------------
drop policy if exists maintenance_records_select on public.maintenance_records;
create policy maintenance_records_select on public.maintenance_records
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists maintenance_records_insert on public.maintenance_records;
create policy maintenance_records_insert on public.maintenance_records
  for insert to authenticated
  with check (public.can_write());

drop policy if exists maintenance_records_update on public.maintenance_records;
create policy maintenance_records_update on public.maintenance_records
  for update to authenticated
  using (public.can_write())
  with check (public.can_write());

drop policy if exists maintenance_records_delete on public.maintenance_records;
create policy maintenance_records_delete on public.maintenance_records
  for delete to authenticated
  using (public.is_admin());

-- 14) Realtime: ตารางที่หน้าเว็บฟังการเปลี่ยนแปลง -------------------------
--     machines/alarms -> NotificationListener, profiles -> อัปเดตบทบาทสด ๆ
do $$
declare
  target text;
begin
  foreach target in array array['machines', 'alarms', 'profiles'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end$$;

-- 15) นำเข้าโปรไฟล์ของผู้ใช้ที่มีอยู่แล้วก่อนติดตั้ง trigger ---------------------
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  'viewer'::public.user_role
from auth.users u
on conflict (id) do nothing;

-- =============================================================================
-- 16) ขั้นตอนสุดท้าย (ทำเอง 1 ครั้ง): เลื่อนผู้ใช้คนแรกเป็น admin
--
--     UPDATE public.profiles
--        SET role = 'admin'
--      WHERE email = 'อีเมลของคุณ';
--
--     (ถ้ายังไม่มีแถวใน profiles ให้รัน script ด้านบนใหม่ก่อน)
--     หลังจากนั้นเข้าเว็บแล้วไปที่หน้า /settings เพื่อจัดการสิทธิ์ผู้ใช้รายอื่น
-- =============================================================================
