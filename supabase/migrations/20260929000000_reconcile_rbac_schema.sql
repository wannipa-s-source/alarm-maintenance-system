-- =============================================================================
-- ซ่อมระบบสิทธิ์ผู้ใช้ (RBAC) ให้ตรงกับโค้ดจริง
--
-- ROOT CAUSE ที่พบ:
--   profiles มี id, email, role, created_at
--   แต่หน้าเว็บอ่าน full_name ด้วย -> เกิด 400
--   RoleContext error -> UserBadge แสดง "ยังไม่ได้ติดตั้ง RBAC"
--   และ normalizeRole(undefined) ทำให้ทุกคนกลายเป็น Viewer
--
-- ไฟล์นี้แก้:
--   1. เพิ่ม full_name / updated_at
--   2. สร้าง user_role
--   3. สร้าง current_user_role()
--   4. สร้าง is_admin()
--   5. สร้าง can_write()
--   6. ตั้ง RLS ตาม Role
--   7. ตั้งบัญชีทดสอบ admin / technician / viewer
--   8. ยืนยันอีเมลบัญชีทดสอบ
--
-- วิธีใช้:
-- Supabase Dashboard > SQL Editor > วางไฟล์นี้ทั้งไฟล์ > Run
-- =============================================================================


-- =============================================================================
-- ส่วนที่ 1: โครงสร้างตาราง
-- =============================================================================

-- 1.1) ประเภทบทบาท
do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'user_role'
  ) then
    create type public.user_role
      as enum ('admin', 'technician', 'viewer');
  end if;
end$$;


-- 1.2) profiles
alter table public.profiles
  add column if not exists full_name text;

alter table public.profiles
  add column if not exists updated_at timestamptz
  not null default now();


-- 1.3) machines
alter table public.machines
  add column if not exists line text;


-- 1.4) maintenance_records
alter table public.maintenance_records
  add column if not exists technician text;

alter table public.maintenance_records
  add column if not exists duration_minutes integer;

alter table public.maintenance_records
  add column if not exists completed_at timestamptz;


-- 1.5) index
create index if not exists profiles_role_idx
on public.profiles (role);


do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'profiles'
      and indexdef ilike '%lower((email))%'
  ) then

    create unique index profiles_email_idx
    on public.profiles (lower(email))
    where email is not null;

  end if;
end$$;


-- =============================================================================
-- ส่วนที่ 2: ฟังก์ชันตรวจสอบสิทธิ์
-- =============================================================================


-- 2.1) อัปเดต updated_at อัตโนมัติ
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


drop trigger if exists profiles_set_updated_at
on public.profiles;


create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();


-- =============================================================================
-- 2.2) สร้าง profile อัตโนมัติเมื่อสมัคร User ใหม่
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles (
    id,
    email,
    full_name,
    role
  )
  values (
    new.id,
    new.email,

    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          ''
        )
      ),
      ''
    ),

    'viewer'::public.user_role
  )

  on conflict (id) do nothing;

  return new;

end;
$$;


drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- =============================================================================
-- 2.3) บทบาทของ User ที่กำลัง Login
-- =============================================================================
--
-- จุดสำคัญ:
-- profiles.role เดิมเป็น text
-- แต่ public.user_role เป็น enum
--
-- ดังนั้นต้องใช้:
-- role::public.user_role
--
-- เพื่อป้องกัน error:
-- COALESCE types text and user_role cannot be matched
-- =============================================================================


create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$

  select coalesce(

    (
      select p.role::public.user_role
      from public.profiles p
      where p.id = auth.uid()
    ),

    'viewer'::public.user_role

  );

$$;


-- =============================================================================
-- 2.4) ตรวจว่าเป็น Admin หรือไม่
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$

  select public.current_user_role()
    = 'admin'::public.user_role;

$$;


-- =============================================================================
-- 2.5) ตรวจว่าเขียนข้อมูลได้หรือไม่
-- Admin + Technician เขียนได้
-- Viewer เขียนไม่ได้
-- =============================================================================

create or replace function public.can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$

  select public.current_user_role()
  in (
    'admin'::public.user_role,
    'technician'::public.user_role
  );

$$;


-- =============================================================================
-- ส่วนที่ 3: RLS
-- =============================================================================


alter table public.profiles
enable row level security;


