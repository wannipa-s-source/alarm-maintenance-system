-- =============================================================================
-- ซ่อมระบบสิทธิ์ผู้ใช้ (RBAC) ให้ตรงกับโค้ดจริง
--
-- ROOT CAUSE ที่พบ (ตรวจจากฐานข้อมูลจริง):
--   ตาราง public.profiles ที่ deploy อยู่มีคอลัมน์แค่ (id, email, role, created_at)
--   แต่โค้ดหน้าเว็บอ่าน 'id, email, full_name, role'  -> PostgREST ตอบ 400
--   "column profiles.full_name does not exist"
--   -> RoleContext ตั้ง error -> UserBadge แสดง "ยังไม่ได้ติดตั้ง RBAC"
--   -> normalizeRole(undefined) คืน 'viewer'  => ทุกคนเห็นเป็น Viewer
--
--   นอกจากนี้ฟังก์ชัน is_admin()/can_write()/current_user_role() ที่ RLS ควรเรียกใช้
--   ยังไม่มีอยู่ในฐานข้อมูลเลย (rpc ตอบ PGRST202) และอีเมลของบัญชีทดสอบยังไม่ถูกยืนยัน
--   ทำให้ signInWithPassword ตอบ invalid_credentials
--
-- ไฟล์นี้จึงทำให้ฐานข้อมูล "ตรงกับโค้ด" ทั้งหมด โดยไม่ลบหรือทำลายข้อมูลเดิม
--
-- วิธีใช้: Supabase Dashboard > SQL Editor > วางไฟล์นี้ทั้งไฟล์ > Run
-- รันซ้ำได้ (idempotent) ทุกขั้น ไม่ทำให้ข้อมูลเดิมหาย
-- =============================================================================


-- =============================================================================
-- ส่วนที่ 1: โครงสร้างตาราง — เติมเฉพาะคอลัมน์ที่ขาด (ไม่ลบอะไรทิ้ง)
-- =============================================================================

-- 1.1) ประเภทบทบาท ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'technician', 'viewer');
  end if;
end$$;

-- 1.2) profiles: เติมคอลัมน์ที่โค้ดต้องใช้แต่ยังไม่มี ---------------------------
--     (คอลัมน์ที่มีอยู่แล้ว เช่น id/email/role/created_at จะถูกข้ามด้วย IF NOT EXISTS)
alter table public.profiles add column if not exists full_name  text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- 1.3) คอลัมน์อื่นที่โค้ดอ้างถึงแต่ยังไม่มีในตาราง (กัน error ตอนอ่าน/เขียน) ------
--     machines: ใช้ line เป็นตัวเลือกเสริม
alter table public.machines add column if not exists line text;

--     maintenance_records: ใช้คำนวณ MTTR และแสดงชื่อช่างในหน้ารายงาน
alter table public.maintenance_records add column if not exists technician       text;
alter table public.maintenance_records add column if not exists duration_minutes integer;
alter table public.maintenance_records add column if not exists completed_at     timestamptz;

-- 1.4) ดัชนี -------------------------------------------------------------------
create index if not exists profiles_role_idx on public.profiles (role);

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'profiles'
      and indexdef ilike '%lower((email))%'
  ) then
    create unique index profiles_email_idx on public.profiles (lower(email))
      where email is not null;
  end if;
end$$;


-- =============================================================================
-- ส่วนที่ 2: ฟังก์ชันตัวช่วยตรวจสิทธิ์ (RLS เรียกใช้ฟังก์ชันเหล่านี้)
--            ถ้าขาดไป RLS จะพังทันที ต้องมีก่อนเสมอ
-- =============================================================================

-- 2.1) อัปเดต updated_at อัตโนมัติ --------------------------------------------
create or replace function public.set_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- 2.2) สร้างโปรไฟล์อัตโนมัติเมื่อมีผู้ใช้สมัครใหม่ -----------------------------
--      บทบาทเริ่มต้นเป็น 'viewer' (ปิดสายตา) และ "ไม่" เชื่อ role ที่ส่งมาตอนสมัคร
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'viewer'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2.3) บทบาทของผู้ใช้ที่กำลังเข้าสู่ระบบ -----------------------------------------
--      SECURITY DEFINER เพื่ออ่าน profiles ได้โดยไม่วนซ้ำกับ RLS ของตารางตัวเอง
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'viewer'::public.user_role
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_user_role() = 'admin'::public.user_role;
$$;

