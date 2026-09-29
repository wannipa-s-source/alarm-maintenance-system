/**
 * ตรวจสอบระบบสิทธิ์ผู้ใช้ (RBAC) แบบอัตโนมัติ — ทดสอบทั้ง 3 บัญชี
 *
 * ข้อสำคัญ: สคริปต์นี้ทดสอบ "ฝั่ง Backend จริง" ผ่าน Supabase PostgREST + RLS
 * ไม่ได้ทดสอบแค่การซ่อนปุ่มบนหน้าเว็บ ทุกคำสั่งเขียนที่ไม่มีสิทธิ์
 * ต้องถูกปฏิเสธด้วย HTTP 401/403 (RLS) ไม่ใช่แค่ไม่มีปุ่มให้กด
 *
 * วิธีใช้:
 *   1) รันไฟล์ supabase/migrations/20260929000000_reconcile_rbac_schema.sql ใน SQL Editor ก่อน
 *   2) ตั้งรหัสผ่านของ 3 บัญชีให้ตรงกัน (ดูวิธีท้ายไฟล์)
 *   3) node scripts/verify-rbac.mjs
 *
 * ตั้งค่าได้ผ่าน environment variables:
 *   SUPABASE_URL, SUPABASE_ANON_KEY
 *   RBAC_ADMIN_PASSWORD, RBAC_TECH_PASSWORD, RBAC_VIEWER_PASSWORD
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ config */

function loadEnvFile() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* ไม่มีไฟล์ .env.local — ใช้ค่าจาก environment แทน */
  }
}

loadEnvFile();

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PASSWORD = {
  admin: process.env.RBAC_ADMIN_PASSWORD ?? 'Test@12345',
  tech: process.env.RBAC_TECH_PASSWORD ?? 'Test@12345',
  viewer: process.env.RBAC_VIEWER_PASSWORD ?? 'Test@12345',
};

const ACCOUNTS = {
  admin: 'admin@test.com',
  tech: 'tech@test.com',
  viewer: 'viewer@test.com',
};