alter table public.machines
enable row level security;


alter table public.alarms
enable row level security;


alter table public.maintenance_records
enable row level security;


-- =============================================================================
-- 3.1) สิทธิ์ระดับตาราง
-- =============================================================================


revoke all
on table public.profiles
from anon;


grant select, update
on table public.profiles
to authenticated;


grant select, insert, update, delete
on table public.machines
to authenticated;


grant select, insert, update, delete
on table public.alarms
to authenticated;


grant select, insert, update, delete
on table public.maintenance_records
to authenticated;


-- =============================================================================
-- 3.2) profiles
-- =============================================================================


drop policy if exists profiles_select_own
on public.profiles;


create policy profiles_select_own
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);


drop policy if exists profiles_update_own
on public.profiles;


create policy profiles_update_own
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
)
with check (

  public.is_admin()

  or (
    id = auth.uid()
    and role::public.user_role
        = public.current_user_role()
  )

);


-- =============================================================================
-- 3.3) machines
-- ทุก Role อ่านได้
-- เขียน / แก้ / ลบ เฉพาะ Admin
-- =============================================================================


drop policy if exists machines_select
on public.machines;


create policy machines_select
on public.machines
for select
to authenticated
using (
  auth.uid() is not null
);


drop policy if exists machines_insert
on public.machines;


create policy machines_insert
on public.machines
for insert
to authenticated
with check (
  public.is_admin()
);


drop policy if exists machines_update
on public.machines;


create policy machines_update
on public.machines
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


drop policy if exists machines_delete
on public.machines;


create policy machines_delete
on public.machines
for delete
to authenticated
using (
  public.is_admin()
);


-- =============================================================================
-- 3.4) alarms
-- =============================================================================


drop policy if exists alarms_select
on public.alarms;


create policy alarms_select
on public.alarms
for select
to authenticated
using (
  auth.uid() is not null
);


drop policy if exists alarms_insert
on public.alarms;


create policy alarms_insert
on public.alarms
for insert
to authenticated
with check (
  public.is_admin()
);


drop policy if exists alarms_update
on public.alarms;


create policy alarms_update
on public.alarms
for update
to authenticated
using (
  public.can_write()
)
with check (
  public.can_write()
);


drop policy if exists alarms_delete
on public.alarms;


create policy alarms_delete
on public.alarms
for delete
to authenticated
using (
  public.is_admin()
);


-- =============================================================================
-- 3.5) maintenance_records
-- =============================================================================


drop policy if exists maintenance_records_select
on public.maintenance_records;


create policy maintenance_records_select
on public.maintenance_records
for select
to authenticated
using (
  auth.uid() is not null
);


drop policy if exists maintenance_records_insert
on public.maintenance_records;


create policy maintenance_records_insert
on public.maintenance_records
for insert
to authenticated
with check (
  public.can_write()
);


drop policy if exists maintenance_records_update
on public.maintenance_records;


create policy maintenance_records_update
on public.maintenance_records
for update
to authenticated
using (
  public.can_write()
)
with check (
  public.can_write()
);


drop policy if exists maintenance_records_delete
on public.maintenance_records;


create policy maintenance_records_delete
on public.maintenance_records
for delete
to authenticated
using (
  public.is_admin()
);


-- =============================================================================
-- 3.6) Technician แก้ Alarm ได้เฉพาะ status
-- =============================================================================


create or replace function public.enforce_alarm_edit_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$

declare
  actor_role public.user_role;

begin

  select role::public.user_role
  into actor_role
  from public.profiles
  where id = auth.uid();


  -- Admin แก้ได้ทุกช่อง
  if actor_role = 'admin'::public.user_role then
    return new;
  end if;


  -- Technician แก้ได้เฉพาะ status
  if new.machine_id
       is distinct from old.machine_id

     or new.alarm_code
       is distinct from old.alarm_code

     or new.alarm_description
       is distinct from old.alarm_description

     or new.cause
       is distinct from old.cause then

    raise exception
      'สิทธิ์ % เปลี่ยนได้เฉพาะสถานะ (status) ของ Alarm เท่านั้น',
      coalesce(actor_role::text, 'null')
      using errcode = '42501';

  end if;


  return new;

end;
$$;


drop trigger if exists alarms_edit_scope
on public.alarms;