-- admin + technician เขียนข้อมูลได้ / viewer เขียนไม่ได้
create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_user_role() in ('admin'::public.user_role, 'technician'::public.user_role);
$$;


-- =============================================================================
-- ส่วนที่ 3: RLS — บังคับสิทธิ์ที่ฝั่งฐานข้อมูล (ไม่พึ่งการซ่อนปุ่ม UI)
--
--   viewer      -> อ่านได้อย่างเดียวทุกตาราง เขียน/ลบไม่ได้เลย
--   technician  -> อ่านได้ทั้งหมด, เพิ่ม/แก้ maintenance ได้, เปลี่ยนสถานะ alarm ได้
--                 แต่แตะ machines / ลบ / จัดการผู้ใช้ ไม่ได้
--   admin       -> เต็ม
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.machines            enable row level security;
alter table public.alarms              enable row level security;
alter table public.maintenance_records enable row level security;

-- 3.1) สิทธิ์ระดับตาราง --------------------------------------------------------
revoke all on table public.profiles from anon;

grant select, update                           on table public.profiles            to authenticated;
grant select, insert, update, delete            on table public.machines            to authenticated;
grant select, insert, update, delete            on table public.alarms              to authenticated;
grant select, insert, update, delete            on table public.maintenance_records to authenticated;

-- 3.2) profiles: อ่าน/แก้ของตัวเองได้, admin ทำได้ทั้งหมด ------------------------
--     with check กันผู้ใช้เลื่อนสิทธิ์ตัวเอง
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

-- 3.3) machines: ทุกบทบาทอ่านได้ / เขียนและลบเฉพาะ admin -----------------------
drop policy if exists machines_select on public.machines;
create policy machines_select on public.machines
  for select to authenticated using (auth.uid() is not null);

drop policy if exists machines_insert on public.machines;
create policy machines_insert on public.machines
  for insert to authenticated with check (public.is_admin());

drop policy if exists machines_update on public.machines;
create policy machines_update on public.machines
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists machines_delete on public.machines;
create policy machines_delete on public.machines
  for delete to authenticated using (public.is_admin());

-- 3.4) alarms: ทุกบทบาทอ่านได้ / สร้าง+ลบเฉพาะ admin / แก้ได้ admin+technician --
drop policy if exists alarms_select on public.alarms;
create policy alarms_select on public.alarms
  for select to authenticated using (auth.uid() is not null);

drop policy if exists alarms_insert on public.alarms;
create policy alarms_insert on public.alarms
  for insert to authenticated with check (public.is_admin());

drop policy if exists alarms_update on public.alarms;
create policy alarms_update on public.alarms
  for update to authenticated
  using (public.can_write()) with check (public.can_write());

drop policy if exists alarms_delete on public.alarms;
create policy alarms_delete on public.alarms
  for delete to authenticated using (public.is_admin());

-- 3.5) maintenance_records: อ่านทุกบทบาท / เพิ่ม-แก้ admin+tech / ลบ admin ----
drop policy if exists maintenance_records_select on public.maintenance_records;
create policy maintenance_records_select on public.maintenance_records
  for select to authenticated using (auth.uid() is not null);

drop policy if exists maintenance_records_insert on public.maintenance_records;
create policy maintenance_records_insert on public.maintenance_records
  for insert to authenticated with check (public.can_write());

drop policy if exists maintenance_records_update on public.maintenance_records;
create policy maintenance_records_update on public.maintenance_records
  for update to authenticated
  using (public.can_write()) with check (public.can_write());

drop policy if exists maintenance_records_delete on public.maintenance_records;
create policy maintenance_records_delete on public.maintenance_records
  for delete to authenticated using (public.is_admin());

-- 3.6) ช่างซ่อมบำรุงแก้ Alarm ได้เฉพาะคอลัมน์ status ----------------------------
--      RLS ทำระดับแถว ไม่รู้ระดับคอลัมน์ จึงต้องมี trigger ช่วย
create or replace function public.enforce_alarm_edit_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor_role public.user_role;
begin
  select role into actor_role from public.profiles where id = auth.uid();

  if actor_role = 'admin'::public.user_role then
    return new;
  end if;

  if new.machine_id         is distinct from old.machine_id
     or new.alarm_code       is distinct from old.alarm_code
     or new.alarm_description is distinct from old.alarm_description
     or new.cause            is distinct from old.cause then
    raise exception 'สิทธิ์ % เปลี่ยนได้เฉพาะสถานะ (status) ของ Alarm เท่านั้น',
      coalesce(actor_role::text, 'null')
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists alarms_edit_scope on public.alarms;
create trigger alarms_edit_scope
  before update on public.alarms
  for each row execute function public.enforce_alarm_edit_scope();


