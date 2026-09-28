# Alarm & Maintenance Management System

## วัตถุประสงค์โครงการ
ระบบบริหารจัดการสัญญาณแจ้งเตือน (Alarm) และงานซ่อมบำรุงเครื่องจักร (Maintenance) สำหรับโรงงานอุตสาหกรรม เพื่อติดตามสถานะและบันทึกประวัติการบำรุงรักษาอย่างเป็นระบบ

## Function หลักและ Technology ที่ใช้
- **Function หลัก:**
  - Authentication (ระบบเข้าสู่ระบบด้วย Supabase Auth)
  - Dashboard สรุปจำนวนเครื่องจักร, Running/Stop, Alarm และ Maintenance
  - Machine Master (จัดการข้อมูลเครื่องจักร)
  - Alarm Records (แจ้งและติดตามเหตุการณ์ Alarm)
  - Maintenance Records (บันทึกงานซ่อมบำรุง/แก้ไข)
- **Technology:** Next.js (App Router), Tailwind CSS, Supabase (PostgreSQL), Vercel

## Database Structure (Supabase Schema)
- `machines`: (id, machine_id, name, type, location, status, created_at)
- `alarms`: (id, machine_id, code, description, cause, status, created_at)
- `maintenance_records`: (id, machine_id, type, problem, action_taken, status, created_at)

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