create trigger alarms_edit_scope
before update on public.alarms
for each row
execute function public.enforce_alarm_edit_scope();


-- =============================================================================
-- ส่วนที่ 4: Realtime
-- =============================================================================


do $$
declare
  target text;

begin

  foreach target in array
    array[
      'machines',
      'alarms',
      'profiles'
    ]

  loop

    if not exists (

      select 1
      from pg_publication_tables

      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target

    ) then

      execute format(
        'alter publication supabase_realtime add table public.%I',
        target
      );

    end if;

  end loop;

end$$;


-- =============================================================================
-- ส่วนที่ 5: บัญชีทดสอบ
-- =============================================================================


-- =============================================================================
-- 5.1) สร้าง profiles ให้กับ User ที่มีอยู่แล้ว
-- =============================================================================


insert into public.profiles (
  id,
  email,
  full_name,
  role
)

select
  u.id,
  u.email,

  nullif(
    trim(
      coalesce(
        u.raw_user_meta_data ->> 'full_name',
        ''
      )
    ),
    ''
  ),

  'viewer'::public.user_role

from auth.users u

on conflict (id) do nothing;


-- =============================================================================
-- 5.2) ยืนยัน Email ของบัญชีทดสอบ
-- =============================================================================


update auth.users

set email_confirmed_at = now()

where lower(email)
in (
  'admin@test.com',
  'tech@test.com',
  'viewer@test.com'
)

and email_confirmed_at is null;


-- =============================================================================
-- 5.3) กำหนด Role ให้บัญชีทดสอบ
-- =============================================================================


with seed(
  email,
  role,
  full_name
)

as (

  values

    (
      'admin@test.com',
      'admin'::public.user_role,
      'ผู้ดูแลระบบ'
    ),

    (
      'tech@test.com',
      'technician'::public.user_role,
      'ช่างซ่อมบำรุง'
    ),

    (
      'viewer@test.com',
      'viewer'::public.user_role,
      'ผู้ชม'
    )

)

insert into public.profiles (
  id,
  email,
  full_name,
  role
)

select
  u.id,
  u.email,
  s.full_name,
  s.role

from seed s

join auth.users u
  on lower(u.email) = s.email


on conflict (id)
do update

set
  email = excluded.email,

  full_name =
    coalesce(
      nullif(
        trim(excluded.full_name),
        ''
      ),
      public.profiles.full_name
    ),

  role = excluded.role;


-- =============================================================================
-- 5.4) ตรวจสอบว่ามีบัญชีครบหรือไม่
-- =============================================================================


do $$

declare
  missing text;

begin

  select string_agg(
    expected.email,
    ', '
    order by expected.email
  )

  into missing

  from (
    values
      ('admin@test.com'),
      ('tech@test.com'),
      ('viewer@test.com')
  ) as expected(email)

  where not exists (

    select 1
    from public.profiles p

    where lower(p.email)
      = expected.email

  );


  if missing is not null then

    raise warning
      'ยังไม่พบบัญชี: % — กรุณาสร้างใน Supabase Dashboard > Authentication > Users แล้วรันไฟล์นี้ซ้ำ',
      missing;

  end if;

end$$;


-- =============================================================================
-- 5.5) แสดงผล Role และสถานะ Email หลังรัน
-- =============================================================================

select
  p.email,
  p.role,
  u.email_confirmed_at is not null as confirmed

from public.profiles p

left join auth.users u
  on u.id = p.id

where lower(p.email)
in (
  'admin@test.com',
  'tech@test.com',
  'viewer@test.com'
)

order by p.role;


-- =============================================================================
-- สิทธิ์สุดท้าย
--
-- admin@test.com
--   -> admin
--   -> จัดการทุกอย่าง
--
-- tech@test.com
--   -> technician
--   -> ดู Dashboard / Machine / Alarm
--   -> เปลี่ยนสถานะ Alarm
--   -> เพิ่ม / แก้ Maintenance
--   -> ไม่มีสิทธิ์ลบ Machine
--   -> ไม่มีสิทธิ์จัดการ User / Role
--
-- viewer@test.com
--   -> viewer
--   -> อ่านข้อมูลอย่างเดียว
--   -> เพิ่ม / แก้ / ลบไม่ได้
--
-- =============================================================================