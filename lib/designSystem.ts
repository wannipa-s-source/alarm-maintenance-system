import type { UserRole } from '@/lib/permissions';

/**
 * Design System ของ "โครงหน้าเว็บ" — Header, Navigation Bar และ Role Notice
 *
 * หลักการ:
 * 1. โทน Navy + Blue + สีประจำ Role ให้เข้ากันทั้งหน้า
 * 2. ทุกพื้นผิวเป็น "สีทึบ" (solid) เต็มพื้นที่ ไม่มีความโปร่งใส ไม่มี gradient
 * 3. เมนู/ปุ่มที่ "กำลังเลือก" ใช้สี brand แบบทึบ ตัวอักษรและไอคอนสีขาว
 *    ส่วนสถานะอื่นใช้ navy เข้มขึ้นเพื่อไม่ให้แย่งความสนใจจากเมนูที่เลือก
 *
 * ค่าสีจริงทั้งหมดประกาศไว้ที่ app/globals.css (บล็อก @theme)
 * ไฟล์นี้เก็บเฉพาะ "ชุดคลาส" ที่ใช้ซ้ำ เพื่อให้แก้ที่เดียวทั้งระบบ
 * (ไฟล์นี้มีแต่คลาส Tailwind เท่านั้น ไม่มี logic / routing / permission)
 */

/** พื้นผิวของแถบด้านบน (Header) และแถบเมนู — Navy แบบทึบ */
export const BAR = {
  /** แถบเต็มความกว้าง พื้นทึบ เต็มพื้นที่ ไม่มี backdrop-blur */
  surface: 'bg-navy',
  /** เส้นคั่นบาง ๆ ระหว่างแถบ เพื่อแยกแถบออกจากกัน */
  line: 'border-b border-navy-raised',
  /** เงาบางมากใต้แถบ ให้เหมือนแถบควบคุมของระบบ Dashboard */
  shadow: 'shadow-[0_1px_2px_rgba(2,6,23,0.6)]',
} as const;

/** เมนูในแถบนำทาง */
export const MENU = {
  /** เมนูที่กำลังเลือก: พื้นน้ำเงินทึบ + ตัวอักษร/ไอคอนสีขาว */
  active: 'bg-brand text-white hover:bg-brand-hover',
  /** เมนูที่ยังไม่ได้เลือก: พื้นกลมกลืนกับแถบ แต่ hover แล้วขึ้นเป็น navy ทึบ */
  inactive: 'text-navy-muted hover:bg-navy-raised hover:text-navy-text',
  /** รูปร่างปุ่มเมนู (ใช้ร่วมกันทั้ง active / inactive) */
  shape: 'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap',
  /** รูปร่างปุ่มเมนูบนมือถือ */
  shapeMobile: 'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
  /** คำอธิบายเมนูบนมือถือ (เมนูที่เลือก) */
  hintActive: 'text-brand-soft',
  /** คำอธิบายเมนูบนมือถือ (เมนูที่ยังไม่เลือก) */
  hintInactive: 'text-navy-muted',
} as const;

/** ปุ่ม/ตัวควบคุมขนาดเล็กที่อยู่บนแถบเข้ม (Header) */
export const CONTROL = {
  /** รูปร่างปุ่ม (คลาสสีมาเติมจาก `default` หรือ `danger` เท่านั้น เพื่อไม่ให้คลาสสีซ้ำซ้อนกัน) */
  shape: 'inline-flex items-center justify-center rounded-xl border transition-all duration-200 active:scale-95',
  /** ปุ่มมาตรฐานบนแถบเข้ม: พื้น navy ทึบ */
  default: 'bg-navy-raised border-navy-outline text-navy-text hover:bg-navy-outline',
  /** ปุ่มที่แยกความหมายออกไป (ออกจากระบบ) */
  danger: 'bg-navy-raised border-rose-500 text-rose-400 hover:bg-navy-outline hover:text-rose-300',
} as const;

/** โลโก้และชื่อระบบในแถบ Header */
export const BRANDMARK = {
  /** กล่องโลโก้: พื้น brand ทึบ ไม่มี gradient */
  box: 'w-8 h-8 rounded-lg bg-brand border border-brand-hover text-white flex items-center justify-center shrink-0',
  /** ชื่อระบบ: สีขาวทึบ ไม่มี gradient */
  title: 'text-sm sm:text-base md:text-lg font-extrabold text-navy-text',
  /** ชื่อระบบย่อย */
  subtitle: 'hidden sm:block text-[10px] md:text-[11px] font-semibold tracking-wide text-navy-muted',
} as const;

/** สีประจำบทบาทที่ใช้กับ Role Notice และป้ายบทบาทใน Header */
export const ROLE_UI: Record<UserRole, { bar: string; chip: string; dot: string }> = {
  admin: { bar: 'bg-role-admin', chip: 'bg-role-admin text-white', dot: 'bg-white' },
  technician: { bar: 'bg-role-technician', chip: 'bg-role-technician text-white', dot: 'bg-white' },
  viewer: { bar: 'bg-role-viewer', chip: 'bg-role-viewer text-white', dot: 'bg-white' },
};
