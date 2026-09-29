-- =============================================================================
-- เปิดใช้งานบัญชีทดสอบ 3 บทบาท: admin@test.com / tech@test.com / viewer@test.com
--
-- ปัญหาที่ไฟล์นี้แก้: migration เดิม (หัวข้อ 16) สั่งแค่ UPDATE โปรไฟล์ที่ "มีอยู่แล้ว"
-- ถ้าบัญชียังไม่เคยสมัคร หรือ trigger ยังไม่ได้ทำงาน คำสั่งนั้นจะไม่ทำอะไรเลย
-- และบัญชีที่สมัครผ่านหน้าเว็บจะยัง "ยังไม่ยืนยันอีเมล" จึงล็อกอินไม่ได้
--
-- ไฟล์นี้จึงทำให้ครบวงจร:
--   1) ยืนยันอีเมลของบัญชีทดสอบทั้ง 3 (ปิดข้อกำกับการยืนยันอีเมลเฉพาะบัญชีเหล่านี้)
--   2) สร้าง/อัปเดตแถวใน public.profiles ด้วยบทบาทที่ถูกต้อง (upsert จึงปลอดภัยทั้งสองทาง)
--   3) ย้อนกลับกรณีเผลอรันก่อนสร้างบัญชี — เตือนให้สร้างบัญชีใน Auth Dashboard ก่อน
--
-- วิธีใช้: Supabase Dashboard > SQL Editor > วางไฟล์นี้ทั้งไฟล์ > Run
-- รันซ้ำได้ (idempotent) ไม่ทำให้ข้อมูลเดิมหาย
-- =============================================================================

-- 1) ยืนยันอีเมลบัญชีทดสอบ --------------------------------------------------
--    Supabase เปิด "Confirm email" ไว้เป็นค่าเริ่มต้น ทำให้ signInWithPassword ตอบกลับ
--    invalid_credentials แม้รหัสผ่านถูกต้อง การยืนยันอีเมลผ่าน SQL เป็นวิธีที่
--    รองรับได้ (หน้าเว็บไม่มี flow ยืนยันอีเมล) — จึงกำหนดเฉพาะ 3 บัญชีนี้เท่านั้น
--    เพื่อไม่ให้บัญชีอื่นที่สมัครเองติดยืนยันแบบอัตโนมัติ
update auth.users
set email_confirmed_at = now()
where lower(email) in ('admin@test.com', 'tech@test.com', 'viewer@test.com')
  and email_confirmed_at is null;

-- 2) กำหนดบทบาทให้บัญชีทดสอบ (upsert — สร้างได้แม้ยังไม่มี trigger) -------------
--    แหล่งข้อมูลคือ auth.users เสมอ เพื่อไม่ให้เกิดแถวโปรไฟล์ค้างที่ไม่มีผู้ใช้จริง
with seed(email, role, full_name) as (
  values
    ('admin@test.com',  'admin'::public.user_role,      'ผู้ดูแลระบบ'),
    ('tech@test.com',   'technician'::public.user_role, 'ช่างซ่อมบำรุง'),
    ('viewer@test.com', 'viewer'::public.user_role,     'ผู้ชม')
)
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  s.full_name,
  s.role
from seed s
join auth.users u on lower(u.email) = s.email
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(nullif(trim(excluded.full_name), ''), public.profiles.full_name),
  role = excluded.role;

-- 3) ตรวจสอบผลลัพธ์ และเตือนถ้าบัญชีใดยังไม่ถูกสร้าง --------------------------
--    3 บัญชีนี้สร้างในหน้า Authentication > Users ของ Supabase (หรือผ่าน signup)
--    ถ้าเห็นคำเตือนนี้ แปลว่ายังไม่มีบัญชี — ให้สร้างแล้วรันไฟล์นี้ซ้ำ
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
    raise warning 'ยังไม่พบบัญชีผู้ใช้: % — กรุณาสร้างใน Supabase Dashboard > Authentication > Users แล้วรันไฟล์นี้ซ้ำ', missing;
  end if;
end$$;

-- 4) สรุปบทบาทที่บังคับใช้จริงหลังรันเสร็จ -----------------------------------
--   admin@test.com   -> admin       CRUD ได้ทุกตาราง (Machine/Alarm/Maintenance)
--                                 + เข้า /settings เพื่อจัดการสิทธิ์ผู้ใช้
--   tech@test.com    -> technician  ดูเครื่องจักร/Dashboard, บันทึก-แก้ไข Maintenance,
--                                 เปลี่ยนสถานะ Alarm ได้ (ลบไม่ได้, แก้ Machine ไม่ได้)
--   viewer@test.com  -> viewer      อ่านอย่างเดียว
--
--   รหัสผ่านของบัญชีทดสอบถูกตั้งเองในหน้า Authentication > Users (ไม่ถูกเก็บในรีโป)
--
--   ถ้าต้องการเปลี่ยนบทบาทภายหลัง ให้แก้ค่าในหัวข้อ 2 แล้วรันส่วนนั้นซ้ำ
--   หรือเข้าเว็บในฐานะ admin แล้วไปที่หน้า /settings เพื่อจัดการสิทธิ์
-- =============================================================================
