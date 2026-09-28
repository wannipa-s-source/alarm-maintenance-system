-- ============================================================
--  ระบบผู้ใช้งาน & สิทธิ์การเข้าถึง (Authentication + RBAC)
--  Roles: 'admin' | 'technician'
--  วิธีใช้: เปิด Supabase Dashboard > SQL Editor > วางไฟล์นี้ > Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) ตาราง profiles (ข้อมูลหลักของผู้ใช้ + Role)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'technician' check (role in ('admin', 'technician')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'ข้อมูลหลักของผู้ใช้งานและสิทธิ์ (Role) ของระบบ';

-- ฟังก์ชันช่วยดึง Role ของผู้ที่กำลังล็อกอิน
-- security definer เพื่อหลีกเลี่ยงการวนซ้ำของ RLS บนตาราง profiles
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- 2) สร้าง profile อัตโนมัติทุกครั้งที่มีผู้สมัครใหม่ (ค่าเริ่มต้น = technician)
-- ------------------------------------------------------------
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
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'technician'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3) RLS ของตาราง profiles
--    - ทุกคนอ่านได้เฉพาะโปรไฟล์ตัวเอง (Admin อ่านได้ทั้งหมด)
--    - แก้ไขได้เฉพาะ Admin เท่านั้น (ผู้ใช้แก้ได้แค่ full_name ของตัวเอง)
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- จำกัดคอลัมน์: ผู้ใช้ทั่วไปอัปเดตได้แค่ full_name (กันการแก้ role ของตัวเอง)
-- การเปลี่ยน role ให้ใช้ RPC public.set_user_role() แทน ซึ่งตรวจสิทธิ์ภายในตัวเอง
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- สร้าง profile ให้ผู้ใช้ที่มีอยู่ก่อนแล้วในระบบ (ค่าเริ่มต้น = technician)
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  'technician'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3.1) RPC: ให้ Admin เปลี่ยนสิทธิ์ (role) ของผู้ใช้ได้
--      ใช้ security definer + ตรวจสิทธิ์ภายใน เพื่อไม่เปิดสิทธิ์แก้ role ให้ client
-- ------------------------------------------------------------
create or replace function public.set_user_role(target_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'สิทธิ์ไม่เพียงพอ: เฉพาะ Admin เท่านั้นที่จัดการสิทธิ์ผู้ใช้ได้';
  end if;

  if new_role is null or new_role not in ('admin', 'technician') then
    raise exception 'ค่า Role ไม่ถูกต้อง: ต้องเป็น admin หรือ technician';
  end if;

  if target_id is null or target_id = auth.uid() then
    raise exception 'ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้';
  end if;

  update public.profiles set role = new_role where id = target_id;

  if not found then
    raise exception 'ไม่พบผู้ใช้งานที่ระบุ';
  end if;
end;
$$;

revoke execute on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 4) RLS ของตาราง machines (ข้อมูลหลักของระบบ)
--    Admin เท่านั้นที่เพิ่ม / แก้ไข / ลบได้ | ทุก Role ที่ล็อกอินอ่านได้
-- ------------------------------------------------------------
alter table public.machines enable row level security;

drop policy if exists "machines_select_authenticated" on public.machines;
create policy "machines_select_authenticated"
  on public.machines for select
  to authenticated
  using (true);

drop policy if exists "machines_insert_admin" on public.machines;
create policy "machines_insert_admin"
  on public.machines for insert
  to authenticated
  with check (public.current_user_role() = 'admin');

drop policy if exists "machines_update_admin" on public.machines;
create policy "machines_update_admin"
  on public.machines for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "machines_delete_admin" on public.machines;
create policy "machines_delete_admin"
  on public.machines for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- 5) RLS ของตาราง alarms
--    Admin เพิ่ม/ลบได้ | Technician เปลี่ยนได้เฉพาะคอลัมน์ status
-- ------------------------------------------------------------
alter table public.alarms enable row level security;

drop policy if exists "alarms_select_authenticated" on public.alarms;
create policy "alarms_select_authenticated"
  on public.alarms for select
  to authenticated
  using (true);

drop policy if exists "alarms_insert_admin" on public.alarms;
create policy "alarms_insert_admin"
  on public.alarms for insert
  to authenticated
  with check (public.current_user_role() = 'admin');

-- อนุญาตให้ล็อกอินได้ (ป้องกันการแก้คอลัมน์อื่นด้วย trigger ด้านล่าง)
drop policy if exists "alarms_update_authenticated" on public.alarms;
create policy "alarms_update_authenticated"
  on public.alarms for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "alarms_delete_admin" on public.alarms;
create policy "alarms_delete_admin"
  on public.alarms for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- บังคับ: นอกเหนือจาก Admin ให้แก้ได้เฉพาะสถานะ (status) ของ Alarm
create or replace function public.guard_alarm_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin แก้ได้ทุกคอลัมน์
  if public.current_user_role() = 'admin' then
    return new;
  end if;

  -- ผู้ใช้อื่น (Technician): ต้องเปลี่ยน status เท่านั้น และห้ามแตะคอลัมน์อื่น
  if new.status is not distinct from old.status
     or new.machine_id is distinct from old.machine_id
     or new.alarm_code is distinct from old.alarm_code
     or new.alarm_description is distinct from old.alarm_description
     or new.cause is distinct from old.cause then
    raise exception 'สิทธิ์ไม่เพียงพอ: Technician สามารถเปลี่ยนได้เฉพาะสถานะ (status) ของ Alarm';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_alarm_update_trigger on public.alarms;
create trigger guard_alarm_update_trigger
  before update on public.alarms
  for each row execute function public.guard_alarm_update();

-- ------------------------------------------------------------
-- 6) RLS ของตาราง maintenance_records
--    Admin + Technician บันทึก/แก้ไขได้ | ลบได้เฉพาะ Admin
-- ------------------------------------------------------------
alter table public.maintenance_records enable row level security;

drop policy if exists "maintenance_select_authenticated" on public.maintenance_records;
create policy "maintenance_select_authenticated"
  on public.maintenance_records for select
  to authenticated
  using (true);

drop policy if exists "maintenance_insert_authenticated" on public.maintenance_records;
create policy "maintenance_insert_authenticated"
  on public.maintenance_records for insert
  to authenticated
  with check (true);

drop policy if exists "maintenance_update_authenticated" on public.maintenance_records;
create policy "maintenance_update_authenticated"
  on public.maintenance_records for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "maintenance_delete_admin" on public.maintenance_records;
create policy "maintenance_delete_admin"
  on public.maintenance_records for delete
  to authenticated
  using (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- 7) ให้สิทธิ์การใช้งานตารางกับ role ที่ล็อกอินแล้ว
-- ------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.machines to authenticated;
grant select, insert, update, delete on public.alarms to authenticated;
grant select, insert, update, delete on public.maintenance_records to authenticated;
grant select, update (full_name) on public.profiles to authenticated;

-- ===========================================================
--  วิธีตั้งผู้ใช้คนแรกให้เป็น Admin (ทำครั้งเดียวหลังสมัครผู้ใช้ในระบบ)
--  รันใน SQL Editor:
--    update public.profiles set role = 'admin' where email = 'your@email.com';
-- ===========================================================
