# Alarm & Maintenance Management System

## วัตถุประสงค์โครงการ
ระบบบริหารจัดการสัญญาณแจ้งเตือน (Alarm) และงานซ่อมบำรุงเครื่องจักร (Maintenance) สำหรับโรงงานอุตสาหกรรม เพื่อติดตามสถานะและบันทึกประวัติการบำรุงรักษาอย่างเป็นระบบ

## Function หลักและ Technology ที่ใช้
- **Function หลัก:**
  - Authentication (ระบบเข้าสู่ระบบด้วย Supabase Auth)
  - Role-based Access Control (บทบาท admin / technician / viewer)
  - Dashboard สรุปจำนวนเครื่องจักร, Running/Stop, Alarm และ Maintenance
  - Machine Master (จัดการข้อมูลเครื่องจักร)
  - Alarm Records (แจ้งและติดตามเหตุการณ์ Alarm)
  - Maintenance Records (บันทึกงานซ่อมบำรุง/แก้ไข)
  - หน้า `/settings` สำหรับผู้ดูแลระบบเปลี่ยนบทบาทผู้ใช้
- **Technology:** Next.js (App Router), Tailwind CSS, Supabase (PostgreSQL), Vercel

## Database Structure (Supabase Schema)
- `machines`: (id, machine_id, name, type, location, status, created_at)
- `alarms`: (id, machine_id, code, description, cause, status, created_at)
- `maintenance_records`: (id, machine_id, type, problem, action_taken, status, created_at)
- `profiles`: (id, email, full_name, role, created_at, updated_at) — ผูกกับ `auth.users` ด้วย trigger

## สิทธิ์ตามบทบาท (Role-based Access Control)

| บัญชีทดสอบ | บทบาท | ดูข้อมูล | เพิ่ม/แก้ไข Machine | ลบ Machine | สร้าง Alarm | เปลี่ยนสถานะ Alarm | ลบ Alarm | เพิ่ม/แก้ไข Maintenance | ลบ Maintenance | `/settings` |
| --- | --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| `admin@test.com` | `admin` (ผู้ดูแลระบบ) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tech@test.com` | `technician` (ช่างซ่อมบำรุง) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `viewer@test.com` | `viewer` (ผู้ชม) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**สรุปความต่างของ 3 บทบาท**
- `admin` — CRUD ได้ทุกหน้า (Machine, Alarm, Maintenance, Dashboard) และเข้าหน้า `/settings` เพื่อจัดการสิทธิ์ผู้ใช้
- `technician` — ดูเครื่องจักรและ Dashboard, บันทึก/แก้ไข/เปลี่ยนสถานะงานซ่อมบำรุง, เปลี่ยนสถานะ Alarm ได้
  **ลบข้อมูลไม่ได้ทุกตาราง และแก้ไขข้อมูลเครื่องจักรหรือสร้าง Alarm ใหม่ไม่ได้**
- `viewer` — อ่านอย่างเดียว ปุ่มเพิ่ม/แก้ไข/ลบถูกซ่อน ฟอร์มและ Dropdown ถูก disable
  และมีแถบแจ้งเตือนสีส้มด้านบน: *"🔒 คุณอยู่ในสิทธิ์ Viewer (อ่านได้อย่างเดียว)"*

> การเปลี่ยน `role` ทำได้จากหน้า `/settings` (เฉพาะ admin) เท่านั้น ผู้ใช้เลื่อนสิทธิ์ตัวเองไม่ได้

บทบาทถูกบังคับใช้ 3 ชั้น:
1. **UI** — ปุ่ม/ฟอร์ม/เมนู ถูกซ่อนหรือ disable ตามบทบาท (`lib/permissions.ts` + `context/RoleContext.tsx`)
2. **Route** — `proxy.ts` บล็อกหน้าที่บทบาทไม่ถึง (เช่น `/settings`)
3. **RLS** — PostgreSQL Row Level Security บังคับจริงฝั่งฐานข้อมูล (ข้าม UI ไปเรียก API ตรงก็เขียนไม่ได้)
   และมี trigger กันไม่ให้ `technician` แก้คอลัมน์อื่นของ Alarm นอกเหนือจาก `status`

### ติดตั้งระบบบทบาท (ทำครั้งเดียว)
1. เปิด Supabase Dashboard > **SQL Editor**
2. วางเนื้อหาไฟล์ `supabase/migrations/20260928000000_add_profiles_and_rls.sql` ทั้งไฟล์ แล้วกด **Run**
   - ไฟล์นี้จะสร้างตาราง `profiles`, เปิด RLS, และกำหนดบทบาทให้บัญชีทั้ง 3 อัตโนมัติ
   - ถ้าอีเมลใดไม่ตรงกับที่ระบุ จะขึ้นคำเตือนชื่ออีเมลที่หาไม่พบ
3. บัญชีอื่นที่ไม่ได้ระบุจะได้บทบาท `viewer` อัตโนมัติ — เปลี่ยนได้ภายหลังที่หน้า `/settings`

## วิธีติดตั้งและใช้งาน (Local Setup)
1. Clone Repository: `git clone <your-repo-url>`
2. Install Dependencies: `npm install`
3. ตั้งค่า `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>`
4. Run Project: `npm run dev`

## Vercel URL
https://alarm-maintenance-system-n9yovwo4i-wannipasakprom2547-7925.vercel.app

## รายละเอียดการใช้ AI ในการพัฒนา
ใช้น้อง AI ช่วยในทุกขั้นตอน:
1. ออกแบบ Database Schema และสร้างตารางใน Supabase
2. เจนเนอเรต Source Code หน้า UI แต่ละส่วนด้วย Next.js และ Tailwind CSS
3. ช่วยวิเคราะห์และแก้ไข Build Errors / Environment Variables บน Vercel
4. แนะนำวิธีตั้งค่า Authentication และเชื่อมต่อ API