-- =============================================================================
-- ส่วนที่ 4: Realtime — ตารางที่หน้าเว็บฟังการเปลี่ยนแปลง
-- =============================================================================
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


-- =============================================================================
-- ส่วนที่ 5: ข้อมูลบัญชีทดสอบ
-- =============================================================================

-- 5.1) นำเข้าโปรไฟล์ของผู้ใช้ที่มีอยู่แล้ว (กันกรณี trigger ไม่เคยทำงาน) --------
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  'viewer'::public.user_role
from auth.users u
on conflict (id) do nothing;

-- 5.2) ยืนยันอีเมลบัญชีทดสอบ ---------------------------------------------------
--     Supabase เปิด "Confirm email" ไว้เป็นค่าเริ่มต้น (mailer_autoconfirm = false)
--     ทำให้ signInWithPassword ตอบ invalid_credentials แม้รหัสผ่านถูกต้อง
--     หน้าเว็บไม่มี flow ยืนยันอีเมล จึงยืนยันผ่าน SQL เฉพาะ 3 บัญชีนี้
update auth.users
set email_confirmed_at = now()
where lower(email) in ('admin@test.com', 'tech@test.com', 'viewer@test.com')
  and email_confirmed_at is null;

-- 5.3) กำหนดบทบาทให้บัญชีทดสอบ (upsert — ไม่ขึ้นกับ trigger ทำงานหรือไม่) ----------
with seed(email, role, full_name) as (
  values
    ('admin@test.com',   'admin'::public.user_role,      'ผู้ดูแลระบบ'),
    ('tech@test.com',    'technician'::public.user_role, 'ช่างซ่อมบำรุง'),
    ('viewer@test.com',  'viewer'::public.user_role,     'ผู้ชม')
)
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, s.full_name, s.role
from seed s
join auth.users u on lower(u.email) = s.email
on conflict (id) do update
set email      = excluded.email,
    full_name  = coalesce(nullif(trim(excluded.full_name), ''), public.profiles.full_name),
    role       = excluded.role;

-- 5.4) สรุปผล และเตือนถ้าบัญชีใดยังไม่ถูกสร้าง -------------------------------
do $$
declare
  missing text;
begin
  select string_agg(expected.email, ', ' order by expected.email)
    into missing
  from (values ('admin@test.com'), ('tech@test.com'), ('viewer@test.com')) as expected(email)
  where not exists (
    select 1 from public.profiles p where lower(p.email) = expected.email
  );

  if missing is not null then
    raise warning 'ยังไม่พบบัญชี: % — กรุณาสร้างใน Supabase Dashboard > Authentication > Users แล้วรันไฟล์นี้ซ้ำ', missing;
  end if;
end$$;

-- 5.5) แสดงผลบทบาทจริงหลังรัน (ดูได้ในผลลัพธ์ SQL Editor) ----------------------
select email, role, email_confirmed_at is not null as confirmed
from public.profiles
where lower(email) in ('admin@test.com', 'tech@test.com', 'viewer@test.com')
order by role;


-- =============================================================================
-- สิทธิ์สุดท้ายหลังรันไฟล์นี้
--
--   admin@test.com   -> admin       เห็น/แก้/ลบได้ทุกอย่าง รวมถึงหน้า /settings
--   tech@test.com    -> technician  ดู Dashboard + Machine + Alarm,
--                                 เปลี่ยนสถานะ Alarm, เพิ่ม/แก้ Maintenance
--                                 (ลบ Machine / จัดการข้อมูลหลัก / /settings ไม่ได้)
--   viewer@test.com  -> viewer      อ่านอย่างเดียว ทุกคำสั่งเขียนได้ 403
--
--   รหัสผ่านตั้งเองที่ Supabase Dashboard > Authentication > Users (ไม่เก็บในรีโป)
--   เปลี่ยนบทบาทภายหลังได้จากหน้า /settings (เฉพาะ admin)
-- =============================================================================