if (!URL_BASE || !ANON_KEY) {
  console.error('ไม่พบ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

/* ------------------------------------------------------------------ helpers */

const stamp = Date.now().toString(36).toUpperCase();
const TEST_MACHINE = { machine_id: `RBAC-T-${stamp}`, machine_name: 'RBAC Test Machine', status: 'Stop' };

/** ล็อกอินและคืน access token */
async function login(email, password) {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`login ${email} -> HTTP ${res.status} ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

/** เรียก PostgREST แล้วคืน { status, ok, denied, body } */
async function api(token, method, table, { body, query = '', prefer } = {}) {
  const res = await fetch(
    `${URL_BASE}/rest/v1/${table}${query ? `?${query}` : ''}`,
    {
      method,
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }
  );
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  const denied = res.status === 401 || res.status === 403;
  return { status: res.status, ok: res.ok, denied, body: parsed };
}

/* ------------------------------------------------------------------ results */

const results = [];
let failures = 0;

function record(account, action, expectation, actual) {
  const pass = expectation === 'allow' ? actual.ok : actual.denied;
  if (!pass) failures++;
  results.push({ account, action, expectation, status: actual.status, pass, detail: actual.detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(
    `  [${mark}] ${account.padEnd(6)} ${action.padEnd(42)} ` +
      `expected=${expectation.padEnd(5)} HTTP ${String(actual.status).padEnd(3)}` +
      (actual.detail ? `  ${actual.detail}` : '')
  );
}

const denials = new Set();
const track = (r, label) => {
  if (r.denied) denials.add(`${label}:${r.status}`);
  return r;
};

/* ------------------------------------------------------------------ main */

async function main() {
  console.log('\n=========================================================');
  console.log('  ทดสอบระบบ RBAC — Admin / Technician / Viewer');
  console.log('=========================================================\n');

  // --- 1) ล็อกอินทั้ง 3 บัญชี ------------------------------------------------
  //     ต้องล็อกอินก่อน จึงจะตรวจ schema ได้ เพราะ anon ถูก revoke บนตาราง profiles
  console.log('[1] ล็อกอินทั้ง 3 บัญชี');
  const tokens = {};
  for (const [key, email] of Object.entries(ACCOUNTS)) {
    try {
      tokens[key] = await login(email, PASSWORD[key]);
      console.log(`  [PASS] ${email} ล็อกอินสำเร็จ`);
    } catch (err) {
      console.error(`  [FAIL] ${email} — ${err.message}`);
      console.error(
        '\n  สาเหตุที่เป็นไปได้:\n' +
          '    - ยังไม่ได้ยืนยันอีเมล (migration หัวข้อ 5.2 จะยืนยันให้)\n' +
          '    - ยังไม่ได้สร้างบัญชี หรือรหัสผ่านไม่ตรงกับที่ตั้งไว้\n' +
          `    - ปรับรหัสผ่านผ่าน RBAC_ADMIN_PASSWORD / RBAC_TECH_PASSWORD / RBAC_VIEWER_PASSWORD ได้\n`
      );
      process.exitCode = 1;
      return;
    }
  }
  console.log('');

  // --- 2) ตรวจว่า migration ถูกรันแล้ว (คอลัมน์ full_name ต้องมี) ----------------
  console.log('[2] ตรวจสอบโครงสริงฐานข้อมูล (migration)');
  const schemaProbe = await fetch(
    `${URL_BASE}/rest/v1/profiles?select=full_name&limit=1`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${tokens.viewer}`,
      },
    }
  );
  if (!schemaProbe.ok) {
    const detail = await schemaProbe.text().catch(() => '');
    console.error(
      `\n  [ติดขัด] profiles.full_name ใช้ไม่ได้ (HTTP ${schemaProbe.status}) ${detail}\n` +
        `         แปลว่ายังไม่ได้รัน migration — กรุณารัน\n` +
        `         supabase/migrations/20260929000000_reconcile_rbac_schema.sql\n` +
        `         ใน Supabase Dashboard > SQL Editor แล้วรันสคริปต์นี้อีกครั้ง\n`
    );
    process.exitCode = 1;
    return;
  }
  console.log('  [PASS] profiles.full_name มีอยู่จริง — migration ถูกรันแล้ว\n');

  // --- 3) ตรวจว่าบทบาทในโปรไฟล์ตรงกับที่คาดหวัง ---------------------------------
  console.log('[3] ตรวจสอบบทบาทที่อ่านได้จาก public.profiles');
  const expectedRole = { admin: 'admin', tech: 'technician', viewer: 'viewer' };
  for (const [key, token] of Object.entries(tokens)) {
    const r = await api(token, 'GET', 'profiles', { query: 'select=id,email,full_name,role' });
    const row = Array.isArray(r.body) ? r.body[0] : null;
    const actualRole = row?.role ?? null;
    const pass = actualRole === expectedRole[key];
    if (!pass) failures++;
    console.log(
      `  [${pass ? 'PASS' : 'FAIL'}] ${ACCOUNTS[key].padEnd(16)} role=${String(actualRole).padEnd(12)} ` +
        `expected=${expectedRole[key]}`
    );
  }
  console.log('');

  // --- 4) เตรียมข้อมูลทดสอบ (ใช้สิทธิ์ admin) ---------------------------------
  console.log('[4] เตรียมข้อมูลทดสอบด้วยสิทธิ์ Admin');
  const seedMachine = track(
    await api(tokens.admin, 'POST', 'machines', {
      body: TEST_MACHINE,
      prefer: 'return=representation',
    }),
    'admin:create-machine'
  );
  record('admin', 'สร้าง Machine (seed)', 'allow', seedMachine);
  const machineId = Array.isArray(seedMachine.body) ? seedMachine.body[0]?.id : null;
  if (!machineId) {
    console.error('  [ติดขัด] สร้าง Machine ไม่สำเร็จ — ทดสอบต่อไม่ได้');
    process.exitCode = 1;
    return;
  }

  const seedAlarm = track(
    await api(tokens.admin, 'POST', 'alarms', {
      body: {
        machine_id: machineId,
        alarm_code: `RBAC-${stamp}`,
        alarm_description: 'RBAC test alarm',
        cause: 'test',
        status: 'Open',
      },
      prefer: 'return=representation',
    }),
    'admin:create-alarm'
  );
  record('admin', 'สร้าง Alarm (seed)', 'allow', seedAlarm);
  const alarmId = Array.isArray(seedAlarm.body) ? seedAlarm.body[0]?.id : null;

  const seedMaintenance = track(
    await api(tokens.admin, 'POST', 'maintenance_records', {
      body: {
        machine_id: machineId,
        maintenance_type: 'Corrective',
        problem: 'RBAC test maintenance',
        action_taken: '-',
        status: 'Pending',
      },
      prefer: 'return=representation',
    }),
    'admin:create-maintenance'
  );
  record('admin', 'สร้าง Maintenance (seed)', 'allow', seedMaintenance);
  const maintenanceId = Array.isArray(seedMaintenance.body) ? seedMaintenance.body[0]?.id : null;
  console.log('');

  // --- 4) ทดสอบสิทธิ์ของแต่ละบทบาท -------------------------------------------
  console.log('[5] ทดสอบสิทธิ์ที่ Backend (RLS) ของแต่ละบทบาท\n');

  console.log('  --- Viewer (viewer@test.com) ---');
  record('viewer', 'อ่าน Machine', 'allow', track(await api(tokens.viewer, 'GET', 'machines', { query: 'select=id' }), 'viewer:read-machine'));
  record('viewer', 'อ่าน Alarm', 'allow', track(await api(tokens.viewer, 'GET', 'alarms', { query: 'select=id' }), 'viewer:read-alarm'));
  record('viewer', 'อ่าน Maintenance', 'allow', track(await api(tokens.viewer, 'GET', 'maintenance_records', { query: 'select=id' }), 'viewer:read-maintenance'));
  record('viewer', 'อ่าน Dashboard (machines)', 'allow', track(await api(tokens.viewer, 'GET', 'machines', { query: 'select=status' }), 'viewer:dashboard'));
  record('viewer', 'เพิ่ม Machine', 'deny', track(await api(tokens.viewer, 'POST', 'machines', { body: { machine_id: `V-${stamp}`, machine_name: 'x', status: 'Stop' } }), 'viewer:create-machine'));
  record('viewer', 'แก้ไข Machine', 'deny', track(await api(tokens.viewer, 'PATCH', 'machines', { body: { machine_name: 'hacked' }, query: `id=eq.${machineId}` }), 'viewer:update-machine'));
  record('viewer', 'ลบ Machine', 'deny', track(await api(tokens.viewer, 'DELETE', 'machines', { query: `id=eq.${machineId}` }), 'viewer:delete-machine'));
  record('viewer', 'เปลี่ยนสถานะ Alarm', 'deny', track(await api(tokens.viewer, 'PATCH', 'alarms', { body: { status: 'Closed' }, query: `id=eq.${alarmId}` }), 'viewer:update-alarm'));
  record('viewer', 'เพิ่ม Maintenance', 'deny', track(await api(tokens.viewer, 'POST', 'maintenance_records', { body: { machine_id: machineId, problem: 'x' } }), 'viewer:create-maintenance'));
  record('viewer', 'แก้ไข Maintenance', 'deny', track(await api(tokens.viewer, 'PATCH', 'maintenance_records', { body: { status: 'Completed' }, query: `id=eq.${maintenanceId}` }), 'viewer:update-maintenance'));
  record('viewer', 'เลื่อนสิทธิ์ตัวเองเป็น admin', 'deny', track(await api(tokens.viewer, 'PATCH', 'profiles', { body: { role: 'admin' } }), 'viewer:escalate'));
  console.log('');

  console.log('  --- Technician (tech@test.com) ---');
  record('tech', 'อ่าน Machine', 'allow', track(await api(tokens.tech, 'GET', 'machines', { query: 'select=id' }), 'tech:read-machine'));
  record('tech', 'อ่าน Alarm', 'allow', track(await api(tokens.tech, 'GET', 'alarms', { query: 'select=id' }), 'tech:read-alarm'));
  record('tech', 'อ่าน Dashboard (machines)', 'allow', track(await api(tokens.tech, 'GET', 'machines', { query: 'select=status' }), 'tech:dashboard'));
  record('tech', 'เปลี่ยนสถานะ Alarm', 'allow', track(await api(tokens.tech, 'PATCH', 'alarms', { body: { status: 'In Progress' }, query: `id=eq.${alarmId}` }), 'tech:update-alarm-status'));
  record('tech', 'แก้คอลัมน์อื่นของ Alarm', 'deny', track(await api(tokens.tech, 'PATCH', 'alarms', { body: { cause: 'hacked' }, query: `id=eq.${alarmId}` }), 'tech:edit-alarm-columns'));
  record('tech', 'เพิ่ม Maintenance', 'allow', track(await api(tokens.tech, 'POST', 'maintenance_records', { body: { machine_id: machineId, maintenance_type: 'Corrective', problem: 'tech record', status: 'Pending' } }), 'tech:create-maintenance'));
  record('tech', 'แก้ไข Maintenance', 'allow', track(await api(tokens.tech, 'PATCH', 'maintenance_records', { body: { status: 'In Progress' }, query: `id=eq.${maintenanceId}` }), 'tech:update-maintenance'));
  record('tech', 'ลบ Machine', 'deny', track(await api(tokens.tech, 'DELETE', 'machines', { query: `id=eq.${machineId}` }), 'tech:delete-machine'));
  record('tech', 'เพิ่ม Machine', 'deny', track(await api(tokens.tech, 'POST', 'machines', { body: { machine_id: `T-${stamp}`, machine_name: 'x', status: 'Stop' } }), 'tech:create-machine'));
  record('tech', 'แก้ไข Machine', 'deny', track(await api(tokens.tech, 'PATCH', 'machines', { body: { machine_name: 'hacked' }, query: `id=eq.${machineId}` }), 'tech:update-machine'));
  record('tech', 'ลบ Maintenance', 'deny', track(await api(tokens.tech, 'DELETE', 'maintenance_records', { query: `id=eq.${maintenanceId}` }), 'tech:delete-maintenance'));
  record('tech', 'ลบ Alarm', 'deny', track(await api(tokens.tech, 'DELETE', 'alarms', { query: `id=eq.${alarmId}` }), 'tech:delete-alarm'));
  record('tech', 'เลื่อนสิทธิ์ตัวเองเป็น admin', 'deny', track(await api(tokens.tech, 'PATCH', 'profiles', { body: { role: 'admin' } }), 'tech:escalate'));
  console.log('');

  console.log('  --- Admin (admin@test.com) ---');
  record('admin', 'อ่าน Machine', 'allow', track(await api(tokens.admin, 'GET', 'machines', { query: 'select=id' }), 'admin:read-machine'));
  record('admin', 'แก้ไข Machine', 'allow', track(await api(tokens.admin, 'PATCH', 'machines', { body: { machine_name: 'renamed by admin' }, query: `id=eq.${machineId}` }), 'admin:update-machine'));
  record('admin', 'แก้ Alarm ทุกคอลัมน์', 'allow', track(await api(tokens.admin, 'PATCH', 'alarms', { body: { cause: 'admin edited' }, query: `id=eq.${alarmId}` }), 'admin:edit-alarm-columns'));
  record('admin', 'แก้ไข Maintenance', 'allow', track(await api(tokens.admin, 'PATCH', 'maintenance_records', { body: { status: 'Completed' }, query: `id=eq.${maintenanceId}` }), 'admin:update-maintenance'));
  record('admin', 'อ่านรายชื่อผู้ใช้ทั้งหมด', 'allow', track(await api(tokens.admin, 'GET', 'profiles', { query: 'select=id,email,role' }), 'admin:read-profiles'));
  console.log('');

  // --- 5) เปลี่ยนบทบาทผู้ใช้ (หน้า /settings) ----------------------------------
  console.log('[6] ทดสอบการจัดการบทบาท (หน้า /settings)');
  const changeRole = track(
    await api(tokens.admin, 'PATCH', 'profiles', {
      body: { role: 'technician' },
      query: 'email=eq.tech@test.com',
    }),
    'admin:change-role'
  );
  record('admin', 'เปลี่ยนบทบาทผู้ใช้', 'allow', changeRole);

  const changeBack = track(
    await api(tokens.admin, 'PATCH', 'profiles', {
      body: { role: 'technician' },
      query: 'email=eq.viewer@test.com',
    }),
    'admin:promote-viewer'
  );
  record('admin', 'เลื่อน viewer -> technician', 'allow', changeBack);
  // คืนค่าเป็น viewer
  await api(tokens.admin, 'PATCH', 'profiles', {
    body: { role: 'viewer' },
    query: 'email=eq.viewer@test.com',
  });
  console.log('');

  // --- 6) เก็บกวาดข้อมูลทดสอบ -----------------------------------------------
  console.log('[7] เก็บกวาดข้อมูลทดสอบ');
  await api(tokens.admin, 'DELETE', 'alarms', { query: `id=eq.${alarmId}` });
  await api(tokens.admin, 'DELETE', 'maintenance_records', { query: `machine_id=eq.${machineId}` });
  await api(tokens.admin, 'DELETE', 'machines', { query: `id=eq.${machineId}` });
  console.log('  ลบข้อมูลทดสอบเรียบร้อย\n');

  // --- 7) สรุปผล -------------------------------------------------------------
  console.log('[8] สรุปผลการทดสอบ');
  const byAccount = { admin: [], tech: [], viewer: [] };
  for (const r of results) byAccount[r.account].push(r);
  for (const [account, rows] of Object.entries(byAccount)) {
    const passCount = rows.filter((r) => r.pass).length;
    console.log(`  ${ACCOUNTS[account].padEnd(16)} ${passCount}/${rows.length} ผ่าน`);
  }
  console.log(`\n  รวม: ${results.length - failures}/${results.length} ผ่าน`);

  if (denials.size) {
    console.log(`\n  รหัส HTTP ที่ใช้ปฏิเสธสิทธิ์: ${[...denials].map((d) => d.split(':')[1]).sort().join(', ')}`);
  }
  console.log('');
  if (failures) {
    console.error(`  ผลการทดสอบ: ไม่ผ่าน ${failures} รายการ\n`);
    process.exitCode = 1;
    return;
  }
  console.log('  ผลการทดสอบ: ผ่านทั้งหมด ✓\n');
}

main().catch((err) => {
  console.error('\nเกิดข้อผิดพลาด:', err.message, '\n');
  process.exitCode = 1;
});
